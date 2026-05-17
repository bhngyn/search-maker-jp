# Search Maker JP — 検索クエリビルダー

**Search Maker JP** は **Google**・**X (Twitter)**・**Facebook**・**Yahoo! JAPAN** の高度な検索クエリを組み立てるためのツールです。日本語で書きながら、英語の検索演算子（`site:`、`intitle:`、`filetype:`、日付範囲、OR グループなど）を構造化された UI で扱えるよう設計されています。IME を切り替えたり演算子を覚えたりする必要はありません。

各検索ワードは独立した **チップ** として扱われ、演算子は UI ボタンで指定します。組み立て済みのクエリはページ下部の **読み取り専用プレビュー** に表示されるので、何が送信されるかをいつでも確認できます。データは一切保存されません。

## 使い方

`search_maker_jp.html` を任意のブラウザで開いてください。インストール不要・サーバー不要・ネット接続不要で動作します（USB メモリからの起動も可）。

## 何ができるか

- **4 つの検索エンジンを 1 つの UI で。** ヘッダーから Google / X / Facebook / Yahoo! Japan を切り替え。チップは Google ↔ X ↔ Yahoo! Japan の間で保持されます。
- **チップでクエリを組み立てる。** 単語を入力して Enter を押すとチップ化。`site:`、`intitle:`、`from:`、`@user`、`#tag` などの演算子は、入力前にボタンで選びます。
- **ブール演算を入力せずに扱う。** 隣り合うチップは暗黙の AND。チップの「+OR」ハンドルで代替グループを開始。`-` で始めれば除外、`"…"` で囲めば完全一致。
- **検索レシピ集。** Google・X・Yahoo! Japan それぞれに約 10 個の OSINT レシピを内蔵。サブドメイン発掘、引用ツイートからの増幅ネットワーク可視化、ローマ字↔カナの名前ゆれ検索、旧字体↔新字体の漢字変異など。インスペクタで構造と手順を確認してから 1 クリックで適用。
- **Facebook フォーム。** Facebook を選ぶとチップ UI が消え、カテゴリ別フォームに切り替わります（トップ / 投稿 / ユーザー / 写真 / 動画 / ページ）。WhoPostedWhat 互換の base64 エンコード URL を生成します。
- **全角・半角の統一（任意）。** ヘッダーのトグルをオンにすると、NFKC 正規化で全角英数字を半角に、半角カナを全角カナに揃えます。日本語検索エンジンが内部で行っている正規化と同じです。変換結果は送信前にプレビューで確認できます。
- **日本語 / 英語の UI 言語切り替え。** 日本語がデフォルト。
- **保存しない。** アカウントなし、サーバー通信なし、トラッキングなし、ローカルストレージなし。ページをリロードすると最初の状態に戻ります。設計上の意図です。

---

*English version below ↓*

# Search Maker JP

Search Maker JP helps Japanese-speaking journalists, researchers, and OSINT analysts build advanced search queries across **Google**, **X / Twitter**, **Facebook**, and **Yahoo! JAPAN**. Each search term lives in its own chip (operator chosen from a UI control); for Facebook — whose URL filters are an opaque base64-encoded JSON blob, not a query language — the same shell hosts a category-aware form. The assembled query stays visible in a live preview; nothing is sent anywhere until you click Search.

## Use it

Download `search_maker_jp.html` and open it in any modern browser. No install, no server, no network needed.

## What you can do

- **Four engines in one UI.** Toggle Google / X / Facebook / Yahoo! Japan from the header. Chip state is preserved across Google ↔ X ↔ Yahoo! Japan.
- **Build queries with chips.** Type a term, press Enter — it becomes a chip. Pick an operator (`site:`, `intitle:`, `from:`, `@user`, `#tag`) from a button row *before* committing.
- **Boolean grammar without typing.** Adjacent chips mean implicit AND. The "+OR" handle on a chip starts an alternative group. Lead with `-` to exclude; wrap in `"…"` for exact match.
- **Recipe playbook.** ~10 OSINT idioms per engine — subdomain discovery, amplification network via quoted tweets, romaji↔kana name variants, old↔new kanji variants. Inspect the anatomy, then apply with one click.
- **Facebook form.** Switching to Facebook swaps the chip UI for a category-aware form (Top / Posts / People / Photos / Videos / Pages). Generates the same base64-encoded URL pattern as WhoPostedWhat.
- **Full-width / half-width normalization (optional).** A header toggle applies Unicode NFKC: full-width ASCII → half-width, half-width katakana → full-width, full-width space → half-width. Matches Japanese search engines' internal normalization. Preview shows the transformed form before you send.
- **Japanese / English UI.** Japanese by default.
- **Nothing is saved.** No accounts, no backend, no tracking, no local storage. Refresh resets the tool. Intentional design choice.

## Build it yourself

```bash
git clone <repo>
cd search_maker_jp
npm install
npm run build
# Output: dist/index.html and dist/search_maker_jp.html (single self-contained files)
```

Dev server: `npm run dev` (port 5173).

## License

ISC. Forked from [search_maker_ar](https://github.com/bhngyn/search-maker) (Arabic Boolean Query Builder).
