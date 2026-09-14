---
title: "Cutting Colonist Lag"
excerpt: "Idle settlers stop burning unused animation clips, haul picks skip beaten depots, and the tutorial reads less like a chatbot."
date: "2026-09-14"
author: "Provincia Dev Team"
tags:
  - colonists
  - performance
  - tutorial
coverImage: "/devtalks/cutting-colonist-lag/cover.png"
---

Big colonies were hitching for dumb reasons. Sleeping or off-screen settlers still spun AnimationPlayers on hidden clips. Haul scoring rebuilt walk paths for every depot even after a better job had already won. You felt it as hitching when the streets filled up.

![Busy settlement streets — where idle clip cost used to pile up](/devtalks/cutting-colonist-lag/cover.png)

## Stop animating what you cannot see

Colonist visuals now spawn **lazy**: idle settlers keep a single clip until they actually walk. Walk start/stop still swaps clips; standing around does not. Sleep, visit, and raid hide paths disable process on the agent node and stop unused GLB AnimationPlayers so night and rest no longer pay for every body in the roster.

Facing and visual sync run on walking settlers only. The inspector work path only runs while that panel is open.

## Cheaper haul picks

`haul_job_board` scored depots by reconstructing a full door walk every candidate. It now uses the cached door distance field (O(1)). Once a construction job beats hut import/export, the board stops scanning those huts. Building lists use a cheap fingerprint instead of sorting the Buildings tree on every lookup, and the cache rebuilds only when that tree actually changes.

![Settlement orbit — logistics still moves; the pick loop is lighter](/devtalks/cutting-colonist-lag/settlement-orbit.png)

## Tutorial copy pass

English tutorial strings got a plain-speech rewrite: shorter sentences, fewer em dashes, less “AI brochure” cadence. Placement and raid steps say the same rules; they just read like a person wrote them.

![Housing push still — more beds should not mean more frame spikes](/devtalks/cutting-colonist-lag/housing-push.png)

## What to feel in a build

- Grow past a few dozen settlers and leave the camera on the streets — idle crowds should not hitch the frame the way they did.
- Queue construction plus hut import/export and watch haulers pick without long freezes.
- Replay the guided tutorial — arrival and raid steps should sound human, not generated.
