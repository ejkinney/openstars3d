/* Pure deterministic rules. No engine, DOM, clock, network or renderer state. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.OpenStars = root.OpenStars || {}).Encounter = api;
})(globalThis, function () {
  'use strict';
  const CREW = Object.freeze(['crew/mara-vale', 'crew/ivo-sen', 'crew/tessa-rook']);
  const STATIONS = Object.freeze(['consoles/comms', 'consoles/science', 'consoles/helm', 'consoles/engineering']);
  const IDS = Object.freeze([...CREW, ...STATIONS]);
  const ACTIONS = Object.freeze({
    'consoles/comms': ['acknowledge', 'rescue-cautious', 'rescue-urgent', 'withdraw'],
    'consoles/science': ['scan'],
    'consoles/helm': ['approach-safe', 'approach-direct'],
    'consoles/engineering': ['power-balanced', 'power-rescue'],
  });
  const LABELS = Object.freeze({
    acknowledge: 'Acknowledge distress', scan: 'Scan field (2 time, 10 power)',
    'approach-safe': 'Follow scanned corridor (2 time)',
    'approach-direct': 'Approach directly (1 time; hull damage)',
    'power-balanced': 'Allocate 50 shielding / 50 rescue',
    'power-rescue': 'Allocate 20 shielding / 80 rescue',
    'rescue-cautious': 'Commit cautious rescue (2 time, 40 power)',
    'rescue-urgent': 'Commit urgent rescue (1 time, 40 power; damage)',
    withdraw: 'Withdraw safely; civilians cannot be recovered', restart: 'Restart encounter',
  });
  const copy = value => JSON.parse(JSON.stringify(value));
  function initial(run = 1) {
    return { schema: 1, run, revision: 0, phase: 'incoming', time: 8, power: 100, hull: 100,
      consulted: [], scanned: false, approach: null, allocation: null, decision: null,
      outcome: null, history: [] };
  }
  function ready(s) { return CREW.every(id => s.consulted.includes(id)); }
  function allowed(s, id) {
    if (!IDS.includes(id)) return [];
    if (s.phase === 'debrief') return id === 'consoles/comms' ? ['restart'] : [];
    if (s.phase === 'incoming') return id === 'consoles/comms' ? ['acknowledge'] : [];
    if (CREW.includes(id)) return s.consulted.includes(id) ? [] : ['consult'];
    if (id === 'consoles/comms') return ready(s) && s.approach && s.allocation
      ? ['rescue-cautious', 'rescue-urgent', 'withdraw'] : ['withdraw'];
    if (!ready(s)) return [];
    if (id === 'consoles/science') return s.scanned ? [] : ['scan'];
    if (id === 'consoles/helm') return s.approach ? [] : s.scanned
      ? ['approach-safe', 'approach-direct'] : ['approach-direct'];
    if (id === 'consoles/engineering') return s.allocation ? [] : ['power-balanced', 'power-rescue'];
    return [];
  }
  function transition(state, id, action) {
    if (!allowed(state, id).includes(action)) return { state, changed: false, reason: 'unavailable' };
    if (action === 'restart') return { state: initial(state.run + 1), changed: true };
    const s = copy(state);
    s.revision++;
    s.history.push({ id, action });
    if (action === 'acknowledge') s.phase = 'planning';
    if (action === 'consult') s.consulted.push(id);
    if (action === 'scan') { s.scanned = true; s.time -= 2; s.power -= 10; }
    if (action.startsWith('approach-')) {
      s.approach = action.slice(9);
      s.time -= s.approach === 'safe' ? 2 : 1;
      if (s.approach === 'direct') s.hull -= s.scanned ? 10 : 20;
    }
    if (action.startsWith('power-')) s.allocation = action.slice(6);
    if (['rescue-cautious', 'rescue-urgent', 'withdraw'].includes(action)) {
      s.decision = action;
      s.phase = 'debrief';
      let rescued = 0;
      if (action !== 'withdraw') {
        s.power -= 40;
        s.time -= action === 'rescue-cautious' ? 2 : 1;
        const prepared = s.scanned && s.approach === 'safe' && s.allocation === 'balanced';
        rescued = action === 'rescue-cautious' ? prepared ? 12 : 8 : s.allocation === 'rescue' ? 10 : 9;
        if (!prepared || action === 'rescue-urgent') s.hull -= s.allocation === 'balanced' ? 15 : 30;
      }
      s.outcome = { kind: action === 'withdraw' ? 'withdrawal' : rescued === 12 ? 'full-rescue' : 'partial-rescue',
        rescued, lost: 12 - rescued, damage: 100 - s.hull, score: rescued * 10 - (100 - s.hull) };
    }
    return { state: s, changed: true };
  }
  function objective(s) {
    if (s.phase === 'incoming') return 'Civilian survey ship Aster: 12 aboard, trapped in a charged debris field. Acknowledge at communications.';
    if (s.phase === 'debrief') return `${s.outcome.rescued}/12 rescued; ${s.outcome.lost} lost; hull ${s.hull}/100. Restart at communications.`;
    if (!ready(s)) return 'Consult Mara at helm, Ivo at science and Tessa at engineering. Walking and talking spend no time.';
    if (!s.approach || !s.allocation) return 'Operate science, helm and engineering. Scanning reveals a safe approach. Commit at communications.';
    return 'Preparation recorded. Commit cautious rescue, urgent rescue or withdrawal at communications.';
  }
  // Replay is the save format: never trust client-supplied resource/outcome fields.
  function checkpoint(s) { return JSON.stringify({ schema: 1, history: s.history }); }
  function restore(raw, run = 1) {
    try {
      if (typeof raw !== 'string' || raw.length > 4096) return null;
      const data = JSON.parse(raw);
      if (data.schema !== 1 || !Array.isArray(data.history) || data.history.length > 10) return null;
      let s = initial(run);
      for (const item of data.history) {
        if (!item || Object.keys(item).sort().join() !== 'action,id' || item.action === 'restart') return null;
        const next = transition(s, item.id, item.action);
        if (!next.changed) return null;
        s = next.state;
      }
      return s;
    } catch { return null; }
  }
  return Object.freeze({ CREW, STATIONS, IDS, ACTIONS, LABELS, initial, allowed, transition, objective, checkpoint, restore, copy });
});
