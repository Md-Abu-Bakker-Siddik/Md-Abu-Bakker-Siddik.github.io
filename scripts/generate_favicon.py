from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "images"

BG = (34, 211, 238, 31)  # accent-dim ~12%
BORDER = (255, 255, 255, 15)  # ~6% white
TEXT = (34, 211, 238, 255)
RADIUS_RATIO = 10 / 32


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = max(4, int(size * RADIUS_RATIO))

    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=BG)
    draw.rounded_rectangle(
        [0, 0, size - 1, size - 1],
        radius=radius,
        outline=BORDER,
        width=max(1, size // 32),
    )

    text = "ABS"
    font_size = max(7, int(size * 0.27))
    font_paths = (
        "C:/Windows/Fonts/consola.ttf",
        "C:/Windows/Fonts/consolab.ttf",
        "consola.ttf",
    )
    font = None
    for path in font_paths:
        try:
            font = ImageFont.truetype(path, font_size)
            break
        except OSError:
            continue
    if font is None:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(
        ((size - tw) / 2, (size - th) / 2 - size * 0.02),
        text,
        fill=TEXT,
        font=font,
    )
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    img16 = draw_icon(16)
    img32 = draw_icon(32)
    img180 = draw_icon(180)

    img32.save(OUT / "favicon-32.png", format="PNG")
    img16.save(OUT / "favicon-16.png", format="PNG")
    img180.save(OUT / "apple-touch-icon.png", format="PNG")
    img16.save(OUT / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32)])
    img32.save(ROOT / "favicon.ico", format="ICO", sizes=[(32, 32)])
    print("Generated favicon assets")


if __name__ == "__main__":
    main()
