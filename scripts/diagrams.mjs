// Render diagrams/src/*.mmd to diagrams/*.svg with mermaid-cli, then report each width.
// Usage: npm run diagrams            (only sources newer than their SVG)
//        npm run diagrams -- --all   (everything)    npm run diagrams -- cache-layers   (one)
// The first line of each source is "%% alt: …"; the second is "%% caption: …".
// Hand-written diagrams live in diagrams/src/<id>.svg with <!-- alt: … --> and <!-- caption: … --> comments.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const SRC = 'diagrams/src';
const OUT = 'diagrams';
const CONFIG = 'diagrams/mermaid-config.json';
const MAX_WIDTH = 1131; // px; wider SVGs shrink text below 11 px on an 830 px column
const mmdc = path.join('node_modules', '.bin', 'mmdc');

// Mermaid prints coordinates to 10+ decimal places, which is most of an SVG's weight, and it embeds
// every arrow marker and style rule it might need. Round to a tenth of a pixel (invisible at any zoom
// a reader uses), and drop markers and style rules that nothing in this diagram uses.
function slim(svg) {
  // Tokenise whole numbers as SVG does ("1.5.04" is 1.5 then .04), round those with 2+ decimals, write
  // fractions without a leading zero, and keep a separator wherever a rounded number would otherwise run
  // into its neighbour ("1.5.04" → "1.5 0"; ".04.05" → "0 .1").
  // Hex colours are matched first and kept whole: inside "#e0e7ff", "0e7" would otherwise read as 0 × 10⁷.
  svg = svg.replace(/#[0-9a-fA-F]{3,8}(?![\w-])|-?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][-+]?\d+)?/g, (n, offset, all) => {
    if (n[0] === '#' || !/\.\d{2,}|[eE]/.test(n)) return n;
    const r = Math.round(Number(n) * 10) / 10;
    let out = r === 0 ? '0' : String(r).replace(/^(-?)0\./, '$1.');
    if (/^\d/.test(out) && /[\d.]/.test(all[offset - 1] || '')) out = ' ' + out;
    if (!out.includes('.') && all[offset + n.length] === '.') out += ' ';
    return out;
  });
  const usedIds = new Set([...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]));
  svg = svg.replace(/<marker\b[^>]*\bid="([^"]+)"[\s\S]*?<\/marker>/g, (m, id) => (usedIds.has(id) ? m : ''));
  const body = svg.replace(/<style[\s\S]*?<\/style>/g, '');
  const classes = new Set([...body.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)));
  const keepSelector = (sel) => [...sel.matchAll(/\.([\w-]+)/g)].every((m) => classes.has(m[1]));
  return svg.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/g, (m, open, css, close) => {
    const rules = [];
    let i = 0;
    while (i < css.length) {                      // split top-level rules, respecting nested braces
      const brace = css.indexOf('{', i);
      if (brace < 0) break;
      let depth = 0, j = brace;
      for (; j < css.length; j++) { if (css[j] === '{') depth++; else if (css[j] === '}' && --depth === 0) break; }
      rules.push([css.slice(i, brace).trim(), css.slice(brace, j + 1)]);
      i = j + 1;
    }
    const kept = [];
    for (const [sel, block] of rules) {
      if (sel.startsWith('@keyframes')) { kept.push([sel, block]); continue; }
      if (sel.startsWith('@')) { kept.push([sel, block]); continue; }
      const parts = sel.split(',').map((x) => x.trim()).filter(keepSelector);
      if (parts.length) kept.push([parts.join(','), block]);
    }
    const text = kept.map(([sel, block]) => sel + block).join('');
    const usedAnimations = new Set([...text.matchAll(/animation:\s*([\w-]+)/g)].map((m) => m[1]));
    const final = kept.filter(([sel]) => !sel.startsWith('@keyframes') || usedAnimations.has(sel.split(/\s+/)[1]))
      .map(([sel, block]) => sel + block).join('');
    return open + final + close;
  });
}

const args = process.argv.slice(2);
const all = args.includes('--all');
const only = args.filter(a => !a.startsWith('--'));
let failed = 0;

for (const file of fs.readdirSync(SRC).filter(f => f.endsWith('.mmd')).sort()) {
  const id = path.basename(file, '.mmd');
  if (only.length && !only.includes(id)) continue;
  const src = path.join(SRC, file);
  const out = path.join(OUT, `${id}.svg`);
  const text = fs.readFileSync(src, 'utf8');
  if (!/^%%\s*alt:\s*\S/m.test(text)) { console.error(`✗ ${id}: missing "%% alt:" line`); failed++; continue; }
  const fresh = fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs;
  if (fresh && !all && !only.length) { console.log(`  up to date  ${id}`); continue; }
  try {
    execFileSync(mmdc, ['-i', src, '-o', out, '-c', CONFIG, '-b', 'transparent', '-I', `svg-${id}`, '-q'], { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (e) {
    console.error(`✗ ${id}: ${String(e.stderr || e.message).trim().split('\n').slice(-3).join(' ')}`);
    failed++;
    continue;
  }
  const svg = slim(fs.readFileSync(out, 'utf8'));
  fs.writeFileSync(out, svg);
  const vb = /viewBox="([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)"/.exec(svg);
  const width = vb ? Math.round(Number(vb[3])) : NaN;
  const tooWide = width > MAX_WIDTH;
  if (tooWide) failed++;
  console.log(`${tooWide ? '✗' : '✓'} rendered    ${id}  ${width} px wide${tooWide ? ` (limit ${MAX_WIDTH})` : ''}`);
}
// Hand-written SVG (for shapes Mermaid can't draw, such as the hash ring) is used as it is; just check it.
for (const file of fs.readdirSync(SRC).filter(f => f.endsWith('.svg')).sort()) {
  const id = path.basename(file, '.svg');
  if (only.length && !only.includes(id)) continue;
  const svg = fs.readFileSync(path.join(SRC, file), 'utf8');
  if (!/<!--\s*alt:\s*\S/.test(svg)) { console.error(`✗ ${id}: missing "<!-- alt: … -->" comment`); failed++; continue; }
  const vb = /viewBox="([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)"/.exec(svg);
  const width = vb ? Math.round(Number(vb[3])) : NaN;
  const tooWide = !(width <= MAX_WIDTH);
  if (tooWide) failed++;
  console.log(`${tooWide ? '✗' : '✓'} hand-drawn  ${id}  ${width} px wide${tooWide ? ` (limit ${MAX_WIDTH})` : ''}`);
}
process.exit(failed ? 1 : 0);
