# Open Stars — P2 integration plan

> **Historical plan; superseded for current status/provider details.** The DeepSeek-specific
> generation and cost sections below are no longer the active implementation path. Use
> `docs/P2-opencode-handoff.md` for the current OpenCode companion (product default remains
> offline), `docs/P2-picard-review.md` for the scoped P2 decision, `docs/P3-style-handoff.md`
> for Geordi's P3 implementation, and `docs/G2-style.md` for Guinan's G2 block. G2 remains
> pending independent post-P3 review; do not run the retired DeepSeek validation path.

Status: IN PROGRESS. G0 and development-scope G1 passed. Standalone P2 systems delivered by Data; assembled bridge and live AI remain unverified. No G2–G5 approval.

Picard reviewed docs/P2-systems-handoff.md and three diagnostic harness captures. Data reports thirteen tests passing over 693 legal sequence prefixes, with full-rescue, partial-rescue/damage and withdrawal routes. These are builder checks, not Worf's independent verdict. Harness captures demonstrate diagnostic state/dialogue/debrief only; they are not a playable bridge walkthrough.

## Geordi — assemble renderer and systems

Implement Data's seven integration requirements from the handoff: one-time bootstrap after scene registration; renderer-owned canonical presentation; viewscreen and console content; explicit dialogue focus versus user pause; restart; guarded optional checkpoint storage; offline companion endpoint. Do not change encounter rules or gameplay module internals. Keep the seven physical interaction IDs and G1 pause/input behavior. Show objectives, resource state, action consequences and debrief primarily on physical displays; retain a small accessible action/dialogue panel where needed. Do not copy the diagnostic station-button grid into the product. Campaign save, score presentation and extra save/resume controls are not required for this prototype.

Intentional pointer release for a dialogue panel must preserve that panel; Escape/blur/user pause must suspend it and cancel pending dialogue. Closing a panel requires an explicit trusted re-entry click; do not auto-lock from asynchronous responses. Do not bypass browser pointer-lock restrictions. Missing companion or offline adapter must leave the encounter playable with correctly labelled fallback. Local launch instructions must explain both bridge and companion processes without exposing server modules or secrets.

## Data — finish the requested generation boundary

The current adapter chooses one of two preset phrases. This is a transport scaffold and does not meet the requested AI-generated crew dialogue. Prepare actual short generated crew responses to bounded consultation intents/current encounter context, with canonical facts, allowed actions, resources and outcomes always owned by deterministic rules. A separately labelled generated reaction may supplement canonical advice; never interpret model text as an action or state mutation. Preserve the existing createGame/present integration surface where possible while Geordi assembles it. Keep offline/timeout/invalid-output fallback and late-response cancellation. Explain remaining semantic-validation limits; JSON/schema validation alone does not prove a generated sentence is factually consistent.

No live paid calls are authorized. Return revised mock/offline tests, exact generated-output boundary and updated provider/model/cost proposal before requesting paid validation. The previously proposed four-attempt/$0.02 estimate applies to the phrase-selector scaffold and must be revisited if prompt/output limits change. Do not claim a dollar cap is enforced unless the mechanism actually enforces it. Secrets stay server-side and use the secure key flow when live validation is authorized.

## Generation follow-up reviewed

Data delivered docs/P2-generation-handoff.md, superseding the phrase-selector section in the earlier handoff. Picard accepts the prepared boundary for integration: original short crew reactions requested for eight predefined intents, while deterministic local advice, actions, resources and outcomes remain authoritative. createGame/present and panel.text/flavour/source fields are unchanged. Data reports twenty offline tests passing and 2079 mock prompt constructions with a maximum measured message-content payload of 1410 bytes. These are builder results and synthetic model fixtures; no live response or quality pass is established.

Geordi must keep the canonical briefing and optional generated reaction visually separate as plain text. Use understandable player-facing labels that distinguish authoritative ship information from an AI crew assessment that may be inaccurate. Offline fallback must be identified accurately; never label a mock/offline reaction as live provider output. Guinan will review the presentation at P3.

Data explicitly demonstrates that plausible semantic contradictions can pass the screen. This is an unresolved live-content quality risk, not a state-integrity failure; actual generated samples require review before AI acceptance. Prompt and schema restrictions alone do not close it.

The revised proposal retains four paid attempts in one process, at most 160 requested output tokens per attempt and bounded prompt bytes. Data's planning estimate remains $0.0105984 at the cited peak rates, with $0.02 proposed as a spending allowance, not an enforced dollar cap. Pricing/model availability must be checked immediately before seeking approval. No payment approval, key access or live call has occurred. A disabled, reviewable server-side live-validation entry point and its run instructions are still needed before that approval is actionable. Geordi continues offline bridge assembly in parallel.

## Live-validation preparation reviewed — spending approval pending

Data supplied docs/P2-live-validation-plan.md and an inert explicit-opt-in server/live-validation.cjs entry point, reporting 26 mock/offline tests passing. One retained exclusive reservation prevents accidental concurrent/restarted validation sessions; one adapter shares four attempts including failures. Startup makes no provider call; normal companion CLI stays offline. Picard reviewed the run/stop/cleanup and sample-review plan. No live instance, reservation or key access is claimed.

Picard independently checked the official DeepSeek pricing and request documentation on 2026-10-28: deepseek-flash is documented as DeepSeek-V4.1-Flash-1017, supporting thinking disabled and JSON output; published peak uncached input/output rates remain $0.30/$1.20 per million tokens. Sources: https://api-docs.deepseek.com/quick_start/pricing/ and https://api-docs.deepseek.com/api/create-chat-completion/ .

Reviewable approval request: one session with at most four attempts, including failures/timeouts, no retries/restarts and at most 640 requested output tokens total. Conservative planning input allowance 32768 tokens gives an estimated $0.0105984 total at peak rates; proposed allowance $0.02, not a hard billing cap. Only bounded fictional crew/encounter context is sent. Any actual key must come through the secure key flow after authorization, stay server-side and never be copied into source/reports. Data owns executing an approved session and retaining sanitized sample evidence; Worf owns independent evaluation. Bridge integration and live quality remain open.

## Next review

Geordi returns actual bridge captures, runnable launch route and integration checklist. Data returns the revised bounded-generation boundary and offline evidence. Worf then verifies assembled encounter paths, focus/pause/re-entry/restart and AI failure handling, preserving the outstanding native-input/browser/performance limitations. Picard decides readiness for P3 style review with Guinan. No public hosting, spending or phase advances without the relevant approval.
