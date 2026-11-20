#!/usr/bin/env python3
"""Build the self-hosted web fonts from the SGI Brand Pack.

Converts the pack's Space Grotesk and Archivo variable TTFs into Latin-subset
WOFF2 files for the website, and prints fallback-font metric overrides that
keep layout shift low while the web fonts load.

Usage (needs `pip install fonttools brotli`):

    python3 scripts/brand/build-fonts.py "<path to brand pack fonts folder>"

The folder is the pack's fonts directory (03-Fonts in the 18 Nov pack,
04 Fonts in Brand Pack v1.0). It must contain Space-Grotesk/ and Archivo/
sub-folders with the variable TTFs, as supplied in the pack.

Both families are licensed under the SIL Open Font License 1.1 with no
Reserved Font Names, so subsetting and WOFF2 conversion are permitted.
"""
from __future__ import annotations

import glob
import io
import os
import shutil
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "public", "fonts")

# Google Fonts' "latin" range: Basic Latin, Latin-1, common punctuation,
# currency and arrows. Covers English and Afrikaans copy, plus R and $.
LATIN = (
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,"
    "U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,"
    "U+FEFF,U+FFFD"
)

FAMILIES = [
    {
        "src": "Space-Grotesk/variable/SpaceGrotesk*.ttf",
        "out": "space-grotesk-latin-var.woff2",
        "license": "Space-Grotesk/OFL.txt",
        "license_out": "SpaceGrotesk-OFL.txt",
        # Keep the full 300-700 weight axis: headlines use 500-600.
        "axes": None,
    },
    {
        "src": "Archivo/variable/Archivo[[]wdth,wght[]].ttf",
        "out": "archivo-latin-var.woff2",
        "license": "Archivo/OFL.txt",
        "license_out": "Archivo-OFL.txt",
        # Pin width to normal and keep weights 400-700 used for body/UI.
        "axes": {"wdth": 100, "wght": (400, 700)},
    },
]

# Characters used to compare average glyph widths with the fallback font.
SAMPLE = "We recruit, develop and manage South African talent that takes your business higher."


def build(fonts_dir: str) -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    for fam in FAMILIES:
        matches = sorted(glob.glob(os.path.join(fonts_dir, fam["src"])))
        if not matches:
            sys.exit(f"Missing font: {fam['src']} under {fonts_dir}")
        font = TTFont(matches[0])
        if fam["axes"]:
            font = instancer.instantiateVariableFont(font, fam["axes"])
            # Round-trip so every table is fully loaded before subsetting.
            buffer = io.BytesIO()
            font.save(buffer)
            buffer.seek(0)
            font = TTFont(buffer)
        options = subset.Options()
        options.flavor = "woff2"
        options.layout_features = ["*"]
        options.name_IDs = ["*"]
        options.name_legacy = True
        options.name_languages = ["*"]
        options.notdef_outline = True
        options.hinting = False
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=subset.parse_unicodes(LATIN))
        subsetter.subset(font)
        out_path = os.path.join(OUT_DIR, fam["out"])
        font.flavor = "woff2"
        font.save(out_path)
        shutil.copyfile(os.path.join(fonts_dir, fam["license"]), os.path.join(OUT_DIR, fam["license_out"]))
        print(f"{fam['out']}: {os.path.getsize(out_path) / 1024:.1f} KiB")


def avg_width(font: TTFont, text: str) -> float:
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    upm = font["head"].unitsPerEm
    widths = [hmtx[cmap[ord(c)]][0] / upm for c in text if ord(c) in cmap]
    return sum(widths) / len(widths)


def fallback_overrides(fonts_dir: str, fallback_path: str) -> None:
    """Print @font-face overrides for a metric-matched local fallback."""
    fallback = TTFont(fallback_path)
    fb_avg = avg_width(fallback, SAMPLE)
    for fam in FAMILIES:
        font = TTFont(sorted(glob.glob(os.path.join(fonts_dir, fam["src"])))[0])
        if fam["axes"]:
            font = instancer.instantiateVariableFont(font, {k: (v if isinstance(v, (int, float)) else 500) for k, v in fam["axes"].items()})
        upm = font["head"].unitsPerEm
        size_adjust = avg_width(font, SAMPLE) / fb_avg
        hhea = font["hhea"]
        print(
            f"{fam['out']}: size-adjust: {size_adjust * 100:.2f}%; "
            f"ascent-override: {hhea.ascent / upm / size_adjust * 100:.2f}%; "
            f"descent-override: {abs(hhea.descent) / upm / size_adjust * 100:.2f}%; "
            f"line-gap-override: {hhea.lineGap / upm / size_adjust * 100:.2f}%;"
        )


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    build(sys.argv[1])
    if len(sys.argv) > 2:
        fallback_overrides(sys.argv[1], sys.argv[2])
