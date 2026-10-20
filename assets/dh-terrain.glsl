// Continuous world-space landscape: move through a seeded heightfield instead
// of deforming screen pixels. No terrain texture, model or per-frame uploads.
uniform float uTerrainType,uTerrainHeight,uTerrainScale,uTerrainGrid,uTerrainSun;
float landNoise(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(dot(i,vec2(127.1,311.7))),hash(dot(i+vec2(1.,0.),vec2(127.1,311.7))),f.x),mix(hash(dot(i+vec2(0.,1.),vec2(127.1,311.7))),hash(dot(i+vec2(1.),vec2(127.1,311.7))),f.x),f.y);
}
float landHeight(vec2 world){
 vec2 p=world*.065/uTerrainScale;
 float broad=landNoise(p),detail=landNoise(p*2.13+17.),ridge=1.-abs(landNoise(p*1.7+41.)*2.-1.);
 float hill=broad*2.+detail*.7,mountain=pow(ridge,3.)*(1.+broad*5.)+detail*.4;
 float desert=.1+.12*sin(p.x*2.+p.y*.7)+landNoise(p*3.)*.13;
 float zone=landNoise(vec2(p.y*.25,13.));
 float h=mix(desert,hill,smoothstep(.23,.48,zone));h=mix(h,mountain,smoothstep(.56,.8,zone));
 if(uTerrainType>.5)h=uTerrainType<1.5?hill:uTerrainType<2.5?mountain:desert;
 return -2.+h*uTerrainHeight;
}
vec3 landSky(vec3 rd){
 if(uTerrainSun<.5)return vec3(0.);
 vec2 p=rd.xy/max(rd.z,.01)-vec2(0.,.12);float radius=.14,aa=max(fwidth(length(p)),.001);
 float disc=1.-smoothstep(radius-aa,radius+aa,length(p));
 float stripe=1.-smoothstep(.42,.56,fract((p.y+radius)*42.));
 stripe=mix(stripe,1.,smoothstep(-.01,.055,p.y));
 vec3 sun=mix(vec3(1.,.08,.38),vec3(1.,.72,.2),clamp(p.y/radius*.5+.5,0.,1.));
 return sun*disc*stripe*1.25+mix(uTint,uTint2,.5)*exp(-length(p)*7.)*.06;
}
vec3 dsTerrain(vec3 ro,vec3 rd){
 vec3 origin=ro+vec3(0.,4.+max(0.,uTerrainHeight-1.)*6.4,0.);float travel=uFlow*2.,t=.25,previousT=t;
 vec3 p=origin+rd*t;float previous=p.y-landHeight(p.xz+vec2(0.,travel));
 float distance=-1.;
 // Bound work even on rays above the highest possible mountain.
 for(int stepIndex=0;stepIndex<int(104.+uDensity*16.);stepIndex++){
  if(rd.y>=0.&&p.y>uTerrainHeight*7.-2.)break;
  t+=.16+t*.042;if(t>160.)break;p=origin+rd*t;
  float f=p.y-landHeight(p.xz+vec2(0.,travel));
  if(f<=0.&&previous>0.){
   float low=previousT,high=t;
   for(int refine=0;refine<9;refine++){float mid=(low+high)*.5;vec3 q=origin+rd*mid;if(q.y>landHeight(q.xz+vec2(0.,travel)))low=mid;else high=mid;}
   distance=(low+high)*.5;break;
  }
  previous=f;previousT=t;
 }
 if(distance<0.)return landSky(rd);
 p=origin+rd*distance;vec2 world=p.xz+vec2(0.,travel),grid=world*uTerrainGrid*.65;
 vec2 gradient=vec2(landHeight(world+vec2(.03,0.))-landHeight(world-vec2(.03,0.)),landHeight(world+vec2(0.,.03))-landHeight(world-vec2(0.,.03)))/.06;
 vec3 normal=normalize(vec3(-gradient.x,1.,-gradient.y));
 float footprint=distance*max(length(dFdx(rd)),length(dFdy(rd)))/max(abs(dot(normal,rd)),.12);
 vec2 aa=vec2(max(footprint*uTerrainGrid*.65,.001)),edge=abs(fract(grid-.5)-.5);
 vec2 lines=(1.-smoothstep(aa*.3,aa*1.4,edge))*(1.-smoothstep(vec2(.25),vec2(.8),aa));
 float wire=max(lines.x,lines.y),h=landHeight(world),fog=exp(-distance*.018);
 vec3 tint=mix(uTint,uTint2,clamp((h+2.)/max(uTerrainHeight*5.,.1),0.,1.));
 tint=mix(tint,spec(h*.045+world.y*.001),uMulti*.65);
 // The dark surface occludes the sun and the terrain behind it.
 return tint*(wire*(.65+uGlow*.28)+.008)*fog+mix(uTint,uTint2,.5)*.014*(1.-fog);
}
