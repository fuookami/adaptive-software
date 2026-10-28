# 第 14 章：智能体原生与业务语义前端 —— 从模糊自然语言到语义中间表示（Semantic IR）

在第 13 章打通了运筹优化（OR）与机器学习（ML）的双向闭环后，接下来我们要迎接“三原生”中的第三极——**智能体原生（Agent-Native）**，并拆解大语言模型是如何作为 `LLM as Runtime` 的**业务语义前端（Semantic Frontend）**，将人类模糊的自然语言意图精准转化为机器可验证的结构化语义中间表示（Semantic IR），并最终编译注入 `ospf` `LinearMetaModel` 的。

---

## 14.1 给智能体装上“业务词典与语法”：暴露结构化领域元数据、可引用变量、中间值、约束模板与流程契约

为什么许多企业在接入大语言模型后，发现智能体除了能写几句车轱辘话的建议外，根本无法帮计划员生成哪怕一条真正能跑通的排产规则或流程配置？

因为开发者犯了一个根本性的架构错误：**让大语言模型去直接阅读散乱的业务源代码，或者对着贫血 CRUD 接口里含义不明的数据库字段名（如 `col_val_01`、`ext_attr_b`）去盲目猜测业务语义**！

在“智能体原生”架构下，“原生”二字的真正含义是：**形式化领域模型本身就是一份可被智能体直接读取、理解、组合与引用的结构化语义契约**。系统不再把业务知识藏在过程式代码里，而是通过应用层向智能体显式暴露一套机器可读的**结构化领域元数据目录（Structured Domain Metadata Catalog）**——这就好比给智能体装上了一本权威的“企业业务词典与组合语法书”：

```text
                      【面向智能体暴露的结构化领域元数据目录】
                                         │
     ┌───────────────────┬───────────────┼───────────────┬───────────────────┐
     ▼                   ▼               ▼               ▼                   ▼
1. 可引用概念与变量   2. 具名业务中间值 3. 结构化约束模板 4. 可组合流程节点契约 5. 适用边界与错误码
(Variables & Symbols) (Intermediates) (Constraint Tpls) (Flow Node Contracts) (Scopes & Error Codes)
```

具体而言，这份领域元数据目录至少向智能体清晰声明了以下五类核心要素：

1. **领域概念与可引用变量（Referencable Variables）**：明确列出系统中哪些业务对象（产线、设备、物料、订单、工单、库位、运输车次）以及哪些符号变量是允许被引用的（例如 `plannedFeeding[line]`、`plannedFeedingRemaining[line]`、`capacityUsage[resource]`），并严格标注每个变量的 `ospf` 物理量纲（如 `Kilogram`、`Hour`）、索引维度（按产线、按物料、按时间桶）、以及它的状态角色（是计划决策变量，还是只读的已发生事实 `actualFeedingInWindow`）。
2. **具名业务中间值（Named Intermediate Values）**：公开诸如换产时间 `changeoverTime[task]`、生产时长 `productionDuration[task]`、预计投料量 `estimatedFeeding[line]`、估算生产率 `estimatedProductivity[line]` 等中间值的业务含义、计算依赖关系与单位，让智能体在进行原因归因或构造复杂规则时可以直接按名引用。
3. **可用约束模板（Constraint Templates）**：提供经过形式化定义的标准约束骨架，例如线性容量上限约束、资源共享约束、交期时间窗约束、工序前后置关系约束、物料齐套可用性约束以及允许挂载注入的模型位置（Placement / Hook Locations）。
4. **可组合流程节点契约（Flow Node Contracts）**：将原本写死在定制接口里的算法与业务动作，拆解为输入输出契约（I/O Contracts）、前置条件与副作用边界完全透明的标准流程节点——如 `产能估算`、`预测审批`、`数字孪生预计时间推演`、`排产求解`、`替代料分配`、`重算物料消耗预计`、`MRP 缺口计算`、`方案仿真对比` 与 `计划正式下发`。这使得智能体能够针对不同客户的流程差异，像拼装乐高积木一样生成合法的流程编排建议（例如为客户甲编排 `排产 → 替代料分配 → 重算物料消耗 → MRP`，为客户乙编排 `需求预测 → BOM 拆解 → 原料缺口分析 → MRP`）。
5. **适用边界、可选参数与结构化错误码（Boundaries & Error Codes）**：明确声明每项元数据适用的业务组织/租户范围、时间范围粒度、权限要求、生效规则版本以及违反契约时的标准结构化错误码。

---

## 14.2 结构化推理上下文裁剪：结合当前数字孪生状态、历史快照与异常事件进行影响范围推理

正如我们在第 11 章的依赖推演中所揭示的（第 15 点是第 14 点的前置条件）：**智能体要生成可靠的动态适配方案，必须“先做业务推理，再出适配配置”**。

当计划员向系统提出问题时，智能体不能只对着用户那一句话做字面文本扩写，而必须结合当前正在运行的业务世界进行严密的因果与影响范围推理。为此，应用层会将当前相关的运行态信息经过**上下文裁剪（Context Pruning）与租户/字段权限过滤（Permission Filtering）**后，组装成一份边界清晰的**结构化推理上下文（Structured Reasoning Context）**注入给智能体：

| 推理上下文维度 | 注入的结构化内容明细（以贯穿用例为例） | 在智能体业务推理中的关键作用 |
| :--- | :--- | :--- |
| **1. 当前计划与数字孪生状态** | 产线 A/B 当前生效的基准计划版本；`T1` 实际完工时间（`10:00`，延误 30 分钟）；数字孪生刚重算出的 `T2` 预计开始时间（`10:30`）与 `T3` 计划/预计时间（`11:00`）。 | 让智能体看清“哪些任务已经实际偏离计划”、“偏差沿前后置关系传播到了哪里”以及“后序预计时间是否仍在交付窗口内”。 |
| **2. 已发生的执行事实快照** | 当日时间窗口内已执行任务（如 `T1`）已经实际消耗的投料事实 `actualFeedingInWindow`，以及 WMS 当前可用主料/替代料库存快照。 | 锚定不可篡改的物理事实起点，确保后续生成的约束不会漏算今日已发生的实际投料消耗。 |
| **3. 预测快照与血缘不确定性** | 当前已审批激活的产线有效产能覆盖层（`CapacityEffectiveOverlay`）、底层 `estimatedProductivity[A/B]` 的模型版本、质量评分与置信区间。 | 让智能体在分析排产裕度时，能够引用产能估算的来源与不确定性风险，而不把预测值当成绝对常数。 |
| **4. 生效规则与约束集合** | 当前生效的 BOM 版本、换产时间矩阵、日历规则快照、已激活的硬约束与软约束列表，以及近期发生的设备/物料异常事件。 | 帮助智能体判断 `T2` 顺延后，在资源占用、投料量或换产时间上是否与 `T3` 产生了新的跨线冲突。 |
| **5. 可用操作与工具目录** | 当前用户权限下允许调用的分析工具、仿真沙盒入口、约束模板与流程编排节点契约。 | 严格限制智能体的行动空间，确保其只能推荐系统支持且当前用户有权发起的受控动作。 |

基于这份结构化推理上下文，智能体不再输出模棱两可的散文，而是必须按照契约输出**结构化的推理结果包**：
* **候选原因分析（Candidate Causes）**：指出 `T2` 预计延误 30 分钟是由前序 `T1` 实际完工延误叠加 30 分钟固定换产耗时共同导致；
* **受影响对象集合（Affected Objects）**：精准定位受波及的业务对象集合为 `{任务 T2, 任务 T3, 产线 A, 产线 B, 共享投料口}`；
* **候选动态约束（Candidate Constraints）**：针对用户提出的共享投料口限制，生成绑定了当日时间窗的结构化约束候选；
* **候选应对方案与仿真建议（Candidate Plans & Simulation Proposals）**：提出 `{方案一：仅执行局部推演顺延, 方案二：注入共享投料口约束并触发滚动排产}` 两个对比方案，明确标注各自的风险点与待校验动作，交由应用层发起数字孪生仿真比选。

在整个推理过程中，有一条不可动摇的红线：**智能体推理过程本身绝对不直接修改任何业务状态！它输出的永远是带置信度、可解释、可校验、可审计的“候选判断与待校验动作”，最终采纳哪一个方案，100% 由应用层的确定性校验策略与业务审批决定**。

---

## 14.3 语义中间表示（Semantic IR）：查询中间表示、约束中间表示与流程中间表示的设计规范

当智能体完成了上下文推理，准备将用户的意图转化为系统可执行的能力（如一次复杂的数据查询、一条动态排产约束、或一段自定义流程组合）时，它输出的结构化候选究竟长什么样？

这就是 `LLM as Runtime` 架构中最核心的平台资产之一——**语义中间表示（Semantic Intermediate Representation, Semantic IR）**。

为什么我们不在智能体和底层执行引擎（数据库、求解器、工作流引擎）之间直接传递 SQL 语句、求解器代码或 JSON 配置文件，而一定要在中间设计一层专门的 `Semantic IR`？
1. **隔离自然语言的模糊性与底层执行引擎的异构性**：自然语言千变万化，而底层可能是关系型数据库、分析型列存、不同厂家的 MILP 求解器或不同的工作流引擎。`Semantic IR` 向上承接大模型抽取出的纯净业务语义，向下通过确定性编译器降阶映射（Lowering）到任意执行后端，实现前后端彻底解耦。
2. **支持规范化（Canonicalization）、内容哈希与热点聚合**：两句表述方式不同、具体参数值不同的自然语言请求（例如“查一下 A 线今天的计划投料”与“看看 B 线明天的计划投料”），在去除具体字面量参数并转换为规范化的 `Semantic IR` 后，具有完全相同的**语义形状（Semantic Shape）**。系统只有基于规范化的 `Semantic IR` 计算形状哈希（Shape Hash），才能准确统计哪些语义模式在运行时被高频重复使用，从而支撑第 16 章的运行时画像与即时编译（JIT）。
3. **提供统一的类型、量纲、权限与版本校验载体**：所有的安全守卫、物理单位检查、租户边界校验与历史版本回放，都统一作用在结构化的 `Semantic IR` 树上，确保没有任何未受检的字符串能够溜进生产环境。

在数字化运营平台（DOP / APS）中，语义中间表示主要包含以下四大标准家族：

| 语义中间表示家族 | 核心结构化要素定义 | 编译降阶目标（Lowering Targets） |
| :--- | :--- | :--- |
| **1. 查询中间表示**<br>（Query IR） | 访问的目标领域实体/视图、投影字段列表、关联关系路径、规范化谓词过滤结构（已剥离具体字面量参数）、分组与聚合算子、排序规则、参数类型签名以及扫描行数/耗时预算（Budget）。 | 参数化 SQL 语句、预编译查询计划（Prepared Plan）、领域视图求值器或受控查询接口插件。 |
| **2. 约束中间表示**<br>（Constraint IR） | 绑定的领域变量与中间值符号、代数与逻辑表达式树（对接 `ospf` `LinearPolynomial`）、比较关系、物理量纲与单位、生效时间窗口、绑定的业务对象集合、软硬优先级以及模型挂载位置（Placement）。 | `ospf` 已编译线性约束（`LinearInequality`），进而注入 `LinearMetaModel` 映射至 MILP、CP 或列生成主/子问题。 |
| **3. 流程中间表示**<br>（Flow IR） | 编排的标准领域流程节点序列、节点间输入输出数据契约映射、前置依赖与分支跳转条件、异常补偿策略、仿真沙盒开关以及必经的人工审批边界。 | 应用层工作流执行计划、滚动排产编排管线或跨系统（ERP/APS/MES/WMS/TMS）协同调度任务。 |
| **4. 策略与参数候选表示**<br>（Policy / Param IR） | 目标函数权重候选、软约束罚系数候选、启发式搜索策略参数、合法取值区间、适用业务场景、支撑样本证据引用与离线评估指标。 | 冻结的运筹优化参数配置版本、局部/全局重排触发阈值策略或预测覆盖层激活快照。 |

---

## 14.4 动态约束转化实战：从“今天 A、B 线共用投料口，总投料不超 1000 公斤”到可哈希、可编译的结构化线性约束候选

为了让你直观感受到“智能体语义前端 + 语义中间表示 + 动态约束编译器”的威力，让我们完整走一遍贯穿全书的标杆场景：**如何将现场人员的一句临时规则，安全编译为 `ospf` 运筹优化引擎中的数学约束**。

```text
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────────┐    ┌────────────────────┐    ┌────────────────────────┐
│   1. 用户业务规则  │    │ 2. LLM 语义前端    │    │    3. 约束中间表示     │    │ 4. 动态约束编译器  │    │   5. 算法执行后端      │
│ “今天A和B线共用投 │───>│ 结合元数据与上下文 │───>│     (Constraint IR)    │───>│ 字段能力与权限校验 │───>│ OSPF LinearInequality  │
│ 料口，不超1000公斤”│    │ 生成结构化候选方案 │    │ 约束定义+表达式+符号引 │    │ + 符号注册表解析   │    │ 注入 LinearMetaModel   │
└────────────────────┘    └────────────────────┘    └────────────────────────┘    └────────────────────┘    └────────────────────────┘
```

### 第一步：用户用自然语言表达现场规则
周二上午 `10:00`，车间人员输入自然语言：“今天 A 线和 B 线共用一个投料口，总投料不要超过 1000 公斤。”

### 第二步：大语言模型作为语义前端生成结构化候选
大语言模型读取第 14.1 节暴露的领域元数据目录与第 14.2 节的当前数字孪生上下文，识别出：
* 涉及的业务对象是 `{产线 A (lineA), 产线 B (lineB)}` 及共享资源 `投料口`；
* 时间窗口为 `当日（Day_Current）`，且当前时刻为 `10:00`，窗口内已存在已完工任务的实际投料事实 `actualFeedingInWindow`；
* 限制上限为数值 `1000`、物理单位为质量单位 `千克 (kg)`；
* 对应的约束模板是“时间窗内多产线累计投料容量上限约束”，挂载位置（Placement）为 `排产主模型资源约束区 (MasterResourceConstraints)`。

于是，大模型输出一份标准的**动态约束候选（`Constraint IR`）**。请注意：在这个领域对象与 IR 中，**只描述业务字段语义、物理单位与抽象算法符号，完全不依赖任何具体求解器（如 Gurobi 或 Cplex）的内部实现**：

```json
{
  "irType": "DynamicLinearConstraintCandidate",
  "schemaVersion": "1.0",
  "placement": "MasterResourceConstraints",
  "scope": {
    "tenantId": "factory_01",
    "businessObjects": ["lineA", "lineB"],
    "timeWindow": "2026-09-15T00:00:00Z/2026-09-15T24:00:00Z"
  },
  "lhsExpression": {
    "op": "ADD",
    "terms": [
      { "symbolRef": "actualFeedingInWindow", "bindings": { "lines": ["lineA", "lineB"] }, "role": "ACTUAL_FACT" },
      { "symbolRef": "plannedFeedingRemaining", "bindings": { "line": "lineA" }, "role": "PLANNED" },
      { "symbolRef": "plannedFeedingRemaining", "bindings": { "line": "lineB" }, "role": "PLANNED" }
    ]
  },
  "relation": "LEQ",
  "rhsLimit": { "value": 1000.0, "unit": "kg" },
  "priority": "HARD"
}
```

### 第三步：严格的边界拦截与动态约束编译
拿到这份结构化候选后，系统**绝不允许未经校验和审批直接编译进生产**。动态约束编译器（Dynamic Constraint Compiler）立即启动多层确定性核验：
1. **负面边界强制拦截**：如果大模型因幻觉引用了领域目录里根本不存在的**未知字段（Unknown Field）**、当前用户无权操作的**未授权字段（Unauthorized Field）**、非法的**未知挂载位置（Unknown Placement）**，或者构造了当前求解器不支持的**非法非线性能力（Unsupported Capability）**，编译器会当场拦截并直接返回结构化错误码，绝不带病执行！
2. **字段能力与物理量纲校验**：编译器核验 `actualFeedingInWindow` 与 `plannedFeedingRemaining` 的物理量纲均为质量（可由 `ospf` 原生 `Quantity` 统一换算为 `Kilogram`），与右端上限 `1000.0 kg` 量纲完全兼容，且状态角色组合合法。
3. **算法符号注册表（Algorithmic Symbol Registry）解析**：在单次排产求解构建期，动态约束编译器向算法层的符号注册表查询并解析 `plannedFeedingRemaining[lineA]` 与 `plannedFeedingRemaining[lineB]`，将它们绑定到当前求解会话中对应的 `ospf` `LinearIntermediateSymbol` 与决策变量上，同时将 `actualFeedingInWindow` 绑定为已冻结的常数项，最终生成不可变的 `ospf` **已编译线性约束（`LinearInequality`）**。

### 第四步：映射至底层算法执行后端
最后，算法层将这条已编译的 `LinearInequality` 注册进 `LinearMetaModel`，无缝映射至混合整数线性规划（MILP）模型或列生成受限主问题（RMP）中执行求解。

### 工程实现：基于 OSPF `LinearPolynomial`、`LinearInequality` 与 `LinearMetaModel` 的动态约束编译器完整代码

```kotlin
package org.adaptive.dop.runtime.compiler

import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.physics.unit.*
import fuookami.ospf.kotlin.utils.physics.quantity.*
import fuookami.ospf.kotlin.utils.error.*
import fuookami.ospf.kotlin.utils.functional.*
import fuookami.ospf.kotlin.core.frontend.expression.monomial.*
import fuookami.ospf.kotlin.core.frontend.expression.polynomial.*
import fuookami.ospf.kotlin.core.frontend.expression.symbol.*
import fuookami.ospf.kotlin.core.frontend.inequality.*
import fuookami.ospf.kotlin.core.frontend.model.mechanism.*
import org.adaptive.dop.domain.role.StateRole
import org.adaptive.dop.infrastructure.ospf.OspfBoundaryAdapter

// 1. 领域元数据目录项 (Field Catalog Entry)：定义智能体允许引用的字段、OSPF 原生单位、状态角色与挂载边界
data class DomainFieldCatalogEntry(
    val fieldName: String,               // 如 "actualFeedingInWindow" 或 "plannedFeedingRemaining"
    val unit: PhysicalUnit,              // 直接使用 OSPF 原生 PhysicalUnit (如 Kilogram, Ton, Hour)
    val role: StateRole,                 // 状态角色 (ActualFactRole / PlannedRole)
    val allowedPlacements: Set<String>,  // 允许注入的模型位置，如 {"MasterResourceConstraints"}
    val authorizedRoles: Set<String>,    // 允许操作该字段的业务角色，如 {"PLANNER", "WORKSHOP_DIRECTOR"}
    val maxSupportedDegree: Int = 1      // 最高支持代数阶数：1 表示仅限线性
)

// 2. 语义中间表示：动态线性约束候选 (Constraint IR)
enum class IrRelationOp { LEQ, EQ, GEQ }

data class ConstraintTermIR(
    val fieldName: String,
    val bindingKey: String,          // 业务对象绑定键，如 "lineA" 或 "lineA_lineB_day1"
    val expectedRoleCode: String,    // "ACTUAL_FACT" 或 "PLANNED"
    val coefficient: Flt64 = Flt64.one
)

data class DynamicConstraintCandidateIR(
    val candidateId: String,
    val tenantId: String,
    val placement: String,
    val timeWindow: String,
    val terms: List<ConstraintTermIR>,
    val relation: IrRelationOp,
    val rhsLimit: Quantity<Flt64>,   // 直接使用 OSPF 原生 Quantity<Flt64> (如 Quantity(Flt64(1000.0), Kilogram))
    val approvedBy: String?          // 生产准入铁律：未经审批不可编译！
)

// 3. 算法符号注册表契约 (Algorithmic Symbol Registry)：
// 将领域字段与对象键解析为单次求解中的冻结常数事实 Quantity<Flt64> 或 OSPF 具名中间符号 Quantity<LinearIntermediateSymbol>
sealed interface ResolvedAlgorithmicSymbol {
    data class FrozenFactConstant(val quantity: Quantity<Flt64>) : ResolvedAlgorithmicSymbol
    data class DecisionIntermediateSymbol(val symbolQty: Quantity<LinearIntermediateSymbol>) : ResolvedAlgorithmicSymbol
}

interface OspfAlgorithmicSymbolRegistry {
    fun resolve(fieldName: String, bindingKey: String): ResolvedAlgorithmicSymbol?
}

// 4. 编译产出的不可变 OSPF 线性约束制品
data class CompiledOspfLinearConstraint(
    val elementId: String,
    val displayName: String,
    val placement: String,
    val ospfInequality: LinearInequality, // 直接产出 OSPF 原生 LinearInequality
    val unit: PhysicalUnit,
    val contentHash: String
)

/**
 * 动态约束编译器 (OspfDynamicConstraintCompiler)：
 * 把守从 LLM 候选语义到 OSPF LinearMetaModel 的确定性生产边界；
 * 对未知字段、未授权字段、未知挂载位置、物理量纲不兼容或未经审批的候选，100% 返回显式 Failed(Err)！
 */
class OspfDynamicConstraintCompiler(
    private val catalog: Map<String, DomainFieldCatalogEntry>,
    private val validPlacements: Set<String>
) {
    fun compileToOspfConstraint(
        candidate: DynamicConstraintCandidateIR,
        callerRoles: Set<String>,
        symbolRegistry: OspfAlgorithmicSymbolRegistry
    ): Ret<CompiledOspfLinearConstraint> {
        // 守卫 1：未经审批的智能体候选严禁编译进入生产
        if (candidate.approvedBy.isNullOrBlank()) {
            return Failed(Err(ErrorCode.ApplicationError, "编译拒绝 [ERR_UNAPPROVED]: 动态约束候选 [${candidate.candidateId}] 未经人工或策略审批"))
        }

        // 守卫 2：拦截未知挂载位置 (Unknown Placement)
        if (candidate.placement !in validPlacements) {
            return Failed(Err(ErrorCode.IllegalArgument, "编译拒绝 [ERR_UNKNOWN_PLACEMENT]: 未知模型挂载位置 [${candidate.placement}]"))
        }

        if (candidate.terms.isEmpty()) {
            return Failed(Err(ErrorCode.IllegalArgument, "编译拒绝 [ERR_EMPTY_TERMS]: 约束左端表达式项不能为空"))
        }

        val targetUnit: PhysicalUnit = candidate.rhsLimit.unit
        val lhsMutablePoly = MutableLinearPolynomial()

        for (term in candidate.terms) {
            // 守卫 3：拦截大模型幻觉捏造的未知字段 (Unknown Field)
            val entry = catalog[term.fieldName]
                ?: return Failed(Err(ErrorCode.SymbolNotFound, "编译拒绝 [ERR_UNKNOWN_FIELD]: 领域目录中不存在字段 [${term.fieldName}]"))

            // 守卫 4：拦截未授权访问字段 (Unauthorized Field) 与挂载位置越权
            if (callerRoles.intersect(entry.authorizedRoles).isEmpty()) {
                return Failed(Err(ErrorCode.ApplicationError, "编译拒绝 [ERR_UNAUTHORIZED_FIELD]: 当前角色无权引用字段 [${term.fieldName}]"))
            }
            if (candidate.placement !in entry.allowedPlacements) {
                return Failed(
                    Err(ErrorCode.IllegalArgument, "编译拒绝 [ERR_INVALID_FIELD_PLACEMENT]: 字段 [${term.fieldName}] 不允许挂载至 [${candidate.placement}]")
                )
            }

            // 守卫 5：校验状态角色代码是否与目录声明一致（防止混淆计划变量与实际事实）
            if (entry.role.roleCode != term.expectedRoleCode) {
                return Failed(
                    Err(ErrorCode.IllegalArgument, "编译拒绝 [ERR_ROLE_MISMATCH]: 字段 [${term.fieldName}] 角色为 ${entry.role.roleCode}，与候选声明 ${term.expectedRoleCode} 不符")
                )
            }

            // 守卫 6：校验物理量纲与右端上限是否兼容（例如左侧各项必须均为质量量纲，可转换为 targetUnit 如 Kilogram）
            if (entry.unit.dimension != targetUnit.dimension) {
                return Failed(
                    Err(ErrorCode.DimensionMismatch, "编译拒绝 [ERR_UNIT_INCOMPATIBLE]: 字段 [${term.fieldName}] 单位 (${entry.unit}) 与右端上限单位 ($targetUnit) 量纲不兼容")
                )
            }

            // 守卫 7：从算法符号注册表解析 OSPF 符号或冻结常数，并执行 OSPF 原生单位换算对齐
            val resolved = symbolRegistry.resolve(term.fieldName, term.bindingKey)
                ?: return Failed(Err(ErrorCode.SymbolNotFound, "符号解析失败: 注册表中未找到 ${term.fieldName}[${term.bindingKey}]"))

            when (resolved) {
                is ResolvedAlgorithmicSymbol.FrozenFactConstant -> {
                    val alignedFact = when (val r = OspfBoundaryAdapter.convertQuantitySafely(resolved.quantity, targetUnit)) {
                        is Ok -> r.value.value
                        is Failed -> return r
                    }
                    lhsMutablePoly += (term.coefficient * alignedFact)
                }
                is ResolvedAlgorithmicSymbol.DecisionIntermediateSymbol -> {
                    val symQty = resolved.symbolQty
                    val oneUnitScale = when (
                        val r = OspfBoundaryAdapter.convertQuantitySafely(Quantity(Flt64.one, symQty.unit), targetUnit)
                    ) {
                        is Ok -> r.value.value
                        is Failed -> return r
                    }
                    // 将 OSPF LinearIntermediateSymbol 按换算系数加入左端多项式
                    lhsMutablePoly += (term.coefficient * oneUnitScale) * symQty.value
                }
            }
        }

        val lhsPoly = LinearPolynomial(lhsMutablePoly)
        val rhsVal = candidate.rhsLimit.value

        // 构造 OSPF 原生 LinearInequality
        val inequality: LinearInequality = when (candidate.relation) {
            IrRelationOp.LEQ -> lhsPoly leq rhsVal
            IrRelationOp.EQ -> lhsPoly eq rhsVal
            IrRelationOp.GEQ -> lhsPoly geq rhsVal
        }

        val elementId = "dyn_c_${candidate.candidateId}"
        val displayName = "动态约束[${candidate.candidateId}]_${candidate.placement}(${targetUnit.symbol})"
        val hash = "sha256:${candidate.tenantId}_${candidate.placement}_${candidate.terms.hashCode()}_${candidate.relation}_${rhsVal}_${targetUnit.symbol}"

        return Ok(
            CompiledOspfLinearConstraint(
                elementId = elementId,
                displayName = displayName,
                placement = candidate.placement,
                ospfInequality = inequality,
                unit = targetUnit,
                contentHash = hash
            )
        )
    }

    /** 将已编译的动态约束直接注入 OSPF LinearMetaModel */
    fun injectIntoMetaModel(metaModel: LinearMetaModel, compiled: CompiledOspfLinearConstraint): Ret<Unit> {
        return when (
            val res = metaModel.addConstraint(
                constraint = compiled.ospfInequality,
                name = compiled.elementId,
                displayName = compiled.displayName
            )
        ) {
            is Ok -> Ok(Unit)
            is Failed -> Failed(res.error)
        }
    }
}
```
