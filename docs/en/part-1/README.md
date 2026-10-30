<!-- i18n-status: translated -->
<!-- i18n-source: docs/zh/part-1.md -->
# Part One: The Paradigm Shift — From Software 1.0 to LLM as Runtime

* **Chapter 1: Enterprise Software Trapped by CRUD and Bolt-on Black Boxes**
  * 1.1 A rush-order storm across ERP, APS, MES, WMS and TMS: why is it that the more systems we build, the harder shop-floor scheduling gets?
  * 1.2 The limits of the traditional anemic CRUD architecture: business definitions scattered across application services, database scripts, reports and human experience
  * 1.3 Seven engineering pain points of "bolt-on black-box algorithm services": expensive data assembly, statelessness that blinds the system, and unexplainable intermediate values
  * 1.4 Two interlocking root problems: who expresses domain knowledge in one place? how does new domain capability enter the system?
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
