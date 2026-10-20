// A depth-tested, world-anchored lattice with GPU-only vertex positions.
function makeTerrain(gl){
 function link(vertex,fragment){
  var program=gl.createProgram(),shaders=[];
  [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]].forEach(function(pair){var s=gl.createShader(pair[0]);gl.shaderSource(s,pair[1]);gl.compileShader(s);gl.attachShader(program,s);shaders.push(s);});gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){var error=shaders.map(function(s){return gl.getShaderInfoLog(s);}).join('\n')||gl.getProgramInfoLog(program);shaders.forEach(function(s){gl.deleteShader(s);});gl.deleteProgram(program);throw Error(error);}
  shaders.forEach(function(s){gl.detachShader(program,s);gl.deleteShader(s);});return program;
 }
 var program=link(TERRAIN_VERT,TERRAIN_FRAG),sky;
 try{sky=link(VERT,TERRAIN_SKY);}catch(e){gl.deleteProgram(program);throw e;}
 var vao=gl.createVertexArray(),skyVAO=gl.createVertexArray(),buffer=gl.createBuffer(),u={},s={},depth=gl.createRenderbuffer(),width=0,height=0,target=null,stage=null,texture=null,blank=gl.createTexture();
 gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,blank);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.activeTexture(gl.TEXTURE0);
 gl.bindVertexArray(skyVAO);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);var a=gl.getAttribLocation(sky,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);gl.bindVertexArray(null);
 ['uResolution','uLook','uSegments','uFlow','uFar','uZoom','uTerrainType','uTerrainHeight','uTerrainScale','uTerrainGrid','uGlow','uBright','uMulti','uTint','uTint2'].forEach(function(k){u[k]=gl.getUniformLocation(program,k);});
 ['uTerrainScene','uResolution','uLook','uTint','uTint2','uSource','uTerrainSun','uBright','uKal','uVort','uSpin','uZoom'].forEach(function(k){s[k]=gl.getUniformLocation(sky,k);});
 function attachment(framebuffer){gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depth);}
 return {program:program,vertices:0,draw:function(cur,disc,time,w,h,look,tints,zoom,vortex,spin,quality){
  target=gl.getParameter(gl.FRAMEBUFFER_BINDING);gl.activeTexture(gl.TEXTURE5);
  var mirrors=disc.kaleidoscopeMode==='Whole screen'?0:disc.kaleidoscope,filtered=mirrors>=2||Math.abs(vortex)>.001;
  if(width!==w||height!==h){width=w;height=h;gl.bindRenderbuffer(gl.RENDERBUFFER,depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);if(texture){gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);}}
  if(filtered&&!stage){stage=gl.createFramebuffer();texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.bindFramebuffer(gl.FRAMEBUFFER,stage);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);}
  attachment(filtered?stage:target);gl.viewport(0,0,w,h);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);
  gl.useProgram(sky);gl.bindVertexArray(skyVAO);gl.uniform2f(s.uResolution,w,h);gl.uniform2f(s.uLook,look.x*cur.lookRange,look.y*cur.lookRange);gl.uniform3fv(s.uTint,tints[0]);gl.uniform3fv(s.uTint2,tints[1]);gl.uniform1f(s.uBright,cur.brightness);gl.uniform1f(s.uTerrainSun,disc.terrainSun?1:0);gl.uniform1f(s.uZoom,zoom);gl.uniform1f(s.uSource,0);gl.uniform1i(s.uTerrainScene,5);gl.uniform1f(s.uKal,0);gl.uniform1f(s.uVort,0);gl.uniform1f(s.uSpin,0);
  gl.bindTexture(gl.TEXTURE_2D,blank);gl.drawArrays(gl.TRIANGLES,0,3);
  gl.useProgram(program);gl.bindVertexArray(vao);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT);
  var segments={low:[96,128],medium:[160,192],high:[224,256]}[quality]||[160,192];
  var values={uFlow:time,uFar:220,uZoom:zoom,uTerrainType:Math.max(0,['Mixed landscape','Hills','Mountains','Desert'].indexOf(disc.terrainType)),uTerrainHeight:cur.terrainHeight,uTerrainScale:cur.terrainScale,uTerrainGrid:cur.terrainGrid,uGlow:cur.glow,uBright:cur.brightness,uMulti:cur.multicolor};
  Object.keys(values).forEach(function(k){gl.uniform1f(u[k],values[k]);});gl.uniform2f(u.uResolution,w,h);gl.uniform2f(u.uLook,look.x*cur.lookRange,look.y*cur.lookRange);gl.uniform2f(u.uSegments,segments[0],segments[1]);gl.uniform3fv(u.uTint,tints[0]);gl.uniform3fv(u.uTint2,tints[1]);this.vertices=segments[0]*segments[1]*6;gl.drawArrays(gl.TRIANGLES,0,this.vertices);gl.disable(gl.DEPTH_TEST);
  if(filtered){gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.useProgram(sky);gl.bindVertexArray(skyVAO);gl.uniform1f(s.uSource,1);gl.uniform1f(s.uKal,mirrors);gl.uniform1f(s.uVort,vortex);gl.uniform1f(s.uSpin,spin);gl.bindTexture(gl.TEXTURE_2D,texture);gl.drawArrays(gl.TRIANGLES,0,3);gl.bindTexture(gl.TEXTURE_2D,blank);}
  gl.activeTexture(gl.TEXTURE0);
 },dispose:function(){
  var previous=gl.getParameter(gl.FRAMEBUFFER_BINDING);if(target){gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,null);}gl.bindFramebuffer(gl.FRAMEBUFFER,previous===stage?null:previous);
  gl.deleteFramebuffer(stage);gl.deleteTexture(texture);gl.deleteTexture(blank);gl.deleteRenderbuffer(depth);gl.deleteVertexArray(vao);gl.deleteVertexArray(skyVAO);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteProgram(sky);
 }};
}
