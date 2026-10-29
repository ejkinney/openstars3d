# P3 style lock implementation handoff (G2 corrections, renderer-owned)

Owner: Geordi (renderer/UI skin). 2026-10-29. Gate: G2 (P3 Style Lock & Visual QA).

**No G2 pass claimed.** Guinan blocked G2 on the current captures and issued the six
P3 corrections via `docs/G2-style.md`. This handoff covers Geordi's implementation of
those corrections. Worf independently re-verifies after this handoff; Guinan owns the
P3 visual verdict; neither pass may be claimed here.

## Scope and compliance

- Implements, renderer-side only: palette unification, viewscreen emissive/3-zone
  telemetry, console hooded displays, crew silhouettes + bridge architecture, DOM modal/
  label restyle, and the post-P3 capture set.
- No gameplay-rule edits (`src/gameplay/*`, `src/contract.js` encounter logic untouched).
- No live OpenCode/DeepSeek calls. Offline dialogue fallback and optional-AI labels kept
  verbatim.
- `Contract.version` remains **0.1.0**; all seven canonical entity IDs and the console/crew
  world AABBs are unchanged; interaction hook signatures unchanged; display hooks additive.

## Changed paths

- `src/scene.js` — locked P3 palette materials (`#262932` deck, `#3b3d46` bulkhead upper,
  `#222630` trim/ribs/pedestals, `#462c33` command carpet, `#5e2f34`/`#353036` chair),
  dim viewscreen slab (`#0b1018` / `#162c4a` / intensity 0.65) + reframed bezel bars,
  console sloped hood + cheek plates, ceiling coves + perimeter soffit, bulkhead ribs +
  bridge arch, central command carpet, locked division accents
  (Helm `#f0a83e`, Science `#4da3ff`, Engineering `#ee6445`, Comms `#3ad896`),
  locked P3 lighting (ambient 0.28/0.31/0.38, key 1.15 warm, cool screen fill 0.55, warm
  command omni 0.85).
- `src/displays.js` — structured 3-zone forward viewscreen (header bar, directive +
  TIME/ENERGY/HULL gauge cards, bottom status strip) on the reframed `1536x486` canvas;
  three-band physical consoles (header band, telemetry body, action pills with `▸ `)
  on the angled `1024x400` canvas; display surface backing `#070d17`.
- `src/presenter.js` — hide `#labels` while start/panel/paused; theme panel border/title/
  flavour accent from the open interactable; labels return on trusted re-entry into walking.
- `src/main.js` — crew label role text uses the division accent; added debug camera preset
  `comms`.
- `src/contract.js` — crew accent hexes unified to the locked division values; registry
  entries may carry an additive `accent` field (console stations).
- `index.html` — dual font stacks (`--font-sans`, `--font-display`, `--font-mono`),
  `.briefing-label` authoritative eyebrow badge, canonical `#panel-text` card, subordinate
  `#panel-source`/`#panel-flavour`, docked `#panel` (lower-right, blurred, opaque) so it no
  longer slices the viewscreen.
- `docs/scene-contract.md` — console accent hexes updated to the locked P3 values.
- `tools/capture.js` — P3 capture set pointed at `evidence/p3-style/`.

## Checks actually run

- `node --check` on all `src/`, `server/`, `tools/`, `tests/` JS: pass.
- `node --test tests/p2-systems.test.cjs tests/p2-generation.test.cjs tests/p2-live-validation.test.cjs`:
  **21/21 pass** (encounter/dialogue/runtime/server suites; no live provider calls).
- Capture run (`node tools/capture.js` against the local bridge on 127.0.0.1:8123):
  five shots captured under `evidence/p3-style/`, each `booted: true`, no page error, fixed
  `1280x720` buffer, contract `0.1.0`, seven interactables, pixel readback shows lit scene
  (max luminance sampled up to 244).
- Renderer input/focus paths (`src/player.js`, G1-r2 guards, presenter lock/pause/re-entry)
  were not edited; movement math, collisions and the E-once dispatch contract remain as G1-r2
  verified.

## Captures (actual files, not illustrations)

- `evidence/p3-style/overview.png`, `incoming.png`, `crew.png`, `operation.png`, `debrief.png`
- `evidence/p3-style/capture-summary.json`, `evidence/p3-style/console.log`

## Known limitations

- Headless software rendering (SwiftShader) only; no perf/G4 measurement here.
- Debrief-phase frame content is gameplay-state driven; the `debrief` capture ran at boot
  state (phase `incoming`), so its frame shows the incoming view — a debrief-phase frame
  requires the pointer-locked walk/consult route, which headless capture cannot complete.
- Visual review of the new captures was numeric (pixel stats), not eyeballed in this session.

## Next

Worf performs the independent retest after this handoff; Guinan owns the P3 visual verdict;
no G2 pass claimed. Do not advance gameplay/style or contact other teams.
