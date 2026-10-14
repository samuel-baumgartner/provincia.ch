---
title: "Cutting Flowing Water Cost"
excerpt: "Drying one cell no longer rescans the whole map. A flowing 64×64 lake drops from about 20 ms to about 12 ms script time — same depths."
date: "2026-10-14"
author: "Provincia Dev Team"
tags:
  - water
  - performance
  - systems
coverImage: "/devtalks/cutting-flowing-water-cost/cover.png"
---

Flowing lakes were still expensive for a boring reason. The native CA kernel finishes in about half a millisecond. GDScript around it was the bill: when one wet cell dried, the next ensure rescanned all forty thousand cells — twice per step. Depths were fine; the frame hitch was not.

![Far pond — the kind of wet footprint that used to pay a full-map presence rebuild](/devtalks/cutting-flowing-water-cost/cover.png)

## Local presence, same rule

Clearing a wet-list cell now refreshes only that chunk and its cardinal neighbors. The presence rule is unchanged: a chunk stays active when it has water, an emitter, or sits in the one-cell halo of either. Region indices rebuild only when a presence bit actually flips. On the flowing-lake bench, full-grid presence rebuilds drop to setup only — not once per step.

## Fewer copies on the hot path

Presence rebuilds and region index builds no longer grow arrays with per-cell `_sim.get(...).append`. Chunk lists and cell indices are sized once, filled locally, then written back. Quiet/border passes bind depth, solid, and terrain once for the pass instead of re-fetching ~160 KB grids inside every probe. Idle world LOD also skips classification when the camera has not moved and nothing is queued.

![Channel far — ditches and lakes keep the same depths; the script walk is lighter](/devtalks/cutting-flowing-water-cost/channel.png)

## What the numbers say

Harness: headless `bench_flowing_step`, resident native on, depth hash unchanged.

| Scenario | Before this ship | After local presence |
|---|---|---|
| Narrow trench (~105 active) | ~1.05 ms | **~0.77 ms** |
| 64×64 flowing lake (~3900 active) | ~20.5 ms | **~11.8 ms** |

That is roughly half the script cost on a big wet set, not a 100× cut. Remaining time is still GDScript walking the live wet set for motion samples, quiet-chunk metering, and the depth push. The water looks and fills the same.

![Terrace pool mid — overflow and fill behavior unchanged](/devtalks/cutting-flowing-water-cost/lake.png)

## What to feel in a build

- Fill a large pond or lake and leave sim running — flowing steps should hitch less than before.
- Dig or drain edges so cells dry while neighbors stay wet — water should keep moving without a full-map stutter.
- Orbit a steady camera over wet ground — LOD classification should stay quiet until you move again.
