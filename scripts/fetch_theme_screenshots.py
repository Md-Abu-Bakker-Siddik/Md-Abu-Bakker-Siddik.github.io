"""Download theme preview screenshots from live demo URLs."""

from __future__ import annotations

import json
import re
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "images" / "project"
THEMES_JS = ROOT / "assets" / "js" / "themes-data.js"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)
CTX = ssl.create_default_context()


def parse_themes() -> list[dict[str, str]]:
    text = THEMES_JS.read_text(encoding="utf-8")
    pattern = re.compile(
        r'\{\s*name:\s*"([^"]+)",\s*url:\s*"([^"]+)",\s*image:\s*"([^"]+)"\s*\}'
    )
    return [
        {"name": name, "url": url, "image": image}
        for name, url, image in pattern.findall(text)
    ]


def slug_from_image(image_path: str) -> str:
    return Path(image_path).stem.lower()


def fetch_html(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30, context=CTX) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def extract_og_image(html: str, base_url: str) -> str | None:
    patterns = [
        r'<meta[^>]+property=["\']og:image(?::secure_url)?["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image(?::secure_url)?["\']',
        r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
    ]
    for pattern in patterns:
        match = re.search(pattern, html, re.I)
        if match:
            return urllib.parse.urljoin(base_url, match.group(1))
    return None


def download_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60, context=CTX) as resp:
        data = resp.read()
        content_type = resp.headers.get("content-type", "")
        if "image" not in content_type and "octet-stream" not in content_type:
            raise ValueError(f"Unexpected content-type: {content_type}")
        return data


def screenshot_via_thumio(demo_url: str) -> bytes:
    shot_url = (
        "https://image.thum.io/get/width/960/crop/600/noanimate/"
        + demo_url
    )
    return download_bytes(shot_url)


def screenshot_via_microlink(demo_url: str) -> bytes:
    api = (
        "https://api.microlink.io/?"
        + urllib.parse.urlencode(
            {
                "url": demo_url,
                "screenshot": "true",
                "meta": "false",
                "embed": "screenshot.url",
            }
        )
    )
    req = urllib.request.Request(api, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=90, context=CTX) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    image_url = payload.get("data", {}).get("screenshot", {}).get("url")
    if not image_url:
        raise ValueError("Microlink screenshot URL missing")
    return download_bytes(image_url)


def save_image(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        from io import BytesIO

        from PIL import Image

        img = Image.open(BytesIO(data)).convert("RGB")
        img.save(path, format="JPEG", quality=82, optimize=True)
    except Exception:
        path.write_bytes(data)


def fetch_theme_image(theme: dict[str, str], force: bool = False) -> str:
    slug = slug_from_image(theme["image"])
    out_path = OUT_DIR / f"{slug}.jpg"
    if out_path.exists() and out_path.stat().st_size > 5000 and not force:
        return f"skip {slug}"

    errors: list[str] = []

    try:
        html = fetch_html(theme["url"])
        og = extract_og_image(html, theme["url"])
        if og:
            data = download_bytes(og)
            if len(data) > 5000:
                save_image(out_path, data)
                return f"og {slug}"
    except Exception as exc:  # noqa: BLE001
        errors.append(f"og:{exc}")

    for label, fn in (
        ("thum", screenshot_via_thumio),
        ("micro", screenshot_via_microlink),
    ):
        try:
            data = fn(theme["url"])
            if len(data) > 5000:
                save_image(out_path, data)
                return f"{label} {slug}"
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{label}:{exc}")

    return f"fail {slug} ({'; '.join(errors[:2])})"


def main() -> None:
    themes = parse_themes()
    missing = [
        t
        for t in themes
        if not (OUT_DIR / f"{slug_from_image(t['image'])}.jpg").exists()
    ]

    print(f"Total themes: {len(themes)} | Missing screenshots: {len(missing)}")

    for index, theme in enumerate(missing, start=1):
        result = fetch_theme_image(theme)
        print(f"[{index}/{len(missing)}] {theme['name']}: {result}")
        time.sleep(1.2)


if __name__ == "__main__":
    main()
