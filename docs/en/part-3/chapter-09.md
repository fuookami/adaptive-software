# Chapter 9: The Six Engineering Pillars of Adaptive Software — A Half-Century of Software Engineering

Whenever a revolutionary computing medium appears — large language models being the latest — the industry stirs with talk of "the end of software engineering", as though prompt engineering and agent frameworks had made the domain modeling, type systems, state management and formal verification accumulated over decades fit only for the scrap heap.

This chapter argues the opposite in plain terms: **"LLM as Runtime" is not an isolated method that abandons classical software engineering. It stands on six interlocking classical disciplines, and pushes part of the work that used to happen during development into the runtime.**

***

## 9.1 The six fundamental gaps: semantic, expression, memory, projection, generation and trust

At the close of Chapter 1 we identified two interdependent root problems facing enterprise software such as DOP and APS: **"who expresses domain knowledge in one place?"** and **"how does new domain capability enter the system?"**

If we take those two root problems apart along the whole chain from "understanding the business world" to "producing software capability safely", we find that the reason traditional industrial software struggles with floor-level change and intelligent upgrades is that its architecture carries **six fundamental engineering gaps**:

1. **Semantic gap — the business world has no single authoritative definition.** Core concepts such as order, resource, capacity, feeding, changeover, constraint, plan and actual have no clear semantic ownership, so business systems, optimization algorithms, prediction models, reports and prompts each speak differently. No one can answer **"what is this business world, exactly?"**
2. **Expression gap — business knowledge cannot be composed and executed reliably by machines.** Business rules are scattered across natural-language documents, hard-coded process logic and verbal experience, with no machine-readable, composable, checkable, compilable controlled language. Nothing can answer **"how do we describe this world to a machine precisely?"**
3. **Memory gap — the system holds only the present state, with no traceable operating experience.** Databases overwrite the latest value to record "what state we are in now", discarding the history of how facts evolved, why scheduling decisions were made, why a planner adjusted a plan by hand, and when rules changed. Nothing can answer **"how did this world get to where it is today?"**
4. **Projection gap — the system knows the present, but cannot safely rehearse the future.** Facing equipment delay, an inserted rush order or a temporary restriction, the system has no independently computable mirror of the production world, and cannot answer **"if we do this now, what happens next?"** without polluting real production state.
5. **Generation gap — new stable requirements still depend on hand-coding.** Even when a rule is well stated and keeps recurring on the floor, a programmer must still write the query, the constraint script and the custom interface by hand. There is no mechanism that turns a specification into executable capability, so nothing can answer **"how does a structured description become software capability automatically?"**
6. **Trust gap — dynamically produced capability has no trusted execution boundary.** Rules, workflows and specialized plans generated at runtime by an agent or a configuration tool do not deserve a serious production environment if they rest only on ordinary manual functional testing. Nothing can answer **"why dare we trust and execute this dynamically produced capability?"**

***

## 9.2 How the six disciplines divide the work: domain-driven design defines, domain language describes, event sourcing remembers, the digital twin projects, generative programming produces, formal methods verify

Filling these six gaps does not require inventing an abstruse new vocabulary. It requires gathering **six core disciplines** distilled by computer science and software engineering over half a century under one architectural roof, and giving each a clear and rigorous responsibility:

| Fundamental gap    | Corresponding discipline                                                                                   | Core action  | Engineering responsibility in Adaptive Software (LLM as Runtime)                                                                                                                                               | Plain-language explanation for business and management                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Semantic gap**   | <p><strong>1. Domain-Driven Design</strong><br>(DDD)</p>                                                   | **Define**   | Defines domain concepts, bounded contexts, aggregates, business invariants, state roles and ownership of business semantics, so that domain meaning has a single authoritative source.                         | **Say what the business means**: one shared definition of orders, capacity and feeding, instead of four dialects.                                     |
| **Expression gap** | <p><strong>2. Domain-specific language</strong><br>(DSL / domain language)</p>                             | **Describe** | Turns domain semantics into a business language that machines can read, compose, check and compile; the formal domain model doubles as the domain-language specification and the type boundary.                | **Make the system understand rules**: rules scattered across documents and experience become a language the system can parse and check.               |
| **Memory gap**     | <p><strong>3. Event sourcing and audit</strong><br>(Event Sourcing &#x26; Audit)</p>                       | **Remember** | Keeps the time series of domain facts, decisions, manual plan adjustments, rule changes and capability releases and revocations, forming runtime experience that can be traced and replayed.                   | **Remember how things happened**: who adjusted what, when, why and with what result — the basis for retrospectives and learning.                      |
| **Projection gap** | <p><strong>4. Digital twin</strong><br>(Digital Twin)</p>                                                  | **Project**  | Builds a computable, simulable, replayable model of the production world, keeps projected future states up to date, and gives candidate plans a low-risk proving ground.                                       | **Rehearse the future before acting**: simulate "what if we change this" in a safe mirror, then decide whether to touch production.                   |
| **Generation gap** | <p><strong>5. Generative programming and semantic compilation</strong><br>(Generative Programming)</p>     | **Generate** | From domain specifications, semantic IR and variability points, generates query plans, mathematical constraints, workflows, compiled evaluators or controlled artifacts.                                       | **Turn settled solutions into capability**: a rule that has been stated clearly and verified becomes executable without another round of hand-coding. |
| **Trust gap**      | <p><strong>6. Formal methods and runtime verification</strong><br>(Formal Methods &#x26; Verification)</p> | **Verify**   | Establishes a trusted admission boundary through types, physical units, invariants, pre- and post-contracts, state machines, differential equivalence, simulation, shadow verification and runtime monitoring. | **Everything generated must be checkable**: permissions, boundaries, rules and comparison trials keep evolution from turning into loss of control.    |

These six are not six unrelated technology choices. Together they answer six basic philosophical questions that run from cognition to execution in enterprise software:

* **Domain-driven design** defines the world (_what the business world is_);
* **Domain language** describes the world (_how to express it precisely to machines_);
* **Event sourcing** remembers the world (_what happened in the past_);
* **The digital twin** projects the world (_what will happen if we do this_);
* **Generative programming** produces capability (_how to turn specifications into capabilities_);
* **Formal methods** verify capability (_why we dare to execute it in production_).

***

## 9.3 The complete loop: define → describe → remember → project → generate → verify → execute

Once these six pillars are joined end to end, they build inside the software runtime a self-renewing **loop of capability formation and evolution**:

![A vertical loop from the six engineering pillars to controlled production execution: 1. Domain-Driven Design (defines the world) → 2. Domain language (describes the world) → 3. Event sourcing (remembers the world) → 4. Digital twin (projects the world) → 5. Generative programming (produces capability) → 6. Formal methods (verifies capability) → 7. Controlled production execution → new domain events; step 7 produces new domain events, and execution results flow back to the event store, returning to step 3, event sourcing (remembers the world).](../.gitbook/assets/chapter-09-1.svg)

Note especially the return arc from step 7 to step 3: **every controlled production execution, every floor-level production report, every manual adjustment by a planner produces new domain events, which are written back into event sourcing and become the raw material for the next round of digital-twin projection, machine-learning training and runtime specialization**.

In this sense software stops being a dead artifact that stands still once delivered. It acquires a complete metabolic mechanism of sensing, remembering, projecting, creating, verifying and acting.

***

## 9.4 Where the LLM really sits: not a seventh pillar, but a semantic frontend and orchestrator running through the whole loop

If those six disciplines already form such a tight loop, where do large language models and agents belong in it?

This is a crucial architectural judgement: **the LLM is not a "seventh pillar" standing beside the other six. Its real position is that of the semantic frontend, the runtime reasoner and the capability orchestrator threaded through the loop.**

Concretely, the LLM serves as a bridge in three places while holding the line of never replacing deterministic machinery:

1. **At the define and describe entry point, it sharply lowers the cost of getting from natural language to domain language.** In the past, turning a temporary rule uttered on the floor into a formal domain-specific language (DSL) expression or an `ospf` expression required an engineer who knew the grammar. Now, as a semantic frontend, the LLM helps business people organize a vague, incomplete natural-language request and map it into a constrained domain-language representation (Semantic IR).
2. **In the remember and project stage, it reasons over context and negotiates options using event history and the digital twin.** Facing an anomaly on the floor, the agent pulls the historical thread from event sourcing and the projected state from the digital twin, works out which orders and lines the anomaly touches, and assembles several comparable candidate plans — say, "shift only the affected jobs locally" versus "add a shared-resource constraint and trigger rolling rescheduling" — explaining the trade-offs in language the business can follow.
3. **At the boundary between generate and verify, it hands candidates to the deterministic pipeline and never oversteps.** The LLM stops at proposing a structured candidate. How the candidate compiles into a query plan or a set of mathematical constraints (generative programming), and how units, permissions, mathematical feasibility and result equivalence are checked (formal methods), is left one hundred percent to deterministic compilers, validators and solvers.

Above this six-step loop of capability formation sits **software product line engineering (SPLE)**, which governs the product. It is not a "seventh step" in the sequence either; it takes a global view of commonality and variability — deciding whether a dynamic capability that has passed through the loop should remain a one-off temporary capability, or be promoted to a customer-specific variant, a formal product variability point, or even the stable platform core. (Chapter 17 sets out that mechanism of product evolution in detail.)

With the blueprint of the six pillars clear, Chapter 10 turns first to the temporal substrate that supports runtime learning and reasoning: the third pillar, **event sourcing**, and the fourth, **the digital twin**.
