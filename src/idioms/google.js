// Google OSINT idioms — lean v1 catalog of ~10 recipes for Japanese
// investigators. Universal investigator moves (Russell-grounded) anchor
// the catalog, plus a handful of Japan-specific tactics for cross-script
// names and government-domain chains.

export const IDIOMS = [
  // ── vocab ──────────────────────────────────────────────────────────────
  {
    id: 'wikipedia-ja-mine',
    title: { ja: '日本語ウィキペディアで語彙を確認', en: 'Mine Japanese Wikipedia for vocabulary' },
    icon: '📖',
    pattern: 'site:ja.wikipedia.org "<term>"',
    description: {
      ja: 'ある分野の議論を理解するには、その分野の人々が使う語彙を知る必要がある。日本語ウィキペディアの該当ページから関連語・別表記・専門用語を抜き出し、本番のクエリに使う。Russell の調査習慣の第1位。',
      en: "Russell's #1 habit: before searching, mine Japanese Wikipedia for the precise vocabulary the field uses — synonyms, alternative spellings, technical terms. Then run the real query with those words.",
    },
    group: 'vocab',
    apply(chipState) {
      chipState.add('keyword', { operator: 'site', text: 'ja.wikipedia.org' });
      chipState.add('keyword', { operator: 'none', text: '', quoted: true });
    },
  },
  {
    id: 'romaji-kana-name',
    title: { ja: 'ローマ字 ⇄ かな の名前ゆれ', en: 'Romaji ⇄ kana name variants' },
    icon: '🔀',
    pattern: '("カナ表記" OR "Romaji name")',
    description: {
      ja: '日本人の名前は同一人物でもローマ字・ひらがな・カタカナ・漢字で表記が分かれることが多い。両方の表記を OR で繋ぐと、どちらのコーパスにも引っかかる。海外メディア × 国内メディアを横断するときに必須。',
      en: 'A Japanese person\'s name is often spelled differently across romaji, hiragana, katakana, and kanji corpora. OR-chaining the romaji and the kana catches both — essential when crossing domestic and international sources.',
    },
    group: 'vocab',
    apply(chipState) {
      const id1 = chipState.add('keyword', { operator: 'none', text: '', quoted: true });
      const orId = chipState.addAfter(id1, 'or-connector', { kind: 'or' });
      chipState.addAfter(orId, 'keyword', { operator: 'none', text: '', quoted: true });
    },
  },

  // ── position ───────────────────────────────────────────────────────────
  {
    id: 'intitle-narrow',
    title: { ja: 'タイトル内に絞り込み', en: 'In-title narrowing' },
    icon: '🎯',
    pattern: 'intitle:"<phrase>"',
    description: {
      ja: '本文に出てくる単語より、記事タイトルに含まれる単語の方がはるかに強いシグナル。`intitle:"記者会見"` のようにタイトル内に絞り込むと、関連性の低いヒットを大幅に削れる。',
      en: 'A term in the title is a much stronger signal than a term anywhere in the body. `intitle:"press conference"` cuts irrelevant hits dramatically.',
    },
    group: 'position',
    apply(chipState) {
      chipState.add('keyword', { operator: 'intitle', text: '', quoted: true });
    },
  },
  {
    id: 'doubled-intext',
    title: { ja: '本文に二重に出現させる', en: "Doubled intext (Russell's favorite)" },
    icon: '🧲',
    pattern: 'intext:"<term1>" intext:"<term2>"',
    description: {
      ja: 'Russell が最も繰り返し勧める手筋。本文に必ず2つの単語が共起しているページを探す。タイトルや見出しでヒットしてくる広告ノイズを大きく減らせる。',
      en: "Russell's most-repeated trick. Force both terms to appear in the body text — slashes through ad-noise pages that match only in titles or headers.",
    },
    group: 'position',
    apply(chipState) {
      chipState.add('keyword', { operator: 'intext', text: '', quoted: true });
      chipState.add('keyword', { operator: 'intext', text: '', quoted: true });
    },
  },

  // ── docs ───────────────────────────────────────────────────────────────
  {
    id: 'pdf-on-site',
    title: { ja: 'PDF をサイト指定で検索', en: 'PDFs on a specific site' },
    icon: '📄',
    pattern: 'site:<domain> filetype:pdf "<term>"',
    description: {
      ja: '組織が公開した PDF だけを切り出す。`site:go.jp filetype:pdf "予算"` で官公庁の予算文書だけを引ける。研究者・記者向けの最も古典的な手筋。',
      en: 'Slice the PDF-only documents from one organization. `site:go.jp filetype:pdf "budget"` pulls only government budget documents. The most classic researcher/journalist move.',
    },
    group: 'docs',
    apply(chipState) {
      chipState.add('keyword', { operator: 'site', text: '' });
      chipState.add('filetype', { value: 'pdf' });
      chipState.add('keyword', { operator: 'none', text: '', quoted: true });
    },
  },

  // ── time ───────────────────────────────────────────────────────────────
  {
    id: 'negative-space',
    title: { ja: '報道されなかったイベント', en: 'Negative-space query' },
    icon: '🕳️',
    pattern: '"<place>" before:<date> -<obvious-noun>',
    description: {
      ja: 'ある事件が起きたが、報道機関がまだ気付いていない時期を狙う。`"渋谷" before:2023-01-15 -ニュース` のように、当時のローカルブログや SNS の埋め込みが残るページが浮かぶ。Russell の「時間的負空間」テクニック。',
      en: "Aim at the window when an event happened but the press hadn't noticed yet. `\"Shibuya\" before:2023-01-15 -news` surfaces local blogs and SNS-embed pages from that window. Russell's negative-space technique.",
    },
    group: 'time',
    apply(chipState) {
      chipState.add('keyword', { operator: 'none', text: '', quoted: true });
      const today = new Date().toISOString().slice(0, 10);
      chipState.add('date-range', { after: '', before: today });
      chipState.add('keyword', { operator: 'none', text: '', negate: true });
    },
  },
  {
    id: 'wayback-pivot',
    title: { ja: 'Wayback Machine を経由する', en: 'Wayback pivot' },
    icon: '🕰️',
    pattern: 'site:web.archive.org "<term>"',
    description: {
      ja: '削除されたページ・改ざんされる前のページにアクセスするための定番ピボット。`site:web.archive.org "団体名"` で過去のスナップショットを Google 経由で索引できる。',
      en: 'The standard pivot to reach pages that were deleted or altered. `site:web.archive.org "<term>"` indexes past snapshots through Google.',
    },
    group: 'time',
    apply(chipState) {
      chipState.add('keyword', { operator: 'site', text: 'web.archive.org' });
      chipState.add('keyword', { operator: 'none', text: '', quoted: true });
    },
  },

  // ── sites ──────────────────────────────────────────────────────────────
  {
    id: 'subdomain-discovery',
    title: { ja: 'サブドメインの発掘', en: 'Subdomain discovery' },
    icon: '🔍',
    pattern: 'site:*.<domain> -site:www.<domain>',
    description: {
      ja: 'メインの www. を除外することで、intranet.example.jp や staff.example.jp のような内部・周辺のサブドメインを浮かび上がらせる。大きな組織のサイト構造を地図化するのに有効。Russell が 2024 年 2 月の PDF で名指しで挙げた手筋。',
      en: "Exclude the main www. host to surface internal/side subdomains like intranet.example.jp. Useful for mapping the structure of a large organization. Russell calls this one out by name in his Feb 2024 PDF.",
    },
    group: 'sites',
    apply(chipState) {
      chipState.add('keyword', { operator: 'site', text: '' });
      chipState.add('keyword', { operator: 'site', text: 'www.', negate: true });
    },
  },
  {
    id: 'jp-gov-tld-chain',
    title: { ja: '日本の公的ドメインを横断', en: 'JP public-sector TLD chain' },
    icon: '🏛️',
    pattern: '(site:go.jp OR site:lg.jp OR site:ac.jp) "<term>"',
    description: {
      ja: '中央省庁 (go.jp)・自治体 (lg.jp)・学術機関 (ac.jp) を一発で横串検索。公的セクター由来の情報を網羅的に集めるときの起点として使う。`co.jp` や `or.jp` を加えれば民間・非営利も含む。',
      en: 'Sweep across central government (go.jp), local government (lg.jp), and academic institutions (ac.jp) in one query. The default starting move when you want all public-sector signal at once. Add co.jp / or.jp for private and nonprofit.',
    },
    group: 'sites',
    apply(chipState) {
      const id1 = chipState.add('keyword', { operator: 'site', text: 'go.jp' });
      const orId1 = chipState.addAfter(id1, 'or-connector', { kind: 'or' });
      const id2 = chipState.addAfter(orId1, 'keyword', { operator: 'site', text: 'lg.jp' });
      const orId2 = chipState.addAfter(id2, 'or-connector', { kind: 'or' });
      chipState.addAfter(orId2, 'keyword', { operator: 'site', text: 'ac.jp' });
      chipState.add('keyword', { operator: 'none', text: '', quoted: true });
    },
  },

  // ── signature ──────────────────────────────────────────────────────────
  {
    id: 'fill-in-blank',
    title: { ja: '穴埋め検索', en: 'Fill-in-the-blank (Russell)' },
    icon: '✏️',
    pattern: '"<prefix> * <suffix>"',
    description: {
      ja: '`*` ワイルドカードを引用符の中に置くと、その位置に「何かが入る」フレーズを探せる。Russell が直接挙げた手筋。`"<人名> は * を発表した"` のように、報道の常套句から事実を引きずり出すのに有効。',
      en: "Place a `*` wildcard inside quotes to find phrases with 'something in this slot.' Russell calls this out directly. `\"<person> announced *\"` pulls facts out of stock reporting phrasing.",
    },
    group: 'signature',
    apply(chipState) {
      chipState.add('keyword', { operator: 'none', text: '"<prefix> * <suffix>"' });
    },
  },
];

export const GROUP_ORDER = ['vocab', 'position', 'docs', 'time', 'sites', 'signature'];

export const GROUP_LABELS = {
  vocab:     { ja: '語彙の絞り込み',          en: 'Vocabulary refinement' },
  position:  { ja: '位置による絞り込み',      en: 'Position of the keyword' },
  docs:      { ja: '文書',                    en: 'Documents' },
  time:      { ja: '時系列',                  en: 'Time' },
  sites:     { ja: 'サイト範囲',              en: 'Sites' },
  signature: { ja: '調査者の常套手段',         en: "Investigator's signature moves" },
};
