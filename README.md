# Open Stars — A Light in the Static

Open stars, expanded and 3D.

Local PlayCanvas first-person starship bridge prototype. Engine-only (no editor or
account); PlayCanvas 2.23.3 vendored at `lib/playcanvas.min.js`.

## Run

Run these two processes from the project root in separate terminals:

```sh
node tools/bridge-server.cjs
```

```sh
node server/local-server.cjs
```

Open **http://127.0.0.1:8123/index.html** → click **ENTER BRIDGE**.

Controls: `WASD`/arrows move · mouse look · `E` use station / speak · `Esc` pause.
Start at communications (forward/starboard), acknowledge Aster, then consult Mara,
Ivo and Tessa. Use science, helm and engineering, then commit at communications.
Walking and reading spend no encounter time. Actions operate through the focused
dialogue panel; close it and click **RETURN TO BRIDGE** before walking again.

The bridge requires native pointer lock for walking. If capture is denied, the
entry screen reports the failure and keeps input paused; use a browser/window
that permits pointer lock. No capture workaround is included.

The companion at `http://127.0.0.1:8124` is **offline by default**, reads no key and
makes no paid provider calls. An absent companion leaves canonical encounter
rules/advice and actions available, with an explicit offline/unavailable label.
Both servers bind loopback and serve fixed public asset allowlists; server files,
credentials and evidence are not public routes. Do not use a directory-wide HTTP
server as the P2 launch route. If port 8123 is occupied by the earlier P1 Python
server, stop that process first.

Optional local checkpoint writes use only `openstars.encounter.v1`. Acquisition
and write failures never block play. This build starts a fresh encounter on load;
it has no resume, campaign-save or score UI. Restart is available in debrief and
pause controls. The viewscreen/consoles carry objective, resources and outcome.
`?debug=1` adds the opt-in rendering diagnostics; the default has no stats HUD.

## Docs

- `docs/G0-plan.md` — approved scope and performance target.
- `docs/G1-greybox-handoff.md` — greybox handoff, launch, checks, limitations.
- `docs/scene-contract.md` — scene/entity/interaction contract for Data.
- `docs/P2-bridge-handoff.md` — assembled bridge integration and verification limits.

## Evidence

Current bridge evidence lives under `evidence/p2-bridge/`. Historical P1 capture
tools/artifacts remain for traceability; they are not the P2 verification suite.

## Notes

- Fixed 1280×720 drawing buffer, independent of device pixel ratio.
- Renderer invokes `OpenStars.Contract.onInteract` on a fresh active E press;
  Data's runtime owns all encounter rules and async dialogue cancellation.
