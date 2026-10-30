# 第 6 章：初识 OSPF —— 面向软件工程师的代数化数值与量纲安全底座

在第 5 章中，我们明确了“形式化领域模型”必须同时支撑系统侧的数值计算与运筹优化侧的符号求解。然而，在真实的软件工程实践中，如果仅仅在架构文档里规定“大家要共享同一套领域概念”，而在写代码时依然让业务系统直接操作裸 `Double` 浮点数、让各个算法模块各自临时拼凑一套数学运算类型，那么所谓的“形式化领域模型”很快就会退化为纸面上的同名口号。

为了把形式化领域模型真正落到实处，项目需要一层**纯计算、可组合、求解器无关的基础数学与建模框架**，把“数值是什么、物理单位是否兼容、代数表达式如何组合、符号如何代入求值、结构化约束如何生成、求解失败如何正交解释”等底层共性能力彻底统一起来。开源运筹与形式化建模框架 **`ospf`**（`ospf-kotlin`）正是为此而生的核心技术底座。

本章将带你深入 `ospf` 底座的第一层基石：**代数化数值类型层次（`RealNumber`）**与**原生物理量纲单位安全系统（`Quantity` / `PhysicalUnit`）**，并展示如何在领域与算法边界构建显式错误契约适配器。

---

## 6.1 为什么在工业软件里直接用裸 `Double` 浮点数写公式是一颗定时炸弹？

翻开大多数传统 ERP、APS 或 MES 系统的源代码，你会看到成千上万行直接用编程语言原生浮点数（如 `Double`、`Float`）或无量纲约束的 `BigDecimal` 编写的业务公式：

```kotlin
// 传统贫血代码中的典型裸数值写法（隐患重重）
val requiredFeeding: Double = orderQty * bomRatio * (1.0 + scrapRate)
val productionHours: Double = orderQty / machineCapacity + changeoverMinutes
```

这段看似再普通不过的代码，在严肃的工业计算与运筹优化场景下，实则埋藏着三颗随时可能引爆的定时炸弹：

### 1. 精度、容差与舍入策略隐式散落，悄悄篡改业务规则
IEEE 754 双精度浮点数（`Double`）在表示十进制小数（如 `0.1 + 0.2`）时存在天然的二进制精度误差。在排产与物料核算中，判断“库存是否齐套（`available >= required`）”、“约束是否紧绑定（`lhs == rhs`）”或“物料配比采用向上取整还是四舍五入”，对数值精度、比较容差（Tolerance / Epsilon）和舍入策略（Rounding Mode）极其敏感。当开发者直接在各处代码里裸写 `Double` 运算或随手硬编码 `1e-6` 时，不同的服务模块与求解器脚本就会采用各自隐式的精度与舍入逻辑，导致**原本属于底层技术的精度与舍入处理，在不知不觉中演变成了不一致的隐式业务规则**。

### 2. 整数、有理数、浮点数与任意精度数无法泛型复用同一套业务公式
在不同的计算场景下，同一个业务公式往往需要运行在不同的数值域上：
* 在常规快速推演中，为了追求吞吐性能，系统可能使用 64 位浮点数（如 `ospf` 的 `Flt64`）；
* 在涉及财务成本核算、严格的配比守恒或病态数值矩阵校验时，系统又需要切换为精确的有理数（如 `ospf` 的 `Rtn64` / `RtnX`）或任意精度十进制数（如 `ospf` 的 `FltX`），以彻底消除浮点截断误差；
* 而在整箱包装或人员排班计算中，则要求严格的整数（如 `Int64` / `IntX`）代数运算。
如果业务公式被硬编码死在裸 `Double` 类型上，一旦需要切换数值精度能力，研发团队就不得不把整套领域计算公式复制重写一遍。

### 3. 物理量纲完全隐形，“千克加小时”也能顺利通过编译
仔细看上面那行传统代码：`val productionHours: Double = orderQty / machineCapacity + changeoverMinutes`。其中，`orderQty / machineCapacity` 算出来的是“小时（`Hour`）”，而后面的 `changeoverMinutes` 却是“分钟（`Minute`）”！因为两者在代码里都是裸 `Double` 类型，编译器认为“浮点数加浮点数”完全合法，连一个警告都不会报。这种因为单位量纲缺失导致的错配，在跨系统（如 ERP 按“吨”下发订单、WMS 按“千克”管理库存、MES 按“克/秒”上报流量）集成时比比皆是，全靠程序员肉眼排查。

---

## 6.2 代数化数值类型层次（`RealNumber`）：整数、有理数、浮点数与任意精度数的泛型抽象及精度容差治理

为了拔除裸 `Double` 的第一和第二颗炸弹，基础框架首先必须将“数值运算能力”从具体的底层存储类型中抽象出来，建立一套严谨的**代数化数值类型层次**。

在 `ospf-kotlin` 的 `fuookami.ospf.kotlin.utils.math` 包中，已经原生提供了一套按加法结构、环、域、标量与有序实数（`RealNumber`）组织的泛型数值层次：

![OSPF (fuookami.ospf.kotlin.utils.math) 代数化数值类型层次，向下分为三支：整数系 IntegerNumber 含 Int32 / Int64 / Int8、UInt32 / UInt64、IntX (任意精度大整数)；有理数系 RationalNumber 含 Rtn64 (64位精确有理数)、RtnX (任意精度有理数)；实数/浮点系 RealNumber / FloatingNumber 含 Flt32 / Flt64 (带精度容差 ep 的浮点数)、FltX (基于 BigDecimal 的任意精度实数)。](assets/diagrams/chapter-06-1.svg)

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

## 6.3 物理量纲与单位安全（`Quantity` / `PhysicalUnit`）：让“重量加时间”或单位错配在校验期直接显式失败

拔除了裸浮点数的精度隐患后，接下来我们要解决更致命的第三颗炸弹——**物理量纲与单位错配**。

在 `ospf-kotlin` 的 `fuookami.ospf.kotlin.utils.physics` 包中，原生提供了结构化的物理量类型 **`Quantity<T>`（数量）** 与 **`PhysicalUnit`（物理单位）**。任何一个具有物理或业务度量的数值，都不再是一个孤立的数字，而是由**“代数数值（`value: T`）+ 原生物理单位（`unit: PhysicalUnit`，内含基本量纲向量 `Dimension` 与换算尺度）”**共同组成的不可变结构化值对象。

这套量纲与单位安全机制为企业软件筑起了三道坚固的防线：

### 1. 不兼容量纲运算在编译期或构建校验期直接显式失败
每一个 `ospf` 原生 `PhysicalUnit`（如 `Kilogram`、`Ton`、`Hour`、`Minute`、`Meter`、`Celsius`）都绑定了明确的物理量纲维度（`Dimension`）。当代码中试图对两个 `Quantity` 执行加减或大小比较运算（如 `plannedFeeding + changeoverTime`）时，`ospf` 会首先检查二者的 `unit.dimension` 是否一致；若试图把“千克（`Kilogram`）”与“分钟（`Minute`）”相加，通过 `OspfBoundaryAdapter.addQuantitiesSafely(...)` 将**立即显式返回 `ErrorCode.DimensionMismatch` 错误**，绝不允许静默算出一个毫无物理意义的荒谬数字。

### 2. 乘除、幂与倒数运算自动推导复合量纲
在计算生产时长、物料消耗率或物流运输成本时，不同量纲的数值经常需要相乘或相除。`ospf` 的 `Quantity` 与 `PhysicalUnit` 原生支持量纲代数运算：
* **乘除产生复合量纲**：当“合格产量（`Kilogram`）”除以“实际耗时（`Hour`）”时，结果自动携带复合单位 `Kilogram / Hour`（即生产率量纲）；当“生产率（`Kilogram / Hour`）”乘以“生产时长（`Hour`）”时，时间量纲自动约分抵消，结果可精准对齐回 `Kilogram`；
* **幂与倒数推导**：面积（`Meter.pow(2)`）、体积（`CubicMeter` 或 `Meter.pow(3)`，如 WMS 库位容积与 TMS 车厢体积）以及节拍频率（`Second.reciprocal()`）均可由基础单位通过幂运算与倒数运算自然衍生并保持全程量纲追踪。

### 3. 符号变量与数学约束同样携带物理单位
在传统运筹建模中，一旦进入求解器构造表达式，单位就彻底消失了，只剩下一堆无量纲的数学符号 $x_1 + x_2 \le b$。而在 `ospf-kotlin` 支撑的形式化领域模型中，`Quantity<T>` 的泛型参数不仅可以是具体数值 `Flt64`，还可以直接包装运筹决策变量或中间符号（例如 `Quantity(plannedFeedingSymbol, Kilogram)`）！这意味着**不仅系统侧的具体数值携带单位，运筹侧的决策变量、中间值表达式乃至整个等式/不等式约束都完整保留物理单位**。

---

## 6.4 线性换算与仿射转换：跨系统（ERP/APS/MES/WMS）单位口径的统一收敛

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
