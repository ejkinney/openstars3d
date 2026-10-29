(function (root, factory) {
  const node = typeof module === 'object' && module.exports;
  const api = factory(node ? require('./encounter.js') : root.OpenStars.Encounter,
    node ? require('./dialogue.js') : root.OpenStars.Dialogue);
  if (node) module.exports = api;
  else root.OpenStars.Gameplay = api;
})(globalThis, function (R, D) {
  'use strict';
  // Reserved for future time-driven gameplay; encounter urgency is action-based.
  function createFixedStep(step, hz = 60) {
    if (!Number.isInteger(hz) || hz < 1 || hz > 240) throw new Error('Invalid step rate');
    const dt = 1 / hz; let accumulator = 0; let ticks = 0;
    return { advance(seconds, paused = false) {
      if (paused) { accumulator = 0; return 0; }
      if (!Number.isFinite(seconds) || seconds < 0) return 0;
      accumulator += Math.min(seconds, 0.1);
      let count = 0;
      while (accumulator + 1e-12 >= dt && count < 24) {
        step(dt, ++ticks); accumulator -= dt; count++;
      }
      return count;
    }, reset() { accumulator = 0; ticks = 0; }, get ticks() { return ticks; } };
  }
  function createGame({ contract, present = () => {}, dialogue = null, timeoutMs = 1500, storage = null } = {}) {
    if (!contract || contract.version !== '0.1.0' || typeof contract.setInteractableEnabled !== 'function') throw new Error('Scene contract 0.1.0 required');
    if (contract.onInteract) throw new Error('Interaction hook already owned');
    let s = R.initial(); let panel = null; let pending = null; let generation = 0; let disposed = false;
    const saveKey = 'openstars.encounter.v1';
    let saveStatus = 'unsaved';
    function persist() {
      if (!storage) { saveStatus = 'disabled'; return; }
      try { storage.setItem(saveKey, R.checkpoint(s)); saveStatus = 'saved'; } catch { saveStatus = 'unavailable'; }
    }
    function cancel() {
      generation++;
      if (pending) { clearTimeout(pending.timer); pending.controller.abort(); pending = null; }
    }
    function view() {
      return R.copy({ state: s, objective: R.objective(s), panel, saveStatus,
        focusRequested: !!panel, pending: !!pending,
        actions: panel ? R.allowed(s, panel.id).map(action => ({ action, label: R.LABELS[action] || 'Consult officer' })) : [] });
    }
    function publish() { if (!disposed) present(view()); }
    function close() { cancel(); panel = null; publish(); }
    function restart() { cancel(); s = R.initial(s.run + 1); panel = null; persist(); publish(); }
    function act(id, action) {
      if (disposed || !panel || panel.id !== id) return false;
      if (action === 'restart' && R.allowed(s, id).includes(action)) { restart(); return true; }
      const next = R.transition(s, id, action);
      if (!next.changed) return false;
      cancel(); s = next.state;
      panel = { id, text: D.flavour(id, 0) ? D.canonical(s, id) : R.objective(s), source: 'canonical' };
      persist(); publish(); return true;
    }
    function interact(id) {
      if (disposed || panel || !R.IDS.includes(id)) return;
      if (R.CREW.includes(id)) {
        const next = R.transition(s, id, 'consult');
        if (next.changed) { s = next.state; persist(); }
        panel = { id, text: D.canonical(s, id), source: 'canonical', flavour: null };
        publish();
        if (!dialogue) return;
        const ticket = ++generation;
        const controller = new AbortController();
        const body = D.request(s, id);
        let settled = false;
        const finish = (result, reason) => {
          if (settled || disposed || generation !== ticket || !panel || panel.id !== id) return;
          settled = true;
          clearTimeout(pending?.timer); pending = null;
          // Rebuild canonical text from CURRENT state, never from model text.
          panel.text = D.canonical(s, id);
          const generated = result?.schema === 1 && result.source === 'live'
            && D.validReaction({ reaction: result.reaction });
          panel.flavour = generated ? result.reaction : D.flavour(id, 0);
          panel.source = generated ? 'live-flavour' : 'fallback';
          panel.reason = reason || (generated ? 'shape-checked' : result?.source === 'fallback' ? result.reason : 'invalid-response') || 'offline'; publish();
        };
        const timer = setTimeout(() => { controller.abort(); finish(null, 'timeout'); }, timeoutMs);
        pending = { controller, timer }; publish();
        Promise.resolve().then(() => {
          if (controller.signal.aborted || generation !== ticket) return null;
          return dialogue(body, { signal: controller.signal });
        })
          .then(result => finish(result), () => finish(null, 'unavailable'));
      } else { panel = { id, text: R.objective(s), source: 'canonical' }; publish(); }
    }
    contract.onInteract = interact;
    publish();
    return Object.freeze({ snapshot: view, act, close, restart,
      // Renderer calls suspend on pause/blur. This never changes pointer lock.
      suspend: close,
      resumeSaved() {
        if (disposed || !storage) return false;
        let restored; try { restored = R.restore(storage.getItem(saveKey), s.run + 1); } catch { return false; }
        if (!restored) return false;
        cancel(); s = restored; panel = null; publish(); return true;
      },
      dispose() { cancel(); disposed = true; if (contract.onInteract === interact) contract.onInteract = null; },
    });
  }
  function httpDialogue(fetchImpl = globalThis.fetch, endpoint = '/api/dialogue') {
    return async (body, { signal }) => {
      const response = await fetchImpl(endpoint, { method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error('Dialogue unavailable');
      return response.json();
    };
  }
  return Object.freeze({ createFixedStep, createGame, httpDialogue });
});
