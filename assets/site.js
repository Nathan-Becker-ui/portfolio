(function(){
  var menu = document.querySelector('.menu');
  function open(){ menu.classList.add('open'); menu.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
  function close(){ menu.classList.remove('open'); menu.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
  document.addEventListener('click', function(e){
    if (e.target.closest('[data-menu-open]')) { e.preventDefault(); open(); return; }
    if (e.target.closest('[data-menu-close]')) { e.preventDefault(); close(); return; }
    var a = e.target.closest('a[data-go]');
    if (a && a.pathname === location.pathname) { e.preventDefault(); close(); go(a.getAttribute('data-go')); history.replaceState(null,'','#'+a.getAttribute('data-go')); }
  });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') close(); if((e.key==='Enter'||e.key===' ') && e.target.matches('[data-menu-open]')){e.preventDefault();open();} });
  function go(id){
    var els = document.querySelectorAll('[data-sec="'+id+'"]');
    for (var i=0;i<els.length;i++){ if (els[i].offsetParent !== null){ els[i].scrollIntoView({behavior:'smooth'}); return; } }
  }
  window.addEventListener('load', function(){ if (location.hash) setTimeout(function(){ go(location.hash.slice(1)); }, 50); });
})();
