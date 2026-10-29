/**
 * Open Stars — bridge bootstrap and P2 assembly.
 * Owns: app boot, resolution gate (1280x720 fixed buffer), overlay UI, and the
 * debug camera presets used for evidence screenshots. Delegates scene build to
 * scene.js and camera/movement to player.js.
 */
window.OpenStars = window.OpenStars || {};

(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const camPreset = params.get('cam') || null;

  const canvas = document.getElementById('app');

  const app = new pc.Application(canvas, {
    graphicsDeviceOptions: { alpha: false, antialias: false, preserveDrawingBuffer: true },
    devtools: false,
  });

  // --- Resolution gate: fixed 1280x720 drawing buffer, independent of DPR. --
  app.graphicsDevice.maxPixelRatio = 1;
  app.setCanvasResolution(pc.RESOLUTION_FIXED, 1280, 720);
  app.setCanvasFillMode(pc.FILLMODE_KEEP_ASPECT);
  app.scene.gammaCorrection = pc.GAMMA_SRGB;

  // --- Scene + player ------------------------------------------------------
  const scene = window.OpenStars.buildScene(app);
  const player = window.OpenStars.createPlayer(app, scene.colliders);

  // --- Overlay UI ----------------------------------------------------------
  const els = {
    start: document.getElementById('start'),
    startBtn: document.getElementById('start-btn'),
    crosshair: document.getElementById('crosshair'),
    hud: document.getElementById('hud'),
    interact: document.getElementById('interact'),
    labels: document.getElementById('labels'),
  };

  // Crew name labels (screen-space HTML, projected each frame).
  const labelEls = new Map();
  scene.labels.forEach((l) => {
    const meta = window.OpenStars.Contract.CREW[l.id];
    const div = document.createElement('div');
    div.className = 'crew-label';
    div.style.borderColor = meta.accent;
    div.innerHTML =
      '<div style="color:' + meta.accent + '">' + meta.name + '</div>' +
      '<div class="role">' + meta.role + '</div>';
    div.querySelector('.role').style.color = meta.accent;
    els.labels.appendChild(div);
    labelEls.set(l.id, { div: div, pos: l.pos });
  });

  // --- Debug camera presets (deterministic screenshots) --------------------
  const presets = {
    overview:   { pos: new pc.Vec3(0, 2.9, 5.6), target: new pc.Vec3(0, 0.8, -2.0) },
    viewscreen: { pos: new pc.Vec3(0, 2.05, 3.2), target: new pc.Vec3(0, 2.1, -5.9) },
    consoles:   { pos: new pc.Vec3(0, 1.7, 0.6), target: new pc.Vec3(0, 0.9, -3.9) },
    crew:       { pos: new pc.Vec3(-2.0, 1.7, -1.8), target: new pc.Vec3(-4.9, 1.5, -3.1) },
    helm:       { pos: new pc.Vec3(-3.4, 1.7, -2.3), target: new pc.Vec3(-3.4, 1.0, -3.9) },
    comms:      { pos: new pc.Vec3(3.4, 1.7, -2.6), target: new pc.Vec3(3.4, 1.2, -3.9) },
  };

  // Performance diagnostics are opt-in, never a permanent mission HUD.
  const debugHud = params.get('debug') === '1';
  els.hud.hidden = !debugHud;

  if (camPreset && presets[camPreset]) {
    const p = presets[camPreset];
    player.setPreset(p.pos, p.target);
  }

  // --- FPS tracking --------------------------------------------------------
  let frameTimes = [];
  let hudAccum = 0;

  function fpsText() {
    if (frameTimes.length < 2) return '… fps';
    let sum = 0;
    for (const t of frameTimes) sum += t;
    const avg = sum / frameTimes.length;
    return (1000 / avg).toFixed(1) + ' fps';
  }

  function updateHud(dt) {
    if (!debugHud) return;
    hudAccum += dt;
    if (hudAccum < 0.5) return;
    hudAccum = 0;
    const gd = app.graphicsDevice;
    els.hud.textContent =
      'buffer ' + gd.width + '×' + gd.height +
      '  canvas ' + canvas.width + '×' + canvas.height +
      '  dpr ' + (window.devicePixelRatio || 1) + '\n' +
      fpsText() + '  (' + frameTimes.length + ' frames)';
  }

  function updateLabels() {
    const camPos = player.camera.getPosition();
    const fwd = player.getForward();
    const rect = canvas.getBoundingClientRect();
    const tmp = new pc.Vec3();
    const s = new pc.Vec3();
    labelEls.forEach((l) => {
      // Reject points behind the camera (dot with forward <= 0).
      tmp.sub2(l.pos, camPos);
      if (tmp.dot(fwd) <= 0) { l.div.style.display = 'none'; return; }
      // CameraComponent.worldToScreen returns CSS-px coords relative to canvas top-left.
      player.camera.camera.worldToScreen(l.pos, s);
      l.div.style.display = 'block';
      l.div.style.left = (rect.left + s.x) + 'px';
      l.div.style.top = (rect.top + s.y) + 'px';
    });
  }

  function updateInteractPrompt() {
    const d = player.getHovered();
    if (d && d.enabled && player.isLocked() && presenter?.getMode() === 'walking') {
      els.interact.textContent = d.label + ' — [E] ' + d.prompt;
      els.interact.style.opacity = '1';
    } else els.interact.style.opacity = '0';
  }

  // Data owns encounter rules; renderer owns physical display/focus presentation.
  let game = null, presenter = null;
  window.OpenStars.app = app;
  window.OpenStars.player = player;
  try {
    if (window.OpenStars.Contract.interactables.size !== 7) throw new Error('Seven bridge interactables required');
    const displays = OpenStars.createDisplays(app);
    presenter = OpenStars.createBridgePresenter({ player, canvas, displays, getGame: () => game });
    let storage = null;
    try { storage = window.localStorage; } catch { /* Optional checkpoints never block play. */ }
    game = OpenStars.Gameplay.createGame({
      contract: OpenStars.Contract,
      present: view => presenter.present(view),
      dialogue: OpenStars.Gameplay.httpDialogue(window.fetch.bind(window), 'http://127.0.0.1:8124/api/dialogue'),
      storage,
    });
    window.OpenStars.game = game;
    window.OpenStars.presenter = presenter;
  } catch (error) {
    player.setInputEnabled(false);
    els.start.hidden = false;
    document.getElementById('start-title').textContent = 'BRIDGE UNAVAILABLE';
    document.getElementById('capture-status').textContent = 'Systems could not start: ' + error.message;
    els.startBtn.disabled = true;
    console.error('[openstars] P2 bootstrap failed', error);
  }

  // --- Main loop -----------------------------------------------------------
  app.on('update', (dt) => {
    player.update(dt);
    frameTimes.push(dt * 1000);
    if (frameTimes.length > 120) frameTimes.shift();
    updateHud(dt);
    updateLabels();
    updateInteractPrompt();
  });

  app.start();

  // --- Evidence log --------------------------------------------------------
  try {
    const gl = app.graphicsDevice.gl;
    const renderer = gl.getParameter(gl.RENDERER);
    const vendor = gl.getParameter(gl.VENDOR);
    console.log('[openstars] drawing buffer:', app.graphicsDevice.width + 'x' + app.graphicsDevice.height);
    console.log('[openstars] canvas:', canvas.width + 'x' + canvas.height);
    console.log('[openstars] devicePixelRatio:', window.devicePixelRatio || 1);
    console.log('[openstars] GPU renderer:', renderer);
    console.log('[openstars] GPU vendor:', vendor);
    console.log('[openstars] user agent:', navigator.userAgent);
    console.log('[openstars] playcanvas:', pc.version || 'unknown');
    console.log('[openstars] contract version:', window.OpenStars.Contract.version);
    console.log('[openstars] interactables:', Array.from(window.OpenStars.Contract.interactables.keys()).join(', '));
  } catch (err) {
    console.log('[openstars] evidence log error:', err && err.message);
  }

  window.OpenStars.app = app;
  window.OpenStars.player = player;
})();
