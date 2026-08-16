# 改善計画（React Compiler 化 / ドック UI / 既存バグ）

`tmp.md` の 3 パッチ適用後のコードを一通り読んで洗い出した結果と、その改善計画。

---

## 0. 前提の訂正: oxlint は React Compiler 対応済み

「react compiler 向け機能は eslint にしかない」は **oxlint 1.75 時点では誤り**。
`node_modules/oxlint/configuration_schema.json` に以下が存在する。

- `react/exhaustive-deps`（`ExhaustiveDepsConfig` 付き）
- `react/rules-of-hooks`
- **`react/react-compiler`**（`ReactCompilerConfig` 付き）

現行 `oxlint.config.ts` は `plugins: ["react", ...]` を並べているだけで
`categories: {}` / `rules: {}` が空なので、**react プラグインのルールが 1 つも
有効になっていない**。これが「無法に利用されている」の正体で、eslint を足す
必要はなく設定 1 箇所で解決する。

実測（`npx oxlint --react-plugin -D react/exhaustive-deps -D react/rules-of-hooks -D react/react-compiler src`）:

```
ObsSyncForm.tsx:12    react-compiler: Compilation Skipped: Use of incompatible library
VideoPanelForm.tsx:63 react-compiler: Compilation Skipped: Use of incompatible library
obsSync.ts:57         react-compiler: EffectSetState
```

- `exhaustive-deps` 違反は **現状 0 件**。剥がした `eslint-disable-next-line`
  も実際には不要だった（deps は既に網羅的）。
- react-hook-form が React Compiler にスキップされるという読みは**実測で確認**。
  該当は `watch()` を呼んでいる 2 コンポーネントのみ。`BoardForm` /
  `SceneSettingsForm` は `watch()` を使っていないので検出されない。

---

## 1. 洗い出した問題

### A. 動作バグ（優先度高）

| #    | 箇所                       | 内容                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-1  | `VideoPanelForm.tsx:44-58` | サイズの radio が `register("size")` のみで `valueAsNumber` 無し。`PanelType.size: 1 \| 2` に **文字列 `"1"` / `"2"` が入る**。`packGrid` の `col + size` は文字列連結（`0 + "2" === "02"`）になり、たまたま `"02" > 3 === false` の暗黙変換で動いているだけ。`SIZE_CLASSNAME_MAP` が `new Map([["1", ...], ["2", ...]])` と文字列キーなのもこれの後始末。初期データ（数値）と編集後（文字列）で型が食い違う。 |
| A-2  | `TwitchPanel.tsx:3-8`      | モジュールトップレベルで `URL.parse(import.meta.url)?.hostname` を取り、取れなければ **`throw`**。`base: "./"` ビルドを `file://` や OBS のローカル配信で開くと hostname が空 → 読み込み時点でページ全体が死ぬ。Twitch の `parent=` に渡す値としても `window.location.hostname` が正しい。                                                                                                                     |
| A-3  | `Slot.tsx:26`              | `selectEnabledPanels(panels)[index]` なので、**パネルを 1 つ無効化すると以降の全スロットの中身が 1 つずつズレる** → 関係ない Twitch プレイヤーが全部リロードされる。「1 Browser Source = 1 iframe」でフレームレートを稼いだ意味が薄れる。スロット↔パネル id の割り当てを安定させる必要がある。                                                                                                                 |
| A-4  | `obsSync.ts:52,64`         | `sceneItemIdCacheRef` の無効化タイミングが「再接続時のみ」。`sceneName` / `sourcePrefix` を変えても、OBS 側でソースを消して作り直しても古い `sceneItemId` を使い続ける。                                                                                                                                                                                                                                       |
| A-5  | `obsSync.ts:68-74`         | `ConnectionClosed` で `error` にするだけで**再接続しない**。配信中ずっと生かしておく用途なのに、OBS 側の一時的な切断で手動トグルするまで死ぬ。                                                                                                                                                                                                                                                                 |
| A-6  | `obsSync.ts:100-168`       | 同期 effect に**デバウンス無し**。フォーム入力 → jotai → localStorage の度に `slotCount` 回の往復（`GetSceneItemId` + `SetSceneItemEnabled` + `SetSceneItemTransform`）が走る。`src/libs/hooks/useDebounce.ts` が既にあるのに未使用。                                                                                                                                                                          |
| A-7  | `obsSync.ts:102-108`       | `status.state === "error"` を除外していないので、エラー状態でも同期を試みる。                                                                                                                                                                                                                                                                                                                                  |
| A-8  | `VideoPanelForm.tsx:68`    | `useForm({ defaultValues: videoPanel })` が**外部からの atom 変更で reset されない**。「複数のカスタムドックが localStorage を共有する」という設計そのものと矛盾する（別ドックで編集した内容が反映されない）。                                                                                                                                                                                                 |
| A-9  | `VideoPanelForms.tsx:41`   | `console.log(data, panels, result)` が jotai の setter 内に残っている。StrictMode で 2 回走る。                                                                                                                                                                                                                                                                                                                |
| A-10 | `IframePanel.tsx`          | `<iframe>` に `title` / `allow`（Twitch の autoplay に必要）/ `referrerpolicy` / `sandbox` が無い。                                                                                                                                                                                                                                                                                                            |

### B. 型・データ境界

| #   | 内容                                                                                                                                                                                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B-1 | `atomWithStorage` 4 箇所（panels / obsSyncSettings / scene / timer）が **localStorage の中身を無検証で信用**している。古いスキーマや壊れた JSON がそのまま型付きで流れ込む。A-1 の文字列 size も本来ここで弾ける。            |
| B-2 | `zod` / `src/libs/json/json.ts`（`tryParseJson`）/ `src/libs/result/result.ts` は既に書かれているのに **B-1 の場所で使われていない**。                                                                                        |
| B-3 | `scripts/gen-icons.ts` が oxlint の type-aware チェックで 7 件エラー（`@types/node` がスコープ外）。lint 出力がこれで埋まって本来の指摘が埋もれる。`tsconfig.node.json` の include か oxlint の ignorePatterns の調整が必要。 |

### C. 依存関係の衛生

| #   | 内容                                                                                                                                                                                                                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-1 | **`react-hook-form` / `zod` / `oot-bingo-lists` / `daisyui` が devDependencies に入っている**が、`src/` から実行時 import されている。バンドルするので今は動くが分類が誤り。逆に `shadcn`（CLI）は dependencies にいる。                                                                                                           |
| C-2 | **完全に未使用の依存**: `uuid`, `effect`, `re-resizable`, `radix-ui`, `class-variance-authority`, `shadcn`。`react-grid-layout` / `react-resizable` は `src/routes/react-grid-layout.css` からのみ参照されているが、**その CSS 自体をどこも import していない**。                                                                  |
| C-3 | **未使用（デッドコード）モジュール**: `libs/hooks/useLocalStorage.ts`, `libs/hooks/useDebounce.ts`, `libs/store/compaction.ts`, `libs/createDerivedSetter.ts`, `components/Grainient.tsx`, `components/ToggleButton.tsx`, `routes/react-grid-layout.css`。`docs/note.md` の TODO（compaction がキモい 等）はこの残骸を指している。 |

### D. UI / ドックとしての使い勝手

| #   | 内容                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1 | `Dashboard.tsx` は `grid-cols-[repeat(auto-fill,minmax(332px,1fr))]` の 5 カード。OBS のドックは幅が狭いので**必ず 1 列に潰れて縦に極端に長くなる**。 |
| D-2 | `VideoPanelForms` の `h-96` 固定スクロール領域が、狭いドックではさらに縦を食う。                                                                      |
| D-3 | パネルが有効なとき全フィールドが展開されっぱなし。一覧性が無い。                                                                                      |
| D-4 | 保存ボタンがカードごとにバラバラ。全体の dirty 状態が分からない。                                                                                     |

---

## 2. 計画

### Phase 1: lint とビルドの土台（低リスク・即効）

1. `oxlint.config.ts` に実際にルールを入れる。
   ```ts
   categories: { correctness: "error" },   // ただし react-in-jsx-scope は off
   rules: {
     "react/exhaustive-deps": "error",
     "react/rules-of-hooks": "error",
     "react/react-compiler": "warn",       // 段階的に error へ
     "react/react-in-jsx-scope": "off",    // react-jsx transform なので不要
     "react/iframe-missing-sandbox": "warn",
   }
   ```
   `-D correctness` を素で入れると `react-in-jsx-scope` が大量に鳴るので必ず off にする。
2. `scripts/` を型チェック対象から外す or `tsconfig.node.json` に含める（B-3）。
3. **React Compiler をビルドに入れる**。`@vitejs/plugin-react` 6.0.4 の README に
   Vite 8 / rolldown 向けの正式な手順がある:
   ```sh
   pnpm add -D @rolldown/plugin-babel @babel/core babel-plugin-react-compiler @types/babel__core
   ```
   ```ts
   import react, { reactCompilerPreset } from "@vitejs/plugin-react";
   import babel from "@rolldown/plugin-babel";
   plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss(...)]
   ```
   注意: `pnpm-workspace.yaml` が `catalogMode: strict` なので catalog への追記が必須。
   `minimumReleaseAge: 1440` にも引っかかる可能性あり。
4. 未使用依存とデッドコードの削除（C-2 / C-3）、devDeps ↔ deps の是正（C-1）。

### Phase 2: react-hook-form の退場（**方針確定: 全 4 フォームを移行**）

`useFormStatus` **単体では RHF の代わりにならない**（得られるのは `pending` だけ）。
実際に必要なのは以下の組み合わせ:

| RHF の機能                      | 置き換え                                                                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `handleSubmit`                  | `<form action={fn}>`（React 19 form actions）                                                                                     |
| `register` + 値の取得           | `FormData` + **zod スキーマで parse**（B-1 と共通化できる）                                                                       |
| `formState.isSubmitting`        | 子コンポーネントで `useFormStatus()`                                                                                              |
| 送信結果・エラー表示            | `useActionState`                                                                                                                  |
| `formState.isDirty`（赤枠）     | `<form onInput>` で FormData を保存値と比較する小さな hook                                                                        |
| `formState.isValid`（disabled） | zod の結果 or `<input required>` によるネイティブ検証                                                                             |
| `watch("enable")` の条件表示    | `useState` 1 個。ただし**アンマウントすると FormData からキーが消える**ので、zod 側で欠損を許容するか `hidden` 属性で残すか要判断 |

副産物として:

- A-1（size が文字列）が zod の `z.coerce.number().pipe(z.union([...]))` で構造的に解決。
- A-8（外部変更で form が古くなる）は、フォームを非制御 + `key={更新時刻}` or
  保存値からの再マウントで解決できる。
- React Compiler の "Compilation Skipped" が消え、Dashboard 全体がメモ化対象になる。

作業順は `BoardForm` → `SceneSettingsForm`（`watch` 無し・小さい）→
`ObsSyncForm` → `VideoPanelForm` が安全。

### Phase 3: `useObsSync` の作り直し（`useEffectEvent` / EffectSetState 解消）

現行は「接続 effect」+「同期 effect」+ `useState` の 3 点セットで、
`status.state` が同期 effect の依存に入っているため状態遷移とデータ同期が絡んでいる。

方針:

1. **OBS 接続を React の外に出す**。`ObsConnection` クラス（connect / reconnect /
   sceneItemId キャッシュ / 現在の status を持つ）を作り、UI 側は
   `useSyncExternalStore` で status を読むだけにする。
   → A-5（自動再接続）、A-4（キャッシュ無効化を接続オブジェクトの責務に）、
   A-7、および `EffectSetState` 診断がまとめて解消。
2. 同期は `useEffectEvent` を使い、`settings` / `panels` を依存から外して
   「変更を検知して発火する」部分と「最新値を読んで送る」部分を分離。
3. 発火に `useDebounce`（既存・未使用）を挟む（A-6）。

`useEffectEvent` は React 19.2.8 で実際に export されていることを確認済み。
`TimerForm.tsx:60-96` の rAF ループも同じパターンの典型例（`timer` が変わる度に
ループ全体を張り直している）なので、ついでに直す。

### Phase 4: ドック UI のパネル化（**方針確定: 複数ドック + ページ内タブ / 追加依存ゼロ**）

flexlayout-react は不採用。**OBS の Qt ドックは、ドック同士を重ねてドロップすると
自前でタブ化してくれる**（フロート・リサイズ・レイアウト保存も OBS 側の機能）ため、
ページ内に本格的なドッキング機構を持つと機能が二重になる。`react-grid-layout` /
`re-resizable` を入れて使わなかった経緯（C-2）を繰り返す懸念もある。

採る形:

```
index.html             → タブ付きフルダッシュボード
index.html?dock=videos → 動画パネル一覧のみ
index.html?dock=board  → ボード / シーン設定のみ
index.html?dock=obs    → obs-websocket 設定のみ

[ 動画 | ボード | タイマー | OBS ]   ← daisyUI tabs-lift
─────────────────────────────
 ▸ すば       (twitch/小) [x]
 ▸ TKC        (twitch/小) [x]
 ▾ 猫麦とろろ (twitch/小) [x]
     チャンネル [tororo_vtuber]
     表示名     [猫麦とろろ]
     サイズ     (o)小 ( )大
```

- Dashboard を daisyUI の `tabs tabs-lift` でタブ化。選択中タブは URL hash か
  localStorage に保存。
- `?dock=` が付いていればそのタブだけを表示し、タブバーを隠す。
  同じビルドで「1 個の大きいドック」と「小さいドック複数」の両方を賄える。
  html エントリを増やす必要はない（既存の `index.html` にクエリを付けるだけ）。
- `VideoPanelForm` を「1 行のコンパクトな行 + 展開で詳細」（`<details>` / accordion）に。
  折り畳み時は 表示名 / 種別・サイズ / 有効トグル だけ。
- `h-96` 固定をやめてドックの高さに追従させる（`h-full` + `min-h-0`）。
- ドック幅の想定を狭側（~300px）に寄せ、`minmax(332px, 1fr)` を見直す。

### Phase 5: 残りのバグ潰し

- A-1（zod 化で Phase 2 に吸収されなければ個別に）
- A-2 `TwitchPanel` の hostname を `window.location.hostname` に。throw を消す。
- A-3 スロット↔パネルの安定割り当て。`selectEnabledPanels` の順序ではなく、
  「スロット index → パネル id」のマップを設定として持つか、無効パネルも
  順序を保持したまま「非表示」として枠を占有させるかを決める。
- A-9 `console.log` 削除。
- A-10 `<iframe>` の属性追加。

（A-3 の割り当て方式は実装時に裁量で決める）

### Phase 6: ボードのタスクソースを選択可能に（oot-bingo-lists / mm-bingo）

現状 `BoardPanel` は `oot-bingo-lists` の
`generateBingoBoardFromVersion(version, "normal", seed)` 決め打ち。
これを **タスクソースの選択制**にし、`https://ufodauge.github.io/mm-bingo/task.js`
を第 2 のソースとして追加する（最近の主用途がこちらのため）。

#### 調査結果（実測済み）

`task.d.ts` / `task.js` を取得して Node で実際に生成してみた結果:

```
exports: ALGORITHM_BY_VERSION, emptyTask, generateTasksAsync, isEmptyTask, isFallbackTask
generateTasksAsync(seed: number, version: TaskVersion) => Promise<Result<Task[], Error>>
TaskVersion = "v20260208" | "v20260409" | "v20260419" | "v20260718"
```

- **25 件・row-major 順**で返る（`lineTypes` が `["col1","row1","tlbr"]` …）。
  現行の `grid-cols-5 grid-rows-5` にそのまま流し込める。oot 側と同じ扱いでよい。
- **`text` が `{ ja, en }` で同梱されている**。→ mm-bingo 側では
  `src/i18n/ootBingo.ts` の翻訳マップは**不要**。あれは oot 専用に閉じる。
- 同一シードで**決定的**（2 回生成して一致を確認）。
- `Task` に **`id` が無い**。React の key は index（row-major で安定）か
  `${seed}-${index}` を使う。
- `Result<T, E>` は `ok` / `unwrapOr` / `unwrapOrElse` を持つ独自型。
  奇しくも `src/libs/result/result.ts` と同じ形。
- `task.js` は **valibot をバンドル済みで外部 import ゼロ**。追加依存は不要。
- `tasks/*.json` も `task.js` も **`Access-Control-Allow-Origin: *`**。CORS 問題なし。

#### ⚠ 障害: `task.js` が fetch 先を `/mm-bingo` 決め打ちしている

`task.js` の末尾に、ビルド時の base がリテラルで焼き込まれている:

```js
let i = `${"/mm-bingo".replace(/\/$/, "")}/tasks/${n}.json`;
fetch(i);
```

`fetch("/mm-bingo/tasks/x.json")` は**モジュールの URL ではなくページのオリジン**を
基準に解決される。つまり `http://localhost:5173` から `task.js` を import すると
`http://localhost:5173/mm-bingo/tasks/v20260718.json` を取りに行って 404 になる。

対処案:

| 案                   | 内容                                                                                                                                     | 評価                                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **上流修正（推奨）** | mm-bingo 側で fetch 先を `new URL("./tasks/x.json", import.meta.url)` に変える                                                           | 1 行で根治。shim 不要。**mm-bingo に手を入れられるならこれ一択**                                              |
| fetch シム           | アプリ側で `globalThis.fetch` をラップし、`/mm-bingo/tasks/` で始まる URL だけ `https://ufodauge.github.io/mm-bingo/tasks/` に書き換える | mm-bingo を触らずに済む。約 10 行。前方一致以外は素通しなので副作用は限定的。**実測で動作確認済み**           |
| JSON をベンダリング  | `public/mm-bingo/tasks/*.json` に置く                                                                                                    | オリジン直下配信でないと `/mm-bingo/...` が解決しない（`base: "./"` と相性が悪い）。JSON も陳腐化する。非推奨 |

#### 実装方針

1. **ロード方法**: `await import(/* @vite-ignore */ "https://ufodauge.github.io/mm-bingo/task.js")`
   の動的 import（バンドルせず実行時取得）。型は `task.d.ts` をローカルに
   ベンダリングして ambient module 宣言で当てる（URL import には型が付かないため）。
   - ブラウザは https の ESM import に対応しているので動く。
     （Node は非対応なので、テストを書くならローカルコピー経由になる）
   - ネットワーク依存が増える点は許容（既に Twitch の iframe に依存している）。

2. **データモデル**: `boardSettingsStore` を判別共用体に。

   ```ts
   type BoardSettings =
     | { source: "oot"; version: BingoVersion; seed: number }
     | { source: "mm"; version: MmTaskVersion; seed: number };
   ```

   既存の保存値には `source` が無いので、**zod の migration/default で `"oot"` を補う**。
   → 計画 B-1（`atomWithStorage` の zod 検証）と同じ作業なので**まとめて実施**する。

3. **共通中間形**: `BoardPanel` を素朴に保つため、両ソースを
   `{ key: string; label: string }[]`（25 件）に正規化するアダプタ層を
   `src/features/panels/board/sources/` に置く。
   - oot: `squares[].goal.name` → `translations.get(name) ?? name`
   - mm: `text.ja ?? text.en ?? ""`

4. **非同期化**: `generateTasksAsync` が Promise を返すため `BoardPanel` が
   非同期になる。React 19 の `use(promise)` + `<Suspense>` で扱う。
   **Promise は `seed + version + source` をキーにモジュールレベルの Map で
   キャッシュする**こと（毎レンダリングで新しい Promise を作ると無限サスペンドする）。
   oot 側は同期なので `Promise.resolve()` で包んで形を揃える。

5. **UI**: `BoardForm` にソース選択（oot / mm）とバージョン選択を追加。
   バージョンの選択肢はソースによって変わる（oot は `oot-bingo-lists` の
   `BingoVersion`、mm は `ALGORITHM_BY_VERSION` のキー）。
   Phase 2 のフォーム移行と同時に作ると二度手間にならない。

6. **将来**: `Task.trackers` / `tags` / `difficulty` / `lineTypes` は今回未使用。
   `trackers[].properties.icons` は `icons/*.webp` という**相対パス**なので、
   もし将来アイコンを出すなら base 問題（上記）が再度効いてくる。

---

### Phase 7: zod → valibot 移行

Phase 2 で zod を使ってスキーマ基盤を作ったが、**valibot に寄せる**方針に変更。
mm-bingo が既に valibot を使っている（`apps/mm-bingo/src/libs/tasks/schema.ts` ほか）
ため、Phase 6 で mm-bingo を取り込むことを考えると記法が揃う方が自然。
バンドルサイズでも valibot の方が有利（OBS の Browser Source で走る以上、
ここは常に効いてくる）。

**Phase 3 + 5 の完了後に着手する**（`panels.ts` を触るため衝突する）。

対象は 7 ファイル（`useLocalStorage.ts` は Phase 3 で削除済みのため除く）:

- `src/libs/json/json.ts`（`tryParseJson` が `ZodType` を受ける）
- `src/libs/store/atomWithValidatedStorage.ts`（同上）
- `src/features/panels/videos/panels.ts`
- `src/features/panels/videos/obsSyncSettings.ts`
- `src/features/panels/scene/scene.ts`
- `src/features/panels/timer/timer.ts`
- `src/features/forms/BoardForm.tsx`

API の対応と注意点:

| zod                              | valibot                                             | 注意                                                                                                   |
| -------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `ZodType<T>`（19 箇所）          | `GenericSchema<T>`                                  | `panels.ts` に「判別子を静的に追うため早期に潰さない」旨のコメントがある。valibot でも同種の配慮が要る |
| `z.coerce.*`（14 箇所）          | `v.pipe(v.unknown(), v.transform(...), v.number())` | **valibot に `coerce` は無く、変換を明示的に書く**。最大の差分                                         |
| `z.discriminatedUnion`（3 箇所） | `v.variant("type", [...])`                          |                                                                                                        |
| `z.literal([1, 2])`              | `v.picklist([1, 2])`                                |                                                                                                        |
| `schema.safeParse(x)`（6 箇所）  | `v.safeParse(schema, x)`                            | **引数順が逆**。全呼び出し箇所が変わる                                                                 |

副次的な利点: `z.coerce.boolean()` が `Boolean(x)` なので `"false"` が `true` に
なるという落とし穴（Phase 2 レビューで実測して確認）は、valibot では変換を
明示的に書かされるため構造的に発生しない。

移行後は Phase 2 と同じ検証をやり直すこと（旧 `size: "2"` の数値化、壊れた
JSON・形違いのフォールバック、throw しないこと）。

---

## 3. 確定事項

| 項目      | 決定                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------- |
| lint      | eslint は導入しない。oxlint の `react/react-compiler` ほかを有効化する                         |
| フォーム  | **全 4 フォーム**を React 19 form actions へ移行し、react-hook-form を依存から外す             |
| ドック UI | **複数ドック（`?dock=`）+ daisyUI タブ**。flexlayout-react は不採用                            |
| ボード    | タスクソースを **oot-bingo-lists / mm-bingo の選択制**に。mm-bingo は remote ESM を動的 import |
| Phase 5   | 実装時の裁量に委ねる                                                                           |
| スキーマ  | **valibot を採用**（zod からの移行は Phase 7。mm-bingo と記法を揃える）                        |

---

## 4. 未検証事項（tmp.md から継続）

- 実機 OBS + obs-websocket での接続確認（未実施）
- `inputKind: "browser_source"` の実環境での妥当性
- `packGrid` の詰め方が意図した見た目になるか
