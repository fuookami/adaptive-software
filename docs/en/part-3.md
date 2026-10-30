<!-- i18n-status: translated -->
<!-- i18n-source: docs/zh/part-3.md -->
# Part Three: Engineering Pillars and the World Model — Remembering the Past, Simulating the Future and White-Box Diagnostics

In Volume Two we built the static cornerstone of adaptive software: a **formal domain model** that unifies the semantic contract of business systems, operations research optimization, machine learning and agents, carried by the `ospf` framework with its algebraic numbers, physical dimension safety, unified expression intermediate representation (Expression IR) and solver-decoupled architecture.

Yet enterprise operations and the industrial floor are never a static specimen of mathematical formulas, but a dynamic world that runs on through time, full of sudden disturbances and human intervention. Once this formal substrate enters a real runtime, it must answer four core engineering questions that decide the vitality of the system:
1. **The question of theoretical grounding**: is `LLM as Runtime` a fresh start that abandons traditional software engineering, or half a century of classic software engineering theory converging into one closed loop?
2. **The question of time and state**: how can the system both "remember how the past led to today" (event sourcing) and "safely project the future without disrupting real production" (the digital twin)?
3. **The question of white-box algorithm orchestration**: how can Domain-Driven Design (DDD) dismantle the bolt-on algorithm black box, so that local propagation, global rolling rescheduling and ultra-large-scale industrial solving such as column generation and Benders decomposition become native capabilities open to white-box orchestration by the application layer?
4. **The question of self-explaining results**: once the operations research solver has finished, how do we leave behind the predicament of "returning only a feasible/infeasible string or throwing a pile of cryptic logs", and use the orthogonal solve report (`SolveReport`) and a layered evidence chain to explain to the planner clearly "why this plan is optimal" or "exactly which rules conflict and make the problem infeasible"?

This volume works through these four questions chapter by chapter, building up for you the engineering skeleton and the runtime world model of adaptive software.
