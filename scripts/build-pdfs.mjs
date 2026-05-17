// Build well-designed PDFs of the English and Arabic user guides.
// Run: node scripts/build-pdfs.mjs
// Inputs:  docs/USER_GUIDE.md, docs/USER_GUIDE.ar.md, docs/screenshots/*.png
// Outputs: docs/Search-Maker-User-Guide.en.pdf, docs/Search-Maker-User-Guide.ar.pdf

import puppeteer from 'puppeteer';
import { marked } from 'marked';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const docsDir = join(root, 'docs');
const tmpDir = join(docsDir, '.pdf-tmp');

const ACCENT = '#2563eb';
const TEXT = '#0f172a';
const MUTED = '#475569';
const RULE = '#e2e8f0';
const SUBTLE = '#f1f5f9';
const CODE_BG = '#f8fafc';

const FONT_LATIN = `"Inter", "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif`;
const FONT_ARABIC = `"Geeza Pro", "SF Arabic", "Noto Naskh Arabic", "Arabic Typesetting", "Segoe UI", Tahoma, system-ui, sans-serif`;
const FONT_MONO = `"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace`;

function baseStyles({ rtl }) {
  const baseFont = rtl ? FONT_ARABIC : FONT_LATIN;
  const bodySize = rtl ? '11pt' : '10.5pt';
  const lineHeight = rtl ? 1.8 : 1.55;
  return `
    @page {
      size: A4;
      margin: 22mm 18mm 24mm 18mm;
    }
    @page :first {
      margin: 0;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      font-family: ${baseFont};
      font-size: ${bodySize};
      line-height: ${lineHeight};
      color: ${TEXT};
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body { direction: ${rtl ? 'rtl' : 'ltr'}; }
    .page-break { page-break-after: always; break-after: page; }

    /* Cover page — full bleed */
    .cover {
      position: relative;
      height: 297mm;
      width: 210mm;
      padding: 0;
      background:
        radial-gradient(circle at ${rtl ? '85% 18%' : '15% 18%'}, rgba(37, 99, 235, 0.18), transparent 55%),
        linear-gradient(180deg, #0b1220 0%, #0f172a 100%);
      color: #f8fafc;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
    }
    .cover-inner {
      position: absolute;
      inset: 26mm 22mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .cover-eyebrow {
      font-family: ${FONT_MONO};
      font-size: 9pt;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #93c5fd;
      margin: 0;
    }
    .cover-eyebrow.rtl-eyebrow { letter-spacing: 0; font-family: ${FONT_ARABIC}; font-size: 11pt; color: #93c5fd; }
    .cover-title {
      margin: 12mm 0 6mm;
      font-size: ${rtl ? '46pt' : '44pt'};
      line-height: 1.05;
      font-weight: 700;
      letter-spacing: ${rtl ? '0' : '-0.02em'};
    }
    .cover-subtitle {
      font-size: ${rtl ? '15pt' : '14pt'};
      line-height: 1.55;
      color: #cbd5e1;
      max-width: 150mm;
    }
    .cover-meta {
      display: flex;
      flex-direction: ${rtl ? 'row-reverse' : 'row'};
      justify-content: space-between;
      align-items: end;
      gap: 12mm;
      font-size: 10pt;
      color: #94a3b8;
      font-family: ${rtl ? FONT_ARABIC : FONT_LATIN};
    }
    .cover-meta .meta-block { display: flex; flex-direction: column; gap: 1mm; }
    .cover-meta .meta-label {
      font-family: ${FONT_MONO};
      font-size: 7.5pt;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #64748b;
    }
    .cover-meta.rtl .meta-label { font-family: ${FONT_ARABIC}; font-size: 9pt; letter-spacing: 0; }
    .cover-meta .meta-value { font-size: 11pt; color: #e2e8f0; }
    .cover-rule {
      width: 36mm;
      height: 3px;
      background: ${ACCENT};
      border: 0;
      margin: 0;
    }

    /* Body content */
    main {
      max-width: 175mm;
      margin: 0 auto;
    }

    h1, h2, h3, h4 {
      font-family: ${baseFont};
      color: ${TEXT};
      margin: 0;
    }
    main h1 {
      font-size: ${rtl ? '24pt' : '22pt'};
      margin: 18mm 0 6mm;
      line-height: 1.2;
      font-weight: 700;
      page-break-before: always;
      break-before: page;
    }
    main > h1:first-child { page-break-before: avoid; break-before: avoid; }
    .cover h1.cover-title { page-break-before: avoid; break-before: avoid; }
    h2 {
      font-size: ${rtl ? '17pt' : '15pt'};
      margin: 9mm 0 3mm;
      line-height: 1.25;
      font-weight: 700;
      color: ${TEXT};
      border-${rtl ? 'right' : 'left'}: 3px solid ${ACCENT};
      padding-${rtl ? 'right' : 'left'}: 4mm;
      page-break-after: avoid;
      break-after: avoid;
    }
    h3 {
      font-size: ${rtl ? '13pt' : '12pt'};
      margin: 6mm 0 2mm;
      font-weight: 600;
      color: ${TEXT};
      page-break-after: avoid;
      break-after: avoid;
    }
    h4 {
      font-size: ${rtl ? '12pt' : '11pt'};
      margin: 4mm 0 1mm;
      font-weight: 600;
      color: ${MUTED};
      page-break-after: avoid;
      break-after: avoid;
    }

    p { margin: 0 0 3mm; }
    ul, ol { margin: 0 0 3mm; padding-${rtl ? 'right' : 'left'}: 6mm; }
    li { margin-bottom: 1.2mm; }

    a { color: ${ACCENT}; text-decoration: none; }
    blockquote {
      margin: 4mm 0;
      padding: 3mm 5mm;
      background: ${SUBTLE};
      border-${rtl ? 'right' : 'left'}: 3px solid ${ACCENT};
      color: ${MUTED};
      font-size: 0.95em;
      border-radius: 0 4px 4px 0;
    }
    blockquote p:last-child { margin-bottom: 0; }

    code {
      font-family: ${FONT_MONO};
      font-size: 0.88em;
      background: ${CODE_BG};
      border: 1px solid ${RULE};
      border-radius: 3px;
      padding: 0.5mm 1.5mm;
      direction: ltr;
      unicode-bidi: embed;
    }
    pre {
      background: ${CODE_BG};
      border: 1px solid ${RULE};
      border-radius: 4px;
      padding: 3mm 4mm;
      overflow: hidden;
      direction: ltr;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    pre code {
      background: transparent;
      border: 0;
      padding: 0;
      font-size: 0.85em;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 3mm 0 5mm;
      font-size: 0.95em;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    thead th {
      background: ${SUBTLE};
      color: ${TEXT};
      font-weight: 600;
      text-align: ${rtl ? 'right' : 'left'};
      padding: 2.2mm 3mm;
      border-bottom: 2px solid ${RULE};
    }
    tbody td {
      padding: 2mm 3mm;
      border-bottom: 1px solid ${RULE};
      vertical-align: top;
    }
    tbody tr:nth-child(even) td { background: #fcfdff; }

    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 4mm auto;
      border: 1px solid ${RULE};
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    /* Smaller, prominent screenshot inline */
    figure { margin: 4mm 0; page-break-inside: avoid; break-inside: avoid; }

    hr {
      border: 0;
      border-top: 1px solid ${RULE};
      margin: 5mm 0;
    }

    strong { font-weight: 700; color: ${TEXT}; }
    em { font-style: italic; }

    /* Links keep colour but lose underline already; for print, keep them subtle */
    a { color: ${ACCENT}; }
    a:hover { text-decoration: none; }

    /* Numerals in Arabic body — keep Latin digits LTR-rendered to avoid
       the bidi mirror for things like "32 words" / "5×7" */
    .latin-inline { direction: ltr; unicode-bidi: isolate; display: inline-block; }
  `;
}

function coverHTML({ rtl, title, subtitle, eyebrow, version, date }) {
  const dirAttr = rtl ? 'rtl' : 'ltr';
  return `
  <section class="cover" dir="${dirAttr}">
    <div class="cover-inner">
      <div>
        <p class="cover-eyebrow ${rtl ? 'rtl-eyebrow' : ''}">${eyebrow}</p>
        <hr class="cover-rule" />
        <h1 class="cover-title">${title}</h1>
        <p class="cover-subtitle">${subtitle}</p>
      </div>
      <div class="cover-meta ${rtl ? 'rtl' : ''}">
        <div class="meta-block">
          <span class="meta-label">${rtl ? 'الإصدار' : 'Version'}</span>
          <span class="meta-value">${version}</span>
        </div>
        <div class="meta-block">
          <span class="meta-label">${rtl ? 'التاريخ' : 'Issued'}</span>
          <span class="meta-value">${date}</span>
        </div>
        <div class="meta-block">
          <span class="meta-label">${rtl ? 'المشروع' : 'Project'}</span>
          <span class="meta-value">Search Maker</span>
        </div>
      </div>
    </div>
  </section>
  `;
}

function wrapDocument({ rtl, title, body, cover, lang }) {
  return `<!doctype html>
<html lang="${lang}" dir="${rtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${baseStyles({ rtl })}</style>
</head>
<body>
  ${cover}
  <main>${body}</main>
</body>
</html>`;
}

// Pull a leading H1 off the rendered HTML (we use the cover instead) and
// drop the markdown intro lines that linked to the sibling translation —
// the cover and the bilingual nature is now established by the file itself.
function preprocessMarkdown(md) {
  // Drop the first H1 (cover already shows the title)
  md = md.replace(/^# .*\n+/, '');
  // Drop the leading blockquote that points at the other language
  md = md.replace(/^> .*\n+/, '');
  return md;
}

// Wrap inline code that contains Latin text in an RTL doc inside an LTR span
// so colons and slashes don't render mirrored. marked already preserves
// the raw text inside <code>; we just add `dir="ltr"` via CSS (already in
// the .code rule above using unicode-bidi: embed).

async function buildOne({ src, out, rtl, lang, title, subtitle, eyebrow, version, date }) {
  const raw = await readFile(src, 'utf8');
  const md = preprocessMarkdown(raw);
  marked.setOptions({ gfm: true, breaks: false });
  let body = marked.parse(md);

  // Rewrite image src="screenshots/foo.png" → absolute file:// URL so the
  // PDF render can resolve them regardless of where we write the temp HTML.
  const screenshotsBase = pathToFileURL(join(docsDir, 'screenshots') + '/').href;
  body = body.replace(/(<img[^>]+src=")screenshots\/([^"]+)(")/g, `$1${screenshotsBase}$2$3`);

  const cover = coverHTML({ rtl, title, subtitle, eyebrow, version, date });
  const html = wrapDocument({ rtl, title, body, cover, lang });

  await mkdir(tmpDir, { recursive: true });
  const htmlPath = join(tmpDir, rtl ? 'guide.ar.html' : 'guide.en.html');
  await writeFile(htmlPath, html, 'utf8');
  return htmlPath;
}

(async () => {
  const today = new Date().toISOString().slice(0, 10);
  const version = '1.0.0';

  const enHtml = await buildOne({
    src: join(docsDir, 'USER_GUIDE.md'),
    rtl: false,
    lang: 'en',
    title: 'Search Maker',
    subtitle: 'A user guide for the Arabic boolean query builder — Google, X / Twitter, and Facebook search composer that mixes Arabic terms with English-language operators without the bidirectional-text headaches.',
    eyebrow: 'USER GUIDE',
    version,
    date: today,
  });

  const arHtml = await buildOne({
    src: join(docsDir, 'USER_GUIDE.ar.md'),
    rtl: true,
    lang: 'ar',
    title: 'Search Maker',
    subtitle: 'دليل المستخدم لأداة بناء استعلامات البحث العربيّة — مُؤلِّفُ استعلامات Google وX (تويتر) وFacebook الذي يمزج الكلمات العربيّة مع عوامل البحث الإنجليزيّة دون قَلَق الكتابة ثنائيّة الاتّجاه.',
    eyebrow: 'دليل المستخدم',
    version,
    date: today,
  });

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  for (const [htmlPath, pdfName] of [
    [enHtml, 'Search-Maker-User-Guide.en.pdf'],
    [arHtml, 'Search-Maker-User-Guide.ar.pdf'],
  ]) {
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('print');
    const out = join(docsDir, pdfName);
    await page.pdf({
      path: out,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: `<div></div>`,
      footerTemplate: `
        <div style="font-family: ${FONT_LATIN}; font-size: 8pt; color: #94a3b8; width: 100%; padding: 0 18mm; display: flex; justify-content: space-between;">
          <span>Search Maker · User Guide</span>
          <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>`,
      margin: { top: '22mm', right: '18mm', bottom: '24mm', left: '18mm' },
    });
    console.log('built', pdfName);
  }

  await browser.close();
  console.log('done');
})();
