/**
 * Open Stars — P1 greybox bridge (renderer-owned).
 * Builds the low-poly bridge and registers the scene/interaction contract.
 * No gameplay logic lives here.
 */
window.OpenStars = window.OpenStars || {};

(function () {
  'use strict';

  const Contract = window.OpenStars.Contract;

  /** Create a StandardMaterial from a hex color. */
  function std(app, hex, opts) {
    opts = opts || {};
    const m = new pc.StandardMaterial();
    m.diffuse = new pc.Color().fromString(hex);
    m.metalness = opts.metalness != null ? opts.metalness : 0.25;
    m.gloss = opts.gloss != null ? opts.gloss : 0.5;
    if (opts.emissive) {
      m.emissive = new pc.Color().fromString(opts.emissive);
      m.emissiveIntensity = opts.emissiveIntensity != null ? opts.emissiveIntensity : 1.0;
    }
    if (opts.useLighting === false) m.useLighting = false;
    m.update();
    return m;
  }

  /** Add a box entity with a render component. Returns the entity. */
  function box(app, parent, name, sx, sy, sz, x, y, z, mat, collider) {
    const e = new pc.Entity(name);
    const mesh = pc.Mesh.fromGeometry(app.graphicsDevice,
      new pc.BoxGeometry({ halfExtents: new pc.Vec3(sx, sy, sz) }));
    e.addComponent('render', { meshInstances: [new pc.MeshInstance(mesh, mat)] });
    e.setLocalPosition(x, y, z);
    parent.addChild(e);
    if (collider) {
      collider.list.push({
        name: name,
        min: new pc.Vec3(x - sx, y - sy, z - sz),
        max: new pc.Vec3(x + sx, y + sy, z + sz),
      });
    }
    return e;
  }

  /** Add a cylinder (body) entity. */
  function cylinder(app, parent, name, radius, height, x, y, z, mat) {
    const e = new pc.Entity(name);
    const mesh = pc.Mesh.fromGeometry(app.graphicsDevice,
      new pc.CylinderGeometry({ radius: radius, height: height, capSegments: 14 }));
    e.addComponent('render', { meshInstances: [new pc.MeshInstance(mesh, mat)] });
    e.setLocalPosition(x, y, z);
    parent.addChild(e);
    return e;
  }

  /** Add a sphere (head) entity. */
  function sphere(app, parent, name, radius, x, y, z, mat) {
    const e = new pc.Entity(name);
    const mesh = pc.Mesh.fromGeometry(app.graphicsDevice,
      new pc.SphereGeometry({ radius: radius, latitudeBands: 12, longitudeBands: 12 }));
    e.addComponent('render', { meshInstances: [new pc.MeshInstance(mesh, mat)] });
    e.setLocalPosition(x, y, z);
    parent.addChild(e);
    return e;
  }

  /**
   * Build the console: pedestal + tilted desk panel + emissive accent strip.
   * Returns { entity, accent, aabb }.
   */
  function buildConsole(app, root, name, x, z, accentHex, collider) {
    const holder = new pc.Entity(name);
    holder.setLocalPosition(x, 0, z);
    root.addChild(holder);

    const matPed = std(app, '#222630', { metalness: 0.35, gloss: 0.5 });
    const matPanel = std(app, '#2b313d', { metalness: 0.3, gloss: 0.6 });
    const accentMat = std(app, '#11141b', { emissive: accentHex, emissiveIntensity: 0.9 });

    box(app, holder, name + '/pedestal', 0.8, 0.5, 0.45, 0, 0.5, 0, matPed, false);
    // Tilted desk panel, local to holder.
    const panel = box(app, holder, name + '/panel', 0.95, 0.06, 0.6, 0, 1.02, 0.18, matPanel, false);
    panel.setEulerAngles(-24, 0, 0);
    // Accent strip on the panel's top edge.
    const accent = box(app, holder, name + '/accent', 0.92, 0.035, 0.08, 0, 1.2, 0.42, accentMat, false);
    // P3: sloped hooded display inside the console body — no floating overhang.
    const hood = box(app, holder, name + '/hood', 0.88, 0.04, 0.30, 0, 1.06, 0.34, matPed, false);
    hood.setEulerAngles(-48, 0, 0);
    const cheekL = box(app, holder, name + '/hood-cheek-l', 0.03, 0.22, 0.22, -0.87, 1.08, 0.34, matPanel, false);
    cheekL.setEulerAngles(-48, 0, 0);
    const cheekR = box(app, holder, name + '/hood-cheek-r', 0.03, 0.22, 0.22, 0.87, 1.08, 0.34, matPanel, false);
    cheekR.setEulerAngles(-48, 0, 0);

    // AABB covers pedestal + tilted panel + accent, in holder (world) space.
    const aabb = {
      min: new pc.Vec3(x - 0.95, 0.05, z - 0.75),
      max: new pc.Vec3(x + 0.95, 1.35, z + 0.8),
    };
    collider.list.push({ name: name, min: aabb.min.clone(), max: aabb.max.clone() });

    return { entity: holder, accent: accentMat, aabb: aabb };
  }

  /** Build a crew placeholder: division yoke + tunic figure + role-specific silhouette prop. */
  function buildCrew(app, root, id, meta, x, z, yaw, accentHex, collider) {
    const holder = new pc.Entity(id);
    holder.setLocalPosition(x, 0, z);
    holder.setEulerAngles(0, yaw, 0);
    root.addChild(holder);

    const tunicMat = std(app, '#1b1e26', { metalness: 0.2, gloss: 0.4 });
    const accentMat = std(app, '#14161c', { emissive: accentHex, emissiveIntensity: 0.8 });
    const headMat = std(app, '#d8b48a', { metalness: 0.0, gloss: 0.4 });
    const yokeMat = std(app, accentHex, { metalness: 0.3, gloss: 0.5 });

    cylinder(app, holder, id + '/legs', 0.24, 0.75, 0, 0.375, 0, tunicMat);
    cylinder(app, holder, id + '/torso', 0.34, 0.75, 0, 1.0, 0, tunicMat);
    sphere(app, holder, id + '/head', 0.23, 0, 1.62, 0, headMat);

    // Division yoke + wide angled shoulder pads (locked P3 silhouette).
    box(app, holder, id + '/shoulder-yoke', 0.34, 0.06, 0.12, 0, 1.3, 0, yokeMat, false);
    box(app, holder, id + '/pad-l', 0.1, 0.06, 0.18, -0.36, 1.3, 0, yokeMat, false);
    box(app, holder, id + '/pad-r', 0.1, 0.06, 0.18, 0.36, 1.3, 0, yokeMat, false);

    // Role-specific silhouette props (readable at walking distance).
    if (meta.role === 'Helm') {
      // Wrap-around gold visor band across the face + angled flight-collar trim.
      box(app, holder, id + '/visor', 0.13, 0.015, 0.02, 0, 1.62, 0.2, accentMat, false);
      box(app, holder, id + '/collar', 0.12, 0.03, 0.06, 0, 1.44, 0, accentMat, false);
    } else if (meta.role === 'Science') {
      // Asymmetric over-shoulder sensor pack + tricorder sling + tilted data slate.
      box(app, holder, id + '/sensor-pack', 0.12, 0.12, 0.12, 0.32, 1.28, 0.08, accentMat, false);
      box(app, holder, id + '/tricorder', 0.045, 0.08, 0.025, 0.22, 1.5, 0.12, accentMat, false);
      const slate = box(app, holder, id + '/data-slate', 0.11, 0.14, 0.012, 0.3, 1.26, 0.1, accentMat, false);
      slate.setEulerAngles(0.35, 0.2, 0);
      box(app, holder, id + '/slate-screen', 0.09, 0.11, 0.005, 0.3, 1.26, 0.1, accentMat, false);
      slate.setLocalEulerAngles(0.35, 0.2, 0);
    } else if (meta.role === 'Engineering') {
      // Broad utility harness / vest silhouette + diagnostic array on hip + forearm.
      box(app, holder, id + '/harness', 0.36, 0.08, 0.16, 0, 1.0, 0, accentMat, false);
      box(app, holder, id + '/diag-hip', 0.06, 0.06, 0.2, 0, 0.6, 0, accentMat, false);
      box(app, holder, id + '/diag-arm', 0.06, 0.22, 0.06, 0.42, 0.95, 0, accentMat, false);
    }

    // Collider approximates the standing figure (axis-aligned).
    const aabb = {
      min: new pc.Vec3(x - 0.42, 0.05, z - 0.42),
      max: new pc.Vec3(x + 0.42, 1.85, z + 0.42),
    };
    collider.list.push({ name: id, min: aabb.min.clone(), max: aabb.max.clone() });

    return { entity: holder, aabb: aabb };
  }

  /**
   * Build the full bridge scene. Returns state consumed by the player/renderer:
   *   { colliders: [aabb...], labels: [{id, pos}], consoleAccents: {name->material} }
   */
  function buildScene(app) {
    Contract._app = app;
    const device = app.graphicsDevice;
    const colliders = [];
    const root = new pc.Entity(Contract.ENTITIES.ROOT);
    app.root.addChild(root);

    const bridge = new pc.Entity(Contract.ENTITIES.BRIDGE);
    root.addChild(bridge);

    // Materials — locked P3 warm/cool bridge palette (docs/G2-style.md).
    const matFloor = std(app, '#262932', { metalness: 0.2, gloss: 0.85 });
    const matWall = std(app, '#3b3d46', { metalness: 0.15, gloss: 0.7 });
    const matCeil = std(app, '#222630', { metalness: 0.1, gloss: 0.8 });
    const matTrim = std(app, '#222630', { metalness: 0.4, gloss: 0.6 });
    const matChair = std(app, '#5e2f34', { metalness: 0.3, gloss: 0.5 });
    const matChairDark = std(app, '#353036', { metalness: 0.3, gloss: 0.5 });

    // Room dimensions: 16 (X) x 4 (Y) x 12 (Z), centered at origin.
    box(app, bridge, Contract.ENTITIES.FLOOR, 8, 0.15, 6, 0, -0.15, 0, matFloor, false);
    box(app, bridge, Contract.ENTITIES.CEILING, 8, 0.15, 6, 0, 4.15, 0, matCeil, false);

    // Central command well carpet pad (locked P3 palette, under chair & approach lane).
    const matCarpet = std(app, '#462c33', { metalness: 0.1, gloss: 0.9 });
    box(app, bridge, 'bridge/command-carpet', 3.2, 0.005, 1.5, 0, 0.005, 0.2, matCarpet, false);

    // Walls (axis-aligned colliders keep the player inside).
    box(app, bridge, Contract.ENTITIES.FRONT_WALL, 8, 2.1, 0.25, 0, 2.1, -6.15, matWall, { list: colliders });
    box(app, bridge, Contract.ENTITIES.BACK_WALL, 8, 2.1, 0.25, 0, 2.1, 6.15, matWall, { list: colliders });
    box(app, bridge, Contract.ENTITIES.LEFT_WALL, 0.25, 2.1, 6, -8.15, 2.1, 0, matWall, { list: colliders });
    box(app, bridge, Contract.ENTITIES.RIGHT_WALL, 0.25, 2.1, 6, 8.15, 2.1, 0, matWall, { list: colliders });

    // Ceiling light coves + overhead perimeter soffit band (emissive, non-colliding).
    const stripMat = std(app, '#14161c', { emissive: '#dbe7ff', emissiveIntensity: 0.85 });
    box(app, bridge, 'bridge/light-strip/cove/port', 1.1, 0.03, 0.35, -2.6, 3.92, 0, stripMat, false);
    box(app, bridge, 'bridge/light-strip/cove/stbd', 1.1, 0.03, 0.35, 2.6, 3.92, 0, stripMat, false);
    box(app, bridge, 'bridge/light-strip/perimeter', 8, 0.02, 0.3, 0, 3.9, -5.6, stripMat, false);

    // P3: bridge architectural framing — bulkhead ribs + ceiling arch (visual only).
    box(app, bridge, 'bridge/rib/port-n', 0.05, 2.0, 0.05, -7.88, 2.0, -4.0, matTrim, false);
    box(app, bridge, 'bridge/rib/port-f', 0.05, 2.0, 0.05, -7.88, 2.0, -1.5, matTrim, false);
    box(app, bridge, 'bridge/rib/port-b', 0.05, 2.0, 0.05, -7.88, 2.0, 1.5, matTrim, false);
    box(app, bridge, 'bridge/rib/port-aft', 0.05, 2.0, 0.05, -7.88, 2.0, 4.0, matTrim, false);
    box(app, bridge, 'bridge/rib/stbd-n', 0.05, 2.0, 0.05, 7.88, 2.0, -4.0, matTrim, false);
    box(app, bridge, 'bridge/rib/stbd-f', 0.05, 2.0, 0.05, 7.88, 2.0, -1.5, matTrim, false);
    box(app, bridge, 'bridge/rib/stbd-b', 0.05, 2.0, 0.05, 7.88, 2.0, 1.5, matTrim, false);
    box(app, bridge, 'bridge/rib/stbd-aft', 0.05, 2.0, 0.05, 7.88, 2.0, 4.0, matTrim, false);
    box(app, bridge, 'bridge/arch', 4.0, 0.05, 0.25, 0, 3.85, -1.5, matTrim, false);

    // Viewscreen: dim emissive backing + thin metallic bezel frame (no neon slab halo).
    const screenMat = std(app, '#0b1018', { emissive: '#162c4a', emissiveIntensity: 0.65 });
    box(app, bridge, Contract.ENTITIES.VIEWSCREEN, 5.175, 1.675, 0.06, 0, 2.1, -5.95, screenMat, false);
    const frameDepth = 0.05, frameZ = -5.88; // frame front face flush with screen front (-5.83)
    box(app, bridge, 'bridge/viewscreen/frame/top', 5.2, 0.0375, 0.05, 0, 3.8125, frameZ, matTrim, false);
    box(app, bridge, 'bridge/viewscreen/frame/bottom', 5.2, 0.0375, 0.05, 0, 0.3875, frameZ, matTrim, false);
    box(app, bridge, 'bridge/viewscreen/frame/left', 0.0375, 1.7125, 0.05, -5.2125, 2.1, frameZ, matTrim, false);
    box(app, bridge, 'bridge/viewscreen/frame/right', 0.0375, 1.7125, 0.05, 5.2125, 2.1, frameZ, matTrim, false);

    // Captain chair (center, slightly aft).
    const chair = new pc.Entity(Contract.ENTITIES.CAPTAIN_CHAIR);
    chair.setLocalPosition(0, 0, 1.6);
    bridge.addChild(chair);
    box(app, chair, 'bridge/captain-chair/base', 0.55, 0.06, 0.55, 0, 0.06, 0, matChairDark, false);
    cylinder(app, chair, 'bridge/captain-chair/pedestal', 0.13, 0.42, 0, 0.3, 0, matChairDark);
    box(app, chair, 'bridge/captain-chair/seat', 0.55, 0.12, 0.5, 0, 0.58, 0, matChair, false);
    box(app, chair, 'bridge/captain-chair/back', 0.55, 0.85, 0.12, 0, 1.05, -0.28, matChair, false);
    box(app, chair, 'bridge/captain-chair/arm-left', 0.08, 0.1, 0.45, -0.5, 0.62, -0.05, matChairDark, false);
    box(app, chair, 'bridge/captain-chair/arm-right', 0.08, 0.1, 0.45, 0.5, 0.62, -0.05, matChairDark, false);
    colliders.push({
      name: Contract.ENTITIES.CAPTAIN_CHAIR,
      min: new pc.Vec3(0 - 0.6, 0.05, 1.6 - 0.6),
      max: new pc.Vec3(0 + 0.6, 1.9, 1.6 + 0.6),
    });

    // Consoles: helm (front-left), science (left), engineering (right), comms (front-right).
    const consoleAccents = {};
    const helm = buildConsole(app, bridge, Contract.ENTITIES.CONSOLE_HELM, -3.4, -3.9, '#f0a83e', { list: colliders });
    const science = buildConsole(app, bridge, Contract.ENTITIES.CONSOLE_SCIENCE, -6.0, -0.5, '#4da3ff', { list: colliders });
    const engineering = buildConsole(app, bridge, Contract.ENTITIES.CONSOLE_ENGINEERING, 6.0, -0.5, '#ee6445', { list: colliders });
    const comms = buildConsole(app, bridge, Contract.ENTITIES.CONSOLE_COMMS, 3.4, -3.9, '#3ad896', { list: colliders });
    consoleAccents[Contract.ENTITIES.CONSOLE_HELM] = helm.accent;
    consoleAccents[Contract.ENTITIES.CONSOLE_SCIENCE] = science.accent;
    consoleAccents[Contract.ENTITIES.CONSOLE_ENGINEERING] = engineering.accent;
    consoleAccents[Contract.ENTITIES.CONSOLE_COMMS] = comms.accent;

    // Register console interactables.
    Contract.registerInteractable(Contract.ENTITIES.CONSOLE_HELM, helm.entity,
      { label: 'Helm Console', prompt: 'Take the helm', aabb: helm.aabb, accent: helm.accent, setHovered: (h) => setAccentHover(app, helm.accent, h) });
    Contract.registerInteractable(Contract.ENTITIES.CONSOLE_SCIENCE, science.entity,
      { label: 'Science Console', prompt: 'Run a scan', aabb: science.aabb, accent: science.accent, setHovered: (h) => setAccentHover(app, science.accent, h) });
    Contract.registerInteractable(Contract.ENTITIES.CONSOLE_ENGINEERING, engineering.entity,
      { label: 'Engineering Console', prompt: 'Allocate power', aabb: engineering.aabb, accent: engineering.accent, setHovered: (h) => setAccentHover(app, engineering.accent, h) });
    Contract.registerInteractable(Contract.ENTITIES.CONSOLE_COMMS, comms.entity,
      { label: 'Communications Console', prompt: 'Open a channel', aabb: comms.aabb, accent: comms.accent, setHovered: (h) => setAccentHover(app, comms.accent, h) });

    // Crew placeholders + labels + interactables.
    const labels = [];
    const crew = [
      // Mara (helm) stands beside the helm console (port side) so the console's
      // room-side face stays approachable (D4 fix).
      { id: Contract.ENTITIES.CREW_MARA, meta: Contract.CREW[Contract.ENTITIES.CREW_MARA], x: -4.9, z: -3.1, yaw: -1.0, accent: '#f0a83e' },
      { id: Contract.ENTITIES.CREW_IVO, meta: Contract.CREW[Contract.ENTITIES.CREW_IVO], x: -5.2, z: 0.6, yaw: 0.4, accent: '#4da3ff' },
      { id: Contract.ENTITIES.CREW_TESSA, meta: Contract.CREW[Contract.ENTITIES.CREW_TESSA], x: 5.2, z: 0.6, yaw: -0.4, accent: '#ee6445' },
    ];
    crew.forEach((c) => {
      const built = buildCrew(app, bridge, c.id, c.meta, c.x, c.z, c.yaw, c.accent, { list: colliders });
      labels.push({ id: c.id, pos: new pc.Vec3(c.x, 2.05, c.z) });
      Contract.registerInteractable(c.id, built.entity,
        { label: c.meta.name, prompt: 'Speak', aabb: built.aabb, accent: c.accent });
    });

    // Lighting — locked P3 warm/cool balance.
    app.scene.ambientLight = new pc.Color(0.28, 0.31, 0.38);

    const keyLight = new pc.Entity('light/key');
    keyLight.addComponent('light', {
      type: 'directional',
      color: new pc.Color(1.0, 0.95, 0.88),
      intensity: 1.15,
      castShadows: false,
    });
    keyLight.setPosition(0, 6, 4);
    keyLight.lookAt(0, 0, 0);
    root.addChild(keyLight);

    const fillLight = new pc.Entity('light/fill');
    fillLight.addComponent('light', {
      type: 'directional',
      color: new pc.Color(0.38, 0.55, 0.85),
      intensity: 0.55,
      castShadows: false,
    });
    fillLight.setPosition(0, 2.5, -5.0);
    fillLight.lookAt(0, 1.2, 2.0);
    root.addChild(fillLight);

    const commandLight = new pc.Entity('light/command');
    commandLight.addComponent('light', {
      type: 'omni',
      color: new pc.Color(1.0, 0.82, 0.62),
      intensity: 0.85,
      range: 9,
    });
    commandLight.setPosition(0, 3.6, 1.2);
    root.addChild(commandLight);

    return { colliders: colliders, labels: labels, consoleAccents: consoleAccents };
  }

  /** Pulse an accent material's emissive on hover (renderer-only feedback). */
  function setAccentHover(app, mat, hovered) {
    mat.emissiveIntensity = hovered ? 2.4 : 0.9;
    mat.update();
  }

  window.OpenStars.buildScene = buildScene;
  window.OpenStars.buildSceneHelpers = { std, box, cylinder, sphere };
})();
