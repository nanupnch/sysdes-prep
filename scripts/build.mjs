// Build the study site: content/ (Markdown + YAML) → _site/ (plain HTML, CSS and JavaScript).
// One page per module, a landing page per Part, Start here, the summary, progress, appendices and a print view.
// Usage: npm run build. Exits with 1 on any unresolved reference (item, block, term, number, figure, mock).
import fs from 'node:fs';
import path from 'node:path';
import { load as parseYaml } from 'js-yaml';
import MarkdownIt from 'markdown-it';

const OUT = '_site';
const errors = [];
const fail = (msg) => { errors.push(msg); return ''; };
const readText = (p) => fs.readFileSync(p, 'utf8');
const readYaml = (p) => parseYaml(readText(p));
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const oneBlock = (html) => html.replace(/\n\s*\n/g, '\n'); // raw HTML inside Markdown must not contain blank lines
const yamlFiles = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort().map((f) => path.join(dir, f));

// ======================= content =======================
const outline = readYaml('content/outline.yaml');
const WPM = outline.reading_wpm || 140;
const numbers = new Map(readYaml('content/numbers.yaml').numbers.map((n) => [n.id, n]));
const glossary = readYaml('content/glossary.yaml').terms;
const termIndex = new Map();
for (const t of glossary) {
  for (const name of [t.term, ...(t.aliases || [])]) {
    const key = name.toLowerCase();
    if (termIndex.has(key)) fail(`glossary: “${name}” is claimed by both ${termIndex.get(key).id} and ${t.id}`);
    termIndex.set(key, t);
  }
}
const items = new Map();
for (const f of yamlFiles('content/items')) {
  const doc = readYaml(f);
  for (const it of doc.items || []) {
    if (items.has(it.id)) fail(`${f}: question “${it.id}” is defined twice`);
    items.set(it.id, { ...it, part: String(doc.part) });
  }
}
const mocks = new Map(yamlFiles('content/mocks').map((f) => { const m = readYaml(f); return [m.id, m]; }));
const practice = fs.existsSync('content/practice.yaml') ? readYaml('content/practice.yaml').prompts : [];

const parts = new Map(outline.parts.map((p) => [String(p.id), p]));
const partIds = [...parts.keys()];
const modules = new Map();
const blocks = new Map();
const order = []; // every module, in reading order
for (const p of outline.parts) {
  p.modules.forEach((m, i) => {
    modules.set(m.id, { ...m, part: String(p.id), n: i + 1, of: p.modules.length });
    order.push(m.id);
    for (const b of m.blocks || []) blocks.set(`${m.id}#${b.slug}`, { ...b, module: m.id });
  });
}
const HOME = order.find((mid) => modules.get(mid).page === 'home'); // 1.1, Start here, is the site's front page

function readSource(file) {
  const raw = readText(path.join('content/parts', file));
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
  return { file, meta: m ? parseYaml(m[1]) : {}, body: m ? raw.slice(m[0].length) : raw };
}
const sources = fs.readdirSync('content/parts').filter((f) => f.endsWith('.md')).sort().map(readSource);
const summarySource = sources.find((s) => s.meta.page === 'summary');
const appendixSources = sources.filter((s) => s.meta.page === 'appendix').sort((a, b) => String(a.meta.id).localeCompare(String(b.meta.id)));
const appendixTitle = (id) => (outline.appendices || []).find((a) => a.id === id)?.title || `Appendix ${id}`;
const APPENDIX_PAGES = new Map([['B', 'glossary'], ['C', 'numbers'], ...appendixSources.map((s) => [String(s.meta.id), s.meta.slug])]);
const appendixMocks = appendixSources.flatMap((s) => [...s.body.matchAll(/^\{\{\s*mock\s+([\w-]+)\s*\}\}\s*$/gm)].map((m) => ({ id: m[1], src: s })));

// Each Part file is split into modules at its "## x.y Title {#x.y}" headings; start.md is module 1.1 entire.
const MODULE_HEADING = /^##\s+([\d.]+)\s+(.*?)\s*\{#([\w.]+)\}\s*$/;
const sectionOf = new Map(); // module id → { file, text }
for (const s of sources) {
  if (s.meta.page === 'home') { sectionOf.set(HOME, { file: s.file, text: s.body }); continue; }
  if (!s.meta.part) continue;
  let cur = null;
  let buf = [];
  const flush = () => { if (cur) sectionOf.set(cur, { file: s.file, text: buf.join('\n') }); };
  for (const line of s.body.split('\n')) {
    const h = MODULE_HEADING.exec(line);
    if (!h) { if (cur) buf.push(line); continue; }
    flush();
    cur = h[3];
    buf = [];
    const mod = modules.get(cur);
    if (!mod) { fail(`${s.file}: “{#${cur}}” names no module in the outline`); cur = null; continue; }
    if (sectionOf.has(cur)) fail(`${s.file}: module ${cur} is written twice`);
    if (h[1] !== cur || h[2] !== mod.title) fail(`${s.file}: heading “${h[1]} ${h[2]}” should read “${cur} ${mod.title}”, as in the outline`);
    if (mod.part !== String(s.meta.part)) fail(`${s.file}: module ${cur} belongs to Part ${mod.part}`);
  }
  flush();
}
const written = new Set(sectionOf.keys());

// ======================= links =======================
const slugOf = (mid) => mid.replace(/\./g, '-');
const moduleHref = (mid, root) => (mid === HOME ? root || './' : `${root}part-${modules.get(mid).part}/${slugOf(mid)}/`);
const partHref = (pid, root) => `${root}part-${pid}/`;
function href(anchor, root) {
  const [mid, slug] = anchor.split('#');
  if (!modules.has(mid)) { fail(`unknown module in link “${anchor}”`); return '#'; }
  if (slug && !blocks.has(anchor)) { fail(`unknown block in link “${anchor}”`); return '#'; }
  const base = moduleHref(mid, root);
  return slug && written.has(mid) ? `${base}#${mid}-${slug}` : base;
}
function label(anchor) {
  const [mid, slug] = anchor.split('#');
  return slug ? `${mid} · ${blocks.get(anchor)?.title ?? slug}` : `${mid} · ${modules.get(mid)?.title ?? ''}`;
}
function reviewLink(anchor, root) {
  const isWritten = written.has(anchor.split('#')[0]);
  return `<a href="${esc(href(anchor, root))}"${isWritten ? '' : ' class="not-built" title="Being rewritten"'}>${esc(label(anchor))}</a>`;
}

// ======================= Markdown =======================
const md = new MarkdownIt({ html: true, linkify: false, typographer: false });
// "{#slug}" at the end of a heading sets its id, prefixed with the module ("2.3-backpressure") so ids stay
// unique on the complete-guide page too.
md.core.ruler.push('heading_ids', (state) => {
  const prefix = state.env && state.env.module;
  const toks = state.tokens;
  for (let i = 0; i < toks.length; i++) {
    if (toks[i].type !== 'heading_open') continue;
    const inline = toks[i + 1];
    const m = /\s*\{#([\w.-]+)\}\s*$/.exec(inline.content);
    if (!m) continue;
    inline.content = inline.content.slice(0, m.index);
    const last = inline.children[inline.children.length - 1];
    if (last && last.type === 'text') last.content = last.content.replace(/\s*\{#[\w.-]+\}\s*$/, '');
    toks[i].attrSet('id', prefix ? `${prefix}-${m[1]}` : m[1]);
  }
});
// Tables of three or more columns reflow into labelled cards on phones: every cell carries its column's name.
const plainText = (s) => String(s).replace(/<[^>]+>/g, '').replace(/\*\*|__|[*_`]/g, '').trim();
md.core.ruler.push('table_labels', (state) => {
  const toks = state.tokens;
  for (let i = 0; i < toks.length; i++) {
    if (toks[i].type !== 'table_open') continue;
    const heads = [];
    let j = i + 1;
    for (; j < toks.length && toks[j].type !== 'thead_close'; j++) if (toks[j].type === 'th_open') heads.push(plainText(toks[j + 1].content));
    if (heads.length >= 3) toks[i].attrJoin('class', 'reflow');
    let col = 0;
    for (; j < toks.length && toks[j].type !== 'table_close'; j++) {
      if (toks[j].type === 'tr_open') col = 0;
      else if (toks[j].type === 'td_open') { if (heads[col]) toks[j].attrSet('data-label', heads[col]); col++; }
    }
    i = j;
  }
});
md.renderer.rules.table_open = (toks, idx, opts, env, self) => `<div class="table-wrap"><table${self.renderAttrs(toks[idx])}>\n`;
md.renderer.rules.table_close = () => '</table></div>\n';
const inl = (s) => md.renderInline(String(s ?? ''));

const CALLOUTS = {
  inshort: 'In short', predict: 'Predict first', signal: 'Interview signal', myth: 'Myth vs first principles',
  pitfall: 'Pitfall', numbers: 'Numbers', think: 'Thinking aloud', refresher: 'Refresher', deeper: 'Go deeper',
  recap: 'Recap card',
};
const TIER_TITLE = { 3: 'Must know at senior depth', 2: 'Likely follow-up', 1: 'Worth knowing it exists' };
const TYPE_LABEL = {
  recall: 'Recall', explain: 'Explain', decide: 'Decide', estimate: 'Estimate',
  draw: 'Draw from memory', faded: 'Your move', guided: 'Your move', choice: 'Pretest',
};
const stars = (tier) => `<span class="tier tier-${tier}" title="${TIER_TITLE[tier]}">${'★'.repeat(tier)}</span>`;

// Where each glossary term first appears (bold definition or [[term]]), in reading order.
const termFirst = new Map();
const noteTerm = (t, ctx) => { if (ctx.mode === 'web' && ctx.mid && !termFirst.has(t.id)) termFirst.set(t.id, ctx.mid); };

function inlineTokens(line, ctx) {
  for (const b of line.matchAll(/\*\*([^*]+)\*\*/g)) {
    const t = termIndex.get(b[1].trim().replace(/[:.,;]$/, '').toLowerCase()); // “**Client:**” defines “client”
    if (t) noteTerm(t, ctx);
  }
  return line
    .replace(/\{\{appendix\s+([A-Z])\}\}/g, (s, id) => (APPENDIX_PAGES.has(id) ? `<a href="${ctx.root}${APPENDIX_PAGES.get(id)}/">Appendix ${id}</a>` : fail(`${ctx.file}: no page for Appendix ${id}`) || s))
    .replace(/\{\{ref\s+([\w.#-]+)\}\}/g, (s, anchor) => `<a href="${esc(href(anchor, ctx.root))}" title="${esc(label(anchor))}" aria-label="${esc(label(anchor))}">${esc(anchor.split('#')[0])}</a>`)
    .replace(/\{\{num\s+([\w-]+)\}\}/g, (s, id) => {
      const n = numbers.get(id);
      if (!n) return fail(`${ctx.file}: unknown number “${id}”`) || s;
      return `<span class="num" title="${esc(`${n.label}. Source: ${n.source}. As of: ${n.as_of}.`)}">${esc(n.value)}</span>`;
    })
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (s, name, text) => {
      const t = termIndex.get(name.trim().toLowerCase());
      if (!t) return fail(`${ctx.file}: no glossary entry for [[${name}]]`) || name;
      noteTerm(t, ctx);
      return `<span class="term" tabindex="0" data-def="${esc(t.def)}">${esc(text || name)}</span>`;
    });
}

// "::: type [link]" … ":::" wraps a callout. refresher and deeper take a link such as 1.6#queues.
function openCallout(c, ctx) {
  if (c.type === 'inshort') { ctx.inshort = true; return ['<div class="in-short">', '<p class="in-short-label">In short</p>']; }
  if (c.type === 'recap') return ['<div class="recap-card" data-recap>', '<p class="recap-label">Recap card</p>'];
  if ((c.type === 'refresher' || c.type === 'deeper') && !c.arg) fail(`${ctx.file}: “::: ${c.type}” needs a link, such as “::: ${c.type} 1.6#queues”`);
  if (c.type === 'refresher') {
    const [mid] = (c.arg || '').split('#');
    const title = blocks.get(c.arg)?.title || modules.get(mid)?.title || '';
    return [`<details class="refresher"><summary><span class="refresher-label">Refresher</span> ${esc(title)} <span class="refresher-from">from ${esc(mid)}</span></summary>`, '<div class="refresher-body">'];
  }
  return [`<aside class="callout callout-${c.type}">`, `<p class="callout-label">${CALLOUTS[c.type] || c.type}</p>`];
}
function closeCallout(c, ctx) {
  if (c.type === 'inshort') return ['</div>'];
  if (c.type === 'recap') return ['<!--recap-end--></div>'];
  if (c.type === 'refresher') return [`<p class="refresher-link">Re-read ${reviewLink(c.arg || '', ctx.root)}</p>`, '</div></details>'];
  if (c.type === 'deeper') return [`<p class="deeper-link">${reviewLink(c.arg || '', ctx.root)}</p>`, '</aside>'];
  return ['</aside>'];
}

function preprocess(body, ctx) {
  const out = [];
  const open = [];
  let fence = false;
  const skipping = () => open.some((c) => c.skip); // the print view leaves refreshers out: it is read in order
  for (let line of body.split('\n')) {
    if (/^```/.test(line)) {
      if (!fence && !skipping()) ctx.t.code++;
      fence = !fence;
      if (!skipping()) out.push(line);
      continue;
    }
    if (fence) { if (!skipping()) out.push(line); continue; }
    let m;
    if ((m = /^:::\s*([a-z]+)(?:\s+(\S+))?\s*$/.exec(line))) {
      const c = { type: m[1], arg: m[2], skip: ctx.mode === 'print' && m[1] === 'refresher' };
      if (!CALLOUTS[c.type]) fail(`${ctx.file}: unknown callout “${c.type}”`);
      const hidden = skipping();
      open.push(c);
      if (!hidden && !c.skip) out.push('', ...openCallout(c, ctx), '');
      continue;
    }
    if (/^:::\s*$/.test(line)) {
      const c = open.pop();
      if (!c) { fail(`${ctx.file}: “:::” closes nothing`); continue; }
      if (!c.skip && !skipping()) out.push('', ...closeCallout(c, ctx), '');
      continue;
    }
    if (skipping()) continue;
    if ((m = /^\{\{\s*([a-z]+)(?:\s+([^}]*?))?\s*\}\}\s*$/.exec(line))) {
      out.push('', oneBlock(shortcode(m[1], (m[2] || '').trim(), ctx)), '');
      continue;
    }
    if (/^#{2,4}\s/.test(line)) {
      if (ctx.promote && /^#{3,4}\s/.test(line)) line = line.slice(1); // a module page's h1 is its title
      line = line.replace(/\s+(★{1,3})(\s*\{#[\w.-]+\})?\s*$/, (s, st, id) => ` ${stars(st.length)}${id || ''}`);
    }
    out.push(inlineTokens(line, ctx));
  }
  if (open.length) fail(`${ctx.file}: unclosed “::: ${open.map((c) => c.type).join(', ')}”`);
  return out.join('\n');
}

function shortcode(name, arg, ctx) {
  switch (name) {
    case 'predict': return renderPredict(arg, ctx);
    case 'check': return renderCheckpoint(arg, ctx);
    case 'item': return renderInlineItem(arg, ctx);
    case 'crux': return renderCrux(arg, ctx);
    case 'fig': return renderFigure(arg, ctx);
    case 'pretest': return renderPretest(ctx);
    case 'mock': return renderMock(arg, ctx);
    case 'parts': return '<!--part-cards-->'; // filled in once every module's time is known
    case 'practice': return renderPractice(arg, ctx);
    default: return fail(`${ctx.file}: unknown shortcode {{${name}}}`);
  }
}

function countWords(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s*\{\{.*\}\}\s*$/gm, ' ')
    .replace(/\{\{num\s+([\w-]+)\}\}/g, (s, id) => numbers.get(id)?.value ?? '')
    .replace(/^:::.*$/gm, ' ')
    .replace(/\{#[\w.-]+\}/g, ' ')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[|*#`>_]/g, ' ')
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

// ======================= time model =======================
// Reading at WPM, plus fixed minutes for everything you do rather than read.
const MIN = { fig: 1.5, check: 0.75, predict: 0.5, code: 1, pretest: 0.45, mockScoring: 5 };
const INLINE_MINUTES = { d: 3, f: 2.5, g: 2.5, s: 0.75, k: 0.5 }; // drill, faded step, guided step, self-explanation, crux guess
const PRETEST_PASS = 12; // of 15: start at Part 2
const mockText = (mk) => [mk.prompt, ...mk.clarifications.map((c) => `${c.q} ${c.a}`),
  ...mk.probes.map((p) => `${p.text} ${[].concat(p.strong_answer || []).join(' ')}`),
  ...mk.rubric.map((r) => r.line), mk.model_outline].join('\n');

// ======================= renderers =======================
const checkpointItems = (mid) => [...items.values()].filter((it) => it.id.startsWith(`${mid}-c`));
const predictItems = (mid) => [...items.values()].filter((it) => it.id.startsWith(`${mid}-p`));
const checkpointRegistry = new Map(); // filled as pages render; feeds the progress page

function renderPredict(id, ctx) {
  const it = items.get(id);
  if (!it || it.type !== 'predict') return fail(`${ctx.file}: no predict item “${id}”`);
  ctx.t.predicts++;
  if (ctx.mode === 'print') return `<aside class="callout callout-predict"><p class="callout-label">Predict first</p><p>${inl(it.prompt)}</p></aside>`;
  return `<aside class="callout callout-predict" data-predict="${esc(id)}"><p class="callout-label">Predict first</p><p>${inl(it.prompt)}</p>` +
    `<label class="sr-only" for="p-${esc(id)}">Your guess</label>` +
    `<textarea id="p-${esc(id)}" class="predict-attempt" rows="2" placeholder="Your guess. Being wrong is fine; it helps you learn the answer."></textarea>` +
    '<p class="predict-later">You will compare your guess with the answer at the end of this module.</p></aside>';
}

function renderItem(it, ctx) {
  const from = it.spaced ? `<span class="item-tag">From ${esc(it.review.split('#')[0])}</span>` : '';
  const units = it.idea_units.map((u, k) => `<li><label><input type="checkbox" data-unit="${k}"><span>${inl(u)}</span></label></li>`).join('');
  const scaffold = it.scaffold ? `<ol class="scaffold">${it.scaffold.map((s) => `<li>${inl(s)}</li>`).join('')}</ol>` : '';
  const typeLabel = /-d\d+$/.test(it.id) ? 'Drill' : TYPE_LABEL[it.type] || esc(it.type);
  return `<li class="item" data-item="${esc(it.id)}">` +
    `<p class="item-meta"><span class="item-type">${typeLabel}</span>${from}</p>` +
    `<p class="item-prompt">${inl(it.prompt)}</p>${scaffold}` +
    `<label class="sr-only" for="a-${esc(it.id)}">Your answer</label>` +
    `<textarea id="a-${esc(it.id)}" class="item-attempt" rows="3" placeholder="Your answer (optional; paper works too)"></textarea>` +
    '<details class="item-answer"><summary>Reveal the answer</summary><div class="answer-body">' +
    `<p class="answer-instruction">Tick each point you got:</p><ul class="idea-units">${units}</ul>` +
    (it.misconception ? `<p class="misconception"><strong>Common wrong answer:</strong> ${inl(it.misconception)}</p>` : '') +
    `<p class="review-link">Missed something? Re-read ${reviewLink(it.review, ctx.root)}.</p>` +
    '</div></details></li>';
}

function printQuestion(it) {
  const scaffold = it.scaffold ? `<ol class="scaffold">${it.scaffold.map((s) => `<li>${inl(s)}</li>`).join('')}</ol>` : '';
  return `<li><p>${inl(it.prompt)}</p>${scaffold}</li>`;
}

// {{check 2.3}} gathers a module's check questions (ids 2.3-c1, 2.3-c2, …) and revisits its prediction.
function renderCheckpoint(mid, ctx) {
  const m = modules.get(mid);
  if (!m) return fail(`${ctx.file}: unknown module “${mid}” in {{check}}`);
  const list = checkpointItems(mid);
  if (!list.length) return fail(`${ctx.file}: no check questions for “${mid}”`);
  const hx = ctx.mode === 'web' ? 'h2' : 'h3';
  if (ctx.mode === 'print') {
    const start = ctx.key.length + 1;
    for (const it of list) ctx.key.push(it);
    return `<section class="checkpoint"><${hx}>Check yourself · ${esc(mid)}</${hx}><ol class="items-print" start="${start}">${list.map(printQuestion).join('')}</ol></section>`;
  }
  ctx.t.checks += list.length;
  checkpointRegistry.set(mid, { id: mid, title: `${mid} ${m.title}`, href: `${moduleHref(mid, '../')}#cp-${mid}`, items: list.map((it) => it.id) });
  const predicts = predictItems(mid);
  const revisit = predicts.length
    ? `<div class="revisit"><p class="revisit-label">Your prediction, revisited</p>${predicts.map((p) =>
      `<div class="revisit-item" data-predict="${esc(p.id)}"><p class="revisit-prompt">${inl(p.prompt)}</p><p class="revisit-yours" hidden></p>` +
      `<details><summary>What this module says</summary><p>${inl(p.answer)}</p></details></div>`).join('')}</div>`
    : '';
  const minutes = Math.max(1, Math.round(list.length * MIN.check));
  return `<section class="checkpoint" data-checkpoint="${esc(mid)}" aria-labelledby="cp-${esc(mid)}">` +
    `<${hx} class="checkpoint-title" id="cp-${esc(mid)}">Check yourself</${hx}>${revisit}` +
    `<p class="checkpoint-intro">${list.length} questions, about ${minutes} minute${minutes === 1 ? '' : 's'}. Answer on paper or in the box, say how sure you are, then reveal the answer and tick what you got.</p>` +
    `<ol class="items">${list.map((it) => renderItem(it, ctx)).join('')}</ol>` +
    '<div class="checkpoint-result" role="status" aria-live="polite" hidden></div></section>';
}

// {{item 1.6-d1}}: one question placed in the text (drills, self-explanations, faded and guided steps).
function renderInlineItem(id, ctx) {
  const it = items.get(id);
  if (!it || !it.idea_units) return fail(`${ctx.file}: no scored item “${id}” for {{item}}`);
  const kind = (/-([dfgsk])\d+$/.exec(id) || [])[1];
  if (!kind) return fail(`${ctx.file}: “${id}” is not a drill (d), faded (f), guided (g) or self-explanation (s) id`);
  ctx.t.inline += INLINE_MINUTES[kind];
  if (ctx.mode === 'print') {
    ctx.key.push(it);
    return `<ol class="items-print" start="${ctx.key.length}">${printQuestion(it)}</ol>`;
  }
  return `<div class="inline-items" data-inline><ol class="items">${renderItem(it, ctx)}</ol></div>`;
}

// {{crux 3.5-k1}}: guess what makes a pattern card hard before reading it. Unscored; the guess is kept
// like a prediction, and the answer sits behind a reveal.
function renderCrux(id, ctx) {
  const it = items.get(id);
  if (!it || it.type !== 'crux') return fail(`${ctx.file}: no crux item “${id}”`);
  ctx.t.inline += INLINE_MINUTES.k;
  const open = `<aside class="callout callout-predict crux"${ctx.mode === 'print' ? '' : ` data-predict="${esc(id)}"`}>` +
    `<p class="callout-label">Predict the crux · 30 seconds</p><p>${inl(it.prompt)}</p>`;
  if (ctx.mode === 'print') return `${open}</aside>`;
  return `${open}<label class="sr-only" for="k-${esc(id)}">Your guess</label>` +
    `<textarea id="k-${esc(id)}" class="predict-attempt" rows="2" placeholder="Your guess: what makes this problem hard?"></textarea>` +
    `<details class="crux-reveal"><summary>Reveal the crux</summary><p>${inl(it.answer)}</p></details></aside>`;
}

// A diagram is Mermaid source (diagrams/src/<id>.mmd, rendered to diagrams/<id>.svg by npm run diagrams)
// or, where Mermaid can't draw the shape, hand-written SVG (diagrams/src/<id>.svg, used as it is).
function renderFigure(id, ctx) {
  const hand = `diagrams/src/${id}.svg`;
  const src = `diagrams/src/${id}.mmd`;
  const file = `diagrams/${id}.svg`;
  let alt;
  let caption;
  let svg;
  if (fs.existsSync(hand)) {
    const text = readText(hand);
    alt = (/<!--\s*alt:\s*([\s\S]+?)\s*-->/.exec(text) || [])[1] || '';
    caption = (/<!--\s*caption:\s*([\s\S]+?)\s*-->/.exec(text) || [])[1] || '';
    if (!alt) fail(`${hand}: missing “<!-- alt: … -->” comment`);
    svg = text.replace(/<!--[\s\S]*?-->\s*/g, '');
  } else {
    if (!fs.existsSync(src)) return fail(`${ctx.file}: no diagram source ${src} or ${hand}`);
    if (!fs.existsSync(file)) return fail(`${ctx.file}: ${file} is not rendered; run npm run diagrams`);
    // A fresh checkout (as in CI) gives every file the same new time, so the staleness check runs only locally.
    if (!process.env.CI && fs.statSync(file).mtimeMs < fs.statSync(src).mtimeMs) fail(`${file} is older than its source; run npm run diagrams`);
    const mmd = readText(src);
    alt = (/^%%\s*alt:\s*(.+)$/m.exec(mmd) || [])[1] || '';
    caption = (/^%%\s*caption:\s*(.+)$/m.exec(mmd) || [])[1] || '';
    if (!alt) fail(`${src}: missing “%% alt:” line`);
    svg = readText(file).replace(/^<\?xml[^>]*>\s*/, '');
  }
  ctx.t.figs++;
  // Never shrink a diagram so far that its text drops below 11 px; narrower screens scroll it sideways
  // or open it full screen instead. Mermaid text is 15 px; hand-drawn SVG uses its smallest size.
  const vbWidth = Number((/viewBox="[-\d.]+\s+[-\d.]+\s+([\d.]+)/.exec(svg) || [])[1]) || 0;
  const sizes = fs.existsSync(hand) ? [...svg.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1])) : [];
  const smallest = Math.max(11, Math.min(15, ...sizes));
  const minWidth = Math.round(vbWidth * 11 / smallest);
  svg = svg.replace(/<svg\b([^>]*)>/, (s, attrs) => {
    attrs = attrs.replace(/\s(role|aria-roledescription|aria-labelledby|aria-describedby)="[^"]*"/g, '');
    if (minWidth) {
      attrs = / style="/.test(attrs)
        ? attrs.replace(/ style="([^"]*)"/, (m, st) => ` style="${st.replace(/;?\s*$/, '')}; min-width: ${minWidth}px;"`)
        : `${attrs} style="min-width: ${minWidth}px;"`;
    }
    return `<svg${attrs} role="img" aria-label="${esc(alt)}" focusable="false">`;
  });
  return `<figure class="figure" id="fig-${esc(id)}"><div class="figure-art">${svg}</div>${caption ? `<figcaption>${inl(caption)}</figcaption>` : ''}</figure>`;
}

const AREAS = { numbers: 'Numbers', classic: 'Classic systems', llm: 'LLM systems' };
function renderPretest(ctx) {
  const list = [...items.values()].filter((it) => it.type === 'choice');
  if (!list.length) return fail(`${ctx.file}: no pretest questions`);
  ctx.t.pretest += list.length;
  for (const it of list) if (!AREAS[it.area]) fail(`pretest ${it.id}: area must be one of ${Object.keys(AREAS).join(', ')}`);
  if (ctx.mode === 'print') {
    const start = ctx.key.length + 1;
    for (const it of list) ctx.key.push(it);
    return `<ol class="items-print" start="${start}">${list.map((it) =>
      `<li><p>${inl(it.prompt)}</p><ol class="choices-print" type="a">${it.choices.map((c) => `<li>${inl(c)}</li>`).join('')}</ol></li>`).join('')}</ol>`;
  }
  const afterHome = order[order.indexOf(HOME) + 1];
  return `<form class="pretest" id="pretest" data-pretest data-pass="${PRETEST_PASS}" data-part1="${esc(moduleHref(afterHome, ctx.root))}" data-part1-label="${esc(`${afterHome} ${modules.get(afterHome).title}`)}" data-part2="${esc(partHref(partIds[1], ctx.root))}">` +
    list.map((it, i) =>
      `<fieldset class="pt-q" data-item="${esc(it.id)}" data-answer="${it.answer}" data-area="${esc(AREAS[it.area] || '')}">` +
      `<legend><span class="pt-n">${i + 1}</span>${inl(it.prompt)}</legend>` +
      it.choices.map((c, k) => `<label class="pt-choice"><input type="radio" name="${esc(it.id)}" value="${k}"><span>${inl(c)}</span></label>`).join('') +
      `<details class="pt-why"><summary>Answer</summary><p><strong>${inl(it.choices[it.answer])}.</strong> ${inl(it.why)}</p></details></fieldset>`).join('') +
    '<p class="pt-actions"><button type="button" class="button button-primary pt-score" hidden>Score my pretest</button></p>' +
    '<div class="pt-result" role="status" aria-live="polite" hidden></div></form>';
}

const RESHAPE = [['Requirements', 4], ['Estimate', 3], ['Surface & schema', 3], ['High-level design', 6], ['Analyse', 12], ['Pressure-test', 5], ['Evaluate', 2]];

function renderMock(id, ctx) {
  const m = mocks.get(id);
  if (!m) return fail(`${ctx.file}: unknown mock “${id}”`);
  const card = (cls, title, inner) => `<div class="mock-card ${cls}"><p class="mock-label">${title}</p>${inner}</div>`;
  const clarifications = `<dl class="clarifications">${m.clarifications.map((c) => `<dt>${inl(c.q)}</dt><dd>${inl(c.a)}</dd>`).join('')}</dl>`;
  const rubricRows = (scoring) => m.rubric.map((r) =>
    `<tr data-line="${esc(r.id)}" data-step="${esc(r.step)}" data-review="${esc(href(r.review, ctx.root))}" data-review-label="${esc(label(r.review))}">` +
    `<td data-label="Line">${esc(r.id)}</td><td data-label="Step">${esc(r.step)}</td><td data-label="What you did">${inl(r.line)}</td>` +
    (scoring ? [0, 1, 2].map((v) => `<td class="score"><label><input type="radio" name="${esc(id)}-${esc(r.id)}" value="${v}" aria-label="${esc(r.id)} scored ${v}"><span class="score-n" aria-hidden="true">${v}</span></label></td>`).join('') : '<td></td><td></td><td></td>') +
    '</tr>').join('');
  const rubricTable = (scoring) => '<div class="table-wrap"><table class="rubric"><thead><tr><th scope="col">Line</th><th scope="col">Step</th><th scope="col">What you did</th><th scope="col">0</th><th scope="col">1</th><th scope="col">2</th></tr></thead>' +
    `<tbody>${rubricRows(scoring)}</tbody></table></div>`;
  const scale = '<p class="rubric-scale"><strong>2</strong> done unprompted, with a reason · <strong>1</strong> partly, or only after a probe · <strong>0</strong> missing</p>';
  const outlineBody = `${m.diagram ? renderFigure(m.diagram, ctx) : ''}<div class="outline-body">${md.render(m.model_outline)}</div>`;

  if (ctx.mode === 'print') {
    ctx.mockKeys.push({ title: m.title, outlineBody });
    return `<section class="mock">${card('mock-prompt', 'Prompt', `<p class="mock-prompt-text">${inl(m.prompt)}</p>`)}` +
      `<p class="mock-print-note">Set a ${m.minutes}-minute timer. Write your clarifying questions first, then read the card. Read each probe card only at its minute.</p>` +
      card('mock-clarify', 'Clarification card', clarifications) +
      m.probes.map((p, k) => card('probe', `Probe card ${k + 1} · read at minute ${p.at}`, `<p>${inl(p.text)}</p>`)).join('') +
      card('mock-rubric', 'Rubric', scale + rubricTable(false)) + '</section>';
  }
  const steps = `<ol class="mock-steps" aria-label="RESHAPE time boxes">${RESHAPE.map(([n, mins]) => `<li><span class="step-name">${esc(n)}</span> <span class="step-min">${mins}′</span></li>`).join('')}</ol>`;
  const runner = `<div class="mock-runner" hidden><span class="mock-time">${m.minutes}:00</span><span class="mock-cue" aria-live="polite"></span>` +
    '<span class="mock-buttons"><button type="button" class="mock-start">Start</button><button type="button" class="mock-reset">Reset</button>' +
    '<button type="button" class="mock-review" title="Unlock every card now, for reviewing rather than practising">Unlock all</button></span></div>';
  const clarify = card('mock-clarify', 'Before the clarification card',
    `<label for="q-${esc(id)}">Write the clarifying questions you would ask:</label>` +
    `<textarea id="q-${esc(id)}" class="mock-questions" rows="4" placeholder="One question per line"></textarea>` +
    `<details class="mock-clarifications"><summary>Reveal the clarification card</summary>${clarifications}</details>`);
  const probes = m.probes.map((p, k) =>
    `<details class="mock-card probe" data-at="${p.at}" data-probe="${k}"><summary><span class="probe-title">Probe card ${k + 1}</span> <span class="probe-when">opens at minute ${p.at}</span></summary>` +
    `<p class="probe-text">${inl(p.text)}</p><details class="probe-answer"><summary>What a strong answer covers</summary><ul>${p.strong_answer.map((s) => `<li>${inl(s)}</li>`).join('')}</ul></details>` +
    `<label class="probe-pre"><input type="checkbox" class="preempted" data-probe="${k}"> I had already covered this before the card opened</label></details>`).join('');
  const rubric = `<details class="mock-card mock-rubric"><summary>Score yourself, after the timer</summary>${scale}${rubricTable(true)}<div class="mock-result" role="status" aria-live="polite"></div></details>`;
  const outlineCard = `<details class="mock-card mock-outline"><summary>Model outline (open after scoring)</summary>${outlineBody}</details>`;
  return `<section class="mock" data-mock="${esc(id)}" data-minutes="${m.minutes}">` +
    card('mock-prompt', 'Prompt', `<p class="mock-prompt-text">${inl(m.prompt)}</p>`) + runner + steps + clarify +
    `<div class="mock-probes">${probes}</div>${rubric}${outlineCard}</section>`;
}

// {{practice classic}}: Appendix E's prompts, each a collapsed card: the assumptions to use, then the crux behind
// a second reveal, so the reader tries the prompt before reading what a strong answer must find.
function renderPractice(group, ctx) {
  const list = practice.filter((p) => p.group === group);
  if (!list.length) return fail(`${ctx.file}: no practice prompts in group “${group}”`);
  const t = (s) => inl(inlineTokens(String(s ?? ''), ctx));
  return list.map((p) => {
    const crux = `<p>${t(p.crux)}</p><p class="review-link">Review: ${p.review.map((a) => reviewLink(a, ctx.root)).join(', ')}</p>`;
    return `<details class="refresher practice" id="${esc(p.id)}"${ctx.mode === 'print' ? ' open' : ''}><summary><span class="refresher-label">${esc(p.id)}</span> ${t(p.prompt)}</summary>` +
      `<div class="refresher-body"><p><strong>Assume:</strong> ${t(p.assume)}</p>` +
      (ctx.mode === 'print' ? `<p><strong>The crux:</strong></p>${crux}` : `<details class="crux-reveal"><summary>Reveal the crux</summary>${crux}</details>`) +
      '</div></details>';
  }).join('');
}

function renderAnswerKey(key, mockKeys, title) {
  let html = '';
  if (key.length) {
    html += `<section class="answer-key"><h2>Answer key · ${esc(title)}</h2><ol>${key.map((it) => {
      if (it.type === 'choice') return `<li><p class="key-prompt">${inl(it.prompt)}</p><p><strong>${inl(it.choices[it.answer])}.</strong> ${inl(it.why)}</p></li>`;
      return `<li><p class="key-prompt">${inl(it.prompt)}</p><ul>${it.idea_units.map((u) => `<li>${inl(u)}</li>`).join('')}</ul>` +
        (it.misconception ? `<p class="misconception"><strong>Common wrong answer:</strong> ${inl(it.misconception)}</p>` : '') +
        `<p class="review-link">Re-read: ${esc(label(it.review))}</p></li>`;
    }).join('')}</ol></section>`;
  }
  for (const k of mockKeys) html += `<section class="answer-key"><h2>Model outline · ${esc(k.title)}</h2>${k.outlineBody}</section>`;
  return html;
}

// ======================= render every written module (web), then time it =======================
const newCtx = (o) => ({ key: [], mockKeys: [], t: { figs: 0, code: 0, checks: 0, predicts: 0, inline: 0, pretest: 0 }, ...o });
function renderSection(mid, mode, extra = {}) {
  const { file, text } = sectionOf.get(mid);
  const root = mode === 'print' ? '../' : mid === HOME ? '' : '../../';
  const ctx = newCtx({ file, mid, mode, root, promote: mode === 'web' && mid !== HOME, ...extra });
  const html = md.render(preprocess(text, ctx), { module: mid })
    .replace(/(<div class="recap-card" data-recap>)([\s\S]*?)(<!--recap-end--><\/div>)/g, (m, a, inner, b) => a + wrapRecallBlocks(inner) + b);
  return { html, ctx };
}

const rendered = new Map(); // module id → { html, ctx, words, minutes }
for (const mid of order) {
  if (!written.has(mid)) continue;
  const m = modules.get(mid);
  const { html, ctx } = renderSection(mid, 'web');
  const mock = m.mock ? mocks.get(m.mock) : null;
  const words = mock ? countWords(mockText(mock)) : countWords(sectionOf.get(mid).text);
  const t = ctx.t;
  const minutes = mock ? (mock.minutes || 35) + MIN.mockScoring
    : Math.round(words / WPM + t.figs * MIN.fig + t.checks * MIN.check + t.predicts * MIN.predict + t.code * MIN.code + t.inline + t.pretest * MIN.pretest);
  if (!ctx.inshort) fail(`${sectionOf.get(mid).file}: module ${mid} has no “::: inshort” line`);
  rendered.set(mid, { html, ctx, words, minutes });
}
const minutesOf = (mid) => rendered.get(mid)?.minutes ?? modules.get(mid).minutes; // unwritten: the plan's minutes
const partTotal = (pid) => parts.get(pid).modules.reduce((a, m) => a + minutesOf(m.id), 0);
function leftFrom(mid) { // this module and the rest of its Part
  const mods = parts.get(modules.get(mid).part).modules;
  return mods.slice(mods.findIndex((m) => m.id === mid)).reduce((a, m) => a + minutesOf(m.id), 0);
}

// ======================= page pieces =======================
const SITE = 'System design interview guide';
const DESCRIPTION = 'A six-hour, self-contained guide to system design interviews, classic and LLM, in three Parts: foundations, going deeper and deep dives.';
const FOOTER = '<footer class="site-footer"><p>Built on <a href="https://github.com/donnemartin/system-design-primer">The System Design Primer</a> by Donne Martin and ' +
  '<a href="https://github.com/daneb/ai-system-design-primer">The AI System Design Primer</a> by daneb, both licensed ' +
  '<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Condensed, rewritten and extended; this guide is CC BY 4.0 too.</p>' +
  '<p>Your answers and progress are stored only in this browser.</p></footer>';
// A ladder on an indigo tile, inline so the site makes no extra request.
const FAVICON = `data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='#3843b8'/><path d='M11 7v18M21 7v18M11 11h10M11 16h10M11 21h10' stroke='#fff' stroke-width='2.5' stroke-linecap='round'/></svg>")}`;
const MENU_ICON = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
// Runs before the first paint, so the drawer and focus mode never flash into view while app.js loads.
const HEAD_SCRIPT = "<script>(function(d){d.classList.add('js');try{var s=JSON.parse(localStorage.getItem('sysdes-guide.v2'));if(s&&s.focus)d.classList.add('focus')}catch(e){}})(document.documentElement)</script>";
const LOOP_INTRO ='Every Part runs the same loop: frame the method, learn the classic and the LLM building blocks, see a design solved, do one yourself, then check what stuck.';
const EXTRA_PAGES = [['summary', 'One-page summary'], ['progress', 'Progress and error log'], ['glossary', 'Glossary'], ['numbers', 'Numbers'],
  ...appendixSources.map((s) => [s.meta.slug, s.meta.nav || appendixTitle(String(s.meta.id))]), ['all', 'Complete guide (print)']];

function rail(current, root) {
  const curPart = current.mid ? modules.get(current.mid).part : current.part;
  let h = `<div class="rail-head"><a class="rail-brand" href="${root || './'}"${current.mid === HOME ? ' aria-current="page"' : ''}>Start here</a></div><ol class="rail-parts">`;
  for (const pid of partIds) {
    const p = parts.get(pid);
    h += `<li class="rail-part part-${pid}"><details${curPart === pid ? ' open' : ''}><summary><span class="rail-part-name">Part ${pid} · ${esc(p.title)}</span>` +
      `<span class="rail-count" data-rail-count="${pid}">${partTotal(pid)} min</span></summary><ol class="rail-mods">` +
      `<li class="rail-overview"><a href="${partHref(pid, root)}"${current.part === pid && !current.mid ? ' aria-current="page"' : ''}>Overview</a></li>` +
      p.modules.map((m) => `<li data-mid="${m.id}"${written.has(m.id) ? '' : ' class="is-stub"'}><a href="${moduleHref(m.id, root)}"${current.mid === m.id ? ' aria-current="page"' : ''}>` +
        `<span class="rail-n">${m.id}</span> <span class="rail-t">${esc(m.title)}</span></a></li>`).join('') +
      '</ol></details></li>';
  }
  h += `</ol><ul class="rail-extra">${EXTRA_PAGES.map(([k, t]) => `<li><a href="${root}${k}/"${current.page === k ? ' aria-current="page"' : ''}>${t}</a></li>`).join('')}</ul>`;
  return h;
}

function page({ key, title, root, body, part, where, whereHref, left, line, current = {}, mainAttrs = '', description = DESCRIPTION }) {
  const whereEl = whereHref ? `<a class="topbar-where" href="${esc(whereHref)}">${where}</a>` : `<span class="topbar-where">${where}</span>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#fbfbf8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#131417" media="(prefers-color-scheme: dark)">
<title>${esc(title)} · ${SITE}</title>
<meta name="description" content="${esc(description)}">
${HEAD_SCRIPT}
<link rel="icon" href="${FAVICON}">
<link rel="stylesheet" href="${root}assets/style.css">
<link rel="stylesheet" href="${root}assets/print.css" media="print">
<script src="${root}assets/app.js" defer></script>
</head>
<body class="page-${key}${part ? ` part-${part}` : ''}">
<a class="skip-link" href="#main">Skip to content</a>
<header class="topbar">
<a class="topbar-menu" href="#rail" aria-label="Contents">${MENU_ICON}</a>
<a class="topbar-brand" href="${root || './'}">${SITE}</a>
${whereEl}${left ? `<span class="topbar-left">${left}</span>` : ''}
<button class="topbar-focus" type="button" aria-pressed="false" hidden>Focus</button>
${line === undefined ? '' : `<span class="topbar-line" style="--done: ${line}%" aria-hidden="true"></span>`}
</header>
<div class="layout">
<main id="main" class="content" tabindex="-1"${mainAttrs}>
${body}
</main>
<nav id="rail" class="rail" aria-label="Contents">${rail(current, root)}</nav>
</div>
${FOOTER}
</body>
</html>
`;
}

function pager(mid, root) {
  const m = modules.get(mid);
  const i = order.indexOf(mid);
  const nextMid = order[i + 1];
  let next;
  if (!nextMid) next = { href: `${root}summary/`, kicker: 'Finish with', title: 'The one-page summary' };
  else if (modules.get(nextMid).part !== m.part) {
    const np = modules.get(nextMid).part;
    next = { href: partHref(np, root), kicker: `Next: Part ${np}`, title: parts.get(np).title };
  } else next = { href: moduleHref(nextMid, root), kicker: 'Next', title: `${nextMid} ${modules.get(nextMid).title}` };
  let prev = null;
  if (m.n > 1) prev = { href: moduleHref(order[i - 1], root), title: `${order[i - 1]} ${modules.get(order[i - 1]).title}` };
  else if (mid !== HOME) prev = { href: partHref(m.part, root), title: `Part ${m.part} overview` };
  return '<nav class="pager" aria-label="Next and previous">' +
    `<a class="pager-next" href="${esc(next.href)}" rel="next"${written.has(mid) ? ` data-done="${esc(mid)}"` : ''}>` +
    `<span class="pager-kicker">${esc(next.kicker)}</span><span class="pager-title">${esc(next.title)}</span></a>` +
    (prev ? `<a class="pager-prev" href="${esc(prev.href)}" rel="prev">Previous: ${esc(prev.title)}</a>` : '') + '</nav>';
}

const count = (n, one, many) => (n ? `<span>${n} ${n === 1 ? one : many}</span>` : '');

function partCards(root) {
  return `<ol class="part-cards">${partIds.map((pid) => {
    const p = parts.get(pid);
    return `<li class="part-card part-${pid}"><a href="${partHref(pid, root)}"><span class="pc-kicker">Part ${pid}</span>` +
      `<span class="pc-title">${esc(p.title)}</span><span class="pc-tag">${esc(p.tagline)}</span>` +
      `<span class="pc-meta">About ${partTotal(pid)} min · ${p.modules.length} modules</span>` +
      `<span class="pc-progress" data-part-progress="${pid}" hidden></span></a></li>`;
  }).join('')}</ol>`;
}

function stubBody(m) {
  const mock = m.mock ? mocks.get(m.mock) : null;
  const planned = (m.blocks || []).map((b) => `<li>${esc(b.title)} ${stars(b.tier)}</li>`).join('');
  return '<div class="module-body stub"><div class="in-short"><p class="in-short-label">In short</p>' +
    '<p>This module is being rewritten for the six-hour guide. Its plan is below; everything around it already works.</p></div>' +
    (mock ? `<h2>The mock</h2><p class="mock-prompt-text">${inl(mock.prompt)}</p><p>A ${mock.minutes}-minute timed run with probe cards at minutes ${mock.probes.map((p) => p.at).join(', ')}, then a rubric and a readiness verdict.</p>` : '') +
    (planned ? `<h2>Planned topics</h2><ul class="planned">${planned}</ul>` : '') + '</div>';
}

function modulePage(mid) {
  const m = modules.get(mid);
  const p = parts.get(m.part);
  const root = mid === HOME ? '' : '../../';
  const r = rendered.get(mid);
  const left = leftFrom(mid);
  const total = partTotal(m.part);
  const mainAttrs = r ? ` data-mid="${mid}"` : '';
  if (mid === HOME) {
    const body = `<header class="hero"><p class="eyebrow">Start here</p><h1>${SITE}</h1>` +
      '<p class="tagline">From zero to the senior bar in about six hours, for classic and LLM system design.</p>' +
      `<p class="hero-meta">${partIds.length} Parts · ${order.length} modules · questions with answers · two timed mocks</p></header>` +
      '<div class="continue" data-continue hidden></div>' +
      r.html.replace('<!--part-cards-->', partCards(root)) + pager(mid, root);
    return page({ key: 'home', title: 'Start here', root, part: m.part, body, where: 'Start here', current: { mid }, mainAttrs });
  }
  const meta = r
    ? `<span class="meta-time">About ${r.minutes} min</span>${count((m.blocks || []).length, 'topic', 'topics')}${count(r.ctx.t.checks, 'question', 'questions')}`
    : `<span class="meta-time">Planned: about ${m.minutes} min</span>`;
  const body = `<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="${partHref(m.part, root)}">Part ${m.part} · ${esc(p.title)}</a></li>` +
    `<li><span aria-current="page">${esc(mid)}</span></li></ol></nav>` +
    `<header class="module-header"><p class="eyebrow">Module ${esc(mid)} · ${m.n} of ${m.of}</p><h1>${esc(m.title)}</h1>` +
    `<p class="module-meta">${meta}<span>${left} min left in Part ${m.part}</span></p></header>` +
    (r ? `<div class="module-body">${r.html}</div>` : stubBody(m)) + pager(mid, root);
  return page({
    key: 'module', title: `${mid} ${m.title}`, root, part: m.part, body, current: { mid }, mainAttrs,
    where: `Part ${m.part} <span aria-hidden="true">›</span> ${esc(mid)}`, whereHref: partHref(m.part, root),
    left: `${left} min left`, line: Math.round((100 * (total - left)) / total),
  });
}

function landingPage(pid) {
  const p = parts.get(pid);
  const root = '../';
  const groups = [];
  for (const m of p.modules) {
    let g = groups.find((x) => x.stage === m.stage);
    if (!g) groups.push((g = { stage: m.stage, mods: [] }));
    g.mods.push(m);
  }
  const row = (m) => `<li data-mid="${m.id}" class="mod${written.has(m.id) ? '' : ' is-stub'}"><a href="${moduleHref(m.id, root)}">` +
    `<span class="mod-n">${m.id}</span><span class="mod-t">${esc(m.title)}${written.has(m.id) ? '' : '<span class="mod-soon">Being rewritten</span>'}</span>` +
    `<span class="mod-m">${minutesOf(m.id)} min</span></a></li>`;
  const first = p.modules[0];
  const nextPart = partIds[partIds.indexOf(pid) + 1];
  const note = {
    1: `New to system design? Begin at module 1.1. Some experience already? The pretest on <a href="${root}">Start here</a> takes 7 minutes and tells you whether to skip to Part 2.`,
    2: `Starting here? The pretest on <a href="${root}">Start here</a> tells you whether you can skip Part 1. Each module opens with refreshers that link back to it.`,
    3: 'Part 3 builds on Parts 1 and 2. Each module opens with refreshers that link back to what it assumes.',
  }[pid];
  const body = `<header class="part-hero"><p class="eyebrow">Part ${pid} of ${partIds.length}</p><h1>${esc(p.title)}</h1>` +
    `<p class="tagline">${esc(p.tagline)}</p><p class="part-meta">About ${partTotal(pid)} minutes · ${p.modules.length} modules</p>` +
    `<div class="part-progress" data-part-progress="${pid}" hidden></div></header>` +
    `<section class="outcomes" aria-labelledby="outcomes-h"><h2 id="outcomes-h">After this Part you can</h2><ul>${p.outcomes.map((o) => `<li>${inl(o)}</li>`).join('')}</ul></section>` +
    `<p class="cta"><a class="button button-primary" href="${moduleHref(first.id, root)}" data-start="${pid}" data-after="${nextPart ? partHref(nextPart, root) : `${root}summary/`}" ` +
    `data-after-label="${esc(nextPart ? `Next: Part ${nextPart} · ${parts.get(nextPart).title}` : 'Finish with the one-page summary')}">Start Part ${pid} at ${esc(first.id)}</a></p>` +
    `<section class="loop" aria-labelledby="loop-h"><h2 id="loop-h">The loop</h2><p class="loop-intro">${LOOP_INTRO}</p><ol class="stages">` +
    groups.map((g) => `<li class="stage"><h3 class="stage-name">${esc(outline.stages[g.stage])}</h3><ol class="mods">${g.mods.map(row).join('')}</ol></li>`).join('') +
    `</ol></section>${note ? `<p class="part-note">${note}</p>` : ''}`;
  return page({ key: 'landing', title: `Part ${pid}: ${p.title}`, root, part: pid, body, where: `Part ${pid} · ${esc(p.title)}`, current: { part: pid } });
}

// Each heading and what follows it becomes one recall block, hidden behind the heading in recall mode.
function wrapRecallBlocks(html) {
  return html.split(/(?=<h[2-4][\s>])/).map((chunk) => {
    if (!/^<h[2-4][\s>]/.test(chunk)) return chunk;
    const wide = /RESHAPE/.test(chunk.slice(0, 120)) ? ' span-all' : '';
    return `<section class="recall-block${wide}">${chunk}</section>`;
  }).join('');
}
const plainPage = (key, eyebrow, title, meta, inner, where = title) => page({
  key, title, root: '../', where: esc(where), current: { page: key },
  body: `<header class="page-header"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${meta ? `<p class="part-meta">${meta}</p>` : ''}</header>${inner}`,
});

const writePage = (rel, html) => {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
};

// ======================= pages =======================
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });

for (const mid of order) writePage(mid === HOME ? 'index.html' : `part-${modules.get(mid).part}/${slugOf(mid)}/index.html`, modulePage(mid));
for (const pid of partIds) writePage(`part-${pid}/index.html`, landingPage(pid));

// Summary
if (summarySource) {
  const ctx = newCtx({ file: summarySource.file, root: '../', mode: 'web' });
  const html = md.render(preprocess(summarySource.body, ctx), {});
  writePage('summary/index.html', page({
    key: 'summary', title: 'The one-page summary', root: '../', where: 'One-page summary', current: { page: 'summary' },
    body: `<div class="summary-tools" data-summary-tools></div><div class="summary-body">${wrapRecallBlocks(html)}</div>`,
  }));
}

// Progress
{
  const root = '../';
  const data = {
    items: [...items.values()].filter((it) => it.idea_units).map((it) => ({
      id: it.id, type: TYPE_LABEL[it.type] || it.type, prompt: inl(it.prompt),
      units: it.idea_units.map((u) => inl(u)), mis: it.misconception ? inl(it.misconception) : '',
      href: href(it.review, root), label: label(it.review), from: it.spaced ? it.review.split('#')[0] : '',
    })),
    checkpoints: [...checkpointRegistry.values()],
    mocks: order.filter((mid) => modules.get(mid).mock && written.has(mid)).map((mid) => {
      const mk = mocks.get(modules.get(mid).mock);
      return { id: mk.id, title: `${mid} ${modules.get(mid).title}`, href: moduleHref(mid, root), lines: mk.rubric.length };
    }).concat(appendixMocks.filter((a) => mocks.has(a.id)).map((a) => ({
      id: a.id, title: `Appendix ${a.src.meta.id} · Mock C: ${mocks.get(a.id).title} (optional)`, href: `${root}${a.src.meta.slug}/`, lines: mocks.get(a.id).rubric.length,
    }))),
    parts: partIds.map((pid) => ({
      id: pid, title: parts.get(pid).title, href: partHref(pid, root),
      modules: parts.get(pid).modules.map((m) => ({ id: m.id, minutes: minutesOf(m.id), written: written.has(m.id) })),
    })),
    pretest: { href: `${root}#pretest`, pass: PRETEST_PASS },
  };
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  writePage('progress/index.html', plainPage('progress', 'Your record', 'Progress and error log',
    'Kept only in this browser. Save it to a file to move it to another device or to keep it safe.',
    `<div id="progress-app"><p>Progress needs JavaScript turned on.</p></div><script type="application/json" id="guide-data">${json}</script>`));
}

// Glossary (Appendix B). Where a term first appears: its bold definition or first [[term]] in a module; else the
// module named by `in` (one that teaches it in other words); else the first module, question or mock that mentions
// it; else the summary or an appendix. A term used nowhere fails the build, so the list can't collect leftovers.
{
  const escRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Short one-word aliases (“hit”, “batch”) match too much prose, so the search uses the term and longer aliases only.
  const names = (t) => [t.term, ...(t.aliases || []).filter((a) => /[\s-]/.test(a) || a.length >= 6 || /^[A-Z]{2,}/.test(a))];
  const mentions = (t) => new RegExp(`(?<![\\w-])(?:${names(t).map(escRe).join('|')})(?:s|es)?(?![\\w-])`, 'i');
  const itemText = (it) => [it.prompt, it.answer, it.why, it.misconception, ...(it.choices || []), ...(it.scaffold || []), ...(it.idea_units || [])]
    .filter((x) => typeof x === 'string').join('\n');
  const itemHome = (it) => it.module || (it.type === 'choice' ? HOME : it.id.split('-')[0]);
  const places = order.filter((mid) => written.has(mid)).map((mid) => {
    const m = modules.get(mid);
    const text = [sectionOf.get(mid).text, ...[...items.values()].filter((it) => itemHome(it) === mid && it.type !== 'choice').map(itemText), // the pretest's wrong options teach nothing
      m.mock && mocks.has(m.mock) ? mockText(mocks.get(m.mock)) : ''].join('\n');
    return { label: mid, href: moduleHref(mid, '../'), text };
  });
  if (summarySource) places.push({ label: 'Summary', href: '../summary/', text: summarySource.body });
  for (const src of appendixSources) {
    const groups = [...src.body.matchAll(/^\{\{\s*practice\s+(\w+)\s*\}\}\s*$/gm)].map((m) => m[1]);
    const extra = practice.filter((pr) => groups.includes(pr.group)).map((pr) => [pr.prompt, pr.assume, pr.crux].join('\n'))
      .concat(appendixMocks.filter((a) => a.src === src && mocks.has(a.id)).map((a) => mockText(mocks.get(a.id))));
    places.push({ label: `Appendix ${src.meta.id}`, href: `../${src.meta.slug}/`, text: [src.body, ...extra].join('\n') });
  }
  const whereFirst = (t) => {
    const mid = termFirst.get(t.id) || t.in;
    if (mid) {
      if (!modules.has(mid)) { fail(`glossary: “${t.term}” has in: “${mid}”, which isn't a module`); return null; }
      return { label: mid, href: moduleHref(mid, '../') };
    }
    const re = mentions(t);
    return places.find((pl) => re.test(pl.text)) || null;
  };
  const sorted = [...glossary].sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));
  const rows = sorted.map((t) => {
    const at = whereFirst(t);
    if (!at) fail(`glossary: “${t.term}” isn't used anywhere in the guide; use it or remove it`);
    return `<tr id="term-${esc(t.id)}"><th scope="row">${esc(t.term)}${t.aliases?.length ? `<span class="aliases">also: ${esc(t.aliases.join(', '))}</span>` : ''}</th>` +
      `<td data-label="Meaning">${inl(t.def)}</td><td data-label="First appears in">${at ? `<a href="${esc(at.href)}">${esc(at.label)}</a>` : '·'}</td></tr>`;
  }).join('');
  writePage('glossary/index.html', plainPage('glossary', 'Appendix B', 'Glossary',
    `${glossary.length} terms. Each is defined in plain words where it first appears; this list is for looking one up.`,
    `<div class="table-wrap"><table class="glossary reflow"><thead><tr><th scope="col">Term</th><th scope="col">Meaning</th><th scope="col">First appears in</th></tr></thead><tbody>${rows}</tbody></table></div>`));
}

// Numbers (Appendix C)
{
  const list = [...numbers.values()];
  const table = (tier) => '<div class="table-wrap"><table class="numbers reflow"><thead><tr><th scope="col">Figure</th><th scope="col">Value</th><th scope="col">As of</th><th scope="col">Source</th></tr></thead><tbody>' +
    list.filter((n) => n.tier === tier).map((n) => `<tr id="num-${esc(n.id)}"><th scope="row">${esc(n.label)}</th>` +
      `<td data-label="Value">${esc(n.value)}${n.working ? `<span class="working">${esc(n.working)}</span>` : ''}</td><td data-label="As of">${esc(n.as_of)}</td><td data-label="Source">${esc(n.source)}</td></tr>`).join('') +
    '</tbody></table></div>';
  writePage('numbers/index.html', plainPage('numbers', 'Appendix C', 'Numbers',
    'Every figure the guide uses, once, plus a few classic reference figures. Figures that change carry a date; “derived” means our own arithmetic, shown beneath the value.',
    `<h2>Memorise these</h2><p>All of them are on the one-page summary.</p>${table('memorise')}<h2>Reference</h2>${table('reference')}`));
}

// Appendices D–F
for (const src of appendixSources) {
  const id = String(src.meta.id);
  const ctx = newCtx({ file: src.file, root: '../', mode: 'web' });
  const html = md.render(preprocess(src.body, ctx), {});
  writePage(`${src.meta.slug}/index.html`, plainPage(src.meta.slug, `Appendix ${id}`, appendixTitle(id), src.meta.intro || '', html, src.meta.nav || appendixTitle(id)));
}

// Complete guide, for printing and Ctrl+F: questions in place, answer keys at the end of each Part.
{
  let body = '';
  for (const pid of partIds) {
    const key = [];
    const mockKeys = [];
    let html = '';
    for (const m of parts.get(pid).modules) {
      if (!written.has(m.id)) continue;
      if (m.id === HOME) { // of Start here, only the pretest is worth printing
        const ctx = newCtx({ file: sectionOf.get(HOME).file, mid: HOME, mode: 'print', root: '../', key, mockKeys });
        if (/^\{\{\s*pretest\s*\}\}\s*$/m.test(sectionOf.get(HOME).text)) html += `<section class="print-module"><h2 id="${HOME}">${HOME} Pretest</h2>${renderPretest(ctx)}</section>`;
        continue;
      }
      const { html: inner } = renderSection(m.id, 'print', { key, mockKeys });
      html += `<section class="print-module"><h2 id="${m.id}">${esc(m.id)} ${esc(m.title)}</h2>${inner}</section>`;
    }
    if (html) body += `<section class="print-part"><h1 class="part-title">Part ${pid} · ${esc(parts.get(pid).title)}</h1>${html}${renderAnswerKey(key, mockKeys, `Part ${pid}`)}</section>`;
  }
  if (summarySource) {
    const ctx = newCtx({ file: summarySource.file, root: '../', mode: 'print' });
    body += `<section class="print-part print-summary"><div class="summary-body">${wrapRecallBlocks(md.render(preprocess(summarySource.body, ctx), {}))}</div></section>`;
  }
  for (const src of appendixSources) {
    const key = [];
    const mockKeys = [];
    const ctx = newCtx({ file: src.file, root: '../', mode: 'print', key, mockKeys });
    const html = md.render(preprocess(src.body, ctx), {});
    body += `<section class="print-part"><h1 class="part-title">Appendix ${esc(src.meta.id)} · ${esc(appendixTitle(String(src.meta.id)))}</h1>${html}${renderAnswerKey(key, mockKeys, `Appendix ${src.meta.id}`)}</section>`;
  }
  writePage('all/index.html', plainPage('all', 'Print view', 'Complete guide',
    'Everything written so far, in order. Questions stay in place; answers are in a key at the end of each Part.', body));
}

// Assets. CSS loses its comments and spacing; quoted strings are left exactly as written.
const minCss = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').split(/("(?:[^"\\]|\\.)*")/).map((chunk, i) => (i % 2 ? chunk
  : chunk.replace(/\s+/g, ' ').replace(/\s*([{};,>])\s*/g, '$1').replace(/:\s+/g, ':').replace(/;}/g, '}'))).join('').trim();
for (const f of fs.readdirSync('site/css')) fs.writeFileSync(path.join(OUT, 'assets', f), minCss(readText(path.join('site/css', f))));
for (const f of fs.readdirSync('site/js')) fs.copyFileSync(path.join('site/js', f), path.join(OUT, 'assets', f));
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

// ======================= report =======================
const pad = (s, n) => String(s).padStart(n);
console.log('Module   words  budget   diff  minutes  planned');
for (const [mid, r] of rendered) {
  const m = modules.get(mid);
  const diff = Math.round((100 * (r.words - m.words)) / m.words);
  const flag = m.mock ? '  (a mock: its run plus scoring)' : Math.abs(diff) > 10 ? '  ✗ words outside ±10%' : '';
  console.log(`${mid.padEnd(7)} ${pad(r.words, 6)} ${pad(m.words, 7)} ${pad(`${diff > 0 ? '+' : ''}${diff}%`, 6)} ${pad(r.minutes, 8)} ${pad(m.minutes, 8)}${flag}`);
}
console.log('\nPart   minutes  budget  written');
let all = 0;
for (const pid of partIds) {
  const p = parts.get(pid);
  const total = partTotal(pid);
  all += total;
  const done = p.modules.filter((m) => written.has(m.id)).length;
  const off = Math.abs(total - p.minutes) > p.minutes * 0.05;
  console.log(`${pid.padEnd(6)} ${pad(total, 7)} ${pad(p.minutes, 7)} ${pad(`${done} of ${p.modules.length}`, 8)}${off ? '  ✗ outside ±5% of budget' : ''}`);
}
console.log(`All    ${pad(all, 7)} ${pad(360, 7)}${all > 360 ? '  ✗ over six hours' : ''}`);

const kb = (f) => fs.statSync(path.join(OUT, f)).size / 1024;
const over = [];
for (const f of fs.readdirSync(OUT, { recursive: true }).map(String).filter((f) => f.endsWith('.html'))) {
  const limit = /^part-\d\/\d+-\d+\//.test(f) ? 200 : /^part-\d\/index/.test(f) ? 100 : null;
  if (limit && kb(f) > limit) over.push(`${f}: ${kb(f).toFixed(0)} KB, over ${limit} KB`);
}
if (kb('assets/app.js') > 40) over.push(`assets/app.js: ${kb('assets/app.js').toFixed(1)} KB, over 40 KB`);
if (kb('assets/style.css') > 24) over.push(`assets/style.css: ${kb('assets/style.css').toFixed(1)} KB, over 24 KB`);
const pages = fs.readdirSync(OUT, { recursive: true }).filter((f) => String(f).endsWith('.html'));
console.log(`\nWrote ${pages.length} pages to ${OUT}/ · app.js ${kb('assets/app.js').toFixed(1)} KB · style.css ${kb('assets/style.css').toFixed(1)} KB`);
for (const o of over) console.log(`  ✗ ${o}`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n${[...new Set(errors)].map((e) => `  ✗ ${e}`).join('\n')}`);
  process.exit(1);
}
