<!-- i18n-status: translated -->
<!-- i18n-source: docs/zh/chapter-03.md -->
# Chapter 3: Rereading Software 1.0, 2.0 and 3.0 — Two Orthogonal Axes of Evolution

When we talk about "software that keeps forming its own capability while in use", the question that most reliably divides a technical team follows at once: now that large language models can already understand natural-language intent and drive computation, does that mean the traditional hard-coded rules and database systems of Software 1.0, together with the traditional machine-learning models that dominated the past decade (Software 2.0), are about to be retired? And where do operations research (OR) solvers, which are indispensable in industrial manufacturing and supply chain, belong — which generation of software?

To settle these architectural myths once and for all, this chapter follows the `Software 1.0 → 2.0 → 3.0` line of evolution proposed by Andrej Karpathy and, grounded in engineering practice on enterprise core systems, builds a clear **framework for thinking about software on "two orthogonal axes"**.

---

## 3.1 Andrej Karpathy's three software paradigms: code defines behavior (1.0), data shapes behavior (2.0) and intent drives behavior (3.0)

In 2017 Andrej Karpathy proposed the famous **"Software 2.0"**, describing a new way of producing software that deep learning brought about: inside a neural network, the behavior of the program is no longer specified line by line by human engineers, but is instead compressed into hundreds of millions of model weights by collecting data, defining an objective function and running training procedures such as gradient descent.

By June 2025, in his talk *Software Is Changing (Again)*, Karpathy went further and defined the large-language-model era as **"Software 3.0"**, pointing out that large language models are becoming a new form of computer, and that natural-language prompts and context are beginning to serve as a brand-new programming interface — for the first time, humans can drive computation directly through natural-language interaction.

If we bring this 1.0-to-3.0 evolution framework into serious enterprise software architecture, three terse verdicts capture the essential character of each generation:

* **Software 1.0: `Code is Program` (code defines behavior)** — engineers write settled business knowledge explicitly into source code, rules and queries;
* **Software 2.0: `Data trains Program` (data shapes behavior)** — data and the training-optimization process compress historical experience into the weights of neural networks or statistical models;
* **Software 3.0: `Intent drives Program` (intent drives behavior)** — human business intent and runtime context enter the software's execution and evolution directly.

Let us look separately at what each generation really looks like in enterprise systems such as DOP / APS, and at the boundaries of its capability:

### 1. The first generation (Software 1.0): code defines behavior

In Software 1.0 the standard production path is: `business requirement → system design → write code / rules / database queries / algorithm implementations → test → release → user operation`.

* **Program form and producer**: a program appears as source code, business rules, SQL queries, finite state machines and explicit algorithm implementations, written by hand during development by developers, architects and algorithm engineers.
* **Core strengths**: very strong determinism, behavior boundaries that are clear and provable, and highly controllable execution performance and resource cost. In advanced planning and scheduling (APS) and digital operations platforms, a great many core capabilities — database transactions, deterministic business computation (BOM explosion, exact inventory deduction), explicit rule validation, low-level solver adaptation and high-frequency query execution — still belong to Software 1.0 today, and will remain irreplaceable in the future.
* **Inherent limitation**: the problem with Software 1.0 has never been that it is "not precise enough", but that **"the main entrance through which new capability enters the system is locked inside the development process"** — once it faces the long tail of differences on the floor, a requirement has to travel the heavy chain of analysis, development, testing and release again and again.

### 2. The second generation (Software 2.0): data shapes behavior

In Software 2.0 the main path to forming software capability becomes: `historical data (samples / labels / features) → training process (optimization objective) → model weights (compressed experience) → online inference (prediction / recognition / estimation)`.

* **Core value**: it changes the way *part* of software behavior gets written. To learn real machining durations from historical production-execution data, assess effective capacity, identify delivery-delay risk or forecast market demand, engineers no longer enumerate thousands of `if-else` rules by hand; the model fits statistical regularities from historical facts and, with probabilistic, uncertainty-bearing output, supplies estimates that a deterministic system cannot give directly.
* **Inherent limitations**: first, Software 2.0 is essentially **"programming at training time"** — model capability is usually still formed in an offline training stage before users formally use the system, and at runtime the model merely calls frozen weights; second, **model weights are not naturally equivalent to business semantics** — if features, labels, physical units, time windows and business objects are not strictly aligned with the domain model, the model degrades into an unexplainable black box; finally, a predicted capacity or duration number is not itself a plan of action, and must still be turned into an executable production plan by a deterministic system or an optimization model.

### 3. The third generation (Software 3.0): intent and context begin to drive behavior

In Software 3.0 the basic runtime chain evolves into: `user intent (natural-language goal) + runtime context (current state / historical events / permission boundary) → large language model (understand / reason / plan) → tools and systems (invoke existing capability) → structured result (candidate plan / controlled action)`.

* **Core breakthrough**: natural language is no longer merely a "requirements document" for programmers to read before release; it begins to take part directly in runtime computation and orchestration. Business people can state goals, temporary rules, exceptions and preferences directly, and the model, drawing on the current runtime context, organizes existing tools and generates a new structured execution plan.
* **Key governance premise**: in enterprise software, "intent-driven" never means that natural language can bypass system governance and rewrite production data directly; on the contrary, its real value is **to let user intent be understood in real time at runtime and turned into a structured representation for the first time, and thereby enter a deterministic execution chain that is verifiable, simulable and reversible**.

---

## 3.2 Why are the three software generations not a relationship of replacement, but a layered stacking of how capability is formed?

In a wave of technological change it is easy to fall into the black-and-white fallacy of "replacement theory": when deep learning (Software 2.0) rose, some declared that traditional code (1.0) would be replaced by end-to-end neural networks; after large language models (Software 3.0) exploded, other voices announced that traditional software engineering and machine-learning models alike would be swallowed by one omnipotent model.

In real industrial systems, however, **the three generations are never a relationship in which the new wave eliminates the old, but a layered stacking of the ways software capability is formed**:

![Layered stacking of how capability is formed across the three software generations, four layers from top to bottom: LLM as Runtime (continuous discovery, verification, specialization and sedimentation of new capability at runtime), Software 3.0: intent drives behavior (understand open goals, plan with context, generate candidate plans), Software 2.0: data shapes behavior (learn statistical regularities from historical data, predict capacity / duration / risk), Software 1.0: code defines behavior (deterministic computation, state transactions, permission control, efficient execution).](assets/diagrams/chapter-03-1.svg)

We can compare the responsibility boundaries and the complementarity of the three generations along six core dimensions:

| Dimension of comparison | Software 1.0 (first generation) | Software 2.0 (second generation) | Software 3.0 (third generation) |
| :--- | :--- | :--- | :--- |
| **Primary "program" form** | source code / explicit rules / database queries | neural-network and statistical-model weights | prompts + runtime context + tool calls + runtime plans |
| **Primary producer of capability** | human developers, architects, algorithm engineers | historical data + training-optimization algorithms | business users + large language models + adaptive runtime |
| **Main stage of capability formation** | development / build and release | offline training | runtime / real-time human-machine interaction |
| **Tasks it is best at** | deterministic execution, transactional guarantees, low-cost high-frequency computation | mining statistical regularities, duration and capacity prediction, risk estimation | understanding open goals, dynamically composing capability, handling long-tail variation |
| **Typical failure mode** | rigid in the face of requirement change, leading to repeated manual customization | data bias, distribution drift, output uncertainty, black-box opacity | model hallucination, unauthorized actions, planning errors, growth of structural entropy in the system |
| **Focus of engineering governance** | unit testing / type system / version control / release pipeline | data lineage / offline evaluation / drift monitoring / model artifact governance | structured output / permission validation / digital-twin simulation / capability sedimentation |

This panoramic comparison yields a very important architectural judgement: **from Software 1.0 to 2.0, what changed was mainly *how* software capability is implemented (from hand-written rules to weights trained from data); from Software 2.0 to 3.0, what really changed is *when* software capability is formed, *who* can take part in programming, and *which stage of the software lifecycle* programming happens in**.

So only with Software 3.0 does the change truly reach the production mode and the whole lifecycle of software. And "LLM as Runtime", as this book proposes it, takes one large step beyond Software 3.0's "prompt-driven computation": it places the one-off dynamic intent produced at runtime under the constraints of domain language, formal verification, digital-twin simulation and product-line governance, so that capability is continuously formed, specialized and sedimented into the product.

---

## 3.3 The two orthogonal axes of evolution: how software capability is formed (1.0 → 2.0 → 3.0) vs. four computing paradigms (deterministic, OR optimization, machine learning, semantic reasoning)

When planning the next generation of advanced planning and scheduling (APS) or a digital operations platform (DOP), architects regularly run into another awkward classification puzzle: the system contains four kinds of core computing capability at once — **deterministic business systems**, **operations research (OR)**, **machine learning (ML)** and **large language models / agents (LLM / Agent)**; if we divide by Software 1.0, 2.0 and 3.0, which generation does OR optimization belong to?

The answer is: **do not try to force the four kinds of computing capability one-to-one into the boxes of the three software generations, because "software generation" and "computing paradigm" are two genuinely orthogonal coordinate axes!**

* **The first axis (vertical): how software capability is formed (Software 1.0 → 2.0 → 3.0)** — it answers "when, and in what way, software behavior and business capability are created" (by writing code during development, by learning from data during training, or by intent-driven generation at runtime);
* **The second axis (horizontal): the system's computing paradigms (deterministic computation / OR optimization computation / statistical and probabilistic computation / semantic reasoning computation)** — it answers "once the input is fixed, what mathematical or logical mechanism the underlying engine uses to perform the computation".

The cross-coordination of these two orthogonal axes can be shown clearly by the following architecture matrix:

| Computing paradigm / core capability | Primary computational responsibility | Orthogonal relation to Software 1.0 / 2.0 / 3.0 (how capability is formed) |
| :--- | :--- | :--- |
| **Deterministic system**<br>(numeric and state computation) | state management, database transactions, permission control, pure-function business computation (BOM explosion, changeover-duration calculation), workflow execution | **Carried mainly by Software 1.0**, and the cornerstone of stable system operation; at the same time, in Software 3.0, high-frequency runtime queries and dynamic rules can also be just-in-time compiled (JIT) and frozen into deterministic execution plans. |
| **Machine learning**<br>(statistical and probabilistic computation) | effective-capacity estimation, machining-duration prediction, identification of delivery-delay risk, demand-distribution modeling and uncertainty quantification | **Typically embodies Software 2.0** (weights formed by training on data); yet in the Software 3.0 runtime it also serves as a native prediction and parameter-calibration capability that agents and process orchestration can invoke. |
| **OR optimization**<br>(symbolic and mathematical-programming computation) | formalizing business goals and resource constraints into a mathematical programming model (MILP, CP, column generation, Benders decomposition) and searching for a feasible or globally optimal solution | **Spans all three generations, never any single one**:<br>• **In the 1.0 mode**: algorithm engineers write the mathematical model and hard constraints at development time;<br>• **In the 2.0 mode**: distributions and uncertainty sets predicted by machine learning are introduced (building robust or stochastic optimization), or reinforcement learning accelerates subproblem solving, and objective weights are learned from human feedback;<br>• **In the 3.0 mode**: dynamic constraints and temporary objectives compiled from users' natural-language intent are accepted directly at runtime! |
| **Large language models / agents**<br>(semantic reasoning and orchestration) | understanding open business goals, reasoning about impact with the runtime context, generating structured candidate plans, orchestrating and invoking the other three computing backends | **Typically embodies Software 3.0**: the main entrance that brings human intent and context into the runtime, coordinating deterministic computation, machine learning and OR optimization downstream. |

This "two-axis orthogonal" model clears up our biggest architectural blind spot: the industrial software of the future is decidedly not "one large language model replacing the scheduling solver and the business systems", but rather **Software 3.0 as the runtime semantic layer and orchestration entrance, organically unifying the four computing paradigms of deterministic computation, OR optimization, machine learning and semantic reasoning; and the capability inside each computing paradigm can itself keep forming and evolving through the 1.0 mode (coding at development time), the 2.0 mode (learning at training time) and the 3.0 mode (intent translation and sedimentation at runtime)**.

---

## 3.4 Core insight: the traditional algorithms and software of the pre-LLM era will not be eliminated — they will become the "compilation targets" of large language models

Having understood the layered relationship of the three generations and the two-axis model, we reach one of this book's core theses about putting artificial intelligence to work in enterprise software:

> **The traditional software engineering and algorithmic intelligence of the pre-LLM era (database query optimizers, rule engines, statistical prediction models, mixed-integer linear programming, heuristic algorithms, workflow engines and purpose-built code) will not be eliminated; they will become more important than ever — because they become the "compilation targets" of large language models at runtime**.

Why can't a large language model take on all the work by itself, from understanding intent to computing the final schedule table? Because the two kinds of technology are naturally complementary in their computational characteristics:

* **The exploration layer (large language models and agents)**: the strength of a large language model lies in **handling openness, fuzziness and long-tail variation**. Faced with an incomplete user statement, an anomaly never seen before or a negotiation over rules across departments, it can understand human intent at very low marginal cost, organize scattered context and propose a structured candidate plan. But its weaknesses are just as fatal: high compute cost per inference, large response latency, probabilistic variation in output, and no ability to give a rigorous proof of mathematical feasibility and optimality over tens of thousands of operation variables.
* **The solidification layer (traditional systems and OR / statistical models)**: database query plans, rule engines, OR solvers (MILP, column generation), controlled prediction models and compile-time code possess exactly the four industrial-grade qualities the large model lacks — **deterministic execution results, extremely low cost per run, millisecond-to-second response, and rigorous mathematical verifiability and auditability**.

So in the adaptive software architecture the two are not competitors; they stand in the standard **"explore — verify — solidify" upstream/downstream pipeline relationship**:

![1. A new long-tail requirement appears (no ready product capability existed) → 2. LLM exploration (understand at low cost and produce a candidate) → 3. Runtime evidence accumulates (verify stability and reuse rate) → 4. Traditional engine locks it in (compile into query / constraint / workflow).](assets/diagrams/chapter-03-2.svg)

In this closed loop the division of labor among the three roles is perfectly clear:

1. **The large language model (LLM) is responsible for "discovering what capability ought to exist"**: at the point of operation it catches the user's natural-language goals and temporary rules and translates them into a structured business candidate;
2. **The semantic compiler is responsible for "what deterministic form to turn it into"**: it lowers the validated structured semantics precisely into a parameterized SQL query plan, an `ospf` mathematical constraint expression, an optimization model or a standard workflow plan;
3. **The adaptive runtime is responsible for "when it is worth solidifying, and when to retire what has gone stale"**: it keeps observing runtime profiling, hands high-frequency stable tasks to traditional systems and OR algorithms for fast, low-cost execution, and rolls back safely or triggers recompilation when the environment changes.

By now the outline of "LLM as Runtime" is already taking shape. But for this architecture to truly land in a production environment we must still answer the sharpest engineering challenge: how is it essentially different from the common industry practice of "having the model generate Python/SQL scripts online and run them directly"? In Chapter 4 we take that core proposition head-on.
