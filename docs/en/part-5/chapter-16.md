# Chapter 16: Semantic JIT — Profile-Driven Hot-Spot Specialization and Invalidating Rebuilds

In Chapter 4 we proposed a core analogy: the essence of `LLM as Runtime` is not "generating arbitrary code online", but **semantic just-in-time compilation (Semantic JIT)** or **profile-guided specialization**. This chapter goes under the hood of the adaptive runtime, taking apart in detail the engineering of dynamic query JIT compilation and dynamic constraint specialization, and provides the complete semantic shape normalizer, plan registry (`PlanRegistry`), shadow verifier and precise deoptimization fallback code.

***

## 16.1 Dynamic query JIT compilation and dynamic constraint specialization: clustering like requests by "normalized semantic shape" instead of raw-text statistics

On the shop floor of production scheduling and supply chain operations, business users launch a large number of interactive queries and rule settings every day. For example, the morning-shift planner asks: "check which work orders on line A are in a delayed state today, and their expected material shortages"; the afternoon-shift planner asks: "show me which work orders on line B will be late tomorrow and the corresponding material gaps"; and the evening supervisor filters the same kind of data for line C this week on the board.

If the system simply takes the **raw natural-language string** a user typed, or **text carrying concrete business parameters**, as the statistics key, those three queries look completely different on the surface. The system will forever treat them as three unrelated, isolated long-tail requests and call the large language model to parse them again every time. Worse, using full natural language and sensitive business parameters as the primary key for profile aggregation also brings serious risks of trade-secret leakage and storage bloat.

So the first core mechanism of dynamic query JIT compilation and dynamic constraint specialization is to **cluster like requests by "normalized semantic shape", and never use raw natural language or concrete literal parameters as the statistics key**:

![Five-stage flow: 1. General path (general query planning/execution, or general constraint injection) → 2. Runtime profiling (semantic shape hash + latency, + scan rows/compute cost) → 3. Capability promotion (enters the specialization compile candidate queue after reaching the promotion threshold) → 4. Build and verify (asynchronous background plan generation + shadow verification and equivalence checking) → 5. Specialized path (parameterized query plan / precompiled constraint template execution).](../.gitbook/assets/chapter-16-1.svg)

Let us use the figure above to see how "normalized semantic shape" converges wildly varying field expressions into a stable statistics key:

1. **Strip literals and sensitive values, extract the abstract syntax skeleton**: after the LLM semantic frontend turns the three natural-language queries above into `Query IR` (or turns several shared feeding port restrictions into `Constraint IR`), the normalizer immediately strips the concrete line IDs (`"lineA"` / `"lineB"`), the concrete time windows (`"today"` / `"tomorrow"`) and the concrete threshold numbers (`1000 kg` / `1200 kg`), replacing them all with parameter placeholders that carry types and `ospf` physical dimension signatures (such as `$lineId: LineRef`, `$window: TimeRange`, `$limit: Quantity<Mass>`).
2. **Canonical ordering and algebraic equivalence normalization**: for predicate conditions (such as `A AND B` and `B AND A`) or additive terms in a linear constraint (such as `plannedFeeding[A] + plannedFeeding[B]` and `plannedFeeding[B] + plannedFeeding[A]`), the normalizer performs lexicographic reordering and merges like terms, ensuring that expressions equivalent in algebra and logic produce exactly the same tree structure.
3. **Compute the semantic shape hash (Shape Hash)**: a cryptographic hash is computed over the normalized, parameter-free `Semantic IR` structure (such as `shape_hash = sha256(Canonical_IR)`). Thus no matter what wording the front-end user chooses or which concrete parameters they pass, as long as the underlying business query structure or constraint skeleton is the same, they land precisely in the same `shape_hash` bucket, letting the runtime accurately cluster the true occurrence distribution of like requests.

***

## 16.2 Runtime profiling and promotion thresholds: combining call frequency, latency, scan rows, compute cost and business benefit to decide whether to specialize

With statistics buckets aggregated by `shape_hash` in place, the next question is: **should any semantic shape that shows up a few more times be compiled into a dedicated capability right away?**

The answer is no. As we warned in Chapters 4 and 15: **"high frequency" never automatically means "worth compiling"**. If we generate large numbers of dedicated plans for low-benefit requests without restraint, compile overhead, cache footprint and version maintenance cost will outweigh the benefit of specialization (the "over-specialization" risk).

For this reason the adaptive runtime continuously collects multi-dimensional **runtime profiling** facts around every semantic shape, and a **promotion policy** performs a strict combined-benefit assessment:

| Profiling dimension                                                                    | Concrete runtime fact metrics collected                                                                                                                                                           | Role in the promotion policy assessment                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <p><strong>1. Frequency and recency</strong><br>(Frequency &#x26; Recency)</p>         | Cumulative invocation count of the normalized semantic shape, arrival rate per unit time window, number of days continuously active across cycles, and time-decayed weighted heat.                | Separates "a one-off temporary need from a burst of clicks" from "a stable high-frequency need that recurs across shifts and scheduling cycles".                                                                          |
| <p><strong>2. Latency and resource cost</strong><br>(Latency &#x26; Resource Cost)</p> | End-to-end response latency on the general path (including LLM inference time and general planning time), database scan rows, peak memory and solver iteration overhead.                          | Identifies the real performance bottleneck: patterns with large scan rows, slow general planning or frequent consumption of expensive LLM tokens have the highest specialization payoff.                                  |
| <p><strong>3. Result quality and stability</strong><br>(Quality &#x26; Stability)</p>  | Validation pass rate of candidate solutions, simulation feasibility rate, human approval rate, planner adoption rate, and the share of executions with no rollback and no exceptional correction. | Ensures that only patterns whose semantics are highly stable and whose business results have repeatedly proved reliable qualify as candidates, and prevents freezing a frequently edited half-finished product.           |
| <p><strong>4. Tenant and scope spread</strong><br>(Tenant &#x26; Scope Spread)</p>     | Whether the semantic pattern appears only at a single workstation, is reused by multiple departments within a single customer tenant, or appears widely across multiple customer tenants.         | Determines the isolation level of the specialized artifact and the target tier for later promotion into software product line engineering (SPLE).                                                                         |
| <p><strong>5. Dependency volatility</strong><br>(Dependency Volatility)</p>            | How often the underlying database table schema, domain field catalog, permission policy and business rule version referenced by the pattern changed recently.                                     | If the underlying metadata a pattern depends on changes violently every day, the cost of frequent invalidation and recompilation after compiling will cancel the benefit, and the policy should defer its specialization. |

Only when the combined assessment score of a semantic shape crosses the **promotion threshold** set by the capability promotion policy, and the current background build queue and registry capacity are still below their limits, does the runtime formally promote it to a "specialization candidate" and hand it to a background asynchronous build task for compilation and verification.

***

## 16.3 The three-tier specialization ladder (Tier 0 → Tier 1 → Tier 2): from the general planner and parameterized plans/precompiled constraints to on-demand upgrades into controlled VM plugins

When a hot semantic pattern is admitted to the specialization compilation stage, what form of target artifact should the compiler produce?

Many engineers, on hearing "just-in-time compilation (JIT)", immediately think of dynamically generating Java bytecode or machine code. But in enterprise software, dynamically generating and loading binary code plugins is a heavyweight measure with high risk and high maintenance cost. So `LLM as Runtime` establishes a very pragmatic engineering principle: **"compile the plan" first, "compile the code" later—prefer the deterministic plan backend with the lowest risk, the best rollback properties and sufficient benefit; not every hot spot is worth generating bytecode**!

The system builds a clear **three-tier specialization ladder** at runtime:

![The three-tier specialization ladder from top to bottom: Tier 0: general planner and interpreted execution path ↓ the profile reaches the first-level hot-spot and stability threshold ↓ Tier 1: controlled deterministic plans and parameterized templates (the main consolidation layer, covering 90%+ of scenarios) ↓ only when the performance bottleneck is extremely clear, the benefit is sufficient and the product boundary is highly stable ↓ Tier 2: controlled code artifacts and VM plugins (the extreme-performance layer).](../.gitbook/assets/chapter-16-2.svg)

***

## 16.4 Plan registry and deoptimization: when the database schema, field catalog or permission policy changes, how do we precisely mark invalidation and automatically fall back to the general path?

In a modern virtual machine such as the JVM, the JIT compiler is safe because it has a complete **deoptimization** mechanism: once a runtime assumption (for example, that an interface has only one implementing class) is broken by dynamically loading a new class, the VM can immediately discard the compiled machine code and fall back smoothly to interpreter execution.

In enterprise adaptive software the runtime environment evolves in the same way: a DBA may change a database table schema, a domain architect may update the field catalog or unit conversion rules, a security administrator may tighten field access permissions for a tenant, and the algorithm team may upgrade the solver adapter or compiler version. When this underlying environment changes, how does the system guarantee that already-consolidated specialized plans do not produce wrong data or cause permission leakage?

The answer lies in **explicit version binding and precise invalidating rebuild in the plan and capability registry**:

![Explicit version binding structure of the plan registry: a specialized plan ID with its semantic shape hash and specialization tier, bound to the validity boundary dependency version fingerprints (Validity Boundary Dependencies); ↓ a lower-level change event is detected: for example, the field catalog is upgraded to v\_catalog\_4.3 or the permission policy changes ↓ 1. precise invalidation → 2. automatic seamless fallback → 3. asynchronous background rebuild.](../.gitbook/assets/chapter-16-3.svg)

This mechanism closes the full lifecycle loop in engineering terms:

1. **Explicit validity boundary**: whenever a specialized plan, constraint template or compiled evaluator is published to the registry, it is forced to bind at the same time the complete hash fingerprints of the **database schema version, domain field catalog version, permission policy version, model/generator version and backend adapter version** it depends on.
2. **Event-driven precise invalidation**: when a database schema change event, domain catalog update event or permission policy adjustment event occurs, the registry uses the reverse dependency index to **lock down the affected set of specialized plans precisely at millisecond level and atomically mark their state as `INVALIDATED`**.
3. **Zero-interruption fallback to the general path and asynchronous recompilation**: the specialized path always keeps a safe channel for degrading to the general path. Once a specialized plan is marked invalidated, subsequent business requests that hit it **automatically fall back to Tier 0 general-path execution within the same millisecond**, with the front-end business completely unaware and zero interruption; meanwhile recompilation and shadow verification are triggered asynchronously in the background.

### Engineering implementation: complete code for normalized semantic shape hashing, runtime profile promotion, shadow verification and plan registry deoptimization

Below is the core Semantic JIT runtime code, built directly on the explicit result contract of `ospf-kotlin` (`Ret<T>` / `Ok` / `Failed`) and the `DynamicConstraintCandidateIR` from Chapter 14:

```kotlin
package org.adaptive.dop.runtime.jit

import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap
import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.error.*
import fuookami.ospf.kotlin.utils.functional.*
import org.adaptive.dop.runtime.compiler.*

// 1. Normalized semantic shape extractor (Normalized Semantic Shape Extractor)
// Iron rule: strip concrete business literal parameters (such as the concrete line ID "lineA" or the concrete value "1000.0") and sensitive information; hash only the normalized syntactic structure!
object SemanticShapeNormalizer {

    fun computeConstraintShapeHash(candidate: DynamicConstraintCandidateIR): String {
        // Replace concrete bindingKeys ("lineA", "lineB") with positional placeholders, and reorder additive commutative terms lexicographically by (fieldName, expectedRoleCode)
        val canonicalTermsSignature = candidate.terms
            .map { term -> "${term.fieldName}:${term.expectedRoleCode}:coeffSign=${term.coefficient geq Flt64.zero}" }
            .sorted()
            .joinToString("+")

        // Keep only the physical dimension of the right-hand limit, and strip concrete numeric literals (such as 1000.0)
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

// 2. Runtime profiling metrics and promotion policy (Runtime Profiling & Promotion Policy)
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
        if (currentRegistrySize >= maxRegistryCapacity) return false // Prevent over-specialization from blowing up the cache
        return profile.totalInvocations >= minHotspotInvocations &&
               profile.averageLatencyMs >= minAverageLatencyMs &&
               profile.stabilityRate >= minStabilityRate
    }
}

// 3. Plan registry validity boundary dependency fingerprint (Validity Boundary Dependency Fingerprint)
data class EnvironmentDependencyFingerprint(
    val dbSchemaVersion: String,
    val fieldCatalogVersion: String,
    val authPolicyVersion: String,
    val compilerVersion: String,
    val adapterVersion: String
)

enum class SpecializedPlanState {
    SHADOW_VERIFYING, // Shadow verification on the side path (the foreground still uses the general path)
    ACTIVE,           // Promoted and now serving production traffic
    INVALIDATED       // Precisely invalidated by an environment change or a shadow-verification difference
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
 * 4. Adaptive semantic runtime engine (AdaptiveSemanticRuntime):
 * Integrates profile collection, a mandatory permission guard on every execution, side-path shadow verification (Shadow Verification),
 * atomic promotion switching, and millisecond-level precise deoptimization (Deoptimization) with seamless fallback when the environment changes!
 */
class AdaptiveSemanticRuntime<Req, Resp>(
    private val tier0GeneralExecutor: (Req) -> Ret<Resp>,
    private val mandatoryAuthAndBudgetGuard: (Req) -> Ret<Unit>, // Iron rule: every execution of a specialized path must also revalidate tenant permissions and budget!
    private val resultEquivalenceChecker: (Resp, Resp) -> Boolean,
    private val promotionPolicy: PromotionPolicyEvaluator = PromotionPolicyEvaluator(),
    private val requiredZeroDiffShadowRuns: Int = 30
) {
    private val profiles = ConcurrentHashMap<String, ShapeRuntimeProfile>()
    private val planRegistry = ConcurrentHashMap<String, RegisteredSpecializedPlan<Req, Resp>>()

    /** Register a specialized candidate plan produced by asynchronous background compilation; it is forced into SHADOW_VERIFYING state initially */
    fun registerCandidatePlan(plan: RegisteredSpecializedPlan<Req, Resp>) {
        planRegistry[plan.shapeHash] = plan.copy(
            state = SpecializedPlanState.SHADOW_VERIFYING,
            consecutiveShadowPasses = 0
        )
    }

    /**
     * Listen for database schema, domain field catalog, permission policy or compiler version change events:
     * precisely mark specialized plans whose dependency versions no longer match as INVALIDATED (deoptimization), never touching unrelated plans by mistake!
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
     * Unified runtime execution entry point:
     * 1. Enforce the final tenant, field permission and budget checks (no permission leakage on specialized paths);
     * 2. Switch safely among the Tier 0 general path, side-path shadow verification and Tier 1/2 specialized paths according to plan registry state.
     */
    fun execute(
        shapeHash: String,
        tenantId: String,
        request: Req,
        currentEnv: EnvironmentDependencyFingerprint
    ): Ret<Resp> {
        // Defense line 1: every execution must pass the permission and budget checks; a specialized path never gets the privilege of bypassing security semantics!
        when (val authRes = mandatoryAuthAndBudgetGuard(request)) {
            is Ok -> {}
            is Failed -> return Failed(authRes.error)
        }

        val plan = planRegistry[shapeHash]

        // Case A: an ACTIVE specialized plan exists and its dependency versions match exactly -> take the specialized fast path directly!
        if (plan != null && plan.state == SpecializedPlanState.ACTIVE && plan.boundDependencies == currentEnv) {
            return when (val specRes = plan.specializedExecutor(request)) {
                is Ok -> specRes
                is Failed -> {
                    // If the specialized path throws at runtime, immediately trip the breaker and degrade to the Tier 0 general path as a safety net!
                    plan.state = SpecializedPlanState.INVALIDATED
                    tier0GeneralExecutor(request)
                }
            }
        }

        // Case B: a candidate specialized plan is in SHADOW_VERIFYING state -> return the result from the general path and compare the shadow result on the side
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
                        // After N consecutive real-traffic shadow runs with 100% zero difference, atomically promote the plan to ACTIVE as a formal specialized capability!
                        plan.state = SpecializedPlanState.ACTIVE
                    }
                } else {
                    // If even one result is found to be non-equivalent, discard the candidate plan immediately; never let an LLM or compiler error get frozen in!
                    plan.state = SpecializedPlanState.INVALIDATED
                }
            }
            return generalResult
        }

        // Case C: no specialized plan, or the specialized plan is already INVALIDATED -> take the Tier 0 general path and collect runtime profiling
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
