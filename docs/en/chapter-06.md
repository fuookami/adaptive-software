<!-- i18n-status: translated -->
<!-- i18n-source: docs/zh/chapter-06.md -->
# Chapter 6: First Look at OSPF — An Algebraic Numeric and Dimension-Safety Foundation

In Chapter 5 we established that a formal domain model must support both numeric computation on the system side and symbolic solving on the operations-research side. Yet in real software engineering practice, if architecture documents merely decree that "everyone must share one set of domain concepts" while the code still lets business systems operate on bare `Double` floating-point numbers and lets each algorithm module improvise its own set of mathematical operation types, then the so-called formal domain model soon degrades into a slogan that exists only on paper.

To put the formal domain model on a real footing, the project needs a foundation layer that is **pure computation, composable and solver-agnostic**, unifying once and for all such low-level common capabilities as what a number is, whether physical units are compatible, how algebraic expressions compose, how symbols are substituted and evaluated, how structured constraints are generated, and how a solve failure is explained orthogonally. The open-source operations-research and formal modeling framework **`ospf`** (`ospf-kotlin`) is the core technical foundation built for exactly this purpose.

This chapter takes you into the first cornerstone of the `ospf` foundation: the **algebraic numeric type hierarchy (`RealNumber`)** and the **native physical dimension and unit safety system (`Quantity` / `PhysicalUnit`)**, and shows how to build explicit error-contract adapters at the domain/algorithm boundary.

---

## 6.1 Why is writing formulas with bare `Double` floating-point numbers a time bomb in industrial software?

Open the source code of most traditional ERP, APS or MES systems and you will see thousands of lines of business formulas written directly on the programming language's native floating-point numbers (such as `Double` or `Float`) or on dimensionless `BigDecimal` constraints:

```kotlin
// Typical bare-numeric style in traditional anemic code (hazard upon hazard)
val requiredFeeding: Double = orderQty * bomRatio * (1.0 + scrapRate)
val productionHours: Double = orderQty / machineCapacity + changeoverMinutes
```

This seemingly ordinary piece of code actually conceals three time bombs that may go off at any moment in serious industrial computation and operations-research optimization scenarios:

### 1. Precision, tolerance and rounding policies are scattered implicitly, quietly rewriting business rules
IEEE 754 double-precision floating-point numbers (`Double`) carry an inherent binary representation error when representing decimal fractions (such as `0.1 + 0.2`). In scheduling and material accounting, judging whether inventory is kitted (`available >= required`), whether a constraint is binding (`lhs == rhs`), or whether a material ratio rounds up or rounds to nearest is extremely sensitive to numeric precision, comparison tolerance (Tolerance / Epsilon) and rounding mode. When developers write bare `Double` operations all over the code or casually hard-code `1e-6`, different service modules and solver scripts each adopt their own implicit precision and rounding logic, so that **precision and rounding handling, in itself a low-level technical concern, silently turns into inconsistent implicit business rules**.

### 2. Integers, rational numbers, floating-point numbers and arbitrary-precision numbers cannot share the same business formula generically
In different computation scenarios, the same business formula often needs to run over different numeric domains:
* For ordinary fast projection, the system may use 64-bit floating-point numbers (such as `Flt64` in `ospf`) in pursuit of throughput;
* For financial cost accounting, strict ratio conservation or ill-conditioned numeric matrix validation, the system needs to switch to exact rational numbers (such as `Rtn64` / `RtnX` in `ospf`) or arbitrary-precision decimal numbers (such as `FltX` in `ospf`), eliminating floating-point truncation error once and for all;
* For full-case packaging or workforce scheduling, strict integer (such as `Int64` / `IntX`) algebraic operations are required.

If the business formula is hard-coded to the bare `Double` type, then the moment numeric precision capability has to change, the engineering team must copy and rewrite the entire set of domain computation formulas.

### 3. Physical dimensions are entirely invisible, so "kilograms plus hours" compiles just fine
Look closely at that line of traditional code: `val productionHours: Double = orderQty / machineCapacity + changeoverMinutes`. There, `orderQty / machineCapacity` yields "hours (`Hour`)", while `changeoverMinutes` behind it is "minutes (`Minute`)"! Because both are bare `Double` in the code, the compiler considers "floating-point plus floating-point" perfectly legal and does not raise even one warning. Such mismatches from missing unit dimensions abound when systems are integrated (ERP issues orders in "tons", WMS manages inventory in "kilograms", MES reports flow in "grams per second"), and only a programmer's naked eye can catch them.

---

## 6.2 The algebraic numeric type hierarchy (`RealNumber`): a generic abstraction over integers, rationals, floats and arbitrary-precision numbers, and precision-tolerance governance

To defuse the first and second bombs of bare `Double`, the foundation framework must first abstract numeric computation capability away from any concrete underlying storage type and establish a rigorous **algebraic numeric type hierarchy**.

The `fuookami.ospf.kotlin.utils.math` package of `ospf-kotlin` already ships a generic numeric hierarchy organized by additive structure, ring, field, scalar and ordered real number (`RealNumber`):

![The OSPF (fuookami.ospf.kotlin.utils.math) algebraic numeric type hierarchy, branching downward into three arms: the integer family IntegerNumber with Int32 / Int64 / Int8, UInt32 / UInt64 and IntX (arbitrary-precision big integer); the rational family RationalNumber with Rtn64 (64-bit exact rational) and RtnX (arbitrary-precision rational); the real / floating-point family RealNumber / FloatingNumber with Flt32 / Flt64 (floating-point numbers carrying the precision tolerance ep) and FltX (arbitrary-precision real based on BigDecimal).](assets/diagrams/chapter-06-1.svg)

This algebraic numeric foundation follows three core principles in its engineering design:

1. **Business formulas depend on the algebraic capability they need, not on bare `Double`**: when writing domain computation models (such as BOM consumption multiplication chains or linear capacity conversion), function signatures depend on algebraic capability interfaces such as `RealNumber<T>` in `ospf` rather than being bound to bare `Double`. One validated domain formula can then be injected with `Flt64` for extreme performance in high-frequency online simulation, or with `Rtn64` (rational) or `FltX` (arbitrary precision) for rigorous audit or equivalence verification, switching seamlessly with zero code changes.
2. **Constants, bounds, precision, tolerance, rounding and type-conversion policies are all provided explicitly**: every `ospf` numeric type exposes, through companion constants (`RealNumberConstants<T>`), the additive identity (`zero`), the multiplicative identity (`one`), lower and upper bounds (`min` / `max`), machine precision (`ep` / `decimalPrecision`), and controlled tolerance comparison operators (`eq`, `neq`, `ls`, `leq`, `gr`, `geq`). Whether two real numbers are equal, or whether the slack of some constraint is zero, is decided uniformly through the `eq` tolerance operator; bare `==` is never written in business code.
3. **At the domain/algorithm boundary, `null`, `require` and exceptions are adapted into the unified explicit error contract `Ret<T>`**: the architecture standard states explicitly that low-level interfaces inside `ospf` which signal failure with `null`, `require` or exceptions should be adapted at the domain/algorithm boundary into the project's unified explicit error contract (`Ret<T>` / `Ok` / `Failed`).

The code below gives the generic algebraic formula style written directly against `ospf-kotlin`, together with a complete implementation of the **boundary explicit error adapter (`OspfBoundaryAdapter`)**:

```kotlin
package org.adaptive.dop.infrastructure.ospf

import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.physics.unit.*
import fuookami.ospf.kotlin.utils.physics.quantity.*
import fuookami.ospf.kotlin.utils.error.*
import fuookami.ospf.kotlin.utils.functional.*

/**
 * 1. Generic algebraic operations over OSPF RealNumber<T>:
 * business formulas depend only on RealNumber<T> algebraic capability, so Flt64, FltX or Rtn64 can be passed in seamlessly.
 */
object OspfGenericMathOperations {

    @Suppress("UNCHECKED_CAST")
    fun <T : RealNumber<T>> computeEffectiveMultiplier(
        bomRatio: T,
        scrapRate: T,
        constants: RealNumberConstants<T>
    ): Ret<T> {
        // Validate the scrap-rate range [0, 1) with OSPF RealNumber's built-in tolerance comparison operators (ls: <, geq: >=)
        if ((scrapRate ls constants.zero) || (scrapRate geq constants.one)) {
            return Failed(
                Err(ErrorCode.IllegalArgument, "Scrap rate scrapRate ($scrapRate) must lie in the half-open interval [0, 1)")
            )
        }
        val denominator = (constants.one - scrapRate) as T
        // Use OSPF's built-in tolerance equality operator eq to test whether the denominator is zero within tolerance
        if (denominator eq constants.zero) {
            return Failed(Err(ErrorCode.DivideByZero, "Effective yield denominator (1 - scrapRate) is zero within tolerance"))
        }
        return Ok((bomRatio / denominator) as T)
    }
}

/**
 * 2. Explicit error-contract adapter for the OSPF domain/algorithm boundary (OspfBoundaryAdapter):
 * adapts interfaces inside OSPF that may return null, trigger require(IllegalArgumentException) or raise arithmetic
 * exceptions into an immutable Ret<T> (Ok / Failed), 100% of the time, preventing exception leaks or null-pointer seepage into the domain layer.
 */
object OspfBoundaryAdapter {

    inline fun <T> safeCall(
        errorCodeOnNullOrException: ErrorCode = ErrorCode.ApplicationError,
        nullMessage: String = "OSPF low-level operation returned null; check physical dimension compatibility or symbol binding",
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
            Failed(Err(ErrorCode.IllegalArgument, "OSPF precondition assertion failed (require): ${e.message}"))
        } catch (e: ArithmeticException) {
            Failed(Err(ErrorCode.DivideByZero, "OSPF numeric arithmetic exception: ${e.message}"))
        } catch (e: Exception) {
            Failed(Err(errorCodeOnNullOrException, "OSPF boundary call exception: ${e.message}"))
        }
    }

    /** Unit-safe conversion with explicit errors: wraps OSPF's native Quantity.to(targetUnit): Quantity? */
    fun <T : RealNumber<T>> convertQuantitySafely(
        source: Quantity<T>,
        targetUnit: PhysicalUnit
    ): Ret<Quantity<T>> {
        if (source.unit.dimension != targetUnit.dimension) {
            return Failed(
                Err(
                    ErrorCode.DimensionMismatch,
                    "Physical dimensions incompatible: cannot convert [${source.unit.name} (${source.unit.symbol})] to [${targetUnit.name} (${targetUnit.symbol})]"
                )
            )
        }
        return safeCall(
            errorCodeOnNullOrException = ErrorCode.DimensionMismatch,
            nullMessage = "Unit conversion failed: ${source.unit.symbol} -> ${targetUnit.symbol}"
        ) {
            source.to(targetUnit)
        }
    }

    /** Explicit-error version of adding same-dimension quantities: calls OSPF Quantity.plus directly and aligns to the target unit */
    fun <T : RealNumber<T>> addQuantitiesSafely(
        lhs: Quantity<T>,
        rhs: Quantity<T>,
        targetUnit: PhysicalUnit = lhs.unit
    ): Ret<Quantity<T>> {
        if (lhs.unit.dimension != rhs.unit.dimension) {
            return Failed(
                Err(ErrorCode.DimensionMismatch, "Left and right operands of the addition have incompatible dimensions: ${lhs.unit.symbol} vs ${rhs.unit.symbol}")
            )
        }
        return safeCall(ErrorCode.DimensionMismatch, "Adding same-dimension quantities or aligning units failed") {
            (lhs + rhs)?.to(targetUnit)
        }
    }

    /** Explicit-error version of dividing quantities across dimensions: calls OSPF Quantity.div directly and aligns to the expected composite unit */
    fun <T : RealNumber<T>> divideQuantitiesSafely(
        dividend: Quantity<T>,
        divisor: Quantity<T>,
        expectedTargetUnit: PhysicalUnit
    ): Ret<Quantity<T>> {
        if (divisor.value eq divisor.value.constants.zero) {
            return Failed(Err(ErrorCode.DivideByZero, "Quantity division error: divisor [$divisor] is zero"))
        }
        return safeCall(
            errorCodeOnNullOrException = ErrorCode.DimensionMismatch,
            nullMessage = "Cross-dimension division result unit [${dividend.unit.symbol}/${divisor.unit.symbol}] cannot be converted to the target unit [${expectedTargetUnit.symbol}]"
        ) {
            (dividend / divisor).to(expectedTargetUnit)
        }
    }
}
```

---

## 6.3 Physical dimensions and unit safety (`Quantity` / `PhysicalUnit`): making "weight plus time" or unit mismatch fail explicitly at validation time

Having defused the precision hazards of bare floating-point numbers, we now turn to the more lethal third bomb — **physical dimension and unit mismatch**.

The `fuookami.ospf.kotlin.utils.physics` package of `ospf-kotlin` natively provides the structured physical quantity type **`Quantity<T>` (quantity)** and **`PhysicalUnit` (physical unit)**. Any value with a physical or business measure is no longer an isolated number but an immutable structured value object made of **an algebraic numeric value (`value: T`) plus a native physical unit (`unit: PhysicalUnit`, which contains the base-dimension vector `Dimension` and the conversion scale)**.

This dimension and unit safety mechanism builds three solid lines of defense for enterprise software:

### 1. Incompatible dimension operations fail explicitly at compile time or build-validation time
Every native `ospf` `PhysicalUnit` (such as `Kilogram`, `Ton`, `Hour`, `Minute`, `Meter` or `Celsius`) binds an explicit physical dimension (`Dimension`). When code tries to add, subtract or compare two `Quantity` values (such as `plannedFeeding + changeoverTime`), `ospf` first checks whether their `unit.dimension` agree; an attempt to add "kilograms (`Kilogram`)" to "minutes (`Minute`)" through `OspfBoundaryAdapter.addQuantitiesSafely(...)` **immediately returns an explicit `ErrorCode.DimensionMismatch` error**, and a physically meaningless absurd number is never silently produced.

### 2. Multiplication, division, exponentiation and reciprocal automatically derive composite dimensions
Computing production duration, material consumption rate or logistics transport cost frequently requires multiplying or dividing values of different dimensions. `ospf`'s `Quantity` and `PhysicalUnit` natively support dimension algebra:
* **Multiplication and division produce composite dimensions**: dividing "conforming output (`Kilogram`)" by "actual elapsed time (`Hour`)" yields a result that automatically carries the composite unit `Kilogram / Hour` (that is, the productivity dimension); multiplying "productivity (`Kilogram / Hour`)" by "production duration (`Hour`)" cancels the time dimension automatically, so the result can be aligned precisely back to `Kilogram`;
* **Powers and reciprocals are derived**: area (`Meter.pow(2)`), volume (`CubicMeter` or `Meter.pow(3)`, such as WMS bin capacity and TMS trailer volume) and takt frequency (`Second.reciprocal()`) all derive naturally from base units through exponentiation and reciprocal operations, with dimension tracking maintained throughout.

### 3. Symbolic variables and mathematical constraints also carry physical units
In traditional optimization modeling, units vanish completely once expressions enter the solver, leaving a pile of dimensionless mathematical symbols $x_1 + x_2 \le b$. In the formal domain model supported by `ospf-kotlin`, however, the generic parameter of `Quantity<T>` can be not only a concrete number `Flt64` but also an operations-research decision variable or intermediate symbol wrapped directly (for example `Quantity(plannedFeedingSymbol, Kilogram)`)! This means that **not only do concrete values on the system side carry units; decision variables, intermediate expressions and entire equality and inequality constraints on the operations-research side also retain physical units in full**.

---

## 6.4 Linear and affine conversion: converging unit conventions across systems (ERP/APS/MES/WMS)

When integrating a digital operations platform (DOP) that spans ERP, APS, MES, WMS and TMS, even when two fields belong to the same physical dimension (both mass, say, or both temperature), the concrete measurement units used by different subsystems and business steps often differ.

`ospf-kotlin`'s `Quantity` / `PhysicalUnit` system natively provides a rigorous **same-dimension conversion engine**, and separates conversion rules strictly into two kinds, **linear conversion (Linear Conversion)** and **affine conversion (Affine Conversion)**:

| Conversion type | Mathematical form | Typical industrial and supply-chain scenarios (native OSPF units) | Framework safety boundary and hard rules against error |
| :--- | :--- | :--- | :--- |
| **Linear conversion**<br>(Linear Conversion) | $y = k \cdot x$<br>(shared absolute zero; only the scale differs) | • **Mass**: `Ton` ↔ `Kilogram` ↔ `Gram`<br>• **Time**: `Day` ↔ `Hour` ↔ `Minute` ↔ `Second`<br>• **Volume**: `CubicMeter` ↔ `Liter` | Same-dimension addition, subtraction and proportional scaling are free, and values can be multiplied or divided directly with other dimensions to build composite units (for example `Ton / Day` converts automatically to `Kilogram / Hour`). |
| **Affine conversion**<br>(Affine Conversion) | $y = k \cdot x + b$<br>(the zero point carries an offset $b \neq 0$) | • **Temperature**: `Celsius` ↔ `Fahrenheit` ↔ `Kelvin` (such as reactor temperature control in chemicals, cold-chain WMS storage and cold-chain TMS transport temperature-zone constraints) | **Strictly forbidden to treat affine units as ordinary proportional units in multiplication or division** (for example, "20°C times 2 is absolutely not 40°C")! Absolute temperature conversion is kept strictly apart from proportional scaling, so affine-conversion accidents are ruled out by types and operation rules. |

More importantly, by gathering dimensions and unit conversion into the `ospf` foundation framework and the domain layer, we establish a crucial engineering governance principle: **unit conversion logic is never to be written separately in data transfer objects (DTOs), algorithm preprocessing scripts and solver adapters**.

The code below implements cross-system computation and dimension safety validation using 100% native `ospf-kotlin` unit objects (`Ton`, `Kilogram`, `Hour`, `Minute`, `Kilogram / Hour`):

```kotlin
package org.adaptive.dop.domain.physics

import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.physics.unit.*
import fuookami.ospf.kotlin.utils.physics.quantity.*
import fuookami.ospf.kotlin.utils.functional.*
import org.adaptive.dop.infrastructure.ospf.OspfBoundaryAdapter

object CrossSystemUnitConvergenceService {
    /**
     * Pure-function computation of cross-system production duration and total occupied time (100% using OSPF native PhysicalUnit):
     *  - plannedOutputMass: planned output weight of the ERP order, for example Quantity(Flt64(1.2), Ton)
     *  - effectiveProductivity: approved and activated effective capacity, for example Quantity(Flt64(400.0), Kilogram / Hour)
     *  - changeoverTime: MES/process changeover time, for example Quantity(Flt64(30.0), Minute)
     * Output: the operation's total occupied duration as Ret<Quantity<Flt64>>, aligned uniformly to the OSPF native unit Hour
     */
    fun calculateTotalTaskElapsedHours(
        plannedOutputMass: Quantity<Flt64>,
        effectiveProductivity: Quantity<Flt64>,
        changeoverTime: Quantity<Flt64>
    ): Ret<Quantity<Flt64>> {
        // 1. Output (say 1.2 Ton) / productivity (say 400 Kilogram / Hour) -> OSPF derives the dimension automatically and converts to Hour (3.0 h)
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

        // 2. Production duration (3.0 Hour) + changeover duration (say 30 Minute) -> OSPF converts and aligns automatically to 3.5 Hour
        return OspfBoundaryAdapter.addQuantitiesSafely(
            lhs = productionDurationHours,
            rhs = changeoverTime,
            targetUnit = Hour
        )
    }

    /** Verify automatic cross-system unit convergence and interception of illegal dimensions */
    fun verifyCrossSystemUnitSafety() {
        val outputMass = Quantity(Flt64(1.2), Ton)                     // 1.2 tons
        val productivity = Quantity(Flt64(400.0), Kilogram / Hour)     // 400 kilograms per hour
        val changeover = Quantity(Flt64(30.0), Minute)                 // 30 minutes

        // Normal cross-system conversion: 1.2 t / (400 kg/h) + 30 min = 3.0 h + 0.5 h = 3.5 h
        val totalHours = (calculateTotalTaskElapsedHours(outputMass, productivity, changeover) as Ok).value
        check(totalHours.value eq Flt64(3.5))
        check(totalHours.unit == Hour)

        // Illegal dimension interception: trying to add "weight (Ton)" and "time (Minute)" directly -> must explicitly return Failed(DimensionMismatch)
        val illegalAdd = OspfBoundaryAdapter.addQuantitiesSafely(outputMass, changeover)
        check(illegalAdd is Failed)
    }
}
```
