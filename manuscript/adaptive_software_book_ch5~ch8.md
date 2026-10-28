# 第二卷：语义底座篇 —— 形式化领域模型与 OSPF 运筹建模框架

在第一卷中，我们确立了自适应软件的顶层哲学：**大语言模型即运行时（LLM as Runtime）**，即将大语言模型定位为运行时的业务语义前端，把用户的开放意图转化为结构化候选，再交由确定性的编译器、验证器与执行后端落地，并通过运行时画像与软件产品线工程沉淀为长期产品资产。

然而，要让这座宏伟的运行时大厦真正运转起来，有一个不可或缺的先决条件：**系统的底层必须拥有一套机器可读、算法可解、模型可学、智能体可引用的共同业务语言**。如果底层依然是散落在各处的贫血数据库表、裸浮点数计算和私藏在算法黑盒里的数学脚本，那么无论上层的语义编译器设计得多么精妙，大模型生成的结构化意图依然无处着陆。

本卷将深入自适应软件的“语义与数学底座”，系统阐述为什么**“三原生统一于形式化领域模型”**是整套架构的根基，并直接基于开源运筹与形式化建模框架 **`ospf`（`ospf-kotlin`）** 的原生基础设施，拆解如何用代数化数值、物理量纲安全、统一表达式中间表示（Expression IR）、高阶函数符号与求解器解耦编译架构，彻底终结企业软件中业务系统与算法模型长期“两张皮”的顽疾。

---

## 第 5 章：三原生统一于形式化领域模型 —— 终结业务语义分裂

在引入运筹优化（OR）、机器学习（ML）与大语言模型智能体（Agent）的企业级软件（如数字化运营平台 DOP 与高级计划排程系统 APS）中，最危险的长期架构隐患并不是多种技术栈并存带来的运维负担，而是**业务语义的彻底分裂**。本章将从架构依赖的底层逻辑出发，阐明如何通过形式化领域模型将“运筹原生、机器学习原生、智能体原生”与确定性业务系统统一在同一份语义契约之下，并基于 `ospf-kotlin` 原生组件给出状态角色隔离与领域契约的工程实现。

---

### 5.1 为什么说“各运行侧共享同一形式化领域模型”是整座架构大厦的根基？

在第 1 章剖析传统架构痛点时，我们曾提到企业软件向智能化演进需要具备 15 项核心架构能力（包括业务逻辑内聚、算法可被应用层编排、算法与系统口径一致、动态约束注入、中间值透明、可测试性、可仿真性、版本快照、数字孪生推演、滚动排产与流程编排、智能体动态适配与业务推理等）。

当我们对这 15 项能力进行严格的拓扑依赖推演时，会得出一个极其关键的发现：**“各运行侧共享同一形式化领域模型”（第 8 点）是支撑所有高阶能力的总根基**。

```text
                         【架构总根基：形式化领域模型】
               （系统、运筹优化、机器学习、智能体共享同一领域定义）
                                       │
     ┌────────────────┬────────────────┼────────────────┬────────────────┐
     ▼                ▼                ▼                ▼                ▼
算法与系统口径一致  动态约束安全注入   业务中间值透明可查  数字孪生动态推演   智能体推理与适配
```

为什么一旦失去“共享形式化领域模型”这块基石，上面所有的智能化能力都会沦为空中楼阁？我们可以顺着依赖链逐一验证：

1. **没有共享形式化领域模型，就不可能有“算法与系统业务口径一致”**。如果业务系统和运筹算法各自定义一遍“投料量”“生产时长”“换产时间”“产能占用”和“物料消耗”，系统就会同时存在两套代码、两套单位转换、两套边界条件和两套异常处理逻辑。在这种架构下，业务规则更新后的口径不一致根本不是偶发的编码失误，而是架构分裂的必然结果。
2. **没有共享形式化领域模型，就不可能实现安全的“动态约束注入”**。动态约束要求排产变量与业务中间值是运行时可精确引用的“一等公民”。如果“投料量”的物理单位、状态角色（计划值还是实际值）与时间聚合口径没有被形式化建模，系统与智能体就无法在运行时安全引用它来构造数学不等式。
3. **没有共享形式化领域模型，“中间值透明”就无从谈起**。中间值透明并不是靠在接口里多塞几个返回字段凑出来的，而是形式化领域模型的自然副产品。如果投料量、产能占用或换产耗时只是算法服务内部的临时数学表达式，求解结束后系统拿到的就只是一堆没有业务身份的原始数字，根本无法知道“这个值代表什么业务含义、从哪个规则来、由哪些变量计算得到”。
4. **没有共享形式化领域模型，“数字孪生动态推演”与“滚动排产流程编排”就会断裂**。数字孪生要求当前序任务报工延误后，系统能独立根据换产时间、生产时长与日历可用性重算后序任务的预计时间；流程编排则要求“排产 → 替代料分配 → 重算物料消耗 → MRP → 下发”各节点使用统一的数据结构与业务口径传递状态。若这些模型仍被锁在单一算法内部或各节点各执一词，推演与编排便寸步难行。
5. **没有共享形式化领域模型，“智能体业务推理与动态适配”只能停留在文字游戏**。智能体不是靠阅读散乱的业务代码去猜语义的；它必须依赖系统暴露的结构化领域元数据（可引用变量、中间值、约束模板、流程节点契约与适用边界），才能把车间现场的自然语言描述转化为可校验、可审计、可回滚的执行方案。

正因如此，平台架构升级的核心方向，是从过去“业务系统调用求解器黑盒 + 调用预测服务黑盒 + 调用大语言模型黑盒”的外挂拼凑模式，转向**业务系统、运筹优化、机器学习与智能体四种运行侧共享同一形式化领域模型的“三原生（运筹原生、机器学习原生、智能体原生）”架构**。

---

### 5.2 同一业务概念的四种正交解释：系统侧数值解释、运筹侧符号解释、机器学习侧统计解释与智能体侧语义解释

在 Software 1.0、2.0 与 3.0 并存的企业软件中，同一个业务概念（如“产能”“投料量”或“时间窗口”）会同时出现在系统代码字段、机器学习特征矩阵、运筹求解器变量以及大语言模型的提示词上下文中。

| 同一业务概念 | 确定性业务系统（数值计算） | 统计 / 机器学习（概率计算） | 运筹优化（符号与数学规划） | 大语言模型 / 智能体（语义推理） |
| :--- | :--- | :--- | :--- | :--- |
| **产能（Capacity）** | 数值计算 / 主数据配置字段 | 历史生产特征 / 训练标签 / 估算生产率分布 | 资源容量约束上限 / 模型参数 | 可理解、可引用的业务概念与来源说明 |
| **投料量（Feeding）** | 按 BOM 与损耗计算的确定性数值 / 状态 | 预测模型输入特征或监督信号 | 计划决策变量 / 线性或非线性约束表达式 | 临时规则推理与异常影响分析的引用对象 |
| **时间（Time）** | 计划 / 预计 / 实际三层状态时间戳 | 事件发生时间 / 历史观察窗口 / 标签截止时点 | 交期时间窗 / 工序前后序与换产时间约束 | 推理偏差传播与设定规则生效范围的语义上下文 |

所谓“三原生统一于形式化领域模型”，绝不是把系统、运筹优化、机器学习和智能体做成四套彼此独立的业务语言，而是让它们**共享同一份权威领域定义，并根据各自的运行载体对同一概念执行四种正交的运行解释**：

#### 1. 系统侧：确定性数值解释（Numerical Interpretation）
业务系统（涵盖应用层、领域计算模型与持久化状态管理）面向的是已经明确的输入数据。它对领域模型执行确定性的纯函数数值计算与状态流转治理。例如，在给定订单数量、BOM 展开关系、替代料配比与损耗系数后，系统侧直接计算出产线 A 的需求投料量 `requiredFeeding[A] = 120 kg`，或者根据前序任务的实际结束时间直接算出后序任务的预计开始时间。

#### 2. 运筹原生（OR-Native）：符号与优化解释（Symbolic Interpretation）
运筹原生的本质，是让领域知识能够由算法层稳定、无歧义地映射为优化引擎可消费的符号模型。在运筹优化侧，产线 A 的计划投料量 `plannedFeeding[A]` 不再是一个已知的静态数字，而是被解释为一个待求解的**计划决策变量（Decision Variable）**或由决策变量构成的代数表达式（如 `ospf` 中的 `LinearExpressionSymbol`），受制于共享投料口容量上限（`feedingLimit`）与有效产能约束。更换底层求解器时，领域语义保持不变，仅由算法适配层重新编译符号约束。

#### 3. 机器学习原生（ML-Native）：统计与概率解释（Statistical / Probabilistic Interpretation）
机器学习原生的本质，是让领域知识能够被训练与推理过程稳定地“统计化、概率化消费”。在机器学习侧，历史生产执行事实被严格按领域规则归一化为具名的特征（合格产量、实际耗时、工作单元、观察窗口）与预测目标，模型推理输出的是带有模型版本号、评估质量指标、置信区间（不确定性）与适用范围的估算生产率 `estimatedProductivity[A]`，而绝不是一个来历不明的黑盒裸数值。

#### 4. 智能体原生（Agent-Native）：语义与编排解释（Semantic Interpretation）
智能体原生的本质，是让领域模型本身成为可被大语言模型直接读取、推理和组合的结构化语义契约。在智能体侧，模型无需猜测底层代码实现，而是直接通过结构化领域元数据识别出“投料口”“计划投料量”“实际投料事实”“产能估算快照”及其单位与边界，结合当前数字孪生上下文输出受影响对象集合、结构化候选约束与仿真比选方案。

```text
                      【形式化领域模型（唯一权威业务语义与类型契约）】
                                             │
       ┌──────────────────────┬──────────────┴──────────────┬──────────────────────┐
       ▼                      ▼                             ▼                      ▼
  [系统侧运行解释]       [运筹原生运行解释]           [机器学习原生解释]     [智能体原生运行解释]
  确定性数值纯计算       决策变量与符号约束           特征/分布与不确定性     开放意图理解与候选生成
requiredFeeding = 120   plannedFeeding <= Limit      estimatedProductivity   结构化约束与仿真方案候选
```

通过这四种正交解释，形式化领域模型同时扮演了双重关键角色：在横向协同上，它是系统、运筹优化、机器学习与智能体的**共同语义契约**；在纵向演进上，它又是面向 `LLM as Runtime` 的**领域语言规范、类型系统与编译契约**。

---

### 5.3 状态角色隔离：为什么统一“投料量”定义，绝不等于把需求量、计划量、预测量、预计量和实际量混为一个字段？

在推进“统一领域模型”的过程中，工程团队最容易踩入的一个致命误区是：**误以为“统一业务概念定义”就是把所有的“投料量”或“产能”合并成数据库里的同一个字段**。

我们必须以最严厉的架构准则明确指出：**统一的是业务概念的语义、物理量纲、计算关系与时间聚合口径，而绝不是把需求量、计划量、预测量、预计量和实际执行事实混用为同一个字段！**

在真实的生产与供应链闭环（ERP / APS / MES / WMS / TMS）中，同一业务概念在不同生命周期阶段承担着截然不同的**状态角色（State Roles）**，它们的产生入口、可变性与治理规则有着严格的不可逾越边界：

| 状态角色 | 以“投料量 / 产能”为例的具名表达 | 产生机制与权威来源 | 核心治理铁律 |
| :--- | :--- | :--- | :--- |
| **1. 需求角色（Required）** | 需求投料量 `requiredFeeding` | 由系统侧根据订单需求、BOM 展开、替代料规则与工艺损耗执行确定性数值计算得出。 | 反映理论需求基准，随订单或 BOM 版本变更而重算。 |
| **2. 预测角色（Predicted / Estimated Rate）** | 估算生产率 `estimatedProductivity` | 由机器学习或统计估算器基于冻结的历史观察窗口推理得出，携带质量指标、不确定性与模型血缘。 | **预测绝不能直接冒充人工配置或实际事实**；必须生成不可变快照，经校验、审批与激活后，才能作为有效产能覆盖层（`CapacityEffectiveOverlay`）冻结进入排产输入。 |
| **3. 计划角色（Planned）** | 计划投料量 `plannedFeeding` | 在运筹优化求解中作为决策变量（或中间表达式），在求解完成后经结构化解解析并由应用层确认为正式计划方案版本。 | **优化求解结果只是建议或基准计划，绝不等于现场已经发生的物理事实**。 |
| **4. 预计角色（Estimated / Projected）** | 预计投料量 `estimatedFeeding`<br>预计开始/结束时间 | 在数字孪生推演中，结合已发生的最新实际进度与领域计算模型动态重算出的未来状态预测。 | 用于实时反映偏差向后传播的影响，不可直接覆盖下发基准计划或伪造实际报工。 |
| **5. 实际角色（Actual Fact）** | 实际投料事实 `actualFeeding`<br>实际生产耗时 | 由 MES、WMS、TMS 等外部现场执行系统同步并经由事实入口记录的**不可变执行事实**。 | **至高无上的物理事实边界**：只能由执行事实入口追加记录，任何算法求解器、预测模型或大模型智能体均无权生成或篡改实际事实！ |

让我们回到第 1 章和第 4 章反复提及的“产线 A、B 当天共用一个投料口，总投料量不超过上限 `feedingLimit`”这一贯穿案例，看看状态角色隔离在运行时是如何发挥关键作用的：

假设在周二上午 10:00 触发滚动重排时，产线 A 的前序任务 `T1` 已经执行完毕，并在当天时间窗口内产生了真实的投料消耗。此时，如果把投料上限 `feedingLimit` 解释为当日累计容量限制，那么智能体与编译器生成的结构化动态约束**绝不能**笼统地写成 `plannedFeeding[A] + plannedFeeding[B] <= feedingLimit`，而必须精准地区分“已发生的实际事实”与“待决策的剩余计划变量”：

```text
actualFeedingInWindow + plannedFeedingRemaining[A] + plannedFeedingRemaining[B] <= feedingLimit
```

在这个表达式中：
* `actualFeedingInWindow` 是从 MES/WMS 事实入口读取并冻结的当日已执行任务实际投料总量（不可变常数事实）；
* `plannedFeedingRemaining[A]` 与 `plannedFeedingRemaining[B]` 则是产线 A、B 上待执行任务（如 `T2`、`T3`）在当日窗口内的计划投料决策变量；
* 倘若现场限制不是当日累计量，而是瞬时流量上限，则系统会根据领域目录定义，将其切换为按时间桶（Time Bucket）聚合的约束模板。

此外，在跨系统（MES、WMS、TMS 与 APS）协同中，统一领域语义与状态角色隔离还带来了一项重要的工程韧性：**解耦外部系统的单据到达时序与本地计算一致性**。在真实工厂里，MES 的报工单、WMS 的领料单与 TMS 的运单不可能总是毫秒不差地同时到达或完整配对，某些外部对象或可选追溯信息（如生产批次号）在特定时刻可能暂时缺失。依托清晰的状态角色边界，只要同步过来的执行事实满足当前领域计算必需的数据条件，可选追溯信息的缺失就绝不应阻断 APS 的业务计算；同时，计划值、预计值和预测值仍严格按各自口径产生和流转，永远不会因为外部单据延迟而去冒充实际执行结果。

#### 工程实现：基于 OSPF 原生 `Quantity`、`PhysicalUnit` 与 `Ret` 的状态角色强类型隔离代码
在代码实现中，我们**直接使用 `ospf-kotlin-utils` 原生提供的 `Quantity<T>`、`PhysicalUnit`（如 `Kilogram`、`Ton`、`Hour`、`Kilogram / Hour`）、`RealNumber<T>` 与 `Ret<T>`（`Ok` / `Failed`）**，通过泛型状态角色标记（`StateRole`）从编译期锁死五类角色的边界，并实现预测准入激活机与容忍可选追溯信息缺失的外部事实接收守卫：

```kotlin
package org.adaptive.dop.domain.role

import java.time.Instant
import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.physics.unit.*
import fuookami.ospf.kotlin.utils.physics.quantity.*
import fuookami.ospf.kotlin.utils.error.*
import fuookami.ospf.kotlin.utils.functional.*

// 1. 定义五类严格隔离的领域状态角色标记接口 (State Role Markers)
sealed interface StateRole {
    val roleCode: String
}

/** 需求角色：系统侧按 BOM、计划产出量和损耗计算的理论需求量 (如 requiredFeeding) */
data object RequiredRole : StateRole { override val roleCode = "REQUIRED" }

/** 预测角色：机器学习或统计估算器输出的预测值 (如 estimatedProductivity)，未审批激活前严禁直接作为计划输入 */
data object PredictedRole : StateRole { override val roleCode = "PREDICTED" }

/** 计划角色：运筹优化求解产出的建议计划值 (如 plannedFeeding)，绝不等于现场已发生的实际事实 */
data object PlannedRole : StateRole { override val roleCode = "PLANNED" }

/** 预计角色：数字孪生结合最新实际进度推算出的预计值 (如 estimatedFeeding / 预计开始结束时间) */
data object EstimatedRole : StateRole { override val roleCode = "ESTIMATED" }

/** 实际角色：MES/WMS/TMS 现场执行事实入口记录的不可变事实 (如 actualFeeding) */
data object ActualFactRole : StateRole { override val roleCode = "ACTUAL_FACT" }

// 2. 直接基于 OSPF 原生 Quantity<T> 构建带状态角色与版本血缘的领域量 (RoleScopedQuantity)
// 泛型 R 约束为状态角色 StateRole，泛型 T 约束为 OSPF 的 RealNumber<T>
data class RoleScopedQuantity<R : RealNumber<T StateRole, T>>(
    val conceptName: String,       // 统一领域概念名，如 "feeding_amount"
    val role: R,                   // 强类型状态角色标记
    val quantity: Quantity<T>,     // 直接复用 OSPF 原生的 Quantity<T> (内含数值与 PhysicalUnit)
    val businessObjectId: String,  // 绑定的业务对象标识，如 "lineA"
    val timeWindowId: String,      // 绑定的时间窗口标识
    val snapshotVersion: String,   // 来源快照版本或事件 ID
    val recordedAt: Instant
)

// 3. 机器学习产能估算快照与有效产能覆盖层 (CapacityEffectiveOverlay) 审批激活状态机
data class ProductivityPredictionSnapshot<T : RealNumber<T>>(
    val snapshotId: String,
    val workUnitId: String,
    val featureSchemaVersion: String,
    val modelArtifactVersion: String,
    val inputContentHash: String,
    val estimatedProductivity: RoleScopedQuantity<PredictedRole, T>,
    val confidenceInterval: Pair<Quantity<T>, Quantity<T>>,
    val qualityScore: Flt64
)

/**
 * 有效产能覆盖层 (CapacityEffectiveOverlay)：
 * 只有通过质量阈值、OSPF 物理单位校验并获得业务审批后，预测快照才能转化为此类型冻结进入 MPS/排产输入！
 */
class CapacityEffectiveOverlay<T : RealNumber<T>> private constructor(
    val overlayId: String,
    val sourceSnapshotId: String,
    val workUnitId: String,
    val effectiveProductivity: Quantity<T>,
    val approvedBy: String,
    val activatedAt: Instant
) {
    companion object {
        fun <T : RealNumber<T>> approveAndActivate(
            snapshot: ProductivityPredictionSnapshot<T>,
            minQualityThreshold: Flt64,
            expectedRateUnit: PhysicalUnit = Kilogram / Hour, // 直接使用 OSPF 原生单位除法组合复合单位 kg/h
            approver: String,
            now: Instant
        ): Ret<CapacityEffectiveOverlay<T>> {
            // 1) 使用 OSPF 容差比较算子 ls (<) 校验预测质量阈值
            if (snapshot.qualityScore ls minQualityThreshold) {
                return Failed(
                    Err(ErrorCode.ApplicationError, "预测质量得分 (${snapshot.qualityScore}) 低于准入阈值 ($minQualityThreshold)，拒绝激活！")
                )
            }
            // 2) 直接使用 OSPF Quantity.to(expectedRateUnit) 校验并对齐单位量纲
            val alignedQty = snapshot.estimatedProductivity.quantity.to(expectedRateUnit)
                ?: return Failed(
                    Err(
                        ErrorCode.DimensionMismatch,
                        "产能估算单位 [${snapshot.estimatedProductivity.quantity.unit}] 与目标有效产能单位 [$expectedRateUnit] 量纲不兼容"
                    )
                )

            return Ok(
                CapacityEffectiveOverlay(
                    overlayId = "ovl_${snapshot.snapshotId}",
                    sourceSnapshotId = snapshot.snapshotId,
                    workUnitId = snapshot.workUnitId,
                    effectiveProductivity = alignedQty,
                    approvedBy = approver,
                    activatedAt = now
                )
            )
        }
    }
}

// 4. 跨系统（MES / WMS / TMS）异步执行事实容错接收守卫
data class MesFeedingFactDto(
    val eventId: String,
    val lineId: String?,
    val taskId: String?,
    val rawFeedingValue: Double?,
    val unit: PhysicalUnit?, // 直接使用 OSPF 原生 PhysicalUnit（如 Kilogram、Ton、Gram）
    val eventTime: Instant?,
    // 可选追溯单据字段：当外部单据未同时到达或缺失批次号时，绝不阻断 APS 核心投料与进度计算
    val productionBatchNo: String? = null,
    val wmsPickOrderNo: String? = null
)

object MesFactIngestionGuard {
    fun ingestActualFeeding(
        dto: MesFeedingFactDto,
        targetMassUnit: PhysicalUnit = Kilogram, // 直接使用 OSPF 原生 Kilogram 单位
        timeWindowId: String
    ): Ret<RoleScopedQuantity<ActualFactRole, Flt64>> {
        val line = dto.lineId?.takeIf { it.isNotBlank() }
            ?: return Failed(Err(ErrorCode.IllegalArgument, "缺失核心计算必需字段: lineId"))
        val rawVal = dto.rawFeedingValue?.takeIf { it.isFinite() && it >= 0.0 }
            ?: return Failed(Err(ErrorCode.IllegalArgument, "缺失或非法的实际投料数值: rawFeedingValue"))
        val evtTime = dto.eventTime
            ?: return Failed(Err(ErrorCode.IllegalArgument, "缺失核心事件时间戳: eventTime"))
        val sourceUnit = dto.unit
            ?: return Failed(Err(ErrorCode.IllegalArgument, "缺失物理单位: unit"))

        // 使用 OSPF 原生 Flt64 与 Quantity(value, unit) 构造数量，并调用 .to(targetMassUnit) 完成同量纲换算
        val rawQuantity = Quantity(Flt64(rawVal), sourceUnit)
        val alignedQuantity = rawQuantity.to(targetMassUnit)
            ?: return Failed(Err(ErrorCode.DimensionMismatch, "上报投料单位 [$sourceUnit] 与目标质量单位 [$targetMassUnit] 量纲不兼容"))

        return Ok(
            RoleScopedQuantity(
                conceptName = "feeding_amount",
                role = ActualFactRole,
                quantity = alignedQuantity,
                businessObjectId = line,
                timeWindowId = timeWindowId,
                snapshotVersion = "evt_${dto.eventId}",
                recordedAt = evtTime
            )
        )
    }
}
```

---

### 5.4 形式化领域模型的八大最低构成要素与运行时实例边界

本文所称“形式化领域模型”，不是数据库实体集合、某个求解器的数学模型或某个机器学习模型的特征表，而是由稳定业务概念、纯计算关系、变量与中间值语义、特征/标签/预测语义、结构化约束元数据、决策反馈与可校准参数语义、模型制品治理、版本快照和结果契约共同组成的**可计算语义体系**。

在大语言模型即运行时（`LLM as Runtime`）的长期架构下，它还承担 **领域语言规范 / 类型系统 / 编译契约** 的职责：约束大语言模型与智能体“什么可以表达、如何组合、单位/状态/范围是什么、哪些能力可执行、哪些必须拒绝”，并为语义中间表示（Semantic IR）、编译器和运行时专门化提供稳定的语义与版本边界。它至少应包含以下八大构成要素：

| 构成要素 | 最低形式化定义要求 | 架构分层与运行边界 |
| :--- | :--- | :--- |
| **1. 领域概念与计算模型** | 稳定名称、数据类型、物理单位、维度、业务对象绑定、状态角色、时间范围、边界条件与显式错误语义 | **由领域层权威定义**；业务系统侧以无副作用的纯函数数值方式直接执行计算。 |
| **2. 变量与中间值语义** | 稳定标识符、索引维度、来源表达式或计算关系、依赖项、物理单位、适用业务场景与生命周期 | **领域层定义业务语义**；运筹算法层据此创建单次求解所需的运行时决策变量与中间符号。 |
| **3. 特征、标签与预测语义** | 对应领域概念、事件发生时间、历史观察窗口、标签成熟截止时点、单位、维度、业务对象绑定、适用范围与防数据泄漏（Data Leakage）约束 | **领域层定义稳定语义**；机器学习侧据此构造运行时特征张量、训练样本与预测输出。 |
| **4. 约束与目标元数据** | 约束/目标名称、代数表达式、比较关系、软硬优先级、物理单位、对象绑定、时间范围、启停条件、版本号与冲突诊断信息 | **领域层提供约束语义或模板**；算法层将其编译为可组合、可独立测试的约束与目标管线（Pipeline）。 |
| **5. 决策反馈与可校准参数语义** | 运筹原始输入/参数/原始方案、人工计划调整差异、结构化原因码、审批链与实际执行结果；可校准参数的名称、类型、合法范围、适用场景及“是否允许学习”标记 | **应用层记录并分类反馈**；机器学习侧仅训练被显式允许学习的参数候选；运筹侧使用经审批并冻结的参数版本重新求解。 |
| **6. 模型制品与质量治理** | 模型唯一标识、不可变版本号、内容哈希（Content Hash）、训练数据集引用、特征模式定义（Schema）、运行时版本、离线评估指标、审批状态与适用范围 | **算法或受控机器学习运行时产生制品**；应用层编排制品验收、启停与回滚；基础设施层负责持久化存取。 |
| **7. 快照与适用版本** | 输入数据快照、业务规则快照、字段目录版本、算法能力版本、特征/数据集/模型版本、适用组织与生效时间区间 | **应用层选择并冻结本轮计算所用版本**；运筹优化、机器学习与智能体严禁隐式读取当前最新数据库值去替代历史快照输入。 |
| **8. 结果契约（Result Contract）** | 结果具名标识、业务含义、物理单位、来源变量/中间值/模型、质量指标、不确定性区间、适用范围、风险提示与结构化失败原因 | **运筹/机器学习侧将内部输出解析为结构化结果**；应用层完成校验后，再将其转换为领域方案、计算结果、预测快照或风险指标。 |

在工程实现上，架构师必须死守一条核心边界：**严格区分“稳定领域语义定义”与“单次运行时实现实例”**。
* **稳定领域语义定义**：诸如 `plannedFeeding`（计划投料量）、产能特征、预测目标的名称、物理单位、状态角色、业务对象绑定与时间口径，属于跨运行侧共享的领域语义，驻留在领域层；
* **单次运行时实现实例**：诸如底层求解器中的具体二元变量（`BinVar` / `BinVariable1`）、运行时中间符号、具体求解器约束句柄、机器学习的特征张量（Tensor）、模型权重矩阵以及单次求解/推理会话（Session），全部属于**单次建模或单次推理的瞬态运行实现**——它们**绝不能侵入领域聚合根（Domain Aggregate），也绝不能作为业务事实直接持久化到核心业务表中**！

同时，具名的业务中间值与预测结果充当了**跨能力组合的稳定语义接口**。例如，一个模块对外公开“预计投料量”“资源占用量”“预计换产时间”或“估算生产率”等具名结果时，下游消费方（无论是数字孪生看板、后续排产节点还是智能体）只需依赖其业务含义、物理单位、适用范围与血缘追踪信息（Provenance），而完全无需关心它内部究竟是用算术表达式、逻辑分段函数、运筹决策变量还是机器学习模型算出来的。不同的底层实现可以支撑同一个结果语义，但每一种实现都必须显式声明其业务模式、算法/模型能力、规则或模型版本、质量指标与适用条件，严禁在运行时静默切换计算口径。

当这套形式化领域模型进入运行态后，四大运行侧便形成了一条高度内聚、可追溯的标准协作链路：

```text
                【形式化领域定义 · 结构化元数据 · 冻结版本快照】
                                       │
       ┌───────────────────────────────┼───────────────────────────────┐
       ├──> 1. 系统侧数值解释 ─────────┼──> 纯函数领域计算结果 ────────┤
       │                               │                               │
       ├──> 2. 机器学习侧统计/概率解释 ┼──> 特征与标签映射             │
       │                               │    -> 模型训练 / 在线推理     │
       │                               │    -> 预测结果与血缘追踪信息 ─┤
       │                               │                               │
       ├──> 3. 智能体侧语义解释 ───────┼──> 候选原因、动态约束与方案 ──┤
       │                               │                               │
       └──> 4. 运筹优化侧符号映射 ─────┴──> 决策变量与中间符号注册     │
                                            -> 约束与目标函数管线组合  │
                                            -> 优化求解与结构化解解析 ─┘
                                                                       │
                                                                       ▼
                                            【应用层确定性校验、状态转换与流程编排】
                                                                       │
                                                                       ▼
                                        展示看板 · 人工审批 · 生产下发 · 智能体引用 · 仿真与复盘
```

---

## 第 6 章：初识 OSPF —— 面向软件工程师的代数化数值与量纲安全底座

在第 5 章中，我们明确了“形式化领域模型”必须同时支撑系统侧的数值计算与运筹优化侧的符号求解。然而，在真实的软件工程实践中，如果仅仅在架构文档里规定“大家要共享同一套领域概念”，而在写代码时依然让业务系统直接操作裸 `Double` 浮点数、让各个算法模块各自临时拼凑一套数学运算类型，那么所谓的“形式化领域模型”很快就会退化为纸面上的同名口号。

为了把形式化领域模型真正落到实处，项目需要一层**纯计算、可组合、求解器无关的基础数学与建模框架**，把“数值是什么、物理单位是否兼容、代数表达式如何组合、符号如何代入求值、结构化约束如何生成、求解失败如何正交解释”等底层共性能力彻底统一起来。开源运筹与形式化建模框架 **`ospf`**（`ospf-kotlin`）正是为此而生的核心技术底座。

本章将带你深入 `ospf` 底座的第一层基石：**代数化数值类型层次（`RealNumber`）**与**原生物理量纲单位安全系统（`Quantity` / `PhysicalUnit`）**，并展示如何在领域与算法边界构建显式错误契约适配器。

---

### 6.1 为什么在工业软件里直接用裸 `Double` 浮点数写公式是一颗定时炸弹？

翻开大多数传统 ERP、APS 或 MES 系统的源代码，你会看到成千上万行直接用编程语言原生浮点数（如 `Double`、`Float`）或无量纲约束的 `BigDecimal` 编写的业务公式：

```kotlin
// 传统贫血代码中的典型裸数值写法（隐患重重）
val requiredFeeding: Double = orderQty * bomRatio * (1.0 + scrapRate)
val productionHours: Double = orderQty / machineCapacity + changeoverMinutes
```

这段看似再普通不过的代码，在严肃的工业计算与运筹优化场景下，实则埋藏着三颗随时可能引爆的定时炸弹：

#### 1. 精度、容差与舍入策略隐式散落，悄悄篡改业务规则
IEEE 754 双精度浮点数（`Double`）在表示十进制小数（如 `0.1 + 0.2`）时存在天然的二进制精度误差。在排产与物料核算中，判断“库存是否齐套（`available >= required`）”、“约束是否紧绑定（`lhs == rhs`）”或“物料配比采用向上取整还是四舍五入”，对数值精度、比较容差（Tolerance / Epsilon）和舍入策略（Rounding Mode）极其敏感。当开发者直接在各处代码里裸写 `Double` 运算或随手硬编码 `1e-6` 时，不同的服务模块与求解器脚本就会采用各自隐式的精度与舍入逻辑，导致**原本属于底层技术的精度与舍入处理，在不知不觉中演变成了不一致的隐式业务规则**。

#### 2. 整数、有理数、浮点数与任意精度数无法泛型复用同一套业务公式
在不同的计算场景下，同一个业务公式往往需要运行在不同的数值域上：
* 在常规快速推演中，为了追求吞吐性能，系统可能使用 64 位浮点数（如 `ospf` 的 `Flt64`）；
* 在涉及财务成本核算、严格的配比守恒或病态数值矩阵校验时，系统又需要切换为精确的有理数（如 `ospf` 的 `Rtn64` / `RtnX`）或任意精度十进制数（如 `ospf` 的 `FltX`），以彻底消除浮点截断误差；
* 而在整箱包装或人员排班计算中，则要求严格的整数（如 `Int64` / `IntX`）代数运算。
如果业务公式被硬编码死在裸 `Double` 类型上，一旦需要切换数值精度能力，研发团队就不得不把整套领域计算公式复制重写一遍。

#### 3. 物理量纲完全隐形，“千克加小时”也能顺利通过编译
仔细看上面那行传统代码：`val productionHours: Double = orderQty / machineCapacity + changeoverMinutes`。其中，`orderQty / machineCapacity` 算出来的是“小时（`Hour`）”，而后面的 `changeoverMinutes` 却是“分钟（`Minute`）”！因为两者在代码里都是裸 `Double` 类型，编译器认为“浮点数加浮点数”完全合法，连一个警告都不会报。这种因为单位量纲缺失导致的错配，在跨系统（如 ERP 按“吨”下发订单、WMS 按“千克”管理库存、MES 按“克/秒”上报流量）集成时比比皆是，全靠程序员肉眼排查。

---

### 6.2 代数化数值类型层次（`RealNumber`）：整数、有理数、浮点数与任意精度数的泛型抽象及精度容差治理

为了拔除裸 `Double` 的第一和第二颗炸弹，基础框架首先必须将“数值运算能力”从具体的底层存储类型中抽象出来，建立一套严谨的**代数化数值类型层次**。

在 `ospf-kotlin` 的 `fuookami.ospf.kotlin.utils.math` 包中，已经原生提供了一套按加法结构、环、域、标量与有序实数（`RealNumber`）组织的泛型数值层次：

```text
               【OSPF (fuookami.ospf.kotlin.utils.math) 代数化数值类型层次】
                                             │
                  ┌──────────────────────────┼──────────────────────────┐
                  ▼                          ▼                          ▼
        [整数系 IntegerNumber]     [有理数系 RationalNumber]   [实数/浮点系 RealNumber / FloatingNumber]
        • Int32 / Int64 / Int8     • Rtn64 (64位精确有理数)    • Flt32 / Flt64 (带精度容差 ep 的浮点数)
        • UInt32 / UInt64          • RtnX (任意精度有理数)     • FltX (基于 BigDecimal 的任意精度实数)
        • IntX (任意精度大整数)
```

这套代数化数值底座在工程设计上遵循三大核心准则：

1. **业务公式依赖“所需代数能力”，而非裸 `Double`**：在编写领域计算模型（如 BOM 消耗累乘、线性产能折算）时，函数签名依赖的是 `ospf` 的 `RealNumber<T>` 等代数能力接口，而不是死绑裸 `Double`。这样一来，同一套经过验证的领域公式，既可以在高频在线仿真时注入 `Flt64` 获得极致性能，也可以在严谨审计或等价性验证时注入 `Rtn64`（有理数）或 `FltX`（任意精度数），实现零代码改动的无缝切换。
2. **显式提供常量、边界、精度、容差、舍入与类型转换策略**：每一种 `ospf` 数值类型都通过伴生常量（`RealNumberConstants<T>`）显式提供零元（`zero`）、单位元（`one`）、上下界（`min` / `max`）、机器精度（`ep` / `decimalPrecision`）以及受控容差比较算子（`eq`、`neq`、`ls`、`leq`、`gr`、`geq`）。判断两个实数是否相等或某个约束松弛量是否为零，统一通过 `eq` 容差算子执行，绝不在业务代码里直接写裸 `==`。
3. **在领域/算法边界将 `null`、`require` 或异常适配为统一显式错误契约 `Ret<T>`**：架构规范明确指出，对于 `ospf` 内部部分使用 `null`、`require` 或异常表达失败的底层接口，应在领域/算法边界适配为项目统一的显式错误契约（`Ret<T>` / `Ok` / `Failed`）。

下面给出直接基于 `ospf-kotlin` 的泛型代数公式编写方式与**边界显式错误适配器（`OspfBoundaryAdapter`）**的完整实现代码：

```kotlin
package org.adaptive.dop.infrastructure.ospf

import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.physics.unit.*
import fuookami.ospf.kotlin.utils.physics.quantity.*
import fuookami.ospf.kotlin.utils.error.*
import fuookami.ospf.kotlin.utils.functional.*

/**
 * 1. 基于 OSPF RealNumber<T> 的泛型代数运算：
 * 业务公式只依赖 RealNumber<T> 代数能力，可无缝传入 Flt64、FltX 或 Rtn64。
 */
object OspfGenericMathOperations {

    @Suppress("UNCHECKED_CAST")
    fun <T : RealNumber<T>> computeEffectiveMultiplier(
        bomRatio: T,
        scrapRate: T,
        constants: RealNumberConstants<T>
    ): Ret<T> {
        // 使用 OSPF RealNumber 内置的容差比较算子 (ls: <, geq: >=) 校验损耗率范围 [0, 1)
        if ((scrapRate ls constants.zero) || (scrapRate geq constants.one)) {
            return Failed(
                Err(ErrorCode.IllegalArgument, "损耗率 scrapRate ($scrapRate) 必须位于 [0, 1) 半开区间内")
            )
        }
        val denominator = (constants.one - scrapRate) as T
        // 使用 OSPF 内置容差相等算子 eq 判断分母是否在容差范围内为零
        if (denominator eq constants.zero) {
            return Failed(Err(ErrorCode.DivideByZero, "有效产出率分母 (1 - scrapRate) 在容差范围内为零"))
        }
        return Ok((bomRatio / denominator) as T)
    }
}

/**
 * 2. OSPF 领域/算法边界显式错误契约适配器 (OspfBoundaryAdapter)：
 * 将 OSPF 内部可能返回 null、触发 require(IllegalArgumentException) 或算术异常的接口，
 * 100% 适配为不可变的 Ret<T> (Ok / Failed)，防止异常泄漏或空指针渗透至领域层。
 */
object OspfBoundaryAdapter {

    inline fun <T> safeCall(
        errorCodeOnNullOrException: ErrorCode = ErrorCode.ApplicationError,
        nullMessage: String = "OSPF 底层运算返回空值 (null)，请检查物理量纲兼容性或符号绑定",
        crossinline block: () -> T?
    ): Ret<T> {
        return try {
            val result = block()
            if (result != null) {
                Ok(result)
            } else {
                Failed(Err(errorCodeOnNullOrException, nullMessage))
            }
        } catch (e: IllegalArgumentException) {
            Failed(Err(ErrorCode.IllegalArgument, "OSPF 前置条件断言失败 (require): ${e.message}"))
        } catch (e: ArithmeticException) {
            Failed(Err(ErrorCode.DivideByZero, "OSPF 数值算术异常: ${e.message}"))
        } catch (e: Exception) {
            Failed(Err(errorCodeOnNullOrException, "OSPF 边界调用异常: ${e.message}"))
        }
    }

    /** 显式错误版本的单位安全转换：包装 OSPF 原生 Quantity.to(targetUnit): Quantity? */
    fun <T : RealNumber<T>> convertQuantitySafely(
        source: Quantity<T>,
        targetUnit: PhysicalUnit
    ): Ret<Quantity<T>> {
        if (source.unit.dimension != targetUnit.dimension) {
            return Failed(
                Err(
                    ErrorCode.DimensionMismatch,
                    "物理量纲不兼容：无法将 [${source.unit.name} (${source.unit.symbol})] 转换为 [${targetUnit.name} (${targetUnit.symbol})]"
                )
            )
        }
        return safeCall(
            errorCodeOnNullOrException = ErrorCode.DimensionMismatch,
            nullMessage = "单位转换失败：${source.unit.symbol} -> ${targetUnit.symbol}"
        ) {
            source.to(targetUnit)
        }
    }

    /** 显式错误版本的同量纲数量相加：直接调用 OSPF Quantity.plus 并对齐至目标单位 */
    fun <T : RealNumber<T>> addQuantitiesSafely(
        lhs: Quantity<T>,
        rhs: Quantity<T>,
        targetUnit: PhysicalUnit = lhs.unit
    ): Ret<Quantity<T>> {
        if (lhs.unit.dimension != rhs.unit.dimension) {
            return Failed(
                Err(ErrorCode.DimensionMismatch, "加法的左右操作数量纲不兼容：${lhs.unit.symbol} vs ${rhs.unit.symbol}")
            )
        }
        return safeCall(ErrorCode.DimensionMismatch, "同量纲数量相加或单位对齐失败") {
            (lhs + rhs)?.to(targetUnit)
        }
    }

    /** 显式错误版本的跨量纲数量相除：直接调用 OSPF Quantity.div 并对齐至目标复合单位 */
    fun <T : RealNumber<T>> divideQuantitiesSafely(
        dividend: Quantity<T>,
        divisor: Quantity<T>,
        expectedTargetUnit: PhysicalUnit
    ): Ret<Quantity<T>> {
        if (divisor.value eq divisor.value.constants.zero) {
            return Failed(Err(ErrorCode.DivideByZero, "数量除法错误：除数 [$divisor] 为零"))
        }
        return safeCall(
            errorCodeOnNullOrException = ErrorCode.DimensionMismatch,
            nullMessage = "跨量纲除法结果单位 [${dividend.unit.symbol}/${divisor.unit.symbol}] 无法转换为目标单位 [${expectedTargetUnit.symbol}]"
        ) {
            (dividend / divisor).to(expectedTargetUnit)
        }
    }
}
```

---

### 6.3 物理量纲与单位安全（`Quantity` / `PhysicalUnit`）：让“重量加时间”或单位错配在校验期直接显式失败

拔除了裸浮点数的精度隐患后，接下来我们要解决更致命的第三颗炸弹——**物理量纲与单位错配**。

在 `ospf-kotlin` 的 `fuookami.ospf.kotlin.utils.physics` 包中，原生提供了结构化的物理量类型 **`Quantity<T>`（数量）** 与 **`PhysicalUnit`（物理单位）**。任何一个具有物理或业务度量的数值，都不再是一个孤立的数字，而是由**“代数数值（`value: T`）+ 原生物理单位（`unit: PhysicalUnit`，内含基本量纲向量 `Dimension` 与换算尺度）”**共同组成的不可变结构化值对象。

这套量纲与单位安全机制为企业软件筑起了三道坚固的防线：

#### 1. 不兼容量纲运算在编译期或构建校验期直接显式失败
每一个 `ospf` 原生 `PhysicalUnit`（如 `Kilogram`、`Ton`、`Hour`、`Minute`、`Meter`、`Celsius`）都绑定了明确的物理量纲维度（`Dimension`）。当代码中试图对两个 `Quantity` 执行加减或大小比较运算（如 `plannedFeeding + changeoverTime`）时，`ospf` 会首先检查二者的 `unit.dimension` 是否一致；若试图把“千克（`Kilogram`）”与“分钟（`Minute`）”相加，通过 `OspfBoundaryAdapter.addQuantitiesSafely(...)` 将**立即显式返回 `ErrorCode.DimensionMismatch` 错误**，绝不允许静默算出一个毫无物理意义的荒谬数字。

#### 2. 乘除、幂与倒数运算自动推导复合量纲
在计算生产时长、物料消耗率或物流运输成本时，不同量纲的数值经常需要相乘或相除。`ospf` 的 `Quantity` 与 `PhysicalUnit` 原生支持量纲代数运算：
* **乘除产生复合量纲**：当“合格产量（`Kilogram`）”除以“实际耗时（`Hour`）”时，结果自动携带复合单位 `Kilogram / Hour`（即生产率量纲）；当“生产率（`Kilogram / Hour`）”乘以“生产时长（`Hour`）”时，时间量纲自动约分抵消，结果可精准对齐回 `Kilogram`；
* **幂与倒数推导**：面积（`Meter.pow(2)`）、体积（`CubicMeter` 或 `Meter.pow(3)`，如 WMS 库位容积与 TMS 车厢体积）以及节拍频率（`Second.reciprocal()`）均可由基础单位通过幂运算与倒数运算自然衍生并保持全程量纲追踪。

#### 3. 符号变量与数学约束同样携带物理单位
在传统运筹建模中，一旦进入求解器构造表达式，单位就彻底消失了，只剩下一堆无量纲的数学符号 $x_1 + x_2 \le b$。而在 `ospf-kotlin` 支撑的形式化领域模型中，`Quantity<T>` 的泛型参数不仅可以是具体数值 `Flt64`，还可以直接包装运筹决策变量或中间符号（例如 `Quantity(plannedFeedingSymbol, Kilogram)`）！这意味着**不仅系统侧的具体数值携带单位，运筹侧的决策变量、中间值表达式乃至整个等式/不等式约束都完整保留物理单位**。

---

### 6.4 线性换算与仿射转换：跨系统（ERP/APS/MES/WMS）单位口径的统一收敛

在打通包含 ERP、APS、MES、WMS 与 TMS 的数字化运营平台（DOP）时，即使两个字段属于同一个物理量纲（例如都是质量或都是温度），不同子系统与业务环节所使用的具体计量单位也往往各不相同。

`ospf-kotlin` 的 `Quantity` / `PhysicalUnit` 体系原生提供了严谨的**同量纲换算引擎**，并将换算规则严格区分为**线性比例换算（Linear Conversion）**与**仿射换算（Affine Conversion）**两类：

| 换算类型 | 数学特征 | 典型工业与供应链场景（OSPF 原生单位） | 框架安全边界与防错铁律 |
| :--- | :--- | :--- | :--- |
| **线性比例换算**<br>（Linear Conversion） | $y = k \cdot x$<br>（共享绝对零点，仅比例尺度不同） | • **质量**：`Ton`（吨）↔ `Kilogram`（千克）↔ `Gram`（克）<br>• **时间**：`Day`（天）↔ `Hour`（小时）↔ `Minute`（分钟）↔ `Second`（秒）<br>• **体积**：`CubicMeter`（立方米）↔ `Liter`（升） | 支持同量纲自由加减、比例缩放，以及与其它量纲直接相乘除构造复合单位（如 `Ton / Day` 自动换算为 `Kilogram / Hour`）。 |
| **仿射换算**<br>（Affine Conversion） | $y = k \cdot x + b$<br>（零点存在偏移量 $b \neq 0$） | • **温度**：`Celsius`（摄氏度）↔ `Fahrenheit`（华氏度）↔ `Kelvin`（开尔文）（如化工反应釜温控、冷链仓储 WMS 与冷链运输 TMS 温区约束） | **严禁将仿射单位当作普通比例单位直接乘除**（例如“20°C 乘以 2 绝不等于 40°C”）！严格区分绝对温度换算与比例缩放，从类型与运算规则上杜绝仿射换算事故。 |

更重要的是，通过将量纲与单位换算统一收归到 `ospf` 基础框架与领域层，我们确立了一条极其重要的工程治理原则：**单位换算逻辑绝不允许在数据传输对象（DTO）、算法预处理脚本和求解器适配器中各写一套**。

下面给出 100% 使用 `ospf-kotlin` 原生单位对象（`Ton`、`Kilogram`、`Hour`、`Minute`、`Kilogram / Hour`）实现跨系统计算与量纲安全校验的完整代码：

```kotlin
package org.adaptive.dop.domain.physics

import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.physics.unit.*
import fuookami.ospf.kotlin.utils.physics.quantity.*
import fuookami.ospf.kotlin.utils.functional.*
import org.adaptive.dop.infrastructure.ospf.OspfBoundaryAdapter

object CrossSystemUnitConvergenceService {
    /**
     * 跨系统生产时长与总占用时间纯函数计算（100% 使用 OSPF 原生 PhysicalUnit）：
     *  - plannedOutputMass: ERP 订单计划产出重量，例如 Quantity(Flt64(1.2), Ton)
     *  - effectiveProductivity: 已审批激活的有效产能，例如 Quantity(Flt64(400.0), Kilogram / Hour)
     *  - changeoverTime: MES/工艺换产时间，例如 Quantity(Flt64(30.0), Minute)
     * 输出：统一对齐为 OSPF 原生单位 Hour (小时) 的工序总占用时长 Ret<Quantity<Flt64>>
     */
    fun calculateTotalTaskElapsedHours(
        plannedOutputMass: Quantity<Flt64>,
        effectiveProductivity: Quantity<Flt64>,
        changeoverTime: Quantity<Flt64>
    ): Ret<Quantity<Flt64>> {
        // 1. 产量 (如 1.2 Ton) ÷ 生产率 (如 400 Kilogram / Hour) -> OSPF 自动推导量纲并转换为 Hour (3.0 h)
        val productionDurationHours = when (
            val r = OspfBoundaryAdapter.divideQuantitiesSafely(
                dividend = plannedOutputMass,
                divisor = effectiveProductivity,
                expectedTargetUnit = Hour
            )
        ) {
            is Ok -> r.value
            is Failed -> return r
        }

        // 2. 生产时长 (3.0 Hour) + 换产时长 (如 30 Minute) -> OSPF 自动换算对齐为 3.5 Hour
        return OspfBoundaryAdapter.addQuantitiesSafely(
            lhs = productionDurationHours,
            rhs = changeoverTime,
            targetUnit = Hour
        )
    }

    /** 验证跨系统单位自动收敛与非法量纲拦截 */
    fun verifyCrossSystemUnitSafety() {
        val outputMass = Quantity(Flt64(1.2), Ton)                     // 1.2 吨
        val productivity = Quantity(Flt64(400.0), Kilogram / Hour)     // 400 千克/小时
        val changeover = Quantity(Flt64(30.0), Minute)                 // 30 分钟

        // 正常跨系统换算：1.2 t / (400 kg/h) + 30 min = 3.0 h + 0.5 h = 3.5 h
        val totalHours = (calculateTotalTaskElapsedHours(outputMass, productivity, changeover) as Ok).value
        check(totalHours.value eq Flt64(3.5))
        check(totalHours.unit == Hour)

        // 异常量纲拦截：试图将“重量 (Ton)”与“时间 (Minute)”直接相加 -> 必须显式返回 Failed(DimensionMismatch)
        val illegalAdd = OspfBoundaryAdapter.addQuantitiesSafely(outputMass, changeover)
        check(illegalAdd is Failed)
    }
}
```

---

## 第 7 章：一鱼两吃 —— 统一表达式中间表示（Expression IR）与同源双入口

在第 5 章和第 6 章中，我们看到形式化领域模型要求同一个业务规则（例如“投料量计算”“物料消耗预计”“换产时间计算”或“产能占用计算”）既能在业务系统侧进行确定性的**数值计算**，又能在运筹优化侧进行面向求解器的**符号建模**。

然而在传统的软件工程实践中，“数值计算”和“符号建模”仿佛生活在两个平行宇宙里。本章将深入剖析这两个宇宙分裂的根源，并展示如何直接利用 `ospf-kotlin` 的**统一表达式与多项式中间表示（`LinearMonomial` / `LinearPolynomial` / `LinearExpressionSymbol`）**、**共享业务核心双入口架构**以及**部分求值与编译求值技术**，真正实现“一份业务规则定义，同时驱动系统数值求值与运筹符号求解”的“一鱼两吃”架构。

---

### 7.1 传统研发的分裂之痛：后端程序员用业务代码算物料消耗，算法工程师用脚本重写一遍投料约束

让我们看一个在几乎所有制造企业都会发生的日常研发场景：定义**“工单任务在指定时间窗口内的物料投料消耗”**规则。

在传统开发模式下，这个规则会被拆成两份完全不同的代码，交给两个团队分别实现：

* **第一份代码（系统后端团队编写）**：为了在排产工作台展示物料消耗预计，或者在替代料分配更新了任务投料后重新核算消耗，后端工程师会在 Service 层用 Java/Kotlin 编写一段直接操作具体数值（`Double`）的函数：
  ```kotlin
  // 系统侧：直接传入具体数值，算出一个具体的消耗结果数字
  fun calcFeedingAmount(outputQty: Double, bomRatio: Double, scrapRate: Double): Double {
      return outputQty * bomRatio / (1.0 - scrapRate)
  }
  ```
* **第二份代码（运筹算法团队编写）**：为了在排产求解时保证“产线 A 和产线 B 的计划投料量之和不超过共享投料口上限 `feedingLimit`”，算法工程师会在算法服务里调用某个特定求解器（如 Cplex、Gurobi 或 OR-Tools）的 API，用决策变量构造一段线性表达式：
  ```python
  # 算法侧：操作求解器专属变量句柄，拼装出一个数学约束对象
  expr_a = solver.ScalProd([var_output_qty_a], [bom_ratio_a * (1.0 + scrap_rate_a)])
  expr_b = solver.ScalProd([var_output_qty_b], [bom_ratio_b * (1.0 + scrap_rate_b)])
  solver.Add(expr_a + expr_b <= feeding_limit)
  ```

请仔细观察上面这两段代码——**灾难已经悄然发生了**！
在系统后端的代码里，损耗率采用的是**除法口径** `bomRatio / (1.0 - scrapRate)`；而在算法工程师写的脚本里，损耗率却被写成了**乘法近似口径** `bom_ratio * (1.0 + scrap_rate)`！

当损耗率 `scrapRate = 10%` 时，系统算出来的需求投料系数是 `1 / 0.9 = 1.1111...`，而算法求解时用的系数却是 `1.10`。结果就是：运筹算法满心欢喜地返回了一个“完全满足 1000 公斤投料口上限”的最优排产计划，但当这个计划传回业务系统、按系统口径一重算物料消耗预计时，总投料量赫然变成了 `1010 公斤`，直接在生产现场触发超限告警！

这就是**缺少统一的数值与符号计算基础，导致同一公式在系统代码、算法表达式和求解器适配中重复实现**的典型恶果。只要数值计算和符号建模是两套独立编写的代码，无论团队开多少次对齐会、写多少页接口文档，编译期都无法阻止单位错配或公式分叉。

---

### 7.2 OSPF 表达式中间表示（Expression IR）：常量、稳定符号身份、属性路径与不可变语法树

要从根源上消灭“两套公式代码”，核心思路其实非常清晰：**我们不应该让业务规则直接算出一个死数字，也不应该让它直接绑定某个求解器的变量句柄，而是应该让业务规则构建出一棵求解器无关、既能代入数字求值又能转化为数学约束的“统一表达式中间表示（Expression IR）”**。

在 `ospf-kotlin`（`fuookami.ospf.kotlin.core.frontend.expression`）中，已经原生提供了一套可扩展的标量表达式与布尔关系表达式中间表示体系：

```text
                【OSPF (fuookami.ospf.kotlin.core.frontend.expression) 表达式体系】
                                                 │
     ┌───────────────────┬───────────────────────┼───────────────────────┬───────────────────┐
     ▼                   ▼                       ▼                       ▼                   ▼
 决策变量项          单项式 (Monomial)      多项式 (Polynomial)     具名中间符号 (Symbol)  函数算子符号
(AbstractVariable)  • LinearMonomial       • LinearPolynomial      • LinearIntermediate   • SlackFunction
• BinVar / IntVar   • QuadraticMonomial    • QuadraticPolynomial   • LinearExpressionSym  • SemiFunction
• URealVar / RealVar                       (不可变/可变多项式)     • QuadraticExpression  • ULP / IfThen ...
```

在设计和使用这套 `Expression IR` 时，架构上必须严格遵循四项工程规范：

1. **不可变、可遍历、可解释（Immutable, Traversable, Explainable）**：每一个已定型的多项式（`LinearPolynomial` / `QuadraticPolynomial`）与中间符号（`LinearExpressionSymbol`）保持不可变。多个复杂约束可以安全地共享和复用同一个具名中间符号，而绝不会发生某处修改污染全局公式的副作用；同时，表达式内部的所有单项式（`monomials`）与常数项（`constant`）均可被编译器、验证器、诊断器与智能体完整遍历，清晰解释“这个结果是由哪些变量和符号通过什么系数运算得来的”。
2. **稳定符号身份与业务属性路径**：`ospf` 的 `LinearIntermediateSymbol` 通过稳定的符号名称（`name`）与业务展示名（`displayName`）标识业务身份（例如 `plannedFeeding_lineA_T2_MAT001`），而不持有任何特定商业求解器的底层内存指针。
3. **表达式泛型绝不能替代物理单位与业务语义校验**：尽管多项式在代数结构上是泛型的，但在领域建模层构造表达式时，仍必须用 `ospf` 原生的 `Quantity`（如 `Quantity(intermediateSymbol, Kilogram)`）结合第 5 章的状态角色进行严格检查——不允许因为都变成了多项式，就把不同物理量纲或非法状态的符号随意相加。
4. **运行时符号与表达式不是领域事实**：单次求解或单次计算所生成的运行时决策变量与多项式实例，仅仅是计算过程中的技术载体；它们**绝不进入领域聚合根（Aggregate）的持久化状态，也不作为业务历史事实写入事件库**。

---

### 7.3 共享业务核心的双入口架构：系统侧代入具体数值直接求值 vs. 运筹侧代入符号变量生成约束片段

依托 `ospf-kotlin` 的表达式与具名中间符号体系，我们可以在领域层构建**“共享业务核心与数值/符号双入口”**的标准架构模式。

```text
          【领域概念、计算规则、折算系数与分支规格（唯一权威业务口径）】
                                       │
                                       ▼
                        [共享业务核心（Shared Core）]
                                       │
                   ┌───────────────────┴───────────────────┐
                   ▼                                       ▼
         【系统侧数值入口】                      【运筹优化侧符号/建模入口】
     传入：Quantity<Flt64> (具体值+单位)     传入：OSPF 决策变量 / 上游符号
     输出：Ret<Quantity<Flt64>>              输出：Ret<Quantity<LinearExpressionSymbol>>
                   │                                       │
                   └──────────► [等价性自动验证] ◄──────────┘
                                       │
                                       ▼
                     LinearMetaModel 编译与底层求解器能力检查
```

如上图所示，这套架构明确划分了领域层、算法层与求解器适配层的职责边界：
* **领域层（唯一业务语义所有者）**：只维护一份权威的领域概念、计算规则、损耗系数与条件分支规格。它通过共享业务核心对外暴露两个入口——当系统侧（如 BOM 展开、替代料消耗重算、数字孪生预计时间推演）调用**数值入口**时，传入带原生 `PhysicalUnit` 的 `Quantity<Flt64>`，直接获得计算结果；当运筹优化侧调用**符号/建模入口**时，则生成引用同一套系数与分支逻辑的 `Quantity<LinearExpressionSymbol>`（带物理单位的具名中间符号）。
* **算法层（单次求解建模者）**：负责创建单次排产或优化求解所需的运行时决策变量（如 `URealVar`、`BinVar`）、调用领域层的符号入口组装中间符号与约束管线、将其注册进 `LinearMetaModel` 并编排求解流程。
* **求解器适配层（编译器后端）**：通过 `LinearMechanismModel` 将通用元模型编译映射到底层具体的求解器插件（如 Gurobi、Cplex、SCIP、Cbc 或 Hexaly 等），并执行底层求解器能力检查。

同时，我们在工程落地上必须保持清醒的克制：**建立双入口架构，绝不意味着要把系统里所有的简单代码都强行泛型化，或者去造一个包罗万象的通用计算机代数系统（CAS）**！
* 对于**仅仅被业务系统侧单独使用**的简单确定性计算（例如纯粹的订单金额汇总或静态单据状态转换），仍然应当优先实现为直观、简洁的值对象（Value Object）或纯函数；
* **只有当同一条业务规则确实需要被“系统侧数值执行”和“运筹侧符号建模”共同消费时**（例如投料量、物料消耗、换产时间、生产时长、产能占用与日历可用性），才为其建立共享业务核心与双入口。所有基础抽象都必须以“减少口径分叉、提升可验证性”为唯一准绳，坚决拒绝为了形式上的统一而制造毫无业务收益的类型复杂度。

#### 工程实现：基于 OSPF 原生组件的“投料量与生产时长”双入口共享核心代码
下面给出直接基于 `ospf-kotlin` 原生类型（`Flt64`、`Kilogram`、`Ton`、`Hour`、`Minute`、`Quantity`、`AbstractVariableItem`、`LinearPolynomial`、`LinearExpressionSymbol`）实现的两个核心双入口模块代码：

```kotlin
package org.adaptive.dop.domain.core

import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.physics.unit.*
import fuookami.ospf.kotlin.utils.physics.quantity.*
import fuookami.ospf.kotlin.utils.error.*
import fuookami.ospf.kotlin.utils.functional.*
import fuookami.ospf.kotlin.core.frontend.variable.*
import fuookami.ospf.kotlin.core.frontend.expression.monomial.*
import fuookami.ospf.kotlin.core.frontend.expression.polynomial.*
import fuookami.ospf.kotlin.core.frontend.expression.symbol.*
import org.adaptive.dop.infrastructure.ospf.OspfBoundaryAdapter
import org.adaptive.dop.infrastructure.ospf.OspfGenericMathOperations

/**
 * 1. 投料规则领域规格（纯领域值对象，100% 使用 OSPF 原生 PhysicalUnit 如 Kilogram / Ton）
 */
data class FeedingRuleSpec(
    val taskId: String,
    val lineId: String,
    val materialId: String,
    val bomRatio: Flt64,                      // 单位成品所需基准投料配比
    val scrapRate: Flt64,                     // 工序损耗率 [0, 1)
    val outputUnit: PhysicalUnit = Kilogram,  // 直接使用 OSPF 原生 Kilogram 单位
    val feedingUnit: PhysicalUnit = Kilogram  // 直接使用 OSPF 原生 Kilogram 单位
)

/**
 * 共享业务核心一：物料投料与消耗计算核心（FeedingSharedCore）
 * 彻底消除“系统侧写除法损耗、算法侧写乘法损耗”的口径分裂！
 */
object FeedingSharedCore {

    /** 唯一权威折算系数：bomRatio / (1 - scrapRate) * (outputUnit -> feedingUnit 换算比例) */
    fun computeAlignedFeedingCoefficient(spec: FeedingRuleSpec): Ret<Flt64> {
        val rawMultiplier = when (
            val r = OspfGenericMathOperations.computeEffectiveMultiplier(spec.bomRatio, spec.scrapRate, Flt64)
        ) {
            is Ok -> r.value
            is Failed -> return r
        }
        val oneOutputUnitQty = Quantity(Flt64.one, spec.outputUnit)
        val convertedUnitQty = when (
            val uRes = OspfBoundaryAdapter.convertQuantitySafely(oneOutputUnitQty, spec.feedingUnit)
        ) {
            is Ok -> uRes.value
            is Failed -> return uRes
        }
        return Ok(rawMultiplier * convertedUnitQty.value)
    }

    /** 【入口 A：系统侧确定性数值入口】—— 用于 BOM 拆解、替代料消耗预计重算与数字孪生局部推演 */
    fun evaluateNumericalFeeding(
        spec: FeedingRuleSpec,
        outputQuantity: Quantity<Flt64>
    ): Ret<Quantity<Flt64>> {
        val alignedOutput = when (
            val r = OspfBoundaryAdapter.convertQuantitySafely(outputQuantity, spec.outputUnit)
        ) {
            is Ok -> r.value
            is Failed -> return r
        }
        val coeff = when (val cRes = computeAlignedFeedingCoefficient(spec)) {
            is Ok -> cRes.value
            is Failed -> return cRes
        }
        return Ok(Quantity(alignedOutput.value * coeff, spec.feedingUnit))
    }

    /** 【入口 B：运筹优化侧 OSPF 符号建模入口】—— 产出带物理单位的 OSPF 具名中间符号 LinearExpressionSymbol */
    fun buildSymbolicFeedingIntermediate(
        spec: FeedingRuleSpec,
        plannedOutputVar: AbstractVariableItem<*, *> // OSPF 决策变量，如 URealVar / IntVar
    ): Ret<Quantity<LinearExpressionSymbol>> {
        val coeff = when (val cRes = computeAlignedFeedingCoefficient(spec)) {
            is Ok -> cRes.value
            is Failed -> return cRes
        }
        return OspfBoundaryAdapter.safeCall {
            val polynomial: LinearPolynomial = coeff * plannedOutputVar
            val symbolName = "plannedFeeding_${spec.lineId}_${spec.taskId}_${spec.materialId}"
            val intermediateSymbol = LinearExpressionSymbol(
                polynomial = polynomial,
                name = symbolName,
                displayName = "产线[${spec.lineId}]任务[${spec.taskId}]计划投料量(${spec.feedingUnit.symbol})"
            )
            Quantity(intermediateSymbol, spec.feedingUnit)
        }
    }
}

/**
 * 2. 共享业务核心二：工序换产与生产总耗时计算核心（TaskDurationSharedCore）
 * 支撑第 10 章数字孪生“前序任务延误 -> 后序预计时间重算”与运筹侧工序时间窗建模同源！
 */
data class TaskDurationSpec(
    val taskId: String,
    val lineId: String,
    val effectiveProductivity: Quantity<Flt64>, // 如 Quantity(Flt64(400.0), Kilogram / Hour)
    val changeoverDuration: Quantity<Flt64>,    // 如 Quantity(Flt64(30.0), Minute)
    val calendarBreakDuration: Quantity<Flt64> = Quantity(Flt64.zero, Hour),
    val outputUnit: PhysicalUnit = Kilogram,
    val targetTimeUnit: PhysicalUnit = Hour
)

object TaskDurationSharedCore {

    /** 唯一权威时间系数与固定偏移计算（统一对齐到 targetTimeUnit，如 Hour） */
    fun computeTimeParameters(spec: TaskDurationSpec): Ret<Pair<Flt64, Flt64>> {
        // 1) 计算生产 1 个 outputUnit 所需的时间 (如 1 kg / (400 kg/h) = 0.0025 h)
        val oneUnitOutput = Quantity(Flt64.one, spec.outputUnit)
        val timePerUnit = when (
            val r = OspfBoundaryAdapter.divideQuantitiesSafely(oneUnitOutput, spec.effectiveProductivity, spec.targetTimeUnit)
        ) {
            is Ok -> r.value.value
            is Failed -> return r
        }
        // 2) 计算换产时间 + 班次休息调整的固定时间偏移 (如 30 min + 0 h = 0.5 h)
        val totalFixedOffset = when (
            val r = OspfBoundaryAdapter.addQuantitiesSafely(spec.changeoverDuration, spec.calendarBreakDuration, spec.targetTimeUnit)
        ) {
            is Ok -> r.value.value
            is Failed -> return r
        }
        return Ok(timePerUnit to totalFixedOffset)
    }

    /** 【入口 A：系统侧数值入口】—— 数字孪生收到 T1 实际完工时间后，秒级重算 T2 预计占用时长 */
    fun evaluateNumericalTotalDuration(
        spec: TaskDurationSpec,
        outputQuantity: Quantity<Flt64>
    ): Ret<Quantity<Flt64>> {
        val alignedOutput = when (val r = OspfBoundaryAdapter.convertQuantitySafely(outputQuantity, spec.outputUnit)) {
            is Ok -> r.value
            is Failed -> return r
        }
        val (timePerUnit, fixedOffset) = when (val pRes = computeTimeParameters(spec)) {
            is Ok -> pRes.value
            is Failed -> return pRes
        }
        return Ok(Quantity(alignedOutput.value * timePerUnit + fixedOffset, spec.targetTimeUnit))
    }

    /** 【入口 B：运筹侧 OSPF 符号入口】—— 产出任务占用时长中间符号：timePerUnit * plannedOutputVar + fixedOffset */
    fun buildSymbolicTotalDurationIntermediate(
        spec: TaskDurationSpec,
        plannedOutputVar: AbstractVariableItem<*, *>
    ): Ret<Quantity<LinearExpressionSymbol>> {
        val (timePerUnit, fixedOffset) = when (val pRes = computeTimeParameters(spec)) {
            is Ok -> pRes.value
            is Failed -> return pRes
        }
        return OspfBoundaryAdapter.safeCall {
            val poly: LinearPolynomial = timePerUnit * plannedOutputVar + fixedOffset
            val sym = LinearExpressionSymbol(
                polynomial = poly,
                name = "taskTotalDuration_${spec.lineId}_${spec.taskId}",
                displayName = "任务[${spec.taskId}]含换产总占用时长(${spec.targetTimeUnit.symbol})"
            )
            Quantity(sym, spec.targetTimeUnit)
        }
    }
}
```

---

### 7.4 部分求值、编译求值缓存与等价性性质测试：用自动化测试证明系统计算与算法模型 100% 口径一致

当同一套业务规则既能走数值入口、又能走符号表达式入口时，基础框架还必须解决两个关键的工程问题：**第一，如何在不同上下文下高效、安全地对表达式进行求值？第二，如何用自动化手段 100% 证明两个入口算出来的东西绝对等价？**

`ospf` 基础框架与我们的领域边界适配层通过以下三项核心能力给出了完备的解决方案：

#### 1. 完整求值、部分求值（Partial Evaluation）与三值逻辑
在复杂的业务推演与模型化简中，表达式里的符号并不总是同时全部已知的。例如，在排产前预处理阶段，BOM 比例、设备额定功率和今日已发生的实际投料量（`actualFeedingInWindow`）是已知的常数，而待排产任务的计划产量则是未知的决策变量。
* **完整代入与部分代入**：框架支持按上下文绑定业务属性与符号。当所有变量符号都绑定了具体数值时，直接执行**完整求值**产出最终数值；当只有一部分符号绑定了已知常数时，则执行**部分求值（Partial Evaluation）**，将已知常数项提前折叠化简为新的 `LinearPolynomial`，生成更精简的剩余符号表达式。
* **缺失符号诊断与三值逻辑（Three-Valued Logic）**：在求值过程中，如果遇到缺失的符号绑定或处于“未知（Unknown）”状态的业务属性，严格遵循三值逻辑（`TRUE` / `FALSE` / `UNKNOWN`），并以显式的结构化结果（`Ret`）向上传播失败或未知状态。**严禁将“未知（Unknown）”静默当成布尔 `false` 处理，也严禁将“缺失值（Missing）”静默当成零值（`0`）代入运算**——因为一旦把缺失的库存或缺失的换产耗时当成 `0`，就会在排产中制造出致命的虚假可行解！

#### 2. 编译求值（Compiled Evaluation）与稀疏大表达式性能治理
在工业级排产与数字孪生仿真中，一个大规模表达式可能包含数以万计的符号项（例如跨数百个时间桶、上千道工序的产能与物料平衡表达式），并且需要在局部推演、启发式搜索或求解后结果检验中被高频重复求值成千上万次。如果每次求值都去遍历复杂对象图并做哈希表查找，CPU 与内存开销将难以承受。

为此，系统实现了**“构建期校验与运行期编译求值分离”**的机制：
* **冻结符号顺序与预计算索引**：在可诊断的模型构建阶段完成类型、单位与结构校验后，支持冻结当前的变量符号顺序（如 `LinearMetaModel.tokens` 中的冻结 Token 索引），预计算稀疏非零项索引数组，生成可缓存的高性能求值器，并对稀疏大表达式提供可观测的时间与内存边界控制。
* **带版本指纹的缓存键治理**：为了防止历史回放或并发仿真时发生状态串扰，编译求值器的缓存键（Cache Key）必须完整包含**表达式结构哈希、冻结的符号顺序以及底层数值能力版本**，绝不允许默认用当前的全局可变状态去解释历史模型。

#### 3. 双入口等价性与代数律验证（Equivalence & Property-Based Testing）
这是保障“系统与算法永不分叉”的终极武器。每当工程师新增或修改一个共享业务核心规则时，自动化测试套件都会强制执行多维度的**等价性测试与代数性质测试**：

| 验证维度 | 自动化测试验证内容 | 拦截的典型工程缺陷 |
| :--- | :--- | :--- |
| **数值入口 vs. 符号入口等价** | 随机生成大批量合法业务输入，比对“直接调用系统侧数值入口的结果”与“先生成运筹侧 `ospf` 符号表达式、再将同一批数值作为变量解代入求值的结果”是否严格相等。 | 拦截数值分支与符号建模分支中的系数漏乘、损耗公式不一致或边界条件分叉。 |
| **解释求值 vs. 编译求值等价** | 对同一棵复杂稀疏多项式，比对“映射表代入求值”与“基于冻结 Token 顺序的编译数组求值”在完整代入和部分代入下的输出是否完全一致。 | 拦截符号索引错位、稀疏项漏算或缓存键冲突导致的计算失真。 |
| **规范化与化简前后等价** | 比对原始业务表达式与经过同类项合并、代数化简、规范单项式/多项式转换后的表达式，在全定义域内的求值结果是否恒等。 | 拦截表达式化简器或降阶编译器在重写多项式时引入的符号正负号错误或项丢失。 |
| **异常与边界拒绝一致性** | 覆盖常数符号代入、真实决策变量代入、物理单位不兼容失败、非仿射拒绝以及求解器能力不足等负面边界。 | 确保非法输入在各入口均以一致的结构化错误显式失败，绝不静默放行。 |

#### 工程实现：基于 OSPF `LinearPolynomial` 的三值逻辑部分求值、编译求值器与双入口等价性测试代码

```kotlin
package org.adaptive.dop.domain.core

import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.physics.unit.*
import fuookami.ospf.kotlin.utils.physics.quantity.*
import fuookami.ospf.kotlin.utils.error.*
import fuookami.ospf.kotlin.utils.functional.*
import fuookami.ospf.kotlin.core.frontend.variable.*
import fuookami.ospf.kotlin.core.frontend.expression.monomial.*
import fuookami.ospf.kotlin.core.frontend.expression.polynomial.*
import org.adaptive.dop.infrastructure.ospf.OspfBoundaryAdapter

// 1. 严格的三值逻辑枚举：用于处理含未决变量的条件与不等式求值（严禁把 UNKNOWN 当成 FALSE！）
enum class ThreeValuedTruth { TRUE, FALSE, UNKNOWN }

// 2. 基于 OSPF LinearPolynomial 的安全完整求值与部分求值器（严禁把缺失变量绑定静默当成 0！）
object OspfSafePolynomialEvaluator {

    /**
     * 安全完整求值：
     * 检查多项式中的所有决策变量是否均已在 bindings 中提供（且不在 explicitUnknownVars 中）；
     * 若有任何变量缺失绑定，立即显式返回 Failed(ErrorCode.SymbolNotFound)，绝不静默按 0 求值！
     */
    fun evaluateCompleteSafely(
        polynomial: LinearPolynomial,
        bindings: Map<AbstractVariableItem<*, *>, Flt64>,
        explicitUnknownVars: Set<AbstractVariableItem<*, *>> = emptySet()
    ): Ret<Flt64> {
        for (monomial in polynomial.monomials) {
            val variable = monomial.variable
            if (variable in explicitUnknownVars) {
                return Failed(Err(ErrorCode.ApplicationError, "求值拦截：变量 [${variable.name}] 处于显式未知状态 (UNKNOWN)，拒绝强行转为数值！"))
            }
            if (!bindings.containsKey(variable)) {
                return Failed(Err(ErrorCode.SymbolNotFound, "求值失败：变量 [${variable.name}] 缺失绑定值（严禁将缺失值当作 0 处理！）"))
            }
        }
        return OspfBoundaryAdapter.safeCall(ErrorCode.ApplicationError, "OSPF 多项式代入求值返回 null") {
            polynomial.evaluate(bindings)
        }
    }

    /**
     * 安全部分求值 (Partial Evaluation)：
     * 将已知绑定变量的单项式折叠并入常数项，保留未绑定变量的单项式，返回化简后的新 OSPF LinearPolynomial。
     */
    fun evaluatePartialPolynomial(
        polynomial: LinearPolynomial,
        knownBindings: Map<AbstractVariableItem<*, *>, Flt64>
    ): LinearPolynomial {
        val residualPoly = MutableLinearPolynomial()
        var foldedConstant = polynomial.constant
        for (monomial in polynomial.monomials) {
            val boundVal = knownBindings[monomial.variable]
            if (boundVal != null) {
                foldedConstant += monomial.coefficient * boundVal
            } else {
                residualPoly += monomial
            }
        }
        residualPoly += foldedConstant
        return LinearPolynomial(residualPoly)
    }

    /** 三值逻辑不等式求值 (poly <= rhsLimit)：若仍有未绑定变量则返回 UNKNOWN，绝不伪造 FALSE */
    fun evaluateLeqThreeValued(
        polynomial: LinearPolynomial,
        rhsLimit: Flt64,
        bindings: Map<AbstractVariableItem<*, *>, Flt64>
    ): ThreeValuedTruth {
        val partial = evaluatePartialPolynomial(polynomial, bindings)
        if (partial.monomials.isNotEmpty()) {
            return ThreeValuedTruth.UNKNOWN
        }
        return if (partial.constant leq rhsLimit) ThreeValuedTruth.TRUE else ThreeValuedTruth.FALSE
    }
}

// 3. 冻结符号顺序的高性能编译求值器 (Compiled Evaluator) 与带版本指纹的缓存键
data class CompiledEvaluatorCacheKey(
    val polynomialStructureHash: Int,
    val frozenVariableNamesOrder: List<String>, // 冻结的 OSPF 变量名顺序列表
    val numericalPrecisionVersion: String       // 如 "Flt64_ep_1e-9"
)

class OspfCompiledLinearEvaluator private constructor(
    val cacheKey: CompiledEvaluatorCacheKey,
    val unit: PhysicalUnit,
    private val constant: Double,
    private val nonZeroIndices: IntArray,
    private val coefficients: DoubleArray,
    private val expectedVectorLength: Int
) {
    /** 高频运行阶段：直接基于连续 Double 解向量做稀疏内积，无任何哈希查找或对象分配开销 */
    fun evaluateFast(solutionVector: DoubleArray): Ret<Quantity<Flt64>> {
        if (solutionVector.size < expectedVectorLength) {
            return Failed(
                Err(ErrorCode.IllegalArgument, "解向量长度 (${solutionVector.size}) 小于冻结符号顺序长度 ($expectedVectorLength)")
            )
        }
        var acc = constant
        for (i in nonZeroIndices.indices) {
            acc += coefficients[i] * solutionVector[nonZeroIndices[i]]
        }
        return Ok(Quantity(Flt64(acc), unit))
    }

    companion object {
        /** 构建阶段：校验最大稀疏项数边界、冻结变量顺序并预计算索引 */
        fun compile(
            polynomial: LinearPolynomial,
            unit: PhysicalUnit,
            frozenVariables: List<AbstractVariableItem<*, *>>,
            maxAllowedNonZeroTerms: Int = 100_000
        ): Ret<OspfCompiledLinearEvaluator> {
            if (polynomial.monomials.size > maxAllowedNonZeroTerms) {
                return Failed(
                    Err(ErrorCode.ApplicationError, "稀疏多项式非零项数 (${polynomial.monomials.size}) 超过内存边界上限 ($maxAllowedNonZeroTerms)")
                )
            }
            val indexMap = frozenVariables.withIndex().associate { (idx, v) -> v.name to idx }
            val indices = IntArray(polynomial.monomials.size)
            val coeffs = DoubleArray(polynomial.monomials.size)

            for ((k, mono) in polynomial.monomials.withIndex()) {
                val idx = indexMap[mono.variable.name]
                    ?: return Failed(Err(ErrorCode.SymbolNotFound, "变量 [${mono.variable.name}] 不在冻结符号顺序列表中"))
                indices[k] = idx
                coeffs[k] = mono.coefficient.toDouble()
            }

            val cacheKey = CompiledEvaluatorCacheKey(
                polynomialStructureHash = polynomial.hashCode(),
                frozenVariableNamesOrder = frozenVariables.map { it.name },
                numericalPrecisionVersion = "Flt64_ep_${Flt64.decimalPrecision}"
            )
            return Ok(
                OspfCompiledLinearEvaluator(
                    cacheKey = cacheKey,
                    unit = unit,
                    constant = polynomial.constant.toDouble(),
                    nonZeroIndices = indices,
                    coefficients = coeffs,
                    expectedVectorLength = frozenVariables.size
                )
            )
        }
    }
}

// 4. 自动化双入口等价性与性质测试套件（同时验证数值入口、符号解释求值、编译求值与缺失符号拒绝）
object OspfDualEntryEquivalenceTestSuite {

    fun runEquivalenceAndPropertyTests() {
        val spec = FeedingRuleSpec(
            taskId = "T2",
            lineId = "lineA",
            materialId = "MAT_001",
            bomRatio = Flt64(0.85),
            scrapRate = Flt64(0.15), // 0.85 / (1 - 0.15) = 1.0
            outputUnit = Ton,        // 产出使用 OSPF 原生 Ton (吨)
            feedingUnit = Kilogram   // 投料使用 OSPF 原生 Kilogram (千克)
        )

        val plannedOutputVar = URealVar("qty_T2_ton")
        val symbolicFeedingQty = (FeedingSharedCore.buildSymbolicFeedingIntermediate(spec, plannedOutputVar) as Ok).value
        val compiledEvaluator = (OspfCompiledLinearEvaluator.compile(
            polynomial = symbolicFeedingQty.value.polynomial,
            unit = symbolicFeedingQty.unit,
            frozenVariables = listOf(plannedOutputVar)
        ) as Ok).value

        // 1. 验证数值入口、OSPF 符号解释求值、OSPF 编译求值三者在全样本域上 100% 恒等
        val testTons = listOf(0.25, 1.0, 1.85, 5.4)
        for (tonVal in testTons) {
            val fltVal = Flt64(tonVal)
            // (a) 系统侧数值入口
            val numRes = (FeedingSharedCore.evaluateNumericalFeeding(spec, Quantity(fltVal, Ton)) as Ok).value
            // (b) OSPF 符号安全完整求值
            val symResVal = (OspfSafePolynomialEvaluator.evaluateCompleteSafely(
                symbolicFeedingQty.value.polynomial,
                mapOf(plannedOutputVar to fltVal)
            ) as Ok).value
            // (c) 冻结符号顺序的编译求值器
            val compiledRes = (compiledEvaluator.evaluateFast(doubleArrayOf(tonVal)) as Ok).value

            check((numRes.value eq symResVal) && (numRes.value eq compiledRes.value)) {
                "双入口或编译求值不一致: num=${numRes.value}, sym=$symResVal, compiled=${compiledRes.value}"
            }
            check(numRes.unit == Kilogram && compiledRes.unit == Kilogram)
        }

        // 2. 验证缺失符号绑定时，必须显式返回 Failed，绝不静默当成 0！
        val missingEval = OspfSafePolynomialEvaluator.evaluateCompleteSafely(
            symbolicFeedingQty.value.polynomial,
            emptyMap()
        )
        check(missingEval is Failed) { "严重错误：缺失变量绑定未被拦截！" }

        // 3. 验证三值逻辑：当变量未绑定时，不等式求值必须返回 UNKNOWN 而非 FALSE
        val truth = OspfSafePolynomialEvaluator.evaluateLeqThreeValued(
            symbolicFeedingQty.value.polynomial,
            Flt64(1000.0),
            emptyMap()
        )
        check(truth == ThreeValuedTruth.UNKNOWN)
    }
}
```

---

## 第 8 章：像搭积木一样表达复杂业务 —— 结构化函数、逻辑算子与求解器解耦

解决了单个算术表达式的同源求值问题后，当我们真正着手用形式化领域模型去刻画复杂的工业现场（如 DOP 中的排产、配载与库存调拨）时，马上会遇到第二道拦路虎：**现实世界的业务规则充满了非线性分段、绝对值偏差、条件分支（`if-then-else`）与多目标权衡，而底层的运筹优化求解器（如线性规划 LP / 混合整数线性规划 MILP）却只认识极其枯燥的线性等式与不等式矩阵（$A x \le b$）**。

如果让业务研发或智能体直接去写引入大量辅助 0-1 变量和极大常数（Big-M）的底层线性化不等式，不仅代码晦涩难懂、极易写错，而且一旦切换求解器（例如从不支持某函数的求解器切换到支持原生指示约束或二次规划的求解器），整套模型就得推倒重来。

本章将展示 `ospf`（`ospf-kotlin-core`）如何通过**规范化与代数分类**、**内置的结构化函数与逻辑算子积木**、**类编译器求解器解耦架构（`LinearMetaModel` → `LinearMechanismModel` → `LinearSolver`）**以及**显式错误契约（`Ret`）**，让开发者与智能体能够像搭积木一样用直观的业务语义构建模型，同时将底层数学转换与求解器适配彻底隔离在领域层之外。

---

### 8.1 化非线性为线性：绝对值、松弛变量、分段线性与阶梯规则的规范化与代数分类

在真实的生产与物流调度中，许多看似非线性的业务诉求，在数学上其实是可以通过引入受控的中间变量与附加约束片段，等价转换为线性或二次规划模型的。

在 `ospf-kotlin` 框架中，开发者无需手工推导这些繁琐的辅助变量，而是直接使用 `fuookami.ospf.kotlin.core.frontend.expression.symbol.linear_function`（及 `quadratic_function`）包内置的**高阶函数符号（Functional Symbols）**来表达业务意图；随后，框架在构建与编译阶段自动完成**规范化、代数分类与结构化约束片段展开**：

#### 1. 规范化与代数阶数自动分类（Canonicalization & Algebraic Classification）
当多个单项式或子表达式经过加减乘除组合成一个新的复杂表达式时，`ospf` 的多项式系统（如 `LinearPolynomial`、`QuadraticPolynomial`）会自动执行**同类项合并**，将其转换为规范单项式与规范多项式表示，并在类型与结构上精确区分其代数阶数：
* 它是**纯常数（Constant）**、**一阶线性多项式（`LinearPolynomial`）**、**二阶二次多项式（`QuadraticPolynomial`）**，还是**更高阶的一般非线性表达式**？
* 在将表达式注入特定目标元模型（例如要求一阶线性的 `LinearMetaModel`）或特定求解器插件前，必须执行严格的**目标次数与能力转换检查**。

#### 2. OSPF 内置连续与分段业务算子积木
围绕工业排程与供应链优化的高频场景，`ospf-kotlin` 提供了丰富的内置函数符号，每个符号在注册到 `LinearMetaModel` 并编译为 `LinearMechanismModel` 时，都会自动生成必要的中间辅助变量与线性约束片段，同时完整保留业务名称、单位与符号身份：

| 函数符号类别 | 直接使用的 `ospf-kotlin` 内置函数符号类 | 对应的工业与供应链业务场景 | `ospf` 编译器底层自动完成的工作 |
| :--- | :--- | :--- | :--- |
| **偏差与弹性松弛** | • `AbsFunction`（绝对值）<br>• `SlackFunction`（松弛函数）<br>• `SlackRangeFunction`（范围松弛） | • 衡量实际产出与目标计划的正负绝对偏差；<br>• 为交期时间窗或安全库存设置可度量的弹性缓冲区间。 | 自动引入非负正负偏差辅助变量与绑定约束，求解后可直接通过该符号对象查询具体松弛量与违反量。 |
| **分段线性与阶梯规则** | • `ULPFunction`（一元分段线性）<br>• `BLPFunction`（二元分段线性）<br>• `InStepRangeFunction`（步进区间） | • 电力峰谷平阶梯电价下的能耗优化；<br>• 随设备负载率非线性变化的加工损耗率；<br>• 物流 TMS 的阶梯运价与折扣率计算。 | 根据折点坐标自动引入凸组合权重或 SOS2 / 二元分段激活变量，生成等价的混合整数线性约束片段。 |
| **批量、取整与半连续** | • `CeilingFunction` / `FloorFunction`<br>• `RoundingFunction` / `ModFunction`<br>• `SemiFunction`（半连续标记） | • WMS 最小整托盘/整箱包装发运量折算；<br>• 产线投料“要么不开启（为 0），一旦开启则投料量不得低于最小起批门槛 `lb`”。 | 自动引入整数商/余数变量或半连续激活二元变量，确保生成的计划天然符合车间物理包装与起批规范。 |

---

### 8.2 把业务分支装进数学模型：布尔逻辑、条件分支、选一约束与多目标软约束权衡

如果说分段与取整解决的是“数值形态”问题，那么工业现场最令算法工程师头疼的则是无处不在的**条件分支与组合逻辑**——例如：“如果产线 A 今天生产了含过敏原的物料 X，且紧接着生产普通物料 Y，则必须插入一次长达 90 分钟的深度清洗工序；否则只需常规换产 30 分钟”。

为了把这类演绎逻辑自然地写进领域模型，`ospf-kotlin` 提供了完备的**逻辑与条件函数符号体系**以及**多目标软约束治理机制**：

#### 1. OSPF 内置布尔逻辑与条件分支算子
* **二值化与逻辑代数算子**：提供 `BinFunction`（二值化）、`BTerFunction`（平衡三值化）以及 `AndFunction`（逻辑与）、`OrFunction`（逻辑或）、`NotFunction`（逻辑非）、`XorFunction`（逻辑异或）算子，让多个布尔状态条件可以像写普通业务代码一样自由组合。
* **蕴含与条件分支算子**：提供 `ImplyFunction`（逻辑蕴含）、`InequalityFunction`（不等式指示函数）、`IfFunction`（条件 IF）、`IfInFunction`（条件区间）与 `IfThenFunction`（条件 If-Then）算子。开发者只需声明业务上的因果关系，框架便会自动将其编译为指示约束或受严格边界控制的线性化约束片段。
* **组合选择与极值统计**：提供 `OneOfFunction`（选一约束）、`SameAsFunction`（同状态约束）、`FirstFunction`（首个非零索引）、`MaskingFunction`（掩码函数）、`MinFunction` / `MaxFunction`（最小/最大值）等算子，轻松表达“多条备选产线只能选一条”、“同批次订单必须分配给同一辆货车”等复杂调度规则。

#### 2. 结构化约束元数据与多目标/软约束权衡
在真实的生产排程中，并不是所有规则都是生硬的“一票否决”。如果把客户期望交期、理想库存水位、减少换产次数和员工不加班全部设成绝对不可妥协的**硬约束（Hard Constraints）**，那么一旦遇到第 1 章那样的急单或设备延误，求解器只会冷冰冰地返回“无解（Infeasible）”。

因此，形式化领域模型将约束与目标定义为结构化的元数据，并严格区分**硬约束**与**软约束（Soft Constraints）/ 多目标权衡**：

```text
                        【形式化约束与目标分类治理体系】
                                       │
               ┌───────────────────────┴───────────────────────┐
               ▼                                               ▼
     【硬约束（Hard Constraints）】                  【软约束与多目标（Soft Constraints & Objectives）】
  • 物理与安全底线（如设备物理容量上限、            • 业务偏好与优化方向（如订单交期准时率、
    物料守恒平衡、共享投料口物理极限、法规红线）      减少换产总耗时、降低库存积压、均衡产线负载）
  • 铁律：绝对不可违反；任何机器学习校准或          • 机制：通过 OSPF SlackFunction 与目标权重/罚系数
    智能体适配均无权通过训练或提示词放宽硬约束！      转化为目标函数分项，支持按优先级或权重权衡！
```

---

### 8.3 类编译器降阶架构：如何让领域模型彻底摆脱对特定商业或开源求解器 API 的绑定？

当领域层与算法层用上述 `ospf` 通用符号与结构化约束搭好模型后，它究竟是如何变成 Gurobi、Cplex、SCIP、Cbc、MindOpt 或 Hexaly 等具体求解器能够执行的底层指令的？

这里体现了 `ospf-kotlin` 最核心的工程设计——**类编译器降阶架构（`LinearMetaModel` → `LinearMechanismModel` → `LinearSolver`）与求解器彻底解耦**。

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 领域层（Domain Layer）                                                  │
│ • 定义业务概念、OSPF 原生单位 (Kilogram/Hour)、计算关系与约束语义模板   │
│ • 铁律：领域聚合根绝不持有任何求解器变量、模型句柄或求解会话（Session） │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ 暴露纯计算与符号双入口
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 算法建模层（Algorithm Layer —— 前端元模型 LinearMetaModel）             │
│ • 基于 OSPF 通用符号（URealVar / LinearExpressionSymbol）与内置函数算子 │
│   （SemiFunction / SlackFunction / IfThenFunction）组装单次求解元模型   │
│ • 不绑定任何特定商业或开源求解器的原生 API                              │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ 调用 LinearMechanismModel(metaModel) 降阶编译
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ OSPF 中端编译器与后端求解器插件层（LinearMechanismModel & Solver Plugins）│
│ • 自动递归展开所有高阶函数算子，执行同类项合并、常量折叠与阶数/能力检查 │
│ • 降阶生成稀疏矩阵视图并对接统一 LinearSolver 接口                      │
│ • 零业务代码改动切换 Gurobi / Cplex / SCIP / Cbc / Hexaly 等求解器插件  │
└─────────────────────────────────────────────────────────────────────────┘
```

这一类编译器分层架构为企业软件带来了三大决定性的工程优势：

1. **领域模型与算法逻辑彻底摆脱求解器锁定（Vendor Lock-in）**：领域层与算法层编写的每一行代码都只依赖求解器无关的 `ospf` 前端抽象（`LinearMetaModel`）。当企业需要从商业求解器切换至开源求解器、或者针对特定子问题切换不同的求解器插件时，**核心业务语义与领域规则代码一行都不用改**，只需在应用层编排中注入不同的 `LinearSolver` 插件实例。
2. **支持按场景灵活拆分求解路径与降级策略**：应用层可以根据当前业务场景自由编排求解器——例如在日常高频的数字孪生局部推演或智能体多方案快速比选中，调度轻量级求解器以获得秒级反馈；而在夜间全局主计划排产中，则调度重型 MILP 或列生成/Benders 分解管线进行深度寻优。
3. **无副作用的稳定扩展机制**：所有扩展点均保持稳定且无运行时业务副作用，既防止业务特例规则反向污染通用数学基础库，也坚决杜绝底层求解器的原生 API 反向渗透到领域层。

---

### 8.4 显式错误契约（`Result` / `Ret`）与能力检查：严禁静默截断高阶项，当求解器能力不支持时如何优雅报错或降级

在传统的运筹脚本或大模型代码生成中，最可怕的不是程序直接报错退出，而是**“静默容错导致的带病运行”**。例如，当一个业务规则或动态约束生成了二次乘积项（`QuadraticPolynomial`，最高次数 `degree = 2`），而当前管线使用的是一阶线性元模型（`LinearMetaModel`）或仅支持线性规划的求解器时，某些简陋的封装库会静默丢弃二次高阶项；同样，当缺失符号或单位不兼容时，直接抛出未捕获的异常会导致整个排产服务崩溃。

为此，本书架构强制推行**显式错误契约（`Ret<T>`）**与**严格的目标阶数及求解器能力检查机制**：

1. **可失败运算统一返回 `ospf` 的 `Ret<T>`（`Ok` / `Failed`）**：所有单位转换、表达式求值、高阶阶数转换、约束注册、模型编译（`LinearMechanismModel(metaModel)`）与求解执行（`solver(mechanismModel)`），均通过 `Ret<T>` 显式传递成功结果或结构化 `Err`，彻底杜绝未捕获异常泄漏到领域层。
2. **严禁静默截断高阶项（Target Degree Check）**：在将通用多项式（如可能包含二次项的 `QuadraticPolynomial`）转换为一阶线性多项式（`LinearPolynomial`）注入线性模型前，必须检查其是否含有二次或更高阶项；**一旦发现阶数超出目标建模器或求解器能力，必须立即返回显式的 `Failed(Err(ErrorCode.ApplicationError, ...))` 结构化错误，绝对禁止静默截断高阶项或把非线性规则伪装成线性表达式**！

#### 工程实现：基于 OSPF 函数算子、阶数守卫、`LinearMetaModel` 与 `LinearSolver` 的完整建模与求解代码
下面给出完整串联第 5～8 章所有 `ospf-kotlin` 原生特性的工业级排产建模与求解管线代码：

```kotlin
package org.adaptive.dop.algorithm.scheduling

import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.physics.unit.*
import fuookami.ospf.kotlin.utils.physics.quantity.*
import fuookami.ospf.kotlin.utils.error.*
import fuookami.ospf.kotlin.utils.functional.*
import fuookami.ospf.kotlin.core.frontend.variable.*
import fuookami.ospf.kotlin.core.frontend.expression.monomial.*
import fuookami.ospf.kotlin.core.frontend.expression.polynomial.*
import fuookami.ospf.kotlin.core.frontend.expression.symbol.*
import fuookami.ospf.kotlin.core.frontend.expression.symbol.linear_function.*
import fuookami.ospf.kotlin.core.frontend.inequality.*
import fuookami.ospf.kotlin.core.frontend.model.mechanism.*
import fuookami.ospf.kotlin.core.backend.solver.*
import fuookami.ospf.kotlin.core.backend.solver.output.*
import org.adaptive.dop.domain.core.*
import org.adaptive.dop.domain.role.*
import org.adaptive.dop.infrastructure.ospf.OspfBoundaryAdapter

/**
 * 1. 目标阶数转换安全守卫 (Target Degree Check Guard)：
 * 当把可能包含二次项的 QuadraticPolynomial 降阶为 LinearPolynomial 时，
 * 若存在任何二次乘积项 (monomial.variable2 != null)，立即显式返回错误，严禁静默截断高阶项！
 */
object OspfDegreeCheckGuard {
    fun requireLinearPolynomial(
        quadPoly: QuadraticPolynomial,
        targetBackendName: String
    ): Ret<LinearPolynomial> {
        val nonlinearTerms = quadPoly.monomials.filter { it.variable2 != null }
        if (nonlinearTerms.isNotEmpty()) {
            val termDesc = nonlinearTerms.joinToString(", ") { "${it.coefficient}*${it.variable1.name}*${it.variable2?.name}" }
            return Failed(
                Err(
                    ErrorCode.ApplicationError,
                    "代数阶数越界错误 [ERR_DEGREE_EXCEEDED]: 目标后端 [$targetBackendName] 仅支持 1 阶线性表达式，" +
                    "但表达式包含 2 阶二次项 [$termDesc]。严禁静默截断高阶项，请显式启用已声明的近似线性化算子（如 ULP/BLP）！"
                )
            )
        }
        val linearPoly = MutableLinearPolynomial()
        for (m in quadPoly.monomials) {
            linearPoly += m.coefficient * m.variable1
        }
        linearPoly += quadPoly.constant
        return Ok(LinearPolynomial(linearPoly))
    }
}

/**
 * 2. 基于 OSPF LinearMetaModel 的排产建模管线：
 * 直接使用 OSPF 原生单位 (Kilogram / Ton)、FeedingSharedCore 双入口符号、SemiFunction 与 SlackFunction
 */
data class BuiltScheduleMetaModel(
    val metaModel: LinearMetaModel,
    val plannedFeedingSymA: Quantity<LinearExpressionSymbol>,
    val plannedFeedingSymB: Quantity<LinearExpressionSymbol>,
    val shortageSlackSym: SlackFunction
)

class SharedFeedingScheduleModelPipeline {

    fun buildScheduleMetaModel(
        specLineA: FeedingRuleSpec,
        specLineB: FeedingRuleSpec,
        actualFeedingInWindow: RoleScopedQuantity<ActualFactRole, Flt64>, // 当日已发生实际投料事实 (如 450 kg)
        sharedFeedingLimit: Quantity<Flt64>,                              // 共享投料口当日上限 (如 1000 kg 或 1.0 t)
        minLotSize: Quantity<Flt64>                                       // 产线最小起批量门槛 (如 100 kg)
    ): Ret<BuiltScheduleMetaModel> {
        // 1) 创建 OSPF 线性元模型容器 (LinearMetaModel)
        val metaModel = LinearMetaModel("DOP_APS_SharedFeeding_Schedule")

        // 2) 定义待求解任务的计划产出决策变量 (URealVar)，并注册到 metaModel
        val outputVarTask2A = URealVar("output_T2_lineA")
        val outputVarTask3B = URealVar("output_T3_lineB")
        metaModel.add(outputVarTask2A)
        metaModel.add(outputVarTask3B)

        // 3) 调用第 7 章共享业务核心的【运筹符号入口】，生成具名中间符号 Quantity<LinearExpressionSymbol>
        val plannedFeedingSymA = when (val r = FeedingSharedCore.buildSymbolicFeedingIntermediate(specLineA, outputVarTask2A)) {
            is Ok -> r.value
            is Failed -> return r
        }
        val plannedFeedingSymB = when (val r = FeedingSharedCore.buildSymbolicFeedingIntermediate(specLineB, outputVarTask3B)) {
            is Ok -> r.value
            is Failed -> return r
        }
        // 将具名中间符号注册进 OSPF LinearMetaModel，确保求解后可按名透明查询中间值取值！
        metaModel.add(plannedFeedingSymA.value)
        metaModel.add(plannedFeedingSymB.value)

        // 4) 直接使用 OSPF 内置的 SemiFunction (半连续函数符号) 表达“最小起批量约束”
        val alignedMinLotB = when (val r = OspfBoundaryAdapter.convertQuantitySafely(minLotSize, plannedFeedingSymB.unit)) {
            is Ok -> r.value.value
            is Failed -> return r
        }
        val semiFeedingB = SemiFunction(
            x = LinearPolynomial(plannedFeedingSymB.value),
            lb = alignedMinLotB,
            name = "semi_minLot_lineB_T3"
        )
        metaModel.add(semiFeedingB)

        // 5) 构建贯穿用例的核心动态硬约束：
        // actualFeedingInWindow + plannedFeedingRemaining[A] + plannedFeedingRemaining[B] <= feedingLimit
        // 使用 OSPF 原生单位 Kilogram 统一对齐所有质量项
        val actualKg = when (val r = OspfBoundaryAdapter.convertQuantitySafely(actualFeedingInWindow.quantity, Kilogram)) {
            is Ok -> r.value.value
            is Failed -> return r
        }
        val limitKg = when (val r = OspfBoundaryAdapter.convertQuantitySafely(sharedFeedingLimit, Kilogram)) {
            is Ok -> r.value.value
            is Failed -> return r
        }

        val totalFeedingInWindowPoly: LinearPolynomial =
            actualKg + plannedFeedingSymA.value + plannedFeedingSymB.value

        when (
            val addConstraintRes = metaModel.addConstraint(
                constraint = totalFeedingInWindowPoly leq limitKg,
                name = "c_shared_feeding_limit_lineAB_day1",
                displayName = "产线A与B当日共享投料口容量上限硬约束(${Kilogram.symbol})"
            )
        ) {
            is Ok -> {}
            is Failed -> return Failed(addConstraintRes.error)
        }

        // 6) 直接使用 OSPF 内置的 SlackFunction 表达“目标产量达成软约束与缺口惩罚”
        val targetTotalFeedingKg = Flt64(650.0)
        val feedingShortageSlack = SlackFunction.neg(
            x = plannedFeedingSymA.value + plannedFeedingSymB.value,
            y = LinearPolynomial(targetTotalFeedingKg),
            name = "slack_feeding_target_shortage"
        )
        metaModel.add(feedingShortageSlack)

        // 7) 注册最小化惩罚目标函数
        val penaltyWeight = Flt64(100.0)
        metaModel.minimize(
            expr = penaltyWeight * feedingShortageSlack,
            name = "obj_minimize_target_shortage"
        )

        return Ok(
            BuiltScheduleMetaModel(
                metaModel = metaModel,
                plannedFeedingSymA = plannedFeedingSymA,
                plannedFeedingSymB = plannedFeedingSymB,
                shortageSlackSym = feedingShortageSlack
            )
        )
    }
}

/**
 * 3. 基于 OSPF LinearMechanismModel 与 LinearSolver 接口的求解与中间值解析服务：
 * 彻底解耦具体求解器实现，并在求解后自动回填提取具名中间值 Quantity<Flt64>！
 */
data class SolvedScheduleDomainResult(
    val solverName: String,
    val status: SolverStatus,
    val objectiveValue: Flt64,
    val plannedFeedingLineA: Quantity<Flt64>,
    val plannedFeedingLineB: Quantity<Flt64>,
    val targetShortageSlackKg: Quantity<Flt64>
)

class OspfScheduleSolveService(
    private val solver: LinearSolver // 注入任意 OSPF 求解器插件（如 ScipLinearSolver / GurobiLinearSolver / CbcLinearSolver）
) {
    suspend fun compileAndSolve(built: BuiltScheduleMetaModel): Ret<SolvedScheduleDomainResult> {
        val metaModel = built.metaModel

        // 1) 调用 OSPF LinearMechanismModel 降阶编译器：自动展开 SemiFunction 与 SlackFunction
        val mechanismModel = when (val compileRes = LinearMechanismModel(metaModel)) {
            is Ok -> compileRes.value
            is Failed -> return Failed(compileRes.error)
        }

        // 2) 调用 OSPF LinearSolver 插件执行求解
        val solverOutput: FeasibleSolverOutput = when (val solveRes = solver(mechanismModel)) {
            is Ok -> solveRes.value
            is Failed -> return Failed(solveRes.error)
        }

        // 3) 将求解器返回的解向量回填至 metaModel.tokens
        metaModel.tokens.setSolution(solverOutput.solution)

        // 4) 直接通过具名中间符号求值，获得带 OSPF 原生单位的透明业务中间值结果！
        val feedingValA = built.plannedFeedingSymA.value.polynomial.evaluate(
            results = solverOutput.solution,
            tokenList = metaModel.tokens
        ) ?: return Failed(Err(ErrorCode.ApplicationError, "无法解析中间符号 [${built.plannedFeedingSymA.value.name}] 的解值"))

        val feedingValB = built.plannedFeedingSymB.value.polynomial.evaluate(
            results = solverOutput.solution,
            tokenList = metaModel.tokens
        ) ?: return Failed(Err(ErrorCode.ApplicationError, "无法解析中间符号 [${built.plannedFeedingSymB.value.name}] 的解值"))

        val slackVal = built.shortageSlackSym.polynomial.evaluate(
            results = solverOutput.solution,
            tokenList = metaModel.tokens
        ) ?: Flt64.zero

        return Ok(
            SolvedScheduleDomainResult(
                solverName = solver.name,
                status = solverOutput.status,
                objectiveValue = solverOutput.obj,
                plannedFeedingLineA = Quantity(feedingValA, built.plannedFeedingSymA.unit),
                plannedFeedingLineB = Quantity(feedingValB, built.plannedFeedingSymB.unit),
                targetShortageSlackKg = Quantity(slackVal, Kilogram)
            )
        )
    }
}
```

---

## 本卷小结：从“各说各话的黑盒”到“同源可证的语义底座”

回顾整个第二卷（第 5～8 章），我们站在 `ospf-kotlin` 开源基础设施的肩膀上，完成了一次从顶层领域语义到底层数学与编译底座的彻底重构：
* 在**第 5 章**中，我们确立了以**形式化领域模型**作为系统、运筹优化、机器学习与智能体四方共享的唯一语义契约，通过数值、符号、统计与语义四种正交解释，以及基于 `ospf` 原生 `Quantity` 与 `Ret` 构建的 `RoleScopedQuantity` 状态角色强类型隔离，终结了业务口径分裂；
* 在**第 6 章**中，我们直接复用 `ospf-kotlin` 的**代数化数值层次（`RealNumber` / `Flt64` / `FltX` / `Rtn64`）**与**原生物理量纲单位系统（`Kilogram` / `Ton` / `Hour` / `Minute` / `Celsius`）**，并通过 `OspfBoundaryAdapter` 将底层 `null` 与断言异常统一适配为显式 `Ret<T>` 错误契约，拆除了裸 `Double` 浮点数与跨系统单位错配的定时炸弹；
* 在**第 7 章**中，我们依托 `ospf-kotlin` 的**多项式与具名中间符号（`LinearPolynomial` / `LinearExpressionSymbol`）**构建了共享业务核心的**数值/符号双入口架构**，配合安全部分求值、三值逻辑、冻结符号顺序的编译求值器与自动化等价性性质测试，从数学与代码上保证了系统计算与算法模型 100% 口径一致；
* 在**第 8 章**中，我们利用 `ospf-kotlin` 内置的高阶函数算子（`SemiFunction` / `SlackFunction` / `ULPFunction` / `IfThenFunction`）、**目标阶数安全检查守卫**以及**类编译器求解器解耦架构（`LinearMetaModel` → `LinearMechanismModel` → `LinearSolver`）**，让复杂的工业业务规则既能像搭积木一样直观表达，又能安全、无锁定地编译到各类求解器后端。

现在，我们已经拥有了一套静态结构极其坚固的“世界语言与数学底座”。但是，真实的工厂与供应链并不是静止的——订单在变、设备在延误、计划员在调整，新的事件每分每秒都在发生。这套形式化领域模型如何在时间长河中记住过去发生的一切（事件溯源）、如何动态推演未来的每一秒变化（数字孪生）、如何白盒驾驭列生成与 Benders 分解等超大规模工业求解，并在无解或有解时给出令计划员信服的“自解释诊断报告”？

让我们翻开**第三卷：工程支柱与世界模型篇**，将这套形式化底座注入流动的运行时间轴之中。
