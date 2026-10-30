<!-- i18n-status: translated -->
<!-- i18n-source: docs/zh/chapter-07.md -->
# Chapter 7: One Fish, Two Dishes — A Shared Expression IR with Two Entry Points

In Chapters 5 and 6 we saw that a formal domain model requires one and the same business rule (for example "feeding quantity calculation," "projected material consumption," "changeover time calculation" or "capacity occupancy calculation") to support both deterministic **numeric computation** on the business-system side and solver-oriented **symbolic modeling** on the operations-research side.

Yet in traditional software engineering practice, "numeric computation" and "symbolic modeling" seem to live in two parallel universes. This chapter dissects the root cause of that split and shows how to use `ospf-kotlin`'s **unified expression and polynomial intermediate representation (`LinearMonomial` / `LinearPolynomial` / `LinearExpressionSymbol`)**, its **shared-business-core dual-entry architecture** and its **partial evaluation and compiled evaluation techniques** to genuinely realize a "one fish, two dishes" architecture: one business-rule definition that drives system-side numeric evaluation and operations-research symbolic solving at the same time.

---

## 7.1 The pain of the split in traditional R&D: backend programmers compute material consumption in business code, and algorithm engineers rewrite the feeding constraint in a script

Let us look at a daily R&D scenario that plays out in almost every manufacturing company: defining the rule for **"the material feeding consumption of a work-order task within a specified time window."**

Under the traditional development model, this rule is split into two entirely different pieces of code and handed to two teams to implement separately:

* **The first piece of code (written by the system backend team)**: to show projected material consumption on the scheduling workbench, or to recompute consumption after substitute-material allocation has updated a task's feeding, the backend engineer writes a function in the Service layer in Java/Kotlin that operates directly on concrete numeric values (`Double`):
  ```kotlin
  // System side: pass in concrete numbers and get one concrete consumption figure back
  fun calcFeedingAmount(outputQty: Double, bomRatio: Double, scrapRate: Double): Double {
      return outputQty * bomRatio / (1.0 - scrapRate)
  }
  ```
* **The second piece of code (written by the operations-research algorithm team)**: to guarantee during the scheduling solve that "the planned feeding quantities of line A and line B together do not exceed the shared feeding port limit `feedingLimit`," the algorithm engineer calls the API of a specific solver (such as Cplex, Gurobi or OR-Tools) inside the algorithm service and assembles a linear expression from decision variables:
  ```python
  # Algorithm side: operate on solver-specific variable handles and assemble a mathematical constraint object
  expr_a = solver.ScalProd([var_output_qty_a], [bom_ratio_a * (1.0 + scrap_rate_a)])
  expr_b = solver.ScalProd([var_output_qty_b], [bom_ratio_b * (1.0 + scrap_rate_b)])
  solver.Add(expr_a + expr_b <= feeding_limit)
  ```

Look closely at those two pieces of code — **the disaster has already happened, quietly**!

In the backend code the scrap rate uses the **division convention** `bomRatio / (1.0 - scrapRate)`; in the script written by the algorithm engineer the same scrap rate is written with the **multiplicative approximation** `bom_ratio * (1.0 + scrap_rate)`!

With `scrapRate = 10%`, the system computes a required-feeding coefficient of `1 / 0.9 = 1.1111...`, while the coefficient used in the solve is `1.10`. The result: the operations-research algorithm happily returns an optimal schedule that "fully satisfies the 1000 kg feeding port limit," but when that plan travels back to the business system and projected material consumption is recomputed under the system's convention, total feeding comes out as `1010 kg` and immediately raises an over-limit alarm on the production floor!

This is the typical disaster of **lacking a unified foundation for numeric and symbolic computation, so that one formula is reimplemented in system code, in algorithm expressions and in the solver adapter**. As long as numeric computation and symbolic modeling are two independently written pieces of code, no number of alignment meetings and no number of interface-document pages will let the compiler stop a unit mismatch or a formula fork.

---

## 7.2 The OSPF expression intermediate representation (`Expression IR`): constants, stable symbol identity, attribute paths and an immutable syntax tree

To eliminate "two sets of formula code" at the root, the core idea is in fact very clear: **we should not let a business rule directly compute a dead number, nor bind it directly to some solver's variable handle. The business rule should instead build a solver-agnostic "unified expression intermediate representation (Expression IR)" that can both be evaluated with numbers substituted in and be transformed into mathematical constraints.**

In `ospf-kotlin` (`fuookami.ospf.kotlin.core.frontend.expression`), a native and extensible intermediate-representation system for scalar expressions and Boolean relational expressions is already provided:

<div class="dg" role="img" aria-label="The OSPF (fuookami.ospf.kotlin.core.frontend.expression) expression system, branching downward into five arms: decision variable terms (AbstractVariable) with BinVar / IntVar and URealVar / RealVar; monomials (Monomial) with LinearMonomial and QuadraticMonomial; polynomials (Polynomial) with LinearPolynomial, QuadraticPolynomial and (immutable/mutable polynomials); named intermediate symbols (Symbol) with LinearIntermediate, LinearExpressionSym and QuadraticExpression; and function-operator symbols with SlackFunction, SemiFunction and ULP / IfThen ...">
<div class="dg-title">OSPF (fuookami.ospf.kotlin.core.frontend.expression) expression system</div>
<div class="dg-arms"><div class="dg-arm">↓</div><div class="dg-arm">↓</div><div class="dg-arm">↓</div><div class="dg-arm">↓</div><div class="dg-arm">↓</div></div>
<div class="dg-group">
<div class="dg-node dg-node--leaf"><span class="dg-t">Decision variable terms (AbstractVariable)</span><span class="dg-s">BinVar / IntVar</span><span class="dg-s">URealVar / RealVar</span></div>
<div class="dg-node dg-node--leaf"><span class="dg-t">Monomials (Monomial)</span><span class="dg-s">LinearMonomial</span><span class="dg-s">QuadraticMonomial</span></div>
<div class="dg-node dg-node--leaf"><span class="dg-t">Polynomials (Polynomial)</span><span class="dg-s">LinearPolynomial</span><span class="dg-s">QuadraticPolynomial</span><span class="dg-s">(immutable/mutable polynomials)</span></div>
<div class="dg-node dg-node--leaf"><span class="dg-t">Named intermediate symbols (Symbol)</span><span class="dg-s">LinearIntermediate</span><span class="dg-s">LinearExpressionSym</span><span class="dg-s">QuadraticExpression</span></div>
<div class="dg-node dg-node--leaf"><span class="dg-t">Function-operator symbols</span><span class="dg-s">SlackFunction</span><span class="dg-s">SemiFunction</span><span class="dg-s">ULP / IfThen ...</span></div>
</div>
</div>

Four engineering conventions must be followed strictly at the architectural level when designing and using this `Expression IR`:

1. **Immutable, Traversable, Explainable**: every finalized polynomial (`LinearPolynomial` / `QuadraticPolynomial`) and intermediate symbol (`LinearExpressionSymbol`) stays immutable. Several complex constraints can safely share and reuse the same named intermediate symbol, and a modification in one place can never contaminate a global formula as a side effect. At the same time, all monomials (`monomials`) and the constant term (`constant`) inside the expression can be traversed completely by compilers, validators, diagnostics and agents, which can then explain clearly "which variables and symbols, through which coefficients, produced this result."
2. **Stable symbol identity and business attribute paths**: `ospf`'s `LinearIntermediateSymbol` identifies business identity through a stable symbol name (`name`) and a business display name (`displayName`) (for example `plannedFeeding_lineA_T2_MAT001`), and holds no underlying memory pointer of any particular commercial solver.
3. **Expression generics must never replace physical-unit and business-semantic validation**: although polynomials are algebraically generic, constructing expressions at the domain-modeling layer still requires strict checking with `ospf`'s native `Quantity` (such as `Quantity(intermediateSymbol, Kilogram)`) together with the state roles from Chapter 5. The fact that everything has become a polynomial is no license to add symbols of different physical dimensions or in illegal states at will.
4. **Runtime symbols and expressions are not domain facts**: the runtime decision variables and polynomial instances produced by a single solve or a single computation are merely technical carriers inside the computation; they **never enter the persisted state of a domain aggregate (Aggregate), nor are they written into the event store as business historical facts**.

---

## 7.3 The dual-entry architecture of a shared business core: direct evaluation from concrete values on the system side vs. constraint-fragment generation from symbolic variables on the operations-research side

Relying on `ospf-kotlin`'s expressions and named intermediate symbols, we can build the standard architectural pattern of a **"shared business core with numeric/symbolic dual entry points"** (single-source dual entry points) in the domain layer.

<div class="dg" role="img" aria-label="Domain concepts, computation rules, conversion coefficients and branching specifications (the single authoritative business convention) flow into the shared business core (Shared Core), which is then contrasted left and right with two entry points: the system-side numeric entry — input: Quantity&lt;Flt64&gt; (concrete value + unit), output: Ret&lt;Quantity&lt;Flt64&gt;&gt;; the operations-research symbolic/modeling entry — input: OSPF decision variables / upstream symbols, output: Ret&lt;Quantity&lt;LinearExpressionSymbol&gt;&gt;; the two entries then converge for automatic equivalence verification, followed by LinearMetaModel compilation and low-level solver capability checks.">
<div class="dg-col">
<div class="dg-node dg-node--layer"><span class="dg-t">Domain concepts, computation rules, conversion coefficients and branching specifications (the single authoritative business convention)</span></div>
<div class="dg-down" aria-hidden="true">↓</div>
<div class="dg-node dg-node--layer"><span class="dg-t">Shared business core (Shared Core)</span></div>
<div class="dg-arms"><div class="dg-arm">↓</div><div class="dg-arm">↓</div></div>
<div class="dg-row">
<div class="dg-node"><span class="dg-t">System-side numeric entry</span><span class="dg-s">Input: Quantity&lt;Flt64&gt; (concrete value + unit)</span><span class="dg-s">Output: Ret&lt;Quantity&lt;Flt64&gt;&gt;</span></div>
<div class="dg-node"><span class="dg-t">Operations-research symbolic/modeling entry</span><span class="dg-s">Input: OSPF decision variables / upstream symbols</span><span class="dg-s">Output: Ret&lt;Quantity&lt;LinearExpressionSymbol&gt;&gt;</span></div>
</div>
<div class="dg-arms"><div class="dg-arm">↓</div><div class="dg-arm">↓</div></div>
<div class="dg-node dg-node--layer"><span class="dg-t">Automatic equivalence verification</span></div>
<div class="dg-down" aria-hidden="true">↓</div>
<div class="dg-node dg-node--layer"><span class="dg-t">LinearMetaModel compilation and low-level solver capability checks</span></div>
</div>
</div>

As the figure shows, this architecture draws clear responsibility boundaries between the domain layer, the algorithm layer and the solver adapter layer:
* **Domain layer (the single owner of business semantics)**: maintains exactly one authoritative set of domain concepts, computation rules, scrap coefficients and conditional branching specifications. It exposes two entry points through the shared business core. When the system side (BOM explosion, substitute-material consumption recomputation, digital-twin projected-time propagation) calls the **numeric entry**, it passes a `Quantity<Flt64>` that carries a native `PhysicalUnit` and gets the computed result directly; when the operations-research side calls the **symbolic/modeling entry**, the domain layer produces a `Quantity<LinearExpressionSymbol>` (a named intermediate symbol carrying a physical unit) that references the same coefficients and branching logic.
* **Algorithm layer (the modeler of a single solve)**: creates the runtime decision variables needed for one scheduling or optimization solve (such as `URealVar` and `BinVar`), calls the domain layer's symbolic entry to assemble intermediate symbols and the constraint pipeline, registers them in `LinearMetaModel`, and orchestrates the solve flow.
* **Solver adapter layer (the compiler backend)**: compiles and maps the generic metamodel through `LinearMechanismModel` onto concrete low-level solver plugins (such as Gurobi, Cplex, SCIP, Cbc or Hexaly), and performs low-level solver capability checks.

At the same time, we must keep clear-headed restraint in engineering practice: **building a dual-entry architecture absolutely does not mean force-genericizing every simple piece of code in the system, or building an all-encompassing general-purpose computer algebra system (CAS)**!
* For simple deterministic computations **used by the business-system side alone** (say a pure order-amount aggregation or a static document state transition), an intuitive and concise value object (Value Object) or a pure function should still be the first choice;
* **Only when the same business rule really must be consumed both by "system-side numeric execution" and by "operations-research symbolic modeling"** (for example feeding quantity, material consumption, changeover time, production duration, capacity occupancy and calendar availability) should a shared business core and two entry points be built for it. Every foundational abstraction must take "reducing convention forks and raising verifiability" as its sole yardstick, and we firmly reject type complexity that buys no business benefit merely for the sake of formal uniformity.

### Implementation: dual-entry shared-core code for "feeding quantity and production duration" built on native OSPF components
Below are two core dual-entry modules implemented directly on `ospf-kotlin` native types (`Flt64`, `Kilogram`, `Ton`, `Hour`, `Minute`, `Quantity`, `AbstractVariableItem`, `LinearPolynomial`, `LinearExpressionSymbol`):

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
 * 1. Feeding-rule domain specification (a pure domain value object, using OSPF native PhysicalUnit such as Kilogram / Ton throughout)
 */
data class FeedingRuleSpec(
    val taskId: String,
    val lineId: String,
    val materialId: String,
    val bomRatio: Flt64,                      // base feeding ratio required per unit of finished product
    val scrapRate: Flt64,                     // process scrap rate [0, 1)
    val outputUnit: PhysicalUnit = Kilogram,  // use the OSPF native Kilogram unit directly
    val feedingUnit: PhysicalUnit = Kilogram  // use the OSPF native Kilogram unit directly
)

/**
 * Shared business core 1: the material feeding and consumption computation core (FeedingSharedCore)
 * Eliminates once and for all the convention split of "division-based scrap on the system side, multiplication-based scrap on the algorithm side"!
 */
object FeedingSharedCore {

    /** The single authoritative conversion coefficient: bomRatio / (1 - scrapRate) * (outputUnit -> feedingUnit conversion ratio) */
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

    /** [Entry A: system-side deterministic numeric entry] — for BOM explosion, substitute-material projected-consumption recomputation and digital-twin local propagation */
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

    /** [Entry B: operations-research-side OSPF symbolic modeling entry] — produces an OSPF named intermediate symbol LinearExpressionSymbol carrying a physical unit */
    fun buildSymbolicFeedingIntermediate(
        spec: FeedingRuleSpec,
        plannedOutputVar: AbstractVariableItem<*, *> // OSPF decision variable, such as URealVar / IntVar
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
                displayName = "Line[${spec.lineId}] task[${spec.taskId}] planned feeding quantity (${spec.feedingUnit.symbol})"
            )
            Quantity(intermediateSymbol, spec.feedingUnit)
        }
    }
}

/**
 * 2. Shared business core 2: the changeover and total production duration computation core (TaskDurationSharedCore)
 * Supports the Chapter 10 digital twin's "predecessor task delayed -> successor projected time recomputed" from the same source as operations-research-side process time-window modeling!
 */
data class TaskDurationSpec(
    val taskId: String,
    val lineId: String,
    val effectiveProductivity: Quantity<Flt64>, // e.g. Quantity(Flt64(400.0), Kilogram / Hour)
    val changeoverDuration: Quantity<Flt64>,    // e.g. Quantity(Flt64(30.0), Minute)
    val calendarBreakDuration: Quantity<Flt64> = Quantity(Flt64.zero, Hour),
    val outputUnit: PhysicalUnit = Kilogram,
    val targetTimeUnit: PhysicalUnit = Hour
)

object TaskDurationSharedCore {

    /** The single authoritative time coefficient and fixed-offset computation (aligned uniformly to targetTimeUnit, such as Hour) */
    fun computeTimeParameters(spec: TaskDurationSpec): Ret<Pair<Flt64, Flt64>> {
        // 1) time needed to produce one outputUnit (e.g. 1 kg / (400 kg/h) = 0.0025 h)
        val oneUnitOutput = Quantity(Flt64.one, spec.outputUnit)
        val timePerUnit = when (
            val r = OspfBoundaryAdapter.divideQuantitiesSafely(oneUnitOutput, spec.effectiveProductivity, spec.targetTimeUnit)
        ) {
            is Ok -> r.value.value
            is Failed -> return r
        }
        // 2) fixed time offset of changeover time plus shift-break adjustment (e.g. 30 min + 0 h = 0.5 h)
        val totalFixedOffset = when (
            val r = OspfBoundaryAdapter.addQuantitiesSafely(spec.changeoverDuration, spec.calendarBreakDuration, spec.targetTimeUnit)
        ) {
            is Ok -> r.value.value
            is Failed -> return r
        }
        return Ok(timePerUnit to totalFixedOffset)
    }

    /** [Entry A: system-side numeric entry] — after the digital twin receives T1's actual completion time, recompute T2's projected occupancy duration in seconds */
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

    /** [Entry B: operations-research-side OSPF symbolic entry] — produces the task occupancy duration intermediate symbol: timePerUnit * plannedOutputVar + fixedOffset */
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
                displayName = "Total occupancy duration of task[${spec.taskId}] including changeover (${spec.targetTimeUnit.symbol})"
            )
            Quantity(sym, spec.targetTimeUnit)
        }
    }
}
```

---

## 7.4 Partial evaluation, the compiled evaluation cache and property-based equivalence testing: proving by automated test that system computation and algorithm models agree 100%

Once the same set of business rules can go through both the numeric entry and the symbolic-expression entry, the foundation framework must still solve two key engineering problems: **first, how to evaluate expressions efficiently and safely in different contexts? Second, how to prove by automated means, 100%, that the two entries compute absolutely equivalent things?**

The `ospf` foundation framework and our domain boundary adapter give a complete answer through the following three core capabilities:

### 1. Complete evaluation, partial evaluation (Partial Evaluation) and three-valued logic
In complex business projection and model simplification, the symbols in an expression are not always all known at the same time. During scheduling preprocessing, for example, the BOM ratio, the equipment's rated power and the actual feeding already consumed today (`actualFeedingInWindow`) are known constants, while the planned output of the task to be scheduled is an unknown decision variable.
* **Complete and partial substitution**: the framework supports binding business attributes and symbols per context. When every variable symbol is bound to a concrete value, **complete evaluation** runs and produces a final number; when only some symbols are bound to known constants, **partial evaluation (Partial Evaluation)** runs, folding the known constant terms ahead of time into a new `LinearPolynomial` and producing a leaner residual symbolic expression.
* **Missing-symbol diagnostics and three-valued logic (Three-Valued Logic)**: during evaluation, a missing symbol binding or a business attribute in the "Unknown" state strictly follows three-valued logic (`TRUE` / `FALSE` / `UNKNOWN`), and failure or unknown state is propagated upward as an explicit structured result (`Ret`). **It is strictly forbidden to silently treat "Unknown" as boolean `false`, and strictly forbidden to silently substitute a missing value (Missing) as zero (`0`) into the computation** — once missing inventory or a missing changeover duration is taken as `0`, the schedule is seeded with fatally false feasible solutions!

### 2. Compiled evaluation and performance governance for large sparse expressions
In industrial scheduling and digital-twin simulation, a large expression may contain tens of thousands of symbolic terms (for example capacity and material-balance expressions spanning hundreds of time buckets and thousands of operations), and it must be evaluated repeatedly tens of thousands of times during local propagation, heuristic search or post-solve result checking. If every evaluation walks a complex object graph and does hash-table lookups, the CPU and memory cost becomes unbearable.

For this reason the system implements a mechanism that **separates build-time validation from runtime compiled evaluation**:
* **Frozen symbol order and precomputed indices**: after type, unit and structure validation completes in the diagnosable model-building phase, the current variable-symbol order can be frozen (such as the frozen token indices in `LinearMetaModel.tokens`), sparse nonzero-term index arrays precomputed, and a cacheable high-performance evaluator generated, with observable time and memory bounds for large sparse expressions.
* **Cache-key governance with version fingerprints**: to prevent state crosstalk during historical replay or concurrent simulation, the compiled evaluator's cache key (Cache Key) must fully include **the expression structure hash, the frozen symbol order and the version of the underlying numeric capability**; it is never acceptable to interpret a historical model with the current global mutable state by default.

### 3. Dual-entry equivalence and algebraic-law validation (Equivalence & Property-Based Testing)
This is the ultimate weapon that guarantees "the system and the algorithm never fork." Whenever an engineer adds or modifies a shared-business-core rule, the automated test suite enforces **equivalence tests and algebraic property tests** along several dimensions:

| Verification dimension | What the automated test verifies | Typical engineering defect it intercepts |
| :--- | :--- | :--- |
| **Numeric entry vs. symbolic entry equivalence** | Randomly generate large batches of legal business inputs and compare "the result of calling the system-side numeric entry directly" with "the result of first generating the operations-research-side `ospf` symbolic expression and then substituting the same batch of numbers as a variable solution" for strict equality. | Intercepts a missed coefficient, an inconsistent scrap formula or a divergent boundary condition between the numeric branch and the symbolic modeling branch. |
| **Interpreted evaluation vs. compiled evaluation equivalence** | For the same complex sparse polynomial, compare "map-substitution evaluation" with "compiled array evaluation based on the frozen token order" for identical output under both complete and partial substitution. | Intercepts symbol-index misalignment, missed sparse terms or computation distortion caused by cache-key collisions. |
| **Equivalence before and after normalization and simplification** | Compare the original business expression with the expression after like-term merging, algebraic simplification and canonical monomial/polynomial conversion for identity of evaluation results over the whole domain. | Intercepts sign errors or lost terms introduced when the expression simplifier or the lowering compiler rewrites polynomials. |
| **Consistency of exception and boundary rejection** | Cover negative boundaries such as constant-symbol substitution, real decision-variable substitution, incompatible physical units, non-affine rejection and insufficient solver capability. | Ensures illegal input fails explicitly with a consistent structured error at every entry, and is never silently let through. |

### Implementation: three-valued-logic partial evaluation, a compiled evaluator and dual-entry equivalence test code built on OSPF `LinearPolynomial`

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

// 1. Strict three-valued logic enum: for evaluating conditions and inequalities that contain undecided variables (never treat UNKNOWN as FALSE!)
enum class ThreeValuedTruth { TRUE, FALSE, UNKNOWN }

// 2. Safe complete and partial evaluator built on OSPF LinearPolynomial (never silently treat a missing variable binding as 0!)
object OspfSafePolynomialEvaluator {

    /**
     * Safe complete evaluation:
     * check whether every decision variable in the polynomial is provided in bindings (and not in explicitUnknownVars);
     * if any variable lacks a binding, return Failed(ErrorCode.SymbolNotFound) explicitly at once — never silently evaluate it as 0!
     */
    fun evaluateCompleteSafely(
        polynomial: LinearPolynomial,
        bindings: Map<AbstractVariableItem<*, *>, Flt64>,
        explicitUnknownVars: Set<AbstractVariableItem<*, *>> = emptySet()
    ): Ret<Flt64> {
        for (monomial in polynomial.monomials) {
            val variable = monomial.variable
            if (variable in explicitUnknownVars) {
                return Failed(Err(ErrorCode.ApplicationError, "Evaluation blocked: variable [${variable.name}] is in the explicit unknown state (UNKNOWN); refusing to force it into a number!"))
            }
            if (!bindings.containsKey(variable)) {
                return Failed(Err(ErrorCode.SymbolNotFound, "Evaluation failed: variable [${variable.name}] has no bound value (a missing value must never be treated as 0!)"))
            }
        }
        return OspfBoundaryAdapter.safeCall(ErrorCode.ApplicationError, "OSPF polynomial substitution evaluation returned null") {
            polynomial.evaluate(bindings)
        }
    }

    /**
     * Safe partial evaluation (Partial Evaluation):
     * fold the monomials of variables with known bindings into the constant term, keep the monomials of unbound variables, and return the simplified new OSPF LinearPolynomial.
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

    /** Three-valued inequality evaluation (poly <= rhsLimit): returns UNKNOWN if any unbound variable remains, never fabricating FALSE */
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

// 3. High-performance compiled evaluator (Compiled Evaluator) over a frozen symbol order, with a version-fingerprinted cache key
data class CompiledEvaluatorCacheKey(
    val polynomialStructureHash: Int,
    val frozenVariableNamesOrder: List<String>, // frozen list of OSPF variable names in order
    val numericalPrecisionVersion: String       // e.g. "Flt64_ep_1e-9"
)

class OspfCompiledLinearEvaluator private constructor(
    val cacheKey: CompiledEvaluatorCacheKey,
    val unit: PhysicalUnit,
    private val constant: Double,
    private val nonZeroIndices: IntArray,
    private val coefficients: DoubleArray,
    private val expectedVectorLength: Int
) {
    /** Hot runtime phase: sparse inner product directly over a contiguous Double solution vector, with no hash lookup or object allocation overhead */
    fun evaluateFast(solutionVector: DoubleArray): Ret<Quantity<Flt64>> {
        if (solutionVector.size < expectedVectorLength) {
            return Failed(
                Err(ErrorCode.IllegalArgument, "Solution vector length (${solutionVector.size}) is smaller than the frozen symbol-order length ($expectedVectorLength)")
            )
        }
        var acc = constant
        for (i in nonZeroIndices.indices) {
            acc += coefficients[i] * solutionVector[nonZeroIndices[i]]
        }
        return Ok(Quantity(Flt64(acc), unit))
    }

    companion object {
        /** Build phase: validate the maximum sparse-term bound, freeze the variable order and precompute indices */
        fun compile(
            polynomial: LinearPolynomial,
            unit: PhysicalUnit,
            frozenVariables: List<AbstractVariableItem<*, *>>,
            maxAllowedNonZeroTerms: Int = 100_000
        ): Ret<OspfCompiledLinearEvaluator> {
            if (polynomial.monomials.size > maxAllowedNonZeroTerms) {
                return Failed(
                    Err(ErrorCode.ApplicationError, "Sparse polynomial nonzero-term count (${polynomial.monomials.size}) exceeds the memory boundary limit ($maxAllowedNonZeroTerms)")
                )
            }
            val indexMap = frozenVariables.withIndex().associate { (idx, v) -> v.name to idx }
            val indices = IntArray(polynomial.monomials.size)
            val coeffs = DoubleArray(polynomial.monomials.size)

            for ((k, mono) in polynomial.monomials.withIndex()) {
                val idx = indexMap[mono.variable.name]
                    ?: return Failed(Err(ErrorCode.SymbolNotFound, "Variable [${mono.variable.name}] is not in the frozen symbol-order list"))
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

// 4. Automated dual-entry equivalence and property test suite (verifies the numeric entry, symbolic interpreted evaluation, compiled evaluation and missing-symbol rejection at once)
object OspfDualEntryEquivalenceTestSuite {

    fun runEquivalenceAndPropertyTests() {
        val spec = FeedingRuleSpec(
            taskId = "T2",
            lineId = "lineA",
            materialId = "MAT_001",
            bomRatio = Flt64(0.85),
            scrapRate = Flt64(0.15), // 0.85 / (1 - 0.15) = 1.0
            outputUnit = Ton,        // output uses the OSPF native Ton (metric ton)
            feedingUnit = Kilogram   // feeding uses the OSPF native Kilogram
        )

        val plannedOutputVar = URealVar("qty_T2_ton")
        val symbolicFeedingQty = (FeedingSharedCore.buildSymbolicFeedingIntermediate(spec, plannedOutputVar) as Ok).value
        val compiledEvaluator = (OspfCompiledLinearEvaluator.compile(
            polynomial = symbolicFeedingQty.value.polynomial,
            unit = symbolicFeedingQty.unit,
            frozenVariables = listOf(plannedOutputVar)
        ) as Ok).value

        // 1. Verify that the numeric entry, OSPF symbolic interpreted evaluation and OSPF compiled evaluation are 100% identical over the whole sample domain
        val testTons = listOf(0.25, 1.0, 1.85, 5.4)
        for (tonVal in testTons) {
            val fltVal = Flt64(tonVal)
            // (a) system-side numeric entry
            val numRes = (FeedingSharedCore.evaluateNumericalFeeding(spec, Quantity(fltVal, Ton)) as Ok).value
            // (b) OSPF symbolic safe complete evaluation
            val symResVal = (OspfSafePolynomialEvaluator.evaluateCompleteSafely(
                symbolicFeedingQty.value.polynomial,
                mapOf(plannedOutputVar to fltVal)
            ) as Ok).value
            // (c) compiled evaluator over the frozen symbol order
            val compiledRes = (compiledEvaluator.evaluateFast(doubleArrayOf(tonVal)) as Ok).value

            check((numRes.value eq symResVal) && (numRes.value eq compiledRes.value)) {
                "Dual-entry or compiled evaluation mismatch: num=${numRes.value}, sym=$symResVal, compiled=${compiledRes.value}"
            }
            check(numRes.unit == Kilogram && compiledRes.unit == Kilogram)
        }

        // 2. Verify that a missing symbol binding must return Failed explicitly, and is never silently treated as 0!
        val missingEval = OspfSafePolynomialEvaluator.evaluateCompleteSafely(
            symbolicFeedingQty.value.polynomial,
            emptyMap()
        )
        check(missingEval is Failed) { "Critical error: a missing variable binding was not intercepted!" }

        // 3. Verify three-valued logic: with variables unbound, inequality evaluation must return UNKNOWN, not FALSE
        val truth = OspfSafePolynomialEvaluator.evaluateLeqThreeValued(
            symbolicFeedingQty.value.polynomial,
            Flt64(1000.0),
            emptyMap()
        )
        check(truth == ThreeValuedTruth.UNKNOWN)
    }
}
```
