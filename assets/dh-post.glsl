#version 300 es
precision highp float;
uniform float uOp;uniform vec3 uBg1;uniform vec3 uBg2;uniform float uGT;uniform float uAng;uniform sampler2D uScene;uniform vec2 uRes;uniform float uWarp;uniform float uBloom;uniform vec3 uTint2;uniform float uNight;uniform float uTime;
out vec4 o;
uniform float uFullKal,uKalCentered,uAutoVort,uAutoSpin;
uniform int uTessMode;
uniform float uTessDensity,uTessZoom,uTessRotation;
uniform int uBlendMode;
uniform int uBlendSource;
uniform float uBlendAmount;
uniform vec3 uBlendColor;
// W3C compositing blend functions. The animation is the backdrop; the chosen
// color is the source layer. Run after bloom, in this existing compositor pass.
float blendLum(vec3 c){return dot(c,vec3(.3,.59,.11));}
float blendSat(vec3 c){return max(c.r,max(c.g,c.b))-min(c.r,min(c.g,c.b));}
vec3 blendClip(vec3 c){
  float l=blendLum(c),n=min(c.r,min(c.g,c.b)),x=max(c.r,max(c.g,c.b));
  if(n<0.)c=vec3(l)+(c-l)*l/max(l-n,.000001);
  if(x>1.)c=vec3(l)+(c-l)*(1.-l)/max(x-l,.000001);
  return c;
}
vec3 blendSetLum(vec3 c,float l){return blendClip(c+(l-blendLum(c)));}
vec3 blendSetSat(vec3 c,float s){float n=min(c.r,min(c.g,c.b)),d=blendSat(c);return d>.000001?(c-n)*s/d:vec3(0.);}
float blendChannel(float b,float s,int mode){
  if(mode==1)return b*s;
  if(mode==2)return b+s-b*s;
  if(mode==3)return b<=.5?2.*b*s:1.-2.*(1.-b)*(1.-s);
  if(mode==4)return min(b,s);
  if(mode==5)return max(b,s);
  if(mode==6)return b==0.?0.:s==1.?1.:min(1.,b/(1.-s));
  if(mode==7)return b==1.?1.:s==0.?0.:1.-min(1.,(1.-b)/s);
  if(mode==8)return s<=.5?2.*b*s:1.-2.*(1.-b)*(1.-s);
  if(mode==9){float d=b<=.25?((16.*b-12.)*b+4.)*b:sqrt(b);return s<=.5?b-(1.-2.*s)*b*(1.-b):b+(2.*s-1.)*(d-b);}
  if(mode==10)return abs(b-s);
  return b+s-2.*b*s;
}
vec3 blendGrade(vec3 b,vec3 s,int mode){
  if(mode==12)return blendSetLum(blendSetSat(s,blendSat(b)),blendLum(b));
  if(mode==13)return blendSetLum(blendSetSat(b,blendSat(s)),blendLum(b));
  if(mode==14)return blendSetLum(s,blendLum(b));
  if(mode==15)return blendSetLum(b,blendLum(s));
  return vec3(blendChannel(b.r,s.r,mode),blendChannel(b.g,s.g,mode),blendChannel(b.b,s.b,mode));
}
vec3 br(vec3 c,float th){return max(c-th,0.)/(1.-th);}
vec2 tessellationUV(vec2 uv){
  if(uTessMode==0)return uv;
  vec2 aspect=vec2(uRes.x/uRes.y,1.),p=(uv-.5)*aspect;
  float cs=cos(uTessRotation),sn=sin(uTessRotation);
  p=mat2(cs,-sn,sn,cs)*p*max(1.,uTessDensity);
  vec2 q;
  if(uTessMode==1)q=fract(p+.5)-.5;
  else if(uTessMode==2)q=1.-abs(mod(p+.5,2.)-1.)-.5;
  else if(uTessMode==3){
    // Equilateral lattice: reflect the upper triangle onto the lower one.
    vec2 f=fract(vec2(p.x-p.y/1.7320508,p.y/.8660254));
    if(f.x+f.y>1.)f=vec2(1.)-f.yx;
    q=vec2(f.x+.5*f.y-.5,(f.y-1./3.)*.8660254);
  }else{
    // Nearest center in two staggered rectangular lattices gives hex cells.
    vec2 spacing=vec2(1.,1.7320508);
    vec2 a=mod(p+spacing*.5,spacing)-spacing*.5,b=mod(p,spacing)-spacing*.5;
    q=dot(a,a)<dot(b,b)?a:b;
  }
  vec2 source=.5+q/(aspect*max(.5,uTessZoom));
  return 1.-abs(mod(source,2.)-1.);
}
vec2 effectUV(vec2 uv){
  uv=tessellationUV(uv);
  if(uFullKal<1.5&&abs(uAutoVort)<.001&&abs(uAutoSpin)<.001)return uv;
  vec2 aspect=vec2(uRes.x/uRes.y,1.),p=(uv-.5)*aspect;float radius=length(p);
  if(abs(uAutoVort)>.001||abs(uAutoSpin)>.001){
    float angle=uAutoSpin+uAutoVort*abs(uAutoVort)*3.2*exp(-radius*2.2),cs=cos(angle),sn=sin(angle);
    p=mat2(cs,-sn,sn,cs)*p;
  }
  if(uFullKal>1.5){
    float sector=6.2831853/floor(uFullKal),angle=mod(atan(p.y,p.x)+uTime*.04,sector);
    angle=1.5707963-sector*.5+abs(angle-sector*.5);
    // Fit the viewport's full diagonal into the captured source wedge.
    // Without this, widescreen corners rotate above the texture and disappear.
    vec2 safeHalf=max(vec2(.5)-2./uRes,vec2(.001));
    float reach=min(safeHalf.x*aspect.x/max(sin(sector*.5),.0001),safeHalf.y);
    float fit=uKalCentered>.5?1.:min(1.,reach/(.5*length(aspect)));
    p=length(p)*fit*vec2(cos(angle),sin(angle));
  }
  // A vortex moves one scene beyond the frame; it must not reflect it back.
  // Deliberate tile repeats and angular kaleidoscope folds happen above.
  return .5+p/aspect;
}
float sourceCoverage(vec2 uv){
  if(uFullKal>1.5&&uKalCentered<.5){
    // Angular mirrors deliberately fill the frame; only antialias the boundary.
    vec2 edge=min(uv,1.-uv);
    return smoothstep(0.,2./uRes.x,edge.x)*smoothstep(0.,2./uRes.y,edge.y);
  }
  if(uFullKal<1.5&&abs(uAutoVort)<.001&&abs(uAutoSpin)<.001)return 1.;
  float turning=clamp(abs(uAutoVort)*2.+abs(sin(uAutoSpin))*2.+step(1.5,uFullKal),0.,1.);
  vec2 edge=min(uv,1.-uv),feather=max(2./uRes+vec2(.16)*turning,fwidth(uv)*1.25);
  return smoothstep(0.,feather.x,edge.x)*smoothstep(0.,feather.y,edge.y);
}
vec3 sceneSample(vec2 uv,float lod){
  return textureLod(uScene,uv,lod).rgb*sourceCoverage(uv);
}
void main(){
  vec2 baseUV=gl_FragCoord.xy/uRes,uv=effectUV(baseUV),cen=vec2(.5,.52),dv=uv-cen;
  vec3 col=vec3(0.);
  // Reuse existing mip levels when many tiles shrink the source image.
  float detailLOD=uTessMode>0?max(0.,log2(max(1.,uTessDensity/max(.5,uTessZoom)))):0.;
  float w=clamp(uWarp,0.,2.5),ws=0.;
  if(w<.001){col=sceneSample(uv,detailLOD);ws=1.;}else for(int i=0;i<WARP_TAPS;i++){float f=float(i)/float(WARP_TAPS-1);float k=1.-w*.16*f*f;float wt=1.-f*.6;col+=sceneSample(cen+dv*k,detailLOD)*wt;ws+=wt;}
  col/=ws;
  if(uBloom>.001){
  float th=mix(.95,.42,uNight);
  vec3 b=br(sceneSample(uv,2.+detailLOD),th)*.5+br(sceneSample(uv,3.+detailLOD),th)*.7+br(sceneSample(uv,4.+detailLOD),th)*.9+br(sceneSample(uv,5.+detailLOD),th)*1.1;
  vec3 st=vec3(0.);
  for(int i=-7;i<=7;i++){float fi=float(i);st+=br(sceneSample(uv+vec2(fi*.022,0.),3.+detailLOD),th+.12)*exp(-abs(fi)*.32);}
  vec2 gu=cen-dv*.55;vec3 gh=br(sceneSample(gu,4.+detailLOD),th+.1)*.35+br(sceneSample(cen-dv*1.3,5.+detailLOD),th+.1)*.2;
  float vg=smoothstep(.8,.1,length(dv));
  col+=uBloom*mix(.2,1.,uNight)*(b*.32+st*uNight*mix(vec3(.5,.7,1.),uTint2,.5)*.09+gh*uTint2*vg*.6);
  }
  float l=dot(col,vec3(.3,.5,.2));
  col=mix(col,vec3(l)*1.15+col*.25,w*.12)+w*.06*smoothstep(.05,.6,length(dv))*mix(vec3(.6,.8,1.),uTint2,.5)*l;
  vec2 ac=(baseUV-.5)*vec2(uRes.x/uRes.y,1.);
  float gt=uGT>.5?clamp(dot(ac,vec2(cos(uAng),sin(uAng)))/(.5*(abs(cos(uAng))*uRes.x/uRes.y+abs(sin(uAng))))*.5+.5,0.,1.):clamp(length(ac)/(.5*length(vec2(uRes.x/uRes.y,1.))),0.,1.);
  vec3 bg=mix(uBg1,uBg2,smoothstep(0.,1.,gt));
  col*=uOp*sourceCoverage(uv);
  vec3 elements=clamp(col,0.,1.);
  col=1.-(1.-bg)*(1.-elements);
  if(uBlendMode>0&&uBlendAmount>0.){
    // The gradient grades emitted light only, leaving empty background pixels
    // intact. Use the displayed gradient coordinates, including linear angle.
    float coverage=uBlendSource==1?max(elements.r,max(elements.g,elements.b)):1.;
    vec3 source=uBlendSource==1?bg:uBlendColor;
    col=mix(col,clamp(blendGrade(col,source,uBlendMode),0.,1.),uBlendAmount*coverage);
  }
  col+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;
  o=vec4(col,1.);
}
