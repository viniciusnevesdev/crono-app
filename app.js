/* Crono Simplificado v3 — independente da versão histórica. */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const view = $('#view');
  const canvas = $('#canvas');
  const eventbox = $('#events');
  const portal = $('#modal');
  const zooms = [24, 18, 12, 8, 6, 4, 2];
  const KEY = 'crono-simples-v1';
  let zoomIndex = 2, pxHour = 0, selected = null, formMode = 'now', idCounter = 0;
  const pad = (n) => String(n).padStart(2, '0');
  let dayKey = localDay(), events = loadDay(dayKey);
  const fmt = (n) => { n = Math.round(n); return pad(Math.floor(n / 60)) + ':' + pad(n % 60); };
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const snap = (n) => Math.round(n / 15) * 15;
  const escapeHTML = (s) => String(s || '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const now = () => { const d = new Date(); return d.getHours()*60 + d.getMinutes() + d.getSeconds()/60; };

  function localDay() {
    const d = new Date();
    return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  }
  function validateEvent(e) {
    return e && typeof e.title === 'string' && e.title.trim() &&
      Number.isInteger(e.start) && Number.isInteger(e.end) &&
      e.start >= 0 && e.end <= 1440 && e.end > e.start;
  }
  function loadDay(key) {
    try {
      const all = JSON.parse(localStorage.getItem(KEY) || '{}');
      const found = Array.isArray(all[key]) ? all[key] : [];
      return found.filter(validateEvent).map(e => ({
        id: String(e.id), title: String(e.title).slice(0,100),
        description: String(e.description || ''), start:e.start, end:e.end
      }));
    } catch (e) { return []; }
  }
  function saveDay() {
    try {
      const all = JSON.parse(localStorage.getItem(KEY) || '{}');
      const data = all && typeof all === 'object' && !Array.isArray(all) ? all : {};
      data[dayKey] = events;
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) { toast('Não foi possível salvar neste navegador.'); }
  }
  function makeId() { return String(Date.now())+'-'+(++idCounter); }
  function showDate() {
    const d = new Date();
    $('#date').textContent = 'Hoje · ' + new Intl.DateTimeFormat('pt-BR',{day:'numeric',month:'short'}).format(d).replace(/\.$/,'');
  }
  function updateClock() {
    const n = now();
    $('#clock').textContent = fmt(n);
    $('#nowlabel').textContent = fmt(n);
    $('#nowline').style.top = n/60*pxHour+'px';
  }
  function scrollToMinute(min, smooth) {
    stopInertia();
    const y = clamp(min/60*pxHour - view.clientHeight/2, 0, Math.max(0, view.scrollHeight-view.clientHeight));
    view.scrollTo({top:y,behavior:smooth?'smooth':'instant'});
  }
  function applyZoom(focus) {
    stopInertia();
    const center = typeof focus === 'number' ? focus :
      (pxHour > 0 ? (view.scrollTop + view.clientHeight/2)/pxHour*60 : now());
    pxHour = view.clientHeight / zooms[zoomIndex];
    canvas.style.height = (24*pxHour + 16)+'px';
    const hours = $('#hours');
    hours.replaceChildren();
    for (let i=0;i<=24;i++) {
      const line=document.createElement('div');
      line.className='hour';
      line.style.top=(i*pxHour)+'px';
      const label=document.createElement('span');
      label.textContent=pad(i)+':00';
      line.appendChild(label);hours.appendChild(line);
    }
    $('#zoomval').textContent = zooms[zoomIndex]+'h';
    $('#minus').disabled=zoomIndex===0;
    $('#plus').disabled=zoomIndex===zooms.length-1;
    renderEvents();
    scrollToMinute(center,false);
  }
  function renderEvents() {
    eventbox.replaceChildren();
    const n=now();
    events.slice().sort((a,b)=>a.start-b.start).forEach(e=>{
      const state=e.end<=n?'past':e.start<=n?'live':'future';
      const chosen=e.id===selected;
      const height=(e.end-e.start)/60*pxHour-4;
      const el=document.createElement('div');
      el.className='ev '+state+(chosen?' selected':'')+(height<39?' short':'')+(height<19?' tiny':'');
      el.style.top=(e.start/60*pxHour+2)+'px';
      el.style.height=Math.max(12,height)+'px';
      el.style.zIndex=chosen?'9':'2';
      el.innerHTML='<div class="ev-title">'+escapeHTML(e.title)+'</div><div class="ev-time">'+fmt(e.start)+' – '+fmt(e.end)+'</div>'+
        (chosen?'<div class="handle top" data-edge="start" aria-label="Ajustar início"></div><div class="handle bottom" data-edge="end" aria-label="Ajustar fim"></div>':'');
      el.setAttribute('aria-label',e.title+', '+fmt(e.start)+' até '+fmt(e.end));
      el.addEventListener('click',()=>{
        if (selected!==e.id) {selected=e.id;renderEvents();}
      });
      el.addEventListener('pointerdown',p=>{
        if (p.button!==undefined && p.button!==0) return;
        if (selected!==e.id) return;
        const handle=p.target.closest('.handle');
        drag(p,e,el,handle?handle.dataset.edge:'move');
      });
      eventbox.appendChild(el);
    });
    updateClock();
  }
  function drag(pointer,e,el,kind) {
    pointer.preventDefault();
    pointer.stopPropagation();
    const id=pointer.pointerId,sy=pointer.clientY,start=e.start,end=e.end;
    let moved=false;
    try { el.setPointerCapture(id); } catch (_) {}
    const move=(p)=>{
      if(p.pointerId!==id)return;
      const dy=p.clientY-sy;
      if(!moved && Math.abs(dy)<5)return;
      moved=true;p.preventDefault();
      const delta=snap(dy/pxHour*60);
      if(kind==='start')e.start=clamp(start+delta,0,end-15);
      else if(kind==='end')e.end=clamp(end+delta,start+15,1440);
      else {
        const duration=end-start;
        e.start=clamp(start+delta,0,1440-duration);
        e.end=e.start+duration;
      }
      el.style.top=(e.start/60*pxHour+2)+'px';
      el.style.height=Math.max(12,(e.end-e.start)/60*pxHour-4)+'px';
      const time=el.querySelector('.ev-time');
      if(time)time.textContent=fmt(e.start)+' – '+fmt(e.end);
    };
    const cleanup=()=>{
      el.removeEventListener('pointermove',move);
      el.removeEventListener('pointerup',up);
      el.removeEventListener('pointercancel',cancel);
      try {el.releasePointerCapture(id);}catch(_){}
    };
    const up=(p)=>{
      if(p.pointerId!==id)return;
      cleanup();
      if(!moved && kind==='move')showDetails(e.id);
      else {if(moved)saveDay();renderEvents();}
    };
    const cancel=(p)=>{
      if(p.pointerId!==id)return;
      cleanup();e.start=start;e.end=end;renderEvents();
    };
    el.addEventListener('pointermove',move);
    el.addEventListener('pointerup',up);
    el.addEventListener('pointercancel',cancel);
  }
  function close() {
    portal.replaceChildren();
  }
  function modal(html) {
    portal.innerHTML='<div class="overlay"><div class="dialog" role="dialog" aria-modal="true">'+html+'</div></div>';
    portal.querySelector('.overlay').addEventListener('pointerdown',p=>{
      if(p.target.classList.contains('overlay'))close();
    });
  }
  function showDetails(id) {
    const e=events.find(x=>x.id===id);
    if(!e)return;
    modal('<h2 class="center">'+escapeHTML(e.title)+'</h2>'+
      '<div class="detailtime">'+fmt(e.start)+' — '+fmt(e.end)+'</div>'+
      '<div class="note">'+escapeHTML(e.description||'Sem observações.')+'</div>'+
      '<div class="buttons"><button class="primary" id="edit">Editar</button></div>');
    $('#edit').onclick=()=>showForm('edit',id);
  }
  function initialRange() {
    const n=clamp(Math.round(now()),1,1438);
    if(formMode==='done')return[Math.max(0,n-60),n];
    if(formMode==='plan'){const s=clamp(n+30,0,1438);return[s,Math.min(s+60,1439)];}
    return[n,Math.min(n+60,1439)];
  }
  function showForm(type,id) {
    const e=type==='edit'?events.find(x=>x.id===id):null;
    const editing=!!e,range=e?[e.start,e.end]:initialRange();
    modal('<h2>'+(editing?'Editar evento':'Adicionar evento')+'</h2>'+
      (editing?'':'<div class="modes"><button data-mode="now" class="'+(formMode==='now'?'on':'')+'">Começar agora</button><button data-mode="done" class="'+(formMode==='done'?'on':'')+'">Já concluí</button><button data-mode="plan" class="'+(formMode==='plan'?'on':'')+'">Planejar</button></div>')+
      '<label for="eventtitle">Título</label><input id="eventtitle" maxlength="100" placeholder="O que você fez ou vai fazer?" value="'+escapeHTML(e?.title||'')+'">'+
      (editing?'<div class="detailtime" style="margin-top:13px;font-size:12px">Horário: '+fmt(e.start)+' – '+fmt(e.end)+'</div>':
      '<div class="times"><div><label for="start">Início</label><input id="start" type="time" value="'+fmt(range[0])+'"></div><div><label for="end">Fim</label><input id="end" type="time" value="'+fmt(range[1])+'"></div></div>')+
      '<label for="desc">Observação (opcional)</label><textarea id="desc" placeholder="Alguma anotação?">'+escapeHTML(e?.description||'')+'</textarea>'+
      '<div class="error" id="error" role="alert"></div><div class="buttons"><button class="secondary" id="cancel">Cancelar</button><button class="primary" id="save">Salvar</button></div>');
    $('#cancel').onclick=close;
    if(!editing)portal.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{
      const title=$('#eventtitle').value,desc=$('#desc').value;
      formMode=b.dataset.mode;showForm('new');
      $('#eventtitle').value=title;$('#desc').value=desc;
    });
    $('#save').onclick=()=>{
      const title=$('#eventtitle').value.trim();
      const description=$('#desc').value.trim();
      if(!title){$('#eventtitle').focus();return;}
      if(editing){
        e.title=title;e.description=description;saveDay();close();renderEvents();return;
      }
      const parse=(s)=>{
        if(!/^\d{2}:\d{2}$/.test(s))return NaN;
        const parts=s.split(':').map(Number);
        return parts[0]*60+parts[1];
      };
      const start=parse($('#start').value),end=parse($('#end').value);
      if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end>1440||end<=start){
        $('#error').textContent='O fim deve ser depois do início.';return;
      }
      const item={id:makeId(),title,description,start,end};
      events.push(item);selected=item.id;saveDay();close();renderEvents();
      scrollToMinute((start+end)/2,true);
    };
  }
  let toastTimer;
  function toast(message) {
    const t=$('#toast');t.textContent=message;t.hidden=false;
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>t.hidden=true,3000);
  }
  // Rolagem própria da timeline: o iOS não pode aplicar o elástico nativo,
  // inclusive em movimentos rápidos que atravessam a borda por inércia.
  // A inércia é simulada e limitada; o brilho aparece APENAS enquanto o dedo puxa.
  const glowTop = $('#glow-top'), glowBottom = $('#glow-bottom');
  let gesture = null, inertiaId = 0, inertiaVelocity = 0;
  function maxScroll() {
    return Math.max(0, view.scrollHeight - view.clientHeight);
  }
  function stopInertia() {
    if (inertiaId) cancelAnimationFrame(inertiaId);
    inertiaId = 0;
    inertiaVelocity = 0;
  }
  // Configuração visual aprovada pelo usuário em 04/11/2026.
  const glowConfig = Object.freeze({
    color: '#e22400', maxOpacity: .82, widthPercent: 210, heightPx: 24,
    blurPx: 3, resistance: 2.8, retractionMs: 1050
  });
  const glowLevels = {top: 0, bottom: 0};
  const glowTargets = {top: 0, bottom: 0};
  let glowFrameId = 0, lastGlowFrame = 0, glowRetraction = null;
  function paintGlow() {
    for (const [side, el] of [['top', glowTop], ['bottom', glowBottom]]) {
      const level = clamp(glowLevels[side], 0, 1);
      el.style.opacity = String(glowConfig.maxOpacity * level);
      el.style.transform = 'translateX(-50%) scaleY(' + (.25 + .60 * level) + ')';
    }
  }
  function requestGlowFrame() {
    if (!glowFrameId) glowFrameId = requestAnimationFrame(animateGlow);
  }
  function animateGlow(timestamp) {
    glowFrameId = 0;
    const dt = lastGlowFrame ? Math.min(48, Math.max(0, timestamp-lastGlowFrame)) : 16.67;
    lastGlowFrame = timestamp;
    if (glowRetraction) {
      const progress = clamp((timestamp-glowRetraction.start) / glowConfig.retractionMs, 0, 1);
      // Retração progressiva: decelera ao voltar para dentro da borda.
      const remaining = Math.pow(1-progress, 3);
      glowLevels.top = glowRetraction.top * remaining;
      glowLevels.bottom = glowRetraction.bottom * remaining;
      if (progress >= 1) glowRetraction = null;
    } else {
      // Interpolação por quadro: sem saltos entre os eventos de toque do iPhone.
      const smooth = 1 - Math.exp(-dt / 65);
      glowLevels.top += (glowTargets.top-glowLevels.top)*smooth;
      glowLevels.bottom += (glowTargets.bottom-glowLevels.bottom)*smooth;
    }
    paintGlow();
    if (glowRetraction ||
        Math.abs(glowTargets.top-glowLevels.top)>.0002 ||
        Math.abs(glowTargets.bottom-glowLevels.bottom)>.0002) {
      requestGlowFrame();
    } else {
      glowLevels.top = glowTargets.top;
      glowLevels.bottom = glowTargets.bottom;
      paintGlow();
      lastGlowFrame = 0;
    }
  }
  function showEdgeGlow() {
    const threshold = Math.max(160, gesture?.edgeTravel || view.clientHeight);
    // A intensidade aumenta de forma não linear (resistência 2.8).
    glowTargets.top = Math.pow(clamp((gesture?.topPull || 0)/threshold, 0, 1), glowConfig.resistance);
    glowTargets.bottom = Math.pow(clamp((gesture?.bottomPull || 0)/threshold, 0, 1), glowConfig.resistance);
    glowRetraction = null;
    requestGlowFrame();
  }
  function clearGlow() {
    glowTargets.top = 0;
    glowTargets.bottom = 0;
    // Conserva o brilho do último quadro para recuar suavemente durante 1500 ms.
    if (glowLevels.top > .0002 || glowLevels.bottom > .0002) {
      glowRetraction = {start: performance.now(), top: glowLevels.top, bottom: glowLevels.bottom};
      requestGlowFrame();
    } else {
      glowRetraction = null;
      paintGlow();
    }
  }
  function startInertia(speed) {
    stopInertia();
    inertiaVelocity = clamp(speed, -2.4, 2.4);
    if (Math.abs(inertiaVelocity) < .12) return;
    let prev = performance.now();
    function frame(timestamp) {
      const dt = Math.min(35, timestamp - prev);
      prev = timestamp;
      const limit = maxScroll();
      const attempted = view.scrollTop + inertiaVelocity * dt;
      const bounded = clamp(attempted, 0, limit);
      view.scrollTop = bounded;
      // Sem overscroll, sem brilho e sem movimento de retorno por mola.
      if (bounded !== attempted || Math.abs(inertiaVelocity) < .035) {
        stopInertia();
        return;
      }
      inertiaVelocity *= Math.pow(.947, dt / 16.7);
      inertiaId = requestAnimationFrame(frame);
    }
    inertiaId = requestAnimationFrame(frame);
  }
  view.addEventListener('touchstart', (e) => {
    stopInertia();
    clearGlow();
    gesture = null;
    if (e.touches.length !== 1 || e.target.closest('.ev.selected')) return;
    gesture = {
      lastY: e.touches[0].clientY,
      lastTime: performance.now(),
      velocity: 0,
      topPull: 0,
      bottomPull: 0,
      edgeTravel: view.clientHeight
    };
  }, {passive:true});
  view.addEventListener('touchmove', (e) => {
    if (!gesture || e.touches.length !== 1) return;
    if (e.cancelable) e.preventDefault();
    const y = e.touches[0].clientY;
    const t = performance.now();
    const delta = y - gesture.lastY;
    const dt = Math.max(8, t - gesture.lastTime);
    gesture.lastY = y;
    gesture.lastTime = t;
    let remaining = delta;
    // Desfaz o esforço do dedo antes de permitir rolar no sentido oposto.
    if (gesture.topPull > 0) {
      const remainingPull = gesture.topPull + remaining;
      gesture.topPull = Math.max(0, remainingPull);
      remaining = Math.min(0, remainingPull);
    } else if (gesture.bottomPull > 0) {
      const remainingPull = gesture.bottomPull - remaining;
      gesture.bottomPull = Math.max(0, remainingPull);
      remaining = Math.max(0, -remainingPull);
    }
    const previous = view.scrollTop;
    const requested = previous - remaining;
    const limit = maxScroll();
    view.scrollTop = clamp(requested, 0, limit);
    const crossedTop = Math.max(0, -requested);
    const crossedBottom = Math.max(0, requested - limit);
    if (crossedTop > 0) {
      if (gesture.topPull === 0) {
        gesture.edgeTravel = Math.max(160, view.getBoundingClientRect().bottom - y);
      }
      gesture.topPull += crossedTop;
      gesture.bottomPull = 0;
    } else if (crossedBottom > 0) {
      if (gesture.bottomPull === 0) {
        gesture.edgeTravel = Math.max(160, y - view.getBoundingClientRect().top);
      }
      gesture.bottomPull += crossedBottom;
      gesture.topPull = 0;
    }
    const moved = view.scrollTop - previous;
    // A velocidade considera somente o movimento real do conteúdo, não o esforço além do limite.
    gesture.velocity = moved ? (.65 * (moved / dt) + .35 * gesture.velocity) : 0;
    showEdgeGlow();
  }, {passive:false});
  function finishGesture() {
    if (!gesture) { clearGlow(); return; }
    const velocity = gesture.topPull || gesture.bottomPull ? 0 : gesture.velocity;
    gesture = null;
    clearGlow();
    startInertia(velocity);
  }
  view.addEventListener('touchend', finishGesture, {passive:true});
  view.addEventListener('touchcancel', () => {
    gesture = null;
    clearGlow();
    stopInertia();
  }, {passive:true});
  $('#add').onclick=()=>{formMode='now';showForm('new');};
  $('#nowbtn').onclick=()=>scrollToMinute(now(),true);
  $('#minus').onclick=()=>{if(zoomIndex>0){zoomIndex--;applyZoom();}};
  $('#plus').onclick=()=>{if(zoomIndex<zooms.length-1){zoomIndex++;applyZoom();}};
  $('#help').onclick=()=>{
    modal('<h2 class="center">Como usar o Crono</h2><div class="help-text">'+
      '<div class="help-item"><strong>Selecionar:</strong> toque uma vez em um evento.</div>'+
      '<div class="help-item"><strong>Mover:</strong> arraste o evento selecionado.</div>'+
      '<div class="help-item"><strong>Ajustar duração:</strong> arraste a extremidade superior ou inferior.</div>'+
      '<div class="help-item"><strong>Detalhes:</strong> toque novamente no centro do evento.</div>'+
      '<div class="help-item"><strong>Zoom:</strong> use − e + para alternar entre 24h, 18h, 12h, 8h, 6h, 4h e 2h.</div>'+
      '<div class="help-item"><strong>Agora:</strong> toque no relógio para localizar o horário atual.</div>'+
      '<div class="help-item"><strong>Cores:</strong> azul acinzentado indica passado; verde, evento em andamento; roxo, evento planejado.</div>'+
      '</div><div class="buttons"><button class="primary" id="understood">Entendi</button></div>');
    $('#understood').onclick=close;
  };
  canvas.addEventListener('click',p=>{
    if(p.target===canvas||p.target===eventbox||p.target===$('#hours')){
      selected=null;renderEvents();
    }
  });
  document.addEventListener('keydown',p=>{if(p.key==='Escape')close();});
  function tick() {
    if(localDay()!==dayKey){
      dayKey=localDay();events=loadDay(dayKey);selected=null;close();showDate();applyZoom(now());
    } else updateClock();
  }
  let lastHeight=0;
  window.addEventListener('resize',()=>{
    if(Math.abs(view.clientHeight-lastHeight)>4 && view.clientHeight>0){
      lastHeight=view.clientHeight;applyZoom();
    }
  });
  showDate();
  applyZoom(now());
  lastHeight=view.clientHeight;
  setInterval(tick,15000);
  setInterval(renderEvents,60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  }
})();
