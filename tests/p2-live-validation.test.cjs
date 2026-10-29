'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { connect } = require('../server/opencode-service.cjs');
const { start } = require('../server/opencode-companion.cjs');
const A = require('../server/dialogue-adapter.cjs');
const R = require('../src/gameplay/encounter.js');
const D = require('../src/gameplay/dialogue.js');
const body = D.request(R.initial(), R.CREW[0]);
function mock(enabled = true, cost = 0) {
  const calls = [];
  const load = async name => name.endsWith('/service') ? { Service: {
    discover: async () => ({ url: 'http://127.0.0.1:4096' }), headers: () => ({ authorization: 'mock-only' })
  } } : { OpenCode: { make: opts => { calls.push(['make', opts]); return {
    model: { list: async () => ({ data: [{ ...A.MODEL, enabled, status: 'active', cost: [{ input: cost, output: cost }] }] }) },
    experimental: { generate: { text: async (input, request) => { calls.push(['generate', input, request]); return { text: JSON.stringify({ reaction: 'I am concerned, Captain, but ready to help.' }) }; } } }
  }; } } };
  return { load, calls };
}
test('retired DeepSeek CLI cannot run or read credentials', () => {
  const cli = path.resolve(__dirname, '../server/live-validation.cjs');
  const result = spawnSync(process.execPath, [cli, '--enable-paid-validation'], { encoding: 'utf8', timeout: 2000 });
  assert.equal(result.status, 1); assert.match(result.stderr, /disabled/);
});
test('service uses discovered authenticated endpoint and exact free model only', async () => {
  const fixture = mock(); const generate = await connect({ load: fixture.load });
  assert.equal(typeof generate, 'function');
  assert.equal(fixture.calls.length, 1);
  const adapter = A.createAdapter({ allowLive: true, generateImpl: generate });
  assert.equal((await adapter.respond(body)).source, 'live');
  assert.deepEqual(fixture.calls[1][1].model, A.MODEL);
  assert.equal(fixture.calls[1][2].signal instanceof AbortSignal, true);
  for (const f of [mock(false), mock(true, 0.001)]) assert.equal(await connect({ load: f.load }), null);
});
test('companion needs explicit opt-in; startup makes no generation call', async () => {
  await assert.rejects(start([], { connectImpl() { assert.fail('No connection'); } }), /opt-in/);
  const fixture = mock(); const session = await start(['--enable-free-dialogue'], { connectImpl: () => connect({ load: fixture.load }), port: 0, log() {} });
  try { assert.equal(fixture.calls.length, 1); assert.equal(session.adapter.requestCount, 0); }
  finally { await session.stop(); }
});
