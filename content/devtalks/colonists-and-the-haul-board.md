---
title: "Colonists and the Haul Board"
excerpt: "Thirst sends a colonist to a wet cell. Everything else — jobs, stockpiles, happiness — exists so that trip is not the only thing that happens."
date: "2026-05-08"
author: "Provincia Dev Team"
tags:
  - colonists
  - logistics
  - simulation
coverImage: "/devtalks/colonists-and-the-haul-board/colony-at-work.png"
---

A colonist wakes, walks to work, gets thirsty, paths to wet ground, walks back. If that loop stutters, the colony feels broken even when the buildings look fine.

`home_agent_interactor.gd` is the hub: spawning from town hall, assigning workers to forester huts and quarries, registering beds only in housing footprints, and queuing haul jobs when stockpiles shift.

## Needs tied to the water sim

`agent_needs.gd` does not magic water from a building radius. Colonists search for **wet cells** the CA sim actually maintains. `wet_drink_path_cache.gd` caches routes and invalidates on day boundaries so night/day transitions do not leave ghosts.

Tutorial steps can disable consumption while teaching placement — the flag is explicit, not a silent cheat.

## Haul board vs job priority

When a workshop needs planks, someone has to move logs. `haul_job_board.gd` posts those tasks; job priority reshuffles when emergencies stack (food low, construction site waiting, forester low on plant stock).

Town hall is the early-game spine: spawn point, builder assignment, central stockpile. Specialized huts pull from the same material ledger `colony_material_ledger.gd` exposes to the UI.

![Colony streets with colonists moving between jobs](/devtalks/colonists-and-the-haul-board/colony-at-work.png)

![Material chain graph in the UI](/devtalks/colonists-and-the-haul-board/material-chain.png)

`material_chain_graph_view.gd` draws production dependencies so you can see why the sawmill stalled without opening six panels.

## Day, night, happiness

`SimulationTime` drives day/night. Colonists work by day; at night they march toward registered beds. `agent_happiness.gd` scales walk speed between **0.5× and 1.5×** based on how well needs are met — not a separate mini-game, just a nudge you feel in haul latency.

![Colonist working near a site](/devtalks/colonists-and-the-haul-board/colonist-working.png)

Walk motion uses physics-stepped tweens tied to sim time so pausing or speeding up the clock does not desync feet from frames.

## After quicksave reload

Loading a save clears stuck job flags and snaps workers to anchors (`home_agent_interactor` reload hook). Without that pass, colonists would stand in place claiming they were mid-haul while the board had already forgotten the job.

## What we are not simulating yet

No individual meal cooking animations. No family units with separate inventories. Combat exists in a separate sandbox (`combat_resolver.gd`) and is not the colony loop’s focus.

The goal for this layer is narrower: **make logistics readable**. If you know why the forester is idle, the colony is playable. If you do not, no amount of Roman props will save it.
