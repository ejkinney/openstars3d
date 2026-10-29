# Open Stars — G0 plan

Status: PASS — Picard approves the scope below; Elliot selected 60 fps at 1280×720 through OpenBot's G0 target question on 2026-10-28. P1 greybox is authorized. G1–G5 remain pending.

Owner: Picard. Source: Neo kickoff, message 8f8ad082-609b-438c-a57a-3c312067b0cb, 2026-10-28.

## Deliverable and boundaries

A fresh, local PlayCanvas first-person prototype: one walkable low-poly starship bridge, three approachable crew members, physical controls, one distress-call encounter with an ending and restart. All code and visuals are new. Do not clone the old Open Stars repository or reuse its assets/code. The six design ideas in the kickoff are direction only; defer deeper repository analysis.

The bridge contains the captain's chair, forward viewscreen, helm, science and engineering stations. Minimal overlay: startup/input help, a small interaction prompt and necessary accessibility/dialogue controls. Ship status, orders and outcomes live on consoles and the viewscreen where practical. Desktop keyboard/mouse is the prototype input scope; pause releases pointer capture. Ship movement is represented from the bridge, not a separate piloting scene.

Out of scope: away missions, planets, additional bridges or missions, combat simulation, friendship progression, long-term campaign saves, voice generation, multiplayer and public deployment. Keep encounter state available to AI within the current run; restart resets it.

## Crew roster (original working characters)

- Mara Vale, helm: navigation and rescue approach; favors prompt intervention.
- Ivo Sen, science: signal analysis and hazard assessment; favors evidence before commitment.
- Tessa Rook, engineering: power allocation and transporter readiness; explains resource tradeoffs.

Names and attitudes are prototype content decisions. Each officer has a distinct station, readable silhouette and a short consultation role.

## Encounter: A Light in the Static

1. A civilian survey ship sends a distress call from a charged debris field. The viewscreen and communications console present the signal.
2. The captain acknowledges the call and consults the three officers. Advice exposes rescue urgency, an unstable field and a finite power reserve.
3. The captain operates science scan, helm approach and engineering power controls. A scan reduces uncertainty but advances the encounter; a direct approach acts sooner with more risk. Power allocated to shielding is unavailable to the rescue system.
4. The captain commits to a cautious rescue, an urgent rescue or withdrawal. Outcomes reflect validated ship state and decisions: full rescue, partial rescue with damage, or safe withdrawal with civilians lost. A clear debrief shows the decisions and their consequences.
5. Restart restores the initial encounter. No player can become trapped by a dialogue request, unavailable model or invalid response.

Data owns the precise finite-state rules, resource values and reachable transitions, with all endings reachable and reviewed before implementation. Core acceptance path: receive call → consult crew → operate physical ship controls → commit decision → observe consequence → restart.

## AI boundary and cost constraint

Only small/cheap DeepSeek gameplay AI, requested as deepseek-flash. Data must verify the available provider/model identifier without silently substituting an expensive or reasoning model. Prefer one simple local server-side adapter. Secrets remain outside the repository and browser bundle; use OpenBot's secure API-key flow when needed. Do not spend money until Elliot explicitly authorizes paid calls.

AI may generate contextual dialogue and bounded encounter prose from canonical state. Deterministic rules own resources, allowed actions, progression and endings. Validate responses; limit requests and output size; provide visible timeout/error handling and a deterministic fallback so the encounter remains playable. The fallback alone cannot substantiate a claim that live AI integration passed.

## Approved performance target

Elliot selected: 60 fps at 1280×720 internal render resolution on this machine in a desktop browser. Keep the drawing buffer at 1280×720 for the performance gate, independent of display pixel ratio; preserve aspect ratio when presenting it.

Measurement protocol: record the actual machine/GPU/browser and drawing-buffer dimensions; warm up for 10 seconds, then capture at least 60 seconds including bridge traversal and encounter interactions. Report median and p95 frame intervals, average fps and memory behavior. On a 60 Hz display, Picard's acceptance tolerance is at least 58 average fps and p95 frame interval no greater than 20 ms; disclose display refresh rate and scheduling limits rather than claiming unmeasured performance. Repeat after restart to check growth or degradation. Browser matrix: Chrome, Safari and Firefox where available; missing coverage remains explicit. Further numeric rendering limits belong to Geordi's plan. No hardware compatibility beyond measured environments is implied.

## Gate artifacts and ownership

- G0-plan.md — Picard approves scope and records Elliot's fps/resolution target; only then P1 begins.
- G1-it-runs.md — Geordi supplies a locally runnable PlayCanvas greybox, scene/interaction contract, launch instructions and bridge screenshots; Worf verifies boot, navigation, bounds and console output. Picard reviews captures and approves G1 before P2.
- G2-style.md — after Data's P2 systems pass, Guinan supplies and judges the P3 visual direction against actual bridge and interaction captures; Picard records approval.
- G3-content-complete.md — all distress encounter paths, crew consultations, physical operations, outcomes, restart and AI success/failure handling verified by Worf; Picard records approval.
- G4-performance.md — Worf supplies measured results against the agreed target and browser coverage; Geordi/Data address issues in their domains; Picard records approval.
- G5-ship.md — Worf's release recommendation, Guinan's final visual verdict, exact local launch route and evidence manifest; Picard gives the final local-prototype ship verdict. Public hosting requires a separate explicit go.

Pipeline: P0 brief/G0 → P1 greybox/G1 → P2 systems → P3 style/G2 → P4 polish/G3/G4 → P5 local ship/G5. Every build handoff includes screenshots. A failed gate returns to its owner without advancing phases.

## First assignment — released after G0 pass

Geordi: create the new project in this directory, implement the bridge greybox and renderer/scene contract, and provide local launch instructions plus screenshots. No old-repo clone, paid calls or public hosting. Reserve stable interaction hooks for the three crew members and communications/science/helm/engineering controls. Data owns gameplay and input semantics through that contract; Guinan owns visual direction; Worf owns factual QA.
