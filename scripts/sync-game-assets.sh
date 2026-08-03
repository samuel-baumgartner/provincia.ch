#!/usr/bin/env bash
# Sync game screenshots and art into provincia.ch/public for devtalks and /game.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GAME="$(cd "$ROOT/../my-colony-sim" && pwd)"
SITE_PUBLIC="$ROOT/public"

if [[ ! -d "$GAME" ]]; then
  echo "Game repo not found at $GAME" >&2
  exit 1
fi

echo "==> Running game capture scripts (needs display)..."
cd "$GAME"

if [[ "${SKIP_CAPTURE:-0}" == "1" ]]; then
  echo "    SKIP_CAPTURE=1 — using existing game assets only"
else
_run_capture() {
  local script="$1"
  if [[ -x "$script" ]]; then
    echo "    $script"
    "$script" || echo "    (capture failed — will use existing files if present)"
  fi
}

_run_capture "./tools/aqueduct_iterate.sh"
_run_capture "./tools/capture_water_channel.sh"
_run_capture "./tools/capture_colony_overview.sh"
fi

echo "==> Copying assets to website..."

copy_file() {
  local src="$1"
  local dest="$2"
  if [[ -f "$src" ]]; then
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
    echo "    $(basename "$dest")"
  else
    echo "    skip missing: $src" >&2
  fi
}

# Game page gallery
GAME_DIR="$SITE_PUBLIC/game"
mkdir -p "$GAME_DIR"

# Prefer HUD-off itch marketing pack when present (tools/capture/capture_itch_pack.sh)
# Prefer .jpg when the pack ships compressed captures; fall back to .png.
copy_itch() {
  local src_base="$1"
  local dest="$2"
  local dest_ext="${dest##*.}"
  if [[ -f "${src_base}.${dest_ext}" ]]; then
    copy_file "${src_base}.${dest_ext}" "$dest"
  elif [[ -f "${src_base}.jpg" ]]; then
    copy_file "${src_base}.jpg" "${dest%.*}.jpg"
  elif [[ -f "${src_base}.png" ]]; then
    copy_file "${src_base}.png" "${dest%.*}.png"
  else
    echo "    skip missing: ${src_base}.{jpg,png}" >&2
  fi
}

ITCH="$GAME/dist/itch/screenshots"
if [[ -d "$ITCH" ]]; then
  echo "    itch screenshot pack → public/game"
  copy_itch "$ITCH/00_title_hero" "$GAME_DIR/title-hero.png"
  copy_itch "$ITCH/01_settlement_overview" "$GAME_DIR/colony-overview.png"
  copy_itch "$ITCH/02_town_hall_close" "$GAME_DIR/town-hall.jpg"
  copy_itch "$ITCH/03_housing_district" "$GAME_DIR/housing-district.png"
  copy_itch "$ITCH/04_water_aqueduct" "$GAME_DIR/aqueduct.jpg"
  copy_itch "$ITCH/05_production" "$GAME_DIR/production.jpg"
  copy_itch "$ITCH/06_title" "$GAME_DIR/title-secondary.png"
  copy_itch "$ITCH/07_battle_overview" "$GAME_DIR/battle-overview.png"
  copy_itch "$ITCH/08_battle_clash" "$GAME_DIR/battle-clash.png"
fi

# Fallbacks when itch pack is missing
if [[ ! -f "$GAME_DIR/colony-overview.png" ]]; then
  copy_file "$GAME/assets/debug/colony_overview.png" "$GAME_DIR/colony-overview.png"
fi
if [[ ! -f "$GAME_DIR/colony-overview.png" ]]; then
  copy_file "$GAME/assets/images/sawmill-connected-03.png" "$GAME_DIR/colony-overview.png"
fi
if [[ ! -f "$GAME_DIR/colony-overview.png" ]]; then
  copy_file "$GAME/assets/map_overview_popup_main_center_concept.png" "$GAME_DIR/colony-overview.png"
fi
if [[ ! -f "$GAME_DIR/title-hero.png" ]]; then
  copy_file "$GAME/assets/ui/title/title_hero.png" "$GAME_DIR/title-hero.png"
fi

_aqueduct_src="$GAME/assets/debug/aqueduct_top_corner.png"
copy_file "$_aqueduct_src" "$GAME_DIR/aqueduct-corner.png"
copy_file "$GAME/assets/debug/material_chain_panel.png" "$GAME_DIR/material-chain.png"
copy_file "$GAME/assets/map_overview_popup_main_center_concept.png" "$GAME_DIR/map-concept.png"
copy_file "$GAME/assets/images/stonehouse.png" "$GAME_DIR/stonehouse.png"
# Stone cutter / water sawmill (website asset; override from game repo when available)
if [[ -f "$GAME/assets/images/sawmill-connected-03.png" ]]; then
  copy_file "$GAME/assets/images/sawmill-connected-03.png" "$GAME_DIR/stone-cutter.png"
fi
copy_file "$GAME/assets/images/Colonists/roman_colonist_working.png" "$GAME_DIR/colonist-working.png"
copy_file "$GAME/assets/images/tutorial/curator_portrait.png" "$GAME_DIR/curator-portrait.png"
copy_file "$GAME/assets/images/Huts/roman-living-line1-stage01.png" "$GAME_DIR/housing-stage-01.png"
copy_file "$GAME/assets/images/Huts/roman-living-line1-stage04.png" "$GAME_DIR/housing-stage-04.png"
copy_file "$GAME/assets/3d/renders/roman_peasant_v2.png" "$GAME_DIR/roman-peasant-concept.png"

# Only crop aqueduct from debug if itch pack did not supply it
if [[ ! -f "$GAME_DIR/aqueduct.jpg" ]] && [[ ! -f "$GAME_DIR/aqueduct.png" ]]; then
  _colony_for_aqueduct="$GAME/assets/debug/colony_overview.png"
  if [[ -f "$_colony_for_aqueduct" ]] && command -v python3 >/dev/null; then
    echo "    aqueduct fallback (crop from colony overview)"
    python3 "$ROOT/scripts/crop-aqueduct-straight-run.py" \
      "$_colony_for_aqueduct" \
      "$GAME_DIR/aqueduct.jpg"
  else
    copy_file "$_aqueduct_src" "$GAME_DIR/aqueduct.jpg"
  fi
fi

# Devtalk images — prefer itch HUD-off screenshots for covers/context;
# keep isolated asset sheets for posts that discuss that specific art.
DT="$SITE_PUBLIC/devtalks"

# Prefer itch / public/game shots (may be .jpg); convert to expected .png dest when needed.
copy_scene() {
  local dest="$1"
  shift
  local src
  for src in "$@"; do
    if [[ -f "$src" ]]; then
      mkdir -p "$(dirname "$dest")"
      case "$src" in
        *.jpg|*.jpeg)
          if command -v convert >/dev/null; then
            convert "$src" "$dest"
          else
            # Fallback: keep extension if imagemagick missing
            cp "$src" "${dest%.*}.jpg"
            echo "    $(basename "${dest%.*}.jpg") (jpg; install imagemagick for png)" >&2
            return 0
          fi
          ;;
        *)
          cp "$src" "$dest"
          ;;
      esac
      echo "    $(basename "$dest")"
      return 0
    fi
  done
  echo "    skip missing scene for: $(basename "$dest")" >&2
}

echo "    DevTalk covers/context (itch pack preferred)"
copy_scene "$DT/first-steps-with-provincia/colony-overview.png" \
  "$ITCH/01_settlement_overview.png" \
  "$GAME_DIR/colony-overview.png" \
  "$GAME/assets/debug/colony_overview.png"

copy_file "$GAME/assets/images/Huts/roman-living-line1-stage01.png" "$DT/first-steps-with-provincia/housing-stage-01.png"
copy_file "$GAME/assets/images/Huts/roman-living-line1-stage03.png" "$DT/first-steps-with-provincia/housing-stage-03.png"
copy_file "$GAME/assets/images/Huts/roman-living-line1-stage04.png" "$DT/first-steps-with-provincia/housing-stage-04.png"

copy_scene "$DT/water-system-rebuild/channel.png" \
  "$ITCH/02_town_hall_close.jpg" \
  "$GAME_DIR/town-hall.jpg"
copy_scene "$DT/water-system-rebuild/pond-context.png" \
  "$ITCH/01_settlement_overview.png" \
  "$GAME_DIR/colony-overview.png" \
  "$GAME/assets/debug/colony_overview.png"

copy_file "$GAME/assets/images/Huts/roman-living-line1-stage02.png" "$DT/housing-on-slopes/housing-stage-02.png"
copy_file "$GAME/assets/images/stonehouse.png" "$DT/housing-on-slopes/stonehouse.png"
copy_scene "$DT/housing-on-slopes/district-context.png" \
  "$ITCH/03_housing_district.png" \
  "$GAME_DIR/housing-district.png" \
  "$GAME/assets/debug/colony_overview.png"

copy_scene "$DT/aqueducts-on-a-terrace-grid/straight-run.png" \
  "$ITCH/04_water_aqueduct.jpg" \
  "$GAME_DIR/aqueduct.jpg" \
  "$_aqueduct_src"
copy_file "$GAME/assets/debug/aqueduct_top_corner.png" "$DT/aqueducts-on-a-terrace-grid/corner.png"
if [[ -f "$GAME/assets/textures/aqueduct/ashlar_tile_albedo.png" ]] && \
   [[ -f "$GAME/assets/debug/aqueduct_top_material_compare.png" ]] && \
   command -v python3 >/dev/null; then
  echo "    aqueduct uv-preview (tile + module composite)"
  python3 "$ROOT/scripts/build-aqueduct-uv-preview.py" \
    "$GAME/assets/textures/aqueduct/ashlar_tile_albedo.png" \
    "$GAME/assets/debug/aqueduct_top_material_compare.png" \
    "$DT/aqueducts-on-a-terrace-grid/uv-preview.png"
else
  copy_file "$GAME/assets/debug/aqueduct_uv_preview.png" "$DT/aqueducts-on-a-terrace-grid/uv-preview.png"
fi

copy_scene "$DT/colonists-and-the-haul-board/colony-at-work.png" \
  "$ITCH/05_production.jpg" \
  "$GAME_DIR/production.jpg" \
  "$GAME_DIR/colony-overview.png"
copy_file "$GAME/assets/debug/material_chain_panel.png" "$DT/colonists-and-the-haul-board/material-chain.png"
copy_file "$GAME/assets/images/Colonists/roman_colonist_working.png" "$DT/colonists-and-the-haul-board/colonist-working.png"

echo "==> Done. Assets in $SITE_PUBLIC"
