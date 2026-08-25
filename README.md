This is a [Next.js](https://nextjs.org) project for [provincia.ch](https://provincia.ch).

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Marketing automation

Fully unattended pipeline (OpenAI drafts + platform APIs):

| Command | What it does |
| --- | --- |
| `pnpm reddit:scan` | Find threads → `reports/reddit-opportunities.md` |
| `pnpm reddit:login` | One-time headed login; saves session to `data/reddit-browser-profile/` |
| `pnpm reddit:engage` | Local/VPS paced session (~80% days, ~4 comments / 30m + lurk fetches; soft-halt blocks promo only) |
| `pnpm devtalk:distribute` | Latest DevTalk → Discord/Reddit/X/Steam drafts (UTM’d) |
| `pnpm social:publish` | Post Discord + optional X/Reddit; Steam reminder via Discord |

GitHub Actions:

- [`.github/workflows/marketing-publish.yml`](.github/workflows/marketing-publish.yml) — 09:00 + 15:00 UTC distribute/publish (Discord/X; Reddit comments are local via `pnpm reddit:engage`)

Reddit scan is **manual**: `pnpm reddit:scan` (no scheduled workflow).

### Kill switches

Prefer the **Marketing Command Center** at `/admin` (writes `reports/marketing-controls.json`). Env vars still work and override when set:

- `MARKETING_AUTO_PUBLISH=0` — no engage/publish
- `REDDIT_AUTO_POST=0` — drafts only for Reddit
- `X_AUTO_POST=0` — skip X
- `DISCORD_AUTO_POST=0` — skip Discord
- `REDDIT_DRY_RUN=1` / `SOCIAL_DRY_RUN=1` — log what would post
- `MARKETING_CONTROLS_IGNORE=1` — ignore the controls JSON file
- `CONTROLS_GITHUB_TOKEN` — optional; lets `/admin` dispatch/list GitHub Actions

**Note:** If a GitHub Actions secret sets these to `0`, that secret wins over the JSON file on CI.

Admin also has `/admin/setup` checklists and `/admin/itch` DevTalk → itch BBCode copy.

### Repo / Action secrets

| Secret | Required for |
| --- | --- |
| `OPENAI_API_KEY` | Scan + draft rewrite |
| `MARKETING_AUTO_PUBLISH` | Set to `1` to enable posting |
| `DISCORD_WEBHOOK_URL` | Discord announcements + Steam reminders |
| `DISCORD_AUTO_POST` | Optional; default on when publish runs |
| `REDDIT_AUTO_POST` | Set to `1` for comments / rare self-posts |
| (local) `pnpm reddit:login` | Browser session profile — required for engage (not OAuth) |
| `REDDIT_BROWSER_HEADED` | Set to `1` to watch Chromium during engage |
| `REDDIT_USER_AGENT` | Optional override for public JSON checks |
| `X_AUTO_POST` | Set to `1` to tweet |
| `X_API_KEY` / `X_API_SECRET` / `X_ACCESS_TOKEN` / `X_ACCESS_SECRET` | X pay-per-use (~$0.20/link post) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Download analytics (site env / Vercel) |

Warm the Reddit account manually (age + karma gates default to 30d / 100 karma) before enabling `REDDIT_AUTO_POST`.

Ledger: `reports/publish-ledger.json` (committed by Actions).

## Download analytics

Buttons hit `/api/download/[platform]` → count → 302 to [itch.io](https://cybersaemi.itch.io/provincia). UTMs from marketing links are stored in `sessionStorage` and attached as `?src=` (no cookie wall).

View counts at `/admin/downloads` once Upstash is configured. Downloads still work without Redis.

## Marketing Command Center (`/admin`)

Password-protected hub (`ADMIN_PASSWORD` in `.env.local`):

- **Overview** — stats and automation list
- **Reddit** — scan queue + publish ledger / halt status
- **DevTalk** — posts and drafts
- **Social** — drafts + auto-publish status
- **Downloads** — platform × source counts
- **Steam** — Next Fest checklist
- **Creators** — locked until prerequisites

Local runner: `MARKETING_RUNNER=enabled` lets the admin UI run scan/distribute scripts.
