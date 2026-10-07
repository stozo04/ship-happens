# Ship Happens

Independent 28-day tracker for Tibo’s Codex & Work challenge, Oct 5–Nov 1, 2026.

A dependency-free web app with a responsive day board, release timeline, search, locally saved favorites, day detail dialogs, source links, and confetti with reduced-motion support. Five source-backed releases are seeded for the first two days. Shipping and usage resets are independent. A reset poll never counts as confirmed delivery.

## Current deployment

Vercel project: ship-happens, Steven Gates' projects team.

Live URL: https://ship-happens-rho.vercel.app/

The production API is connected to Supabase project My Daily Journal, `bqyfplifeyvkilkoneph`. Only the isolated `ship_happens_settings`, `ship_happens_days`, and `ship_happens_releases` tables were added. Existing journal objects and project settings were preserved. The existing Vercel deployment protection remains enabled.

Refresh reads stored data; it does not fetch new posts from X. No automatic X ingestion or scheduled update job has been configured. The connected GitHub tools do not expose repository creation, and an authenticated gh CLI was unavailable. GitHub repository, PR, and Git-triggered deployment remain unfinished.

## Verify and build

Requires Node 24. No dependencies to install.

```sh
npm test
npm run build
```

## Connect Supabase

The existing authorized project is already initialized. Do not create another project or reapply the schema. For a fresh authorized database only, apply `db/schema.sql`, then generate initialization SQL:

```sh
node scripts/seed-sql.mjs > /tmp/ship-happens-seed.sql
```

Apply that seed SQL. The seed is idempotent; existing days and releases are retained. Settings reflect this snapshot, so do not re-run the initial seed after updating the verification timestamp without reviewing it.

Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` as Vercel server environment variables. Redeploy. Only a publishable key is needed. Never configure a service-role key in browser code. Confirm the API returns mode `supabase`, 28 days, and five initial releases, and confirm anonymous write requests fail.

All three public tables have RLS and read-only anonymous policies. Writes occur through trusted Supabase tooling. No public admin write endpoint exists.

Verification on October 6, 2026: six unit tests and the build passed. Production deployment `dpl_2BvZiwoJzJL1c8Ji6LonAqthbzPP` reports READY. The live API returns `mode: supabase`, 28 days, and five releases. Anonymous SQL reads return those counts; anonymous INSERT fails with permission denied. Anonymous INSERT, UPDATE, and DELETE grants are absent for all three tracker tables. The Supabase security advisor reports no tracker findings; unrelated existing project notices were left unchanged.

Live Chrome checks passed at 1440px and 390px: storage status, 28 tiles, search, saved releases, reset filtering, day detail dialog, Refresh, celebration, and no horizontal overflow or page errors. Screenshots are in `verification/`. Run `scripts/browser-smoke.mjs` with Playwright available, optionally setting `PLAYWRIGHT_MODULE` to its installed module path. App runtime remains dependency-free.

## Maintain the tracker

Use X Agent to read Tibo’s current posts. Record every relevant release separately and link it to its own announcement. Upsert releases by stable ID so repeated checks do not duplicate entries. Update a day's ship status to verified after a release is confirmed. Mark reset status confirmed only with a post confirming delivery and set reset_source_url. Missing posts, reset requests, and polls are not proof of delivery. Update the challenge settings content verified_at after each successful source check. The frontend reads the stored records on load and Refresh.

X Agent was checked again during integration. The four Day 2 announcements remain the relevant releases; no delivered reset was confirmed. Use trusted Supabase execute_sql for scoped, transactional updates to the prefixed tables. The initialization generator preserves existing days/releases and is not a routine update command. Agree on a schedule before creating a recurring update job.

## GitHub

Create the public `stozo04/ship-happens` repository, initialize its default main branch, then add this source on a task branch and open a PR. No existing repository was changed. Connect the Vercel project to that repository after its first reviewed production source is available.

## Data provenance

Original promise: https://x.com/thsottiaux/status/2106845241357824205

Source links and verification date are in `data/seed.json`. The site is independent and is not affiliated with OpenAI. Favorites are local to the device. The API only serves public challenge records and rejects writes.
