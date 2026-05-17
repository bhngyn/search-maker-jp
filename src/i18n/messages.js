// i18n message dictionary. Single source of truth for every Japanese and English
// label, placeholder, validation message, and tip in the app.
//
// Each entry maps a stable key to a `{ ja, en }` pair. For interpolated
// strings, the value is a function `(vars) => string` per language.
//
// `t(key, vars)` reads the active language from src/core/lang.js's module-level
// accessor and resolves. Unknown keys fall through to the key itself so a
// missing translation is loud rather than silent.

import { getActiveLang } from '../core/lang.js';

export const MESSAGES = {
  // ===== HTML shell =====
  'app.title':              { ja: '検索クエリビルダー',                       en: 'Search Query Builder' },
  'app.engineToggleLabel':  { ja: '検索エンジン',                              en: 'Search engine' },
  'app.langToggleLabel':    { ja: '言語',                                     en: 'Language' },
  'app.langJapanese':       { ja: 'JA',                                       en: 'JA' },
  'app.langEnglish':        { ja: 'EN',                                       en: 'EN' },
  'app.normalizeLabel':     { ja: '全角・半角の統一',                          en: 'Full-width / half-width normalization' },
  'app.normalizeInfoTitle': { ja: 'これは何？',                                en: 'What is this?' },
  'app.normalizeInfoBody':  {
    ja: 'オンにすると、検索前に文字を正規化します（全角の英数字「Ａ-Ｚ・ａ-ｚ・０-９」は半角に、半角カタカナ「ｶﾀｶﾅ」は全角の「カタカナ」に、全角スペースは半角スペースに変換されます）。入力したテキスト自体は書き換わりません — 変換結果は下のクエリプレビューだけに反映されます。日本の検索エンジンが内部で行っている正規化と同じです。',
    en: 'When enabled, the tool normalizes characters before searching: full-width ASCII (Ａ-Ｚ, ａ-ｚ, ０-９) → half-width, half-width katakana (ｶﾀｶﾅ) → full-width katakana, full-width space → half-width. Your typed text is not changed — the transformation appears only in the query preview below. This matches the normalization Japanese search engines apply internally.',
  },
  'app.welcomeBlurbHtml': {
    ja: '下の <strong>「検索レシピ集」</strong> からレシピを選ぶか、単語を入力して <kbd>Enter</kbd> を押し、ゼロからクエリを組み立てましょう。',
    en: 'Start with a ready-made recipe from <strong>"Recipes"</strong> below, or type a term and press <kbd>Enter</kbd> to build your query from scratch.',
  },
  'app.welcomeCloseLabel':  { ja: 'ようこそパネルを隠す',                       en: 'Hide welcome panel' },
  'app.welcomeCloseText':   { ja: '隠す',                                     en: 'Hide' },
  'app.chipSectionHeading': { ja: '単語を追加してクエリを組み立てる',           en: 'Build your search by adding terms' },
  'app.previewHeading':     { ja: 'クエリが完成しました',                       en: 'Your query' },
  'app.copyBtn':            { ja: 'コピー',                                   en: 'Copy' },
  'app.copyBtnDone':        { ja: 'コピーしました',                            en: 'Copied' },
  'app.resetBtn':           { ja: '全部消す',                                 en: 'Clear all' },
  'app.resetBtnConfirm':    { ja: 'もう一度押して確定',                        en: 'Tap again to confirm' },
  'app.undoBtn':            { ja: '取り消し',                                 en: 'Undo' },
  'app.undoBtnTitle':       { ja: '取り消し (Ctrl+Z)',                         en: 'Undo (Ctrl+Z)' },
  'app.copyFailed':         { ja: 'コピーに失敗しました — クエリを手動でコピーしてください', en: 'Copy failed — please copy the query manually.' },
  'app.fbFormHeading':      { ja: 'Facebook 検索フォーム',                    en: 'Facebook search form' },
  'app.versionLabel':       {
    ja: (vars) => 'バージョン ' + vars.v,
    en: (vars) => 'Version ' + vars.v,
  },
  'app.versionAriaLabel':   {
    ja: (vars) => 'ツールのバージョン ' + vars.v,
    en: (vars) => 'Tool version ' + vars.v,
  },

  // ===== Engine: Google =====
  'engine.google.subtitle': {
    ja: 'Google の高度な検索クエリを日本語で組み立てます。IME 切り替えや英語の演算子を覚える手間なく、構造化されたチップで検索を組み立てられます。',
    en: 'Build advanced Google search queries — Japanese terms welcome, no fighting IMEs, no operator memorization.',
  },
  'engine.google.searchBtn':    { ja: 'Google で検索',                         en: 'Search Google' },
  'engine.google.emptyPreview': { ja: '上で単語を追加すると、ここに組み立てたクエリが表示されます', en: 'Your assembled query will appear here once you add terms above' },

  // Google operator labels (dropdown / pills / drawer-badge text uses op.opName + ':' so badges stay literal)
  'engine.google.op.none.label':     { ja: '単語',                             en: 'Word' },
  'engine.google.op.site.label':     { ja: 'サイト (site:)',                   en: 'Site (site:)' },
  'engine.google.op.intitle.label':  { ja: 'タイトル内 (intitle:)',             en: 'In title (intitle:)' },
  'engine.google.op.intext.label':   { ja: '本文内 (intext:)',                 en: 'In body (intext:)' },
  'engine.google.op.inanchor.label': { ja: 'リンクテキスト内 (inanchor:)',      en: 'In anchor text (inanchor:)' },
  'engine.google.op.inurl.label':    { ja: 'URL内 (inurl:)',                   en: 'In URL (inurl:)' },

  // Google composer pills (short labels under the ghost chip)
  'engine.google.pill.none':     { ja: '通常の単語',                           en: 'Plain word' },
  'engine.google.pill.site':     { ja: 'サイト指定',                           en: 'On a site' },
  'engine.google.pill.intitle':  { ja: 'タイトル内',                           en: 'In page title' },
  'engine.google.pill.inurl':    { ja: 'URL内',                                en: 'In page URL' },
  'engine.google.pill.intext':   { ja: '本文内',                               en: 'In page body' },
  'engine.google.pill.inanchor': { ja: 'リンクテキスト内',                      en: 'In incoming links' },

  // Google drawer items (label + desc; badge is literal)
  'engine.google.drawer.site.label':            { ja: '特定サイト内を検索',                en: 'Search a specific site' },
  'engine.google.drawer.site.desc':             { ja: 'ドメインに結果を絞ります（例：bbc.com）', en: 'Limit results to one domain, e.g. bbc.com' },
  'engine.google.drawer.intitle.label':         { ja: 'タイトル内を検索',                  en: 'Match in page title' },
  'engine.google.drawer.intitle.desc':          { ja: '結果のページタイトルに含まれる必要がある単語', en: 'A term that must appear in the result\'s title' },
  'engine.google.drawer.inurl.label':           { ja: 'URL内を検索',                       en: 'Match in page URL' },
  'engine.google.drawer.inurl.desc':            { ja: '結果のURLに含まれる必要がある単語',  en: 'A term that must appear in the result\'s URL' },
  'engine.google.drawer.intext.label':          { ja: '本文内を検索',                      en: 'Match in page body' },
  'engine.google.drawer.intext.desc':           { ja: 'ページの本文に含まれる必要がある単語', en: 'A term that must appear in the page content' },
  'engine.google.drawer.inanchor.label':        { ja: '被リンクテキスト内を検索',           en: 'Match in inbound anchor text' },
  'engine.google.drawer.inanchor.desc':         { ja: '当該ページへのリンクテキストから検索', en: 'A term from links pointing at the page' },
  'engine.google.drawer.filetype.label':        { ja: 'ファイル形式',                      en: 'File type' },
  'engine.google.drawer.filetype.desc':         { ja: 'PDF・Word などに結果を絞ります',     en: 'Restrict to PDF, Word, etc.' },
  'engine.google.drawer.dateRange.label':       { ja: '日付範囲',                          en: 'Date range' },
  'engine.google.drawer.dateRange.desc':        { ja: '2つの日付の間に結果を絞ります',       en: 'Restrict results to a window of dates' },
  'engine.google.drawer.proximity.label':       { ja: '近接2語検索',                       en: 'Two nearby words' },
  'engine.google.drawer.proximity.desc':        { ja: '2語が近くに出現する結果。人物・組織のつながり探索に有効', en: 'Two words near each other — useful for linking entities' },
  'engine.google.drawer.numberRange.label':     { ja: '数値範囲',                          en: 'Number range' },
  'engine.google.drawer.numberRange.desc':      { ja: '2つの値の間の数字（例：100..500）',  en: 'Numbers between two values, e.g. 100..500' },
  'engine.google.drawer.social.telegram.label':     { ja: 'Telegram',                                  en: 'Telegram' },
  'engine.google.drawer.social.telegram.desc':      { ja: '公開Telegramチャンネル・グループに結果を絞ります', en: 'Limit results to public Telegram channels and groups' },
  'engine.google.drawer.social.fb-groups.label':    { ja: 'Facebookグループ',                          en: 'Facebook groups' },
  'engine.google.drawer.social.fb-groups.desc':     { ja: 'Facebookのグループページに結果を絞ります',     en: 'Limit results to Facebook group pages' },
  'engine.google.drawer.social.fb.label':           { ja: 'Facebook',                                  en: 'Facebook' },
  'engine.google.drawer.social.fb.desc':            { ja: 'Facebookのプロフィール・ページ・投稿',         en: 'Profiles, pages, and posts on Facebook' },
  'engine.google.drawer.social.x.label':            { ja: 'X / Twitter',                              en: 'X / Twitter' },
  'engine.google.drawer.social.x.desc':             { ja: 'X / Twitter上の公開コンテンツ',               en: 'Public content on X / Twitter' },
  'engine.google.drawer.social.linkedin.label':     { ja: 'LinkedIn',                                  en: 'LinkedIn' },
  'engine.google.drawer.social.linkedin.desc':      { ja: 'LinkedInのプロフィール・会社・投稿',           en: 'Profiles, companies, and posts on LinkedIn' },
  'engine.google.drawer.social.reddit.label':       { ja: 'Reddit',                                    en: 'Reddit' },
  'engine.google.drawer.social.reddit.desc':        { ja: 'Redditのサブレディット・投稿・コメント',         en: 'Subreddits, posts, and comments on Reddit' },
  'engine.google.drawer.social.youtube.label':      { ja: 'YouTube',                                   en: 'YouTube' },
  'engine.google.drawer.social.youtube.desc':       { ja: 'YouTubeのチャンネル・動画・コメント',           en: 'Channels, videos, and comments on YouTube' },
  'engine.google.drawer.social.instagram.label':    { ja: 'Instagram',                                 en: 'Instagram' },
  'engine.google.drawer.social.instagram.desc':     { ja: 'Instagramのプロフィール・投稿',                en: 'Profiles and posts on Instagram' },
  'engine.google.drawer.social.tiktok.label':       { ja: 'TikTok',                                    en: 'TikTok' },
  'engine.google.drawer.social.tiktok.desc':        { ja: 'TikTokのプロフィール・動画',                   en: 'Profiles and videos on TikTok' },

  // Google templates
  'engine.google.tpl.site.title':     { ja: 'サイト指定検索',                  en: 'Search a specific site' },
  'engine.google.tpl.site.desc':      { ja: 'ドメインに絞ります（例：bbc.com）', en: 'Limit results to one domain, e.g. bbc.com' },
  'engine.google.tpl.docs.title':     { ja: '文書を検索',                       en: 'Search documents' },
  'engine.google.tpl.docs.desc':      { ja: 'PDF・Wordファイルを探します',       en: 'Find PDF or Word files' },
  'engine.google.tpl.daterange.title':{ ja: '日付範囲で検索',                   en: 'Search a date range' },
  'engine.google.tpl.daterange.desc': { ja: '2つの日付の間に結果を絞ります',     en: 'Restrict results to a window of dates' },

  // ===== Engine: X / Twitter =====
  'engine.x.label':         { ja: 'X / Twitter',                               en: 'X / Twitter' },
  'engine.x.subtitle':      {
    ja: 'X / Twitter の高度な検索クエリを日本語で組み立てます。IME 切り替えや英語の演算子を覚える手間は不要です。',
    en: 'Build advanced X / Twitter search queries — Japanese terms welcome, no fighting IMEs.',
  },
  'engine.x.searchBtn':     { ja: 'X で検索',                                  en: 'Search X' },
  'engine.x.emptyPreview':  { ja: '上で単語を追加すると、ここに組み立てたクエリが表示されます', en: 'Your assembled query will appear here once you add terms above' },

  // X operator labels
  'engine.x.op.none.label':            { ja: '単語',                            en: 'Word' },
  'engine.x.op.from.label':            { ja: 'アカウントから (from:)',          en: 'From account (from:)' },
  'engine.x.op.to.label':              { ja: '宛先アカウント (to:)',            en: 'Reply to account (to:)' },
  'engine.x.op.mention.label':         { ja: 'メンション (@user)',               en: 'Mention (@user)' },
  'engine.x.op.hashtag.label':         { ja: 'ハッシュタグ (#tag)',              en: 'Hashtag (#tag)' },
  'engine.x.op.url.label':             { ja: 'リンク (url:)',                   en: 'Link (url:)' },
  'engine.x.op.list.label':            { ja: 'リスト (list:)',                  en: 'List (list:)' },
  'engine.x.op.lang.label':            { ja: '言語 (lang:)',                    en: 'Language (lang:)' },
  'engine.x.op.near.label':            { ja: '近く (near:)',                    en: 'Near (near:)' },
  'engine.x.op.source.label':          { ja: '投稿元アプリ (source:)',           en: 'Source app (source:)' },
  'engine.x.op.conversation_id.label': { ja: '会話 (conversation_id:)',         en: 'Conversation (conversation_id:)' },
  'engine.x.op.quoted_tweet_id.label': { ja: '引用元ツイート (quoted_tweet_id:)', en: 'Quoted tweet (quoted_tweet_id:)' },

  // X composer pills
  'engine.x.pill.none':    { ja: '通常の単語',                                 en: 'Plain word' },
  'engine.x.pill.from':    { ja: 'アカウントから',                              en: 'From account' },
  'engine.x.pill.to':      { ja: '宛先',                                       en: 'Reply to' },
  'engine.x.pill.mention': { ja: 'メンション (@)',                              en: 'Mention (@)' },
  'engine.x.pill.hashtag': { ja: 'ハッシュタグ (#)',                            en: 'Hashtag (#)' },
  'engine.x.pill.filterImages': { ja: '画像のみ',                              en: 'Images only' },
  'engine.x.pill.filterVideos': { ja: '動画のみ',                              en: 'Videos only' },
  'engine.x.pill.dateRange':    { ja: '日付範囲',                              en: 'Date range' },

  // X drawer items
  'engine.x.drawer.from.label':            { ja: 'アカウントから',              en: 'From an account' },
  'engine.x.drawer.from.desc':             { ja: '特定アカウントのツイートに絞ります', en: 'Tweets from one specific account' },
  'engine.x.drawer.to.label':              { ja: '宛先アカウント',              en: 'Replies to an account' },
  'engine.x.drawer.to.desc':               { ja: '特定アカウント宛のツイート',    en: 'Tweets directed at one account' },
  'engine.x.drawer.mention.label':         { ja: 'アカウントの言及',            en: 'Account mention' },
  'engine.x.drawer.mention.desc':          { ja: '@user を含むツイート',         en: 'Tweets that mention @user' },
  'engine.x.drawer.hashtag.label':         { ja: 'ハッシュタグ',                en: 'Hashtag' },
  'engine.x.drawer.hashtag.desc':          { ja: '指定タグを含むツイート',       en: 'Tweets that contain a hashtag' },
  'engine.x.drawer.list.label':            { ja: 'リスト',                      en: 'List' },
  'engine.x.drawer.list.desc':             { ja: 'リストメンバーのツイートに絞ります', en: 'Restrict to members of a list' },
  'engine.x.drawer.url.label':             { ja: 'ツイート内のリンク',           en: 'Link in tweet' },
  'engine.x.drawer.url.desc':              { ja: '特定ドメインへのリンクを含むツイート', en: 'Tweets pointing at a domain' },
  'engine.x.drawer.lang.label':            { ja: 'ツイート言語',                en: 'Tweet language' },
  'engine.x.drawer.lang.desc':             { ja: '日本語なら ja、英語なら en',  en: 'e.g. ja for Japanese or en for English' },
  'engine.x.drawer.near.label':            { ja: '位置情報の近く',              en: 'Near a place' },
  'engine.x.drawer.near.desc':             { ja: '都市の近くに絞ります（near:meも可）', en: 'Restrict near a city or near:me' },
  'engine.x.drawer.source.label':          { ja: '投稿元アプリ',                en: 'Source app' },
  'engine.x.drawer.source.desc':           { ja: 'ツイートの投稿元アプリ',       en: 'The app the tweet was posted from' },
  'engine.x.drawer.conversation_id.label': { ja: '会話ID',                      en: 'Conversation ID' },
  'engine.x.drawer.conversation_id.desc':  { ja: '同じ会話のすべてのツイート',   en: 'All tweets in one conversation' },
  'engine.x.drawer.quoted_tweet_id.label': { ja: '引用元ツイートID',             en: 'Quoted tweet ID' },
  'engine.x.drawer.quoted_tweet_id.desc':  { ja: '特定ツイートを引用したツイート', en: 'Tweets that quote one specific tweet' },
  'engine.x.drawer.dateRange.label':       { ja: '日付範囲',                    en: 'Date range' },
  'engine.x.drawer.dateRange.desc':        { ja: '2つの日付の間に結果を絞ります', en: 'Restrict results to a window of dates' },
  'engine.x.drawer.filter.label':          { ja: 'ツイート種別でフィルタ',       en: 'Filter by tweet type' },
  'engine.x.drawer.filter.desc':           { ja: '写真・動画・返信・認証済みなど', en: 'Photos, video, replies, verified…' },
  'engine.x.drawer.engagement.label':      { ja: 'エンゲージメントの下限/上限',   en: 'Engagement threshold' },
  'engine.x.drawer.engagement.desc':       { ja: 'いいね・返信・リツイート数',   en: 'Likes, replies, or retweets' },
  'engine.x.drawer.engagement.faves.label':    { ja: 'いいねの下限',             en: 'Min likes' },
  'engine.x.drawer.engagement.faves.desc':     { ja: '指定数を超えるいいねのツイート', en: 'Tweets above a likes threshold.' },
  'engine.x.drawer.engagement.replies.label':  { ja: '返信の下限',                en: 'Min replies' },
  'engine.x.drawer.engagement.replies.desc':   { ja: '広く議論を呼んだツイート',   en: 'Tweets that sparked wide discussion.' },
  'engine.x.drawer.engagement.retweets.label': { ja: 'リツイートの下限',          en: 'Min retweets' },
  'engine.x.drawer.engagement.retweets.desc':  { ja: '広く拡散したツイート',      en: 'Tweets that spread widely.' },

  // X templates
  'engine.x.tpl.account.title':    { ja: 'アカウントからのツイート',             en: 'Tweets from an account' },
  'engine.x.tpl.account.desc':     { ja: '特定アカウントに絞ります',             en: 'Restrict results to one account' },
  'engine.x.tpl.popular.title':    { ja: '人気ツイート',                         en: 'Popular tweets' },
  'engine.x.tpl.popular.desc':     { ja: '高エンゲージメント：いいね1000以上',    en: 'High engagement: 1000+ likes' },
  'engine.x.tpl.daterange.title':  { ja: '期間で検索',                          en: 'Search a date window' },
  'engine.x.tpl.daterange.desc':   { ja: 'デフォルトは過去30日',                en: 'Last 30 days by default' },

  // ===== Engine: Facebook =====
  'engine.facebook.subtitle': {
    ja: 'Facebook の高度な検索URLをフォーム形式で組み立てます。カテゴリとフィルタを選ぶだけで、WhoPostedWhat と同じ形式のURLが生成されます。',
    en: 'Build advanced Facebook search URLs — pick a category and filters as a form. Generates the same URL pattern as WhoPostedWhat.',
  },
  'engine.facebook.searchBtn':     { ja: 'Facebook で検索',                    en: 'Search Facebook' },
  'engine.facebook.emptyPreview':  { ja: 'キーワードを入力するか、フィルタを選ぶとFacebook URLが組み立てられます。', en: 'Type a keyword or pick a filter to build a Facebook URL.' },

  // Facebook category buttons
  'engine.facebook.cat.top.label':    { ja: 'トップ',          en: 'Top' },
  'engine.facebook.cat.top.hint':     { ja: '統合検索（最も関連性の高い結果）', en: 'Universal search (most relevant)' },
  'engine.facebook.cat.posts.label':  { ja: '投稿',           en: 'Posts' },
  'engine.facebook.cat.posts.hint':   { ja: 'テキスト投稿のみ', en: 'Text posts only' },
  'engine.facebook.cat.people.label': { ja: 'ユーザー',       en: 'People' },
  'engine.facebook.cat.people.hint':  { ja: '都市・学歴・職歴で人物を検索', en: 'Find people by city, education, or employer' },
  'engine.facebook.cat.photos.label': { ja: '写真',           en: 'Photos' },
  'engine.facebook.cat.photos.hint':  { ja: '写真を含む投稿', en: 'Posts containing photos' },
  'engine.facebook.cat.videos.label': { ja: '動画',           en: 'Videos' },
  'engine.facebook.cat.videos.hint':  { ja: '動画を含む投稿', en: 'Posts containing videos' },
  'engine.facebook.cat.pages.label':  { ja: 'ページ',         en: 'Pages' },
  'engine.facebook.cat.pages.hint':   { ja: 'Facebookページを検索', en: 'Find Facebook pages' },

  // Facebook section legends + options
  'engine.facebook.sec.postsFrom.legend':           { ja: '投稿者',                en: 'Posted by' },
  'engine.facebook.sec.postsFrom.opt.none':         { ja: '指定なし',              en: 'No filter' },
  'engine.facebook.sec.postsFrom.opt.author_me':    { ja: '自分の投稿',            en: 'My posts' },
  'engine.facebook.sec.postsFrom.opt.author_friends':{ ja: '友達の投稿',            en: 'My friends\' posts' },
  'engine.facebook.sec.postsFrom.opt.author_groups':{ ja: '所属グループ・ページの投稿', en: 'My groups\' & pages\' posts' },
  'engine.facebook.sec.postsFrom.opt.author_public':{ ja: '公開投稿',              en: 'Public posts' },
  'engine.facebook.sec.postsFrom.opt.author_page':  { ja: 'ページからの投稿',      en: 'From a page' },
  'engine.facebook.sec.postsFrom.idPlaceholder':    { ja: 'ページID（数字）',      en: 'Page ID (numbers)' },
  'engine.facebook.sec.postsFrom.idHint':           { ja: '例：119375054750638',    en: 'e.g. 119375054750638' },

  'engine.facebook.sec.postType.legend':           { ja: '投稿の種類',            en: 'Post type' },
  'engine.facebook.sec.postType.opt.none':         { ja: '指定なし',              en: 'No filter' },
  'engine.facebook.sec.postType.opt.interacted':   { ja: '見たことのある投稿',    en: 'Posts I\'ve seen' },

  'engine.facebook.sec.postedInGroup.legend':       { ja: 'グループ内',           en: 'In a group' },
  'engine.facebook.sec.postedInGroup.opt.none':     { ja: '指定なし',             en: 'No filter' },
  'engine.facebook.sec.postedInGroup.opt.my_groups':{ ja: '所属グループ',         en: 'My groups' },
  'engine.facebook.sec.postedInGroup.opt.group':    { ja: '特定グループ',         en: 'A specific group' },
  'engine.facebook.sec.postedInGroup.idPlaceholder':{ ja: 'グループID（数字）',    en: 'Group ID (numbers)' },
  'engine.facebook.sec.postedInGroup.idHint':       { ja: '例：574981909329531',   en: 'e.g. 574981909329531' },

  'engine.facebook.sec.taggedLocation.legend':      { ja: '位置情報',              en: 'Tagged location' },
  'engine.facebook.sec.taggedLocation.opt.none':    { ja: '指定なし',              en: 'No filter' },
  'engine.facebook.sec.taggedLocation.opt.location':{ ja: '特定の場所',            en: 'A specific location' },
  'engine.facebook.sec.taggedLocation.idPlaceholder':{ ja: '位置ID（数字）',        en: 'Location ID (numbers)' },
  'engine.facebook.sec.taggedLocation.idHint':      { ja: '例：115028691842393',    en: 'e.g. 115028691842393' },

  'engine.facebook.sec.sortBy.legend':              { ja: '並び順',                en: 'Sort by' },
  'engine.facebook.sec.sortBy.opt.none':            { ja: '関連性順（デフォルト）', en: 'Most relevant (default)' },
  'engine.facebook.sec.sortBy.opt.recent':          { ja: '新しい順',              en: 'Most recent' },

  'engine.facebook.sec.photoType.legend':           { ja: '写真の種類',            en: 'Photo type' },
  'engine.facebook.sec.photoType.opt.none':         { ja: '指定なし',              en: 'No filter' },
  'engine.facebook.sec.photoType.opt.interacted':   { ja: '見たことのある写真',     en: 'Photos I\'ve seen' },

  'engine.facebook.sec.videoSource.legend':         { ja: '動画ソース',            en: 'Video source' },
  'engine.facebook.sec.videoSource.opt.none':       { ja: '指定なし',              en: 'No filter' },
  'engine.facebook.sec.videoSource.opt.live':       { ja: 'ライブ配信',            en: 'Live' },
  'engine.facebook.sec.videoSource.opt.episode':    { ja: 'エピソード',            en: 'Episodes' },
  'engine.facebook.sec.videoSource.opt.feed':       { ja: '友達・グループから',     en: 'From friends and groups' },

  'engine.facebook.sec.peopleCity.legend':          { ja: '都市',                  en: 'City' },
  'engine.facebook.sec.peopleCity.idPlaceholder':   { ja: '都市ID（数字）',         en: 'City ID (numbers)' },
  'engine.facebook.sec.peopleCity.idHint':          { ja: '例：115028691842393',    en: 'e.g. 115028691842393' },

  'engine.facebook.sec.peopleEducation.legend':     { ja: '学歴',                  en: 'Education' },
  'engine.facebook.sec.peopleEducation.idPlaceholder':{ ja: '学校ID',               en: 'School ID' },
  'engine.facebook.sec.peopleEducation.idHint':     { ja: '例：751335894893898',    en: 'e.g. 751335894893898' },

  'engine.facebook.sec.peopleWork.legend':          { ja: '勤務先',                en: 'Employer' },
  'engine.facebook.sec.peopleWork.idPlaceholder':   { ja: '勤務先ID',              en: 'Employer ID' },
  'engine.facebook.sec.peopleWork.idHint':          { ja: '例：20531316728',        en: 'e.g. 20531316728' },

  'engine.facebook.sec.peopleMutual.legend':                  { ja: '共通の友達',              en: 'Mutual friends' },
  'engine.facebook.sec.peopleMutual.opt.none':                { ja: '指定なし',                en: 'No filter' },
  'engine.facebook.sec.peopleMutual.opt.my_friends':          { ja: '自分の友達',              en: 'My friends' },
  'engine.facebook.sec.peopleMutual.opt.friends_of_friends':  { ja: '友達の友達',              en: 'Friends of my friends' },
  'engine.facebook.sec.peopleMutual.opt.friends_of':          { ja: '特定の人の友達',          en: 'Friends of a specific person' },
  'engine.facebook.sec.peopleMutual.idPlaceholder':           { ja: '人物ID（数字）',          en: 'Person ID (numbers)' },
  'engine.facebook.sec.peopleMutual.idHint':                  { ja: '例：100000154813605',     en: 'e.g. 100000154813605' },

  'engine.facebook.sec.pagesVerified.legend':       { ja: '認証ステータス',         en: 'Verified status' },
  'engine.facebook.sec.pagesVerified.toggleLabel':  { ja: '認証済みページのみ',      en: 'Verified pages only' },

  'engine.facebook.sec.pagesCategory.legend':       { ja: 'ページカテゴリ',         en: 'Page category' },
  'engine.facebook.sec.pagesCategory.opt.none':     { ja: '指定なし',               en: 'No filter' },
  'engine.facebook.sec.pagesCategory.opt.local':    { ja: 'ローカルビジネス・場所',  en: 'Local business or place' },
  'engine.facebook.sec.pagesCategory.opt.company':  { ja: '企業・団体・機関',       en: 'Company, organization, or institution' },
  'engine.facebook.sec.pagesCategory.opt.brand':    { ja: 'ブランド・商品',         en: 'Brand or product' },
  'engine.facebook.sec.pagesCategory.opt.artist':   { ja: 'アーティスト・有名人',    en: 'Artist, band, or public figure' },
  'engine.facebook.sec.pagesCategory.opt.entertain':{ ja: 'エンタメ',               en: 'Entertainment' },
  'engine.facebook.sec.pagesCategory.opt.cause':    { ja: '主義・コミュニティ',     en: 'Cause or community' },

  'engine.facebook.sec.datePosted.legend':          { ja: '投稿日',                en: 'Date posted' },
  'engine.facebook.sec.datePosted.hint':            { ja: '開始日と終了日を選びます。空のままにするとこのフィルタは無視されます。', en: 'Pick start and end dates. Leave empty to skip this filter.' },
  'engine.facebook.sec.datePosted.from':            { ja: 'から',                  en: 'From' },
  'engine.facebook.sec.datePosted.to':              { ja: 'まで',                  en: 'To' },

  'ui.fbForm.ariaLabel':         { ja: 'Facebook 検索フォーム',                 en: 'Facebook search form' },
  'ui.fbForm.categoryLegend':    { ja: '検索の種類',                            en: 'Search type' },
  'ui.fbForm.keywordLegend':     { ja: '検索キーワード',                        en: 'Search keyword' },
  'ui.fbForm.keywordHint':       { ja: 'Facebook が必須としているフィールドです。単語または短いフレーズを入力してください（日本語・英語どちらも可）。', en: 'Required by Facebook. Type a single word or phrase (Japanese or English).' },
  'ui.fbForm.explainer.title':   { ja: 'Facebook 検索ツールの仕組み',           en: 'How the Facebook search tool works' },
  'ui.fbForm.explainer.intro':   { ja: 'Facebook は検索演算子（site: や AND など）を使いません。代わりに「検索カテゴリ」と「フィルタの組み合わせ」からURLを組み立てます。このツールはそのURLを代わりに作ります。', en: 'Facebook doesn’t use search operators (no site: or AND). Instead, it builds a URL from a search category plus a set of filters. This tool assembles that URL for you.' },
  'ui.fbForm.explainer.step1':   { ja: '上のカテゴリバーから検索カテゴリを選びます。カテゴリごとに表示されるフィルタが変わります（Facebook 自体がカテゴリごとに異なるフィルタを使うため）。', en: 'Pick a category from the bar above — each category exposes different filters because Facebook itself surfaces different filters per search type.' },
  'ui.fbForm.explainer.step2':   { ja: '必須のキーワード（日本語・英語）を下のフィールドに入力します。', en: 'Type the required search keyword (Japanese or English) in the field below.' },
  'ui.fbForm.explainer.step3':   { ja: '結果を絞るためにフィルタを追加します（各セクションから1つずつ）。すべて空にすれば最も広い検索になります。', en: 'Add filters to narrow your results — one option per section. Leave them blank for the broadest search.' },
  'ui.fbForm.explainer.step4':   { ja: '「Facebook で検索」を押すとURLが開きます。「コピー」でURLをコピーして共有することもできます。', en: 'Click “Search Facebook” to open the URL, or “Copy” to copy and share it.' },
  'ui.fbForm.explainer.dismiss': { ja: '閉じる',                                 en: 'Dismiss' },
  'ui.fbForm.attribution':       { ja: 'Henk van Ess、Daniel Endresz、Dan Nemec、Tormund Gerhardsen の調査手法に基づく', en: 'Inspired by Henk van Ess, Daniel Endresz, Dan Nemec, Tormund Gerhardsen' },
  'ui.fbForm.keywordPlaceholder':{ ja: '検索キーワードを入力',                  en: 'Type your search keyword' },
  'ui.fbForm.noFilters':         { ja: 'このカテゴリには追加フィルタはありません。', en: 'No additional filters for this category.' },
  'ui.fbForm.toggleDefault':     { ja: '有効化',                                en: 'Enable' },

  // ===== Engine: Yahoo! Japan =====
  'engine.yahoojp.label':     { ja: 'Yahoo! Japan',                            en: 'Yahoo! Japan' },
  'engine.yahoojp.subtitle':  {
    ja: 'Yahoo! JAPAN の高度な検索クエリを組み立てます。日本のブログ・知恵袋・ニュースで Google が拾いきれないインデックスを補うのに有効です。',
    en: 'Build advanced Yahoo! JAPAN search queries — useful for Japanese blogs, Q&A, and news that Google undersamples.',
  },
  'engine.yahoojp.searchBtn':    { ja: 'Yahoo! Japan で検索',                  en: 'Search Yahoo! Japan' },
  'engine.yahoojp.emptyPreview': { ja: '上で単語を追加すると、ここに組み立てたクエリが表示されます', en: 'Your assembled query will appear here once you add terms above' },

  // Yahoo! Japan operator labels (same set as Google minus inanchor)
  'engine.yahoojp.op.none.label':     { ja: '単語',                            en: 'Word' },
  'engine.yahoojp.op.site.label':     { ja: 'サイト (site:)',                  en: 'Site (site:)' },
  'engine.yahoojp.op.intitle.label':  { ja: 'タイトル内 (intitle:)',           en: 'In title (intitle:)' },
  'engine.yahoojp.op.intext.label':   { ja: '本文内 (intext:)',                en: 'In body (intext:)' },
  'engine.yahoojp.op.inurl.label':    { ja: 'URL内 (inurl:)',                  en: 'In URL (inurl:)' },

  // Yahoo! Japan composer pills
  'engine.yahoojp.pill.none':     { ja: '通常の単語',                          en: 'Plain word' },
  'engine.yahoojp.pill.site':     { ja: 'サイト指定',                          en: 'On a site' },
  'engine.yahoojp.pill.intitle':  { ja: 'タイトル内',                          en: 'In page title' },
  'engine.yahoojp.pill.inurl':    { ja: 'URL内',                               en: 'In page URL' },
  'engine.yahoojp.pill.intext':   { ja: '本文内',                              en: 'In page body' },

  // Yahoo! Japan drawer items
  'engine.yahoojp.drawer.site.label':            { ja: '特定サイト内を検索',                en: 'Search a specific site' },
  'engine.yahoojp.drawer.site.desc':             { ja: 'ドメインに結果を絞ります（例：news.yahoo.co.jp）', en: 'Limit results to one domain, e.g. news.yahoo.co.jp' },
  'engine.yahoojp.drawer.intitle.label':         { ja: 'タイトル内を検索',                  en: 'Match in page title' },
  'engine.yahoojp.drawer.intitle.desc':          { ja: '結果のページタイトルに含まれる単語', en: 'A term that must appear in the result\'s title' },
  'engine.yahoojp.drawer.inurl.label':           { ja: 'URL内を検索',                       en: 'Match in page URL' },
  'engine.yahoojp.drawer.inurl.desc':            { ja: '結果のURLに含まれる単語',           en: 'A term that must appear in the result\'s URL' },
  'engine.yahoojp.drawer.intext.label':          { ja: '本文内を検索',                      en: 'Match in page body' },
  'engine.yahoojp.drawer.intext.desc':           { ja: 'ページの本文に含まれる単語',         en: 'A term that must appear in the page content' },
  'engine.yahoojp.drawer.filetype.label':        { ja: 'ファイル形式',                      en: 'File type' },
  'engine.yahoojp.drawer.filetype.desc':         { ja: 'PDF・Word などに結果を絞ります',     en: 'Restrict to PDF, Word, etc.' },
  'engine.yahoojp.drawer.dateRange.label':       { ja: '日付範囲',                          en: 'Date range' },
  'engine.yahoojp.drawer.dateRange.desc':        { ja: '2つの日付の間に結果を絞ります',       en: 'Restrict results to a window of dates' },

  // Yahoo! Japan templates
  'engine.yahoojp.tpl.site.title':     { ja: 'サイト指定検索',                  en: 'Search a specific site' },
  'engine.yahoojp.tpl.site.desc':      { ja: 'ドメインに絞ります',               en: 'Limit results to one domain' },
  'engine.yahoojp.tpl.docs.title':     { ja: '文書を検索',                       en: 'Search documents' },
  'engine.yahoojp.tpl.docs.desc':      { ja: 'PDF・Wordファイルを探します',       en: 'Find PDF or Word files' },
  'engine.yahoojp.tpl.daterange.title':{ ja: '日付範囲で検索',                   en: 'Search a date range' },
  'engine.yahoojp.tpl.daterange.desc': { ja: '2つの日付の間に結果を絞ります',     en: 'Restrict results to a window of dates' },

  // ===== UI strings (composer) =====
  'ui.composer.placeholder':    { ja: '単語を入力して Enter で追加',           en: 'Type a term, then press Enter to add it' },
  'ui.composer.ariaLabel':      { ja: '新しい検索単語を追加',                  en: 'Add a new search term' },
  'ui.composer.ghostLabel':     { ja: '追加されるチップ:',                     en: 'Will add:' },
  'ui.composer.opPillsLabel':   { ja: '演算子の種類',                          en: 'Operator type' },
  'ui.composer.quoteToggleLabel':{ ja: '完全一致',                             en: 'Exact phrase' },
  'ui.composer.quoteToggleTitle':{
    ja: '完全一致 — フレーズをそのまま検索します。ショートカット：「" "」で囲んで入力。',
    en: 'Exact phrase — match the words as written. Shortcut: wrap the term in "quotes".',
  },
  'ui.composer.modifierRowLabel': { ja: '修飾子',                               en: 'Modifier' },
  'ui.composer.notToggleLabel': { ja: '除外',                                   en: 'Exclude' },
  'ui.composer.notToggleTitle': {
    ja: 'この単語を結果から除外します。ショートカット：「−」で始める。',
    en: 'Exclude this term from the results. Shortcut: start the term with "−".',
  },
  'ui.composer.orToggleLabel':  { ja: '代替（OR）',                            en: 'Alternative (OR)' },
  'ui.composer.orToggleTitle':  {
    ja: '直前のチップの代替として追加します。ショートカット：Shift + Enter。',
    en: 'Add as an alternative to the previous term. Shortcut: Shift + Enter.',
  },
  'ui.composer.quoteHint':      {
    ja: 'フレーズを完全一致で検索します。ショートカット：「" "」で囲んで入力。',
    en: 'Matches the exact phrase. Shortcut: wrap a "word" or "phrase" in quotes.',
  },
  'ui.composer.pasteHint':      {
    ja: '1つのチップとして追加されます。Enter で確定。引用符付きで貼り付けると、別々のチップに分かれます。',
    en: 'This will commit as a single chip. Press Enter to confirm, or paste text with quote marks to get separate chips.',
  },
  'ui.composer.commitGroupLabel':{ ja: 'チップを追加',                          en: 'Add the term' },
  'ui.composer.btnAnd':         { ja: '追加',                                   en: 'Add' },
  'ui.composer.btnAddSpecial':  { ja: '+ 演算子を追加',                         en: '+ Search Operators' },
  'ui.composer.btnAddSpecialAria':{ ja: '検索演算子を追加',                     en: 'Add a search operator' },
  'ui.composer.helpText':       {
    ja: '単語を入力して Enter を押すとチップになります。チップをクリックすると編集できます。',
    en: 'Type a term and press Enter. It will become a chip you can edit by clicking it.',
  },
  'ui.composer.pasteToast':     {
    ja: (vars) => '貼り付けから ' + vars.count + ' チップを追加しました — ',
    en: (vars) => 'Added ' + vars.count + ' chip' + (vars.count === 1 ? '' : 's') + ' from paste — ',
  },
  'ui.composer.pasteUndo':      { ja: '取り消し',                              en: 'Undo' },

  // ===== UI strings (chip area) =====
  'ui.chipArea.orGroupAriaLabel':  { ja: '「OR」グループ',                       en: 'OR group' },
  'ui.chipArea.orGroupLabel':      { ja: '次のいずれかを含む',                   en: 'Any of these' },
  'ui.chipArea.orGroupHelper':     { ja: '以下のいずれかの単語に一致するものを検索します。', en: 'Matches any of these terms.' },
  'ui.chipArea.orGroupAdd':        { ja: '+ 代替を追加',                        en: '+ Another alternative' },
  'ui.chipArea.orGroupAddTitle':   { ja: 'OR の代替をもう一つ追加',              en: 'Add another OR alternative' },
  'ui.chipArea.andSeam':           { ja: 'AND',                                 en: 'and' },
  'ui.chipArea.emptyHeading':      { ja: 'テンプレートから始める:',              en: 'Start from a template:' },
  'ui.chipArea.emptyHint':         { ja: '検索単語がここに表示されます。下に単語を入力するか、上からレシピを選んでください。', en: 'Your search terms will appear here. Type a term below, or pick a recipe above.' },
  'ui.chipArea.emptyAdvancedFallback':{
    ja: 'まだ単語がありません。下に単語を入力して Enter を押してください。',
    en: 'No terms yet. Type one below and press Enter.',
  },
  'ui.chipArea.dragHint':          { ja: 'Alt+矢印キーでチップを移動',           en: 'Press Alt+Arrow to move the chip' },

  // OR / AND connector
  'ui.orConnector.label':          { ja: 'OR',                                  en: 'OR' },
  'ui.orConnector.ariaLabel':      { ja: 'コネクタ：OR',                         en: 'Connector: OR' },
  'ui.orConnector.deleteAria':     { ja: 'OR コネクタを削除',                    en: 'Delete OR connector' },
  'ui.andConnector.label':         { ja: 'AND',                                 en: 'AND' },
  'ui.andConnector.ariaLabel':     { ja: 'コネクタ：AND',                        en: 'Connector: AND' },
  'ui.andConnector.deleteAria':    { ja: 'AND コネクタを削除',                   en: 'Delete AND connector' },
  'ui.boolConnector.toggleHint':   { ja: 'クリックで OR / AND を切り替え',        en: 'Click to toggle between OR and AND' },

  // ===== UI strings (drawer) =====
  'ui.drawer.beginnerMore':        { ja: 'さらに表示',                          en: 'More options' },
  'ui.drawer.advancedKeywordsHeading':{ ja: 'キーワード演算子',                  en: 'Keyword operators' },
  'ui.drawer.advancedSocialHeading':  { ja: 'ソーシャルメディアサイト',           en: 'Social media sites' },
  'ui.drawer.advancedSpecialsHeading':{ ja: '追加フィルタ',                      en: 'Additional filters' },

  // ===== UI strings (chip popover) =====
  'ui.popover.ariaLabel':          { ja: 'チップの警告',                        en: 'Chip warning' },
  'ui.popover.glyphAriaLabel':     {
    ja: (vars) => '警告: ' + vars.text,
    en: (vars) => 'Warning: ' + vars.text,
  },

  // ===== UI strings (chip toolbar) =====
  'ui.toolbar.ariaLabel':          { ja: '選択中のチップへの操作',              en: 'Actions on selected chips' },
  'ui.toolbar.count':              {
    ja: (vars) => vars.n + ' 件選択中',
    en: (vars) => vars.n + ' selected',
  },
  'ui.toolbar.opLabel':            { ja: '演算子を変更:',                       en: 'Change operator:' },
  'ui.toolbar.opAria':             { ja: '選択中の全チップの演算子を変更',       en: 'Change operator for all selected' },
  'ui.toolbar.opMixed':            { ja: '（複数）',                            en: '(mixed)' },
  'ui.toolbar.negate':             { ja: '除外 (-)',                            en: 'Negate (-)' },
  'ui.toolbar.unnegate':           { ja: '除外を解除',                          en: 'Remove negation' },
  'ui.toolbar.delete':             { ja: '削除',                                en: 'Delete' },
  'ui.toolbar.clearSelection':     { ja: '選択を解除',                          en: 'Clear selection' },

  // ===== Chip strings (keyword) =====
  'chip.keyword.deleteAria':       { ja: 'チップを削除',                        en: 'Delete chip' },
  'chip.keyword.orHandleAria':     { ja: 'OR の代替を追加',                     en: 'Add OR alternative' },
  'chip.keyword.orHandleText':     { ja: '+ OR',                                en: '+ OR' },
  'chip.keyword.notHandleText':    { ja: '− NOT',                               en: '− NOT' },
  'chip.keyword.opSelectAria':     { ja: '演算子を選ぶ',                        en: 'Choose operator' },
  'chip.keyword.quoteOn':          { ja: '完全一致を解除',                      en: 'Remove exact-match' },
  'chip.keyword.quoteOff':         { ja: '完全一致',                            en: 'Exact phrase' },
  'chip.keyword.notOn':            { ja: '除外を解除',                          en: 'Remove negation' },
  'chip.keyword.notOff':           { ja: '除外 (-)',                            en: 'Negate (-)' },

  'chip.keyword.validate.multiWord': {
    ja: '複数語を引用符なしで指定しています — 最初の語だけが演算子に結合されます。完全一致を有効にしてください。',
    en: 'Multiple words without quoting — only the first word binds to the operator. Enable exact-match.',
  },
  'chip.keyword.validate.multiWordFix': { ja: '完全一致を有効化',                en: 'Enable exact-match' },
  'chip.keyword.validate.nonLatinForbidden': {
    ja: 'このフィールドは半角英数字のみ受け付けます。日本語などの非ASCII文字は検索でヒットしません。',
    en: 'This operator expects Latin-script text. The search engine will not match non-Latin (e.g. Japanese) content here.',
  },
  'chip.keyword.validate.singleWordQuoted': {
    ja: '1単語を完全一致にすると、スペル補正や類義語マッチが無効になります。通常は不要です。',
    en: 'Quoting a single word disables spell-correction and synonyms. Usually not needed.',
  },
  'chip.keyword.validate.singleWordQuotedFix': { ja: '完全一致を解除',          en: 'Remove quoting' },

  // ===== Chip strings (date-range) =====
  'chip.dateRange.deleteAria':     { ja: '日付範囲を削除',                       en: 'Delete date range' },
  'chip.dateRange.afterLabel':     { ja: '以降:',                                en: 'After:' },
  'chip.dateRange.afterAria':      { ja: '指定日以降',                            en: 'After date' },
  'chip.dateRange.beforeLabel':    { ja: '以前:',                                en: 'Before:' },
  'chip.dateRange.beforeAria':     { ja: '指定日以前',                            en: 'Before date' },
  'chip.dateRange.validate.inverted': {
    ja: '日付範囲が逆転しています — 「以降」が「以前」より新しいため、結果はゼロ件になります。',
    en: 'Date range is inverted — "After" is later than "Before"; no results will match.',
  },
  'chip.dateRange.validate.invertedFix': { ja: '日付を入れ替える',                en: 'Swap dates' },
  'chip.dateRange.calendar.placeholder': { ja: '日付を選択',                       en: 'Pick a date' },
  'chip.dateRange.calendar.openAria':    { ja: 'カレンダーを開く',                 en: 'Open calendar' },
  'chip.dateRange.calendar.prevAria':    { ja: '前の月',                            en: 'Previous month' },
  'chip.dateRange.calendar.nextAria':    { ja: '次の月',                            en: 'Next month' },
  'chip.dateRange.calendar.clearAria':   { ja: '日付をクリア',                     en: 'Clear date' },
  'chip.dateRange.calendar.todayLabel':  { ja: '今日',                              en: 'Today' },
  'chip.dateRange.calendar.months': {
    ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
  'chip.dateRange.calendar.weekdays': {
    ja: ['日', '月', '火', '水', '木', '金', '土'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },

  // ===== Chip strings (proximity) =====
  'chip.proximity.deleteAria':     { ja: '近接検索を削除',                       en: 'Delete proximity search' },
  'chip.proximity.term1Placeholder':{ ja: '1つ目の単語',                          en: 'First word' },
  'chip.proximity.term1Aria':      { ja: '1つ目の単語',                          en: 'First word' },
  'chip.proximity.distLabel':      { ja: '距離',                                 en: 'within' },
  'chip.proximity.distAria':       { ja: '2語の間の単語数',                      en: 'Number of words between the two terms' },
  'chip.proximity.distSuffix':     { ja: '語以内',                              en: 'words of' },
  'chip.proximity.term2Placeholder':{ ja: '2つ目の単語',                          en: 'Second word' },
  'chip.proximity.term2Aria':      { ja: '2つ目の単語',                          en: 'Second word' },

  // ===== Chip strings (filter, X / Twitter) =====
  'chip.filter.deleteAria':        { ja: 'フィルタを削除',                       en: 'Delete filter' },
  'chip.filter.selectAria':        { ja: 'フィルタの種類を選ぶ',                 en: 'Choose filter type' },
  'chip.filter.opt.none':          { ja: '指定なし',                              en: 'No filter' },
  'chip.filter.opt.media':         { ja: 'メディア（画像または動画）',            en: 'Media (photos or video)' },
  'chip.filter.opt.images':        { ja: '画像のみ',                              en: 'Images only' },
  'chip.filter.opt.videos':        { ja: '動画のみ',                              en: 'Videos only' },
  'chip.filter.opt.native_video':  { ja: 'Twitter ネイティブ動画',                en: 'Native Twitter video' },
  'chip.filter.opt.spaces':        { ja: 'Twitter Spaces',                       en: 'Twitter Spaces' },
  'chip.filter.opt.links':         { ja: 'リンクを含む',                          en: 'Contains a link' },
  'chip.filter.opt.mentions':      { ja: 'アカウントへの言及',                    en: 'Mentions an account' },
  'chip.filter.opt.hashtags':      { ja: 'ハッシュタグを含む',                    en: 'Contains a hashtag' },
  'chip.filter.opt.replies':       { ja: '返信',                                  en: 'Replies' },
  'chip.filter.opt.quote':         { ja: '引用ツイート',                          en: 'Quote tweets' },
  'chip.filter.opt.nativeretweets':{ ja: 'ネイティブ・リツイート',                en: 'Native retweets' },
  'chip.filter.opt.retweets':      { ja: '旧仕様リツイート',                      en: 'Legacy retweets' },
  'chip.filter.opt.verified':      { ja: '認証済み（旧）',                        en: 'Verified accounts (legacy)' },
  'chip.filter.opt.blue_verified': { ja: 'Twitter Blue アカウント',               en: 'Twitter Blue accounts' },
  'chip.filter.opt.follows':       { ja: 'フォロー中のアカウント',                en: 'Accounts I follow' },
  'chip.filter.opt.has_engagement':{ ja: 'エンゲージメントあり',                  en: 'Has engagement' },
  'chip.filter.validate.notNegatable': {
    ja: 'このフィルタは除外（NOT）にできません。除外を解除するか、別のフィルタを選んでください。',
    en: 'This filter cannot be negated. Remove the negation or pick another filter.',
  },
  'chip.filter.validate.notNegatableFix': { ja: '除外を解除',                    en: 'Remove negation' },
  'chip.filter.notOn':             { ja: '除外を解除',                            en: 'Remove negation' },
  'chip.filter.notOff':            { ja: '除外 (-)',                              en: 'Negate (-)' },

  // ===== Chip strings (engagement, X / Twitter) =====
  'chip.engagement.deleteAria':    { ja: 'エンゲージメント条件を削除',            en: 'Delete engagement threshold' },
  'chip.engagement.metricAria':    { ja: 'エンゲージメント指標を選ぶ',            en: 'Choose engagement metric' },
  'chip.engagement.metric.faves':  { ja: 'いいね',                                en: 'Likes' },
  'chip.engagement.metric.replies':{ ja: '返信',                                  en: 'Replies' },
  'chip.engagement.metric.retweets':{ ja: 'リツイート',                           en: 'Retweets' },
  'chip.engagement.dirMin':        { ja: '下限 ≥',                                en: 'At least ≥' },
  'chip.engagement.dirMax':        { ja: '上限 ≤',                                en: 'At most ≤' },
  'chip.engagement.dirMinAria':    { ja: '下限',                                  en: 'Minimum' },
  'chip.engagement.dirMaxAria':    { ja: '上限',                                  en: 'Maximum' },
  'chip.engagement.numAria':       { ja: '数値',                                  en: 'Numeric value' },
  'chip.engagement.validate.invalid':    { ja: '無効な値です。0以上の整数を入力してください。', en: 'Invalid value. Enter a non-negative integer.' },
  'chip.engagement.validate.invalidFix': { ja: '100 にリセット',                  en: 'Reset to 100' },

  // ===== Chip strings (filetype) =====
  'chip.filetype.deleteAria':      { ja: 'ファイル形式を削除',                    en: 'Delete file type' },
  'chip.filetype.selectAria':      { ja: 'ファイル形式を選ぶ',                    en: 'Choose file type' },
  'chip.filetype.opt.none':        { ja: '指定なし',                              en: 'No filter' },
  'chip.filetype.opt.txt':         { ja: 'テキスト (txt)',                        en: 'Text (txt)' },

  // ===== Chip strings (number-range) =====
  'chip.numberRange.deleteAria':   { ja: '数値範囲を削除',                        en: 'Delete number range' },
  'chip.numberRange.lowPlaceholder':{ ja: 'から',                                 en: 'from' },
  'chip.numberRange.lowAria':      { ja: '下限値',                                en: 'Lower bound' },
  'chip.numberRange.highPlaceholder':{ ja: 'まで',                                en: 'to' },
  'chip.numberRange.highAria':     { ja: '上限値',                                en: 'Upper bound' },
  'chip.numberRange.prefixAria':   { ja: '接頭辞',                                en: 'Prefix' },

  // ===== Tip framework =====
  'ui.tip.dismissAria':            { ja: 'ヒントを閉じる',                       en: 'Dismiss tip' },

  // ===== Idiom panel chrome =====
  'idiom.empty':       { ja: 'このエンジン用のレシピはありません。', en: 'No recipes for this engine.' },
  'idiom.pillTitle':   { ja: '検索レシピ集',                          en: 'Recipe playbook' },
  'idiom.pillCount':   {
    ja: (v) => v.n + ' レシピ',
    en: (v) => v.n + ' recipe' + (v.n === 1 ? '' : 's'),
  },
  'idiom.toggleShow':  { ja: '📖 説明',           en: '📖 Descriptions' },
  'idiom.toggleHide':  { ja: '📖 説明を隠す',     en: '📖 Hide descriptions' },

  // ===== Idiom panel — search + group filter =====
  'idiom.search.placeholder': { ja: 'レシピを検索...', en: 'Search recipes...' },
  'idiom.groupFilter.label':  { ja: 'グループで絞り込む', en: 'Filter by group' },
  'idiom.groupFilter.all':    { ja: 'すべて', en: 'All' },

  // ===== Idiom panel — inspector section headings =====
  'idiom.section.whatItDoes': { ja: 'このレシピがすること',     en: 'What this recipe does' },
  'idiom.section.anatomy':    { ja: 'レシピの構造',             en: 'Recipe anatomy' },
  'idiom.section.howto':      { ja: '手動で組み立てる手順',      en: 'Build it manually' },
  'idiom.section.assembled':  { ja: '組み立て後のクエリ',         en: 'Assembled query' },

  // ===== Idiom panel — inspector action buttons =====
  'idiom.applyRecipe':    { ja: 'レシピをすべて追加',     en: 'Add recipe to query' },
  'idiom.replaceRecipe':  { ja: '現在のクエリを置き換え', en: 'Replace current query' },
  'idiom.reapply':        { ja: 'もう一度追加',           en: 'Apply again' },
  'idiom.applied':        { ja: '適用済み',               en: 'Applied' },
  'idiom.addThisChip':    { ja: 'このチップだけ追加',     en: 'Add only this chip' },

  // ===== Idiom panel — empty / fallback states =====
  'idiom.search.noResults': {
    ja: (v) => '「' + v.q + '」に一致するレシピはありません',
    en: (v) => 'No recipes match "' + v.q + '"',
  },
  'idiom.anatomy.unavailable': {
    ja: 'レシピの構造を取得できませんでした。「追加」を押して直接試してください。',
    en: "Couldn't extract this recipe's anatomy. Press Apply to try it directly.",
  },

  // ===== Idiom panel — "Build it manually" step templates =====
  //
  // Strings use [[...]] markers around control names; the renderer replaces
  // them with `.idiom-control-mention` styled spans.
  //
  'idiom.howto.note': {
    ja: 'ℹ︎ 「」で囲まれている部分がキーワードフィールドに入力する内容です（「」自体は入力しません）。',
    en: 'ℹ︎ Whatever appears between the « » marks is what you type into the keyword field (don\'t type the marks themselves).',
  },
  // keyword chip — plain word, no operator
  'idiom.howto.keyword.plain': {
    ja: (v) => v.text
      ? '「' + v.text + '」をキーワードフィールドに入力し、Enter を押します。'
      : 'キーワードを「」で囲んでフィールドに入力し（例：「選挙」）、Enter を押します。',
    en: (v) => v.text
      ? 'Type «' + v.text + '» into the keyword field, then press Enter.'
      : 'Type your keyword between the « » marks (e.g., «election»), then press Enter.',
  },
  // keyword chip — with content operator (site:, intitle:, etc.)
  'idiom.howto.keyword.withOp': {
    ja: (v) => v.text
      ? '「' + v.text + '」をキーワードフィールドに入力し、演算子バーから [[' + v.opLabel + ']] を選んで Enter。'
      : 'キーワードを「」で囲んで入力し（例：site: なら「.go.jp」、intitle: なら「記者」）、[[' + v.opLabel + ']] を選んで Enter。',
    en: (v) => v.text
      ? 'Type «' + v.text + '» into the keyword field, click [[' + v.opLabel + ']] in the operator row, then press Enter.'
      : 'Type your term between the « » marks (e.g., «.gov» with site: or «journalist» with intitle:), click [[' + v.opLabel + ']], then Enter.',
  },
  // keyword chip — quoted (literal phrase)
  'idiom.howto.keyword.quoted': {
    ja: (v) => {
      const head = v.text
        ? '「' + v.text + '」をキーワードフィールドに完全一致のフレーズとして入力'
        : '完全一致のフレーズを「」で囲んで入力（例：「東京大学」）';
      const op = v.opLabel ? '、[[' + v.opLabel + ']] を選び' : '';
      return head + op + '、[[完全一致]] をオンにして Enter。';
    },
    en: (v) => {
      const head = v.text
        ? 'Type «' + v.text + '» into the keyword field as a single literal phrase'
        : 'Type your literal phrase between the « » marks (e.g., «John F Smith»)';
      const op = v.opLabel ? ', click [[' + v.opLabel + ']]' : '';
      return head + op + ', enable [[Literal quote]], then press Enter.';
    },
  },
  // keyword chip — negate (excluded word, no operator)
  'idiom.howto.keyword.negate': {
    ja: (v) => v.text
      ? '「' + v.text + '」を除外する単語として入力し、Enter の前に [[− NOT]] を押します（または「-」で始めて入力）。'
      : '除外したい単語を「」で囲んで入力（例：「広告」）、Enter の前に [[− NOT]] を押します（または「-」で始めて入力）。',
    en: (v) => v.text
      ? 'Type «' + v.text + '» into the keyword field to exclude it, press [[− NOT]] before Enter (or start with "-").'
      : 'Type the word to exclude between the « » marks (e.g., «advertisement»), press [[− NOT]] before Enter (or start with "-").',
  },
  // keyword chip — negate + operator
  'idiom.howto.keyword.negateOp': {
    ja: (v) => v.text
      ? '「' + v.text + '」を入力し、[[' + v.opLabel + ']] を選んだあと、Enter の前に [[− NOT]] を押します。'
      : '除外したい単語を「」で囲んで入力（例：「広告」）、[[' + v.opLabel + ']] を選んだあと、Enter の前に [[− NOT]] を押します。',
    en: (v) => v.text
      ? 'Type «' + v.text + '» into the keyword field, click [[' + v.opLabel + ']], then [[− NOT]] before Enter.'
      : 'Type the word to exclude between the « » marks (e.g., «propaganda»), click [[' + v.opLabel + ']], then [[− NOT]] before Enter.',
  },
  // or-connector chip
  'idiom.howto.or': {
    ja: '直前のチップで [[+OR]] を押し、新しいキーワードフィールドに代替の単語を入力します（同じ「」記法）。',
    en: 'Click [[+Or]] on the previous chip, then type the alternative in the new keyword field (same « » convention).',
  },
  // special chip — date-range
  'idiom.howto.special.dateRange': {
    ja: (v) => {
      const parts = [];
      if (v.after)  parts.push('「以降」' + v.after);
      if (v.before) parts.push('「以前」' + v.before);
      const range = parts.length ? '、' + parts.join(' と ') + ' を入力' : '、日付を入力';
      return '[[+ 追加]] を押し、[[' + v.itemLabel + ']] を選んで' + range + '。';
    },
    en: (v) => {
      const parts = [];
      if (v.after)  parts.push('"After" ' + v.after);
      if (v.before) parts.push('"Before" ' + v.before);
      const range = parts.length ? ', enter ' + parts.join(' and ') : ', then fill in the dates';
      return 'Click [[+ Add]], pick [[' + v.itemLabel + ']]' + range + '.';
    },
  },
  // special chip — filetype
  'idiom.howto.special.filetype': {
    ja: (v) => '[[+ 追加]] を押し、[[' + v.itemLabel + ']] を選んでリストから「' + v.value.toUpperCase() + '」を選択。',
    en: (v) => 'Click [[+ Add]], pick [[' + v.itemLabel + ']], then choose "' + v.value.toUpperCase() + '" from the list.',
  },
  // special chip — filter (X engine)
  'idiom.howto.special.filter': {
    ja: (v) => '[[+ 追加]] を押し、[[' + v.itemLabel + ']] を選び、「' + v.filterValue + '」を指定' + (v.negate ? '、さらに [[− NOT]] を有効化して除外' : '') + '。',
    en: (v) => 'Click [[+ Add]], pick [[' + v.itemLabel + ']], select "' + v.filterValue + '"' + (v.negate ? ', then enable [[− NOT]] to exclude it' : '') + '.',
  },
  // special chip — engagement (X engine)
  'idiom.howto.special.engagement': {
    ja: (v) => '[[+ 追加]] を押し、[[' + v.itemLabel + ']] を選び、「' + v.metric + '」（' + (v.direction === 'min' ? '下限' : '上限') + '）に ' + v.value + ' を入力。',
    en: (v) => 'Click [[+ Add]], pick [[' + v.itemLabel + ']], choose "' + v.metric + '" (' + v.direction + ') and enter ' + v.value + '.',
  },
  // special chip — proximity
  'idiom.howto.special.proximity': {
    ja: (v) => {
      const t1 = v.term1 ? '「' + v.term1 + '」' : '1つ目の単語を「」で囲んで入力（例：「爆発」）';
      const t2 = v.term2 ? '「' + v.term2 + '」' : '2つ目の単語を「」で囲んで入力（例：「東京」）';
      return '[[+ 追加]] を押し、[[' + v.itemLabel + ']] を選び、' + t1 + ' と ' + t2 + ' を距離 ' + v.distance + ' で指定。';
    },
    en: (v) => {
      const t1 = v.term1 ? '«' + v.term1 + '»' : 'first term between « » (e.g., «explosion»)';
      const t2 = v.term2 ? '«' + v.term2 + '»' : 'second term between « » (e.g., «Beirut»)';
      return 'Click [[+ Add]], pick [[' + v.itemLabel + ']], enter ' + t1 + ' and ' + t2 + ' with distance ' + v.distance + '.';
    },
  },
  // special chip — number-range
  'idiom.howto.special.numberRange': {
    ja: (v) => '[[+ 追加]] を押し、[[' + v.itemLabel + ']] を選び、下限 ' + v.low + ' と上限 ' + v.high + (v.prefix ? '、接頭辞「' + v.prefix + '」' : '') + ' を入力。',
    en: (v) => 'Click [[+ Add]], pick [[' + v.itemLabel + ']], enter min ' + v.low + ' and max ' + v.high + (v.prefix ? ' with prefix "' + v.prefix + '"' : '') + '.',
  },
  // special chip — generic fallback
  'idiom.howto.special.generic': {
    ja: (v) => '[[+ 追加]] を押し、[[' + v.itemLabel + ']] を選んでフィールドを設定。',
    en: (v) => 'Click [[+ Add]], pick [[' + v.itemLabel + ']] and fill the fields.',
  },

  // ===== Warnings =====
  'warning.queryTooLong':          {
    ja: (v) => '⚠️ クエリが長すぎます（' + v.count + ' 語）。およそ32語を超えると検索エンジンが結果を返さないことが多いため、簡略化してみてください。',
    en: (v) => '⚠️ Query is long (' + v.count + ' words). Search engines often return few or no results past about 32 words. Try simplifying.',
  },
  'warning.overRestricted':        {
    ja: (v) => '⚠️ ' + v.count + ' 個の検索制約を同時に指定しています。制約が多すぎるとゼロ件になりがちです。少なく始めて、結果が広すぎたら追加してください。',
    en: (v) => '⚠️ ' + v.count + ' restrictions are active at once. Heavily restricted queries often return zero results. Start with fewer and add more if results are too broad.',
  },
  'warning.operatorNonLatinChars':   {
    ja: (v) => '⚠️ フィールド ' + v.labels + ' に非ASCII文字（日本語など）が含まれています。これらの演算子は半角英数字を期待するため、検索エンジンは日本語コンテンツにマッチしません。',
    en: (v) => '⚠️ Field(s) ' + v.labels + ' contain non-Latin characters. These operators expect Latin-script (ASCII) text and will not match Japanese content.',
  },

  // ===== Tips =====
  'tip.filetypePdf':               {
    ja: '💡 ヒント：PDF をサイト制約と組み合わせると、限られた範囲の文書を発見できます。例えば <code>site:go.jp</code> や <code>site:ac.jp</code> を追加すると、政府文書や学術文書を絞り込めます。',
    en: '💡 Tip: combine PDF with a site restriction to surface restricted documents. Adding <code>site:go.jp</code> or <code>site:ac.jp</code> often reveals official or academic files.',
  },
  'tip.keywordNameVariants':       {
    ja: '💡 ヒント：日本語の検索ではしばしば全角・半角や英数字の表記ゆれが結果を分けます。ヘッダーの「全角・半角の統一」をオンにすると、自動的にこれらを揃えて検索できます。',
    en: '💡 Tip: Japanese searches often hit full-width/half-width variants that split results. Enable "Full-width / half-width normalization" at the top to unify them automatically.',
  },
  'tip.proximityUsage':            {
    ja: '💡 ヒント：近接検索は2つの人物や組織が一緒に言及されるケースを見つける強力なOSINTツールです。短い距離（3〜5語）は直接的な言及を、長い距離（10〜20語）は文脈的な関係を見つけます。',
    en: '💡 Tip: proximity search is one of the strongest OSINT tools for finding two entities mentioned together. Small distances (3–5) find direct mentions; larger ones (10–20) find any contextual relationship.',
  },
  'tip.dateRangeBoth':             {
    ja: '💡 狭い日付範囲とサイト制約の組み合わせは、特定の事件の報道を見つけるのに非常に有効です。この範囲を <code>intitle:</code> チップと組み合わせて、特定の事件に関する記事を探してみてください。',
    en: '💡 Narrow date ranges combined with site restrictions are very effective for event coverage. Try combining this range with an <code>intitle:</code> chip to find articles about a specific event.',
  },
  'tip.keywordsNoRestrictions':    {
    ja: '💡 ヒント：プレーンなキーワードだけだと結果が多すぎることがよくあります。サイト制約や日付範囲（「+ 演算子を追加」ボタン）を加えて絞り込みを検討しましょう。',
    en: '💡 Tip: plain keywords alone often return too many results. Consider adding a site restriction or date range (the "+ Search Operators" button) to narrow them.',
  },
};

/**
 * Resolve a key to its localized string.
 * @param {string} key
 * @param {object} [vars] - interpolation variables for function-valued entries
 * @returns {string}
 */
export function t(key, vars) {
  const entry = MESSAGES[key];
  if (!entry) return key;
  const lang = getActiveLang() || 'ja';
  const value = entry[lang] != null ? entry[lang] : entry.ja;
  if (typeof value === 'function') return value(vars || {});
  return value;
}
