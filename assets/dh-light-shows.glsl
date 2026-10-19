// Procedural illuminated surfaces. No textures, particle objects or extra passes.
uniform float uLEDPattern;
uniform float uDiscoRotation;
const float lsPI=3.14159265,lsTAU=6.2831853;
vec2 lsSphereUV(vec3 n){return vec2(atan(n.x,n.z)/lsTAU+.5,asin(clamp(n.y,-1.,1.))/lsPI+.5);}
vec3 lsSphereNormal(vec2 uv){float a=(uv.x-.5)*lsTAU,b=(uv.y-.5)*lsPI;return vec3(sin(a)*cos(b),sin(b),cos(a)*cos(b));}
vec3 lsColor(float hue){return mix(mix(uTint,uTint2,.5+.5*sin(hue*lsTAU)),spec(hue),uMulti);}
vec3 lsLEDPattern(vec2 uv,float tm,int kind){
 if(kind==0){
  vec3 color=lsColor(uv.x+tm*.025)*(.05+.05*pow(.5+.5*sin(uv.y*15.+uv.x*12.-tm),2.));
  for(int burst=0;burst<int(8.+uDensity*8.);burst++){
   float id=float(burst),clock=tm*.34+id*.381966,epoch=floor(clock),age=fract(clock);
   vec3 seed=hash3(vec3(id,epoch,71.));vec2 center=vec2(id<4.?.3+id*.12+seed.x*.06:fract(id*.381966+(seed.x-.5)*.16),.3+seed.y*.4);
   vec2 p=uv-center;p.x=(mod(p.x+.5,1.)-.5)*2.*cos((center.y-.5)*lsPI);
   float life=max(0.,(age-.13)/.87),radius=(.12+seed.z*.15)*(1.-exp(-life*5.));p.y+=life*life*.11;
   float angle=atan(p.y,p.x),r=length(p),rays=floor(22.+seed.x*26.);
   float lane=floor((angle/lsTAU+.5)*rays),spoke=abs(fract((angle/lsTAU+.5)*rays)-.5);
   float variation=.62+.38*hash(lane*13.7+id*17.+epoch*23.),head=radius*variation;
   float tail=smoothstep(head*.48,head*.8,r)*(1.-smoothstep(head,head+.017,r));
   float stream=exp(-spoke*spoke*90.)*tail;
   float spark=exp(-pow((r-head)/.011,2.)-spoke*spoke*85.);
   float fade=smoothstep(.12,.2,age)*(1.-smoothstep(.48,1.,life));
   float rocketY=-.23+clamp(age/.13,0.,1.)*.23;
   float rocket=exp(-p.x*p.x*18000.)*exp(-pow((p.y-rocketY)/.035,2.))*(1.-smoothstep(.09,.15,age));
   vec3 c=lsColor(seed.z+id*.13);
   color+=(c*(stream*1.4+spark*2.2)+mix(c,vec3(1.),.7)*spark*.65)*fade+c*rocket*1.2;
  }
  return color;
 }
 if(kind==1){
  float wave=sin(uv.x*lsTAU*4.+sin(uv.y*11.+tm*.7)*1.6-tm*1.6)+cos(uv.y*17.-tm*.85)*.7;
  float band=pow(.5+.5*sin(wave*2.4+tm*.5),3.);
  return lsColor(uv.x*.7+uv.y*.6+tm*.045)*(.08+band*1.1);
 }
 vec2 grid=uv*vec2(8.,4.),id=floor(grid),p=fract(grid)-.5;float seed=hash(dot(id,vec2(13.1,71.7)));
 p=dsRotate(tm*(seed<.5?-1.:1.)*.45+seed*lsTAU)*p;
 float angle=atan(p.y,p.x),radius=length(p),sides=3.+floor(seed*5.);
 float polygon=cos(mod(angle+lsPI/sides,lsTAU/sides)-lsPI/sides)*radius;
 float target=.22+.045*sin(tm+seed*9.);
 float star=.25+.065*cos(angle*5.+tm*.5);
 float outline=seed<.34?abs(radius-star):seed<.67?abs(polygon-target):abs(radius-target);
 float shape=exp(-outline*outline*2400.);
 return lsColor(seed+tm*.035)*(shape*1.2+.03)+lsColor(seed+.4)*exp(-radius*radius*50.)*.1;
}
vec3 dsLEDGlobe(vec3 ro,vec3 rd){
 // Widen the view into an enclosing sphere: LEDs bend around its sides and roof.
 vec3 ray=normalize(vec3(rd.xy*2.1,rd.z)),origin=ro-vec3(0.,.5,0.);
 float b=dot(origin,ray),distance=-b+sqrt(max(0.,b*b-dot(origin,origin)+144.));
 vec3 normal=normalize(origin+ray*distance);vec2 uv=lsSphereUV(normal);
 vec2 resolution=vec2(floor(mix(150.,330.,uDensity)),floor(mix(75.,165.,uDensity)));
 vec2 grid=uv*resolution,cell=floor(grid),local=fract(grid)-.5,center=(cell+.5)/resolution;
 float tm=uFlow*.22,cycle=tm/3.6,blend=uLEDPattern<.5?smoothstep(.78,1.,fract(cycle)):0.;
 int kind=uLEDPattern<.5?int(mod(floor(cycle),3.)):int(uLEDPattern)-1;vec3 light=vec3(0.);
 for(int pass=0;pass<int(1.+step(.001,blend));pass++){
  int pattern=(kind+pass)%3;float weight=pass==0?1.-blend:blend;light+=lsLEDPattern(center,tm,pattern)*weight;
 }
 float aa=clamp(max(fwidth(grid.x),fwidth(grid.y)),.015,.32),radius=length(local);
 float lens=1.-smoothstep(.27-aa*.4,.31+aa*.4,radius);
 float dome=sqrt(max(0.,1.-radius*radius/.105));
 vec3 emit=light*lens*(.65+.35*dome)+light*exp(-radius*radius*12.)*.12*uGlow;
 return (emit+mix(uTint,uTint2,normal.y*.5+.5)*.003)*uBright;
}
vec3 lsToLocal(vec3 p,float rotation){p.xz=dsRotate(rotation)*p.xz;p.xy=dsRotate(.16*sin(rotation*.37))*p.xy;return p;}
vec3 lsToWorld(vec3 p,float rotation){p.xy=dsRotate(-.16*sin(rotation*.37))*p.xy;p.xz=dsRotate(-rotation)*p.xz;return p;}
vec3 lsLight(int index){return normalize(index==0?vec3(-.65,.6,.45):index==1?vec3(.7,.35,-.6):vec3(.1,-.5,.8));}
vec3 lsMirrorFacet(vec2 cell,vec2 facets,float rotation){
 vec3 normal=lsSphereNormal((cell+.5)/facets);
 normal=normalize(normal+(hash3(vec3(cell,44.))-.5)*.009);
 return lsToWorld(normal,rotation);
}
vec3 lsDiscoWall(vec3 direction,float rotation,vec2 facets){
 vec3 wall=mix(uTint,uTint2,direction.y*.5+.5)*.012;
 for(int light=0;light<3;light++){
  vec3 source=lsLight(light),halfVector=normalize(source+direction+vec3(.00001));
  vec2 uv=lsSphereUV(lsToLocal(halfVector,rotation)),tile=uv*facets;
  vec3 facet=lsMirrorFacet(floor(tile),facets,rotation);
  float incidence=max(dot(source,facet),0.),alignment=max(0.,1.-dot(reflect(-source,facet),direction));
  // A reflected light footprint has a hot center, soft falloff and a faint halo.
  // It fades to darkness before the neighboring facet, avoiding square cutouts.
  float core=exp(-alignment*22000.),body=exp(-alignment*7000.);
  float halo=exp(-alignment*1100.)*.055*uGlow;
  float energy=.4+.6*hash(dot(floor(tile),vec2(13.1,71.7))+float(light)*17.);
  vec3 color=lsColor(float(light)*.32+.06);
  wall+=(color*(body*1.25+halo)+mix(color,vec3(1.),.5)*core*1.1)*energy*smoothstep(.05,.35,incidence);
  wall+=color*pow(max(dot(direction,source),0.),6.)*.014;
 }
 return wall;
}
vec3 lsMirrorEnvironment(vec3 reflection,float rotation,vec2 facets){
 vec3 tint=mix(uTint,uTint2,.5+.5*reflection.y);
 vec3 env=vec3(.075,.08,.1)+tint*.23;
 float front=smoothstep(.1,-.65,reflection.z);
 float strip=exp(-pow((reflection.y-.3-.09*sin(reflection.x*4.))/.075,2.))*front;
 float side=exp(-pow((reflection.x+.45)/.09,2.))*front;
 float wash=pow(.5+.5*sin(reflection.x*5.+reflection.y*3.),3.);
 env+=mix(uTint2,uTint,wash)*(.2+wash*.9);
 env+=vec3(1.,.97,.94)*strip*2.1+mix(uTint,vec3(1.),.5)*side*1.35;
 env+=lsDiscoWall(reflection,rotation,facets)*.38;
 return env;
}
vec3 lsDiscoRays(vec3 ray,float rotation){
 // Analytic shafts share the ball's world-space center and stay behind its silhouette.
 vec2 p=ray.xy/max(ray.z,.04);float r=length(p),a=atan(p.y,p.x),phase=rotation*.12;
 float broad=pow(.5+.5*sin(a*17.+sin(a*5.)*1.8+phase),6.);
 float fine=pow(.5+.5*sin(a*73.-phase*.8+sin(a*9.)),18.);
 float thin=pow(.5+.5*sin(a*137.+phase*.6),34.);
 float reach=exp(-max(0.,r-.23)*1.7),haze=exp(-r*r*2.8);
 vec3 c=mix(uTint,uTint2,.5+.5*sin(a*2.+.7));
 c=mix(c,lsColor(a/lsTAU+.1),uMulti*.4);
 vec3 rays=c*((broad*.65+fine*.46+thin*.22)*reach*(.3+uGlow*.55)+haze*.24);
 // A few larger defocused reflections soften the space around the sharper wall lights.
 vec2 grid=p*vec2(5.,7.)+vec2(rotation*.12,0.),id=floor(grid),local=fract(grid)-.5;
 vec3 seed=hash3(vec3(id,91.));vec2 delta=local-(seed.xy-.5)*.55;
 float disc=1.-smoothstep(.15,.22,length(delta*vec2(.8,1.3)));
 rays+=mix(uTint,uTint2,seed.z)*disc*step(.76,seed.z)*.18;
 return rays;
}
vec3 lsDiscoStars(vec3 ro,vec3 rd,vec3 center,float radius,float rotation){
 vec3 stars=vec3(0.),view=normalize(ro-center);vec2 screen=rd.xy/max(rd.z,.04);
 for(int light=0;light<3;light++){
  vec3 normal=normalize(lsLight(light)+view),point=center+normal*radius-ro;
  vec2 p=screen-point.xy/max(point.z,.04);float d=length(p);
  float core=exp(-d*d*65000.);
  float crossLight=exp(-abs(p.x)*900.-abs(p.y)*45.)+exp(-abs(p.y)*900.-abs(p.x)*45.);
  vec2 diagonal=dsRotate(.7854)*p;
  float diagonalLight=exp(-abs(diagonal.x)*1800.-abs(diagonal.y)*130.)+exp(-abs(diagonal.y)*1800.-abs(diagonal.x)*130.);
  float flash=.5+.5*pow(.5+.5*sin(rotation*11.+float(light)*7.),8.);
  stars+=mix(lsColor(float(light)*.32),vec3(1.),.97)*(core*6.+crossLight*4.+diagonalLight*1.1)*flash*(.3+uGlow*.8);
 }
 return stars;
}
vec3 dsDisco(vec3 ro,vec3 rd){
 vec3 center=vec3(0.,.5,6.),oc=ro-center;float radius=1.4,rotation=uDiscoRotation;
 vec2 facets=vec2(floor(mix(32.,76.,uDensity)),floor(mix(16.,38.,uDensity)));
 float b=dot(oc,rd),wallDistance=-b+sqrt(max(0.,b*b-dot(oc,oc)+196.));
 vec3 color=vec3(0.);
 float discriminant=b*b-dot(oc,oc)+radius*radius;
 if(discriminant>0.){
  float distance=-b-sqrt(discriminant);
  if(distance>0.){
   vec3 normal=normalize(ro+rd*distance-center),local=lsToLocal(normal,rotation);
   vec2 uv=lsSphereUV(local),tile=uv*facets,cell=floor(tile),offset=fract(tile)-.5;
   float seed=hash(dot(cell,vec2(13.1,71.7))),tileRadius=length(offset);
   float aa=clamp(fwidth(tileRadius),.012,.12),mirror=1.-smoothstep(.445-aa*.5,.47+aa*.5,tileRadius);
   vec3 facet=lsMirrorFacet(cell,facets,rotation);
   vec3 reflected=reflect(rd,facet);float facing=max(dot(facet,-rd),0.);
   vec3 metal=lsMirrorEnvironment(reflected,rotation,facets)*(.65+.5*seed);
   float pinpoint=exp(-dot(offset,offset)*95.);
   float diffraction=exp(-abs(offset.x)*85.-abs(offset.y)*9.)+exp(-abs(offset.y)*85.-abs(offset.x)*9.);
   for(int light=0;light<3;light++){
    vec3 source=lsLight(light),c=lsColor(float(light)*.32+.06);float diffuse=max(dot(facet,source),0.);
    float alignment=max(dot(reflect(-source,facet),-rd),0.);
    float sheen=pow(alignment,48.),glint=pow(alignment,550.);
    float sparkle=pow(alignment,180.)*(pinpoint+diffraction*.22);
    metal+=c*diffuse*.12+mix(c,vec3(1.),.85)*(sheen*.8+glint*(5.+uGlow*3.)+sparkle*(2.+uGlow*4.));
   }
   float pinLights=pow(max(0.,sin(atan(reflected.x,reflected.z)*28.)*cos(asin(clamp(reflected.y,-1.,1.))*34.)),24.);
   metal+=vec3(1.)*pinLights*(.8+uGlow*2.5);
   float bevel=exp(-pow((tileRadius-.445)/.018,2.));
   color=mix(vec3(.006,.004,.014),metal,mirror)*(.88+.12*pow(1.-facing,3.));
   color+=mix(vec3(.17),uTint2,.35)*bevel*.3+lsColor(.55)*pow(1.-abs(dot(normal,rd)),4.)*.18;
  }
 }else{
  vec3 wallDirection=normalize(ro+rd*wallDistance-center);
  color=lsDiscoWall(wallDirection,rotation,facets)+lsDiscoRays(rd,rotation);
  vec2 screen=rd.xy/max(rd.z,.05);float wire=exp(-abs(screen.x)*1400.)*smoothstep(.2,.25,screen.y);
  color+=vec3(.045,.055,.075)*wire;
 }
 // Star flares only reach the ball's neighborhood, not the outer wall.
 if(dot(rd,normalize(center-ro))>.95)color+=lsDiscoStars(ro,rd,center,radius,rotation);
 return color*uBright;
}
