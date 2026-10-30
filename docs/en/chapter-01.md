<!-- i18n-status: translated -->
<!-- i18n-source: docs/zh/chapter-01.md -->
# Chapter 1: Enterprise Software Trapped by CRUD and Bolt-on Black Boxes

In the brochures of almost every industrial software and supply chain system, the Digital Operations Platform (DOP) is painted as a picture of perfect order: enterprise resource planning (ERP) governs master data and the master plan, advanced planning and scheduling (APS) precisely solves the operations of every machine, the manufacturing execution system (MES) collects line progress in real time, the warehouse management system (WMS) keeps material availability (kitting) under control, and the transportation management system (TMS) dispatches vehicles for shipment.

Yet step onto a real production floor and you find that in many enterprises that have deployed the full stack of information systems and algorithms, planners and R&D teams end up working harder than before. Whenever something stirs on the floor—a line delayed, two workshops temporarily sharing one feeding port, a batch of raw material switched to a substitute—the supposedly highly collaborative family of systems quickly degrades into fragmented information islands, and in the end planners have to export Excel sheets and adjust by hand, or pull the R&D team into weeks of modifying code and algorithm interfaces.

Why is software's ability to adapt still so fragile when systems multiply and algorithms grow ever more expensive? This chapter starts from a real production scheduling storm, dissects the deep pathologies of the traditional "anemic CRUD" and "bolt-on black-box algorithm" architectures, and reveals the two root questions that next-generation enterprise software must answer.

---

## 1.1 A rush-order storm spanning ERP, APS, MES, WMS and TMS: why do more systems make floor scheduling harder?

Let us turn our eyes to a production scheduling scene at a manufacturing plant at 10:00 on a Tuesday morning.

The plant has two main production lines, line A and line B. According to the schedule issued on the morning shift, predecessor task `T1` on line A was to start at `08:00` and end at `09:30`, immediately followed by successor task `T2` starting at `10:00` (with 30 minutes of changeover time reserved in between); line B planned to start task `T3` at `11:00`. Meanwhile MES, WMS and TMS are each recording execution facts on the floor, and APS must consume their synchronized results and compute the actual impact on inventory, output and delivery progress.

At exactly 10:00, three changes hit the planner's desk at the same time:

1. **MES reports a delay**: predecessor task `T1` on line A actually started at `08:10` and only finished at `10:00`, a full 30 minutes later than planned.
2. **Temporary on-site equipment restriction**: the workshop director calls to say that because a feeding device is under emergency maintenance, lines A and B must **share the same feeding port** today, and the total feeding quantity of the two lines at that port must not exceed the limit of `1000 kg` (`feedingLimit = 1000 kg`).
3. **WMS substitute-material switch**: the warehouse reports that some primary material batches have not fully arrived and has just performed substitute allocation on planned tasks; after the substitute updated the feeding mix of planned tasks, material consumption estimates and the downstream MRP gap urgently need recalculation.

Faced with this situation, the planner states a request that is utterly natural in business terms:

> "Lines A and B share one feeding port today, so keep total feeding under 1000 kg. T1 is already late and we have just switched materials. Can you tell me which tasks and order deliveries will be affected later on? Do we only need a local adjustment, or do we have to rerun rolling scheduling?"

One sentence that any human planner finds perfectly clear instantly paralyzes traditional software systems, exposing the **"six kinds of business friction"** that wear business and engineering down every day:

### Friction 1: one business concept, six definitions across the company
To answer the planner's question, the system must first compute "feeding quantity", "production duration", "capacity", "available inventory" and "changeover time" correctly. But in the existing landscape these core concepts are scattered across six different corners:
* **Business systems (ERP/MES/WMS)** hold one set of numeric computation logic written in Java/SQL;
* **The scheduling algorithm (APS solve service)** holds one set of mathematical constraint expressions written in Python/C++;
* **Machine learning models** hold one set of historical capacity and duration definitions sliced by feature engineering scripts;
* **BI reports**, **project configuration files** and **veteran planners' personal experience spreadsheets** each maintain their own conversion factors.

Once a process rule or a substitute-material loss rate is tweaked and any one place is not updated in step, the absurd situation appears: "everyone says 'feeding quantity', yet the estimated consumption computed by the system, the planned feeding in the algorithm constraints and the actual statistics in the report simply do not line up." On the surface this looks like a data synchronization or interface integration problem; at root it is that **the enterprise lacks a single, authoritative source of business knowledge that systems and algorithms can consume together**.

### Friction 2: a tiny on-site rule change is forced through a long R&D process
"Today lines A and B share a feeding port, total under 1000 kg"—this is an extremely typical long-tail shop-floor rule. Similar changes, such as a device temporarily speed-limited, a rush order inserted, a material restricted for the day, or a customer demanding a special approval flow, happen in the factory every single day.

Yet under a traditional software architecture, if the original development did not hard-wire a parameter switch for "dual-line shared feeding port limit" into the database and the algorithm interface, the requirement can only go through the standard R&D chain:

![The floor raises an issue → implementation consultant interprets it → product manager confirms → backend development changes interfaces and table schema → algorithm engineer changes the mathematical model → integration testing → release.](assets/diagrams/chapter-01-1.svg)

For building brand-new platform standard capability this process is beyond reproach; but if even a process restriction that will hold for only a day or two must queue for an R&D release, by the time the code ships those orders have long been delivered or defaulted.

### Friction 3: the system only knows "what is now", having caught "process amnesia"
When the board pops a red alert that "task `T2` is estimated to be 45 minutes late", the system is showing only an isolated current state (`What is?`). What planners and managers really need to ask is "why did it become like this" (`What happened?`):
* Was it because predecessor task `T1` reported late, or because WMS failed to deliver material?
* Was it a sudden equipment failure, or did the morning-shift planner drag the work order sequence by hand?
* Which version of the capacity forecast snapshot was active when scheduling ran? Which constraint rule was decisive?

If the system only overwrites the latest state in a database and keeps no immutable domain events, decision basis, reasons for manual adjustment and rule-version timeline, it can neither carry out reliable historical retrospectives nor supply clean experience samples for machine learning and later optimization.

### Friction 4: current anomalies are visible, yet "what if we do this" cannot be safely projected
Facing the `T1` delay and the restricted feeding port, several hypotheses flash through the planner's mind (`What if?`): what if we simply push successor tasks back half an hour? What if we move some tasks to other resources? If we skip global rescheduling and only adjust locally, would that mask delivery risk?

But in traditional systems, lacking an independently computable mirror of the production world (a digital twin), a planner who wants a glimpse of the downstream chain reaction usually has only two choices: edit the official plan directly, or re-invoke the heavy global scheduling interface—editing the official plan directly is extremely risky, while running the global algorithm for every small tweak is unbearably slow.

### Friction 5: a large language model is connected, but it stays at "lively chat-style text suggestions"
Many enterprises have tried to bring in a large language model assistant. When the planner sends the question above into the chat box, the model does read the literal meaning, and may even produce a plausible-sounding reply: "I suggest you watch the delivery dates of T2 and T3, and manage the feeding pace of lines A and B."

But such natural-language advice cannot be turned directly into production capability: the model knows neither the exact variable name and unit behind "planned feeding quantity" in the system, nor how much feeding has actually occurred that day (`actualFeedingInWindow`), and it can hardly guarantee that the adjustments it improvises respect hard capacity constraints and permission boundaries. Without structured validation, simulation trials and an optimization solver as gatekeepers, who would let a chat message directly rewrite a factory's scheduling commands?

### Friction 6: one-off clever adaptation never settles into a long-lived reusable product asset
Even setting that aside: suppose an agent or an on-site engineer's temporary configuration finally handles this "shared feeding port" restriction for the customer. Next week or next month, when the same plant enables the rule again, or ten other customers in the same industry raise a highly similar "multiple lines sharing a pre-processing resource" requirement, the system is again reasoning from zero or rewriting project patches. One-off dynamic adaptation has no promotion path; the code branches delivered per project pile up, yet the product itself does not become more mature.

---

## 1.2 The limits of the traditional anemic CRUD architecture: business definitions scattered across application services, database scripts, reports and human experience

Why are these six kinds of business friction so widespread in enterprise software? When we peel away the business surface and look inside the code repository, the first thing we see is the **traditional "anemic CRUD" architecture** that has dominated enterprise development for more than twenty years.

To be clear, what we reflect on here is not MVC (Model-View-Controller) as a presentation-layer or interface-layer pattern—MVC coexists perfectly well with Domain-Driven Design (DDD). What actually rots the system is the common anemic `Controller -> Service -> DAO` organization: domain objects degrade into database table mappings (PO/DTO) with nothing but getters and setters, while complex business rules, calculation formulas and state transitions are all implicitly mashed into long procedural application service (Service) code and database access (DAO/SQL) scripts.

In simple administrative or document-routing systems, anemic CRUD may get by; but the essence of core systems such as APS and the Digital Operations Platform (DOP) was never simple "create, read, update, delete"—it is a complex closed loop built from dense computation, constraint solving and projection:

* **Basic business computation**: BOM tree explosion and quantity multiplication, feeding quantity calculation, material consumption estimation after substitute allocation, equipment changeover time calculation, work order production duration calculation, calendar availability and capacity occupancy calculation;
* **Constraint and optimization solving**: resource capacity constraints, dynamic business constraint injection, scheduling mathematical modeling and solving, rolling plan correction;
* **Dynamic projection and data intelligence**: production plan digital-twin projection, data-driven estimation and forecasting on historical facts, machine learning model artifacts and replay governance;
* **Semantic collaboration and runtime evolution**: agent business reasoning, metadata-based dynamic adaptation, semantic intermediate representation (Semantic IR) and controlled compilation, runtime profiling and accumulation of capability specialization.

When an R&D team tries to carry these capabilities with the traditional anemic `Service + DAO + DTO` pattern, it immediately runs into four structural dilemmas:

### 1. Business rules are tightly coupled to persistence and frameworks, losing independent testing and lightweight simulation
In an anemic architecture, logic that "computes the estimated start time of a successor task" or "calculates material consumption" is usually buried inside some thousand-line `ScheduleService.updatePlan()` method, interleaved with database queries, transaction commits and message sends. To verify whether a change to a changeover-time rule is correct, a developer must boot the full Spring container, connect to a test database and perhaps even start a remote algorithm service before the integration test can run. Because the computation logic has not been distilled into side-effect-free pure functions and an independent domain computation model, the system simply cannot run high-frequency, lightweight simulation trials of multiple hypothetical scenarios in memory without polluting real database state.

### 2. Raw `Double` values and dimensionless transport: the compiler notices no unit mismatch
Anemic service layers and data transfer objects (DTOs) usually pass values as raw floating-point numbers (such as `Double` or `BigDecimal`). The field is called `feedingAmount` or `capacity`, but whether its physical dimension is "kilograms (kg)" or "tons (t)", "kilograms per hour (kg/h)" or "pieces per shift", rests entirely on programmer comments or verbal agreement. When order quantities sent from ERP, inventory weights sent from WMS and takt times inside APS are mixed in one computation, even a crude error such as "adding kilograms to hours" or "multiplying and dividing affine units such as degrees Celsius" slips past the compiler and ends up as a hidden production scheduling incident.

### 3. Without state snapshots and three-layer time semantics, rolling scheduling degenerates into a "black ledger"
Anemic CRUD is naturally designed around "update in place": a work order table usually holds just one pair of `start_time` and `end_time` fields. Yet in real rolling scheduling and digital-twin scenarios, the same work order must distinguish three entirely different time roles at once:

| Time role | Business meaning | Data source and update mechanism |
| :--- | :--- | :--- |
| **Planned start/end time** | Baseline plan generated when the scheduling solution is formally released | Frozen and saved with the scheduling solution version, as the baseline for assessment and comparison |
| **Estimated start/end time** | Future forecast dynamically derived from the latest execution progress | Recomputed by forward propagation in the domain computation model whenever predecessor actual times update |
| **Actual start/end time** | The real physical execution time fed back by MES or the shop floor | Recorded one-way through external execution fact entry points, and never forged by algorithms or forecasts |

If the system only performs CRUD on the current state without distinguishing the three state roles "planned, estimated, actual", and without freezing the input snapshot and rule version of every computation round, then once a predecessor task is delayed or a rescheduling is triggered, the system overwrites historical state with current master data and can never again explain "why the last plan looked like that and why this round turned out like this".

### 4. Facing anemic interfaces, agents can only "feel the elephant in the dark"
In the Software 3.0 era, the defects of anemic CRUD are amplified further. When we want a large language model or an agent to help analyze anomalies, generate dynamic constraints or orchestrate processes, if the system exposes only a pile of anemic REST interfaces and database column names, the agent has no way to know the business meaning behind a field, the symbolic variables it may reference, where intermediate values come from, the unit boundaries, or the input/output contract of a process node. Letting a model read scattered business code or guess table columns yields nothing but far-fetched natural-language advice, or illegal parameters that fail system validation.

---

## 1.3 The seven engineering pain points of the "bolt-on black-box algorithm service": expensive data assembly, statelessness that cannot sense change, and unexplainable intermediate values

If the anemic CRUD on the system side hollows out business semantics, then the binary split of **"business system + bolt-on stateless algorithm service"**, widespread in industrial software, is the direct driver that keeps system and algorithm "two skins" for years.

In the development model of the past, because backend engineering teams and operations research / data science teams used different technology stacks, the architecture usually stuffed scheduling solving, statistical estimation and projection logic into a separate stateless algorithm service, which interacted with business systems through custom HTTP/RPC interfaces (passing in huge JSON/DTO payloads, returning a result summary). This bolt-on black-box mode, which looks "clean in responsibility", gave rise to eleven interlocking engineering pain points in real evolution (the first seven directly constrain daily development and operation, while the last four completely seal off the room for intelligent evolution):

### Pain point 1: the algorithm service is stateless, so even a small data tweak needs a fully assembled request
The bolt-on algorithm service manages no business state and no lifecycle; when a device on the floor changes state or a work order report is updated, the algorithm cannot sense it naturally, and the business system must re-query, filter and assemble the full request data from dozens of database tables and issue a new call.

### Pain point 2: trivial computation is forced through a heavy algorithm interface: "two hours assembling data, five milliseconds computing"
Many logics that belong to deterministic business computation are wrongly locked inside the algorithm service. For example:
* In demand forecasting, exploding a finished product into raw material requirements along the BOM is essentially a clear BOM tree traversal and quantity multiplication; if this too must call the full MRP algorithm service, the backend's cost of assembling the entire request structure for MRP often far exceeds implementing the BOM explosion computation itself.
* After scheduling completes, substitute allocation updates planned task feeding and only material consumption estimates need recomputation; but if the estimation formula lives only inside the algorithm service, the backend can only reassemble the whole set of algorithm plan tasks and call the remote interface again.

### Pain point 3: business knowledge is hidden inside the algorithm, and the system becomes "a mouthpiece that cannot read the rules"
In digital-twin projection, once predecessor task `T1` produces actual start/end times, the estimated start/end times of successor task `T2` should be updated dynamically per the following domain formulas:

```text
Estimated start time of the successor task
= Actual end time of the predecessor task
+ Changeover time from the predecessor task to the successor task
+ Calendar availability adjustment

Estimated end time of the successor task
= Estimated start time of the successor task
+ Production duration of the successor task
+ Shift / break / downtime adjustment
```

Here the changeover time and the production duration are computed as follows:

```text
Changeover time = f(previous material, next material, equipment, process rules)
Production duration = f(production quantity, equipment capacity, process takt, shift calendar)
```

If this computation knowledge is encapsulated only inside the scheduling black box, the business system itself can neither read nor compute changeover time and production duration, so even a purely local progress deviation cannot be projected independently, and the system can only re-invoke the complete scheduling algorithm again and again.

### Pain point 4: intermediate values are sealed inside the algorithm black box, so results cannot be queried, explained or reviewed
Optimization solving produces a large number of key intermediate business values (such as the planned feeding quantity of each line in each time bucket, resource occupancy rates, and changeover duration). In the bolt-on black-box mode these are merely temporary mathematical expressions inside the algorithm, and when solving finishes the service returns only a bare work order schedule table (`output summary`). When a planner asks "why was line B's task postponed by two hours after adding the shared feeding port limit?", the system cannot answer at all, because it cannot obtain named intermediate values and their source expressions.

### Pain point 5: the same concept is coded twice in system and algorithm, so the definitions are bound to fork
To display estimated consumption on the frontend or run pre-validation, backend programmers write one set of feeding and capacity formulas in Java/Kotlin; to build the mathematical programming model, algorithm engineers rewrite the same logic with symbolic variables in the algorithm service. Two code bases, two unit conversions, two sets of boundary conditions and exception handling—after a few requirement iterations, the numbers computed by the system and the results scheduled by the algorithm inevitably drift apart.

### Pain point 6: an external black-box machine learning model lacks domain semantics and version governance, so its predictions dare not enter production
When an enterprise introduces statistical estimation or machine learning models to predict equipment capacity, processing duration or delivery risk, if the model is merely an external black-box interface returning a bare number, the system cannot govern the feature definitions, observation windows, label cutoff times, model artifact versions and quality metrics behind it. Once black-box predicted values that never passed approval and boundary validation are used directly as scheduling input, or even conflated with manual configuration or actual capacity facts, the traceability of the whole planning system collapses completely.

### Pain point 7: solve results degrade into a "success/failure" string or raw logs, unable to explain themselves
Many algorithm interfaces return only a coarse boolean ("solved / unsolved") for the solve status, or throw the underlying solver's console log straight to the frontend. As a result the system cannot distinguish the following five situations, which differ enormously for business decisions:
1. **A solution exists and global optimality has been proven** (Optimal);
2. **A solution exists but optimality is unproven because the time limit stopped the search** (Feasible with Optimality Gap—labeling it "optimal" would mislead the planner);
3. **Mathematically proven absolutely infeasible** (Proven Infeasible—here we must locate which constraints actually conflict, that is, the irreducible infeasible subsystem, IIS);
4. **The problem is unbounded or beyond the model's capability** (Unbounded / Indeterminate);
5. **No feasible solution found only because of a timeout, cancellation or infrastructure error** (No Incumbent—never falsely report it as "the business plan is infeasible").

Looking further, beyond the seven direct pain points above, the black-box architecture also seals off four other key paths toward intelligence: dynamic constraints cannot be safely injected at runtime for lack of a structured variable catalog; agents cannot ground their reasoning for lack of structured domain context; high-frequency repeated customer-site rules cannot settle into formal capability for lack of runtime profiling and a registry; dynamically generated rules cannot establish a trusted boundary for production admission for lack of formal types and equivalence verification.

---

## 1.4 Two interlocking root questions: who expresses domain knowledge in one place? How does new domain capability enter the system?

Drilling through the six kinds of business friction, the four anemic CRUD dilemmas and the eleven black-box algorithm pain points listed above, we find that what blocks the evolution of enterprise software is neither some single algorithm being too slow, nor some model having too few parameters, but **two interdependent architectural root questions**:

1. **First root question: who expresses domain knowledge in one place?**
   In the past, core domain knowledge such as BOM explosion, feeding quantity, material consumption, changeover time, production duration, capacity occupancy, resource usage, substitute material rules and scheduling constraints was split across business system code, operations research algorithm scripts, machine learning feature engineering and agent prompts, so business semantics and computation definitions forked over the long run.
2. **Second root question: how does new domain capability enter the system?**
   In the past, any new business rule, process variation or customer long-tail requirement could enter the system only through the development-time chain of "requirements analysis → manual coding → testing → release". In the era of large language models, how can the business intent and stable usage patterns that users continuously produce during real operation be first absorbed at low cost by general intelligence, then structured, validated, simulated and specialized, and safely settled into reusable deterministic software capability?

The answers to these two root questions together form the core architecture blueprint of this book:

![Root question 1: how should domain knowledge be expressed in one place? The answer is the formal domain model—the shared semantic contract of the system, operations research optimization, machine learning and agents—which branches downward into numeric interpretation, symbolic interpretation, statistical/probabilistic interpretation and semantic interpretation.](assets/diagrams/chapter-01-2.svg)

![Root question 2: how does new domain capability enter the system? The chain is user intent at runtime / on-site behavior, the large language model / agent semantic frontend, semantic intermediate representation (Semantic IR), type/unit/permission validation · digital-twin simulation · semantic compilation, deterministic execution capability (query plan / constraint model / process plan), runtime profiling → capability promotion and specialization → deoptimization and recompilation, and software product line engineering (temporary capability → customer-specific → product variability point → stable core).](assets/diagrams/chapter-01-3.svg)

As the diagrams above show, these two answers by no means stand alone; they are each other's premise:
* **Answering the first question with a "formal domain model"**: we free domain knowledge from scattered code and black-box scripts and establish a computable, dimensionally typed, versionable formal domain model. The system side gives it a **deterministic numeric interpretation** (pure-function computation, state management and transaction governance); the operations research side gives it a **symbolic interpretation** (variable mapping, constraint modeling, optimization solving and feasibility certification); the machine learning side gives it a **statistical/probabilistic interpretation** (feature construction, distribution prediction and controlled parameter calibration); agents and large language models give it a **semantic interpretation** (understanding open intent and generating structured candidates). All four share one set of business concept definitions while strictly separating the state roles of "requirement, planned, forecast and estimated quantities and actual execution facts", ending the fragmentation of definitions at the root.
* **Answering the second question with "LLM as Runtime"**: on top of a unified formal domain language, the large language model no longer tries to overstep its role and act as a production executor or solver, but serves as the runtime's **semantic frontend**, compressing open user intent into a constrained semantic intermediate representation (Semantic IR). Semantic compilers and the adaptive runtime then take the baton, completing type and permission validation, digital-twin simulation, lowering and mapping, and hot-spot specialization driven by runtime profiles.

From the perspective of traditional software engineering, the path from "resolving semantic fragmentation" to "achieving runtime capability accumulation" is really about filling the **six fundamental engineering gaps** that enterprise software has long been missing, and integrating six classic software engineering disciplines into one complete closed lifecycle:

| Fundamental engineering gap | Corresponding software engineering discipline | Core action | Core responsibility in the Adaptive Software architecture |
| :--- | :--- | :--- | :--- |
| **1. Semantic gap**: the business world lacks a single authoritative definition | **Domain-Driven Design (DDD)** | **Define the world** | Makes domain concepts, bounded contexts, aggregates, business invariants, state roles and semantic ownership explicit, answering "what this business world actually is" |
| **2. Expression gap**: business knowledge cannot be combined and compiled by machines reliably | **Domain-specific language (DSL)** | **Describe the world** | Turns domain semantics into a machine-readable, composable, checkable, compilable business language (carried by the formal domain model and `ospf`), answering "how to describe this world precisely" |
| **3. Memory gap**: the system holds only the current state and lacks traceable experience | **Event sourcing and audit** | **Remember the world** | Keeps an immutable time series of domain facts, decisions, manual plan adjustments, rule changes and capability evolution, answering "how this world got to where it is today" |
| **4. Projection gap**: the system knows the current state but cannot safely rehearse the future | **Digital twin** | **Project the world** | Builds a computable, simulable, replayable production mirror spanning planned, estimated and actual time, answering "if we do this, what happens next" |
| **5. Generation gap**: new stable requirements still depend entirely on manual coding | **Generative programming and semantic compilation** | **Produce capability** | Automatically generates query plans, mathematical constraints, process plans or controlled artifacts from validated domain specifications and the semantic intermediate representation, answering "how to turn a description into capability" |
| **6. Trust gap**: dynamically produced capability lacks a safe admission boundary | **Formal methods and runtime verification** | **Verify capability** | Establishes a trusted boundary through types, physical dimensions, invariants, contracts, differential equivalence verification, shadow verification and runtime monitoring, answering "why this new capability may execute in production" |

In this engineering edifice built from "define → describe → remember → project → generate → verify → execute and produce new events", the large language model is not a "seventh pillar" standing beside the others, but the **semantic frontend, runtime reasoner and capability orchestrator** threaded through the whole chain. Above this closed loop, **software product line engineering (SPLE)** manages commonality and variability, steadily promoting dynamic capabilities that have been repeatedly validated by real operating evidence into customer-specific capability, formal product variability points and eventually the stable platform core.

At this point our long-term architectural goal has made a decisive leap: we are no longer content with "letting AI help programmers write custom code faster", but **turn part of customer-specific work and software capability evolution from a manual development activity before release into a controlled adaptive behavior at software runtime**.

To truly understand why this paradigm revolution is inevitable, we must first step away from concrete code details and return to the long river of software engineering history, to see how the responsibility software bears for humanity has migrated in discontinuous leaps from informatization to automation to intelligence. That is the story the next chapter unfolds.
