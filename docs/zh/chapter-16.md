# 第 16 章：语义即时编译（Semantic JIT）—— 运行画像驱动的热点专门化与失效重建

在第 4 章中，我们曾提出一个核心类比：`LLM as Runtime` 的本质不是“在线生成任意代码”，而是**语义即时编译（Semantic JIT）**或**运行画像驱动的专门化（Profile-Guided Specialization）**。本章将深入自适应运行时的引擎盖之下，详细拆解动态查询即时编译与动态约束专门化的工程实现细节，并给出完整的语义形状规范化器、计划注册表（`PlanRegistry`）、影子验证器与精确去优化回退代码。

---

## 16.1 动态查询即时编译与动态约束专门化：用“规范化语义形状”聚合同类请求，而非按原始文本统计

在生产调度与供应链运营现场，业务人员每天都会发起大量的交互式查询与规则设定。例如，早班计划员问：“帮我查一下产线 A 今天处于延误状态的工单及预计缺料情况”；中班计划员问：“看看产线 B 明天有哪些延期工单和对应的物料缺口”；晚班主管又在看板上筛选了产线 C 本周的同类数据。

如果系统直接拿用户输入的**原始自然语言字符串**或**带具体业务参数的文本**作为统计键（Key），那么这三次查询在字面上完全不同，系统永远只会把它们当成三个互不相干的孤立长尾请求，每次都去调用大语言模型重新解析。更糟糕的是，直接以完整自然语言和敏感业务参数作为画像聚合主键，还会带来严重的商业机密泄漏与存储膨胀风险。

因此，动态查询即时编译与动态约束专门化的第一条核心机制，就是**用“规范化语义形状（Normalized Semantic Shape）”聚合同类请求，而绝不用原始自然语言或具体字面量参数作为统计键**：

<div class="dg" role="img" aria-label="五阶段流程：1. 通用路径（通用查询规划/执行、或通用约束注入）→ 2. 运行画像（语义形状哈希+延迟、+扫描行数/计算成本）→ 3. 能力提升（达到晋升阈值后进入、专门化编译候选队列）→ 4. 构建与验证（后台异步生成计划 + 影子验证与等价核验）→ 5. 专用路径（参数化查询计划 / 预编译约束模板执行）。">
<div class="dg-row">
<div class="dg-node"><span class="dg-t">1. 通用路径</span><span class="dg-s">通用查询规划/执行</span><span class="dg-s">或通用约束注入</span></div>
<div class="dg-edge" aria-hidden="true">→</div>
<div class="dg-node"><span class="dg-t">2. 运行画像</span><span class="dg-s">语义形状哈希+延迟</span><span class="dg-s">+扫描行数/计算成本</span></div>
<div class="dg-edge" aria-hidden="true">→</div>
<div class="dg-node"><span class="dg-t">3. 能力提升</span><span class="dg-s">达到晋升阈值后进入</span><span class="dg-s">专门化编译候选队列</span></div>
<div class="dg-edge" aria-hidden="true">→</div>
<div class="dg-node"><span class="dg-t">4. 构建与验证</span><span class="dg-s">后台异步生成计划 +</span><span class="dg-s">影子验证与等价核验</span></div>
<div class="dg-edge" aria-hidden="true">→</div>
<div class="dg-node"><span class="dg-t">5. 专用路径</span><span class="dg-s">参数化查询计划 /</span><span class="dg-s">预编译约束模板执行</span></div>
</div>
</div>

让我们结合上图，看一看“规范化语义形状”是如何把千变万化的现场表达收敛为稳定统计键的：

1. **剥离字面量与敏感值，提取抽象语法骨架**：当大语言模型语义前端将上述三次自然语言查询转换为 `Query IR`（或将多次共享投料口限制转换为 `Constraint IR`）后，规范化器会立即将具体的产线编号（`"lineA"` / `"lineB"`）、具体的时间窗口（`"今天"` / `"明天"`）以及具体的阈值数字（`1000 kg` / `1200 kg`）全部剥离并替换为带类型与 `ospf` 物理量纲签名的参数占位符（如 `$lineId: LineRef`、`$window: TimeRange`、`$limit: Quantity<Mass>`）。
2. **规范化排序与代数等价归一**：对于谓词条件（如 `A AND B` 与 `B AND A`）或线性约束中的加法项（如 `plannedFeeding[A] + plannedFeeding[B]` 与 `plannedFeeding[B] + plannedFeeding[A]`），规范化器对其执行字典序重排与同类项合并，确保在代数与逻辑上等价的表达生成完全一致的树结构。
3. **计算语义形状哈希（Shape Hash）**：对归一化后的无参 `Semantic IR` 结构计算加密哈希（如 `shape_hash = sha256(Canonical_IR)`）。如此一来，无论前端用户用什么措辞提问、传入什么具体参数，只要背后的业务查询结构或约束骨架相同，它们就会精准命中同一个 `shape_hash` 桶，从而让运行时能够准确聚合同类请求的真实发生分布。

---

## 16.2 运行时画像（Profiling）与晋升阈值：综合调用频率、延迟、扫描行数、计算成本与业务收益决定是否专门化

有了按 `shape_hash` 聚合的统计桶之后，接下来的问题是：**是不是只要某个语义形状多出现了几次，就立刻把它编译成专用能力？**

答案是否定的。正如我们在第 4 章和第 15 章所警示的：**“高频”绝不天然等于“值得编译”**；如果不加节制地为低收益需求生成大量专用计划，编译开销、缓存占用与版本维护成本反而会高于专门化带来的收益（即“过度专门化”风险）。

为此，自适应运行时围绕每一个语义形状持续采集多维度的**运行时画像（Runtime Profiling）**，并由**能力提升策略（Promotion Policy）**执行严格的综合收益评估：

| 画像采集维度 | 具体采集的运行事实指标 | 在晋升策略（Promotion Policy）中的评估作用 |
| :--- | :--- | :--- |
| **1. 热度与时间分布**<br>（Frequency & Recency） | 规范化语义形状的累计调用频次、单位时间窗口到达率、跨周期持续活跃天数以及时间衰减加权热度。 | 区分“偶发集中点击的一次性临时需求”与“跨班次、跨排产周期持续复现的稳定高频需求”。 |
| **2. 延迟与资源成本**<br>（Latency & Resource Cost） | 走通用路径时的端到端响应延迟（含 LLM 推理耗时、通用规划耗时）、数据库扫描行数（Scan Rows）、内存峰值与求解器迭代开销。 | 识别真正的性能瓶颈：扫描行数大、通用规划慢或频繁消耗高昂大模型 Token 的模式，专门化收益最高。 |
| **3. 结果质量与稳定性**<br>（Quality & Stability） | 候选方案的校验通过率、仿真可行率、人工审批通过率、计划员采纳率以及执行后无回滚/无异常修正的比例。 | 确保只有语义高度稳定、业务结果被反复证明可靠有效的模式才有资格进入候选，杜绝将频繁修改的半成品固化。 |
| **4. 租户与适用范围分布**<br>（Tenant & Scope Spread） | 该语义模式是仅在单一工位出现、在单一客户租户内多部门复用，还是跨多个客户租户普遍出现。 | 决定专门化产物的隔离级别与后续向软件产品线（SPLE）晋升的目标层级。 |
| **5. 依赖波动率**<br>（Dependency Volatility） | 该模式所引用的底层数据库表结构、领域字段目录、权限策略与业务规则版本的近期变更频率。 | 若某模式依赖的底层元数据每天都在剧烈变动，编译后频繁失效重编的成本将抵消收益，策略应暂缓其专门化。 |

只有当某个语义形状的综合评估得分跨过了能力提升策略设定的**晋升阈值（Promotion Threshold）**，且当前后台构建队列与注册表容量未超上限时，运行时才会将其正式提升为“专门化候选（Specialization Candidate）”，移交后台异步构建任务进行编译与验证。

---

## 16.3 三层专门化阶梯（Tier 0 → Tier 1 → Tier 2）：从通用规划器、参数化计划/预编译约束，到受控虚拟机插件的按需升级

当一个热点语义模式获准进入专门化编译阶段时，编译器应当把它变成什么形态的目标产物？

许多技术人员一听到“即时编译（JIT）”，第一反应就是动态生成 Java 字节码（Bytecode）或机器码。但在企业级软件中，动态生成并加载二进制代码插件属于高风险、高维护成本的重型手段。因此，`LLM as Runtime` 确立了一条极为务实的工程原则：**先“编译计划”，再“编译代码”——优先选择风险最低、可回退性最好且收益已经足够的确定性计划后端；不是所有热点都值得生成字节码**！

系统在运行时构建了清晰的**三层专门化阶梯（Tiered Specialization Ladder）**：

<div class="dg" role="img" aria-label="三层专门化阶梯自上而下：【第 0 层（Tier 0）：通用规划器与解释执行路径】↓ 画像达到第一级热点与稳定性阈值 ↓【第 1 层（Tier 1）：受控确定性计划与参数化模板（主力固化层，覆盖 90%+ 场景）】↓ 唯有性能瓶颈极显著、收益充分且产品边界已高度稳定时 ↓【第 2 层（Tier 2）：受控代码制品与虚拟机插件（极致性能层）】。">
<div class="dg-col">
<div class="dg-node dg-node--layer"><span class="dg-t">【第 0 层（Tier 0）：通用规划器与解释执行路径】</span><span class="dg-s">适用对象：首次出现的未知需求、低频长尾探索、尚未达到晋升阈值的临时交互</span><span class="dg-s">执行方式：LLM 语义前端生成候选 IR → 实时校验 → 通用查询规划器 / 通用约束注入</span></div>
<div class="dg-down">↓<span class="dg-lbl">画像达到第一级热点与稳定性阈值</span></div>
<div class="dg-node dg-node--layer"><span class="dg-t">【第 1 层（Tier 1）：受控确定性计划与参数化模板（主力固化层，覆盖 90%+ 场景）】</span><span class="dg-s">适用对象：高频重复的业务查询、周期性复现的动态排产约束、稳定的客户流程组合</span><span class="dg-s">固化产物：</span><span class="dg-s">高频查询 → 查询中间表示 + 参数化查询计划 / 预编译 SQL 语句（Prepared Plan）</span><span class="dg-s">高频规则 → 参数化 OSPF 动态约束模板（Constraint Template）</span><span class="dg-s">高频表达式 → 冻结符号顺序的高性能编译求值器（Compiled Evaluator）</span><span class="dg-s">稳定流转 → 标准工作流执行计划与工具调用链模板（Flow Plan）</span></div>
<div class="dg-down">↓<span class="dg-lbl">唯有性能瓶颈极显著、收益充分且产品边界已高度稳定时</span></div>
<div class="dg-node dg-node--layer"><span class="dg-t">【第 2 层（Tier 2）：受控代码制品与虚拟机插件（极致性能层）】</span><span class="dg-s">适用对象：超高吞吐要求的核心算子、复杂自定义求值器或高频专用查询接口</span><span class="dg-s">固化产物：受控 JVM 编译查询接口插件 / 字节码制品 / WebAssembly (Wasm) 沙盒模块</span><span class="dg-s">安全铁律：隔离构建进程、数字签名、依赖白名单、CPU/内存限制、独立类加载器/进程</span></div>
</div>
</div>

---

## 16.4 计划注册表与去优化：当数据库结构、字段目录或权限策略变更时，如何精确标记失效并自动回退通用路径？

在现代虚拟机（如 JVM）中，JIT 编译器之所以安全，是因为它有一套完善的**去优化（Deoptimization）**机制：一旦运行时的假设条件（例如某个接口只有一个实现类）因为动态加载新类而被打破，虚拟机能够立即废弃已编译的机器码，平滑退回到解释器执行。

在企业级自适应软件中，运行环境同样在不断演进：DBA 可能会修改数据库表结构（Schema）、领域架构师可能会更新字段目录或单位换算规则、安全管理员可能会收紧某个租户的字段访问权限、算法团队也可能会升级求解器适配器或编译器的版本。当这些底层环境发生变化时，系统如何保证已经固化的专用计划不会产出错误数据或造成权限穿透？

答案在于**计划与能力注册表（Plan & Capability Registry）的显式版本绑定与精确失效重建机制**：

<div class="dg" role="img" aria-label="【计划注册表（Plan Registry）的显式版本绑定结构】：专用计划 ID 与语义形状哈希、专门化层级，绑定【绑定的有效性边界依赖版本指纹（Validity Boundary Dependencies）】；↓ [监听到底层变更事件：如字段目录升级为 v_catalog_4.3 或权限策略变更] ↓ 1. 精确标记失效 → 2. 自动无感回退 → 3. 后台异步重建。">
<div class="dg-col">
<div class="dg-title">【计划注册表（Plan Registry）的显式版本绑定结构】</div>
<div class="dg-node dg-node--layer"><span class="dg-t">专用计划 ID: plan_query_delay_shortage_v3</span><span class="dg-t">状态: ACTIVE</span><span class="dg-s">语义形状哈希 (Shape Hash): sha256:4b9e...</span><span class="dg-s">专门化层级: Tier 1</span></div>
<div class="dg-group"><div class="dg-gt">【绑定的有效性边界依赖版本指纹（Validity Boundary Dependencies）】</div>
<div class="dg-node dg-node--chip">数据库结构版本 (DB Schema Version): v_schema_20260901</div>
<div class="dg-node dg-node--chip">领域字段与元数据目录版本 (Catalog Ver): v_catalog_4.2</div>
<div class="dg-node dg-node--chip">租户权限与安全策略版本 (Auth Policy Ver): v_policy_19</div>
<div class="dg-node dg-node--chip">语义编译器/生成器版本 (Generator Ver): v_compiler_2.1</div>
<div class="dg-node dg-node--chip">执行后端适配器版本 (Adapter Ver): v_adapter_pg_1.4</div>
</div>
<div class="dg-down">↓<span class="dg-lbl">[监听到底层变更事件：如字段目录升级为 v_catalog_4.3 或权限策略变更]</span></div>
<div class="dg-node dg-node--layer"><span class="dg-t">1. 精确标记失效 (Precise Invalidation)：将状态原子切换为 INVALIDATED</span><span class="dg-s">2. 自动无感回退 (Instant Fallback)：当前请求立即走 Tier 0 通用路径执行</span><span class="dg-s">3. 后台异步重建 (Async Re-compilation)：基于新目录重编译并重走影子验证</span></div>
</div>
</div>

这套机制在工程上实现了完整的生命周期闭环：
1. **显式绑定有效边界（Explicit Validity Boundary）**：任何一个专用计划、约束模板或编译求值器在注册表发布时，都强制同时绑定它所依赖的**数据库结构版本、领域字段目录版本、权限策略版本、模型/生成器版本以及后端适配器版本**的完整哈希指纹。
2. **事件驱动的精确失效标记（Precise Invalidation）**：当数据库 Schema 变更事件、领域目录更新事件或权限策略调整事件发生时，注册表根据依赖反向索引，**毫秒级精确锁定受影响的专用计划集合，将其状态原子标记为 `INVALIDATED`（已失效）**。
3. **零中断回退通用路径与异步重编译（Fallback & Re-compilation）**：专用路径永远保留向通用路径降级的安全通道。一旦某个专用计划被标记为失效，后续命中的业务请求会在同一毫秒内**自动回退到第 0 层通用路径执行**，前台业务完全无感、零中断；同时后台异步触发重新编译与影子验证。

### 工程实现：规范化语义形状哈希、运行画像晋升、影子验证与计划注册表去优化完整代码
下面给出直接结合 `ospf-kotlin` 显式结果契约（`Ret<T>` / `Ok` / `Failed`）与第 14 章 `DynamicConstraintCandidateIR` 实现的语义即时编译（Semantic JIT）运行时核心代码：

```kotlin
package org.adaptive.dop.runtime.jit

import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap
import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.error.*
import fuookami.ospf.kotlin.utils.functional.*
import org.adaptive.dop.runtime.compiler.*

// 1. 规范化语义形状提取器 (Normalized Semantic Shape Extractor)
// 铁律：剥离具体业务字面量参数（如具体产线号 "lineA"、具体数值 "1000.0"）与敏感信息，仅对规范化语法结构计算哈希！
object SemanticShapeNormalizer {

    fun computeConstraintShapeHash(candidate: DynamicConstraintCandidateIR): String {
        // 将具体的 bindingKey ("lineA", "lineB") 替换为位置占位符，并按 (fieldName, expectedRoleCode) 字典序重排加法交换项
        val canonicalTermsSignature = candidate.terms
            .map { term -> "${term.fieldName}:${term.expectedRoleCode}:coeffSign=${term.coefficient geq Flt64.zero}" }
            .sorted()
            .joinToString("+")

        // 仅保留右端上限的物理量纲维度 (Dimension)，剥离具体数值字面量 (如 1000.0)
        val canonicalShapeString = buildString {
            append("PLACEMENT=${candidate.placement}|")
            append("TERMS=[$canonicalTermsSignature]|")
            append("REL=${candidate.relation}|")
            append("RHS_DIM=${candidate.rhsLimit.unit.dimension}")
        }

        val digest = MessageDigest.getInstance("SHA-256").digest(canonicalShapeString.toByteArray(Charsets.UTF_8))
        return "shape_sha256:" + digest.joinToString("") { "%02x".format(it) }.take(24)
    }
}

// 2. 运行时画像指标与能力晋升策略 (Runtime Profiling & Promotion Policy)
data class ShapeRuntimeProfile(
    val shapeHash: String,
    var totalInvocations: Long = 0,
    var cumulativeGeneralLatencyMs: Long = 0,
    var cumulativeScanRowsOrVars: Long = 0,
    var validationSuccessCount: Long = 0,
    var distinctTenants: MutableSet<String> = mutableSetOf()
) {
    val averageLatencyMs: Double get() = if (totalInvocations == 0L) 0.0 else cumulativeGeneralLatencyMs.toDouble() / totalInvocations
    val stabilityRate: Double get() = if (totalInvocations == 0L) 0.0 else validationSuccessCount.toDouble() / totalInvocations
}

class PromotionPolicyEvaluator(
    private val minHotspotInvocations: Long = 20,
    private val minAverageLatencyMs: Double = 50.0,
    private val minStabilityRate: Double = 0.98,
    private val maxRegistryCapacity: Int = 1000
) {
    fun shouldPromoteToTier1(profile: ShapeRuntimeProfile, currentRegistrySize: Int): Boolean {
        if (currentRegistrySize >= maxRegistryCapacity) return false // 防止过度专门化撑爆缓存
        return profile.totalInvocations >= minHotspotInvocations &&
               profile.averageLatencyMs >= minAverageLatencyMs &&
               profile.stabilityRate >= minStabilityRate
    }
}

// 3. 计划注册表有效边界依赖指纹 (Validity Boundary Dependency Fingerprint)
data class EnvironmentDependencyFingerprint(
    val dbSchemaVersion: String,
    val fieldCatalogVersion: String,
    val authPolicyVersion: String,
    val compilerVersion: String,
    val adapterVersion: String
)

enum class SpecializedPlanState {
    SHADOW_VERIFYING, // 旁路影子验证中（前台仍走通用路径）
    ACTIVE,           // 已转正接管生产流量
    INVALIDATED       // 因环境变更或影子验证差异已精确失效
}

enum class SpecializationTier { TIER_0_GENERAL, TIER_1_PARAMETERIZED_PLAN, TIER_2_COMPILED_PLUGIN }

data class RegisteredSpecializedPlan<Req, Resp>(
    val planId: String,
    val shapeHash: String,
    val tier: SpecializationTier,
    val boundDependencies: EnvironmentDependencyFingerprint,
    @Volatile var state: SpecializedPlanState,
    @Volatile var consecutiveShadowPasses: Int = 0,
    val digitalSignature: String,
    val specializedExecutor: (Req) -> Ret<Resp>
)

/**
 * 4. 自适应语义运行时引擎 (AdaptiveSemanticRuntime)：
 * 集成画像采集、每次执行强制权限守卫、旁路影子验证 (Shadow Verification)、
 * 原子晋升切换以及环境变更时的毫秒级精确去优化 (Deoptimization) 与无感回退！
 */
class AdaptiveSemanticRuntime<Req, Resp>(
    private val tier0GeneralExecutor: (Req) -> Ret<Resp>,
    private val mandatoryAuthAndBudgetGuard: (Req) -> Ret<Unit>, // 铁律：每次执行专用路径也必须重新校验租户权限与预算！
    private val resultEquivalenceChecker: (Resp, Resp) -> Boolean,
    private val promotionPolicy: PromotionPolicyEvaluator = PromotionPolicyEvaluator(),
    private val requiredZeroDiffShadowRuns: Int = 30
) {
    private val profiles = ConcurrentHashMap<String, ShapeRuntimeProfile>()
    private val planRegistry = ConcurrentHashMap<String, RegisteredSpecializedPlan<Req, Resp>>()

    /** 注册后台异步编译生成的专用候选计划，初始强制进入 SHADOW_VERIFYING 状态 */
    fun registerCandidatePlan(plan: RegisteredSpecializedPlan<Req, Resp>) {
        planRegistry[plan.shapeHash] = plan.copy(
            state = SpecializedPlanState.SHADOW_VERIFYING,
            consecutiveShadowPasses = 0
        )
    }

    /**
     * 监听数据库结构、领域字段目录、权限策略或编译器版本变更事件：
     * 精确将依赖版本不匹配的专用计划标记为 INVALIDATED（去优化），绝不误伤无关计划！
     */
    fun onEnvironmentDependencyChanged(newEnv: EnvironmentDependencyFingerprint): List<String> {
        val invalidatedPlanIds = mutableListOf<String>()
        for (plan in planRegistry.values) {
            if (plan.boundDependencies != newEnv && plan.state != SpecializedPlanState.INVALIDATED) {
                plan.state = SpecializedPlanState.INVALIDATED
                invalidatedPlanIds.add(plan.planId)
            }
        }
        return invalidatedPlanIds
    }

    /**
     * 运行时统一执行入口：
     * 1. 强制执行最终租户、字段权限与预算校验（杜绝专用路径权限穿透）；
     * 2. 根据计划注册表状态在 Tier 0 通用路径、旁路影子验证与 Tier 1/2 专用路径间安全切换。
     */
    fun execute(
        shapeHash: String,
        tenantId: String,
        request: Req,
        currentEnv: EnvironmentDependencyFingerprint
    ): Ret<Resp> {
        // 防线 1：每次执行必须通过权限与预算校验，专用路径绝不享有绕过安全语义的特权！
        when (val authRes = mandatoryAuthAndBudgetGuard(request)) {
            is Ok -> {}
            is Failed -> return Failed(authRes.error)
        }

        val plan = planRegistry[shapeHash]

        // 情况 A：存在处于 ACTIVE 状态且依赖版本完全匹配的专用计划 -> 直接走专用快路径！
        if (plan != null && plan.state == SpecializedPlanState.ACTIVE && plan.boundDependencies == currentEnv) {
            return when (val specRes = plan.specializedExecutor(request)) {
                is Ok -> specRes
                is Failed -> {
                    // 专用路径若发生运行期异常，立即自动熔断降级回 Tier 0 通用路径兜底！
                    plan.state = SpecializedPlanState.INVALIDATED
                    tier0GeneralExecutor(request)
                }
            }
        }

        // 情况 B：存在处于 SHADOW_VERIFYING 状态的候选专用计划 -> 走通用路径返回结果，并旁路比对影子结果
        if (plan != null && plan.state == SpecializedPlanState.SHADOW_VERIFYING && plan.boundDependencies == currentEnv) {
            val startMs = System.currentTimeMillis()
            val generalResult = tier0GeneralExecutor(request)
            val elapsedMs = System.currentTimeMillis() - startMs
            recordProfile(shapeHash, tenantId, elapsedMs, generalResult is Ok)

            if (generalResult is Ok) {
                val shadowResult = runCatching { plan.specializedExecutor(request) }.getOrNull()
                if (shadowResult is Ok && resultEquivalenceChecker(generalResult.value, shadowResult.value)) {
                    plan.consecutiveShadowPasses += 1
                    if (plan.consecutiveShadowPasses >= requiredZeroDiffShadowRuns) {
                        // 连续 N 次真实流量影子验证 100% 零差异，原子切换晋升为 ACTIVE 正式专用能力！
                        plan.state = SpecializedPlanState.ACTIVE
                    }
                } else {
                    // 发现哪怕一次结果不等价，立即废弃该候选计划，严防大模型或编译器错误固化！
                    plan.state = SpecializedPlanState.INVALIDATED
                }
            }
            return generalResult
        }

        // 情况 C：无专用计划或专用计划已 INVALIDATED -> 走 Tier 0 通用路径并采集运行画像
        if (plan != null && plan.boundDependencies != currentEnv) {
            plan.state = SpecializedPlanState.INVALIDATED
        }
        val startMs = System.currentTimeMillis()
        val generalResult = tier0GeneralExecutor(request)
        val elapsedMs = System.currentTimeMillis() - startMs
        recordProfile(shapeHash, tenantId, elapsedMs, generalResult is Ok)

        return generalResult
    }

    private fun recordProfile(shapeHash: String, tenantId: String, latencyMs: Long, isSuccess: Boolean) {
        val profile = profiles.computeIfAbsent(shapeHash) { ShapeRuntimeProfile(it) }
        synchronized(profile) {
            profile.totalInvocations += 1
            profile.cumulativeGeneralLatencyMs += latencyMs
            if (isSuccess) profile.validationSuccessCount += 1
            profile.distinctTenants.add(tenantId)
        }
    }
}
```
