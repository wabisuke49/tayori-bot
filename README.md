# Tayori FAQ 案内 AI Bot — MVP Design Doc

## 1. 目的

清掃スタッフ等が入力した自然文の状況から、Cuculu Cleaning の Tayori FAQ のうち最も関連する記事を案内する。

MVP は「質問に対して、根拠となる FAQ 記事のタイトルと URL を返す」ことに限定する。FAQ 本文を回答として生成したり、Tayori 外を検索したりはしない。

## 2. 背景と前提

- 正式な対応表は `data/cuculu_faq_registry.json` とする。
- 2026-10-29 時点で、同ファイルには 67 記事、12 カテゴリが登録されている。
- 各記事は `id`、`title`、`category`、`description`、`url` を持つ。
- `description` は記事選定の補助情報であり、公式 FAQ 本文の引用ではない。
- FAQ の詳細な作業手順は、案内先の Tayori ページを正とする。

## 3. ユーザー体験

1. ユーザーが状況を日本語で入力する（例: 「雨の日にリネン回収ボックスがいっぱいです」）。
2. Bot は関連度の高い FAQ を 1 件、必要に応じて代替候補を最大 2 件表示する。
3. 各候補でタイトル、カテゴリ、短い案内文、Tayori の記事 URL を表示する。
4. 特定に必要な情報が不足する場合は、URL を推測せず確認質問を返す（例: 通常物件か、かまもさ/T-home か）。
5. 該当がない場合は「対応表内に該当する FAQ を特定できない」と明示し、FAQ トップへのリンクを案内する。

## 4. スコープ

### MVP に含めるもの

- Next.js の単一入力画面
- 入力を受けるサーバー API
- レジストリをコンテキストとした LLM による記事選定
- 既知の FAQ URL のみを表示する結果画面
- 入力検証、失敗時のメッセージ、最低限のログ

### MVP に含めないもの

- Tayori FAQ 本文の取得・要約・生成回答
- インターネット全体、または別サイトの検索
- 会話履歴・ユーザー認証・管理画面
- レジストリ編集 UI や自動クロール
- ベクトル DB、埋め込み検索、再ランキング基盤

## 5. 全体アーキテクチャ

```text
Browser (Next.js UI)
  │ POST /api/search { query }
  ▼
Next.js server route
  ├─ query validation
  ├─ read cuculu_faq_registry.json
  ├─ LLM: select registered article IDs / ask clarification / no match
  ├─ validate selected IDs against registry
  └─ build response with registry-owned URLs
  ▼
Browser: result cards or clarification message
```

LLM の API キーはサーバー環境変数にのみ置き、ブラウザへは渡さない。

## 6. 検索・選定方針

67 件のメタデータは MVP のプロンプトに同梱可能な規模なので、まずは LLM に入力文と全記事の `id/title/category/description` を渡し、意味的に最も近い記事を選定させる。

重要な安全策は、LLM に URL を書かせないこと。LLM の出力は登録済み `id` だけに限定し、サーバーがその `id` をレジストリと照合して、タイトル・カテゴリ・URL を組み立てる。これにより、もっともらしいが存在しない URL の表示を防ぐ。

### LLM への指示（要旨）

- 役割は「Cuculu Cleaning FAQ の記事選定」。手順・規則を創作しない。
- 入力と候補メタデータだけを根拠にする。
- 確信できる候補は最大 3 件を `articleIds` に入れる。
- 物件名、機種、使用前後、天候などで結論が変わるときは `clarification` を返す。
- 候補がなければ `no_match` を返す。
- 定めた JSON スキーマ以外は出力しない。

### 期待する構造化出力

```json
{
  "kind": "match",
  "articleIds": ["faq_1068272"],
  "message": "雨天時のリネン回収BOXに関する記事です。",
  "clarification": null
}
```

`kind` は `match`、`clarification`、`no_match` のいずれかとする。`articleIds` は `match` の場合だけ 1〜3 件を許可する。実装では JSON Schema / Structured Outputs を使い、パース不能な応答はエラーとして扱う。

## 7. API 契約

### `POST /api/search`

Request:

```json
{ "query": "雨の日にリネン回収ボックスがいっぱいです" }
```

制約:

- `query`: 前後空白を除いて 1〜500 文字の文字列
- 空入力・型不正: `400 Bad Request`

Success response (`200 OK`):

```json
{
  "kind": "match",
  "message": "関連する FAQ です。",
  "results": [
    {
      "id": "faq_1068272",
      "title": "リネン回収BOXがいっぱいになった(雨の日)",
      "category": "リネン",
      "description": "雨の日に…確認したいとき。",
      "url": "https://tayori.com/q/cuculu-cleaning/detail/1068272/"
    }
  ]
}
```

Clarification response (`200 OK`):

```json
{
  "kind": "clarification",
  "message": "対象の物件名を教えてください。",
  "results": []
}
```

No-match response (`200 OK`):

```json
{
  "kind": "no_match",
  "message": "対応表内で該当する FAQ を特定できませんでした。",
  "results": [],
  "fallbackUrl": "https://tayori.com/q/cuculu-cleaning/"
}
```

Server / model failure response (`500` または `503`):

```json
{
  "kind": "error",
  "message": "現在検索できません。時間をおいて再度お試しください。"
}
```

## 8. UI 要件

- 1 ページで完結させる。
- 入力欄、検索ボタン、送信中状態、結果エリアを持つ。
- Enter で送信できる（日本語 IME の確定中は送信しない）。
- 結果の URL は新規タブで開き、外部リンクであることを分かるようにする。
- 確認質問の場合は、次の入力で補足できるよう入力値を残す。
- エラー時は技術的な詳細や API キー関連の情報を画面に出さない。
- モバイル幅でも読めることを受入条件とする。

## 9. データと更新運用

- `data/cuculu_faq_registry.json` を単一のソース・オブ・トゥルースとする。
- 変更時には `article_count` と実際の `articles.length`、各 URL の形式、一意な `id` を検証する。
- `checked_on` と `note` を UI の回答根拠には使わないが、保守情報として残す。
- FAQ を更新した場合は、レジストリを更新してから同じ検証を実行する。

## 10. セキュリティ・信頼性

- API キーは `.env.local` などのサーバー専用環境変数に保管し、Git に含めない。
- 入力長を制限し、プロンプトインジェクションを命令として扱わないよう LLM 指示で明確化する。
- 出力 `id` は必ずレジストリに存在するものだけ採用する。不正な ID は破棄して `no_match` またはエラーにする。
- URL はレジストリからのみ返す。ユーザー入力・LLM 出力に含まれる URL は採用しない。
- ログにはリクエスト ID、結果種別、選択 ID、処理時間を記録する。入力文は個人情報の可能性があるため、MVP では保存しない。
- 利用量保護として、デプロイ時には IP / セッション単位のレート制限を設定する。

## 11. 受入条件

- 「ゲストの忘れ物を見つけた」から、登録済み忘れ物記事の URL を返せる。
- 「雨の日にリネン回収BOXが満杯」から、雨の日の記事 `faq_1068272` を返せる。
- 実在しない記事 ID または URL がモデル出力に含まれても、画面には表示されない。
- 物件依存など回答に必要な条件が欠ける入力には、確認質問または複数の登録済み候補を返せる。
- 空入力は API を呼ばずに検証エラーとなる。
- モデル API 障害時にも UI が壊れず、再試行できる。

## 12. 実装順序

1. Next.js プロジェクトと基本画面を用意する。
2. レジストリ読込・スキーマ検証モジュールを作る。
3. `/api/search` と構造化 LLM 出力、ID 検証を実装する。
4. 結果カード、確認質問、エラー状態を UI に接続する。
5. 代表クエリと異常系の自動テストを追加する。
6. 実利用の検索ログ（保存しない集計値）を見て、必要なら候補絞り込みや埋め込み検索を後続フェーズで導入する。

## 13. 将来拡張

精度・件数・レジストリが増えた場合に限り、キーワード/埋め込みによる上位候補の事前抽出と LLM 再ランキングを追加する。MVP では検索基盤を先に複雑化せず、選定品質をテストクエリで評価する。
