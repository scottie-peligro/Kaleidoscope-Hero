// Point geometry stays on the GPU. No mesh downloads or per-frame particle uploads.
function makeFloating(gl) {
  function shader(type, source) {var s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);return s;}
  var v=shader(gl.VERTEX_SHADER,FLOAT_VERT),f=shader(gl.FRAGMENT_SHADER,FLOAT_FRAG),p=gl.createProgram();
  gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)){var error=gl.getShaderInfoLog(v)||gl.getShaderInfoLog(f)||gl.getProgramInfoLog(p);gl.deleteShader(v);gl.deleteShader(f);gl.deleteProgram(p);throw Error(error);}
  gl.detachShader(p,v);gl.detachShader(p,f);gl.deleteShader(v);gl.deleteShader(f);
  var vao=gl.createVertexArray(),u={};
  ['uTime','uSeed','uShape','uShapeB','uMorph','uStagger','uSize','uFloat','uExplosion','uStrength','uLobes','uTwist','uPointSize','uMulti','uBright','uGlow','uForward','uResolution','uLook','uTint','uTint2'].forEach(function(k){u[k]=gl.getUniformLocation(p,k);});
  var shapes=['Torus knot','Ring','Orb','Twisted ribbon','Helix','Star','Crystal','Seeded sculpture'];
  return {program:p,count:0,draw:function(cur,disc,time,amount,width,height,look,tints,quality,morphScroll){
    this.count=Math.floor(({low:6000,medium:16000,high:26000}[quality]||16000)*cur.density);
    var mirrors=disc.kaleidoscopeMode==='Whole screen'?0:disc.kaleidoscope;
    gl.useProgram(p);gl.bindVertexArray(vao);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.disable(gl.DEPTH_TEST);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);
    var morphing=disc.style==='Morphing sculptures',from=Math.max(0,shapes.indexOf(disc.shape)),to=from,progress=0;
    if(morphing){
      from=Math.max(0,shapes.indexOf(disc.morphFrom));to=Math.max(0,shapes.indexOf(disc.morphTo));
      if(disc.morphMode==='Manual')progress=cur.morphProgress;
      else if(disc.morphMode==='Scroll')progress=morphScroll||0;
      else{
        // Flow 2.5 is real time; Flow 0 freezes the automatic sequence with the sculpture.
        var duration=Math.max(1,cur.morphDuration),hold=Math.max(0,cur.morphHold),span=duration+hold,clock=time/2.5,leg=Math.floor(clock/span);
        progress=Math.max(0,Math.min(1,(clock%span-hold)/duration));
        if(disc.morphMode==='Cycle shapes'){from=(from+leg)%shapes.length;to=(from+1)%shapes.length;}
        else if(leg%2){var swap=from;from=to;to=swap;}
      }
    }
    var values={uTime:time*.35,uSeed:disc.shapeSeed,uShape:from,uShapeB:to,uMorph:progress,uStagger:morphing?cur.morphStagger:0,uSize:cur.shapeSize,uFloat:cur.shapeFloat,uExplosion:morphing&&!disc.morphExplode?0:amount,uStrength:cur.shapeExplode,uLobes:cur.shapeLobes,uTwist:cur.shapeTwist,uPointSize:Math.max(1.8,height/230),uMulti:cur.multicolor,uBright:cur.brightness,uGlow:cur.glow,uForward:mirrors};
    Object.keys(values).forEach(function(k){gl.uniform1f(u[k],values[k]);});
    gl.uniform2f(u.uResolution,width,height);gl.uniform2f(u.uLook,look.x*cur.lookRange,look.y*cur.lookRange);gl.uniform3fv(u.uTint,tints[0]);gl.uniform3fv(u.uTint2,tints[1]);
    gl.drawArraysInstanced(gl.POINTS,0,this.count,mirrors>=2?1+Math.floor(mirrors):1);gl.disable(gl.BLEND);
  },dispose:function(){gl.deleteVertexArray(vao);gl.deleteProgram(p);}};
}
