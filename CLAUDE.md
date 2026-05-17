# CLAUDE.md — Japanese Boolean Query Builder

## Purpose of this document

This file tells you, the implementing model, exactly what to build. The product is an interactive query composer that helps Japanese speakers construct advanced search queries across multiple engines (Google, X / Twitter, Facebook, Yahoo! JAPAN) using their respective English-language operators and filter conventions, without forcing them to memorize syntax or fight character-width inconsistencies.

The user's primary problems today: (a) IME context-switching and operator-memorization make operator-rich queries painful to type in mixed Japanese + ASCII contexts; (b) Japanese text appears in multiple width and script variants (full-width vs half-width ASCII, hiragana vs katakana vs kanji, kana vs romaji) that split a single name across multiple disjoint result sets unless they're normalized. The tool provides a **chip composer** for engines whose query language is a string of operators (Google, X / Twitter, Yahoo! JAPAN): each search term lives in its own chip, each boolean and content operator is a UI control rather than typed text, and the assembled query string only appears in a read-only LTR-rendered preview at the bottom. For Facebook (whose filters are a base64'd JSON blob in the URL), the tool drops the chip metaphor and substitutes a category-aware form in the same shell.

## Provenance

This codebase is a fork of **search_maker_ar** (Arabic Boolean Query Builder, https://github.com/bhngyn/search-maker) at `e699c71` on 2026-05-17. The Arabic codebase remains the source of truth for the unchanged architecture (chip system, engine controller, preview, warnings/tips infrastructure, OR-group machinery, paste parser, idiom panel). The JP fork's deltas are:

- **Localization** — UI strings translated to natural Japanese (not translated from Arabic).
- **No RTL** — `<html lang="ja" dir="ltr">`; language toggle is JA / EN; no `dir` flip across language changes.
- **Normalization** — Arabic substitutions replaced with NFKC (full-width ↔ half-width + half-katakana ↔ full-katakana).
- **New engine** — Yahoo! JAPAN, chip-based, operator subset of Google.
- **Renamed warning module** — `warnings/operator-arabic-chars.js` → `warnings/operator-non-latin-chars.js`. Engine descriptor field `arabicForbiddenOps` → `nonLatinForbiddenOps`. The `acceptsArabic` flag on operator descriptors is retained as a legacy field name; its meaning is "accepts non-Latin script" (Japanese kana/kanji are equivalent triggers).
- **Lean idiom catalog** — ~10 recipes per engine instead of the Arabic version's 35. The Arab-region tactical recipes (`arab-gov-tlds` OR-chain, `arabic-leak-stamps`, `transliteration-or`) have JP-region equivalents (`jp-gov-tld-chain` for `go.jp` / `lg.jp` / `ac.jp`, `kyujitai-shinjitai` for old/new kanji, `romaji-kana-name` for cross-script names).
- **No bilingual user docs** — `docs/USER_GUIDE.md` was not ported in v1. The README is the only user-facing doc.

## Hard constraints

These are non-negotiable. If you find yourself wanting to break one, stop and re-read this section.

The deliverable is a single self-contained HTML file: `dist/index.html` (copied to `dist/search_maker_jp.html` by the build script). The source lives under `src/` and compiles via Vite + `vite-plugin-singlefile` into one file with no runtime dependencies. The output must work when opened directly from the local filesystem with `file://` — no server, no fetches, no CDN. This matters because the intended user base includes researchers in adversarial environments. External runtime dependencies are a security and reliability liability.

The tool must persist nothing. No localStorage, no sessionStorage, no cookies, no IndexedDB, no service workers. State lives in memory only. Refreshing the page resets the tool to its blank initial state. Do not add a "recent searches" feature, do not save form state across reloads, do not offer to remember anything.

The interface language is Japanese (with an EN toggle). All visible labels, buttons, tooltips, placeholders, helper text, and error messages are in Japanese by default. The document `dir` attribute is `ltr` and stays `ltr` regardless of UI language. Latin-script content (operator names like `site:`, the assembled query preview, domain inputs) is rendered in explicit LTR contexts using `dir="ltr"` on the relevant elements.

The tool must never silently change a user's input. Every transformation applied to user-typed text — quoting a phrase, adding a minus sign, normalizing full-width to half-width, URL-encoding for the search button — must be visible in the live preview before the user takes any action. The preview is the contract between the tool and the user.

The build toolchain (Vite, npm devDependencies) is allowed because it produces a deliverable that satisfies all of the above. Do not add npm dependencies that ship to the user. The check is on the *output*, not the dev environment.

## User profile and design philosophy

The audience is Japanese-speaking journalists, researchers, OSINT analysts, citizen investigators, and curious newcomers. Digital literacy ranges from low (someone who uses Google but has never heard of a search operator) to medium to high (an OSINT professional who writes operator-rich queries by hand). The tool serves all three with a single mode.

The dominant design constraint is that the default experience must work for the low-literacy user without overwhelming them. A high-literacy user can endure a slightly verbose interface for thirty seconds; a low-literacy user who sees a wall of unfamiliar operators will close the tab and never return.

Therefore the helper system is on by default: a welcome blurb at the top, an OSINT recipe library panel as the obvious starting point, every chip shows its operator-name badge, the composer offers a single primary commit button (`追加`) plus the `+ 演算子を追加` drawer trigger, a ghost-chip preview sits below the input mirroring what would commit on Enter, a row of operator-conversion pills lets the user pick `intitle:`/`site:`/etc. before commit, and contextual tips and gentle warnings appear as the user works. Drag-to-reorder, Alt+Arrow keyboard reorder, and Shift+Click multi-select with the bulk-actions toolbar are also available without a separate "advanced" mode toggle.

## Search engines

The header carries an engine toggle: **Google**, **X / Twitter**, **Facebook**, **Yahoo! Japan**. Engine state lives in memory only; refreshing resets to Google. Switching engines preserves chip state for chip-based engines (Google ↔ X ↔ Yahoo! JAPAN); chips with operators that don't exist on the new engine fall back to plain keywords visually. The Facebook engine has its own form state, kept independent.

### Chip-based engines (Google, X, Yahoo! JAPAN)

These share the entire chip composer, drawer, OR-group machinery, paste parser, warnings/tips infrastructure, and sticky preview. The descriptor supplies what differs.

- **Google**: full Russell-grounded operator catalogue (`site`, `intitle`, `intext`, `inanchor`, `inurl`); proximity (`AROUND(N)`); number range (`..`); filetype; date range (`before` / `after`).
- **X / Twitter**: full operator catalogue per Igor Brigadir's `twitter-advanced-search` reference. Date range emits `since` / `until` instead of Google's `before` / `after`. X-specific chip types: `filter` (`filter:images`, `filter:replies`, etc.) and `engagement` (`min_faves:N`).
- **Yahoo! JAPAN**: Google-overlap subset. Supports `site`, `intitle`, `intext`, `inurl`, `filetype`, exact quotes, exclude, OR. **Does not** support `inanchor:`, proximity `AROUND(N)`, number-range `..`, or `before:` / `after:` date operators (Yahoo! has a separate URL-param date filter that is not exposed in the chip composer). Search URL: `https://search.yahoo.co.jp/search?p={query}&ei=UTF-8`.

### Form-based engine (Facebook)

When `body.engine-facebook` is on, the chip section, welcome panel, warnings region, tips region, and `+ 演算子を追加` drawer are hidden. `<section id="facebook-form">` shows in their place. The form is a category-aware reproduction of WhoPostedWhat: category bar at the top, required keyword card, per-category radio-pill filter rows, native HTML5 date pickers. URL assembly: the engine descriptor exposes `buildUrl(state)` that produces the base64'd JSON filter blob; see `src/engines/facebook.js` for the encoding. ID-driven filters (page ID, group ID, location ID, school ID, employer ID) are intentionally omitted — the form has no way to help an investigator discover those IDs.

## Information architecture and workflow

The page is a single vertical column. From top to bottom:

1. **Header** — title, subtitle (engine-driven), engine toggle (Google / X / Facebook / Yahoo! Japan), language toggle (JA / EN), normalization toggle with info popover.
2. **Welcome blurb** (dismissable; refresh restores it).
3. **OSINT recipe library panel** — collapsible catalog of ~10 pre-built operator recipes per chip-based engine. Default state is a collapsed pill; clicking expands to a grid of compact cards with a search input and group-filter chips. Clicking a card opens an inline inspector with anatomy, "build it manually" steps, and an Apply button. Hidden when Facebook is active.
4. **Chip section** — heading, chip area (renders a one-line muted hint when empty), composer with one primary commit button (`追加`) and the `+ 演算子を追加` drawer trigger. Below the composer: ghost-chip preview, operator-conversion pills, `完全一致` toggle.
5. **Warnings region** — coaching warnings (banner-only): query too long, over-restricted, operator-non-latin-chars.
6. **Tips region** — strategy tips, single-tip queue.
7. **Sticky preview** — assembled query (LTR monospace) for chip-based engines or full URL for Facebook. Three buttons: コピー, engine-driven search button (`Google で検索` / etc.), 全部消す.

The commit flow: Enter / `追加` ⇒ append a keyword chip with the operator chosen from the inline pills row (default `通常の単語` = no operator). Shift+Enter ⇒ insert OR-connector + new chip. Leading `-` + space ⇒ negate flag. Leading-and-trailing `"…"` ⇒ quoted flag. Backspace on empty composer ⇒ remove most recent chip.

For the full chip-system spec, OR-group machinery, paste parser, per-chip warning glyphs, drag-to-reorder, Alt+Arrow reorder, multi-select toolbar, and idiom panel behavior, refer to the parallel sections of the Arabic source repo's CLAUDE.md (this fork inherits that behavior unchanged).

## Global controls

The header carries three controls.

The **engine toggle** is a segmented control with four options: Google, X / Twitter, Facebook, Yahoo! Japan. Switching engines preserves the chip array for chip-based engines (chips with operators not in the new engine's catalogue degrade visually to plain keywords). Refresh resets to Google.

The **language toggle** is a JA / EN segmented control. Refresh resets to Japanese.

The **normalization toggle** is the JP-specific transformation. When on, every JP-aware chip prop (the `normalizes: true` flag on an operator descriptor) is passed through Unicode NFKC normalization before being inserted into the query string. The preview reflects the normalized form so the user can see exactly what is being sent. Applies only to JP-content fields; `site`, `inurl`, filetype values, dates, and number ranges pass through untouched. NFKC also collapses some less-common compatibility forms (circled numbers `①` → `1`, `㍉` → `ミリ`), which is occasionally surprising but matches what Japanese search engines apply internally; the toggle is opt-in, off by default.

## Warnings and tips

Warnings flag objective construction errors that degrade search quality. Tips suggest OSINT best practices.

| File | Fires when |
|---|---|
| `warnings/query-too-long.js` | Assembled query exceeds 32 words (Google often returns nothing). |
| `warnings/over-restricted.js` | More than 4 operator-bearing chips active. |
| `warnings/operator-non-latin-chars.js` | A chip on an op flagged `nonLatinForbiddenOps` (e.g. `site:`, `inurl:`, X handles) contains non-ASCII characters. |
| (per-chip glyph, not banner) | Multi-word `intitle:`/`intext:` without quoting → glyph offers `完全一致を有効化` fix. |
| (per-chip glyph, not banner) | Inverted date range → glyph offers `日付を入れ替える` fix. |
| `tips/filetype-pdf.js` | Filetype chip set to PDF (suggest combining with site restriction). |
| `tips/keyword-name-variants.js` | Quoted multi-word plain keyword chip (suggest full-width/half-width normalization). |
| `tips/proximity-usage.js` | Proximity chip with both terms filled. |
| `tips/date-range-both.js` | Date-range chip with both ends set. |
| `tips/keywords-no-restrictions.js` | All chips are plain keywords. |

## Idioms (OSINT recipes)

The idiom panel renders an engine-specific catalog. Each engine descriptor exposes `idioms`, `idiomGroupOrder`, `idiomGroupLabels` (see `src/idioms/google.js`, `src/idioms/x.js`, `src/idioms/yahoojp.js`).

- **Google** (10 recipes, 6 groups): vocabulary refinement, in-title narrowing, doubled intext (Russell's favorite), filetype-on-site, negative-space query, Wayback pivot, subdomain discovery, fill-in-the-blank, **JP government TLD chain**, **romaji ↔ kana name variants**.
- **X / Twitter** (10 recipes, 7 groups): first-source/origin, amplification network (quoted_tweet_id), conversation reconstruction, person-on-topic, **cross-script name** (kana ↔ romaji), engagement anomaly, geographic search, original-tweets-only, source-app fingerprint, URL diffusion tracking.
- **Yahoo! JAPAN** (10 recipes, 5 groups): Yahoo! 知恵袋, Yahoo! ニュース, `.go.jp` chain, JP subdomain discovery, JP-PDF docs, JP Wikipedia vocab anchor, **旧字体 ⇄ 新字体** kanji variants, **romaji ⇄ kana** name variants, in-title narrowing, in-URL JP section narrowing.

Adding a recipe = adding one entry to the engine's `IDIOMS` array. The anatomy sandbox + step explainer (`src/idioms/sandbox.js`, `src/idioms/explain.js`) are engine-agnostic and produce the inspector content automatically.

## Implementation status

```
src/
  index.html              shell with mount points
  main.js                 bootstrap; engine + lang controllers; engine.on / lang.on cascades
  styles/                 dark-only token palette + chip / Facebook / idiom CSS
  core/
    ctx.js, assemble.js, normalize.js (NFKC), warnings.js, tips.js, engine.js, history.js,
    lang.js (JA/EN), preview.js, chip-state.js, parse-query.js
  engines/
    google.js, x.js, facebook.js, yahoojp.js
  idioms/
    google.js, x.js, yahoojp.js, sandbox.js, explain.js
  chips/
    _registry.js, keyword.js, or-connector.js, filetype.js, date-range.js,
    proximity.js, number-range.js, filter.js, engagement.js
  ui/
    welcome.js, templates.js, idiom-panel.js, arabic-calendar.js (DEAD CODE in fork),
    normalize-toggle.js, composer.js, chip-area.js, chip-toolbar.js, chip-popover.js,
    drawer.js, facebook-form.js
  warnings/
    _registry.js, query-too-long.js, over-restricted.js, operator-non-latin-chars.js
  tips/
    _registry.js, filetype-pdf.js, keyword-name-variants.js, proximity-usage.js,
    date-range-both.js, keywords-no-restrictions.js
```

`ui/arabic-calendar.js` is imported by `chips/date-range.js` and `ui/facebook-form.js` but the call sites are gated by `if (false)` — the file is dead code in the JP fork. It can be removed in a future cleanup; today the import is harmless tree-shaking-friendly weight.

## Build commands

- `npm install` — one-time install of Vite + `vite-plugin-singlefile`.
- `npm run dev` — Vite dev server with HMR, port 5173.
- `npm run build` — produces `dist/index.html` and `dist/search_maker_jp.html` (single self-contained files).
- `npm run preview` — serves `dist/` locally, port 4173.

## How to verify

Open `dist/index.html` directly via `file://` in Chrome, Firefox, or Safari. No server or network required. Confirm:

- Title and subtitle render in Japanese; direction is LTR.
- Engine toggle shows Google / X / Facebook / Yahoo! Japan.
- Typing `東京 五輪`, pressing Enter, produces a chip and a query in the preview.
- Enable normalization; type `Ｔｏｋｙｏ` → preview shows `Tokyo`. Type `ｶﾀｶﾅ` → preview shows `カタカナ`.
- Switch to Yahoo! Japan; build a query; clicking search button opens `search.yahoo.co.jp/search?p=…&ei=UTF-8`.
- Switch to Facebook; the form replaces the chip surface; building and clicking search opens `facebook.com/search/{cat}/?q=…&epa=FILTERS&filters={base64}`.
- Refresh resets to Google + empty chips (no persistence).
- `grep -oE 'lang="ar"|dir="rtl"|arabic|عرب' dist/index.html` returns zero matches.

## What not to build

Same exclusions as the Arabic fork: no raw-query textarea, no accounts/login/sync/share, no analytics/telemetry, no language detection or auto-switching, no third mode beyond the single (mode-less) surface, no additional search engines beyond the four shipped (Google, X, Facebook, Yahoo! JAPAN) without explicit scope discussion, no deprecated Google operators (`link:`, `info:`, `~` synonym, `+` verbatim, `related:`, etc.), no guided interactive tour or onboarding wizard.

## Source attribution

Google operator definitions and quirks are derived from Daniel M. Russell's "Advanced Search Operators" reference (Feb 8, 2024) and his SearchResearch blog corpus. X / Twitter operators are sourced from Igor Brigadir's `twitter-advanced-search` reference. Facebook filter encoding is derived from the WhoPostedWhat reference (`whopostedwhat.com`). Yahoo! JAPAN operator support was tested against the production search; the descriptor lists only operators that returned the expected results. When in doubt about a specific operator's behavior, consult the matching upstream document.

The JP idiom catalogs translate the underlying investigative principles (Russell's vocabulary-refinement habit, Bellingcat / OSINTCurio / Henk van Ess practitioner patterns) into Japan-region tactics (`.go.jp` / `.lg.jp` / `.ac.jp` chain, romaji↔kana name variants, 旧字体↔新字体 kanji variants).
