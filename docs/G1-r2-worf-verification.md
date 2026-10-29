# G1 revision 2 — focused independent D6 retest (Worf)

Recommendation: **D6 PASS; recommend G1 PASS within the accepted instrumentation scope.** Picard records the gate. All 19 focused assertions pass; no implementation defect remains demonstrated by this retest. D1–D4 baseline is retained. No phase advanced.

Native pointer-lock/re-entry remains **unverified** in this revision: the approved embedded browser returned a `SecurityError` on the trusted entry attempt. Active/re-entry results below use explicitly identified lock instrumentation. This recommendation applies the method limits already accepted in `docs/G1-it-runs.md`; it does not certify native re-entry, a complete physical walkthrough, a fresh three-browser matrix, or G4.

Run: 2026-10-28, 18:18–18:22Z. Ordinary local URL: `http://127.0.0.1:8123/index.html`, without cam/prompt parameters. OpenBot private Chromium 152.0.7977.167, reported macOS, actual DPR 2; canvas and buffer 1280×720; contract 0.1.0 and unchanged seven canonical IDs. Existing project server PID 91880 reused.

## D6 results

| Focused independent check | Result |
| --- | --- |
| native-null pre-entry trusted E suppressed | PASS |
| active fresh trusted E dispatches one helm | PASS |
| trusted Escape hides crosshair and prompt | PASS |
| native-null paused trusted E suppressed | PASS |
| cached locked true but native null E suppressed | PASS |
| released paused E does not replay on re-entry | PASS |
| fresh E after released-paused re-entry emits once | PASS |
| held paused E initially suppressed | PASS |
| held paused E does not replay on re-entry | PASS |
| repeat and duplicate non-repeat held E suppressed | PASS |
| release then fresh trusted E after held re-entry emits one | PASS |
| dispatch refreshes stale helm gaze to current Mara | PASS |
| ordinary active E hold emits only one | PASS |
| disabled cached target yields zero callbacks | PASS |
| no-target active E yields zero | PASS |
| active W remains forward | PASS |
| active D remains right | PASS |
| active mouselook turns right and down | PASS |
| paused movement and look remain stopped | PASS |

Raw evidence is in `evidence/g1-r2-worf/runtime.json` (19 results, event trust flags, callback IDs and state). `pre-entry-native.json`, `paused-native-trusted.json`, `active-trusted.json` and `runtime-part1.json` preserve intermediate observations.

The native-null cases were checked while the real gaze had selected helm, not against an empty target. Before entry and after trusted Escape, trusted E yielded zero callbacks with `document.pointerLockElement === null`, `player.isLocked() === false`, and no own pointer-lock property/shim. This directly retests the revision-1 failure condition. Paused screenshot shows the same camera as the active screenshot, with prompt and crosshair hidden.

The cached-state interval was tested by establishing cached `locked:true` with instrumentation, removing the own lock property without dispatching `pointerlockchange`, then pressing E. Native pointer lock was null while the cached state still read true; callback delta was zero. The subsequent lock-change event restored cached state normally.

Released-paused sequence: paused E down/up → instrumented re-entry → 30 fixed updates → zero replay → fresh E → exactly one helm callback. Held-paused sequence: paused E down → instrumented re-entry → 30 updates → repeated and duplicate non-repeat downs → zero callbacks → E release → fresh trusted E → exactly one helm callback. An ordinary active hold with repeat/duplicate downs also emits only once.

For current-target correctness, the cached hover was helm; a synthetic relative mouse turn changed camera forward toward Mara without a frame/gaze update. Before keydown the hover still read helm. Fresh E refreshed gaze and emitted exactly `crew/mara-vale`. Disabling that cached target immediately before E emitted zero and cleared hover. Empty gaze also emitted zero.

## Affected controls and baseline

Small clear-floor checks at yaw 0 preserved W forward and D right, each 0.533333 m over ten 1/60 s updates. Synthetic relative mouse movement turned right/down while active. In native-null paused state, 60 movement updates and mouse events left position/forward unchanged; prompt/crosshair stayed hidden. These are focused handler/update checks, not physical navigation or a repeated collision matrix.

Independent diff against `evidence/g1-r2/player-before.js` is confined to `onKeyDown`: previous-down tracking, renderer/native lock checks, and dispatch-time gaze refresh. The saved before-source hash matches Worf's revision-1 source. `scene.js`, `main.js`, `contract.js` retain the revision-1 hashes; geometry, movement math, colliders and registry are unchanged. Therefore the prior D1–D4 evidence remains applicable without repeating unrelated suites. `node --check src/player.js` passed (syntax only).

## Native entry attempt and method gap

A trusted click on ENTER BRIDGE called the original canvas `requestPointerLock` with `navigator.userActivation.isActive === true`. A logging wrapper observed its promise rejection without replacing the API result: `SecurityError: The root document of this element is not valid for pointer lock.` The start overlay hid, but native lock stayed null. `native-entry-attempt.json` records the failure. No alternate browser-control plugin or security-setting workaround was used.

Native-null suppression checks use native lock APIs without a shim. Active and re-entry tests use a temporary own getter for `pointerLockElement`, a matching exit shim, and production `pointerlockchange` listeners. Trusted E and Escape came from `openbot_browser.press`; edge-case down/up/repeat events and relative mouse events were synthetic. Target setup used the existing `setPreset` API; all selection, guards, callbacks and prompt rendering used production code. `app.timeScale=0` controlled background timing, and explicit `app.fire('update',dt)` ran the real update path.

The native-entry gap limits confidence in actual browser lock acquisition and re-entry integration. It does not reproduce D6: the exact native-null failure now suppresses trusted E, while instrumented positive-state dispatch/re-entry checks pass. Given Picard's previously accepted G1 method limits, no new factual implementation blocker is identified. If Picard requires native re-entry before G1 acceptance, that requires a permitted native-browser input route; it cannot be claimed from these results.

No fresh standalone Chrome/Safari/Firefox suite, headless suite, DPR1 check, sustained performance, frame-time or memory measurement was performed. Prior Firefox onboarding obstruction and Safari/Firefox console gaps remain unresolved; no full-browser QA or G4 claim is made. HUD fps includes test-driven updates and is not performance evidence.

## Captures, cleanup and preservation

`active-overlay.png` and `paused-native-overlay.png` are actual OpenBot browser frames extracted unchanged at t=1 s from the adjacent `.webm` recordings. Both were visually inspected. Active shows the live helm prompt/crosshair under the lock shim; paused shows neither with native lock null and no shim. Canvas-only readbacks and state JSON are saved separately. No forced prompt, compositing or illustrative image was used.

A final ordinary reload removed all test instrumentation: `qaPresent:false`, no own pointer-lock property, native pointer lock null, `onInteract:null`, `timeScale:1`, normal entry overlay and unchanged contract/IDs/resolution. See `final-boot.json`. Returned snapshots showed ordinary boot info and HTTP 200/304 with no new application warning/error observed; final `list_tabs` reported `diagnosticErrorCount:0`. This is bounded diagnostic observation, not an unbounded console trace; the observed native request rejection remains explicitly recorded.

Before/after SHA-256 comparison preserves all 47 recorded paths: source JS, current scene contract, both prior Worf reports and their evidence. No implementation edits. Only this new report and `evidence/g1-r2-worf/` were authored by QA; the existing HTTP server's operational log naturally grows. The evidence-only localhost:8124 sink was stopped after saving. Prior reports/evidence remain unchanged.

Supporting artifacts: `harness.js`, `focused-cases.js`, raw runtime JSON, independent source diff, preservation manifests/check, `checks.txt`, native entry rejection, final boot and capture manifest. Picard decides G1; no further renderer correction is requested on this evidence.
