/**
 * Evidence capture (G1 revision 1): load each camera preset in headless Chrome,
 * save PNG screenshots to evidence/g1-r1/, and dump console + runtime state.
 * Dev tool only — not part of the game runtime.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://127.0.0.1:8123/index.html';
const OUT = path.join(__dirname, '..', 'evidence', 'p3-style');

// Each shot: name + query string (camera preset, optional prompt overlay).
const shots = [
  { name: 'overview', qs: 'cam=overview' },
  { name: 'incoming', qs: 'cam=viewscreen' },
  { name: 'crew', qs: 'cam=crew' },
  { name: 'operation', qs: 'cam=consoles' },
  { name: 'debrief', qs: 'cam=comms' },
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--enable-unsafe-swiftshader',
      '--use-angle=swiftshader',
      '--hide-scrollbars',
      '--force-color-profile=srgb',
    ],
  });

  const summary = {};
  const allLogs = [];

  for (const shot of shots) {
    const page = await browser.newPage();
    const consoleLines = [];
    const errors = [];

    page.on('console', (msg) => consoleLines.push(msg.type() + ': ' + msg.text()));
    page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));
    page.on('requestfailed', (req) => errors.push('requestfailed: ' + req.url() + ' ' + (req.failure() && req.failure().errorText)));

    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
    await page.goto(BASE + '?' + shot.qs, { waitUntil: 'networkidle0', timeout: 30000 });

    await page.waitForFunction(() => window.OpenStars && window.OpenStars.app && window.OpenStars.app.frame > 5, { timeout: 20000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1200));

    const evidence = await page.evaluate(() => {
      const app = window.OpenStars && window.OpenStars.app;
      if (!app) return { booted: false };
      const gd = app.graphicsDevice;
      const gl = gd.gl;
      let pixelStats = null;
      try {
        const w = gd.width, h = gd.height;
        const step = 32;
        const buf = new Uint8Array(4);
        let minL = 999, maxL = -1, sumL = 0, n = 0;
        const buckets = new Set();
        for (let y = step / 2; y < h; y += step) {
          for (let x = step / 2; x < w; x += step) {
            gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
            const l = 0.2126 * buf[0] + 0.7152 * buf[1] + 0.0722 * buf[2];
            minL = Math.min(minL, l); maxL = Math.max(maxL, l); sumL += l; n++;
            buckets.add((buf[0] >> 5) + ',' + (buf[1] >> 5) + ',' + (buf[2] >> 5));
          }
        }
        pixelStats = { samples: n, minLum: Math.round(minL), maxLum: Math.round(maxL), avgLum: Math.round(sumL / n), buckets: buckets.size };
      } catch (e) { pixelStats = 'readPixels-error: ' + e.message; }
      let entityCount = 0, meshInstances = 0;
      app.root.forEach((e) => { entityCount++; if (e.render) meshInstances += e.render.meshInstances.length; });
      const camPos = app.root.findByName('player/camera');
      return {
        booted: true,
        frame: app.frame,
        buffer: gd.width + 'x' + gd.height,
        canvas: gd.canvas.width + 'x' + gd.canvas.height,
        dpr: window.devicePixelRatio || 1,
        renderer: (() => { try { return gl.getParameter(gl.RENDERER); } catch (e) { return 'n/a'; } })(),
        entityCount, meshInstances,
        contractVersion: window.OpenStars.Contract.version,
        interactables: Array.from(window.OpenStars.Contract.interactables.keys()),
        maraPos: (() => { const e = app.root.findByName('crew/mara-vale'); return e ? e.getPosition().toString() : null; })(),
        pixelStats,
      };
    });

    const shotPath = path.join(OUT, shot.name + '.png');
    await page.screenshot({ path: shotPath });
    evidence.shotPath = 'evidence/p3-style/' + shot.name + '.png';

    summary[shot.name] = evidence;
    allLogs.push('===== ' + shot.name + ' =====');
    allLogs.push(...consoleLines, ...errors);
    console.log('captured', shot.name, JSON.stringify(evidence));

    await page.close();
  }

  fs.writeFileSync(path.join(OUT, 'capture-summary.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(OUT, 'console.log'), allLogs.join('\n'));

  await browser.close();
  console.log('DONE');
}

main().catch((e) => { console.error('CAPTURE FAILED:', e); process.exit(1); });
