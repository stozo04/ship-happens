# AGENTS.md

Read this before changing Ship Happens. It covers how the app works, where the data lives, how to add a day, the design rules the owner has settled on, and the mistakes earlier agents made.

Owner and only approver: Steven ([@stozo04](https://github.com/stozo04)). He checks previews on his phone, so phone layouts matter as much as desktop.

## What this is

An independent tracker for Tibo's 28-day Codex & Work challenge, October 5 to November 1, 2026. Every day Tibo ships a feature or delivers a usage reset (or both). The site shows each day, each feature and each reset, with a link to the original X post for every claim.

- Live site: https://ship-happens-rho.vercel.app/
- Public JSON feed: `GET /api/tracker` (documented for outside agents in `llms.txt`)
- Stack: plain HTML, CSS and JavaScript, one Node serverless function, no runtime dependencies. Hosted on Vercel.

## Where the data lives (read this first)

The live site does **not** read data from this repo.

- `api/tracker.js` reads three tables from Supabase: `ship_happens_days`, `ship_happens_releases` and `ship_happens_settings`. They sit in a shared Supabase project, so only touch `ship_happens_*` tables. Find the project with the Supabase connector by looking for those tables, or ask Steven. Storage details were deliberately removed from the README (PR #5), so don't add project names, refs or keys to the repo.
- `data/seed.json` is a fallback snapshot. The API serves it only when Supabase env vars are missing or storage fails. The page then labels it "Snapshot".
- **Vercel preview deployments read the same production Supabase.** A PR that only edits `data/seed.json` changes nothing on the live site or in its own preview.
- Writing to Supabase is live immediately, for everyone. There is no staging copy, so confirm data changes with Steven before writing.
- `db/seed.sql` is generated from `data/seed.json` (`node scripts/seed-sql.mjs > db/seed.sql`). Its inserts use `on conflict do nothing`, so re-running it never updates existing rows. Use `update` statements for corrections.
- An agent outside this repo (GrokBot, using the X API and the Supabase plugin) checks Tibo's posts hourly and writes to Supabase on its own for clear cases. The earlier Codex automation is cancelled. The last check time is `sync_checked_at` inside `ship_happens_settings.content`; if it is stale, the agent isn't running, so write the day by hand. Its instructions are the source of truth for how it settles days; keep them consistent with this file.

### Schema rules the database enforces

- `day` is 1 to 28, and `date` must equal 2026-10-05 plus (day - 1).
- `ship_status` is `pending` or `verified`. `reset_status` is `unconfirmed`, `pending` or `confirmed`. Nothing uses `pending` any more: a reset is either confirmed by Tibo's final message or it isn't.
- A `confirmed` reset needs `reset_source_url` matching `https://x.com/<handle>/status/<id>`.
- Every release needs `source_url` in that same form. `product_url` is optional.
- Release ids follow `day-<n>-<slug>`, for example `day-3-gpt6`.

## Adding a day's update

**A day isn't decided until Tibo's final message of the day.** He closes each day with a recap post that starts `Day N/`, names the big release, says whether the day goes to a reset, and ends with something like "See you again tomorrow!". Some days a poll lets people choose between a reset and keeping the feature; whatever Tibo announces in his final message is the result. A poll, a vote tally, a promise or silence is never the result, and a late hour never means "no reset".

1. Get the source. Every feature needs its own X post URL. If you can't open X, ask Steven for the post text or a screenshot.
2. Through the day, as Tibo announces features, insert one `ship_happens_releases` row per feature (title, summary, an existing category of `Performance`, `Codex`, `ChatGPT` or `API`, `source_url`, optional `product_url`). Leave the day row's statuses alone. If a poll appears, save its link in `poll_url`.
3. When the final message appears, settle the day row and use that post as the source:
   - Reset won (Tibo says the day goes to a reset, whether or not features also shipped): `reset_status='confirmed'`, `reset_source_url` = the final message URL, and `ship_status='verified'` if any feature shipped.
   - Features won: `ship_status='verified'`, `reset_status='unconfirmed'`.
   - Add a short `note`.
   - If the final message is missing or unclear (nothing shipped and no reset, or no recap by noon Central the next day), don't invent an outcome; ask Steven.
4. Verify the live feed: `curl -s https://ship-happens-rho.vercel.app/api/tracker` should show `"mode":"supabase"` and the new rows.
5. Mirror the same data into `data/seed.json`, regenerate `db/seed.sql`, and update the hard-coded counts in `test/tracker.test.mjs` (the seed summary test) and `scripts/browser-smoke.mjs` (timeline card and source-link counts). Open a PR for that.

The site never needs to be told who won the day: it scores a confirmed reset as Resets (even if features shipped) and otherwise a verified feature as Features. Keep recording every feature on a reset day.

Which day a post belongs to: use the Central calendar date of the post. Tibo's `Day N/` label is a cross-check, not an override. He mislabels sometimes (a Codex Cloud post on October 8 called itself a Day 3 encore, which was a typo), so if the label and the date disagree, ask Steven.

Writing style for notes and summaries: one or two plain sentences, in your own words, no hype. Say what changed for users. For Day 3, Steven asked the note to say that even with a big release, a reset still came; the live note reads "GPT-6 in ChatGPT was the big release, and we still got a reset…".

### Known data mismatch (unresolved)

Day 2's reset source differs. Supabase links `…/2107676072871600470`; `data/seed.json` links `…/2107578625419866469` with different note wording. Supabase is what users see. Ask Steven which post is right before syncing either side.

## How the app is built

| File | Role |
| --- | --- |
| `index.html` | Static markup: hero, tug of war, calendar, timeline, dialogs. |
| `app.mjs` | Fetches `/api/tracker`, renders everything, handles search, filters, dialogs and Refresh. |
| `lib/tracker.mjs` | Pure logic with tests: `dayNumber`, `normalizeSourceUrl`, `summarize`, `dayStatus`, `challengeProgress`, `tugOfWar`. Put new logic here, not in `app.mjs`. |
| `clean.css` | The active design. It sits on top of `styles.css` and overrides it. |
| `styles.css` | Old dark-theme base layer. Don't restyle things here; override in `clean.css`. |
| `api/tracker.js` | Serverless reader for Supabase with the snapshot fallback. |
| `scripts/build.mjs` | Copies a **fixed list** of files into `dist/`. A new top-level file must be added to that list or it won't deploy. |
| `scripts/browser-smoke.mjs` | Optional Playwright checks, not run in CI. Its expected counts are tied to current data. It launches Chrome; in a cloud session, run a scratch copy with `executablePath` set to the preinstalled Chromium, the session proxy, `ignoreHTTPSErrors`, `LOCAL_BUILD=1` and `PLAYWRIGHT_MODULE` pointing at an installed Playwright. |
| `llms.txt` | Guide for outside agents using the JSON feed. Update it if the feed's shape changes. |

Dates are calendar dates in `America/Chicago`. "Today" and the current challenge day come from that time zone.

### CSS gotchas

- `clean.css` is a stack of override blocks. Append new rules in a labeled block near the related section, then check computed styles. Older rules can win on specificity; for example `.score-bottom span{font-size:10px}` once shrank an icon.
- Breakpoints: 680px (phone) and 900px (calendar switches from 14 to 7 columns). Colors and the reset tokens live in `:root` (`--reset`, `--reset-ink`, `--reset-edge`, `--rope`, `--rope-dark`, `--ribbon`).

## Design rules Steven has settled on

These came out of real feedback. Don't undo them without asking.

- **Plain over clever.** "3 / 28 days shipped" confused him. So did a "3-day streak" that he read as including resets. Every number needs a label that says exactly what it counts, and copy must be literally true for the data.
- **Tug of war scoreboard.** The hero is one column: the headline, then a full-width card with Features on the left, Resets on the right, the score call in the middle and a rope across the bottom.
  - Scoring (`tugOfWar` in `lib/tracker.mjs`): each completed day scores once. A confirmed reset takes the day, even if features also shipped. Otherwise a day with any shipped feature scores once for features, however many features shipped.
  - The red ribbon on the rope slides toward the leader on load. After November 1 the card announces the winner.
- **Calendar tiles.**
  - Black means the day is Completed (feature, reset or both). A day that is still open stays white with its dots, and screen readers hear "in progress".
  - One white dot per feature (up to four; five or more shows ×N).
  - A lime sticker with a refresh icon in the corner means a usage reset.
  - The current day says "Today" until something lands. A past day that Tibo hasn't settled yet says "Open" and keeps a plain border, because his recap can land after midnight. It only gets a dashed border once a later day has settled or the challenge is over (`dayMissed` in `lib/tracker.mjs`).
  - The legend reads "Completed, 1 dot = 1 feature, Usage reset, Not yet".
- **Color has one meaning each.** Black and white for everything structural. Lime (`--reset`) is only for resets. Tan rope and red ribbon only in the tug of war. Category pills (Performance, ChatGPT, API, Codex) keep their pastel colors.
- **Vocabulary.** Say "feature" in the UI (the data calls them releases), "usage reset" or "reset", and "Completed".
- **Keep the hero minimal.** No description paragraph under the headline.
- **Mobile first.** Check at 390px, about 900px (tablet and foldable width) and 1440px, with no horizontal scrolling.

## Workflow

- `main` is protected: code-owner review by @stozo04, no direct or force pushes. Work on a branch and open a focused PR.
- **Always give Steven the Vercel preview link before he merges.** Previews sit behind Vercel login; for his phone, create a share link (for example the Vercel connector's `get_access_to_vercel_url`).
- Before opening a PR: `npm test`, `npm run build`, and a look at the page at the three widths above. If Chrome isn't installed, Python Playwright with Chromium can load `dist/` from a local server, with `/api/tracker` routed to a saved copy of the live JSON.
- README says Node 24. Tests and build also run on Node 22.
- Never commit credentials or personal data. `.env*` is ignored except `.env.example`.

### Cloud agent sessions

- `gh pr create` fails because GraphQL is blocked. Create and edit PRs with the REST API: `gh api repos/stozo04/ship-happens/pulls -f title=… -f head=… -f base=main -F body=@body.md`.
- Shallow clones only track `main`. If a hook says your branch isn't pushed, run `git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'`, fetch the branch, then set its upstream.
- Check that you can push before doing the work.
