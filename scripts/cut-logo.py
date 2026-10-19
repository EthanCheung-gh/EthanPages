#!/usr/bin/env python3
"""从白底 Logo 稿中抠出透明底标志 + 输出几何测量值。

用法: python3 scripts/cut-logo.py [源图] [输出目录]
默认源图 assets/IMG_20260825_080436.png
"""
import sys, os
import numpy as np
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else 'assets/IMG_20260825_080436.png'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'public'

im = Image.open(SRC).convert('RGB')
a = np.asarray(im).astype(np.float32)
H, W, _ = a.shape

# 1) 以「与白色的距离」计算 alpha：纯色块 -> 1，白底 -> 0，抗锯齿边缘 -> 部分透明
dist = np.sqrt(((255.0 - a) ** 2).sum(axis=2))
K = 230.0
alpha = np.clip(dist / K, 0.0, 1.0)
alpha[alpha < 0.06] = 0.0

# 2) 反预乘：把与白底混合的颜色还原为原色
safe = np.maximum(alpha, 1e-3)[..., None]
fg = (a - (1.0 - safe) * 255.0) / safe
fg = np.clip(fg, 0, 255)

out = np.dstack([fg, alpha * 255.0]).astype(np.uint8)
rgba = Image.fromarray(out, 'RGBA')

# 3) 裁掉透明边，切出「图形标志」（左侧）与「文字标」（右侧）
def bbox(arr):
    ys, xs = np.where(arr > 16)
    return xs.min(), ys.min(), xs.max(), ys.max()

x0, y0, x1, y1 = bbox(alpha * 255)
rgba = rgba.crop((x0, y0, x1 + 1, y1 + 1))
mask = np.asarray(rgba)[:, :, 3] > 16
w = mask.shape[1]

col_has = mask.any(axis=0)
gap = None
for x in range(1, w):
    if not col_has[x] and col_has[x - 1]:
        start = x
        while x < w and not col_has[x]:
            x += 1
        if x - start > w * 0.02 and x < w - 1:
            gap = (start, x)
            break

mark_w = gap[0] if gap else int(w * 0.46)
mark = rgba.crop((0, 0, mark_w, rgba.height))
mx0, my0, mx1, my1 = bbox(np.asarray(mark)[:, :, 3])

os.makedirs(OUT, exist_ok=True)
for size in (512, 1024):
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    side = max(mx1 - mx0 + 1, my1 - my0 + 1)
    scale = int(size * 0.92) / side
    resized = mark.resize((int(mark.width * scale), int(mark.height * scale)), Image.LANCZOS)
    canvas.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    canvas.save(f'{OUT}/logo-mark-{size}.png')
    print(f'wrote {OUT}/logo-mark-{size}.png')
rgba.save(f'{OUT}/logo-lockup.png')
print(f'wrote {OUT}/logo-lockup.png (transparent, {rgba.width}x{rgba.height})')

# 4) 输出几何测量，供手绘 SVG 使用
rgb = np.asarray(rgba).astype(int)[:, :, :3]
al = np.asarray(rgba)[:, :, 3] > 128
r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
blue = al & (b > 120) & (b > g + 20) & (b > r + 20)
green = al & (g > 120) & (g > b + 20) & (g > r + 20)

def report(name, m):
    ys, xs = np.where(m)
    if len(xs) == 0:
        print(name, 'empty'); return
    print(f'{name}: x {xs.min()}..{xs.max()}  y {ys.min()}..{ys.max()}  (w {xs.max()-xs.min()+1} h {ys.max()-ys.min()+1})')
    rows = m.sum(axis=1)
    for frac in (0, .1, .25, .5, .75, .9, 1):
        y = int(ys.min() + (ys.max() - ys.min()) * frac)
        xr = np.where(m[y])[0]
        if len(xr): print(f'  row y={y} ({frac:.2f}): x {xr.min()}..{xr.max()} width {xr.max()-xr.min()+1}')
    cols = m.sum(axis=0)
    for frac in (0, .25, .5, .75, 1):
        x = int(xs.min() + (xs.max() - xs.min()) * frac)
        yr = np.where(m[:, x])[0]
        if len(yr): print(f'  col x={x} ({frac:.2f}): y {yr.min()}..{yr.max()} height {yr.max()-yr.min()+1}')

report('BLUE', blue)
report('GREEN', green)
