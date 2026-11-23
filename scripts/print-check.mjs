// Print the summary page to PDF at A4 and Letter in headless Chrome and check it fits on one sheet.
// Usage: npm run build && npm run check:print        PDFs go to $PRINT_CHECK_DIR (default: the OS temp folder).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer';

const OUT_DIR = process.env.PRINT_CHECK_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'print-check-'));
const CHECKS = [{ page: 'summary/index.html', name: 'summary', maxPages: 1 }];
const countPages = (pdf) => (Buffer.from(pdf).toString('latin1').match(/\/Type\s*\/Page(?!s)/g) || []).length;

const browser = await puppeteer.launch({ headless: true });
let failed = 0;
try {
  for (const check of CHECKS) {
    const file = path.resolve('_site', check.page);
    if (!fs.existsSync(file)) throw new Error(`${file} not found; run npm run build first`);
    const page = await browser.newPage();
    await page.goto(`file://${file}`, { waitUntil: 'load' });
    for (const format of ['A4', 'Letter']) {
      const pdf = await page.pdf({ format, printBackground: true });
      const out = path.join(OUT_DIR, `${check.name}-${format}.pdf`);
      fs.writeFileSync(out, pdf);
      const n = countPages(pdf);
      const ok = n <= check.maxPages;
      if (!ok) failed++;
      console.log(`${ok ? '✓' : '✗'} ${check.name} at ${format}: ${n} page${n === 1 ? '' : 's'} (limit ${check.maxPages})  ${out}`);
    }
    // A picture of the print layout at A4 width (210 mm − 2 × 12 mm margins ≈ 703 px), for eyeballing.
    await page.setViewport({ width: 703, height: 1032, deviceScaleFactor: 1.5 });
    await page.emulateMediaType('print');
    const png = path.join(OUT_DIR, `${check.name}-print.png`);
    await page.screenshot({ path: png, fullPage: true });
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    console.log(`  print layout: ${height} px tall (one A4 page ≈ 1032 px)  ${png}`);
    await page.close();
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
