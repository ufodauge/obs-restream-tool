import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

// vite.config.ts とは意図的に分離している。あちらは本番ビルド用の
// プラグイン（React Compiler の babel 統合、複数 html エントリの
// rolldownOptions）を積んでおり、テスト実行には不要などころか
// obsConnection.ts / layout.ts のようなプレーンな TS モジュールを
// Node 環境で検証する用途とは噛み合わない。テストは DOM も React
// レンダリングも使わず obs-websocket v5 の実プロトコルを喋る
// フェイクサーバーに対して実コードを駆動するだけなので、environment は
// 既定の "node" のままでよい。
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // obs-websocket-js の package.json は exports["."] の "browser"
      // 条件でだけ json（text/JSON サブプロトコル）を指し、素の "import"
      // 条件は msgpack（バイナリ）を指す。vite.config.ts 側のブラウザ向け
      // ビルドは前者を使うため、実際に obs.connect() が喋るのは常に
      // "obswebsocket.json"。vitest は Node 環境で "browser" 条件を付けずに
      // 解決してしまい msgpack 側を掴むため、フェイクサーバー
      // （obswebsocket.json のみ実装）と食い違って接続に失敗する。
      // 本番と同じプロトコルを喋らせるため、json サブパスへ明示的に
      // エイリアスする。
      "obs-websocket-js": "obs-websocket-js/json",
    },
  },
  test: {
    setupFiles: ["./src/testing/setupTests.ts"],
  },
});
