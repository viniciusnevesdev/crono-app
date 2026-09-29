const icons={
  home:'<path d="M3 11.5 12 4l9 7.5"></path><path d="M5.5 10.5V20h13v-9.5"></path><path d="M9.5 20v-6h5v6"></path>',
  history:'<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"></path><path d="M3.5 5v5h5"></path><path d="M12 7.5V12l3 2"></path>',
  chart:'<path d="M4 19V10"></path><path d="M10 19V5"></path><path d="M16 19v-7"></path><path d="M22 19V8"></path>',
  settings:'<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 3.8 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2V9.6h.1A1.7 1.7 0 0 0 3.2 9a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.26 3.2l.06.06A1.7 1.7 0 0 0 8.2 3.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2h4v.1a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8c.1.4.3.75.6 1 .3.25.7.4 1.1.4h.1v4h-.1c-.4 0-.8.15-1.1.4-.3.25-.5.6-.6 1.2Z"></path>'
};

document.querySelectorAll('[data-icon]').forEach(el=>{
  el.innerHTML='<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true">'+icons[el.dataset.icon]+'</svg>';
});

const tabBar=document.querySelector('.tab-bar');
const tabs=[...document.querySelectorAll('.tab-item')];

tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>{
    tabs.forEach(item=>item.classList.remove('selected'));
    tab.classList.add('selected');
    tabBar.style.setProperty('--tab-index',String(index));
  });
});
