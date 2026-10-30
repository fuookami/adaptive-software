# Chapter 14: Agent Native and the Business Semantic Frontend — From Vague Natural Language to Semanti

Now that Chapter 13 has closed the bidirectional loop between operations research (OR) and machine learning (ML), we turn to the third pole of the "three natives" — **Agent-Native** — and take apart how the large language model, serving as the **business semantic frontend (Semantic Frontend)** of `LLM as Runtime`, turns a human being's vague natural-language intent precisely into a machine-verifiable structured semantic intermediate representation (Semantic IR), and finally compiles it into an `ospf` `LinearMetaModel`.

***

## 14.1 Giving the agent a "business dictionary and grammar": exposing structured domain metadata, referencable variables, intermediate values, constraint templates and flow contracts

Why is it that, after wiring in a large language model, many enterprises find the agent can do no more than write a few paragraphs of empty advice, and cannot help a planner produce even one scheduling rule or flow configuration that actually runs?

Because the developers made a fundamental architectural mistake: **letting the large language model read scattered business source code directly, or blindly guess business semantics from database column names of opaque meaning in anemic CRUD interfaces (such as `col_val_01` and `ext_attr_b`)**!

Under the Agent-Native architecture, the real meaning of "native" is this: **the formal domain model is itself a structured semantic contract that an agent can read, understand, compose and reference directly**. The system no longer hides business knowledge inside procedural code; through the application layer it explicitly exposes to the agent a machine-readable **structured domain metadata catalog (Structured Domain Metadata Catalog)** — as if we had handed the agent an authoritative "enterprise business dictionary and composition grammar":

![Structured domain metadata catalog exposed to the agent, branching into five groups: 1. referencable concepts and variables (Variables & Symbols), 2. named business intermediate values (Intermediates), 3. structured constraint templates (Constraint Tpls), 4. composable flow node contracts (Flow Node Contracts), 5. applicable boundaries and error codes (Scopes & Error Codes).](../.gitbook/assets/chapter-14-1.svg)

Concretely, this domain metadata catalog declares to the agent at least the following five classes of core elements:

1. **Domain concepts and referencable variables (Referencable Variables)**: an explicit list of which business objects in the system (production line, equipment, material, order, work order, storage location, transport trip) and which symbolic variables may be referenced (for example `plannedFeeding[line]`, `plannedFeedingRemaining[line]` and `capacityUsage[resource]`), with strict annotation of each variable's `ospf` physical dimension (such as `Kilogram` or `Hour`), its indexing dimensions (by line, by material, by time bucket) and its state role (whether it is a planned decision variable or a read-only fact that has already happened, `actualFeedingInWindow`).
2. **Named business intermediate values (Named Intermediate Values)**: the business meaning, computational dependencies and units of intermediate values such as changeover time `changeoverTime[task]`, production duration `productionDuration[task]`, estimated feeding quantity `estimatedFeeding[line]` and estimated productivity `estimatedProductivity[line]`, so that the agent can reference them by name when attributing causes or constructing complex rules.
3. **Available constraint templates (Constraint Templates)**: formally defined standard constraint skeletons, such as a linear capacity upper-bound constraint, a resource-sharing constraint, a delivery-window constraint, a precedence constraint between operations and a material availability (kitting) constraint, plus the model positions (Placement / Hook Locations) where they may be attached and injected.
4. **Composable flow node contracts (Flow Node Contracts)**: breaking algorithms and business actions that used to be hard-wired into custom interfaces into standard flow nodes whose input and output contracts (I/O Contracts), preconditions and side-effect boundaries are fully transparent — `capacity estimation`, `forecast approval`, `digital-twin estimated-time projection`, `scheduling solve`, `substitute material allocation`, `recompute estimated material consumption`, `MRP gap calculation`, `plan simulation comparison` and `formal plan release`. This lets the agent, facing process differences across customers, generate legitimate flow orchestration proposals as if assembling Lego bricks (for customer A, orchestrating `scheduling → substitute material allocation → recompute material consumption → MRP`; for customer B, `demand forecasting → BOM explosion → raw material gap analysis → MRP`).
5. **Applicable boundaries, optional parameters and structured error codes (Boundaries & Error Codes)**: an explicit declaration, for every piece of metadata, of the applicable business organization / tenant scope, the time-range granularity, the permission requirements, the effective rule version, and the standard structured error code returned when the contract is violated.

***

## 14.2 Trimming the structured reasoning context: impact-scope reasoning over current digital-twin state, historical snapshots and anomaly events

As our dependency analysis in Chapter 11 revealed (point 15 is a precondition of point 14): **to generate a reliable dynamic adaptation plan, the agent must "reason about the business first, and only then emit the adaptation configuration"**.

When a planner puts a question to the system, the agent cannot merely expand that single sentence into literal text; it must reason rigorously about causes and impact scope against the business world that is running right now. To that end the application layer takes the currently relevant runtime information through **context pruning (Context Pruning) and tenant / field permission filtering (Permission Filtering)**, then assembles a clearly bounded **structured reasoning context (Structured Reasoning Context)** and injects it into the agent:

| Reasoning context dimension                             | Detail of the injected structured content (using the running use case as an example)                                                                                                                                                                        | Key role in the agent's business reasoning                                                                                                                                                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Current plan and digital-twin state**              | The baseline plan version currently in effect for lines A and B; `T1`'s actual completion time (`10:00`, 30 minutes late); the estimated start time the digital twin has just recomputed for `T2` (`10:30`), and `T3`'s planned / estimated time (`11:00`). | Lets the agent see clearly "which tasks have actually deviated from plan", "how far the deviation has propagated along the precedence chain" and "whether the downstream estimated times still fall inside the delivery window". |
| **2. Snapshot of execution facts already incurred**     | The feeding fact `actualFeedingInWindow` actually consumed by tasks already executed in today's time window (such as `T1`), plus WMS's snapshot of currently available main / substitute material inventory.                                                | Anchors an immutable starting point of physical fact, ensuring that constraints generated later never omit the actual feeding consumption already incurred today.                                                                |
| **3. Prediction snapshot with lineage and uncertainty** | The effective capacity overlay of the production line currently approved and activated (`CapacityEffectiveOverlay`), the model version behind `estimatedProductivity[A/B]`, its quality score and its confidence interval.                                  | Lets the agent cite the provenance and uncertainty risk of the capacity estimate when analyzing scheduling headroom, instead of treating a predicted value as an absolute constant.                                              |
| **4. Rules and constraint set in effect**               | The BOM version currently in effect, the changeover-time matrix, the calendar rule snapshot, the list of activated hard and soft constraints, and recent equipment / material anomaly events.                                                               | Helps the agent judge whether, after `T2` is pushed later, a new cross-line conflict with `T3` arises in resource occupancy, feeding quantity or changeover time.                                                                |
| **5. Catalog of available operations and tools**        | The analysis tools callable under the current user's permissions, the simulation sandbox entry points, the constraint templates and the flow node contracts.                                                                                                | Strictly limits the agent's action space, ensuring it can recommend only controlled actions the system supports and the current user is entitled to initiate.                                                                    |

On the basis of this structured reasoning context, the agent no longer emits ambiguous prose; by contract it must emit a **structured reasoning result package**:

* **Candidate causes (Candidate Causes)**: point out that `T2`'s estimated 30-minute delay is jointly caused by the actual completion delay of predecessor `T1` plus the fixed 30-minute changeover time;
* **Affected object set (Affected Objects)**: precisely locate the affected business object set as `{task T2, task T3, line A, line B, shared feeding port}`;
* **Candidate dynamic constraints (Candidate Constraints)**: for the shared feeding port restriction the user raised, generate a structured constraint candidate bound to today's time window;
* **Candidate response plans and simulation proposals (Candidate Plans & Simulation Proposals)**: put forward two comparable plans, `{plan 1: propagate the delay locally only, plan 2: inject the shared feeding port constraint and trigger rolling rescheduling}`, clearly marking each one's risk points and the actions still to be validated, and hand them to the application layer to launch a digital-twin simulation comparison.

Throughout the reasoning process one red line never moves: **the agent's reasoning itself absolutely never modifies any business state directly! What it emits is always a confidence-bearing, explainable, verifiable and auditable "candidate judgment and action awaiting validation", and which plan is finally adopted is decided 100% by the application layer's deterministic validation policy and business approval**.

***

## 14.3 The semantic intermediate representation (Semantic IR): design specifications for the query IR, the constraint IR and the flow IR

Once the agent has finished its contextual reasoning and is about to turn the user's intent into capability the system can execute (a complex data query, a dynamic scheduling constraint, or a custom flow composition), what exactly does the structured candidate it emits look like?

This is one of the most central platform assets of the `LLM as Runtime` architecture: the **semantic intermediate representation (Semantic Intermediate Representation, Semantic IR)**.

Why do we not pass SQL statements, solver code or JSON configuration files directly between the agent and the underlying execution engines (databases, solvers, workflow engines), and instead insist on designing a dedicated `Semantic IR` layer in between?

1. **Isolate the vagueness of natural language from the heterogeneity of the underlying execution engines**: natural language varies endlessly, while the layer below may be a relational database, an analytical column store, the MILP solver of a different vendor or a different workflow engine. `Semantic IR` receives from above the pure business semantics extracted by the large model, and below it is lowered (Lowering) by the deterministic compiler onto any execution backend, decoupling front end and back end completely.
2. **Support canonicalization, content hashing and hot-spot aggregation**: two natural-language requests worded differently and carrying different parameter values (for example "check line A's planned feeding for today" and "look at line B's planned feeding for tomorrow") have exactly the same **semantic shape (Semantic Shape)** once the concrete literal parameters are removed and the request is turned into canonicalized `Semantic IR`. Only by computing the shape hash (Shape Hash) on canonicalized `Semantic IR` can the system accurately count which semantic patterns recur at high frequency at runtime, thereby supporting the runtime profiling and just-in-time compilation (JIT) of Chapter 16.
3. **Provide one uniform carrier for type, dimension, permission and version validation**: every safety guard, physical unit check, tenant boundary validation and historical version replay acts uniformly on the structured `Semantic IR` tree, ensuring that no unchecked string can ever slip into the production environment.

In the digital operations platform (DOP / APS), the semantic intermediate representation comprises the following four standard families:

| Semantic IR family                                                                              | Core structured element definitions                                                                                                                                                                                                                                                                                                             | Compilation lowering targets (Lowering Targets)                                                                                                                               |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <p><strong>1. Query intermediate representation</strong><br>(Query IR)</p>                      | The target domain entity / view being accessed, the projected field list, relationship paths, the canonicalized predicate filter structure (with concrete literal parameters stripped), grouping and aggregation operators, sort rules, the parameter type signature, and a rows-scanned / latency budget (Budget).                             | Parameterized SQL statements, prepared query plans (Prepared Plan), domain view evaluators or controlled query interface plug-ins.                                            |
| <p><strong>2. Constraint intermediate representation</strong><br>(Constraint IR)</p>            | The bound domain variables and intermediate value symbols, the algebraic and logical expression tree (interfacing with the `ospf` `LinearPolynomial`), the comparison relation, the physical dimension and unit, the effective time window, the bound business object set, soft / hard priority, and the model attachment position (Placement). | An `ospf` compiled linear constraint (`LinearInequality`), which is then injected into `LinearMetaModel` and mapped to MILP, CP or the column-generation master / subproblem. |
| <p><strong>3. Flow intermediate representation</strong><br>(Flow IR)</p>                        | The orchestrated sequence of standard domain flow nodes, the input / output data contract mapping between nodes, predecessor dependencies and branch conditions, exception compensation policies, the simulation sandbox switch, and the mandatory human approval boundary.                                                                     | An application-layer workflow execution plan, a rolling rescheduling orchestration pipeline, or a cross-system (ERP/APS/MES/WMS/TMS) coordinated scheduling task.             |
| <p><strong>4. Policy and parameter candidate representation</strong><br>(Policy / Param IR)</p> | Objective weight candidates, soft-constraint penalty coefficient candidates, heuristic search strategy parameters, the legal value range, the applicable business scenario, references to supporting sample evidence, and offline evaluation metrics.                                                                                           | A frozen OR parameter configuration version, a local / global rescheduling trigger threshold policy, or a prediction overlay activation snapshot.                             |

***

## 14.4 A worked dynamic-constraint transformation: from "lines A and B share a feeding port today, total feeding at most 1000 kg" to a hashable, compilable structured linear constraint candidate

To let you feel the power of "agent semantic frontend + semantic intermediate representation + dynamic constraint compiler" first-hand, let us walk the whole benchmark scenario that runs through this book: **how one temporary rule spoken by a shop-floor person is safely compiled into a mathematical constraint in the `ospf` OR optimization engine**.

![The five steps of the dynamic constraint transformation chain, joined in order: 1. the user's business rule, 2. the LLM semantic frontend, 3. the constraint intermediate representation (Constraint IR), 4. the dynamic constraint compiler, 5. the algorithm execution backend.](../.gitbook/assets/chapter-14-2.svg)

### Step 1: The user states a floor rule in natural language

At `10:00` on Tuesday morning, a shop-floor worker enters the natural-language rule: "Today lines A and B share one feeding port; total feeding must not exceed 1000 kilograms."

### Step 2: The large language model, as semantic frontend, produces a structured candidate

The large language model reads the domain metadata catalog exposed in Section 14.1 and the current digital-twin context of Section 14.2, and identifies:

* the business objects involved are `{line A (lineA), line B (lineB)}` plus the shared resource `feeding port`;
* the time window is `today (Day_Current)`, the current moment is `10:00`, and within that window there already exist actual feeding facts `actualFeedingInWindow` of completed tasks;
* the limit is the value `1000`, with the physical unit of mass, `kilogram (kg)`;
* the matching constraint template is "multi-line cumulative feeding capacity upper-bound constraint within a time window", and the attachment position (Placement) is `the resource constraint section of the master scheduling model (MasterResourceConstraints)`.

The model therefore emits a standard **dynamic constraint candidate (`Constraint IR`)**. Note that in this domain object and IR, **only business field semantics, physical units and abstract algorithm symbols are described; nothing depends on the internal implementation of any particular solver (such as Gurobi or Cplex)**:

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

### Step 3: Strict boundary interception and dynamic constraint compilation

Once this structured candidate arrives, the system **never allows it to be compiled straight into production without validation and approval**. The dynamic constraint compiler (Dynamic Constraint Compiler) immediately starts several layers of deterministic checking:

1. **Hard interception of negative boundaries**: if the large model, through hallucination, references an **unknown field (Unknown Field)** that does not exist in the domain catalog at all, an **unauthorized field (Unauthorized Field)** the current user has no right to operate, an illegal **unknown placement (Unknown Placement)**, or constructs an **unsupported capability (Unsupported Capability)** that the current solver cannot handle, the compiler intercepts it on the spot and returns a structured error code; nothing broken is ever executed!
2. **Field capability and physical dimension validation**: the compiler verifies that the physical dimension of both `actualFeedingInWindow` and `plannedFeedingRemaining` is mass (the `ospf` native `Quantity` converts them uniformly to `Kilogram`), that it is fully compatible with the dimension of the right-hand limit `1000.0 kg`, and that the combination of state roles is legal.
3. **Resolution through the algorithmic symbol registry (Algorithmic Symbol Registry)**: while a single scheduling solve is being built, the dynamic constraint compiler queries the algorithm layer's symbol registry and resolves `plannedFeedingRemaining[lineA]` and `plannedFeedingRemaining[lineB]`, binding them to the corresponding `ospf` `LinearIntermediateSymbol` and decision variables in the current solve session, while binding `actualFeedingInWindow` as an already frozen constant term; it finally produces an immutable `ospf` **compiled linear constraint (`LinearInequality`)**.

### Step 4: Mapping onto the underlying algorithm execution backend

Finally, the algorithm layer registers this compiled `LinearInequality` into `LinearMetaModel`, and it is mapped seamlessly into the mixed-integer linear programming (MILP) model or the column-generation restricted master problem (RMP) for solving.

### Engineering implementation: the complete code of the dynamic constraint compiler built on OSPF `LinearPolynomial`, `LinearInequality` and `LinearMetaModel`

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

// 1. Domain metadata catalog entry (Field Catalog Entry): defines the fields the agent may reference, the OSPF native unit, the state role and the placement boundary
data class DomainFieldCatalogEntry(
    val fieldName: String,               // e.g. "actualFeedingInWindow" or "plannedFeedingRemaining"
    val unit: PhysicalUnit,              // use the OSPF native PhysicalUnit directly (e.g. Kilogram, Ton, Hour)
    val role: StateRole,                 // state role (ActualFactRole / PlannedRole)
    val allowedPlacements: Set<String>,  // model placements allowed for injection, e.g. {"MasterResourceConstraints"}
    val authorizedRoles: Set<String>,    // business roles allowed to operate this field, e.g. {"PLANNER", "WORKSHOP_DIRECTOR"}
    val maxSupportedDegree: Int = 1      // maximum supported algebraic degree: 1 means linear only
)

// 2. Semantic intermediate representation: dynamic linear constraint candidate (Constraint IR)
enum class IrRelationOp { LEQ, EQ, GEQ }

data class ConstraintTermIR(
    val fieldName: String,
    val bindingKey: String,          // business object binding key, e.g. "lineA" or "lineA_lineB_day1"
    val expectedRoleCode: String,    // "ACTUAL_FACT" or "PLANNED"
    val coefficient: Flt64 = Flt64.one
)

data class DynamicConstraintCandidateIR(
    val candidateId: String,
    val tenantId: String,
    val placement: String,
    val timeWindow: String,
    val terms: List<ConstraintTermIR>,
    val relation: IrRelationOp,
    val rhsLimit: Quantity<Flt64>,   // use the OSPF native Quantity<Flt64> directly (e.g. Quantity(Flt64(1000.0), Kilogram))
    val approvedBy: String?          // the iron rule of production admission: nothing is compiled without approval!
)

// 3. Algorithmic symbol registry contract (Algorithmic Symbol Registry):
// resolves a domain field and object key into either a frozen constant fact Quantity<Flt64> or an OSPF named intermediate symbol Quantity<LinearIntermediateSymbol> within one solve
sealed interface ResolvedAlgorithmicSymbol {
    data class FrozenFactConstant(val quantity: Quantity<Flt64>) : ResolvedAlgorithmicSymbol
    data class DecisionIntermediateSymbol(val symbolQty: Quantity<LinearIntermediateSymbol>) : ResolvedAlgorithmicSymbol
}

interface OspfAlgorithmicSymbolRegistry {
    fun resolve(fieldName: String, bindingKey: String): ResolvedAlgorithmicSymbol?
}

// 4. The immutable OSPF linear constraint artifact produced by compilation
data class CompiledOspfLinearConstraint(
    val elementId: String,
    val displayName: String,
    val placement: String,
    val ospfInequality: LinearInequality, // directly produces the OSPF native LinearInequality
    val unit: PhysicalUnit,
    val contentHash: String
)

/**
 * Dynamic constraint compiler (OspfDynamicConstraintCompiler):
 * guards the deterministic production boundary from LLM candidate semantics to the OSPF LinearMetaModel;
 * for unknown fields, unauthorized fields, unknown placements, incompatible physical dimensions or unapproved candidates, it returns an explicit Failed(Err) 100% of the time!
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
        // Guard 1: an unapproved agent candidate is strictly forbidden from being compiled into production
        if (candidate.approvedBy.isNullOrBlank()) {
            return Failed(Err(ErrorCode.ApplicationError, "compile rejected [ERR_UNAPPROVED]: dynamic constraint candidate [${candidate.candidateId}] has no human or policy approval"))
        }

        // Guard 2: intercept an unknown placement (Unknown Placement)
        if (candidate.placement !in validPlacements) {
            return Failed(Err(ErrorCode.IllegalArgument, "compile rejected [ERR_UNKNOWN_PLACEMENT]: unknown model placement [${candidate.placement}]"))
        }

        if (candidate.terms.isEmpty()) {
            return Failed(Err(ErrorCode.IllegalArgument, "compile rejected [ERR_EMPTY_TERMS]: the terms of the constraint's left-hand expression must not be empty"))
        }

        val targetUnit: PhysicalUnit = candidate.rhsLimit.unit
        val lhsMutablePoly = MutableLinearPolynomial()

        for (term in candidate.terms) {
            // Guard 3: intercept an unknown field (Unknown Field) fabricated by model hallucination
            val entry = catalog[term.fieldName]
                ?: return Failed(Err(ErrorCode.SymbolNotFound, "compile rejected [ERR_UNKNOWN_FIELD]: field [${term.fieldName}] does not exist in the domain catalog"))

            // Guard 4: intercept an unauthorized field (Unauthorized Field) and an out-of-scope placement
            if (callerRoles.intersect(entry.authorizedRoles).isEmpty()) {
                return Failed(Err(ErrorCode.ApplicationError, "compile rejected [ERR_UNAUTHORIZED_FIELD]: the current role may not reference field [${term.fieldName}]"))
            }
            if (candidate.placement !in entry.allowedPlacements) {
                return Failed(
                    Err(ErrorCode.IllegalArgument, "compile rejected [ERR_INVALID_FIELD_PLACEMENT]: field [${term.fieldName}] is not allowed to be attached to [${candidate.placement}]")
                )
            }

            // Guard 5: check that the state role code matches the catalog declaration (so planned variables are never confused with actual facts)
            if (entry.role.roleCode != term.expectedRoleCode) {
                return Failed(
                    Err(ErrorCode.IllegalArgument, "compile rejected [ERR_ROLE_MISMATCH]: the role of field [${term.fieldName}] is ${entry.role.roleCode}, which does not match the candidate declaration ${term.expectedRoleCode}")
                )
            }

            // Guard 6: check that the physical dimension is compatible with the right-hand limit (for example every left-hand term must be of the mass dimension and convertible to targetUnit such as Kilogram)
            if (entry.unit.dimension != targetUnit.dimension) {
                return Failed(
                    Err(ErrorCode.DimensionMismatch, "compile rejected [ERR_UNIT_INCOMPATIBLE]: the unit (${entry.unit}) of field [${term.fieldName}] is dimensionally incompatible with the right-hand limit unit ($targetUnit)")
                )
            }

            // Guard 7: resolve the OSPF symbol or frozen constant from the algorithmic symbol registry, and align it by OSPF native unit conversion
            val resolved = symbolRegistry.resolve(term.fieldName, term.bindingKey)
                ?: return Failed(Err(ErrorCode.SymbolNotFound, "symbol resolution failed: ${term.fieldName}[${term.bindingKey}] not found in the registry"))

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
                    // add the OSPF LinearIntermediateSymbol to the left-hand polynomial with the conversion scale
                    lhsMutablePoly += (term.coefficient * oneUnitScale) * symQty.value
                }
            }
        }

        val lhsPoly = LinearPolynomial(lhsMutablePoly)
        val rhsVal = candidate.rhsLimit.value

        // build the OSPF native LinearInequality
        val inequality: LinearInequality = when (candidate.relation) {
            IrRelationOp.LEQ -> lhsPoly leq rhsVal
            IrRelationOp.EQ -> lhsPoly eq rhsVal
            IrRelationOp.GEQ -> lhsPoly geq rhsVal
        }

        val elementId = "dyn_c_${candidate.candidateId}"
        val displayName = "dynamic constraint[${candidate.candidateId}]_${candidate.placement}(${targetUnit.symbol})"
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

    /** Inject the compiled dynamic constraint directly into the OSPF LinearMetaModel */
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
