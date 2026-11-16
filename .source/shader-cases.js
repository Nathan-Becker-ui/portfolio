;(function(){
var FS="precision mediump float;\nuniform vec3 u_colors[8];uniform vec4 u_scene,u_shape,u_surface,u_finish,u_transform,u_space,u_cursor;\n#define u_resolution u_scene.xy\n#define u_time u_scene.z\n#define u_colorCount u_scene.w\n#define u_scale u_shape.x\n#define u_intensity u_shape.y\n#define u_contrast u_surface.y\n#define u_brightness u_surface.z\n#define u_saturation u_surface.w\n#define u_vignette u_finish.y\n#define u_grain u_finish.w\n#define u_seed mod(u_transform.x,31.0)\n"+
"float grainHash(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}"+
"vec3 shade(vec2 p,float t){vec3 acc=u_colors[0]*0.15;float total=0.15;for(int i=0;i<8;i++){if(float(i)>=u_colorCount)break;float fi=float(i);vec2 c=vec2(sin(t*(0.21+fi*0.071)+fi*2.4+u_seed),cos(t*(0.17+fi*0.093)+fi*1.7))*(0.45+u_intensity*0.35);float w=exp(-dot(p-c,p-c)*6.0);acc+=u_colors[i]*w;total+=w;}return acc/total;}"+
"void main(){vec2 uv=gl_FragCoord.xy/u_resolution.xy;vec2 p=(gl_FragCoord.xy-0.5*u_resolution.xy)/min(u_resolution.x,u_resolution.y);p*=u_scale;vec3 col=shade(p,u_time);"+
"col=(col-0.5)*u_contrast+0.5;float l=dot(col,vec3(0.299,0.587,0.114));col=mix(vec3(l),col,u_saturation);col+=u_brightness;"+
"float vd=length(uv-0.5)*1.41421356;col*=1.0-u_vignette*smoothstep(0.35,1.0,vd);col+=(grainHash(gl_FragCoord.xy+vec2(u_seed*17.0,u_seed*31.0))-0.5)*u_grain;gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);}";
var VS="attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}";
// brand orange palette, low -> high
var COLS=[0.043,0.043,0.047, 0.420,0.090,0.022, 0.880,0.240,0.090, 0.150,0.042,0.018, 0,0,0,0,0,0,0,0,0,0,0,0];
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('[data-name="Cases"]').forEach(function(sec){
  var wrap=document.createElement('div');wrap.className='shader-bg';var cv=document.createElement('canvas');wrap.appendChild(cv);sec.insertBefore(wrap,sec.firstChild);sec.classList.add('has-shader');
  var gl=cv.getContext('webgl',{antialias:false,premultipliedAlpha:false});if(!gl){wrap.remove();return;}
  function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o;}
  var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){wrap.remove();return;}gl.useProgram(pr);
  var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);var al=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
  var U=function(n){return gl.getUniformLocation(pr,n);};
  gl.uniform3fv(U('u_colors'),COLS);gl.uniform4f(U('u_shape'),1.10,0.34,0.50,0.0);gl.uniform4f(U('u_surface'),2.40,0.96,-0.10,0.96);gl.uniform4f(U('u_finish'),0.0,0.36,0.026,0.07);gl.uniform4f(U('u_transform'),1453.0,0,0,0);gl.uniform4f(U('u_space'),0,0,0,0);gl.uniform4f(U('u_cursor'),0,2.0,0.65,0.46);
  var uScene=U('u_scene'),vis=false,raf=0,t0=performance.now();
  function size(){var r=sec.getBoundingClientRect(),z=r.width/(sec.offsetWidth||1)||1;cv.style.height=(innerHeight/z)+'px';var d=Math.min(devicePixelRatio||1,2)*0.5;var w=Math.round(r.width*d),h=Math.round(innerHeight*d);if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;gl.viewport(0,0,w,h);}}
  function draw(now){gl.uniform4f(uScene,cv.width,cv.height,((now-t0)/1000)*0.73,4.0);gl.drawArrays(gl.TRIANGLES,0,3);}
  function loop(now){draw(now);raf=vis&&!document.hidden&&!reduce?requestAnimationFrame(loop):0;}
  function kick(){if(!raf&&vis&&!document.hidden){size();raf=requestAnimationFrame(loop);}}
  new IntersectionObserver(function(e){vis=e[0].isIntersecting;kick();}).observe(sec);
  addEventListener('resize',function(){size();draw(performance.now());});document.addEventListener('visibilitychange',kick);
});})();
