---
title: "Ranks That Turn and March"
excerpt: "Formation drags face the way you pull. Attacks from behind re-slot in place instead of wheeling through bodies. Soldiers only slide — no teleports — and building relocate is gone."
date: "2026-10-22"
author: "Provincia Dev Team"
tags:
  - combat
  - formation
  - ui
coverImage: "/devtalks/ranks-that-turn-and-march/cover.png"
---

Colony battles already had unit cards and facing pads. What still broke the read was the march itself: reverse a drag and the line sometimes kept the old front, order an attack from behind and ranks wheeled through each other, and individuals still popped onto slots when the bag moved. This ship is about ranks that turn and walk like a bag of people — not a teleporting stamp.

![Infantry lines mid — blue and red bags holding facing on open ground](/devtalks/ranks-that-turn-and-march/cover.png)

## Drag facing is the drag

A ground drag is a directed width line. Pull left-to-right or right-to-left and facing flips with the drag — no approach-hint guess that kept the old front when you meant to reverse. Spacing stays per-squad so a narrow bag does not stretch into a parade ground on preview.

## Attack turns re-slot, they do not wheel

When a line attacks a target more than about 45° off its current facing, the squad treats it like a fresh layout: keep the live center, assign nearest slots to the new facing, and reform. That stops the old “wheel every ID through the body” path that looked like soldiers walking through friends on a rear or flank order. Cavalry skips this path — charges still punch through and bind where they land.

![Attack-turn reform — same center, new facing, nearest-slot assign](/devtalks/ranks-that-turn-and-march/attack-turn.png)

## March without teleports

Hard rule on the locomotion tick: soldiers may only slide up to `max_speed * delta` on XZ. Direct marches translate the rank layout and let individuals catch slots; curve marches keep dressing until the anchor is on the move goal, then switch to destination slots so deep ranks are not parked mid-detour. Align-then-close yaws before the bag advances; rear and flank contact freezes yaw so LookAtEnemy does not shear the front open into a stare gap. Loose contact keeps a hard body gap so meshes do not sit inside the opponent.

![Cavalry mid — riders stay on the formation rail through the approach](/devtalks/ranks-that-turn-and-march/cavalry.png)

## Colony side of the same ship

Building relocate is gone — no more ghost-move that kept workers and stockpiles on the same id. Place again if you need a hut elsewhere. Path slabs and curbs batch per spatial chunk (ramps stay individual), so long roads hitch less when you paint or load. Early goals now ask for planks before stone. Overhead status chips still call out paused, no-workers, and disconnected sites, with connection checks sharing one path snapshot per refresh.

![Status chips — paused, no workers, not connected to the district](/devtalks/ranks-that-turn-and-march/status-chips.png)

## What to feel in a build

- Select a squad, RMB-drag a line one way, then reverse the drag — facing should flip with the pull.
- Order a line to attack a bag behind it — ranks should re-slot in place, not walk through each other.
- Watch a march or charge: nobody should pop onto a far slot in one frame.
- Look for Move on a placed building — it should be gone; rebuild if you need a new footprint.
- Paint a long path stretch — fewer mesh rebuild stutters than before.
