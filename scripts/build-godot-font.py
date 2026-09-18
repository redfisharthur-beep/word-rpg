#!/usr/bin/env python3
from pathlib import Path
from fontTools.merge import Merger

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

print(f"Merging {len(sources)} Traditional Chinese font subsets...")
font = Merger().merge([str(path) for path in sources])
font.flavor = None
font.save(str(OUTPUT))

if not OUTPUT.exists() or OUTPUT.stat().st_size < 100_000:
    raise SystemExit("Merged Traditional Chinese font was not created correctly")

print(f"Created {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size} bytes)")
