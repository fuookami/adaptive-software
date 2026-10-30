<!-- i18n-status: translated -->
<!-- i18n-source: docs/zh/part-4.md -->
# Part Four: Three Natives in Concert — When LLMs and Machine Learning Meet Optimization

In the first three volumes we established the top-level evolutionary philosophy of `LLM as Runtime`, built the formal domain model substrate carried by the `ospf` framework, and constructed a runtime world model and a white-box orchestration system for optimization algorithms that spans "event sourcing (the past) — the current domain state (the present) — the computable digital twin (the future)".

By now the deterministic engineering skeleton is rock solid. Now we bring the two most vital intelligent forces formally into this edifice — **machine learning (ML)**, which stands for Software 2.0, and **large language models and agents (LLM / Agent)**, which stand for Software 3.0 — and join them fully with **operations research (OR)**, which stands for the rigor of mathematical programming.

In this volume we dismantle three core engineering mechanisms:

1. **Bidirectional enhancement between OR-Native and ML-Native (Chapter 13)**: how does machine learning say goodbye to "external black-box numbers", provide uncertainty distributions to optimization under a shared domain semantics, accelerate column generation and Benders decomposition subproblems with constrained reinforcement learning (Constrained RL), and learn objective weights and soft-constraint preferences from the planner's manual fine-tuning feedback?
2. **Agent-Native and the business semantic frontend (Chapter 14)**: how does a large language model, relying on structured domain metadata and reasoning context, turn one vague natural-language sentence spoken by a user on the floor (for example, "today lines A and B share a feeding port, and the total feeding quantity must not exceed 1000 kg") precisely into a hashable, verifiable, compilable Semantic IR and into dynamic mathematical constraints?
3. **The trusted execution boundary and the eight-step controlled compilation pipeline (Chapter 15)**: from candidate semantics produced by the model to actually writing into the production execution chain, how does the system raise an impregnable anti-hallucination guard-rail through the eight-step standard compilation pipeline, cross-cutting formal verification, digital-twin simulation and shadow verification?
