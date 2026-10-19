// Point geometry stays on the GPU. No mesh downloads or per-frame particle uploads.
function makeFloating(gl) {
  function shader(type, source) {var s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);return s;}
  var v=shader(gl.VERTEX_SHADER,FLOAT_VERT),f=shader(gl.FRAGMENT_SHADER,FLOAT_FRAG),p=gl.createProgram();
  gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)){var error=gl.getShaderInfoLog(v)||gl.getShaderInfoLog(f)||gl.getProgramInfoLog(p);gl.deleteShader(v);gl.deleteShader(f);gl.deleteProgram(p);throw Error(error);}
  gl.detachShader(p,v);gl.detachShader(p,f);gl.deleteShader(v);gl.deleteShader(f);
  var vao=gl.createVertexArray(),u={};
  ['uTime','uSeed','uShape','uShapeB','uMorph','uStagger','uSize','uFloat','uExplosion','uStrength','uLobes','uTwist','uPointSize','uMulti','uBright','uGlow','uForward','uResolution','uLook','uPointer','uMouseRadius','uMouseStrength','uMouseGlobal','uMouseForce','uTint','uTint2'].forEach(function(k){u[k]=gl.getUniformLocation(p,k);});
  var shapes=['Torus knot','Ring','Orb','Twisted ribbon','Helix','Star','Crystal','Seeded sculpture'];
  function pointerInScene(pointer,width,height){
    var x=pointer.x||0,y=pointer.y||0,kal=pointer.fullKal||0,vortex=pointer.autoVortex||0,spin=pointer.autoSpin||0;
    function mod(n,d){return ((n%d)+d)%d;}
    function repeat(n){return 1-Math.abs(mod(n,2)-1);}
    if(pointer.tessMode>0){
      // Same tile transform as the compositor, so local particle forces follow
      // the visible sculpture in every repeated tile, including rotated cells.
      var aspect=width/height,px=x*.5*aspect,py=y*.5,angle=pointer.tessRotation||0,cs=Math.cos(angle),sn=Math.sin(angle),density=Math.max(1,pointer.tessDensity||3),zoom=Math.max(.5,pointer.tessZoom||1),rotated=px*cs+py*sn;
      py=(-px*sn+py*cs)*density;px=rotated*density;
      if(pointer.tessMode===1){px=mod(px+.5,1)-.5;py=mod(py+.5,1)-.5;}
      else if(pointer.tessMode===2){px=repeat(px+.5)-.5;py=repeat(py+.5)-.5;}
      else if(pointer.tessMode===3){var fx=mod(px-py/1.7320508,1),fy=mod(py/.8660254,1);if(fx+fy>1){var swap=fx;fx=1-fy;fy=1-swap;}px=fx+.5*fy-.5;py=(fy-1/3)*.8660254;}
      else{var ax=mod(px+.5,1)-.5,ay=mod(py+.8660254,1.7320508)-.8660254,bx=mod(px,1)-.5,by=mod(py,1.7320508)-.8660254,near=ax*ax+ay*ay<bx*bx+by*by;px=near?ax:bx;py=near?ay:by;}
      x=repeat(.5+px/(aspect*zoom))*2-1;y=repeat(.5+py/zoom)*2-1;
    }
    if(kal<1.5&&Math.abs(vortex)<.001&&Math.abs(spin)<.001)return [x,y];
    // Match the compositor's primary sample, including mirror-repeat at the edges.
    var aspect=width/height,px=x*.5*aspect,py=y*.5,radius=Math.hypot(px,py),angle=spin+vortex*Math.abs(vortex)*3.2*Math.exp(-radius*2.2),cs=Math.cos(angle),sn=Math.sin(angle);
    var rotated=px*cs+py*sn;py=-px*sn+py*cs;px=rotated;
    if(kal>1.5){var sector=Math.PI*2/Math.floor(kal);angle=((Math.atan2(py,px)+(pointer.time||0)*.04)%sector+sector)%sector;angle=Math.PI/2-sector*.5+Math.abs(angle-sector*.5);px=radius*Math.cos(angle);py=radius*Math.sin(angle);}
    return [repeat(.5+px/aspect)*2-1,repeat(.5+py)*2-1];
  }
  return {program:p,count:0,draw:function(cur,disc,time,amount,width,height,look,tints,quality,morphScroll,pointer){
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
    pointer=pointer||{};var mouse=pointerInScene(pointer,width,height),effect=disc.shapeMouseEffect||'Whole sculpture explosion';
    var values={uTime:time*.35,uSeed:disc.shapeSeed,uShape:from,uShapeB:to,uMorph:progress,uStagger:morphing?cur.morphStagger:0,uSize:cur.shapeSize,uFloat:cur.shapeFloat,uExplosion:morphing&&!disc.morphExplode?0:amount,uStrength:cur.shapeExplode,uLobes:cur.shapeLobes,uTwist:cur.shapeTwist,uPointSize:Math.max(1.8,height/230),uMulti:cur.multicolor,uBright:cur.brightness,uGlow:cur.glow,uForward:mirrors,uMouseRadius:cur.shapeMouseRadius||.18,uMouseStrength:cur.shapeMouseStrength===undefined?1:cur.shapeMouseStrength,uMouseGlobal:cur.shapeMouseGlobal||0,uMouseForce:effect==='Attract'?-1:effect==='Repel'?1:0};
    Object.keys(values).forEach(function(k){gl.uniform1f(u[k],values[k]);});
    gl.uniform2f(u.uResolution,width,height);gl.uniform2f(u.uLook,look.x*cur.lookRange,look.y*cur.lookRange);gl.uniform3fv(u.uTint,tints[0]);gl.uniform3fv(u.uTint2,tints[1]);
    gl.uniform4f(u.uPointer,mouse[0],mouse[1],pointer.presence||0,effect==='Local explosion'?pointer.explosion||0:0);
    gl.drawArraysInstanced(gl.POINTS,0,this.count,mirrors>=2?1+Math.floor(mirrors):1);gl.disable(gl.BLEND);
  },dispose:function(){gl.deleteVertexArray(vao);gl.deleteProgram(p);}};
}
