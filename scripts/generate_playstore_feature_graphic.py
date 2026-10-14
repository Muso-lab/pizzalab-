import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('playstore_assets', exist_ok=True)

width = 1024
height = 500

# Create base RGB image
img = Image.new('RGB', (width, height), color='#0f141c')
draw = ImageDraw.Draw(img)

# Radial / angular ambient background glow
for r in range(400, 0, -8):
    alpha = int(45 * (1 - r / 400))
    color = (230, 57, 70)  # Primary crimson glow
    draw.ellipse([width - 320 - r, height // 2 - r, width - 320 + r, height // 2 + r], fill=color)

for r in range(300, 0, -6):
    color = (244, 162, 97)  # Amber warm core
    draw.ellipse([width - 320 - r, height // 2 - r, width - 320 + r, height // 2 + r], fill=color)

# Draw decorative subtle grid lines
for x in range(0, width, 40):
    draw.line([(x, 0), (x, height)], fill='#182232', width=1)
for y in range(0, height, 40):
    draw.line([(0, y), (width, y)], fill='#182232', width=1)

# Gradient overlay from left to right to make text punchy
for x in range(width):
    ratio = x / width
    if ratio < 0.65:
        overlay_darkness = int(240 * (1 - (ratio / 0.65) * 0.4))
        # darken left area
        pass

# Paste icon if available
icon_path = 'icons/icon-512.png'
if os.path.exists(icon_path):
    icon = Image.open(icon_path).convert('RGBA')
    icon = icon.resize((240, 240), Image.Resampling.LANCZOS)
    img.paste(icon, (width - 360, (height - 240) // 2), icon)

# Fonts
font_title = None
font_sub = None
font_badge = None

# Try loading standard system fonts
system_font_paths = [
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/calibrib.ttf"
]
reg_font_paths = [
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/calibri.ttf"
]

for p in system_font_paths:
    if os.path.exists(p):
        try:
            font_title = ImageFont.truetype(p, 54)
            font_badge = ImageFont.truetype(p, 18)
            break
        except Exception:
            pass

for p in reg_font_paths:
    if os.path.exists(p):
        try:
            font_sub = ImageFont.truetype(p, 22)
            break
        except Exception:
            pass

if not font_title:
    font_title = ImageFont.load_default()
if not font_sub:
    font_sub = ImageFont.load_default()
if not font_badge:
    font_badge = ImageFont.load_default()

# Text Left-aligned
x_text = 70
y_top = 115

# Badge "CALCOLATORE SCIENTIFICO"
badge_text = "CALCOLATORE SCIENTIFICO IMPASTI"
draw.rounded_rectangle([x_text, y_top, x_text + 340, y_top + 34], radius=6, fill='#1e293b', outline='#e63946', width=2)
draw.text((x_text + 16, y_top + 7), badge_text, fill='#f4a261', font=font_badge)

# Title
draw.text((x_text, y_top + 50), "PizzaLab Scientifico", fill='#ffffff', font=font_title)

# Subtitle
draw.text((x_text, y_top + 125), "Reologia delle Farine • Cinetica • Termodinamica TFI", fill='#cbd5e1', font=font_sub)
draw.text((x_text, y_top + 160), "Napoletana STG • Canotto • Biga 100% • Teglia Romana", fill='#94a3b8', font=font_sub)

# Bottom Feature Pills
features = ["100% Offline", "Zero Decimali", "Forno 250°C & 500°C", "Stima Prudenziale"]
fx = x_text
for feat in features:
    bbox = draw.textbbox((0, 0), feat, font=font_badge)
    fw = bbox[2] - bbox[0]
    draw.rounded_rectangle([fx, y_top + 215, fx + fw + 24, y_top + 252], radius=18, fill='#172133', outline='#334155', width=1)
    draw.text((fx + 12, y_top + 224), feat, fill='#38bdf8', font=font_badge)
    fx += fw + 36

out_path = 'playstore_assets/feature_graphic_1024x500.png'
img.save(out_path, 'PNG')
print(f"Grafica Funzioni Play Store generata con successo: {out_path} ({width}x{height})")
