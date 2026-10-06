(() => {
  const RELEASE=window.CRONO_RELEASE||{version:'0.1.0',name:'Base'};
  const versionBadge=document.getElementById('versionBadge');
  if(versionBadge){
    versionBadge.textContent=`v${RELEASE.version} • ${RELEASE.name}`;
    versionBadge.title=`Crono v${RELEASE.version} — ${RELEASE.name}`;
  }

  const STORAGE_KEY='crono-settings-v1';
  const EVENTS_KEY='crono-events-v1';
  const DEFAULTS={theme:'system',visualStyle:'optimized',collapsedSleepIntervals:{}};

  const CURVES={
    ios:'cubic-bezier(.2,.8,.2,1)',
    spring:'cubic-bezier(.18,1.35,.35,1)'
  };

  const DARK={
    barWidth:95,barHeight:52,bottomOffset:10,barPadding:1,barRadius:80,
    barOpacity:.11,barColor:'#ffffff',blur:2,saturation:260,brightness:105,
    barBorderWidth:.5,barBorderOpacity:.12,barBorderColor:'#ffffff',
    shadowOpacity:.19,shadowBlur:16,shadowY:8,shadowSpread:2,shadowColor:'#000000',
    bubbleWidth:.99,bubbleHeight:.99,bubbleOpacity:.5,bubbleColor:'#adadad',
    bubbleRadius:80,bubbleBorderWidth:1.25,bubbleBorderOpacity:.15,bubbleBorderColor:'#ffffff',
    bubbleShadowOpacity:.14,bubbleShadowBlur:10,bubbleShadowY:-1,
    iconSize:31,activeScale:1.32,iconY:-1,
    textSize:8,textWeight:650,itemGap:1,
    activeColor:'#ffffff',inactiveColor:'#ffffff',
    inactiveOpacity:.48,animationDuration:740,easing:'spring',pressScale:1
  };

  const LIGHT={
    ...DARK,
    bubbleOpacity:.25,bubbleColor:'#74a7ff',
    iconSize:28,
    activeColor:'#000000',inactiveColor:'#000000',
    inactiveOpacity:.61,animationDuration:350,pressScale:.78
  };

  function loadSettings(){
    try{
      return {...DEFAULTS,...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')};
    }catch{
      return {...DEFAULTS};
    }
  }

  let settings=loadSettings();

  function loadEvents(){
    try{
      const parsed=JSON.parse(localStorage.getItem(EVENTS_KEY)||'[]');
      return Array.isArray(parsed)?parsed:[];
    }catch{
      return [];
    }
  }

  let events=loadEvents();
  let timelineZoom=1;
  let selectedEventId=null;
  let editingEventId=null;
  let pendingTimelineTap=null;
  let pendingTimelineTapTimer=null;

  function saveEvents(){
    localStorage.setItem(EVENTS_KEY,JSON.stringify(events));
  }

  function saveSettings(){
    localStorage.setItem(STORAGE_KEY,JSON.stringify(settings));
  }

  function clearPendingTimelineTap(){
    if(pendingTimelineTapTimer)clearTimeout(pendingTimelineTapTimer);
    pendingTimelineTapTimer=null;
    document.querySelectorAll('.timeline-pending-dot').forEach(dot=>dot.remove());
    pendingTimelineTap=null;
  }

  function systemDark(){
    return matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function isDark(){
    return settings.theme==='dark'||(settings.theme==='system'&&systemDark());
  }

  function rgba(hex,a){
    const n=parseInt(String(hex).replace('#',''),16)||0;
    return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
  }

  function cfg(){
    return isDark()?DARK:LIGHT;
  }

  function hydrate(){
    document.querySelectorAll('[data-icon]').forEach(holder=>{
      const name=holder.dataset.icon;
      const body=window.REGISTRO_NAV_ICONS?.[name];
      if(body) holder.innerHTML=`<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
    });
  }

  const bar=document.querySelector('.tab-bar');
  const bubble=document.querySelector('.tab-bubble');

  function renderTabBar(){
    if(!bar||!bubble)return;
    const c=cfg();
    const tabs=[...bar.querySelectorAll('.tab-item')];
    const count=Math.max(1,tabs.length);
    const idx=Math.max(0,tabs.findIndex(t=>t.classList.contains('selected')));
    const dur=c.animationDuration;
    const curve=CURVES[c.easing]||CURVES.ios;

    bar.style.gridTemplateColumns=`repeat(${count},minmax(0,1fr))`;
    bar.style.width=`min(${c.barWidth}%,456px)`;
    bar.style.height=`${c.barHeight}px`;
    bar.style.bottom=`calc(${c.bottomOffset}px + env(safe-area-inset-bottom))`;
    bar.style.padding=`${c.barPadding}px`;
    bar.style.borderRadius=`${c.barRadius}px`;
    bar.style.background=rgba(c.barColor,c.barOpacity);
    bar.style.border=`${c.barBorderWidth}px solid ${rgba(c.barBorderColor,c.barBorderOpacity)}`;
    bar.style.backdropFilter=`blur(${c.blur}px) saturate(${c.saturation}%) brightness(${c.brightness}%)`;
    bar.style.webkitBackdropFilter=bar.style.backdropFilter;
    bar.style.boxShadow=`0 ${c.shadowY}px ${c.shadowBlur}px ${c.shadowSpread}px ${rgba(c.shadowColor,c.shadowOpacity)}`;

    requestAnimationFrame(()=>{
      const innerW=Math.max(0,bar.clientWidth-c.barPadding*2);
      const innerH=Math.max(0,bar.clientHeight-c.barPadding*2);
      const cell=innerW/count;
      const w=cell*c.bubbleWidth;
      const h=innerH*c.bubbleHeight;
      const left=c.barPadding+idx*cell+(cell-w)/2;
      const top=c.barPadding+(innerH-h)/2;

      Object.assign(bubble.style,{
        left:`${left}px`,
        top:`${top}px`,
        bottom:'auto',
        width:`${w}px`,
        height:`${h}px`,
        transform:'none',
        borderRadius:`${c.bubbleRadius}px`,
        background:rgba(c.bubbleColor,c.bubbleOpacity),
        border:`${c.bubbleBorderWidth}px solid ${rgba(c.bubbleBorderColor,c.bubbleBorderOpacity)}`,
        boxShadow:`0 ${c.bubbleShadowY}px ${c.bubbleShadowBlur}px ${rgba('#000000',c.bubbleShadowOpacity)}`,
        transition:`left ${dur}ms ${curve},top ${dur}ms ${curve},width ${dur}ms ${curve},height ${dur}ms ${curve},background-color ${dur}ms ${curve}`
      });
    });

    tabs.forEach((tab,i)=>{
      const active=i===idx;
      const icon=tab.querySelector(':scope > span');
      const label=tab.querySelector('small');

      tab.style.color=active?c.activeColor:c.inactiveColor;
      tab.style.opacity=String(active?1:c.inactiveOpacity);
      tab.style.gap=`${c.itemGap}px`;
      tab.style.transition=`color ${dur}ms ${curve},opacity ${dur}ms ${curve},transform ${Math.min(dur,220)}ms ease`;

      if(icon){
        icon.style.width=`${c.iconSize}px`;
        icon.style.height=`${c.iconSize}px`;
        icon.style.transform=`translateY(${c.iconY}px) scale(${active?c.activeScale:1})`;
        icon.style.transition=`transform ${dur}ms ${curve}`;
      }

      if(label){
        label.style.display='block';
        label.style.fontSize=`${c.textSize}px`;
        label.style.fontWeight=String(c.textWeight);
      }
    });
  }

  function paintSettings(){
    const themeChoices=['light','system','dark'];
    const visualChoices=['optimized','ultra'];

    const themeSegment=document.querySelector('.theme-mode-segment');
    const visualPicker=document.querySelector('.visual-style-picker');

    if(themeSegment){
      themeSegment.dataset.selectedIndex=String(Math.max(0,themeChoices.indexOf(settings.theme)));
    }

    if(visualPicker){
      visualPicker.dataset.selectedIndex=String(Math.max(0,visualChoices.indexOf(settings.visualStyle)));
    }

    document.querySelectorAll('[data-theme-choice]').forEach(button=>{
      const selected=button.dataset.themeChoice===settings.theme;
      button.classList.toggle('selected',selected);
      button.setAttribute('aria-pressed',String(selected));
    });

    document.querySelectorAll('[data-visual-style-mode]').forEach(button=>{
      const selected=button.dataset.visualStyleMode===settings.visualStyle;
      button.classList.toggle('selected',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
  }

  function applyPreferences(){
    document.documentElement.dataset.theme=settings.theme;
    document.documentElement.dataset.visualStyle=settings.visualStyle;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',isDark()?'#000000':'#F2F2F6');
    paintSettings();
    renderTabBar();
  }

  function formatEventDate(value){
    const date=new Date(value);
    if(Number.isNaN(date.getTime()))return '';
    return new Intl.DateTimeFormat('pt-BR',{
      day:'2-digit',month:'2-digit',year:'2-digit',
      hour:'2-digit',minute:'2-digit'
    }).format(date);
  }

  function updateEventSummary(){
    const summary=document.getElementById('eventSummary');
    if(!summary)return;
    if(!events.length){
      summary.textContent='Nenhum evento salvo ainda.';
      return;
    }
    const latest=[...events].sort((a,b)=>new Date(b.at)-new Date(a.at))[0];
    summary.textContent=`${events.length} ${events.length===1?'evento salvo':'eventos salvos'} • último: ${latest.title} — ${formatEventDate(latest.at)}`;
  }

  const DAY_MS=86400000;
  const TIMELINE_BASE_HEIGHT=720;
  const COLLISION_MINUTES=24;
  const COLLAPSED_SLEEP_HEIGHT=64;
  const COLLAPSE_ICON=`<svg viewBox="0 0 20.7578 20.3672" aria-hidden="true"><path d="M10.1719 20.3516C15.7891 20.3516 20.3516 15.7969 20.3516 10.1797C20.3516 4.5625 15.7891 0 10.1719 0C4.55469 0 0 4.5625 0 10.1797C0 15.7969 4.55469 20.3516 10.1719 20.3516ZM10.1719 18.8984C5.35156 18.8984 1.45312 15 1.45312 10.1797C1.45312 5.35938 5.35156 1.46094 10.1719 1.46094C14.9922 1.46094 18.8906 5.35938 18.8906 10.1797C18.8906 15 14.9922 18.8984 10.1719 18.8984Z" fill="currentColor" fill-opacity="0.85"/><path d="M5.8125 9.97656L9.26562 9.97656C9.70312 9.97656 9.96875 9.76562 9.96875 9.26562L9.96875 5.8125C9.96875 5.46875 9.69531 5.19531 9.35938 5.19531C9.01562 5.19531 8.74219 5.46875 8.74219 5.8125L8.74219 6.375L8.82812 8.03125L6.0625 5.16406C5.80469 4.89844 5.39062 4.89844 5.14062 5.15625C4.88281 5.40625 4.89062 5.82812 5.14844 6.07031L8 8.83594L6.41406 8.75L5.8125 8.75C5.47656 8.75 5.20312 9.02344 5.20312 9.35938C5.20312 9.70312 5.47656 9.97656 5.8125 9.97656ZM10.9688 15.1406C11.3047 15.1406 11.5859 14.8672 11.5859 14.5312L11.5859 13.9688L11.5 12.3125L14.2656 15.1797C14.5234 15.4453 14.9375 15.4453 15.1875 15.1875C15.4453 14.9297 15.4375 14.5078 15.1797 14.2656L12.3281 11.5078L13.9141 11.5859L14.5078 11.5938C14.8516 11.5938 15.125 11.3203 15.125 10.9766C15.125 10.6406 14.8516 10.3672 14.5078 10.3672L11.0625 10.3672C10.625 10.3672 10.3594 10.5703 10.3594 11.0703L10.3594 14.5312C10.3594 14.8672 10.6328 15.1406 10.9688 15.1406Z" fill="currentColor" fill-opacity="0.85"/></svg>`;
  const EXPAND_ICON=`<svg viewBox="0 0 20.7578 20.3672" aria-hidden="true"><path d="M20.3516 10.1797C20.3516 15.7812 15.7812 20.3516 10.1719 20.3516C4.57031 20.3516 0 15.7812 0 10.1797C0 4.57031 4.57031 0 10.1719 0C15.7812 0 20.3516 4.57031 20.3516 10.1797ZM14.0703 10.9922L14.0703 11.5781L14.1562 13.3047L11.7266 10.7656C11.4531 10.4766 11.0078 10.4844 10.7422 10.7578C10.4688 11.0312 10.4766 11.4844 10.75 11.7422L13.2656 14.1641L11.6172 14.0859L10.9922 14.0781C10.625 14.0781 10.3359 14.3672 10.3359 14.7344C10.3359 15.0938 10.625 15.3828 10.9922 15.3828L14.6172 15.3828C15.0938 15.3828 15.375 15.1641 15.375 14.6328L15.375 10.9922C15.375 10.625 15.0859 10.3359 14.7266 10.3359C14.3594 10.3359 14.0703 10.625 14.0703 10.9922ZM5.72656 4.97656C5.25 4.97656 4.96875 5.20312 4.96875 5.73438L4.96875 9.375C4.96875 9.73438 5.25781 10.0234 5.625 10.0234C5.98438 10.0234 6.27344 9.73438 6.27344 9.375L6.27344 8.78906L6.19531 7.05469L8.625 9.59375C8.89844 9.88281 9.33594 9.875 9.60938 9.60156C9.875 9.33594 9.86719 8.88281 9.60156 8.61719L7.07812 6.19531L8.73438 6.28125L9.35938 6.28125C9.71875 6.28125 10.0078 5.99219 10.0078 5.63281C10.0078 5.26562 9.71875 4.97656 9.35938 4.97656Z" fill="currentColor" fill-opacity="0.85"/></svg>`;
  const SLEEP_ICON=`<svg viewBox="0 0 19.3281 23.8828" aria-hidden="true"><path d="M14.2891 4.1875L11.9609 4.1875L11.9609 4.13281L14.3281 1.03125C14.5234.78125 14.6016.632812 14.6016.460938C14.6016.171875 14.375 0 14.0703 0L10.9453 0C10.6719 0 10.4688.1875 10.4688.453125C10.4688.742188 10.6719.921875 10.9453.921875L13.1484.921875L13.1484.976562L10.7578 4.07031C10.5703 4.32031 10.4922 4.45312 10.4922 4.64844C10.4922 4.92188 10.7031 5.10938 11.0078 5.10938L14.2891 5.10938C14.5625 5.10938 14.7578 4.92969 14.7578 4.64062C14.7578 4.375 14.5625 4.1875 14.2891 4.1875ZM18.875 7.98438L17.1641 7.98438L17.1641 7.9375L18.9141 5.66406C19.0938 5.42969 19.1719 5.28906 19.1719 5.11719C19.1719 4.84375 18.9531 4.67188 18.6641 4.67188L16.2266 4.67188C15.9688 4.67188 15.7734 4.85156 15.7734 5.10938C15.7734 5.39062 15.9688 5.5625 16.2266 5.5625L17.7891 5.5625L17.7891 5.60156L16.0469 7.875C15.875 8.10156 15.8047 8.24219 15.8047 8.42969C15.8047 8.6875 16 8.86719 16.2891 8.86719L18.875 8.86719C19.1406 8.86719 19.3281 8.69531 19.3281 8.42969C19.3281 8.16406 19.1406 7.98438 18.875 7.98438ZM14.5234 11.3438L13.0859 11.3438L13.0859 11.3047L14.5547 9.375C14.7266 9.14062 14.8047 9.01562 14.8047 8.85156C14.8047 8.58594 14.5938 8.42969 14.3203 8.42969L12.1953 8.42969C11.9453 8.42969 11.7578 8.60156 11.7578 8.84375C11.7578 9.10938 11.9453 9.27344 12.1953 9.27344L13.4844 9.27344L13.4844 9.3125L12.0234 11.2422C11.8594 11.4609 11.7812 11.5859 11.7812 11.7734C11.7812 12.0156 11.9766 12.1953 12.25 12.1953L14.5234 12.1953C14.7734 12.1953 14.9453 12.0234 14.9453 11.7656C14.9453 11.5156 14.7734 11.3438 14.5234 11.3438Z" fill="currentColor"/><path d="M8.71875 22.6172C12.2891 22.6172 15.2188 20.4609 16.4922 17.6562C16.7422 17.1562 16.4297 16.8125 15.9375 16.9688C15.3516 17.1797 14.3203 17.4141 13.2812 17.4141C8.30469 17.4141 5.46094 14.5703 5.46094 9.57812C5.46094 8.58594 5.67188 7.57031 5.99219 6.76562C6.21094 6.22656 5.84375 5.90625 5.32812 6.13281C2.55469 7.3125.132812 10.2656.132812 14.0234C.132812 18.7656 3.97656 22.6172 8.71875 22.6172Z" fill="currentColor"/></svg>`;

  function startOfLocalDay(date=new Date()){
    return new Date(date.getFullYear(),date.getMonth(),date.getDate());
  }

  function dayKey(date){
    const pad=n=>String(n).padStart(2,'0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  }

  function eventsForDay(date){
    const key=dayKey(date);
    return events
      .filter(event=>{
        const at=new Date(event.at);
        return !Number.isNaN(at.getTime())&&dayKey(at)===key;
      })
      .sort((a,b)=>new Date(a.at)-new Date(b.at));
  }

  function minutesOfDay(value){
    const date=new Date(value);
    return date.getHours()*60+date.getMinutes()+date.getSeconds()/60;
  }

  function formatTime(value){
    const date=new Date(value);
    return new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(date);
  }

  function formatElapsedDuration(milliseconds){
    const totalMinutes=Math.max(0,Math.round(milliseconds/60000));
    if(totalMinutes<1)return 'menos de 1 min';
    const hours=Math.floor(totalMinutes/60);
    const minutes=totalMinutes%60;
    if(hours&&minutes)return `${hours} h ${minutes} min`;
    if(hours)return `${hours} h`;
    return `${minutes} min`;
  }

  function formatDayTitle(date){
    const today=startOfLocalDay();
    const target=startOfLocalDay(date);
    const delta=Math.round((today-target)/DAY_MS);
    if(delta===0)return 'Hoje';
    if(delta===1)return 'Ontem';
    return new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long'}).format(date);
  }

  function escapeHtml(value=''){
    return String(value).replace(/[&<>"']/g,char=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
    })[char]);
  }

  function eventKind(event){
    if(event.type==='sleep_start')return {icon:'☾',label:'Início do sono'};
    if(event.type==='sleep_end')return {icon:'☀︎',label:'Acordei'};
    return null;
  }

  function normalizeEventType(type){
    return ['event','sleep_start','sleep_end'].includes(type)?type:'event';
  }

  function isSleepType(type){
    return normalizeEventType(type)!=='event';
  }

  function titleForEventType(type){
    return type==='sleep_start'?'Vou dormir':type==='sleep_end'?'Acordei':'';
  }

  function hasValidSleepSequence(items){
    let open=false;
    for(const event of [...items].sort((a,b)=>new Date(a.at)-new Date(b.at))){
      const type=normalizeEventType(event.type);
      if(type==='sleep_start'){
        if(open)return false;
        open=true;
      }else if(type==='sleep_end'){
        if(!open)return false;
        open=false;
      }
    }
    return true;
  }

  function activeSleepStart(){
    let open=null;
    [...events].sort((a,b)=>new Date(a.at)-new Date(b.at)).forEach(event=>{
      if(event.type==='sleep_start')open=event;
      if(event.type==='sleep_end'&&open&&new Date(event.at)>=new Date(open.at))open=null;
    });
    return open;
  }

  function sleepIntervalsForDay(date){
    const dayStart=startOfLocalDay(date);
    const dayEnd=new Date(dayStart); dayEnd.setDate(dayEnd.getDate()+1);
    const sorted=[...events].sort((a,b)=>new Date(a.at)-new Date(b.at));
    const intervals=[];
    let start=null;
    sorted.forEach(event=>{
      if(event.type==='sleep_start')start={at:new Date(event.at),id:event.id};
      if(event.type==='sleep_end'&&start){
        const end=new Date(event.at);
        if(end>start.at){
          const from=new Date(Math.max(start.at.getTime(),dayStart.getTime()));
          const to=new Date(Math.min(end.getTime(),dayEnd.getTime()));
          if(to>from)intervals.push({from,to,id:`${start.id}:${event.id}`,startEventId:start.id,endEventId:event.id});
        }
        start=null;
      }
    });
    if(start){
      const end=new Date();
      const from=new Date(Math.max(start.at.getTime(),dayStart.getTime()));
      const to=new Date(Math.min(end.getTime(),dayEnd.getTime()));
      if(to>from)intervals.push({from,to,id:`${start.id}:active`,startEventId:start.id,active:true});
    }
    return intervals;
  }

  function renderSleepActions(){
    const sleeping=!!activeSleepStart();
    const startButton=document.getElementById('sleepStartButton');
    const endButton=document.getElementById('sleepEndButton');
    if(startButton)startButton.hidden=sleeping;
    if(endButton)endButton.hidden=!sleeping;
  }

  function addSleepEvent(type){
    const sleeping=activeSleepStart();
    if(type==='sleep_start'&&sleeping){toast('Já existe um sono em andamento.');return;}
    if(type==='sleep_end'&&!sleeping){toast('Não há um sono em andamento.');return;}
    const now=new Date();
    events.push({
      id:(crypto.randomUUID?.()||`evt-${Date.now()}-${Math.random().toString(16).slice(2)}`),
      type,
      title:type==='sleep_start'?'Vou dormir':'Acordei',
      at:now.toISOString(),
      notes:'',
      createdAt:now.toISOString()
    });
    events.sort((a,b)=>new Date(a.at)-new Date(b.at));
    saveEvents();
    updateEventSummary();
    renderChronology();
    renderSleepActions();
    toast(type==='sleep_start'?`Início do sono registrado às ${formatTime(now)}.`:`Acordei registrado às ${formatTime(now)}.`);
  }

  function sleepCollapseKey(interval,date){
    return `${interval.id}:${dayKey(date)}`;
  }

  function intervalHasOtherEvents(interval){
    return events.some(event=>{
      if(event.id===interval.startEventId||event.id===interval.endEventId)return false;
      const at=new Date(event.at);
      return at>interval.from&&at<interval.to;
    });
  }

  function buildTimelineLayout(date,height,intervals){
    const dayStart=startOfLocalDay(date);
    const collapsed=settings.collapsedSleepIntervals||{};
    let removed=0;
    const bands=intervals.map(interval=>{
      const fromMinutes=(interval.from-dayStart)/60000;
      const toMinutes=(interval.to-dayStart)/60000;
      const naturalHeight=((toMinutes-fromMinutes)/1440)*height;
      const key=sleepCollapseKey(interval,date);
      const canCollapse=!interval.active&&!intervalHasOtherEvents(interval)&&naturalHeight>COLLAPSED_SLEEP_HEIGHT+12;
      const isCollapsed=canCollapse&&Boolean(collapsed[key]);
      const bandHeight=isCollapsed?COLLAPSED_SLEEP_HEIGHT:naturalHeight;
      const top=(fromMinutes/1440)*height-removed;
      if(isCollapsed)removed+=naturalHeight-bandHeight;
      return {...interval,fromMinutes,toMinutes,key,canCollapse,isCollapsed,top,bandHeight};
    });
    const yForMinutes=minutes=>{
      let shift=0;
      for(const band of bands){
        if(!band.isCollapsed)continue;
        if(minutes>=band.toMinutes){
          shift+=((band.toMinutes-band.fromMinutes)/1440)*height-band.bandHeight;
        }else if(minutes>band.fromMinutes){
          return band.top+((minutes-band.fromMinutes)/(band.toMinutes-band.fromMinutes))*band.bandHeight;
        }
      }
      return (minutes/1440)*height-shift;
    };
    const minutesForY=y=>{
      let low=0,high=1440;
      for(let i=0;i<28;i++){
        const middle=(low+high)/2;
        if(yForMinutes(middle)<y)low=middle;
        else high=middle;
      }
      return (low+high)/2;
    };
    return {bands,yForMinutes,minutesForY,height:height-removed};
  }

  function renderTimeline(target,date,{zoom=1,compact=false,throughNow=false}={}){
    if(!target)return;
    const currentDay=throughNow&&dayKey(date)===dayKey(new Date());
    const endMinutes=currentDay?Math.max(1,minutesOfDay(new Date())):1440;
    const scaleMinutes=1440;
    const dayEvents=eventsForDay(date).filter(event=>!currentDay||minutesOfDay(event.at)<=endMinutes);
    const height=Math.round(TIMELINE_BASE_HEIGHT*zoom);
    const sleepLayout=buildTimelineLayout(date,height,sleepIntervalsForDay(date));
    let collisionRun=0;
    let previousMinutes=-Infinity;

    const sleepMarkup=sleepLayout.bands.map(interval=>{
      const duration=formatElapsedDuration(interval.to-interval.from);
      const toggle=interval.canCollapse?`<button class="sleep-interval-toggle" type="button" data-sleep-toggle="${escapeHtml(interval.key)}" aria-label="${interval.isCollapsed?'Expandir':'Encolher'} período de sono">${interval.isCollapsed?EXPAND_ICON:COLLAPSE_ICON}</button>`:'';
      const sleepCard=interval.canCollapse?`<div class="sleep-collapsed-copy"><strong>Dormi ${duration}</strong>${toggle}</div>`:'';
      const compact=sleepCard;
      return `<div class="sleep-interval${interval.active?' active':''}${interval.isCollapsed?' collapsed':''}" style="top:${interval.top}px;height:${Math.max(2,interval.bandHeight)}px" aria-label="Período de sono de ${duration}">${compact}</div>`;
    }).join('');

    const visibleDayEvents=dayEvents;

    const eventMarkup=visibleDayEvents.map(event=>{
      const minute=minutesOfDay(event.at);
      collisionRun=minute-previousMinutes<COLLISION_MINUTES?collisionRun+1:0;
      previousMinutes=minute;
      const side=collisionRun%2===0?'right':'left';
      const top=sleepLayout.yForMinutes(minute);
      const kind=eventKind(event);
      const kindMarkup=kind?`<span class="timeline-event-kind" aria-hidden="true">${kind.icon}</span>`:'';
      const kindLabel=kind?`, ${kind.label}`:'';
      return `<button class="timeline-event side-${side}" type="button" data-event-id="${escapeHtml(event.id)}" style="top:${top}px" aria-label="${escapeHtml(event.title)}, ${formatTime(event.at)}${kindLabel}">
        <span class="timeline-event-dot" aria-hidden="true"></span>
        <span class="timeline-event-copy">
          <time>${formatTime(event.at)}</time>
          ${kindMarkup}
          <strong>${escapeHtml(event.title)}</strong>
        </span>
      </button>`;
    }).join('');

    const gapMarkup=visibleDayEvents.slice(1).map((event,index)=>{
      const previous=visibleDayEvents[index];
      const previousAt=new Date(previous.at);
      const currentAt=new Date(event.at);
      const elapsed=currentAt-previousAt;
      if(!(elapsed>0))return '';
      if(previous.type==='sleep_start'&&event.type==='sleep_end')return '';
      const previousMinute=minutesOfDay(previous.at);
      const currentMinute=minutesOfDay(event.at);
      const hasCollapsedSleepBetween=sleepLayout.bands.some(interval=>interval.isCollapsed&&previousMinute<=interval.fromMinutes&&currentMinute>=interval.toMinutes);
      if(hasCollapsedSleepBetween)return '';
      const top=sleepLayout.yForMinutes((previousMinute+currentMinute)/2);
      const label=formatElapsedDuration(elapsed);
      return `<div class="timeline-gap" style="top:${top}px" aria-label="${escapeHtml(label)} entre ${escapeHtml(previous.title)} e ${escapeHtml(event.title)}"><span class="timeline-gap-value">${escapeHtml(label)}</span></div>`;
    }).join('');

    const hourLabels=[0,6,12,18,24].filter(hour=>hour*60<=scaleMinutes).map(hour=>{
      const minute=hour*60;
      if(sleepLayout.bands.some(interval=>interval.isCollapsed&&minute>interval.fromMinutes&&minute<interval.toMinutes))return '';
      const top=sleepLayout.yForMinutes(minute);
      const label=hour===24?'24:00':`${String(hour).padStart(2,'0')}:00`;
      return `<span class="timeline-hour" style="top:${top}px">${label}</span>`;
    }).join('');

    target.innerHTML=`<article class="day-timeline-card${compact?' compact':''}${currentDay?' current-day':''}" data-day="${dayKey(date)}">
      <div class="timeline-canvas" style="height:${sleepLayout.height}px">
        <div class="timeline-axis" aria-hidden="true"></div>
        ${sleepMarkup}
        ${hourLabels}
        ${gapMarkup}
        ${eventMarkup}
        ${dayEvents.length?'':`<div class="timeline-empty">Nenhum registro neste dia</div>`}
      </div>
    </article>`;

    target.querySelectorAll('[data-event-id]').forEach(button=>{
      button.addEventListener('click',()=>openEventDetails(button.dataset.eventId));
    });
    target.querySelectorAll('[data-sleep-toggle]').forEach(button=>{
      button.addEventListener('click',()=>{
        const key=button.dataset.sleepToggle;
        settings.collapsedSleepIntervals={...(settings.collapsedSleepIntervals||{}),[key]:!(settings.collapsedSleepIntervals||{})[key]};
        saveSettings();
        renderChronology();
      });
    });
    const canvas=target.querySelector('.timeline-canvas');
    if(canvas){
      canvas.addEventListener('click',event=>{
        if(event.target.closest('button,.sleep-interval-toggle,.timeline-pending-dot'))return;
        const rect=canvas.getBoundingClientRect();
        const axisX=rect.left+rect.width*.41;
        if(Math.abs(event.clientX-axisX)>28)return;
        const y=Math.max(0,Math.min(sleepLayout.height,event.clientY-rect.top));
        const minutes=Math.max(0,Math.min(1439,Math.round(sleepLayout.minutesForY(y))));
        clearPendingTimelineTap();
        const dot=document.createElement('button');
        dot.type='button';
        dot.className='timeline-pending-dot';
        dot.setAttribute('aria-label','Criar evento neste horário');
        dot.style.top=`${sleepLayout.yForMinutes(minutes)}px`;
        dot.addEventListener('click',event2=>{
          event2.stopPropagation();
          clearPendingTimelineTap();
          const initialDate=new Date(date);
          initialDate.setHours(0,0,0,0);
          initialDate.setMinutes(minutes);
          openEventSheet(initialDate);
        });
        canvas.appendChild(dot);
        pendingTimelineTap={canvas,minutes};
        pendingTimelineTapTimer=setTimeout(clearPendingTimelineTap,5000);
      });
    }
  }

  function renderHomeTimelines(){
    const today=startOfLocalDay();
    const yesterday=new Date(today);
    yesterday.setDate(yesterday.getDate()-1);
    renderTimeline(document.getElementById('todayTimeline'),today,{zoom:timelineZoom,throughNow:true});
    renderTimeline(document.getElementById('yesterdayTimeline'),yesterday,{zoom:1,compact:true});
    document.querySelectorAll('[data-timeline-zoom]').forEach(button=>{
      button.classList.toggle('selected',Number(button.dataset.timelineZoom)===timelineZoom);
    });
  }

  function renderHistory(){
    const list=document.getElementById('historyList');
    if(!list)return;
    const today=startOfLocalDay();
    const validDates=events.map(event=>new Date(event.at)).filter(date=>!Number.isNaN(date.getTime()));
    const earliest=validDates.length
      ? startOfLocalDay(new Date(Math.min(...validDates.map(date=>date.getTime()))))
      : null;
    const dates=[];
    if(earliest&&earliest<today){
      const cursor=new Date(earliest);
      while(cursor<today){
        dates.push(new Date(cursor));
        cursor.setDate(cursor.getDate()+1);
      }
    }

    const count=document.getElementById('historyCount');
    if(count)count.textContent=dates.length?`${dates.length} ${dates.length===1?'dia':'dias'}`:'';

    if(!dates.length){
      list.innerHTML='<div class="history-empty">Quando existir um primeiro registro, todos os dias seguintes aparecerão aqui — inclusive os dias totalmente vazios.</div>';
      return;
    }

    list.innerHTML=dates.map(date=>`<section class="history-day">
      <button class="history-day-button" type="button" data-history-day="${dayKey(date)}" aria-expanded="false">
        <span>${escapeHtml(formatDayTitle(date))}</span>
        <small>${eventsForDay(date).length} ${eventsForDay(date).length===1?'evento':'eventos'}</small>
      </button>
      <div class="history-day-timeline" data-history-timeline="${dayKey(date)}" hidden></div>
    </section>`).join('');

    list.querySelectorAll('[data-history-day]').forEach(button=>{
      button.addEventListener('click',()=>{
        const key=button.dataset.historyDay;
        const holder=list.querySelector(`[data-history-timeline="${key}"]`);
        const opening=holder.hidden;
        holder.hidden=!opening;
        button.setAttribute('aria-expanded',String(opening));
        if(opening&&!holder.dataset.rendered){
          renderTimeline(holder,new Date(`${key}T12:00:00`),{zoom:1});
          holder.dataset.rendered='true';
        }
      });
    });
  }

  function renderChronology(){
    renderHomeTimelines();
    renderHistory();
    renderSleepActions();
  }

  let chronologyPositioned=false;
  function scrollToPresent(force=false){
    if(chronologyPositioned&&!force)return;
    requestAnimationFrame(()=>{
      window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'});
      chronologyPositioned=true;
    });
  }

  function openEventDetails(id){
    const event=events.find(item=>item.id===id);
    if(!event)return;
    selectedEventId=id;
    const sheet=document.getElementById('eventDetailsSheet');
    if(!sheet)return;
    document.getElementById('eventDetailsTitle').textContent=event.title;
    document.getElementById('eventDetailsTime').textContent=formatEventDate(event.at);
    const notes=document.getElementById('eventDetailsNotes');
    notes.textContent=event.notes||'Sem descrição adicional.';
    notes.classList.toggle('muted',!event.notes);
    const kind=eventKind(event);
    const kindWrap=document.getElementById('eventDetailsKind');
    if(kindWrap){
      kindWrap.hidden=!kind;
      document.getElementById('eventDetailsKindIcon').textContent=kind?.icon||'';
      document.getElementById('eventDetailsKindLabel').textContent=kind?.label||'';
    }
    const actions=document.getElementById('eventDetailActions');
    if(actions)actions.hidden=false;
    sheet.hidden=false;
  }

  function closeEventDetails(){
    selectedEventId=null;
    const sheet=document.getElementById('eventDetailsSheet');
    if(sheet)sheet.hidden=true;
  }

  function toLocalDateTimeValue(date=new Date()){
    const pad=n=>String(n).padStart(2,'0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  const eventSheet=document.getElementById('eventSheet');
  const eventTypeInput=document.getElementById('eventTypeInput');
  const eventTitleInput=document.getElementById('eventTitleInput');
  const eventDateTimeInput=document.getElementById('eventDateTimeInput');
  const eventNotesInput=document.getElementById('eventNotesInput');

  function setEventFormType(type,{preserveGeneralTitle=true}={}){
    const normalized=normalizeEventType(type);
    const wasSleep=isSleepType(eventTypeInput?.dataset.previousType);
    if(eventTypeInput)eventTypeInput.value=normalized;
    if(!eventTitleInput)return;
    if(isSleepType(normalized)){
      if(!wasSleep&&preserveGeneralTitle)eventTitleInput.dataset.generalTitle=eventTitleInput.value;
      eventTitleInput.value=titleForEventType(normalized);
      eventTitleInput.disabled=true;
    }else{
      eventTitleInput.disabled=false;
      eventTitleInput.value=eventTitleInput.dataset.generalTitle||'';
      eventTitleInput.placeholder='O que aconteceu?';
    }
    if(eventTypeInput)eventTypeInput.dataset.previousType=normalized;
  }

  function openEventSheet(initialDate=null){
    if(!eventSheet)return;
    editingEventId=null;
    document.getElementById('eventSheetTitle').textContent='Novo evento';
    eventTitleInput.dataset.generalTitle='';
    eventTitleInput.value='';
    setEventFormType('event',{preserveGeneralTitle:false});
    eventDateTimeInput.value=toLocalDateTimeValue(initialDate||new Date());
    eventNotesInput.value='';
    eventSheet.hidden=false;
    requestAnimationFrame(()=>eventTitleInput.focus());
  }

  function closeEventSheet(){
    editingEventId=null;
    if(eventSheet)eventSheet.hidden=true;
  }

  function openEditEventSheet(){
    const event=events.find(item=>item.id===selectedEventId);
    if(!event)return;
    editingEventId=event.id;
    document.getElementById('eventSheetTitle').textContent='Editar evento';
    eventTitleInput.dataset.generalTitle=normalizeEventType(event.type)==='event'?event.title:'';
    eventTitleInput.value=event.title;
    setEventFormType(event.type,{preserveGeneralTitle:false});
    eventDateTimeInput.value=toLocalDateTimeValue(new Date(event.at));
    eventNotesInput.value=event.notes||'';
    closeEventDetails();
    eventSheet.hidden=false;
    requestAnimationFrame(()=>eventTitleInput.focus());
  }

  let toastTimer=null;
  function toast(message){
    const el=document.getElementById('appToast');
    if(!el)return;
    el.textContent=message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>el.classList.remove('show'),2200);
  }

  function createEvent(){
    const type=normalizeEventType(eventTypeInput?.value);
    const title=isSleepType(type)?titleForEventType(type):(eventTitleInput?.value.trim()||'');
    const rawDate=eventDateTimeInput?.value||'';
    if(!title){
      eventTitleInput?.focus();
      toast('Digite o nome do evento.');
      return;
    }
    const at=new Date(rawDate);
    if(Number.isNaN(at.getTime())){
      toast('Escolha uma data e hora válidas.');
      return;
    }
    const existing=editingEventId&&events.find(item=>item.id===editingEventId);
    const candidate=existing
      ? events.map(item=>item.id===existing.id?{...item,title,type,at:at.toISOString()}:item)
      : [...events,{id:'candidate',type,at:at.toISOString()}];
    if(!hasValidSleepSequence(candidate)){
      toast('Esse tipo deixaria o sono inválido. Use a sequência Dormi → Acordei.');
      return;
    }
    if(existing){
      existing.title=title;
      existing.type=type;
      existing.at=at.toISOString();
      existing.notes=eventNotesInput?.value.trim()||'';
    }else{
      events.push({
        id:(crypto.randomUUID?.()||`evt-${Date.now()}-${Math.random().toString(16).slice(2)}`),
        type,
        title,
        at:at.toISOString(),
        notes:eventNotesInput?.value.trim()||'',
        createdAt:new Date().toISOString()
      });
    }
    events.sort((a,b)=>new Date(a.at)-new Date(b.at));
    saveEvents();
    updateEventSummary();
    renderChronology();
    closeEventSheet();
    toast(existing?'Evento atualizado.':'Evento salvo.');
  }

  function deleteSelectedEvent(){
    const event=events.find(item=>item.id===selectedEventId);
    if(!event)return;
    const sleepWarning=event.type==='sleep_start'||event.type==='sleep_end'
      ? '\n\nO período de sono será recalculado.'
      : '';
    if(!confirm(`Excluir “${event.title}”?${sleepWarning}`))return;
    events=events.filter(item=>item.id!==event.id);
    saveEvents();
    updateEventSummary();
    renderChronology();
    closeEventDetails();
    toast('Evento excluído.');
  }

  async function exportBackup(){
    const backup={
      app:'Crono',
      backupVersion:1,
      exportedAt:new Date().toISOString(),
      release:RELEASE.version,
      data:{
        events,
        settings
      }
    };
    const json=JSON.stringify(backup,null,2);
    const date=new Date();
    const pad=n=>String(n).padStart(2,'0');
    const fileName=`crono-backup-${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.json`;
    const file=new File([json],fileName,{type:'application/json'});

    try{
      if(navigator.canShare?.({files:[file]})&&navigator.share){
        await navigator.share({files:[file],title:'Backup do Crono'});
        toast('Backup preparado.');
        return;
      }
    }catch(error){
      if(error?.name==='AbortError')return;
    }

    const url=URL.createObjectURL(file);
    const link=document.createElement('a');
    link.href=url;
    link.download=fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('Backup exportado.');
  }

  async function importBackupFile(file){
    if(!file)return;
    try{
      const text=await file.text();
      const backup=JSON.parse(text);
      if(backup?.app!=='Crono'||backup?.backupVersion!==1||!backup?.data||!Array.isArray(backup.data.events)){
        throw new Error('Formato inválido');
      }
      const importedEvents=backup.data.events.filter(event=>
        event&&typeof event.title==='string'&&typeof event.at==='string'
      );
      if(!confirm(`Importar este backup? Os dados atuais serão substituídos por ${importedEvents.length} evento(s).`)){
        return;
      }
      events=importedEvents;
      settings={...DEFAULTS,...(backup.data.settings||{})};
      saveEvents();
      saveSettings();
      applyPreferences();
      updateEventSummary();
      renderChronology();
      toast('Backup importado.');
    }catch(error){
      console.error(error);
      toast('Backup inválido ou não pôde ser lido.');
    }
  }

  async function checkForUpdate(){
    const button=document.getElementById('checkUpdateButton');
    if(button){button.disabled=true;button.classList.add('is-checking');}
    try{
      const response=await fetch(`./latest.json?check=${Date.now()}`,{cache:'no-store'});
      if(!response.ok)throw new Error('Não foi possível consultar a versão.');
      const latest=await response.json();
      const registrations=await navigator.serviceWorker?.getRegistrations?.()||[];
      await Promise.all(registrations.map(registration=>registration.update()));
      const found=latest?.version&&latest.version!==RELEASE.version;
      toast(found?`Versão ${latest.version} encontrada. Atualizando...`:'Já está na versão mais recente. Recarregando...');
      setTimeout(()=>location.replace(`${location.pathname}?update=${Date.now()}`),550);
    }catch(error){
      console.error(error);
      toast('Não foi possível buscar atualização agora.');
      if(button){button.disabled=false;button.classList.remove('is-checking');}
    }
  }

  function switchTab(name){
    document.querySelectorAll('.view').forEach(view=>{
      view.classList.toggle('active',view.dataset.view===name);
    });
    document.querySelectorAll('.tab-item').forEach(tab=>{
      tab.classList.toggle('selected',tab.dataset.tab===name);
    });
    renderTabBar();
    if(name==='event'||name==='history')renderChronology();
    if(name==='event'||name==='history')scrollToPresent(true);
    else window.scrollTo({top:0,behavior:'instant'});
  }

  hydrate();
  applyPreferences();
  updateEventSummary();
  renderChronology();
  scrollToPresent();

  document.getElementById('createEventButton')?.addEventListener('click',openEventSheet);
  document.getElementById('sleepStartButton')?.addEventListener('click',()=>addSleepEvent('sleep_start'));
  document.getElementById('sleepEndButton')?.addEventListener('click',()=>addSleepEvent('sleep_end'));
  document.querySelectorAll('[data-timeline-zoom]').forEach(button=>{
    button.addEventListener('click',()=>{
      timelineZoom=Number(button.dataset.timelineZoom)||1;
      renderHomeTimelines();
    });
  });
  document.querySelectorAll('[data-close-event-details]').forEach(el=>el.addEventListener('click',closeEventDetails));
  document.getElementById('editEventButton')?.addEventListener('click',openEditEventSheet);
  document.getElementById('deleteEventButton')?.addEventListener('click',deleteSelectedEvent);
  document.getElementById('saveEventButton')?.addEventListener('click',createEvent);
  document.getElementById('checkUpdateButton')?.addEventListener('click',checkForUpdate);
  eventTypeInput?.addEventListener('change',()=>setEventFormType(eventTypeInput.value));
  document.querySelectorAll('[data-close-event-sheet]').forEach(el=>el.addEventListener('click',closeEventSheet));

  document.getElementById('eventTitleInput')?.addEventListener('keydown',event=>{
    if(event.key==='Enter')createEvent();
  });

  document.getElementById('exportBackupButton')?.addEventListener('click',exportBackup);

  const backupFileInput=document.getElementById('backupFileInput');
  document.getElementById('importBackupButton')?.addEventListener('click',()=>{
    backupFileInput?.click();
  });
  backupFileInput?.addEventListener('change',async()=>{
    const file=backupFileInput.files?.[0];
    await importBackupFile(file);
    backupFileInput.value='';
  });

  document.querySelectorAll('.tab-item').forEach(tab=>{
    tab.addEventListener('pointerdown',()=>{tab.style.transform=`scale(${cfg().pressScale})`});
    const release=()=>{tab.style.transform=''};
    tab.addEventListener('pointerup',release);
    tab.addEventListener('pointercancel',release);
    tab.addEventListener('click',()=>switchTab(tab.dataset.tab));
  });

  document.querySelectorAll('[data-theme-choice]').forEach(button=>{
    button.addEventListener('click',()=>{
      const choice=button.dataset.themeChoice;
      if(!['light','system','dark'].includes(choice))return;
      settings.theme=choice;
      saveSettings();
      applyPreferences();
    });
  });

  document.querySelectorAll('[data-visual-style-mode]').forEach(button=>{
    button.addEventListener('click',()=>{
      settings.visualStyle=button.dataset.visualStyleMode==='ultra'?'ultra':'optimized';
      saveSettings();
      applyPreferences();
    });
  });

  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{
    if(settings.theme==='system')applyPreferences();
  });

  window.addEventListener('resize',renderTabBar,{passive:true});
})();
