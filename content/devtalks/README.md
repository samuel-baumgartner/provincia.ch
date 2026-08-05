# Publishing DevTalks

Add a new markdown file in this folder:

- filename becomes URL slug (example: `my-update.md` -> `/devtalk/my-update`)
- include frontmatter fields:
  - `title`
  - `excerpt`
  - `date` (YYYY-MM-DD)
  - `author`
  - `tags` (array)
  - `coverImage` (**required** — path under `/public`, e.g. `/devtalks/my-update/cover.png`). Every DevTalk must have at least this one image; the site list + article hero use it, and itch BBCode puts it first.

## Images

Store images under `public/devtalks/{slug}/` and reference them in markdown with absolute paths. The cover file must exist on disk before push.

```md
![Water flowing through a cut channel](/devtalks/water-system-rebuild/channel.png)
```

Run `pnpm assets:sync` to copy screenshots from the Godot game repo and refresh capture scripts. If no good screenshot exists yet, generate a topic-fitting cover and save it as `public/devtalks/{slug}/cover.png`.

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
