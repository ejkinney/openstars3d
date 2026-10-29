# G1 revision 1 — independent re-verification (Worf)

Recommendation: **G1 NOT PASS. D1–D4 corrections verified; D6 pause/input defect remains.** Picard decides the gate. Owner of D6: Geordi. No phases advanced and no implementation files changed.

Run: 2026-10-28, 18:02–18:10Z. Root: `/Users/elliot/OpenBot/Shared/openstars-prototype-20261028`. Original report and `evidence/g1-worf/` preserved. Before/after hashes confirm all four source JS files and the original report are unchanged by QA.

## Result

| Check | Independent result | Evidence under `evidence/g1-r1-worf/` |
| --- | --- | --- |
| D1: W/S, Up/Down signs | PASS at yaw 0 and 0.7 rad | `movement-collision.json` |
| A/D and arrow strafe | PASS at both yaws | same; 16 movement cases total |
| Mouselook signs / pitch clamp | PASS via synthetic relative mouse events | same |
| D2: viewscreen exposed, four bars, top within ceiling | PASS; screen top 3.80, four bars present, blue face visible | `summary.json`, `03-viewscreen-overlay.png` |
| D3: named presets frame subjects | PASS; screen visible above chair; crew preset frames Mara | `04-preset-viewscreen.png`, `05-preset-crew.png` |
| D4: ordinary room-side helm route | PASS with method limits below; real live gaze prompt and one trusted E call | `route.json`, `helm-trusted-E.json`, `01-live-helm-overlay.png` |
| Mara separately targetable from same standing point | PASS; separate live prompt and trusted E to crew/mara-vale | `02-live-mara-overlay.png`, `summary.json` first two dispatches |
| All seven IDs / single E / repeated key suppression | PASS | `interactions.json` |
| No-target and disabled target | PASS; zero calls, prompt hidden | same |
| Walls, chair, four consoles, three crew bounds | PASS; 13 approaches | `movement-collision.json` |
| Escape release / movement and look pause / prompt hide | PASS for handler and unlocked-state behavior, with lock shim | `pause.json` |
| E suppressed during pause | **FAIL — D6**, also reproduced with shim removed | `pause-no-shim.json` |
| Clean ordinary boot and fixed resolution | PASS in OpenBot Chromium; 1280×720 at actual DPR 1 and 2 | `browser-observations.txt`, `resolution-dpr1.json`, `final-pristine-boot-dpr2.json` |

## D6 — E still dispatches while the bridge is paused

**Blocking recommendation, owner Geordi.** The scene contract describes Escape as release mouse/pause. Escape blocks movement and look, hides crosshair and prompt, but does not block interaction. This is newly discovered by this suite; no claim that revision 1 introduced it.

Reproduction:

1. Load ordinary `http://127.0.0.1:8123/index.html`, enter and approach helm from the room side; gaze down until the live helm prompt appears.
2. Instrument `Contract.onInteract` only to count calls; press E once: one `consoles/helm` call.
3. Press Escape. `player.isLocked()` becomes false; prompt opacity and crosshair opacity become 0. W and mouse movements no longer change the player.
4. Press E once while still facing helm: another `consoles/helm` call fires although pointer is released and prompt hidden.

Confirmed twice: first with the test lock shim, then after deleting the shim property and restoring the native `document.exitPointerLock`. In the second check native `document.pointerLockElement === null`, `isLocked() === false`, prompt opacity 0, and one trusted (`isTrusted: true`) E produces exactly one call. See `pause-no-shim.json`.

Source cause: `src/player.js` `onKeyDown` handles E without checking `state.locked`; the movement and mouse handlers have that guard. Expected for the documented pause: zero interaction callbacks until re-entry. Geordi should guard the renderer-owned interaction input and return it for focused verification. No gameplay behavior is needed to establish this defect; the callback is the G1 boundary.

## Helm and Mara evidence — no forced prompt

The main test began at ordinary `index.html`, no `cam` or `prompt` parameters. Startup position was `(0,1.7,4.8)` with yaw 0 and pitch −0.02. No position preset or teleport was used before the first helm and Mara captures.

The representative path used trusted A then W key events delivered by `openbot_browser.press`, checked with `isTrusted: true`. A advanced 64 fixed updates at 1/60 s to x −3.4133; W advanced 135 updates to z −2.39856. This route bypasses the chair on its port side and approaches the helm from the room side, without going behind the console. A synthetic relative mouse event `(0,+190)` lowered the gaze. The unmodified gaze/hover/prompt code then selected `consoles/helm`, rendered `Helm Console — [E] Take the helm` at opacity 1, and a trusted E produced one helm callback.

From exactly that standing point, a synthetic mouse turn aimed at Mara `(−4.9,1.3,−3.1)`. The real selection became `crew/mara-vale`, showed `Mara Vale — [E] Speak`, and another trusted E produced one Mara callback. Both overlay captures are actual browser recording frames, not debug prompt overlays or composited illustrations.

## Movement and collisions

At each yaw, ten 1/60 s updates give expected displacement magnitude 0.533333 m. At yaw 0, W/Up → z −0.533333 and S/Down → z +0.533333; A/Left → x −0.533333 and D/Right → x +0.533333. At yaw 0.7, W/Up give `(dx,dz)=(-0.343583,-0.407916)` and S/Down reverse both; the dot product against camera forward is ±0.533333. Strafe aligns with camera right. All 16 cases pass a 1e-5 tolerance.

Synthetic mouse `(200,100)` changes forward to `(0.398802,-0.208460,-0.893029)`, turning right and down. Large downward motion clamps pitch at −1.45 rad.

13 collider approaches used fixed 1/60 s updates (360 per approach); measured stops within 1e-5 of expected:

- X walls: ±7.56; Z walls: ±5.56.
- Chair: z 2.54 from aft, 0.66 from forward.
- Helm and comms: z −2.76 from room side.
- Mara's moved bounds: z −2.34; Ivo and Tessa: z 1.36.
- Science / engineering inner sides: x ∓4.71.

All seven canonical interaction IDs were separately aimed from legal room-side positions using `setPreset` for these isolated regression cases, then synthetic mouse/key events through the existing handlers. Every single E yielded one matching callback; `repeat:true` added no callbacks. Disabled helm and empty gaze yielded none. This is targeted handler/collision evidence, not seven fully physical walkthroughs.

## Environment, method and limits

OpenBot private browser, reported Chrome 152.0.7977.167 / macOS, PlayCanvas 2.23.3, contract 0.1.0, **59 entities and seven IDs**. Existing Python HTTP server PID 91880 on localhost:8123 was reused; no second project server started. Temporary evidence-only sink on localhost:8124 saved files into the new QA directory and was stopped after capture.

Trusted ENTER BRIDGE hides the overlay, but this embedded browser did **not** obtain native pointer lock. A trusted W tap was received but produced no movement between the browser tool's instantaneous down/up events. Therefore the walking suite used a pointer-lock shim plus fixed-step updates fired through `app.fire('update',dt)`. Trusted A/W events set the real handler's key state; a QA observer advanced the required fixed updates before keyup. `app.timeScale=0` stopped background-loop movement during this instrumentation; explicit update events still ran the real player, collision, gaze and DOM prompt code. Relative mouse events were synthetic. These limits prevent a claim of a complete physical-input, native-pointer-lock path. No input binding, collider, interaction volume or prompt implementation was replaced.

The dedicated no-shim D6 confirmation restored native pointer-lock APIs before the final E. A final ordinary reload removed all QA functions, callback instrumentation, lock overrides and time-scale changes; final `qaPresent:false`, native pointer lock null, normal startup overlay, contract and resolution are recorded in `final-pristine-boot-dpr2.json`.

Fresh native standalone Chrome/Safari/Firefox runs were not performed in this revision. Prior native evidence remains in the original report. Firefox first-run onboarding obstruction and unavailable Safari/Firefox console capture remain explicit limits; this is not a new full three-browser QA pass. No headless revision suite was run by Worf. No GPU/heap budget measurement or performance pass is claimed. HUD fps in these images includes synthetic update samples and has no performance meaning; G4 remains separate.

Ordinary startup at 18:02:33Z and pristine final reload at 18:09:58Z reported all initial resources HTTP 200 and the nine boot info lines, with no application warning/error observed. Final `list_tabs` reported `diagnosticErrorCount:0`. Diagnostics are bounded by the browser tool; this is not a saved unbounded console trace. Actual DPR was read directly: 1 after environment emulation and 2 initially/finally, both buffer/canvas 1280×720. Final URL remains local `index.html`.

## Evidence and follow-up

`01-live-helm-overlay.png`, `02-live-mara-overlay.png` and `03-viewscreen-overlay.png` are unchanged frames extracted at t=1 s from the associated OpenBot `.webm` recordings. They include actual DOM labels/prompts and the rendered scene. Their associated canvas-only PNGs and JSON files preserve state separately. The two preset PNGs contain canvas pixels only. QA visually inspected all five subject captures.

Supporting data: `summary.json`, `route.json`, `helm-trusted-E.json`, `movement-collision.json`, `interactions.json`, `pause.json`, `pause-no-shim.json`, DPR JSON files, source hashes and `qa-harness-functions.txt`. The latter records helper functions for reproducing the instrumentation, not a shipping test harness.

Next action: Geordi corrects D6, then Worf rechecks paused E suppression, re-entry and normal single-E dispatch. Picard retains final G1 authority. D1–D4 need no further correction on this evidence.
