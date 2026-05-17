// Yahoo! JAPAN OSINT idioms — lean v1 catalog. Yahoo! JAPAN is dominant
// for an older demographic and indexes some .jp blogs, Yahoo! 知恵袋 (Q&A),
// and Yahoo! ニュース sources that Google undersamples. The recipes lean
// into that complementary index.

export const IDIOMS = [
  // ── yahoo-services ─────────────────────────────────────────────────────
  {
    id: 'chiebukuro',
    title: { ja: 'Yahoo! 知恵袋を検索', en: 'Yahoo! Q&A (知恵袋)' },
    icon: '❓',
    pattern: 'site:detail.chiebukuro.yahoo.co.jp "<term>"',
    description: {
      ja: '日本最大の Q&A コーパス。実名アカウントが少なく、地域に関する素直な不満・口コミ・現場の感覚が出やすい。トラブル事例や生活者目線を拾うのに使う。',
      en: "Japan's largest Q&A corpus. Real-name accounts are rare, so locals vent candid complaints, on-the-ground gossip, and consumer experiences. The place to find lived perspective and trouble stories.",
    },
    group: 'yahoo-services',
    apply(chipState) {
      chipState.add('keyword', { operator: 'site', text: 'detail.chiebukuro.yahoo.co.jp' });
      chipState.add('keyword', { operator: 'none', text: '', quoted: true });
    },
  },
  {
    id: 'yahoo-news',
    title: { ja: 'Yahoo! ニュースを検索', en: 'Yahoo! News (ニュース)' },
    icon: '📰',
    pattern: 'site:news.yahoo.co.jp "<term>"',
    description: {
      ja: 'Yahoo! ニュースは独自編集の記事が混じるほか、コメント欄が日本最大級の規模で世論の温度を映す。ニュースの初出と一般読者の即応を同時に見るのに有用。',
      en: 'Yahoo! News mixes its own editorial picks with partner outlets, and its comment threads are the largest popular-pulse forum in Japan. Useful for first-publication timing plus a live read on public reaction.',
    },
    group: 'yahoo-services',
    apply(chipState) {
      chipState.add('keyword', { operator: 'site', text: 'news.yahoo.co.jp' });
      chipState.add('keyword', { operator: 'none', text: '', quoted: true });
    },
  },

  // ── jp-domains ─────────────────────────────────────────────────────────
  {
    id: 'jp-gov-tld',
    title: { ja: '日本の公的ドメインに絞る', en: 'JP public-sector domain' },
    icon: '🏛️',
    pattern: 'site:go.jp "<term>"',
    description: {
      ja: '中央省庁の `.go.jp` だけに絞る。Yahoo! は Google が落としがちな旧コンテンツや地方支部の更新が残ることがあるため、二段構えの検索として有効。`.lg.jp`（自治体）や `.ac.jp`（学術）に切り替えれば横断もできる。',
      en: 'Limit to central-government `.go.jp` domains. Yahoo! sometimes retains older content and prefectural-branch updates that Google has dropped — useful as a second-pass sweep. Swap to `.lg.jp` (local govt) or `.ac.jp` (academic) to chain.',
    },
    group: 'jp-domains',
    apply(chipState) {
      chipState.add('keyword', { operator: 'site', text: 'go.jp' });
      chipState.add('keyword', { operator: 'none', text: '', quoted: true });
    },
  },
  {
    id: 'jp-subdomain-discovery',
    title: { ja: '日本のサブドメイン発掘', en: 'JP subdomain discovery' },
    icon: '🔍',
    pattern: 'site:*.<domain>.jp -site:www.<domain>.jp',
    description: {
      ja: '日本のドメインのメイン `www.` を除外して、内部・周辺のサブドメインを浮かび上がらせる。大企業や地方自治体の組織図に対応するサブドメイン構造を地図化するのに使う。',
      en: 'Exclude the main `www.` host of a .jp domain to surface side and internal subdomains. Useful for mapping the subdomain structure of large Japanese corporations or local governments.',
    },
    group: 'jp-domains',
    apply(chipState) {
      chipState.add('keyword', { operator: 'site', text: '' });
      chipState.add('keyword', { operator: 'site', text: 'www.', negate: true });
    },
  },

  // ── docs ───────────────────────────────────────────────────────────────
  {
    id: 'jp-pdf-docs',
    title: { ja: '日本語 PDF 文書を探す', en: 'PDF documents on .jp' },
    icon: '📄',
    pattern: 'site:jp filetype:pdf "<term>"',
    description: {
      ja: '日本のドメイン上の PDF だけを切り出す。Yahoo! Japan は `.jp` ドメイン下の PDF にも比較的良くインデックスが入っており、官公庁や企業 IR 資料を拾うのに使える。',
      en: 'Slice only the PDFs hosted on .jp domains. Yahoo! JAPAN indexes .jp-hosted PDFs reasonably well — good for government reports and corporate IR documents.',
    },
    group: 'docs',
    apply(chipState) {
      chipState.add('keyword', { operator: 'site', text: 'jp' });
      chipState.add('filetype', { value: 'pdf' });
      chipState.add('keyword', { operator: 'none', text: '', quoted: true });
    },
  },

  // ── vocab ──────────────────────────────────────────────────────────────
  {
    id: 'wikipedia-ja-mine',
    title: { ja: '日本語ウィキペディアで語彙を確認', en: 'Mine Japanese Wikipedia for vocabulary' },
    icon: '📖',
    pattern: 'site:ja.wikipedia.org "<term>"',
    description: {
      ja: 'ある分野の用語を引き出す Russell の習慣。Yahoo! の日本語インデックスは Wikipedia 上の用語と良く整合するため、語彙確認の起点として有効。',
      en: "Russell's vocabulary-refinement habit. Yahoo!'s Japanese index aligns well with Wikipedia, so it's a solid starting point for finding the precise terms used in a field.",
    },
    group: 'vocab',
    apply(chipState) {
      chipState.add('keyword', { operator: 'site', text: 'ja.wikipedia.org' });
      chipState.add('keyword', { operator: 'none', text: '', quoted: true });
    },
  },
  {
    id: 'kyujitai-shinjitai',
    title: { ja: '旧字体 ⇄ 新字体 のゆれ', en: 'Old ⇄ new kanji variants' },
    icon: '📜',
    pattern: '("<旧字体>" OR "<新字体>")',
    description: {
      ja: '人名・地名は戦前の文献では旧字体（國・邊・學）で、戦後・現代では新字体（国・辺・学）で書かれることが多い。両方を OR で繋いで、世代をまたぐ文書群を網羅する。',
      en: 'Personal and place names appear in old-form kanji (國, 邊, 學) in pre-war material and in new-form kanji (国, 辺, 学) in modern material. OR-chain both to span generations of documents.',
    },
    group: 'vocab',
    apply(chipState) {
      const id1 = chipState.add('keyword', { operator: 'none', text: '', quoted: true });
      const orId = chipState.addAfter(id1, 'or-connector', { kind: 'or' });
      chipState.addAfter(orId, 'keyword', { operator: 'none', text: '', quoted: true });
    },
  },
  {
    id: 'romaji-kana-name',
    title: { ja: 'ローマ字 ⇄ かな の名前ゆれ', en: 'Romaji ⇄ kana name variants' },
    icon: '🔀',
    pattern: '("カナ" OR "Romaji")',
    description: {
      ja: '人名のローマ字表記とカナ表記を OR で繋ぐ。海外メディアと国内ブログを跨いで同一人物を追えるようになる。',
      en: 'OR-chain the romaji and the kana spelling of a person\'s name. Catches them across both foreign-press and Japanese-blog corpora.',
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
      ja: '本文に出る単語より、タイトルに含まれる単語の方がはるかに強いシグナル。`intitle:"発表会"` のように使うと記事の主題に絞り込める。',
      en: 'A term in the title is a far stronger signal than a body match. `intitle:"announcement"` narrows to articles where the topic is the actual subject.',
    },
    group: 'position',
    apply(chipState) {
      chipState.add('keyword', { operator: 'intitle', text: '', quoted: true });
    },
  },
  {
    id: 'inurl-jp-section',
    title: { ja: 'URL 内の日本語セクション', en: 'JP URL-section narrowing' },
    icon: '📂',
    pattern: 'inurl:<segment> site:<domain>',
    description: {
      ja: '日本語サイトでも `/news/` や `/press/` などのパス区切りはローマ字英数字で実装されることが多い。`inurl:` でそのセグメントだけを切り出すと、IR・お知らせ・採用ページなどのセクション単位の検索ができる。',
      en: 'Even Japanese sites tend to use ASCII path segments like `/news/` or `/press/`. `inurl:` slices to those segments, letting you target IR, announcements, or hiring-page sections within a domain.',
    },
    group: 'position',
    apply(chipState) {
      chipState.add('keyword', { operator: 'inurl', text: '' });
      chipState.add('keyword', { operator: 'site', text: '' });
    },
  },
];

export const GROUP_ORDER = ['yahoo-services', 'jp-domains', 'docs', 'vocab', 'position'];

export const GROUP_LABELS = {
  'yahoo-services': { ja: 'Yahoo! 自社サービス',  en: 'Yahoo! services' },
  'jp-domains':     { ja: '日本のドメイン',        en: 'JP domains' },
  docs:             { ja: '文書',                  en: 'Documents' },
  vocab:            { ja: '語彙の絞り込み',         en: 'Vocabulary refinement' },
  position:         { ja: '位置による絞り込み',     en: 'Position of the keyword' },
};
