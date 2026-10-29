# G1 — Greybox Handoff (P1)

Status: **P1 greybox complete — awaiting Worf's G1 verification and Picard's approval.**
(Geordi does not claim G1 pass; that is Worf/Picard's call.)

Owner: Geordi. Next: Worf verifies boot / navigation / bounds / console output;
Picard reviews screenshots and approves G1 before Data's P2 begins.

## 1. What this is

A fresh, local, engine-only PlayCanvas project (no editor, no account, no old-repo
clone) rendering a walkable low-poly starship bridge with four physical consoles,
the captain's chair, a forward viewscreen, and three crew placeholders. PlayCanvas
2.23.3 is vendored at `lib/playcanvas.min.js`.

## 2. Launch (exact)

```bash
cd /Users/elliot/OpenBot/Shared/openstars-prototype-20261028
python3 -m http.server 8123 --bind 127.0.0.1
```

Then open: **http://127.0.0.1:8123/index.html**

(Equivalent: `npm start`.) The server is currently running on this machine at that
URL. Click **ENTER BRIDGE**; pointer lock begins. `WASD` move, mouse looks, `E`
interacts, `Esc` releases.

## 3. Resolution gate (per G0)

- `app.setCanvasResolution(pc.RESOLUTION_FIXED, 1280, 720)` +
  `app.setCanvasFillMode(pc.FILLMODE_KEEP_ASPECT)` + `maxPixelRatio = 1`.
- Verified: drawing buffer reports **1280×720** at devicePixelRatio **1** (headless)
  and at devicePixelRatio **2** (Retina) — buffer does not change with DPR. Aspect
  preserved via letterbox. See `src/main.js` and `evidence/capture-summary.json`.

## 4. Scene / interaction contract

Full contract: **`docs/scene-contract.md`** (code: `src/contract.js`,
`window.OpenStars.Contract`, version 0.1.0).

- 56 entities; 42 mesh instances; 7 interactables registered.
- Canonical IDs: `consoles/helm|science|engineering|comms`, `crew/mara-vale`,
  `crew/ivo-sen`, `crew/tessa-rook`, `bridge/viewscreen`, `bridge/captain-chair`,
  plus floor/ceiling/walls.
- Interaction hook for Data: `OpenStars.Contract.onInteract = (name, descriptor) => {}`
  fired on `E` over an enabled interactable. Renderer owns gaze raycast, hover
  highlight, and prompt; Data owns all gameplay meaning.

## 5. Files changed (all new)

```
index.html                  app shell + overlay UI (startup help, prompt, HUD, labels)
lib/playcanvas.min.js       vendored engine 2.23.3
src/contract.js             scene/interaction contract (Data's surface)
src/scene.js                bridge greybox construction + materials/lights
src/player.js               first-person camera, walk, collision, gaze raycast
src/main.js                 boot, resolution gate, overlay, debug camera presets
docs/scene-contract.md      contract spec
docs/G1-greybox-handoff.md  this file
evidence/overview.png       screenshot (high rear view)
evidence/viewscreen.png     screenshot (chair foreground + viewscreen)
evidence/consoles.png       screenshot (helm/comms consoles forward)
evidence/crew.png           screenshot (port crew area)
evidence/capture-summary.json  runtime evidence (buffer, entities, pixel stats)
evidence/console.log        captured console (evidence log, no errors)
tools/capture.js            headless screenshot/evidence harness (dev tool)
package.json                npm metadata + start/capture scripts
```

## 6. Checks actually run

1. **Boot**: page loads, app starts, no JS/console errors (captured in
   `evidence/console.log`).
2. **Resolution gate**: drawing buffer and canvas both `1280×720` at dpr 1 and dpr 2.
3. **Scene graph**: 56 entities, 42 mesh instances present and enabled.
4. **Contract**: 7 interactables registered; contract version 0.1.0 logged.
5. **Rendering**: pixel readback of the 1280×720 buffer shows non-uniform scene
   content (12 luminance/color buckets; floor/walls dark, viewscreen and console
   accents bright). Targeted samples confirm glowing blue viewscreen at the top of
   the `viewscreen` shot and the captain chair in the foreground.
6. **Render loop**: 49–100 frames rendered per headless load.

## 7. Known limitations (explicit)

- **Screenshots are headless (software/SwiftShader) captures** via `tools/capture.js`;
  visually correct but NOT a performance measurement. Real-GPU FPS and the G4 perf
  gate belong to Worf on the actual machine/browser (Chrome/Safari/Firefox).
- **Shadows disabled** (greybox), **MSAA off**, `preserveDrawingBuffer` on (for
  readback verification). All easy to change for G4.
- **No gameplay**: interaction `E` only fires the Data hook (no encounter logic);
  crew/consoles are static placeholders.
- **Flat movement only** — no vertical travel, no jumping (bridge is single-level).
- DeepSeek AI is intentionally absent (per G0, later phase).

## 8. What I need next

Worf: run `python3 -m http.server 8123 --bind 127.0.0.1`, open the URL, and verify
boot, WASD navigation, wall/console bounds, and the `[E]` prompt appearing over
consoles/crew. Picard: review the screenshots and approve G1. Data: consume
`docs/scene-contract.md` for P2.
