/* Renderer-owned physical text surfaces. Gameplay supplies detached snapshots. */
(function () {
  'use strict';
  function createDisplays(app) {
    const C = OpenStars.Contract;
    const surfaces = new Map();

    function hexRgb(hex) {
      const n = parseInt(hex.replace('#', ''), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    function surface(id, parent, width, height, pos, angles, color, pixels) {
      const canvas = document.createElement('canvas');
      canvas.width = pixels[0]; canvas.height = pixels[1];
      const texture = new pc.Texture(app.graphicsDevice, {
        name: id + '/text', width: canvas.width, height: canvas.height,
        mipmaps: false, minFilter: pc.FILTER_LINEAR, magFilter: pc.FILTER_LINEAR,
        addressU: pc.ADDRESS_CLAMP_TO_EDGE, addressV: pc.ADDRESS_CLAMP_TO_EDGE,
      });
      const material = new pc.StandardMaterial();
      material.diffuse = new pc.Color(0, 0, 0);
      material.emissive = new pc.Color(1, 1, 1);
      material.emissiveMap = texture;
      material.useLighting = false;
      material.cull = pc.CULLFACE_NONE;
      material.update();
      const mesh = new pc.Mesh(app.graphicsDevice);
      const w = width / 2, h = height / 2;
      mesh.setPositions([-w,-h,0, w,-h,0, w,h,0, -w,h,0]);
      mesh.setNormals([0,0,1, 0,0,1, 0,0,1, 0,0,1]);
      mesh.setUvs(0, [0,1, 1,1, 1,0, 0,0]);
      mesh.setIndices([0,1,2, 0,2,3]); mesh.update(pc.PRIMITIVE_TRIANGLES);
      const entity = new pc.Entity(id + '/content');
      entity.addComponent('render', { meshInstances: [new pc.MeshInstance(mesh, material)] });
      entity.setLocalPosition(...pos); entity.setLocalEulerAngles(...angles);
      parent.addChild(entity);
      surfaces.set(id, { canvas, texture, color, last: null, phase: 'incoming', outcome: null });
    }

    // A small offset prevents z fighting; existing slabs, colliders and IDs stay put.
    // P3: forward viewscreen content now matches the physical 10.35 x 3.35 m bezel.
    surface('bridge/viewscreen', C.entity('bridge'), 10.35, 3.35,
      [0, 2.1, -5.815], [0, 0, 0], '#7fb0ff', [1536, 486]);
    // P3: consoles get an angled (-48 deg) hooded display inside the existing AABBs.
    for (const id of ['consoles/helm','consoles/science','consoles/engineering','consoles/comms']) {
      const colors = { helm:'#f0a83e', science:'#4da3ff', engineering:'#ee6445', comms:'#3ad896' };
      surface(id, C.entity(id), 1.68, 0.52,
        [0, 1.08, 0.36], [-48, 0, 0], colors[id.split('/')[1]], [1024, 400]);
    }

    function hexToRgba(hex, a) {
      const rgb = hexRgb(hex);
      return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
    }

    /** Structured 3-zone tactical display: header bar, directive + gauges, footer strip. */
    function drawViewscreen(ctx, w, h, s, lines) {
      const phase = s.phase || 'incoming';
      const isDebrief = phase === 'debrief';
      const accent = isDebrief ? '#3ad896' : '#f0a83e';
      const title = lines[0] || '';
      const objective = lines[1] || '';
      const prep = lines[3] || '';
      const action = lines[4] || '';

      // Zone 1 — top header bar (y 0..76).
      ctx.fillStyle = '#0c1626'; ctx.fillRect(0, 0, w, 76);
      ctx.fillStyle = accent; ctx.fillRect(0, 0, 12, 76);
      ctx.fillStyle = '#eef4ff';
      ctx.font = '700 30px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      ctx.fillText(title, 20, 20);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#94abc7';
      ctx.font = '600 16px "SF Mono", ui-monospace, Menlo, Consolas, monospace';
      ctx.fillText(isDebrief ? 'OUTCOME: RESCUE' : 'SIGNAL: ' + phase.toUpperCase(), w - 16, 28);

      // Zone 2 — center: main directive (left) + TIME/ENERGY/HULL gauge cards (right).
      // Left column inner panel.
      const panelX = 20, panelY = 96, panelW = 700, panelH = 226;
      ctx.fillStyle = '#0d1828'; ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.strokeStyle = '#2a4365'; ctx.lineWidth = 2; ctx.strokeRect(panelX, panelY, panelW, panelH);
      ctx.fillStyle = '#eef4ff';
      ctx.font = '400 34px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      let y = panelY + 22, line = '';
      const maxW = panelW - 32;
      for (const word of objective.split(' ')) {
        const next = line ? line + ' ' + word : word;
        if (ctx.measureText(next).width > maxW && line) { ctx.fillText(line, panelX + 12, y); y += 48; line = word; }
        else line = next;
      }
      if (line) { ctx.fillText(line, panelX + 12, y); }

      // Right column: three stacked horizontal telemetry gauge cards.
      const timeM = (lines[2] || '').match(/TIME ([\d/]+)/);
      const energyM = (lines[2] || '').match(/ENERGY ([\d/]+)/);
      const hullM = (lines[2] || '').match(/HULL ([\d/]+)/);
      const gauges = [
        { label: 'TIME', value: timeM ? timeM[1] : '0/8', max: 8 },
        { label: 'ENERGY', value: energyM ? energyM[1] : '0/100', max: 100 },
        { label: 'HULL', value: hullM ? hullM[1] : '0/100', max: 100 },
      ];
      let gy = 104;
      for (const g of gauges) {
        const num = parseInt(String(g.value).split('/')[0], 10) || 0;
        const frac = Math.min(1, num / (g.max || 1));
        ctx.fillStyle = '#0c1626'; ctx.fillRect(760, gy, 720, 56);
        ctx.strokeStyle = '#2a4365'; ctx.lineWidth = 1; ctx.strokeRect(760, gy, 720, 56);
        ctx.fillStyle = '#94abc7';
        ctx.font = '700 20px "SF Mono", ui-monospace, Menlo, Consolas, monospace';
        ctx.fillText(g.label, 780, gy + 12);
        ctx.fillStyle = '#eef4ff';
        ctx.font = '700 26px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.fillText(g.value, 780, gy + 32);
        ctx.fillStyle = '#4da3ff';
        ctx.fillRect(900, gy + 36, 540 * frac, 4);
        gy += 68;
      }

      // Zone 3 — bottom status strip (y 365..460): prep pills left, action directive right.
      ctx.fillStyle = '#0c1626'; ctx.fillRect(0, 365, w, 95);
      ctx.fillStyle = '#94abc7';
      ctx.font = '500 20px "SF Mono", ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(prep, 16, 384);
      ctx.textAlign = 'right';
      ctx.fillStyle = accent;
      ctx.font = '600 20px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.fillText(action, w - 16, 384);
    }

    /** Three-band physical console: header band, telemetry body, action pills. */
    function drawConsole(ctx, w, h, accentHex, lines, actions) {
      const accent = accentHex;
      const rgb = hexToRgba(accent, 0.18);
      // Station header band (y 0..64).
      ctx.fillStyle = rgb; ctx.fillRect(0, 0, w, 64);
      ctx.fillStyle = accent; ctx.fillRect(0, 0, 8, 64);
      ctx.fillStyle = '#eef4ff';
      ctx.font = '700 30px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      ctx.fillText((lines[0] || '').toUpperCase(), 14, 18);
      // Telemetry readout body (y 80..240).
      ctx.fillStyle = '#eef4ff';
      ctx.font = '400 28px "SF Mono", ui-monospace, Menlo, Consolas, monospace';
      let y = 92;
      for (let i = 1; i < lines.length; i++) {
        ctx.fillText(lines[i] || '', 14, y);
        y += 40;
        if (y > 240) break;
      }
      // Available action pills (y 255..385).
      const pills = actions || [];
      let py = 260;
      if (pills.length === 0) {
        ctx.fillStyle = '#94abc7';
        ctx.font = '500 20px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.fillText('STATION READY — NO PENDING ACTION', 14, py + 22);
      }
      for (const p of pills) {
        const label = '▸ ' + (p.label || '');
        ctx.font = '500 22px system-ui, -apple-system, "Segoe UI", sans-serif';
        const tw = ctx.measureText(label).width;
        const pw = Math.min(w - 28, tw + 26);
        ctx.fillStyle = '#132238'; ctx.fillRect(14, py, pw, 30);
        ctx.fillStyle = accent; ctx.fillRect(14, py, 2, 30);
        ctx.fillStyle = '#ffd479';
        ctx.fillText(label, 22, py + 5);
        py += 42;
      }
    }

    function write(id, value, actions) {
      const s = surfaces.get(id); if (!s) return;
      const text = value == null ? '' : String(value);
      const key = text + '||' + (actions ? actions.map(a => a && a.label).join(',') : '');
      if (key === s.last) return;
      s.last = key;
      const ctx = s.canvas.getContext('2d');
      const w = s.canvas.width, h = s.canvas.height;
      ctx.fillStyle = '#070d17'; ctx.fillRect(0, 0, w, h);
      if (id === 'bridge/viewscreen') {
        drawViewscreen(ctx, w, h, s, text.split('\n'));
      } else {
        drawConsole(ctx, w, h, s.color, text.split('\n'), actions || []);
      }
      s.texture.setSource(s.canvas);
      s.texture.upload();
    }

    C.setViewscreen = text => write('bridge/viewscreen', text);
    C.setConsoleContent = (id, content) => {
      if (!id.startsWith('consoles/')) return;
      const actions = content?.actions || [];
      write(id, [content?.text || '', ...actions.map(a => a.label)].filter(Boolean).join('\n'), actions);
    };

    function present(view) {
      const s = view.state;
      const resources = `TIME ${s.time}/8  ENERGY ${s.power}/100  HULL ${s.hull}/100`;
      const outcome = s.outcome;
      const vs = surfaces.get('bridge/viewscreen');
      vs.phase = view.state.phase;
      vs.outcome = outcome;
      C.setViewscreen([
        outcome ? 'ASTER / RESCUE DEBRIEF' : 'ASTER / DISTRESS CHANNEL',
        view.objective,
        resources,
        outcome ? `Rescued ${outcome.rescued} / Lost ${outcome.lost} / Hull damage ${outcome.damage}`
          : `Crew ${s.consulted.length}/3 | Scan ${s.scanned ? 'complete' : 'pending'} | Approach ${s.approach || 'unset'} | Power ${s.allocation || 'unset'}`,
        outcome ? 'Communications: restart encounter' : 'Use physical stations and consult the three officers.',
      ].join('\n'));

      const status = {
        'consoles/comms': `${s.phase === 'incoming' ? 'ASTER / 12 ABOARD' : outcome ? `${outcome.rescued} rescued / ${outcome.lost} lost` : 'CHANNEL OPEN'}\n${resources}`,
        'consoles/science': `SCAN ${s.scanned ? 'COMPLETE / safe corridor' : 'PENDING'}\nCrew consulted ${s.consulted.length}/3\nEnergy ${s.power}/100`,
        'consoles/helm': `APPROACH ${s.approach || 'UNSET'}\n${s.scanned ? 'Safe corridor available' : 'Scan for safe corridor'}\nTime ${s.time}/8`,
        'consoles/engineering': `POWER ${s.allocation || 'UNSET'}\nEnergy ${s.power}/100 / Hull ${s.hull}/100\n${s.allocation === 'rescue' ? '20 shielding / 80 rescue' : s.allocation === 'balanced' ? '50 shielding / 50 rescue' : 'Choose shielding / rescue split'}`,
      };
      for (const [id, text] of Object.entries(status)) {
        // Labels come from the rules API; these surfaces never execute an action.
        const actions = OpenStars.Encounter.allowed(s, id).map(action => ({ label: OpenStars.Encounter.LABELS[action] }));
        const title = C.interactables.get(id).label.toUpperCase();
        C.setConsoleContent(id, { text: title + '\n' + text, actions });
      }
    }
    return { present };
  }
  OpenStars.createDisplays = createDisplays;
})();
