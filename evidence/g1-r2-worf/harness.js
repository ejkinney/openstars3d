(() => {
  const a = OpenStars.app, p = OpenStars.player, C = OpenStars.Contract;
  const canvas = a.graphicsDevice.canvas;
  window.Q2 = { results: [], inputs: [], calls: [], lockAttempts: [] };
  const q = Q2;
  q.vec = v => ({ x: v.x, y: v.y, z: v.z });
  q.state = () => ({ pos: q.vec(p.camera.getPosition()), forward: q.vec(p.getForward()),
    hover: [...C.interactables].find(([id,d]) => d === p.getHovered())?.[0] || null,
    locked: p.isLocked(), nativeNull: document.pointerLockElement === null,
    nativeCanvas: document.pointerLockElement === canvas,
    ownLockProperty: Object.hasOwn(document, 'pointerLockElement'),
    prompt: document.getElementById('interact').innerText,
    opacity: document.getElementById('interact').style.opacity,
    crosshair: document.getElementById('crosshair').style.opacity,
    url: location.href });
  q.save = async (name, data) => {
    const body = typeof data === 'string' && data.startsWith('data:') ? data :
      btoa(unescape(encodeURIComponent(typeof data === 'string' ? data : JSON.stringify(data, null, 2))));
    const r = await fetch('http://127.0.0.1:8124/save?name=' + name, {method:'POST', body});
    if (!r.ok) throw new Error('Evidence save failed: ' + r.status);
    return r.json();
  };
  q.check = (name, pass, detail) => { const r = {name, pass: !!pass, detail}; q.results.push(r); return r; };
  q.tick = (n=1, dt=0) => { for(let i=0;i<n;i++) a.fire('update',dt); a.render(); return q.state(); };
  q.down = (code='KeyE', repeat=false) => document.dispatchEvent(new KeyboardEvent('keydown',{code,repeat}));
  q.up = (code='KeyE') => document.dispatchEvent(new KeyboardEvent('keyup',{code}));
  q.tap = (code='KeyE') => { q.down(code); q.up(code); };
  q.pose = (x=-3.4,z=-2.3,tx=-3.4,ty=1,tz=-3.9) => {
    p.setPreset(new pc.Vec3(x,1.7,z), new pc.Vec3(tx,ty,tz));
    return q.tick();
  };
  q.realExit = document.exitPointerLock.bind(document);
  q.lockOn = () => {
    q.shimLocked=true;
    Object.defineProperty(document,'pointerLockElement',{configurable:true,get:()=>q.shimLocked?canvas:null});
    document.exitPointerLock=()=>{q.shimLocked=false;document.dispatchEvent(new Event('pointerlockchange'));};
    document.dispatchEvent(new Event('pointerlockchange')); return q.tick();
  };
  q.removeShim = () => {
    delete document.pointerLockElement; document.exitPointerLock=q.realExit;
    document.dispatchEvent(new Event('pointerlockchange')); return q.tick();
  };
  q.mouse = (x,y,tick=true) => {
    document.dispatchEvent(new MouseEvent('mousemove',{movementX:x,movementY:y}));
    return tick?q.tick():q.state();
  };
  q.aimNoTick = (x,y,z) => {
    const pos=p.camera.getPosition(), f=p.getForward();
    const dx=x-pos.x,dy=y-pos.y,dz=z-pos.z;
    const yaw=Math.atan2(-dx,-dz),pitch=Math.atan2(dy,Math.hypot(dx,dz));
    return q.mouse((Math.atan2(-f.x,-f.z)-yaw)/.0021,(Math.asin(f.y)-pitch)/.0021,false);
  };
  q.capture = async name => { q.tick(); await q.save(name+'.png',canvas.toDataURL('image/png')); await q.save(name+'.json',q.state()); };
  q.observeLockRequest = () => {
    const original=canvas.requestPointerLock;
    canvas.requestPointerLock=function(...args){
      const log={activation:navigator.userActivation.isActive};q.lockAttempts.push(log);
      try {const r=original.apply(this,args); if(r?.then)r.then(()=>log.resolved=true,e=>log.error={name:e.name,message:e.message});return r;}
      catch(e){log.error={name:e.name,message:e.message};throw e;}
    };
  };
  C.onInteract=(id,d)=>q.calls.push({id,label:d.label});
  document.addEventListener('keydown',e=>q.inputs.push({code:e.code,repeat:e.repeat,trusted:e.isTrusted}));
  a.timeScale=0;
  q.initial={contract:C.version,ids:[...C.interactables.keys()],buffer:[a.graphicsDevice.width,a.graphicsDevice.height],dpr:devicePixelRatio,ua:navigator.userAgent};
  q.pose();
  q.preEntryCount=q.calls.length;
  return {initial:q.initial,state:q.state()};
})()
