'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../src/gameplay/encounter.js');
const D = require('../src/gameplay/dialogue.js');
const G = require('../src/gameplay/runtime.js');
const A = require('../server/dialogue-adapter.cjs');
const { createServer } = require('../server/local-server.cjs');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
function apply(s, id, action) {
  const next = R.transition(s, id, action); assert.equal(next.changed, true, `${id}: ${action}`); return next.state;
}
function prepared({ scan = true, approach = 'safe', power = 'balanced' } = {}) {
  let s = apply(R.initial(), 'consoles/comms', 'acknowledge');
  for (const id of R.CREW) s = apply(s, id, 'consult');
  if (scan) s = apply(s, 'consoles/science', 'scan');
  s = apply(s, 'consoles/helm', `approach-${approach}`);
  return apply(s, 'consoles/engineering', `power-${power}`);
}
function contract() { return { version: '0.1.0', onInteract: null, setInteractableEnabled() { throw new Error('No lock/geometry mutation expected'); } }; }
test('documented endings have exact consequences and immutable input', () => {
  const before = prepared(); const snapshot = R.copy(before);
  const full = apply(before, 'consoles/comms', 'rescue-cautious');
  assert.deepEqual(before, snapshot);
  assert.deepEqual(full.outcome, { kind: 'full-rescue', rescued: 12, lost: 0, damage: 0, score: 120 });
  assert.deepEqual([full.time, full.power, full.hull], [2, 50, 100]);
  const partial = apply(prepared({ scan: false, approach: 'direct', power: 'rescue' }), 'consoles/comms', 'rescue-urgent');
  assert.deepEqual(partial.outcome, { kind: 'partial-rescue', rescued: 10, lost: 2, damage: 50, score: 50 });
  assert.deepEqual([partial.time, partial.power, partial.hull], [6, 60, 50]);
  const shieldedUrgent = apply(prepared(), 'consoles/comms', 'rescue-urgent');
  assert.deepEqual([shieldedUrgent.outcome.rescued, shieldedUrgent.outcome.damage], [9, 15]);
  const withdrawal = apply(apply(R.initial(), 'consoles/comms', 'acknowledge'), 'consoles/comms', 'withdraw');
  assert.deepEqual(withdrawal.outcome, { kind: 'withdrawal', rescued: 0, lost: 12, damage: 0, score: 0 });
});
test('all reachable action sequences stay bounded, restore faithfully and always have an exit', () => {
  let visited = 0; const endings = new Set();
  function visit(s) {
    visited++;
    for (const key of ['time', 'power', 'hull']) assert.ok(Number.isInteger(s[key]) && s[key] >= 0 && s[key] <= (key === 'time' ? 8 : 100));
    assert.deepEqual(R.restore(R.checkpoint(s)), s);
    let choices = [];
    for (const id of R.IDS) for (const action of R.allowed(s, id)) choices.push({ id, action });
    assert.ok(choices.length > 0);
    if (s.phase === 'debrief') {
      endings.add(s.outcome.kind);
      assert.deepEqual(choices, [{ id: 'consoles/comms', action: 'restart' }]);
      const reset = apply(s, 'consoles/comms', 'restart');
      assert.deepEqual(reset, R.initial(2)); return;
    }
    if (s.phase === 'planning') assert.ok(R.allowed(s, 'consoles/comms').includes('withdraw'));
    for (const choice of choices) visit(apply(s, choice.id, choice.action));
  }
  visit(R.initial());
  assert.ok(visited > 100);
  assert.deepEqual([...endings].sort(), ['full-rescue', 'partial-rescue', 'withdrawal']);
  console.log(`Exhaustive legal-sequence states checked: ${visited}`);
});
test('invalid/out-of-order/duplicate actions cannot change resources or skip consultations', () => {
  let s = R.initial();
  for (const [id, action] of [['consoles/helm', 'approach-direct'], ['consoles/comms', 'rescue-urgent'], ['wrong', 'acknowledge']]) {
    assert.equal(R.transition(s, id, action).state, s);
  }
  s = prepared(); assert.equal(R.transition(s, 'consoles/science', 'scan').state, s);
  assert.equal(R.restore('{"schema":1,"history":[{"id":"consoles/comms","action":"rescue-cautious"}]}'), null);
  assert.equal(R.restore('x'.repeat(5000)), null);
});
test('crew text follows decisions and resource state, including debrief', () => {
  let s = prepared({ scan: false, approach: 'direct', power: 'rescue' });
  assert.match(D.canonical(s, R.CREW[0]), /completed the direct approach/);
  assert.match(D.canonical(s, R.CREW[1]), /direct approach is already committed/);
  assert.match(D.canonical(s, R.CREW[2]), /20 shielding \/ 80 rescue/);
  s = apply(s, 'consoles/comms', 'withdraw');
  for (const id of R.CREW) assert.match(D.canonical(s, id), /withdraw order is complete: 0 rescued, 12 lost, 20 hull damage/);
});
test('fixed-step partition invariance, bounded catchup, pause and reset', () => {
  const a = [], b = []; const one = G.createFixedStep((dt, tick) => a.push([dt, tick]));
  const two = G.createFixedStep((dt, tick) => b.push([dt, tick]));
  for (let i = 0; i < 120; i++) one.advance(1 / 120);
  for (let i = 0; i < 30; i++) two.advance(1 / 30);
  assert.deepEqual(a, b); assert.equal(a.length, 60);
  assert.equal(one.advance(60), 6); assert.equal(one.advance(1, true), 0);
  one.reset(); assert.equal(one.ticks, 0); assert.equal(one.advance(NaN), 0);
});
test('runtime gates station actions and duplicate interactions; save failure never blocks', () => {
  const c = contract(); const game = G.createGame({ contract: c, storage: { setItem() { throw new Error('quota'); } } });
  assert.equal(game.act('consoles/comms', 'acknowledge'), false);
  c.onInteract('consoles/comms'); c.onInteract('crew/mara-vale');
  assert.equal(game.snapshot().panel.id, 'consoles/comms');
  assert.equal(game.act('consoles/science', 'scan'), false);
  assert.equal(game.act('consoles/comms', 'acknowledge'), true);
  assert.equal(game.snapshot().saveStatus, 'unavailable');
  game.suspend(); assert.equal(game.snapshot().focusRequested, false);
  game.restart(); assert.equal(game.snapshot().state.phase, 'incoming');
  game.dispose(); assert.equal(c.onInteract, null);
  assert.throws(() => G.createGame({ contract: { ...c, version: '2' } }));
});
test('restart invalidates a resolved-late old-run dialogue response', async () => {
  const c = contract(); let complete; let aborted = false;
  const game = G.createGame({ contract: c, dialogue: (_, { signal }) => {
    signal.addEventListener('abort', () => { aborted = true; }); return new Promise(resolve => { complete = resolve; });
  } });
  c.onInteract('crew/ivo-sen'); await wait(0); game.restart();
  complete({ schema: 1, source: 'live', reaction: 'I am concerned, Captain, but ready to help.' }); await wait(0);
  assert.equal(aborted, true); assert.equal(game.snapshot().panel, null);
  assert.deepEqual(game.snapshot().state, R.initial(2)); game.dispose();
});
test('hung/rejected/malformed dialogue falls back; late timeout completion cannot replace it', async () => {
  const c = contract(); let complete;
  const game = G.createGame({ contract: c, timeoutMs: 5, dialogue: () => new Promise(resolve => { complete = resolve; }) });
  c.onInteract('crew/tessa-rook'); await wait(15);
  assert.equal(game.snapshot().panel.reason, 'timeout'); assert.equal(game.snapshot().pending, false);
  complete({ schema: 1, source: 'live', reaction: 'I am concerned, Captain, but ready to help.' }); await wait(0);
  assert.equal(game.snapshot().panel.reason, 'timeout'); game.close();
  game.dispose();
  for (const dialogue of [async () => { throw new Error('network'); }, async () => ({ state: { power: 999 }, phrase: -1 })]) {
    const next = G.createGame({ contract: c, dialogue }); c.onInteract(R.CREW[0]); await wait(0);
    assert.equal(next.snapshot().panel.source, 'fallback'); assert.equal(next.snapshot().state.power, 100); next.dispose();
  }
});
const body = D.request(prepared(), R.CREW[0]);
test('offline adapter and forged checkpoints fail closed', async () => {
  const adapter = A.createAdapter({ generateImpl() { throw new Error('Must not generate'); } });
  assert.equal((await adapter.respond(body)).reason, 'offline');
  assert.equal((await adapter.respond({ ...body, power: 999 })).reason, 'invalid-input');
  assert.equal((await adapter.respond({ ...body, revision: 99 })).reason, 'invalid-input');
  assert.equal(adapter.requestCount, 0);
});
test('mock OpenCode generation uses only free model and four attempts', async () => {
  let calls = 0;
  const adapter = A.createAdapter({ allowLive: true, generateImpl: async ({ prompt, model }) => {
    calls++; assert.deepEqual(model, { providerID: 'opencode', id: 'mimo-v2.6-flash-free' });
    assert.ok(Buffer.byteLength(prompt) <= A.LIMITS.inputBytes);
    return { text: JSON.stringify({ reaction: 'I am concerned, Captain, but ready to help.' }) };
  } });
  for (let i = 0; i < 4; i++) assert.equal((await adapter.respond(body)).source, 'live');
  assert.equal((await adapter.respond(body)).reason, 'request-limit'); assert.equal(calls, 4);
});
test('mock errors, oversized responses, invalid schema and timeout fall back', async () => {
  for (const generateImpl of [async () => { throw new Error('private payload'); },
    async () => ({ text: 'x'.repeat(9000) }), async () => ({ text: JSON.stringify({ phrase: 1 }) })]) {
    const result = await A.createAdapter({ allowLive: true, generateImpl }).respond(body);
    assert.equal(result.source, 'fallback'); assert.equal(result.reaction, undefined);
    assert.ok(!JSON.stringify(result).includes('private'));
  }
  const adapter = A.createAdapter({ allowLive: true, timeoutMs: 5, generateImpl: () => new Promise(() => {}) });
  const first = adapter.respond(body);
  assert.equal((await adapter.respond(body)).reason, 'busy'); assert.equal((await first).reason, 'timeout');
});
test('companion HTTP restricts host/origin/body and serves only allowlisted public modules', async () => {
  const server = createServer({ port: 0 }); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  // Port 0 intentionally means no HTTP Host matches; build the actual-port instance.
  await new Promise(resolve => server.close(resolve));
  const local = createServer({ port }); await new Promise(resolve => local.listen(port, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${port}`;
  try {
    assert.equal((await fetch(base + '/p2-harness.html')).status, 200);
    assert.equal((await fetch(base + '/server/dialogue-adapter.cjs')).status, 404);
    assert.equal((await fetch(base + '/api/dialogue', { method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).status, 403);
    assert.equal((await fetch(base + '/api/dialogue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'x'.repeat(4097) })).status, 413);
    const response = await fetch(base + '/api/dialogue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal((await response.json()).reason, 'offline');
  } finally { await new Promise(resolve => local.close(resolve)); }
});
