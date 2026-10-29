'use strict';
const R = require('../src/gameplay/encounter.js');
const D = require('../src/gameplay/dialogue.js');
const MODEL = Object.freeze({ providerID: 'opencode', id: 'mimo-v2.6-flash-free' });
const LIMITS = Object.freeze({ requests: 4, inputBytes: 6000, responseBytes: 8192, timeoutMs: 10000 });
const fallback = reason => ({ schema: 1, source: 'fallback', reason });
const SYSTEM = 'Write one original, short personal reaction from this fictional bridge officer. Canonical advice is displayed separately and is authoritative. Do not change facts, report new events, give commands, add digits or markup, or claim completed operations. Return only a JSON object with one key, reaction. Use 12 to 240 characters and at most 40 words.';
function parseRequest(body) {
  if (!body || Object.keys(body).sort().join() !== 'checkpoint,officer,revision,run,schema') return null;
  if (body.schema !== 1 || !R.CREW.includes(body.officer) || !Number.isSafeInteger(body.run) || body.run < 1
    || !Number.isSafeInteger(body.revision) || body.revision < 0) return null;
  const state = R.restore(body.checkpoint, body.run);
  return state && state.revision === body.revision ? { state, officer: body.officer } : null;
}
function createAdapter({ allowLive = false, generateImpl, timeoutMs = LIMITS.timeoutMs } = {}) {
  let count = 0; let busy = false; let stopped = false; let active = null;
  return Object.freeze({ async respond(body) {
    if (stopped) return fallback('stopped');
    const parsed = parseRequest(body);
    if (!parsed) return fallback('invalid-input');
    if (!allowLive) return fallback('offline');
    if (typeof generateImpl !== 'function') return fallback('unavailable');
    if (busy) return fallback('busy');
    if (count >= LIMITS.requests) return fallback('request-limit');
    const prompt = SYSTEM + '\n' + JSON.stringify({ officer: parsed.officer, ...D.consultation(parsed.state, parsed.officer) });
    if (Buffer.byteLength(prompt, 'utf8') > LIMITS.inputBytes) return fallback('input-limit');
    count++; busy = true;
    const controller = new AbortController(); active = controller; let timer;
    try {
      const work = (async () => {
        const result = await generateImpl({ prompt, model: MODEL, signal: controller.signal });
        if (stopped) return fallback('stopped');
        if (typeof result?.text !== 'string' || Buffer.byteLength(result.text, 'utf8') > LIMITS.responseBytes) return fallback('invalid-response');
        const value = JSON.parse(result.text);
        if (!D.validReaction(value)) return fallback('invalid-response');
        return { schema: 1, source: 'live', reaction: value.reaction, reason: 'shape-checked' };
      })();
      const deadline = new Promise(resolve => { timer = setTimeout(() => { controller.abort(); resolve(fallback('timeout')); }, timeoutMs); });
      return await Promise.race([work, deadline]);
    } catch { return fallback('unavailable'); }
    finally { clearTimeout(timer); if (active === controller) active = null; busy = false; }
  }, get requestCount() { return count; }, dispose() { stopped = true; active?.abort(); } });
}
module.exports = { MODEL, LIMITS, SYSTEM, createAdapter, parseRequest };
