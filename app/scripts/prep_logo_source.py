"""De-checkerboard the Skiller source logo and normalize to a clean transparent
1024x1024 icon-source.png.

The provided artwork has a checkerboard "transparency" pattern baked into
opaque pixels (white ~255 and light gray ~240). The foreground S is a
purple->blue gradient. Foreground pixels have a large RGB channel spread;
white/gray background pixels have near-zero spread. We derive alpha from that
spread with a smooth ramp for anti-aliased edges, then crop to content and
center on a square canvas.
"""
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path("assets/icon-source.png")
OUT = Path("src-tauri/icons/icon-source.png")
CANVAS = 1024
PADDING_FRAC = 0.06          # blank margin around the glyph on final canvas
SPREAD_LOW, SPREAD_HIGH = 16, 46   # alpha ramp on max-min channel spread

im = Image.open(SRC).convert("RGB")
rgb = np.array(im).astype(np.int16)
spread = rgb.max(axis=2) - rgb.min(axis=2)          # colorfulness
alpha = np.clip((spread - SPREAD_LOW) / (SPREAD_HIGH - SPREAD_LOW), 0, 1)
alpha = (alpha * 255).astype(np.uint8)

rgba = np.dstack([np.array(im), alpha])
out = Image.fromarray(rgba, "RGBA")

# Crop to the content bounding box (alpha > small threshold).
mask = alpha > 12
ys, xs = np.where(mask)
top, bottom, left, right = ys.min(), ys.max(), xs.min(), xs.max()
glyph = out.crop((left, top, right + 1, bottom + 1))
gw, gh = glyph.size

# Fit into a square canvas with padding, preserving aspect ratio.
inner = int(CANVAS * (1 - 2 * PADDING_FRAC))
scale = inner / max(gw, gh)
new_w, new_h = max(1, round(gw * scale)), max(1, round(gh * scale))
glyph = glyph.resize((new_w, new_h), Image.LANCZOS)

canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
canvas.paste(glyph, ((CANVAS - new_w) // 2, (CANVAS - new_h) // 2), glyph)

OUT.parent.mkdir(parents=True, exist_ok=True)
canvas.save(OUT)
print(f"wrote {OUT} ({CANVAS}x{CANVAS}), glyph {gw}x{gh} -> {new_w}x{new_h}")
