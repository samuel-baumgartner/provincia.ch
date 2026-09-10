#!/usr/bin/env bash
# Fully consolidate local Provincia folder duplicates on this machine.
#
# Canonical keepers:
#   <parent>/provincia.ch          → github.com/samuel-baumgartner/provincia.ch
#   <parent>/my-colony-sim-game    → github.com/samuel-baumgartner/my-colony-sim-game
#
# Usage (on Pop!_OS):
#   bash consolidate-local-folders.sh                 # dry run
#   bash consolidate-local-folders.sh --apply         # rename to keepers
#   bash consolidate-local-folders.sh --apply --purge # rename + remove typo leftovers
set -euo pipefail

APPLY=0
PURGE=0
GAMES_ROOT="${GAMES_ROOT:-$HOME/games}"
SITE_REMOTE_HTTPS="https://github.com/samuel-baumgartner/provincia.ch.git"
GAME_REMOTE_HTTPS="https://github.com/samuel-baumgartner/my-colony-sim-game.git"

for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=1 ;;
    --purge) PURGE=1 ;;
    --games-root=*) GAMES_ROOT="${arg#*=}" ;;
    -h|--help)
      sed -n '2,16p' "$0"
      exit 0
      ;;
  esac
done

KEEP_SITE="provincia.ch"
KEEP_GAME="my-colony-sim-game"

say() { printf '%s\n' "$*"; }
hr() { say "────────────────────────────────────────"; }

classify_dir() {
  local d="$1"
  if [[ -f "$d/project.godot" ]]; then
    echo "game"
  elif [[ -f "$d/package.json" ]]; then
    echo "site"
  elif [[ -d "$d/provincia.ch" ]] || [[ -d "$d/my-colony-sim-game" ]]; then
    echo "parent"
  else
    echo "unknown"
  fi
}

git_remote() {
  local d="$1"
  if git -C "$d" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git -C "$d" remote get-url origin 2>/dev/null || echo "(no origin)"
  else
    echo "(not a git repo)"
  fi
}

remote_is_site() {
  [[ "$1" == *provincia.ch* ]]
}

remote_is_game() {
  [[ "$1" == *my-colony-sim-game* ]]
}

remote_is_obsolete_starter() {
  local r="$1"
  [[ "$r" == *my-colony-sim* ]] && ! remote_is_game "$r"
}

ensure_remote() {
  local d="$1" want="$2"
  if ! git -C "$d" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    say "WARN  $d is not a git repo; skip remote fix"
    return
  fi
  local cur
  cur="$(git -C "$d" remote get-url origin 2>/dev/null || true)"
  if [[ "$cur" == "$want" ]]; then
    say "OK   origin already $want"
    return
  fi
  say "PLAN set origin → $want  (was: ${cur:-none})"
  if [[ "$APPLY" == "1" ]]; then
    if git -C "$d" remote get-url origin >/dev/null 2>&1; then
      git -C "$d" remote set-url origin "$want"
    else
      git -C "$d" remote add origin "$want"
    fi
    say "      done."
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
done

hr
say "Target layout:"
say "  $GAMES_ROOT/$KEEP_SITE"
say "  $GAMES_ROOT/$KEEP_GAME"

site_src=""
game_src=""

# Prefer remotes that already match GitHub keepers
for base in "${!REMOTE[@]}"; do
  if [[ "${KIND[$base]}" == "site" ]] && remote_is_site "${REMOTE[$base]}"; then
    site_src="$base"
  fi
  if [[ "${KIND[$base]}" == "game" ]] && remote_is_game "${REMOTE[$base]}"; then
    game_src="$base"
  fi
done

if [[ -z "$site_src" ]]; then
  for base in "${!KIND[@]}"; do
    [[ "${KIND[$base]}" == "site" ]] && site_src="$base" && break
  done
fi

if [[ -z "$game_src" ]]; then
  for base in "${!KIND[@]}"; do
    [[ "${KIND[$base]}" != "game" ]] && continue
    remote_is_obsolete_starter "${REMOTE[$base]}" && continue
    game_src="$base"
    break
  done
fi
if [[ -z "$game_src" ]]; then
  for base in "${!KIND[@]}"; do
    [[ "${KIND[$base]}" == "game" ]] && game_src="$base" && break
  done
fi

say ""
say "Detected keep sources:"
say "  site ← ${site_src:-NONE}"
say "  game ← ${game_src:-NONE}"
say ""

do_rename() {
  local src="$1" dest="$2"
  if [[ -z "$src" ]]; then
    say "SKIP rename → $dest (no source found)"
    return 1
  fi
  if [[ "$src" == "$dest" ]]; then
    say "OK   $src (already canonical)"
    return 0
  fi
  if [[ -e "$GAMES_ROOT/$dest" ]]; then
    # If dest exists and src is typo duplicate of same remote, prefer dest and mark src for purge
    local src_r dest_r
    src_r="${REMOTE[$src]:-}"
    dest_r="$(git_remote "$GAMES_ROOT/$dest")"
    if [[ "$src_r" == "$dest_r" && "$src_r" != "(not a git repo)" ]]; then
      say "DUPLICATE: $src matches existing $dest remote; will purge $src"
      return 2
    fi
    say "CONFLICT: $src → $dest but $dest exists with different remote"
    say "         dest=$dest_r"
    say "         src =$src_r"
    return 1
  fi
  say "PLAN rename: $src → $dest"
  if [[ "$APPLY" == "1" ]]; then
    mv "$GAMES_ROOT/$src" "$GAMES_ROOT/$dest"
    KIND["$dest"]="${KIND[$src]}"
    REMOTE["$dest"]="${REMOTE[$src]}"
    unset "KIND[$src]" "REMOTE[$src]"
    say "      done."
  fi
  return 0
}

do_rename "$site_src" "$KEEP_SITE" || true
do_rename "$game_src" "$KEEP_GAME" || true

# Refresh inventory after renames in apply mode
if [[ "$APPLY" == "1" ]]; then
  unset KIND REMOTE
  declare -A KIND REMOTE
  for path in "$GAMES_ROOT"/*; do
    [[ -e "$path" ]] || continue
    base="$(basename "$path")"
    KIND["$base"]="$(classify_dir "$path")"
    REMOTE["$base"]="$(git_remote "$path")"
  done
fi

# Fix remotes on keepers
if [[ -d "$GAMES_ROOT/$KEEP_SITE" ]]; then
  ensure_remote "$GAMES_ROOT/$KEEP_SITE" "$SITE_REMOTE_HTTPS"
fi
if [[ -d "$GAMES_ROOT/$KEEP_GAME" ]]; then
  ensure_remote "$GAMES_ROOT/$KEEP_GAME" "$GAME_REMOTE_HTTPS"
fi

# Clone missing keepers when apply
if [[ "$APPLY" == "1" ]]; then
  if [[ ! -d "$GAMES_ROOT/$KEEP_SITE" ]]; then
    say "PLAN clone $SITE_REMOTE_HTTPS → $KEEP_SITE"
    git clone "$SITE_REMOTE_HTTPS" "$GAMES_ROOT/$KEEP_SITE"
  fi
  if [[ ! -d "$GAMES_ROOT/$KEEP_GAME" ]]; then
    say "PLAN clone $GAME_REMOTE_HTTPS → $KEEP_GAME"
    git clone "$GAME_REMOTE_HTTPS" "$GAMES_ROOT/$KEEP_GAME"
  fi
fi

is_typo_name() {
  case "$1" in
    provinciia|provinicia|provinica|provinicia.ch|provinica.ch|provincia|my-colony-sim|my-colony-sim-game.old)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

say ""
say "Typo / obsolete leftovers:"
for path in "$GAMES_ROOT"/*; do
  [[ -e "$path" ]] || continue
  base="$(basename "$path")"
  [[ "$base" == "$KEEP_SITE" || "$base" == "$KEEP_GAME" ]] && continue
  if ! is_typo_name "$base"; then
    say "  - $base (left alone)"
    continue
  fi
  say "  - $base  (${KIND[$base]:-unknown}, ${REMOTE[$base]:-})"
  if [[ "$APPLY" == "1" && "$PURGE" == "1" ]]; then
    # Safety: only purge if keepers exist and this is not the only copy of unique work
    if [[ ! -d "$GAMES_ROOT/$KEEP_SITE" || ! -d "$GAMES_ROOT/$KEEP_GAME" ]]; then
      say "      REFUSE purge — keepers missing"
      continue
    fi
    # Refuse purge if it has a different remote than both keepers and looks like unique content
    local_r="${REMOTE[$base]:-}"
    keep_site_r="$(git_remote "$GAMES_ROOT/$KEEP_SITE")"
    keep_game_r="$(git_remote "$GAMES_ROOT/$KEEP_GAME")"
    if [[ "$local_r" != "$keep_site_r" && "$local_r" != "$keep_game_r" && ! remote_is_obsolete_starter "$local_r" && "$local_r" != "(not a git repo)" && "$local_r" != "(no origin)" ]]; then
      say "      REFUSE purge — remote differs from keepers: $local_r"
      continue
    fi
    say "      PURGE $base"
    rm -rf "$path"
  fi
done

hr
if [[ "$APPLY" != "1" ]]; then
  say "Dry run only. Apply with:"
  say "  $0 --apply --purge"
elif [[ "$PURGE" != "1" ]]; then
  say "Renames done. Purge typo leftovers with:"
  say "  $0 --apply --purge"
else
  say "Done. Canonical folders:"
fi
ls -la "$GAMES_ROOT"
say ""
say "In Cursor: open ONLY $KEEP_SITE and $KEEP_GAME; remove typo projects from Recents."
