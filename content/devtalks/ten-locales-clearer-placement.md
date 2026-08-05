---
title: "Ten Locales and Clearer Placement"
excerpt: "The build UI now speaks ten languages, failed ghosts say why, and day/night agent work is budgeted so the colony does not hitch when the sky changes."
date: "2026-08-04"
author: "Provincia Dev Team"
tags:
  - localization
  - placement
  - performance
  - ui
coverImage: "/devtalks/ten-locales-clearer-placement/cover.png"
---

This main ship is three player-facing pieces that land together: **locales**, **honest placement feedback**, and **quieter day/night transitions**.

![Colony overview — the UI chrome Loc now drives across panels](/devtalks/ten-locales-clearer-placement/colony-context.png)

## Loc: one string table, ten languages

Player-facing chrome used to be English-only scatters in scripts. We added a `Loc` autoload, a locale preference, and CJK font fallback so panels, tutorial copy, building names, combat labels, aqueduct chrome, and options share one inventory.

Generators keep the English CSV authoritative; the other locales are filled so a language switch is a preference change, not a missing-key scavenger hunt. A small Loc smoke test guards the hot paths.

## Placement that names the fail

Ghosts that only tint red waste a second guess. Placement failure now surfaces on the **mode strip** as the primary line — refuse a slope, block a footprint, leave a tool — and a chip lingers only when it still helps. Leaving ghost tools clears the fail HUD so the next placer starts clean.

![In-game placement footprint feedback on terraced ground](/devtalks/ten-locales-clearer-placement/placement-feedback.png)

Dynamic placer kinds also get readable build-mode strip names instead of internal identifiers.

## Day / night without the hitch

Dawn and dusk used to stack pathfinds: night marches home, morning wakes, haul scans, births. We budget those to **one pathfind per slice**, spread night births and deferred dawn reassign across frames, and keep stagger under `time_scale` so speeding up the clock does not amplify the spike.

![A busy colony — haul and day/night work stay budgeted so the HUD stays honest](/devtalks/ten-locales-clearer-placement/colony-busy.png)

Colony lag work also budgets haul dispatch so the HUD job buckets stay honest when a busy day rolls through.

## What to look for in a build

- Switch language in options and click through Jobs / placement / tutorial.
- Drop a building somewhere illegal — the strip should say *why*.
- Watch dusk/dawn on a populated colony for hitch reduction (water CA off harnesses still exist for isolating agent time).
