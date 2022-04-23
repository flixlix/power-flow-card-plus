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
    "import/extensions": [
      "error",
      "always",
      {
        ignorePackages: true,
      },
    ],
    "no-use-before-define": ["error", { functions: false }],
  },
};
