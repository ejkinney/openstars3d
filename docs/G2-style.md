# Open Stars — G2 Style Direction & Visual QA Verdict (P3)

- **Gate:** G2 (P3 Style Lock & Visual QA Review)
- **Owner:** Guinan (Art Director & Visual QA)
- **Date:** 2026-10-29
- **Recommendation to Picard:** **BLOCK** — Veto style lock on the current P2 greybox captures. Route the exact P3 visual corrections below to Geordi (renderer/UI skin), then re-verify with a coherent post-P3 screenshot set before advancing to G3/G4.
- **Boundary & Scope Compliance:** Reviewed within the scoped P2 mock/offline boundary approved in `docs/P2-picard-review.md`. No renderer or gameplay code was edited by Guinan. No live OpenCode or DeepSeek calls were made, and no live model output or generation quality is claimed.

---

## 1. Executive Verdict

The P2 build proves out the functional display hooks and the accessible DOM presentation, but visually it is still a raw P1 greybox bolted onto terminal text dumps. Worse, the four handoff captures do not even depict the same geometry: `incoming.png`, `crew.png`, and `debrief.png` were captured before Geordi's console-fascia change, while `operation-final-canvas.png` (the only post-change capture, taken as a canvas-only readback without DOM overlays) reveals that the new vertical console fascia (`1.78 m × 0.70 m` at local `[0, 0.97, 0.79]`) floats in front of the pedestal without a housing, crowds Ivo Sen's silhouette, and causes the Helm display slab to visually collide with Mara Vale and the forward viewscreen in the background.

Against the `docs/G0-plan.md` bar—a walkable low-poly starship bridge with three readable crew silhouettes, physical station readouts, minimal overlay, and clear distinction between authoritative ship state and optional/offline crew reactions—the current visuals fail on five counts:

1. **Inconsistent capture baseline & floating console fascia (`operation-final-canvas.png` vs. `incoming.png`, `crew.png`, `debrief.png`):** Three captures show the retired flat top-panel text, while `operation-final-canvas.png` shows an unframed vertical black slab overhanging the console pedestal by `0.34 m` and jutting up to `y = 1.32 m`, clipping across Mara Vale and the lower viewscreen frame.
2. **DOM panel occlusion & text bleed-through (`debrief.png`, `crew.png`, `evidence/p2-bridge/operation.png`):** The fixed right-hand `#panel` (`width: 460px`, `top: 64px`, `background: rgba(6,13,24,.97)`) sits directly over the right third of the forward viewscreen, slicing `"Restar[t at communications.]"` mid-word in `debrief.png` while faint viewscreen text bleeds through the panel background. Floating `.crew-label` tags remain visible over the 3D scene while modal panels are open (`operation.png`).
3. **Featureless bowling-pin crew silhouettes & bare shoebox room (`crew.png`, `operation-final-canvas.png`, `evidence/g1-r1/overview.png`):** All three officers are identical grey cylinders (`#4a4f5c` / `#2c2f38`) with featureless beige sphere heads (`#d8b48a`) and tiny `5 cm` box props. In `operation-final-canvas.png`, Ivo Sen's torso enters the right third of the frame as an unrecognizable grey column obstructing the Science Console reading lane. The bridge room (`16 × 4 × 12 m`) has zero bulkhead ribs, station alcoves, floor zoning, or architectural trim.
4. **Flat lighting & splintered palette (`src/scene.js`, `src/displays.js`, `index.html`):** High uniform ambient light `(0.5, 0.52, 0.62)` plus two shadowless directional lights flatten every surface into the same slate grey. The forward viewscreen backing slab (`#2a5a9e`, `emissiveIntensity: 2.2`) creates a blown-out electric-blue neon border around the `#08121e` text canvas that overpowers the physical frame (`#3a4150`). Station division colors diverge between `src/scene.js`, `src/displays.js`, and `index.html`.
5. **Raw terminal typography & unstyled `.briefing-label` (`incoming.png`, `crew.png`, `debrief.png`, `operation-final-canvas.png`):** Both the 3D displays and the DOM modal render everything in uniform monospace (`36px` / `29px` on canvas; `SF Mono` across all DOM text), leaving ~45% of the forward viewscreen empty black space. In `index.html`, `.briefing-label` (`"Ship briefing · authoritative"`) has **no CSS rules**, so it renders as ordinary body copy indistinguishable from `#panel-text`.

---

## 2. Evidence Reviewed

| Artifact | Path | Visual QA Observation |
| --- | --- | --- |
| Incoming capture | `/Users/elliot/OpenBot/Shared/Transfers/312274e6-e886-4dce-b20b-e94a68c4776f/incoming.png` (`evidence/p2-bridge/incoming.png`) | Forward viewscreen shows 5 left-aligned lines of `36px monospace` text in the upper half of `#08121e` canvas; bottom ~45% is dead black space. Blown-out `#2a5a9e` (`intensity: 2.2`) slab halo surrounds the canvas. Lower third of frame is featureless dark-grey floor between two unframed console backs. Reflects pre-fascia console geometry. |
| Crew consultation capture | `/Users/elliot/OpenBot/Shared/Transfers/312274e6-e886-4dce-b20b-e94a68c4776f/crew.png` (`evidence/p2-bridge/crew.png`) | Mara Vale is a grey cylinder stack with a beige sphere head and a small orange block (`0.05 × 0.03 × 0.06 m`) protruding like a peg. Right-side `#panel` overlaps the angled forward viewscreen with visible text bleed-through (`Wa... / TIME...`). `.briefing-label` (`"Ship briefing · authoritative"`) is unstyled and visually merges with `#panel-text`. Offline label (`"Fallback — offline crew reaction below (offline). No AI-generated response."`) and `#panel-flavour` (`"Standing by, Captain."`) are present and honest. |
| Science operation capture (canvas-only) | `/Users/elliot/OpenBot/Shared/Transfers/312274e6-e886-4dce-b20b-e94a68c4776f/operation-final-canvas.png` (`evidence/p2-bridge/operation-final-canvas.png`) | Canvas-only readback (DOM `#panel` and `Pause` button excluded). Shows the new `[0, 0.97, 0.79]` vertical console fascia: an unframed black rectangle overhanging the pedestal in mid-air. In the upper right background, the Helm console's vertical fascia (`APPROACH UNSET...`) collides with Mara Vale's torso and clips across the forward viewscreen border. In the right foreground, Ivo Sen's grey cylinder body crowds the camera's view of the Science Console. |
| Earlier operation capture | `/Users/elliot/OpenBot/Shared/openstars-prototype-20261028/evidence/p2-bridge/operation.png` | Shows why flat `-24°` top-panel text was illegible from standing eye height, and shows floating `.crew-label` (`Mara Vale`) colliding with the viewscreen and open `#panel`. |
| Debrief capture | `/Users/elliot/OpenBot/Shared/Transfers/312274e6-e886-4dce-b20b-e94a68c4776f/debrief.png` (`evidence/p2-bridge/debrief.png`) | `#panel` (`Communications Console`) occludes the right third of the forward viewscreen, truncating `"12/12 rescued; 0 lost; hull 100/100. Restar[t at communications.]"` with ghosted bleed-through behind the modal. Shows redundant meta-labels (`"Ship briefing · authoritative"` and `"Canonical bridge information."`) around a single line of text. |
| G1 overview reference | `/Users/elliot/OpenBot/Shared/openstars-prototype-20261028/evidence/g1-r1/overview.png` | Confirms full-room greybox state: bare walls, flat lighting, identical cylinder crew placeholders, and isolated maroon captain's chair (`#5a2d2d`). |
| Source & Gate Docs (read-only) | `docs/G0-plan.md`, `docs/P2-picard-review.md`, `docs/P2-bridge-handoff.md`, `docs/scene-contract.md`, `index.html`, `src/scene.js`, `src/displays.js`, `src/presenter.js` | Verified exact material hexes, light intensities, canvas dimensions/fonts, console AABBs, and DOM label logic. |

---

## 3. Five-Pillar Style Verdict & Locked P3 Direction

### 3.1 Palette Verdict: **FAIL (Splintered & Cold Greybox) → Lock Warm/Cool TNG Bridge Palette**

**Current Defect:**
- The room is a monotone cold slate (`#2e323c` floor, `#353a46` walls, `#23262f` ceiling) with a disconnected dark-red chair (`#5a2d2d`).
- Division accents disagree across files:
  - `src/scene.js`: Helm `#e8a33d`, Science `#3d7de8`, Engineering `#e85a3d`, Comms `#3de88a`.
  - `src/displays.js`: Helm `#e8a33d`, Science `#6aa6ff`, Engineering `#ff8970`, Comms `#6ae8aa`.
  - `index.html`: Hardcodes `#ffd479` (gold title) and `#7fa3d8` (blue border) on `#panel` regardless of which station or officer is open.
- `bridge/viewscreen` uses emissive `#2a5a9e` at `emissiveIntensity: 2.2`, blowing out into a harsh electric-blue border around the `#08121e` canvas (`incoming.png`, `debrief.png`).

**Locked P3 Palette Specification (for Geordi):**

| Role | Token / Target | Hex / Value | Usage |
| --- | --- | --- | --- |
| Bridge Bulkhead Upper | Warm Taupe-Slate | `#3b3d46` | Upper wall panels (`bridge/wall/*`) |
| Bridge Bulkhead Trim / Ribs | Deep Graphite | `#222630` | Architectural ribs, viewscreen bezel frame (`matTrim`), console pedestals |
| Deck Perimeter | Charcoal Deck | `#262932` | Outer bridge deck (`bridge/floor`) |
| Command Well Carpet | Warm Bridge Plum-Burgundy | `#462c33` | Central command carpet pad under Captain's Chair & forward approach |
| Captain's Chair | Command Maroon & Warm Tan | `#5e2f34` / `#8c6d53` | Seat/backrest (`#5e2f34`) with warm tan/graphite armrests (`#353036`) |
| Display Surface Backing | Deep Telemetry Navy | `#070d17` | 2D canvas background for viewscreen and consoles (`src/displays.js`) |
| Viewscreen Bezel Glow | Subtle LCARS Cyan-Blue | `#183254` (`intensity: 0.65`) | Replace blown-out `#2a5a9e` (`intensity: 2.2`) on `bridge/viewscreen` slab |
| **Helm Accent (Mara Vale)** | **Command Amber-Gold** | **`#f0a83e`** | Unify across `scene.js`, `displays.js`, `.crew-label`, and `#panel` theme |
| **Science Accent (Ivo Sen)** | **Sensor Azure-Cyan** | **`#4da3ff`** | Unify across `scene.js`, `displays.js`, `.crew-label`, and `#panel` theme |
| **Engineering Accent (Tessa Rook)** | **Operations Terra-Coral** | **`#ee6445`** | Unify across `scene.js`, `displays.js`, `.crew-label`, and `#panel` theme |
| **Communications Accent** | **Channel Teal-Emerald** | **`#3ad896`** | Unify across `scene.js`, `displays.js`, and `#panel` theme |
| Primary Telemetry Text | Crisp Starlight | `#eef4ff` | Primary canvas & DOM body copy |
| Secondary / Muted Label | Cool Pewter | `#94abc7` | Subtitles, metadata labels, inactive borders |
| Alert / Warning Accent | Hazard Amber | `#ffbe55` | Resource warnings, uncertainty badges, focus rings |

---

### 3.2 Typography Verdict: **FAIL (Raw Monospace Terminal Dump) → Lock Structured Telemetry & Dual-Stack Type**

**Current Defect:**
- `index.html` applies `"SF Mono", ui-monospace, Menlo, Consolas, monospace` to the entire document. Narrative briefings, officer dialogue, headings, and buttons read like a code debugger.
- `src/displays.js` draws a single left-aligned block of `36px monospace` (viewscreen) or `29px monospace` (consoles) with no header bar, no telemetry grid, and no visual distinction between status text and legal action labels (`incoming.png`, `operation-final-canvas.png`). The bottom ~45% of the forward viewscreen is empty (`incoming.png`, `debrief.png`).

**Locked P3 Typography & Layout Specification (for Geordi):**

1. **DOM Font Stacks (`index.html`):**
   - **UI Headings & Officer/Briefing Prose (`--font-sans`):** `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif` (`#panel-text`, `#panel-flavour`, `#panel-actions button`, `#start .help`).
   - **Display Headers & Station Titles (`--font-display`):** `system-ui, -apple-system, "Segoe UI", sans-serif` with `font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em` (`#start h1`, `#panel h2`).
   - **Telemetry, Badges, Keys & Status Tags (`--font-mono`):** `"SF Mono", ui-monospace, Menlo, Consolas, monospace` (`.briefing-label`, `#panel-source`, `.crew-label .role`, `<kbd>`, `#hud`).
2. **Forward Viewscreen 2D Canvas Layout (`src/displays.js`, `1536 × 486`):**
   - Replace the 5-line top-left text dump with a structured **3-zone starship tactical display** (using `Contract.setViewscreen(text)` parsing the 5 newline-delimited canonical lines already supplied by `displays.present`):
     - **Top Header Bar (`y: 0..76`):** Full-width top bar with a `12px` left accent pill (`#f0a83e` during incoming/planning, `#3ad896` on debrief), uppercase geometric title (`34px bold system-ui`, letter-spaced) on the left (`ASTER / DISTRESS CHANNEL` or `ASTER / RESCUE DEBRIEF`), and phase/signal tag on the right.
     - **Center Main Directive & Telemetry Strip (`y: 96..340`):**
       - Left column (`width: 62%`): Main objective prose (`34px system-ui`, `#eef4ff`, comfortable `48px` line height) framed in a subtle inner panel (`#0d1828` with `2px` `#2a4365` border).
       - Right column (`width: 34%`): Three stacked horizontal telemetry gauge cards for `TIME`, `ENERGY`, and `HULL` (`28px bold monospace`, showing both the numeric value e.g. `8/8`, `100/100` and a proportional fill bar).
     - **Bottom checklist / footer bar (`y: 365..460`):** Full-width status strip (`#0c1626`) displaying the 4 preparation pills (`Crew 0/3 | Scan pending | Approach unset | Power unset` or debrief outcome `Rescued 12 / Lost 0 / Hull damage 0`) on the left and the action directive (`Use physical stations...` / `Communications: restart encounter`) in `#f0a83e` on the right. This fills the `1536 × 486` canvas intentionally with zero dead void.
3. **Physical Console 2D Canvas Layout (`src/displays.js`, `1024 × 400`):**
   - Format `setConsoleContent(id, { text, actions })` into three visually distinct bands instead of uniform newline text:
     - **Station Header Band (`y: 0..64`):** Filled bar in dimmed station accent (`rgba(accent, 0.18)`) with an `8px` solid left bar in station accent hex, rendering the station title (`SCIENCE CONSOLE`) in `30px bold system-ui` uppercase.
     - **Telemetry Readout Body (`y: 80..240`):** Station status lines in `28px monospace` (`#eef4ff`).
     - **Available Action Pills (`y: 255..385`):** Draw each legal action label from `actions` inside a distinct rounded pill/button graphic (`#132238` fill, `2px` station-accent left border, `24px system-ui` `#ffd479` text, prefixed with `▸ `) so legal actions never masquerade as passive status lines, or show `STATION READY — NO PENDING ACTION` in muted `#94abc7` when `actions` is empty.

---

### 3.3 Lighting & Material Verdict: **FAIL (Flat Ambient Wash & Blown-Out Screen Border) → Lock Warm/Cool Bridge Lighting**

**Current Defect:**
- `app.scene.ambientLight = new pc.Color(0.5, 0.52, 0.62)` combined with `keyLight` (`intensity: 1.5`) and `fillLight` (`intensity: 0.6`) washes out all surface normals. Floor, walls, pedestals, and cylinders have almost no value separation.
- `bridge/viewscreen` uses `emissive: '#2a5a9e', emissiveIntensity: 2.2`, which creates a glaring royal-blue border around `bridge/viewscreen/content` (`incoming.png`, `debrief.png`).

**Locked P3 Lighting & Material Specification (for Geordi):**

1. **Ambient & Directional Balance (`src/scene.js`):**
   - Lower `app.scene.ambientLight` to `new pc.Color(0.28, 0.31, 0.38)` so unlit undersides and wall corners hold depth.
   - Set `light/key` (overhead warm-neutral bridge key at `(0, 6, 4)`) to `color: new pc.Color(1.0, 0.95, 0.88)`, `intensity: 1.15`.
   - Set `light/fill` (cool forward viewscreen bounce at `(0, 2.5, -5.0)` looking toward `(0, 1.2, 2.0)`) to `color: new pc.Color(0.38, 0.55, 0.85)`, `intensity: 0.55`.
   - Add one warm aft/command overhead point or spot light (`light/command`, `type: 'omni'`, `color: new pc.Color(1.0, 0.82, 0.62)`, `intensity: 0.85`, `range: 9`, at `(0, 3.6, 1.2)`) to pool warm TNG light over the Captain's Chair and center deck carpet while leaving the perimeter stations cooler and high-contrast.
2. **Ceiling & Architectural Light Strips:**
   - Replace the single flat grey-blue ceiling slab (`bridge/light-strip/center`) with two longitudinal warm-white ceiling coves (`x = -2.6` and `x = +2.6`, `emissive: '#dbe7ff'`, `emissiveIntensity: 0.85`) and an overhead perimeter soffit band so the ceiling frames the viewscreen axis.
3. **Viewscreen Backing Slab Fix:**
   - Change `screenMat` on `bridge/viewscreen` (`src/scene.js` line 174) from `emissive: '#2a5a9e', emissiveIntensity: 2.2` to `diffuse: '#0b1018', emissive: '#162c4a', emissiveIntensity: 0.65`, and widen the four trim bars (`bridge/viewscreen/frame/*`) slightly or match `bridge/viewscreen/content` to `10.35 × 3.35` so the text canvas meets the physical metallic bezel (`#222630`) cleanly with a thin recessed accent hairline instead of a thick neon-blue slab halo.

---

### 3.4 Silhouette, Console Geometry & Spatial Readability Verdict: **FAIL (Overhanging Console Slabs, Featureless Crew Cylinders & Modal Viewscreen Occlusion) → Lock P3 Silhouettes & Layout**

**Current Defects:**
1. **Console Display Overhang & Viewscreen Clipping (`operation-final-canvas.png`):**
   - In `src/displays.js`, `surface(id, C.entity(id), 1.78, 0.7, [0, 0.97, 0.79], [0, 0, 0], ...)` places a `1.78 m × 0.70 m` vertical plane at `z = +0.79` (where the pedestal ends at `z = +0.45` and the desk panel ends at `z ≈ +0.73`), leaving the screen hanging in mid-air and projecting up to `y = 1.32 m`.
   - In `operation-final-canvas.png`, the Helm console's vertical display plane at `z = -3.9 + 0.79 = -3.11` sticks straight up into the camera's sightline toward Mara Vale and the lower border of the forward viewscreen.
   - Meanwhile, `consoles/science` (`x = -6.0, z = -0.5`) and `consoles/engineering` (`x = +6.0, z = -0.5`) have unrotated `[0, 0.97, 0.79]` fascias facing `+Z` (aft wall), right into Ivo Sen (`x = -5.2, z = +0.6`) and Tessa Rook (`x = +5.2, z = +0.6`).
2. **Crew Silhouettes (`crew.png`, `operation-final-canvas.png`, `overview.png`):**
   - All three officers share the exact same cylinder stack (`radius 0.24` legs, `radius 0.34` torso, `radius 0.23` sphere head) with near-invisible `5 cm` box props. In `operation-final-canvas.png`, Ivo Sen reads as a grey pillar blocking the right side of the frame.
3. **DOM `#panel` Occluding the Forward Viewscreen (`debrief.png`, `crew.png`):**
   - `#panel` (`right: 18px; top: 64px; width: 460px`) covers the right third of the forward viewscreen (`Restar[t at communications.]` clipped in `debrief.png`) and lets viewscreen text bleed faintly through its `0.97` alpha background.
   - Floating `.crew-label` divs remain visible on screen while `#panel` is open (`operation.png`).

**Locked P3 Silhouette & Readability Corrections (for Geordi):**

1. **Replace the Vertical Overhang Slab with a Sloped, Hooded Console Display Inside Existing AABBs (`src/displays.js` + `src/scene.js`):**
   - **Keep all 7 canonical entity IDs and existing console world AABBs (`x ± 0.95, y: 0.05..1.35, z: -0.75..+0.80`) intact** so `Contract.version = 0.1.0` and all collision/gaze tests stay green.
   - Instead of floating a vertical `0.70 m` wall at `z = +0.79`, mount the console display surface as an **angled console display hood** integrated with the desk panel:
     - Position the display surface at local `[0, 1.08, 0.36]`, tilted at `[-48, 0, 0]` (a `48°` angled console readout facing up and toward the approaching player at eye height `y = 1.7 m`), with dimensions `1.68 m × 0.52 m`.
     - Add a matching dark bezel/hood backing box (`sx = 0.88, sy = 0.04, sz = 0.30` at `[0, 1.06, 0.34]`, Euler `[-48, 0, 0]`) and side cheek plates on the console entity in `src/scene.js` so the screen is physically housed inside the console body and never hangs in mid-air.
     - Because the top edge of this sloped hood stays at `y ≤ 1.24 m` (instead of a vertical wall up to `y = 1.32 m` at `z = +0.79`), `consoles/helm` and `consoles/comms` will no longer visually clip across Mara Vale or the forward viewscreen, while remaining crisp and legible from normal room-side standing distance!
2. **Differentiate the Three Officer Silhouettes (`src/scene.js` `buildCrew`):**
   - Keep crew world-space collider AABBs (`x ± 0.42, y: 0.05..1.85, z ± 0.42`) unchanged, but replace the uniform grey cylinder stack with distinct Starfleet-inspired geometric silhouettes:
     - **Division Uniform Yoke & Shoulders:** Give each officer a distinct division-colored upper shoulder yoke (`#f0a83e` gold for Mara, `#4da3ff` blue for Ivo, `#ee6445` red-coral for Tessa) over a crisp charcoal-black uniform tunic (`#1b1e26`), plus wide angled shoulder pads (`box` at `y = 1.30`) and distinct upper/lower limb blocks so they read immediately as humanoid officers from any angle—even when partially in foreground (`operation-final-canvas.png`).
     - **Role-Specific Silhouette Props (readable at 5 m):**
       - **Mara Vale (Helm):** Wrap-around gold visor band (`0.26 m` wide across the face, not a `5 cm` nose peg) + angled flight-collar trim.
       - **Ivo Sen (Science):** Asymmetric over-shoulder science sensor pack / tricorder sling + held data slate (`0.22 × 0.28 m` tilted tablet with glowing cyan screen face).
       - **Tessa Rook (Engineering):** Broad utility harness / engineering vest silhouette + diagnostic array on hip and forearm gauntlet blocks.
3. **Add Bridge Architectural Framing (`src/scene.js`):**
   - Add non-colliding visual detail inside the `16 × 4 × 12 m` room:
     - Central command carpet pad (`box` `sx = 3.2, sy = 0.01, sz = 3.0` at `(0, 0.005, 0.2)`, `#462c33`) with a thin metallic border trim anchoring the Captain's Chair and center bridge lane.
     - Vertical bulkhead ribs along the port and starboard walls (`x = ±7.88` at `z = -4.0, -1.5, +1.5, +4.0`) and a bridge arch spanning `(y = 3.85, z = -1.5)` to give perspective depth and station framing.
4. **Fix `#panel` Modal Occlusion & `.crew-label` Clutter (`index.html`, `src/main.js`):**
   - Position `#panel` at the **lower-right or docked right-side console drawer** (`right: 20px; bottom: 20px; top: auto; width: min(430px, calc(100vw - 40px)); max-height: calc(100vh - 76px); background: #070e1a;` — fully opaque or `rgba(7, 14, 26, 0.99)` with `backdrop-filter: blur(8px)`) so that during `debrief.png` and station interactions, the top header and telemetry of the forward viewscreen remain unobstructed and zero background text bleeds through the panel!
   - When `#panel` is open (`!ui.panel.hidden` or `presenter.getMode() !== 'walking'`), hide `#labels` (`els.labels.style.opacity = '0'` / `hidden`) so floating `.crew-label` tags never collide with open dialogs or pause overlays (`operation.png`).

---

### 3.5 UI-Label Verdict: **PASS ON EPISTEMIC HONESTY / REFINE VISUAL HIERARCHY (Authoritative Canonical Advice vs. Optional Generated Text & Offline Label)**

**Verdict against G0 Brief & P2 Boundary (`docs/G0-plan.md`, `docs/P2-picard-review.md`):**
- **Semantic & Epistemic Structure (`src/presenter.js`, `index.html`, `crew.png`, `debrief.png`):** **PASS (Must Retain).**
  - The presenter strictly separates deterministic ship state (`#panel-text`, preceded by `.briefing-label`: `"Ship briefing · authoritative"`) from the source status line (`#panel-source`) and the optional/offline crew reaction (`#panel-flavour`).
  - In `crew.png`, the offline state is explicitly and honestly labelled:
    - Header label: `Ship briefing · authoritative`
    - Authoritative text (`#panel-text`): `Aster: planning; time 8/8, power 100/100, hull 100/100. I can take us directly in for one time unit, but debris will hit us. Scan first and I can use a safe two-unit corridor.`
    - Source status (`#panel-source`): `Fallback — offline crew reaction below (offline). No AI-generated response.`
    - Offline reaction (`#panel-flavour`): `Standing by, Captain.`
  - When live optional generation is enabled (not claimed or invoked in P2/G2), `src/presenter.js` labels it: `AI crew assessment below — optional, may be inaccurate. Ship briefing and station actions remain authoritative.`
- **Visual Hierarchy Defects in Current CSS (`crew.png`, `debrief.png`, `index.html`):**
  1. `.briefing-label` has **no CSS rule** in `index.html`, so `"Ship briefing · authoritative"` renders in the exact same `14px #cfe0ff` body style as `#panel-text` (`crew.png`, `debrief.png`).
  2. When viewing a physical console (`debrief.png`, `operation.png`), `#panel-source` displays `"Canonical bridge information."` directly below `#panel-text`, duplicating the top `"Ship briefing · authoritative"` label on a panel that has no crew reaction block.

**Required P3 UI-Skin Refinements (Retaining Exact Authoritative & Offline Labels):**

1. **Retain the exact text strings in `index.html` and `src/presenter.js`:**
   - Do **not** remove `.briefing-label` (`Ship briefing · authoritative`).
   - Do **not** remove or weaken the offline label (`Fallback — offline crew reaction below (<reason>). No AI-generated response.`) or the optional live disclaimer (`AI crew assessment below — optional, may be inaccurate. Ship briefing and station actions remain authoritative.`).
2. **Style the Authoritative Canonical Card vs. Optional/Offline Reaction Sub-Card in `index.html`:**
   - Style `.briefing-label` as an unmistakable authoritative eyebrow badge:
     ```css
     .briefing-label {
       display: inline-block;
       margin-bottom: 8px;
       padding: 2px 8px;
       font-family: "SF Mono", ui-monospace, Menlo, Consolas, monospace;
       font-size: 11px;
       font-weight: 600;
       letter-spacing: 0.08em;
       text-transform: uppercase;
       color: #ffd479;
       background: rgba(240, 168, 62, 0.14);
       border: 1px solid rgba(240, 168, 62, 0.45);
       border-radius: 3px;
     }
     ```
   - Frame `#panel-text` inside a crisp canonical surface (`padding: 12px 14px; background: rgba(14, 25, 42, 0.9); border-left: 3px solid #f0a83e; border-radius: 4px; font-family: system-ui, -apple-system, sans-serif; font-size: 14.5px; line-height: 1.55; color: #eef4ff;`).
   - Style `#panel-source` as a compact monospace status tag (`font-family: "SF Mono", ui-monospace, monospace; font-size: 11.5px; color: #94abc7; margin-top: 12px; margin-bottom: 6px;`) and style `#panel-flavour` as a clearly subordinate secondary block (`padding: 8px 12px; background: rgba(9, 16, 28, 0.75); border-left: 2px solid #4da3ff; color: #c4d7f2; font-style: italic;`).

---

## 4. Exact Visual Corrections for Geordi (P3 Action List)

Geordi owns all renderer and UI-skin implementation (`src/scene.js`, `src/displays.js`, `src/main.js`, `index.html`). Make the following targeted P3 corrections without breaking `Contract.version = 0.1.0`, the 7 canonical entity IDs, console/crew world AABBs, or Data's gameplay/presenter behavior:

1. **Unify the Locked Palette & Division Accents (`src/scene.js`, `src/displays.js`, `index.html`):**
   - Use the locked division colors everywhere: Helm `#f0a83e`, Science `#4da3ff`, Engineering `#ee6445`, Comms `#3ad896`.
   - Update room materials (`#3b3d46` upper walls, `#222630` ribs/trim/pedestals, `#262932` deck, `#462c33` command well carpet pad, `#5e2f34` captain chair).
2. **Fix Viewscreen Backing Glow & Structured 3-Zone Canvas (`src/scene.js`, `src/displays.js`):**
   - Lower `bridge/viewscreen` slab emissive from `#2a5a9e` (`intensity: 2.2`) to `#162c4a` (`intensity: 0.65`) and tighten the frame/canvas fit so the neon-blue slab halo disappears.
   - Lay out the `1536 × 486` viewscreen canvas into three zones: Top Header Bar, Center Directive + Right-Side `TIME / ENERGY / HULL` Gauge Cards, and Bottom Preparation/Outcome Strip (filling the screen cleanly with zero dead bottom void).
3. **Replace Overhanging Vertical Console Fascias with Sloped Hooded Displays (`src/displays.js`, `src/scene.js`):**
   - Replace the vertical `[0, 0.97, 0.79]` (`1.78 × 0.70 m`) floating billboard with an angled (`-48°` X Euler), hooded display (`1.68 × 0.52 m` at local `[0, 1.08, 0.36]`) backed by a physical console hood/shroud box inside the existing console AABB (`y ≤ 1.35 m`, `z ≤ 0.80 m`).
   - Format the `1024 × 400` console canvas into a Station Header Bar, Monospace Telemetry Body, and distinct Action Pill rows (`▸ <label>`).
4. **Upgrade Crew Silhouettes & Bridge Architecture (`src/scene.js`):**
   - Give `crew/mara-vale`, `crew/ivo-sen`, and `crew/tessa-rook` division-colored shoulder yokes (`#f0a83e`, `#4da3ff`, `#ee6445`) over dark tunics (`#1b1e26`), shoulder geometry, and distinct, readable role props (wrap-around visor for Mara, shoulder sensor pack + lit cyan data slate for Ivo, engineering harness + forearm/hip array for Tessa) inside their existing `±0.42 m` colliders.
   - Add bulkhead wall ribs, a ceiling bridge arch, and the central command carpet pad (`#462c33`), plus rebalance lighting (lower ambient to `(0.28, 0.31, 0.38)`, key `1.15`, cool screen fill `0.55`, warm command omni `0.85`).
5. **Refine DOM UI Skin, Prevent Viewscreen Occlusion & Style Authoritative/Offline Labels (`index.html`, `src/main.js`):**
   - Use dual font stacks (clean geometric/humanist sans for prose/headings/buttons; monospace for telemetry, `<kbd>`, `.briefing-label`, `#panel-source`, `#hud`).
   - Dock `#panel` lower on the right (`bottom: 20px; right: 20px; top: auto; background: rgba(7, 14, 26, 0.99)`) so it never slices across the forward viewscreen's header/objective text (`debrief.png`) or leaks background text through the dialog.
   - Hide `#labels` (`.crew-label`) whenever `#panel` or `#start` is open so floating name tags never collide with dialogs or the viewscreen (`operation.png`).
   - Add the `.briefing-label`, `#panel-text`, `#panel-source`, and `#panel-flavour` CSS rules so authoritative canonical advice is visually unmistakable from the subordinate offline fallback (`Fallback — offline crew reaction below (offline). No AI-generated response.`) and optional AI assessment disclaimer.
6. **Regenerate a Coherent 4-Capture Evidence Set (`evidence/p3-style/`):**
   - Deliver fresh, full-page captures (`incoming.png`, `crew.png`, `operation.png`, `debrief.png`, plus `overview.png`) all taken from the **same post-P3 build** with DOM overlays included, demonstrating the updated bridge architecture, hooded consoles, distinct crew silhouettes, structured viewscreen/console telemetry, and non-occluding `#panel` with styled authoritative/offline labels.
