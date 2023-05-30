module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["@open-wc", "prettier"],
  ignorePatterns: "**/*.js",
  plugins: ["@typescript-eslint"],
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn"],
    "class-methods-use-this": "off",
    "import/no-unresolved": "off",
    "no-use-before-define": ["error", { functions: false }],
    "lines-between-class-members": "off",
  },
};
