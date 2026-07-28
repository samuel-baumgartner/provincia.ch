#!/usr/bin/env python3
"""Build devtalk UV preview: ashlar tile + clean module render side-by-side."""

from __future__ import annotations

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow required", file=sys.stderr)
    sys.exit(1)


def build_uv_preview(tile_path: Path, compare_path: Path, out_path: Path) -> None:
    tile = Image.open(tile_path).convert("RGB").resize((256, 256), Image.Resampling.LANCZOS)
    compare = Image.open(compare_path).convert("RGB")
    w, h = compare.size
    module = compare.crop((0, 0, w // 2, h)).resize((256, 256), Image.Resampling.LANCZOS)

    out = Image.new("RGB", (520, 256), (48, 56, 64))
    out.paste(tile, (0, 0))
    out.paste(module, (264, 0))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out.save(out_path, optimize=True)


def main() -> None:
    if len(sys.argv) != 4:
        print(f"usage: {sys.argv[0]} <ashlar_tile.png> <material_compare.png> <out.png>", file=sys.stderr)
        sys.exit(1)
    build_uv_preview(Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]))
    print(f"wrote {sys.argv[3]}")


if __name__ == "__main__":
    main()
