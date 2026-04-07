import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import wc from "eslint-plugin-wc";

export default [
  {
    ignores: ["**/*.js"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      wc,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn"],
      "no-use-before-define": "off",
      "class-methods-use-this": "off",
      "lines-between-class-members": "off",
      "no-console": ["warn", { allow: ["warn", "error", "info", "groupCollapsed", "groupEnd"] }],
    },
  },
  {
    files: ["src/logging.ts"],
    rules: {
      "no-console": "off",
    },
  },
];
