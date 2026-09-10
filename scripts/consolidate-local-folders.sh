#!/usr/bin/env bash
# Diagnose + consolidate local Provincia folder duplicates on this machine.
#
# Canonical keepers:
#   <parent>/provincia.ch          → github.com/samuel-baumgartner/provincia.ch
#   <parent>/my-colony-sim-game    → github.com/samuel-baumgartner/my-colony-sim-game
#
# Obsolete / typo names to retire:
#   provinciia, provinica, provinciia.ch, provinica.ch, my-colony-sim
#
# Usage (on Pop!_OS):
#   bash ~/path/to/provincia.ch/scripts/consolidate-local-folders.sh
#   bash .../consolidate-local-folders.sh --apply   # perform renames after confirmation
set -euo pipefail

APPLY=0
GAMES_ROOT="${GAMES_ROOT:-$HOME/games}"
for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=1 ;;
    --games-root=*) GAMES_ROOT="${arg#*=}" ;;
    -h|--help)
      sed -n '2,20p' "$0"
      exit 0
      ;;
  esac
done

KEEP_SITE="provincia.ch"
KEEP_GAME="my-colony-sim-game"
TYPO_NAMES=(provinicia provinciia provinica provinciia.ch provinica.ch provincia)

say() { printf '%s\n' "$*"; }
hr() { say "────────────────────────────────────────"; }

classify_dir() {
  local d="$1"
  if [[ -f "$d/project.godot" ]]; then
    echo "game"
  elif [[ -f "$d/package.json" ]] && grep -q '"name"\|next' "$d/package.json" 2>/dev/null; then
    echo "site"
  elif [[ -d "$d/provincia.ch" ]] || [[ -d "$d/my-colony-sim-game" ]]; then
    echo "parent"
  else
    echo "unknown"
  fi
}

git_remote() {
  local d="$1"
  if [[ -d "$d/.git" ]] || git -C "$d" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git -C "$d" remote get-url origin 2>/dev/null || echo "(no origin)"
  else
    echo "(not a git repo)"
  fi
}

godot_name() {
  local d="$1"
  if [[ -f "$d/project.godot" ]]; then
    grep -E '^config/name=' "$d/project.godot" | head -1 || true
  fi
}

hr
say "Games root: $GAMES_ROOT"
if [[ ! -d "$GAMES_ROOT" ]]; then
  say "ERROR: $GAMES_ROOT does not exist"
  exit 1
fi

say ""
say "Contents:"
ls -la "$GAMES_ROOT"
say ""

declare -A KIND REMOTE
for path in "$GAMES_ROOT"/*; do
  [[ -e "$path" ]] || continue
  base="$(basename "$path")"
  KIND["$base"]="$(classify_dir "$path")"
  REMOTE["$base"]="$(git_remote "$path")"
  say "• $base"
  say "    kind:   ${KIND[$base]}"
  say "    remote: ${REMOTE[$base]}"
  if [[ "${KIND[$base]}" == "game" ]]; then
    say "    godot:  $(godot_name "$path")"
  fi
done

hr
say "Target layout:"
say "  $GAMES_ROOT/$KEEP_SITE        (website)"
say "  $GAMES_ROOT/$KEEP_GAME   (Godot game = Provincia)"
say ""
say "Also retire GitHub repo samuel-baumgartner/my-colony-sim (archived)."
hr

# Prefer folders whose remotes already match keepers
site_src=""
game_src=""

for base in "${!REMOTE[@]}"; do
  remote="${REMOTE[$base]}"
  kind="${KIND[$base]}"
  if [[ "$kind" == "site" ]] && [[ "$remote" == *provincia.ch* ]]; then
    site_src="$base"
  fi
  if [[ "$kind" == "game" ]] && [[ "$remote" == *my-colony-sim-game* ]]; then
    game_src="$base"
  fi
done

# Fallbacks: first matching kind
if [[ -z "$site_src" ]]; then
  for base in "${!KIND[@]}"; do
    [[ "${KIND[$base]}" == "site" ]] && site_src="$base" && break
  done
fi
if [[ -z "$game_src" ]]; then
  for base in "${!KIND[@]}"; do
    if [[ "${KIND[$base]}" == "game" ]] && [[ "${REMOTE[$base]}" == *my-colony-sim-game* || "${REMOTE[$base]}" != *my-colony-sim.git* ]]; then
      # Prefer non-archived starter remote
      if [[ "${REMOTE[$base]}" == *my-colony-sim.git* && "${REMOTE[$base]}" != *my-colony-sim-game* ]]; then
        continue
      fi
      game_src="$base"
      break
    fi
  done
fi
if [[ -z "$game_src" ]]; then
  for base in "${!KIND[@]}"; do
    [[ "${KIND[$base]}" == "game" ]] && game_src="$base" && break
  done
fi

say "Detected keep sources:"
say "  site ← ${site_src:-NONE}"
say "  game ← ${game_src:-NONE}"
say ""

plan_rename() {
  local src="$1" dest="$2"
  if [[ -z "$src" ]]; then
    say "SKIP rename → $dest (no source found)"
    return
  fi
  if [[ "$src" == "$dest" ]]; then
    say "OK   $src (already canonical)"
    return
  fi
  if [[ -e "$GAMES_ROOT/$dest" ]]; then
    say "CONFLICT: want to rename $src → $dest but $dest already exists"
    say "         Compare remotes, keep the GitHub-canonical one, then remove the other."
    return
  fi
  say "PLAN rename: $src → $dest"
  if [[ "$APPLY" == "1" ]]; then
    mv "$GAMES_ROOT/$src" "$GAMES_ROOT/$dest"
    say "      done."
  fi
}

plan_rename "$site_src" "$KEEP_SITE"
plan_rename "$game_src" "$KEEP_GAME"

# Flag typo leftovers
say ""
say "Typo / obsolete folders to remove only AFTER Cursor chats are confirmed on the keep folders:"
for path in "$GAMES_ROOT"/*; do
  [[ -e "$path" ]] || continue
  base="$(basename "$path")"
  [[ "$base" == "$KEEP_SITE" || "$base" == "$KEEP_GAME" ]] && continue
  case "$base" in
    provinciia|provinicia|provinica|provinicia.ch|provinica.ch|provincia|my-colony-sim|my-colony-sim-game.old)
      say "  - $base  (${KIND[$base]:-unknown}, ${REMOTE[$base]:-})"
      ;;
    *)
      say "  - $base  (left alone; not a known typo name)"
      ;;
  esac
done

hr
if [[ "$APPLY" != "1" ]]; then
  say "Dry run only. Re-run with --apply to perform renames:"
  say "  $0 --apply"
  say ""
  say "Cursor chats stick to the folder path you open. After renaming:"
  say "  1. Open ONLY $KEEP_SITE and $KEEP_GAME in Cursor (File → Open Folder)."
  say "  2. Confirm chats appear (Agents Window search still finds old threads)."
  say "  3. Remove typo folders from disk and from Cursor Recents."
  say "  4. Do not reopen provinciia / my-colony-sim."
else
  say "Renames applied. Next: open the keep folders in Cursor, then delete typo leftovers."
fi
ls -la "$GAMES_ROOT"
