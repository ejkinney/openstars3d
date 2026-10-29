# P2 assembled bridge handoff

Owner: Geordi. 2026-10-28. Renderer/bootstrap integration delivered for Worf's
independent verification and Picard's review. **No P2/G2/G3/G4 pass claimed.**
No live provider call, spending, publication, old-repository reuse or P3 overhaul.

## Launch

From `/Users/elliot/OpenBot/Shared/openstars-prototype-20261028`, run two processes:

```sh
node tools/bridge-server.cjs
```

```sh
node server/local-server.cjs
```

`npm start` and `npm run companion` are equivalent. Bridge:
`http://127.0.0.1:8123/index.html`. Offline dialogue endpoint:
`http://127.0.0.1:8124/api/dialogue`. Companion diagnostic harness, if needed:
`http://127.0.0.1:8124/p2-harness.html` (not the product UI).

Both processes bind IPv4 loopback. Bridge and companion use fixed public asset
allowlists; server source, `.env`, evidence and arbitrary project paths are not
served. The previous directory-wide Python server on 8123 was stopped and
replaced with the restricted bridge server. Do not launch both on the same port.
The two final local servers were left running for handoff; temporary evidence
sink on 8125 was stopped. CLI companion stays offline and reads no provider key.

## Seven integration requirements

1. **Assembly:** index loads encounter, dialogue, runtime after contract; main
   builds the bridge, checks seven registered interactables, constructs physical
   displays/presenter and calls `createGame` once. Runtime owns `onInteract` once.
   Bootstrap failure disables entry and shows an explicit systems error.
2. **Presentation:** canonical objective/resources/outcome are drawn on the
   forward viewscreen; station status and legal action labels are drawn on four
   physical console fronts. No station-button grid or default statistics HUD.
   `?debug=1` is an opt-in rendering readout. A screen-reader mission mirror and
   focused, scrollable DOM dialog expose canonical briefing/actions accessibly.
   Dialogue/action strings use `textContent`; physical textures draw text only.
3. **Display hooks:** `setViewscreen(text|null)` and additive
   `setConsoleContent(id,{text,actions:[{label}]})` are implemented in displays.js.
   They never execute actions. Viewscreen dimensions/wall bounds are unchanged.
   Console text uses room-facing fascias inside existing AABBs; collider/selection
   volumes, positions and seven canonical IDs are unchanged. Texture redraws are
   skipped when the displayed text is unchanged. See scene-contract.md.
4. **Focus:** opening a panel disables movement/look/E and intentionally releases
   pointer lock exactly once. Later `present` updates retain it without capture
   churn. Escape, blur, document hiding and ordinary walking capture loss call
   `game.suspend()`. Intentional dialogue release does not suspend the panel.
   Close shows a trusted-click RETURN TO BRIDGE gate. Only that click calls
   `player.lock()`; async completion never locks. Native rejection is visible and
   leaves walking disabled. G1-r2 fresh-E/native-lock guards remain, with E held
   across pause consumed until release/new press; walking keys clear on focus
   transitions. Action buttons call `game.act` for the current panel/action only.
5. **Restart:** debrief and pause offer restart via the runtime. It cancels
   dialogue, resets the encounter and its checkpoint/run identity, restores the
   renderer-owned spawn/look and leaves capture waiting for a fresh trusted click.
6. **Checkpoint:** main guards `localStorage` acquisition. Runtime guards writes
   and only uses `openstars.encounter.v1`. Storage failure stays nonfatal. No
   automatic resume, campaign save, score panel or resume UI was added.
7. **Companion/fallback:** main explicitly uses the loopback port-8124 endpoint.
   Missing companion and offline responses show labelled fallback; deterministic
   rules, briefing and action buttons still work. Generated assessment has a
   separate plain-text block labelled **may be inaccurate**; offline reactions
   are labelled offline and never shown as generated success. No generated prose
   drives gameplay. Data's generation update kept the public API intact.

## Exact implementation paths changed by Geordi

- `index.html`: script assembly, accessible dialog, pause/re-entry/restart UI.
- `src/main.js`: one-time assembly, guarded optional storage, real prompt,
  opt-in debug HUD, visible bootstrap failure; presets retain normal entry gate.
- `src/player.js`: renderer input-enable/unlock boundary, movement-key clearing,
  observable lock failure. Movement math/collision algorithm unchanged.
- `src/displays.js` (new): canvas-backed emissive physical text surfaces/hooks.
- `src/presenter.js` (new): focus/capture policy and accessible action/dialogue UI.
- `tools/bridge-server.cjs` (new): restricted bridge asset server.
- `package.json`: restricted start command and separate companion command.
- `README.md`, `docs/scene-contract.md`, `docs/P2-bridge-handoff.md`.
- `evidence/p2-bridge/` (new builder artifacts).

`src/scene.js`, `src/contract.js`, engine and geometry were not edited. Contract
remains 0.1.0 with the seven IDs and hook signature intact; display hooks are
additive. Data independently updated gameplay/server/tests during this work;
Geordi made no changes to those internals. All 94 pre-existing G1 artifacts and
reports in the baseline hash set remain unchanged (`preservation-check.json`).

## Checks actually run

**Runtime integration, OpenBot Chromium 152 / macOS reported / actual DPR 2:**

- `browser-results.json`: **26 passing assertions**, ordinary bridge, not harness.
  Seven entities/consumer; pre-entry E suppression; trusted comms and Mara E;
  intentional release retaining dialog; movement/look/E freeze; no capture churn
  after action/async fallback; close requiring return click; paused and held-E
  suppression; fresh trusted E after return opening science; actual offline
  companion response and real missing-companion connection refusal; Escape/blur
  cancellation and no later repopulation; scan resources; all three endings;
  trusted debrief/pause restart; assembled storage-write failure remains playable.
- Full rescue: 12 rescued/0 lost, hull 100, energy 50, time 2. Partial route:
  10/2, hull 50, energy 60, time 6. Withdrawal: 0/12, hull 100, energy 100, time 8.
  Separate JSONs preserve each result.
- `presentation-checks.json`: **7 passing checks** on the final physical-display
  placement: all four console content planes within existing interaction AABBs;
  synthetic reaction remains literal text, shows uncertainty, and cannot mutate
  canonical state. The synthetic fixture was immediately removed, was not a
  provider response, and is not pictured as a live success.
- `clean-boot.json`: ordinary reload removes lock instrumentation and QA global;
  native pointer lock null, normal entry state, seven IDs, 1280×720 buffer at DPR2.
- `native-capture-failure.json`: trusted entry returned **SecurityError** in this
  embedded browser, visibly reported by product UI. Native walking/re-entry is
  **not verified**. No product workaround was added.

**Method boundary:** representative comms/Mara/science E, acknowledge/scan,
close/re-entry and debrief/pause restart used trusted browser tools. Active focus
checks used temporary requestPointerLock/exitPointerLock/pointerLockElement
instrumentation, never shipping code. Camera positions used renderer presets,
not a physical walking route. Further consultations/station operations and all
three complete route sequences used explicitly instrumented contract callbacks
and real presented-button listeners. Escape/blur pending-cancel edge cases were
synthetic; one ordinary pause Escape was trusted. These are assembled functional
checks, **not three native physical walkthroughs**. No seven-station physical
reachability claim, fresh native browser matrix, DPR1 retest or performance pass.

**Local processes and source checks:**

- `node --test tests/p2-systems.test.cjs`: original 13/13 passed before Data's
  generation follow-up. Preserved as `systems-tests.txt`.
- `node --test tests/p2*.test.cjs`: current **20/20 passed**, including Data's
  generation tests. `systems-generation-tests.txt`; no live provider calls.
- Five `node --check` commands succeeded for renderer/server JS; source hashes
  recorded. These establish syntax/source state, not native input behavior.
- `server-boundaries.json`: **7 passing HTTP checks** for bridge/public runtime
  assets, server/secret/evidence routes returning 404 and foreign Origin returning
  403; companion server module also returns 404.
- Ordinary boot resource requests were HTTP 200 and expected boot info lines
  appeared; no new application script exception was observed. The deliberate
  missing-companion test produced expected connection-refused/network errors.
  This is bounded browser diagnostic observation, not an unbounded console log.

## Captures and remaining limits

Actual files, not illustrations:

- `incoming.png` / `incoming.webm`: forward viewscreen incoming objective/resources.
- `crew.png` / `crew.webm`: Mara and separate canonical/offline reaction blocks.
- `debrief.png` / `debrief.webm`: real full-rescue state, physical screen and restart.
- `operation-final-canvas.png`: final readable science fascia, scan complete,
  crew 3/3 and energy 90. Actual canvas readback; DOM overlay excluded. A final
  full-page screenshot was visually inspected through the screenshot tool.
- `operation.png` / `operation.webm`: earlier operation capture, retained to show
  why top-panel text was changed to a room-facing fascia. It is **not** evidence
  of final console text placement. The other three recordings precede this
  console-only placement refinement; their viewscreen/dialogue state is unchanged.

PNG overlay frames were extracted at t=1 s from the listed OpenBot recordings
and visually inspected. Final video recording attempt failed with
`NotReadableError: getDisplayMedia: Could not start video source`; that failure
is reported, not treated as a successful recording. Canvas-only final evidence
is labelled accordingly. G4 budgets remain unmeasured; no fps claim.

No actual generated provider text was requested or validated. Semantic truth of
generated assessments remains explicitly uncertain; see Data's
`P2-generation-handoff.md`. Worf owns independent assembled flow/input verification;
Picard owns the phase decision and Guinan owns P3/style review.

Implementation used the official PlayCanvas [Texture API](https://api.playcanvas.com/engine/classes/Texture.html)
and [StandardMaterial API](https://api.playcanvas.com/engine/classes/StandardMaterial.html)
for canvas sources and emissive text surfaces.
