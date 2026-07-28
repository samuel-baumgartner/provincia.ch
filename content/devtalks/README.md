# Publishing DevTalks

Add a new markdown file in this folder:

- filename becomes URL slug (example: `my-update.md` -> `/devtalk/my-update`)
- include frontmatter fields:
  - `title`
  - `excerpt`
  - `date` (YYYY-MM-DD)
  - `author`
  - `tags` (array)
  - `coverImage` (optional, path under `/public`, e.g. `/devtalks/my-update/cover.png`)

## Images

Store images under `public/devtalks/{slug}/` and reference them in markdown with absolute paths:

```md
![Water flowing through a cut channel](/devtalks/water-system-rebuild/channel.png)
```

Run `pnpm assets:sync` to copy screenshots from the Godot game repo and refresh capture scripts.

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
