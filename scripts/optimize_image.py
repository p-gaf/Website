#!/usr/bin/env python3
"""Optimize image(s) for patrickgaffney.studio.

Usage:
    # single file
    python3 scripts/optimize_image.py <input.jpg> [-o <output.jpg>] [--max-dim 2400] [--quality 82]

    # whole folder (e.g. an entire project's raw exports)
    python3 scripts/optimize_image.py <input-dir>/ [-o <output-dir>/] [--max-dim 2400] [--quality 82]

Defaults:
    --max-dim   2400   resize so the longest edge is <= this many pixels
    --quality   82     JPEG quality (1-95; 80-85 is visually transparent)
    output      single: <input dir>/<input stem>.jpg
                folder: <input dir>-optimized/

What it does:
    - Open any common format (JPEG, PNG, TIFF, WebP, BMP)
    - Downscale (never upscale) so longest edge <= max-dim
    - Re-encode as JPEG, strip EXIF metadata
    - Convert to RGB (flattens transparency on white)
    - Report dimensions + sizes before/after

This is what gets run on every photo before it ends up under images/.
"""
import argparse
import sys
from pathlib import Path

from PIL import Image


def optimize(src: Path, dst: Path, max_dim: int = 2400, quality: int = 82) -> None:
    img = Image.open(src)
    orig_size = img.size
    src_bytes = src.stat().st_size

    # Flatten transparency / convert palette to RGB
    if img.mode in ("RGBA", "LA"):
        bg = Image.new("RGB", img.size, (255, 255, 255))
        alpha = img.split()[-1]
        bg.paste(img.convert("RGB"), mask=alpha)
        img = bg
    elif img.mode != "RGB":
        img = img.convert("RGB")

    # Downscale only — never upscale
    long_edge = max(img.size)
    if long_edge > max_dim:
        ratio = max_dim / long_edge
        new_size = (round(img.size[0] * ratio), round(img.size[1] * ratio))
        img = img.resize(new_size, Image.LANCZOS)

    # Save as JPEG without EXIF, with progressive encoding (smaller + nicer load)
    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst, "JPEG", quality=quality, optimize=True, progressive=True)

    out_bytes = dst.stat().st_size
    pct = (out_bytes / src_bytes * 100) if src_bytes else 0
    print(f"{src.name}  {orig_size[0]}×{orig_size[1]}  {src_bytes//1024} KB")
    print(f"  → {dst}")
    print(f"  {img.size[0]}×{img.size[1]}  {out_bytes//1024} KB  ({pct:.0f}% of source)")


IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp", ".bmp", ".heic", ".heif"}


def optimize_folder(src_dir: Path, dst_dir: Path, max_dim: int, quality: int) -> None:
    files = sorted(
        p for p in src_dir.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS and not p.name.startswith(".")
    )
    if not files:
        print(f"no images found in {src_dir}", file=sys.stderr)
        sys.exit(1)
    dst_dir.mkdir(parents=True, exist_ok=True)
    print(f"Optimizing {len(files)} files: {src_dir} → {dst_dir}\n")
    for f in files:
        # Preserve original filename stem, force .jpg extension
        out = dst_dir / (f.stem + ".jpg")
        if out.resolve() == f.resolve():
            out = dst_dir / (f.stem + "-optimized.jpg")
        try:
            optimize(f, out, max_dim, quality)
        except Exception as e:
            print(f"  skipped {f.name}: {e}")
        print()


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("input", help="Source image file or directory")
    p.add_argument("-o", "--output", help="Destination file or directory")
    p.add_argument("--max-dim", type=int, default=2400, help="Max long edge in pixels (default: 2400)")
    p.add_argument("--quality", type=int, default=82, help="JPEG quality 1-95 (default: 82)")
    args = p.parse_args()

    src = Path(args.input).expanduser().resolve()
    if not src.exists():
        print(f"error: {src} does not exist", file=sys.stderr)
        sys.exit(1)

    if src.is_dir():
        dst = Path(args.output).expanduser().resolve() if args.output else src.with_name(src.name + "-optimized")
        optimize_folder(src, dst, args.max_dim, args.quality)
    else:
        dst = Path(args.output).expanduser().resolve() if args.output else src.with_suffix(".jpg")
        if src.resolve() == dst.resolve():
            dst = src.with_name(src.stem + "-optimized.jpg")
            print(f"note: output would overwrite input; writing to {dst.name} instead")
        optimize(src, dst, args.max_dim, args.quality)


if __name__ == "__main__":
    main()
