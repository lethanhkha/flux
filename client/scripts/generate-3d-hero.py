import os
from pathlib import Path
from playwright.sync_api import sync_playwright

def generate_3d_hero():
    base_dir = Path(__file__).resolve().parent.parent
    brand_dir = base_dir / "public" / "brand"
    brand_dir.mkdir(parents=True, exist_ok=True)
    output_png = brand_dir / "flux-hero-3d.png"

    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 1920px;
          height: 1080px;
          background: #070A12;
          overflow: hidden;
          font-family: sans-serif;
        }
        canvas {
          display: block;
          width: 1920px;
          height: 1080px;
        }
      </style>
    </head>
    <body>
      <canvas id="c" width="1920" height="1080"></canvas>
      <script>
        const canvas = document.getElementById('c');
        const ctx = canvas.getContext('2d');

        // 1. Deep Space Background & Radial Ambient Flares
        const bgGrad = ctx.createRadialGradient(960, 540, 100, 960, 540, 1200);
        bgGrad.addColorStop(0, '#0F172A');
        bgGrad.addColorStop(0.5, '#0B0F19');
        bgGrad.addColorStop(1, '#05070D');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1920, 1080);

        // Ambient Volumetric Color Flares
        function drawFlare(x, y, r, color, alpha) {
          const flare = ctx.createRadialGradient(x, y, 0, x, y, r);
          flare.addColorStop(0, color.replace('ALPHA', alpha));
          flare.addColorStop(0.5, color.replace('ALPHA', alpha * 0.4));
          flare.addColorStop(1, 'transparent');
          ctx.fillStyle = flare;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }

        drawFlare(400, 300, 600, 'rgba(56, 189, 248, ALPHA)', 0.25);  // Sky Cyan
        drawFlare(1100, 600, 750, 'rgba(99, 102, 241, ALPHA)', 0.3); // Electric Indigo
        drawFlare(1500, 400, 550, 'rgba(16, 185, 129, ALPHA)', 0.22); // Emerald Green
        drawFlare(750, 750, 600, 'rgba(168, 85, 247, ALPHA)', 0.18); // Violet

        // 2. Grid Horizon Perspective Lines
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= 1920; x += 60) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 1080);
          ctx.stroke();
        }
        for (let y = 0; y <= 1080; y += 60) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(1920, y);
          ctx.stroke();
        }
        ctx.restore();

        // 3. Multi-Layer 3D Kinetic Ribbon Waves
        function drawRibbon(points, width, strokeGrad, fillGrad, shadowColor) {
          ctx.save();
          ctx.shadowColor = shadowColor;
          ctx.shadowBlur = 35;
          ctx.lineWidth = width;
          ctx.strokeStyle = strokeGrad;

          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length - 2; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
          }
          ctx.stroke();
          ctx.restore();
        }

        // Ribbon 1: Deep Indigo -> Cyan Main Swirl
        const grad1 = ctx.createLinearGradient(200, 800, 1700, 250);
        grad1.addColorStop(0, '#6366F1');
        grad1.addColorStop(0.35, '#38BDF8');
        grad1.addColorStop(0.7, '#818CF8');
        grad1.addColorStop(1, '#C084FC');

        const pts1 = [
          { x: 100, y: 850 },
          { x: 450, y: 700 },
          { x: 700, y: 350 },
          { x: 1050, y: 300 },
          { x: 1350, y: 650 },
          { x: 1650, y: 550 },
          { x: 1850, y: 300 }
        ];
        drawRibbon(pts1, 28, grad1, null, 'rgba(56, 189, 248, 0.4)');

        // Ribbon 2: Emerald -> Cyan Liquidity Wave
        const grad2 = ctx.createLinearGradient(300, 300, 1600, 900);
        grad2.addColorStop(0, '#10B981');
        grad2.addColorStop(0.4, '#34D399');
        grad2.addColorStop(0.7, '#38BDF8');
        grad2.addColorStop(1, '#6366F1');

        const pts2 = [
          { x: 200, y: 250 },
          { x: 500, y: 400 },
          { x: 800, y: 750 },
          { x: 1200, y: 800 },
          { x: 1550, y: 450 },
          { x: 1800, y: 600 }
        ];
        drawRibbon(pts2, 20, grad2, null, 'rgba(16, 185, 129, 0.45)');

        // Ribbon 3: High-energy Accent Filament
        const grad3 = ctx.createLinearGradient(400, 600, 1500, 400);
        grad3.addColorStop(0, '#A855F7');
        grad3.addColorStop(0.5, '#EC4899');
        grad3.addColorStop(1, '#F59E0B');

        const pts3 = [
          { x: 350, y: 620 },
          { x: 650, y: 520 },
          { x: 950, y: 480 },
          { x: 1250, y: 380 },
          { x: 1550, y: 480 }
        ];
        drawRibbon(pts3, 8, grad3, null, 'rgba(236, 72, 153, 0.5)');

        // 4. 3D Iridescent Glass Spheres & Prisms
        function drawGlassSphere(x, y, r, mainColor, accentColor) {
          ctx.save();
          // Sphere outer glow shadow
          ctx.shadowColor = accentColor;
          ctx.shadowBlur = 40;

          // Base spherical gradient
          const sphereGrad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
          sphereGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          sphereGrad.addColorStop(0.2, mainColor);
          sphereGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.6)');
          sphereGrad.addColorStop(1, 'rgba(2, 6, 23, 0.9)');

          ctx.fillStyle = sphereGrad;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();

          // Glass rim highlight
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Internal Fresnel refraction ring
          const rimGrad = ctx.createRadialGradient(x, y, r * 0.7, x, y, r);
          rimGrad.addColorStop(0, 'transparent');
          rimGrad.addColorStop(0.85, accentColor);
          rimGrad.addColorStop(1, 'rgba(255, 255, 255, 0.5)');
          ctx.fillStyle = rimGrad;
          ctx.beginPath();
          ctx.arc(x, y, r - 1, 0, Math.PI * 2);
          ctx.fill();

          // Specular Glint
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.ellipse(x - r * 0.38, y - r * 0.38, r * 0.22, r * 0.12, -Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }

        // Floating Spheres in 3D Space
        drawGlassSphere(960, 480, 110, 'rgba(99, 102, 241, 0.75)', '#38BDF8'); // Centerpiece Orb
        drawGlassSphere(620, 320, 65, 'rgba(56, 189, 248, 0.8)', '#6366F1');  // Sky Orb
        drawGlassSphere(1350, 360, 80, 'rgba(16, 185, 129, 0.8)', '#34D399'); // Emerald Orb
        drawGlassSphere(420, 680, 50, 'rgba(168, 85, 247, 0.75)', '#EC4899'); // Violet Orb
        drawGlassSphere(1520, 680, 55, 'rgba(56, 189, 248, 0.7)', '#818CF8');  // Cyan Small Orb
        drawGlassSphere(820, 720, 35, 'rgba(52, 211, 153, 0.85)', '#10B981'); // Tiny Mint

        // 5. Dynamic Light Streams & Particle Constellation
        const particleCount = 280;
        for (let i = 0; i < particleCount; i++) {
          const px = Math.random() * 1920;
          const py = Math.random() * 1080;
          const pr = Math.random() * 2.8 + 0.8;
          const pAlpha = Math.random() * 0.8 + 0.2;

          let pColor = '#38BDF8';
          if (i % 3 === 0) pColor = '#10B981';
          if (i % 3 === 1) pColor = '#818CF8';
          if (i % 6 === 0) pColor = '#FFFFFF';

          ctx.save();
          ctx.shadowColor = pColor;
          ctx.shadowBlur = 12;
          ctx.fillStyle = pColor;
          ctx.globalAlpha = pAlpha;
          ctx.beginPath();
          ctx.arc(px, py, pr, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // 6. Floating Glass Prisms / Hexagons
        function drawGlassHex(x, y, size, angle, strokeColor) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 2;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.shadowColor = strokeColor;
          ctx.shadowBlur = 20;

          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            const hx = size * Math.cos(a);
            const hy = size * Math.sin(a);
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        drawGlassHex(1150, 280, 50, 0.4, 'rgba(56, 189, 248, 0.6)');
        drawGlassHex(720, 600, 42, -0.2, 'rgba(99, 102, 241, 0.6)');
        drawGlassHex(1280, 640, 36, 0.8, 'rgba(16, 185, 129, 0.55)');

        // 7. Subtle Cinematic Vignette
        const vignette = ctx.createRadialGradient(960, 540, 600, 960, 540, 1100);
        vignette.addColorStop(0, 'transparent');
        vignette.addColorStop(1, 'rgba(7, 10, 18, 0.65)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, 1920, 1080);
      </script>
    </body>
    </html>
    """

    print("[*] Launching Playwright to render 1920x1080 3D Abstract Hero...")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
        page.set_content(html_content)
        page.wait_for_timeout(800)
        page.screenshot(path=str(output_png), type="png")
        browser.close()

    print(f"[SUCCESS] 3D Abstract Hero Visual generated: {output_png} ({output_png.stat().st_size} bytes)")

if __name__ == "__main__":
    generate_3d_hero()
