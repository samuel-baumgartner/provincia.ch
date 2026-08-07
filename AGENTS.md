<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Next.js 16 (Turbopack) + React 19 marketing/content site. Package manager is **pnpm** (`pnpm-lock.yaml`); dependencies are installed by the VM update script, so you do not need to run install manually. Standard scripts live in `package.json` and the [`README.md`](README.md): `pnpm dev` (dev server on `http://localhost:3000`), `pnpm build`, `pnpm lint`.

Non-obvious notes for this environment:

- This repo shares the VM with the sibling Godot game repo (`../my-colony-sim-game`). The game uses the X11 display + software Vulkan; this site only needs Node/pnpm, so both can run at once.
- `pnpm install` prints `Ignored build scripts: sharp, unrs-resolver`. This is **harmless** — dev/build/lint all work without approving those native build scripts (do not run the interactive `pnpm approve-builds`).
- `pnpm lint` currently reports **pre-existing** errors/warnings on a clean checkout (e.g. `react-hooks/set-state-in-effect` in `src/app/admin/AdminOpportunities.tsx`, `@next/next/no-html-link-for-pages` in `src/app/page.tsx` and `src/components/SiteNav.tsx`). These are not caused by the environment; `eslint` itself runs fine.
- The `/admin` area is password-gated via `ADMIN_PASSWORD` and marketing scripts (`reddit:scan`, `devtalk:distribute`) need `OPENAI_API_KEY`; neither is required to run, build, or browse the public site.
- Local Reddit automation uses Playwright + a persistent profile (`pnpm reddit:login` → `data/reddit-browser-profile/`), then `pnpm reddit:scan` / `pnpm reddit:engage`. Scan is manual (no GHA cron). Engage needs master+Reddit toggles in `/admin` (or env). New/low-trust accounts stay in **helpful-only** mode (no promo); once warmed and comments are visible logged-out, ~every 4th reply may be promo (3:1). Invisible comments soft-halt promos only — they do not stop the bot.
- Admin control center: `/admin` (health + kill switches + jobs), `/admin/setup` (channel checklists), `/admin/itch` (DevTalk → itch Markdown). Controls file: `reports/marketing-controls.json`.
- Public play links: site https://provincia.ch · itch https://cybersaemi.itch.io/provincia (live free pre-alpha downloads). Steam not yet.
- DevTalk `coverImage` must be a **real Godot/in-game screenshot** of the change (synced via `pnpm assets:sync`). Never AI-generate covers.