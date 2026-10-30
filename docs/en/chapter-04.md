<!-- i18n-status: translated -->
<!-- i18n-source: docs/zh/chapter-04.md -->
# Chapter 4: The Core Thesis: LLM as Runtime

Once the industry began to notice that large language models can respond dynamically to user needs at runtime, one minimalist practice — highly tempting yet extremely dangerous — spread quickly: **since the model can write code, why not simply open a chat box inside the system and let the LLM turn a user's natural language directly into SQL queries, Python scheduling scripts or even Java business code, and then call `eval()` or a sandboxed interpreter to run it online?**

In a personal desktop utility or a one-off data-analysis script, this pattern of "the model writes code online and executes it directly" may deliver a striking demo. But in an industrial-grade core system (DOP / APS) that governs real-money orders, ten-thousand-ton material feeding, hundreds of production-line machines and multi-tenant permissions, that road not only leads nowhere; it is an outright engineering disaster.

This chapter sets out systematically the book's core architectural philosophy — **LLM as Runtime** — and makes clear why it is emphatically not "moving an integrated development environment (IDE) into a chat box", but rather bringing "semantic frontend + semantic intermediate representation + deterministic compiler + runtime-profiling-driven just-in-time specialization" into the software runtime.

---

## 4.1 Why "moving development tools into a chat box and letting the model write production code online" is a dead end in industry

In a serious enterprise software production environment, if an intermediate semantic layer and compiler guard-rails are missing, and a large language model is allowed to translate natural language directly into arbitrary executable code or production database commands, the system is immediately exposed to **six fatal engineering risks**:

### Risk 1: semantic drift
The same natural-language sentence can carry quite different precise business meanings in different business contexts, on different shop-floor shifts, or in different time windows. Suppose a planner says "hold back the feeding on line A today". Before the early shift starts, this may mean capping the whole day's planned total feeding (`plannedFeeding`); but at 10:00 a.m., with the line already running for two hours, it means "the actual feeding facts already incurred (`actualFeedingInWindow`) plus the planned feeding of the remaining tasks still to be executed (`plannedFeedingRemaining`)" must not exceed the limit. If the model writes code directly without explicit state roles, units and dimensions, or versioned catalog constraints, the generated code very easily confuses the two conventions and produces a muddled account.

### Risk 2: privilege penetration
Enterprise core systems impose extremely tight multi-tenant isolation, departmental data boundaries, sensitive-field masking and compute/budget quotas. If the model is allowed to generate native code or arbitrarily complex queries and run them on the backend — or if a previously generated script is later cached and called directly by others — the dedicated execution path may bypass the tenant filtering, field-level permission checks or approval flows of the general path, causing serious data privilege escalation and production safety incidents.

### Risk 3: error ossification
The greatest risk of runtime dynamic generation is not that the model occasionally says something wrong; it is **compiling one hallucination or sporadic misjudgment and ossifying it into the system's long-term formal capability**. Without human approval, shadow verification, general-versus-dedicated result-equivalence comparison and an explicit benefit threshold, an erroneous scheduling logic caused by missing context, once written into the system's rule library, keeps amplifying the error through every subsequent production cycle.

### Risk 4: environmental shift
The operating environment of enterprise systems keeps changing: database schemas evolve, domain field catalogs gain and lose entries, permission policies are adjusted, and the underlying optimization solver or prediction model is upgraded. Bare code fragments generated online are like "black-box orphans" scattered across the system, with no explicit metadata dependency tracking; once an underlying field or policy changes, such code either crashes at runtime or silently produces wrong business results.

### Risk 5: code supply chain risk
Allowing arbitrary code to be generated and loaded at runtime (any Python script, or an uncontrolled bytecode plugin) means an attacker or an out-of-control model hallucination may introduce unauthorized third-party dependencies, issue illegal network requests, tamper with the local file system, or write an infinite loop that exhausts the memory and CPU of the production server, directly bringing down the core scheduling and transaction paths.

### Risk 6: over-specialization
If, for every casual one-off, low-frequency ad-hoc query or exception rule a user mentions in the chat box, the system generates and stores a dedicated piece of code or execution plan without discrimination, then within three months the system will hoard tens of thousands of unmaintained plan fragments. The cost of compiling, storing, cache management and conflict governance will far exceed the modest benefit of dynamic generation, and the software structure will slide quickly toward a chaotic "scrapyard of special cases".

| Core risk type | Typical manifestation in production | Governance principle that must be established in the architecture |
| :--- | :--- | :--- |
| **Semantic drift** | The same natural-language sentence means different things in different contexts; the model confuses planned and actual conventions | Force everything through a structured intermediate representation (IR), versioned catalogs and explicit type/unit/range constraints |
| **Privilege penetration** | A dynamically generated dedicated plan wrongly bypasses tenant, field-level permission or compute-budget constraints | Re-validate final permissions on every execution; a dedicated path must never bypass the general security semantics |
| **Error ossification** | One sporadic hallucination is stored directly and compiled into long-running system capability | Enforce candidate approval, shadow verification, result-equivalence checks, canary release and benefit-threshold admission |
| **Environmental shift** | Changes to the database structure, field catalogs, security policies or generator versions distort old plans | Establish explicit dependency hashes, precise invalidation markers, automatic fallback and asynchronous recompilation |
| **Code supply chain** | A dynamic plugin brings in illegal dependencies, gains over-privileged access to the network or file system, or exhausts host resources | Isolate the build process, digitally sign artifacts, whitelist dependencies, cap resource quotas, and use an isolated class loader/process |
| **Over-specialization** | Dedicated plans are generated for a flood of one-off low-frequency needs, so governance and maintenance cost far exceeds the execution benefit | Establish a promotion policy based on hot-spot degree, cost and benefit, and cap the number of cached plans and the build queue |

---

## 4.2 What real LLM as Runtime is: positioning the model as the runtime's "business semantic frontend"

Since "letting the model write arbitrary code online and execute it directly" is a blind alley, what exactly is the **LLM as Runtime** this book advocates?

We give its strict definition:

> **LLM as Runtime is an architectural philosophy for adaptive software: programming no longer happens only in the development stage before release; part of software capability will be expressed, verified, specialized and continuously sedimented at runtime, as users interact with the model. In this system the large language model is emphatically not an executor or solver that rewrites production state directly, but the runtime's "business semantic frontend".**

"Programming" here means that while business users express goals, business rules, resource constraints and decision preferences, they continuously produce new **"executable business semantics"**. To turn this open, vague natural language safely into industrial-grade software capability, the system imitates the refined architecture of a modern compiler and builds, at runtime, a standard pipeline of six core stages:

<div class="dg" role="img" aria-label="1. User intent (natural language / behavior) → 2. LLM semantic frontend (understanding and candidate generation) → 3. Semantic IR (DSL / AST / plan IR) → 4. Semantic compiler (validate / optimize / lower) → 5. Controlled execution backend (database / solver / code) → 6. Adaptive runtime (profiling / JIT / invalidation / fallback).">
<div class="dg-row">
<div class="dg-node"><span class="dg-t">1. User intent</span><span class="dg-s">Natural language / behavior</span></div>
<div class="dg-edge" aria-hidden="true">→</div>
<div class="dg-node dg-node--key"><span class="dg-t">2. LLM semantic frontend</span><span class="dg-s">Understanding and candidate generation</span></div>
<div class="dg-edge" aria-hidden="true">→</div>
<div class="dg-node"><span class="dg-t">3. Semantic IR</span><span class="dg-s">DSL / AST / plan IR</span></div>
<div class="dg-edge" aria-hidden="true">→</div>
<div class="dg-node"><span class="dg-t">4. Semantic compiler</span><span class="dg-s">Validate / optimize / lower</span></div>
<div class="dg-edge" aria-hidden="true">→</div>
<div class="dg-node"><span class="dg-t">5. Controlled execution backend</span><span class="dg-s">Database / solver / code</span></div>
<div class="dg-edge" aria-hidden="true">→</div>
<div class="dg-node"><span class="dg-t">6. Adaptive runtime</span><span class="dg-s">Profiling / JIT / invalidation / fallback</span></div>
</div>
</div>

In this pipeline every component has its own job and clear boundaries:
1. **The large language model (semantic frontend)**: plays a role analogous to a compiler frontend, compressing the user's natural language, the current runtime context, historical interaction events and domain knowledge into a structurally constrained candidate representation;
2. **Semantic IR**: serves as the stable contract layer that isolates the uncertainty of natural language from the underlying execution implementation, manifesting as a constrained domain-specific language (DSL), abstract syntax tree (AST), normalized query intermediate representation (Query IR), dynamic constraint intermediate representation (Constraint IR) or flow intermediate representation (Flow IR);
3. **The semantic compiler and validator**: runs strict static and dynamic checks on the Semantic IR (covering types, physical dimensions, field catalogs, tenant permissions, compute budget and business invariants) and, once the checks pass, **lowers** it to a concrete target execution form;
4. **Controlled execution backends**: battle-tested database query engines, rule engines, `ospf` and OR solvers (such as MILP/column generation), controlled machine-learning runtimes or secure code artifact libraries bear the real production-grade computation and transaction execution;
5. **The adaptive runtime**: keeps collecting runtime profiling during execution, deciding which high-frequency semantic patterns are worth specializing and promoting, when to run shadow verification and atomic switchover, when to mark invalidation as the environment changes, and how to switch seamlessly between the "general slow path" and the "dedicated fast path".

When we place this idea into the overall top-level design of an enterprise digital operations platform (DOP / APS), it forms a clear **"six-layer architectural language"**:

| Architectural layer | Core positioning | The fundamental architectural question this layer answers |
| :--- | :--- | :--- |
| **Layer 1: long-term vision**<br>Adaptive Software | Long-term evolution goal | What future enterprise software should ultimately become: continuously forming, verifying and evolving its own capability while in use. |
| **Layer 2: architectural philosophy**<br>LLM as Runtime | Top-level architectural principle | Once software capability is no longer formed only before release, how the runtime should safely express, verify and sediment new capability. |
| **Layer 3: core architecture**<br>formal domain model + three natives (OR / ML / Agent) | System semantic skeleton | With what authoritative business language the machine understands the world; how business systems, OR, ML and agents share one semantics without splitting into dialects. |
| **Layer 4: evolution mechanism**<br>semantic compiler + adaptive runtime | Capability formation and evolution engine | How candidate semantics generated by the model are validated, lowered and compiled, hot-spot promoted, shadow-verified, precisely invalidated and recompiled. |
| **Layer 5: product evolution**<br>software product line engineering (SPLE) | Productization governance funnel | Which runtime dedicated capabilities are only local one-off special cases, and which should be promoted to customer-specific variants, formal product variability points or the stable platform core. |
| **Layer 6: concrete implementation**<br>dynamic query JIT / dynamic constraint compilation / flow plans | Engineering landing examples | How the compilation and specialization mechanisms above land in engineering scenarios such as complex data queries, dynamic constraint injection for scheduling and cross-system flow orchestration. |

Here is an analogy: **"LLM as Runtime" is the "roof" of the whole building**, marking the skyline of long-term software evolution; **"the formal domain model (carried by a substrate such as `ospf`)" is the "language and type system"**; **"the three natives (OR-Native, ML-Native, Agent-Native)" are the "core runtime skeleton"** that supports business operation; **"semantic compiler + runtime specialization" is the "capability formation mechanism"**; **"software product line engineering" is the "productization promotion mechanism"**; and dynamic query just-in-time compilation and the dynamic constraint compiler are the concrete benchmark instances running on this system.

---

## 4.3 Why it is more like just-in-time compilation (JIT) than "arbitrary code generation"

To help software engineers and architects grasp the operating mechanism of `LLM as Runtime` more accurately, we can compare it with **just-in-time (JIT) compilation** in modern virtual machines such as the JVM or the V8 engine.

In a programming-language virtual machine, the core value of a JIT compiler is not "generating some machine code at runtime at will", but **executing all code through the interpreter (the general path) first while collecting real performance profiles at runtime; once the "hot spots" that are called frequently are identified, specializing them in the background according to the real runtime types and branch distribution, and compiling them into efficient native machine code; and when a runtime type assumption is broken (for example, a new class is loaded), immediately triggering "deoptimization" and falling back safely to the general interpreted path**.

By the same token, the core of `LLM as Runtime` is emphatically not "letting the model generate arbitrary code online", but **identifying high-frequency, stable, verifiable business semantic patterns from the real usage distribution on the production floor, and promoting them from the costly, high-latency model-inference path into low-cost, deterministic dedicated execution capability**. Technically, then, the more precise terms are **Semantic JIT**, **Software JIT** or **profile-guided specialization**.

Take the platform's "dynamic query just-in-time compilation" and "dynamic constraint compilation" as examples; their operating mechanism corresponds exactly to the JIT concepts of a traditional virtual machine:

| Core JIT concept in a traditional VM | Corresponding component in LLM as Runtime (Semantic JIT) | How it works in enterprise software (DOP / APS) |
| :--- | :--- | :--- |
| **Interpreted execution (general path)** | General semantic planner / general execution path | A first-time or low-frequency long-tail request is first turned by the model into structured IR and, after validation, executed through the general query planner or the general constraint-injection path. |
| **Runtime profiling** | Normalized semantic shape metric collection | Strip natural-language literals and concrete sensitive parameters, aggregate similar requests by **normalized semantic shape hash**, and record call frequency, latency, rows scanned and solve time. |
| **Hotspot threshold** | Capability promotion policy | Jointly assess the call hotness, execution cost, stability and expected benefit of a semantic shape, and mark it as a specialization candidate once the threshold is met. |
| **Asynchronous background compilation (async JIT)** | Asynchronous plan construction and lowering tasks | In a separate background task, compile the candidate Semantic IR into a parameterized query plan, prepared statement, structured constraint template or controlled plugin, without blocking foreground business. |
| **Correctness guards** | Plan validator and shadow verification | Before a newly compiled dedicated plan takes over traffic, it must run a side-by-side shadow comparison with the general path, proving that both produce equivalent results and identical permissions on the same input. |
| **Code cache** | Plan and capability registry (plan registry) | Centrally manages released dedicated plans and explicitly binds the version hashes of database schema, field catalogs, permission policies, compilers and adapters. |
| **Deoptimization** | Precise invalidation marking, safe fallback and recompilation | When the underlying database table structure, domain field catalog or security policy changes, the registry precisely marks the affected dedicated plans invalid, falls back to the general path within milliseconds and triggers asynchronous background rebuilding. |

In engineering practice, Semantic JIT follows the same restrained principle of **"tiered specialization"** — not every hot requirement deserves the trouble of generating bytecode or a code plugin:

<div class="dg" role="img" aria-label="Tiered specialization: Tier 0 general semantic planner / interpreter (long-tail exploration and low-frequency requests) → Tier 1 parameterized query plan / precompiled constraints and flows (lowest risk, covers 90% of hot-spot benefit) → Tier 2 controlled compiled plugin (JVM / WebAssembly) (enabled only when the performance gain is very significant and the boundaries are stable).">
<div class="dg-row">
<div class="dg-node"><span class="dg-t">Tier 0</span><span class="dg-s">General semantic planner / interpreter</span><span class="dg-s">(long-tail exploration and low-frequency requests)</span></div>
<div class="dg-edge" aria-hidden="true">→</div>
<div class="dg-node"><span class="dg-t">Tier 1</span><span class="dg-s">Parameterized query plan / precompiled constraints and flows</span><span class="dg-s">(lowest risk, 90% of hot-spot benefit)</span></div>
<div class="dg-edge" aria-hidden="true">→</div>
<div class="dg-node"><span class="dg-t">Tier 2</span><span class="dg-s">Controlled compiled plugin (JVM / WebAssembly)</span><span class="dg-s">(only when the performance gain is very large and boundaries are stable)</span></div>
</div>
</div>

The system always prefers the tier-1 deterministic artifacts: lowest risk, best reversibility, and benefit already sufficient (such as `query IR + parameterized query plan`, or a `pre-compiled linear constraint template` carried by `ospf`). Only when performance profiling proves that some ultra-high-frequency computation really is a significant bottleneck, and that its productization boundary is already highly stable, does it upgrade on demand to a tier-2 controlled VM plugin (such as a JVM plugin under an isolated class loader, or a WebAssembly artifact).

---

## 4.4 The iron law of production execution: natural language stays in the candidate layer forever, and deterministic machinery guards the production execution boundary

We have now fully sketched the theoretical main line of Volume One, "the paradigm revolution": from the evolution of cognitive responsibility across the four stages of software, to Software 1.0, 2.0 and 3.0 and their two-axis orthogonality with the four computing paradigms, and on to the semantic just-in-time compilation architecture of `LLM as Runtime`.

Before closing Volume One and moving on to the underlying formal domain model and the `ospf` modeling substrate, we must lay down an **"iron law of production execution"** that runs through the whole book and may never be crossed under any engineering compromise:

> **The raw output of natural language and large language models may only ever stay in the "candidate layer"; it may never directly become a production execution instruction or a production fact. What is actually admitted into the production execution chain must be a structured semantic intermediate representation (Semantic IR), a deterministic plan or a controlled artifact that has passed strict validation and is hashable, versionable, auditable, invalidatable and reversible.**

To ensure this iron law is followed one hundred percent in daily development and operation, the system forcibly places five deterministic defense lines between "the model proposes a candidate" and "the production environment executes it":

<div class="dg" role="img" aria-label="1. Candidate generation → 2. Permission and governance check → 3. Domain and business check → 4. Simulation and result verification → 5. Versioned, reversible execution.">
<div class="dg-row">
<div class="dg-node dg-node--chip">[1. Candidate generation]</div>
<div class="dg-edge" aria-hidden="true">→</div>
<div class="dg-node dg-node--chip">[2. Permission and governance check]</div>
<div class="dg-edge" aria-hidden="true">→</div>
<div class="dg-node dg-node--chip">[3. Domain and business check]</div>
<div class="dg-edge" aria-hidden="true">→</div>
<div class="dg-node dg-node--chip">[4. Simulation and result verification]</div>
<div class="dg-edge" aria-hidden="true">→</div>
<div class="dg-node dg-node--chip">[5. Versioned, reversible execution]</div>
</div>
</div>

1. **Defense line one: structured candidate isolation** — the large language model and agents may only emit structured candidates against constrained domain metadata; any unknown field, unauthorized field, unknown mount point or expression beyond what the underlying solver or system supports is blocked by the compiler, which returns a structured error code; silent guessing, or letting a defective plan through, is strictly forbidden;
2. **Defense line two: permission, tenant and budget gatekeeping** — deterministic code verifies who the initiator is, which organizations and business objects they may access, which sensitive fields are involved, how much compute budget is consumed, and whether a change at this level must be confirmed through human approval;
3. **Defense line three: domain type, physical dimension and business invariant checks** — relying on the formal domain model and the `ospf` foundation, it rigorously checks numeric precision, physical unit compatibility (for example, refusing to mix weight with time), legality of state roles (for example, strictly forbidding predicted or planned values from being overwritten directly as on-site actual execution facts) and consistency among business rules;
4. **Defense line four: digital-twin trial runs and equivalence/shadow verification** — before an important plan adjustment or a newly compiled dedicated capability goes into production, it must first be tried out in the digital-twin environment (assessing global side effects on delivery dates, inventory, capacity conflicts and so on), or be shadow-run and compared for mathematical feasibility against the original general path;
5. **Defense line five: full-chain lineage tracing and one-click rollback** — every dynamic constraint, prediction overlay or dedicated execution plan that enters production must record an immutable content hash, source snapshot, approval chain, effective conditions and invalidation boundary; once the external environment changes or a metric turns anomalous, the system must be able to invalidate it precisely and roll back to the safe baseline path within milliseconds.

With this iron law as its guardian, the "creativity and flexibility" of large language models and the "rigor and determinism" of traditional software engineering are finally no longer opposed.

Yet you cannot make bricks without straw. If the system underneath is still a heap of anemic CRUD tables and black-box algorithm scripts each speaking its own language, then however exquisite the semantic compiler and runtime designed above it, the intent converted by the model still has no unified, precise landing ground. How exactly should we build a shared "world language and mathematical substrate" for business systems, operations research, machine learning and agents?

From the next chapter we formally enter **Volume Two: The Semantic Substrate**, to explore in depth the core architecture of "the three natives unified in a formal domain model" and to lift the veil on `ospf`, the open-source operations-research and domain-modeling framework.
