---
title: "Housing on Slopes"
excerpt: "Dragging a housing district should not mean hand-rotating forty huts on a terrace grid. We ported a solver."
date: "2026-05-02"
author: "Provincia Dev Team"
tags:
  - housing
  - placement
  - performance
coverImage: "/devtalks/housing-on-slopes/housing-stage-02.png"
---

You drag a rectangle on uneven ground and expect houses to land sensibly. On flat maps that is easy. On Provincia’s **1 m terrace steps**, a naive fill algorithm places doorsteps in mid-air or buries entrances in dirt.

We did not want manual rotation per hut. We wanted a **district solver** that reads the same terrain and path grid as placement and water.

## Bottom-up packing

`housing_cluster_solver.gd` is a port of an external bottom-up cluster packer (we keep JSON golden files to prove parity). Given a zone and a target house count, it:

1. Builds clusters of hut footprints that share path access.
2. Routes paths with BFS along valid cells.
3. Rejects placements that break flatness rules or door-path height limits via `HousingWorldGrid.can_place_housing_at()`.

Runtime placement goes through the same checks in `building_place_check.gd` so preview matches result.

![Mid-stage Roman housing](/devtalks/housing-on-slopes/housing-stage-02.png)

Stages upgrade in place — timber to stone — but the footprint logic stays tied to the district that was solved.

## When GDScript BFS got slow

A **20×40** cell zone is our primary perf gate: median layout time must stay **≤ 1000 ms**. On large zones, pure GDScript BFS dominated profiles.

We added `housing_fast`, a small GDExtension that accelerates the hot BFS paths. `./tools/run_housing_bench.sh 20x40` prints medians; `HOUSING_PROFILE=1` shows where time goes if we regress.

Golden tests:

- `test_housing_golden_deep_only.tscn` — full parity pass
- `test_housing_golden_step14.tscn` — fast check at house 14

Python parity against the reference solver lives in `./tools/run_housing_parity.sh` (local only — needs the external repo).

## Stone houses are a different shape

Not every dwelling is a rectangle. Stone huts use trapezoid footprints from `building_footprints.csv`. The solver and occupancy layers treat those offsets as first-class cells, not hacks in the placer.

![Stone house on the terrace grid](/devtalks/housing-on-slopes/stonehouse.png)

## District context in the world

Housing does not float in a UI vacuum. Districts connect to roads, town hall logistics, and sewage underlays reconciled after placement.

![Colony district context from the dev build](/devtalks/housing-on-slopes/district-context.png)

## What still hurts

Steep zones with tight path budgets sometimes return fewer houses than requested. We show that in the UI instead of silently cramming bad placements. Terrace editing after solve still requires rebuild passes — editing terrain under an existing row is a solved problem only if you enjoy pain.

Housing is one of the reasons the grid decision from [First Steps](/devtalk/first-steps-with-provincia) still feels correct: the solver, water lips, and haul paths all agree on what a cell is.
