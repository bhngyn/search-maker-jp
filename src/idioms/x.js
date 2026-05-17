// X / Twitter OSINT idioms — lean v1 catalog of ~10 recipes for Japanese
// investigators. Cross-validated against Bellingcat / OSINTCurio / Igor
// Brigadir's `twitter-advanced-search` reference / Henk van Ess.

export const IDIOMS = [
  // ── origin ─────────────────────────────────────────────────────────────
  {
    id: 'first-source',
    title: { ja: '最初の発信源を辿る', en: 'First source / origin tweet' },
    icon: '🌱',
    pattern: '"<term>" since:<date> until:<date+1d>',
    description: {
      ja: 'ある話題が拡散し始めた瞬間を1日単位で切り出す。`since:` と `until:` を狭く設定して、その日の最も古いツイートまで遡る。バイラル投稿の起点アカウントを特定する基本手筋。',
      en: 'Slice the moment a story started spreading down to one day. Set `since:` and `until:` tight and back up to the oldest tweets in that window. The bedrock move for identifying the origin account of a viral post.',
    },
    group: 'origin',
    apply(chipState) {
      chipState.add('keyword', { operator: 'none', text: '', quoted: true });
      chipState.add('date-range', { after: '', before: '' });
    },
  },
  {
    id: 'amplification-network',
    title: { ja: '増幅ネットワークの可視化', en: 'Amplification network' },
    icon: '🔁',
    pattern: 'quoted_tweet_id:<id>',
    description: {
      ja: 'あるツイートを引用したツイートをすべて引き出す。誰が・どんな文脈で増幅したかが見える。共同で拡散している匿名アカウント群を可視化するのに使う。',
      en: 'Pulls every tweet that quoted one source tweet. Reveals who amplified it and in what framing — surfaces coordinated anonymous-account clusters around a post.',
    },
    group: 'amplification',
    apply(chipState) {
      chipState.add('keyword', { operator: 'quoted_tweet_id', text: '' });
    },
  },

  // ── thread ─────────────────────────────────────────────────────────────
  {
    id: 'conversation-thread',
    title: { ja: '会話スレッド全体を再構築', en: 'Conversation reconstruction' },
    icon: '🧵',
    pattern: 'conversation_id:<id>',
    description: {
      ja: 'X の UI が省略するスレッドの全ツイートを、削除済みも含めて引き出す（公開キャッシュ範囲）。途中で消えたリプライから論争の経緯を復元する。',
      en: 'Pulls every tweet in a thread the X UI may collapse — including deleted ones still in public cache. Lets you reconstruct what was said between sides of a dispute.',
    },
    group: 'thread',
    apply(chipState) {
      chipState.add('keyword', { operator: 'conversation_id', text: '' });
    },
  },

  // ── person ─────────────────────────────────────────────────────────────
  {
    id: 'person-on-topic',
    title: { ja: 'ある人物の特定話題への発言', en: 'A person on a topic' },
    icon: '👤',
    pattern: 'from:<handle> "<term>"',
    description: {
      ja: '特定アカウントが特定の話題について発した投稿だけを切り出す。政治家や記者のスタンスを時系列で並べるときに使う。`-filter:replies` を足せば本人のオリジナル投稿だけに絞れる。',
      en: 'Slice one account\'s posts on one topic. Useful for tracking the stance of a politician or journalist over time. Add `-filter:replies` to keep only their original posts.',
    },
    group: 'person',
    apply(chipState) {
      chipState.add('keyword', { operator: 'from', text: '' });
      chipState.add('keyword', { operator: 'none', text: '', quoted: true });
    },
  },
  {
    id: 'cross-script-name',
    title: { ja: 'カナ ⇄ ローマ字の名前ゆれ', en: 'Cross-script name variants' },
    icon: '🔀',
    pattern: '("<カナ>" OR "<Romaji>") -is:retweet',
    description: {
      ja: '日本人の名前は同一人物でもメディアごとに表記がブレる。カナ表記とローマ字表記を OR で繋ぎ、リツイートを除いて発言だけを集める。海外ジャーナリスト × 日本人当事者の追跡に必須。',
      en: 'A Japanese person\'s name is spelled differently across outlets. OR-chain the kana and the romaji, exclude retweets, and you catch posts from both the local and international corpora. Essential for foreign-correspondent reporting on Japanese subjects.',
    },
    group: 'person',
    apply(chipState) {
      const id1 = chipState.add('keyword', { operator: 'none', text: '', quoted: true });
      const orId = chipState.addAfter(id1, 'or-connector', { kind: 'or' });
      chipState.addAfter(orId, 'keyword', { operator: 'none', text: '', quoted: true });
    },
  },

  // ── audience ───────────────────────────────────────────────────────────
  {
    id: 'engagement-anomaly',
    title: { ja: 'エンゲージメント異常検出', en: 'Engagement anomaly' },
    icon: '📈',
    pattern: '"<term>" min_faves:1000 min_retweets:500',
    description: {
      ja: '通常より遥かに高い反応率を示すツイートだけを切り出す。インフルエンサーキャンペーンや共同拡散の徴候を見つける。閾値は調査対象のジャンルに応じて調整。',
      en: 'Slice only the tweets with engagement far above baseline. Surfaces influencer campaigns and coordinated amplification. Tune the threshold to your topic\'s normal range.',
    },
    group: 'audience',
    apply(chipState) {
      chipState.add('keyword', { operator: 'none', text: '', quoted: true });
      chipState.add('engagement', { metric: 'min_faves', direction: 'min', value: 1000 });
      chipState.add('engagement', { metric: 'min_retweets', direction: 'min', value: 500 });
    },
  },
  {
    id: 'geo-search',
    title: { ja: '地理位置に近いツイート', en: 'Geographic search' },
    icon: '📍',
    pattern: 'near:Tokyo within:10km "<term>"',
    description: {
      ja: '指定した地点の近くから発信されたツイートを切り出す。事件現場での目撃情報、災害時のローカル発信を拾うのに使う。位置情報が公開されているツイートのみが対象。',
      en: 'Slice tweets posted near a specific location. Useful for eyewitness reports from an incident scene or local disaster signal. Only catches tweets with public geolocation.',
    },
    group: 'audience',
    apply(chipState) {
      chipState.add('keyword', { operator: 'near', text: 'Tokyo' });
      chipState.add('keyword', { operator: 'none', text: '', quoted: true });
    },
  },

  // ── framing ────────────────────────────────────────────────────────────
  {
    id: 'original-posts-only',
    title: { ja: 'オリジナル投稿だけに絞る', en: 'Original tweets only' },
    icon: '✍️',
    pattern: 'from:<handle> -filter:replies -filter:retweets',
    description: {
      ja: 'リプライとリツイートを除外して、本人のオリジナル発言だけを並べる。スタンスの変遷を時系列で読む基礎。`-filter:quote` を足せば引用ツイートも除外。',
      en: 'Exclude replies and retweets — leaves only the account\'s own posts. The baseline view for reading stance over time. Add `-filter:quote` to also drop quote tweets.',
    },
    group: 'framing',
    apply(chipState) {
      chipState.add('keyword', { operator: 'from', text: '' });
      chipState.add('filter', { value: 'replies', negate: true });
      chipState.add('filter', { value: 'nativeretweets', negate: true });
    },
  },

  // ── verify ─────────────────────────────────────────────────────────────
  {
    id: 'source-app',
    title: { ja: '投稿元アプリで指紋採取', en: 'Source-app fingerprint' },
    icon: '📱',
    pattern: 'from:<handle> source:"Twitter for iPhone"',
    description: {
      ja: '同じアカウントが普段 Android なのに突然 Web から投稿していたら、運用者が変わった可能性がある。`source:` でツイートクライアントを追うと、複数人運用や乗っ取りを示すパターンが見える。',
      en: "If an account that usually posts from Android suddenly switches to Web, the operator may have changed. `source:` tracks the tweet client and exposes multi-operator or hijack patterns.",
    },
    group: 'verify',
    apply(chipState) {
      chipState.add('keyword', { operator: 'from', text: '' });
      chipState.add('keyword', { operator: 'source', text: 'Twitter for iPhone', quoted: true });
    },
  },
  {
    id: 'url-tracking',
    title: { ja: '特定 URL の拡散を追跡', en: 'URL diffusion tracking' },
    icon: '🔗',
    pattern: 'url:<domain>',
    description: {
      ja: 'ある記事や YouTube 動画がどのアカウントから・どのタイミングで X に流れたかを追う。`url:` は短縮 URL も展開後の元ドメインで判定する。',
      en: 'Track which accounts shared a given article or YouTube video on X, and when. `url:` matches the expanded destination domain, not the short link.',
    },
    group: 'verify',
    apply(chipState) {
      chipState.add('keyword', { operator: 'url', text: '' });
    },
  },
];

export const GROUP_ORDER = ['origin', 'amplification', 'thread', 'person', 'audience', 'framing', 'verify'];

export const GROUP_LABELS = {
  origin:        { ja: '発信源',                en: 'Origin / first source' },
  amplification: { ja: '増幅ネットワーク',       en: 'Amplification network' },
  thread:        { ja: 'スレッド再構築',         en: 'Conversation reconstruction' },
  person:        { ja: '人物と話題',            en: 'Person on a topic' },
  audience:      { ja: '反応と異常検出',         en: 'Audience & engagement' },
  framing:       { ja: '言説のフレーミング',     en: 'Framing & counter-narrative' },
  verify:        { ja: '検証と指紋採取',         en: 'Verification & fingerprinting' },
};
