/* Renderer-owned focus and accessible action presentation. No encounter rules. */
(function () {
  'use strict';
  function createBridgePresenter({ player, canvas, displays, getGame }) {
    const byId = id => document.getElementById(id);
    const ui = Object.fromEntries(['start','start-title','start-sub','start-btn','capture-status',
      'restart','pause-button','panel','panel-title','panel-text','panel-source','panel-flavour',
      'panel-actions','panel-close','mission-accessible','crosshair','interact','labels'].map(id => [id,byId(id)]));
    let mode = 'entry', current = null, panelId = null, actionKey = '', requestId = 0;
    let pendingLock = false, disposed = false;
    player.setInputEnabled(false);

    function gate(message) {
      ui.start.hidden = false;
      ui['start-title'].textContent = mode === 'entry' ? 'OPEN STARS' : 'BRIDGE PAUSED';
      ui['start-sub'].textContent = mode === 'entry' ? 'A Light in the Static' : 'Click to return to the bridge.';
      ui['start-btn'].textContent = mode === 'entry' ? 'ENTER BRIDGE' : 'RETURN TO BRIDGE';
      ui.restart.hidden = mode === 'entry';
      ui['capture-status'].textContent = message || '';
      ui['start-btn'].disabled = pendingLock;
      ui.labels.hidden = true;
    }

    function release() {
      player.setInputEnabled(false);
      ui.crosshair.style.opacity = '0'; ui.interact.style.opacity = '0';
      player.unlock();
    }

    function pause(reason) {
      if (disposed) return;
      pendingLock = false; requestId++;
      mode = 'paused'; // Set intent before release/publish; do not erase dialogue on intentional release.
      release();
      getGame()?.suspend();
      gate(reason || 'Paused. Reading and walking spend no encounter time.');
      ui['start-btn'].focus();
    }

    function lockFailed(ticket, detail) {
      if (ticket !== requestId || disposed || mode !== 'requesting') return;
      pendingLock = false; mode = 'blocked';
      release();
      gate('Mouse capture unavailable' + (detail ? ': ' + detail : '.') +
        ' Walking requires pointer lock. Use a browser/window that permits it, then click RETURN TO BRIDGE.');
    }

    function enter(event) {
      if (!event.isTrusted || pendingLock || panelId || disposed) return;
      mode = 'requesting'; pendingLock = true;
      const ticket = ++requestId;
      gate('Requesting mouse capture…');
      try {
        const result = player.lock(); // Only called from this trusted click; never present()/async completion.
        if (result?.catch) result.catch(error => lockFailed(ticket, error.name || 'request rejected'));
        setTimeout(() => lockFailed(ticket, 'request did not acquire pointer lock'), 700);
      } catch (error) { lockFailed(ticket, error.name || error.message); }
    }

    function onLockChange() {
      if (player.isLocked()) {
        if (mode !== 'requesting' || panelId || !pendingLock) { release(); return; }
        pendingLock = false; mode = 'walking';
        player.setInputEnabled(true);
        ui.start.hidden = true; ui.crosshair.style.opacity = '1';
        ui['capture-status'].textContent = '';
        ui.labels.hidden = false;
      } else if (mode === 'walking') {
        pause('Mouse released. Click RETURN TO BRIDGE to continue.');
      }
      // In panel mode capture was intentionally released: keep canonical dialogue/actions.
    }

    function present(view) {
      if (disposed) return;
      const priorPanel = panelId;
      const restarted = current && current.state.run !== view.state.run;
      current = view;
      displays.present(view);
      ui['mission-accessible'].textContent = `${view.objective} Time ${view.state.time}/8. Energy ${view.state.power}/100. Hull ${view.state.hull}/100.`;
      panelId = view.focusRequested && view.panel ? view.panel.id : null;
      if (restarted) {
        mode = 'reentry'; pendingLock = false; requestId++;
        release();
        player.setPreset(new pc.Vec3(0,1.7,4.8),new pc.Vec3(0,1.68,3.8));
      }
      ui.panel.hidden = !panelId;
      if (panelId) {
        const opened = !priorPanel;
        if (opened) {
          mode = 'panel'; pendingLock = false; requestId++;
          release(); // Exactly once on opening, never again on optional dialogue updates.
          ui.start.hidden = true;
        }
        ui.labels.hidden = true;
        const entry = OpenStars.Contract.interactables.get(panelId);
        const accent = entry?.accent || OpenStars.Contract.CREW[panelId]?.accent || '#7fa3d8';
        ui.panel.style.borderColor = accent;
        ui['panel-title'].style.color = accent;
        ui.panel.style.setProperty('--panel-accent', accent);
        ui['panel-flavour'].style.borderLeftColor = OpenStars.Contract.CREW[panelId]?.accent || accent;
        ui['panel-title'].textContent = entry?.label || 'Bridge';
        ui['panel-text'].textContent = view.panel.text || '';
        const optional = view.panel.flavour || '';
        ui['panel-flavour'].textContent = typeof optional === 'string' ? optional : '';
        ui['panel-flavour'].hidden = !ui['panel-flavour'].textContent;
        ui['panel-source'].textContent = view.pending
          ? 'Canonical advice available. Optional crew reaction pending…'
          : view.panel.source === 'fallback'
            ? 'Fallback — offline crew reaction below (' + (view.panel.reason || 'offline') + '). No AI-generated response.'
            : view.panel.source?.startsWith('live')
              ? 'AI crew assessment below — optional, may be inaccurate. Ship briefing and station actions remain authoritative.'
              : 'Canonical bridge information.';
        const key = JSON.stringify([panelId,view.actions]);
        if (key !== actionKey) {
          actionKey = key;
          ui['panel-actions'].replaceChildren(...view.actions.map(({action,label}) => {
            const button = document.createElement('button'); button.textContent = label;
            const id = panelId;
            button.addEventListener('click', () => {
              if (panelId === id && current.actions.some(a => a.action === action)) getGame().act(id,action);
            });
            return button;
          }));
        }
        if (opened) ui['panel-close'].focus();
      } else {
        actionKey = ''; ui['panel-actions'].replaceChildren();
        if (priorPanel && mode === 'panel') mode = 'reentry';
        if (mode !== 'walking' && mode !== 'requesting') gate();
        if (mode === 'walking') ui.labels.hidden = false;
        if (priorPanel || restarted) ui['start-btn'].focus();
      }
    }

    function onKey(event) {
      if (event.code === 'Escape') { event.preventDefault(); pause(); }
      if (event.key === 'Tab' && panelId) {
        const controls = [...ui.panel.querySelectorAll('button:not([disabled])')];
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && (document.activeElement === first || !ui.panel.contains(document.activeElement))) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !ui.panel.contains(document.activeElement))) {
          event.preventDefault(); first.focus();
        }
      }
    }
    const blur = () => pause('Window lost focus. Pending dialogue cancelled.');
    const hidden = () => { if (document.hidden) blur(); };
    ui['start-btn'].addEventListener('click', enter);
    ui['panel-close'].addEventListener('click', () => getGame().close());
    ui.restart.addEventListener('click', () => getGame().restart());
    ui['pause-button'].addEventListener('click', () => pause());
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerlockchange', onLockChange);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', hidden);
    return { present, getMode: () => mode, pause,
      dispose() {
        disposed = true; release(); getGame()?.dispose();
        document.removeEventListener('keydown',onKey,true);
        document.removeEventListener('pointerlockchange',onLockChange);
        window.removeEventListener('blur',blur);
        document.removeEventListener('visibilitychange',hidden);
      },
    };
  }
  OpenStars.createBridgePresenter = createBridgePresenter;
})();
