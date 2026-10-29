/**
 * Open Stars — Scene & Interaction Contract (P1).
 *
 * Owned by Geordi (renderer). Data consumes ONLY this contract; nobody else edits
 * the renderer. Do NOT rename entity IDs or change hook signatures without bumping
 * `version` and notifying Data.
 *
 * Conventions:
 *   - Entity IDs are dotted paths, all lowercase, kebab-case.
 *   - Every interactable entity carries the `interactable` tag AND a registry entry
 *     (Contract.interactables) so Data can resolve it by stable name.
 *   - Rendering-only entities are NOT part of the contract surface Data may drive;
 *     Data reads positions/state but mutates gameplay through the hooks below.
 */
window.OpenStars = window.OpenStars || {};

(function () {
  'use strict';

  const Contract = {
    /** Bump on any breaking change to IDs or hook signatures. */
    version: '0.1.0',

    /**
     * Canonical entity IDs. Resolve with Contract.entity('<id>').
     * These are the ONLY names Data should depend on.
     */
    ENTITIES: {
      ROOT: 'openstars/root',
      BRIDGE: 'bridge',
      FLOOR: 'bridge/floor',
      CEILING: 'bridge/ceiling',
      FRONT_WALL: 'bridge/wall/front',
      BACK_WALL: 'bridge/wall/back',
      LEFT_WALL: 'bridge/wall/left',
      RIGHT_WALL: 'bridge/wall/right',
      VIEWSCREEN: 'bridge/viewscreen',
      CAPTAIN_CHAIR: 'bridge/captain-chair',

      CONSOLE_HELM: 'consoles/helm',
      CONSOLE_SCIENCE: 'consoles/science',
      CONSOLE_ENGINEERING: 'consoles/engineering',
      CONSOLE_COMMS: 'consoles/comms',

      CREW_MARA: 'crew/mara-vale',      // helm
      CREW_IVO: 'crew/ivo-sen',         // science
      CREW_TESSA: 'crew/tessa-rook',    // engineering

      PLAYER_CAMERA: 'player/camera',
    },

    /** Crew metadata Data can query for consultation UI. */
    CREW: {
      'crew/mara-vale': { name: 'Mara Vale', role: 'Helm', accent: '#f0a83e' },
      'crew/ivo-sen': { name: 'Ivo Sen', role: 'Science', accent: '#4da3ff' },
      'crew/tessa-rook': { name: 'Tessa Rook', role: 'Engineering', accent: '#ee6445' },
    },

    /**
     * Interactable registry: name -> { entity, label, prompt, enabled, aabb }.
     * aabb is an axis-aligned box { min: Vec3, max: Vec3 } in world space, used by
     * the renderer's gaze raycast. Data must not edit aabb; it is re-derived on build.
     */
    interactables: new Map(),

    /**
     * Data's interaction hook. Set this once:
     *   OpenStars.Contract.onInteract = (name, descriptor) => { ... }
     * The renderer calls it when the player presses the interact key while gazing at
     * an enabled interactable. All gameplay semantics live on Data's side.
     */
    onInteract: null,

    /** Back-reference to the pc.Application, set during scene build. */
    _app: null,
  };

  /** Resolve a contract entity by its canonical ID. */
  Contract.entity = function (id) {
    if (!Contract._app || !Contract._app.root) return undefined;
    return Contract._app.root.findByName(id);
  };

  /**
   * Register an interactable. Called by the renderer during build.
   * @param {string} name       canonical ID (must be in Contract.ENTITIES or crew)
   * @param {pc.Entity} entity  the entity the player gazes at
   * @param {object} opts       { label, prompt, aabb, accent }
   */
  Contract.registerInteractable = function (name, entity, opts) {
    opts = opts || {};
    entity.tags.add('interactable');
    entity.__openstarsInteractable = name;
    Contract.interactables.set(name, {
      entity: entity,
      label: opts.label || name,
      prompt: opts.prompt || 'Interact',
      enabled: true,
      aabb: opts.aabb || null,
      accent: opts.accent || null,
      // Optional per-interactable highlight hook (renderer sets it).
      setHovered: opts.setHovered || null,
    });
    return Contract;
  };

  /** Enable/disable an interactable (e.g. during dialogue). */
  Contract.setInteractableEnabled = function (name, enabled) {
    const d = Contract.interactables.get(name);
    if (d) d.enabled = !!enabled;
  };

  /**
   * Emit an interaction event. Called by the renderer. Falls through to
   * Contract.onInteract if set; otherwise no-ops (G1 greybox: log only).
   */
  Contract.emitInteract = function (name) {
    const d = Contract.interactables.get(name);
    if (!d || !d.enabled) return;
    if (typeof Contract.onInteract === 'function') {
      Contract.onInteract(name, d);
    }
  };

  window.OpenStars.Contract = Contract;
})();
