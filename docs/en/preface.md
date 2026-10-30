<!-- i18n-status: translated -->
<!-- i18n-source: docs/zh/preface.md -->
# Preface and Reader's Guide: When Users Use Software, They Are Also Compiling It

## 1. Why this book?

For half a century, however many times programming languages, frameworks and software-engineering methodologies have been reworked, the way enterprise software is produced has obeyed one iron law: **software capability is formed mainly during development, before release.** A requirement passes through product design, is coded by engineers in an integrated development environment (IDE), tested, built and released into production, and users then work with a program whose shape is already fixed. The moment the business floor produces a temporary rule, a process variation or a long-tail customization that development never foresaw, the team has to start the whole cycle again: raise the requirement, schedule it, write the code, integrate, release.

The arrival of large language models (LLMs) shook that assumption at its foundations for the first time.

If we look at the lineage of software evolution traced by Andrej Karpathy from the standpoint of enterprise systems, we see that Software 1.0 wrote business knowledge explicitly into code and rules; Software 2.0 compressed experience into neural-network weights through data, objective functions and training; and in the Software 3.0 era natural language and runtime context begin to serve as a new programming interface. From Software 1.0 to 2.0, what changed was mainly *how* software capability is implemented; from 2.0 to 3.0, the real rupture is over **when capability is formed, who takes part in creating it, and at what stage programming happens**.

Yet as countless teams tried to bring LLMs into serious operational core systems — advanced planning and scheduling (APS), manufacturing execution (MES), warehouse management (WMS), transportation management (TMS) — they quickly hit two high walls.

The first wall is the **wall of semantic fragmentation**. The same "capacity", "feeding quantity", "changeover time" or "time window" is a database column and a numeric computation in the business system, a decision variable and a mathematical constraint in operations research (OR), a statistical feature and a prediction label in machine learning (ML), and a natural-language prompt in an LLM. With four computing paradigms each speaking its own dialect, the systems not only fail to cooperate; they also suffer definition-mismatch incidents every time a rule is updated.

The second wall is the **wall of production trust**. LLMs excel at open, vague, long-tail intent, but they are fundamentally probabilistic generative models, exposed to hallucination, semantic drift and privilege escalation. On a factory floor and in a supply chain where real money moves, no enterprise can let a model rewrite production state on the strength of one sentence, still less read "LLM as Runtime" as "let the model write arbitrary code online and execute it directly".

This book was written to answer how to climb over those two walls.

## 2. The central thesis

The book proposes and systematically sets out a complete architecture for the next generation of enterprise software. Its core thesis condenses into one sentence:

> **In the past, users used programs; in the future, users will use programs and, at the same time, keep "compiling" them — where compiling means turning an open intent at runtime into a verifiable, versionable, reversible, deterministic software capability, not executing arbitrary code online.**

Around that thesis the book builds three layers of architectural positioning and two evolutionary loops:

1. **Long-term vision: Adaptive Software.** The strategic value of large language models is not that they supply a cleverer chat window, but that they push software from a static program delivered once towards adaptive software that keeps forming, validating and optimizing its own capability while in use.
2. **Core architecture: the three natives unified in a formal domain model.** OR-Native, ML-Native and Agent-Native share a single domain model carried on a formal computing substrate such as `ospf`, each giving a symbolic, a statistical/probabilistic and a semantic interpretation of the same business semantics, each held strictly in alignment with the deterministic numeric interpretation on the system side. The formal domain model is at once the common contract for cross-paradigm collaboration and the runtime's domain-language specification, type system and compilation contract.
3. **Evolution and governance: Semantic JIT plus software product line engineering (SPLE).** At runtime the LLM takes on only the "semantic frontend", producing structured candidate representations (Semantic IR). Compilers and validators, combining event sourcing (remembering the past) with a digital twin (projecting the future), lower those candidates into deterministic query plans, mathematical constraints or workflows. The adaptive runtime reads runtime profiles, recognizes frequent stable patterns and specializes the hot spots. Finally, SPLE absorbs capabilities proven by repeated evidence into the long-term product structure along a four-tier ladder — temporary capability, customer-specific capability, product variability point, stable platform core — so that the system does not slide into structural entropy through unbounded dynamization.

## 3. Who this book is for, and how to read it

The book addresses two core audiences. Choose the reading path that fits your background.

* **If you are an architect, a backend engineer, an operations-research engineer or an AI agent developer**, read the five volumes in order. Pay particular attention to Volume Two (the formal domain model and the numeric, dimensional and expression substrate that `ospf` carries with its dual entry points), Volume Three (DDD-based white-box algorithm orchestration, column generation and Benders decomposition, and `SolveReport` orthogonal diagnostics), and the semantic compilation pipeline in Volumes Four and Five.
* **If you are a CTO, a technology manager, a digital-transformation lead, a product manager or an industrial-software domain expert**, concentrate on **Volume One (Chapters 1–4)**, **Chapters 9–10 of Volume Three**, and **Chapters 17–18 of Volume Five**. Those chapters deliberately set aside the underlying mathematics and sketch, from the standpoints of software-evolution law, cost-structure reshaping, safety-governance boundaries and product-asset accumulation, a complete blueprint for moving from the quagmire of project customization to the operation of platform capability.

Now let us push open the door of the planning and scheduling room of a modern manufacturing enterprise, and watch how, under a traditional software architecture, an utterly ordinary change on the floor turns into a storm across the whole chain.
