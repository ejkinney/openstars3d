# Superseded

The DeepSeek validation entry point described below was retired on 2026-10-29. `server/live-validation.cjs` now exits without making a provider call or reading credentials. Use `docs/P2-opencode-handoff.md` for the current OpenCode route.

# Open Stars — prepared live-validation entry point

Owner: Data. 2026-10-28. **Offline preparation complete; no paid run authorized or performed.** Picard accepted the generation boundary for offline integration, not live quality. This plan supplies the missing future entry point and does not approve spending. Gameplay/presentation APIs and Geordi's in-flight files were not changed. G2–G5 remain unpassed.

## Future command — only after explicit approval

Picard must first independently verify the official model/rates, obtain Elliot's explicit cost/call approval, and authorize the one validation session. Only then provision the key through OpenBot's secure key flow. The entry point does not obtain a key, inspect the Vault or read environment key variables. Do not paste a key into chat, source, a shell command, browser, report or log.

From `/Users/elliot/OpenBot/Shared/openstars-prototype-20261028`, the future command template is:

```sh
node server/live-validation.cjs --enable-paid-validation --session approved-session-label --key-file '/ABSOLUTE/PRIVATE/KEY-FILE'
```

`/ABSOLUTE/PRIVATE/KEY-FILE` is a placeholder, not a real secret path. Replace it only in the eventual authorized local invocation with the path returned by the secure key flow. The lower-case session label must identify that approved session (1–48 letters/digits/hyphens, beginning with a letter/digit). The key file must be a regular file outside this project, owned by the current user, without group/other permissions (for example mode 0600), no final symlink, 8–512 bytes of file content, and one 8–256-character printable ASCII token after trimming surrounding whitespace. If the secure-store file does not meet these requirements, stop for an authorized provisioning adjustment; do not copy the key into a project file or log it to diagnose the problem.

The command binds only `127.0.0.1:8124`. Startup sends **zero** provider requests. It prints the fixed listener/model/attempt limit, never the key or key path. A later valid crew-consultation HTTP request triggers generation. Missing flag, invalid arguments, duplicate flags or missing session/key-file path refuse startup. `--help` is inert. There is no model, endpoint, retry, maximum-attempt, reset or resume override.

For an approved assembled bridge run, use Geordi's restricted public-asset server in a separate terminal, after its integration handoff is verified:

```sh
node tools/bridge-server.cjs
```

Use `http://127.0.0.1:8123/index.html`; gameplay's companion endpoint must remain `http://127.0.0.1:8124/api/dialogue`. The alternate diagnostic harness is `http://127.0.0.1:8124/p2-harness.html`, clearly labelled as simulated interactions. Do not run the normal offline companion and the live-validation companion simultaneously; both use port 8124. Stop only the known task-owned process normally before an approved launch. A port conflict consumes the one session reservation and requires review; there is no automatic retry. Do not use a general root-directory static server for this run. These commands describe future use; no bridge or harness was opened for this preparation.

## Enablement and budget boundary

`server/live-validation.cjs` is inert on import and is separate from `server/local-server.cjs`, whose normal CLI still creates an offline adapter even if live-looking environment variables exist. No environment variable enables this new CLI. It requires the explicit command flag, session label and future private key-file path.

After argument validation and **before** reading the file or listening, the new command exclusively reserves:

```text
evidence/p2-live-validation/session-used.json
```

This retained marker contains only schema version, session label, model, maximum attempts, UTC reservation time and a no-reuse notice. It contains neither key contents nor key path. Atomic exclusive creation prevents concurrent starts; the marker blocks a later start even with a different label. One adapter instance serves all valid requests, runs, officers and revisions. Four total provider attempts are allowed, including fetch errors, 429s, malformed outputs and timeouts. No automatic retries or replacement instances exist. Busy/invalid-input requests make no provider call. After four attempts all further requests fall back without fetching. No HTTP reset, session-control or secret-file endpoint exists.

The marker stays consumed on invalid key, listen/startup failure, graceful stop or process crash. It is not a resumable ledger, and it does not replenish unused attempts. Do not delete, rename, edit or bypass it to retry or extend this approval. A further session requires fresh explicit approval and a separately reviewed archival/reset change; no such reset mechanism is supplied here. This is an accidental-reuse guard in the current project, not a tamper-proof account-wide spending control. Someone deliberately editing code/files or using another checkout can bypass it; that is outside this authorized workflow.

The prepared limits remain: `deepseek-flash` only, thinking explicitly disabled, ≤6000 UTF-8 bytes of prompt content, maximum 160 requested output tokens per attempt, 8192 response bytes, 1200 ms provider deadline including body read, 1500 ms runtime UI deadline, one concurrent provider request, no tools, no streaming, no provider/model substitution. Four attempts request at most 640 output tokens. Published model/rates must be checked independently before use at [official pricing](https://api-docs.deepseek.com/quick_start/pricing/) and [official request schema](https://api-docs.deepseek.com/api/create-chat-completion/).

The prior planning estimate remains $0.0105984 for four attempts using an estimated 8192 input tokens per call, peak uncached input $0.30/million and output $1.20/million. The $0.02 proposal is **not a hard dollar cap**. Input-token allowance and rates are planning assumptions, not measured usage; this preparation did not refresh or certify current rates. The implementation enforces attempt count and request/body/output limits, not billing. Timeouts/aborts/failures can still incur charges.

## Secret and shutdown handling

The loader canonicalizes both project root and candidate path before excluding in-project files, rejects a final symlink and unsafe file type/size/ownership/permissions, then opens a bounded non-following read. It makes no on-disk copy. The temporary byte buffer is overwritten after loading; the adapter holds the token only in server process memory for its Authorization header. Shutdown clears the adapter's key reference and disables future requests. JavaScript strings/HTTP buffers and garbage collection do not provide a guaranteed memory wipe; ordinary process exit releases process memory. No claim of cryptographic erasure is made.

Private-file/startup errors are generic; neither filesystem exception strings nor provider bodies are logged or returned. The HTTP companion retains its fixed public-asset allowlist and Host/Origin restrictions; server modules, evidence, credentials and arbitrary paths are not served. Browser requests/responses never contain the key or its path. Sanitized stdout records only provider attempt ordinal and fixed result code, for example `Validation attempt 2/4: fallback/provider-error.` No prompt or generated prose is automatically written to logs.

Stop the validation terminal with **Ctrl+C** (SIGINT); SIGTERM uses the same handler. It disables the adapter, requests abort of an active provider request, closes listener/connections and prints the final `N/4` count. Repeated stop calls do not recreate or reset anything. An abort cannot retract a request already received/billed by DeepSeek. If a process cannot stop normally, escalate through the usual task-owned process handling rather than launching a replacement.

Cleanup after an approved run: retain the session marker, sanitized attempt log and reviewed sample evidence; close the task's browser tab and stop the bridge process if it was started only for this check. Do not delete or copy the secure-store key file. Resume ordinary offline work with:

```sh
node server/local-server.cjs
```

That normal CLI reads no key and needs no live opt-in. It does not reset the consumed validation marker or budget. No live listener or marker was created during this preparation; only temporary synthetic test fixtures were created and removed.

## Sample-review evidence template

For future approval, propose three planned successful consultation attempts (Mara before approach, Ivo after scan/direct approach, Tessa after allocation or at debrief) plus at most one additional deliberate sample or failure investigation. All attempts, including failures, share the same four-attempt limit. Do not keep trying until four successes. Stop early if a sample contradicts canonical facts, gives commands, invents events, exposes inappropriate text or looks unsuitable for the officer.

Keep one reviewer record per counted attempt. The following is an **unfilled format**, not observed live evidence:

```json
{
  "evidenceKind": "live-provider-sample OR mock-fixture",
  "approvedSessionLabel": "approved-session-label",
  "attemptOrdinal": null,
  "observedAtUtc": null,
  "officerId": null,
  "consultationIntent": null,
  "runAndRevision": null,
  "canonicalContextAndAdvice": null,
  "sourceAndReason": null,
  "generatedReactionOrFallback": null,
  "review": {
    "reviewer": null,
    "consistentWithCanonicalFacts": null,
    "noNewCommandsOrEvents": null,
    "appropriateOfficerVoice": null,
    "acceptOrRejectAndReason": null
  },
  "screenshotPathIfVisibleRun": null,
  "providerUsageOrBillingEvidenceIfAvailable": null
}
```

Record actual context, reaction, fixed transport result and human judgement; omit credentials, key-file paths, Authorization headers and raw provider error bodies. Preserve actual screenshots/paths for visible runs, including the separate canonical/generated labels. An accepted JSON/string shape is not factual/quality approval. A synthetic `source:'live'` fixture is still mock evidence. Provider usage is currently not exposed by the adapter; do not invent tokens/billing when no approved billing evidence is available. No samples were generated or reviewed live here.

## Prepared files and checks actually run

- New `server/live-validation.cjs`: explicit opt-in CLI, private-file loader, one retained reservation, one adapter, sanitized attempt logs and stop handling.
- Updated `server/dialogue-adapter.cjs`: additive `dispose()` disables future requests, clears its key reference and requests active-call abort. Existing gameplay/presentation/HTTP response APIs and limits remain unchanged.
- New `tests/p2-live-validation.test.cjs`: six mock-only boundary tests. Valid opt-in paths use temporary synthetic credentials and injected fake fetch; no DeepSeek network call is possible in those test cases.
- This plan and `evidence/p2-live-validation-prep/` evidence. No renderer, player, main, scene, gameplay/presentation module or Geordi file was edited.

Commands actually run:

```sh
node --test tests/p2-live-validation.test.cjs tests/p2-systems.test.cjs tests/p2-generation.test.cjs
node server/live-validation.cjs --help
```

Final result: **26/26 pass**. Checks cover inert import/help/no-opt-in subprocesses under synthetic live-looking environment variables; forbidden reset/model/endpoint/budget flags; private-file checks; shared four-attempt budget across runs with both network/provider failures; absence of dummy key/path from logs, marker and responses; no secret/reset routes; concurrent/restarted-session refusal; consumed failed-start reservation; normal offline factory; active request abort; original deterministic, generation, semantic-limit and timeout tests.

The initial boundary run caught a macOS `/var` versus `/private/var` canonical-path mismatch that allowed an in-project fixture through the exclusion. Both paths are now canonicalized; the regression passes. Retained initial output: `initial-path-normalization-failure.txt` (also preserved in the original `offline-boundary-tests.txt`). Final combined output: `offline-tests.txt`. A direct filesystem check confirmed the production `session-used.json` marker did not exist after tests/help. No visible build was run, so this follow-up has no new screenshot claim. No key was requested through secure tools or loaded from a real credential file, no paid request/publication/old-repo reuse/Babble write occurred.

Next owner: Picard independently checks current provider/model/rates and the prepared boundary, then seeks Elliot's explicit spending approval if live validation is still desired. Worf owns independent verification; Geordi owns presentation/native-input integration. Do not run the opt-in template before that authorization.
