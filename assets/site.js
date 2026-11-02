(function(){
  var menu = document.querySelector('.menu'), nav = document.querySelector('.nav'), body = document.body;
  function setMenu(o){ menu.classList.toggle('open', o); body.classList.toggle('menu-open', o); menu.setAttribute('aria-hidden', o ? 'false' : 'true'); body.style.overflow = o ? 'hidden' : ''; }
  var spyLinks = nav ? nav.querySelectorAll('.nav-links a[data-go]') : [];
  var isHome = !!document.querySelector('[data-sec]');
  function spy(){
    if (!isHome) { pill(); return; } var cur = null, mid = window.innerHeight * 0.4;
    ['sobre','cases','contato'].forEach(function(id){
      var els = document.querySelectorAll('[data-sec="'+id+'"]');
      for (var i=0;i<els.length;i++){ if (els[i].offsetParent === null) continue; var r = els[i].getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) cur = id; }
    });
    for (var k=0;k<spyLinks.length;k++) spyLinks[k].classList.toggle('active', spyLinks[k].getAttribute('data-go') === cur);
    pill();
  }
  var wrap = nav && nav.querySelector('.nav-links'), ind = null, hov = null;
  if (wrap){ ind = document.createElement('span'); ind.className = 'nav-pill'; ind.setAttribute('aria-hidden','true'); wrap.insertBefore(ind, wrap.firstChild);
    wrap.querySelectorAll('a').forEach(function(a){ a.addEventListener('mouseenter', function(){ hov = a; pill(); }); });
    wrap.addEventListener('mouseleave', function(){ hov = null; pill(); }); }
  function pill(){
    if (!ind) return; var t = hov || wrap.querySelector('a.active');
    wrap.querySelectorAll('a').forEach(function(a){ a.classList.toggle('on', a === t); });
    if (!t){ ind.style.opacity = '0'; return; }
    var first = !ind.dataset.ready && ind.style.opacity !== '1';
    if (first) ind.style.transition = 'none';
    ind.style.width = t.offsetWidth + 'px'; ind.style.transform = 'translateX(' + t.offsetLeft + 'px)'; ind.style.opacity = '1';
    if (first){ ind.offsetWidth; ind.style.transition = ''; ind.dataset.ready = '1'; }
  }
  function onScroll(){ if(nav){var y=window.scrollY,on=nav.classList.contains('scrolled');if(!on&&y>40)nav.classList.add('scrolled');else if(on&&y<8)nav.classList.remove('scrolled');} spy(); }
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
  window.addEventListener('resize', function(){ if (window.innerWidth >= 900) setMenu(false); pill(); });
  function go(id){
    var els = document.querySelectorAll('[data-sec="'+id+'"]');
    for (var i=0;i<els.length;i++){ if (els[i].offsetParent !== null){ var y = els[i].getBoundingClientRect().top + window.scrollY; window.scrollTo({top:y, behavior:'smooth'}); return; } }
  }
  window.addEventListener('load', function(){ if (location.hash) setTimeout(function(){ go(location.hash.slice(1)); }, 60); });
})();
