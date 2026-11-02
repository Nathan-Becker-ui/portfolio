(function(){
  var menu = document.querySelector('.menu'), nav = document.querySelector('.nav'), body = document.body;
  function setMenu(o){ menu.classList.toggle('open', o); body.classList.toggle('menu-open', o); menu.setAttribute('aria-hidden', o ? 'false' : 'true'); body.style.overflow = o ? 'hidden' : ''; }
  function onScroll(){ nav && nav.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
  document.addEventListener('click', function(e){
    if (e.target.closest('[data-menu-toggle]')) { e.preventDefault(); setMenu(!menu.classList.contains('open')); return; }
    var t = e.target.closest('a[data-top]');
    if (t && t.pathname === location.pathname) { e.preventDefault(); setMenu(false); window.scrollTo({top:0, behavior:'smooth'}); history.replaceState(null,'',location.pathname); return; }
    var a = e.target.closest('a[data-go]');
    if (a && a.pathname === location.pathname) { e.preventDefault(); setMenu(false); go(a.getAttribute('data-go')); history.replaceState(null,'','#'+a.getAttribute('data-go')); return; }
    if (e.target.closest('.menu a')) setMenu(false);
  });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', function(){ if (window.innerWidth >= 900) setMenu(false); });
  function go(id){
    var els = document.querySelectorAll('[data-sec="'+id+'"]');
    for (var i=0;i<els.length;i++){ if (els[i].offsetParent !== null){ var y = els[i].getBoundingClientRect().top + window.scrollY; window.scrollTo({top:y, behavior:'smooth'}); return; } }
  }
  window.addEventListener('load', function(){ if (location.hash) setTimeout(function(){ go(location.hash.slice(1)); }, 60); });
})();
