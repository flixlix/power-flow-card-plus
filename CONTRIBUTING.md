# Contributing

Thanks for contributing to `power-flow-card-plus`.

## Requirements

- Node.js (LTS recommended): [https://nodejs.org/en/download](https://nodejs.org/en/download)
- `pnpm`: [https://pnpm.io/installation](https://pnpm.io/installation)
- Docker (only for local Home Assistant dev via `pnpm start:hass`; not required if you use your own Home Assistant instance): [https://www.docker.com/get-started/](https://www.docker.com/get-started/)

## Local Development

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start Home Assistant in development mode (this step can be skipped if you want to test on your own Home Assistant instance):

   ```bash
   pnpm start:hass
   ```

3. In a separate terminal, build and serve the compiled card file:

   ```bash
   pnpm watch
   ```

4. In Home Assistant, add this dashboard resource:

   ```text
   http://<your-ip>:5001/power-flow-card-plus.js
   ```

5. Open Home Assistant:

   ```text
   http://localhost:8123
   ```

6. Complete onboarding (if needed), add the card to a dashboard, and test your changes.

7. Make your code changes.

## Changesets

This project uses Changesets to keep version bumps and release notes accurate and consistent across contributions.

If your changes should be included in a new version, add a changeset and describe what changed:

```bash
pnpm changeset
```

Write a clear summary of the change in the generated changeset file.

For more info: https://github.com/changesets/changesets

## Questions

If you have any questions on contributions or are stuck setting things up, feel free to contact me through opening an issue.