#!/usr/bin/env python3
from pathlib import Path
from tempfile import TemporaryDirectory

from fontTools.merge import Merger
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / "godot" / "fonts" / "noto-tc"
OUTPUT = FONT_DIR / "WordRpgNotoSansTC.ttf"

preferred = FONT_DIR / "TC-209.woff2"
sources = sorted(FONT_DIR.glob("TC-*.woff2"))
if preferred in sources:
    sources.remove(preferred)
    sources.insert(0, preferred)

if not sources:
    raise SystemExit("No Noto Sans TC WOFF2 subsets found")

print(f"Preparing {len(sources)} Traditional Chinese font subsets...")

with TemporaryDirectory() as temp_dir:
    temp_dir = Path(temp_dir)
    static_paths = []

    for index, source in enumerate(sources):
        font = TTFont(str(source))

        if "fvar" in font:
            axes = {axis.axisTag: axis.defaultValue for axis in font["fvar"].axes}
            if "wght" in axes:
                axes["wght"] = 400
            font = instantiateVariableFont(font, axes, inplace=False, optimize=True)

        font.flavor = None

        for table in ("DSIG",):
            if table in font:
                del font[table]

        out = temp_dir / f"subset-{index:03d}.ttf"
        font.save(str(out))
        static_paths.append(str(out))

    print("Merging static Traditional Chinese subsets...")
    merged = Merger().merge(static_paths)
    merged.flavor = None

    if "DSIG" in merged:
        del merged["DSIG"]

    merged.save(str(OUTPUT))

if not OUTPUT.exists() or OUTPUT.stat().st_size < 100_000:
    raise SystemExit("Merged Traditional Chinese font was not created correctly")

print(f"Created {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size} bytes)")
