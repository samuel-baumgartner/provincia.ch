---
title: "Rebuilding Water as Cellular Automata"
excerpt: "The first water pass looked fine in screenshots and lied about where flow went. We threw it out."
date: "2026-04-29"
author: "Provincia Dev Team"
tags:
  - water
  - cellular-automata
  - performance
coverImage: "/devtalks/water-system-rebuild/channel.png"
---

The pond looked calm. Then we cut a channel through a terrace lip and watched water sit in places it should have drained from.

Our first implementation leaned on smoothing — diffusion-ish updates that made wet ground look soft and convincing from a distance. Gameplay did not care about soft. Gameplay cared whether a ditch south of the well actually carried overflow, whether a building footprint blocked the path, whether a colonist could walk to a wet cell and drink.

We rewrote `water_simulator.gd` around **local flow rules** on the same grid as everything else.

## Hydraulic head, not paint depth

Each cell stores depth, but flow compares **hydraulic head**: terrain surface Y plus water depth. On 1 m terraces that means a shallow pool on a high step can still push water over a lip if head is high enough — same idea as the sealed-channel tests we run headless.

Rules per sub-step:

1. Water moves to orthogonal neighbors with lower head.
2. Solid building cells block flow.
3. Mass leaving the map edge is removed (no infinite bathtub).

Virtual pipes carry the mass between cells. Tunables we actually touch in balancing:

- `PIPE_ACCEL = 0.16` — how fast edge flow responds to head differences
- `PIPE_FRICTION = 0.92` — damping so pools settle instead of sloshing forever
- `PIPE_MAX_EDGE_FLOW` — per-edge cap so one tick cannot drain a lake through a pinhole

![Channel test layout — source, trench, outlet](/devtalks/water-system-rebuild/channel.png)

*Regression scene: spring at the north end, trench one step down, sealed side walls. Throughput has to match emission within tolerance.*

## Rendering split: still tops, sloped flow

Visuals are deliberately dual-mesh:

- **Still water** — flat quads per wet cell. Clean pond surfaces.
- **Flowing water** — subdivided mesh with real slope between cells at different terrain heights, so terrace drops read as small cascades.

Cliff sheets along vertical terrain steps are optional (`cliff_sheets_enabled`) because they are expensive to rebuild. We leave them off during perf hunts.

## Performance: only sim where it matters

A full 200×200 CA every frame is wasteful when one pond is active. Two switches matter in practice:

- **Active-region flow** — only wet cells and their neighbors get CA passes.
- **Chunk-dormant regions** — terrain chunks with no water sleep until a neighbor wakes them.

We also cap sim steps per second (`max_sim_steps_per_second`, default 3) and slice flow passes across physics frames so spikes do not hitch the camera.

## Colonists drink the same grid

`agent_needs.gd` paths colonists to **wet cells** for water. No separate “water building” abstraction for thirst — if the CA lied, colonists would lie too. When we toggle consumption for tutorial steps, we invalidate drink-path caches on day start so routes do not stick to dried ground.

![Aqueduct context on terrace steps](/devtalks/water-system-rebuild/pond-context.png)

Aqueduct pier cells stay permeable in the sim (`_aqueduct_permeable`) so a line of arches is not an accidental dam. Placement and water share the same footprint data.

## Tests we trust

`./tools/run_water_tests.sh` runs six scenes: pit fill, lip overflow, sealed channel, well spill, freeze-while-paused, and more. If a change passes those and looks wrong in-game, we add a scene instead of arguing in chat.

The old smoothing pass is gone. Good riddance. Water still needs tuning — spring drain scales, lawn bleed thresholds — but at least the failures are local and reproducible now.
