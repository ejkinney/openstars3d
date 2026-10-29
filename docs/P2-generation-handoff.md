# Provider update

The DeepSeek provider details below describe the earlier P2 implementation. The current adapter uses OpenCode; see `docs/P2-opencode-handoff.md`. Canonical gameplay boundaries remain unchanged.

# Open Stars — P2 generated crew reactions

Owner: Data. Prepared 2026-10-28 in response to Picard's P2 integration plan. This supersedes the phrase-selector boundary and cost discussion in `P2-systems-handoff.md`; that earlier handoff and its QA artifacts are retained as history. Deterministic encounter rules are unchanged. No G2–G5 verdict, live provider validation or assembled bridge-playability claim is made.

## Implemented boundary

The server now requests **original short generated prose**, not a phrase index. Each request asks the officer for a personal emotional reaction or cautious assessment to one predefined consultation intent and the current encounter context. It includes the officer's distinct voice, canonical advice, phase, committed approach/allocation, scan state, resources, decision and outcome. The prompt forbids invented events, survivor/resource claims, commands, new tasks and changes to the canonical facts. It contains neither a phrase table nor free-form captain input, conversation history, external documents, tools or quest generation.

Predefined intents, derived locally from the phase/officer/decisions:

- `await-acknowledgement`, `reflect-outcome`.
- Mara: `weigh-approach`, `assess-approach`.
- Ivo: `assess-uncertainty`, `assess-evidence`.
- Tessa: `weigh-allocation`, `assess-allocation`.

Provider content must be exactly JSON `{"reaction":"..."}`. The application validates the parsed shape, rejects extra properties, then screens the string: 12–240 characters, at most 40 words, trimmed English letters and ordinary punctuation, no digits, markup, URLs, control characters or explicit command/secret/instruction-override patterns. The provider response body is separately limited to 8192 bytes, must finish normally, match the permitted model family and contain no tool or nonempty reasoning output. No invalid response is truncated into a seemingly valid one.

These checks **do not establish factual consistency**. A sentence such as “I believe everybody is already safe, Captain.” passes the screen despite contradicting an unanswered distress call. An explicit test preserves that limitation: the generated sentence appears only in the reaction field, canonical advice still reports the unanswered call, and encounter phase/outcome/resources/actions remain unchanged. Oblique commands, claims expressed without digits, misleading confidence, unsuitable tone or other semantic contradictions can escape the checks. JSON output guarantees neither truth nor good judgement. Prompt restrictions reduce risk; they do not prove compliance. Human review of generated samples remains necessary before claiming acceptable live dialogue.

Canonical advice is always produced by the deterministic local rules from the current snapshot. Model prose is never parsed as an action, checkpoint, resource value, outcome, HTML, code or rule. Canonical text is reconstructed locally after the optional response completes. Presentation snapshots are detached copies; presentation-side edits cannot mutate the underlying rules. This makes the advice block immutable **with respect to model and presentation output**, while normal authorized gameplay transitions can still update it.

## Compatibility for Geordi

No `createGame`, `present`, action, focus, pause or restart signature changed. The five-field browser request `{schema, officer, run, revision, checkpoint}` remains unchanged. The server derives the intent/context from the validated replay; no caller-provided instruction is accepted.

Existing presentation fields remain:

| Field | Meaning |
| --- | --- |
| `panel.text` | Authoritative canonical advice/facts, always local |
| `panel.flavour` | Short generated reaction string when accepted; deterministic officer fallback string on offline/error/timeout |
| `panel.source` | Existing `live-flavour` value for a shape-screened provider response; `fallback` on failure; initial pending panel remains `canonical` |
| `panel.reason` | `shape-checked` for accepted provider prose; fixed offline/failure reason otherwise |
| `pending`, `focusRequested`, `actions` | Existing meanings unchanged |

Geordi should display `panel.text` as **Canonical advice** and the separate `panel.flavour` as **Generated personal reaction — may be inaccurate** when `source === 'live-flavour'`, or **Offline crew reaction** for fallback. Keep both as plain text; do not visually merge the generated prose into the canonical block. The existing source field name is retained for compatibility; it does not mean factual validation. A mock fixture can also exercise that field, so test evidence must still identify whether the response came from a mock or the actual provider. No interface blocker requires a signature change.

The internal adapter payload changed from `{phrase: index}` to `{reaction: string}` for a successful provider response. The runtime consumes it and preserves the presentation string. The old `Dialogue.flavour(id,index)` table remains only for deterministic fallback and compatibility; it is not supplied to the model or used to select generated output.

Close, pause/suspend, restart, saved-run resume and teardown still abort pending requests and invalidate the generation ticket. Timeout settles once: even a late response from an abort-ignoring transport cannot replace the fallback or repopulate a restarted/closed panel. The canonical advice and close/restart controls are available while optional generation waits.

## Limits, provider and proposed paid validation

Live calls remain disabled in the CLI. It reads no API key. No paid call was made and no key was requested or read in this follow-up.

Refreshed from primary docs on 2026-10-28: direct DeepSeek `POST https://api.deepseek.com/chat/completions`; requested model `deepseek-flash`, documented current version DeepSeek-V4.1-Flash-1017. Published USD per million tokens: peak input cache miss $0.30, cache hit $0.006, output $1.20; off-peak $0.15 / $0.003 / $0.60. Recheck rates/model immediately before any approval. [Official model and pricing](https://api-docs.deepseek.com/quick_start/pricing/).

The request explicitly sets `thinking:{type:'disabled'}`, JSON object output, no streaming and maximum 160 output tokens. No retries, tools, alternate provider, expensive model or reasoning-model substitution is attempted. The model parameter and non-thinking/JSON controls are documented in the [official request schema](https://api-docs.deepseek.com/api/create-chat-completion/). Response validation also rejects the Pro model rather than accepting a substitute.

| Limit | Prepared value |
| --- | --- |
| Paid attempts per adapter instance | 4, including provider failures/timeouts |
| Prompt message content | ≤6000 UTF-8 bytes, enforced before fetch |
| Output tokens per attempt | 160 requested maximum |
| Total requested output across four attempts | ≤640 tokens |
| Provider response body | ≤8192 bytes |
| Provider deadline, including body reading | 1200 ms |
| Runtime UI deadline | 1500 ms |
| Concurrent provider requests | One; busy requests fall back |
| Local HTTP request body / attempts | 4096 bytes / 128 per companion process |

The prompt grew to support actual generation, but the enforced input/output limits did **not** change. A mock-only prompt audit examined all three officers at all 693 legal sequence prefixes: 2079 prompt constructions, largest actual message-content payload **1410 bytes**, below the 6000-byte limit. This measured bytes, not provider tokens, and made zero external calls.

Recalculated proposal for a future approved validation session: **at most four paid attempts in one adapter process**, requested output ≤640 tokens total. Budget planning still allows **8192 input tokens per attempt / 32768 total**, conservatively above the bounded message bytes, including a framing allowance. That input-token figure is an estimate, not an enforced token count or a tokenizer measurement. At peak uncached rates:

```text
4 × ((8192 × $0.30) + (160 × $1.20)) / 1,000,000 = $0.0105984
```

The previous **USD $0.02 spending proposal therefore remains sufficient as an estimate** with the unchanged limits; it is **not an enforced hard dollar cap**. Enforcement is per-instance attempt count and requested output length, not account billing. Failed or timed-out calls can bill; creating/restarting another live adapter resets its in-memory attempt counter and must not be used to extend an approved validation session. Provider-reported usage and actual billing have not been observed. Any live entry point, key provisioning, call approval and review of actual generated samples remain pending with Picard/Elliot.

## Changes and checks actually run

Changed only:

- `src/gameplay/dialogue.js`: consultation intents/context and shared reaction screening; original canonical advice unchanged.
- `src/gameplay/runtime.js`: generated string validation and fallback mapping while preserving presentation fields.
- `server/dialogue-adapter.cjs`: original-prose prompt and exact reaction schema; existing budget/transport protections retained.
- `tests/p2-systems.test.cjs`: update fixture expectations to the new internal payload; deterministic encounter checks retained.
- `tests/p2-generation.test.cjs`: seven new context/generation-boundary/failure/semantic-limit/cancellation tests.
- This handoff and new `evidence/p2-generation/` artifacts. Renderer, player, scene, main, engine, contract, local server and Geordi's in-flight files were not edited.

Command actually run:

```sh
node --test tests/p2-systems.test.cjs tests/p2-generation.test.cjs
```

Result: **20/20 pass**, including the existing exhaustive 693-prefix rules/save/resource suite, exact cheap-model/thinking-disabled/four-attempt checks, genuine local HTTP checks, generation prompt/context inspection, novel non-table mock output, schema/length/markup/command/extra-field rejection, truncation/reasoning/tool rejection, immutable canonical/state/action checks, deliberately documented semantic escape, pause/reopen/restart stale-response invalidation, offline/network/provider failure and timeout fallback. All provider responses in these tests are synthetic fixtures; accepted mocks prove the code path handles arbitrary bounded strings, not that DeepSeek generated one or that live quality passed.

`evidence/p2-generation/offline-tests.txt` contains the actual final test output. `prompt-audit.json` records the separate mock-only 2079-prompt byte audit. Existing `evidence/p2-data/` artifacts remain unchanged as historical scaffold evidence. No visible build/browser run was performed for this follow-up, so no new screenshots are claimed; older harness frames do not substantiate live generated prose. No publication, old-repo reuse, key access, paid call or Babble write occurred.

Next: Picard reviews this concrete boundary and cost proposal, routes the separate canonical/generated labels to Geordi, and decides whether to seek explicit live validation approval. Worf still owns independent assembled encounter/focus/failure checks; generated quality and factual consistency require actual approved provider samples and human review. G2–G5 remain unpassed.
