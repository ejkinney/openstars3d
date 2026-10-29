# G1 — Revision 1 Handoff (P1 corrections)

Status: **P1 corrections complete — awaiting Worf's re-verification and Picard's G1
decision.** (Geordi does not claim G1 pass.)

Owner: Geordi. Reference defect report: `docs/G1-worf-verification.md` (preserved,
unmodified) and `docs/G1-it-runs.md`. Worf's original QA artifacts remain under
`evidence/g1-worf/` (untouched); fresh captures are under `evidence/g1-r1/`.

## 1. Corrections

### D1 — W/S forward/back sign (fixed)
`src/player.js` `update()`: `W`/`Up` now set `mz += 1` and `S`/`Down` set `mz -= 1`,
so displacement is along `+forward` for W (toward `−Z`, the viewscreen) and
`−forward` for S. `A`/`D` strafe unchanged (already correct per Worf).

### D2 — viewscreen occluded by frame (fixed)
`src/scene.js`: the single oversized trim slab (front face `−5.78`, larger than the
screen) is replaced by a **true border of four edge bars** (top/bottom/left/right)
whose front faces sit flush with the screen face (`−5.83`) and which only occupy
the perimeter, leaving the emissive screen fully visible. The screen was also
shrunk to `5.2 × 1.7` centred at `(0, 2.1, −5.95)` so it stays inside the visible
wall/ceiling bounds (top at `y = 3.80` < ceiling `4.0`; x within the walls).

### D3 — evidence presets mis-aimed (fixed)
`src/main.js`: presets now aim by **world-space look-at target** (camera
`lookAt(target)`) instead of hand-tuned yaw/pitch, so each preset deterministically
frames its subject:
- `viewscreen` → looks at the viewscreen centre (verified: bright blue screen fills
  frame centre in `evidence/g1-r1/viewscreen.png`).
- `crew` → looks at Mara Vale at the helm (verified: Mara's gold label/accent in
  frame in `evidence/g1-r1/crew.png`).
- new `helm` → room-side view of the helm console; `helm-prompt` adds the `[E]`
  prompt overlay for reachability evidence.

### D4 — helm console blocked by Mara (fixed, per Picard's decision)
`src/scene.js`: Mara Vale repositioned from `(−3.4, −2.6)` to **`(−4.9, −3.1)`**,
beside (port of) the helm console rather than in front of it. The helm console's
room-side face (`z ≈ −3.10`, `x −4.35…−2.45`) is now reachable by a normal walk from
the bridge centre; Mara remains independently selectable with her own collider
(`x −5.32…−4.48, z −3.52…−2.68`, no overlap with the console). Seven canonical IDs
unchanged; crew positions are not part of the contract surface.

### D5 — notes (no change required)
Console selection volumes remain aligned to their visible pedestal+panel geometry
(no widening, no through-crew reach); downward gaze to select a desk panel is
accepted per Picard's decision. No code change.

## 2. Contract status

`docs/scene-contract.md` and `src/contract.js` are **unchanged** — version 0.1.0,
same seven canonical IDs, same `onInteract` hook, same resolution gate. The only
scene change is Mara's position (not a contract field).

## 3. Files changed (this revision)

```
src/player.js     D1 fix (W/S sign); setPreset now takes a look-at target
src/scene.js      D2 fix (border ring viewscreen + resized screen); D4 fix (Mara reposition)
src/main.js       D3 fix (look-at presets); + helm/helm-prompt presets; + ?prompt= overlay
tools/capture.js  writes to evidence/g1-r1/; adds helm + helm-prompt shots
docs/G1-r1-handoff.md  this file
evidence/g1-r1/   fresh captures (6 PNGs) + capture-summary.json + console.log
```

## 4. Checks actually run (this revision)

1. **Boot**: page loads, app starts, no JS errors — `evidence/g1-r1/console.log`
   clean (only benign readPixels GPU-stall notices).
2. **Resolution gate**: buffer and canvas `1280×720` at dpr 1 (headless).
3. **Scene graph**: 59 entities, 45 mesh instances, 7 interactables, contract 0.1.0.
4. **Mara position**: reads `(−4.9, 0, −3.1)` at runtime (capture summary).
5. **D2 verification (pixel)**: `viewscreen.png` centre samples
   `rgb(60,129,226)` (bright emissive blue) — screen visible, not occluded.
6. **D4/D3 verification (pixel)**: `helm-prompt.png` vs `helm.png` differ by 8941
   pixels including gold prompt text; `crew.png` contains Mara's gold accent (3965
   gold pixels) — crew and reachable-helm prompt are in frame.
7. **D1**: sign corrected in code (W now `+forward`); movement re-verification is
   Worf's, per the handoff split.

## 5. Known limitations (unchanged from G1 handoff)

- Captures are headless/software-render (visually correct, **not** perf evidence).
- Shadows and MSAA off; `preserveDrawingBuffer` on for readback verification.
- No gameplay (E only fires `Contract.onInteract`); flat movement only.
- Real-GPU fps and the G4 gate remain Worf's on Chrome/Safari/Firefox.

## 6. Next

Worf: re-run the G1 §4 suite against this build (D1–D4 and affected input/collision/
interaction). Picard: review `evidence/g1-r1/` and decide G1. G2–G5 remain open.
