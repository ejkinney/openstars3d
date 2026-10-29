# Open Stars — G1 it-runs gate

Status: PASS for local development — Picard approves G1 after reviewing Worf's revision 2 report and active/paused captures on 2026-10-28. D1–D4 and D6 are closed within the documented instrumentation scope. P2 systems work is authorized. This is not a release, full physical-input certification or G4 pass.

Picard reviewed the four delivered captures and the greybox/scene-contract handoff. The overview shows the captain chair, three named crew placeholders and console geometry. The capture named viewscreen.png shows a chair and wall, with no legible forward viewscreen; crew.png shows a blank corner. These captures do not substantiate the named subjects. This is an evidence concern requiring Worf's inspection, not a finding that the entities are absent.

Geordi reports successful headless boot, seven registered interactables and fixed 1280×720 rendering at DPR 1 and 2. These are builder-reported checks pending independent verification. Software-rendered screenshot fps is not G4 evidence.

Worf must verify normal local startup, first-person navigation and bounds/collisions, reachable crew and console interactions, single E dispatch and prompts, pointer-lock/release/pause behavior, console/runtime errors and the forward viewscreen's actual visibility. Capture evidence from normal play with clear views of the screen, crew and physical console prompt. Record any failures with reproducible steps and recommended owner; do not change renderer/gameplay as QA.

Source artifacts: docs/G1-greybox-handoff.md, docs/scene-contract.md, evidence/overview.png, evidence/viewscreen.png, evidence/consoles.png, evidence/crew.png. Local launch instructions are in README.md. No gameplay or live AI is expected at G1.

## Independent result and captain's decisions

Worf's verification (2026-10-28, 17:34–17:56Z) identifies D1: W/S movement reversed relative to camera forward; D2: the opaque trim slab completely hides the emissive viewscreen; D3: viewscreen/crew capture presets aim at the wrong subjects; D4: Mara blocks the helm's normal room-side approach. Picard's review of the supplied images is consistent with the blank screen surface and blocked helm approach.

Required corrections, owner Geordi:

- D1: restore W/Up toward camera forward and S/Down away from it, retaining correct strafe and collision behavior.
- D2: expose the viewscreen surface with a real border or equivalent geometry, keeping the screen inside the bridge's visible wall/ceiling bounds.
- D3: correct the evidence camera presets and regenerate captures that visibly substantiate the screen and crew. Preserve the original QA evidence and put new evidence in a revision directory.
- D4 decision: helm must be approachable and selectable from the room side by an ordinary walking route without squeezing behind the console. Reposition Mara or the console while keeping both independently selectable and retaining collision boundaries.

D5 decision: looking down at a physical console is acceptable; keep the selection volume aligned with its visible panel. No automatic level-gaze selection or through-crew selection is required. The screen/console visibility and prompt should make the intended interaction discoverable. Do not widen an invisible target through Mara to conceal the layout defect.

Worf confirmed boot/render in Chrome, Safari and Firefox; seven interaction IDs and single-E dispatch; Chromium console cleanliness; pointer lock/release in native Chrome; collision boundaries and gaze behavior via instrumentation. Preserve these results as the baseline. Method limits remain explicit: much of the input suite used a pointer-lock shim and direct handler/update instrumentation; Firefox native capture has browser onboarding in front; Safari/Firefox console capture and sustained performance remain unverified. HUD fps does not pass G4.

Next: Geordi returns corrected build, changed-path/check summary and fresh captures. Worf then re-verifies D1–D4 and affected input/collision/interaction behavior; Picard reviews evidence and decides G1. G2–G5 remain open.

## Revision 1 review — awaiting re-verification

Geordi delivered docs/G1-r1-handoff.md and evidence/g1-r1/. Picard reviewed the six supplied captures: the blue viewscreen is visible, the crew preset now frames Mara, and the helm panel is visible without Mara in front. This resolves the earlier capture-subject concern visually, subject to independent runtime checks. Geordi reports the movement-sign correction, four-bar screen border, revised presets and Mara's relocation; these functional claims remain unverified for this revision.

The handoff states that helm-prompt uses a debug prompt overlay. That image demonstrates overlay rendering only; it does not establish genuine gaze selection or physical reachability. Worf must test the ordinary startup route with no preset or forced prompt, walk to helm from the room side, obtain the live prompt and dispatch exactly one interaction. Recheck W/S and arrow-key movement relative to camera forward at more than one yaw, collision and separate Mara/helm targeting, resolution and boot/errors. Keep diagnostic GPU readback notices distinct from application errors. Original failed gate and QA evidence remain preserved until a recorded new decision.

## Revision 1 independent result — D6 blocks G1

Picard reviewed docs/G1-r1-worf-verification.md and the live helm, Mara and viewscreen overlay captures. Worf verifies D1–D4 corrected: sixteen movement cases at yaw 0/0.7, thirteen collision approaches, all seven single-E interaction IDs, separate room-side helm/Mara live targeting, visible screen/crew, and fixed 1280×720 at actual DPR 1 and 2. D1–D4 are closed on this evidence; do not repeat unrelated changes.

D6, owner Geordi: after Escape, movement/look pause and prompts hide but pressing E still invokes consoles/helm. Worf reproduced it with native pointerLockElement null and the test lock shim removed. Required behavior: zero interaction callbacks while unlocked/paused, including before initial entry; after successful re-entry, one fresh E press dispatches once to the current enabled target. No queued interaction should replay on re-entry. Keep the fix confined to the renderer-owned input boundary and document it for Data.

Method limitations from Worf remain accepted and explicit: the representative route used trusted key events plus fixed updates and a lock shim, with synthetic relative mouse events; it is not a complete native physical walkthrough. No fresh native three-browser pass or headless suite was performed. Browser console limits and G4 remain open. HUD readings include synthetic update samples and have no performance significance.

Next: Geordi supplies a focused D6 correction and handoff; Worf rechecks paused/pre-entry suppression, re-entry and ordinary single-E dispatch, plus any directly affected behavior. Picard then decides G1. P2 and later gates stay held.

## Revision 2 delivery — independent D6 check pending

Geordi delivered docs/G1-r2-handoff.md, a focused src/player.js correction and contract clarification with version/IDs unchanged. Builder reports thirteen runtime assertions passing, including native-null pre-entry/paused trusted E suppression and fresh re-entry dispatch under a temporary lock shim. Picard reviewed the active/paused overlay captures: active shows the live helm prompt and crosshair; paused hides them. Images cannot prove callback suppression, so D6 remains open pending Worf's independent check. No new movement/geometry changes are reported, and prior verification evidence is retained.

Worf's next review is focused on pre-entry/paused zero dispatch, re-entry without replay, fresh single-E dispatch, repeat/duplicate-down suppression, current enabled gaze and the native-null/cached-lock transition. Record any native-pointer-lock limitation explicitly. Do not repeat the full unaffected browser/performance suite without a regression signal. G1 remains failed until Picard records a new decision.

## Revision 2 independent result and G1 approval

Worf's docs/G1-r2-worf-verification.md reports nineteen independent assertions passing, closing D6: native-null pre-entry and paused trusted E suppression, cached-lock/native-null suppression, released/held paused presses without replay, fresh single-E dispatch, repeat/duplicate suppression, current-gaze refresh, disabled/empty target suppression and affected movement/look/pause smoke. Source preservation supports retaining the revision 1 D1–D4 baseline. Picard reviewed the active and native-null paused overlay captures and accepts the recommendation for development progression.

Outstanding verification obligations for later content/release gates: actual native lock acquisition/re-entry and a representative physical walkthrough of the assembled encounter; browser coverage with Firefox onboarding obstruction cleared through an authorized route; Safari/Firefox console observations; sustained frame-time/memory measurements at the G0 target. Embedded-browser native entry rejected with SecurityError despite trusted activation. Do not bypass that restriction or represent lock-shim tests as native entry. These are explicit coverage limits, not silently closed checks. A complete native interaction route is required before a final local-prototype ship verdict.

Next owner Data: P2 deterministic encounter/crew/resource/restart systems and cheap DeepSeek adapter preparation, consuming Geordi's scene contract. Renderer-hook and bootstrap requirements return through Picard to Geordi. No live paid model calls or public deployment are authorized. Guinan's style review and Worf's assembled-content/performance/release checks follow at their gates.
