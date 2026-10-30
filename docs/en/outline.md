<!-- i18n-status: translated -->
<!-- i18n-source: docs/zh/outline.md -->
# Book Outline — Five Parts, Eighteen Chapters, Seventy-Two Sections

## Part One: The Paradigm Shift — From Software 1.0 to LLM as Runtime
* **Chapter 1: Enterprise Software Trapped by CRUD and Bolt-on Black Boxes**
  * 1.1 A rush-order storm across ERP, APS, MES, WMS and TMS: why is it that the more systems we build, the harder shop-floor scheduling gets?
  * 1.2 The limits of the traditional anemic CRUD architecture: business definitions scattered across application services, database scripts, reports and human experience
  * 1.3 Seven engineering pain points of "bolt-on black-box algorithm services": expensive data assembly, statelessness that blinds the system, and unexplainable intermediate values
  * 1.4 Two interlocking root problems: who expresses domain knowledge in one unified way? and how does a new domain capability enter the system?
* **Chapter 2: From Records to Intent — How Much Cognition Has Software Taken Over?**
  * 2.1 The four stages of software evolution: informatization (recording), automation (acting by rules), pre-LLM intelligence (specific judgments) and LLM intelligence (understanding goals)
  * 2.2 The real historical break: where software capability is formed extends from "before release" into "while in use"
  * 2.3 The dead end of project-based delivery: why can "raise a requirement — write the code — test the interface — ship a release" never catch up with long-tail change?
  * 2.4 Redefining the relationship between people and software: users once only used programs; in the future they keep shaping the program while they use it
* **Chapter 3: Rereading Software 1.0, 2.0 and 3.0 — Two Orthogonal Axes of Evolution**
  * 3.1 Andrej Karpathy's three generations of software paradigms: code defines behavior (1.0), data shapes behavior (2.0) and intent drives behavior (3.0)
  * 3.2 Why are the three generations not a relation of replacement, but capability formed in layers, one on top of another?
  * 3.3 Two orthogonal axes of evolution: how software capability is formed (1.0 → 2.0 → 3.0) vs. the four computing paradigms (deterministic, operations research optimization, machine learning, semantic reasoning)
  * 3.4 The core insight: algorithms and software from before the LLM era will not be displaced; they become the "compilation target" of large language models
* **Chapter 4: The Core Thesis: LLM as Runtime**
  * 4.1 Why is "move the development tooling into a chat box and let the model write production code online" a dead end in industry?
  * 4.2 What is real LLM as Runtime? Positioning the large language model as the runtime's "business semantic frontend"
  * 4.3 Why is it closer to just-in-time compilation (JIT) than to arbitrary code generation?
  * 4.4 The iron law of production execution: natural language always stays in the candidate layer; deterministic mechanisms guard the production execution boundary

## Part Two: The Semantic Substrate — Formal Domain Models and the OSPF Framework
* **Chapter 5: Unifying the Three Natives in a Formal Domain Model**
  * 5.1 Why is "every runtime side shares the same formal domain model" the foundation of the whole architectural edifice?
  * 5.2 Four orthogonal interpretations of the same business concept: the numeric interpretation on the system side, the symbolic interpretation on the operations research side, the statistical interpretation on the machine learning side and the semantic interpretation on the agent side
  * 5.3 State-role isolation: why does unifying the definition of "feeding quantity" never mean merging demand, planned, forecast, estimated and actual quantities into a single field?
  * 5.4 The eight minimum constituent elements of a formal domain model, and the runtime instance boundary
* **Chapter 6: Meet OSPF — Algebraic Numbers and Dimensional Safety**
  * 6.1 Why is writing formulas directly with raw `Double` floating-point numbers a time bomb in industrial software?
  * 6.2 The algebraic numeric hierarchy (`RealNumber`): a generic abstraction over integers, rationals, floating-point and arbitrary-precision numbers, plus precision-tolerance governance
  * 6.3 Physical dimensions and unit safety (`Quantity` / `PhysicalUnit`): making "weight plus time" or a unit mismatch fail explicitly at validation time
  * 6.4 Linear conversion and affine transformation: converging unit conventions across systems (ERP/APS/MES/WMS)
* **Chapter 7: One Fish, Two Dishes — A Shared Expression IR with Two Entry Points**
  * 7.1 The pain of division in traditional R&D: backend programmers compute material consumption in business code, while algorithm engineers rewrite the same feeding constraint in a script
  * 7.2 The OSPF expression intermediate representation (Expression IR): constants, stable symbol identity, attribute paths and an immutable syntax tree
  * 7.3 A dual-entry architecture sharing one business core: the system side substitutes concrete values and evaluates directly vs. the operations research side substitutes symbolic variables and generates constraint fragments
  * 7.4 Partial evaluation, the compiled evaluation cache and property-based equivalence testing: using automated tests to prove that system computation and the algorithm model agree 100%
* **Chapter 8: Business as Building Blocks — Structured Functions, Logic Operators, Solver Decoupling**
  * 8.1 Turning the nonlinear into the linear: normalization and algebraic classification of absolute values, slack variables, piecewise linear functions and step rules
  * 8.2 Putting business branches into a mathematical model: Boolean logic, conditional branching, choose-one constraints and multi-objective soft-constraint trade-offs
  * 8.3 A compiler-style lowering architecture: how does the domain model break free of any binding to the API of a particular commercial or open-source solver?
  * 8.4 The explicit error contract (`Result` / `Ret`) and capability checking: silently truncating high-order terms is strictly forbidden; how to fail explicitly or degrade gracefully when the solver does not support a capability

## Part Three: Engineering Pillars and the World Model — Remembering the Past, Simulating the Future
* **Chapter 9: The Six Engineering Pillars of Adaptive Software**
  * 9.1 Six fundamental gaps: the semantic gap, the expression gap, the memory gap, the projection gap, the generation gap and the trust gap
  * 9.2 The division of labor among six software-engineering directions: Domain-Driven Design (definition), domain language (description), event sourcing (memory), the digital twin (projection), generative programming (generation) and formal methods (verification)
  * 9.3 The complete closed loop from "define → describe → remember → project → generate → verify → execute"
  * 9.4 Where the large language model really sits in that loop: not a seventh pillar, but a semantic frontend and orchestrator running through the whole chain
* **Chapter 10: The Runtime World Model — Event Sourcing and the Computable Digital Twin**
  * 10.1 Why can a system that holds only the "current state" neither replay the past and assign accountability, nor support machine learning and capability sedimentation?
  * 10.2 Event sourcing and version snapshots: an immutable timeline that preserves facts, decisions, reasons for manual adjustment and rule versions
  * 10.3 Beyond the "static display dashboard": dynamic digital twin projection on the three-layer model of planned time, estimated time and actual time
  * 10.4 Domain sedimentation of changeover time, production duration and calendar availability: how to achieve "upstream task delayed → downstream estimated state updated automatically within seconds"?
* **Chapter 11: Orchestrating Optimization Algorithms in the Open with DDD**
  * 11.1 Fifteen points of architectural dependency reasoning: why must algorithms first be libraries and modules that the application layer can orchestrate in the white box?
  * 11.2 Local propagation vs. global rolling rescheduling: how to draw the policy boundary between propagating time locally and triggering a full reschedule?
  * 11.3 Driving column generation with a DDD architecture: the restricted master problem, the pricing subproblem contract and reduced-cost verification
  * 11.4 Driving Benders decomposition with a DDD architecture: master/subproblem decoupling, feasibility/optimality cut verification and the convergence certification boundary
* **Chapter 12: Beyond “Infeasible” — The Orthogonal SolveReport Protocol**
  * 12.1 Why do a "success/failure" return value or a raw snippet of solver logs leave the planner stuck?
  * 12.2 The orthogonal solve-result protocol (`SolveReport`): decoupling problem status, termination reason and solution presence, and forbidding the false report of "timed out with no solution" as "infeasible"
  * 12.3 Mathematical evidence for a solution and for its absence: the optimality gap (Gap), slack/violation, binding (active) constraints and the irreducible infeasible subsystem (IIS / conflict set)
  * 12.4 The four-layer architecture of solve-result self-explanation: from the underlying mathematical evidence, through algorithm symbol mapping and business object binding, to localized summarization by the agent

## Part Four: Three Natives in Concert — When LLMs and Machine Learning Meet Optimization
* **Chapter 13: The Symphony of Three Natives — Bidirectional OR × ML Enhancements**
  * 13.1 ML-Native: freezing feature schemas and data versions, so that capacity and duration forecasts enter the approval flow carrying quality metrics, uncertainty and lineage
  * 13.2 Enhancement one (ML assists OR): from point prediction to robust optimization, stochastic programming, chance constraints, CVaR and distributionally robust optimization (DRO)
  * 13.3 Enhancement two (ML/RL under OR constraints): constrained reinforcement learning accelerates column-generation pricing and Benders subproblems, while the operations research master problem guards feasibility and provides an exact fallback
  * 13.4 Enhancement three (decision-feedback parameter calibration): learning objective weights and soft-constraint preferences from the deltas and reason codes of planners' manual adjustments
* **Chapter 14: Agent Native and the Business Semantic Frontend**
  * 14.1 Giving the agent a "business dictionary and grammar": exposing structured domain metadata, referenceable variables, intermediate values, constraint templates and process contracts
  * 14.2 Structured pruning of the reasoning context: reasoning about blast radius from the current digital twin state, historical snapshots and anomalous events
  * 14.3 The semantic intermediate representation (Semantic IR): design specifications for the query, constraint and process intermediate representations
  * 14.4 Dynamic constraint translation in practice: from "today lines A and B share a feeding port, and total feeding must not exceed 1000 kg" to a hashable, compilable structured linear-constraint candidate
* **Chapter 15: The Trusted Execution Boundary — Eight Steps from Candidate to Production**
  * 15.1 The eight-step standard pipeline from conversation to sedimented capability: capture → normalize → intermediate representation → verification → optimization → lowering mapping → release → adaptive monitoring
  * 15.2 Formal methods as the cross-cutting trust foundation: type, dimension, tenant permission, budget quota, pre/postcondition contract and business invariant checks
  * 15.3 Proving yourself before entering production: digital twin sandbox simulation, generic/specialized path equivalence verification and shadow runs
  * 15.4 Governing the eight core runtime risks: defending against semantic drift, privilege penetration, error fossilization, environmental shift, code supply-chain risk, over-specialization, history and feedback distortion, and simulation mismatch

## Part Five: Runtime Evolution and the Full Picture — Toward the Adaptive DOP
* **Chapter 16: Semantic JIT — Profile-Driven Specialization and Invalidating Rebuilds**
  * 16.1 JIT compilation of dynamic queries and specialization of dynamic constraints: grouping like requests by "normalized semantic shape" rather than by counting raw text
  * 16.2 Runtime profiling and promotion thresholds: deciding whether to specialize from call frequency, latency, rows scanned, compute cost and business value taken together
  * 16.3 The three-tier specialization ladder (Tier 0 → Tier 1 → Tier 2): from the generic planner and parameterized plans / precompiled constraints to on-demand upgrades of controlled virtual-machine plugins
  * 16.4 The plan registry and deoptimization: when the database schema, the field catalog or a permission policy changes, how to mark the invalidation precisely and fall back to the generic path automatically?
* **Chapter 17: Taming Complexity — The Mythical Man-Month, SPLE and Four-Tier Promotion**
  * 17.1 Revisiting *The Mythical Man-Month*: when large language models make the marginal cost of "generating new capability" collapse, how do we hold on to the system's "conceptual integrity"?
  * 17.2 Why is dynamization at runtime not the end point, but a probing mechanism for discovering the stable product structure of the future?
  * 17.3 The four-tier capability promotion funnel of software product line engineering (SPLE): temporary capability → customer-specific capability → product variability point → stable platform core
  * 17.4 Sedimenting five core platform assets: the semantic intermediate representation, the semantic compiler, the capability registry, the adaptive runtime and the product-line variability model
* **Chapter 18: The Full Picture in Practice — Building an Adaptive DOP from Scratch**
  * 18.1 A full retrospective of the running use case: data-driven capacity-estimation approval + a constrained shared feeding port for production lines A and B + upstream task T1 delayed + cross-system coordinated rescheduling
  * 18.2 A six-stage roadmap for engineering delivery: unified domain model → OR-Native → event sourcing and the digital twin → ML-Native → agent semantic frontend → runtime specialization and product-line promotion
  * 18.3 A full reconstruction of the software R&D paradigm: seven shifts across requirements, development, testing, release, architecture, core assets and product engineering
  * 18.4 The future engineer and organization: evolving from "people who write CRUD and tune prompts" into "engineers of intelligent systems and semantic compilers"
