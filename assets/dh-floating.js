/*! Kaleidoscope Hero renderer v1.0.0 */
(function () {
  'use strict';
  var FRAG = "#version 300 es\nprecision highp float;out vec4 outColor;void main(){outColor=vec4(0.,0.,0.,1.);}";
  var POST = "#version 300 es\nprecision highp float;\nuniform float uOp;uniform vec3 uBg1;uniform vec3 uBg2;uniform float uGT;uniform float uAng;uniform sampler2D uScene;uniform vec2 uRes;uniform float uWarp;uniform float uBloom;uniform vec3 uTint2;uniform float uNight;uniform float uTime;\nout vec4 o;\nuniform float uFullKal,uAutoVort,uAutoSpin;\nuniform int uTessMode;\nuniform float uTessDensity,uTessZoom,uTessRotation;\nuniform int uBlendMode;\nuniform int uBlendSource;\nuniform float uBlendAmount;\nuniform vec3 uBlendColor;\n// W3C compositing blend functions. The animation is the backdrop; the chosen\n// color is the source layer. Run after bloom, in this existing compositor pass.\nfloat blendLum(vec3 c){return dot(c,vec3(.3,.59,.11));}\nfloat blendSat(vec3 c){return max(c.r,max(c.g,c.b))-min(c.r,min(c.g,c.b));}\nvec3 blendClip(vec3 c){\n  float l=blendLum(c),n=min(c.r,min(c.g,c.b)),x=max(c.r,max(c.g,c.b));\n  if(n<0.)c=vec3(l)+(c-l)*l/max(l-n,.000001);\n  if(x>1.)c=vec3(l)+(c-l)*(1.-l)/max(x-l,.000001);\n  return c;\n}\nvec3 blendSetLum(vec3 c,float l){return blendClip(c+(l-blendLum(c)));}\nvec3 blendSetSat(vec3 c,float s){float n=min(c.r,min(c.g,c.b)),d=blendSat(c);return d>.000001?(c-n)*s/d:vec3(0.);}\nfloat blendChannel(float b,float s,int mode){\n  if(mode==1)return b*s;\n  if(mode==2)return b+s-b*s;\n  if(mode==3)return b<=.5?2.*b*s:1.-2.*(1.-b)*(1.-s);\n  if(mode==4)return min(b,s);\n  if(mode==5)return max(b,s);\n  if(mode==6)return b==0.?0.:s==1.?1.:min(1.,b/(1.-s));\n  if(mode==7)return b==1.?1.:s==0.?0.:1.-min(1.,(1.-b)/s);\n  if(mode==8)return s<=.5?2.*b*s:1.-2.*(1.-b)*(1.-s);\n  if(mode==9){float d=b<=.25?((16.*b-12.)*b+4.)*b:sqrt(b);return s<=.5?b-(1.-2.*s)*b*(1.-b):b+(2.*s-1.)*(d-b);}\n  if(mode==10)return abs(b-s);\n  return b+s-2.*b*s;\n}\nvec3 blendGrade(vec3 b,vec3 s,int mode){\n  if(mode==12)return blendSetLum(blendSetSat(s,blendSat(b)),blendLum(b));\n  if(mode==13)return blendSetLum(blendSetSat(b,blendSat(s)),blendLum(b));\n  if(mode==14)return blendSetLum(s,blendLum(b));\n  if(mode==15)return blendSetLum(b,blendLum(s));\n  return vec3(blendChannel(b.r,s.r,mode),blendChannel(b.g,s.g,mode),blendChannel(b.b,s.b,mode));\n}\nvec3 br(vec3 c,float th){return max(c-th,0.)/(1.-th);}\nvec2 tessellationUV(vec2 uv){\n  if(uTessMode==0)return uv;\n  vec2 aspect=vec2(uRes.x/uRes.y,1.),p=(uv-.5)*aspect;\n  float cs=cos(uTessRotation),sn=sin(uTessRotation);\n  p=mat2(cs,-sn,sn,cs)*p*max(1.,uTessDensity);\n  vec2 q;\n  if(uTessMode==1)q=fract(p+.5)-.5;\n  else if(uTessMode==2)q=1.-abs(mod(p+.5,2.)-1.)-.5;\n  else if(uTessMode==3){\n    // Equilateral lattice: reflect the upper triangle onto the lower one.\n    vec2 f=fract(vec2(p.x-p.y/1.7320508,p.y/.8660254));\n    if(f.x+f.y>1.)f=vec2(1.)-f.yx;\n    q=vec2(f.x+.5*f.y-.5,(f.y-1./3.)*.8660254);\n  }else{\n    // Nearest center in two staggered rectangular lattices gives hex cells.\n    vec2 spacing=vec2(1.,1.7320508);\n    vec2 a=mod(p+spacing*.5,spacing)-spacing*.5,b=mod(p,spacing)-spacing*.5;\n    q=dot(a,a)<dot(b,b)?a:b;\n  }\n  vec2 source=.5+q/(aspect*max(.5,uTessZoom));\n  return 1.-abs(mod(source,2.)-1.);\n}\nvec2 effectUV(vec2 uv){\n  uv=tessellationUV(uv);\n  if(uFullKal<1.5&&abs(uAutoVort)<.001&&abs(uAutoSpin)<.001)return uv;\n  vec2 aspect=vec2(uRes.x/uRes.y,1.),p=(uv-.5)*aspect;float radius=length(p);\n  if(abs(uAutoVort)>.001||abs(uAutoSpin)>.001){\n    float angle=uAutoSpin+uAutoVort*abs(uAutoVort)*3.2*exp(-radius*2.2),cs=cos(angle),sn=sin(angle);\n    p=mat2(cs,-sn,sn,cs)*p;\n  }\n  if(uFullKal>1.5){\n    float sector=6.2831853/floor(uFullKal),angle=mod(atan(p.y,p.x)+uTime*.04,sector);\n    angle=1.5707963-sector*.5+abs(angle-sector*.5);\n    p=length(p)*vec2(cos(angle),sin(angle));\n  }\n  // Mirror-repeat the source at the edges, avoiding clamped bands while turning.\n  return 1.-abs(mod(.5+p/aspect,2.)-1.);\n}\nvoid main(){\n  vec2 baseUV=gl_FragCoord.xy/uRes,uv=effectUV(baseUV),cen=vec2(.5,.52),dv=uv-cen;\n  vec3 col=vec3(0.);\n  // Reuse existing mip levels when many tiles shrink the source image.\n  float detailLOD=uTessMode>0?max(0.,log2(max(1.,uTessDensity/max(.5,uTessZoom)))):0.;\n  float w=clamp(uWarp,0.,2.5),ws=0.;\n  if(w<.001){col=textureLod(uScene,uv,detailLOD).rgb;ws=1.;}else for(int i=0;i<WARP_TAPS;i++){float f=float(i)/float(WARP_TAPS-1);float k=1.-w*.16*f*f;float wt=1.-f*.6;col+=textureLod(uScene,cen+dv*k,detailLOD).rgb*wt;ws+=wt;}\n  col/=ws;\n  if(uBloom>.001){\n  float th=mix(.95,.42,uNight);\n  vec3 b=br(textureLod(uScene,uv,2.+detailLOD).rgb,th)*.5+br(textureLod(uScene,uv,3.+detailLOD).rgb,th)*.7+br(textureLod(uScene,uv,4.+detailLOD).rgb,th)*.9+br(textureLod(uScene,uv,5.+detailLOD).rgb,th)*1.1;\n  vec3 st=vec3(0.);\n  for(int i=-7;i<=7;i++){float fi=float(i);st+=br(textureLod(uScene,uv+vec2(fi*.022,0.),3.+detailLOD).rgb,th+.12)*exp(-abs(fi)*.32);}\n  vec2 gu=cen-dv*.55;vec3 gh=br(textureLod(uScene,gu,4.+detailLOD).rgb,th+.1)*.35+br(textureLod(uScene,cen-dv*1.3,5.+detailLOD).rgb,th+.1)*.2;\n  float vg=smoothstep(.8,.1,length(dv));\n  col+=uBloom*mix(.2,1.,uNight)*(b*.32+st*uNight*mix(vec3(.5,.7,1.),uTint2,.5)*.09+gh*uTint2*vg*.6);\n  }\n  float l=dot(col,vec3(.3,.5,.2));\n  col=mix(col,vec3(l)*1.15+col*.25,w*.12)+w*.06*smoothstep(.05,.6,length(dv))*mix(vec3(.6,.8,1.),uTint2,.5)*l;\n  vec2 ac=(baseUV-.5)*vec2(uRes.x/uRes.y,1.);\n  float gt=uGT>.5?clamp(dot(ac,vec2(cos(uAng),sin(uAng)))/(.5*(abs(cos(uAng))*uRes.x/uRes.y+abs(sin(uAng))))*.5+.5,0.,1.):clamp(length(ac)/(.5*length(vec2(uRes.x/uRes.y,1.))),0.,1.);\n  vec3 bg=mix(uBg1,uBg2,smoothstep(0.,1.,gt));\n  col*=uOp;\n  vec3 elements=clamp(col,0.,1.);\n  col=1.-(1.-bg)*(1.-elements);\n  if(uBlendMode>0&&uBlendAmount>0.){\n    // The gradient grades emitted light only, leaving empty background pixels\n    // intact. Use the displayed gradient coordinates, including linear angle.\n    float coverage=uBlendSource==1?max(elements.r,max(elements.g,elements.b)):1.;\n    vec3 source=uBlendSource==1?bg:uBlendColor;\n    col=mix(col,clamp(blendGrade(col,source,uBlendMode),0.,1.),uBlendAmount*coverage);\n  }\n  col+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;\n  o=vec4(col,1.);\n}\n";
  // DH_FLOAT_BEGIN
  var FLOAT_VERT = "#version 300 es\nprecision highp float;\nuniform float uTime,uSeed,uShape,uShapeB,uMorph,uStagger,uSize,uFloat,uExplosion,uStrength,uLobes,uTwist,uPointSize,uMulti,uBright,uGlow,uForward;\nuniform vec2 uResolution,uLook;\nuniform vec4 uPointer;\nuniform float uMouseRadius,uMouseStrength,uMouseGlobal,uMouseForce;\nuniform vec3 uTint,uTint2;\nout vec3 vColor;\nout float vAlpha;\nconst float PI=3.14159265,TAU=6.2831853;\nuint mixBits(uint n){n=(n^(n>>16u))*0x7feb352du;n=(n^(n>>15u))*0x846ca68bu;return n^(n>>16u);}\nvec3 random3(float id){uint n=uint(id)+uint(uSeed)*7919u;return vec3(mixBits(n),mixBits(n+123u),mixBits(n+357u))/4294967295.;}\nmat2 turn(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}\nvec3 knot(float a){return vec3((1.+.3*cos(3.*a))*cos(2.*a),(1.+.3*cos(3.*a))*sin(2.*a),.48*sin(3.*a));}\nvec3 shapeAt(float shape,vec3 h,out vec3 normal){\n float a=h.x*TAU,b=h.y*TAU;\n normal=vec3(cos(a)*sqrt(max(0.,1.-pow(h.y*2.-1.,2.))),h.y*2.-1.,sin(a)*sqrt(max(0.,1.-pow(h.y*2.-1.,2.))));vec3 p=normal;\n if(shape<.5){vec3 center=knot(a),tangent=normalize(knot(a+.002)-center),side=normalize(cross(tangent,normalize(center))),up=cross(side,tangent);normal=side*cos(b)+up*sin(b);p=center*.73+normal*.24;}\n else if(shape<1.5){normal=vec3(cos(a)*cos(b),sin(a)*cos(b),sin(b));p=vec3(.8*cos(a),.8*sin(a),0.)+normal*.3;}\n else if(shape<2.5){p=normal*(.93+.045*sin(a*5.+uTime*.4)*sin(b*3.));}\n else if(shape<3.5){float w=(h.y-.5)*.85,t=uTwist*a;normal=normalize(vec3(cos(a)*sin(t),sin(a)*sin(t),-cos(t)));p=vec3((.9+w*cos(t))*cos(a),(.9+w*cos(t))*sin(a),w*sin(t));}\n else if(shape<4.5){a=(h.x-.5)*TAU*1.6;vec3 center=vec3(.65*cos(a),(h.x-.5)*1.9,.65*sin(a)),tangent=normalize(vec3(-.65*sin(a),1.9/(TAU*1.6),.65*cos(a))),side=vec3(cos(a),0.,sin(a));normal=side*cos(b)+cross(tangent,side)*sin(b);p=center+normal*.18;}\n else if(shape<5.5){float radius=.66+.42*pow(max(0.,cos(a*uLobes)),2.)*pow(1.-abs(normal.y),.5);p=normal*radius;}\n else if(shape<6.5){p=normal/(abs(normal.x)+abs(normal.y)+abs(normal.z))*1.35;normal=normalize(sign(normal));}\n else{float phase=uSeed*.17;float radius=.82+.2*sin(a*uLobes+normal.y*uTwist*4.+phase)*sin(b*3.+phase)+.1*cos(b*5.-a*2.);p=normal*radius;}\n return p;\n}\nvoid main(){\n vec3 h=random3(float(gl_VertexID)+1.),normal;\n vec3 p=shapeAt(uShape,h,normal);\n if(uMorph>0.){\n  vec3 nextNormal,next=shapeAt(uShapeB,h,nextNormal);\n  // Every point keeps its identity; smooth endpoints also join consecutive cycles.\n  float m=clamp((uMorph-h.z*uStagger)/max(.2,1.-uStagger),0.,1.);\n  m=m*m*m*(m*(m*6.-15.)+10.);\n  if(m>=1.){p=next;normal=nextNormal;}\n  else{p=mix(p,next,m);vec3 blended=mix(normal,nextNormal,m);normal=dot(blended,blended)>.00001?normalize(blended):normal;}\n }\n // Fixed per-particle paths allow a clean return to the exact original surface.\n vec3 direction=normalize(normal*.7+(random3(float(gl_VertexID)+341.)-.5)*1.7);\n float explosion=uExplosion*uStrength;\n p+=direction*explosion*(.5+h.z*1.6);\n p.xz=turn(explosion*(h.y-.5)*1.3)*p.xz;\n float rotation=uTime*.19;p.xz=turn(rotation)*p.xz;normal.xz=turn(rotation)*normal.xz;\n p.xy=turn(.35+sin(uTime*.23)*.18*uFloat)*p.xy;normal.xy=turn(.35+sin(uTime*.23)*.18*uFloat)*normal.xy;\n p*=uSize;p.y+=sin(uTime*.6)*.12*uFloat;\n p.xz=turn(-uLook.x*.65)*p.xz;p.yz=turn(uLook.y*.22)*p.yz;\n float depth=4.8+p.z;vec2 screen=p.xy*2.4/max(depth,.5);screen.x*=uResolution.y/uResolution.x;\n // Repeat a folded particle wedge for the forward kaleidoscope mode.\n if(gl_InstanceID>0){vec2 q=screen*vec2(uResolution.x/uResolution.y,1.);float sector=TAU/max(uForward,2.),angle=mod(atan(q.y,q.x),sector);angle=abs(angle-sector*.5)+float(gl_InstanceID-1)*sector;q=length(q)*vec2(cos(angle),sin(angle));screen=q*vec2(uResolution.y/uResolution.x,1.);}\n // Cursor distance uses the canvas's shorter side, independent of camera following.\n if(uPointer.w>.00001||(uPointer.z>.00001&&abs(uMouseForce)>.5)){\n  vec2 aspect=uResolution/min(uResolution.x,uResolution.y),delta=(screen-uPointer.xy)*aspect*.5;\n  float radius=max(.01,uMouseRadius),distance=length(delta);\n  float influence=mix(1.-smoothstep(0.,radius,distance),1.,uMouseGlobal);\n  vec2 offset=vec2(0.);\n  if(uPointer.w>.00001){\n   vec2 scatter=delta+vec2(cos(h.x*TAU),sin(h.x*TAU))*.025;\n   offset+=scatter/max(length(scatter),.000001)*min(radius*.8,.25)*uPointer.w*uStrength*(.4+h.z*1.6)*influence;\n  }\n  float pull=(1.-exp(-uMouseStrength*uPointer.z*1.4))*influence;\n  if(uMouseForce<-.5)offset-=delta*pull;\n  else if(uMouseForce>.5)offset+=(distance>.000001?delta/distance:vec2(cos(h.x*TAU),sin(h.x*TAU)))*radius*.65*pull;\n  screen+=offset*2./aspect;\n }\n gl_Position=vec4(screen,clamp(depth/12.,0.,1.),1.);\n gl_PointSize=clamp(uPointSize*(.65+h.z*.9)*4.8/max(depth,.5),1.,7.);\n vec3 light=normalize(vec3(-.65,.7,-.8));float lit=max(dot(normal,light),0.),rim=pow(1.-abs(normal.z),3.);\n vec3 color=mix(uTint,uTint2,smoothstep(-.45,.45,normal.x+(h.z-.5)*.2));\n color=mix(color,.55+.45*cos(TAU*(h.z+vec3(0.,.33,.67))),uMulti*.65);\n float sparkle=pow(max(0.,sin(h.x*173.+uTime*(.4+h.z))),28.);\n vColor=(color*(.3+lit*2.3+rim*.8)+vec3(1.)*(pow(lit,14.)*.7+sparkle*uGlow*.65))*uBright;\n vAlpha=(.7+h.z*.3)*mix(1.,.6,clamp(explosion*.4,0.,1.));\n}\n";
  var FLOAT_FRAG = "#version 300 es\nprecision highp float;\nin vec3 vColor;in float vAlpha;out vec4 outColor;\nvoid main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float alpha=exp(-r*r*3.5)*(1.-smoothstep(.7,1.,r))*vAlpha;outColor=vec4(1.-exp(-vColor*1.2),alpha);}\n";
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

  // DH_FLOAT_END
  var VERT = "#version 300 es\nin vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
  var PALETTES = {"Electric blue":[[0.12,0.42,1],[0.35,0.8,1]],"Cyan":[[0.08,0.8,1],[0.55,1,0.92]],"Violet":[[0.45,0.3,1],[0.9,0.45,1]],"Amber":[[1,0.5,0.12],[1,0.82,0.45]],"Fiber":[[1,0.14,0.08],[0.15,0.35,1]],"Neon":[[1,0.12,0.7],[0.25,0.35,1]],"Aurora":[[0.1,1,0.55],[0.55,0.25,1]],"Ember":[[1,0.25,0.05],[1,0.75,0.2]],"Ice":[[0.55,0.85,1],[0.9,0.97,1]],"Matrix":[[0.1,1,0.3],[0.6,1,0.5]],"Rose gold":[[1,0.5,0.55],[1,0.82,0.6]],"Ocean":[[0,0.55,1],[0,1,0.85]],"Vapor":[[1,0.4,0.85],[0.3,0.95,1]],"Mono":[[0.85,0.88,0.95],[1,1,1]],"Sunset":[[1,0.58,0.22],[1,0.8,0.5]],"Gold and blue":[[1,0.65,0.2],[0.2,0.6,1]]};
  var WORDS = [];
  var STYLES = ["Digital grid","Fiber optics","Particle waves","Wireframe tunnel","Data rings","Voronoi crystal","Constellation","Fractal flythrough","Word rain","Digital fabric","Blueprint city","Dot matrix structures","LED globe","Digital disco ball","Floating shape","Morphing sculptures"];
  var TESSELLATIONS = ['Off','Squares','Mirrored squares','Triangles','Hexagons'];
  var BLEND_MODES = ['Off','Multiply','Screen','Overlay','Darken','Lighten','Color dodge','Color burn','Hard light','Soft light','Difference','Exclusion','Hue','Saturation','Color','Luminosity'];
  var NUM = ['tessellationDensity', 'tessellationZoom', 'tessellationRotation', 'blendAmount', 'opacity', 'density', 'flow', 'glow', 'brightness', 'multicolor', 'warp', 'bloom', 'vortex', 'vortexRamp', 'lookRange', 'gradientAngle', 'autoVortexStrength', 'autoVortexSpeed', 'autoVortexRamp', 'shapeSize', 'shapeFloat', 'shapeLobes', 'shapeTwist', 'shapeExplode', 'shapeSensitivity', 'shapeRecovery', 'shapeScrollDistance', 'morphDuration', 'morphHold', 'morphProgress', 'morphStagger', 'morphScrollDistance', 'shapeMouseRadius', 'shapeMouseStrength', 'shapeMouseGlobal'];
  var DEF = { tessellation: 'Off', tessellationDensity: 3, tessellationZoom: 1, tessellationRotation: 0, blendMode: 'Off', blendSource: 'Blend color', blendColor: '#8866ff', blendAmount: 1, style: 'Digital grid', palette: 'Electric blue', ledPattern: 'Cycle', opacity: 1, density: 0.55, flow: 2.5, glow: 1, brightness: 1, multicolor: 0.35, kaleidoscope: 0, kaleidoscopeMode: 'Forward elements', randomize: false, randomInterval: 15, bgColor1: '#140a2e', bgColor2: '#000000', gradient: 'Radial', gradientAngle: 90, warp: 1, bloom: 1, vortex: 1, vortexRamp: 2, lookRange: 1, discoMouseControl: true, shape: 'Torus knot', shapeSeed: 17, shapeSize: 1, shapeFloat: 1, shapeLobes: 5, shapeTwist: 1.5, shapeTrigger: 'Mouse and scroll', shapeMouseEffect: 'Whole sculpture explosion', shapeMouseRadius: .18, shapeMouseStrength: 1, shapeMouseGlobal: 0, shapeExplode: 1, shapeSensitivity: 1, shapeRecovery: 1.2, shapeScrollDistance: .75, morphMode: 'Cycle shapes', morphFrom: 'Orb', morphTo: 'Torus knot', morphDuration: 4, morphHold: 1, morphProgress: 0, morphStagger: .15, morphScrollDistance: 1, morphExplode: false, autoVortex: false, autoVortexStrength: 0.5, autoVortexSpeed: 0.5, autoVortexDirection: 'Clockwise', autoVortexRamp: 2 };
  var motion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var connection = navigator.connection;
  function staticMode() { return !!((motion && motion.matches) || (connection && connection.saveData)); }

  function prepareBackground(el) {
    if (!el.classList.contains('dh-hero--background') || el.classList.contains('dh-hero--preview')) return;
    // Native blocks already provide a host. Shortcodes can use an existing group or builder section.
    var host = el.parentElement && el.parentElement.closest('.dh-section,.wp-block-group,.wp-block-cover,.gb-container,[class*="gb-element-"],.fusion-fullwidth,section');
    if (!host) return false;
    host.classList.add('dh-section');
    if (el.parentElement !== host) {
      var holder = el.parentElement;
      host.appendChild(el);
      // A shortcode-only paragraph or block must not leave an empty gap in the layout.
      while (holder && holder !== host && !holder.textContent.trim() && Array.prototype.every.call(holder.children, function (child) { return child.classList.contains('dh-shortcode-holder'); })) {
        holder.classList.add('dh-shortcode-holder');
        holder = holder.parentElement;
      }
    } else if (host.lastElementChild !== el) host.appendChild(el);
  }

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function hex(s) { var m = /^#?([0-9a-f]{6})$/i.exec(s || ''); var n = m ? parseInt(m[1], 16) : 0; return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  function truthy(v) { return v === true || v === 1 || v === '1' || v === 'true' || v === 'yes' || v === 'on'; }
  function norm(c) {
    var o = {}, k;
    c = c || {};
    for (k in DEF) o[k] = (c[k] !== undefined && c[k] !== null && c[k] !== '') ? c[k] : DEF[k];
    NUM.forEach(function (n) { o[n] = parseFloat(o[n]); if (isNaN(o[n])) o[n] = DEF[n]; });
    if (TESSELLATIONS.indexOf(o.tessellation) < 0) o.tessellation = DEF.tessellation;
    var tessBounds = {tessellationDensity:[1,8],tessellationZoom:[.5,2],tessellationRotation:[0,360]};
    Object.keys(tessBounds).forEach(function(key){o[key]=Math.max(tessBounds[key][0],Math.min(tessBounds[key][1],Number.isFinite(o[key])?o[key]:DEF[key]));});
    if (['Blend color','Background gradient'].indexOf(o.blendSource) < 0) o.blendSource = DEF.blendSource;
    if (BLEND_MODES.indexOf(o.blendMode) < 0) o.blendMode = DEF.blendMode;
    if (/^#[0-9a-f]{3}$/i.test(o.blendColor)) o.blendColor = o.blendColor.replace(/[0-9a-f]/gi, function(ch){return ch+ch;});
    if (!/^#[0-9a-f]{6}$/i.test(o.blendColor)) o.blendColor = DEF.blendColor;
    o.blendAmount = Math.max(0, Math.min(1, Number.isFinite(o.blendAmount) ? o.blendAmount : DEF.blendAmount));
    o.kaleidoscope = parseFloat(o.kaleidoscope) || 0;
    o.randomInterval = Math.max(5, parseFloat(o.randomInterval) || 15);
    o.randomize = truthy(o.randomize);
    o.autoVortex = truthy(o.autoVortex);
    o.discoMouseControl = truthy(o.discoMouseControl);
    o.morphExplode = truthy(o.morphExplode);
    if (['Whole sculpture explosion','Local explosion','Attract','Repel','Off'].indexOf(o.shapeMouseEffect) < 0) o.shapeMouseEffect = DEF.shapeMouseEffect;
    if (['Cycle shapes','Back and forth','Scroll','Manual'].indexOf(o.morphMode) < 0) o.morphMode = DEF.morphMode;
    ['morphFrom','morphTo'].forEach(function(key){if (['Torus knot','Ring','Orb','Twisted ribbon','Helix','Star','Crystal','Seeded sculpture'].indexOf(o[key]) < 0) o[key] = DEF[key];});
    if (['Torus knot','Ring','Orb','Twisted ribbon','Helix','Star','Crystal','Seeded sculpture'].indexOf(o.shape) < 0) o.shape = DEF.shape;
    if (['Off','Mouse movement','Scroll','Mouse and scroll'].indexOf(o.shapeTrigger) < 0) o.shapeTrigger = DEF.shapeTrigger;
    o.shapeSeed = Math.max(1,Math.min(999,Math.round(Number(o.shapeSeed)||17)));
    var shapeBounds = {shapeSize:[.3,2],shapeFloat:[0,2],shapeLobes:[2,10],shapeTwist:[0,4],shapeExplode:[0,3],shapeSensitivity:[.1,3],shapeRecovery:[.2,5],shapeScrollDistance:[.25,2],morphDuration:[1,15],morphHold:[0,8],morphProgress:[0,1],morphStagger:[0,.8],morphScrollDistance:[.25,4],shapeMouseRadius:[.05,.8],shapeMouseStrength:[0,3],shapeMouseGlobal:[0,1]};
    Object.keys(shapeBounds).forEach(function(key){o[key]=Math.max(shapeBounds[key][0],Math.min(shapeBounds[key][1],o[key]));});
    if (['Cycle', 'Fireworks', 'Waves', 'Shapes'].indexOf(o.ledPattern) < 0) o.ledPattern = DEF.ledPattern;
    if (['Forward elements', 'Whole screen', 'Both'].indexOf(o.kaleidoscopeMode) < 0) o.kaleidoscopeMode = DEF.kaleidoscopeMode;
    if (['Clockwise', 'Counterclockwise'].indexOf(o.autoVortexDirection) < 0) o.autoVortexDirection = DEF.autoVortexDirection;
    o.autoVortexStrength = Math.max(0, Math.min(2.5, o.autoVortexStrength));
    o.autoVortexSpeed = Math.max(0, Math.min(3, o.autoVortexSpeed));
    o.autoVortexRamp = Math.max(0, Math.min(10, o.autoVortexRamp));
    if (STYLES.indexOf(o.style) < 0) o.style = DEF.style;
    if (!PALETTES[o.palette]) o.palette = DEF.palette;
    return o;
  }

  function Hero(el, options) {
    var d = {};
    try { d = JSON.parse(el.getAttribute('data-dh') || '{}'); } catch (e) {}
    if (options) d = options;
    this.el = el;
    this.background = !!d.background || el.classList.contains('dh-hero--background');
    this.surface = this.background && !el.classList.contains('dh-hero--preview') ? el.closest('.dh-section') || el : el;
    this.canvas = el.querySelector('canvas.dh-canvas');
    this.quality = d.quality || 'medium';
    this.slides = (d.slides && d.slides.length ? d.slides : [{}]).map(norm);
    this.interval = Math.max(3, parseFloat(d.interval) || 20);
    this.idx = 0;
    this.base = this.slides[0];
    this.tgt = Object.assign({}, this.base);
    this.cur = Object.assign({}, this.base);
    this.disc = { style: this.base.style, shape: this.base.shape, shapeSeed: this.base.shapeSeed, shapeMouseEffect: this.base.shapeMouseEffect, morphMode: this.base.morphMode, morphFrom: this.base.morphFrom, morphTo: this.base.morphTo, morphExplode: this.base.morphExplode, ledPattern: this.base.ledPattern, kaleidoscope: this.base.kaleidoscope, kaleidoscopeMode: this.base.kaleidoscopeMode, gradient: this.base.gradient };
    this.blendColor = hex(this.base.blendColor);
    this.bg1 = hex(this.base.bgColor1);
    this.bg2 = hex(this.base.bgColor2);
    this.fade = 0;
    this.pending = null;
    this.switchAt = 0;
    this.randAt = -1;
    this.visible = false;
    this.inside = false;
    this.cleanup = [];
    this.disposed = false;
    this.initialized = false;
    var self = this;
    this.setPlayback = function () {
      var still = staticMode();
      el.classList.toggle('dh-static', still);
      if (self.disposed || still || !self.visible || document.hidden) {
        cancelAnimationFrame(self.initFrame);
        self.initFrame = 0;
        if (self.pause) self.pause();
        return;
      }
      if (self.initialized) {
        if (self.resume) self.resume();
      } else if (!self.initFrame && !self.initializing && !el.classList.contains('dh-nogl')) {
        // Let the server-rendered text paint before compiling the animation.
        self.initFrame = requestAnimationFrame(function () {
          self.initFrame = 0;
          if (self.disposed || staticMode() || !self.visible || document.hidden) return;
          self.initializing = true;
          Promise.resolve(self.canvas && self.init()).then(function (ready) {
            self.initializing = false;
            self.initialized = !!ready;
            if (!ready && !self.disposed) el.classList.add('dh-nogl');
            if (ready) self.setPlayback();
          }).catch(function () {
            self.initializing = false;
            if (!self.disposed) el.classList.add('dh-nogl');
          });
        });
      }
    };
    this.on(document, 'visibilitychange', this.setPlayback);
    this.on(window, 'pagehide', function () { if (self.pause) self.pause(); });
    this.on(window, 'pageshow', this.setPlayback);
    if (motion && motion.addEventListener) this.on(motion, 'change', this.setPlayback);
    if (connection && connection.addEventListener) this.on(connection, 'change', this.setPlayback);
    if ('IntersectionObserver' in window) {
      this.io = new IntersectionObserver(function (entries) {
        self.visible = entries[0].isIntersecting;
        self.setPlayback();
      });
      this.io.observe(el);
    } else this.visible = true;
    this.setPlayback();
  }

  Hero.prototype.on = function (t, ev, fn, o) { t.addEventListener(ev, fn, o); this.cleanup.push(function () { t.removeEventListener(ev, fn, o); }); };

  Hero.prototype.update = function (cfg) {
    var c = norm(cfg);
    this.slides = [c]; this.base = c; this.idx = 0; this.randAt = -1;
    this.setTarget(c);
  };

  Hero.prototype.setTarget = function (c) {
    var d = this.disc;
    this.tgt = Object.assign({}, c);
    if (c.style !== d.style || c.shape !== d.shape || c.shapeSeed !== d.shapeSeed || c.shapeMouseEffect !== d.shapeMouseEffect || c.morphMode !== d.morphMode || c.morphFrom !== d.morphFrom || c.morphTo !== d.morphTo || c.morphExplode !== d.morphExplode || c.ledPattern !== d.ledPattern || c.kaleidoscope !== d.kaleidoscope || c.kaleidoscopeMode !== d.kaleidoscopeMode || c.gradient !== d.gradient) {
      this.pending = { style: c.style, shape: c.shape, shapeSeed: c.shapeSeed, shapeMouseEffect: c.shapeMouseEffect, morphMode: c.morphMode, morphFrom: c.morphFrom, morphTo: c.morphTo, morphExplode: c.morphExplode, ledPattern: c.ledPattern, kaleidoscope: c.kaleidoscope, kaleidoscopeMode: c.kaleidoscopeMode, gradient: c.gradient };
    } else {
      this.pending = null;
    }
  };

  Hero.prototype.randomCfg = function () {
    var p = function (a) { return a[Math.floor(Math.random() * a.length)]; };
    var rr = function (a, b) { return a + Math.random() * (b - a); };
    return Object.assign({}, this.base, {
      style: p(STYLES), palette: p(Object.keys(PALETTES)),
      kaleidoscope: Math.random() < 0.5 ? 0 : 2 + Math.floor(Math.random() * 11),
      density: rr(0.25, 1), multicolor: Math.random() < 0.4 ? 0 : rr(0.15, 1),
      glow: rr(0, 2.5), flow: rr(1, 8), brightness: rr(0.6, 2)
    });
  };

  Hero.prototype.tick = function (t, dt) {
    var b = this.base, i, k, c = this.cur, g;
    if (b.randomize) {
      if (this.randAt < 0 || t - this.randAt >= b.randomInterval) { this.randAt = t; this.setTarget(this.randomCfg()); }
    } else if (this.slides.length > 1) {
      if (!this.switchAt) this.switchAt = t;
      if (t - this.switchAt >= this.interval) {
        this.switchAt = t;
        this.idx = (this.idx + 1) % this.slides.length;
        this.base = this.slides[this.idx];
        this.setTarget(this.base);
      }
    }
    var ft = this.pending ? 0 : 1;
    this.fade += (ft - this.fade) * (1 - Math.exp(-dt * (this.pending ? 5 : 2.2)));
    if (this.pending && this.fade < 0.03) { this.disc = this.pending; this.pending = null; }
    g = this.tgt;
    k = 1 - Math.exp(-dt * 1.2);
    NUM.forEach(function (n) { c[n] += (g[n] - c[n]) * k; });
    var a = hex(g.bgColor1), z = hex(g.bgColor2), blend = hex(g.blendColor);
    for (i = 0; i < 3; i++) { this.bg1[i] += (a[i] - this.bg1[i]) * k; this.bg2[i] += (z[i] - this.bg2[i]) * k; this.blendColor[i] += (blend[i] - this.blendColor[i]) * k; }
  };

  Hero.prototype.destroy = function () {
    this.disposed = true;
    cancelAnimationFrame(this.initFrame);
    if (this.pause) this.pause();
    cancelAnimationFrame(this.raf);
    this.cleanup.forEach(function (f) { f(); });
    if (this.io) this.io.disconnect();
    if (this.ro) this.ro.disconnect();
    if (this.releaseGPU) this.releaseGPU();
    if (this.viewportStage) { this.viewportStage.replaceWith(this.canvas); this.viewportStage = null; }
    this.el.removeAttribute('data-dh-viewport');
    this.el.removeAttribute('data-dh-viewport-native');
    this.el.style.removeProperty('--dh-render-height');
    this.el.style.removeProperty('--dh-render-top');
    this.el.style.removeProperty('--dh-render-start');
    this.el.style.removeProperty('--dh-render-end');
    this.el.removeAttribute('data-dh-mounted');
    if (this.el.__dh === this) delete this.el.__dh;
    var index = api.instances.indexOf(this);
    if (index !== -1) api.instances.splice(index, 1);
  };

  Hero.prototype.init = async function () {
    var self = this, c = this.canvas, el = this.el, ok = true;
    var gl = c.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      return s;
    }
    var vertex = sh(gl.VERTEX_SHADER, VERT), fragment = sh(gl.FRAGMENT_SHADER, FRAG);
    var postSource = POST.replace('#version 300 es', '#version 300 es\n#define WARP_TAPS ' + (self.quality === 'high' ? 14 : 8));
    var postFragment = sh(gl.FRAGMENT_SHADER, postSource);
    var pr = gl.createProgram(); gl.attachShader(pr, vertex); gl.attachShader(pr, fragment); gl.linkProgram(pr);
    var pp = gl.createProgram(); gl.attachShader(pp, vertex); gl.attachShader(pp, postFragment); gl.linkProgram(pp);
    // Poll completion without forcing the driver to block the main thread.
    var parallel = gl.getExtension('KHR_parallel_shader_compile'), compileStart = performance.now(), aborted = false;
    if (parallel) {
      while (!gl.getProgramParameter(pr, parallel.COMPLETION_STATUS_KHR) || !gl.getProgramParameter(pp, parallel.COMPLETION_STATUS_KHR)) {
        if (self.disposed || gl.isContextLost() || performance.now() - compileStart > 8000) { aborted = true; break; }
        await new Promise(function (resolve) { setTimeout(resolve, 32); });
      }
    }
    var linked = !aborted && !self.disposed && !gl.isContextLost() && ok && gl.getProgramParameter(pr, gl.LINK_STATUS) && gl.getProgramParameter(pp, gl.LINK_STATUS);
    var shaderError = !linked && !self.disposed ? [gl.getShaderInfoLog(vertex),gl.getShaderInfoLog(fragment),gl.getShaderInfoLog(postFragment)].filter(Boolean).join('\n') : '';
    gl.detachShader(pr, vertex); gl.detachShader(pr, fragment); gl.detachShader(pp, vertex); gl.detachShader(pp, postFragment);
    gl.deleteShader(vertex); gl.deleteShader(fragment); gl.deleteShader(postFragment);
    if (!linked || self.disposed) {
      if (!self.disposed) self.error = shaderError || [gl.getProgramInfoLog(pr),gl.getProgramInfoLog(pp)].filter(Boolean).join('\n') || 'Shader initialization unavailable';
      gl.deleteProgram(pr); gl.deleteProgram(pp); return false;
    }
    gl.useProgram(pr);
    if ((this.disc.style === 'Floating shape' || this.disc.style === 'Morphing sculptures')) {
      try { this.floating = makeFloating(gl); } catch (e) { this.error = String(e); gl.deleteProgram(pr); gl.deleteProgram(pp); return false; }
    }
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'a'), ploc = gl.getAttribLocation(pp, 'a');
    var sceneVAO = gl.createVertexArray(), postVAO = gl.createVertexArray();
    gl.bindVertexArray(sceneVAO); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(postVAO); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(ploc); gl.vertexAttribPointer(ploc, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    var U = {};
    ['iResolution', 'iTime', 'uLook', 'uZoom', 'uNight', 'uTint', 'uTint2', 'uDensity', 'uFlow', 'uGlow', 'uWarm', 'uBright', 'uMulti', 'uStyle', 'uKal', 'uLEDPattern', 'uDiscoRotation', 'uMouse', 'uVort', 'uSpin', 'iChannel0', 'uWords', 'uWLen'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
    // The dedicated disco shader needs neither the noise texture nor a word atlas.
    var tex = null, wt = null, wordsReady = false;
    if (U.iChannel0 !== null) {
    var S = 256, r = rng(7), R = new Uint8Array(S * S), n0 = new Uint8Array(S * S * 4), x, y, i;
    for (i = 0; i < S * S; i++) R[i] = r() * 256;
    for (y = 0; y < S; y++) for (x = 0; x < S; x++) {
      i = (y * S + x) * 4;
      n0[i] = R[y * S + x]; n0[i + 1] = R[((y - 17 + S) % S) * S + ((x - 37 + S) % S)]; n0[i + 2] = r() * 256; n0[i + 3] = r() * 256;
    }
    tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, S, S, 0, gl.RGBA, gl.UNSIGNED_BYTE, n0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    }
    gl.uniform1i(U.iChannel0, 0);
    gl.uniform1f(U.uWarm, 0); gl.uniform2f(U.uMouse, 0, 0); gl.uniform1f(U.uNight, 1);

    // A complete 1px placeholder keeps the sampler valid without building the atlas.
    if (U.uWords !== null) {
    wt = gl.createTexture();
    gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, wt);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(U.uWords, 4);
    }
    function ensureWords() {
      if (wordsReady) return;
      wordsReady = true;
      gl.useProgram(pr);
      var cell = 24, cv = document.createElement('canvas'); cv.width = 64 * cell; cv.height = 20 * cell;
      var cx = cv.getContext('2d'); cx.fillStyle = '#000'; cx.fillRect(0, 0, cv.width, cv.height);
      cx.fillStyle = '#fff'; cx.font = '700 17px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      var lens = new Float32Array(64);
      WORDS.slice(0, 64).forEach(function (w, wi) {
        lens[wi] = Math.min(20, w.length);
        w.slice(0, 20).split('').forEach(function (ch, j) { cx.fillText(ch, wi * cell + 12, j * cell + 13); });
      });
      gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, wt);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv); gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(U.uWords, 4); gl.uniform1fv(U.uWLen, lens);
      // Release the temporary CPU-side bitmap after uploading the glyphs.
      cv.width = cv.height = 1;
    }

    var PU = {};
    ['uTessMode', 'uTessDensity', 'uTessZoom', 'uTessRotation', 'uBlendMode', 'uBlendSource', 'uBlendAmount', 'uBlendColor', 'uOp', 'uBg1', 'uBg2', 'uGT', 'uAng', 'uScene', 'uRes', 'uWarp', 'uBloom', 'uTint2', 'uNight', 'uTime', 'uFullKal', 'uAutoVort', 'uAutoSpin'].forEach(function (k) { PU[k] = gl.getUniformLocation(pp, k); });
    var stex = gl.createTexture(), fbo = gl.createFramebuffer();
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, stex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.activeTexture(gl.TEXTURE0);

    var adaptive = 1, needsResize = true, viewDirty = true, viewGuard = 0, viewTop = null, slowFrames = 0, frameSamples = 0, sampleTime = 0;
    function syncNativeView() {
      var origin=0,node=el;
      while(node){origin+=node.offsetTop;var parent=node.offsetParent;if(parent)origin+=parent.clientTop;node=parent;}
      var viewport=Math.max(1,window.innerHeight||document.documentElement.clientHeight);
      var travel=Math.max(1,(document.scrollingElement||document.documentElement).scrollHeight-viewport);
      var start=(-origin-viewGuard)+'px',end=(travel-origin-viewGuard)+'px';
      if(el.style.getPropertyValue('--dh-render-start')!==start)el.style.setProperty('--dh-render-start',start);
      if(el.style.getPropertyValue('--dh-render-end')!==end)el.style.setProperty('--dh-render-end',end);
    }
    function placeView() {
      viewDirty = false;
      if (!self.viewported) return;
      if (self.nativeView) syncNativeView();
      // The hero still spans the entire section. Only its decorative canvas moves.
      // Reading its actual bounds also handles sticky or translated parent sections.
      var movingSection = el.closest('.dh-section[data-dh-scroll-target="section"]');
      var motionY = movingSection ? parseFloat(getComputedStyle(movingSection).getPropertyValue('--dh-scroll-y')) || 0 : 0;
      var top = Math.round(-el.getBoundingClientRect().top-viewGuard+motionY);
      if (top !== viewTop) {el.style.setProperty('--dh-render-top',top+'px');viewTop=top;}
    }
    function sizeView() {
      var viewport = Math.max(1,window.innerHeight || document.documentElement.clientHeight), height = el.clientHeight;
      self.viewported = height > viewport*1.6;
      if (self.viewported) {
        if (!self.viewportStage) {self.viewportStage=document.createElement('div');self.viewportStage.className='dh-viewport-stage';c.parentNode.insertBefore(self.viewportStage,c);self.viewportStage.appendChild(c);}
        var section = el.closest('.dh-section[data-dh-scroll-target]'), distance = section ? Math.min(400,Math.max(0,Number(section.dataset.dhScrollDistance)||0)) : 0;
        viewGuard = Math.max(96,Math.min(256,viewport*.15),distance*.5+48);
        var renderHeight = Math.ceil(viewport+viewGuard*2)+'px';
        el.setAttribute('data-dh-viewport','');
        if(el.style.getPropertyValue('--dh-render-height')!==renderHeight)el.style.setProperty('--dh-render-height',renderHeight);
        // A root scroll timeline runs on the compositor, independently of the 30 FPS scene.
        self.nativeView = !!(window.CSS && CSS.supports('animation-timeline','scroll(root block)'));
        for (var ancestor=el;ancestor&&self.nativeView;ancestor=ancestor.parentElement) {
          var position=getComputedStyle(ancestor).position;
          if(position==='sticky'||position==='fixed')self.nativeView=false;
        }
        el.toggleAttribute('data-dh-viewport-native',self.nativeView);
        placeView();
      } else {
        if(self.viewportStage){self.viewportStage.replaceWith(c);self.viewportStage=null;}
        self.nativeView=false;el.removeAttribute('data-dh-viewport-native');el.style.removeProperty('--dh-render-start');el.style.removeProperty('--dh-render-end');
        el.removeAttribute('data-dh-viewport');el.style.removeProperty('--dh-render-height');el.style.removeProperty('--dh-render-top');viewTop=null;
      }
    }
    var scale = function () {
      var q = { low: 0.5, medium: 0.7, high: 1 }[self.quality] || 0.7;
      var width = c.clientWidth || 1, height = c.clientHeight || 1;
      var pixels = { low: 350000, medium: 700000, high: 1250000 }[self.quality] || 700000;
      return Math.min(Math.min(window.devicePixelRatio || 1, 1) * q * (width < 760 ? 0.8 : 1), Math.sqrt(pixels / (width * height))) * adaptive;
    };
    var resize = function () {
      sizeView();
      var s = scale();
      c.width = Math.max(1, c.clientWidth * s | 0); c.height = Math.max(1, c.clientHeight * s | 0);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, stex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, c.width, c.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, stex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.activeTexture(gl.TEXTURE0);
      needsResize = false;
    };
    resize();
    if ('ResizeObserver' in window) {
      this.ro = new ResizeObserver(function (entries) {
        if (entries.some(function (entry) { return entry.target === c || entry.target === el; })) needsResize = true;
        else if(self.nativeView)syncNativeView();
        else viewDirty = true;
      });
      this.ro.observe(c);
      this.ro.observe(el);
      // Images or content above the section can move its origin without resizing it.
      this.ro.observe(document.body);
    }
    this.on(window, 'resize', function () { needsResize = true; });

    var look = { tx: 0, ty: 0, x: 0, y: 0 }, zoom = { t: 0, v: 0 };
    var shapeImpulse = 0, shapeAmount = 0, localAmount = 0, lastPointer = null, scrollPosition = window.scrollY || 0;
    var particlePointer = {x:0,y:0,presence:0,explosion:0,known:false,active:false,dirty:false,clientX:0,clientY:0};
    function refreshParticlePointer() {
      particlePointer.dirty=false;if(!particlePointer.known)return;
      var bounds=el.getBoundingClientRect(),input=c.getBoundingClientRect();
      particlePointer.active=particlePointer.clientX>=bounds.left&&particlePointer.clientX<=bounds.right&&particlePointer.clientY>=bounds.top&&particlePointer.clientY<=bounds.bottom;
      particlePointer.x=(particlePointer.clientX-input.left)/Math.max(1,input.width)*2-1;particlePointer.y=1-(particlePointer.clientY-input.top)/Math.max(1,input.height)*2;
    }
    var shapeAnchor = scrollPosition + this.surface.getBoundingClientRect().top;
    this.on(window, 'scroll', function () { scrollPosition = window.scrollY || 0; particlePointer.dirty=true; if(!self.nativeView){viewDirty=true;if(self.viewported)placeView();} }, { passive: true });
    this.on(window, 'resize', function () { shapeAnchor = (window.scrollY || 0) + self.surface.getBoundingClientRect().top; particlePointer.dirty=true; });
    this.on(this.surface, 'pointermove', function (e) {
      var b = el.getBoundingClientRect();
      self.inside = e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom;
      if (!self.inside) { look.tx = 0; look.ty = 0; particlePointer.active=false;particlePointer.known=false; return; }
      var inputBounds = self.viewported ? c.getBoundingClientRect() : b;
      look.tx = ((e.clientX - inputBounds.left) / inputBounds.width) * 2 - 1;
      look.ty = -(((e.clientY - inputBounds.top) / inputBounds.height) * 2 - 1);
      var pointerBounds=self.viewported?inputBounds:c.getBoundingClientRect();
      particlePointer.x=(e.clientX-pointerBounds.left)/Math.max(1,pointerBounds.width)*2-1;particlePointer.y=1-(e.clientY-pointerBounds.top)/Math.max(1,pointerBounds.height)*2;particlePointer.clientX=e.clientX;particlePointer.clientY=e.clientY;particlePointer.known=e.pointerType!=='touch';particlePointer.active=particlePointer.known;particlePointer.dirty=false;
      var stamp = performance.now();
      if (lastPointer && (self.disc.style === 'Floating shape' || self.disc.style === 'Morphing sculptures')) {
        var movement = Math.hypot(look.tx-lastPointer.x,look.ty-lastPointer.y),elapsed = Math.max(16,stamp-lastPointer.time);
        var proximity = self.disc.shapeMouseEffect==='Local explosion'?1:Math.exp(-(look.tx*look.tx+look.ty*look.ty)*.9);
        shapeImpulse = Math.max(shapeImpulse,Math.min(2,movement/elapsed*220*self.cur.shapeSensitivity)*proximity);
      }
      lastPointer = {x:look.tx,y:look.ty,time:stamp};
    }, { passive: true });
    function leaveParticles(){particlePointer.active=false;particlePointer.known=false;lastPointer=null;}
    this.on(this.surface, 'pointerleave', function () { look.tx = 0; look.ty = 0; self.inside = false; leaveParticles(); });
    this.on(this.surface, 'pointercancel', leaveParticles);
    this.on(window, 'blur', leaveParticles);
    this.on(document, 'visibilitychange', function(){if(document.hidden)leaveParticles();});
    this.on(el, 'pointerdown', function (e) {
      if (!self.background && e.button === 0 && !(e.target.closest && e.target.closest('a,button,input,select,textarea,label,[data-dh-ui]'))) zoom.t = 1;
    });
    var release = function () { zoom.t = 0; };
    this.on(window, 'pointerup', release); this.on(window, 'pointercancel', release); this.on(window, 'blur', release);
    this.on(c, 'webglcontextlost', function (e) { e.preventDefault(); self.pause(); el.classList.add('dh-nogl'); });

    var pal = PALETTES[this.cur.palette] || PALETTES['Electric blue'];
    var tint = [pal[0].slice(), pal[1].slice()];
    var last = 0, nextAt = 0, frameMs = 1000 / 30, active = false;
    var t = 0, flowPos = 0, vort = 0, spin = 0, spinDir = 1, TAU = Math.PI * 2;
    var discoAngle = 0, discoVelocity = self.cur.flow * .18;
    var autoAmount = 0, autoSpin = 0, autoAge = 0, autoWasEnabled = false;
    function schedule() {
      if (!active) return;
      // Sleep between rendered frames instead of waking on every display refresh.
      self.frameTimer = setTimeout(function () {
        self.frameTimer = 0;
        self.raf = requestAnimationFrame(loop);
      }, Math.max(1, nextAt - performance.now() - 4));
    }
    var loop = function () {
      // Use one clock for both timer scheduling and elapsed animation time.
      var now = performance.now();
      self.raf = 0;
      if (!active || self.disposed || staticMode() || !self.visible || document.hidden) { self.pause(); return; }
      if (now < nextAt - 4) { schedule(); return; }
      // Keep a deadline instead of accumulating timer/display-refresh drift.
      nextAt = Math.max(nextAt + frameMs, now + frameMs - 4);
      var frameTime = now - last, dt = Math.min(0.1, frameTime / 1000); last = now;
      // Back off resolution when sustained missed frames indicate a slower device.
      sampleTime += frameTime; frameSamples++;
      if (frameSamples >= 45) {
        slowFrames = sampleTime / frameSamples > 45 ? slowFrames + 1 : 0;
        if (slowFrames >= 2 && adaptive > 0.5) { adaptive = Math.max(0.5, adaptive * 0.8); needsResize = true; slowFrames = 0; }
        sampleTime = 0; frameSamples = 0;
      }
      t += dt; self.tick(t, dt);
      var cur = self.cur, d = self.disc, j, k;
      if (needsResize) resize();
      else if (viewDirty) placeView();
      if (d.style === 'Word rain') ensureWords();
      var range = cur.lookRange, kl = 1 - Math.exp(-dt * 2.2), kz = 1 - Math.exp(-dt * 3.5), kc = 1 - Math.exp(-dt * 2);
      look.x += (look.tx - look.x) * kl; look.y += (look.ty - look.y) * kl;
      zoom.v += (zoom.t * cur.warp - zoom.v) * (zoom.t ? 1 - Math.exp(-dt * 1.6) : kz);
      flowPos += dt * cur.flow * (1 + zoom.v * zoom.v * 14);
      var discoTarget = cur.flow * .18;
      if (d.style === 'Digital disco ball' && self.tgt.discoMouseControl && self.inside) {
        var aspect = Math.max(.1, c.clientWidth / Math.max(1, c.clientHeight));
        var projectedCenter = -2.5 * Math.tan(look.x * range * .65) / (aspect * (1 + .3 * zoom.v));
        var relativeX = look.tx - projectedCenter;
        var pull = Math.max(0, Math.min(1, (Math.abs(relativeX) - .06) / .6));
        discoTarget *= pull > 0 ? (relativeX < 0 ? -1 : 1) * (.2 + .8 * pull) : 0;
      }
      discoVelocity += (discoTarget - discoVelocity) * (1 - Math.exp(-dt * 5));
      discoAngle = (discoAngle + dt * discoVelocity) % TAU;
      shapeImpulse *= Math.exp(-dt / cur.shapeRecovery);
      var trigger = self.tgt.shapeTrigger, mouseShape = trigger === 'Mouse movement' || trigger === 'Mouse and scroll', scrollShape = trigger === 'Scroll' || trigger === 'Mouse and scroll';
      var scrollAmount = Math.max(0,Math.min(1,(scrollPosition-shapeAnchor)/Math.max(1,window.innerHeight*cur.shapeScrollDistance)));
      var localExplosion=d.shapeMouseEffect==='Local explosion';
      var shapeTarget = Math.max(mouseShape && d.shapeMouseEffect==='Whole sculpture explosion' ? shapeImpulse : 0,scrollShape ? scrollAmount : 0);
      localAmount += ((localExplosion&&mouseShape?shapeImpulse:0)-localAmount)*(1-Math.exp(-dt*8));
      if(particlePointer.dirty)refreshParticlePointer();
      particlePointer.presence+=((particlePointer.active?1:0)-particlePointer.presence)*(1-Math.exp(-dt/(particlePointer.active?.15:cur.shapeRecovery)));
      particlePointer.explosion=localAmount;
      shapeAmount += (shapeTarget-shapeAmount)*(1-Math.exp(-dt*8));
      var target = PALETTES[self.tgt.palette] || PALETTES['Electric blue'];
      for (j = 0; j < 2; j++) for (k = 0; k < 3; k++) tint[j][k] += (target[j][k] - tint[j][k]) * kc;
      var edge = self.inside ? Math.max(Math.abs(look.tx), Math.abs(look.ty)) : 0;
      vort += (Math.pow(Math.min(1, Math.max(0, (edge - 0.6) / 0.38)), 2) * cur.vortex - vort) * (1 - Math.exp(-dt * 3 / Math.max(0.1, cur.vortexRamp)));
      spinDir += ((look.tx < 0 ? -1 : 1) - spinDir) * (1 - Math.exp(-dt * 2));
      spin += dt * vort * 1.6 * spinDir;
      if (vort < 0.35) spin += (Math.round(spin / TAU) * TAU - spin) * (1 - Math.exp(-dt * 1.5));
      if (vort < 0.002) spin = 0;
      var autoEnabled = self.tgt.autoVortex;
      if (!autoEnabled || !autoWasEnabled) autoAge = 0;
      if (autoEnabled) autoAge += dt;
      autoWasEnabled = autoEnabled;
      var startup = cur.autoVortexRamp > 0.001 ? Math.min(1, autoAge / cur.autoVortexRamp) : 1;
      startup = startup * startup * (3 - 2 * startup);
      var autoTarget = autoEnabled ? cur.autoVortexStrength * startup : 0;
      autoAmount += (autoTarget - autoAmount) * (1 - Math.exp(-dt * 4));
      var autoDirection = self.tgt.autoVortexDirection === 'Counterclockwise' ? -1 : 1;
      autoSpin += dt * autoAmount * cur.autoVortexSpeed * 1.6 * autoDirection;
      if (!autoEnabled || cur.autoVortexStrength < 0.002) {
        autoSpin += (Math.round(autoSpin / TAU) * TAU - autoSpin) * (1 - Math.exp(-dt * 3));
        if (autoAmount < 0.002 && Math.abs(autoSpin / TAU - Math.round(autoSpin / TAU)) < 0.001) autoSpin = 0;
      }

      gl.useProgram(pr);
      gl.bindVertexArray(sceneVAO);
      gl.uniform2f(U.iResolution, c.width, c.height);
      gl.uniform1f(U.iTime, t);
      gl.uniform2f(U.uLook, look.x * range, look.y * range);
      gl.uniform1f(U.uZoom, zoom.v);
      gl.uniform3fv(U.uTint, tint[0]); gl.uniform3fv(U.uTint2, tint[1]);
      gl.uniform1f(U.uDensity, cur.density);
      gl.uniform1f(U.uFlow, flowPos);
      gl.uniform1f(U.uGlow, cur.glow);
      gl.uniform1f(U.uBright, cur.brightness);
      gl.uniform1f(U.uMulti, cur.multicolor);
      gl.uniform1f(U.uKal, d.kaleidoscopeMode === 'Whole screen' ? 0 : d.kaleidoscope);
      gl.uniform1f(U.uStyle, Math.max(0, STYLES.indexOf(d.style)));
      gl.uniform1f(U.uLEDPattern, Math.max(0, ['Cycle', 'Fireworks', 'Waves', 'Shapes'].indexOf(d.ledPattern)));
      gl.uniform1f(U.uDiscoRotation, discoAngle);
      gl.uniform1f(U.uVort, vort * spinDir); gl.uniform1f(U.uSpin, spin);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, c.width, c.height);
      if ((d.style === 'Floating shape' || d.style === 'Morphing sculptures')) {
        if (!self.floating) { try { self.floating = makeFloating(gl); } catch (e) { self.error = String(e); self.pause(); el.classList.add('dh-nogl'); return; } }
        particlePointer.tessMode=TESSELLATIONS.indexOf(self.tgt.tessellation);particlePointer.tessDensity=cur.tessellationDensity;particlePointer.tessZoom=cur.tessellationZoom;particlePointer.tessRotation=cur.tessellationRotation*Math.PI/180;
        particlePointer.fullKal=d.kaleidoscopeMode==='Forward elements'?0:d.kaleidoscope;particlePointer.autoVortex=autoAmount*autoDirection;particlePointer.autoSpin=autoSpin;particlePointer.time=t;
        self.floating.draw(cur,d,flowPos,shapeAmount,c.width,c.height,look,tint,self.quality,Math.max(0,Math.min(1,(scrollPosition-shapeAnchor)/Math.max(1,window.innerHeight*cur.morphScrollDistance))),particlePointer);
      } else gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, stex); gl.generateMipmap(gl.TEXTURE_2D);
      gl.useProgram(pp);
      gl.bindVertexArray(postVAO);
      gl.uniform1i(PU.uScene, 3); gl.uniform2f(PU.uRes, c.width, c.height); gl.uniform1f(PU.uWarp, zoom.v);
      gl.uniform1f(PU.uBloom, cur.bloom); gl.uniform3fv(PU.uTint2, tint[1]); gl.uniform1f(PU.uNight, 1); gl.uniform1f(PU.uTime, t);
      gl.uniform1f(PU.uFullKal, d.kaleidoscopeMode === 'Forward elements' ? 0 : d.kaleidoscope);
      gl.uniform1f(PU.uAutoVort, autoAmount * autoDirection); gl.uniform1f(PU.uAutoSpin, autoSpin);
      gl.uniform1i(PU.uTessMode, TESSELLATIONS.indexOf(self.tgt.tessellation));
      gl.uniform1f(PU.uTessDensity, cur.tessellationDensity); gl.uniform1f(PU.uTessZoom, cur.tessellationZoom); gl.uniform1f(PU.uTessRotation, cur.tessellationRotation*Math.PI/180);
      gl.uniform1i(PU.uBlendSource, self.tgt.blendSource === 'Background gradient' ? 1 : 0);
      gl.uniform1i(PU.uBlendMode, BLEND_MODES.indexOf(self.tgt.blendMode));
      gl.uniform1f(PU.uBlendAmount, cur.blendAmount); gl.uniform3fv(PU.uBlendColor, self.blendColor);
      gl.uniform1f(PU.uOp, Math.max(0, cur.opacity) * self.fade);
      gl.uniform3fv(PU.uBg1, self.bg1); gl.uniform3fv(PU.uBg2, self.bg2);
      gl.uniform1f(PU.uGT, d.gradient === 'Linear' ? 1 : 0); gl.uniform1f(PU.uAng, cur.gradientAngle * Math.PI / 180);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindVertexArray(null);
      schedule();
    };
    this.pause = function () { active = false; cancelAnimationFrame(self.raf); clearTimeout(self.frameTimer); self.raf = self.frameTimer = 0; zoom.t = 0; };
    this.resume = function () {
      if (active || el.classList.contains('dh-nogl')) return;
      active = true; needsResize = true;
      last = performance.now() - frameMs; nextAt = last + frameMs;
      sampleTime = 0; frameSamples = 0; slowFrames = 0;
      self.raf = requestAnimationFrame(loop);
    };
    this.releaseGPU = function () {
      if (self.floating) self.floating.dispose();
      gl.deleteTexture(tex); gl.deleteTexture(wt); gl.deleteTexture(stex);
      gl.deleteFramebuffer(fbo); gl.deleteVertexArray(sceneVAO); gl.deleteVertexArray(postVAO);
      gl.deleteBuffer(buf); gl.deleteProgram(pr); gl.deleteProgram(pp);
    };
    if (!staticMode() && self.visible && !document.hidden) this.resume();
    return true;
  };

  var api = window.FloatingShapeHero = window.FloatingShapeHero || { instances: [] };
  api.Hero = Hero;
  api.palettes = Object.keys(PALETTES);
  api.styles = STYLES.slice();
  api.mount = function (root) {
    (root || document).querySelectorAll('.dh-hero:not([data-dh-mounted])').forEach(function (el) {
      if (el.__dhScene) return;
      if (prepareBackground(el) === false) return;
      el.setAttribute('data-dh-mounted', '1');
      var hero = new Hero(el);
      el.__dh = hero;
      api.instances.push(hero);
    });
  };
  if (!window.DH_SCENES) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { api.mount(); });
    else api.mount();
  }
})();
