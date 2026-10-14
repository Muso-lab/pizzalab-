import math
from PIL import Image, ImageDraw, ImageFilter

def create_pizzalab_icon(size=512, maskable=False):
    # Base image 4x supersampled for crisp anti-aliasing
    scale = 4
    dim = size * scale
    img = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background gradient simulation
    bg = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg)
    for y in range(dim):
        factor = y / dim
        r = int(28 * (1 - factor) + 15 * factor)
        g = int(31 * (1 - factor) + 17 * factor)
        b = int(38 * (1 - factor) + 21 * factor)
        bg_draw.line([(0, y), (dim, y)], fill=(r, g, b, 255))

    # Mask for rounded rect (or full circle / square if maskable)
    mask = Image.new("L", (dim, dim), 0)
    mask_draw = ImageDraw.Draw(mask)
    if maskable:
        # Full square or slightly rounded for maskable (Android clips safe zone)
        mask_draw.rectangle([0, 0, dim, dim], fill=255)
    else:
        radius = int(112 * (dim / 512))
        mask_draw.rounded_rectangle([0, 0, dim, dim], radius=radius, fill=255)

    img.paste(bg, (0, 0), mask)

    # Stroke border
    border_draw = ImageDraw.Draw(img)
    if not maskable:
        border_w = int(8 * (dim / 512))
        radius = int(112 * (dim / 512))
        border_draw.rounded_rectangle(
            [border_w // 2, border_w // 2, dim - border_w // 2, dim - border_w // 2],
            radius=radius,
            outline=(255, 126, 64, 80),
            width=border_w
        )

    # Pizza slice coordinates
    # Center translation & scale
    content_scale = 0.65 if maskable else 0.78
    cx, cy = dim // 2, dim // 2 + int(10 * (dim / 512))

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

    # Electrons / Nodes on orbit
    node_r = int(10 * (dim / 512))
    orbit_draw.ellipse([cx - ow - node_r, cy + int(10 * content_scale * (dim / 512)) - node_r,
                        cx - ow + node_r, cy + int(10 * content_scale * (dim / 512)) + node_r], fill=(56, 189, 248, 255))
    orbit_draw.ellipse([cx + ow - node_r, cy + int(10 * content_scale * (dim / 512)) - node_r,
                        cx + ow + node_r, cy + int(10 * content_scale * (dim / 512)) + node_r], fill=(56, 189, 248, 255))

    # Rotate orbit
    rotated_orbit = orbit_img.rotate(18, resample=Image.BICUBIC, center=(cx, cy + int(10 * content_scale * (dim / 512))))
    img.paste(rotated_orbit, (0, 0), rotated_orbit)

    # Downsample to target size with Lanczos filter for ultra-crisp result
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

if __name__ == "__main__":
    icon_512 = create_pizzalab_icon(512, maskable=False)
    icon_512.save("icons/icon-512.png", "PNG", optimize=True)
    print("Created icons/icon-512.png")

    icon_192 = create_pizzalab_icon(192, maskable=False)
    icon_192.save("icons/icon-192.png", "PNG", optimize=True)
    print("Created icons/icon-192.png")

    maskable_512 = create_pizzalab_icon(512, maskable=True)
    maskable_512.save("icons/icon-maskable-512.png", "PNG", optimize=True)
    print("Created icons/icon-maskable-512.png")

    maskable_192 = create_pizzalab_icon(192, maskable=True)
    maskable_192.save("icons/icon-maskable-192.png", "PNG", optimize=True)
    print("Created icons/icon-maskable-192.png")
