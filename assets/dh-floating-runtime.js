// Point geometry stays on the GPU. No mesh downloads or per-frame particle uploads.
function makeFloating(gl) {
  function shader(type, source) {var s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);return s;}
  var v=shader(gl.VERTEX_SHADER,FLOAT_VERT),f=shader(gl.FRAGMENT_SHADER,FLOAT_FRAG),p=gl.createProgram();
  gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)){var error=gl.getShaderInfoLog(v)||gl.getShaderInfoLog(f)||gl.getProgramInfoLog(p);gl.deleteShader(v);gl.deleteShader(f);gl.deleteProgram(p);throw Error(error);}
  gl.detachShader(p,v);gl.detachShader(p,f);gl.deleteShader(v);gl.deleteShader(f);
  var vao=gl.createVertexArray(),u={};
  ['uTime','uSeed','uShape','uSize','uFloat','uExplosion','uStrength','uLobes','uTwist','uPointSize','uMulti','uBright','uGlow','uForward','uResolution','uLook','uTint','uTint2'].forEach(function(k){u[k]=gl.getUniformLocation(p,k);});
  var shapes=['Torus knot','Ring','Orb','Twisted ribbon','Helix','Star','Crystal','Seeded sculpture'];
  return {program:p,count:0,draw:function(cur,disc,time,amount,width,height,look,tints,quality){
    this.count=Math.floor(({low:6000,medium:16000,high:26000}[quality]||16000)*cur.density);
    var mirrors=disc.kaleidoscopeMode==='Whole screen'?0:disc.kaleidoscope;
    gl.useProgram(p);gl.bindVertexArray(vao);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.disable(gl.DEPTH_TEST);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);
    var values={uTime:time*.35,uSeed:disc.shapeSeed,uShape:Math.max(0,shapes.indexOf(disc.shape)),uSize:cur.shapeSize,uFloat:cur.shapeFloat,uExplosion:amount,uStrength:cur.shapeExplode,uLobes:cur.shapeLobes,uTwist:cur.shapeTwist,uPointSize:Math.max(1.8,height/230),uMulti:cur.multicolor,uBright:cur.brightness,uGlow:cur.glow,uForward:mirrors};
    Object.keys(values).forEach(function(k){gl.uniform1f(u[k],values[k]);});
    gl.uniform2f(u.uResolution,width,height);gl.uniform2f(u.uLook,look.x*cur.lookRange,look.y*cur.lookRange);gl.uniform3fv(u.uTint,tints[0]);gl.uniform3fv(u.uTint2,tints[1]);
    gl.drawArraysInstanced(gl.POINTS,0,this.count,mirrors>=2?1+Math.floor(mirrors):1);gl.disable(gl.BLEND);
  },dispose:function(){gl.deleteVertexArray(vao);gl.deleteProgram(p);}};
}
