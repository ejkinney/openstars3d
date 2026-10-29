# P2 systems review — Picard

Date: 2026-10-29. **P2 accepted for the deterministic systems, assembled offline path, and mock-verified OpenCode companion boundary.** This is a scoped P2 decision, not approval of live OpenCode availability or generated-text quality.

## Evidence reviewed

- Data's `docs/P2-opencode-handoff.md`: server-side OpenCode service discovery, fixed `opencode/mimo-v2.6-flash-free` selection, explicit free-dialogue opt-in, unchanged deterministic gameplay authority, and offline fallback. Data reports 21/21 mock/offline tests.
- Worf's `docs/P2-opencode-worf-verification.md`: recommendation PASS for the mock-only route and fallback; 21/21 project tests plus 5/5 independent tests; exact OpenCode auth-header, model pin/catalog gate, failure handling, and DeepSeek isolation checks.
- Existing assembled bridge evidence in `evidence/p2-bridge/` and Geordi's `docs/P2-bridge-handoff.md`.

## Decision boundary and open work

- Product's normal companion remains offline. OpenCode dialogue requires the explicit `node server/opencode-companion.cjs --enable-free-dialogue` launch and a usable local OpenCode service/model.
- The OpenCode handoff reports no authenticated integrations and `usage.limits: null`. Worf did not rerun live discovery. No credentials were read and no model-generation call was made. Account-specific quota, live availability, billing, and generated-text quality remain unverified.
- The one-shot OpenCode API has no provider-side output-token cap; current limits are prompt bytes, response bytes, content screening, and four attempts per process. No hard spend cap is claimed.
- G3 remains pending full independent content/interaction/restart verification and any required live-provider success/failure evidence. G4 performance and G5 ship remain pending. This P2 decision does not claim G3, G4, or G5.

## Next phase

Proceed to P3 visual direction/G2 review with Guinan using existing bridge captures and the clearly labelled offline/generated-reaction presentation. Live OpenCode output must not be presented as observed or quality-approved.
