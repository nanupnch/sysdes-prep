// Navigation and practice features for the study site. Every page works without this file; it adds:
// the contents drawer and focus mode, module status and Continue, confidence-before-reveal and
// self-scoring, check routing, the error log, the pretest, the mock runner, summary recall mode,
// the progress page with export and import, glossary pop-ups and full-screen diagrams.
// Everything is stored in this browser only (localStorage); nothing is sent anywhere.
(() => {
  'use strict';

  const KEY = 'sysdes-guide.v2';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked or full */ } };
  const update = (fn) => { const s = load(); fn(s); save(s); return s; };

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const el = (tag, attrs = {}, html = '') => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') e.className = v; else e.setAttribute(k, v === true ? '' : v);
    }
    if (html) e.innerHTML = html;
    return e;
  };
  const escapeHtml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  const now = () => new Date().toISOString();
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const uniqueBy = (list, key) => { const seen = new Set(); return list.filter((x) => (seen.has(x[key]) ? false : seen.add(x[key]))); };
  const doc = document.documentElement;
  doc.classList.add('js');
  const root = (() => { const link = $('link[rel="stylesheet"]'); return link ? link.getAttribute('href').replace(/assets\/style\.css$/, '') : ''; })();
  const CONF = [['sure', 'Sure'], ['unsure', 'Unsure'], ['guess', 'Guess']];
  const CONF_ORDER = { sure: 0, unsure: 1, guess: 2 };
  const record = (id) => ((load().items || {})[id]);
  const setRecord = (id, fn) => update((s) => { s.items = s.items || {}; s.items[id] = fn(s.items[id] || {}); });
  const isDone = (s, mid) => !!(s.done || {})[mid];
  const markDone = (mid) => { update((s) => { s.done = s.done || {}; s.done[mid] = s.done[mid] || now(); }); statuses(); };
  const bar = (n, of) => `<span class="bar"><span style="--w: ${pct(n, of)}%"></span></span>`;

  // ---------- the contents drawer (phones) and focus mode (desktop) ----------
  function shell() {
    const link = $('.topbar-menu'); // without JavaScript, a link that jumps to the contents at the page's end
    const rail = $('#rail');
    if (!link || !rail) return;
    const menu = el('button', { type: 'button', class: 'topbar-menu', 'aria-label': 'Contents', 'aria-controls': 'rail', 'aria-expanded': 'false' }, link.innerHTML);
    link.replaceWith(menu);
    const close = el('button', { type: 'button', class: 'rail-close', 'aria-label': 'Close contents' }, '×');
    $('.rail-head', rail).append(close);
    const backdrop = el('div', { class: 'backdrop', hidden: true });
    document.body.append(backdrop);
    const others = ['.skip-link', '.topbar', 'main', '.site-footer'].map((s) => $(s)).filter(Boolean);
    const isOpen = () => doc.classList.contains('drawer-open');
    const setOpen = (open) => {
      doc.classList.toggle('drawer-open', open);
      menu.setAttribute('aria-expanded', String(open));
      backdrop.hidden = !open;
      others.forEach((n) => n.toggleAttribute('inert', open)); // keeps keyboard and screen-reader focus inside
      if (open) ($('[aria-current="page"]', rail) || close).focus(); else menu.focus();
    };
    menu.addEventListener('click', (ev) => { ev.preventDefault(); setOpen(true); });
    close.addEventListener('click', () => setOpen(false));
    backdrop.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && isOpen()) setOpen(false); });
    window.matchMedia('(min-width: 56.25rem)').addEventListener('change', (ev) => { if (ev.matches && isOpen()) setOpen(false); });

    const focusBtn = $('.topbar-focus');
    if (!focusBtn) return;
    const apply = (on) => {
      doc.classList.toggle('focus', on);
      focusBtn.setAttribute('aria-pressed', String(on));
      focusBtn.textContent = on ? 'Show contents' : 'Focus';
    };
    focusBtn.hidden = false;
    apply(!!load().focus);
    focusBtn.addEventListener('click', () => { const on = !doc.classList.contains('focus'); apply(on); update((s) => { s.focus = on; }); });
  }

  // ---------- where you are: ticks in the rail and on landing pages, Part progress, Continue ----------
  function statuses() {
    const s = load();
    $$('li[data-mid]').forEach((li) => li.classList.toggle('is-done', isDone(s, li.dataset.mid)));
    const railMods = (pid) => $$(`.rail-part.part-${pid} li[data-mid]`);
    $$('[data-rail-count]').forEach((span) => {
      const lis = railMods(span.dataset.railCount);
      const n = lis.filter((li) => isDone(s, li.dataset.mid)).length;
      if (n) span.textContent = `${n} of ${lis.length} done`;
    });
    $$('[data-part-progress]').forEach((box) => {
      const lis = railMods(box.dataset.partProgress);
      const n = lis.filter((li) => isDone(s, li.dataset.mid)).length;
      box.hidden = !n;
      if (n) box.innerHTML = `${n} of ${lis.length} modules done${bar(n, lis.length)}`;
    });
    const cta = $('[data-start]');
    if (cta) { // continue after the furthest module done in this Part
      const rows = $$('.mods li[data-mid]');
      let last = -1;
      rows.forEach((li, i) => { if (isDone(s, li.dataset.mid)) last = i; });
      const next = rows[last + 1];
      if (last >= 0) {
        if (next) {
          cta.href = $('a', next).getAttribute('href');
          cta.textContent = `Continue: ${$('.mod-n', next).textContent} ${$('.mod-t', next).firstChild.textContent}`;
        } else {
          cta.href = cta.dataset.after;
          cta.textContent = cta.dataset.afterLabel;
        }
      }
    }
    const cont = $('[data-continue]');
    const last = s.last && /^\d+\.\d+$/.test(s.last.mid) ? s.last.mid : null;
    const here = $('main[data-mid]');
    const link = last && (!here || here.dataset.mid !== last) ? $(`.rail li[data-mid="${last}"] a`) : null;
    if (cont && link) {
      cont.innerHTML = `<a href="${escapeHtml(link.getAttribute('href'))}"><span class="continue-kicker">Continue where you left off</span>` +
        `<span class="continue-title">${escapeHtml(link.textContent.trim())}</span></a>`;
      cont.hidden = false;
    }
  }

  function trackModule() {
    const main = $('main[data-mid]');
    if (!main) return;
    update((s) => { s.last = { mid: main.dataset.mid, ts: now() }; });
    const next = $('.pager-next[data-done]');
    if (next) next.addEventListener('click', () => markDone(next.dataset.done));
  }

  // ---------- one question: attempt → confidence → reveal → tick ----------
  function enhanceItem(li, onChange) {
    const id = li.dataset.item;
    const details = $('.item-answer', li);
    if (!details || li.dataset.ready) return;
    li.dataset.ready = '1';
    const answer = el('div', { class: 'answer', hidden: true });
    answer.append(...$('.answer-body', details).childNodes);
    details.replaceWith(answer);
    const group = el('div', { class: 'confidence', role: 'group', 'aria-label': 'How sure are you? Choosing reveals the answer.' },
      '<span class="confidence-label">How sure are you? Choose to reveal the answer:</span>');
    const buttons = CONF.map(([value, text]) => {
      const b = el('button', { type: 'button', 'data-conf': value, 'aria-pressed': 'false' }, text);
      group.append(b);
      return b;
    });
    answer.before(group);
    const score = el('p', { class: 'item-score', 'aria-live': 'polite' });
    answer.append(score);
    const boxes = $$('.idea-units input[type="checkbox"]', answer);
    const attempt = $('.item-attempt', li);

    const showScore = () => { score.textContent = `You got ${boxes.filter((b) => b.checked).length} of ${boxes.length} points.`; };
    const reveal = (conf, store) => {
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.conf === conf)));
      answer.hidden = false;
      li.classList.add('answered');
      if (store) setRecord(id, (r) => ({ ...r, conf, tries: r.conf ? r.tries || 1 : (r.tries || 0) + 1, got: boxes.map((b) => b.checked), ts: now() }));
      showScore();
      if (onChange) onChange();
    };

    const saved = record(id);
    if (saved) {
      if (attempt && saved.attempt) attempt.value = saved.attempt;
      (saved.got || []).forEach((g, k) => { if (boxes[k]) boxes[k].checked = !!g; });
      if (saved.conf) reveal(saved.conf, false);
    }
    buttons.forEach((b) => b.addEventListener('click', () => reveal(b.dataset.conf, true)));
    boxes.forEach((b) => b.addEventListener('change', () => {
      setRecord(id, (r) => ({ ...r, got: boxes.map((x) => x.checked), ts: now() }));
      showScore();
      if (onChange) onChange();
    }));
    if (attempt) attempt.addEventListener('input', debounce(() => setRecord(id, (r) => ({ ...r, attempt: attempt.value.slice(0, 4000) })), 400));
  }

  // ---------- a check: score and routing once every question is revealed; the module is then done ----------
  function enhanceCheckpoint(sec) {
    const mid = sec.dataset.checkpoint;
    const lis = $$('.item', sec);
    const result = $('.checkpoint-result', sec);
    const refresh = () => {
      const recs = lis.map((li) => record(li.dataset.item));
      if (recs.some((r) => !r || !r.conf)) { result.hidden = true; return; }
      let got = 0;
      let total = 0;
      let confident = 0;
      const missed = [];
      lis.forEach((li, i) => {
        const n = $$('.idea-units input', li).length;
        const g = (recs[i].got || []).filter(Boolean).length;
        got += g;
        total += n;
        if (g < n) {
          const a = $('.review-link a', li);
          if (a) missed.push({ href: a.getAttribute('href'), label: a.textContent });
          if (recs[i].conf === 'sure') confident++;
        }
      });
      const p = pct(got, total);
      update((s) => { s.checkpoints = s.checkpoints || {}; s.checkpoints[mid] = { pct: p, ts: now() }; });
      if (!isDone(load(), mid)) markDone(mid);
      const links = uniqueBy(missed, 'href').map((m) => `<a href="${escapeHtml(m.href)}">${escapeHtml(m.label)}</a>`).join(', ');
      let cls;
      let msg;
      if (p >= 80) { cls = 'result-good'; msg = `<strong>${p}%. Carry on.</strong>`; }
      else if (p >= 50) { cls = 'result-warn'; msg = `<strong>${p}%. Re-read the linked blocks, 5 minutes at most, then carry on:</strong> ${links}.`; }
      else { cls = 'result-bad'; msg = `<strong>${p}%. Re-read the linked blocks before moving on:</strong> ${links}. What you missed is in your error log, ready to re-test.`; }
      if (confident) msg += `<span class="confident-miss">You were sure about ${confident} of the questions you missed. Those are the most useful to review: confident errors are the easiest to fix once you see the answer.</span>`;
      msg += ` <a href="${root}progress/">Open your error log</a>.`;
      result.className = `checkpoint-result ${cls}`;
      result.innerHTML = msg;
      result.hidden = false;
    };
    lis.forEach((li) => enhanceItem(li, refresh));
    refresh();
  }

  // ---------- predict first: keep the guess, show it again at the end of the module ----------
  function echoPrediction(id) {
    const value = ((load().predictions || {})[id] || '').trim();
    $$('.revisit-item').filter((d) => d.dataset.predict === id).forEach((d) => {
      const p = $('.revisit-yours', d);
      p.hidden = !value;
      p.innerHTML = value ? `<strong>Your guess:</strong> ${escapeHtml(value)}` : '';
    });
  }
  function enhancePredict(aside) {
    const id = aside.dataset.predict;
    const box = $('textarea', aside);
    const saved = (load().predictions || {})[id];
    if (saved) box.value = saved;
    box.addEventListener('input', debounce(() => {
      update((s) => { s.predictions = s.predictions || {}; s.predictions[id] = box.value.slice(0, 2000); });
      echoPrediction(id);
    }, 300));
    echoPrediction(id);
  }

  // ---------- pretest: one question answered, where to begin ----------
  function enhancePretest(form) {
    const qs = $$('.pt-q', form);
    const btn = $('.pt-score', form);
    const out = $('.pt-result', form);
    const pass = Number(form.dataset.pass);
    qs.forEach((q) => { $('.pt-why', q).hidden = true; });
    btn.hidden = false;
    const chosen = () => Object.fromEntries(qs.map((q) => [q.dataset.item, $('input:checked', q)]).filter(([, i]) => i).map(([k, i]) => [k, Number(i.value)]));
    const score = (store) => {
      const by = {};
      let right = 0;
      let blank = 0;
      qs.forEach((q) => {
        const sel = $('input:checked', q);
        const ok = !!sel && Number(sel.value) === Number(q.dataset.answer);
        if (!sel) blank++;
        q.classList.toggle('pt-correct', ok);
        q.classList.toggle('pt-wrong', !ok);
        $('.pt-why', q).hidden = false;
        const a = q.dataset.area;
        by[a] = by[a] || [0, 0];
        by[a][1]++;
        if (ok) { by[a][0]++; right++; }
      });
      const areas = Object.entries(by).map(([a, [r, t]]) => `${escapeHtml(a)}: ${r} of ${t}`).join(' · ');
      out.innerHTML = `<p><strong>You got ${right} of ${qs.length}</strong>${blank ? ` (${blank} left blank)` : ''}. ${areas}. Each question now shows its answer.</p>` +
        (right >= pass
          ? `<p>That's ${pass} or more: you have the foundations. Start at Part 2; its refreshers link back whenever something is new.</p><a class="button button-primary" href="${escapeHtml(form.dataset.part2)}">Start at Part 2</a>`
          : `<p>Start with Part 1. It builds everything these questions test, from zero.</p><a class="button button-primary" href="${escapeHtml(form.dataset.part1)}">Start Part 1: ${escapeHtml(form.dataset.part1Label)}</a>`);
      out.hidden = false;
      if (!store) return;
      update((s) => { s.pretest = { answers: chosen(), right, total: qs.length, ts: now() }; });
      const home = $('main[data-mid]');
      if (home) markDone(home.dataset.mid); // Start here is done once its pretest is scored
    };
    const saved = load().pretest;
    if (saved && saved.answers) {
      qs.forEach((q) => {
        const v = saved.answers[q.dataset.item];
        const input = v === undefined ? null : $(`input[value="${v}"]`, q);
        if (input) input.checked = true;
      });
      if (saved.right !== undefined) score(false);
    }
    form.addEventListener('change', () => update((s) => { s.pretest = { ...(s.pretest || {}), answers: chosen() }; }));
    btn.addEventListener('click', () => { score(true); out.scrollIntoView({ block: 'nearest' }); });
  }

  // ---------- mock runner ----------
  const STEPS = [['Requirements', 4], ['Estimate', 3], ['Surface & schema', 3], ['High-level design', 6], ['Analyse', 12], ['Pressure-test', 5], ['Evaluate', 2]];
  const fmt = (secs) => { const s = Math.max(0, Math.round(secs)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  function enhanceMock(sec) {
    const id = sec.dataset.mock;
    const total = Number(sec.dataset.minutes) * 60;
    const runner = $('.mock-runner', sec);
    runner.hidden = false;
    const timeEl = $('.mock-time', runner);
    const cueEl = $('.mock-cue', runner);
    const startBtn = $('.mock-start', runner);
    const resetBtn = $('.mock-reset', runner);
    const reviewBtn = $('.mock-review', runner);
    const stepLis = $$('.mock-steps li', sec);
    const probes = $$('.probe', sec);
    const rubric = $('.mock-rubric', sec);
    const questions = $('.mock-questions', sec);
    const rows = $$('.rubric tbody tr', sec);
    const fresh = () => ({ elapsed: 0, review: false, scores: {}, pre: [], questions: '' });
    let state = { ...fresh(), ...((load().mocks || {})[id] || {}) };
    let running = false;
    let t0 = 0;
    let timer = null;

    const elapsed = () => state.elapsed + (running ? (Date.now() - t0) / 1000 : 0);
    const persist = () => update((s) => { s.mocks = s.mocks || {}; s.mocks[id] = { ...state, elapsed: Math.floor(elapsed()), ts: now() }; });

    function render() {
      const e = elapsed();
      timeEl.textContent = fmt(total - e);
      let acc = 0;
      let idx = STEPS.length - 1;
      for (let i = 0; i < STEPS.length; i++) {
        if (e < (acc + STEPS[i][1]) * 60) { idx = i; break; }
        acc += STEPS[i][1];
      }
      let start = 0;
      for (let i = 0; i < idx; i++) start += STEPS[i][1];
      const started = running || e > 0;
      runner.classList.toggle('idle', !started || e >= total); // pinned only between Start and time up
      stepLis.forEach((li, i) => {
        li.classList.toggle('now', started && e < total && i === idx);
        li.classList.toggle('past', started && (i < idx || e >= total));
      });
      if (e >= total) cueEl.textContent = 'Time. Score yourself with the rubric below.';
      else if (!started) cueEl.textContent = 'Press Start when you are ready. Talk out loud and draw on paper.';
      else cueEl.textContent = `${STEPS[idx][0]}, until minute ${start + STEPS[idx][1]}${running ? '' : ' (paused)'}`;
      probes.forEach((p) => {
        const at = Number(p.dataset.at) * 60;
        const locked = !state.review && e < at;
        p.classList.toggle('locked', locked);
        if (locked) p.open = false;
        $('.probe-when', p).textContent = locked ? (started ? `opens in ${fmt(at - e)}` : `opens at minute ${p.dataset.at}`) : 'open it now';
      });
      startBtn.textContent = running ? 'Pause' : (e > 0 && e < total ? 'Resume' : 'Start');
      startBtn.disabled = e >= total;
      reviewBtn.setAttribute('aria-pressed', String(state.review));
    }
    function stop() {
      if (!running) return;
      state.elapsed = Math.min(total, elapsed());
      running = false;
      clearInterval(timer);
      render();
      persist();
    }
    function tick() {
      if (elapsed() >= total) { stop(); rubric.open = true; }
      render();
    }
    function start() {
      if (running || elapsed() >= total) return;
      running = true;
      t0 = Date.now();
      timer = setInterval(tick, 1000);
      render();
      persist();
    }

    function score() {
      const out = $('.mock-result', sec);
      const lines = rows.map((tr) => ({ step: tr.dataset.step, v: state.scores[tr.dataset.line], href: tr.dataset.review, label: tr.dataset.reviewLabel }));
      const scored = lines.filter((l) => l.v !== undefined).length;
      if (!scored) { out.innerHTML = ''; return; }
      const got = lines.reduce((a, l) => a + (l.v || 0), 0);
      const max = lines.length * 2;
      const p = pct(got, max);
      const critical = ['Requirements', 'Estimate', 'Analyse', 'Pressure-test'];
      const noZero = lines.filter((l) => critical.includes(l.step)).every((l) => l.v !== 0);
      const depth = lines.filter((l) => l.step === 'Analyse' || l.step === 'Pressure-test');
      const depthAvg = depth.reduce((a, l) => a + (l.v || 0), 0) / (depth.length || 1);
      const preempted = (state.pre || []).some(Boolean);
      const all = scored === lines.length;
      const checks = [
        [p >= 75, `At least 75% overall (yours: ${p}%)`],
        [noZero, 'No zero on a Requirements, Estimate, Analyse or Pressure-test line'],
        [depthAvg >= 1.5, `Analyse and Pressure-test lines average 1.5 or more (yours: ${depthAvg.toFixed(1)})`],
        [preempted, 'At least one probe already handled before its card opened'],
      ];
      const ready = all && checks.every(([ok]) => ok);
      state.result = { pct: p, ready, all, got, max };
      persist();
      const weak = uniqueBy(lines.filter((l) => l.v !== undefined && l.v < 2), 'href');
      out.innerHTML = `<p class="mock-score"><strong>${got} of ${max} (${p}%)</strong> · ${scored} of ${lines.length} lines scored</p>` +
        `<ul class="readiness">${checks.map(([ok, text]) => `<li class="${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'} ${escapeHtml(text)}</li>`).join('')}</ul>` +
        `<p class="verdict ${ready ? 'ok' : 'no'}">${all ? (ready ? 'Ready at the senior bar on this prompt.' : 'Not yet. Review the weak lines, then try a fresh prompt from Appendix E tomorrow.') : 'Score every line to get a verdict.'}</p>` +
        (weak.length ? `<p class="where">Where to review: ${weak.map((w) => `<a href="${escapeHtml(w.href)}">${escapeHtml(w.label)}</a>`).join(', ')}</p>` : '');
    }

    startBtn.addEventListener('click', () => (running ? stop() : start()));
    resetBtn.addEventListener('click', () => {
      if (!window.confirm('Reset this mock? The timer, your questions and your scores for it will be cleared.')) return;
      clearInterval(timer);
      running = false;
      state = fresh();
      $$('input', sec).forEach((i) => { i.checked = false; });
      if (questions) questions.value = '';
      probes.forEach((p) => { p.open = false; });
      persist();
      render();
      score();
    });
    reviewBtn.addEventListener('click', () => { state.review = !state.review; render(); persist(); });
    probes.forEach((p) => $('summary', p).addEventListener('click', (ev) => { if (p.classList.contains('locked')) ev.preventDefault(); }));
    document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });
    if (questions) {
      questions.value = state.questions || '';
      questions.addEventListener('input', debounce(() => { state.questions = questions.value.slice(0, 4000); persist(); }, 400));
    }
    rows.forEach((tr) => {
      const v = state.scores[tr.dataset.line];
      const input = v === undefined ? null : $(`input[value="${v}"]`, tr);
      if (input) input.checked = true;
    });
    $$('.preempted', sec).forEach((cb) => {
      cb.checked = !!(state.pre || [])[Number(cb.dataset.probe)];
      cb.addEventListener('change', () => { state.pre = state.pre || []; state.pre[Number(cb.dataset.probe)] = cb.checked; persist(); score(); });
    });
    sec.addEventListener('change', (ev) => {
      if (!ev.target.matches('.rubric input[type="radio"]')) return;
      state.scores[ev.target.closest('tr').dataset.line] = Number(ev.target.value);
      score();
    });
    render();
    score();
  }

  // ---------- recall mode: the summary and each recap card ----------
  function enhanceRecall(body, tools, withPrint) {
    const toggle = el('button', { type: 'button', 'aria-pressed': 'false' }, 'Recall mode');
    const showAll = el('button', { type: 'button', hidden: true }, 'Show all');
    tools.append(el('p', { class: 'summary-help' }, 'In recall mode, each block hides behind its heading. Say what is in it out loud, then show it and check.'), toggle, showAll);
    if (withPrint) {
      const print = el('button', { type: 'button' }, 'Print one page');
      tools.append(print);
      print.addEventListener('click', () => window.print());
    }
    $$('.recall-block > h2, .recall-block > h3', body).forEach((h) => {
      const block = h.parentElement;
      const btn = el('button', { type: 'button', class: 'recall-show', 'aria-expanded': 'false' }, 'Show');
      h.append(btn);
      h.addEventListener('click', () => {
        if (!body.classList.contains('recall-on')) return;
        const open = block.classList.toggle('revealed');
        btn.setAttribute('aria-expanded', String(open));
        btn.textContent = open ? 'Hide' : 'Show';
      });
    });
    const setAll = (revealed) => $$('.recall-block', body).forEach((b) => {
      b.classList.toggle('revealed', revealed);
      const btn = $('.recall-show', b);
      if (btn) { btn.setAttribute('aria-expanded', String(revealed)); btn.textContent = revealed ? 'Hide' : 'Show'; }
    });
    toggle.addEventListener('click', () => {
      const on = !body.classList.contains('recall-on');
      body.classList.toggle('recall-on', on);
      toggle.setAttribute('aria-pressed', String(on));
      showAll.hidden = !on;
      setAll(false);
    });
    showAll.addEventListener('click', () => setAll(true));
  }

  // ---------- progress page ----------
  function buildItem(it) {
    const li = el('li', { class: 'item', 'data-item': it.id });
    li.innerHTML = `<p class="item-meta"><span class="item-type">${escapeHtml(it.type)}</span>${it.from ? `<span class="item-tag">From ${escapeHtml(it.from)}</span>` : ''}</p>` +
      `<p class="item-prompt">${it.prompt}</p>` +
      '<textarea class="item-attempt" rows="3" aria-label="Your answer" placeholder="Your answer (optional; paper works too)"></textarea>' +
      '<details class="item-answer"><summary>Reveal the answer</summary><div class="answer-body">' +
      `<p class="answer-instruction">Tick each point you got:</p><ul class="idea-units">${it.units.map((u, k) => `<li><label><input type="checkbox" data-unit="${k}"><span>${u}</span></label></li>`).join('')}</ul>` +
      (it.mis ? `<p class="misconception"><strong>Common wrong answer:</strong> ${it.mis}</p>` : '') +
      `<p class="review-link">Missed something? Re-read <a href="${escapeHtml(it.href)}">${escapeHtml(it.label)}</a>.</p></div></details>`;
    return li;
  }

  function renderProgress(app) {
    const data = JSON.parse($('#guide-data').textContent);
    const byId = new Map(data.items.map((it) => [it.id, it]));
    const table = (heads, rows) => `<div class="table-wrap"><table class="reflow"><thead><tr>${heads.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead>` +
      `<tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td data-label="${heads[i]}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    const draw = (message) => {
      const s = load();
      const recs = s.items || {};
      const answered = Object.entries(recs).filter(([id, r]) => r.conf && byId.has(id));
      const gotOf = (r) => (r.got || []).filter(Boolean).length;
      const log = answered
        .filter(([id, r]) => gotOf(r) < byId.get(id).units.length)
        .map(([id, r]) => ({ id, r, it: byId.get(id), frac: gotOf(r) / byId.get(id).units.length }))
        .sort((a, b) => (CONF_ORDER[a.r.conf] - CONF_ORDER[b.r.conf]) || (a.frac - b.frac));
      const mods = data.parts.flatMap((p) => p.modules);
      const doneN = mods.filter((m) => isDone(s, m.id)).length;
      const cps = data.checkpoints.map((c) => {
        let got = 0;
        let tot = 0;
        let n = 0;
        for (const id of c.items) {
          const r = recs[id];
          tot += byId.get(id).units.length;
          if (r && r.conf) { n++; got += gotOf(r); }
        }
        return { ...c, n, p: n === c.items.length ? pct(got, tot) : null };
      });
      const mocks = data.mocks.map((m) => ({ ...m, r: (s.mocks || {})[m.id] }));
      const stat = (v, t) => `<div class="stat"><strong>${v}</strong><span>${t}</span></div>`;

      let h = `<div class="stat-row">${stat(`${doneN} of ${mods.length}`, 'modules done')}${stat(answered.length, 'questions answered')}` +
        `${stat(log.length, 'in your error log')}${stat(log.filter((x) => x.r.conf === 'sure').length, 'confident misses')}</div>`;

      h += '<section class="progress-section"><h2>Parts</h2><ul class="part-rows">' + data.parts.map((p) => {
        const n = p.modules.filter((m) => isDone(s, m.id)).length;
        const left = p.modules.filter((m) => !isDone(s, m.id)).reduce((a, m) => a + m.minutes, 0);
        return `<li class="part-${p.id}"><a href="${escapeHtml(p.href)}">Part ${p.id} · ${escapeHtml(p.title)}</a>: ${n} of ${p.modules.length} modules done, about ${left} min left${bar(n, p.modules.length)}</li>`;
      }).join('') + '</ul></section>';

      h += '<section class="progress-section"><h2>Error log</h2>';
      if (!log.length) h += '<p>Nothing here yet. Every question you reveal with a point unticked lands here, confident misses first.</p>';
      else {
        h += '<p>Confident misses come first: they are the easiest errors to fix once you see the answer. Re-test each one; it leaves the log when you get every point.</p><ul class="log">' +
          log.map(({ id, r, it }) => `<li class="log-item${r.conf === 'sure' ? ' confident' : ''}">` +
            `<p class="item-prompt">${it.prompt}</p>` +
            `<p class="log-meta"><span>${escapeHtml(id)}</span><span>You were ${escapeHtml(r.conf)}</span><span>${gotOf(r)} of ${it.units.length} points</span>${r.tries > 1 ? `<span>${r.tries} tries</span>` : ''}</p>` +
            `<ul class="missed">${it.units.filter((u, k) => !(r.got || [])[k]).map((u) => `<li>${u}</li>`).join('')}</ul>` +
            `<p class="review-link">Re-read <a href="${escapeHtml(it.href)}">${escapeHtml(it.label)}</a> · <button type="button" class="retest" data-id="${escapeHtml(id)}">Re-test now</button></p></li>`).join('') + '</ul>';
      }
      h += '</section>';

      if (cps.length) {
        h += `<section class="progress-section"><h2>Checks</h2>${table(['Module', 'Answered', 'Score'], cps.map((c) =>
          [`<a href="${escapeHtml(c.href)}">${escapeHtml(c.title)}</a>`, `${c.n} of ${c.items.length}`, c.p === null ? 'Not yet' : `${c.p}%${c.p >= 80 ? ' ✓' : ''}`]))}</section>`;
      }
      if (mocks.length) {
        h += `<section class="progress-section"><h2>Mock interviews</h2>${table(['Mock', 'Score', 'Senior bar'], mocks.map((m) => {
          const res = m.r && m.r.result;
          return [`<a href="${escapeHtml(m.href)}">${escapeHtml(m.title)}</a>`, res ? `${res.pct}%` : 'Not scored', res ? (res.all ? (res.ready ? 'Ready ✓' : 'Not yet') : 'Partly scored') : '·'];
        }))}<p>Ready means at least 75% on both mocks, no zero on a Requirements, Estimate, Analyse or Pressure-test line, an average of 1.5 or more on Analyse and Pressure-test, and at least one probe handled before its card opened.</p></section>`;
      }
      const pre = s.pretest && s.pretest.right !== undefined ? s.pretest : null;
      h += '<section class="progress-section"><h2>Pretest</h2>' + (pre
        ? `<p>You got ${pre.right} of ${pre.total}: ${pre.right >= data.pretest.pass ? 'start at Part 2' : 'start with Part 1'}. <a href="${escapeHtml(data.pretest.href)}">See your answers</a>.</p>`
        : `<p>Not taken yet. <a href="${escapeHtml(data.pretest.href)}">Take the pretest</a> on Start here (about 7 minutes).</p>`) + '</section>';

      h += '<section class="progress-section"><h2>Move or back up your progress</h2><p>Save your progress to a file, then load it on another device or after clearing this browser. ' +
        'The file holds your answers, scores and notes for this guide, and nothing else.</p>' +
        '<p class="actions"><button type="button" class="export">Save to a file</button><input type="file" id="import-file" class="sr-only" accept="application/json,.json"><label class="button" for="import-file">Load from a file</label></p>' +
        `${message ? `<p role="status">${message}</p>` : ''}</section>`;
      h += '<section class="progress-section"><h2>Start over</h2><p>This clears every answer, score and note in this browser.</p><button type="button" class="reset-all">Clear my progress</button></section>';
      app.innerHTML = h;

      $$('.retest', app).forEach((b) => b.addEventListener('click', () => {
        const id = b.dataset.id;
        setRecord(id, (r) => ({ ...r, conf: undefined, got: [], attempt: '' }));
        const list = el('ol', { class: 'items' });
        const li = buildItem(byId.get(id));
        list.append(li);
        b.closest('.log-item').replaceWith(list);
        const doneBtn = el('p', {}, '<button type="button">Done: update my log</button>');
        list.after(doneBtn);
        $('button', doneBtn).addEventListener('click', () => draw());
        enhanceItem(li);
      }));
      $('.export', app).addEventListener('click', () => {
        const blob = new Blob([JSON.stringify({ app: 'sysdes-guide', version: 2, saved: now(), state: load() }, null, 1)], { type: 'application/json' });
        const a = el('a', { href: URL.createObjectURL(blob), download: `system-design-progress-${now().slice(0, 10)}.json` });
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      });
      const file = $('#import-file', app);
      file.addEventListener('change', async () => {
        const f = file.files && file.files[0];
        if (!f) return;
        try {
          const d = JSON.parse(await f.text());
          if (!d || d.app !== 'sysdes-guide' || !d.state || typeof d.state !== 'object') throw new Error('not ours');
          if (!window.confirm('Replace the progress in this browser with the one in the file? What is here now will be overwritten.')) { file.value = ''; return; }
          save(d.state);
          draw(`Loaded the progress saved on ${escapeHtml(String(d.saved || '').slice(0, 10))}.`);
        } catch {
          draw('That file isn’t a progress file from this guide, so nothing was changed.');
        }
      });
      $('.reset-all', app).addEventListener('click', () => {
        if (!window.confirm('Clear all your progress in this browser? This cannot be undone, unless you saved it to a file first.')) return;
        try { localStorage.removeItem(KEY); } catch { /* ignore */ }
        draw('Progress cleared.');
      });
    };
    draw();
  }

  // ---------- glossary terms: one pop-up, kept inside the screen ----------
  function enhanceTerms() {
    const terms = $$('.term');
    if (!terms.length) return;
    const pop = el('div', { class: 'term-pop', role: 'tooltip', id: 'term-pop', hidden: true });
    document.body.append(pop);
    let cur = null;
    const hide = () => { pop.hidden = true; if (cur) cur.removeAttribute('aria-describedby'); cur = null; };
    const show = (t) => {
      cur = t;
      pop.textContent = t.dataset.def;
      pop.hidden = false;
      t.setAttribute('aria-describedby', 'term-pop');
      const r = t.getBoundingClientRect();
      const vw = doc.clientWidth;
      const left = Math.min(Math.max(8, r.left), vw - pop.offsetWidth - 8);
      const below = r.bottom + pop.offsetHeight + 12 <= window.innerHeight || r.top < pop.offsetHeight + 12;
      pop.style.left = `${left + window.scrollX}px`;
      pop.style.top = `${(below ? r.bottom + 6 : r.top - pop.offsetHeight - 6) + window.scrollY}px`;
    };
    terms.forEach((t) => {
      t.addEventListener('mouseenter', () => show(t));
      t.addEventListener('mouseleave', () => { if (document.activeElement !== t) hide(); });
      t.addEventListener('focus', () => show(t));
      t.addEventListener('blur', hide);
    });
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') hide(); });
  }

  // ---------- diagrams: open full size, to pan and pinch-zoom ----------
  function enhanceFigures() {
    const figs = $$('.figure');
    if (!figs.length || typeof HTMLDialogElement !== 'function') return;
    const dlg = el('dialog', { class: 'fig-dialog', 'aria-label': 'Diagram at full size' },
      '<div class="fig-dialog-bar"><p></p><button type="button">Close</button></div><div class="fig-dialog-art"></div>');
    document.body.append(dlg);
    let open = null; // { svg, home, style }
    dlg.addEventListener('close', () => {
      if (!open) return;
      if (open.style === null) open.svg.removeAttribute('style'); else open.svg.setAttribute('style', open.style);
      open.home.append(open.svg);
      open.btn.focus();
      open = null;
    });
    $('button', dlg).addEventListener('click', () => dlg.close());
    figs.forEach((fig) => {
      const art = $('.figure-art', fig);
      const svg = art && $('svg', art);
      const natural = svg && svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal.width : 0;
      if (!natural) return;
      const btn = el('button', { type: 'button', class: 'fig-expand' }, 'Open full size');
      fig.append(btn);
      const check = () => { if (!open || open.svg !== svg) btn.hidden = svg.getBoundingClientRect().width >= natural * 0.85 && art.scrollWidth <= art.clientWidth + 2; };
      check();
      window.addEventListener('resize', debounce(check, 200));
      btn.addEventListener('click', () => {
        open = { svg, home: art, style: svg.getAttribute('style'), btn };
        $('p', dlg).textContent = ($('figcaption', fig) || {}).textContent || svg.getAttribute('aria-label') || 'Diagram';
        svg.setAttribute('style', `width: ${Math.round(natural)}px; min-width: 0; max-width: none;`);
        $('.fig-dialog-art', dlg).append(svg);
        dlg.showModal();
      });
    });
  }

  // ---------- start ----------
  shell();
  statuses();
  trackModule();
  $$('.checkpoint[data-checkpoint]').forEach(enhanceCheckpoint);
  $$('[data-inline] .item').forEach((li) => enhanceItem(li));
  $$('aside[data-predict]').forEach(enhancePredict);
  $$('form[data-pretest]').forEach(enhancePretest);
  $$('.mock[data-mock]').forEach(enhanceMock);
  const tools = $('[data-summary-tools]');
  if (tools) enhanceRecall($('.summary-body'), tools, true);
  $$('[data-recap]').forEach((card) => {
    const bar = el('div', { class: 'summary-tools' });
    $('.recap-label', card).after(bar);
    enhanceRecall(card, bar, false);
  });
  const app = $('#progress-app');
  if (app) renderProgress(app);
  enhanceTerms();
  enhanceFigures();
  window.addEventListener('pageshow', (ev) => { if (ev.persisted) statuses(); }); // back from the next page: refresh ticks
})();
