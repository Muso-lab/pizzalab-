import os
from PIL import Image

def generate_android_res():
    base_icon_path = "icons/icon-512.png"
    maskable_icon_path = "icons/icon-maskable-512.png"
    if not os.path.exists(base_icon_path):
        print("Base icon not found!")
        return

    base_img = Image.open(base_icon_path)
    mask_img = Image.open(maskable_icon_path) if os.path.exists(maskable_icon_path) else base_img

    buckets = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }

    res_base = "android-app/app/src/main/res"

    for bucket, size in buckets.items():
        bucket_dir = os.path.join(res_base, bucket)
        os.makedirs(bucket_dir, exist_ok=True)

        # Standard icon
        icon_resized = base_img.resize((size, size), Image.Resampling.LANCZOS)
        icon_resized.save(os.path.join(bucket_dir, "ic_launcher.png"), "PNG", optimize=True)

        # Round / maskable icon
        round_resized = mask_img.resize((size, size), Image.Resampling.LANCZOS)
        round_resized.save(os.path.join(bucket_dir, "ic_launcher_round.png"), "PNG", optimize=True)

        print(f"Created {bucket} ({size}x{size})")

    # Also create drawable for splash icon
    drawable_dir = os.path.join(res_base, "drawable")
    os.makedirs(drawable_dir, exist_ok=True)
    splash_icon = base_img.resize((192, 192), Image.Resampling.LANCZOS)
    splash_icon.save(os.path.join(drawable_dir, "ic_splash_icon.png"), "PNG", optimize=True)
    print("Created drawable/ic_splash_icon.png")

if __name__ == "__main__":
    generate_android_res()
