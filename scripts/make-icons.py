"""Draw the source art @capacitor/assets turns into every icon and splash size.

The Startline mark (public/images/logo.svg in the web app) is eight
parallelograms, so it is drawn here straight from its path coordinates rather
than through an SVG renderer. Run from the repo root, then `pnpm assets`:

    python scripts/make-icons.py

Writes assets/icon-only.png, icon-foreground.png, icon-background.png,
splash.png and splash-dark.png. Dark only, per the design system.
"""
from pathlib import Path
from PIL import Image, ImageDraw

BACKGROUND = (0x14, 0x14, 0x14, 255)
GREEN = (0xB3, 0xE1, 0x53, 255)

# logo.svg, viewBox 0 0 500 149: each shape as its four corners.
MARK_W, MARK_H = 500.0, 148.289
SHAPES = [
    [(49.4297, 98.8593), (119.772, 98.8593), (70.3422, 148.289), (0, 148.289)],
    [(169.202, 49.4297), (239.544, 49.4297), (190.114, 98.8593), (119.772, 98.8593)],
    [(190.114, 98.8593), (260.456, 98.8593), (211.027, 148.289), (140.684, 148.289)],
    [(288.973, 0), (359.316, 0), (309.886, 49.4296), (239.544, 49.4296)],
    [(309.886, 49.4297), (380.228, 49.4297), (330.799, 98.8593), (260.456, 98.8593)],
    [(330.798, 98.8593), (401.141, 98.8593), (351.711, 148.289), (281.369, 148.289)],
    [(429.658, 0), (500, 0), (450.57, 49.4296), (380.228, 49.4296)],
    [(148.289, 0), (218.631, 0), (169.202, 49.4296), (98.8593, 49.4296)],
]

SUPERSAMPLE = 4
OUT = Path("assets")


def draw(size: int, mark_width_ratio: float, background) -> Image.Image:
    """The mark centred on a square canvas, mark_width_ratio of its width."""
    big = size * SUPERSAMPLE
    image = Image.new("RGBA", (big, big), background)
    pen = ImageDraw.Draw(image)
    scale = big * mark_width_ratio / MARK_W
    left = (big - MARK_W * scale) / 2
    top = (big - MARK_H * scale) / 2
    for shape in SHAPES:
        pen.polygon([(left + x * scale, top + y * scale) for x, y in shape], fill=GREEN)
    return image.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(exist_ok=True)
    # Full-bleed icon for iOS and legacy Android. The stores mask the corners.
    draw(1024, 0.62, BACKGROUND).save(OUT / "icon-only.png")
    # Android adaptive icon: launchers crop to the centre 66%, so the mark
    # stays inside that safe zone on a transparent foreground.
    draw(1024, 0.46, (0, 0, 0, 0)).save(OUT / "icon-foreground.png")
    Image.new("RGBA", (1024, 1024), BACKGROUND).save(OUT / "icon-background.png")
    # Splash: a small mark centred; the rest is background on every aspect ratio.
    splash = draw(2732, 0.22, BACKGROUND)
    splash.save(OUT / "splash.png")
    splash.save(OUT / "splash-dark.png")
    print("wrote", ", ".join(sorted(p.name for p in OUT.glob("*.png"))))


if __name__ == "__main__":
    main()
