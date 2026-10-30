# Chapter 12: Beyond “Infeasible” — The Orthogonal SolveReport Protocol and Layered Self-Explanation

Once an optimization model finishes running — whether a single MILP solve, or the column generation and Benders decomposition of Chapter 11 — the software engineering chain reaches the step that is most easily brushed aside and yet has the largest effect on user experience: **how do we report the solve result to the business system and to the human planner?**

In traditional industrial software this step is often a disaster. This chapter examines in depth why a crude "success/failure" return value leaves a scheduling system stuck on a complex shop floor, and shows how to build, on the `ospf` base framework, an **orthogonal solve-result protocol (`SolveReport`)**, **mathematical diagnostic evidence for feasible and infeasible outcomes**, and a **four-layer self-explanation architecture**, so that every solve conclusion stands up to mathematical scrutiny, business retrospective and agent attribution.

***

## 12.1 Why does returning only "success/failure", or a run of solver log, leave the planner stuck?

Let us return to a real scheduling workbench. Suppose that at `10:00` this morning a planner adds the constraint "lines A and B share a feeding port, and the total feeding quantity must not exceed 1000 kg", then clicks the "simulate rescheduling" button. Thirty seconds later, a traditional bolt-on algorithm interface pops up exactly one of two results:

* **Case one: a dialog says "scheduling succeeded!" and a Gantt chart refreshes.** Looking at the new Gantt chart, the planner is full of doubt: is this plan proven globally optimal, or merely an initial feasible solution the solver spat out when the 30-second limit hit, with a large gap still open (an optimality gap of 25%)? Why is order M's due date pushed back in this new plan? Is it because the shared feeding port is saturated, or because equipment capacity is short?
* **Case two: a dialog says "solve failed: the model is infeasible (Infeasible)", or the interface simply prints hundreds of lines of English solver console log (Solver Log).** The planner is completely lost: does no feasible schedule exist physically (proven infeasible), or was the problem simply too complex and the 30-second timeout expired before the first feasible solution was found (timed out with no incumbent)? Or did the solver license expire, memory overflow, or the network drop? If a rule conflict really did make the model infeasible, then among the thousands of scheduling constraints in the plant, **which constraints collide to cause the conflict**? How many kilograms must the feeding-port cap be relaxed by, or which order's due date must be pushed back by a few hours, before planning runs again?

If the algorithm interface returns only a `"SUCCESS" / "FAILED"` status string, or a business service scrapes the solver's English text log with regular expressions, machines cannot make reliable automated branching decisions. Worse, if a large language model is then asked to "freely improvise an explanation" from such a fuzzy status, it will dress unfounded guesses as seemingly confident conclusions and seriously mislead production decisions!

***

## 12.2 The orthogonal solve-result protocol (`SolveReport`): decoupling problem status, termination reason and solution presence — never misreporting "timed out with no solution" as "infeasible"

To eradicate this confusion at the root, the base framework (`ospf-kotlin` and the planned `OSPF-SOL-*` solve-protocol family) establishes one core design principle: **whether the run completed, what the state of the mathematical problem itself is, and whether a usable solution is currently in hand are three fully orthogonal dimensions, and they must be expressed orthogonally through a unified `SolveReport` (solve report protocol)**!

Whether the solve runs in local memory, as a decomposed composite, or on remote compute, it must uniformly return a `SolveReport` containing the following core orthogonal dimensions:

![The unified orthogonal solve-result protocol (SolveReport) unfolds into five orthogonal dimensions: 1. mathematical problem status (problemStatus), 2. solve termination reason (terminationReason), 3. current solution presence (solutionPresence), 4. objective and bound metrics (Objective & Gap), 5. provenance and attempt trace (Provenance & Trace).](../.gitbook/assets/chapter-12-1.svg)

1. **`problemStatus` (mathematical problem status)**: describes the objective properties of the mathematical model itself — proven optimal (`Optimal`), proven infeasible (`Infeasible`), proven unbounded (`Unbounded`), or not yet finally proven (`Indeterminate` / `Feasible`);
2. **`terminationReason` (solve termination reason)**: describes why the solver stopped — because it completed a mathematical convergence proof, or because it reached the time limit (`TimeLimit`), the node limit (`NodeLimit`), an iteration limit, or user cancellation (`Cancelled`), or because it hit numerical ill-conditioning, a license failure or an infrastructure error;
3. **`solutionPresence` (solution presence)**: explicitly declares whether the current report contains at least one executable **incumbent solution**;
4. **Objective value, bounds and optimality gap (Objective, Best Bound & Optimality Gap)**: when a feasible solution exists, reports the current objective value, the proven best theoretical bound (Best Bound) and the optimality gap percentage (Gap) between the two at the same time; it is strictly forbidden to give only an objective value and conceal how far it still is from the optimal bound;
5. **Model/config fingerprint, solver provenance and composite solve attempt trace (Attempt Trace)**: fully records the hash fingerprint of the mathematical model in this solve, the solver configuration parameters actually in effect, and the solver name and version provenance; if a composite solve strategy of "heuristics first, then controlled RL pricing, finally exact solving as a fallback" is used, the `attempt trace` of every step must also be kept in full.

Relying on the combination of these three orthogonal dimensions, the base framework forces every solve output into exactly **five standard result classes**, and lays down an architectural iron rule:

| Standard result class                                     | `problemStatus`                                               | `solutionPresence`                                                   | Typical `terminationReason`                                                                            | Architectural and frontend-display governance iron rule                                                                                                                                                                                                   |
| --------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Feasible and proven optimal**                        | `Optimal`                                                     | <p><strong>Has an incumbent solution</strong><br>(Has Incumbent)</p> | Convergence proof completed (Gap ≈ 0 within tolerance)                                                 | Fully report the incumbent solution, objective value, best bound, optimality gap, critical binding constraints and any available sensitivity evidence.                                                                                                    |
| **2. Feasible but not proven optimal**                    | <p><code>Feasible</code> /<br><code>Suboptimal</code></p>     | <p><strong>Has an incumbent solution</strong><br>(Has Incumbent)</p> | Time limit reached (`TimeLimit`) or node limit reached (`NodeLimit`)                                   | Report the incumbent solution, the current lower and upper bounds and the optimality gap (Gap); **it is strictly forbidden to display or report such a "time-limited feasible" result as "already optimal"**!                                             |
| **3. Proven infeasible**                                  | `Infeasible`                                                  | <p><strong>No feasible solution</strong><br>(No Solution)</p>        | Infeasibility proof completed                                                                          | Report the level of the infeasibility proof, and provide any available irreducible infeasible subsystem (IIS), conflict set, Farkas certificate or equivalent mathematical evidence, linking back to the original constraints through stable element IDs. |
| **4. Unbounded or undecidable**                           | <p><code>Unbounded</code> /<br><code>Indeterminate</code></p> | No solution (or contains an unbounded ray)                           | Unboundedness proof completed / model capability unsupported / numerical ill-conditioning              | Strictly distinguish proven mathematical unboundedness, unsupported underlying-solver capability and numerical stability failure; keep the unbounded ray (Unbounded Ray) diagnostic when the backend supports it.                                         |
| **5. No solution returned, but infeasibility not proven** | <p><code>Unknown</code> /<br><code>Indeterminate</code></p>   | <p><strong>No incumbent solution</strong><br>(No Incumbent)</p>      | **Timed out before the first feasible solution was found** / user cancelled / license or parsing error | **Highest-priority error-prevention iron rule: it is absolutely forbidden to collapse "timed out without finding an incumbent", cancellation or a system error into `Infeasible`**; the true termination reason must be preserved!                        |

***

## 12.3 Mathematical evidence for feasible and infeasible solves: optimality gap (Gap), slack/violation, critical binding constraints and the irreducible infeasible subsystem (IIS / conflict set)

Telling the five classes apart is not enough. To support plan comparison (What-if), bottleneck analysis and conflict de-mining, `SolveReport` must also provide structured **mathematical diagnostic evidence (Diagnostic Evidence)** for the "feasible" and "infeasible" cases separately:

### 1. Diagnostic evidence when the solve is "feasible (classes 1 and 2)"

When the solver has found a feasible plan, the planner needs to know where the plan is good and where the bottleneck bites. The report then provides:

* **Decision-variable and named intermediate values**: the exact value and physical unit of every decision variable and domain intermediate value (such as `plannedFeeding[lineA]`, or each task's estimated start/end time);
* **Objective breakdown (Objective Breakdown)**: decomposes the total objective value into the contribution of each business sub-item — due-date delay penalty, changeover time cost, inventory holding cost, overtime cost — so that it is immediately clear where the plan paid its price;
* **Constraint left- and right-hand-side evaluation (LHS / RHS), slack and violation**: for every structured constraint, gives its actually computed left-hand side (LHS), right-hand bound (RHS), remaining headroom (slack) and, for soft constraints, the violation, all under the current solution;
* **Binding status and dual/reduced cost**: automatically identifies the **critical binding constraints** whose slack is zero (that is, they have hit the ceiling and are holding the objective back from further improvement), and provides dual prices (shadow prices) and reduced costs when the solver supports it. For example, it states directly with mathematical evidence: "the current shared feeding-port constraint `LHS = 1000 kg, RHS = 1000 kg, Slack = 0` is binding, and is the bottleneck constraint that keeps tasks T2/T3 from starting any earlier".

### 2. Diagnostic evidence when the solve is "proven infeasible or unbounded (classes 3 and 4)"

When the model is proven to have no feasible solution at all, what the planner needs most is precise de-mining. The report then provides:

* **Stable model element IDs (Stable Model Element IDs)**: when the model is built, every constraint and variable is assigned a stable element ID that is consistent across solvers, so that a diagnostic result can be traced precisely back to the original expression;
* **Irreducible infeasible subsystem (IIS, Irreducible Inconsistent Subsystem) or conflicting constraint set (Conflict Set)**: extracts precisely, from thousands of scheduling constraints, a minimal set of mutually contradictory constraints (a set in which removing any single constraint makes the subsystem feasible again), or provides a Farkas infeasibility certificate, the unbounded ray and controlled constraint relaxation suggestions (Relaxation Suggestions).

When providing this diagnostic evidence, the base framework enforces one **"evidence honesty guard" principle**:

> **Every piece of diagnostic evidence must explicitly declare its source, whether the underlying solver's capability supports it, its evidence precision grade (a strict exact mathematical proof, Exact, or a heuristic conflict filter, Heuristic), and the true reason when it is missing. When the underlying solver does not support computing an IIS, the report must explicitly return "capability missing (Capability Missing)"; fabricating an IIS is absolutely forbidden, and passing off a conflict list guessed by heuristic search as a strict mathematical infeasibility proof is equally forbidden**!

### Engineering implementation: the OSPF-based orthogonal solve report (`OspfSolveReport`) and the constraint slack/binding diagnoser code

Below is the code for the orthogonal solve report protocol and the diagnostic evidence extractor, implemented directly on `ospf-kotlin` (`Flt64`, `SolverStatus`, `FeasibleSolverOutput`, `LinearMetaModel`, `LinearInequality`, `InequalitySign`):

```kotlin
package org.adaptive.dop.foundation.report

import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.error.*
import fuookami.ospf.kotlin.utils.functional.*
import fuookami.ospf.kotlin.core.frontend.inequality.*
import fuookami.ospf.kotlin.core.frontend.model.mechanism.*
import fuookami.ospf.kotlin.core.backend.solver.output.*

// 1. Three strictly orthogonal status dimension enums (carried by the OSPF-SOL-* spec)
enum class OrthogonalProblemStatus {
    PROVEN_OPTIMAL,         // Class 1: proven globally optimal
    FEASIBLE_SUBOPTIMAL,    // Class 2: a feasible solution was found, but optimality is unproven (time limit, etc.)
    PROVEN_INFEASIBLE,      // Class 3: mathematically proven absolutely infeasible
    PROVEN_UNBOUNDED,       // Class 4: mathematically proven unbounded
    INDETERMINATE           // Class 4/5: verdict not reached (timed out before the first feasible solution, user cancelled, numerical or infrastructure error)
}

enum class OrthogonalTerminationReason {
    CONVERGED_TO_OPTIMALITY,
    PROVEN_INFEASIBLE_OR_UNBOUNDED,
    TIME_LIMIT_REACHED,
    NODE_OR_ITERATION_LIMIT,
    USER_CANCELLED,
    NUMERICAL_INSTABILITY,
    LICENSE_OR_INFRA_ERROR
}

enum class OrthogonalSolutionPresence {
    HAS_INCUMBENT_SOLUTION, // At least one usable incumbent solution exists
    NO_SOLUTION             // No feasible solution was returned
}

// 2. Diagnostic evidence precision grade and the infeasibility conflict evidence contract (evidence honesty guard: when IIS is unsupported, Missing must be declared explicitly!)
enum class EvidencePrecisionGrade { EXACT_MATHEMATICAL_PROOF, HEURISTIC_CONFLICT_FILTER }

sealed interface InfeasibilityDiagnosticEvidence {
    /** The backend supports it and conflict evidence was extracted successfully (IIS, conflict set or Farkas certificate) */
    data class Provided(
        val precisionGrade: EvidencePrecisionGrade,
        val conflictingConstraintElementIds: List<String>, // List of stable model element IDs
        val farkasDualCertificate: Map<String, Flt64> = emptyMap(),
        val providerSolverName: String
    ) : InfeasibilityDiagnosticEvidence

    /** The backend does not support IIS, or extraction did not finish before the timeout: never fabricate an IIS, return the missing reason explicitly! */
    data class CapabilityMissing(
        val missingReason: String,
        val solverName: String,
        val solverSupportsExactIIS: Boolean = false
    ) : InfeasibilityDiagnosticEvidence
}

// 3. Evaluation, slack, violation and binding diagnosis of one constraint under the current feasible solution
data class EvaluatedConstraintEvidence(
    val elementId: String,          // Stable model element ID, e.g. "c_shared_feeding_limit_lineAB_day1"
    val displayName: String,
    val lhsEvaluated: Flt64,        // Actually computed value of the left-hand polynomial under the current solution
    val sign: Sign,                 // OSPF inequality direction (LessEqual / Equal / GreaterEqual)
    val rhsConstant: Flt64,         // Right-hand bound value
    val slack: Flt64,               // Remaining headroom (>= 0)
    val violation: Flt64,           // Violation (> 0 if it exceeds bounds through soft-constraint relaxation or tolerance)
    val isCriticalBinding: Boolean  // Marks a critical binding constraint when Slack is 0 within tolerance!
)

// 4. Composite solve attempt trace (Attempt Trace): records each step of "heuristic -> RL pricing -> exact MILP"
data class SolveAttemptStep(
    val stepIndex: Int,
    val strategyName: String,
    val solverBackend: String,
    val elapsedMs: Long,
    val resultingStatus: OrthogonalProblemStatus,
    val foundIncumbent: Boolean,
    val gapAfterStep: Flt64?
)

// 5. Unified orthogonal solve report (OspfSolveReport) -- with constructor error-prevention guards
data class OspfSolveReport(
    val modelFingerprintHash: String,
    val solverName: String,
    val solverVersion: String,
    val problemStatus: OrthogonalProblemStatus,
    val terminationReason: OrthogonalTerminationReason,
    val solutionPresence: OrthogonalSolutionPresence,
    val objectiveValue: Flt64?,
    val bestBound: Flt64?,
    val optimalityGap: Flt64?,
    val variableSolutionMap: Map<String, Flt64>,
    val intermediateSymbolValues: Map<String, Flt64>,
    val objectiveBreakdown: Map<String, Flt64>,
    val constraintEvidences: List<EvaluatedConstraintEvidence>,
    val infeasibilityEvidence: InfeasibilityDiagnosticEvidence?,
    val attemptTrace: List<SolveAttemptStep>
) {
    init {
        // Guard 1: a timeout without an incumbent, cancellation or an infrastructure error must never be collapsed into PROVEN_INFEASIBLE!
        if (solutionPresence == OrthogonalSolutionPresence.NO_SOLUTION &&
            terminationReason in setOf(
                OrthogonalTerminationReason.TIME_LIMIT_REACHED,
                OrthogonalTerminationReason.USER_CANCELLED,
                OrthogonalTerminationReason.LICENSE_OR_INFRA_ERROR
            )
        ) {
            require(problemStatus == OrthogonalProblemStatus.INDETERMINATE) {
                "Protocol guard: when the termination reason is [$terminationReason] and there is no solution, problemStatus must be INDETERMINATE; reporting PROVEN_INFEASIBLE is forbidden!"
            }
        }
        // Guard 2: when the run stopped on a limit and the optimality gap exceeds tolerance, it must never be shown as PROVEN_OPTIMAL!
        if (problemStatus == OrthogonalProblemStatus.PROVEN_OPTIMAL) {
            require(solutionPresence == OrthogonalSolutionPresence.HAS_INCUMBENT_SOLUTION) {
                "Protocol guard: PROVEN_OPTIMAL must contain an incumbent solution!"
            }
            if (optimalityGap != null) {
                require(optimalityGap leq Flt64(1e-4)) {
                    "Protocol guard: the optimality gap ($optimalityGap) has not converged to zero; it must be marked FEASIBLE_SUBOPTIMAL, not PROVEN_OPTIMAL!"
                }
            }
        }
    }

    /** All critical binding constraints that block further improvement of the current plan (Slack == 0) */
    val criticalBindingConstraints: List<EvaluatedConstraintEvidence>
        get() = constraintEvidences.filter { it.isCriticalBinding }
}

// 6. Automatic diagnostic builder on top of the OSPF LinearMetaModel and the solve output
object OspfSolveReportBuilder {

    /**
     * Safely converts the underlying OSPF SolverStatus and FeasibleSolverOutput into an orthogonal OspfSolveReport,
     * and automatically walks metaModel.constraints to compute each constraint's LHS, RHS, Slack and binding status!
     */
    fun buildFromFeasibleOutput(
        metaModel: LinearMetaModel,
        solverName: String,
        solverVersion: String,
        output: FeasibleSolverOutput,
        intermediateValues: Map<String, Flt64>,
        attemptTrace: List<SolveAttemptStep> = emptyList()
    ): OspfSolveReport {
        metaModel.tokens.setSolution(output.solution)

        // 1) Orthogonally map OSPF SolverStatus -> (ProblemStatus, TerminationReason, SolutionPresence)
        val (probStatus, termReason) = when (output.status) {
            SolverStatus.Optimal -> OrthogonalProblemStatus.PROVEN_OPTIMAL to OrthogonalTerminationReason.CONVERGED_TO_OPTIMALITY
            SolverStatus.Feasible -> OrthogonalProblemStatus.FEASIBLE_SUBOPTIMAL to OrthogonalTerminationReason.TIME_LIMIT_REACHED
            else -> OrthogonalProblemStatus.FEASIBLE_SUBOPTIMAL to OrthogonalTerminationReason.NODE_OR_ITERATION_LIMIT
        }

        // 2) Walk the structured constraints in the OSPF LinearMetaModel and evaluate LHS, RHS, Slack and binding status automatically
        val constraintEvidences = metaModel.constraints.map { constraint: LinearInequality ->
            val lhsVal = constraint.lhs.evaluate(results = output.solution, tokenList = metaModel.tokens) ?: Flt64.zero
            val rhsVal = constraint.rhs.evaluate(results = output.solution, tokenList = metaModel.tokens) ?: Flt64.zero
            val diff = rhsVal - lhsVal // For lhs <= rhs, the remaining headroom is rhs - lhs

            val (slack, violation) = when (constraint.sign) {
                Sign.LessEqual -> if (diff geq Flt64.zero) diff to Flt64.zero else Flt64.zero to (-diff)
                Sign.GreaterEqual -> if (diff leq Flt64.zero) (-diff) to Flt64.zero else Flt64.zero to diff
                Sign.Equal -> Flt64.zero to abs(diff)
            }
            // Use OSPF Flt64's tolerance-aware equality eq Flt64.zero to decide whether it is a critical binding constraint
            val isBinding = (slack eq Flt64.zero) && (violation eq Flt64.zero)

            EvaluatedConstraintEvidence(
                elementId = constraint.name.ifBlank { "anon_c_${constraint.hashCode()}" },
                displayName = constraint.displayName ?: constraint.name,
                lhsEvaluated = lhsVal,
                sign = constraint.sign,
                rhsConstant = rhsVal,
                slack = slack,
                violation = violation,
                isCriticalBinding = isBinding
            )
        }

        val varMap = metaModel.tokens.tokens.associate { it.variable.name to (it.result ?: Flt64.zero) }

        return OspfSolveReport(
            modelFingerprintHash = "sha256:${metaModel.name}_${metaModel.constraints.size}_${metaModel.tokens.tokens.size}",
            solverName = solverName,
            solverVersion = solverVersion,
            problemStatus = probStatus,
            terminationReason = termReason,
            solutionPresence = OrthogonalSolutionPresence.HAS_INCUMBENT_SOLUTION,
            objectiveValue = output.obj,
            bestBound = output.possibleBestObj,
            optimalityGap = output.gap,
            variableSolutionMap = varMap,
            intermediateSymbolValues = intermediateValues,
            objectiveBreakdown = mapOf("total_objective" to output.obj),
            constraintEvidences = constraintEvidences,
            infeasibilityEvidence = null,
            attemptTrace = attemptTrace
        )
    }
}
```

***

## 12.4 The four-layer architecture of solve-result self-explanation: from low-level mathematical evidence, through algorithm symbol mapping and business object binding, to localized agent summarization

With the orthogonal `SolveReport` and honest mathematical diagnostic evidence in place, we can finally achieve true **"self-explaining solve results (Self-Explaining Solve Results)"**.

What this book means by "self-explanation" is **by no means letting the solver dump a pile of logs and then having a large language model invent a plausible-sounding excuse from them**. It is a **four-layer self-explanation architecture** with clearly divided authority and responsibility — each layer, strictly on the structured evidence handed up by the layer below, performs the explanation transformation that falls within its own remit:

![The four-layer self-explanation architecture from top to bottom: layer one, solver and compute backend (Solver / Backend Layer) → layer two, OSPF base framework layer (Base Framework Layer) → layer three, algorithm layer and APS/DOP application layer (Algorithm & Application Layer) → layer four, workbench presentation layer and agent layer (Presentation & Agent Layer).](../.gitbook/assets/chapter-12-2.svg)

Let us walk through an intuitive example: when the "shared feeding-port cap (1000 kg)" conflicts with the "hard constraint that a rush order must finish today" and the model becomes infeasible, how do these four layers work together to produce an airtight self-explaining report?

1. **Layers 1 and 2 (the `ospf` base framework)**: the underlying solver completes the infeasibility proof and extracts the minimal conflict set; `ospf` produces a `SolveReport` recording `problemStatus = PROVEN_INFEASIBLE` and `solutionPresence = NO_SOLUTION`, emits the list of conflicting constraint element IDs at exact grade (`EXACT_MATHEMATICAL_PROOF`) — `["c_shared_feeding_limit_lineAB_day1", "c_order_urgent_deadline", "c_actual_feeding_frozen"]` — and attaches the current mathematical model fingerprint `sha256:8f3a...`.
2. **Layer 3 (algorithm layer and application layer)**: the application layer uses the stable element IDs to look up the domain snapshots frozen for that round, and binds the three mathematical constraints precisely to concrete business objects:
   * `c_actual_feeding_frozen` → task `T1` on line A has already actually fed `450 kg` today (from the MES fact snapshot `#v102`);
   * `c_order_urgent_deadline` → if task `T2` on line A and task `T3` on line B must both finish today, then under the BOM and substitute-material rules the minimum planned feeding is `400 kg + 300 kg = 700 kg` (from the order and BOM snapshot `#v88`);
   * `c_shared_feeding_limit_lineAB_day1` → the dynamic constraint capping today's shared feeding port for lines A and B at `1000 kg` (from the temporary rule `#r09` submitted by the shop-floor supervisor at 10:00), while `450 + 700 = 1150 kg > 1000 kg`, leaving a hard capacity shortfall of `150 kg`.
3.  **Layer 4 (workbench and agent)**: the agent reads the authorized structured conflict evidence bundle from layer 3 and outputs to the planner a clear, auditable business explanation with candidate adjustment suggestions:

    > "The current schedule is mathematically proven infeasible (report fingerprint `8f3a` cited). The root cause is that the following three hard constraints cannot hold at the same time: `450 kg` has already actually been fed today, and the pending `T2` and `T3` still need at least `700 kg` of feeding (`1150 kg` in total), which exceeds the shared feeding-port cap of `1000 kg` that dynamic rule `#r09` sets for the day, by `150 kg`. You can choose one of two candidate plans to trial in the digital twin: **Option one**: postpone the second half of task `T3` (corresponding to `150 kg` of feeding) to tomorrow's early shift; **Option two**: apply to the shop floor to temporarily relax today's feeding-port maintenance cap from `1000 kg` to `1150 kg`."

### Engineering implementation: from the layer-2 `OspfSolveReport` to layer-3 business binding and layer-4 controlled agent self-explanation

```kotlin
package org.adaptive.dop.application.explanation

import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.physics.unit.*
import org.adaptive.dop.foundation.report.*

// 1. Layer 3 (application layer) domain constraint registration metadata: binds a stable model element ID to business objects and frozen snapshot versions
data class DomainConstraintBindingMeta(
    val elementId: String,
    val businessRuleName: String,
    val affectedObjectIds: List<String>, // e.g. ["lineA", "lineB", "task_T2", "task_T3"]
    val unit: PhysicalUnit,              // Native OSPF unit, e.g. Kilogram
    val sourceSnapshotVersion: String,   // e.g. "snapshot_bom_#v88" or "dynamic_rule_#r09"
    val authorizedRoles: Set<String>
)

// 2. Authorized structured business explanation evidence bundle that layer 3 emits to layer 4 (workbench / agent)
data class AuthorizedBusinessExplanationBundle(
    val modelFingerprintHash: String,
    val inputSnapshotVersion: String,
    val algorithmVersion: String,
    val solverProvenance: String,
    val problemStatus: OrthogonalProblemStatus,
    val terminationReason: OrthogonalTerminationReason,
    val solutionPresence: OrthogonalSolutionPresence,
    val objectiveSummary: String?,
    val bindingBottlenecks: List<String>,
    val verifiedConflictSetDescription: List<String>,
    val evidenceHonestyStatement: String // Explicitly declares the evidence grade, so the agent cannot inflate heuristic or missing evidence into a mathematical proof
)

/**
 * Four-layer self-explanation orchestration service for solve results:
 * strictly maps the mathematical report (OspfSolveReport) into a business evidence bundle bound to domain objects and version provenance;
 * forces the agent to summarize authorized evidence only, and never to rewrite problemStatus or invent an IIS!
 */
class SolveResultSelfExplanationService(
    private val constraintBindings: Map<String, DomainConstraintBindingMeta>,
    private val inputSnapshotVersion: String,
    private val algorithmVersion: String
) {
    fun buildAuthorizedExplanation(
        report: OspfSolveReport,
        callerRoles: Set<String>
    ): AuthorizedBusinessExplanationBundle {
        // 1) Filter and map the critical binding bottleneck constraints when a solution exists (permission trimming: unauthorized fields are not exposed to the agent)
        val bottlenecks = report.criticalBindingConstraints.mapNotNull { ev ->
            val meta = constraintBindings[ev.elementId] ?: return@mapNotNull null
            if (callerRoles.intersect(meta.authorizedRoles).isEmpty()) return@mapNotNull null
            "Bottleneck constraint [${meta.businessRuleName}] (elementId=${ev.elementId}, source=${meta.sourceSnapshotVersion}) has reached its limit: " +
            "current value=${ev.lhsEvaluated} ${meta.unit.symbol}, cap/bound=${ev.rhsConstant} ${meta.unit.symbol}, remaining slack=${ev.slack} ${meta.unit.symbol}, affected objects=${meta.affectedObjectIds}"
        }

        // 2) Map the conflict evidence when infeasible (evidence honesty guard enforced strictly)
        val (conflictDescriptions, honestyStatement) = when (val infEv = report.infeasibilityEvidence) {
            is InfeasibilityDiagnosticEvidence.Provided -> {
                val gradeText = when (infEv.precisionGrade) {
                    EvidencePrecisionGrade.EXACT_MATHEMATICAL_PROOF -> "Exact mathematical infeasibility proof (Exact IIS / Farkas)"
                    EvidencePrecisionGrade.HEURISTIC_CONFLICT_FILTER -> "Heuristic conflict filter list (not a strict mathematical minimal set; for reference only)"
                }
                val items = infEv.conflictingConstraintElementIds.map { id ->
                    val meta = constraintBindings[id]
                    if (meta != null && callerRoles.intersect(meta.authorizedRoles).isNotEmpty()) {
                        "Conflicting constraint [${meta.businessRuleName}] (ID=$id, bound objects=${meta.affectedObjectIds}, snapshot version=${meta.sourceSnapshotVersion})"
                    } else {
                        "Restricted constraint (ID=$id)"
                    }
                }
                items to "The current infeasibility diagnosis is based on [$gradeText] provided by backend [${infEv.providerSolverName}]."
            }
            is InfeasibilityDiagnosticEvidence.CapabilityMissing -> {
                emptyList<String>() to "Note: the underlying solver [${infEv.solverName}] did not provide an IIS conflict set (reason: ${infEv.missingReason}). The agent must never guess or fabricate a list of conflicting constraints!"
            }
            null -> {
                emptyList<String>() to "This solve did not trigger infeasibility conflict extraction (problem status: ${report.problemStatus}, termination reason: ${report.terminationReason})."
            }
        }

        val objSummary = if (report.solutionPresence == OrthogonalSolutionPresence.HAS_INCUMBENT_SOLUTION) {
            "current objective=${report.objectiveValue}, proven optimal bound=${report.bestBound}, optimality gap=${report.optimalityGap}"
        } else null

        return AuthorizedBusinessExplanationBundle(
            modelFingerprintHash = report.modelFingerprintHash,
            inputSnapshotVersion = inputSnapshotVersion,
            algorithmVersion = algorithmVersion,
            solverProvenance = "${report.solverName} (${report.solverVersion})",
            problemStatus = report.problemStatus,
            terminationReason = report.terminationReason,
            solutionPresence = report.solutionPresence,
            objectiveSummary = objSummary,
            bindingBottlenecks = bottlenecks,
            verifiedConflictSetDescription = conflictDescriptions,
            evidenceHonestyStatement = honestyStatement
        )
    }
}
```
