# System design interview guide

A six-hour, self-contained guide to system design interviews, classic and LLM, for solo study on a phone or a laptop.

**Read it at [nanupnch.github.io/sysdes-prep](https://nanupnch.github.io/sysdes-prep/).**

- **Three Parts, each a complete loop:** Foundations (about 130 minutes), Going deeper (130) and Deep dives (100). Each Part frames the method, teaches the classic and the LLM building blocks, shows a design solved, has you do one yourself, then checks what stuck. Stop after any Part and you still have a complete method.
- **Self-testing throughout:** a pretest, a prediction before each module, 81 scored questions with checklist answers and spaced reviews, an error log, and two timed mocks with probe cards, rubrics and a readiness verdict. Appendix E adds 14 practice prompts and an optional third mock.
- **Evidence-based:** every figure is dated and sourced, and the way it teaches follows the learning-science and usability evidence listed in Appendix F and in [PLAN.md](PLAN.md).
- **Private:** your answers and progress stay in your browser. Save them to a file to move to another device.

## Build it yourself

You need Node 20 or later, Ruby for the content check, and Python 3 for the preview server.

```bash
npm ci
npm run build
npm run preview
```

Then open <http://localhost:8642>.

| Command | What it does |
|---|---|
| `npm run check:content` | Validates every question, review link and mock, and the coverage of the ★★★ topics |
| `npm run diagrams -- --all` | Re-renders the Mermaid diagrams (needs the headless browser that `npm ci` installs) |
| `npm run check:print` | Checks that the one-page summary prints on one page, at A4 and Letter |

## Edit it

All the text lives in [`content/`](content/) as Markdown and YAML; [content/README.md](content/README.md) explains the format. [`scripts/build.mjs`](scripts/build.mjs) turns it into the static site in `_site/`, and [`site/`](site/) holds the CSS and JavaScript. [PLAN.md](PLAN.md) is the design document: the evidence behind each decision, and the time and word budgets. Every push to `main` is built and deployed by GitHub Actions.

## Credits and licence

Built on [The System Design Primer](https://github.com/donnemartin/system-design-primer) by Donne Martin and contributors, and [The AI System Design Primer](https://github.com/daneb/ai-system-design-primer) by daneb and contributors, both licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Their text was condensed, rewritten and extended; Appendix F lists what changed and the full references.

This repository is licensed under [CC BY 4.0](LICENSE). If you reuse it, credit this guide and both primers.
