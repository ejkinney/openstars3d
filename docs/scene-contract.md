# Open Stars — Scene & Interaction Contract (P1)

Owner: Geordi (renderer). Consumers: Data (gameplay/input), later Guinan (style), Worf (QA).

This document is the single source of truth for the names and hooks that Data may
depend on. The code lives in `src/contract.js` (`window.OpenStars.Contract`). The
renderer is Geordi's sole edit domain; Data reads state through this contract and
drives gameplay only through the hooks listed here.

- Contract version: **0.1.0**
- Engine: PlayCanvas **2.23.3** (vendored at `lib/playcanvas.min.js`)
- Resolution gate: **1280×720 fixed drawing buffer**, independent of device pixel
  ratio; presented with aspect ratio preserved (letterboxed).

## 1. Coordinate and unit conventions

- Right-handed, **Y-up**. 1 world unit = 1 meter (approx.).
- Camera forward is **−Z** (yaw 0 faces the front wall / viewscreen).
- Bridge interior is a 16 (X) × 4 (Y) × 12 (Z) box centered on the origin.
  - Front wall / viewscreen: **z = −6**
  - Back wall: **z = +6**
  - Left wall: **x = −8**, right wall: **x = +8**
  - Floor: **y = 0**, ceiling: **y = 4**
- Player eye height is fixed at **y = 1.7**; the bridge is flat (no vertical
  movement or jumping in the greybox).

## 2. Canonical entity IDs

Resolve with `OpenStars.Contract.entity('<id>')` (returns the `pc.Entity`, or
`undefined`). These are the ONLY names Data should hardcode.

### Structure
| ID | Meaning |
| --- | --- |
| `openstars/root` | Scene root. |
| `bridge` | Bridge container. |
| `bridge/floor` · `bridge/ceiling` | Floor / ceiling slabs. |
| `bridge/wall/front` · `bridge/wall/back` · `bridge/wall/left` · `bridge/wall/right` | Four walls. |
| `bridge/viewscreen` | Large forward viewscreen (emissive). |
| `bridge/captain-chair` | Captain chair (center, aft). |

### Physical consoles
| ID | Station | Accent |
| --- | --- | --- |
| `consoles/helm` | Helm | gold `#f0a83e` |
| `consoles/science` | Science | blue `#4da3ff` |
| `consoles/engineering` | Engineering | red `#ee6445` |
| `consoles/comms` | Communications | green `#3ad896` |

### Crew placeholders
| ID | Character | Station | Accent |
| --- | --- | --- | --- |
| `crew/mara-vale` | Mara Vale | Helm | gold |
| `crew/ivo-sen` | Ivo Sen | Science | blue |
| `crew/tessa-rook` | Tessa Rook | Engineering | red |

### Player
| ID | Meaning |
| --- | --- |
| `player/camera` | First-person camera entity. |

Crew name/role strings are also in `OpenStars.Contract.CREW` (keyed by crew ID).

## 3. Interactables

Every interactable entity carries the tag `interactable` and a registry entry in
`OpenStars.Contract.interactables` (a `Map`, keyed by canonical ID). Each entry:

```js
{
  entity,     // pc.Entity
  label,      // short display name, e.g. "Helm Console"
  prompt,     // verb shown next to [E], e.g. "Take the helm"
  enabled,    // boolean; Data can toggle via Contract.setInteractableEnabled(name, bool)
  aabb,       // { min: pc.Vec3, max: pc.Vec3 } world-space box, renderer-owned (do not edit)
  setHovered, // renderer-owned highlight callback (do not call)
}
```

Registered interactables in P1: the 4 consoles (`consoles/helm`, `consoles/science`,
`consoles/engineering`, `consoles/comms`) and the 3 crew members
(`crew/mara-vale`, `crew/ivo-sen`, `crew/tessa-rook`).

## 4. Interaction hook (Data's entry point)

The renderer owns the gaze raycast (from camera center, 2.8 m range, AABB test) and
the `E` key binding. When the player presses `E` while gazing at an enabled
interactable, the renderer calls:

```js
OpenStars.Contract.onInteract = (name, descriptor) => { /* Data's logic */ };
```

- `name` — canonical interactable ID (string).
- `descriptor` — the registry entry above.

Data sets `onInteract` exactly once after boot. **All gameplay meaning** (what an
interaction does, state transitions, dialogue) lives on Data's side. The renderer
only fires the hook and shows the hover highlight + prompt.

## 5. Camera & input boundary

| Concern | Owner |
| --- | --- |
| Camera transform (position/orientation), pointer-lock mouse look, WASD walk, bounds/collision resolution | Geordi (renderer) |
| Gaze raycast, hover highlight, `E` key, prompt display | Geordi (renderer), fired into `Contract.onInteract` |
| Meaning of an interaction, encounter state machine, resource values, dialogue, restart | Data |
| Scene/console **visual** state driven by gameplay (e.g. viewscreen content) | Data requests via reserved hooks (below); Geordi implements the visual primitive |

Input keys in P1: `W/A/S/D` (and arrows) move, mouse looks (pointer lock), `E`
interacts, `Esc` releases pointer lock (pause). Data must not bind gameplay to keys
the renderer owns; propose new bindings through the contract (bump version).

Interaction input is active only while the player has pointer lock. Before entry
and after release/pause, E produces no callback. A fresh E keydown dispatches once
to the current enabled gaze target; repeated or already-held E is suppressed.
Paused presses are discarded, and E held across re-entry must be released before
a new press can interact. This corrects the documented pause behavior without
changing contract version 0.1.0, IDs, or hook signatures.

## 6. Renderer display hooks and P2 focus

Additive P2 hooks, implemented by `src/displays.js` after the bridge registers:

- `Contract.setViewscreen(text|null)` updates plain text on the physical forward
  screen. It does not interpret HTML or execute actions. Null clears the content.
- `Contract.setConsoleContent(id, {text, actions})` updates a console's physical
  room-facing text fascia. `text` is a string; `actions` is an array of `{label}`
  display strings. This hook draws labels only; runtime action execution remains
  through `game.act` from the presented accessible action control. Surfaces stay
  within existing console AABBs; no collision or selection volume was widened.

The renderer presenter consumes Data's detached `present(view)` snapshots. It
owns capture/focus and accessible text/action controls; gameplay never touches
camera or player lock flags. One gameplay consumer is installed after all seven
interactables register. Canonical briefing, optional generated reaction and
offline reaction remain separate plain-text fields. Generated assessment is
labelled as potentially inaccurate; no generated text drives rules/actions.

Renderer-only player additions (`setInputEnabled`, `unlock`, error-reporting
`lock`) freeze movement/look/E during an interaction. Opening a panel releases
capture exactly once; subsequent presents never request or release it again.
Intentional release retains the open panel. Escape, blur, hidden document and
ordinary capture loss call `game.suspend()`. Close/restart leave a trusted-click
re-entry gate. Only that trusted click may request lock; failed capture is shown
explicitly, with no input fallback. Held E is still consumed until keyup and a
fresh down; moving keys are cleared on focus changes.

The following remain reserved/unimplemented:

- `Contract.setConsoleState(id, { active, blink, color })` — per-console accent state.
- `Contract.setCrewState(id, { facing, pose })` — orient/pose a crew placeholder.
- `Contract.focusCamera(targetEntity|position)` — scripted camera for encounters.

These three reserved hooks are not live. The earlier proposed texture overload
of `setViewscreen` is also deferred; the current implementation accepts text/null.
No existing live signature changed. Contract remains 0.1.0; this is additive.

## 7. Versioning

Any breaking change to an ID, a hook signature, or the coordinate conventions bumps
`Contract.version` (semver) and must be announced to Data. Non-breaking additions
(additive hooks, new entities) do not require a bump.
