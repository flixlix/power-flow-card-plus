module.exports = {
  branches: ["main", { name: "dev", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "README.md", "package.json", "pnpm-lock.yaml"],
      },
    ],
    [
      "@semantic-release/github",
      {
        assets: "dist/*.js",
      },
    ],
  ],
};
