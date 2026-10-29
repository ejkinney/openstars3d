# Open Stars — next-server handoff

Current checkpoint: P2 systems accepted for the deterministic/offline path and
mock-only OpenCode companion checks. P3 renderer corrections are implemented by
Geordi, but G2 is **not passed**; Worf and Guinan have not yet re-verified the P3
build. See `docs/P2-picard-review.md`, `docs/P2-opencode-handoff.md`,
`docs/P2-opencode-worf-verification.md`, `docs/G2-style.md`, and
`docs/P3-style-handoff.md`.

## Next

- [ ] Worf: independently verify the P3 renderer/interaction changes against the
  G1 input, focus, pause, and scene-contract constraints; record checks and any
  limitations.
- [ ] Guinan: re-review the coherent `evidence/p3-style/` capture set and issue a
  final G2 style verdict. Do not pass on numeric captures alone.
- [ ] Geordi: address any Worf/Guinan findings before claiming G2.
- [ ] Worf: complete G3 content verification for all encounter endings, restart,
  and AI success/failure handling after G2 passes.
- [ ] Resolve OpenCode live availability before claiming generated dialogue: the
  product defaults offline, the optional route is
  `node server/opencode-companion.cjs --enable-free-dialogue`, and the current
  handoff reports no authenticated integrations and `usage.limits: null`. Do not
  read/copy credentials or make live model calls without the required user go.
- [ ] Worf: measure G4 against the approved 60 fps / 1280×720 target using the
  agreed warm-up, 60-second capture, p95, memory, and browser-matrix protocol.
- [ ] Guinan/Worf/Picard: complete G5 visual, release, and local-launch reviews.
  Public deployment remains out of scope without separate approval.

## Git handoff

- Target supplied by Elliot: `https://github.com/ejkinney/openstars3d.git`, branch
  `main` (remote currently has a README-only seed commit).
- This checkpoint is work in progress: G2 is not passed, and OpenCode live
  availability/content quality are unverified. Do not treat the push as a ship
  release.

## Resume locally

From the repository root, install dependencies with `npm ci`. Run the bridge
with `node tools/bridge-server.cjs`. The default companion is deterministic and
offline: run `node server/local-server.cjs`. Use the optional OpenCode command
only after service/auth and quota availability are established. Keep both local
servers on loopback; do not use a directory-wide static server.
