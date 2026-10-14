import os
from PIL import Image, ImageDraw

def draw_pizza_elements(draw, dim, content_scale=0.55):
    cx, cy = dim // 2, dim // 2 + int(8 * content_scale * (dim / 512))

    # Pizza Crust: Golden/Amber polygon
    top = (cx, cy - int(160 * content_scale * (dim / 512)))
    bot_right = (cx + int(150 * content_scale * (dim / 512)), cy + int(130 * content_scale * (dim / 512)))
    bot_left = (cx - int(150 * content_scale * (dim / 512)), cy + int(130 * content_scale * (dim / 512)))

    # Arc crust base
    crust_color = (231, 111, 81, 255)
    draw.polygon([top, bot_right, (cx, cy + int(145 * content_scale * (dim / 512))), bot_left], fill=crust_color)

    # Cheese layer
    cheese_top = (cx, cy - int(120 * content_scale * (dim / 512)))
    cheese_br = (cx + int(125 * content_scale * (dim / 512)), cy + int(115 * content_scale * (dim / 512)))
    cheese_bl = (cx - int(125 * content_scale * (dim / 512)), cy + int(115 * content_scale * (dim / 512)))
    draw.polygon([cheese_top, cheese_br, (cx, cy + int(125 * content_scale * (dim / 512))), cheese_bl], fill=(255, 209, 102, 255))

    # Pepperoni / Scientific atoms
    pep_color = (230, 57, 70, 255)
    pep_hi = (244, 162, 97, 200)

    # Center atom
    c_r = int(28 * content_scale * (dim / 512))
    draw.ellipse([cx - c_r, cy - int(15 * content_scale * (dim / 512)) - c_r,
                  cx + c_r, cy - int(15 * content_scale * (dim / 512)) + c_r], fill=pep_color)
    draw.ellipse([cx + int(6 * content_scale) - c_r // 3, cy - int(20 * content_scale * (dim / 512)) - c_r // 3,
                  cx + int(6 * content_scale) + c_r // 3, cy - int(20 * content_scale * (dim / 512)) + c_r // 3], fill=pep_hi)

    # Left atom
    lx = cx - int(60 * content_scale * (dim / 512))
    ly = cy + int(60 * content_scale * (dim / 512))
    draw.ellipse([lx - c_r, ly - c_r, lx + c_r, ly + c_r], fill=pep_color)

    # Right atom
    rx = cx + int(60 * content_scale * (dim / 512))
    ry = cy + int(60 * content_scale * (dim / 512))
    draw.ellipse([rx - c_r, ry - c_r, rx + c_r, ry + c_r], fill=pep_color)

    # Basil leaves
    basil_color = (42, 157, 143, 255)
    b1_x, b1_y = cx - int(25 * content_scale * (dim / 512)), cy + int(20 * content_scale * (dim / 512))
    draw.ellipse([b1_x - int(16 * content_scale), b1_y - int(10 * content_scale),
                  b1_x + int(16 * content_scale), b1_y + int(10 * content_scale)], fill=basil_color)

    b2_x, b2_y = cx + int(25 * content_scale * (dim / 512)), cy + int(25 * content_scale * (dim / 512))
    draw.ellipse([b2_x - int(16 * content_scale), b2_y - int(10 * content_scale),
                  b2_x + int(16 * content_scale), b2_y + int(10 * content_scale)], fill=basil_color)

    # Atomic scientific orbit ellipse (rotated)
    orbit_img = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    orbit_draw = ImageDraw.Draw(orbit_img)
    ow = int(160 * content_scale * (dim / 512))
    oh = int(55 * content_scale * (dim / 512))
    orbit_thick = max(2, int(5 * (dim / 512)))
    orbit_draw.ellipse([cx - ow, cy + int(10 * content_scale * (dim / 512)) - oh,
                        cx + ow, cy + int(10 * content_scale * (dim / 512)) + oh],
                       outline=(56, 189, 248, 230), width=orbit_thick)

    node_r = int(10 * (dim / 512))
    orbit_draw.ellipse([cx - ow - node_r, cy + int(10 * content_scale * (dim / 512)) - node_r,
                        cx - ow + node_r, cy + int(10 * content_scale * (dim / 512)) + node_r], fill=(56, 189, 248, 255))
    orbit_draw.ellipse([cx + ow - node_r, cy + int(10 * content_scale * (dim / 512)) - node_r,
                        cx + ow + node_r, cy + int(10 * content_scale * (dim / 512)) + node_r], fill=(56, 189, 248, 255))

    rotated_orbit = orbit_img.rotate(18, resample=Image.BICUBIC, center=(cx, cy + int(10 * content_scale * (dim / 512))))
    return rotated_orbit

def create_adaptive_foreground(size=432):
    # Android Adaptive foreground requires 108dp canvas with 72dp safe zone (~66% diameter)
    scale = 4
    dim = size * scale
    img = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Content scale 0.58 perfectly centers artwork inside the 72dp safe zone
    orbit = draw_pizza_elements(draw, dim, content_scale=0.58)
    img.paste(orbit, (0, 0), orbit)

    return img.resize((size, size), Image.Resampling.LANCZOS)

def create_legacy_icon(size=192, is_round=False):
    # Full bleed background with #0f141c to ensure NO white square or borders on legacy launchers
    scale = 4
    dim = size * scale
    img = Image.new("RGBA", (dim, dim), (15, 20, 28, 255))
    draw = ImageDraw.Draw(img)

    orbit = draw_pizza_elements(draw, dim, content_scale=0.62)
    img.paste(orbit, (0, 0), orbit)

    if is_round:
        mask = Image.new("L", (dim, dim), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse([0, 0, dim, dim], fill=255)
        # Apply circle mask
        res = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
        res.paste(img, (0, 0), mask)
        return res.resize((size, size), Image.Resampling.LANCZOS)

    return img.resize((size, size), Image.Resampling.LANCZOS)

def generate_android_res():
    res_base = "android-app/app/src/main/res"

    # Android density buckets
    # Adaptive foreground sizes (108dp base)
    # Legacy icon sizes (48dp base)
    density_map = {
        "mipmap-mdpi": {"legacy": 48, "foreground": 108},
        "mipmap-hdpi": {"legacy": 72, "foreground": 162},
        "mipmap-xhdpi": {"legacy": 96, "foreground": 216},
        "mipmap-xxhdpi": {"legacy": 144, "foreground": 324},
        "mipmap-xxxhdpi": {"legacy": 192, "foreground": 432},
    }

    print("Generazione icone Android (Adaptive + Legacy)...")

    for bucket, sizes in density_map.items():
        bucket_dir = os.path.join(res_base, bucket)
        os.makedirs(bucket_dir, exist_ok=True)

        # 1. Adaptive Icon Foreground (Transparent with safe-zone centered pizza)
        fg = create_adaptive_foreground(sizes["foreground"])
        fg.save(os.path.join(bucket_dir, "ic_launcher_foreground.png"), "PNG", optimize=True)

        # 2. Legacy icons (Solid #0f141c background, no white square triggers)
        legacy_std = create_legacy_icon(sizes["legacy"], is_round=False)
        legacy_std.save(os.path.join(bucket_dir, "ic_launcher.png"), "PNG", optimize=True)

        legacy_round = create_legacy_icon(sizes["legacy"], is_round=True)
        legacy_round.save(os.path.join(bucket_dir, "ic_launcher_round.png"), "PNG", optimize=True)

        print(f"  [OK] {bucket}: foreground {sizes['foreground']}x{sizes['foreground']}, legacy {sizes['legacy']}x{sizes['legacy']}")

    # 3. Create colors.xml with ic_launcher_background = #0f141c
    values_dir = os.path.join(res_base, "values")
    os.makedirs(values_dir, exist_ok=True)
    colors_xml_path = os.path.join(values_dir, "colors.xml")
    with open(colors_xml_path, "w", encoding="utf-8") as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0f141c</color>
</resources>
''')
    print("  [OK] values/colors.xml creato con background #0f141c")

    # 4. Create mipmap-anydpi-v26 for Android 8.0+ (Oreo to Android 16)
    v26_dir = os.path.join(res_base, "mipmap-anydpi-v26")
    os.makedirs(v26_dir, exist_ok=True)

    ic_launcher_xml = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
'''
    with open(os.path.join(v26_dir, "ic_launcher.xml"), "w", encoding="utf-8") as f:
        f.write(ic_launcher_xml)

    with open(os.path.join(v26_dir, "ic_launcher_round.xml"), "w", encoding="utf-8") as f:
        f.write(ic_launcher_xml)

    print("  [OK] mipmap-anydpi-v26/ic_launcher.xml e ic_launcher_round.xml creati!")

    # 5. Splash drawable
    drawable_dir = os.path.join(res_base, "drawable")
    os.makedirs(drawable_dir, exist_ok=True)
    splash_icon = create_legacy_icon(192, is_round=False)
    splash_icon.save(os.path.join(drawable_dir, "ic_splash_icon.png"), "PNG", optimize=True)
    print("  [OK] drawable/ic_splash_icon.png creato!")

    print("Tutte le icone Android (Adaptive e standard) sono pronte con zero bordi bianchi!")

if __name__ == "__main__":
    generate_android_res()
