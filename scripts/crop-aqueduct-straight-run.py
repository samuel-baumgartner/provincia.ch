#!/usr/bin/env python3
"""Crop in-game aqueduct terraces from colony overview for devtalk / game assets."""

from __future__ import annotations

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow required: pip install pillow", file=sys.stderr)
    sys.exit(1)


def crop_aqueduct_straight_run(src: Path, dest: Path) -> None:
    img = Image.open(src)
    w, h = img.size
    # Lower-right region: stone channel + terrace steps (tuned for 1536×1024 captures).
    crop = img.crop((int(w * 0.35), int(h * 0.15), int(w * 0.95), int(h * 0.85)))
    dest.parent.mkdir(parents=True, exist_ok=True)
    crop.save(dest, optimize=True)


def main() -> None:
    if len(sys.argv) != 3:
        print(f"usage: {sys.argv[0]} <colony-overview.png> <out-straight-run.png>", file=sys.stderr)
        sys.exit(1)
    crop_aqueduct_straight_run(Path(sys.argv[1]), Path(sys.argv[2]))
    print(f"wrote {sys.argv[2]}")


if __name__ == "__main__":
    main()
