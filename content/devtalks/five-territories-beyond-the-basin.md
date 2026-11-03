---
title: "Five Territories Beyond the Basin"
excerpt: "Tutorial 2 · Conquest starts in a locked home valley. Five territories open by ordered battles, cloud cover hides the unexplored, and a live river runs through the campaign map."
date: "2026-11-03"
author: "Provincia Dev Team"
tags:
  - frontier
  - conquest
  - campaign
coverImage: "/devtalks/five-territories-beyond-the-basin/cover.png"
---

The colony map used to be one open grid. Conquest now has its own campaign: a constrained home basin, five adjacent territories, and fog that only lifts when you march. This ship is about expanding the map by winning ground — not by unlocking a fog of war slider.

![Home basin beside the still-hostile quarry valley](/devtalks/five-territories-beyond-the-basin/cover.png)

## Tutorial 2 · Conquest

From the title screen, pick **Tutorial 2 · Conquest** for a fresh campaign slot. Day one still gives a town hall, two connected homes, four settlers, and the usual starting stock — but only the southwestern basin is buildable. The same guided steps as the original tutorial apply; raid briefings are replaced with conquest ones. Attacks stay locked until those steps finish.

## Five prizes, fixed order

The minimap numbers five territories. Click one to open its card — reward, defenders, and why you cannot attack yet. The golden border marks the next target. Order is fixed:

| Territory | Defenders | Opens |
|---|---:|---|
| Western woodland | 16 | Timber and forestry space |
| Southern meadow | 16 | Drier planting and housing |
| River plain | 24 | Waterfront farmland |
| Quarry valley | 32 | Rich stone at full yield |
| Northern pass | 40 | Northern uplands |

**Conquer** starts a paused formation battle with your garrison; Space resumes. Lose the fight and the earliest missing territory becomes the recovery objective — later wins stay yours. The home basin never flips.

![Enemy-held quarry valley with rich-stone cue and mobilize card](/devtalks/five-territories-beyond-the-basin/locked.png)

## Clouds, not empty void

Unexplored land stays under soft cloud banks and side mist. Terrain, rivers, and waterfalls continue underneath; trees and rocks cull until the region is revealed. Clouds retreat only over the territory you attacked and stay gone after a defeat. Camera peeks into fog no longer spoil the whole map.

## Quarry yield and pushback

Local stone starts at full yield and slows after extraction; the rich deposit does not deplete. The stone overlay appears only while placing a quarry. Each captured region arms a 600-working-second counterattack with a larger enemy force. Timers freeze during battles and economy-frozen hours. Lose a defense and only that territory falls — buildings remain, production does not.

![Victory card — quarry secured, counterattack clock armed](/devtalks/five-territories-beyond-the-basin/conquered.png)

## A river that actually flows

New Conquest starts wire two protected headwater springs into one connected river with a southern outlet. Territory cards expose **River inflow** and **Simulate water** toggles that survive save/load. Banks use scanned boulder outcrops instead of placeholder rocks, grounded on dry shelves rather than channel walls.

## What to feel in a build

- Start Tutorial 2 and finish the guided steps — the next territory card should unlock Conquer, not a free camera unlock.
- Attack woodland first — clouds should peel only there; meadow and quarry stay banked.
- Win the quarry — place a quarry while the gold overlay is up, then watch the counterattack clock tick in working time.
- Toggle river inflow on a fresh Conquest save — the channel should drain or refill without touching the home colony slot.
