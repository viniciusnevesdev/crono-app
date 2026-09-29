(() => {
  const STORAGE_KEY='crono-settings-v1';
  const DEFAULTS={theme:'system',visualStyle:'optimized'};

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

  const SPARK=`<svg class="svg-icon rm-spark-custom" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21.7734 24.9609" width="24" height="24" aria-hidden="true" focusable="false" stroke="none">
    <g stroke="none">
      <rect height="24.9609" opacity="0" width="21.7734" x="0" y="0"/>
      <path d="M4.36719 16.25C4.17969 16.25 4.04688 16.3672 4.02344 16.5625C3.61719 19.6875 3.51562 19.7188 0.34375 20.2578C0.125 20.2891 0 20.4062 0 20.6016C0 20.7969 0.125 20.9062 0.304688 20.9375C3.5 21.5547 3.61719 21.5234 4.02344 24.625C4.04688 24.8359 4.17969 24.9609 4.36719 24.9609C4.54688 24.9609 4.6875 24.8359 4.71094 24.6328C5.13281 21.4844 5.21875 21.4375 8.42188 20.9375C8.60156 20.9141 8.72656 20.7969 8.72656 20.6016C8.72656 20.4141 8.60156 20.2891 8.42188 20.2578C5.21875 19.6406 5.14062 19.6719 4.71094 16.5469C4.6875 16.3672 4.54688 16.25 4.36719 16.25Z" fill="currentColor" fill-opacity="0.85" stroke="none"/>
      <path d="M12.2578 3.29688C11.9766 3.29688 11.7734 3.49219 11.7422 3.77344C10.8828 10.3359 10.0703 11.0547 3.64062 11.8828C3.35156 11.9141 3.14844 12.125 3.14844 12.3984C3.14844 12.6797 3.35156 12.8906 3.64062 12.9219C10.0938 13.5859 10.9531 14.4609 11.7422 21.0234C11.7734 21.3047 11.9766 21.5078 12.2578 21.5078C12.5312 21.5078 12.7422 21.3047 12.7812 21.0234C13.5781 14.4609 14.4297 13.5859 20.875 12.9219C21.1719 12.8906 21.3672 12.6797 21.3672 12.3984C21.3672 12.125 21.1719 11.9141 20.875 11.8828C14.4297 11.2109 13.5781 10.3359 12.7812 3.77344C12.7422 3.49219 12.5312 3.29688 12.2578 3.29688Z" fill="currentColor" fill-opacity="0.85" stroke="none"/>
    </g>
  </svg>`;

  function loadSettings(){
    try{
      return {...DEFAULTS,...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')};
    }catch{
      return {...DEFAULTS};
    }
  }

  let settings=loadSettings();

  function saveSettings(){
    localStorage.setItem(STORAGE_KEY,JSON.stringify(settings));
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
      if(name==='spark'){
        holder.innerHTML=SPARK;
        return;
      }
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

  function switchTab(name){
    document.querySelectorAll('.view').forEach(view=>{
      view.classList.toggle('active',view.dataset.view===name);
    });
    document.querySelectorAll('.tab-item').forEach(tab=>{
      tab.classList.toggle('selected',tab.dataset.tab===name);
    });
    renderTabBar();
    window.scrollTo({top:0,behavior:'instant'});
  }

  hydrate();
  applyPreferences();

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