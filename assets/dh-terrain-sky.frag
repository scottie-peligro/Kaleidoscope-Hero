#version 300 es
precision highp float;
uniform sampler2D uTerrainScene;
uniform vec2 uResolution,uLook;
uniform vec3 uTint,uTint2;
uniform float uSource,uTerrainSun,uBright,uKal,uVort,uSpin,uZoom;
out vec4 outColor;
vec3 terrainSample(vec2 p){
 vec2 uv=p*vec2(uResolution.y/uResolution.x,1.)*.5+.5;
 if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))return vec3(0.);
 return texture(uTerrainScene,uv).rgb;
}
void main(){
 vec2 p=(gl_FragCoord.xy/uResolution*2.-1.)*vec2(uResolution.x/uResolution.y,1.);
 vec3 color=vec3(0.);
 if(uSource>.5){
  if(abs(uVort)>.001){float r=length(p),ang=uSpin+uVort*abs(uVort)*3.2*exp(-r*1.1);p=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*p*mix(1.,.8+.2*r,abs(uVort)*.6);}
  color=terrainSample(p);
  if(uKal>=2.){float segment=6.2831853/floor(uKal),angle=mod(atan(p.y,p.x),segment);angle=1.5708-segment*.5+abs(angle-segment*.5);angle=mix(angle,1.5708,.15);vec2 folded=length(p)*vec2(cos(angle),sin(angle))+vec2(0.,.08);color+=terrainSample(folded);}
 }else if(uTerrainSun>.5){
  float yaw=uLook.x*.65,pitch=-.03+uLook.y*.22;
  vec3 forward=normalize(vec3(sin(yaw),pitch,cos(yaw))),right=normalize(cross(vec3(0.,1.,0.),forward)),up=cross(forward,right);
  vec3 ray=p.x*right+p.y*up+2.5/(1.+.3*uZoom)*forward;
  vec2 sun=ray.xy/max(ray.z,.01)-vec2(0.,.12);float radius=.14,aa=max(fwidth(length(sun)),.001);
  float disc=1.-smoothstep(radius-aa,radius+aa,length(sun)),stripe=1.-smoothstep(.42,.56,fract((sun.y+radius)*42.));stripe=mix(stripe,1.,smoothstep(-.01,.055,sun.y));
  vec3 light=mix(vec3(1.,.08,.38),vec3(1.,.72,.2),clamp(sun.y/radius*.5+.5,0.,1.))*disc*stripe*1.25;
  light+=mix(uTint,uTint2,.5)*exp(-length(sun)*7.)*.06;
  color=pow(1.-exp(-light*uBright*1.15),vec3(.92));
 }
 outColor=vec4(color,1.);
}
