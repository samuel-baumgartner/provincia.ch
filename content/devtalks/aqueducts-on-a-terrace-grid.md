---
title: "Aqueducts on a Terrace Grid"
excerpt: "An aqueduct here is terrain surgery, permeable piers, and a Blender UV map — not a single pretty bridge prefab."
date: "2026-05-05"
author: "Provincia Dev Team"
tags:
  - aqueduct
  - water
  - art-pipeline
coverImage: "/devtalks/aqueducts-on-a-terrace-grid/straight-run.png"
---

Players expect Roman water infrastructure to do something. Our aqueducts had to carry the CA sim across terrace steps without becoming accidental dams, and they had to look like stacked stone runs instead of stretched boxes.

That split the problem in two: **placement math** and **mesh assembly**.

## Placement: deck height from anchors

`aqueduct_placement.gd` walks a polyline on the grid. For each cell it:

- Reads anchor `floor_y_max` to set deck height.
- Excavates terrain where the run needs a trench.
- Counts piers and merges corners when modules meet at angles.

Footprint cells mark pier positions as **permeable** in `water_simulator.gd` so water can move through the arch line instead of pooling behind a stone wall.

## Visual runs, not per-cell spam

`AqueductRunMesh` merges straight modules into one draw call per layer. Bottom double-height runs and top channels bake from GLBs listed in `BuildingCatalog` (`GLB_AQUEDUCT_BOTTOM_DOUBLE`, `GLB_AQUEDUCT_TOP`).

![Aqueduct run across terrace steps in the dev build](/devtalks/aqueducts-on-a-terrace-grid/straight-run.png)

`./tools/aqueduct_iterate.sh` spawns test modules for material checks. The harness PNG can glitch when the GL pipeline is mid-refactor — we use in-game colony captures for the site instead.

## Corners without gaps

Corner cells switch to dedicated meshes so the top channel bends instead of z-fighting two straights.

![Aqueduct corner from above](/devtalks/aqueducts-on-a-terrace-grid/corner.png)

Nineteen script-only tests in `./tools/run_aqueduct_tests.sh` cover placement math without opening a window.

## Blender → GLB → Godot

`AqueductStoneMaterial` can use the PBR material embedded in each GLB (`USE_GLB_IMPORTED_MATERIAL = true`). We preserve Blender UVs (`PRESERVE_BLENDER_UV`) — random UV shifts on merge looked awful on large stone surfaces.

Workflow that actually stuck:

1. Unwrap in Blender the way you want stone coursing to read.
2. Export glTF with materials and textures.
3. Drop over the path in `BuildingCatalog.GLB_AQUEDUCT_*`.
4. Reimport in Godot and run the iterate harness.

![Ashlar tile (left) and baked module with preserved UV stone coursing (right)](/devtalks/aqueducts-on-a-terrace-grid/uv-preview.png)

## Failure modes we hit

- **Deck too high for pier count** — water visually disconnects from the channel; placement now clamps from anchor surveys.
- **Impermeable footprint** — CA backed up entire ponds; pier roles in `building_footprints.csv` fix that.
- **Merged mesh UV stretch** — fixed by baking per-module instead of averaging UVs on merge.

Aqueducts are the clearest example of why Provincia is a simulation game with Roman dressing, not a asset flipper: the mesh exists to serve grid state the player can reason about.
