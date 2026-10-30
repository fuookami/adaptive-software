<!-- i18n-status: translated -->
<!-- i18n-source: docs/zh/chapter-11.md -->
# Chapter 11: White-Box Orchestration of Optimization Algorithms and Large-Scale Decomposition with DDD

In the digital-twin loop of Chapter 10, we saw that the system must switch freely among "local numeric propagation", "lightweight simulation trials" and "global rolling rescheduling (and even large-scale mathematical programming such as column generation and Benders decomposition)".

To achieve that smooth collaboration, the traditional architecture in which "a business system calls an external black-box algorithm service through a crude HTTP interface" must be retired outright. This chapter presents the full 15-point dependency derivation of the platform architecture, explains why optimization algorithms must enter Domain-Driven Design (DDD) as libraries or modules that the application layer can orchestrate white-box, and — building directly on the native model and symbolic infrastructure of `ospf-kotlin` — gives complete engineering implementations of the local/global scheduling trigger guard, DDD column generation and the Benders decomposition algorithm.

---

## 11.1 A 15-point architectural dependency derivation: why must algorithms first be libraries and modules that the application layer can orchestrate white-box?

Why do we argue so firmly for the architectural route of "Domain-Driven Design (DDD) + functional programming (FP) + a formal domain model + a white-box orchestration-ready algorithm library"? Not out of some subjective taste in technical aesthetics, but because the 15 core demands of industrial software, through strict logical dependency, **force out this single answer step by step**.

Let us first list the **15 key architectural points** required to build a modern intelligent APS / DOP platform:

| Point | Core architecture and business capability | Point | Core architecture and business capability |
| :--- | :--- | :--- | :--- |
| **Point 1** | Business logic coheres in the domain model | **Point 9** | Testability of pure computation (unit tests without framework or database) |
| **Point 2** | Domain layer separated from persistence, external interfaces and the runtime framework | **Point 10** | Lightweight, high-frequency simulatability (without polluting real business state) |
| **Point 3** | The repository is a domain interface; the infrastructure layer is only an implementation | **Point 11** | Iteration data and version snapshots (including the planned / estimated / actual three-layer state) |
| **Point 4** | Algorithms can be orchestrated white-box by the application layer, avoiding opaque black-box interfaces | **Point 12** | Computable dynamic projection of the digital twin |
| **Point 5** | Strict consistency between algorithm and system business definitions | **Point 13** | Rolling rescheduling and composable cross-node process orchestration |
| **Point 6** | Support for runtime injection of structured dynamic constraints | **Point 14** | Agents adapt dynamically on structured domain metadata |
| **Point 7** | Business intermediate values are transparent, named, explainable and queryable | **Point 15** | Agents reason about the business from the digital twin and domain context |
| **Point 8** | **All runtime sides (system / OR / ML / Agent) share one formal domain model** | — | *(Note: ML-Native, the base framework and LLM as Runtime stack on top as cross-cutting capabilities)* |

Once we draw the support and constraint relations among these 15 points as a complete architectural dependency topology, the mechanical structure of the whole building becomes clear at a glance:

![Point 8: formal domain model (the system, OR, ML and agent sides share domain concepts) supports downward point 5 (algorithm and system definitions agree), point 6 (safe injection of dynamic constraints), point 7 (transparent, queryable intermediate values), point 12 (dynamic digital-twin projection) and point 15 (agent business reasoning), where (this reinforces points 1 and 8 in reverse); points 6 and 7 flow into point 4: algorithms can be orchestrated white-box by the application layer (avoiding exposing only an opaque black-box service interface), landing on point 10 lightweight high-frequency simulatability and points 6 / 7 becoming engineering reality; point 11 planned / estimated / actual + version snapshots supports point 10 upward and unfolds point 10 simulation comparison, point 12 digital-twin projection and point 13 rolling rescheduling and process orchestration downward, then on to point 15 agents reason about impact scope and candidate plans and point 14 agents generate dynamic constraints and process adaptation; point 1: business logic cohesion point 2: domain and framework separation point 3: repository as interface converge on point 9: testability of pure computation (unit tests directly, without starting Spring, connecting a database or calling remote services).](assets/diagrams/chapter-11-1.svg)

In Chapter 5 we already dissected the first layer of dependency (point 8, the formal domain model, is the root of everything); now let us focus on how the **second through sixth layers of dependency** mesh so tightly:

### 1. Why is point 4 (white-box orchestration of algorithms) the precondition for point 6 (dynamic constraints), point 7 (transparent intermediates) and point 10 (simulatability)?
If an optimization algorithm exposes only one opaque black-box RPC/HTTP interface (pass in a fixed DTO, get back a schedule summary), then decision variables, intermediate-value expressions, the constraint construction pipeline and the solving process are all locked inside the service:
* **Point 4 → point 6 (dynamic constraint injection)**: a dynamic constraint requires injecting a new rule (such as `actualFeedingInWindow + plannedFeedingRemaining[A] + plannedFeedingRemaining[B] <= feedingLimit`) into the algorithm model at runtime. Only when the algorithm exists as a library/module the application layer can orchestrate (or, when deployed remotely, explicitly exposes a structured variable catalog and constraint contract aligned with the domain model) can the application layer append structured constraints directly on the same batch of domain objects, instead of degrading to passing an unparseable black-box string.
* **Point 4 → point 7 (transparent intermediates)**: if the black-box service returns only an `output summary`, the system cannot obtain named intermediate values such as feeding quantity, resource occupancy or changeover duration. When the algorithm is a white-box module, it can reuse domain computation objects directly (such as `LinearExpressionSymbol` in `ospf`) and explicitly emit intermediate results that carry a name, a source expression, a physical unit, a lifecycle and version information.
* **Point 4 → point 10 (lightweight simulatability)**: a simulation trial (`What-if`) must run "change parameters / add constraints → recompute → compare results" at high frequency, with low weight and low latency. When the application layer orchestrates the algorithm as a module library and calls it in memory, the heavy costs of cross-network assembly, serialization and service scheduling disappear; and even when very large problems are deployed on remote compute, latency must still be governed through a unified domain-snapshot contract, batch requests or local caching.

### 2. The chain transmission from the third to the sixth layer of dependency
* **Points 1, 2, 3 → point 9 (testability)**: testability is not solved by adding a few test tools; it depends on the architecture itself. Only when business logic coheres in the domain model (point 1), the domain layer stays pure functional computation with no dependency on persistence or a framework (point 2), and every repository is abstracted as an interface (point 3) can the engineering team **"verify all domain rules, computation formulas and constraint pipelines in millisecond-level unit tests, without starting a Spring container, connecting to a database or calling a remote algorithm service"**.
* **Point 11 (three-layer state and version snapshots) → points 10, 12, 13**: without the planned / estimated / actual three-layer time model and a version-snapshot diff mechanism, simulation cannot compare candidate plans structurally (point 10), the digital twin cannot project future estimated states (point 12), and rolling rescheduling cannot tell which tasks are finished, which are running and which are expected to slip (point 13).
* **Point 12 (the digital twin) reinforces points 1 and 8 in reverse**: precisely because the digital twin must recompute estimated times in real time without depending on a full schedule, changeover time, production duration and calendar projection must be pulled out of the algorithm black box and precipitated into the shared formal domain model.
* **Point 15 (agent business reasoning) → point 14 (agent dynamic adaptation)**: the order is always **"first reason about impact with domain context and the digital twin (point 15), then generate a checkable dynamic constraint or process orchestration plan from structured metadata, and hand it to simulation for validation before execution (point 14)"**.

The table below makes clear how every design decision in this architecture was forced out of us, step by step, by business goals:

| Architectural point | Constrained by other points? | Direct source of constraint | How the architecture forces it |
| :--- | :--- | :--- | :--- |
| **Point 8 (formal domain model)** | **No, it is the root** | — | The cornerstone of the architecture; it directly determines the solutions for points 5, 6, 7, 12, 13, 14 and 15. |
| **Points 1, 3 (domain cohesion / repository interface)** | **No, it is a foundational choice** | — | The basis of DDD layering; otherwise every capability can only pile up as procedural interfaces. |
| **Point 2 (domain and framework separation)** | Supported by point 3 | Point 3 | Only after repositories become interfaces can the domain layer shed its binding to database and framework implementations. |
| **Point 4 (white-box orchestration of algorithms)** | Partly constrained | Point 8 | If domain concepts are not formalized, an algorithm cannot share domain objects with the system even when built as a library. |
| **Point 5 (consistent algorithm and system definitions)** | Strictly constrained | Point 8 | Only by sharing one domain definition and isolating state roles can consistency be fundamentally guaranteed. |
| **Points 6, 7 (dynamic constraints / intermediates)** | Doubly constrained | Points 8, 4 | Requires variables and intermediate values to be named domain symbols, and the algorithm model to support runtime white-box injection and resolution. |
| **Point 9 (testability)** | Triply constrained | Points 1, 2, 3 | Depends on business-logic cohesion, side-effect-free pure computation and isolation of the persistence interface. |
| **Point 11 (three-layer state and snapshots)** | A relatively independent data foundation | — | Provides the versioned data basis for simulation comparison, digital-twin projection and rolling rescheduling. |
| **Point 10 (simulatability)** | Constrained four ways | Points 4, 6, 7, 11 | Simulation requires lightweight solve calls, dynamic constraint injection, intermediate-value queries and version-snapshot comparison. |
| **Point 12 (digital-twin projection)** | Constrained and reinforcing in reverse | Points 8, 11 (reinforcing point 1) | Requires an independently computable domain model and planned / estimated / actual three-layer data. |
| **Point 13 (rolling rescheduling and orchestration)** | Triply constrained | Points 8, 11, 12 | Depends on a unified node domain contract, version-snapshot data and dynamic projection of estimated states. |
| **Point 15 (agent business reasoning)** | Constrained six ways | Points 7, 8, 10, 11, 12, 13 | Depends on the formal vocabulary, transparent intermediates, historical snapshots, digital-twin state, simulation and process context. |
| **Point 14 (agent dynamic adaptation)** | Constrained five ways | Points 6, 8, 10, 13, 15 | Depends on structured metadata, reasoning conclusions, injectable constraints, safe simulation validation and composable process nodes. |

---

## 11.2 Local propagation vs. global rolling rescheduling: how do we draw the policy boundary between local time propagation and triggering a full reschedule?

Once both the optimization algorithms and the domain computation models can be orchestrated freely by the application layer, everyday floor disturbances such as the "predecessor task `T1` is late" case from Chapter 10 no longer leave only two extreme options — ignore it, or reschedule everything. We can instead establish **a graded response mechanism between system-side local propagation and OR-side global rolling rescheduling**.

Why draw a strict boundary between "local propagation" and "a full reschedule"?
* **If any tiny deviation triggers a full reschedule**: not only is the compute cost high and the response slow, but frequently changing the work-order sequence across the plant causes severe "schedule nervousness" — the shop-floor worker has just drawn materials and is about to start, and the system changes the whole work-order sequence again, which the floor simply cannot execute;
* **Conversely, if we only run local propagation and set no global conflict tripwire**: a local push-back may mask a cross-line global resource conflict (for example, after `T2` slips it competes with `T3` on line B for shared feeding-port capacity or a shared mold in the same time bucket), so the projected plan turns out to be infeasible.

The application layer therefore divides the process into three clear tiers by deterministic policy:

![Actual floor execution feedback enters (e.g. T1 actually finishes 30 minutes late), and first enters tier one, local propagation in the domain computation model (system-side pure numeric computation, millisecond level); then the application-layer deterministic boundary and conflict guard check judges: on within bounds and no global conflict, keep the original baseline plan sequence and only update the digital-twin estimated state and keep monitoring; on threshold exceeded or a resource conflict arises, enter tier two/three: OR solving and simulation comparison.](assets/diagrams/chapter-11-2.svg)

1. **Tier 1 (system-side pure numeric local propagation)**: the application layer calls the domain layer's changeover-time, production-duration and material-consumption models directly and updates the estimated times of the affected operation chain. As long as the updated estimated time does not breach the order delivery deadline, the deviation stays within the allowed threshold, and the constraint evaluator finds no violation of any cross-resource hard constraint, the system only needs to update the digital-twin estimated state and never disturbs the OR solver to change the baseline scheduling sequence.
2. **Tier 2 (OR-side restricted local-window reschedule)**: when the deviation exceeds the local buffer but the domain graph strictly limits the impact to a few related work orders or a single workshop, the algorithm layer locks only the affected object set (such as `{T2, T3, line A, line B}`), freezes the remaining stabilized work orders as boundary constants, and runs a lightweight reschedule in seconds.
3. **Tier 3 (global rolling rescheduling and process orchestration)**: when the disturbance reaches a global bottleneck resource, causes a multi-level kitting shortfall, or an agent or planner injects a new cross-line dynamic constraint, the application layer triggers the full rolling rescheduling workflow (such as `schedule solve → substitute material allocation → recompute estimated material consumption → MRP shortfall calculation → simulation comparison → approval and release`). Every rolling round forcibly freezes and records the input snapshot, rule version, trigger reason and result version, so the whole chain is 100% reviewable.

### Engineering implementation: digital-twin local propagation and rolling-reschedule trigger guard based on OSPF native units and the three-layer time model
Below is the code for the **digital-twin estimated-state cascade propagator and the reschedule trigger decision guard**, built directly on `TaskDurationSharedCore` and `FeedingSharedCore` from Chapter 7 and on the native units of `ospf-kotlin` (`Hour`, `Minute`, `Kilogram`):

```kotlin
package org.adaptive.dop.application.twin

import java.time.Duration
import java.time.Instant
import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.physics.unit.*
import fuookami.ospf.kotlin.utils.physics.quantity.*
import fuookami.ospf.kotlin.utils.error.*
import fuookami.ospf.kotlin.utils.functional.*
import org.adaptive.dop.domain.core.*
import org.adaptive.dop.infrastructure.ospf.OspfBoundaryAdapter

// 1. Three-layer time state model of a work-order task (planned, estimated and actual times strictly separated; persistence uniformly uses UTC Instant)
data class TaskThreeTierScheduleState(
    val taskId: String,
    val lineId: String,
    val plannedStart: Instant,
    val plannedEnd: Instant,
    val estimatedStart: Instant,
    val estimatedEnd: Instant,
    val actualStart: Instant? = null,
    val actualEnd: Instant? = null,
    val orderDeliveryDeadline: Instant,
    val plannedOutputMass: Quantity<Flt64>,
    val durationSpec: TaskDurationSpec,
    val feedingSpec: FeedingRuleSpec
)

// 2. Application-layer graded reschedule response decision result
sealed interface PropagationDecision {
    /** Tier 1: update only the digital-twin estimated state, leaving the baseline scheduling sequence untouched */
    data class KeepBaselineUpdateTwinOnly(
        val updatedTasks: List<TaskThreeTierScheduleState>
    ) : PropagationDecision

    /** Tier 2/3: trigger a restricted local-window reschedule or a global rolling reschedule (carrying the trigger reason, affected objects and frozen-snapshot requirements) */
    data class TriggerRollingReschedule(
        val reason: String,
        val affectedTaskIds: Set<String>,
        val affectedLineIds: Set<String>,
        val updatedPreviewTasks: List<TaskThreeTierScheduleState>
    ) : PropagationDecision
}

/**
 * Digital-twin local propagation and rolling-reschedule trigger guard:
 * when actual completion feedback for predecessor task T1 arrives, propagate the successors' estimated times on the system side in seconds through the OSPF pure-function numeric entry point,
 * and check whether the delivery-deviation threshold is crossed or a cross-line shared feeding-port capacity conflict is triggered.
 */
class DigitalTwinPropagationGuard(
    private val maxAllowedDelayThreshold: Quantity<Flt64> = Quantity(Flt64(15.0), Minute) // locally tolerated deviation threshold: 15 minutes
) {
    fun propagateAndEvaluate(
        completedPredecessor: TaskThreeTierScheduleState,
        successorChainOnSameLine: List<TaskThreeTierScheduleState>,
        parallelTasksOnOtherLines: List<TaskThreeTierScheduleState>,
        actualFeedingAlreadyOccurred: Quantity<Flt64>, // feeding fact that has already actually occurred today (e.g. 450 kg)
        sharedFeedingLimit: Quantity<Flt64>            // daily shared feeding-port capacity limit (e.g. 1000 kg)
    ): Ret<PropagationDecision> {
        val predActualEnd = completedPredecessor.actualEnd
            ?: return Failed(Err(ErrorCode.IllegalArgument, "Predecessor task [${completedPredecessor.taskId}] has no actual end time yet"))

        val updatedSuccessors = mutableListOf<TaskThreeTierScheduleState>()
        var cursorEndInstant: Instant = predActualEnd
        var delayThresholdBreached = false
        var deadlineBreached = false

        // 1. Walk the predecessor/successor operation chain on the same line and cascade-recompute estimated start and end times through the numeric entry point of the Chapter 7 shared business core
        for (succ in successorChainOnSameLine) {
            // 1.1 Compute changeover time + calendar availability adjustment to derive the successor's estimated start time
            val changeoverHoursQty = when (
                val r = OspfBoundaryAdapter.addQuantitiesSafely(
                    lhs = succ.durationSpec.changeoverDuration,
                    rhs = succ.durationSpec.calendarBreakDuration,
                    targetUnit = Hour
                )
            ) {
                is Ok -> r.value
                is Failed -> return r
            }
            val changeoverSeconds = (changeoverHoursQty.value * Flt64(3600.0)).toDouble().toLong()
            val newEstimatedStart = cursorEndInstant.plusSeconds(changeoverSeconds)

            // 1.2 Call the shared business core for the total elapsed time including changeover and processing, to derive the successor's estimated end time
            val totalDurationHours = when (
                val r = TaskDurationSharedCore.evaluateNumericalTotalDuration(succ.durationSpec, succ.plannedOutputMass)
            ) {
                is Ok -> r.value
                is Failed -> return r
            }
            val totalElapsedSeconds = (totalDurationHours.value * Flt64(3600.0)).toDouble().toLong()
            val newEstimatedEnd = cursorEndInstant.plusSeconds(totalElapsedSeconds)

            // 1.3 Check whether the deviation between the estimated end time and the planned end time exceeds the threshold, or breaches the order delivery window
            val delayMinutes = Duration.between(succ.plannedEnd, newEstimatedEnd).toMinutes().coerceAtLeast(0)
            val delayQty = Quantity(Flt64(delayMinutes.toDouble()), Minute)
            val thresholdInMin = (OspfBoundaryAdapter.convertQuantitySafely(maxAllowedDelayThreshold, Minute) as Ok).value

            if (delayQty.value gr thresholdInMin.value) {
                delayThresholdBreached = true
            }
            if (newEstimatedEnd.isAfter(succ.orderDeliveryDeadline)) {
                deadlineBreached = true
            }

            val updatedTask = succ.copy(
                estimatedStart = newEstimatedStart,
                estimatedEnd = newEstimatedEnd
            )
            updatedSuccessors.add(updatedTask)
            cursorEndInstant = newEstimatedEnd
        }

        // 2. Global conflict guard check: even when a single-line push-back stays inside the delivery date, we must still check
        //    whether the pushed-back window overlaps a parallel line (e.g. T3 on line B) and whether today's shared-port feeding total exceeds the limit!
        val allPendingTasks = updatedSuccessors + parallelTasksOnOtherLines
        var totalEstimatedRemainingFeedingKg = Flt64.zero
        for (task in allPendingTasks) {
            val taskFeeding = when (val r = FeedingSharedCore.evaluateNumericalFeeding(task.feedingSpec, task.plannedOutputMass)) {
                is Ok -> r.value
                is Failed -> return r
            }
            val taskFeedingKg = when (val r = OspfBoundaryAdapter.convertQuantitySafely(taskFeeding, Kilogram)) {
                is Ok -> r.value.value
                is Failed -> return r
            }
            totalEstimatedRemainingFeedingKg += taskFeedingKg
        }

        val actualKg = when (val r = OspfBoundaryAdapter.convertQuantitySafely(actualFeedingAlreadyOccurred, Kilogram)) {
            is Ok -> r.value.value
            is Failed -> return r
        }
        val limitKg = when (val r = OspfBoundaryAdapter.convertQuantitySafely(sharedFeedingLimit, Kilogram)) {
            is Ok -> r.value.value
            is Failed -> return r
        }
        val projectedTotalFeedingKg = actualKg + totalEstimatedRemainingFeedingKg
        val sharedResourceConflict = projectedTotalFeedingKg gr limitKg

        // 3. Based on the deterministic guard, return tier 1 (update the twin only) or tier 2/3 (trigger rolling rescheduling and simulation comparison)
        return if (!delayThresholdBreached && !deadlineBreached && !sharedResourceConflict) {
            Ok(PropagationDecision.KeepBaselineUpdateTwinOnly(updatedSuccessors))
        } else {
            val reasons = buildList {
                if (delayThresholdBreached) add("Successor estimated delay exceeds the local buffer threshold (${maxAllowedDelayThreshold.value} ${maxAllowedDelayThreshold.unit.symbol})")
                if (deadlineBreached) add("Successor estimated completion breaches the order delivery deadline")
                if (sharedResourceConflict) add("Projected cumulative cross-line shared feeding ($projectedTotalFeedingKg kg) exceeds today's limit ($limitKg kg)")
            }.joinToString("; ")

            val affectedTasks = allPendingTasks.map { it.taskId }.toSet()
            val affectedLines = allPendingTasks.map { it.lineId }.toSet() + completedPredecessor.lineId
            Ok(
                PropagationDecision.TriggerRollingReschedule(
                    reason = reasons,
                    affectedTaskIds = affectedTasks,
                    affectedLineIds = affectedLines,
                    updatedPreviewTasks = updatedSuccessors
                )
            )
        }
    }
}
```

---

## 11.3 Taming column generation with a DDD architecture: restricted master problem, pricing subproblem contract and reduced-cost verification

As an enterprise grows further — say, scheduling across several plants and tens of thousands of work orders, or the **large-scale vehicle routing and loading problem (VRP)**, cutting stock and personnel shift scheduling problems of the transportation management system (TMS) in a digital operations platform (DOP) — trying to build all combinatorial plans into one gigantic single Mixed-Integer Linear Programming (MILP) model makes the number of variables explode exponentially (millions or even hundreds of millions of columns), and any commercial solver will simply run out of memory or time out.

One of the most powerful weapons the OR community has for such very-large-scale optimization is **column generation and the branch-and-price algorithm**. Yet in traditional algorithm scripts the master and subproblems of column generation often end up as a tangle of highly coupled spaghetti code that is extremely hard to maintain or extend.

Under `ospf` and this book's DDD architecture, we break column generation into domain and algorithm collaboration components with sharply separated responsibilities, and reserve a strict safety verification boundary for the machine-learning and reinforcement-learning accelerators introduced later:

![The column generation collaboration loop under a DDD architecture: 1. the restricted master problem solves the linear relaxation and outputs the current dual prices, then hands down the subproblem contract carrying dual information and business boundaries to 2. the pricing subproblem contract; the pricing subproblem produces candidate columns through path A, accelerators and heuristics, and path B, exact subproblem solving, and passes them to 3. the OR Guard, which independently validates and verifies the reduced cost before re-injecting the verified improving columns.](assets/diagrams/chapter-11-3.svg)

The engineering essence of organizing column generation with a DDD architecture comes down to three points:

1. **Decouple the master problem from the pricing subproblem naturally along domain aggregate boundaries**:
   * **The restricted master problem (RMP)** cares only about cross-resource global coordination contracts (such as "every order must be executed" and "the combined feeding of lines A and B today must not exceed `1000 kg`"); it does not even need to know the complex changeover details inside a single line;
   * **The pricing subproblem** is fully cohesive inside a single domain aggregate (such as one line or one truck); it uses the changeover time, production duration, shift calendar and local process rules defined by the domain layer, together with the dual prices handed down by the master problem, to search independently for the most valuable candidate plan columns.
2. **A strict candidate column verification guard**: whether a candidate column comes from a deterministic heuristic or from the reinforcement learning (RL) accelerator introduced in Chapter 13, before it is re-injected into the master problem it **must pass an independent check by the OR optimization verification guard** — confirming that the column satisfies the single-line/single-truck domain hard constraints 100%, and independently recomputing with the master problem's dual values whether its **reduced cost** truly carries improvement value; any infeasible or non-improving column is rejected on the spot.
3. **Exact pricing fallback and optimality certification**: early in the iterations the system may use fast heuristics or learned policies to mass-produce good columns and accelerate convergence; but when the heuristic or accelerator finds no improving column, or the algorithm nears convergence and must supply rigorous **mathematical bounds and a global optimality proof**, the system **must forcibly switch to and run the certifiable exact pricing subproblem**, rigorously proving that under the current branching constraints no improving column remains. It is never acceptable to declare global convergence from the output of an uncertified approximate policy!

### Engineering implementation: DDD column generation master/subproblem orchestration and verification guard code based on OSPF
Below is the core DDD column generation orchestration code, built directly on `Flt64`, `Quantity` (`Kilogram` / `Hour`), `LinearMetaModel` and `Ret` from `ospf-kotlin`:

```kotlin
package org.adaptive.dop.algorithm.cg

import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.physics.unit.*
import fuookami.ospf.kotlin.utils.physics.quantity.*
import fuookami.ospf.kotlin.utils.error.*
import fuookami.ospf.kotlin.utils.functional.*
import fuookami.ospf.kotlin.core.frontend.variable.*
import fuookami.ospf.kotlin.core.frontend.expression.monomial.*
import fuookami.ospf.kotlin.core.frontend.expression.polynomial.*
import fuookami.ospf.kotlin.core.frontend.inequality.*
import fuookami.ospf.kotlin.core.frontend.model.mechanism.*
import org.adaptive.dop.infrastructure.ospf.OspfBoundaryAdapter

// 1. Scheduling/loading candidate plan column for a single line or a single truck (domain value object)
enum class ColumnSource { INITIAL_BASIS, HEURISTIC_ACCELERATOR, CONSTRAINED_RL_POLICY, EXACT_PRICING_MIP }

data class LineScheduleColumn(
    val columnId: String,
    val lineId: String,
    val coveredTaskIds: Set<String>,         // set of work-order tasks this column executes
    val totalScheduleCost: Flt64,            // direct execution cost of this column (changeover + energy + delay penalty)
    val totalFeedingMass: Quantity<Flt64>,   // feeding mass this column consumes at the shared feeding port (OSPF Quantity, e.g. Kilogram)
    val totalElapsedShiftTime: Quantity<Flt64>, // total line shift time this column occupies (OSPF Quantity, e.g. Hour)
    val source: ColumnSource
)

// 2. Snapshot contract of the dual prices (shadow prices) handed down after the RMP solves its linear relaxation
data class RmpDualPriceSnapshot(
    val iteration: Int,
    val taskCoverageDuals: Map<String, Flt64>, // dual multiplier \pi_i of each task coverage constraint
    val lineConvexityDuals: Map<String, Flt64>,// dual multiplier \mu_l of each line convexity constraint (\sum \lambda_k <= 1)
    val sharedFeedingDual: Flt64               // dual multiplier \sigma of the shared feeding-port capacity constraint (shadow price per kg fed)
)

// 3. Single-line domain aggregate hard-constraint validator (provided by the domain layer; independently checks whether a candidate column is physically feasible on one line)
interface SingleLineDomainValidator {
    val lineId: String
    val maxShiftAvailableTime: Quantity<Flt64>
    fun verifySequenceAndTimeWindows(column: LineScheduleColumn): Ret<Unit>
}

// 4. OR candidate column verification guard
// Any candidate column produced by a heuristic or by reinforcement learning (RL) must pass this guard's domain hard-constraint verification + independent reduced-cost recomputation before entering the master problem!
class OspfCandidateColumnGuard(
    private val improvementTolerance: Flt64 = Flt64(-1e-6)
) {
    fun verifyAndComputeReducedCost(
        column: LineScheduleColumn,
        duals: RmpDualPriceSnapshot,
        lineValidator: SingleLineDomainValidator
    ): Ret<Flt64> {
        // Guard 1: check whether the shift time the candidate column occupies exceeds the single-line calendar availability limit (aligned to Hour via OSPF Quantity)
        val elapsedHours = when (val r = OspfBoundaryAdapter.convertQuantitySafely(column.totalElapsedShiftTime, Hour)) {
            is Ok -> r.value.value
            is Failed -> return r
        }
        val maxHours = when (val r = OspfBoundaryAdapter.convertQuantitySafely(lineValidator.maxShiftAvailableTime, Hour)) {
            is Ok -> r.value.value
            is Failed -> return r
        }
        if (elapsedHours gr maxHours) {
            return Failed(
                Err(ErrorCode.ApplicationError, "Candidate column [${column.columnId}] violates the line shift-duration hard constraint: $elapsedHours h > $maxHours h")
            )
        }

        // Guard 2: call the single-line domain aggregate to verify operation precedence, changeover and delivery-date hard constraints
        when (val domainCheck = lineValidator.verifySequenceAndTimeWindows(column)) {
            is Ok -> {}
            is Failed -> return Failed(domainCheck.error)
        }

        // Guard 3: align the candidate column's feeding mass to native OSPF Kilogram and independently recompute the reduced cost
        // Reduced Cost \bar{c}_k = c_k - \sum_{i \in Tasks} \pi_i - \sharedFeedingDual * feedingKg_k - \mu_{line}
        val feedingKg = when (val r = OspfBoundaryAdapter.convertQuantitySafely(column.totalFeedingMass, Kilogram)) {
            is Ok -> r.value.value
            is Failed -> return r
        }

        var taskDualSum = Flt64.zero
        for (taskId in column.coveredTaskIds) {
            taskDualSum += (duals.taskCoverageDuals[taskId] ?: Flt64.zero)
        }
        val resourceDualCost = duals.sharedFeedingDual * feedingKg
        val convexityDual = duals.lineConvexityDuals[column.lineId] ?: Flt64.zero

        val reducedCost = column.totalScheduleCost - taskDualSum - resourceDualCost - convexityDual
        return Ok(reducedCost)
    }

    fun isImprovingColumn(reducedCost: Flt64): Boolean = reducedCost ls improvementTolerance
}

// 5. Pricing subproblem solver contract: strictly separate the RL/heuristic fast path from the certifiable exact-pricing fallback path
interface LinePricingSubproblemPort {
    val lineId: String
    /** Fast path: may be implemented by a heuristic or constrained RL; allowed to time out or return an empty list */
    fun proposeFastCandidateColumns(duals: RmpDualPriceSnapshot): List<LineScheduleColumn>
    /** Exact certification path: solved via OSPF LinearMetaModel / dynamic programming, supplying the dual lower bound and the global convergence proof */
    fun solveExactPricingColumn(duals: RmpDualPriceSnapshot): Ret<List<LineScheduleColumn>>
}

// 6. DDD column generation coordinator: builds the OSPF restricted master problem (RMP) and manages the "RL acceleration -> OR guard -> exact certification fallback" loop
class OspfColumnGenerationCoordinator(
    private val guard: OspfCandidateColumnGuard = OspfCandidateColumnGuard()
) {
    /**
     * Build the OSPF restricted master problem (RMP) from the current column pool
     */
    fun buildRestrictedMasterModel(
        allTaskIds: Set<String>,
        allLineIds: Set<String>,
        columnPool: List<LineScheduleColumn>,
        remainingSharedFeedingLimit: Quantity<Flt64> // remaining shared feeding limit after deducting feeding that has actually occurred
    ): Ret<Pair<LinearMetaModel, Map<String, URealVar>>> {
        val rmpModel = LinearMetaModel("DOP_RMP_Master")
        val lambdaVars = mutableMapOf<String, URealVar>()

        val limitKg = when (val r = OspfBoundaryAdapter.convertQuantitySafely(remainingSharedFeedingLimit, Kilogram)) {
            is Ok -> r.value.value
            is Failed -> return r
        }

        // 1) Register a master problem weight variable \lambda_k \in [0, 1] for each column in the pool
        for (col in columnPool) {
            val v = URealVar("lambda_${col.columnId}")
            v.range.leq(Flt64.one)
            rmpModel.add(v)
            lambdaVars[col.columnId] = v
        }

        // 2) Global task coverage constraint: \sum_{k: i \in col_k} \lambda_k >= 1
        for (taskId in allTaskIds) {
            val coverPoly = MutableLinearPolynomial()
            for (col in columnPool) {
                if (taskId in col.coveredTaskIds) {
                    coverPoly += Flt64.one * lambdaVars.getValue(col.columnId)
                }
            }
            when (val res = rmpModel.addConstraint(LinearPolynomial(coverPoly) geq Flt64.one, name = "rmp_cover_$taskId")) {
                is Ok -> {}
                is Failed -> return Failed(res.error)
            }
        }

        // 3) Convexity constraint per line: \sum_{k \in Line_l} \lambda_k <= 1
        for (lineId in allLineIds) {
            val convPoly = MutableLinearPolynomial()
            for (col in columnPool.filter { it.lineId == lineId }) {
                convPoly += Flt64.one * lambdaVars.getValue(col.columnId)
            }
            when (val res = rmpModel.addConstraint(LinearPolynomial(convPoly) leq Flt64.one, name = "rmp_conv_$lineId")) {
                is Ok -> {}
                is Failed -> return Failed(res.error)
            }
        }

        // 4) Coupled capacity constraint of the cross-line shared feeding port: \sum_{k} feedingKg_k * \lambda_k <= limitKg
        val sharedFeedingPoly = MutableLinearPolynomial()
        for (col in columnPool) {
            val colKg = when (val r = OspfBoundaryAdapter.convertQuantitySafely(col.totalFeedingMass, Kilogram)) {
                is Ok -> r.value.value
                is Failed -> return r
            }
            sharedFeedingPoly += colKg * lambdaVars.getValue(col.columnId)
        }
        when (val res = rmpModel.addConstraint(LinearPolynomial(sharedFeedingPoly) leq limitKg, name = "rmp_shared_feeding")) {
            is Ok -> {}
            is Failed -> return Failed(res.error)
        }

        // 5) Master problem objective: minimize \sum_k c_k * \lambda_k
        val totalCostPoly = MutableLinearPolynomial()
        for (col in columnPool) {
            totalCostPoly += col.totalScheduleCost * lambdaVars.getValue(col.columnId)
        }
        rmpModel.minimize(LinearPolynomial(totalCostPoly), name = "rmp_total_schedule_cost")

        return Ok(rmpModel to lambdaVars)
    }

    /**
     * One round of subproblem pricing dispatch (strictly enforcing the constrained-RL boundary of Section 13.3):
     * first call the fast/RL path and validate through OspfCandidateColumnGuard;
     * if no improving column is found or convergence certification is required, forcibly fall back to solveExactPricingColumn to complete the exact-pricing proof!
     */
    fun priceNewColumnsWithExactFallback(
        duals: RmpDualPriceSnapshot,
        pricingPort: LinePricingSubproblemPort,
        lineValidator: SingleLineDomainValidator,
        forceExactCertification: Boolean = false
    ): Ret<Pair<List<LineScheduleColumn>, Boolean>> { // returns: (verified improving columns, whether exact pricing certification was performed)
        if (!forceExactCertification) {
            val fastProposals = runCatching { pricingPort.proposeFastCandidateColumns(duals) }.getOrDefault(emptyList())
            val verifiedFastCols = fastProposals.filter { candidate ->
                when (val rcRes = guard.verifyAndComputeReducedCost(candidate, duals, lineValidator)) {
                    is Ok -> guard.isImprovingColumn(rcRes.value)
                    is Failed -> false // automatically intercept and discard RL candidate columns that break domain hard constraints or have a non-improving reduced cost
                }
            }
            if (verifiedFastCols.isNotEmpty()) {
                return Ok(verifiedFastCols to false)
            }
        }

        // Forced exact fallback: when the RL/heuristic path finds no improving column, times out, or we are in the final convergence certification stage, exact pricing must run!
        val exactProposals = when (val exactRes = pricingPort.solveExactPricingColumn(duals)) {
            is Ok -> exactRes.value
            is Failed -> return Failed(exactRes.error)
        }
        val verifiedExactCols = exactProposals.filter { candidate ->
            when (val rcRes = guard.verifyAndComputeReducedCost(candidate, duals, lineValidator)) {
                is Ok -> guard.isImprovingColumn(rcRes.value)
                is Failed -> false
            }
        }
        return Ok(verifiedExactCols to true)
    }
}
```

---

## 11.4 Taming Benders decomposition with a DDD architecture: master/subproblem decoupling, feasibility/optimality cut verification and the convergence certification boundary

Complementing column generation, which decomposes vertically by resource or plan column, another sharp tool in OR for multi-stage, cross-system coordinated optimization is **Benders decomposition**.

In a digital operations platform (DOP), many decisions naturally have a two-stage structure: "fix the macro skeleton first, then verify micro execution" or "a deterministic master plan plus multi-scenario stochastic disturbance evaluation":
* In the coordination of a master production plan with detailed scheduling, for example, the **first stage (master problem)** decides cross-plant order allocation, main capacity activation and key material transfer; the **second stage (subproblems)** then check, under the given allocation, whether each workshop's detailed operation schedule, shared feeding-port constraints and WMS/TMS kitting and loading are feasible, and what the concrete execution cost is.
* Likewise in robust optimization and stochastic programming, the **master problem** decides the baseline schedule, while **hundreds or thousands of subproblems** each represent an adaptability check under a different capacity-fluctuation, duration-delay or demand-change scenario.

Under DDD and `ospf`, Benders decomposition is likewise built as a highly modular collaboration pipeline with a strict mathematical certification boundary:

![The Benders decomposition collaboration loop under a DDD architecture: 1. the Benders master problem hands down the current master fixed solution (trial solution) to 2. the Benders subproblem group; the subproblem group constructs Benders feasibility cuts and Benders optimality cuts, and passes them to 3. the cut validity verification and convergence certification guard, which certifies them before the certified feasibility/optimality cuts are re-injected.](assets/diagrams/chapter-11-4.svg)

In engineering practice the Benders decomposition architecture follows three iron rules:
1. **Master and subproblems communicate through domain snapshots and a structured cut contract**: the master problem need not perceive the complex operation or logistics detail inside a subproblem; when a subproblem finishes solving, it returns to the master a **structured cut (feasibility cut / optimality cut)** bound to a stable symbolic identity, expressing "which linear inequality the master's allocation variables must satisfy so that workshop scheduling stays feasible and not too costly".
2. **Feasibility and optimality cuts must pass dual mathematical certification**: even when heuristics or machine learning/reinforcement learning are introduced to choose the scenario solving order, manage cut pool priority or directly predict and propose candidate cuts, every feasibility or optimality cut that actually joins the master problem **must have its validity verified by the OR optimization layer from certified primal/dual information**; an invalid cut is never allowed to pollute the master's feasible region.
3. **Bounds and termination criteria are not tamperable**: the global upper and lower bounds and the termination gap of the whole decomposition must be computed 100% from exactly verified master and subproblem mathematical results; no external estimation model has the authority to declare convergence.

### Engineering implementation: Benders cut verification and convergence certification guard code based on OSPF LinearMetaModel and LinearInequality

```kotlin
package org.adaptive.dop.algorithm.benders

import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.error.*
import fuookami.ospf.kotlin.utils.functional.*
import fuookami.ospf.kotlin.core.frontend.variable.*
import fuookami.ospf.kotlin.core.frontend.expression.monomial.*
import fuookami.ospf.kotlin.core.frontend.expression.polynomial.*
import fuookami.ospf.kotlin.core.frontend.inequality.*
import fuookami.ospf.kotlin.core.frontend.model.mechanism.*

// 1. Benders cut types and the structured cut contract based on OSPF linear polynomials
enum class BendersCutType { FEASIBILITY_CUT, OPTIMALITY_CUT }

data class CertifiedBendersCut(
    val cutId: String,
    val scenarioId: String,
    val cutType: BendersCutType,
    // linear approximate lower-bound expression of the cut's right-hand side in the master decision variables x: \alpha + \pi^T (b - T x)
    val masterRhsPolynomial: LinearPolynomial,
    // value computed from the subproblem's exact dual proof at the current master fixed solution x_bar (used to verify that the cut validly removes the current infeasible/suboptimal point)
    val evaluatedValueAtTrialPoint: Flt64,
    val isDualCertified: Boolean // marks whether this cut has been verified against the subproblem's exact primal/dual information
)

/**
 * Benders cut validity guard and master problem injector:
 * it is strictly forbidden for a heuristic/RL guessed cut without dual certification to slip into the master problem and cut off the true global optimum!
 */
class OspfBendersCutGuard(
    private val cutViolationTolerance: Flt64 = Flt64(1e-6)
) {
    /**
     * Verify and inject a feasibility or optimality cut into the OSPF Benders master problem (LinearMetaModel):
     * - For a feasibility cut: requires masterRhsPolynomial <= 0, and evaluatedValue > tolerance at the current trial point (it really does cut off the current infeasible point)
     * - For an optimality cut: requires the subproblem cost auxiliary variable \theta >= masterRhsPolynomial, and evaluatedValue > currentTheta + tolerance
     */
    fun verifyAndInjectCut(
        masterModel: LinearMetaModel,
        thetaVar: URealVar, // auxiliary variable in the master problem representing the lower bound of the stage-two subproblem cost \theta_s
        currentTrialAssignment: Map<AbstractVariableItem<*, *>, Flt64>,
        candidateCut: CertifiedBendersCut
    ): Ret<LinearInequality> {
        // Guard 1: must be certified by the subproblem's exact primal/dual information
        if (!candidateCut.isDualCertified) {
            return Failed(
                Err(ErrorCode.ApplicationError, "Benders guard blocked: cut [${candidateCut.cutId}] is not certified by subproblem dual mathematics and must not be injected into the master problem!")
            )
        }

        // Guard 2: evaluate independently at the current master fixed solution and verify the polynomial value matches the dual proof value
        val polyValAtTrial = candidateCut.masterRhsPolynomial.evaluate(currentTrialAssignment)
            ?: return Failed(Err(ErrorCode.SymbolNotFound, "Cut [${candidateCut.cutId}] contains an unbound master problem variable"))

        if (polyValAtTrial neq candidateCut.evaluatedValueAtTrialPoint) {
            return Failed(
                Err(ErrorCode.ApplicationError, "Cut [${candidateCut.cutId}] expression value ($polyValAtTrial) does not match the dual certificate value (${candidateCut.evaluatedValueAtTrialPoint})!")
            )
        }

        // Guard 3: construct an OSPF LinearInequality and register it in the master LinearMetaModel
        val inequality: LinearInequality = when (candidateCut.cutType) {
            BendersCutType.FEASIBILITY_CUT -> {
                if (polyValAtTrial leq cutViolationTolerance) {
                    return Failed(Err(ErrorCode.ApplicationError, "Invalid feasibility cut [${candidateCut.cutId}]: does not cut off the current infeasible trial point ($polyValAtTrial <= 0)"))
                }
                candidateCut.masterRhsPolynomial leq Flt64.zero
            }
            BendersCutType.OPTIMALITY_CUT -> {
                val currentTheta = currentTrialAssignment[thetaVar] ?: Flt64.zero
                if ((polyValAtTrial - currentTheta) leq cutViolationTolerance) {
                    return Failed(Err(ErrorCode.ApplicationError, "Non-improving optimality cut [${candidateCut.cutId}]: does not raise the current lower bound theta ($currentTheta)"))
                }
                // \theta >= masterRhsPolynomial  <==>  thetaVar - masterRhsPolynomial >= 0
                thetaVar geq candidateCut.masterRhsPolynomial
            }
        }

        return when (val addRes = masterModel.addConstraint(inequality, name = candidateCut.cutId)) {
            is Ok -> Ok(inequality)
            is Failed -> Failed(addRes.error)
        }
    }

    /**
     * Independent convergence certification guard:
     * the global upper bound (UB) and lower bound (LB) must be computed from exactly certified master/subproblem results; an RL estimate must never substitute for them!
     */
    fun certifyConvergence(
        certifiedLowerBound: Flt64,
        certifiedUpperBound: Flt64,
        allScenariosExactCertified: Boolean,
        relativeGapTolerance: Flt64 = Flt64(1e-4)
    ): Boolean {
        if (!allScenariosExactCertified) return false
        val denom = maxOf(abs(certifiedUpperBound), Flt64.one)
        val gap = (certifiedUpperBound - certifiedLowerBound) / denom
        return gap leq relativeGapTolerance
    }
}
```
