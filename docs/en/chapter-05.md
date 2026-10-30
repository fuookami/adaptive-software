<!-- i18n-status: translated -->
<!-- i18n-source: docs/zh/chapter-05.md -->
# Chapter 5: Unifying the Three Natives in a Formal Domain Model — Ending the Fragmentation of Business Semantics

In enterprise software that brings in operations research (OR), machine learning (ML) and large language model agents (Agent) — digital operations platforms (DOP) and advanced planning and scheduling (APS) systems, for instance — the most dangerous long-term architectural risk is not the operational burden of running several technology stacks side by side. It is **the outright fragmentation of business semantics**. Starting from the underlying logic of architectural dependencies, this chapter shows how a formal domain model unifies "OR-Native, ML-Native and Agent-Native" with the deterministic business system under a single semantic contract, and, using native `ospf-kotlin` components, presents an engineering implementation of state-role isolation and domain contracts.

---

## 5.1 Why is "all runtime sides sharing one formal domain model" the foundation of the whole architecture?

When Chapter 1 dissected the pain points of traditional architectures, we noted that enterprise software needs 15 core architectural capabilities on its path to intelligence (cohesive business logic, algorithms orchestratable by the application layer, algorithms and system sharing the same definitions, dynamic constraint injection, transparent intermediate values, testability, simulability, version snapshots, digital-twin projection, rolling scheduling and workflow orchestration, and dynamic agent adaptation and business reasoning, among others).

When we subject these 15 capabilities to a strict topological dependency analysis, one finding stands out: **"all runtime sides sharing one formal domain model" (point 8) is the common foundation that supports every higher-order capability**.

<div class="dg" role="img" aria-label="Architectural foundation: the formal domain model — (system, OR, ML and agent share one domain definition) — supporting, below it: shared definitions across algorithm and system, safe dynamic constraint injection, transparent and inspectable business intermediate values, dynamic digital-twin projection, agent reasoning and adaptation.">
<div class="dg-col">
<div class="dg-node dg-node--key"><span class="dg-t">Architectural foundation: formal domain model</span><span class="dg-s">(system, OR, ML and agent share one domain definition)</span></div>
<div class="dg-arms"><div class="dg-arm">↓</div><div class="dg-arm">↓</div><div class="dg-arm">↓</div><div class="dg-arm">↓</div><div class="dg-arm">↓</div></div>
<div class="dg-group"><div class="dg-node dg-node--leaf">Shared definitions across algorithm and system</div><div class="dg-node dg-node--leaf">Safe dynamic constraint injection</div><div class="dg-node dg-node--leaf">Transparent business intermediate values</div><div class="dg-node dg-node--leaf">Dynamic digital-twin projection</div><div class="dg-node dg-node--leaf">Agent reasoning and adaptation</div></div>
</div>
</div>

Why is it that once the cornerstone of a "shared formal domain model" is gone, every intelligent capability above it becomes a castle in the air? We can verify this along the dependency chain, one link at a time:

1. **Without a shared formal domain model, there can be no "algorithms and the system agreeing on business definitions".** If the business system and the OR algorithm each define "feeding quantity", "production duration", "changeover time", "capacity occupancy" and "material consumption" on their own, the system will hold two sets of code, two sets of unit conversions, two sets of boundary conditions and two sets of exception-handling logic at the same time. Under such an architecture, inconsistent definitions after a business rule update are not an occasional coding mistake; they are the inevitable outcome of a fragmented architecture.
2. **Without a shared formal domain model, safe "dynamic constraint injection" is impossible.** Dynamic constraints require scheduling variables and business intermediate values to be first-class citizens that can be referenced precisely at runtime. If the physical unit, the state role (planned or actual) and the time-aggregation definition of "feeding quantity" are not formally modeled, neither the system nor the agent can safely reference it at runtime to construct a mathematical inequality.
3. **Without a shared formal domain model, "transparent intermediate values" never gets off the ground.** Transparency of intermediate values is not achieved by stuffing a few more return fields into an interface; it is a natural by-product of the formal domain model. If feeding quantity, capacity occupancy or changeover duration exist only as temporary mathematical expressions inside an algorithm service, then after the solve the system receives only a pile of raw numbers with no business identity, and has no way to know "what business meaning this value carries, which rule it came from, and which variables computed it".
4. **Without a shared formal domain model, "dynamic digital-twin projection" and "rolling scheduling workflow orchestration" break apart.** The digital twin requires that when a preceding task reports a delay, the system can independently recompute the successor task's estimated time from changeover time, production duration and calendar availability; workflow orchestration requires that every node — "scheduling → substitute-material allocation → material consumption recomputation → MRP → release" — pass state through a unified data structure and business definition. If those models stay locked inside a single algorithm, or each node insists on its own version, projection and orchestration stall at the first step.
5. **Without a shared formal domain model, "agent business reasoning and dynamic adaptation" stays a word game.** An agent does not guess semantics by reading scattered business code; it must rely on the structured domain metadata the system exposes (referenceable variables, intermediate values, constraint templates, workflow node contracts and applicability boundaries) to turn a natural-language description from the shop floor into an executable plan that can be validated, audited and rolled back.

For this reason, the central direction of the platform architecture upgrade is to move away from the past patchwork pattern of "business system calls a black-box solver + calls a black-box forecasting service + calls a black-box large language model" and toward a **"three natives (OR-Native, ML-Native, Agent-Native)" architecture in which the business system, operations research, machine learning and the agent — four runtime sides — share one formal domain model**.

---

## 5.2 Four orthogonal interpretations of one business concept: numerical on the system side, symbolic on the OR side, statistical on the ML side and semantic on the agent side

In enterprise software where Software 1.0, 2.0 and 3.0 coexist, the same business concept — "capacity", "feeding quantity" or "time window" — appears at the same time in a system code field, a machine-learning feature matrix, an OR solver variable and the prompt context of a large language model.

| The same business concept | Deterministic business system (numerical computation) | Statistics / machine learning (probabilistic computation) | Operations research (symbols and mathematical programming) | Large language model / agent (semantic reasoning) |
| :--- | :--- | :--- | :--- | :--- |
| **Capacity** | Numerical computation / master-data configuration field | Historical production features / training labels / estimated productivity distribution | Resource capacity constraint upper bound / model parameter | An understandable, referenceable business concept with a statement of its provenance |
| **Feeding quantity** | Deterministic value computed from BOM and scrap / state | Input feature or supervision signal of a prediction model | Planned decision variable / linear or nonlinear constraint expression | The object referenced by temporary-rule reasoning and anomaly impact analysis |
| **Time** | Planned / estimated / actual three-layer state timestamps | Event occurrence time / historical observation window / label maturity cutoff | Delivery time window / operation precedence and changeover time constraints | Semantic context for reasoning about deviation propagation and the effective scope of a rule |

"Unifying the three natives in a formal domain model" by no means turns the system, OR, ML and the agent into four independent business languages. It lets them **share the same authoritative domain definition and execute four orthogonal runtime interpretations of the same concept, each according to its own runtime carrier**:

### 1. System side: deterministic numerical interpretation (Numerical Interpretation)
The business system (covering the application layer, the domain computation model and persisted state management) faces input data that is already explicit. It performs deterministic pure-function numerical computation and state-transition governance over the domain model. Given an order quantity, BOM explosion relations, substitute-material ratios and scrap coefficients, for instance, the system side directly computes line A's required feeding quantity `requiredFeeding[A] = 120 kg`, or directly derives a successor task's estimated start time from the predecessor task's actual end time.

### 2. OR-Native: symbolic and optimization interpretation (Symbolic Interpretation)
The essence of OR-Native is that domain knowledge can be mapped stably and unambiguously by the algorithm layer into a symbolic model that an optimization engine can consume. On the OR side, line A's planned feeding quantity `plannedFeeding[A]` is no longer a known static number; it is interpreted as a **planned decision variable (Decision Variable)** to be solved for, or as an algebraic expression built from decision variables (such as a `LinearExpressionSymbol` in `ospf`), subject to the shared feeding port capacity limit (`feedingLimit`) and the effective capacity constraint. When the underlying solver is replaced, the domain semantics stay unchanged and only the algorithm adapter layer recompiles the symbolic constraints.

### 3. ML-Native: statistical and probabilistic interpretation (Statistical / Probabilistic Interpretation)
The essence of ML-Native is that domain knowledge can be consumed by training and inference in a stable "statisticalized, probabilistic" way. On the ML side, historical production execution facts are normalized strictly by domain rules into named features (qualified output, actual duration, work unit, observation window) and prediction targets, and model inference outputs an estimated productivity `estimatedProductivity[A]` that carries a model version, evaluation quality metrics, a confidence interval (uncertainty) and a scope of applicability — never a bare black-box number of unknown origin.

### 4. Agent-Native: semantic and orchestration interpretation (Semantic Interpretation)
The essence of Agent-Native is that the domain model itself becomes a structured semantic contract that a large language model can read, reason over and compose directly. On the agent side, the model does not need to guess the underlying code implementation; through structured domain metadata it directly identifies "feeding port", "planned feeding quantity", "actual feeding fact" and "capacity estimate snapshot" together with their units and boundaries, and, combined with the current digital-twin context, outputs the affected object set, structured candidate constraints and simulation comparison options.

<div class="dg" role="img" aria-label="The formal domain model (the single authoritative business semantics and type contract) splits downward into four runtime interpretations: system-side runtime interpretation — deterministic pure numerical computation, requiredFeeding = 120; OR-Native runtime interpretation — decision variables and symbolic constraints, plannedFeeding &lt;= Limit; ML-Native interpretation — features/distributions and uncertainty, estimatedProductivity; Agent-Native runtime interpretation — open intent understanding and candidate generation, structured constraints and simulation plan candidates.">
<div class="dg-col">
<div class="dg-node dg-node--key"><span class="dg-t">Formal domain model</span><span class="dg-s">(single authoritative business semantics and type contract)</span></div>
<div class="dg-arms"><div class="dg-arm">↓</div><div class="dg-arm">↓</div><div class="dg-arm">↓</div><div class="dg-arm">↓</div></div>
<div class="dg-group">
<div class="dg-node dg-node--leaf"><span class="dg-t">System-side runtime interpretation</span><span class="dg-s">Deterministic pure numerical computation</span><span class="dg-s">requiredFeeding = 120</span></div>
<div class="dg-node dg-node--leaf"><span class="dg-t">OR-Native runtime interpretation</span><span class="dg-s">Decision variables and symbolic constraints</span><span class="dg-s">plannedFeeding &lt;= Limit</span></div>
<div class="dg-node dg-node--leaf"><span class="dg-t">ML-Native interpretation</span><span class="dg-s">Features/distributions and uncertainty</span><span class="dg-s">estimatedProductivity</span></div>
<div class="dg-node dg-node--leaf"><span class="dg-t">Agent-Native runtime interpretation</span><span class="dg-s">Open intent understanding and candidate generation</span><span class="dg-s">Structured constraints and simulation plan candidates</span></div>
</div>
</div>
</div>

Through these four orthogonal interpretations, the formal domain model plays two key roles at once: horizontally, it is the **common semantic contract** of the system, OR, ML and the agent; vertically, it is the **domain-language specification, type system and compilation contract** for `LLM as Runtime`.

---

## 5.3 State-role isolation: why does unifying the definition of "feeding quantity" never mean merging required, planned, predicted, estimated and actual quantities into one field?

The most dangerous trap engineering teams fall into while pursuing a "unified domain model" is **mistaking "unifying business concept definitions" for merging every "feeding quantity" or "capacity" into the same database field**.

We must state the architectural rule in the strictest terms: **what is unified is the semantics, physical dimension, computational relations and time-aggregation definition of a business concept — never the merging of required, planned, predicted, estimated and actual execution facts into one field!**

In a real production and supply-chain loop (ERP / APS / MES / WMS / TMS), the same business concept takes on sharply different **state roles (State Roles)** at different lifecycle stages, with strictly impassable boundaries between their entry points, mutability and governance rules:

| State role | Named expression, using "feeding quantity / capacity" as the example | Generation mechanism and authoritative source | Core governance rule |
| :--- | :--- | :--- | :--- |
| **1. Required role (Required)** | Required feeding quantity `requiredFeeding` | Computed on the system side by deterministic numerical calculation from order demand, BOM explosion, substitute-material rules and process scrap. | Reflects the theoretical demand baseline and is recomputed when the order or the BOM version changes. |
| **2. Predicted role (Predicted / Estimated Rate)** | Estimated productivity `estimatedProductivity` | Inferred by an ML or statistical estimator over a frozen historical observation window, carrying quality metrics, uncertainty and model lineage. | **A prediction must never masquerade as a manual configuration or an actual fact**; it must produce an immutable snapshot, and only after validation, approval and activation may it be frozen as an effective capacity overlay (`CapacityEffectiveOverlay`) and enter scheduling input. |
| **3. Planned role (Planned)** | Planned feeding quantity `plannedFeeding` | Acts as a decision variable (or an intermediate expression) inside the OR solve; after the solve it is parsed from the structured result and confirmed by the application layer as a formal plan version. | **An optimization solve result is only a suggestion or a baseline plan; it never equals a physical fact that has already happened on the floor**. |
| **4. Estimated role (Estimated / Projected)** | Estimated feeding quantity `estimatedFeeding`<br>Estimated start/end time | In digital-twin projection, a forecast of future state dynamically recomputed from the latest actual progress and the domain computation model. | Used to reflect in real time how a deviation propagates downstream; it must not directly overwrite a released baseline plan or fabricate actual production reporting. |
| **5. Actual role (Actual Fact)** | Actual feeding fact `actualFeeding`<br>Actual production duration | An **immutable execution fact** synchronized from external shop-floor execution systems such as MES, WMS and TMS and recorded through the fact entry point. | **The supreme boundary of physical fact**: only the execution fact entry point may append records; no algorithm solver, prediction model or LLM agent has the right to generate or tamper with actual facts! |

Let us return to the running example mentioned repeatedly in Chapters 1 and 4 — "lines A and B share a feeding port on the same day, and total feeding must not exceed the upper limit `feedingLimit`" — to see how state-role isolation plays a critical role at runtime:

Suppose rolling rescheduling is triggered at 10:00 on Tuesday morning, and line A's predecessor task `T1` has already finished and produced real feeding consumption within that day's time window. If the feeding limit `feedingLimit` is interpreted as a cumulative daily capacity limit, then the structured dynamic constraint that the agent and the compiler generate **must never** be written loosely as `plannedFeeding[A] + plannedFeeding[B] <= feedingLimit`. It must instead separate precisely "actual facts that have already occurred" from "remaining planned variables awaiting a decision":

```text
actualFeedingInWindow + plannedFeedingRemaining[A] + plannedFeedingRemaining[B] <= feedingLimit
```

In this expression:
* `actualFeedingInWindow` is the total actual feeding of the tasks already executed today, read from the MES/WMS fact entry point and frozen (an immutable constant fact);
* `plannedFeedingRemaining[A]` and `plannedFeedingRemaining[B]` are the planned feeding decision variables, within today's window, of the tasks still to be executed on lines A and B (such as `T2` and `T3`);
* if the floor limit is not a cumulative daily quantity but an instantaneous flow limit, the system switches, according to the domain catalog definition, to a constraint template aggregated by time bucket (Time Bucket).

Beyond that, in cross-system coordination (MES, WMS, TMS and APS), unified domain semantics and state-role isolation bring another important engineering resilience: **decoupling the arrival timing of external system documents from local computational consistency**. In a real factory, MES production reports, WMS material issue slips and TMS waybills can never be guaranteed to arrive at the same millisecond or to pair up completely; some external objects or optional traceability information (such as a production batch number) may be temporarily missing at a given moment. With clear state-role boundaries, as long as the synchronized execution facts satisfy the data conditions that the current domain computation requires, a missing optional traceability field must never block APS business computation; at the same time, planned, estimated and predicted values are still produced and propagated strictly by their own definitions, and never impersonate actual execution results just because an external document is late.

### Engineering implementation: strongly typed state-role isolation code built on OSPF-native `Quantity`, `PhysicalUnit` and `Ret`
In the implementation we **use the `Quantity<T>`, `PhysicalUnit` (such as `Kilogram`, `Ton`, `Hour`, `Kilogram / Hour`), `RealNumber<T>` and `Ret<T>` (`Ok` / `Failed`) that `ospf-kotlin-utils` provides natively**, locking down the boundaries of the five roles at compile time through a generic state-role marker (`StateRole`), and implement a prediction admission and activation machine together with an external-fact ingestion guard that tolerates missing optional traceability information:

```kotlin
package org.adaptive.dop.domain.role

import java.time.Instant
import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.physics.unit.*
import fuookami.ospf.kotlin.utils.physics.quantity.*
import fuookami.ospf.kotlin.utils.error.*
import fuookami.ospf.kotlin.utils.functional.*

// 1. Define five strictly isolated domain state-role marker interfaces (State Role Markers)
sealed interface StateRole {
    val roleCode: String
}

/** Required role: the theoretical demand the system side computes from BOM, planned output and scrap (e.g. requiredFeeding) */
data object RequiredRole : StateRole { override val roleCode = "REQUIRED" }

/** Predicted role: the predicted value output by an ML or statistical estimator (e.g. estimatedProductivity); before approval and activation it must never be used directly as plan input */
data object PredictedRole : StateRole { override val roleCode = "PREDICTED" }

/** Planned role: the suggested planned value produced by an OR solve (e.g. plannedFeeding); never equal to an actual fact that has already happened on the floor */
data object PlannedRole : StateRole { override val roleCode = "PLANNED" }

/** Estimated role: the estimated value that the digital twin derives from the latest actual progress (e.g. estimatedFeeding / estimated start and end time) */
data object EstimatedRole : StateRole { override val roleCode = "ESTIMATED" }

/** Actual role: the immutable fact recorded by the MES/WMS/TMS shop-floor execution fact entry point (e.g. actualFeeding) */
data object ActualFactRole : StateRole { override val roleCode = "ACTUAL_FACT" }

// 2. Build domain quantities with state role and version lineage directly on OSPF-native Quantity<T> (RoleScopedQuantity)
// Generic R is constrained to the state role StateRole, generic T to OSPF's RealNumber<T>
data class RoleScopedQuantity<R : RealNumber<T StateRole, T>>(
    val conceptName: String,       // unified domain concept name, such as "feeding_amount"
    val role: R,                   // strongly typed state role marker
    val quantity: Quantity<T>,     // reuses OSPF-native Quantity<T> directly (it carries the value and the PhysicalUnit)
    val businessObjectId: String,  // bound business object identifier, such as "lineA"
    val timeWindowId: String,      // bound time window identifier
    val snapshotVersion: String,   // source snapshot version or event ID
    val recordedAt: Instant
)

// 3. ML capacity estimation snapshot and the approval/activation state machine of the effective capacity overlay (CapacityEffectiveOverlay)
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
 * Effective capacity overlay (CapacityEffectiveOverlay):
 * only after passing the quality threshold and OSPF physical unit validation and obtaining business approval
 * may a prediction snapshot be converted into this type, frozen, and enter MPS/scheduling input!
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
            expectedRateUnit: PhysicalUnit = Kilogram / Hour, // compose the compound unit kg/h directly with OSPF-native unit division
            approver: String,
            now: Instant
        ): Ret<CapacityEffectiveOverlay<T>> {
            // 1) Validate the prediction quality threshold with the OSPF tolerance comparison operator ls (<)
            if (snapshot.qualityScore ls minQualityThreshold) {
                return Failed(
                    Err(ErrorCode.ApplicationError, "Prediction quality score (${snapshot.qualityScore}) is below the admission threshold ($minQualityThreshold); activation refused!")
                )
            }
            // 2) Validate and align the unit dimension directly with OSPF Quantity.to(expectedRateUnit)
            val alignedQty = snapshot.estimatedProductivity.quantity.to(expectedRateUnit)
                ?: return Failed(
                    Err(
                        ErrorCode.DimensionMismatch,
                        "Capacity estimate unit [${snapshot.estimatedProductivity.quantity.unit}] is dimensionally incompatible with the target effective capacity unit [$expectedRateUnit]"
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

// 4. Fault-tolerant ingestion guard for asynchronous execution facts across systems (MES / WMS / TMS)
data class MesFeedingFactDto(
    val eventId: String,
    val lineId: String?,
    val taskId: String?,
    val rawFeedingValue: Double?,
    val unit: PhysicalUnit?, // uses OSPF-native PhysicalUnit directly (such as Kilogram, Ton, Gram)
    val eventTime: Instant?,
    // Optional traceability document fields: when an external document has not arrived at the same time or a batch number is missing, never block the core APS feeding and progress computation
    val productionBatchNo: String? = null,
    val wmsPickOrderNo: String? = null
)

object MesFactIngestionGuard {
    fun ingestActualFeeding(
        dto: MesFeedingFactDto,
        targetMassUnit: PhysicalUnit = Kilogram, // uses the OSPF-native Kilogram unit directly
        timeWindowId: String
    ): Ret<RoleScopedQuantity<ActualFactRole, Flt64>> {
        val line = dto.lineId?.takeIf { it.isNotBlank() }
            ?: return Failed(Err(ErrorCode.IllegalArgument, "Missing field required for core computation: lineId"))
        val rawVal = dto.rawFeedingValue?.takeIf { it.isFinite() && it >= 0.0 }
            ?: return Failed(Err(ErrorCode.IllegalArgument, "Missing or illegal actual feeding value: rawFeedingValue"))
        val evtTime = dto.eventTime
            ?: return Failed(Err(ErrorCode.IllegalArgument, "Missing core event timestamp: eventTime"))
        val sourceUnit = dto.unit
            ?: return Failed(Err(ErrorCode.IllegalArgument, "Missing physical unit: unit"))

        // Build the quantity with OSPF-native Flt64 and Quantity(value, unit), then call .to(targetMassUnit) to convert within the same dimension
        val rawQuantity = Quantity(Flt64(rawVal), sourceUnit)
        val alignedQuantity = rawQuantity.to(targetMassUnit)
            ?: return Failed(Err(ErrorCode.DimensionMismatch, "Reported feeding unit [$sourceUnit] is dimensionally incompatible with the target mass unit [$targetMassUnit]"))

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

## 5.4 The eight minimum constituent elements of a formal domain model and the runtime instance boundary

The "formal domain model" this book refers to is not a collection of database entities, the mathematical model of some solver or the feature table of some machine-learning model. It is a **computable semantic system** made up of stable business concepts, pure computational relations, variable and intermediate-value semantics, feature/label/prediction semantics, structured constraint metadata, decision feedback and calibratable parameter semantics, model artifact governance, version snapshots and result contracts.

Under the long-term architecture of LLM as Runtime (`LLM as Runtime`), it also carries the responsibility of being the **domain-language specification / type system / compilation contract**: it constrains what the large language model and the agent "may express, how expressions compose, what the units/state/range are, which capabilities are executable and which must be refused", and provides stable semantic and version boundaries for the semantic intermediate representation (Semantic IR), the compiler and runtime specialization. It should contain at least the following eight constituent elements:

| Constituent element | Minimum formal definition requirement | Architectural layer and runtime boundary |
| :--- | :--- | :--- |
| **1. Domain concepts and the computation model** | Stable name, data type, physical unit, dimension, business object binding, state role, time range, boundary conditions and explicit error semantics | **Authoritatively defined by the domain layer**; the business system side executes the computation directly as pure-function numerics with no side effects. |
| **2. Variable and intermediate-value semantics** | Stable identifier, index dimensions, source expression or computational relation, dependencies, physical unit, applicable business scenarios and lifecycle | **The domain layer defines the business semantics**; the OR algorithm layer uses them to create the runtime decision variables and intermediate symbols needed for a single solve. |
| **3. Feature, label and prediction semantics** | Corresponding domain concept, event occurrence time, historical observation window, label maturity cutoff, unit, dimension, business object binding, scope of applicability and data-leakage constraints | **The domain layer defines stable semantics**; the ML side uses them to build runtime feature tensors, training samples and prediction outputs. |
| **4. Constraint and objective metadata** | Constraint/objective name, algebraic expression, comparison relation, soft/hard priority, physical unit, object binding, time range, activation conditions, version number and conflict diagnostics | **The domain layer supplies constraint semantics or templates**; the algorithm layer compiles them into a composable, independently testable constraint and objective pipeline (Pipeline). |
| **5. Decision feedback and calibratable parameter semantics** | Original OR input/parameters/original plan, differences from manual plan adjustments, structured reason codes, approval chain and actual execution results; name, type, legal range, applicable scenario and an "allowed to learn" flag for calibratable parameters | **The application layer records and classifies feedback**; the ML side trains only parameter candidates that are explicitly allowed to learn; the OR side re-solves with an approved and frozen parameter version. |
| **6. Model artifacts and quality governance** | Unique model identifier, immutable version number, content hash (Content Hash), training dataset reference, feature schema definition (Schema), runtime version, offline evaluation metrics, approval status and scope of applicability | **Algorithms or the controlled ML runtime produce artifacts**; the application layer orchestrates artifact acceptance, activation and rollback; the infrastructure layer handles persistence and retrieval. |
| **7. Snapshots and applicable versions** | Input data snapshots, business rule snapshots, field catalog versions, algorithm capability versions, feature/dataset/model versions, applicable organizations and effective time intervals | **The application layer selects and freezes the versions used by the current round of computation**; OR, ML and the agent are strictly forbidden to read the current latest database values implicitly in place of historical snapshot inputs. |
| **8. Result contract (Result Contract)** | Named result identifier, business meaning, physical unit, source variables/intermediate values/models, quality metrics, uncertainty intervals, scope of applicability, risk notices and structured failure reasons | **The OR/ML side parses internal outputs into structured results**; after validation, the application layer converts them into domain plans, computation results, prediction snapshots or risk indicators. |

In engineering practice, architects must hold one core boundary: **strictly separate "stable domain semantic definitions" from "single-run implementation instances"**.
* **Stable domain semantic definitions**: the names, physical units, state roles, business object bindings and time definitions of things such as `plannedFeeding` (planned feeding quantity), capacity features and prediction targets belong to domain semantics shared across runtime sides and reside in the domain layer;
* **Single-run implementation instances**: the concrete binary variables inside the underlying solver (`BinVar` / `BinVariable1`), runtime intermediate symbols, concrete solver constraint handles, machine-learning feature tensors (Tensor), model weight matrices and single solve/inference sessions (Session) are all **transient runtime implementations of a single modeling or inference run** — they **must never intrude into the domain aggregate (Domain Aggregate), and must never be persisted to core business tables as business facts**!

At the same time, named business intermediate values and prediction results act as **stable semantic interfaces for composing capabilities across the stack**. When a module publishes named results such as "estimated feeding quantity", "resource occupancy", "estimated changeover time" or "estimated productivity", downstream consumers (whether a digital-twin dashboard, a later scheduling node or an agent) need only depend on its business meaning, physical unit, scope of applicability and provenance (Provenance); they need not care at all whether it was computed internally by an arithmetic expression, a piecewise linear function, an OR decision variable or a machine-learning model. Different underlying implementations can support the same result semantics, but every implementation must explicitly declare its business schema, algorithm/model capability, rule or model version, quality metrics and applicable conditions, and must never silently switch computational definitions at runtime.

Once this formal domain model enters the running state, the four runtime sides form a highly cohesive, traceable standard collaboration chain:

<div class="dg" role="img" aria-label="Formal domain definition · structured metadata · frozen version snapshots expand downward into four runtime chains: 1. system-side numerical interpretation yields pure-function domain computation results; 2. ML-side statistical/probabilistic interpretation yields feature and label mapping, model training / online inference, prediction results and provenance; 3. agent-side semantic interpretation yields candidate causes, dynamic constraints and plans; 4. OR-side symbolic mapping yields decision variable and intermediate symbol registration, constraint and objective pipeline composition, optimization solve and structured result parsing; the four chains converge into application-layer deterministic validation, state transitions and workflow orchestration, and then into dashboards · human approval · production release · agent reference · simulation and retrospective.">
<div class="dg-col">
<div class="dg-node dg-node--layer"><span class="dg-t">Formal domain definition · structured metadata · frozen version snapshots</span></div>
<div class="dg-arms"><div class="dg-arm">↓</div><div class="dg-arm">↓</div><div class="dg-arm">↓</div><div class="dg-arm">↓</div></div>
<div class="dg-group"><div class="dg-gt">1. System-side numerical interpretation</div><div class="dg-node dg-node--leaf">Pure-function domain computation results</div></div>
<div class="dg-group"><div class="dg-gt">2. ML-side statistical/probabilistic interpretation</div><div class="dg-node dg-node--leaf">Feature and label mapping</div><div class="dg-edge" aria-hidden="true">→</div><div class="dg-node dg-node--leaf">Model training / online inference</div><div class="dg-edge" aria-hidden="true">→</div><div class="dg-node dg-node--leaf">Prediction results and provenance</div></div>
<div class="dg-group"><div class="dg-gt">3. Agent-side semantic interpretation</div><div class="dg-node dg-node--leaf">Candidate causes, dynamic constraints and plans</div></div>
<div class="dg-group"><div class="dg-gt">4. OR-side symbolic mapping</div><div class="dg-node dg-node--leaf">Decision variable and intermediate symbol registration</div><div class="dg-edge" aria-hidden="true">→</div><div class="dg-node dg-node--leaf">Constraint and objective pipeline composition</div><div class="dg-edge" aria-hidden="true">→</div><div class="dg-node dg-node--leaf">Optimization solve and structured result parsing</div></div>
<div class="dg-arms"><div class="dg-arm">↓</div><div class="dg-arm">↓</div><div class="dg-arm">↓</div><div class="dg-arm">↓</div></div>
<div class="dg-node dg-node--layer"><span class="dg-t">Application-layer deterministic validation, state transitions and workflow orchestration</span></div>
<div class="dg-down" aria-hidden="true">↓</div>
<div class="dg-node dg-node--layer"><span class="dg-t">Dashboards · human approval · production release · agent reference · simulation and retrospective</span></div>
</div>
</div>
