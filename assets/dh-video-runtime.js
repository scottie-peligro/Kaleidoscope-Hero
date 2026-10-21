/*! Small WebGL2 video and video-sampled particle renderer. Loaded only for Video wall. */
(function () {
  'use strict';
  var vertex = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uVideo;
uniform vec2 uGrid;
uniform vec2 uMapping;
uniform float uPointSize;
uniform float uDepth;
uniform float uThreshold;
uniform float uContrast;
uniform float uBrightness;
uniform int uMode;
uniform int uColor;
uniform vec3 uTint;
uniform vec3 uTint2;
out vec2 vUV;
out vec3 vColor;
out float vVisible;
void main(){
  vec2 screen;
  if(uMode==0){
    screen=vec2((gl_VertexID==1)?3.:-1.,(gl_VertexID==2)?3.:-1.);
    gl_Position=vec4(screen,0.,1.);
    vUV=(screen*.5+.5-.5)*uMapping+.5;
    vColor=vec3(1.);vVisible=1.;gl_PointSize=1.;
  }else{
    float column=mod(float(gl_VertexID),uGrid.x);
    float row=floor(float(gl_VertexID)/uGrid.x);
    screen=(vec2(column+.5,row+.5)/uGrid)*2.-1.;
    vUV=(screen*.5+.5-.5)*uMapping+.5;
    vec3 color=texture(uVideo,vUV).rgb;
    color=clamp((color-.5)*uContrast+.5,0.,1.);
    float light=dot(color,vec3(.2126,.7152,.0722));
    vVisible=step(uThreshold,light)*step(0.,vUV.x)*step(vUV.x,1.)*step(0.,vUV.y)*step(vUV.y,1.);
    if(uColor==1)color=mix(uTint,uTint2,light);
    if(uColor==2)color=vec3(light);
    vColor=color;
    float distance=1.+uDepth*(light-.5)*.35;
    gl_Position=vec4(screen/max(.35,distance),0.,1.);
    gl_PointSize=uPointSize*clamp(distance,.65,1.6);
  }
}`;
  var fragment = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uVideo;
uniform int uMode;
uniform int uShape;
uniform float uContrast;
uniform float uBrightness;
in vec2 vUV;
in vec3 vColor;
in float vVisible;
out vec4 outColor;
void main(){
  if(vUV.x<0.||vUV.x>1.||vUV.y<0.||vUV.y>1.||vVisible<.5)discard;
  if(uMode==0){
    vec3 color=texture(uVideo,vUV).rgb;
    outColor=vec4(clamp(((color-.5)*uContrast+.5)*uBrightness,0.,1.),1.);
  }else{
    float alpha=1.;
    if(uShape==0){float radius=length(gl_PointCoord-.5);alpha=1.-smoothstep(.39,.5,radius);}
    outColor=vec4(vColor*uBrightness,alpha);
  }
}`;
  function shader(gl, type, source) {
    var s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { var error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(error); }
    return s;
  }
  function create(gl, el) {
    var vs=shader(gl,gl.VERTEX_SHADER,vertex),fs=shader(gl,gl.FRAGMENT_SHADER,fragment),program=gl.createProgram();
    gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    var vao=gl.createVertexArray(),texture=gl.createTexture(),video=null,source='',frameHandle=0,dirty=false,uploaded=false,playing=false,lastTime=-1,dead=false,pointCount=0;
    var u={};['uVideo','uGrid','uMapping','uPointSize','uDepth','uThreshold','uContrast','uBrightness','uMode','uColor','uTint','uTint2','uShape'].forEach(function(key){u[key]=gl.getUniformLocation(program,key);});
    gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));
    function stop() {
      playing=false;
      if(video){if(frameHandle&&video.cancelVideoFrameCallback)video.cancelVideoFrameCallback(frameHandle);frameHandle=0;video.pause();video.removeAttribute('src');video.load();}
      video=null;dirty=false;uploaded=false;lastTime=-1;el.classList.remove('dh-video-ready');
    }
    function watchFrame() {
      if(!video||dead||!video.requestVideoFrameCallback)return;
      frameHandle=video.requestVideoFrameCallback(function(){dirty=true;watchFrame();});
    }
    function load(url) {
      if(source===url)return;
      stop();source=url;
      if(!url)return;
      video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='auto';video.crossOrigin='anonymous';video.loop=true;
      video.addEventListener('loadeddata',function(){dirty=true;});
      video.addEventListener('ended',function(){playing=false;});
      video.addEventListener('error',function(){el.classList.remove('dh-video-ready');});
      video.src=url;watchFrame();
    }
    function play(speed,loop) {
      if(!video)return;
      video.loop=loop;video.playbackRate=Math.max(.05,speed||1);
      if(speed<=0){if(!video.paused)video.pause();playing=false;return;}
      if(!playing){playing=true;video.play().catch(function(){playing=false;});}
    }
    return {
      draw:function(cur,d,width,height,tint,quality) {
        load(d.videoUrl||'');
        if(!video)return false;
        play(cur.videoPlaybackSpeed,d.videoLoop);
        if(video.readyState<2||!video.videoWidth)return false;
        if(!video.requestVideoFrameCallback&&video.currentTime!==lastTime)dirty=true;
        if(dirty||!uploaded){
          gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
          try {if(uploaded)gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,video);else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);uploaded=true;dirty=false;lastTime=video.currentTime;el.classList.add('dh-video-ready');}
          catch(e){el.classList.remove('dh-video-ready');}
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
        }
        if(!uploaded)return false;
        var aspect=width/height,videoAspect=video.videoWidth/video.videoHeight,cover=d.videoFit!=='Contain';
        var sx=1,sy=1;
        if((videoAspect>aspect)===cover)sx=aspect/videoAspect;else sy=videoAspect/aspect;
        var mode=d.videoDisplay==='Video'?0:1;
        var pixelRatio=Math.max(1,width/Math.max(1,el.clientWidth));
        var spacing=Math.max(3,cur.videoParticleSpacing*pixelRatio);
        var columns=Math.max(1,Math.ceil(width/spacing)),rows=Math.max(1,Math.ceil(height/spacing));
        var maxPoints=quality==='high'?85000:quality==='low'?26000:50000;
        var factor=Math.sqrt(Math.min(1,maxPoints/(columns*rows)));
        columns=Math.max(1,Math.floor(columns*factor));rows=Math.max(1,Math.floor(rows*factor));
        pointCount=mode?columns*rows:0;
        gl.useProgram(program);gl.bindVertexArray(vao);gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);
        gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);
        gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,texture);
        gl.uniform1i(u.uVideo,5);gl.uniform2f(u.uGrid,columns,rows);gl.uniform2f(u.uMapping,sx,sy);
        gl.uniform1f(u.uPointSize,Math.min(48,cur.videoParticleSize*pixelRatio));
        gl.uniform1f(u.uDepth,cur.videoDepth);gl.uniform1f(u.uThreshold,cur.videoThreshold);gl.uniform1f(u.uContrast,cur.videoContrast);gl.uniform1f(u.uBrightness,cur.brightness);
        gl.uniform1i(u.uMode,mode);gl.uniform1i(u.uShape,d.videoParticleShape==='Square'?1:0);
        gl.uniform1i(u.uColor,d.videoColor==='Palette'?1:d.videoColor==='Monochrome'?2:0);
        gl.uniform3fv(u.uTint,tint[0]);gl.uniform3fv(u.uTint2,tint[1]);
        if(mode){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);}
        gl.drawArrays(mode?gl.POINTS:gl.TRIANGLES,0,mode?columns*rows:3);
        gl.disable(gl.BLEND);
        return true;
      },
      pause:function(){if(video)video.pause();playing=false;},
      resume:function(){playing=false;},
      dispose:function(){dead=true;stop();gl.deleteTexture(texture);gl.deleteVertexArray(vao);gl.deleteProgram(program);},
      stats:function(){return {source:source,frameTime:lastTime,points:pointCount,ready:uploaded,paused:video?video.paused:true};}
    };
  }
  window.DHVideoRuntime={create:create};
})();
