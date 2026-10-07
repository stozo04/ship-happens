# Ship Happens

An independent tracker for [Tibo's 28-day Codex & Work challenge](https://x.com/thsottiaux/status/2106845241357824205), October 5–November 1, 2026.

[Visit the app](https://ship-happens-rho.vercel.app/) · [Contribute](CONTRIBUTING.md) · [Report an issue](https://github.com/stozo04/ship-happens/issues)

## What it tracks

- Every source-backed release, including multiple releases on the same day.
- Confirmed usage resets, counted separately from releases.
- All 28 challenge days, with links to the original announcements.

Search releases, save favorites on your device, or select a day for details. A reset never restarts the challenge counter. Polls and reset requests remain unconfirmed until delivery is announced.

## Updates

A maintainer-managed Codex automation checks Tibo's posts through X Agent every four hours. It writes verified updates to Supabase and avoids duplicate releases. The current schedule runs through November 3, 2026 at 6:50 p.m. Central; the challenge itself ends November 1.

The automation runs outside this repository. Forking or deploying the app does not include that schedule or its authenticated integrations. A manual test verified the source-check, database-write, and live API path. The first scheduled execution has not yet been verified.

The app reads stored records on load and Refresh. It does not read X directly. Database updates appear without rebuilding the site. If live storage is unavailable, the app labels its fallback snapshot.

## Development

Plain HTML, CSS, and JavaScript with a Node serverless API. No runtime dependencies to install. Use Node 24 or newer.

```sh
git clone https://github.com/stozo04/ship-happens.git
cd ship-happens
npm test
npm run build
```

The build writes static assets to `dist/`. Vercel serves `api/tracker.js` alongside them. Serving only `dist/` provides the snapshot fallback, not the serverless API.

Optional browser checks use an installed Playwright module and Chrome:

```sh
node scripts/browser-smoke.mjs
```

Set `TRACKER_URL` to the deployment you want to test, and `PLAYWRIGHT_MODULE` if Playwright is installed outside this project. The smoke checks cover desktop and mobile layouts, search, favorites, day dialogs, reset filtering, Refresh, and celebration.

## Contributing

Ship with us. Open an issue or send a focused pull request to `main`. See [CONTRIBUTING.md](CONTRIBUTING.md) for checks and data requirements.

`main` requires code-owner review by [@stozo04](https://github.com/stozo04), dismisses stale approvals, and blocks direct pushes, force pushes, and branch deletion, including for admins. GitHub does not allow authors to approve their own PRs.

## License

[MIT](LICENSE). This project is independent and is not affiliated with OpenAI.
