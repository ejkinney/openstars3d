'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../src/gameplay/dialogue.js');
const R = require('../src/gameplay/encounter.js');
const G = require('../src/gameplay/runtime.js');
const A = require('../server/dialogue-adapter.cjs');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const reaction = 'The direct route leaves me uneasy, Captain; I will stay focused on our course.';
function advance(s, id, action) {
  const next = R.transition(s, id, action); assert.equal(next.changed, true); return next.state;
}
function planning() {
  let s = advance(R.initial(), 'consoles/comms', 'acknowledge');
  for (const id of R.CREW) s = advance(s, id, 'consult');
  return s;
}
function contract() { return { version: '0.1.0', onInteract: null, setInteractableEnabled() { throw new Error('Renderer must not be mutated'); } }; }
test('predefined consultation intents and context reflect canonical decisions, including debrief', () => {
  let s = R.initial();
  for (const id of R.CREW) assert.equal(D.consultation(s, id).intent, 'await-acknowledgement');
  s = planning();
  assert.equal(D.consultation(s, R.CREW[0]).intent, 'weigh-approach');
  assert.equal(D.consultation(s, R.CREW[1]).intent, 'assess-uncertainty');
  assert.equal(D.consultation(s, R.CREW[2]).intent, 'weigh-allocation');
  s = advance(s, 'consoles/helm', 'approach-direct');
  s = advance(s, 'consoles/engineering', 'power-rescue');
  s = advance(s, 'consoles/science', 'scan');
  assert.equal(D.consultation(s, R.CREW[0]).intent, 'assess-approach');
  assert.equal(D.consultation(s, R.CREW[1]).intent, 'assess-evidence');
  assert.equal(D.consultation(s, R.CREW[2]).intent, 'assess-allocation');
  s = advance(s, 'consoles/comms', 'rescue-urgent');
  for (const id of R.CREW) {
    const packet = D.consultation(s, id);
    assert.equal(packet.intent, 'reflect-outcome');
    assert.equal(packet.context.decision, 'rescue-urgent');
    assert.deepEqual(packet.context.outcome, s.outcome);
    assert.equal(packet.canonicalAdvice, D.canonical(s, id));
    packet.context.outcome.rescued = 999; assert.equal(s.outcome.rescued, 10);
  }
});
test('mock OpenCode generates original contextual text and screens malformed output', async () => {
  let observed; const s = advance(planning(), 'consoles/helm', 'approach-direct');
  const adapter = A.createAdapter({ allowLive: true, generateImpl: async input => {
    observed = input; return { text: JSON.stringify({ reaction }) };
  } });
  const result = await adapter.respond(D.request(s, R.CREW[0]));
  assert.deepEqual(result, { schema: 1, source: 'live', reaction, reason: 'shape-checked' });
  assert.deepEqual(observed.model, A.MODEL);
  assert.ok(observed.prompt.includes('assess-approach'));
  assert.ok(observed.prompt.includes(D.canonical(s, R.CREW[0])));
  assert.ok(Buffer.byteLength(observed.prompt) <= A.LIMITS.inputBytes);
  for (const value of [{ phrase: 0 }, { reaction, power: 999 }, { reaction: 'Rescued 999.' }]) {
    const invalid = await A.createAdapter({ allowLive: true, generateImpl: async () => ({ text: JSON.stringify(value) }) })
      .respond(D.request(s, R.CREW[0]));
    assert.equal(invalid.reason, 'invalid-response');
  }
});
test('runtime presents generated reaction separately and cannot mutate canonical advice, actions, resources or outcomes', async () => {
  const c = contract();
  const game = G.createGame({ contract: c, dialogue: async () => ({ schema: 1, source: 'live', reaction,
    text: 'OVERRIDE', actions: ['rescue-urgent'], state: { power: 999 }, outcome: { rescued: 999 } }) });
  c.onInteract('consoles/comms'); game.act('consoles/comms', 'acknowledge'); game.close();
  c.onInteract(R.CREW[0]); const before = game.snapshot(); await wait(0);
  const after = game.snapshot();
  assert.equal(after.panel.flavour, reaction); assert.equal(after.panel.source, 'live-flavour');
  assert.equal(after.panel.text, D.canonical(after.state, R.CREW[0]));
  assert.deepEqual(after.state, before.state); assert.deepEqual(after.actions, before.actions);
  after.panel.text = 'UI mutation'; after.state.power = 999;
  assert.equal(game.snapshot().panel.text, before.panel.text); assert.equal(game.snapshot().state.power, 100);
  game.dispose();
});
test('schema screening does not prove semantic truth; a misleading but well-shaped sentence has no rule authority', async () => {
  const misleading = 'I believe everybody is already safe, Captain.';
  assert.equal(D.validReaction({ reaction: misleading }), true);
  const c = contract(); const game = G.createGame({ contract: c, dialogue: async () => ({ schema: 1, source: 'live', reaction: misleading }) });
  c.onInteract(R.CREW[1]); await wait(0);
  assert.equal(game.snapshot().panel.flavour, misleading);
  assert.match(game.snapshot().panel.text, /unanswered distress call/);
  assert.equal(game.snapshot().state.outcome, null); assert.equal(game.snapshot().state.phase, 'incoming'); game.dispose();
});
test('suspend/reopen and restart invalidate generated text from earlier requests', async () => {
  const c = contract(); const completes = [];
  const game = G.createGame({ contract: c, dialogue: () => new Promise(resolve => completes.push(resolve)) });
  c.onInteract(R.CREW[0]); await wait(0); game.suspend(); c.onInteract(R.CREW[1]); await wait(0);
  completes[0]({ schema: 1, source: 'live', reaction }); await wait(0);
  assert.equal(game.snapshot().panel.id, R.CREW[1]); assert.equal(game.snapshot().panel.flavour, null);
  game.restart(); completes[1]({ schema: 1, source: 'live', reaction }); await wait(0);
  assert.equal(game.snapshot().panel, null); assert.deepEqual(game.snapshot().state, R.initial(2)); game.dispose();
});
test('invalid/offline/rejected output uses deterministic officer fallback without touching canonical text', async () => {
  for (const dialogue of [async () => ({ schema: 1, source: 'live', reaction: 'Rescued 999.' }),
    async () => ({ schema: 1, source: 'fallback', reason: 'offline', reaction }), async () => { throw new Error('network'); }]) {
    const c = contract(); const game = G.createGame({ contract: c, dialogue }); c.onInteract(R.CREW[2]); await wait(0);
    assert.equal(game.snapshot().panel.source, 'fallback'); assert.equal(game.snapshot().panel.flavour, D.flavour(R.CREW[2], 0));
    assert.equal(game.snapshot().panel.text, D.canonical(game.snapshot().state, R.CREW[2])); game.dispose();
  }
});
