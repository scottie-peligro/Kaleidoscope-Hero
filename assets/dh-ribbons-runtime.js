// Procedural ribbon surfaces: no downloaded meshes, images, or per-frame buffers.
function makeRibbons(gl){
 var program=gl.createProgram(),shaders=[];
 [[gl.VERTEX_SHADER,RIBBON_VERT],[gl.FRAGMENT_SHADER,RIBBON_FRAG]].forEach(function(pair){var s=gl.createShader(pair[0]);gl.shaderSource(s,pair[1]);gl.compileShader(s);gl.attachShader(program,s);shaders.push(s);});
 gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS)){var error=shaders.map(function(s){return gl.getShaderInfoLog(s);}).join('\n')||gl.getProgramInfoLog(program);shaders.forEach(function(s){gl.deleteShader(s);});gl.deleteProgram(program);throw Error(error);}
 shaders.forEach(function(s){gl.detachShader(program,s);gl.deleteShader(s);});
 var vao=gl.createVertexArray(),u={};
 ['uTime','uCount','uWidth','uFold','uTwist','uScrollTwist','uUnwrap','uBend','uRadius','uForward','uResolution','uLook','uSegments','uPointer','uTransparency','uIridescence','uEdge','uBright','uGlow','uMulti','uTint','uTint2'].forEach(function(k){u[k]=gl.getUniformLocation(program,k);});
 return {program:program,vertices:0,draw:function(cur,disc,time,width,height,look,tints,quality,scroll,pointer,scrollMode){
  var count=Math.round(cur.ribbonCount),segments={low:[64,8],medium:[100,12],high:[140,16]}[quality]||[100,12],along=Math.max(32,Math.round(segments[0]*(.6+cur.density*.4))),mirrors=disc.kaleidoscopeMode==='Whole screen'?0:disc.kaleidoscope,copies=mirrors>=2?Math.floor(mirrors):1,budget={low:90000,medium:180000,high:300000}[quality]||180000;
  along=Math.max(24,Math.min(along,Math.floor(budget/(count*copies*segments[1]*6))));
  var progress=Math.max(0,Math.min(1,scroll||0))*cur.ribbonScrollStrength,twist=scrollMode==='Twist'||scrollMode==='Twist and unwrap',unwrap=scrollMode==='Unwrap'||scrollMode==='Twist and unwrap';
  pointer=pointer||{};var mouse=mapScenePointer(pointer,width,height);
  var values={uTime:time,uCount:count,uWidth:cur.ribbonWidth,uFold:cur.ribbonFold,uTwist:cur.ribbonTwist,uScrollTwist:twist?progress:0,uUnwrap:unwrap?Math.min(1,progress):0,uBend:cur.ribbonBend,uRadius:cur.ribbonRadius,uForward:mirrors,uTransparency:cur.ribbonTransparency,uIridescence:cur.ribbonIridescence,uEdge:cur.ribbonEdge,uBright:cur.brightness,uGlow:cur.glow,uMulti:cur.multicolor};
  gl.useProgram(program);gl.bindVertexArray(vao);gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);
  Object.keys(values).forEach(function(k){gl.uniform1f(u[k],values[k]);});gl.uniform2f(u.uResolution,width,height);gl.uniform2f(u.uLook,look.x*cur.lookRange,look.y*cur.lookRange);gl.uniform2f(u.uSegments,along,segments[1]);gl.uniform3f(u.uPointer,mouse[0],mouse[1],pointer.presence||0);gl.uniform3fv(u.uTint,tints[0]);gl.uniform3fv(u.uTint2,tints[1]);
  this.vertices=along*segments[1]*6;this.instances=count*copies;gl.drawArraysInstanced(gl.TRIANGLES,0,this.vertices,this.instances);gl.disable(gl.BLEND);
 },dispose:function(){gl.deleteVertexArray(vao);gl.deleteProgram(program);}};
}
