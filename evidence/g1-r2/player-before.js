/**
 * Open Stars — first-person camera & movement (renderer-owned).
 * Owns: camera transform, pointer-lock look, WASD walk, bounds/collider resolution,
 * and the gaze raycast that drives the interaction CONTRACT. Gameplay meaning of
 * any interaction is Data's (Contract.onInteract); this file only fires the hook.
 */
window.OpenStars = window.OpenStars || {};

(function () {
  'use strict';

  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  function createPlayer(app, colliders) {
    const Contract = window.OpenStars.Contract;

    const camera = new pc.Entity(Contract.ENTITIES.PLAYER_CAMERA);
    camera.addComponent('camera', {
      clearColor: new pc.Color(0.02, 0.02, 0.05),
      fov: 70,
      nearClip: 0.05,
      farClip: 120,
    });
    app.root.addChild(camera);

    const state = {
      pos: new pc.Vec3(0, 1.7, 4.8),
      yaw: 0,              // 0 faces -Z (toward viewscreen)
      pitch: -0.02,
      radius: 0.34,
      speed: 3.2,
      locked: false,
      keys: Object.create(null),
      hoveredName: null,
    };

    const up = new pc.Vec3(0, 1, 0);
    const forward = new pc.Vec3();
    const right = new pc.Vec3();

    camera.setPosition(state.pos);
    applyLook();

    function applyLook() {
      const cp = Math.cos(state.pitch), sp = Math.sin(state.pitch);
      const cy = Math.cos(state.yaw), sy = Math.sin(state.yaw);
      forward.set(-sy * cp, sp, -cy * cp);
      right.set(cy, 0, -sy); // horizontal right = forward x up
      const target = new pc.Vec3().add2(state.pos, forward);
      camera.lookAt(target);
    }

    // --- Input ---------------------------------------------------------
    const canvas = app.graphicsDevice.canvas;

    function onMouseMove(e) {
      if (!state.locked) return;
      const sens = 0.0021;
      state.yaw -= e.movementX * sens;
      state.pitch -= e.movementY * sens;
      state.pitch = clamp(state.pitch, -1.45, 1.45);
      applyLook();
    }

    function onKeyDown(e) {
      if (e.code === 'Escape') {
        if (state.locked) document.exitPointerLock();
        return;
      }
      state.keys[e.code] = true;
      if (e.code === 'KeyE' && !e.repeat) {
        const d = Contract.interactables.get(state.hoveredName);
        if (d && d.enabled) Contract.emitInteract(state.hoveredName);
      }
    }
    function onKeyUp(e) { state.keys[e.code] = false; }
    function onLockChange() {
      state.locked = (document.pointerLockElement === canvas);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('pointerlockchange', onLockChange);

    // --- Collision (circle vs axis-aligned boxes, XZ plane) -------------
    function collideCircle(pos) {
      for (let pass = 0; pass < 2; pass++) {
        for (const c of colliders) {
          if (c.max.y < 0.05 || c.min.y > 1.85) continue; // not at body height
          const cx = clamp(pos.x, c.min.x, c.max.x);
          const cz = clamp(pos.z, c.min.z, c.max.z);
          const dx = pos.x - cx, dz = pos.z - cz;
          const d2 = dx * dx + dz * dz;
          if (d2 >= state.radius * state.radius) continue;
          if (d2 < 1e-9) {
            // Center inside the box: push out along the smallest penetration axis.
            const pxL = pos.x - c.min.x, pxR = c.max.x - pos.x;
            const pzL = pos.z - c.min.z, pzR = c.max.z - pos.z;
            const pushX = Math.min(pxL, pxR), pushZ = Math.min(pzL, pzR);
            if (pushX < pushZ) {
              pos.x += (pxL < pxR ? -1 : 1) * (state.radius + pushX);
            } else {
              pos.z += (pzL < pzR ? -1 : 1) * (state.radius + pushZ);
            }
          } else {
            const d = Math.sqrt(d2);
            pos.x = cx + (dx / d) * state.radius;
            pos.z = cz + (dz / d) * state.radius;
          }
        }
      }
      return pos;
    }

    // --- Gaze raycast (slab method) -------------------------------------
    function rayAABB(o, d, min, max) {
      let tmin = 0, tmax = Infinity;
      const axes = ['x', 'y', 'z'];
      for (const a of axes) {
        const od = o[a], dd = d[a];
        if (Math.abs(dd) < 1e-8) {
          if (od < min[a] || od > max[a]) return null;
        } else {
          let t1 = (min[a] - od) / dd, t2 = (max[a] - od) / dd;
          if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
          tmin = Math.max(tmin, t1);
          tmax = Math.min(tmax, t2);
          if (tmin > tmax) return null;
        }
      }
      return tmin;
    }

    function updateGaze() {
      let best = null, bestT = 2.8;
      Contract.interactables.forEach((d, name) => {
        if (!d.enabled || !d.aabb) return;
        const t = rayAABB(state.pos, forward, d.aabb.min, d.aabb.max);
        if (t != null && t < bestT) { bestT = t; best = name; }
      });
      if (state.hoveredName !== best) {
        // Clear previous hover highlight.
        const prev = Contract.interactables.get(state.hoveredName);
        if (prev && prev.setHovered) prev.setHovered(false);
        const next = Contract.interactables.get(best);
        if (next && next.setHovered) next.setHovered(true);
        state.hoveredName = best;
      }
    }

    // --- Per-frame update ----------------------------------------------
    function update(dt) {
      if (state.locked) {
        let mx = 0, mz = 0;
        if (state.keys['KeyW'] || state.keys['ArrowUp']) mz += 1;
        if (state.keys['KeyS'] || state.keys['ArrowDown']) mz -= 1;
        if (state.keys['KeyA'] || state.keys['ArrowLeft']) mx -= 1;
        if (state.keys['KeyD'] || state.keys['ArrowRight']) mx += 1;
        if (mx !== 0 || mz !== 0) {
          const len = Math.hypot(mx, mz);
          mx /= len; mz /= len;
          // Horizontal movement along forward/right projections.
          state.pos.x += (forward.x * mz + right.x * mx) * state.speed * dt;
          state.pos.z += (forward.z * mz + right.z * mx) * state.speed * dt;
          state.pos.y = 1.7; // flat bridge, no vertical movement in greybox
          collideCircle(state.pos);
        }
        camera.setPosition(state.pos);
        applyLook();
      }
      updateGaze();
    }

    // --- Public API (renderer/main use) ---------------------------------
    return {
      update: update,
      camera: camera,
      getForward: () => forward,
      getHovered: () => Contract.interactables.get(state.hoveredName) || null,
      isLocked: () => state.locked,
      lock: () => {
        const p = canvas.requestPointerLock && canvas.requestPointerLock();
        if (p && p.catch) p.catch(() => {});
      },
      /** Set a fixed camera for deterministic screenshots (no pointer lock).
       *  @param {pc.Vec3} pos     camera position
       *  @param {pc.Vec3} target  world position to look at (drives yaw/pitch)
       */
      setPreset: (pos, target) => {
        state.pos.set(pos.x, pos.y, pos.z);
        const d = new pc.Vec3().sub2(target, pos).normalize();
        state.pitch = Math.asin(d.y);
        state.yaw = Math.atan2(-d.x, -d.z);
        state.locked = false;
        if (document.pointerLockElement) document.exitPointerLock();
        camera.setPosition(state.pos);
        applyLook();
      },
    };
  }

  window.OpenStars.createPlayer = createPlayer;
})();
