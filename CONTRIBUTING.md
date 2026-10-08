# Contributing

Small, focused pull requests are welcome. Open an issue for bugs or larger feature ideas.

Using an AI agent? Point it at [AGENTS.md](AGENTS.md) first. It explains where the live data lives, how to add a day, and the design rules.

Target `main`. Every change requires review by Steven (`@stozo04`). Approvals are dismissed when the PR changes. Direct pushes, force pushes, and deletion of `main` are blocked once GitHub branch protection is applied.

## Run checks

Use Node 24 or newer. The app has no runtime dependencies.

```sh
npm test
npm run build
```

For UI changes, verify desktop and mobile layouts, search, saved releases, day dialogs, reset filtering, and Refresh. `scripts/browser-smoke.mjs` can run these checks with an installed Playwright module and Chrome. Set `TRACKER_URL` to your test deployment.

## Data changes

Every release needs its own X announcement URL. Usage resets need an explicit delivery announcement. Poll results and missing releases do not prove a reset.

Keep challenge day numbering fixed from October 5 through November 1, 2026. Multiple releases and a reset may share a day.

Never include credentials or personal data. The SQL schema only creates prefixed tracker tables. Do not change other objects in a shared Supabase project.
