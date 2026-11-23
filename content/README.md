# Content sources

Everything the site shows is built from the files in this folder. Each fact lives in one place.

| Path | Holds |
|---|---|
| `outline.yaml` | Parts → modules → blocks, with planned minutes, word budgets, loop stages, tiers and root facts. Review links point here |
| `parts/start.md` | Start here (module 1.1), the site's front page |
| `parts/part-N.md` | Teaching text for Part N. The build splits it into one page per module at each `## x.y Title {#x.y}` heading, which must match the outline |
| `parts/summary.md` | The one-page summary |
| `parts/appendix-d.md`, `-e.md`, `-f.md` | Appendices D (name decoder), E (practice prompts and Mock C) and F (sources and licence). B and C, the glossary and numbers, are built from their YAML files |
| `items/pretest.yaml`, `items/part-N.yaml` | Every question: the pretest, then each Part's predicts, checks, drills, guided and faded steps, and cruxes |
| `mocks/mock-*.yaml` | Mock interviews: prompt, clarifications, timed probes, rubric and model outline. Mocks A and B belong to modules 2.8 and 3.6; Mock C, optional, to Appendix E |
| `practice.yaml` | Appendix E's practice prompts: id (`E1`…), group (`classic` or `llm`), prompt, assumptions, crux and review links |
| `numbers.yaml` | Every figure the guide uses, with tier, date and source |
| `glossary.yaml` | Every term the guide defines, with `aliases` for other forms. Where each first appears is found from the text; `in` names the module for a term taught in other words. A term used nowhere fails the build |

A module with no heading yet is built as a "being rewritten" page with its planned topics, so navigation, landing pages and times are complete from the start. Unwritten modules count at their planned minutes.

## A module, in Markdown

```md
## 2.3 Async work and partitioning, in depth {#2.3}

::: inshort
One sentence stating the module's point. Every module needs one.
:::

::: refresher 1.6#queues
Two lines recalling what an earlier Part taught. Collapsed; Parts 2 and 3 only.
:::

{{predict 2.3-p1}}

### Queue, pub/sub or log ★★★ {#queue-pubsub-log}

…text, {{fig queue-vs-log}}, tables, ::: signal …

::: deeper 2.3#delivery-idempotency
One line pointing forward. Part 1 only.
:::

{{check 2.3}}
```

Blocks are `###` headings with tier stars and the slug from the outline; on the page they become the module's second-level headings. Callouts: `inshort`, `predict`, `signal`, `myth`, `pitfall`, `numbers`, `think`, `refresher` and `deeper` (the last two take a review link). Shortcodes: `{{predict id}}`, `{{check module}}`, `{{item id}}`, `{{crux id}}`, `{{fig id}}`, `{{mock id}}`, and on Start here only, `{{pretest}}` and `{{parts}}`. Inline: `{{num id}}` for a figure, `[[term]]` or `[[term|shown text]]` for a glossary tooltip, `{{ref 2.3#slug}}` for a short link to a module or block (shown as “2.3”), and `{{appendix E}}` for a link to an appendix page.

## An appendix page

An appendix is a Markdown file whose front matter names it, so the build gives it a page and a place in the contents rail:

```md
---
page: appendix
id: "E"
slug: practice          # the page's address: /practice/
nav: "Practice prompts and Mock C"   # its name in the rail and the top bar
intro: "One line under the title."
---
```

Its title comes from `outline.yaml`'s `appendices` list. Appendix pages sit outside the six hours: they have no time, no In short line and no check. They may use `{{mock id}}` (a mock placed there is validated and listed on the Progress page as optional) and `{{practice classic}}` or `{{practice llm}}`, which renders that group of `practice.yaml`.

## Review links

A review link names a module, or a block inside it: `2.3#consistent-hashing`, or just `1.6`. Every link must resolve against `outline.yaml`. A link into a module not yet written goes to its "being rewritten" page.

## Question fields

| Field | Used by | Meaning |
|---|---|---|
| `id` | all | Unique. Pattern: `<module>-<kind><n>`: `2.3-p1` (predict), `2.3-c2` (check), `1.5-d1` (drill), `1.10-g1` (guided step), `2.7-f1` (faded step), `1.6-s1` (self-explanation), `3.5-k1` (crux); pretest questions are `pre-NN` |
| `type` | all | `predict`, `recall`, `explain`, `decide`, `estimate`, `draw`, `faded`, `guided`, `crux` or `choice` |
| `prompt` | all | The question as the reader sees it |
| `idea_units` | scored questions | 2–5 points, each ticked or not. These are the answer |
| `misconception` | scored questions | The most common wrong answer, and why it's wrong |
| `review` | scored questions | The one block to re-read after a miss |
| `also` | optional | Other blocks the question exercises (counted for coverage) |
| `spaced` | optional | `true` when the question revisits an earlier module |
| `objective` | scored questions | Which learning objective (1–9 in PLAN.md §1) it serves |
| `answer` | predict, crux, choice | The short reveal (for `choice`, the index of the correct option, from 0) |
| `choices`, `why`, `area` | choice (pretest) | Options, a one-line explanation, and the score group: `numbers`, `classic` or `llm` |
| `scaffold` | drills | The steps with blanks, shown before the answer |

## Where questions appear

- **Check questions** (`-c`) form the check at the end of the module named by their id. A check has 2–4 questions, and its last one revisits an earlier module (`spaced: true`).
- **Predict questions** (`-p`) open their module; the check shows your guess again with the answer.
- **Drills, self-explanations, guided and faded steps** appear where the text places them with `{{item id}}`.
- **Crux questions** sit above their pattern card.

## Mock fields

`prompt`, `clarifications` (question and answer pairs, revealed after you write your own questions), `probes` (each with the `at` minute it unlocks and the idea units of a strong answer), `rubric` (lines scored 0, 1 or 2, each with a review link) and `model_outline` (Markdown). The scoring scale is the same for every line: **2** = done unprompted, with a reason; **1** = partly, or only after a probe; **0** = missing.

## Writing YAML safely

Quote every text value with double quotes, and use typographic quotes (“ ” ‘ ’) inside them. Use `|` blocks for multi-line Markdown. Validate from the repo root with:

```sh
npm run check:content
```

It parses every file, resolves every review link, checks question fields and each written module's predict and check, and lists the ★★★ blocks in written modules that are not yet tested twice, once outside their own module.
