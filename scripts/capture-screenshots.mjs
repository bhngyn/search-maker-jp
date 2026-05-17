// One-shot screenshot capture for the user guide.
// Run: node scripts/capture-screenshots.mjs
// Requires the dev server running on http://localhost:5173.

import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'docs', 'screenshots');
const URL = 'http://localhost:5173/';

const VIEWPORT = { width: 1280, height: 900, deviceScaleFactor: 2 };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function capture(page, name) {
  await page.screenshot({ path: join(outDir, name) });
  console.log('saved', name);
}

async function captureClipped(page, name, selector) {
  const el = await page.$(selector);
  if (!el) {
    console.log('NOT FOUND', selector);
    return capture(page, name);
  }
  await el.screenshot({ path: join(outDir, name) });
  console.log('saved', name, '(clipped to', selector + ')');
}

async function focusComposer(page) {
  await page.evaluate(() => {
    document.querySelector('.composer-input')?.focus();
  });
}

async function reset(page) {
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await wait(400);
}

async function clickByText(page, text) {
  await page.evaluate((t) => {
    for (const b of document.querySelectorAll('button')) {
      if ((b.textContent || '').trim().includes(t)) {
        b.click();
        return;
      }
    }
  }, text);
}

(async () => {
  await mkdir(outDir, { recursive: true });
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  // 01 — overview / first paint
  await reset(page);
  await capture(page, '01-overview.png');

  // 02 — recipe panel open (Google)
  await reset(page);
  await page.click('.idiom-panel-pill').catch(() => {});
  await wait(600);
  await capture(page, '02-recipe-panel-open.png');

  // 03 — recipe inspector open (click first card)
  await page.evaluate(() => {
    const card = document.querySelector('#idiom-panel button[data-idiom-id]');
    if (card) card.click();
  });
  await wait(700);
  await capture(page, '03-recipe-inspector.png');

  // 04 — composer mid-typing (ghost preview + pills row)
  await reset(page);
  await focusComposer(page);
  await page.keyboard.type('صحافة استقصائية', { delay: 30 });
  await wait(400);
  await captureClipped(page, '04-composer-typing.png', '.composer');

  // 05 — chips committed (plain + quoted + negated)
  await reset(page);
  await focusComposer(page);
  await page.keyboard.type('صحافة استقصائية');
  await page.keyboard.press('Enter');
  await wait(200);
  await page.keyboard.type('"محمد علي"');
  await page.keyboard.press('Enter');
  await wait(200);
  await page.keyboard.type('-إعلان');
  await page.keyboard.press('Enter');
  await wait(400);
  await capture(page, '05-chips-mixed.png');

  // 06 — drawer open
  await reset(page);
  await clickByText(page, 'بناء المعادلة');
  await wait(500);
  await capture(page, '06-drawer-open.png');

  // 07 — X engine
  await reset(page);
  await clickByText(page, 'تويتر');
  await wait(500);
  await capture(page, '07-engine-x.png');

  // 08 — Facebook engine
  await reset(page);
  await clickByText(page, 'Facebook');
  await wait(500);
  await capture(page, '08-engine-facebook.png');

  // 09 — recipe pill (collapsed) clipped
  await reset(page);
  await wait(300);
  await captureClipped(page, '09-recipe-pill.png', '#idiom-panel');

  // 10 — sticky preview after building a small query
  await reset(page);
  await focusComposer(page);
  await page.keyboard.type('تحقيق');
  await page.keyboard.press('Enter');
  await wait(150);
  await page.keyboard.type('"اللاجئون"');
  await page.keyboard.press('Enter');
  await wait(400);
  await captureClipped(page, '10-preview.png', '.preview-section-sticky');

  // 11 — OR group (use the +أو on first chip)
  await reset(page);
  await focusComposer(page);
  await page.keyboard.type('صحافة');
  await page.keyboard.press('Enter');
  await wait(300);
  // Click the per-chip OR handle
  await page.evaluate(() => {
    const handle = document.querySelector('.chip-or-handle, [data-action="add-or"], button[title*="أو"]');
    if (handle) handle.click();
  });
  await wait(200);
  await page.keyboard.type('إعلام');
  await page.keyboard.press('Enter');
  await wait(400);
  await capture(page, '11-or-group.png');

  // 12 — Arabic normalization info popover
  await reset(page);
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'i');
    if (btn) btn.click();
  });
  await wait(400);
  await capture(page, '12-normalize-info.png');

  await browser.close();
  console.log('done');
})();
