import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["react", "react-perf", "typescript", "promise", "vitest", "oxc"],
  categories: {
    correctness: "error",
  },
  rules: {
    "react/exhaustive-deps": "error",
    "react/rules-of-hooks": "error",
    // Phase 2 (react-hook-form 撤去) で ObsSyncForm / VideoPanelForm の
    // "Compilation Skipped" は解消済み。Phase 3 で useObsSync のエフェクト内
    // setState (obsSync.ts, EffectSetState) も解消し、lint がクリーンに
    // なったので "error" に昇格。
    "react/react-compiler": "error",
    // automatic JSX runtime ("jsx": "react-jsx") なので React の
    // スコープ内配置は不要。correctness カテゴリを丸ごと有効化すると
    // このルールだけ大量の誤検知を出すため個別に off にする。
    "react/react-in-jsx-scope": "off",
  },
  settings: {
    ["jsx-a11y"]: {
      components: {},
      attributes: {},
    },
    next: {
      rootDir: [],
    },
    react: {
      version: "19.2.4",
      formComponents: [],
      linkComponents: [],
      componentWrapperFunctions: [],
    },
    jsdoc: {
      ignorePrivate: false,
      ignoreInternal: false,
      ignoreReplacesDocs: true,
      overrideReplacesDocs: true,
      augmentsExtendsReplacesDocs: false,
      implementsReplacesDocs: false,
      exemptDestructuredRootsFromChecks: false,
      tagNamePreference: {},
    },
    vitest: {
      typecheck: true,
    },
  },
  env: {
    builtin: true,
  },
  globals: {},
  ignorePatterns: [],
  options: {
    typeAware: true,
    typeCheck: true,
  },
});
