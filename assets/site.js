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
;(function(){var c=document.querySelector('.scroll-cue');if(!c)return;function u(){c.classList.toggle('gone',scrollY>80);}u();addEventListener('scroll',u,{passive:true});})();
;(function(){if(!matchMedia('(hover: hover)').matches)return;
document.querySelectorAll('[data-name^="Case 0"]').forEach(function(card){var cap=card.querySelector('[data-name="Capa"]');if(!cap)return;cap.classList.add('glow-cap');
var host=card.closest('a')||card;
host.addEventListener('pointermove',function(e){var r=cap.getBoundingClientRect(),z=r.width/cap.offsetWidth||1;cap.style.setProperty('--mx',((e.clientX-r.left)/z).toFixed(1)+'px');cap.style.setProperty('--my',((e.clientY-r.top)/z).toFixed(1)+'px');});
host.addEventListener('pointerenter',function(){card.classList.add('glow-on');});host.addEventListener('pointerleave',function(){card.classList.remove('glow-on');});});})();
;(function(){var ov=document.querySelector('.intro-ov');if(!ov||!document.documentElement.classList.contains('intro'))return;
var FS="precision mediump float;\nuniform vec3 u_colors[8];uniform vec4 u_scene,u_shape,u_surface,u_finish,u_transform,u_space,u_cursor;\n#define u_resolution u_scene.xy\n#define u_time u_scene.z\n#define u_colorCount u_scene.w\n#define u_scale u_shape.x\n#define u_intensity u_shape.y\n#define u_contrast u_surface.y\n#define u_brightness u_surface.z\n#define u_saturation u_surface.w\n#define u_vignette u_finish.y\n#define u_grain u_finish.w\n#define u_seed mod(u_transform.x,31.0)\n"+
"float grainHash(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}"+
"vec3 shade(vec2 p,float t){vec3 acc=u_colors[0]*0.15;float total=0.15;for(int i=0;i<8;i++){if(float(i)>=u_colorCount)break;float fi=float(i);vec2 c=vec2(sin(t*(0.21+fi*0.071)+fi*2.4+u_seed),cos(t*(0.17+fi*0.093)+fi*1.7))*(0.45+u_intensity*0.35);float w=exp(-dot(p-c,p-c)*6.0);acc+=u_colors[i]*w;total+=w;}return acc/total;}"+
"void main(){vec2 uv=gl_FragCoord.xy/u_resolution.xy;vec2 p=(gl_FragCoord.xy-0.5*u_resolution.xy)/min(u_resolution.x,u_resolution.y);p*=u_scale;vec3 col=shade(p,u_time);"+
"col=(col-0.5)*u_contrast+0.5;float l=dot(col,vec3(0.299,0.587,0.114));col=mix(vec3(l),col,u_saturation);col+=u_brightness;"+
"float vd=length(uv-0.5)*1.41421356;col*=1.0-u_vignette*smoothstep(0.35,1.0,vd);col+=(grainHash(gl_FragCoord.xy+vec2(u_seed*17.0,u_seed*31.0))-0.5)*u_grain;gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);}";
var VS="attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}";
// brand orange palette, low -> high
var COLS=[0.043,0.043,0.047, 0.230,0.060,0.025, 0.700,0.190,0.070, 0.090,0.090,0.098, 0,0,0,0,0,0,0,0,0,0,0,0];

var cv=ov.querySelector('canvas'),gl=cv.getContext('webgl',{antialias:false}),raf=0,t0=performance.now(),run=true;
if(gl){var S=function(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o;};var pr=gl.createProgram();gl.attachShader(pr,S(gl.VERTEX_SHADER,VS));gl.attachShader(pr,S(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);
 if(gl.getProgramParameter(pr,gl.LINK_STATUS)){gl.useProgram(pr);var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);var al=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
 var U=function(n){return gl.getUniformLocation(pr,n);};gl.uniform3fv(U('u_colors'),COLS);gl.uniform4f(U('u_shape'),1.10,0.34,0.50,0.0);gl.uniform4f(U('u_surface'),2.40,0.96,-0.10,0.96);gl.uniform4f(U('u_finish'),0.0,0.36,0.026,0.07);gl.uniform4f(U('u_transform'),1453.0,0,0,0);gl.uniform4f(U('u_space'),0,0,0,0);gl.uniform4f(U('u_cursor'),0,2.0,0.65,0.46);
 var us=U('u_scene'),d=Math.min(devicePixelRatio||1,2)*.5;cv.width=Math.round(innerWidth*d);cv.height=Math.round(innerHeight*d);gl.viewport(0,0,cv.width,cv.height);
 var loop=function(n){gl.uniform4f(us,cv.width,cv.height,((n-t0)/1000)*0.73,4.0);gl.drawArrays(gl.TRIANGLES,0,3);if(run&&!document.hidden)raf=requestAnimationFrame(loop);};raf=requestAnimationFrame(loop);}}
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,minT=reduce?300:3400,loaded=document.readyState==='complete';
function end(){ov.classList.add('out');try{localStorage.setItem('ng-intro','1')}catch(e){}setTimeout(function(){run=false;cancelAnimationFrame(raf);document.documentElement.classList.remove('intro');ov.remove();},900);}
var go=function(){var w=Math.max(0,minT-(performance.now()-t0));setTimeout(end,w);};if(loaded)go();else addEventListener('load',go);setTimeout(end,7000);})();
