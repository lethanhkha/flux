import os
import sys
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

def generate_assets():
    base_dir = Path(__file__).resolve().parent.parent
    public_dir = base_dir / "public"
    public_dir.mkdir(parents=True, exist_ok=True)
    scripts_dir = base_dir / "scripts"

    favicon_svg = public_dir / "favicon.svg"
    og_template = scripts_dir / "og-template.html"

    print(f"[*] Base dir: {base_dir}")
    print(f"[*] Public dir: {public_dir}")

    with sync_playwright() as p:
        browser = p.chromium.launch()

        # 1. Generate OG image (1200x630)
        print("[*] Generating Open Graph Image (1200x630)...")
        page = browser.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=2)
        page.goto(f"file:///{og_template.as_posix()}")
        page.wait_for_timeout(500)
        og_dest = public_dir / "og-image.png"
        page.screenshot(path=str(og_dest), type="png")
        print(f"[+] OG Image saved: {og_dest}")

        # 2. Render Favicon SVG to master high-res PNG (512x512)
        print("[*] Rendering Master Favicon (512x512)...")
        icon_page = browser.new_page(viewport={"width": 512, "height": 512}, device_scale_factor=2)
        
        # HTML wrapper for SVG to render transparently at exact square size
        svg_content = favicon_svg.read_text(encoding="utf-8")
        html_wrapper = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            * {{ margin: 0; padding: 0; }}
            html, body {{ width: 512px; height: 512px; background: transparent; overflow: hidden; }}
            svg {{ width: 512px; height: 512px; display: block; }}
          </style>
        </head>
        <body>
          {svg_content}
        </body>
        </html>
        """
        icon_page.set_content(html_wrapper)
        icon_page.wait_for_timeout(300)
        
        master_png_512 = public_dir / "android-chrome-512x512.png"
        icon_page.screenshot(path=str(master_png_512), omit_background=True)
        print(f"[+] Master 512x512 icon saved: {master_png_512}")

        browser.close()

    # 3. Use Pillow to resize and generate all icon sizes
    print("[*] Processing icons with Pillow...")
    img512 = Image.open(master_png_512)

    # 192x192
    img192 = img512.resize((192, 192), Image.Resampling.LANCZOS)
    img192.save(public_dir / "android-chrome-192x192.png", "PNG")
    print("[+] android-chrome-192x192.png generated")

    # apple-touch-icon 180x180
    img180 = img512.resize((180, 180), Image.Resampling.LANCZOS)
    img180.save(public_dir / "apple-touch-icon.png", "PNG")
    print("[+] apple-touch-icon.png generated")

    # favicon-32x32
    img32 = img512.resize((32, 32), Image.Resampling.LANCZOS)
    img32.save(public_dir / "favicon-32x32.png", "PNG")
    print("[+] favicon-32x32.png generated")

    # favicon-16x16
    img16 = img512.resize((16, 16), Image.Resampling.LANCZOS)
    img16.save(public_dir / "favicon-16x16.png", "PNG")
    print("[+] favicon-16x16.png generated")

    # favicon.ico (multi-size 16, 32, 48)
    img48 = img512.resize((48, 48), Image.Resampling.LANCZOS)
    ico_dest = public_dir / "favicon.ico"
    img512.save(ico_dest, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"[+] Multi-size favicon.ico generated: {ico_dest}")

    print("\n[SUCCESS] All web visual assets generated successfully!")

if __name__ == "__main__":
    generate_assets()
