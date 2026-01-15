const globals = require("globals");
const tseslint = require("typescript-eslint");
const eslintJs = require("@eslint/js");

module.exports = [
  // Base ESLint recommended rules for all files
  eslintJs.configs.recommended,

  // Globals for all files and ignore patterns
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    // Ignore the dist and node_modules directories
    ignores: ["dist/", "node_modules/"],
  },

  // TypeScript-specific configurations, applied only to .ts files
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ["**/*.ts"],
    languageOptions: {
      ...config.languageOptions, // Preserve existing languageOptions
      parser: tseslint.parser,
      parserOptions: {
        ...config.languageOptions?.parserOptions, // Preserve existing parserOptions
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.eslint.json",
      },
    },
  })),

  // Additional rules or overrides for .ts files
  {
    files: ["**/*.ts"],
    rules: {
      // Your custom rules here
    },
  },
];