// Isolate terrain compilation from the general effect shader. Fixed landscapes
// share the small mesh bundle; mixed/random shows create this program on demand.
function makeTerrain(gl){
 var program=gl.createProgram(),shaders=[];
 [[gl.VERTEX_SHADER,VERT],[gl.FRAGMENT_SHADER,TERRAIN_FRAG]].forEach(function(pair){var s=gl.createShader(pair[0]);gl.shaderSource(s,pair[1]);gl.compileShader(s);gl.attachShader(program,s);shaders.push(s);});
 gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS)){var error=shaders.map(function(s){return gl.getShaderInfoLog(s);}).join('\n')||gl.getProgramInfoLog(program);shaders.forEach(function(s){gl.deleteShader(s);});gl.deleteProgram(program);throw Error(error);}
 shaders.forEach(function(s){gl.detachShader(program,s);gl.deleteShader(s);});
 var vao=gl.createVertexArray(),buffer=gl.createBuffer(),a=gl.getAttribLocation(program,'a'),u={};
 gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);gl.bindVertexArray(null);
 ['iResolution','iTime','uLook','uZoom','uNight','uTint','uTint2','uDensity','uFlow','uGlow','uBright','uMulti','uStyle','uKal','uVort','uSpin','uTerrainType','uTerrainHeight','uTerrainScale','uTerrainGrid','uTerrainSun'].forEach(function(k){u[k]=gl.getUniformLocation(program,k);});
 return {program:program,draw:function(cur,disc,time,width,height,look,tints,zoom,vortex,spin){
  gl.useProgram(program);gl.bindVertexArray(vao);
  var values={iTime:0,uNight:1,uZoom:zoom,uDensity:cur.density,uFlow:time,uGlow:cur.glow,uBright:cur.brightness,uMulti:cur.multicolor,uStyle:17,uKal:disc.kaleidoscopeMode==='Whole screen'?0:disc.kaleidoscope,uVort:vortex,uSpin:spin,uTerrainType:Math.max(0,['Mixed landscape','Hills','Mountains','Desert'].indexOf(disc.terrainType)),uTerrainHeight:cur.terrainHeight,uTerrainScale:cur.terrainScale,uTerrainGrid:cur.terrainGrid,uTerrainSun:disc.terrainSun?1:0};
  Object.keys(values).forEach(function(k){gl.uniform1f(u[k],values[k]);});gl.uniform2f(u.iResolution,width,height);gl.uniform2f(u.uLook,look.x*cur.lookRange,look.y*cur.lookRange);gl.uniform3fv(u.uTint,tints[0]);gl.uniform3fv(u.uTint2,tints[1]);
  gl.drawArrays(gl.TRIANGLES,0,3);
 },dispose:function(){gl.deleteVertexArray(vao);gl.deleteBuffer(buffer);gl.deleteProgram(program);}};
}
