import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["react", "react-perf", "typescript", "promise", "vitest", "oxc"],
  categories: {},
  rules: {},
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
