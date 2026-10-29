# G1 — Independent verification (Worf)

Status: **G1 NOT PASS — 2 blocking defects, 1 evidence defect, 1 usability defect.**
Picard records the gate; this document is evidence only. No implementation file was
edited by QA. Builder claims were re-derived independently and are labelled below as
*verified* or *not reproduced*.

Owner of this document: Worf. Verification run: 2026-10-28, 17:34–17:56Z.

## 1. Recommendation

Do not advance to P2 on this build. D1 and D2 must be fixed by Geordi and
re-verified; D3 (debug presets) must be corrected so handoff captures can be
trusted; D4 is a layout decision for Geordi/Picard. The contract, colliders, gaze,
prompt and single-`E` dispatch are sound and need no change.

## 2. Environment (recorded, not claimed)

| Item | Value |
| --- | --- |
| Machine | Apple M1, macOS 26.6 (25G72), built-in Retina display 2560×1600 |
| Panel refresh | 60 Hz (`SyncRate` 3932160, fixed; no VRR) |
| Server | `python3 -m http.server 8123 --bind 127.0.0.1`, PID 91880, already running; QA did not start a second one |
| URL | http://127.0.0.1:8123/index.html |
| Browsers | Chrome 152.0.7977.167 (throwaway profile), Safari (system), Firefox (throwaway profile) |
| Engine | PlayCanvas 2.23.3 vendored |
| Contract | version 0.1.0, 56 entities, 7 interactables |

Chrome and Firefox runs used isolated throwaway profiles (`--user-data-dir=/tmp/...`,
`-profile /tmp/...`). The user's own browser profiles and sessions were not modified.

## 3. Result summary

| Check | Result | Evidence |
| --- | --- | --- |
| Local startup, 3 browsers | PASS | §4.1, `*-native-preset-consoles.png` |
| Drawing buffer 1280×720 at DPR 1 and 2 | PASS (verified in 3 engines) | §4.2 |
| Console-error-free boot | PASS in Chromium; indirect in Safari/Firefox | §4.3 |
| Scene contract (IDs, 7 interactables, 56 entities) | PASS | §4.4 |
| All 7 interactions reachable + single `E` dispatch | PASS (with D4 caveat) | §4.5 |
| Gaze prompt + hover highlight | PASS | §4.6 |
| Pointer lock, `Esc` release/pause | PASS | §4.7 |
| Mouselook | PASS | §4.8 |
| WASD navigation | **FAIL — D1 (W/S inverted)** | §4.9 |
| Wall/console/chair/crew collisions and bounds | PASS | §4.10 |
| Forward viewscreen visible | **FAIL — D2 (occluded by frame)** | §4.11 |
| Delivered captures substantiate their names | **FAIL — D3 (bad presets)** | §4.12 |

Frame-rate numbers below are boot/loop sanity only and are **not** G4 performance
evidence.

## 4. Checks actually run

### 4.1 Startup
Chrome, Safari and Firefox each load `index.html`, print the in-page HUD, render the
bridge and run the update loop. All three showed a real-GPU render of the same
scene. Firefox showed its own first-run "Welcome to Firefox" modal because the
profile was new; that modal is the browser's, not the app's, and the game HUD and
render are visible behind it.

### 4.2 Resolution gate (builder claim — verified)
HUD and live `graphicsDevice` in Chrome, Safari and Firefox: `buffer 1280×720`,
`canvas 1280×720`, `dpr 2` on this Retina display. Chromium instrumentation also
reported `dpr: 2` with buffer `1280x720`, and the builder's `evidence/console.log`
records `1280x720` at DPR 1. The fixed-buffer rule holds at both DPR 1 and 2.

### 4.3 Console output (builder claim "error-free" — verified for Chromium)
Full page diagnostic capture for a Chromium session that included boot and nine
minutes of interaction (interaction tests, pose changes, 6 PNG writes): every
network entry is `GET 200` / `POST 200` (6 assets + 6 evidence writes) and every
console entry is `level: info` — the 9 `[openstars] …` boot lines only. **No
warning or error entry appeared at any point.**
Safari and Firefox console access is not available to QA without a per-browser
driver; for those two, boot is evidenced by the HUD/live render and by the update
loop reaching `120 frames` at ≈60 fps (an exception inside `app.on('update')` would
stall the HUD and the loop). Per-browser console capture is owed at G4.

### 4.4 Scene / interaction contract (verified)
`window.OpenStars.Contract` present, `version 0.1.0`; 7 interactables registered in
the documented order (`consoles/helm`, `consoles/comms`, `consoles/science`,
`consoles/engineering`, `crew/mara-vale`, `crew/ivo-sen`, `crew/tessa-rook`); 56
entities in the graph; `Contract.onInteract` is `null` after boot, i.e. no gameplay
hook is installed at G1, as specified.

### 4.5 Interactions reachable, single `E` dispatch (verified)
With `Contract.onInteract` instrumented, one `E` key press per aim produced exactly
one call with the correct canonical ID for **all seven** interactables:
`consoles/helm`, `consoles/comms`, `consoles/science`, `consoles/engineering`,
`crew/mara-vale`, `crew/ivo-sen`, `crew/tessa-rook`. Pressing `E` where nothing is
hovered dispatched nothing (0 calls). `Contract.setInteractableEnabled(id,false)` on
all seven suppressed hover (gaze resolved to `null`).

### 4.6 Prompt and hover feedback (verified)
Gazing at the science console from `(-6.0, 1.7, 1.8)` with pitch `-0.30` produced
the DOM prompt `Science Console — [E] Run a scan` at opacity 1 with the crosshair
visible; the prompt text and `[E]` verb match the registry. Crew gaze produced
`Mara Vale — [E] Speak`. Prompt only renders while the pointer is locked, which is
the documented behaviour.

### 4.7 Pointer lock and Escape (verified)
In native Chrome, activating ENTER BRIDGE (keyboard activation, Tab then Space)
dismissed the overlay, showed the crosshair (opacity 1) and locked the pointer;
mouse-look then required lock, as designed. `Escape` invoked
`document.exitPointerLock` (1 call), and a `pointerlockchange` to the unlocked state
set `isLocked()` false and hid both crosshair and prompt.

### 4.8 Mouselook (verified, correct signs)
Real `mousemove` handlers: `movementX +200` → forward `(0,0,-1)` becomes
`(0.408, 0, -0.913)` (turns right); `movementY +100` → forward `(0.399, -0.208,
-0.893)` (looks down). Yaw gain matches `sens 0.0021`. Pitch clamps to ±1.45 rad.

### 4.9 WASD navigation — **FAIL (D1)**
`W` and `S` are inverted relative to the rendered forward direction. See §5.1.
`A`/`D` strafe correctly (`D` → `+X`, `A` → `−X`).

### 4.10 Bounds and collisions (verified)
Player radius 0.34, eye height fixed 1.7. Measured stop positions match the
collider arithmetic exactly:

| Approach | Measured stop | Expected |
| --- | --- | --- |
| Strafe right at `z=3.5` | `x=+7.56` | right wall inner face 7.90 − 0.34 |
| Strafe left at `z=3.5` | `x=−7.56` | left wall inner face −7.90 + 0.34 |
| Forward to front wall | `z=−5.56` | −5.90 + 0.34 |
| Backward to rear wall | `z=+5.56` | +5.90 − 0.34 |
| Forward into captain chair | `z=+2.54` (from `z=4.8`); `z=+0.66` (from `z=0`) | chair AABB z 1.00–2.20 ± 0.34 |
| Forward into comms console | `z=−2.76` | console AABB max z −3.10 + 0.34 |
| Forward into Mara Vale | `z=−1.84` | crew AABB max z −2.18 + 0.34 |
| Forward into Ivo / Tessa | `z=+1.36` | crew AABB max z +1.02 + 0.34 |
| Strafe into science / engineering console | `x=∓4.71` | console AABB 5.05 / −5.05 ± 0.34 |

No wall clipping, no tunnelling, no fall-through; the player cannot leave the
16×12 m interior.

### 4.11 Forward viewscreen — **FAIL (D2)**
The emissive viewscreen exists, is enabled, has its mesh instance and correct
material, and is **completely hidden behind its own trim frame**. See §5.2.

### 4.12 Delivered captures — **FAIL (D3)**
`evidence/viewscreen.png` and `evidence/crew.png` are debug-preset framing errors,
not missing entities. See §5.3.

## 5. Defects (reproducible)

### D1 — W and S are inverted (blocking; owner: Geordi)
`src/player.js` `update()`: `KeyW` sets `mz -= 1`, then displacement is
`pos.x += forward.x * mz * speed * dt` and `pos.z += forward.z * mz * speed * dt`.
With `forward.z = −cos(yaw)` the product flips the sign, so `W` moves along
`−forward` (backwards) and `S` along `+forward`.

Reproduce: load the bridge, enter, hold `W` from the start position
`(0, 1.7, 4.8)`. The player walks away from the viewscreen and stops at `z=5.56`
against the rear wall. `S` walks toward the viewscreen and stops at the captain
chair (`z=2.54`). Measured: 40 frames of `W` from `z=0` → `z=+0.66` (into the
chair); 40 frames of `S` from `z=0` → `z=−2.05`. `A`/`D` are correct, so the fault
is the forward/back sign, not the basis vectors.
Expected: `W` along `+forward` (toward `−Z`, the viewscreen), `S` along `−forward`.

### D2 — forward viewscreen fully occluded by its trim frame (blocking; owner: Geordi)
Runtime measurements from the running scene:

| | half extents | world centre | z range | x range | y range |
| --- | --- | --- | --- | --- | --- |
| `bridge/viewscreen` | 5.6 × 2.0 × 0.12 | (0, 2.30, −5.95) | −6.07 … **−5.83** | −5.6 … 5.6 | 0.30 … 4.30 |
| `bridge/viewscreen/frame` | 5.85 × 2.2 × 0.08 | (0, 2.30, −5.86) | −5.94 … **−5.78** | −5.85 … 5.85 | 0.10 … 4.50 |

The frame's front face is 0.05 m closer to the player than the screen's front face
and is larger in both X and Y, so it contains the screen's front face entirely:
an emissive slab with `emissiveIntensity 2.2` is 100 % hidden behind an opaque
`matTrim` slab. Rendered confirmation: no bright blue surface appears anywhere on
the front wall from any tested viewpoint (`openstars-01-frontwall-aimed.png`,
`openstars-02-preset-consoles.png`, `chrome-native-preset-consoles.png`).
Expected: the frame reads as a border (e.g. a ring of four boxes, or a frame pushed
behind the screen), so the emissive screen is visible.

### D3 — two debug camera presets frame the wrong subject (evidence defect; owner: Geordi)
`src/main.js` presets:
- `viewscreen`: camera `(0, 1.7, 3.6)`, yaw 0, pitch 0 — sits directly behind the
  captain chair (`bridge/captain-chair` at `z=1.6`, back panel top `y=1.9` > eye
  1.7), so the chair back fills the centre of frame. Reproduced:
  `evidence/viewscreen.png` and this run's equivalent view.
- `crew`: camera `(−4.6, 1.7, −1.2)`, yaw 1.05 (≈60° left), pitch −0.08 — the view
  direction is `(−0.867, −0.08, −0.497)`, i.e. into the empty port wall corner.
  Mara Vale `(−3.4, −2.6)` lies to the right of that axis and Ivo Sen `(−5.2, 0.6)`
  behind it, so neither is in frame. Reproduced: `openstars-03-preset-crew.png`.

Conclusion for Picard's capture review: **the entities are present and render**;
the captures were mis-aimed. With a corrected pose the same scene shows Mara Vale
at the helm (`openstars-04-crew-visible.png`).

### D4 — helm console is blocked by Mara Vale from the room side (usability; owner: Geordi, decision with Picard)
Mara Vale's collider `x −3.82…−2.98, z −3.02…−2.18` stands between the bridge centre
and the helm console `x −4.35…−2.45, z −4.65…−3.10`; the facing gaps are 0.08 m
(crew front to console back), so the direct approach is impassable. At every tested
pitch from `0` to `−0.80` the gaze resolves to `crew/mara-vale`, never
`consoles/helm` (`openstars-06-helm-gaze-hits-crew.png`, prompt `Mara Vale — [E] Speak`).
The helm console is reachable only by walking around it and approaching from the
console's own side: from `(−3.4, 1.7, −5.0)` the gaze resolves to `Helm Console —
[E] Take the helm` at pitch −0.30 or steeper. Comms, science and engineering
consoles are reachable from the room side.

### D5 — notes, not defects
- Console gaze requires a downward pitch: console AABBs top out at `y=1.35` against
  an eye height of 1.70, so a level gaze (pitch 0) never selects any console.
  Prompts appear at pitch ≤ −0.15 for comms/science/engineering and ≤ −0.30 at the
  helm. This is physically sensible (you look down at a desk) but the AABB top,
  the panel geometry (`y≈1.0–1.25`) and the prompt range should be a deliberate
  decision before Data binds gameplay to it.
- Frame-rate values quoted here come from the in-page HUD and are loop sanity only.

## 6. Method notes and limits

- Chromium runs used the OpenBot private browser, whose `requestAnimationFrame` is
  throttled to ~2 fps while its tab is not being presented; that throttle is the
  harness, not the app, and it is why sustained key-hold input was driven through
  the real handlers (`document` `keydown`/`keyup`, `player.update`) rather than
  physical key holds. Native Chrome, Safari and Firefox all rendered the same
  scene at ≈60 fps, so rendering and input bindings are confirmed on real GPUs.
- Native pointer lock was verified in Chrome. The deterministic interaction suite
  needs a locked pointer (the prompt and the walk gate both require it), so those
  runs used a pointer-lock shim: `Document.prototype.pointerLockElement` was
  overridden and `pointerlockchange` dispatched, then the real `onMouseMove`,
  `onKeyDown`, `update()` and collision code ran unmodified. The shim supplies lock
  state only; it does not touch movement, gaze or collision math.
- The shim and the harness page wrote files through a temporary local HTTP sink on
  `127.0.0.1:8124` (`/tmp/worf-save/saver.py`); the project server and project
  files were untouched.
- Canvas captures are 1280×720 PNGs taken from the WebGL drawing buffer, so they
  contain the 3-D scene but **not** the DOM overlay (HUD, crosshair, prompt text).
  Overlay behaviour is evidenced by captured DOM text and by the native window
  screenshots.
- Screenshot frame rate in software-rendered captures is not G4 evidence.

## 7. Evidence manifest (`evidence/g1-worf/`)

| File | Shows |
| --- | --- |
| `openstars-01-frontwall-aimed.png` | Front wall aimed at screen centre `(0,1.7,−1.2)`, pitch +0.12 — no emissive screen (D2) |
| `openstars-02-preset-consoles.png` | Shipped `?cam=consoles` pose — wall/frame only, no screen (D2) |
| `openstars-03-preset-crew.png` | Shipped `?cam=crew` pose — empty port corner (D3) |
| `openstars-04-crew-visible.png` | Corrected pose — Mara Vale, chair, consoles, crew all present |
| `openstars-05-prompt-science-console.png` | Science console in gaze at pitch −0.30 (prompt text captured separately: `Science Console — [E] Run a scan`) |
| `openstars-06-helm-gaze-hits-crew.png` | Helm approach blocked by Mara Vale (D4) |
| `chrome-native-preset-consoles.png` | Native Chrome, real GPU, HUD `60.0 fps (120 frames)`, buffer 1280×720, DPR 2 |
| `safari-native-preset-consoles.png` | Native Safari, HUD `60.0 fps (120 frames)`, buffer 1280×720, DPR 2 |
| `firefox-native-preset-consoles.png` | Native Firefox, HUD `59.5 fps (120 frames)`, buffer 1280×720, DPR 2 (browser first-run modal in front) |

## 8. Next

Geordi: fix D1 (forward/back sign), D2 (viewscreen frame must not cover the
screen), D3 (aim the two evidence presets at their subjects). Picard: decide D4
(helm approach) and D5 (console AABB height vs prompt range) before Data binds
gameplay. QA re-runs this document's §4 suite on the corrected build; G4 stays
open and no performance number in this document is offered as evidence for it.
