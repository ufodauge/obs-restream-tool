# obs-restream-tool: iframe パネル一般化 & obs-websocket 連携

## 背景・課題

- 1 つの OBS Browser Source に複数の iframe（Twitch 埋め込み等）をまとめて
  CSS Grid で並べていたため、OBS 側のフレームレートが低下していた。
- 各パネルの名前ラベルが表示されない不満があった。
- Twitch 以外の任意の iframe も配置したいという要望があった。
- 上記の解決には「1 Browser Source = 1 iframe」に分割し、配置（位置・サイズ）
  だけを obs-websocket で外側から制御する構成が必要だった。

3 つのパッチに分けて対応。**すべてクリーンな clone に順番に `git apply` できる
ことを確認済み**（patch1 → patch2 → patch3）。各段階で `tsc -b` / `oxlint` /
`vite build` を通し、型エラー・新規lintエラー・ビルド失敗が無いことを確認して
いる。実際の OBS 実機との接続確認は未実施（手元での検証待ち）。

---

## Patch 1: iframeパネルの一般化 + 名前ラベル表示バグ修正

- **バグ修正**: `TwitchPanel` に `subtext`（表示名）が渡っておらず、フォームで
  編集できるのに画面に一切出ていなかった。配線を直して表示されるようにした。
- **共通化**: `IframePanel.tsx` を新設し、サイズ別クラス・角丸・ラベル
  オーバーレイをここに集約。`TwitchPanel` はこの上に URL 組み立てだけを乗せる
  薄いラッパーに変更。
- **新パネル種別**: `PanelType` を `twitch | iframe` の判別共用体に拡張し、
  `CustomPanel.tsx`（任意の URL をそのまま配置）を追加。フォーム
  (`VideoPanelForm.tsx`) も type ごとに入力欄を出し分け、追加ボタンも
  Twitch / iframe の2択に。
- 副次的に `key={v.channel}` → `key={v.id}` に修正（channel 重複・空文字での
  破綻を回避）。

## Patch 2: obs-websocket によるソース分割アーキテクチャ

Node.js バックエンドは作らず、既存の「Dashboard もカスタムブラウザドックとして
OBS の CEF 内で開き、localStorage を共有する」設計に乗せ、obs-websocket
クライアントもブラウザ内から直接接続する構成にした。

- **`slot.html?index=N`**: Browser Source 1 個 = iframe 1 個。有効な動画パネル
  一覧の N 番目だけを全画面描画する新ルート。
- **`sync.html`**: OBS のカスタムブラウザドックとして追加するページ。
  `obs-websocket-js` で接続を維持し、パネル構成が変わるたびに
  `VideoSlot0, VideoSlot1, ...` という名前の Browser Source に対して
  `SetSceneItemTransform` / `SetSceneItemEnabled` を送る。
- **`layout.ts`**: `grid-flow-row-dense` 相当の詰め込みを自前実装した純粋関数
  `packGrid`（size 1→1x1, size 2→2x2 を隙間なく配置）。
- **`SceneBoards.tsx`**: 動画パネルの描画を削除。ビンゴボード・タイマー・
  テキストのみ残る「背景レイヤー」専用に。
- **Dashboard に設定フォーム追加**（`ObsSyncForm.tsx`）: 接続先・パスワード・
  シーン名・ソース名接頭辞・スロット数・グリッド・配置エリアを設定。
- 依存追加: `obs-websocket-js`（ブラウザ向け JSON プロトコルビルドで解決される
  ことをバンドル出力で確認済み。msgpack/Node 依存の混入なし）。

## Patch 3: 初回セットアップの自動化

- **`obsSetup.ts`**: `runObsSetup` という async generator。
  - シーンが無ければ `CreateScene`
  - `VideoSlotN` が無ければ `CreateInput`（`browser_source`、URL は
    `{baseUrl}/slot.html?index=N`、`shutdown: true` で非表示時のデコード停止も
    初期設定）
  - ソースはあるがシーン未追加なら `CreateSceneItem`
  - 何度実行しても同じ結果になるよう冪等に設計
- **`ObsSetupButton.tsx`**: Dashboard に「初回セットアップ」ボタンを追加。
  実行中だけ一時接続し、進捗をログ表示。未保存の設定に対しては実行不可。
- 設定に `baseUrl`（slot.html の配信元）を追加。

---

## 成果物

| ファイル                               | 内容                          |
| -------------------------------------- | ----------------------------- |
| `obs-restream-tool-iframe-panel.patch` | Patch 1                       |
| `obs-restream-tool-obs-sync.patch`     | Patch 2                       |
| `obs-restream-tool-obs-setup.patch`    | Patch 3（Patch 2 の上に適用） |

## 未検証・残作業

- 実際の OBS + obs-websocket との接続確認（このサンドボックスには OBS 実機が
  無いため未実施）
- `CreateInput` の `inputKind: "browser_source"` がユーザー環境の OBS
  バージョンでも同じ文字列か（obs-websocket v5 プロトコルの一般的な値として
  実装したが、実機での動作確認は必要）
- `layout.ts` の詰め込みアルゴリズムは旧 CSS Grid の見た目を厳密には再現して
  いない（新設計の独立したグリッドとして実装）ため、実際の配置は好みに応じて
  `grid`/`area` 設定で調整が必要
