/*! Kaleidoscope Hero renderer v1.0.0 */
(function () {
  'use strict';
  var FRAG = "#version 300 es\nprecision highp float;\nuniform vec2 uMouse;float gFS=1.;uniform float uVort;uniform float uSpin;uniform vec2 iResolution;uniform float iTime;uniform vec2 uLook;uniform float uZoom;uniform float uNight;\nuniform vec3 uTint;uniform vec3 uTint2;uniform float uDensity;uniform float uFlow;uniform float uGlow;uniform float uWarm;uniform float uBright;uniform float uMulti;uniform float uStyle;uniform float uKal;\nvec3 spec(float x){return clamp(.55+.55*cos(6.2832*(x+vec3(0.,.33,.67))),0.,1.)*1.1;}\nuniform sampler2D iChannel0;\nout vec4 outColor;\n#define time (iTime+285.)\nvec3 L;\nfloat noise(const in vec3 x){vec3 p=floor(x),f=fract(x);f=f*f*(3.-2.*f);\n  vec2 uv=(p.xy+vec2(37.,17.)*p.z)+f.xy;vec2 rg=textureLod(iChannel0,(uv+.5)/256.,0.).yx;return mix(rg.x,rg.y,f.z);}\nconst mat2 m2=mat2(.6,-.8,.8,.6);\nconst mat3 m3=mat3(0.,.8,.6,-.8,.36,-.48,-.6,-.48,.64);\nfloat fbm(in vec3 p){float f=0.;f+=.5*noise(p);p=m3*p*2.02;f+=.25*noise(p);p=m3*p*2.03;f+=.125*noise(p);p=m3*p*2.01;f+=.0625*noise(p);return f/.9375;}\nfloat hash(float n){return fract(sin(n)*43758.5453);}\nvec3 hash3(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return fract(sin(p)*43758.5453);}\nfloat sdBox(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}\nconst vec3 CELL=vec3(3.,1.8,4.5);\nfloat glow(float d){return 34./(1.+d*d*9000.)+uGlow*.12/(1.+d*d*60.);}\n\n// Infinite digital field: one cell of data streaks, columns and blocks, domain-repeated through space.\nvec3 field(vec3 ro,vec3 rd,float tmax){\n  vec3 acc=vec3(0.);\n  float t=.2+.3*hash(dot(gl_FragCoord.xy,vec2(12.9898,78.233))+fract(iTime));\n  float zoff=mod(uFlow*gFS,4500.);\n  for(int i=0;i<100;i++){\n    if(t>tmax)break;\n    vec3 p=ro+rd*t;\n    if((p.y>13.&&rd.y>0.)||(p.y<.04&&rd.y<0.))break;\n    p.z+=zoff;\n    vec3 pp=p-vec3(-1.5,.08,0.);\n    vec3 id=floor(pp/CELL),q=pp-(id+.5)*CELL;\n    float dmin=1e3;vec3 e=vec3(0.);\n    if(id.y>=0.&&id.y<7.){\n      vec3 h=hash3(id),h2=hash3(id+17.3),hv=hash3(vec3(id.x,0.,id.z)+5.1);\n      vec3 c=mix(uTint,uTint2,h2.x);\n      float mc=step(1.-uMulti,hash(dot(id,vec3(7.1,3.7,11.3))));\n      float d;\n      if(h.x<uDensity){\n        vec2 o=(h.yz-.5)*CELL.xy*.8;float len=CELL.z*(.08+.42*h2.y),oz=(h2.z-.5)*(CELL.z-2.*len);\n        d=length(vec3(q.xy-o,max(abs(q.z-oz)-len,0.)));dmin=min(dmin,d);\n        float dash=mix(1.,step(.45,fract(q.z*2.2+h.y*9.)),step(.55,h2.y));\n        vec3 cs=mix(c,spec(h.y+(q.z-oz)/max(len,.01)*.22+iTime*.03),mc);\n        e+=cs*dash*glow(d);\n      }\n      if(hv.x<uDensity*.3&&id.y<hv.z*7.){\n        vec2 o=(hv.yz-.5)*CELL.xz*.8;\n        d=length(q.xz-o);dmin=min(dmin,d);\n        float bits=mix(1.,step(.5,fract(pp.y*4.+hv.y*13.)),step(.4,hv.x/max(uDensity*.3,.001)));\n        e+=uTint*bits*.55*glow(d);\n      }\n      if(h2.y>1.-uDensity*.25){\n        vec2 o=(vec2(h.z,h2.z)-.5)*CELL.yz*.8;float len=CELL.x*(.1+.3*h.y);\n        d=length(vec3(max(abs(q.x)-len,0.),q.y-o.x,q.z-o.y));dmin=min(dmin,d);\n        e+=mix(c,spec(h.z+q.x/max(len,.01)*.2),mc)*.7*glow(d);\n      }\n      if(h.z>1.-uDensity*.4){\n        vec3 o=(h2.zyx-.5)*CELL*.7;float s=.05+.14*h.y;\n        d=sdBox(q-o,vec3(s,s,.01));dmin=min(dmin,d);\n        float blink=.35+.65*step(.3,fract(iTime*(.15+h2.x*.4)+h.x*7.));\n        e+=mix(mix(c,spec(h2.y+iTime*.05),mc),vec3(.85,.95,1.),.3)*blink*1.4*glow(max(d,0.));\n      }\n    }\n    float dt=clamp(dmin*.8,.03+t*.004,.6+t*.02);\n    acc+=e*dt*smoothstep(1.5,5.,t)*exp(-t*.055);\n    t+=dt;\n  }\n  return acc*.6;\n}\nfloat shapeV(int k,vec2 c,vec2 id,float rr,float R0,float z){\n  if(k==0)return rr/R0;\n  if(k==1)return max(abs(c.y-1.5*sin(c.x*.75+z*.05+iTime*.3))/1.,abs(c.x)/(R0*2.2));\n  if(k==2)return max(abs(fract(c.y*.32+.3*sin(c.x*.6+z*.04+iTime*.2))-.5)*4.4,length(c*vec2(.6,1.))/(R0*1.3));\n  return max(1.7*hash(dot(floor(id/3.),vec2(13.1,7.7))+floor(z*.03)),rr/(R0*1.6));\n}\nfloat sheetH(int k,vec2 xz,float zo){\n  float fk=float(k),z=xz.y+zo;\n  float cx=(5.5+fk*2.)*sin(z*.045+fk*2.1+iTime*.07)+(fk-1.)*5.;\n  float x=xz.x-cx;\n  return 3.2+fk*1.6+(1.4+fk*.4)*sin(x*.38+z*.11+iTime*.35+fk)+.9*sin(z*.07-x*.2+iTime*.22+fk*3.)+.25*x*sin(z*.03+fk);\n}\n// Pixel-aware point filtering and refined intersections prevent temporal shimmer.\nvec3 particles(vec3 ro,vec3 rd,float tmax){\n  vec3 acc=vec3(0.);\n  float footprint=max(length(dFdx(rd)),length(dFdy(rd)));\n  float zo=mod(uFlow*.3*gFS,4000.);\n  float g=mix(.3,.09,uDensity);\n  for(int k=0;k<3;k++){\n    if(uStyle<1.5)break;\n    float fk=float(k),t=1.2,pt=t,pf=(ro+rd*t).y-sheetH(k,(ro+rd*t).xz,zo);\n    for(int i=0;i<48;i++){\n      t+=.35+t*.06;if(t>tmax)break;\n      vec3 p=ro+rd*t;float f=p.y-sheetH(k,p.xz,zo);\n      if(sign(f)!=sign(pf)){\n        float a=pt,b=t;\n        for(int j=0;j<8;j++){float m=.5*(a+b);vec3 q=ro+rd*m;float fm=q.y-sheetH(k,q.xz,zo);if(sign(fm)==sign(pf))a=m;else b=m;}\n        float th=.5*(a+b);vec3 P=ro+rd*th;\n        float z=P.z+zo,cx=(5.5+fk*2.)*sin(z*.045+fk*2.1+iTime*.07)+(fk-1.)*5.,xr=P.x-cx;\n        float wid=2.6+1.4*sin(z*.06+fk*1.7+iTime*.1);\n        float band=smoothstep(wid,wid*.45,abs(xr));\n        if(band>.001){\n          vec2 uv=vec2(xr,z)/vec2(g,g*2.6);\n          vec2 cl=fract(uv)-.5;float dd=length(cl*vec2(g,g*2.6));\n          float px=max(th*.0022+.002,th*footprint*1.3),r=g*.2;\n          float dotm=1.6*smoothstep(r+px,max(r-px,0.),dd)+.2*uGlow*exp(-dd*dd/(r*r*9.));\n          dotm=mix(dotm,.18+.06*uGlow,smoothstep(g*.6,g*2.5,px));\n          float sh=hash(dot(floor(uv),vec2(17.1,93.7))+fk*7.);\n          float tw=.82+.18*sin(iTime*(.5+sh*1.2)+sh*40.);\n          float gx=clamp(xr/wid*.5+.5,0.,1.);\n          vec3 c=mix(uTint,uTint2,gx);\n          c=mix(c,spec(gx*.6+fk*.25+z*.004+iTime*.02),uMulti);\n          c=pow(c,vec3(2.2))*2.+vec3(1.,.45,.1)*pow(band,8.)*.6;\n          acc+=c*dotm*band*tw*(.6+.8*pow(band,3.))*exp(-th*.03)*smoothstep(80.,40.,th)*smoothstep(3.,8.,th);\n        }\n      }\n      pt=t;pf=f;\n    }\n  }\n  return acc*1.4;\n}\nvec3 fibers(vec3 ro,vec3 rd,float tmax){\n  vec3 acc=vec3(0.);\n  float t=.2+.3*hash(dot(gl_FragCoord.xy,vec2(12.9898,78.233))+fract(iTime));\n  float zoff=mod(uFlow*gFS,4500.);\n  const vec2 C=vec2(.12,.09);const vec2 G=vec2(1.5,1.25);\n  for(int i=0;i<100;i++){\n    if(t>tmax)break;\n    vec3 p=ro+rd*t;\n    if((p.y>11.&&rd.y>0.)||(p.y<.04&&rd.y<0.))break;\n    float z=p.z+zoff*.15;\n    float bend=smoothstep(1.,26.,p.z);\n    float s=1./(1.+max(p.z,0.)*.065);\n    vec2 cen=vec2(1.2*sin(iTime*.1)*bend,0.);\n    vec2 lc=vec2(p.x,p.y-.12)/s-cen;\n    vec2 pp=lc;\n    pp+=vec2(.5*sin(z*.22+pp.y*.9+iTime*.5),.3*sin(z*.18+pp.x*1.1+iTime*.4))*bend;\n    float pm=fract(z*.008+iTime*.02)*4.,pf=smoothstep(.7,1.,fract(pm));int pa=int(pm),pb=(pa+1)%4;\n    float R0=3.4+1.*sin(z*.03+iTime*.2);\n    vec2 id0=floor(pp/C),q0=pp-(id0+.5)*C,sg=sign(q0);\n    float d=1e3;vec3 e=vec3(0.);\n    for(int k=0;k<4;k++){\n      vec2 off=vec2(float(k&1),float(k>>1))*sg;\n      vec2 id=id0+off,q=q0-off*C;\n      vec2 gc=(id+.5)*C;\n      if(gc.y<.15)continue;\n      vec2 gid=floor(gc/G);\n      float ep=floor((p.z+zoff)*.012+hash(dot(gid,vec2(3.1,7.7))));\n      vec3 gh=hash3(vec3(gid,ep+.5));\n      vec2 gcen=(gid+.5)*G+(gh.xy-.5)*G*.3;\n      float gr=sqrt((20.+30.*gh.z)*C.x*C.y/3.1416);\n      float inG=smoothstep(gr,gr*.8,length(gc-gcen));\n      if(inG<=0.||gcen.y<gr+.2)continue;\n      if(hash(gh.z*91.7+ep*1.3)>.2+uDensity*.75)continue;\n      vec2 sc=gcen-vec2(0.,3.4);\n      float fade=inG*smoothstep(1.25,.8,mix(shapeV(pa,sc,gid,length(sc),R0,z),shapeV(pb,sc,gid,length(sc),R0,z),pf));\n      vec3 hh=hash3(vec3(id,3.1));\n      if(fade<=0.||hh.x>=.92)continue;\n      vec2 o=(hh.yz-.5)*C*.3;\n      float dd=length(q-o);d=min(d,dd);\n      vec3 c=mix(uTint,uTint2,step(.5,hh.y));\n      float mc=step(1.-uMulti,fract(hh.z*13.7));\n      c=mix(c,spec(hh.z+p.z*.012+iTime*.02),mc);\n      float spd=(.3+1.9*fract(hh.x*57.3+hh.y*11.1))*(.6+.8*gh.y);\n      float ze=2.+mod(hh.y*70.-zoff*.35*spd,70.),dz=p.z-ze;\n      if(dz<-1.5)continue;\n      float life=smoothstep(2.,9.,ze),ddw=dd*s;\n      float body=step(0.,dz)*(.3+.9*exp(-dz*.04))*life;\n      float tq=ddw*ddw+dz*dz*.02;\n      float tip=life*(120./(1.+tq*12000.)+uGlow*.5/(1.+tq*1500.));\n      float win=smoothstep(.62,.25,dd);\n      c*=fade;\n      e+=c*body*(30./(1.+dd*dd*30000.)+uGlow*.025/(1.+dd*dd*80.)*win);\n      e+=mix(c,vec3(1.),.5)*tip;\n    }\n    float dt=clamp(d*.4*s,.02+t*.003,.2+t*.008);\n    acc+=e*dt*smoothstep(1.5,5.,t)*exp(-t*.03)*smoothstep(80.,45.,t);\n    t+=dt;\n  }\n  float cd=max(dot(rd,vec3(0.,0.,1.)),0.);\n  acc+=mix(uTint2,vec3(1.),.55)*(pow(cd,3000.)*1.6+pow(cd,250.)*.45+pow(cd,30.)*.08)*(.4+.6*uDensity);\n  return acc*.6;\n}\nvec3 wireTunnel(vec3 rd){\n  float r=length(rd.xy)+1e-4,z=1.6*max(rd.z,.001)/r;\n  float zz=z+uFlow*1.4;\n  float a=atan(rd.y,rd.x)+zz*.012+.35*sin(zz*.045+iTime*.25)+iTime*.03;\n  float N=floor(mix(10.,40.,uDensity)),u=a/6.2832*N,v=zz*mix(.5,1.4,uDensity);\n  float du=max(fwidth(u),1e-4),dv=max(fwidth(v),1e-4);\n  float eu=.5-abs(fract(u)-.5),ev=.5-abs(fract(v)-.5);\n  float lu=smoothstep(1.4,0.,eu/du)*smoothstep(.6,.2,du),lv=smoothstep(1.4,0.,ev/dv)*smoothstep(.6,.2,dv);\n  float far=smoothstep(.6,.2,max(du,dv));\n  float gl=uGlow*.08*(exp(-eu*7.)+exp(-ev*7.))*far;\n  float iu=floor(u+.5),hu=hash(iu*7.31);\n  vec3 c=mix(uTint,uTint2,step(.5,hash(iu*3.7+floor(v*.1))));\n  c=mix(c,spec(zz*.008+iu/N),uMulti);\n  float ph=fract(zz*(.03+.04*hu)-iTime*(.15+.3*hu)+hu*9.);\n  float pulse=exp(-ph*30.)*step(.55,hash(floor(zz*(.03+.04*hu)-iTime*(.15+.3*hu)+hu*9.)+iu));\n  float fade=exp(-z*.035)*smoothstep(.3,1.5,z);\n  vec3 e=c*((lu+lv)*.55+gl)+mix(c,vec3(1.),.4)*pulse*lu*3.;\n  e+=uTint2*.35*exp(-r*r*900.);\n  return e*fade*1.4;\n}\nvec3 dataRings(vec3 rd){\n  float r=length(rd.xy)+1e-4,a=atan(rd.y,rd.x);\n  vec3 e=vec3(0.);\n  float S=mix(2.4,.9,uDensity);\n  for(int L=0;L<3;L++){\n    float fl=float(L),R=1.+fl*.55;\n    float zi=R*max(rd.z,.001)/r;\n    float off=uFlow*(1.1+fl*.25)+fl*.7;\n    float q=(zi+off)/S,cell=floor(q),dz=(fract(q)-.5)*S;\n    float d=abs(dz)*r/max(rd.z,.001);\n    vec3 hh=hash3(vec3(cell,fl,1.7));\n    if(hh.x>.82)continue;\n    float segN=floor(4.+hh.y*22.);\n    float ar=a+iTime*(hh.z-.5)*1.4+hh.x*6.;\n    float sf=ar/6.2832*segN,si=floor(sf),sp=fract(sf);\n    float sh=hash(si+cell*13.+fl*7.);\n    float on=step(.25,sh)*(.65+.35*sin(iTime*(3.+sh*9.)+sh*30.));\n    float gap=smoothstep(0.,.06,sp)*smoothstep(1.,.94,sp);\n    float w=.012+.008*hh.z;\n    float line=1./(1.+pow(d/w,2.)*3.)*smoothstep(w*6.,w,d);\n    float halo=uGlow*.035/(1.+pow(d/(w*2.5),2.));\n    vec3 c=mix(uTint,uTint2,step(.5,hh.z));\n    c=mix(c,spec(hh.y+sh*.3+iTime*.02),uMulti);\n    float pk=step(.9,sh)*exp(-pow((sp-.5)*10.,2.));\n    float fade=exp(-zi*.05)*smoothstep(.4,2.,zi);\n    e+=(c*(line*on*gap*1.2+halo*on)+mix(c,vec3(1.),.5)*pk*line*4.)*fade;\n  }\n  e+=uTint2*.3*exp(-r*r*700.);\n  return e;\n}\nvec2 h22(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453);}\nvec3 voroCrystal(vec3 rd){\n  float r=length(rd.xy)+1e-4,z=1.6*max(rd.z,.001)/r,zz=z+uFlow*1.2;\n  float a=atan(rd.y,rd.x)+zz*.01+iTime*.02;\n  float N=floor(mix(8.,26.,uDensity));\n  vec2 x=vec2(a/6.2832*N,zz*mix(.35,.9,uDensity));\n  vec2 n=floor(x),f=fract(x),mg,mr;float md=8.;\n  for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 g=vec2(i,j),cid=n+g;cid.x=mod(cid.x,N);vec2 o=h22(cid);o=.5+.4*sin(iTime*.4+6.2832*o);vec2 rr=g+o-f;float d=dot(rr,rr);if(d<md){md=d;mr=rr;mg=g;}}\n  md=8.;\n  for(int j=-2;j<=2;j++)for(int i=-2;i<=2;i++){vec2 g=mg+vec2(i,j),cid=n+g;cid.x=mod(cid.x,N);vec2 o=h22(cid);o=.5+.4*sin(iTime*.4+6.2832*o);vec2 rr=g+o-f;if(dot(mr-rr,mr-rr)>1e-5)md=min(md,dot(.5*(mr+rr),normalize(rr-mr)));}\n  vec2 cid=n+mg;cid.x=mod(cid.x,N);float ch=hash(dot(cid,vec2(7.1,13.3)));\n  float px=max(2.*fwidth(x.y),1e-4);\n  float edge=smoothstep(px*2.,0.,md-.012)+uGlow*.12*exp(-md*14.);\n  float detail=smoothstep(.5,.15,px);\n  vec3 c=mix(uTint,uTint2,ch);c=mix(c,spec(ch+zz*.006),uMulti);\n  float pulse=exp(-fract(zz*.02-iTime*.1+ch*5.)*12.)*step(.7,ch);\n  vec3 e=c*edge*(.8+2.*pulse)*detail+c*.06*(.3+.7*ch)*(1.-smoothstep(0.,.5,length(mr)))*detail;\n  e+=uTint2*.3*exp(-r*r*800.);\n  return e*exp(-z*.04)*smoothstep(.3,1.5,z)*1.3;\n}\nfloat segD(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;return length(pa-ba*clamp(dot(pa,ba)/dot(ba,ba),0.,1.));}\nvec2 cNode(vec2 c,float fl){vec2 hh=h22(c+fl*3.);return c+.5+.36*sin(hh*6.2832+iTime*(.15+hh.yx*.2));}\nvec3 constellation(vec3 rd){\n  vec2 uv=rd.xy/max(rd.z,.05);\n  vec3 e=vec3(0.);\n  float sp=uFlow*.04,fire=.06+.22*uDensity;\n  float fuv=max(length(fwidth(uv)),1e-5);\n  for(int L=0;L<4;L++){\n    float fl=float(L),cyc=fl/4.+sp,dep=fract(cyc),gen=floor(cyc);\n    float sc=mix(14.,.6,dep);\n    float fade=smoothstep(0.,.3,dep)*smoothstep(1.,.82,dep);\n    if(fade<=0.)continue;\n    float ca=cos(fl*1.3+gen),sa=sin(fl*1.3+gen);\n    vec2 g=mat2(ca,-sa,sa,ca)*uv*sc*mix(1.6,.7,uDensity)+fl*17.31+gen*5.7;\n    vec2 id=floor(g);\n    float px=max(fuv*sc*mix(1.6,.7,uDensity),1e-4)*1.2;\n    vec3 acc=vec3(0.);\n    for(int j=-2;j<=1;j++)for(int i=-2;i<=1;i++){\n      vec2 oc=id+vec2(i,j),A=cNode(oc,fl);\n      float oh=hash(dot(oc,vec2(3.1,7.3))+fl);\n      vec3 c=mix(uTint,uTint2,oh);c=mix(c,spec(fl*.2+dep*.4+oh*.3),uMulti);\n      vec3 hot=mix(c,vec3(1.),.3)*1.4;\n      if(i>=-1&&j>=-1){float dd=length(g-A);acc+=c*(smoothstep(px*3.+.03,.03-px,dd)*.5+.0006/(dd*dd+.002)*smoothstep(.45,.15,dd))*.08;}\n      for(int k=0;k<4;k++){\n        vec2 off=k==0?vec2(1.,0.):k==1?vec2(0.,1.):k==2?vec2(1.,1.):vec2(-1.,1.);\n        vec2 B=cNode(oc+off,fl),ba=B-A,pa=g-A;\n        float len=length(ba),conn=1.-smoothstep(.95,1.45,len);\n        if(conn<=0.)continue;\n        float hproj=clamp(dot(pa,ba)/dot(ba,ba),0.,1.),ld=length(pa-ba*hproj);\n        if(ld>.3)continue;\n        float line=smoothstep(px*1.5,0.,ld)*conn;\n        acc+=c*line*.07;\n        float lh=hash(dot(oc,vec2(41.3,17.9))+float(k)*3.1+fl*11.);\n        float spd=.5+lh*1.1,ph=iTime*spd+lh*13.,fr=fract(ph);\n        float act=step(1.-fire,hash(floor(ph)+lh*71.));\n        float trail=smoothstep(fr-.35,fr,hproj)*step(hproj,fr)*line*pow(hproj/max(fr,.01),2.);\n        vec2 hp=g-mix(A,B,fr);float hd=dot(hp,hp);\n        float head=(.0009/(hd+.0009)*smoothstep(.2,.05,sqrt(hd))+smoothstep(px*2.+.02,0.,sqrt(hd))*2.)*conn;\n        float dB=length(g-B),flash=exp(-fr*5.)*step(1.-fire,hash(floor(ph)-1.+lh*71.));\n        acc+=hot*(act*(trail*1.6+head*1.4)+flash*(.004/(dB*dB+.002)*smoothstep(.28,.08,dB)+smoothstep(.06,.02,dB)*2.)*conn);\n      }\n    }\n    e+=acc*fade;\n  }\n  e+=uTint2*.2*exp(-dot(uv,uv)*30.);\n  return e*.9;\n}\nfloat bFrame(vec3 p,vec3 b,float e){p=abs(p)-b;vec3 q=abs(p+e)-e;\n  return min(min(length(max(vec3(p.x,q.y,q.z),0.))+min(max(p.x,max(q.y,q.z)),0.),length(max(vec3(q.x,p.y,q.z),0.))+min(max(q.x,max(p.y,q.z)),0.)),length(max(vec3(q.x,q.y,p.z),0.))+min(max(q.x,max(q.y,p.z)),0.));}\nfloat kifs(vec3 p){\n  float rz=p.z*.05+iTime*.03;p.xy=mat2(cos(rz),-sin(rz),sin(rz),cos(rz))*p.xy;\n  p.z=mod(p.z,3.)-1.5;\n  float s=1.,d=1e3;\n  for(int i=0;i<3;i++){\n    p=abs(p);if(p.x<p.y)p.xy=p.yx;\n    d=min(d,bFrame(p-vec3(1.4,.0,0.),vec3(.5,.5,.7),.018)/s);\n    p=p*2.-vec3(1.6,1.2,1.);s*=2.;\n  }\n  return d;\n}\nvec3 fractalFly(vec3 rd){\n  vec3 ro=vec3(0.,0.,uFlow*.5);\n  float t=.05*hash(dot(gl_FragCoord.xy,vec2(12.9898,78.233))+fract(iTime));vec3 e=vec3(0.);\n  for(int i=0;i<64;i++){\n    vec3 p=ro+rd*t;\n    float d=kifs(p);\n    float gw=.00012/(d*d+.00008);\n    vec3 c=mix(uTint,uTint2,.5+.5*sin(p.z*.35));\n    c=mix(c,spec(p.z*.03+iTime*.02),uMulti);\n    float band=exp(-fract(p.z*.1-iTime*.15)*8.);\n    e+=c*gw*(.02+.06*band)*(1.+uGlow*.5)*exp(-t*.14)*smoothstep(.3,1.,t);\n    t+=max(d*.7,.006+t*.003);\n    if(t>20.)break;\n  }\n  return e*mix(.6,1.,uDensity);\n}\nuniform sampler2D uWords;uniform float uWLen[64];\nvec3 wordRain(vec3 rd){\n  vec2 uv=rd.xy/max(rd.z,.05);\n  vec3 e=vec3(0.);\n  for(int L=0;L<3;L++){\n    float fl=float(L),sc=mix(1.,2.6,fl*.5),cols=mix(10.,22.,uDensity)*sc;\n    float cw=1./cols,ch=cw*1.25;\n    vec2 g=uv+vec2(fl*.137,0.);\n    float cx=floor(g.x/cw),fx=fract(g.x/cw);\n    float hc=hash(cx*1.37+fl*91.);\n    if(hc<.18)continue;\n    float spd=(.6+1.4*hash(cx*7.7+fl*3.))*(1.-fl*.25);\n    float yy=-g.y/ch-uFlow*spd*1.6-hc*300.;\n    float slot=floor(yy/23.),li=floor(mod(yy,23.)),fy=fract(yy);\n    float w=floor(hash(slot*3.1+cx*17.3+fl*5.)*64.);\n    float len=uWLen[int(w)];\n    if(li>=len)continue;\n    vec2 tuv=vec2((w+fx)/64.,(li+fy)/20.);\n    float px=max(fwidth(g.x/cw),1e-3);\n    float gly=textureLod(uWords,tuv,clamp(log2(px*24.),0.,4.)).r;\n    float pos=(li+fy)/max(len,1.);\n    float head=smoothstep(len-1.,len,li+1.);\n    vec3 c=mix(uTint,uTint2,hash(slot+cx));c=mix(c,spec(hash(slot*1.7+cx)+iTime*.02),uMulti);\n    float flick=.75+.25*step(.5,hash(floor(iTime*8.)+li*3.+cx));\n    float depth=mix(1.,.35,fl*.5);\n    e+=(c*(.25+.9*pos*pos)*flick+vec3(1.)*head*.9)*gly*depth*(1.+uGlow*.15);\n    e+=c*uGlow*.04*smoothstep(.5,0.,abs(fx-.5))*pos*depth;\n  }\n  return e*.9;\n}\n// DH_STRUCTURES_BEGIN\n// Shared procedural structures. All geometry and detail are generated in the shader.\nmat2 dsRotate(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}\nfloat dsFabricHeight(vec2 p,float k){\n float z=p.y+uFlow*.65+k*9.;\n return (k-1.)*2.8+2.3*sin(p.x*.36+z*.16+k*1.9+iTime*.22)\n  +1.2*sin(z*.095-p.x*.23+k*2.7+iTime*.17)+.055*p.x*p.x*sin(z*.055+k);\n}\nvec3 dsFabric(vec3 ro,vec3 rd){\n vec3 acc=vec3(0.);\n for(int sheet=0;sheet<3;sheet++){\n  if(sheet==2&&uDensity<.45)break;float k=float(sheet),angle=(k-1.)*.62;\n  vec3 origin=ro,ray=rd;origin.xy=dsRotate(angle)*(origin.xy-vec2(0.,.5));ray.xy=dsRotate(angle)*ray.xy;\n  float t=.4,previousT=t;vec3 p=origin+ray*t;float previous=p.y-dsFabricHeight(p.xz,k);int hits=0;\n  for(int sampleIndex=0;sampleIndex<int(40.+uDensity*10.);sampleIndex++){\n   t+=.24+t*.085;if(t>75.)break;p=origin+ray*t;float f=p.y-dsFabricHeight(p.xz,k);\n   if(sign(f)!=sign(previous)){\n    float a=previousT,b=t;\n    for(int refine=0;refine<5;refine++){float m=(a+b)*.5;vec3 q=origin+ray*m;float fm=q.y-dsFabricHeight(q.xz,k);if(sign(fm)==sign(previous))a=m;else b=m;}\n    float distance=(a+b)*.5;vec3 q=origin+ray*distance;float z=q.z+uFlow*.65+k*9.;\n    float center=2.*sin(z*.065+k*2.1),width=7.5+1.5*sin(z*.075+k),edge=width-abs(q.x-center);\n    float band=smoothstep(0.,.65,edge)*smoothstep(1.,4.,distance);\n    vec2 epsilon=vec2(.025,0.);vec3 normal=normalize(vec3(dsFabricHeight(q.xz-epsilon,k)-dsFabricHeight(q.xz+epsilon,k),.05,dsFabricHeight(q.xz-epsilon.yx,k)-dsFabricHeight(q.xz+epsilon.yx,k)));\n    float fresnel=pow(1.-abs(dot(normal,ray)),3.),sheen=pow(max(dot(reflect(ray,normal),normalize(vec3(-.3,.8,-.4))),0.),24.);\n    vec2 uv=vec2(q.x,z),cell=uv/mix(.21,.11,uDensity),local=fract(cell)-.5;\n    float aa=.006+distance*.0012,thread=min(abs(local.x),abs(local.y))*mix(.21,.11,uDensity);\n    float weave=(1.-smoothstep(.002,.002+aa,thread))*.07;\n    float glint=exp(-dot(local,local)*90.)*step(.985,hash(dot(floor(cell),vec2(13.1,7.7))))*.3;\n    vec3 color=mix(uTint,uTint2,.5+.5*sin(q.x*.12+z*.035+k));color=mix(color,spec(q.x*.025+z*.012+k*.2),uMulti*.55);\n    float rim=exp(-max(edge,0.)*9.)*.3;\n    vec3 silk=color*(.025+weave+fresnel*.36+glint*(1.+uGlow*.25))+mix(color,vec3(1.),.7)*(sheen*.55+rim);\n    acc+=silk*band*exp(-distance*.028);hits++;if(hits>=3)break;\n   }\n   previousT=t;previous=f;\n  }\n }\n return acc;\n}\nvec2 dsBoxHit(vec3 ro,vec3 rd,vec3 center,vec3 size){\n vec3 inv=sign(rd)/max(abs(rd),vec3(.00001)),a=(center-size-ro)*inv,b=(center+size-ro)*inv;\n vec3 near=min(a,b),far=max(a,b);return vec2(max(near.x,max(near.y,near.z)),min(far.x,min(far.y,far.z)));\n}\nvec2 dsClipPlane(vec2 interval,vec3 ro,vec3 rd,vec3 normal,float limit){\n float direction=dot(rd,normal),distance=limit-dot(ro,normal);\n if(abs(direction)<.00001)return distance<0.?vec2(1.,-1.):interval;\n float t=distance/direction;if(direction>0.)interval.y=min(interval.y,t);else interval.x=max(interval.x,t);return interval;\n}\nvec2 dsDotShape(vec3 ro,vec3 rd,vec3 size,int kind){\n if(kind==1){\n  vec2 a=dsBoxHit(ro,rd,vec3(-size.x*.55,0.,0.),size*vec3(.45,1.,1.));\n  vec2 b=dsBoxHit(ro,rd,vec3(0.,-size.y*.55,0.),size*vec3(1.,.45,1.));\n  bool hitA=a.y>max(a.x,.1),hitB=b.y>max(b.x,.1);if(!hitA)return b;if(!hitB)return a;return vec2(min(a.x,b.x),max(a.y,b.y));\n }\n vec2 interval=dsBoxHit(ro,rd,vec3(0.),size);\n if(kind==2)interval=dsClipPlane(interval,ro,rd,vec3(1./size.x,1./size.y,0.),.25);\n if(kind==3)for(int face=0;face<8;face++){vec3 normal=vec3((face&1)==0?-1.:1.,(face&2)==0?-1.:1.,(face&4)==0?-1.:1.)/size;interval=dsClipPlane(interval,ro,rd,normal,1.45);}\n return interval;\n}\nvec3 dsBuildingFace(vec3 q,vec3 size,float t,float seed,float progress){\n float aa=.006+t*.0015;vec3 face=abs(abs(q)-size);float outline=max(min(face.x,face.y),min(max(face.x,face.y),face.z));\n float edge=1.-smoothstep(.014,.014+aa,outline);\n vec2 uv=face.z<face.x?q.xy:q.zy;uv.y+=size.y;\n float floorLine=abs(fract(uv.y*1.4)-.5)/1.4,windowLine=abs(fract(uv.x*1.5)-.5)/1.5;\n float grid=(1.-smoothstep(.007,.007+aa,min(floorLine,windowLine)))*.3;\n float lit=step(.84,hash(dot(floor(uv*vec2(1.5,1.4)),vec2(7.3,13.1))+seed));\n float fill=lit*smoothstep(.4,.25,abs(fract(uv.x*1.5)-.5))*smoothstep(.4,.25,abs(fract(uv.y*1.4)-.5));\n float scan=exp(-abs(q.y-size.y)*20.)*(1.-progress);\n vec3 color=mix(uTint,uTint2,seed);color=mix(color,spec(seed*.6+q.y*.04),uMulti*.5);\n return color*(.012+grid+edge*.95+fill*.3+scan*.8)+mix(color,vec3(1.),.7)*edge*step(.8,seed)*.35;\n}\nvec3 dsCity(vec3 ro,vec3 rd,bool dots){\n vec3 acc=vec3(0.);float offset=uFlow*1.05,first=floor((ro.z+offset)/6.5);\n for(int row=0;row<int(7.+uDensity*3.);row++)for(int column=0;column<8;column++){\n  if(!dots&&column>=4)break;\n  float r=dots?float(row):first+float(row),side=column<2?-1.:1.,lane=mod(float(column),2.);vec3 h=hash3(vec3(r,float(column),39.));if(h.x>.4+uDensity*.6)continue;\n  vec3 motion=hash3(vec3(r,float(column),91.));\n  float z=dots?.5+mod((r+.5)*6.5+motion.z*20.-uFlow*(.45+motion.x*1.9),65.):(r+.5)*6.5-offset;if(z<.3)continue;\n  float progress=1.-smoothstep(9.,54.,z),fullHeight=2.+pow(h.y,1.2)*10.,height=fullHeight*(.035+.965*progress);\n  vec3 size=vec3(.85+h.z*.6,height*.5,1.4+h.x*.6),center=vec3(side*(2.7+lane*3.8),height*.5-.45,z);\n  if(dots){float angle=(float(column)+.5)*.785398,rad=3.2+h.x*1.2;center=vec3(cos(angle)*rad,.5+sin(angle)*rad,z);size=vec3(.45+h.x*1.1,.55+h.y*1.4,.8+h.z*1.4);}\n  vec3 localOrigin=ro-center,localRay=rd;int kind=0;\n  vec3 spin=(h-.5)*3.+uFlow*(.1+motion*.35)*mix(vec3(-1.),vec3(1.),step(vec3(.5),hash3(vec3(r,float(column),117.))));\n  if(dots){kind=int(floor(hash(r*31.+float(column)*7.)*5.));localOrigin.xy=dsRotate(spin.x)*localOrigin.xy;localRay.xy=dsRotate(spin.x)*localRay.xy;localOrigin.xz=dsRotate(spin.y)*localOrigin.xz;localRay.xz=dsRotate(spin.y)*localRay.xz;localOrigin.yz=dsRotate(spin.z)*localOrigin.yz;localRay.yz=dsRotate(spin.z)*localRay.yz;if(kind==4){localOrigin.x-=localOrigin.y*.65;localRay.x-=localRay.y*.65;}}\n  vec2 interval=dots?dsDotShape(localOrigin,localRay,size,kind):dsBoxHit(ro,rd,center,size);if(interval.y<=max(interval.x,.1))continue;\n  float t=max(.1,interval.x);vec3 q=localOrigin+localRay*t;\n  if(dots){\n   vec3 face=abs(abs(q)-size);vec2 uv=face.y<min(face.x,face.z)?q.xz:face.z<face.x?q.xy:q.zy;\n   vec3 normalPoint=q,normalSize=size;\n   if(kind==1){vec3 barSize=size*vec3(.45,1.,1.),armSize=size*vec3(1.,.45,1.);vec3 bar=q+vec3(size.x*.55,0.,0.),arm=q+vec3(0.,size.y*.55,0.);bool useBar=abs(sdBox(bar,barSize))<abs(sdBox(arm,armSize));normalPoint=useBar?bar:arm;normalSize=useBar?barSize:armSize;}\n   vec3 normalFace=abs(abs(normalPoint)-normalSize);vec3 normal=normalFace.x<min(normalFace.y,normalFace.z)?vec3(sign(normalPoint.x),0.,0.):normalFace.y<normalFace.z?vec3(0.,sign(normalPoint.y),0.):vec3(0.,0.,sign(normalPoint.z));\n   if(kind==2&&abs(q.x/size.x+q.y/size.y-.25)<.02)normal=normalize(vec3(1./size.x,1./size.y,0.));\n   if(kind==3&&dot(abs(q),1./size)>1.43)normal=normalize(sign(q)/size);\n   if(kind==4)normal.y-=normal.x*.65;\n   normal.yz=dsRotate(-spin.z)*normal.yz;normal.xz=dsRotate(-spin.y)*normal.xz;normal.xy=dsRotate(-spin.x)*normal.xy;\n   float shade=.28+.92*max(dot(normalize(normal),normalize(vec3(-.5,.8,-.4))),0.);\n   if(kind==2&&abs(q.x/size.x+q.y/size.y-.25)<.02)uv=vec2(q.x*1.4,q.z);\n   if(kind==3)uv=vec2(q.x+q.z*.65,q.y+q.z*.35);\n   float spacing=mix(.2,.10,uDensity);\n   vec2 cell=uv/spacing;vec2 local=(fract(cell)-.5)*spacing;float aa=.004+t*.001;\n   float dotMask=1.-smoothstep(spacing*.12,spacing*.12+aa,length(local));\n   vec3 color=mix(uTint,uTint2,h.z);float pulse=.55+.45*sin(iTime*.8+floor(cell.y)*.1+r*.7);\n   float route=step(.82,hash(floor(cell.y)*7.+r))*exp(-abs(fract(cell.x*.1-uFlow*.3)-.5)*18.);\n   acc+=color*(dotMask*(.7+.7*pulse)+route*.12*uGlow)*shade*exp(-t*.035);\n  }else{\n   acc+=dsBuildingFace(q,size,t,h.z,progress)*exp(-t*.033);\n   vec3 back=ro+rd*interval.y-center;acc+=dsBuildingFace(back,size,interval.y,h.z,progress)*exp(-interval.y*.035)*.18;\n  }\n }\n if(!dots&&rd.y<-.001){float t=(-.45-ro.y)/rd.y;if(t>0.&&t<80.){vec3 p=ro+rd*t;p.z+=offset;vec2 f=abs(fract(p.xz)-.5);float grid=1.-smoothstep(.012,.012+t*.001,min(f.x,f.y));acc+=uTint*grid*.13*exp(-t*.045);}}\n return acc;\n}\n\n// Procedural illuminated surfaces. No textures, particle objects or extra passes.\nuniform float uLEDPattern;\nuniform float uDiscoRotation;\nconst float lsPI=3.14159265,lsTAU=6.2831853;\nvec2 lsSphereUV(vec3 n){return vec2(atan(n.x,n.z)/lsTAU+.5,asin(clamp(n.y,-1.,1.))/lsPI+.5);}\nvec3 lsSphereNormal(vec2 uv){float a=(uv.x-.5)*lsTAU,b=(uv.y-.5)*lsPI;return vec3(sin(a)*cos(b),sin(b),cos(a)*cos(b));}\nvec3 lsColor(float hue){return mix(mix(uTint,uTint2,.5+.5*sin(hue*lsTAU)),spec(hue),uMulti);}\nvec3 lsLEDPattern(vec2 uv,float tm,int kind){\n if(kind==0){\n  vec3 color=lsColor(uv.x+tm*.025)*(.05+.05*pow(.5+.5*sin(uv.y*15.+uv.x*12.-tm),2.));\n  for(int burst=0;burst<int(8.+uDensity*8.);burst++){\n   float id=float(burst),clock=tm*.34+id*.381966,epoch=floor(clock),age=fract(clock);\n   vec3 seed=hash3(vec3(id,epoch,71.));vec2 center=vec2(id<4.?.3+id*.12+seed.x*.06:fract(id*.381966+(seed.x-.5)*.16),.3+seed.y*.4);\n   vec2 p=uv-center;p.x=(mod(p.x+.5,1.)-.5)*2.*cos((center.y-.5)*lsPI);\n   float life=max(0.,(age-.13)/.87),radius=(.12+seed.z*.15)*(1.-exp(-life*5.));p.y+=life*life*.11;\n   float angle=atan(p.y,p.x),r=length(p),rays=floor(22.+seed.x*26.);\n   float lane=floor((angle/lsTAU+.5)*rays),spoke=abs(fract((angle/lsTAU+.5)*rays)-.5);\n   float variation=.62+.38*hash(lane*13.7+id*17.+epoch*23.),head=radius*variation;\n   float tail=smoothstep(head*.48,head*.8,r)*(1.-smoothstep(head,head+.017,r));\n   float stream=exp(-spoke*spoke*90.)*tail;\n   float spark=exp(-pow((r-head)/.011,2.)-spoke*spoke*85.);\n   float fade=smoothstep(.12,.2,age)*(1.-smoothstep(.48,1.,life));\n   float rocketY=-.23+clamp(age/.13,0.,1.)*.23;\n   float rocket=exp(-p.x*p.x*18000.)*exp(-pow((p.y-rocketY)/.035,2.))*(1.-smoothstep(.09,.15,age));\n   vec3 c=lsColor(seed.z+id*.13);\n   color+=(c*(stream*1.4+spark*2.2)+mix(c,vec3(1.),.7)*spark*.65)*fade+c*rocket*1.2;\n  }\n  return color;\n }\n if(kind==1){\n  float wave=sin(uv.x*lsTAU*4.+sin(uv.y*11.+tm*.7)*1.6-tm*1.6)+cos(uv.y*17.-tm*.85)*.7;\n  float band=pow(.5+.5*sin(wave*2.4+tm*.5),3.);\n  return lsColor(uv.x*.7+uv.y*.6+tm*.045)*(.08+band*1.1);\n }\n vec2 grid=uv*vec2(8.,4.),id=floor(grid),p=fract(grid)-.5;float seed=hash(dot(id,vec2(13.1,71.7)));\n p=dsRotate(tm*(seed<.5?-1.:1.)*.45+seed*lsTAU)*p;\n float angle=atan(p.y,p.x),radius=length(p),sides=3.+floor(seed*5.);\n float polygon=cos(mod(angle+lsPI/sides,lsTAU/sides)-lsPI/sides)*radius;\n float target=.22+.045*sin(tm+seed*9.);\n float star=.25+.065*cos(angle*5.+tm*.5);\n float outline=seed<.34?abs(radius-star):seed<.67?abs(polygon-target):abs(radius-target);\n float shape=exp(-outline*outline*2400.);\n return lsColor(seed+tm*.035)*(shape*1.2+.03)+lsColor(seed+.4)*exp(-radius*radius*50.)*.1;\n}\nvec3 dsLEDGlobe(vec3 ro,vec3 rd){\n // Widen the view into an enclosing sphere: LEDs bend around its sides and roof.\n vec3 ray=normalize(vec3(rd.xy*2.1,rd.z)),origin=ro-vec3(0.,.5,0.);\n float b=dot(origin,ray),distance=-b+sqrt(max(0.,b*b-dot(origin,origin)+144.));\n vec3 normal=normalize(origin+ray*distance);vec2 uv=lsSphereUV(normal);\n vec2 resolution=vec2(floor(mix(150.,330.,uDensity)),floor(mix(75.,165.,uDensity)));\n vec2 grid=uv*resolution,cell=floor(grid),local=fract(grid)-.5,center=(cell+.5)/resolution;\n float tm=uFlow*.22,cycle=tm/3.6,blend=uLEDPattern<.5?smoothstep(.78,1.,fract(cycle)):0.;\n int kind=uLEDPattern<.5?int(mod(floor(cycle),3.)):int(uLEDPattern)-1;vec3 light=vec3(0.);\n for(int pass=0;pass<int(1.+step(.001,blend));pass++){\n  int pattern=(kind+pass)%3;float weight=pass==0?1.-blend:blend;light+=lsLEDPattern(center,tm,pattern)*weight;\n }\n float aa=clamp(max(fwidth(grid.x),fwidth(grid.y)),.015,.32),radius=length(local);\n float lens=1.-smoothstep(.27-aa*.4,.31+aa*.4,radius);\n float dome=sqrt(max(0.,1.-radius*radius/.105));\n vec3 emit=light*lens*(.65+.35*dome)+light*exp(-radius*radius*12.)*.12*uGlow;\n return (emit+mix(uTint,uTint2,normal.y*.5+.5)*.003)*uBright;\n}\nvec3 lsToLocal(vec3 p,float rotation){p.xz=dsRotate(rotation)*p.xz;p.xy=dsRotate(.16*sin(rotation*.37))*p.xy;return p;}\nvec3 lsToWorld(vec3 p,float rotation){p.xy=dsRotate(-.16*sin(rotation*.37))*p.xy;p.xz=dsRotate(-rotation)*p.xz;return p;}\nvec3 lsLight(int index){return normalize(index==0?vec3(-.65,.6,.45):index==1?vec3(.7,.35,-.6):vec3(.1,-.5,.8));}\nvec3 lsMirrorFacet(vec2 cell,vec2 facets,float rotation){\n vec3 normal=lsSphereNormal((cell+.5)/facets);\n normal=normalize(normal+(hash3(vec3(cell,44.))-.5)*.009);\n return lsToWorld(normal,rotation);\n}\nvec3 lsDiscoWall(vec3 direction,float rotation,vec2 facets){\n vec3 wall=mix(uTint,uTint2,direction.y*.5+.5)*.012;\n for(int light=0;light<3;light++){\n  vec3 source=lsLight(light),halfVector=normalize(source+direction+vec3(.00001));\n  vec2 uv=lsSphereUV(lsToLocal(halfVector,rotation)),tile=uv*facets;\n  vec3 facet=lsMirrorFacet(floor(tile),facets,rotation);\n  float incidence=max(dot(source,facet),0.),alignment=max(0.,1.-dot(reflect(-source,facet),direction));\n  // A reflected light footprint has a hot center, soft falloff and a faint halo.\n  // It fades to darkness before the neighboring facet, avoiding square cutouts.\n  float core=exp(-alignment*22000.),body=exp(-alignment*7000.);\n  float halo=exp(-alignment*1100.)*.055*uGlow;\n  float energy=.4+.6*hash(dot(floor(tile),vec2(13.1,71.7))+float(light)*17.);\n  vec3 color=lsColor(float(light)*.32+.06);\n  wall+=(color*(body*1.25+halo)+mix(color,vec3(1.),.5)*core*1.1)*energy*smoothstep(.05,.35,incidence);\n  wall+=color*pow(max(dot(direction,source),0.),6.)*.014;\n }\n return wall;\n}\nvec3 lsMirrorEnvironment(vec3 reflection,float rotation,vec2 facets){\n vec3 tint=mix(uTint,uTint2,.5+.5*reflection.y);\n vec3 env=vec3(.075,.08,.1)+tint*.23;\n float front=smoothstep(.1,-.65,reflection.z);\n float strip=exp(-pow((reflection.y-.3-.09*sin(reflection.x*4.))/.075,2.))*front;\n float side=exp(-pow((reflection.x+.45)/.09,2.))*front;\n float wash=pow(.5+.5*sin(reflection.x*5.+reflection.y*3.),3.);\n env+=mix(uTint2,uTint,wash)*(.2+wash*.9);\n env+=vec3(1.,.97,.94)*strip*2.1+mix(uTint,vec3(1.),.5)*side*1.35;\n env+=lsDiscoWall(reflection,rotation,facets)*.38;\n return env;\n}\nvec3 lsDiscoRays(vec3 ray,float rotation){\n // Analytic shafts share the ball's world-space center and stay behind its silhouette.\n vec2 p=ray.xy/max(ray.z,.04);float r=length(p),a=atan(p.y,p.x),phase=rotation*.12;\n float broad=pow(.5+.5*sin(a*17.+sin(a*5.)*1.8+phase),6.);\n float fine=pow(.5+.5*sin(a*73.-phase*.8+sin(a*9.)),18.);\n float thin=pow(.5+.5*sin(a*137.+phase*.6),34.);\n float reach=exp(-max(0.,r-.23)*1.7),haze=exp(-r*r*2.8);\n vec3 c=mix(uTint,uTint2,.5+.5*sin(a*2.+.7));\n c=mix(c,lsColor(a/lsTAU+.1),uMulti*.4);\n vec3 rays=c*((broad*.65+fine*.46+thin*.22)*reach*(.3+uGlow*.55)+haze*.24);\n // A few larger defocused reflections soften the space around the sharper wall lights.\n vec2 grid=p*vec2(5.,7.)+vec2(rotation*.12,0.),id=floor(grid),local=fract(grid)-.5;\n vec3 seed=hash3(vec3(id,91.));vec2 delta=local-(seed.xy-.5)*.55;\n float disc=1.-smoothstep(.15,.22,length(delta*vec2(.8,1.3)));\n rays+=mix(uTint,uTint2,seed.z)*disc*step(.76,seed.z)*.18;\n return rays;\n}\nvec3 lsDiscoStars(vec3 ro,vec3 rd,vec3 center,float radius,float rotation){\n vec3 stars=vec3(0.),view=normalize(ro-center);vec2 screen=rd.xy/max(rd.z,.04);\n for(int light=0;light<3;light++){\n  vec3 normal=normalize(lsLight(light)+view),point=center+normal*radius-ro;\n  vec2 p=screen-point.xy/max(point.z,.04);float d=length(p);\n  float core=exp(-d*d*65000.);\n  float crossLight=exp(-abs(p.x)*900.-abs(p.y)*45.)+exp(-abs(p.y)*900.-abs(p.x)*45.);\n  vec2 diagonal=dsRotate(.7854)*p;\n  float diagonalLight=exp(-abs(diagonal.x)*1800.-abs(diagonal.y)*130.)+exp(-abs(diagonal.y)*1800.-abs(diagonal.x)*130.);\n  float flash=.5+.5*pow(.5+.5*sin(rotation*11.+float(light)*7.),8.);\n  stars+=mix(lsColor(float(light)*.32),vec3(1.),.97)*(core*6.+crossLight*4.+diagonalLight*1.1)*flash*(.3+uGlow*.8);\n }\n return stars;\n}\nvec3 dsDisco(vec3 ro,vec3 rd){\n vec3 center=vec3(0.,.5,6.),oc=ro-center;float radius=1.4,rotation=uDiscoRotation;\n vec2 facets=vec2(floor(mix(32.,76.,uDensity)),floor(mix(16.,38.,uDensity)));\n float b=dot(oc,rd),wallDistance=-b+sqrt(max(0.,b*b-dot(oc,oc)+196.));\n vec3 color=vec3(0.);\n float discriminant=b*b-dot(oc,oc)+radius*radius;\n if(discriminant>0.){\n  float distance=-b-sqrt(discriminant);\n  if(distance>0.){\n   vec3 normal=normalize(ro+rd*distance-center),local=lsToLocal(normal,rotation);\n   vec2 uv=lsSphereUV(local),tile=uv*facets,cell=floor(tile),offset=fract(tile)-.5;\n   float seed=hash(dot(cell,vec2(13.1,71.7))),tileRadius=length(offset);\n   float aa=clamp(fwidth(tileRadius),.012,.12),mirror=1.-smoothstep(.445-aa*.5,.47+aa*.5,tileRadius);\n   vec3 facet=lsMirrorFacet(cell,facets,rotation);\n   vec3 reflected=reflect(rd,facet);float facing=max(dot(facet,-rd),0.);\n   vec3 metal=lsMirrorEnvironment(reflected,rotation,facets)*(.65+.5*seed);\n   float pinpoint=exp(-dot(offset,offset)*95.);\n   float diffraction=exp(-abs(offset.x)*85.-abs(offset.y)*9.)+exp(-abs(offset.y)*85.-abs(offset.x)*9.);\n   for(int light=0;light<3;light++){\n    vec3 source=lsLight(light),c=lsColor(float(light)*.32+.06);float diffuse=max(dot(facet,source),0.);\n    float alignment=max(dot(reflect(-source,facet),-rd),0.);\n    float sheen=pow(alignment,48.),glint=pow(alignment,550.);\n    float sparkle=pow(alignment,180.)*(pinpoint+diffraction*.22);\n    metal+=c*diffuse*.12+mix(c,vec3(1.),.85)*(sheen*.8+glint*(5.+uGlow*3.)+sparkle*(2.+uGlow*4.));\n   }\n   float pinLights=pow(max(0.,sin(atan(reflected.x,reflected.z)*28.)*cos(asin(clamp(reflected.y,-1.,1.))*34.)),24.);\n   metal+=vec3(1.)*pinLights*(.8+uGlow*2.5);\n   float bevel=exp(-pow((tileRadius-.445)/.018,2.));\n   color=mix(vec3(.006,.004,.014),metal,mirror)*(.88+.12*pow(1.-facing,3.));\n   color+=mix(vec3(.17),uTint2,.35)*bevel*.3+lsColor(.55)*pow(1.-abs(dot(normal,rd)),4.)*.18;\n  }\n }else{\n  vec3 wallDirection=normalize(ro+rd*wallDistance-center);\n  color=lsDiscoWall(wallDirection,rotation,facets)+lsDiscoRays(rd,rotation);\n  vec2 screen=rd.xy/max(rd.z,.05);float wire=exp(-abs(screen.x)*1400.)*smoothstep(.2,.25,screen.y);\n  color+=vec3(.045,.055,.075)*wire;\n }\n // Star flares only reach the ball's neighborhood, not the outer wall.\n if(dot(rd,normalize(center-ro))>.95)color+=lsDiscoStars(ro,rd,center,radius,rotation);\n return color*uBright;\n}\n\n// DH_STRUCTURES_END\nvec3 scene(vec3 ro,vec3 rd,float tm){return uStyle>13.5?vec3(0.):uStyle>12.5?dsDisco(ro,rd):uStyle>11.5?dsLEDGlobe(ro,rd):uStyle>10.5?dsCity(ro,rd,true):uStyle>9.5?dsCity(ro,rd,false):uStyle>8.5?dsFabric(ro,rd):uStyle>7.5?wordRain(rd):uStyle>6.5?fractalFly(rd):uStyle>5.5?constellation(rd):uStyle>4.5?voroCrystal(rd):uStyle>3.5?dataRings(rd):uStyle>2.5?wireTunnel(rd):uStyle>1.5?particles(ro,rd,80.):uStyle>.5?fibers(ro,rd,80.):field(ro,rd,tm);}\nvec3 space(vec3 rd){\n  float y=rd.y,w=uWarm*uNight,s=max(dot(rd,L),0.);\n  vec3 dTop=vec3(.3,.71,1.65),dHor=vec3(1.4,1.84,2.6);\n  vec3 day=mix(dHor,dTop,smoothstep(0.,1.,pow(clamp(abs(y)/.34,0.,1.),.75)));\n  float cl=fbm(vec3(rd.x/(y+.12)*1.4,rd.z/(y+.12)*1.4,iTime*.01));\n  day=mix(day,vec3(1.3,1.32,1.36),smoothstep(.55,.85,cl)*.4*smoothstep(.02,.2,y));\n  \n  vec3 top=mix(vec3(.003,.006,.016),vec3(.018,.012,.04),w);\n  vec3 hor=mix(vec3(.002,.003,.008),vec3(.03,.012,.008),w)+w*vec3(.07,.03,.03)*smoothstep(.35,0.,abs(y));\n  vec3 nt=mix(hor,top,pow(clamp(abs(y)*1.5,0.,1.),.5));\n  float n=fbm(rd*2.6+vec3(0.,0.,iTime*.008)),n2=fbm(rd*6.-vec3(iTime*.004));\n  nt+=mix(uTint,uTint2,n2)*pow(max(n-.38,0.)*1.7,2.)*.2*smoothstep(-.02,.35,y);\n  nt+=uTint*exp(-abs(y)*22.)*.1+uTint*.06*exp(-abs(y)*9.);\n  nt+=uTint2*.012;\n  return mix(day,nt,uNight);\n}\nvec3 stars(vec3 rd){\n  vec2 sc=vec2(atan(rd.x,rd.z),asin(clamp(rd.y,-1.,1.)))*320.;\n  vec2 id=floor(sc),f=fract(sc)-.5;float h=hash(id.x*127.1+id.y*311.7);\n  if(h<.982)return vec3(0.);\n  vec2 o=vec2(hash(id.x+id.y*57.),hash(id.y+id.x*13.))-.5;\n  float tw=.6+.4*sin(iTime*(1.+h*3.)+h*80.);\n  return mix(vec3(.75,.85,1.),uTint2,hash(h*9.)*.5)*smoothstep(.14,0.,length(f-o*.6))*(h-.982)*40.*tw*smoothstep(.0,.12,rd.y)*uNight;\n}\nvec3 combine(vec3 bg,vec3 acc){\n  vec3 dark=bg+acc*uBright*1.15;\n  float k=clamp(dot(acc,vec3(.3,.5,.2)),0.,1.);\n  vec3 light=bg*(1.-.55*k)+acc*1.5;\n  return mix(light,dark,uNight);\n}\nvoid main(){\n  vec2 q=gl_FragCoord.xy/iResolution.xy;\n  vec2 p=-1.+2.*q;p.x*=iResolution.x/iResolution.y;\n  if(abs(uVort)>.001){float r=length(p),ang=uSpin+uVort*abs(uVort)*3.2*exp(-r*1.1);float cs=cos(ang),sn=sin(ang);p=mat2(cs,-sn,sn,cs)*p*mix(1.,.8+.2*r,abs(uVort)*.6);}\n  L=normalize(vec3(0.,.25,-1.));\n  vec3 ro=vec3(0.,.5,0.);\n  float yaw=uLook.x*.65,pit=uLook.y*.22;\n  vec3 ta=ro+vec3(sin(yaw),-.03+pit,cos(yaw));\n  vec3 ww=normalize(ta-ro),uu=normalize(cross(vec3(0.,1.,0.),ww)),vv=cross(ww,uu);\n  vec3 rd=normalize(p.x*uu+p.y*vv+2.5/(1.+.3*uZoom)*ww);\n  vec3 col;\n  float kal=uKal>1.5?1.:0.;\n  vec3 rs=uStyle>2.5?rd:normalize(vec3(rd.x,abs(rd.y)+.004,rd.z));\n  col=vec3(0.);\n  for(int pass=0;pass<int(1.+kal);pass++){\n    vec3 ray=rs;\n    if(pass==1){\n    vec2 pm=p;float seg=6.2832/floor(uKal),an=mod(atan(pm.y,pm.x)+iTime*.04,seg);an=1.5708-seg*.5+abs(an-seg*.5);an=mix(an,1.5708,.15);\n    vec2 pk=length(pm)*vec2(cos(an),sin(an))+vec2(0.,.08);\n    vec3 rk=normalize(pk.x*uu+pk.y*vv+2.5/(1.+.3*uZoom)*ww);if(uStyle<2.5){rk.y=abs(rk.y)+.004;rk=normalize(rk);}\n    ray=rk;\n    }\n    col+=scene(ro,ray,75.);\n  }\n  col=1.-exp(-col*1.15);\n  col=pow(col,vec3(mix(1.18,.92,uNight)));\n  col=clamp(mix(vec3(dot(col,vec3(.299,.587,.114))),col,mix(1.15,1.,uNight)),0.,1.);\n  col+=(hash(dot(gl_FragCoord.xy,vec2(12.9898,78.233))+fract(iTime))-.5)/255.;\n  outColor=vec4(col,1.);\n}";
  var POST = "#version 300 es\nprecision highp float;\nuniform float uOp;uniform vec3 uBg1;uniform vec3 uBg2;uniform float uGT;uniform float uAng;uniform sampler2D uScene;uniform vec2 uRes;uniform float uWarp;uniform float uBloom;uniform vec3 uTint2;uniform float uNight;uniform float uTime;\nout vec4 o;\nuniform float uFullKal,uAutoVort,uAutoSpin;\nvec3 br(vec3 c,float th){return max(c-th,0.)/(1.-th);}\nvec2 effectUV(vec2 uv){\n  if(uFullKal<1.5&&abs(uAutoVort)<.001&&abs(uAutoSpin)<.001)return uv;\n  vec2 aspect=vec2(uRes.x/uRes.y,1.),p=(uv-.5)*aspect;float radius=length(p);\n  if(abs(uAutoVort)>.001||abs(uAutoSpin)>.001){\n    float angle=uAutoSpin+uAutoVort*abs(uAutoVort)*3.2*exp(-radius*2.2),cs=cos(angle),sn=sin(angle);\n    p=mat2(cs,-sn,sn,cs)*p;\n  }\n  if(uFullKal>1.5){\n    float sector=6.2831853/floor(uFullKal),angle=mod(atan(p.y,p.x)+uTime*.04,sector);\n    angle=1.5707963-sector*.5+abs(angle-sector*.5);\n    p=length(p)*vec2(cos(angle),sin(angle));\n  }\n  // Mirror-repeat the source at the edges, avoiding clamped bands while turning.\n  return 1.-abs(mod(.5+p/aspect,2.)-1.);\n}\nvoid main(){\n  vec2 baseUV=gl_FragCoord.xy/uRes,uv=effectUV(baseUV),cen=vec2(.5,.52),dv=uv-cen;\n  vec3 col=vec3(0.);\n  float w=clamp(uWarp,0.,2.5),ws=0.;\n  if(w<.001){col=textureLod(uScene,uv,0.).rgb;ws=1.;}else for(int i=0;i<WARP_TAPS;i++){float f=float(i)/float(WARP_TAPS-1);float k=1.-w*.16*f*f;float wt=1.-f*.6;col+=textureLod(uScene,cen+dv*k,0.).rgb*wt;ws+=wt;}\n  col/=ws;\n  if(uBloom>.001){\n  float th=mix(.95,.42,uNight);\n  vec3 b=br(textureLod(uScene,uv,2.).rgb,th)*.5+br(textureLod(uScene,uv,3.).rgb,th)*.7+br(textureLod(uScene,uv,4.).rgb,th)*.9+br(textureLod(uScene,uv,5.).rgb,th)*1.1;\n  vec3 st=vec3(0.);\n  for(int i=-7;i<=7;i++){float fi=float(i);st+=br(textureLod(uScene,uv+vec2(fi*.022,0.),3.).rgb,th+.12)*exp(-abs(fi)*.32);}\n  vec2 gu=cen-dv*.55;vec3 gh=br(textureLod(uScene,gu,4.).rgb,th+.1)*.35+br(textureLod(uScene,cen-dv*1.3,5.).rgb,th+.1)*.2;\n  float vg=smoothstep(.8,.1,length(dv));\n  col+=uBloom*mix(.2,1.,uNight)*(b*.32+st*uNight*mix(vec3(.5,.7,1.),uTint2,.5)*.09+gh*uTint2*vg*.6);\n  }\n  float l=dot(col,vec3(.3,.5,.2));\n  col=mix(col,vec3(l)*1.15+col*.25,w*.12)+w*.06*smoothstep(.05,.6,length(dv))*mix(vec3(.6,.8,1.),uTint2,.5)*l;\n  vec2 ac=(baseUV-.5)*vec2(uRes.x/uRes.y,1.);\n  float gt=uGT>.5?clamp(dot(ac,vec2(cos(uAng),sin(uAng)))/(.5*(abs(cos(uAng))*uRes.x/uRes.y+abs(sin(uAng))))*.5+.5,0.,1.):clamp(length(ac)/(.5*length(vec2(uRes.x/uRes.y,1.))),0.,1.);\n  vec3 bg=mix(uBg1,uBg2,smoothstep(0.,1.,gt));\n  col*=uOp;\n  col=1.-(1.-bg)*(1.-clamp(col,0.,1.));\n  col+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;\n  o=vec4(col,1.);\n}\n";
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
    if(kal<1.5&&Math.abs(vortex)<.001&&Math.abs(spin)<.001)return [x,y];
    // Match the compositor's primary sample, including mirror-repeat at the edges.
    var aspect=width/height,px=x*.5*aspect,py=y*.5,radius=Math.hypot(px,py),angle=spin+vortex*Math.abs(vortex)*3.2*Math.exp(-radius*2.2),cs=Math.cos(angle),sn=Math.sin(angle);
    var rotated=px*cs+py*sn;py=-px*sn+py*cs;px=rotated;
    if(kal>1.5){var sector=Math.PI*2/Math.floor(kal);angle=((Math.atan2(py,px)+(pointer.time||0)*.04)%sector+sector)%sector;angle=Math.PI/2-sector*.5+Math.abs(angle-sector*.5);px=radius*Math.cos(angle);py=radius*Math.sin(angle);}
    function repeat(n){return 1-Math.abs(((n%2)+2)%2-1);}
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
  var WORDS = ["CORE WEB VITALS","SCHEMA MARKUP","CANONICAL TAG","CRAWL BUDGET","LCP / CLS / INP","TTFB","CDN EDGE CACHE","DNS PROPAGATION","SSL HANDSHAKE","301 REDIRECT","ROBOTS.TXT","XML SITEMAP","HREFLANG","HEADLESS CMS","API ENDPOINT","WEBHOOK","UTM PARAMETERS","PIXEL FIRING","MULTI-TOUCH ATTRIB","LOOKALIKE AUDIENCE","RETARGETING","CAC : LTV","ROAS","CPM / CPC / CTR","SERP FEATURES","E-E-A-T","TOPICAL AUTHORITY","KEYWORD INTENT","DOMAIN RATING","GA4 EVENTS","GTM CONTAINER","CONSENT MODE V2","FIRST-PARTY DATA","ZERO-CLICK SEARCH","PROGRAMMATIC","OMNICHANNEL","MARTECH STACK","LEAD SCORING","DRIP SEQUENCE","DKIM / DMARC","A/B/N TESTING","BOUNCE RATE","BRAND EQUITY","SEMIOTICS","DESIGN TOKENS","ATOMIC DESIGN","VARIABLE FONTS","RENDER BLOCKING","HYDRATION","SERVERLESS","VECTOR EMBEDDING","TOKEN LIMIT","PROMPT TUNING","LLM GROUNDING","RAG PIPELINE","NEURAL SEARCH","GENERATIVE SEO","SYNTHETIC DATA","ALGORITHM UPDATE","MODEL DRIFT","AGENTIC WORKFLOW","DIFFUSION MODEL","SENTIMENT SCORE","CHURN COHORT"];
  var STYLES = ["Digital grid","Fiber optics","Particle waves","Wireframe tunnel","Data rings","Voronoi crystal","Constellation","Fractal flythrough","Word rain","Digital fabric","Blueprint city","Dot matrix structures","LED globe","Digital disco ball","Floating shape","Morphing sculptures"];
  var NUM = ['opacity', 'density', 'flow', 'glow', 'brightness', 'multicolor', 'warp', 'bloom', 'vortex', 'vortexRamp', 'lookRange', 'gradientAngle', 'autoVortexStrength', 'autoVortexSpeed', 'autoVortexRamp', 'shapeSize', 'shapeFloat', 'shapeLobes', 'shapeTwist', 'shapeExplode', 'shapeSensitivity', 'shapeRecovery', 'shapeScrollDistance', 'morphDuration', 'morphHold', 'morphProgress', 'morphStagger', 'morphScrollDistance', 'shapeMouseRadius', 'shapeMouseStrength', 'shapeMouseGlobal'];
  var DEF = { style: 'Digital grid', palette: 'Electric blue', ledPattern: 'Cycle', opacity: 1, density: 0.55, flow: 2.5, glow: 1, brightness: 1, multicolor: 0.35, kaleidoscope: 0, kaleidoscopeMode: 'Forward elements', randomize: false, randomInterval: 15, bgColor1: '#140a2e', bgColor2: '#000000', gradient: 'Radial', gradientAngle: 90, warp: 1, bloom: 1, vortex: 1, vortexRamp: 2, lookRange: 1, discoMouseControl: true, shape: 'Torus knot', shapeSeed: 17, shapeSize: 1, shapeFloat: 1, shapeLobes: 5, shapeTwist: 1.5, shapeTrigger: 'Mouse and scroll', shapeMouseEffect: 'Whole sculpture explosion', shapeMouseRadius: .18, shapeMouseStrength: 1, shapeMouseGlobal: 0, shapeExplode: 1, shapeSensitivity: 1, shapeRecovery: 1.2, shapeScrollDistance: .75, morphMode: 'Cycle shapes', morphFrom: 'Orb', morphTo: 'Torus knot', morphDuration: 4, morphHold: 1, morphProgress: 0, morphStagger: .15, morphScrollDistance: 1, morphExplode: false, autoVortex: false, autoVortexStrength: 0.5, autoVortexSpeed: 0.5, autoVortexDirection: 'Clockwise', autoVortexRamp: 2 };
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
    var a = hex(g.bgColor1), z = hex(g.bgColor2);
    for (i = 0; i < 3; i++) { this.bg1[i] += (a[i] - this.bg1[i]) * k; this.bg2[i] += (z[i] - this.bg2[i]) * k; }
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
    ['uOp', 'uBg1', 'uBg2', 'uGT', 'uAng', 'uScene', 'uRes', 'uWarp', 'uBloom', 'uTint2', 'uNight', 'uTime', 'uFullKal', 'uAutoVort', 'uAutoSpin'].forEach(function (k) { PU[k] = gl.getUniformLocation(pp, k); });
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

  var api = window.KaleidoscopeHero = window.KaleidoscopeHero || { instances: [] };
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
