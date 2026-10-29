/* Canonical officer lines remain authoritative; optional model text is separately labelled. */
(function (root, factory) {
  const rules = typeof module === 'object' && module.exports ? require('./encounter.js') : root.OpenStars.Encounter;
  const api = factory(rules);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenStars.Dialogue = api;
})(globalThis, function (R) {
  'use strict';
  function canonical(s, id) {
    if (!R.CREW.includes(id)) throw new Error('Unknown officer');
    const status = `Aster: ${s.phase}; time ${s.time}/8, power ${s.power}/100, hull ${s.hull}/100. `;
    if (s.phase === 'incoming') return status + 'Captain, communications has an unanswered distress call. Please acknowledge it first.';
    if (s.phase === 'debrief') return status + `Your ${s.decision} order is complete: ${s.outcome.rescued} rescued, ${s.outcome.lost} lost, ${s.outcome.damage} hull damage. No further orders are pending.`;
    if (id === 'crew/mara-vale') return status + (s.approach
      ? `We have completed the ${s.approach} approach. ${s.approach === 'direct' ? 'The debris strike is already included in hull status.' : 'The scanned corridor kept our hull intact.'}`
      : 'I can take us directly in for one time unit, but debris will hit us. Scan first and I can use a safe two-unit corridor.');
    if (id === 'crew/ivo-sen' && s.approach === 'direct') return status +
      `${s.scanned ? 'Scan complete, but' : 'The field remains unscanned, and'} the direct approach is already committed. A cautious extraction now saves eight; urgent extraction saves ${s.allocation === 'balanced' ? 'nine' : s.allocation === 'rescue' ? 'ten' : 'nine or ten depending on power'}, with damage. We cannot undo the approach.`;
    if (id === 'crew/ivo-sen') return status + (s.scanned
      ? 'Scan complete. The safe corridor is mapped. A cautious rescue needs that corridor and balanced shielding for all twelve.'
      : 'A scan costs two time units and ten power. It maps a safe corridor; a direct approach leaves more uncertainty.');
    return status + (s.allocation
      ? `Power is set to ${s.allocation === 'balanced' ? '50 shielding / 50 rescue' : '20 shielding / 80 rescue'}. Rescue consumes forty total power. ${s.allocation === 'rescue' ? 'Reduced shielding increases hull damage.' : 'Balanced shielding supports a full cautious rescue.'}`
      : 'Choose 50 shielding / 50 rescue for protection, or 20 / 80 for rescue priority. Urgent extraction saves nine with balanced power, ten with rescue priority. Weak shielding increases damage.');
  }
  function request(s, id) {
    return { schema: 1, officer: id, run: s.run, revision: s.revision,
      checkpoint: R.checkpoint(s) };
  }
  // Offline fallback only. Generated text is never selected from this table.
  const FLAVOUR = Object.freeze({
    'crew/mara-vale': ['Standing by, Captain.', 'We will keep a steady course.'],
    'crew/ivo-sen': ['I will keep watching the signal.', 'We should be precise, Captain.'],
    'crew/tessa-rook': ['I will keep the systems ready.', 'You have my attention, Captain.'],
  });
  function flavour(id, index) { return FLAVOUR[id]?.[index] || null; }
  const REACTION_LIMITS = Object.freeze({ minChars: 12, maxChars: 240, maxWords: 40 });
  // Syntactic/content screening, NOT proof of factual consistency or safety.
  function validReaction(value) {
    return !!value && !Array.isArray(value) && Object.keys(value).join() === 'reaction'
      && typeof value.reaction === 'string'
      && value.reaction.length >= REACTION_LIMITS.minChars && value.reaction.length <= REACTION_LIMITS.maxChars
      && value.reaction === value.reaction.trim() && value.reaction.split(/\s+/u).length <= REACTION_LIMITS.maxWords
      && /^[A-Za-z ,.!?'’“”–—;:\-]+$/u.test(value.reaction)
      && !/(?:https?|www|javascript|system prompt|ignore .*instructions|api key|password|execute|run command|click|press|choose|allocate|withdraw|rescue now)/iu.test(value.reaction);
  }
  function consultation(s, id) {
    if (!R.CREW.includes(id)) throw new Error('Unknown officer');
    const personality = {
      'crew/mara-vale': 'Mara Vale, helm: warm, decisive, concerned for civilians; prefers prompt intervention.',
      'crew/ivo-sen': 'Ivo Sen, science: measured, curious, careful about uncertainty; prefers evidence.',
      'crew/tessa-rook': 'Tessa Rook, engineering: practical, candid, attentive to protecting the ship and crew.',
    }[id];
    const intent = s.phase === 'incoming' ? 'await-acknowledgement' : s.phase === 'debrief' ? 'reflect-outcome'
      : id === 'crew/mara-vale' ? s.approach ? 'assess-approach' : 'weigh-approach'
        : id === 'crew/ivo-sen' ? s.scanned ? 'assess-evidence' : 'assess-uncertainty'
          : s.allocation ? 'assess-allocation' : 'weigh-allocation';
    return { intent, personality, canonicalAdvice: canonical(s, id),
      context: { phase: s.phase, scanned: s.scanned, approach: s.approach, allocation: s.allocation,
        decision: s.decision, outcome: R.copy(s.outcome), resources: { time: s.time, power: s.power, hull: s.hull } } };
  }
  return Object.freeze({ canonical, request, flavour, FLAVOUR, REACTION_LIMITS, validReaction, consultation });
});
