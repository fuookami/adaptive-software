# From Code to Intent — Building Software That Evolves

**Domain-Driven Design, OSPF optimization modeling and the LLM as Runtime architecture for the Software 3.0 era**

*by fuookami · English edition (complete) · [Chinese original](../zh/README.md)*

> **Translation status.** All thirty pages of the English edition are translated and kept in
> one-to-one parity with the Chinese original — same file names, same navigation slots, same diagram
> counts. `npm run i18n:check` re-verifies that parity on every commit. The Chinese edition remains the
> source of truth: when the two diverge, the Chinese text wins and the English page is corrected.
> Wording corrections to the translation are welcome; follow
> [i18n/glossary.md](../../i18n/glossary.md) so terminology stays fixed.

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
[i18n/glossary.md](../../i18n/glossary.md): terms listed there are fixed, and a change of rendering
needs a matching glossary change. CI enforces structural parity between the editions (page set,
navigation, diagram counts, subsection counts); terminology is held by review against that table.

## Reviewing the translation

Corrections are welcome. Start with [CONTRIBUTING.md](../../CONTRIBUTING.md) and
[i18n/README.md](../../i18n/README.md): keep the file name and navigation slot identical, do not
drop or merge sections. Diagrams are SVG assets referenced from the text; to change one, edit its HTML
source under `figures/en/` (labels and `aria-label` only, structure untouched) and run `npm run figures`. `npm run i18n:check` verifies that nothing was lost along the way; when
the English and the Chinese disagree, the Chinese wins.

Licensed under [CC BY-SA 4.0](../../LICENSE.md).
