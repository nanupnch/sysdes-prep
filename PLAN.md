# System Design Interview Guide: Build Plan

> **Status:** approved 2026-11-23, with one addition: **design for mobile first, then make it responsive.** The 8-hour version, in ten Parts, is archived locally (`archive/`, not published). This plan rebuilds it as **three Parts in 6 hours, each a complete loop**, with UX principles applied to the text and the site. The data restructure and the UX tracer bullet (§16, steps 3–4) are built and approved, **Part 1 is written** (129 of 130 minutes, 32 scored questions) and approved, and **Part 2 is written** (130 minutes, 29 scored questions and Mock A) and approved, and **All 27 modules are written** (359 minutes, 81 scored questions, every ★★★ block tested twice), and so are **appendices D–F**, outside the 6 hours: the name decoder (64 rows of product names, each linked to the module that teaches its block), 14 practice prompts with the optional Mock C (enterprise RAG assistant, 22 rubric lines), and sources, licence and changes. A final review then fixed a handful of slips (the Q&A estimate in 1.5, the two-day schedule, a stale message after a failed check), added stream processing to 3.2's toolbox, and trimmed the glossary to the 261 terms the guide uses. Awaiting your review. Next: release, which creates the repository and the Pages deployment only with your go-ahead.
> **Revised:** 2026-11-23, from your brief: 6 hours; Part 1 for beginners, Part 2 a layer deeper, Part 3 the most depth; each Part a complete loop; UX principles throughout.
> **Sources:**
> - [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (classic)
> - [daneb/ai-system-design-primer](https://github.com/daneb/ai-system-design-primer) (LLM systems)
>
> Both were surveyed on 2026-11-22.

## Decisions

| Question | Decision |
|---|---|
| Total time | **6 hours** (360 minutes), practice and mocks included. *New* |
| Structure | **Three Parts, each a complete loop:** Part 1, Foundations (for beginners); Part 2, Going deeper; Part 3, Deep dives. You can stop after any Part having practised the whole method. *New* |
| Interview mix | Balanced: about 55% classic and 45% AI |
| AI scope | LLM systems only. No classic ML system design, such as recommendation, ranking, feature stores or training pipelines |
| Target level | Senior. Part 2 reaches the bar; Part 3 adds the depth that follow-up questions probe. *Revised* |
| Format | A static website in HTML, CSS and plain JavaScript on GitHub Pages, redesigned with the UX principles of §3. *Revised* |
| Device priority | **Mobile first:** every page is designed for a phone, then enhanced for tablets and desktops. *New* |
| Practice designs | Part 1 ends with a guided design; Mock A (notification service, classic) closes Part 2; Mock B (meeting assistant, AI) closes Part 3. *Revised* |
| Product names | Generic component first, then one or two examples in brackets, plus a decoder appendix |

**Defaults for you to confirm or change:**

1. **The split:** Part 1 takes 130 minutes, Part 2 130, and Part 3 100.
2. **Practice per Part:** a guided design in Part 1 (about 20 minutes), and a full timed mock in each of Parts 2 and 3 (40 minutes each).
3. **One page per module,** each 5–15 minutes long, instead of one long page per Part.
4. **About 80 scored questions instead of 144:** 2–4 per module, plus a mixed check at the end of each Part.

## TL;DR

1. **Six hours, three Parts, one loop.** Every Part runs the same stages: orient, frame the method, learn the classic blocks, learn the LLM blocks, see a design solved, do one yourself, then check and recap. Part 1 teaches the loop to beginners, Part 2 runs it at the depth interviewers probe, and Part 3 adds the deepest mechanisms.
2. **Each Part stands on its own.** Stop after Part 1 with a complete, simple method; after Part 2 at the senior bar; after Part 3 with answers to the hardest follow-ups.
3. **A spiral, not a list.** Each topic appears first in plain words, then with trade-offs and numbers, then at full depth. Later Parts link back to earlier explanations instead of repeating them.
4. **About 19,000 words of core reading,** down from 29,000, and about half the time is practice. The cuts come from overlap, from ★ material shrunk to one-line entries, and from fewer, sharper questions.
5. **Designs fade across the Parts:** worked in Part 1 (URL shortener, help-centre Q&A), faded in Part 2 (news feed, support agent), and independent in the two mocks, plus twelve pattern cards in Part 3.
6. **The site is redesigned for use, not just reading:** one page per module with a single "Next" action, a one-line takeaway at the top of each module, a progress rail with the time left, collapsed refreshers instead of repetition, large touch targets, and progress you can export.
7. **Unchanged:** the seven root facts, RESHAPE, the self-testing loop (attempt, rate your confidence, reveal, tick), the numbers policy, the one-page summary, and the evidence behind them.

---

## 1. Goal, constraints and what "ready" means

| Constraint | What it means for the guide |
|---|---|
| Zero prior knowledge | Part 1 assumes nothing: terms are defined where they first appear, a request's journey comes first, and glossary tooltips cover later uses |
| Senior bar in 6 hours | Part 1 builds the foundation fast. Part 2 spends its time on trade-offs, failure handling, operations and cost. Part 3 covers what follow-up questions probe |
| Stop anywhere | Each Part is a complete loop, with its own design to do, its own check and its own recap |
| Self-contained | Short explanations replace the sources' 350+ links. The site makes no external requests |
| About 6 hours, split freely | Every Part and module shows its time. Triage rules cover running behind |
| No tutor | Answers broken into checkable points, confidence ratings, an error log, routing, and mock probe cards with rubrics |
| Interview is days away | High-yield material first. The procedure is practised until fluent. One Part a day is the best schedule |
| Ends with one page | The summary is a recall checklist, not a re-read. Each Part also ends with a short recap card |

### Learning objectives

Given an unseen prompt, alone, in 35 minutes, the reader can:

1. **Drive the session with RESHAPE** and reach a working end-to-end design by about minute 16.
2. **Scope the problem.** Name the 2–3 requirements that drive the design, at least 4 non-functional requirements, and explicit non-goals. For AI, set a measurable quality bar.
3. **Estimate the system.** Load, storage and bandwidth (for AI: tokens, cost and latency) within an order of magnitude. Then use the numbers to make a decision.
4. **Draw the design** in the standard component vocabulary, and climb the scaling or complexity ladder only as far as the numbers demand.
5. **Go two levels deep on any ★★★ block:** its mechanism, its failure modes, at least 2 alternatives, and when each wins.
6. **Raise problems before being asked:** bottlenecks, failure modes, hot spots and abuse, with fixes and a plan for degrading gracefully.
7. **Cover operations:** how the system is monitored, deployed, migrated and paid for. Monitoring is framed with SLOs (service-level objectives).
8. **Handle AI designs:** choose between prompting, RAG and fine-tuning; justify the rung on the complexity ladder; design evals and a release gate; break the lethal trifecta; plan model upgrades and fallbacks.
9. **State at least 3 trade-offs,** each tied to a requirement.

How far each Part takes each objective:

| Objective | After Part 1 | After Part 2 | After Part 3 |
|---|---|---|---|
| 1 · RESHAPE | Walks all seven steps, with prompts | Unprompted, on time, a design by minute 16 | Adapts when the interviewer redirects |
| 2 · Scope | Lists requirements and non-goals | Names the drivers; sets an LLM quality bar | — |
| 3 · Estimate | Requests, storage and tokens, from a template | Uses the numbers to decide | GPU memory and capacity |
| 4 · Draw | A simple design from standard parts | Climbs only as far as the numbers demand | — |
| 5 · Depth | What each block is for | Mechanism, failure modes and alternatives for every ★★★ block | Consistency, coordination and serving internals |
| 6 · Raise problems | Single points of failure | Failures, hot spots, abuse and degradation, unprompted | Metastable failures, cells, live migrations |
| 7 · Operations | That monitoring and SLOs exist | SLOs, cost and rollouts | Schema changes, incident patterns, governance |
| 8 · AI designs | Prompt or RAG; single call or agent; why evals | Rung choice, evals and gates, the trifecta | Eval statistics, serving capacity, model lifecycle |
| 9 · Trade-offs | One per decision | Three, each tied to a requirement | — |

**Not goals:** classic ML system design, coding rounds, low-level (object-oriented) design, and staff-level strategy. Six hours cannot create senior experience. What they can do is get a capable engineer to reason and talk at the senior bar in the room: structured, quantitative, alert to failure and explicit about trade-offs.

---

## 2. Principles: from evidence to design decisions

| # | Principle | Evidence | What the guide does |
|---|---|---|---|
| 1 | Retrieval beats re-reading, and feedback strengthens it | Testing effect (Roediger & Karpicke 2006; Karpicke & Roediger 2008). Rated "high utility" by Dunlosky et al. 2013. Feedback after a test boosts the gain (Butler & Roediger 2008) | About 80 scored questions plus prediction prompts, each answer revealed right after the attempt. Only flagged sections are meant to be re-read |
| 2 | Spacing beats cramming | Cepeda et al. 2006 meta-analysis. For a test a week away, the best gap between sessions is about 20–40% of that week (Cepeda et al. 2008) | Multi-day schedules, best as one Part a day. Each module's last question and each Part's mixed check come from earlier material. Each study day starts with a warm-up |
| 3 | Sleep consolidates new memories | Rasch & Born 2013 | At least one night between study days when possible. Never trade the last night's sleep for study |
| 4 | Novices learn a procedure from worked examples, then from less and less help | Worked-example effect (Sweller & Cooper 1985). Fading (Renkl & Atkinson 2003). Expertise reversal (Kalyuga et al. 2003) | Worked designs in Part 1, faded designs in Part 2, and unseen mocks in Parts 2 and 3. The pretest lets experienced readers start at Part 2 |
| 5 | Practise whole tasks early, simple before complex | 4C/ID (van Merriënboer). Spiral curriculum (Bruner 1960) | **This shapes the whole guide.** Each Part is a task class of whole designs, with help fading from Part to Part, and each topic returns in the next Part at greater depth. The first complete design comes about 75 minutes in |
| 6 | Try before being told | Pretesting effect (Richland, Kornell & Kao 2009). Failed attempts still help (Kornell, Hays & Bjork 2009). "A time for telling" (Schwartz & Bransford 1998) | "Predict first" prompts open every module. Every block opens with its bottleneck |
| 7 | Mix up choices that look alike | Rohrer & Taylor 2007. Kornell & Bjork 2008. The benefit is biggest when categories are similar (Brunmair & Richter 2019) | Decision items mix look-alikes, such as cache vs replica, queue vs log, and RAG vs fine-tuning. The final test mixes classic and AI |
| 8 | Practise the way you will be tested | Transfer-appropriate processing (Morris, Bransford & Franks 1977) | Mocks are timed, spoken aloud and drawn by hand, with probe cards. Diagrams look like what you would draw on a whiteboard |
| 9 | Grading yourself needs explicit standards | Learners overrate their own answers (Rawson & Dunlosky 2007). Standards made of idea units (the separate points a full answer must contain) improve accuracy (Dunlosky et al. 2011) | Every answer is a checklist of 2–5 idea units, each ticked or not. Mocks are scored on behaviours you can observe |
| 10 | Confidence ratings expose blind spots | Errors made with high confidence are corrected most readily after feedback (Butterfield & Metcalfe 2001). Judgments made after a delay are more accurate (Nelson & Dunlosky 1991) | The site asks for confidence before it reveals an answer. The error log lists confident misses first. The mock score decides readiness |
| 11 | Practised recall survives stress | Smith, Floerke & Thomas 2016 | The framework and core numbers are drilled until fluent |
| 12 | Working memory holds about 4 chunks | Cowan 2001. Cognitive load theory (Sweller 1988) | One module per page, 5–15 minutes long, and one idea per paragraph. Diagrams have at most 12 nodes in 5 groups, and 8 in Part 1. One fixed template |
| 13 | Words and pictures together, nothing extra | Dual coding (Paivio 1986). Mayer's principles of coherence, signalling, spatial contiguity, segmenting and pre-training (Mayer 2020) | Diagrams only for structure and flow. Labels sit on the picture. No decoration. Part 1 teaches the components' names and jobs before Part 2 combines them (the pre-training principle) |
| 14 | Stories are remembered | Willingham 2004 | Classic blocks are told as a growth story. LLM blocks follow the complexity ladder |
| 15 | Transfer needs principles drawn out across cases | Comparing cases and naming the shared principle improves transfer (Gick & Holyoak 1983; Gentner, Loewenstein & Thompson 2003) | Seven root facts. Every block names its fact. Designs end with "what this shares with an earlier design" |
| 16 | Start from the assessment | Backward design (Wiggins & McTighe 1998). Constructive alignment (Biggs 1996) | Objectives, mocks, rubrics, checkpoints and the summary are written before the teaching text |

### Popular ideas we deliberately leave out

| Popular idea | Why it is not used |
|---|---|
| Matching "learning styles" (visual, auditory and so on) | There's no good evidence that matching instruction to a style helps (Pashler et al. 2008). We pick the form by the shape of the content, for every reader |
| Re-reading and highlighting | Rated low utility (Dunlosky et al. 2013). Familiar text feels learned, but the feeling fades |
| The "learning pyramid" (10% of what you read, 90% of what you teach) | No study supports these figures (Letrud 2012) |
| "Attention lasts 10 minutes" | The evidence is weak (Bradbury 2016). Modules run 5–15 minutes because of their content, and breaks fall at checks |
| Discovery-first learning for beginners | Minimal guidance does worse for novices (Kirschner, Sweller & Clark 2006). Productive failure (Kapur) relies on a facilitator, which our reader doesn't have. We use short prediction prompts instead |
| Pomodoro's exact 25 minutes | Nothing supports that particular number. Breaks themselves do help sustained attention (Ariga & Lleras 2011) |
| Cramming through the night | It costs recall and the consolidation that happens during sleep. The schedules build sleep in |
| Points, badges and streaks | The evidence is mixed, and they reward activity rather than accuracy. The site shows calibrated scores and a readiness verdict instead |

### The engineering first principles under the content

**The seven root facts** are the backbone. Each building block names the fact that forces it to exist.

1. **A machine is finite.** CPU, memory, disk and network all hit a ceiling, so you scale up first, then out.
2. **Distance and storage media cost time.** Memory takes about 100 ns and an SSD about 100 µs. A round trip inside a data centre takes about 0.5 ms; between continents it takes 100–150 ms. This is why caches, CDNs, data locality and batching exist.
3. **Parts fail independently, and the network can split.** This is why redundancy, timeouts, retries, idempotency and failover exist.
4. **Agreement costs round trips.** Copies stay identical only if they wait for each other. This is the root of the trade-off between consistency and latency or availability.
5. **Queues build up as a server nears full utilisation.** Waiting time grows roughly as 1 ÷ (1 − utilisation). This is why you keep headroom and use back-pressure, load shedding and async work.
6. **Models are probabilistic, priced per token, and produce output one token at a time.** This is why LLM systems need evals, token budgets, streaming, batching and caching.
7. **Inputs can be hostile, and models cannot reliably tell instructions from data.** Every boundary needs authentication, authorisation and validation. For LLM systems, security comes from the architecture, by removing a leg of the lethal trifecta, not from filters alone.

| Law or idea | Origin | How the guide uses it |
|---|---|---|
| Gall's law: a complex system that works evolved from a simple system that worked | Gall, *Systemantics*, 1975 | Start with the simplest design that works, then climb a ladder |
| Premature optimisation | Knuth, 1974 | Estimate first, then fix the bottleneck you measured |
| Little's law: items in a system = arrival rate × time in the system | Little, 1961 | Derive concurrency, connection counts and GPU counts from throughput × latency |
| Amdahl's law | Amdahl, 1967 | The serial part caps the speed-up, as with token-by-token decoding |
| Conway's law | Conway, 1968 | Microservices mirror teams. They scale organisations more than traffic |
| Fallacies of distributed computing | Deutsch and colleagues at Sun, 1994–97 | Every remote call can fail, stall or arrive twice |
| End-to-end argument | Saltzer, Reed & Clark, 1984 | Guarantees such as de-duplication belong at the endpoints |
| CAP, refined by PACELC | Brewer 2000; Gilbert & Lynch 2002; Abadi 2012 | During a network partition, choose consistency or availability. The rest of the time, choose latency or consistency |
| The tail at scale | Dean & Barroso, 2013 | The slowest 1% of requests (p99) matters. Fanning out to many servers makes rare slowness common |
| Metastable failures | Bronson et al., 2021 | Retry storms can keep a system down after the original trigger has gone |
| Premortem | Klein, 2007 | The Pressure-test step asks: "It failed in production. Why?" |

Some older ideas shape how the guide teaches, beyond what it teaches:

- **Polya's *How to Solve It*** (1945): understand, plan, carry out, look back. Every interview framework descends from it, including ours.
- **Shu-ha-ri**, from Japanese martial arts: follow the form, then bend it, then leave it. Follow RESHAPE exactly in practice, then adapt to the interviewer in the room.
- **Socratic questioning:** the "why?" prompts and the probe cards stand in for the missing interviewer.
- **Base-rate reasoning:** it explains why guardrails raise false alarms at volume.
- **Systems thinking about feedback loops:** it explains retry storms and autoscaling swings.

---

## 3. UX principles: from evidence to interface decisions

The guide is used alone, on a screen, often on a phone, for six hours. How easily readers find their way decides how much of that time goes to learning. Each principle below has a source and a concrete decision, in the same form as §2.

| # | Principle | Evidence | What the guide does |
|---|---|---|---|
| 1 | Show where the user is and what's left | Visibility of system status, the first of Nielsen's 10 usability heuristics (1994) | Every page shows a breadcrumb (Part › module), the module's time, its position ("4 of 9") and the minutes left in the Part. The sidebar is a progress rail: done, current, next |
| 2 | Progress near the goal raises effort | Goal-gradient effect (Hull 1932; Kivetz, Urminsky & Zheng 2006) | Part landing pages and the progress rail fill as modules are completed; the time left counts down |
| 3 | Recognition over recall | Nielsen's heuristic 6 | Parts 2 and 3 open each topic with a collapsed **refresher** (two lines and a link back) instead of making you recall Part 1 or re-reading it. Glossary tooltips stay. Design pages show which RESHAPE step you're in |
| 4 | Reveal complexity only when it's needed | Progressive disclosure (Nielsen 2006); the expertise-reversal effect (Kalyuga et al. 2003) | Part 1 points to depth ("Go deeper in 2.3") instead of including it. Answers stay hidden until you've attempted them. One-line ★ entries replace long ★ sections |
| 5 | Fewer choices, faster decisions | Hick–Hyman law (Hick 1952; Hyman 1953) | One primary action per screen: **Next** at the end of each module, **Start** or **Continue** on each landing page. Start here asks one question: where should I begin? |
| 6 | Consistent patterns are learned once | Consistency and standards (Nielsen's heuristic 4); Jakob's law (Nielsen 2000) | The same module template in every Part, the same loop in every Part, and familiar web conventions: sticky header, breadcrumb, previous and next |
| 7 | Readers scan before they read | Eye-tracking of web reading (Nielsen 2006; Pernice 2017); the bottom line up front | Every module opens with an **In short** sentence stating its point. Headings state the point where they can. Bullets start with a bold lead |
| 8 | Signal what matters, and never by colour alone | Mayer's signalling principle (2020); WCAG 2.2, success criterion 1.4.1 | Callouts carry an icon, a label and a colour. Each Part has an accent colour that's also named in text |
| 9 | Small, self-contained chunks | Working memory holds about 4 chunks (Cowan 2001); Mayer's segmenting principle | One page per module, 5–15 minutes each. At most 7 bullets, and tables of at most 8 rows |
| 10 | Big, close targets are faster and safer | Fitts's law (1954); WCAG 2.2 target size (2.5.8); platform guidance of 44–48 px | Buttons and tick boxes are at least 44 px tall on touch screens; confidence buttons span the width on phones; Next sits where the thumb reaches |
| 11 | Prevent errors, and make recovery easy | Nielsen's heuristics 5 and 9 | Answers save as you type. Resetting progress asks for confirmation. Progress can be exported and imported, so a cleared browser or a new device loses nothing |
| 12 | Less noise, more signal | Aesthetic and minimalist design (Nielsen's heuristic 8); the coherence principle (Mayer 2020) | No decoration. Fewer callout types in Part 1. A focus mode hides the sidebar |
| 13 | Polish buys patience | Aesthetic–usability effect (Kurosu & Kashimura 1995) | One typographic scale, generous spacing, restrained colour, and diagrams in one visual language |
| 14 | Endings shape the memory of the whole | Peak–end rule (Kahneman et al. 1993) | Each Part ends with a recap card and a plain statement of what you can now do, not with a wall of questions |
| 15 | Usable by everyone | WCAG 2.2, level AA (2023) | Text contrast of at least 4.5:1, visible focus, full keyboard use, landmarks and a skip link, alt text on every diagram, reduced motion respected |
| 16 | Comfortable reading | Typographic practice for line length and size (Bringhurst 1992); evidence on line length is mixed (Dyson 2004) | 17–18 px body text, about 70 characters per line, 1.55 line height, system fonts |
| 17 | Design for the phone first, then enhance | Mobile first (Wroblewski 2011); progressive enhancement; how people hold phones, often one-handed (Hoober 2013) | Base styles are written for a 320–430 px screen; wider screens add layout, never content. Primary actions sit low on the screen, in the thumb's reach |

### Popular UX ideas we leave out

| Idea | Why it is not used |
|---|---|
| The three-click rule | No evidence that users give up after three clicks; clear labels matter more than click counts (Porter 2003) |
| "Users don't scroll" | They do; content above the fold gets more attention, so the In short line goes first, but long modules aren't a problem in themselves (Nielsen Norman Group, 2010 and 2018) |
| Gamification: points, badges, streaks | The evidence is mixed, and they reward activity rather than accuracy (unchanged from §2) |
| The Zeigarnik effect (unfinished tasks are remembered better) | Replications are inconsistent; progress is shown because it orients you, not to exploit an itch |

### What changes on the site

- **Start here** asks one question, where to begin, and answers it with the pretest: start at Part 1, or skip to Part 2. Once you've started, it offers **Continue where you left off**.
- **Each Part has a landing page:** what you'll be able to do, its time, the loop drawn as a strip with each module's status, and one Start or Continue button.
- **Each module has its own page:** breadcrumb, title, In short line, time and position, content, its check, then one **Next** button and a quieter Previous link.
- **The sidebar becomes a progress rail;** on phones it's a drawer, with a sticky bar showing the Part and the minutes left.
- **Refreshers** (collapsed) open modules in Parts 2 and 3; **Go deeper** pointers close Part 1's topics.
- **Focus mode** hides the navigation; **export and import** move your progress between devices.
- **The complete-guide page stays,** for Ctrl+F and printing.
- **On phones:** a slim sticky top bar (menu, where you are, a progress line); the progress rail as a slide-in drawer; a full-width Next button at the end of each module; tables that reflow into labelled cards; diagrams that open full screen for pinch-zoom; answer boxes at 16 px, so the phone doesn't zoom in when you type; safe-area padding around the notch.
- **On wider screens:** the progress rail becomes a permanent sidebar from about 900 px, and the reading column stays at about 70 characters.

---

## 4. What we take from each source

| Source | Measured on 2026-11-22 | Character |
|---|---|---|
| Classic primer (donnemartin) | README about 12k words, with around 350 links. The 8 solved designs add about 15k | Covers a lot, briefly, and leaves depth to the links. Largely unchanged since about 2020 |
| AI primer (daneb) | Parts 0–4 about 47.6k words. Appendix 15.5k, deep dives 34.7k, labs 15.3k | Current (last verified Nov 2026), organised around trade-offs, and sourced. It assumes you know the classic primer |

Together the core material is about 75k words against our budget of about 19k. So we condense by roughly 4 to 1, while adding what neither source covers. The spiral helps: Part 1 needs only plain explanations, and Parts 2 and 3 never repeat them. Three further moves make it possible:

- merge the overlaps, since both cover the method, caching, async work, security and numbers;
- replace links with short explanations;
- push detail down a tier or into the appendix.

Causal explanation is never what gets cut.

### From the classic primer

- **Keep:**
  - its order: method, then solved designs, then topics, then numbers;
  - the three trade-off chapters (performance vs scalability, latency vs throughput, CAP);
  - the order of topics along a request's path;
  - its "Disadvantage(s)" habit, renamed "Trade-offs and failure modes";
  - the powers-of-two table, the latency numbers and the availability nines, including the maths for components in series and in parallel;
  - its solved-design template: a simple diagram first, then a scaled one.
- **Refine:**
  - The four-step method becomes RESHAPE.
  - CAP becomes CAP plus PACELC.
  - "SQL or NoSQL" becomes a choice driven by access patterns.
  - Pastebin/Bit.ly becomes the URL shortener, worked in Part 1, and Pastebin returns as Part 1's guided design.
  - The Twitter timeline becomes the news feed, faded.
  - "Scaling to millions of users on AWS" becomes the vendor-neutral scaling ladder, the spine of the classic modules in every Part.
  - The web crawler, social graph, sales ranking and query cache become pattern cards.
- **Add.** These are missing or thin, and include the primer's own unwritten "Under development" list.
  - **Scaling and data:** consistent hashing, unique IDs, quorums, logs and streams, data modelling by access pattern, and hot keys.
  - **Consistency and coordination:** consensus and leader election with leases and fencing tokens, and distributed transactions (two-phase commit vs sagas, the outbox).
  - **Reliability:** rate limiting, idempotency and delivery guarantees, overload and metastable failures, blast radius and cells, multi-region and disaster recovery, Little's law and queueing, and tail latency.
  - **Interfaces and specialised storage:** real-time push (polling, SSE, WebSockets), object storage, search and geospatial indexes, probabilistic data structures, and API design (pagination, idempotency keys, versioning).
  - **Running and changing systems (senior):** evolving a live system (schema migrations, backfills, and why dual writes drift), capacity planning and cost, observability and SLOs, current security basics, and rollouts.
  - **Modern prompts:** chat, ride-hailing, video, file sync, ticketing and typeahead.
- **Cut:**
  - external links and reading lists;
  - the object-oriented design questions, which belong to a different interview;
  - the scalability lecture pointers;
  - the lists of company architectures and engineering blogs;
  - the Mint.com specifics and the MapReduce code;
  - the material on Anki, contributing and translations.

### From the AI primer

- **Keep:**
  - **Part 0:** tokens, prefill and decode, the KV cache, and tool calling.
  - **Method:** its two changes to the classic method, now RESHAPE's AI add-ons: the quality bar comes first, and hardening is a step of its own. Also the complexity ladder, and token-based estimation with its worked example.
  - **Trade-offs:** the seven trade-offs, recast as decision tables.
  - **Components,** condensed. For the senior bar this includes 3.7's versioning and model retirement, 3.1's quotas and chargeback, and 3.16's tracing and online evals.
  - **Designs:** a simple help-centre Q&A (worked, Part 1), the support agent (faded, Part 2) and enterprise RAG (an optional third mock). The 4.8 practice list feeds the pattern cards and the appendix.
  - **Numbers** as dated ratios, and lab findings as numeric examples.
  - **Flashcards,** as raw material for the checkpoints.
- **Merge:**
  - 2.6 with 3.18: prompting vs RAG vs fine-tuning, plus model adaptation;
  - 2.3 with 3.3 and 3.5: context vs retrieval;
  - 2.7 with 3.8: throughput vs latency, plus serving internals;
  - 2.4 with 3.2, 3.12 and 3.17: capability vs security, guardrails and security;
  - 2.2 with 2.5, 3.9 and 3.10: autonomy, multi-agent setups, workflows and protocols;
  - 3.13 and 3.14 into the classic caching and async modules, keeping only what differs for LLMs.
- **Add:**
  - **For zero-knowledge readers:** what a model is, training vs inference, and embeddings and vector similarity, all from scratch; plus one paragraph on why decoding is limited by memory bandwidth.
  - **For the senior bar:** multi-tenancy, incident patterns (a provider outage, runaway cost, a bad prompt release) and data governance (PII, retention, residency, audit evidence).
  - **Bridges to classic blocks:**
    - a gateway is a reverse proxy with token quotas;
    - a semantic cache is a cache with fuzzy keys;
    - a batch API is an async queue.
- **Cut:**
  - provider surveys and the cloud mapping;
  - the governance crosswalk, reduced to one paragraph on the evidence you would keep: eval results, traces, approvals, and model and prompt versions;
  - the pattern crosswalk, reduced to a small table of synonyms;
  - the maturity tags and review dates, replaced by one "as of Nov 2026" stamp plus marks on figures that change fast;
  - lab code, and deep-dive detail beyond the ★ tier.

**Product names (decided).** The guide teaches the generic component first, then gives common examples in brackets, such as "a distributed log (e.g., Kafka)". A decoder appendix lists the names. This departs from the AI primer's vendor-neutral prose, because interviewers use product names as shorthand.

---

## 5. Structure and length

### The loop every Part runs

Each Part is a complete pass through the same stages, so you can stop after any of them having practised the whole method. In 4C/ID terms each Part is a *task class*: whole tasks, with help that fades from Part to Part.

| Stage | Job | Part 1 · Foundations | Part 2 · Going deeper | Part 3 · Deep dives |
|---|---|---|---|---|
| Orient | Know the goal, the time and where to start | 1.1: start here and the pretest | The Part's landing page | The Part's landing page |
| Frame | The method, at this depth | 1.2: the interview and RESHAPE | 2.1: what seniors do differently | 3.7: adapting in the room |
| Learn: classic | The building blocks | 1.3–1.6: a request's journey, root facts, estimation, the scaling ladder | 2.2–2.4: data, async work, partitioning, APIs, regions, reliability, operations | 3.1–3.2: consistency, coordination, live changes, specialist stores |
| Learn: LLM | The LLM blocks | 1.7: the complexity ladder, in plain words | 2.5–2.6: calls, retrieval, agents, serving, evals, safety | 3.3–3.4: serving internals, agents at scale, eval statistics, operations |
| See | A design solved | 1.8–1.9: two worked designs | 2.7: two faded designs | 3.5: twelve pattern cards |
| Do | A design yourself | 1.10: a guided design | 2.8: Mock A, classic, timed | 3.6: Mock B, LLM, timed |
| Check and recap | Retrieval, then a summary | 1.11: a mixed check and a recap card | 2.9: a mixed check and a recap card | 3.7: the final check, interview day, the one-page summary |

### Time and length budget

| Part | Minutes | Reading and diagrams | Practice | Core words | Diagrams | Scored questions |
|---|---:|---:|---:|---:|---:|---|
| 1 · Foundations | 130 | 79 | 51 | 8,850 | 11 | 32, plus the 15-question pretest |
| 2 · Going deeper | 130 | 53 | 77 | 5,800 | 9 | 29, plus Mock A |
| 3 · Deep dives | 100 | 36 | 64 | 4,400 | 3 | 19 and 12 crux guesses, plus Mock B |
| **Total** | **360** | **168 (47%)** | **192 (53%)** | **≈ 19,050** | **23** | **≈ 80, plus the pretest and 2 mocks** |

**What the totals leave out:** answer keys (read only while checking), the appendices (reference), the recording review after each mock, and Appendix E's optional third mock.

**Assumptions,** carried over and now applied everywhere by the build:

- **Reading:** 140 words a minute for study reading (Carver; Brysbaert 2019).
- **Fixed times:** a diagram 1.5 minutes; a recall question 0.75; a predict prompt 0.5; a code block 1; a drill 3; a faded or guided step 2.5; a self-explanation 0.75; a crux guess 0.5; a pretest question 0.45; a mock 40 (a 35-minute run plus 5 minutes of scoring).
- **Triage when behind:** skip ★, skim ★★, never skip a check or a mock.

### Part 1 · Foundations: from zero to a complete, simple design

**130 min · 8,850 words · 11 diagrams.** For a reader with no background. Every component and LLM idea gets a plain explanation and one picture, and the Part ends with you designing a whole system with guidance.

| # | Module | Min | Words | Diagrams | Practice | Built from (8-hour version) |
|---|---|---:|---:|---|---|---|
| 1.1 | Start here: how the guide works, your path, the pretest | 10 | 350 | — | 15-question pretest | Part 0 |
| 1.2 | The interview and RESHAPE | 8 | 650 | RESHAPE timeline | 2 checks | 1.1, 1.2 |
| 1.3 | How a request travels | 7 | 550 | Request journey | 2 checks | 2.1 |
| 1.4 | Root facts and the words for quality | 9 | 750 | — | 3 checks | 2.2, 2.3 |
| 1.5 | Estimating in a few minutes | 11 | 600 | Utilisation curve | 1 drill, 2 checks | 2.4 |
| 1.6 | Classic blocks: the scaling ladder | 22 | 1,900 | Ladder; load balancer; cache layers | 4 checks | 2.5, and the opening of 4.1–4.8 |
| 1.7 | LLM blocks: the complexity ladder | 17 | 1,500 | A model call; RAG at a glance | 4 checks | The opening of 6.1–6.5 |
| 1.8 | Worked design: URL shortener | 12 | 1,100 | Version 1; version 2 | 2 self-explanations | Part 3 |
| 1.9 | Worked design: help-centre Q&A | 9 | 900 | The design | 1 self-explanation | 7.1, simplified |
| 1.10 | Your turn: a guided design (pastebin) | 20 | 300 | — | 7 guided steps | New |
| 1.11 | Check and recap | 5 | 250 | — | 4 mixed checks; recap card | 9.1, 9.3 |

### Part 2 · Going deeper: the same loop, at the depth interviewers probe

**130 min · 5,800 words · 9 diagrams.** Nothing from Part 1 is explained again: each module opens with a collapsed refresher. The time goes to trade-offs with numbers, failure modes raised unprompted, and LLM quality, cost and safety designed in.

| # | Module | Min | Words | Diagrams | Practice | Built from |
|---|---|---:|---:|---|---|---|
| 2.1 | What seniors do differently | 6 | 500 | — | 2 checks | 1.2's senior signals, 1.3 |
| 2.2 | Caching and data, in depth | 13 | 950 | Leader and follower; PACELC | 4 checks | 4.2, 4.3 |
| 2.3 | Async work and partitioning, in depth | 13 | 800 | Queue vs log; hash ring | 1 code block; 4 checks | 4.4, 4.5 |
| 2.4 | APIs, regions, reliability and operations | 11 | 900 | Two regions | 4 checks | 4.6, 4.7, 4.8 |
| 2.5 | LLM calls and retrieval, in depth | 14 | 800 | Prefill and decode; RAG pipeline | 1 drill; 3 checks | 6.1, 6.2 |
| 2.6 | Agents, serving, evals and safety, in depth | 11 | 850 | Lethal trifecta | 1 code block; 3 checks | 6.3, 6.4, 6.5 |
| 2.7 | Faded designs: news feed and support agent | 17 | 750 | Scaled news feed | 4 moves, 2 per design | 5.1, 7.2 |
| 2.8 | Mock A: notification service | 40 | — | In the model answer | Timed mock | 8.1, 8.2 |
| 2.9 | Check and recap | 5 | 250 | — | 4 mixed checks; recap card | — |

### Part 3 · Deep dives: the follow-up questions, answered

**100 min · 4,400 words · 3 diagrams.** The mechanisms behind the second and third "why?", twelve designs at a glance, and the LLM mock. The ★ topics become one-line entries in toolbox tables.

| # | Module | Min | Words | Diagrams | Practice | Built from |
|---|---|---:|---:|---|---|---|
| 3.1 | Consistency and coordination | 11 | 950 | Fencing tokens (new) | 3 checks | 4.3's isolation, 4.5's quorums, 4.7's consensus and transactions |
| 3.2 | Changing and extending live systems | 9 | 700 | Expand–contract | 3 checks | 4.5's resharding, 4.9, 4.10 |
| 3.3 | LLM serving and retrieval internals | 8 | 750 | — | 3 checks | 6.2's vector stores, 6.4's capacity and internals |
| 3.4 | Agents, quality and operations at depth | 10 | 750 | Workflow patterns | 3 checks | 6.3, 6.5, 6.6 |
| 3.5 | Pattern cards: twelve designs | 13 | 1,000 | — | 12 crux guesses | 5.2, 7.3 |
| 3.6 | Mock B: meeting assistant | 40 | — | In the model answer | Timed mock | 8.3 |
| 3.7 | The finish: final check, interview day, the summary | 9 | 250 | — | 6 mixed checks; warm-up drill | 9.1, 9.2, 9.3 |

### The topic spiral

Each row is one topic as it climbs the three Parts. A dash means the topic is finished at the Part before.

| Topic | Part 1: what it is, and why | Part 2: how it works, trade-offs, numbers | Part 3: deep mechanics |
|---|---|---|---|
| Scaling servers | One box to many; stateless servers; load balancers | L4 vs L7, health checks, rate-limiting algorithms | — |
| Caching | Copies near the reader; TTL; CDNs | Cache-aside and its cousins, invalidation, stampedes, hot keys | — |
| Databases | Relational or NoSQL, chosen by access pattern; replicas | Modelling by access pattern, replication and lag, CAP and PACELC | Isolation levels and write skew, quorums; B-tree vs LSM in one line |
| Async work | Queues take slow work off the request | Queue vs pub/sub vs log, delivery guarantees, idempotency, back-pressure | Ordering and partitions; batch vs stream |
| Partitioning | Why shard, and why last | Schemes, consistent hashing, hot partitions, unique IDs | Resharding online, cross-shard queries, secondary indexes |
| APIs and regions | REST; CDNs and regions | API design, real-time push, multi-region, RPO and RTO | Conflict resolution; data residency |
| Reliability | Parts fail: redundancy and timeouts | Retries with jitter, circuit breakers, overload, availability arithmetic | Consensus, leases and fencing; sagas and the outbox; metastable failures; cells |
| Operations | What monitoring and SLOs are | SLOs and error budgets, capacity, cost, security basics | Expand–contract, backfills, change data capture, rollouts |
| Specialist stores | — | — | Search, geospatial, sketches, time series: a toolbox table |
| LLM basics | Model, tokens, cost, why answers stream | Prefill and decode, the KV cache, tool calling, token economics | Reasoning tokens, non-determinism, GPU memory, serving internals |
| Retrieval | RAG as an open-book exam; embeddings | Indexing, hybrid search, reranking, permissions, long context | Vector indexes (ANN, HNSW, quantization); agentic retrieval |
| Workflows and agents | A single call, a workflow or an agent | Workflow patterns, the agent loop and its caps, compounding reliability | Multi-agent, context engineering, memory; MCP and A2A in one line |
| Serving and cost | Streaming; tokens cost money | Routing, gateways, prompt caching, batch APIs | Self-hosting capacity, continuous batching, goodput; speculative decoding in one line |
| Quality and safety | Evals: what good means; prompt injection | Eval design and sample size, guardrails and base rates, the lethal trifecta | Judge bias, tool poisoning; fine-tuning methods in one line |
| Operating LLM systems | — | Model upgrades and fallbacks | Online evals, multi-tenancy, incident patterns, governance |

### Cut, condensed or moved

- **Condensed:** every module's prose by about a third; one interview signal per ★★★ block, of at most 50 words; about 12 myth boxes instead of 20; checks of 2–4 questions instead of 6.
- **Shrunk to one-line toolbox entries:** B-tree vs LSM, time-series stores, sketches, speculative decoding, MCP and A2A, fine-tuning methods.
- **Moved out of the 6 hours, into Appendix E:** the enterprise RAG assistant becomes an optional third mock with its full model answer; two pattern cards (distributed key-value store, typeahead) become practice prompts.
- **Cut:** two of the three estimation drills; the third and fourth moves of each faded design; decision tables that a Part's recap card already covers.

---

## 6. Templates: the fixed shapes

The same shapes repeat in every Part, so the structure costs no attention and readers know where to look (§3, principle 6).

**A Part's landing page:**

```
Part 2 · Going deeper                              ⏱ 130 min · 9 modules
After this Part you can: [three outcomes, in the reader's terms]
The loop:  Frame · Learn classic · Learn LLM · See · Do · Check
           [each stage lists its modules, marked done, current or to do]
[ Start 2.1 ]   or   [ Continue: 2.4 ]
Starting here? The pretest tells you whether you can skip Part 1.
```

**A module page:**

```
Part 2 › 2.3                ⏱ 13 min · module 3 of 9 · 104 min left in Part 2
# 2.3 Async work and partitioning, in depth
In short: [one sentence stating the module's point]
▸ Refresher from 1.6: [two lines and a link; collapsed by default]
Predict first: [one question, answered before reading]
  ### Block … (one per topic; see below)
Decision table: Need → Use → What it costs
Myth vs first principles: [optional; at most 80 words]
Check yourself: 2–4 questions, one of them from an earlier module
[ Next: 2.4 APIs, regions, reliability and operations → ]      ‹ Previous: 2.2
```

**A block** (unchanged, except a shorter signal):

```
### Cache-aside ★★★
Bottleneck: [the pain at this rung] · Root fact: [#]
How it works: [2–3 short paragraphs, plus a diagram numbered to match]
Options: [table: option | how it behaves | cost | choose when]
Interview signal: [at most 50 words: a sentence to say, the follow-up
                   you'll get next, and the outline of a senior answer]
```

**Part 1 adds a "Go deeper" line** at the end of a topic, pointing to the Part 2 module that takes it further. **Parts 2 and 3 never re-explain** what an earlier Part taught: the refresher links back instead.

**A pattern card:**

```
Pattern card · Design a chat service ★★
Predict the crux (30 s) → reveal
Shape · Design · Key decision · Senior depth   [about 80 words in all]
```

**A faded or guided step:**

```
Your move (2 min): decide X, and write one line saying why.
Then: what a strong candidate does and why → tick the points you got.
```

Each question lives once, as data, and the site renders it wherever it appears: on its module page, in the error log, in re-tests and in the print view's answer key.

```yaml
- id: 2.2-c3
  type: decide          # recall | explain | decide | estimate | draw
  objective: 5
  prompt: >
    Reads outnumber writes 100:1, a minute of staleness is fine, users are
    global. Cache, read replica or CDN, and why?
  idea_units:
    - CDN for public, cacheable responses close to users (root fact 2)
    - Cache-aside in front of the database for hot dynamic reads, TTL ≈ 60 s
    - Replicas add read capacity but don't cut cross-continent latency
  misconception: Read replicas fix global latency (only if placed in each region)
  review: 2.2#cache-patterns
```

---

## 7. The self-testing system: how the site replaces a tutor

| Type | Purpose | Where | Example |
|---|---|---|---|
| Predict first | Pretesting: surface what you already know | One per module | "Reads have pushed your database to 90% CPU. Name two fixes before reading on." |
| Recall | Fluency with facts and terms | About 30% of checks | "What does p99 latency mean?" |
| Explain why | A causal model | About 30% of checks | "Why do retries without jitter make outages worse?" |
| Decide | Which tool fits when; telling look-alikes apart | About 40% of checks | "Cache, replica or CDN? Why?" |
| Draw from memory | Free recall of structure | Each Part's mixed check | "Draw the RAG query path and label six parts." |
| Estimate | Fluency with the procedure | A drill in each of Parts 1 and 2 | "50 M daily users × 10 reads each: what's the peak per second?" |
| Guided or faded step | Worked examples with help removed | Part 1's guided design; Part 2's faded designs | "Fan-out on write or on read, for this mix of users? Decide, then read on." |
| Crux guess | Predicting what makes a design hard | Part 3's pattern cards | "Design a chat service. What is the crux?" |
| Mock | Transfer under time pressure | Parts 2 and 3 | A full prompt with timed probe cards |

**Every question runs the same loop:** read the prompt; answer on paper or in the box; choose Sure, Unsure or Guess, which unlocks the answer; tick the points you got; see the common misconception and the section to re-read. Without JavaScript, answers sit in click-to-open panels.

**Scoring and routing.** After a check's last question, the site shows the score and routes you: at 80% or more, carry on; at 50–79%, re-read the linked blocks (5 minutes at most); below 50%, re-read the module's decision table and myth box, and the missed questions come back in the Part's mixed check.

**Error log.** Misses are saved with your confidence rating, confident misses first. "Re-test now" runs them as a quiz, which suits the start of each study day.

**Spacing.** Each module's last question comes from an earlier module, and each Part's mixed check revisits the Part before. Version 2 swaps your own past misses into those slots.

**Ready at the senior bar** means all four of these: at least 75% on both mock rubrics; no zero on any Requirements, Estimate, Analyse or Pressure-test line; an average of at least 1.5 on the Analyse and Pressure-test lines; and at least one probe handled before its card opened. If you fall short, run Appendix E's optional third mock the next day.

---

## 8. Modality rules: when to use text, bullets, tables, diagrams and code

**Rule zero:** choose the form that matches the shape of the knowledge. Never add a form for decoration. Never say the same thing in two forms; the one exception is a one-line caption under a diagram.

| Shape of the content | Form | Rules |
|---|---|---|
| A cause, a mechanism, a "why", or a trade-off with conditions | **Prose** | Paragraphs of 2–4 sentences, one idea each. Words like "because" and "unless" carry the logic, so never break an argument into bullets (Tufte, *The Cognitive Style of PowerPoint*, 2003) |
| Separate items of equal weight: options, failure modes, checklists | **Bullets** | At most 7. Each starts with a bold term. Nest at most one level deep |
| Two or more options compared on two or more attributes; decision rules; reference numbers | **Table** | At most 5 columns and 8 rows. The first column is the option or condition; the last is "choose when" |
| Structure: what connects to what | **Architecture diagram** | At most 12 nodes in 5 groups. Labels on the picture. Drawn as you would draw it in the interview |
| A sequence over time: a protocol, a request flow, a loop | **Sequence or flow diagram** | At most 8 steps. Arrows are numbered to match the numbered steps in the text |
| How a quantity behaves (waiting time vs utilisation) | **Chart** | One message, stated in the title. At most 3 series. Inline SVG. At most 4 charts in the guide |
| An exact interface, data shape or small algorithm | **Code or pseudocode** | At most 15 lines: Python-like pseudocode, API sketches, SQL table definitions, JSON. Always introduced by a sentence saying what to notice. Never the only explanation. Plain monospace with no runtime highlighter. About 6 snippets in the guide |
| Quantitative reasoning | **Worked arithmetic** | Units on every line. Powers of ten. Round hard. End with the decision the number drives |
| A new abstraction | **One analogy** | An everyday comparison, plus one line on where it breaks. At most 12 in the guide. Examples: a KV cache is keeping your place in a book instead of rereading from page 1; RAG is an open-book exam |
| A popular but wrong belief | **Myth vs first principles box** | The claim, what's actually true, and the root fact behind it. 80 words or fewer. About 12 in the guide |
| What to say in the room | **Interview signal box** | 70 words or fewer: a sample sentence, the follow-up you will get, and the outline of a senior answer |
| History | **One clause, and only when it explains a trade-off** | For example: "Amazon's Dynamo chose availability because a rejected shopping-cart write is lost revenue" |
| Photos, screenshots, decorative icons | **Never** | They are "seductive details": interesting but extra, and they harm learning (Mayer's coherence principle) |

**Interactivity.** Use it only where it does a learning job.

| Interaction | Use it for | Rule |
|---|---|---|
| Reveal after an attempt | Every answer | Unlocks only after you choose a confidence level. Never reveals by itself |
| Tick boxes for idea units | Self-scoring | Scores stay in the browser and feed routing and the error log |
| Timer and timed probe cards | Mocks and estimation drills | Visible countdown, can be paused, and cards open at set minutes |
| Tooltips | Glossary terms after their first definition | Tap or hover, and keyboard-accessible. Never the first place a term is defined |
| Step-through diagrams (version 2) | Processes with 4 or more steps | You control the pace. No autoplay. Respects the reduced-motion setting |
| Never | Points, badges, streaks, autoplaying animation, sound, pop-ups | They reward activity rather than accuracy, or pull attention off the content |

**Fixed callouts,** each with an icon, a label and a colour, so each is easy to recognise: Predict first · Interview signal · Myth vs first principles · Pitfall · Numbers · Thinking aloud (worked designs only) · Check yourself, plus Refresher and Go deeper for navigation. Part 1 uses fewer of them. Every block heading carries a tier: ★★★ must know at senior depth, ★★ likely follow-up, ★ worth knowing exists.

---

## 9. Diagram rules

| Element | Drawn as | Colour (meaningful, and still readable in greyscale) |
|---|---|---|
| Client or user | Rounded box | Neutral |
| Service or server | Box | Neutral |
| Load balancer, gateway, guardrail or policy check | Hexagon | Violet (control) |
| Database or index | Cylinder | Amber (data) |
| Cache | Box with a dashed border | Amber |
| Queue or log | Box with double side bars (Mermaid's “subroutine” shape) | Neutral |
| Object storage | Bucket | Amber |
| Model (LLM) call | Rounded box marked "LLM" | Indigo |
| Tool or external API | Box marked "tool" | Green |
| Untrusted input | Dashed red outline | Red |
| Human approval | Person or grey box | Grey |

- **Shape carries the meaning; colour repeats it.** That keeps diagrams readable in print and for colour-blind readers. The colours follow the AI primer's scheme.
- **Direction.** Flow runs top to bottom by default. Use left to right only for chains of 5 boxes or fewer.
- **Build up in steps.** Show v1, then v2 with the new parts highlighted. Re-use earlier diagrams where possible; for example, the cache layers overlay the request journey.
- **Caption and alt text.** Every diagram has a one-sentence caption saying what to notice, not what it looks like. It also has alt text.
- **On the page.** Diagrams are inline SVG with a title and description for screen readers. In dark mode they sit on a light card so the colours stay true. They scale down to phone width, but text must stay at least 11 px.
- **Part 1's diagrams** are simpler versions of Part 2's, in the same shapes and colours, with at most 8 nodes.
- **Authoring.**
  - **Mermaid source,** kept under version control and rendered to SVG ahead of time. There's no Mermaid library at runtime.
  - **Hand-written SVG,** only where Mermaid can't draw the shape, such as the hash ring or a chart.

---

## 10. Writing rules

- **Voice.** Second person, conversational and precise.
- **In short.** Every module opens with one sentence stating its point, so a reader who stops there still leaves with it.
- **Headings state the point** where they can, so scanning the headings works as a summary.
- **Define on first use.** Give the **term** in bold, then a plain definition, then an analogy if it's a new abstraction. Spell out every acronym the first time it appears in each Part. Later uses get a glossary tooltip.
- **Sentences and paragraphs.**
  - Sentences average 25 words or fewer and never exceed 30.
  - One idea per paragraph.
  - Explain how the parts fit before listing them.
- **Content of each block.**
  - Every recommendation states what it costs and when it is the wrong choice.
  - Every block opens with its bottleneck and root fact.
  - Every ★★★ block ends with the follow-up a senior candidate should expect.
- **Words to cut.** No hype ("powerful", "seamless") and no filler ("it's important to note").
- **References.**
  - **Cross-references** point backwards, by module number ("as in 2.2"), except Part 1's explicit Go deeper pointers.
  - **One term per concept,** such as leader/follower; synonyms are listed once, in the glossary.
  - **No links in the body;** sources go only in Appendix F.

---

## 11. Numbers policy

- **Every figure lives once** in `numbers.yaml`. The text, the Numbers appendix and the summary page all read from it, so they can never disagree.
- **Two tiers.** About 20 numbers to memorise, all on the summary page. The rest are reference only.
- **Prefer orders of magnitude and ratios,** such as "memory is about 1,000× faster than an SSD for random reads".
- **Date anything that changes.** Prices, tokens per second and GPU specs carry "as of Nov 2026" and are labelled illustrative. No answer depends on them.
- **Show the working** for every derived number.
- **By Part.** Part 1 teaches the memorise-tier figures it needs, Part 2 adds the rest of them, and Part 3 uses reference figures.
- **Estimation conventions.** A day ≈ 10⁵ seconds. Peak = 2–3× average. Round to one significant figure.

---

## 12. The one-page summary and recap cards

- **Purpose.** A recall checklist for the last 10 minutes before the interview. It contains no new information; every line points to something already practised.
- **On screen.** Recall mode hides each block behind its heading until you tap it: say the contents aloud, then check.
- **In print.**
  - It fits on one A4 or Letter sheet, in three columns of 8.5–9 pt type, with 800 words at most.
  - It stays readable in greyscale.
  - It follows RESHAPE order, so it doubles as a run-sheet.

```
┌──────────────────────── RESHAPE · 35 min ────────────────────────┐
│ R 4′ │ E 3′ │ S 3′ │ H 6′ │ A 12′ │ P 5′ │ E 2′   (+ AI add-ons) │
├─────────────────────┬─────────────────────┬──────────────────────┤
│ Requirements        │ Estimation sheet    │ Building blocks      │
│ checklist (+ AI     │ 10⁵ s/day · 1M/day  │ need → use → cost    │
│ quality bar)        │ ≈ 12/s · latency    │ (~16 core rows)      │
│                     │ ladder · nines ·    │                      │
│                     │ Little · tokens     │                      │
├─────────────────────┼─────────────────────┼──────────────────────┤
│ Scaling ladder      │ Complexity ladder   │ Pressure-test list   │
│ (classic)           │ (LLM)               │ SPOF · hot keys ·    │
│                     │                     │ retries · trifecta … │
├─────────────────────┴─────────────────────┴──────────────────────┤
│ 7 root facts · senior phrases · the 6 most common pitfalls       │
└──────────────────────────────────────────────────────────────────┘
```

**Recap cards.** Parts 1 and 2 each end with a half-page recap card in the same recall-mode format: Part 1's covers the loop, the components and the basic numbers; Part 2's covers the trade-offs and the interview signals. The one-page summary closes Part 3 and covers all three. Ending each Part on what you can now do follows the peak–end rule (§3, principle 14).

---

## 13. Schedules

| Schedule | When to use it | Plan |
|---|---|---|
| **3 days × about 2 hours** (best) | The interview is 4 or more days away | One Part a day. Days 2 and 3 open with a 10-minute re-test of the error log |
| **2 days × about 3 hours** | 2–3 days away | **Day 1:** Part 1, then 2.1–2.5. **Day 2:** a warm-up, the rest of Part 2 with Mock A, then Part 3 |
| **1 day × 6 hours** (emergency) | The interview is tomorrow | Three 2-hour blocks, one per Part, with 15-minute breaks. Then sleep. In the morning, re-test the error log and run the summary in recall mode |

- **Where to start.** Score 12 or more of 15 on the pretest and you can start at Part 2, saving about 2 hours; spend some of them on Appendix E's third mock.
- **Short on time.** With 2 hours, do Part 1; with about 4½, Parts 1 and 2. Each is a complete loop, so stopping there still leaves you with a whole method.
- **If your loop is one-sided.** Classic only: read the ★★★ blocks of the LLM modules only, and replace Mock B with a classic prompt from Appendix E. AI only: the reverse, with an LLM prompt in place of Mock A.
- **Breaks.** Stop at a check and rest for 5–10 minutes every 45–60 minutes, without new information. Quiet rest may help memories settle (Dewar et al. 2012); the evidence is modest, but it costs nothing.

---

## 14. The website: build and hosting

### What gets built

- **Output.** Plain HTML, CSS and plain JavaScript, with no framework and no runtime dependencies. No external requests: no web fonts, CDNs or analytics. Every page works without JavaScript, which adds the practice features.
- **Pages:**
  - **Start here,** with the pretest and, once you've begun, Continue where you left off.
  - **Three Part landing pages.**
  - **One page per module,** about 27 in all.
  - **The one-page summary,** after Part 3.
  - **Progress:** scores by Part, the error log, readiness, export and import.
  - **Appendices:** glossary, numbers, the name decoder, practice prompts with the optional third mock, and sources.
  - **Complete guide:** everything on one page, for Ctrl+F and printing, with answer keys at the end of each Part.
- **Authoring.** One Markdown file per Part, which the build splits into module pages at each `## x.y` heading; questions, mocks, glossary and numbers in YAML; diagrams in Mermaid or hand-written SVG. One source per fact keeps the four places a question appears from drifting apart.

```
sysdes-prep/
├── content/
│   ├── outline.yaml    Parts → modules → blocks: budgets, tiers, root facts; every review link resolves here
│   ├── parts/          part-1.md, part-2.md, part-3.md, start.md, summary.md, appendix-*.md
│   ├── items/          part-1.yaml … part-3.yaml, pretest.yaml
│   ├── mocks/          mock-a.yaml, mock-b.yaml, mock-c.yaml (optional, Appendix E)
│   ├── glossary.yaml   term → plain definition, module of first use
│   └── numbers.yaml    each figure once: value, as-of date, source, memorise or reference
├── diagrams/           src/*.mmd and src/*.svg; rendered *.svg, committed
├── site/               css/style.css, css/print.css, js/app.js
├── scripts/            build.mjs, diagrams.mjs, print-check.mjs, validate-content.rb, later check.mjs
├── archive/            the 8-hour plan and its content, kept locally as source material (not published)
└── PLAN.md
```

### Features

| Version 1 feature | Learning or usability job | How it works |
|---|---|---|
| Attempt → confidence → reveal | Generation before feedback; calibration | The reveal unlocks after you choose Sure, Unsure or Guess |
| Idea-unit self-scoring | Accurate self-assessment | Tick the points you got; the score and routing appear after a check's last question |
| Error log | Successive relearning; correcting confident errors | Misses saved with confidence; confident misses first; "Re-test now" |
| Pretest with a starting point | Pretesting; letting experienced readers skip Part 1 | 15 questions, scored automatically; recommends Part 1 or Part 2 |
| Mock runner | Practice under interview conditions | A 35-minute timer with RESHAPE cues, probe cards at minutes 12, 20 and 27, a rubric and a readiness verdict |
| Part landing pages and progress rail | Orientation; the goal-gradient effect | Module status, time left in the Part, one Start or Continue button |
| Module pages with In short, breadcrumb and Next | Scanning; one clear next action | One module per page; one primary button at the end |
| Refreshers and Go deeper links | Recognition over recall; progressive disclosure | Collapsed two-line refreshers in Parts 2 and 3; pointers forward from Part 1 |
| Continue where you left off | Resuming across sessions | The last module visited, stored in the browser |
| Export and import of progress | Recovering from a cleared browser or a new device | A small JSON file you save and load |
| Focus mode | Fewer distractions | Hides the sidebar until you bring it back |
| Glossary tooltips | Just-in-time help | Tap or hover after a term's first definition; keyboard-accessible |
| Recall mode for the summary and recap cards | Cover-and-recall | Blocks stay hidden behind their headings until tapped |
| Print views | Paper or PDF | The complete guide with answer keys; the summary on one sheet |

**Version 2, after launch:** adaptive spacing with your own misses; a warm-up prompt when you return after a gap; offline use through a service worker; site search; step-through diagrams; measured time against each module's budget.

### Hosting

- **GitHub Pages** serves the site, built by a GitHub Actions workflow on every push to `main`: install, build, run the quality checks, deploy `_site/`.
- **Diagrams are rendered locally and committed,** so CI needs only Node and two small packages.
- **Links are relative,** so the site works under `https://<user>.github.io/<repo>/` and on a local preview server.
- **Public repository,** which Pages needs on a free plan; the CC BY 4.0 licence suits that.
- **Nothing is created or pushed** without your go-ahead: no npm installs, no GitHub repository, no deployment.

### Budgets and standards

| Area | Standard |
|---|---|
| Page weight | Each module page under 200 KB, including inline SVG; landing pages under 100 KB |
| Code size | JavaScript under 40 KB; CSS under 24 KB |
| Typography | 17–18 px body text, about 70 characters per line, 1.55 line height, system fonts |
| Layout | Mobile first: base styles for 320–480 px, then breakpoints at 600 px (tablet: wider margins, two-column cards) and 900 px (desktop: permanent sidebar). No horizontal page scroll, except inside wide figures and code |
| Touch targets | Buttons and tick boxes at least 44 px tall on touch screens |
| Accessibility | WCAG 2.2 AA: keyboard use throughout, visible focus, text contrast of at least 4.5:1, landmarks and a skip link |
| User settings | Dark mode and reduced motion respected |
| Privacy | Progress stays in this browser (localStorage) unless you export it, and is never sent anywhere |

### Licence

Both primers are CC BY 4.0 and credited in the footer and in Appendix F, noting that the text was condensed, rewritten and extended. The guide is also CC BY 4.0. None of the AI primer's MIT-licensed code is reused.

---

## 15. Quality gates

**Automated,** by the build now and by `scripts/check.mjs` in CI later:

- **Time.** Each module's words within ±10% of budget. Each Part's computed minutes within ±5% of its budget, and the three Parts together at most 360 minutes.
- **The loop.** Every Part has a landing page, a framing module, classic and LLM learning modules, a solved design, a design to do, a mixed check and a recap.
- **Define before use.** Every glossary term appears in bold, with a definition, at or before its first use.
- **Questions.** Every one has a prompt, 2–5 idea units, a misconception and a review link that resolves. Every objective has at least 3 questions and 1 rubric line. Every ★★★ block is tested at least twice, once outside its own module.
- **Diagrams.** Alt text, a caption, and text that never shrinks below 11 px.
- **Site.** Internal links resolve; no external requests outside the Sources page; size budgets met; every module page has a breadcrumb, an In short line and one Next action.

**Manual:**

- **Accuracy.** Every claim traces to a source primer or a named reference; derived numbers show their working; changing figures are dated; frontier topics are marked.
- **Print.** The summary prints on one sheet at A4 and Letter.
- **Read-throughs.** Phone first, at 320, 390 and 430 px; then a tablet at 768 px and a desktop at 1280 px. Also one pass as a complete beginner through Part 1, one keyboard-only pass and one in dark mode.
- **Pilot timing.** Time one real read-through of a module from each Part and adjust the 140 wpm assumption if needed.

---

## 16. Migration and drafting order

1. **You approve this plan,** including the four defaults under Decisions.
2. **Archive the 8-hour content** in `archive/`, as source material.
3. **Restructure the data first** (backward design, as before). The outline is restructured at once; the questions move Part by Part, just before each Part's text, and the tracer bullet moves only its own modules' questions and the pretest:
   - `outline.yaml`: Parts 1–3, modules and blocks, with the new budgets;
   - questions: keep about 65 of the 144, write about 15 new ones for Part 1's beginners plus the 7 guided steps, and retire the rest;
   - each Part's objectives and recap card; the mocks unchanged, moved to Parts 2 and 3.
4. **A UX tracer bullet, mobile first:** the new page shell (landing page, module page, progress rail, breadcrumb, In short, refresher, Next, export) proven on Start here and one module from each Part (1.6, 2.3 and 3.1), for you to review in the preview, on a phone first, before the rest.
5. **Rewrite Part 1,** for your review; **then Part 2,** then **Part 3.**
6. **The summary, recap cards and mixed checks.**
7. **Appendices D–F,** with the optional third mock, outside the 6 hours. *(Done: `appendix-d.md`, `appendix-e.md` with `practice.yaml` and `mocks/mock-c.yaml`, and `appendix-f.md`.)*
8. **Release:** run the gates; create the repository and Pages deployment only with your go-ahead.

**Migration map,** from the 8-hour version:

| 8-hour version | New home | How |
|---|---|---|
| Part 0, Start here | 1.1 | Condensed; new schedules for 6 hours |
| Part 1, the interview and RESHAPE | 1.2 (the basics), 2.1 (senior signals, driving) | Split by depth |
| Part 2, foundations | 1.3–1.5 | Condensed; one drill instead of three |
| Part 3, URL shortener | 1.8 | From 1,700 to about 1,100 words |
| Part 4, classic blocks | 1.6 (the opening of each rung), 2.2–2.4 (★★★), 3.1–3.2 (★★ and ★) | Split by depth and condensed |
| Part 5, classic designs | 2.7 (news feed, two moves), 3.5 (six classic cards) | Condensed |
| Part 6, LLM blocks | 1.7 (the basics), 2.5–2.6 (★★★), 3.3–3.4 (★★ and ★) | Split by depth and condensed |
| Part 7, LLM designs | 1.9 (a new, simple RAG design), 2.7 (support agent, two moves), 3.5 (six LLM cards); 7.1 → optional third mock | Split |
| Part 8, mocks | 2.8 (Mock A), 3.6 (Mock B), with 8.1's instructions on each mock page | Moved |
| Part 9, consolidation | 1.11 and 2.9 (mixed checks), 3.7 (final check, interview day, summary) | Split |

---

## 17. Risks

| Risk | Mitigation |
|---|---|
| Six hours is too little for the senior bar | Depth concentrates in Part 2; the pretest lets experienced readers start there; Part 3 targets the follow-up probes; triage rules cover running behind |
| Readers stop after Part 1 believing they're ready | Part 1's recap says plainly what it prepares you for, and what Part 2 adds |
| Revisiting topics feels repetitive | Parts 2 and 3 never re-explain; collapsed refreshers link back, and each Part's text starts where the last one stopped |
| Condensing loses the "why" | Every block keeps its bottleneck and mechanism; cuts come from lists, duplication and ★ detail; the migration map tracks where everything went |
| One page per module loses Ctrl+F | The complete-guide page keeps everything on one page; site search comes in version 2 |
| Self-grading is too lenient | Idea-unit answers, behaviour-based rubrics, confidence ratings, and readiness judged by mock scores |
| The LLM content goes stale | Teach mechanisms and ratios, not prices; date changing figures and mark frontier topics |
| The site grows complex | Plain JavaScript under a size budget; every feature tied to a learning or usability job; pages work without JavaScript |
| Progress is lost | Export and import in version 1, and a warning on the Progress page |
