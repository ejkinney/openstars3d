# P2 OpenCode route — independent verification

Date: 2026-10-29. Scope: server-side OpenCode companion only. No implementation files changed; no credentials read, no live service discovery, no real model-generation call, no paid call, and no phase/gate advancement.

## Recommendation

**PASS for the bounded, mock-only route and offline-fallback implementation checks below; do not claim live OpenCode availability or generated-content quality.** The exact opt-in argument is enforced and tested through `start()` with an injected mock connector. The real CLI was deliberately not launched with `--enable-free-dialogue`, because its startup performs service discovery/catalog reads. Keep G3/G4 and live-provider validation pending Picard's decision.

The product default **remains offline**: `package.json` maps `npm run companion` to `node server/local-server.cjs`; the server creates the adapter with default `allowLive=false`. I exercised its local HTTP route with the default adapter: 128 valid requests returned offline fallback and request 129 returned 429. OpenCode generation is a separate CLI requiring `--enable-free-dialogue`.

## Checks and results

- **Discovery/auth-header handling:** injected `Service.discover()` returned a loopback fixture endpoint; the exact endpoint and `Service.headers(endpoint)` result were passed only into `OpenCode.make({baseUrl, headers})`. Mock assertions covered the model-list location and chat filter. In a mocked opt-in HTTP request, the sentinel auth header did not appear in the browser-visible response or captured startup logs. No actual credential was present or inspected.
- **Pin/catalog gate:** verified only `opencode/mimo-v2.6-flash-free` proceeds when enabled, active, and zero input/output cost is present. Mock cases for missing service, disabled/inactive model, nonzero price, wrong provider, and wrong model all fail closed. The generation request uses the exact pin.
- **Startup and opt-in:** absent/incorrect args reject before connecting; `start(['--enable-free-dialogue'], ...)` with a mocked connector performs discovery/catalog setup but zero generation at startup. A subsequent mocked local HTTP request exercised the route. The real CLI command was not launched to avoid live discovery.
- **Offline fallback and bounds:** offline adapter default verified; four generation attempts maximum; prompt remains within 6000 UTF-8 bytes; response at 8192 bytes accepted if valid and 8193 rejected; handoff limits confirmed as `{requests:4,inputBytes:6000,responseBytes:8192,timeoutMs:10000}`. Timeout/busy/error/malformed/oversize fallback tests passed. Normal local-server body limit is 4096 bytes (existing suite verifies 4097 gives 413); process request limit verified at 128/129. The API has no provider-side max-output-token option; bounded response bytes and content screening are post-response controls, not a hard model token cap.
- **DeepSeek isolation:** the OpenCode CLI import path is `opencode-companion.cjs` → `opencode-service.cjs` / `dialogue-adapter.cjs` / `local-server.cjs`; no DeepSeek client, URL, or credential read is in that path. `server/live-validation.cjs` is a retired stub that exits 1 with “DeepSeek validation is disabled.” Existing test spawned that stub and passed. Source scan found no `process.env` reads in `server/`.
- **Error handling:** mock network/rejection/timeout and malformed response tests return fallback; CLI catch emits a generic startup error rather than an endpoint/header/error payload. No live failure behavior was induced.

## Commands run

```sh
node --test tests/p2-systems.test.cjs tests/p2-generation.test.cjs tests/p2-live-validation.test.cjs
# 21 passed, 0 failed

node --test evidence/p2-opencode-worf/independent.test.cjs
# 5 passed, 0 failed

node --check server/opencode-service.cjs
node --check server/opencode-companion.cjs
node --check server/dialogue-adapter.cjs
node --check server/local-server.cjs
node --check evidence/p2-opencode-worf/independent.test.cjs
# all passed

grep -RInE 'DEEPSEEK|deepseek|process\\.env|Authorization|authorization|Service\\.headers|console\\.(log|error)' server tests/p2-live-validation.test.cjs
```

The custom independent tests are reproducible in `evidence/p2-opencode-worf/independent.test.cjs`; captured outputs are `project-tests.txt` and `independent-tests.txt`. `source-sha256.txt` records the inspected server files. The project directory is not a Git checkout, so no Git diff/status is available; source was only read, and new files are confined to this report/evidence directory.

## Limits and unverified facts

Per `docs/P2-opencode-handoff.md`, the read-only handoff reports `opencode auth list` had **no authenticated integrations** and `usage.limits` was **null**. I did not rerun those commands or access any credentials. Therefore account-specific quota, current service/catalog state, live model availability, billing, and generated-text quality remain **unverified**. The opt-in route's real OpenCode startup and generation were intentionally not exercised; all route and generation evidence above uses mocks. No screenshots apply: this was a server/CLI test run, not a GUI or rendered build.
