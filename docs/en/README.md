# From Code to Intent — Building Software That Evolves

**Domain-Driven Design, OSPF optimization modeling and the LLM as Runtime architecture for the Software 3.0 era**

*by fuookami · English edition (translation in progress) · [Chinese original](../zh/README.md)*

> **Translation status.** This English edition is a scaffold: every page mirrors the Chinese
> original file-for-file, and each page carries an `i18n-status` marker. Run
> `npm run i18n:check` in the repository to see the live progress, or read the
> [Chinese book](../zh/README.md) meanwhile. The five parts and eighteen chapters below link to the
> English page when it exists, and each skeleton links back to the original.

## What this book argues

For fifty years, software capability was manufactured **before release**: requirements, code, tests,
builds, versions. When the shop floor produced a rule nobody had anticipated, the only path was a new
development cycle. Large language models break that assumption for the first time — part of a system's
capability is now shaped **while it is being used**.

> Users used to consume programs. Soon, while using a program, users keep **compiling** it — compiling
> meaning that an open intent at runtime is turned into a verifiable, versioned, reversible,
> deterministic software capability, not that arbitrary code gets executed online.

The book builds the architecture for that claim in five parts:

| Part | Theme | Chapters |
| :--- | :--- | :--- |
| [One](part-1.md) | The paradigm shift — from Software 1.0 to LLM as Runtime | [1](chapter-01.md)–[4](chapter-04.md) |
| [Two](part-2.md) | The semantic substrate — formal domain models and OSPF | [5](chapter-05.md)–[8](chapter-08.md) |
| [Three](part-3.md) | Engineering pillars and the world model — event sourcing, digital twin | [9](chapter-09.md)–[12](chapter-12.md) |
| [Four](part-4.md) | Three natives in concert — OR × ML × Agent, and the semantic IR | [13](chapter-13.md)–[15](chapter-15.md) |
| [Five](part-5.md) | Runtime evolution — Semantic JIT, SPLE, and the adaptive DOP in practice | [16](chapter-16.md)–[18](chapter-18.md) |

Full navigation: [SUMMARY.md](SUMMARY.md) · Outline: [outline.md](outline.md)

## Terminology

Term translation is a contract, not a preference. The bilingual glossary lives in
[i18n/glossary.md](../../i18n/glossary.md) and the CI gate rejects drift between the two editions.

## Contributing a translation

Start with [CONTRIBUTING.md](../../CONTRIBUTING.md) and [i18n/README.md](../../i18n/README.md):
pick a page, flip its `i18n-status` marker, keep the file name and navigation slot identical, and
re-draw the diagram labels when you translate a page with figures. `npm run i18n:check` verifies that
nothing was dropped along the way.

Licensed under [CC BY-SA 4.0](../../LICENSE.md).
