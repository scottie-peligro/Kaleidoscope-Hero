#version 300 es
precision highp float;
in vec3 aPosition,aNormal;
in vec4 aColor;
in vec2 aUV;
uniform mat3 uRotation,uUV;
uniform vec2 uResolution;
uniform float uTime,uSize,uFloat,uForward,uPoints,uPointSize,uExplosion,uStrength,uMouseForce,uMouseRadius,uMouseStrength,uMouseGlobal;
uniform vec4 uPointer;
out vec3 vNormal,vBary;
out vec4 vColor;
out vec2 vUV;
mat2 turn(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
void main(){
 vec3 p=uRotation*aPosition,normal=uRotation*aNormal;
 float random=fract(sin(dot(aPosition,vec3(12.9898,78.233,37.719)))*43758.5453);
 if(uPoints>.5)p+=normalize(p+normal*.1)*(uExplosion*uStrength*(.3+random));
 p*=uSize;p.y+=sin(uTime*.8)*.16*uFloat;
 float depth=max(1.,5.+p.z),aspect=uResolution.x/uResolution.y;
 vec2 screen=p.xy*2.4*min(1.,aspect)/depth;
 if(gl_InstanceID>0){float angle=float(gl_InstanceID-1)*6.2831853/max(2.,uForward);screen=turn(angle)*screen;if(gl_InstanceID%2==0)screen.x=-screen.x;}
 screen.x/=aspect;
 if(uPoints>.5){
  vec2 screenAspect=uResolution/min(uResolution.x,uResolution.y),delta=(screen-uPointer.xy)*screenAspect*.5;
  float radius=max(.01,uMouseRadius),distance=length(delta),influence=mix(1.-smoothstep(0.,radius,distance),1.,uMouseGlobal);
  vec2 offset=vec2(0.);
  if(uPointer.w>0.)offset+=normalize(delta+vec2(cos(random*6.28),sin(random*6.28))*.025)*min(radius*.8,.25)*uPointer.w*uStrength*(.4+random*1.6)*influence;
  float pull=(1.-exp(-uMouseStrength*uPointer.z*1.4))*influence;
  if(uMouseForce<-.5)offset-=delta*pull;else if(uMouseForce>.5)offset+=normalize(delta+vec2(.000001))*radius*.65*pull;
  screen+=offset*2./screenAspect;
 }
 gl_Position=vec4(screen*depth,(30.1/29.9)*depth-6./29.9,depth);
 gl_PointSize=clamp(uPointSize*5./depth,1.5,8.);
 vNormal=normal;vColor=aColor;vUV=(uUV*vec3(aUV,1.)).xy;
 int corner=gl_VertexID%3;vBary=corner==0?vec3(1.,0.,0.):corner==1?vec3(0.,1.,0.):vec3(0.,0.,1.);
}
