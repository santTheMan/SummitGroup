#!/usr/bin/env python3
"""Build favicons from the supplied SGI icon artwork.

Usage (needs `pip install pillow`):

    python3 scripts/brand/build-icons.py <icon-colour.png> <icon-reversed.png>

The icon is only resized and centred on a square canvas: it is never redrawn,
recoloured or stretched. The touch icon sits on SGI Navy because iOS fills
transparent touch icons with black.
"""
import os
import sys

from PIL import Image

PUBLIC = os.path.join(os.path.dirname(__file__), "..", "..", "public")
NAVY = (7, 27, 52, 255)


def fit(icon: Image.Image, size: int, padding: float, background) -> Image.Image:
    icon = icon.crop(icon.getbbox())
    box = int(size * (1 - 2 * padding))
    scale = min(box / icon.width, box / icon.height)
    resized = icon.resize((max(1, round(icon.width * scale)), max(1, round(icon.height * scale))), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), background)
    canvas.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return canvas


def main(colour_path: str, reversed_path: str) -> None:
    colour = Image.open(colour_path).convert("RGBA")
    reversed_icon = Image.open(reversed_path).convert("RGBA")
    fit(colour, 48, 0.02, (0, 0, 0, 0)).save(os.path.join(PUBLIC, "favicon.png"), optimize=True)
    fit(reversed_icon, 180, 0.16, NAVY).convert("RGB").save(os.path.join(PUBLIC, "apple-touch-icon.png"), optimize=True)
    print("Wrote public/favicon.png and public/apple-touch-icon.png")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
