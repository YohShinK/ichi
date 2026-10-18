#!/usr/bin/env python3
"""Create README-only crops from the nine original pages; never edit originals."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps

parser = argparse.ArgumentParser()
parser.add_argument("--nine-dir", type=Path, default=Path.home() / "Desktop/9 图")
parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[3])
args = parser.parse_args()
root, nine = args.repo.resolve(), args.nine_dir.resolve()
out = root / "assets/readme"
out.mkdir(parents=True, exist_ok=True)
manifest = {"date": "2026-10-19", "coordinates": "original pixels: left, top, right, bottom", "assets": []}


def digest(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def save(im: Image.Image, name: str, source: Path, box=None, redactions=None, note=""):
    dest = out / name
    # Fresh images discard EXIF, location, embedded comments and source metadata.
    clean = Image.new(im.mode, im.size)
    clean.paste(im)
    if dest.suffix == ".webp":
        clean.save(dest, "WEBP", quality=91, method=6)
    else:
        clean.save(dest, "PNG", optimize=True)
    src = f"@nine/{source.name}" if source.parent == nine else source.relative_to(root).as_posix()
    manifest["assets"].append({"file": name, "source": src, "sourceSha256": digest(source),
        "sourceSize": list(Image.open(source).size), "crop": list(box) if box else None,
        "outputSize": list(im.size), "redactions": redactions or [], "note": note,
        "sha256": digest(dest), "bytes": dest.stat().st_size})


def mask(im, box, color, edits, reason):
    ImageDraw.Draw(im).rectangle(box, fill=color)
    edits.append({"boxInCrop": list(box), "operation": "opaque privacy mask", "reason": reason})


def restore(im, original, box, radius=0):
    part = original.crop(box)
    if radius:
        alpha = Image.new("L", part.size, 0)
        ImageDraw.Draw(alpha).rounded_rectangle((0, 0, part.width - 1, part.height - 1), radius, fill=255)
        im.paste(part, box[:2], alpha)
    else:
        im.paste(part, box[:2])


def restore_marker(im, original, body, tip, badge):
    """Clip original marker pixels; exclude readable street labels around them."""
    alpha = Image.new("L", im.size, 0)
    draw = ImageDraw.Draw(alpha)
    draw.rounded_rectangle(body, radius=14, fill=255)
    draw.polygon(tip, fill=255)
    draw.ellipse(badge, fill=255)
    im.paste(original, (0, 0), alpha)


def protect_map(im, kind, edits):
    original = im.copy()
    area = (32, 198, im.width - 29, im.height - 32)
    tile = im.crop(area)
    # Remove street geometry and labels, without introducing any new map or pins.
    tile = tile.resize((10, 18), Image.Resampling.BOX).resize(tile.size, Image.Resampling.NEAREST)
    tile = tile.filter(ImageFilter.GaussianBlur(10))
    im.paste(tile, area[:2])
    restore(im, original, (44, 145, 540, 257))
    edits.append({"boxInCrop": list(area), "operation": "pixelate and blur original basemap; restore only original UI and marker pixels", "reason": "hide precise streets and geographic position"})
    if kind == "map":
        for body, tip, badge in [
            ((83, 374, 207, 432), [(104, 430), (116, 444), (129, 430)], (188, 361, 211, 384)),
            ((405, 622, 530, 685), [(419, 682), (432, 697), (445, 682)], (511, 609, 535, 633)),
            ((135, 722, 258, 786), [(149, 782), (163, 800), (177, 782)], (240, 709, 264, 733)),
            ((281, 761, 408, 824), [(296, 821), (308, 839), (322, 821)], (389, 748, 413, 772)),
        ]:
            restore_marker(im, original, body, tip, badge)
        restore(im, original, (480, 767, 547, 832), 31)
        restore(im, original, (480, 845, 547, 913), 31)
        restore(im, original, (88, 1005, 504, 1093), 42)
    elif kind == "map-detail":
        restore_marker(im, original, (388, 322, 529, 384), [(401, 381), (414, 397), (427, 381)], (511, 309, 535, 333))
        restore(im, original, (58, 492, 526, 995), 48)
        restore(im, original, (38, 487, 109, 548), 11)
        restore(im, original, (109, 472, 278, 510), 10)
        restore(im, original, (84, 1007, 502, 1093), 42)
        for box in [(144, 841, 413, 862), (104, 874, 426, 916)]:
            mask(im, box, "#191a20", edits, "remove venue identity and exact-place note")
        # The source is a NETWORK card, with a globe icon, not a person's avatar.
    else:
        restore(im, original, (74, 260, 513, 801), 48)
        restore(im, original, (85, 1007, 503, 1093), 42)
        for y in [407, 487, 567, 647, 727]:
            mask(im, (155, y, 387, y + 23), "#ffffff", edits, "remove uploader/venue notes while keeping original IP, tags and upload time")
    # Preserve the original map-provider attribution, without its surrounding map.
    restore(im, original, (450, 1087, 543, 1116))


phone_crops = {
    "capture": ("01.PNG", 3, (190, 2070, 776, 3262)),
    "recognition": ("01.PNG", 3, (948, 2070, 1536, 3262)),
    "draw": ("01.PNG", 3, (1700, 2070, 2290, 3262)),
    "outlook": ("02.PNG", 4, (188, 406, 770, 1598)),
    "history": ("02.PNG", 4, (948, 406, 1538, 1598)),
    "records": ("02.PNG", 4, (1700, 406, 2290, 1598)),
    "map": ("02.PNG", 4, (228, 2116, 812, 3264)),
    "map-detail": ("02.PNG", 4, (966, 2116, 1552, 3264)),
    "map-picker": ("02.PNG", 4, (1690, 2116, 2276, 3264)),
}
for name, (filename, page, box) in phone_crops.items():
    source = nine / filename
    im = Image.open(source).convert("RGB").crop(box)
    edits = []
    if name.startswith("map"):
        protect_map(im, name, edits)
    if name == "records":
        for y in [336, 525, 671]:
            mask(im, (169, y, 262, y + 25), "#d6d6d6", edits, "remove original record code")
    save(im, f"ui-{name}.webp", source, box, edits, f"Product manual page {page}; real UI crop, no invented UI or data")

for name, filename, box, note in [
    ("product-principle.webp", "04.PNG", (1260, 393, 2200, 563), "Page 6: original product principle; repeated in Markdown"),
    ("remain-comparison.webp", "05.PNG", (565, 1858, 1928, 2468), "Page 7: original HYBRID/REMAIN ticket comparison and arrow; performance estimates excluded"),
    ("marker-stress-500.webp", "06.PNG", (775, 1210, 1695, 1830), "Page 8: real historical stress screenshot and original counts; no FPS or universal performance claim"),
]:
    source = nine / filename
    save(Image.open(source).convert("RGB").crop(box), name, source, box, note=note)

source = root / "apps/client/miniprogram/assets/v1-29/ichi-avatar.png"
im = Image.open(source).convert("RGB")
gray = ImageOps.grayscale(im)
box = gray.point(lambda p: 255 if p < 100 else 0).getbbox()
box = (max(0, box[0] - 8), max(0, box[1] - 8), min(im.width, box[2] + 8), min(im.height, box[3] + 8))
save(im.crop(box), "logo.png", source, box, note="Original ICHI logo; no redraw")
source = root / "docs/visual/ichi-map-mechanisms-a2/assets/marker-visual-sample.png"
save(Image.open(source).convert("RGBA"), "native-marker.png", source, note="Existing production Canvas renderer output; visual sample, not a live lead")
source = nine / "gh_e40431bdc658_1280 (1).jpg"
save(Image.open(source).convert("RGB"), "miniprogram-code.png", source, note="Full supplied Mini Program code; no crop, pixel-identical PNG conversion; scanning requires user verification")

stress = root / "docs/visual/ichi-map-mechanisms-a2/assets/stress-500-original.jpg"
next(a for a in manifest["assets"] if a["file"] == "marker-stress-500.webp")["corroboratingSource"] = {
    "file": stress.relative_to(root).as_posix(), "sha256": digest(stress),
    "provenance": "User-provided real screenshot; see the existing map-visual source manifest"}

manifest["originalPages"] = [{"file": f.name, "sha256": digest(f), "size": list(Image.open(f).size)}
    for f in [nine / n for n in ["首页.PNG", "目录.PNG", "01.PNG", "02.PNG", "03.PNG", "04.PNG", "05.PNG", "06.PNG", "07.PNG"]]]
contract = root / "docs/decisions/map-upload-sharing-contract.md"
flow = out / "sharing-flow.svg"
manifest["assets"].append({"file": "sharing-flow.svg", "source": contract.relative_to(root).as_posix(),
    "sourceSha256": digest(contract), "outputSize": [1200, 390], "sha256": digest(flow), "bytes": flow.stat().st_size,
    "note": "Deterministic SVG of verified V1/Bridge/V2 relationships; not a screenshot or a new product flow"})
(out / "source/asset-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print(f"Created {len(manifest['assets'])} original-sourced assets in {out}")
