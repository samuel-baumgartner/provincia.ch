---
title: "Water That Sees Dirt Edits"
excerpt: "Native sparse CA keeps ponds cheap, digs and raises rejoin the flow map, and turning a well on no longer freezes the frame."
date: "2026-09-14"
author: "Provincia Dev Team"
tags:
  - water
  - performance
  - terrain
coverImage: "/devtalks/water-that-sees-dirt-edits/cover.png"
---

Water used to lie when you shaped the ground. Raise a lip, dig a ditch, flip a well — the depth field kept moving, but lips and topology lagged behind, mesh rebuilds hitching the camera on busy ticks. This ship makes the CA fast enough to stay local and honest enough to notice dirt.

![Terrace pools on the CA grid — depth and lips share the same cells](/devtalks/water-that-sees-dirt-edits/cover.png)

## Native sparse flow

Resident water depth now lives in the C++ CA across steps. Each pass only gathers and scatters the active halo instead of rewriting the whole map. Debug I/O and full-grid emit fills stay off the hot path. Headless gates still demand a sealed trench finish far faster than the old GDScript baseline — the point is local channels, not open-map floods.

![Sealed channel fixture — mass moves by head, not paint](/devtalks/water-that-sees-dirt-edits/channel.png)

## Dirt edits rejoin the map

Terrain raise and dig patch lips, rim caches, and native topology, then force-wake the CA so new walls and trenches register on the next flow. Wet-quad mesh work moves to idle physics frames so a flow tick no longer rebuilds the whole surface while you are still sculpting.

## Wells without the hitch

Enabling a source no longer full-grid resamples topology on the click. Topology upload and resident flow run on `WorkerThreadPool`; stashed buffers apply on a later physics tick. A typed-index bug that left wells wet in depth but invisible on mesh is fixed — sparse visual push reads the packed work-set again.

![Side pool at mid distance — same rules at the ledge](/devtalks/water-that-sees-dirt-edits/terrace-pool.png)

## What to feel in a build

- Dig a ditch downhill from a pond and watch overflow take the new trench instead of ignoring the cut.
- Raise a lip beside a channel — water should stop where the wall landed.
- Toggle a well on in a busy colony: depth should appear without a long main-thread freeze.
- Keep a local spill running and pan the camera — flow ticks should not spike wet-mesh rebuilds the way they did.

![Colony overview — ponds and ditches should stay responsive as the settlement grows](/devtalks/water-that-sees-dirt-edits/colony-context.png)
