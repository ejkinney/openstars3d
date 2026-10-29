# G1 revision 2 — D6 interaction guard

Status: implementation complete; awaiting Worf's focused independent retest and
Picard's gate decision. No G1 pass claimed. Owner: Geordi. Local-only P1 change.

## Changed paths

- `src/player.js`: E now requires both the renderer's locked state and native
  `document.pointerLockElement === canvas`. Key state is recorded even while
  paused; only a fresh, non-repeated E down may emit. Gaze is refreshed at that
  press so the callback uses the current enabled target. The native check also
  suppresses E in the interval before a lock-change event updates cached state.
- `docs/scene-contract.md`: documents pre-entry/pause suppression and release/new
  press after re-entry. Contract remains 0.1.0 with the same seven IDs/signatures.
- `docs/G1-r2-handoff.md`: this handoff.
- `evidence/g1-r2/`: new evidence only, enumerated below. No prior QA files edited.
- `evidence/http-server.log`: the existing server automatically recorded this
  run's local requests; this live operational log changed during capture.

## Runtime checks actually run

OpenBot browser, ordinary `http://127.0.0.1:8123/index.html`, 2026-10-28
18:13–18:16Z. `runtime.json` records 13 passing assertions plus setup observations.

1. Before initial entry, helm selected by the real gaze code: trusted E yielded
   **zero callbacks**, native pointer lock null, no shim, prompt hidden.
2. With temporary lock instrumentation active: a fresh trusted E yielded exactly
   **one helm callback** and the real prompt appeared.
3. Trusted Escape invoked the real input handler. After removing the lock shim
   and restoring native exitPointerLock, native pointer lock was null; trusted E
   yielded **zero additional callbacks**, with prompt hidden. `native-paused.json`
   records the input's `isTrusted:true`, no own lock property and callback delta 0.
4. Re-entry itself replayed neither a released paused press nor a held paused
   press. Repeated and duplicate non-repeat down events while held yielded no
   additional callbacks. Release followed by one fresh trusted E yielded exactly
   **one helm callback**.
5. Disabled helm and empty gaze yielded zero callbacks. Switching gaze to Mara
   yielded one `crew/mara-vale` callback. Native-null lock before lockchange
   yielded zero callbacks even with cached renderer lock still true.
6. Final ordinary reload removed all instrumentation: `qaPresent:false`, no own
   pointer-lock shim, `onInteract:null`, normal entry overlay, contract 0.1.0 and
   seven canonical IDs. Buffer/canvas remained **1280×720 at actual DPR 2**.
   See `final-boot.json`.

Browser snapshots reported nine ordinary boot info lines and HTTP 200/304 resource
responses, with no new application warning/error observed during these checks.
The persistent tab retains an older 17:26 diagnostic from the previous P1 work;
that historical `getTransparent` inspection error was not produced by this run.
This is bounded tool diagnostic observation, not an unbounded console trace.

## Source inspection and local checks

- `node --check src/player.js` succeeded (syntax only).
- `player.diff` preserves the exact source delta against `player-before.js`.
- Hash comparison against `prior-artifacts-sha256.json` confirmed all prior QA
  artifacts and Worf reports unchanged. Of 57 recorded files, the only changed
  file is the active `evidence/http-server.log`; see `preservation-check.json`.
- `src/scene.js`, `src/main.js`, `src/contract.js` were not edited. No geometry,
  movement, collision, seven-ID registry or gameplay changes were made.

## Evidence and limitations

- `active-overlay.png` and `paused-overlay.png`: actual full-page browser frames
  extracted at t=1 s from `active.webm` and `paused.webm`; visually inspected.
  Active shows live helm prompt/crosshair; paused shows both hidden from the same
  camera. No forced prompt URL, compositing or illustrative image was used.
- `active-canvas.png`, `paused-canvas.png`: canvas-only readbacks.
- `runtime.json`, `native-paused.json`, `final-boot.json`: actual runtime results.
- `harness.txt`: helper function definitions used for instrumentation.
- `player-before.js`, `player.diff`, `prior-artifacts-sha256.json`,
  `preservation-check.json`, `checks.txt`: source/preservation evidence.

The embedded browser did not obtain native pointer lock on trusted ENTER BRIDGE.
Active/re-entry checks therefore used a temporary pointerLockElement/exit shim
and dispatched pointerlockchange through the production listeners. Edge-case
key sequences were synthetic; the stated trusted E and Escape events came from
OpenBot browser press. Target positions used the existing setPreset API, with
the real gaze and prompt code; this is no new physical walking-route proof.
The pre-entry and paused trusted-E checks used native APIs without a shim.
Final reload removed instrumentation. No standalone native re-entry run,
three-browser suite, movement/collision regression suite, DPR 1 retest, build
bundling or performance/G4 check was run. HUD fps is not performance evidence.

## Launch and next owner

Existing local server on port 8123 was reused. From the project root:

```sh
python3 -m http.server 8123 --bind 127.0.0.1
```

Open `http://127.0.0.1:8123/index.html`. Temporary loopback evidence sink on port
8125 was stopped after capture. Worf now independently retests D6; Picard decides
G1. P2 and later phases remain held.
