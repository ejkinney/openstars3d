(async () => {
  const q=Q2, p=OpenStars.player, C=OpenStars.Contract;
  let calls=q.calls.slice(q.freshHeldBefore);
  q.check('release then fresh trusted E after held re-entry emits one', calls.length===1&&calls[0].id==='consoles/helm', {calls,input:q.inputs.at(-1),state:q.state()});

  // Change forward without a frame/gaze update: keydown must refresh stale hover.
  const old=q.state();
  q.aimNoTick(-4.9,1.3,-3.1);
  const stale=q.state();let n=q.calls.length;q.tap();
  calls=q.calls.slice(n);
  q.check('dispatch refreshes stale helm gaze to current Mara',old.hover==='consoles/helm'&&stale.hover==='consoles/helm'&&calls.length===1&&calls[0].id==='crew/mara-vale',{old,stale,after:q.state(),calls});

  // Repeat/duplicate suppression during an ordinary active key hold.
  n=q.calls.length;q.down();q.down('KeyE',true);q.down('KeyE',false);q.down('KeyE',true);q.up();
  q.check('ordinary active E hold emits only one',q.calls.length===n+1,{calls:q.calls.slice(n)});

  // Disable after gaze resolves; dispatch-time refresh must remove old target.
  C.setInteractableEnabled('crew/mara-vale',false);
  n=q.calls.length;q.tap();
  q.check('disabled cached target yields zero callbacks',q.calls.length===n&&p.getHovered()===null,{state:q.state(),calls:q.calls.slice(n)});
  C.setInteractableEnabled('crew/mara-vale',true);
  q.pose(0,0,0,1.7,-1);q.lockOn();n=q.calls.length;q.tap();
  q.check('no-target active E yields zero',q.calls.length===n&&q.state().hover===null,{state:q.state(),calls:q.calls.slice(n)});

  // Directly affected movement and mouse controls: small clear-floor smoke.
  const start=q.state();q.down('KeyW');q.tick(10,1/60);q.up('KeyW');const forward=q.state();
  q.check('active W remains forward',Math.abs(forward.pos.z-start.pos.z+3.2/6)<1e-5,{start,after:forward});
  q.down('KeyD');q.tick(10,1/60);q.up('KeyD');const right=q.state();
  q.check('active D remains right',Math.abs(right.pos.x-forward.pos.x-3.2/6)<1e-5,{before:forward,after:right});
  const look=q.mouse(100,50);
  q.check('active mouselook turns right and down',look.forward.x>0&&look.forward.y<0,{before:right,after:look});
  q.removeShim();const paused=q.state();q.down('KeyW');q.tick(60,1/60);q.up('KeyW');q.mouse(200,100);const after=q.state();
  q.check('paused movement and look remain stopped',JSON.stringify(paused.pos)===JSON.stringify(after.pos)&&JSON.stringify(paused.forward)===JSON.stringify(after.forward)&&after.opacity==='0'&&after.crosshair==='0',{before:paused,after});

  await q.save('runtime.json',{initial:q.initial,results:q.results,inputs:q.inputs,calls:q.calls,lockAttempts:q.lockAttempts});
  return {passed:q.results.filter(r=>r.pass).length,total:q.results.length,failed:q.results.filter(r=>!r.pass),cases:q.results.map(r=>({name:r.name,pass:r.pass}))};
})()
