---
title: "Soft Music Reloops"
excerpt: "Day, night, title, and combat beds no longer hard-cut at the loop — a long equal-power self-crossfade hides the AI join."
date: "2026-08-13"
author: "Provincia Dev Team"
tags:
  - audio
  - polish
  - ui
coverImage: "/devtalks/soft-music-reloops/cover.png"
---

Colony music used to hitch at the seam. The beds are AI-authored loops; native OGG loop alone still snapped when the material at the join did not match. You heard it on long day sessions and again when dusk flipped the night bed.

![Golden-hour settlement — the bed that rides under quiet colony time](/devtalks/soft-music-reloops/cover.png)

## Overlap the cut instead of looping through it

`AudioDirector` keeps native loop **off** for mode beds. Near the end of a track it starts the same stream again from t=0 on the spare player and runs a **~6 s equal-power crossfade** (constant loudness — linear dB fades dipped in the middle). Two players never share one OGG cursor; the incoming stream is duplicated.

If a hitch skips the soft-reloop window, a finish callback restarts the bed so silence does not win. Mode changes still use the shorter crossfade between day / night / combat / title.

![Settlement orbit still from the refreshed promo shoot](/devtalks/soft-music-reloops/settlement-orbit.png)

## Also landed with this ship

- **Jobs panel drag:** drops in empty scroll space below the last row still commit; Escape cancels instead of applying a stale insert.
- **Planks workshop ghosts:** fail chips now say *Place in water* or *Raise path 1 above workshop* instead of a generic refuse.
- **Build dock tabs:** reloads no longer blank INFRASTRUCTURE / PRODUCTION / HOUSING when a second rebuild hits the same frame; leaving a category clears the stuck tool tip.
- **Promo trailer:** VO cut assembled from the same refreshed colony clips (orbit, timelapse, golden hour).

![City timelapse still — long sessions where soft reloops matter](/devtalks/soft-music-reloops/city-timelapse.png)

## What to listen for in a build

- Leave the colony running through a full day bed — the join should breathe, not click.
- Flip dusk / dawn and combat in / out; mode crossfades stay separate from the soft reloop.
- Drag a Jobs priority row past the list bottom, or cancel with Escape, and confirm the order matches intent.
