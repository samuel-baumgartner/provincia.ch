---
title: "Cavalry, Cards, and Raid Lines"
excerpt: "Battles get Total War chrome: bronze unit cards with live busts, gold facing markers, cavalry that plow through, and raid AI that pins and flanks instead of blobbing."
date: "2026-10-06"
author: "Provincia Dev Team"
tags:
  - combat
  - cavalry
  - ui
coverImage: "/devtalks/cavalry-cards-and-raid-lines/cover.png"
---

Colony fights used to feel like a crowd of individuals with HP bars. This ship turns the apron into a unit battle: cards you can read at a glance, formation pads you can aim, horses that charge instead of jogging, and raiders that pick roles.

![Total War unit strip — bronze cards, live busts, faction eagle](/devtalks/cavalry-cards-and-raid-lines/cover.png)

## Unit cards as the selection SSOT

The battle HUD is a centered bronze beam with gilt rails. Each squad is a card: hotkey, portrait bust (rider framing for cavalry), name, strength, and a bar. Click a soldier and you select the unit. Detail for the active card sits above the strip so ten cards stay on screen without covering the fight.

![Close card chrome — Legionaries selected, Equites with rider bust](/devtalks/cavalry-cards-and-raid-lines/unit-cards-close.png)

## Flags, pads, and facing

Selected formations show gold-rim pads with faction fill, a facing chevron on the front edge, and tall vexilla so mid and far still read who is who. Grass shows through the pad instead of a solid blot. The markers are meant to feel like Total War selection chrome, not debug boxes.

![Formation pads and vexilla — gold rim, facing chevron](/devtalks/cavalry-cards-and-raid-lines/formation-markers.png)

## Cavalry that plow through

Equites and barbarian horsemen share infantry orders (select / move / attack). Attack from a run-up *is* the charge — build speed, impact with lance bonus, spears brace, punch past a rank, then peel off and cycle. Horses stay on the formation rail until impact so the bag does not dissolve into a cloud of riders on the approach.

## Raid AI with jobs

Attacker raids no longer nearest-neighbor into a blob. A deterministic commander assigns pin, flank, reinforce, screen, siege, and regroup. Focus fire soft-caps so secondaries get pressure; sticky roles cut thrash. Formation bags also stop stalling on ATTACK_SQUAD detours when a tangent looked like a flank at range.

![Apron overview — lines staged south of the settlement](/devtalks/cavalry-cards-and-raid-lines/apron-battle.png)

## Scale and colony chips

Formation rails, far-field skips, and cheaper melee keep a few hundred troops playable. In the colony, Timberborn-style overhead chips call out paused, no-workers, and disconnected buildings, and path-isolated huts auto-stop until they reconnect.

## What to feel in a build

- Open a colony raid or battle sandbox — pick units from the bronze strip, not per-man bars.
- Order Equites into a line from a run-up and watch the impact punch through instead of planting.
- Let a raid run: flanks and a siege detachment should show up instead of everyone dogpiling one squad.
- Place a workshop off the town-hall path graph — the chip should say it is disconnected until you link it.
