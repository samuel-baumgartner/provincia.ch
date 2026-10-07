---
title: "Water as One Sheet"
excerpt: "Ponds, shallow pads, ditches, and cliff falls share one continuous surface — depth-graded color, soft shores, downhill lanes — instead of tiled teal slabs."
date: "2026-10-06"
author: "Provincia Dev Team"
tags:
  - water
  - art
  - shaders
coverImage: "/devtalks/water-as-one-sheet/cover.png"
---

Water used to read as a grid of flat teal tiles. Ponds stepped at cell edges, ditches looked painted per quad, and cliff drops were solid walls. This ship is visual only — the CA is untouched — but the surface finally looks like one body of water.

![Pond mid — continuous depth from soft shore to deep center](/devtalks/water-as-one-sheet/cover.png)

## Depth and shore without the tile

The surface shader blurs wet depth across neighboring cells and measures meters to the nearest dry bank instead of a per-cell edge test. Color grades shallow teal into deep navy, alpha softens at the shore, and dry texels no longer punch a dark cross through the middle of a pool. Still water gets a slow drift so the sheet is alive without looking like a river.

![Shallow pad — soft bank, no cell-edge steps](/devtalks/water-as-one-sheet/shallow.png)

## Ditches with downhill lanes

Channel water samples a neighborhood flow vector so long ditches pick up downhill lanes instead of a flat fill. Depth and shore stay continuous along the cut, so a trench reads as one ribbon rather than a stack of wet quads.

![Channel mid — one ribbon of water down the trench](/devtalks/water-as-one-sheet/channel.png)

## Falls you can see

Where the surface drops onto a lower wet neighbor, edge sheets sit on the low side of the step — in front of the dirt, not inside it — with vertical gaps and streak so they read as a fall instead of a solid cyan wall.

![Cliff fall close — streaked sheets in front of the bank](/devtalks/water-as-one-sheet/fall.png)

## Aqueduct troughs keep their lips

Trough water in aqueduct channels keeps the same surface language without swallowing the stone lips. The polish is shared; the mesh builders still respect the trough bounds.

![Aqueduct channel — water sheet between stone lips](/devtalks/water-as-one-sheet/aqueduct.png)

## What to feel in a build

- Dig or place a pond and orbit it — the bank should fade smoothly, not stair-step per cell.
- Cut a long ditch downhill — look for continuous depth and faint lanes along the flow.
- Overflow a ledge — the fall sheet should hang in front of the cliff with vertical gaps.
- Fill an aqueduct trough — water should sit inside the stone, not erase the lips.
