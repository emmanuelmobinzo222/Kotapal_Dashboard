"""
Convert a raster logo into a Tajima .dst embroidery file.
Uses color-separated row fills suitable for multi-needle machines.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

import pyembroidery

# Thread palette (RGB) — order defines stitch sequence / needle slots
THREAD_PALETTE = [
    (0, 0, 0, "Black"),
    (255, 255, 255, "White"),
    (220, 20, 20, "Red"),
    (34, 139, 34, "Green"),
    (255, 215, 0, "Gold"),
    (139, 90, 43, "Brown"),
    (30, 80, 180, "Royal Blue"),
    (255, 200, 120, "Tan"),
    (180, 180, 180, "Gray"),
]


def rgb_distance(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    return np.sqrt(np.sum((a.astype(np.float32) - b.astype(np.float32)) ** 2, axis=-1))


def quantize_image(
    rgb: np.ndarray, mask: np.ndarray, n_colors: int = 10
) -> tuple[np.ndarray, list[tuple[int, int, int]], set[int]]:
    """Reduce colors then map pixels to nearest thread color; return index map and used colors."""
    # Pillow quantization strongly reduces speckle compared to raw nearest-neighbor to thread palette.
    img = Image.fromarray(rgb, mode="RGB").filter(ImageFilter.MedianFilter(size=3))
    img_q = img.quantize(colors=max(2, int(n_colors)), method=Image.Quantize.MEDIANCUT).convert("RGB")
    q = np.array(img_q)

    h, w, _ = q.shape
    flat = q.reshape(-1, 3).astype(np.float32)
    palette = np.array([c[:3] for c in THREAD_PALETTE], dtype=np.float32)
    dists = np.linalg.norm(flat[:, None, :] - palette[None, :, :], axis=2)
    indices = np.argmin(dists, axis=1).reshape(h, w)

    used: list[tuple[int, int, int]] = []
    used_set: set[int] = set()
    for i, entry in enumerate(THREAD_PALETTE):
        if np.any((indices == i) & mask):
            used.append(entry[:3])
            used_set.add(i)
    return indices, used, used_set


def remove_background(rgba: Image.Image, threshold: int = 45) -> tuple[np.ndarray, np.ndarray]:
    """Return RGB array and boolean mask of logo pixels (non-dark background)."""
    arr = np.array(rgba.convert("RGBA"))
    rgb = arr[..., :3]
    alpha = arr[..., 3]
    luminance = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    # Keep pixels that are bright enough or not fully transparent
    mask = (luminance > threshold) | (alpha > 200)
    # Trim glow: require some color saturation or high luminance
    max_c = rgb.max(axis=-1)
    min_c = rgb.min(axis=-1)
    saturation = max_c.astype(np.int16) - min_c.astype(np.int16)
    mask &= (saturation > 25) | (luminance > 120)
    return rgb, mask


def crop_to_mask(rgb: np.ndarray, mask: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    rows = np.where(mask.any(axis=1))[0]
    cols = np.where(mask.any(axis=0))[0]
    if len(rows) == 0 or len(cols) == 0:
        return rgb, mask
    r0, r1 = rows[0], rows[-1] + 1
    c0, c1 = cols[0], cols[-1] + 1
    return rgb[r0:r1, c0:c1], mask[r0:r1, c0:c1]

def binary_dilate(mask: np.ndarray, radius: int = 1) -> np.ndarray:
    if radius <= 0:
        return mask
    h, w = mask.shape
    out = mask.copy()
    for _ in range(radius):
        padded = np.pad(out, 1, mode="constant", constant_values=False)
        neigh = (
            padded[1:-1, 1:-1]
            | padded[:-2, 1:-1]
            | padded[2:, 1:-1]
            | padded[1:-1, :-2]
            | padded[1:-1, 2:]
            | padded[:-2, :-2]
            | padded[:-2, 2:]
            | padded[2:, :-2]
            | padded[2:, 2:]
        )
        out = neigh
    return out

def binary_erode(mask: np.ndarray, radius: int = 1) -> np.ndarray:
    if radius <= 0:
        return mask
    h, w = mask.shape
    out = mask.copy()
    for _ in range(radius):
        padded = np.pad(out, 1, mode="constant", constant_values=True)
        neigh = (
            padded[1:-1, 1:-1]
            & padded[:-2, 1:-1]
            & padded[2:, 1:-1]
            & padded[1:-1, :-2]
            & padded[1:-1, 2:]
            & padded[:-2, :-2]
            & padded[:-2, 2:]
            & padded[2:, :-2]
            & padded[2:, 2:]
        )
        out = neigh
    return out

def binary_open(mask: np.ndarray, radius: int = 1) -> np.ndarray:
    return binary_dilate(binary_erode(mask, radius), radius)

def binary_close(mask: np.ndarray, radius: int = 1) -> np.ndarray:
    return binary_erode(binary_dilate(mask, radius), radius)

def remove_small_islands(binary_mask: np.ndarray, min_area: int) -> np.ndarray:
    """Remove tiny connected components (4-connected) to reduce speckle stitching."""
    h, w = binary_mask.shape
    visited = np.zeros((h, w), dtype=np.uint8)
    out = binary_mask.copy()

    for y in range(h):
        for x in range(w):
            if not out[y, x] or visited[y, x]:
                continue
            stack = [(y, x)]
            visited[y, x] = 1
            coords: list[tuple[int, int]] = []
            while stack:
                cy, cx = stack.pop()
                coords.append((cy, cx))
                if cy > 0 and out[cy - 1, cx] and not visited[cy - 1, cx]:
                    visited[cy - 1, cx] = 1
                    stack.append((cy - 1, cx))
                if cy + 1 < h and out[cy + 1, cx] and not visited[cy + 1, cx]:
                    visited[cy + 1, cx] = 1
                    stack.append((cy + 1, cx))
                if cx > 0 and out[cy, cx - 1] and not visited[cy, cx - 1]:
                    visited[cy, cx - 1] = 1
                    stack.append((cy, cx - 1))
                if cx + 1 < w and out[cy, cx + 1] and not visited[cy, cx + 1]:
                    visited[cy, cx + 1] = 1
                    stack.append((cy, cx + 1))
            if len(coords) < min_area:
                for cy, cx in coords:
                    out[cy, cx] = False
    return out


def resize_for_embroidery(
    rgb: np.ndarray, mask: np.ndarray, max_mm: float, units_per_mm: float = 10.0
) -> tuple[np.ndarray, np.ndarray, float]:
    """Resize so longest side is max_mm (DST uses 0.1 mm units)."""
    h, w = mask.shape
    longest_px = max(h, w)
    target_units = max_mm * units_per_mm
    scale = target_units / longest_px
    new_w = max(1, int(round(w * scale)))
    new_h = max(1, int(round(h * scale)))
    img = Image.fromarray(rgb).resize((new_w, new_h), Image.Resampling.LANCZOS)
    msk = Image.fromarray((mask.astype(np.uint8) * 255)).resize((new_w, new_h), Image.Resampling.NEAREST)
    return np.array(img), np.array(msk) > 127, scale


def row_fill_stitches(
    pattern: pyembroidery.EmbPattern,
    color_mask: np.ndarray,
    stitch_step: float,
    row_step: float,
    offset_x: float,
    offset_y: float,
) -> None:
    """Tatami-style row fills for one color layer."""
    h, w = color_mask.shape
    if not color_mask.any():
        return

    y = 0.0
    row_idx = 0
    while y < h:
        row_y = int(min(h - 1, round(y)))
        runs: list[tuple[int, int]] = []
        x = 0
        while x < w:
            if not color_mask[row_y, x]:
                x += 1
                continue
            start = x
            while x < w and color_mask[row_y, x]:
                x += 1
            runs.append((start, x - 1))
        for start, end in runs:
            if end < start:
                continue
            if row_idx % 2 == 0:
                xs = np.arange(start, end + 1, stitch_step)
                if xs[-1] != end:
                    xs = np.append(xs, end)
            else:
                xs = np.arange(end, start - 1, -stitch_step)
                if xs[-1] != start:
                    xs = np.append(xs, start)
            first = True
            for px in xs:
                sx = offset_x + float(px)
                sy = offset_y + float(row_y)
                if first:
                    pattern.add_stitch_absolute(pyembroidery.JUMP, sx, sy)
                    first = False
                else:
                    pattern.add_stitch_absolute(pyembroidery.STITCH, sx, sy)
        y += row_step
        row_idx += 1

def edge_map_from_rgb(rgb: np.ndarray, mask: np.ndarray, threshold: float = 65.0) -> np.ndarray:
    """Simple Sobel edge map (no OpenCV) to drive outline running stitches."""
    gray = (0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]).astype(np.float32)
    gray = np.pad(gray, 1, mode="edge")
    gx = (
        -1 * gray[:-2, :-2] + 1 * gray[:-2, 2:]
        -2 * gray[1:-1, :-2] + 2 * gray[1:-1, 2:]
        -1 * gray[2:, :-2] + 1 * gray[2:, 2:]
    )
    gy = (
        -1 * gray[:-2, :-2] - 2 * gray[:-2, 1:-1] - 1 * gray[:-2, 2:]
        +1 * gray[2:, :-2] + 2 * gray[2:, 1:-1] + 1 * gray[2:, 2:]
    )
    mag = np.sqrt(gx * gx + gy * gy)
    edges = (mag > float(threshold)) & mask
    # cleanup edges to reduce fuzz
    edges = binary_close(edges, radius=1)
    edges = binary_open(edges, radius=1)
    edges = remove_small_islands(edges, min_area=20)
    return edges

def thicken_edges(edge_mask: np.ndarray, thickness: int = 2) -> np.ndarray:
    """Thicken edge pixels so outline is very readable."""
    return binary_dilate(edge_mask, radius=max(0, int(thickness)))

def running_stitch_from_mask(
    pattern: pyembroidery.EmbPattern,
    edge_mask: np.ndarray,
    step: float,
    offset_x: float,
    offset_y: float,
) -> None:
    """Convert edge pixels to horizontal running-stitch segments."""
    h, w = edge_mask.shape
    for y in range(0, h, max(1, int(round(step)))):
        runs: list[tuple[int, int]] = []
        x = 0
        while x < w:
            if not edge_mask[y, x]:
                x += 1
                continue
            start = x
            while x < w and edge_mask[y, x]:
                x += 1
            if x - start >= 3:
                runs.append((start, x - 1))
        for start, end in runs:
            pattern.add_stitch_absolute(pyembroidery.JUMP, offset_x + start, offset_y + y)
            # walk with fixed step
            xs = np.arange(start, end + 1, max(1.0, step))
            if xs[-1] != end:
                xs = np.append(xs, end)
            for px in xs[1:]:
                pattern.add_stitch_absolute(pyembroidery.STITCH, offset_x + float(px), offset_y + float(y))


def build_pattern(
    indices: np.ndarray,
    mask: np.ndarray,
    palette_indices: set[int],
    stitch_step: float = 3.5,
    row_step: float = 3.0,
    outline: bool = True,
    outline_threshold: float = 65.0,
    outline_step: float = 2.0,
    min_island_area: int = 120,
    outline_thickness: int = 2,
) -> pyembroidery.EmbPattern:
    pattern = pyembroidery.EmbPattern()
    pattern.add_thread(pyembroidery.EmbThread(0, 0, 0, "Black"))

    h, w = indices.shape
    margin = stitch_step * 2
    offset_x = margin
    offset_y = margin

    # Stitch larger background areas first, details last
    area_order = []
    for idx in palette_indices:
        layer = (indices == idx) & mask
        area_order.append((layer.sum(), idx, layer))
    area_order.sort(reverse=True)

    first_layer = True
    for _, idx, layer in area_order:
        # Smooth + drop tiny islands to reduce noisy fill in fine details.
        layer = binary_close(layer, radius=1)
        layer = binary_open(layer, radius=1)
        layer = remove_small_islands(layer, min_area=int(min_island_area))
        if not layer.any():
            continue

        r, g, b = THREAD_PALETTE[idx][:3]
        name = THREAD_PALETTE[idx][3]
        pattern.add_thread(pyembroidery.EmbThread(r, g, b, name))
        if not first_layer:
            pattern.add_command(pyembroidery.COLOR_CHANGE)
        first_layer = False
        row_fill_stitches(pattern, layer, stitch_step, row_step, offset_x, offset_y)

    # Outline pass (black) to make details readable in embroidery preview and stitching.
    if outline:
        edges = edge_map_from_rgb(
            # We want edges based on the already-smoothed/quantized look, so approximate from indices colors.
            rgb=np.take(np.array([c[:3] for c in THREAD_PALETTE], dtype=np.uint8), indices, axis=0),
            mask=mask,
            threshold=outline_threshold,
        )
        edges = thicken_edges(edges, thickness=outline_thickness)
        if edges.any():
            pattern.add_thread(pyembroidery.EmbThread(0, 0, 0, "Outline Black"))
            pattern.add_command(pyembroidery.COLOR_CHANGE)
            running_stitch_from_mask(pattern, edges, outline_step, offset_x, offset_y)

    pattern.add_stitch_absolute(pyembroidery.END, offset_x, offset_y)
    pattern.extents()
    return pattern


def convert_image_to_dst(
    input_path: Path,
    output_path: Path,
    max_width_mm: float = 100.0,
    stitch_step: float = 3.2,
    row_step: float = 2.8,
    colors: int = 9,
    outline: bool = True,
    min_island_area: int = 120,
    outline_threshold: float = 65.0,
    outline_step: float = 2.0,
    outline_thickness: int = 2,
) -> dict:
    img = Image.open(input_path)
    # Pre-enhance a bit to keep internal logo contrast readable after quantization
    img = img.convert("RGBA")
    enh = ImageEnhance.Contrast(img.convert("RGB")).enhance(1.15)
    enh = ImageEnhance.Sharpness(enh).enhance(1.1)
    img = enh.convert("RGBA")

    rgb, mask = remove_background(img)
    rgb, mask = crop_to_mask(rgb, mask)
    rgb, mask, _scale = resize_for_embroidery(rgb, mask, max_width_mm)

    indices, _used, palette_indices = quantize_image(rgb, mask, n_colors=colors)
    pattern = build_pattern(
        indices,
        mask,
        palette_indices,
        stitch_step,
        row_step,
        outline=outline,
        outline_threshold=outline_threshold,
        outline_step=outline_step,
        min_island_area=min_island_area,
        outline_thickness=outline_thickness,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    pyembroidery.write_dst(pattern, str(output_path))

    stitch_count = len([s for s in pattern.stitches if s[2] == pyembroidery.STITCH])
    bounds = pattern.bounds() if hasattr(pattern, "bounds") else None
    return {
        "output": str(output_path),
        "stitches": stitch_count,
        "size_mm": max_width_mm,
        "colors": len(palette_indices),
        "bounds": bounds,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert image to Tajima DST")
    parser.add_argument("input", type=Path, help="Source PNG/JPG")
    parser.add_argument("-o", "--output", type=Path, required=True, help="Output .dst path")
    parser.add_argument("--width-mm", type=float, default=100.0, help="Max width/height in mm")
    parser.add_argument("--stitch-step", type=float, default=3.2, help="Stitch spacing (0.1mm units)")
    parser.add_argument("--row-step", type=float, default=2.8, help="Row spacing (0.1mm units)")
    parser.add_argument("--colors", type=int, default=9, help="Approximate number of color clusters")
    parser.add_argument("--no-outline", action="store_true", help="Disable black outline pass")
    parser.add_argument("--min-island-area", type=int, default=120, help="Drop details smaller than this (pixels)")
    parser.add_argument("--outline-threshold", type=float, default=65.0, help="Lower = more outline detail")
    parser.add_argument("--outline-step", type=float, default=2.0, help="Running stitch step (0.1mm units)")
    parser.add_argument("--outline-thickness", type=int, default=2, help="Outline thickness (dilation radius)")
    args = parser.parse_args()

    if not args.input.is_file():
        print(f"Input not found: {args.input}", file=sys.stderr)
        return 1

    info = convert_image_to_dst(
        args.input,
        args.output,
        max_width_mm=args.width_mm,
        stitch_step=args.stitch_step,
        row_step=args.row_step,
        colors=args.colors,
        outline=not args.no_outline,
        min_island_area=args.min_island_area,
        outline_threshold=args.outline_threshold,
        outline_step=args.outline_step,
        outline_thickness=args.outline_thickness,
    )
    print(f"Wrote {info['output']}")
    print(f"  Stitches: {info['stitches']:,}")
    print(f"  Thread colors: {info['colors']}")
    print(f"  Design size: ~{info['size_mm']} mm (max dimension)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
