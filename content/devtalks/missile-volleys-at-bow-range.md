---
title: "Missile Volleys at Bow Range"
excerpt: "Hunters finally hold the standoff, shoot wood-and-iron arrows, and stop marching into melee after the first volley."
date: "2026-08-12"
author: "Provincia Dev Team"
tags:
  - combat
  - missiles
  - art
coverImage: "/devtalks/missile-volleys-at-bow-range/cover.png"
---

Since the locales / placement ship, the fight on the city apron stopped being melee-only cosplay. Missile troops are a real system now: range, occlusion, and a standoff that sticks.

![Barbarian hunters volley toward Roman lines on the settlement apron](/devtalks/missile-volleys-at-bow-range/cover.png)

## Hold the line — do not charge it

Early missile AI treated “in contact” the same way melee did. At bow standoff (~11–14 m) that flipped `melee_contact`, Individual Charge kicked in, and archers jogged into hand-to-hand after one volley.

Missile squads now skip melee-contact AI. They always march to a **ranged standoff** goal (`CombatMissile.attack_standoff_for`), never take angled assault shortcuts, and wait until living archers are on their formation slots before the volley goes out.

## Shots that can miss for a reason

`CombatMissile` is deterministic — no dice. A clear shot uses normal damage plus a rear-sector bonus; a shot with bodies in the corridor **misses**. Same-squad rear ranks do not block each other, so a deep formation can still rain arrows. Other units in the half-width corridor do.

Arrows are no longer debug candy. Shafts scale to soldier-arm length (~0.34 m), slender wood body, small iron tip, modest fletching via vertex colors so MultiMesh stays readable without cartoon stake silhouettes.

![Close over-the-shoulder volley — wood shafts mid-flight](/devtalks/missile-volleys-at-bow-range/volley-close.png)

## Hunters look like hunters

Attacker `Low.glb` is a single mesh with shields baked in. Missile barbarians were skipping gear equip entirely, so OTS volley cams read as a teardrop shield wall. They now pull a modular leather + bow loadout so the rear rank reads as hunters, not another infantry blob.

![Wide apron view — fight staged south of housing footprints](/devtalks/missile-volleys-at-bow-range/apron-overview.png)

## Also landed: winter banks

Season look locked winter to olive-B moist banks with snowy dry fields — softer moisture fade, powder mottling, and a dry albedo that stays white under overcast fill. Same terrace grid; different year-round read.

## What to look for in a build

- Spawn hunters opposite a Roman wall and watch them **stop** at bow range.
- Freeze a volley mid-flight — shafts should read wood/iron, not neon debug sticks.
- Rear ranks should still fire while front ranks hold the corridor.

