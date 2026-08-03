---
title: "First Steps With Provincia"
excerpt: "We picked a 200×200 grid before we had pretty art. That choice still pays rent every week."
date: "2026-04-28"
author: "Provincia Dev Team"
tags:
  - architecture
  - simulation
  - grid
coverImage: "/devtalks/first-steps-with-provincia/colony-overview.png"
---

We started Provincia with a boring decision: everything lives on a fixed grid.

Not because grids are romantic. Because the moment you let players paint freeform shapes, you need a second hidden model for simulation anyway — occupancy, paths, water cells, haul routes. We wanted one model. The renderer, the placement tools, and the water sim all read the same `Vector2i` coordinates on a **200×200** map with **1 m terrace steps**.

![Colony settlement overview from a recent build](/devtalks/first-steps-with-provincia/colony-overview.png)

*The grant filled in: housing along low ground, aqueduct runs at the edge, work sites and docks pushing outward.*

## Why Roman, why colony

The fantasy is small and specific. You are the **curator** of a colonia at the edge of the province — a strip of granted land with a hall, eight beds, ponds that were already wet when you arrived, and families waiting for orders. More people show up from the road when word spreads. Rome gave you the outline. You fill it in.

That tone pushed us toward systemic city-building (think logistics-heavy builders) in a Roman skin, not a strategy map with abstract provinces.

## Grid occupancy before polish

`GridOccupancy` tracks more than “is there a building here”. We keep separate layers for occupied cells, paths, sewage underlays, and construction reserves. When a footprint lands, we batch `cells_changed` so water, housing checks, and visuals do not each scan the full map.

Buildings themselves are rows in `data/buildings.csv` — display name, footprint profile, costs, worker slots, scene path. Adding a hut means adding a row, not another `elif` chain in the placer. Custom L-shapes and aqueduct inlets go in `building_footprints.csv` with per-cell offsets.

## ColonyServices instead of scavenger hunts

Early on, every system reached into `main` with `get_node` and `has_method`. That broke the moment we added a second playthrough mode. `ColonyServices` is a small locator: ask for the water sim, haul board, or footprint view by name. Tutorial and dev colony share the same wiring.

## Housing you can see grow

Roman housing is not one mesh swap. Stages upgrade in place — rough timber, better walls, stone — and the district solver has to respect door paths and terrace height while packing clusters.

![Stage 1 housing](/devtalks/first-steps-with-provincia/housing-stage-01.png)

![Stage 3 housing](/devtalks/first-steps-with-provincia/housing-stage-03.png)

![Stage 4 housing](/devtalks/first-steps-with-provincia/housing-stage-04.png)

We are still pre-alpha. Visuals will move. The grid will not — every interesting system we have added (water CA, sewage underlays, aqueduct permeability) assumed it from day one.

**Next up:** making water behave like water, not like blue paint.
