# Publishing DevTalks

Add a new markdown file in this folder:

- filename becomes URL slug (example: `my-update.md` -> `/devtalk/my-update`)
- include frontmatter fields:
  - `title`
  - `excerpt`
  - `date` (YYYY-MM-DD)
  - `author`
  - `tags` (array)
  - `coverImage` (**required** — path under `/public`). This must be a **real in-game screenshot of what changed** (HUD/scene capture from the Godot repo). **Do not use AI-generated covers.**

## Images (in-game only)

1. Capture or use an existing debug/itch screenshot from `my-colony-sim` that shows the feature.
2. Put it under `public/devtalks/{slug}/` (usually `cover.png`).
3. Wire it in [`scripts/sync-game-assets.sh`](../../scripts/sync-game-assets.sh) so `pnpm assets:sync` keeps it updated from the game repo.
4. Set frontmatter `coverImage: "/devtalks/{slug}/cover.png"`.

Inline body images use absolute paths under `/public` the same way:

```md
![Water flowing through a cut channel](/devtalks/water-system-rebuild/channel.png)
```

```bash
pnpm assets:sync
```

Example:

```md
---
title: "My Update"
excerpt: "A short summary"
date: "2026-05-01"
author: "Provincia Dev Team"
tags:
  - systems
  - ui
coverImage: "/devtalks/my-update/cover.png"
---

Write the DevTalk content here.
```
