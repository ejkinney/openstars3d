'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { connect } = require('../../server/opencode-service.cjs');
const { start } = require('../../server/opencode-companion.cjs');
const { createServer } = require('../../server/local-server.cjs');
const A = require('../../server/dialogue-adapter.cjs');
const R = require('../../src/gameplay/encounter.js');
const D = require('../../src/gameplay/dialogue.js');
const body = D.request(R.initial(), R.CREW[0]);
const canary = 'mock-auth-header-not-a-credential';

function fixture(model = { ...A.MODEL, enabled: true, status: 'active', cost: [{ input: 0, output: 0 }] }) {
  const trace = [];
  const endpoint = { url: 'http://127.0.0.1:4096' };
  const headers = { authorization: canary };
  const load = async name => name.endsWith('/service') ? { Service: {
    discover: async () => { trace.push(['discover']); return endpoint; },
    headers: got => { trace.push(['headers', got]); return headers; }
  } } : { OpenCode: { make: options => { trace.push(['make', options]); return {
    model: { list: async options => { trace.push(['list', options]); return { data: [model] }; } },
    experimental: { generate: { text: async (input, options) => {
      trace.push(['generate', input, options]);
      return { text: JSON.stringify({ reaction: 'I am concerned, Captain, but ready to help.' }) };
    } } }
  }; } } };
  return { trace, endpoint, headers, load };
}

async function freePort() {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

test('discovery headers are passed only into the local client; exact free pin gates generation', async () => {
  const f = fixture();
  const generate = await connect({ load: f.load, directory: '/mock/project' });
  assert.equal(typeof generate, 'function');
  assert.deepEqual(f.trace[0], ['discover']);
  assert.deepEqual(f.trace[1], ['headers', f.endpoint]);
  assert.deepEqual(f.trace[2], ['make', { baseUrl: f.endpoint.url, headers: f.headers }]);
  assert.deepEqual(f.trace[3], ['list', { location: { directory: '/mock/project' }, types: ['chat'] }]);
  const result = await generate({ prompt: 'mock prompt', signal: new AbortController().signal });
  assert.equal(f.trace[4][0], 'generate');
  assert.deepEqual(f.trace[4][1].model, A.MODEL);
  assert.equal(JSON.stringify(result).includes(canary), false);
  assert.equal(JSON.stringify(f.trace.find(x => x[0] === 'generate')).includes('max_tokens'), false);
});

test('missing service and any non-active, disabled, paid, or non-pinned model fail closed', async () => {
  const absent = fixture();
  absent.load = async name => name.endsWith('/service') ? { Service: { discover: async () => null, headers: () => ({}) } } : { OpenCode: { make() { assert.fail('client made without service'); } } };
  assert.equal(await connect({ load: absent.load }), null);
  const bad = [
    { ...A.MODEL, enabled: false, status: 'active', cost: [{ input: 0, output: 0 }] },
    { ...A.MODEL, enabled: true, status: 'inactive', cost: [{ input: 0, output: 0 }] },
    { ...A.MODEL, enabled: true, status: 'active', cost: [{ input: 0, output: 0.01 }] },
    { providerID: 'other', id: A.MODEL.id, enabled: true, status: 'active', cost: [{ input: 0, output: 0 }] },
    { ...A.MODEL, id: 'other-model', enabled: true, status: 'active', cost: [{ input: 0, output: 0 }] }
  ];
  for (const model of bad) assert.equal(await connect({ load: fixture(model).load }), null);
});

test('attempt, prompt, timeout, and response byte limits match the handoff', async () => {
  assert.deepEqual(A.LIMITS, { requests: 4, inputBytes: 6000, responseBytes: 8192, timeoutMs: 10000 });
  let calls = 0;
  const exact = JSON.stringify({ reaction: 'I am concerned, Captain, but ready to help.' });
  const atLimit = exact + ' '.repeat(8192 - Buffer.byteLength(exact));
  assert.equal(Buffer.byteLength(atLimit), 8192);
  const adapter = A.createAdapter({ allowLive: true, generateImpl: async ({ prompt }) => {
    calls++; assert.ok(Buffer.byteLength(prompt) <= A.LIMITS.inputBytes); return { text: atLimit };
  } });
  for (let i = 0; i < 4; i++) assert.equal((await adapter.respond(body)).source, 'live');
  assert.equal((await adapter.respond(body)).reason, 'request-limit');
  assert.equal(calls, 4);
  const tooLarge = A.createAdapter({ allowLive: true, generateImpl: async () => ({ text: atLimit + ' ' }) });
  assert.equal((await tooLarge.respond(body)).reason, 'invalid-response');
});

test('normal local server stays offline and enforces 128 requests per process', async () => {
  const probe = net.createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const server = createServer({ port });
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  try {
    const url = `http://127.0.0.1:${port}/api/dialogue`;
    for (let i = 0; i < 128; i++) {
      const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      assert.equal(response.status, 200);
      assert.equal((await response.json()).reason, 'offline');
    }
    const limited = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal(limited.status, 429);
    assert.deepEqual(await limited.json(), { error: 'local-request-limit' });
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('explicit opt-in route keeps mocked auth out of HTTP and logs; startup itself does not generate', async () => {
  const f = fixture();
  const port = await freePort();
  const logs = [];
  const generate = await connect({ load: f.load, directory: '/mock/project' });
  const session = await start(['--enable-free-dialogue'], { connectImpl: async () => generate, port, log: line => logs.push(line) });
  try {
    assert.equal(f.trace.some(x => x[0] === 'generate'), false);
    assert.equal(session.adapter.requestCount, 0);
    const response = await fetch(`http://127.0.0.1:${port}/api/dialogue`, {
      method: 'POST', headers: { 'content-type': 'application/json', origin: `http://127.0.0.1:${port}` }, body: JSON.stringify(body)
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.source, 'live');
    assert.equal(JSON.stringify(payload).includes(canary), false);
    assert.equal(logs.join('\n').includes(canary), false);
  } finally { await session.stop(); }
});
