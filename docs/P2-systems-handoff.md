# Open Stars — P2 systems handoff

Owner: Data. 2026-10-28. Builder checks complete for standalone systems. Picard owns routing and gate decisions. This is **not assembled playable bridge integration**, independent Worf QA, live AI validation, P3/style approval or G3/G4 approval.

## Files and launch

New files only; renderer, player, scene, contract, main bootstrap, engine, package files and prior QA artifacts were not edited.

- `src/gameplay/encounter.js`: pure rules, canonical IDs, resources, outcomes, replay checkpoint validation.
- `src/gameplay/dialogue.js`: canonical officer dialogue and approved optional flavour phrases.
- `src/gameplay/runtime.js`: contract consumer, interaction/action gating, save/resume, async cancellation and fixed-step utility.
- `server/dialogue-adapter.cjs`: bounded DeepSeek adapter, offline by default.
- `server/local-server.cjs`: loopback-only companion, restricted static asset allowlist and dialogue endpoint. CLI always starts offline; it does not read an API key or enable paid requests from environment variables.
- `tests/p2-systems.test.cjs`: Node built-in tests; no new dependencies.
- `tools/p2-harness.html`: diagnostic HTML surface; not product HUD or renderer UI. It intentionally simulates physical interactions with buttons.

Run from project root with Node 18+ (tested Node v26.7.0):

```sh
node --test tests/p2-systems.test.cjs
node server/local-server.cjs
```

Open `http://127.0.0.1:8124/p2-harness.html`. Existing bridge startup on port 8123 remains unchanged and does not load these systems yet. The companion serves only the harness and three public gameplay scripts; server modules and arbitrary project paths return 404. Host and Origin checks reject other hosts/origins. The only allowed cross-origin client is `http://127.0.0.1:8123`. Companion HTTP allows 128 dialogue attempts per process, 4096-byte request bodies and a three-second incoming request deadline.

## Canonical encounter rules

The Aster is a fictional civilian survey ship with twelve aboard. Initial resources: time 8, total energy 100, hull 100. All are bounded nonnegative integers. Allocation values below are percentages of available system capacity, separate from total energy expenditure. No passive countdown: walking, reading, consultations, dialogue waits, pausing and rendering spend no encounter time. Each authorized operation is applied once; repeated/invalid/out-of-order commands leave state unchanged.

| Stage/operation | Preconditions | Canonical effect |
| --- | --- | --- |
| Incoming → acknowledge | Communications | Enter planning; resources unchanged |
| Consult officer | Planning; each of three canonical crew IDs | Mark that officer consulted; no time/energy cost |
| Scan | All three consulted; not already scanned | Time −2, energy −10; reveal safe approach |
| Safe approach | All three consulted; scanned; no prior approach | Time −2; no hull loss |
| Direct approach | All three consulted; no prior approach | Time −1; hull −10 if scanned, −20 if unscanned |
| Balanced power | All three consulted; no prior allocation | 50% shielding / 50% rescue |
| Rescue power | All three consulted; no prior allocation | 20% shielding / 80% rescue |
| Cautious rescue | All consulted, approach and allocation selected | Energy −40, time −2; rescue twelve only with scanned + safe + balanced; otherwise eight |
| Urgent rescue | Same preparation requirements | Energy −40, time −1; rescue nine with balanced allocation, ten with rescue allocation |
| Withdrawal | Any planning state | No further time, energy or hull cost; no civilians rescued; prior damage retained |
| Debrief → restart | Communications or explicit restart control | Fresh resources/flags/history; increment run identity; invalidate pending responses |

Any rescue other than fully prepared cautious rescue adds 15 hull damage with balanced allocation, 30 with rescue allocation. All lost civilians = 12 − rescued. Score = rescued × 10 − total hull damage; no persistent campaign score. Approach and allocation are committed once. Scanning after a direct approach cannot undo that approach. Engineering's rescue-priority setting buys one additional urgent survivor at greater damage cost.

Every planning state permits withdrawal. Every nonterminal state has a legal successor. Every debrief offers restart, even when the model and local storage fail. Crew can be revisited before acknowledgement and after debrief for current advice; those visits cannot bypass progression.

Reachable routes (close each interaction before walking to another station):

1. **Full rescue:** communications acknowledge → consult Mara/Ivo/Tessa in any order → science scan → helm safe → engineering balanced → communications cautious. Result: 12 rescued, 0 lost, hull 100, energy 50, time 2, score 120.
2. **Partial rescue/damage:** acknowledge → all consultations → helm direct without scan → engineering rescue power → communications urgent. Result: 10 rescued, 2 lost, hull 50, energy 60, time 6, score 50.
3. **Safe withdrawal:** acknowledge → communications withdraw. Result: 0 rescued, 12 lost, hull 100, energy 100, time 8, score 0. Withdrawal after approach preserves any damage already sustained.

## Integration request — Picard routes to Geordi

Only consume the seven `Contract.onInteract(id, descriptor)` IDs from scene contract 0.1.0. No entity geometry, renderer lock state, camera, colliders, handlers or engine internals are accessed or changed by gameplay. Reserved visual hooks are not called.

Geordi must assemble the following before anyone claims the encounter is playable:

1. Load `encounter.js`, `dialogue.js`, then `runtime.js` as ordinary scripts, after `contract.js`. Instantiate exactly once after the seven interactables are registered. Do not overwrite an existing `onInteract`; the consumer fails explicitly if another owner is installed. Boot failure should remain visible rather than silently running the old greybox.
2. Pass `present(view)` to render canonical objective, ship resources and debrief primarily on the viewscreen/consoles. `view` is a detached JSON snapshot: `{state, objective, panel, actions, focusRequested, pending, saveStatus}`. The panel contains canonical text plus a separately labelled optional flavour phrase. Use text content, never HTML interpretation. Minimal overlay: current prompt, accessible dialogue/actions, close and pause/re-entry controls. `tools/p2-harness.html` illustrates semantics only; do not transplant its diagnostic station button grid into the product.
3. Implement the reserved `setViewscreen(text|null)` visual primitive and an additive console-content hook (suggested `setConsoleContent(id, {text, actions})`) or equivalent renderer-owned panel presenter. Existing `setConsoleState(id,{active,blink,color})` alone cannot display resource/action information. No need for scripted camera or crew-pose hooks to complete P2. Ship movement can be represented by approach/status text on the viewscreen.
4. Add a renderer-owned focus policy. On `focusRequested:true`, present accessible actions and freeze movement/look/gaze interaction; release capture through the renderer's existing mechanism. Repeated `present` updates while the same panel is open must not repeatedly request/release capture. Invoke `game.act(currentPanelId, action)` only for the presented action button; no new gameplay key binding. Close calls `game.close()`. `Esc`, blur and an ordinary pause call `game.suspend()` to abort pending dialogue and close the panel. Crucially distinguish the renderer's intentional capture release for an open panel from a user pause: the intentional release must not immediately suspend/erase that panel. On close, show an explicit trusted click to re-enter; never auto-lock from an async response. Discard held/queued E exactly as the G1-r2 boundary requires. Data never sets renderer lock flags or calls player lock/unlock.
5. Expose restart in debrief and pause UI through `game.restart()`. Restart closes panels, aborts pending requests, overwrites this encounter's checkpoint and increments run identity. Resetting player spawn/look belongs to Geordi; restore spawn using renderer-owned API if desired, without altering the scene contract geometry. `game.dispose()` is available for teardown.
6. Optional per-run checkpoint: supply browser `localStorage` (guard acquisition if unavailable). There is no campaign save. Storage errors are reported in `saveStatus` and never block play. Resume is explicit via `game.resumeSaved()`; it validates/replays a maximum of ten bounded actions and reconstructs resources/outcomes, never trusting stored resources. Corrupt saves return false. Restart replaces this one key (`openstars.encounter.v1`), never clears unrelated browser data.
7. For offline adapter testing from the existing port-8123 bridge, use `httpDialogue(fetch, 'http://127.0.0.1:8124/api/dialogue')`, with the companion running. Its default endpoint is same-origin `/api/dialogue`, which works in the harness. A missing companion, non-OK response or failed request must remain visible as fallback, never live success.

Example bootstrap for Geordi to integrate (not installed into main.js):

```js
const game = OpenStars.Gameplay.createGame({
  contract: OpenStars.Contract,
  present: view => rendererOwnedPresenter(view),
  dialogue: OpenStars.Gameplay.httpDialogue(fetch, 'http://127.0.0.1:8124/api/dialogue'),
  storage: optionalStorage,
});
```

`createFixedStep(step, hz=60)` is supplied and tested for future time-driven systems: finite nonnegative frame deltas, a 0.1-second catch-up clamp, pause clears accumulated time and restart can reset tick count. The present encounter is action-driven and does not require an additional timer. Do not tick the renderer-owned player twice or replace Geordi's existing collision/movement loop.

## Dialogue, model and proposed paid validation

Canonical facts/advice are generated locally from the current deterministic snapshot on every consultation. No conversation history or free-form captain input enters the provider. The prepared model adapter chooses only one of two approved supportive phrases for that officer, by strict JSON `{phrase: 0|1}`. It does **not** provide free-form AI prose. This deliberately narrow P2 adapter proves the transport/schema boundary while preventing a model from inventing a rescue result or contradicting a committed approach. Broader generative dialogue needs a separately reviewed semantic boundary; current offline success is not evidence for it.

Provider/model verified 2026-10-28: direct DeepSeek API, `https://api.deepseek.com/chat/completions`, model `deepseek-flash`, currently documented as DeepSeek-V4.1-Flash-1017. Published peak USD per million tokens: input cache miss $0.30, cache hit $0.006, output $1.20; off-peak $0.15 / $0.003 / $0.60. Recheck before approval; rates can change. [Primary model/pricing evidence](https://api-docs.deepseek.com/quick_start/pricing/).

Thinking is enabled by default, so the adapter explicitly sends `thinking:{type:'disabled'}`. It uses JSON output, maximum 160 output tokens, no streaming, tools, retries or model substitution. [Primary request schema](https://api-docs.deepseek.com/api/create-chat-completion/), [thinking-mode documentation](https://api-docs.deepseek.com/guides/thinking_mode/).

Proposed future approval: **one process, at most four paid attempts, at most USD $0.02 total**, whichever limit is reached first. Each request has ≤6000 bytes of prompt content; a conservative planning allowance of 8192 input tokens plus 160 output tokens yields `4 × (8192 × $0.30 + 160 × $1.20) / 1,000,000 = $0.0105984` at published peak rates. This is a conservative estimate, not provider-measured usage or a billing guarantee. The adapter enforces the four-attempt cap per instance, not an account-level dollar cap; failed/time-out calls may still bill. Do not restart/create another live instance to reset an approved budget. Approval and a secure key are still required; no paid call was made, and no key was requested, read, embedded, saved or logged in this work.

Runtime client deadline: 1500 ms. Provider adapter deadline: 1200 ms, including body read; responses capped at 8192 bytes. Unknown model, reasoning/tool output, bad JSON, extra fields, out-of-range phrase, truncated completion, provider/network failure, over-budget/busy/offline and timeout all fall back. Abort plus generation tokens invalidate old results after close/pause/restart/resume/teardown; even a fetch ignoring abort cannot keep the UI blocked or replace a timed-out result. Canonical dialogue remains available before/while optional flavour is pending. Error payloads and keys are never returned to the browser or written to logs. Live execution requires an explicit future server-side configuration change; CLI has no live switch.

## Builder evidence and limits

Command actually run: `node --test tests/p2-systems.test.cjs`. Final result **13/13 pass**, including exhaustive traversal of **693 legal sequence prefixes** (not 693 unique semantic states), all endings and resource bounds, out-of-order/repeat rejection, faithful checkpoint replay, current canonical dialogue, fixed-step partition/pause/reset, action focus, storage failure, restart/timeout late-response suppression, mock provider policy/schema/failure/caps and real loopback HTTP boundary checks. `source:'live'` inside mock tests means a validated synthetic fixture, not a DeepSeek network success.

Evidence retained under `evidence/p2-data/`:

- `offline-tests.txt`: final passing output.
- `offline-tests-initial-failed.txt`: original overly high sequence-count assertion failure; preserved. The actual count is 693; no game-rule failure occurred.
- `offline-tests-before-power-tradeoff.txt`: earlier passing run before urgent allocation gained the 9/10-survivor distinction.
- `harness-route.webm`: actual OpenBot embedded-browser recording (41.811 s). Browser semantics checked communications/acknowledge/close/Mara consultation, with real loopback `POST /api/dialogue` returning offline fallback. Remaining full-rescue route used explicitly instrumented contract/runtime calls, not a physical bridge walkthrough.
- `harness-incoming.png`, `harness-route-crew.png`, `harness-full-rescue.png`: actual frames extracted at 1/22/39 s from that recording. They show incoming signal, contextual Mara fallback, and full rescue. These paths are diagnostic UI captures, not bridge visuals. The later urgent 9/10-allocation adjustment does not change these depicted paths.
- Browser semantic restart at debrief returned run 2, initial time/energy/hull, no panel and no outcome. Browser diagnostics observed no script/runtime errors; no cross-browser or sustained frame-time/memory claim.

Next: Picard routes the seven integration items to Geordi. Once assembled, Worf verifies the three real physical encounter paths, consultations, console effects, intentional-dialogue-focus versus pause/re-entry, timeout/fallback, checkpoint/restart and any approved live validation. Existing native pointer-lock/browser/performance coverage obligations from G1 remain open. No public hosting, old-repo reuse, P3/style/gate advance or Babble write was performed.
