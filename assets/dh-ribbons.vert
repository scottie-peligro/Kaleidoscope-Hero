#version 300 es
precision highp float;
uniform float uTime,uCount,uWidth,uFold,uTwist,uScrollTwist,uUnwrap,uBend,uRadius,uForward;
uniform vec2 uResolution,uLook,uSegments;
uniform vec3 uPointer;
out vec3 vPosition,vNormal;
out vec2 vUV;
out float vStrip;
const float TAU=6.2831853;
mat2 ribbonTurn(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
vec3 ribbonPoint(vec2 uv,float strip,float copy){
 float phase=strip*2.17,fold=uFold*(1.-uUnwrap*.92),t=uTime*.13;
 float angle=uv.x*(uTwist*2.*(1.-uUnwrap*.95)+uScrollTwist*TAU)+phase*.45+sin(uv.x*3.+phase+t)*.55*fold;
 vec3 center=vec3(uv.x*5.4,(strip-(uCount-1.)*.5)*1.55+fold*(sin(uv.x*2.6+phase+t)*.95+.3*sin(uv.x*5.1-phase-t*.6)),fold*sin(uv.x*3.3+phase+t*.7)*1.1+(strip-(uCount-1.)*.5)*.45);
 vec3 across=normalize(vec3(-.16*cos(uv.x*2.6+phase+t),cos(angle),sin(angle)));
 vec3 p=center+across*uv.y*uWidth*.9;
 p.xy=ribbonTurn((strip-(uCount-1.)*.5)*.15+sin(t*.4)*.09)*p.xy;
 p.xz=ribbonTurn(-uLook.x*.35)*p.xz;p.yz=ribbonTurn(uLook.y*.18)*p.yz;
 float aspect=uResolution.x/uResolution.y,depth=max(1.,7.+p.z);
 vec2 screen=p.xy*2.2/depth;screen.x/=aspect;
 vec2 cursor=uPointer.xy;
 if(copy>0.){vec2 q=cursor*vec2(aspect,1.);q=ribbonTurn(-copy*TAU/max(uForward,2.))*q;if(mod(copy,2.)>.5)q.x=-q.x;cursor=q/vec2(aspect,1.);}
 vec2 delta=(cursor-screen)*vec2(aspect,1.);
 float influence=exp(-dot(delta,delta)/max(.01,uRadius*uRadius))*uPointer.z*uBend;
 p.xy+=delta*influence*.8;p.z-=influence*.8;
 return p;
}
void main(){
 int cell=gl_VertexID/6,corner=gl_VertexID%6;
 vec2 offset=corner==0?vec2(0.,0.):corner==1?vec2(1.,0.):corner==2?vec2(0.,1.):corner==3?vec2(0.,1.):corner==4?vec2(1.,0.):vec2(1.,1.);
 vec2 grid=vec2(mod(float(cell),uSegments.x),floor(float(cell)/uSegments.x));
 vec2 uv=(grid+offset)/uSegments*2.-1.;
 float strip=uCount-1.-mod(float(gl_InstanceID),uCount),copy=floor(float(gl_InstanceID)/uCount);
 vec3 p=ribbonPoint(uv,strip,copy),du=ribbonPoint(uv+vec2(.002,0.),strip,copy)-p,dv=ribbonPoint(uv+vec2(0.,.002),strip,copy)-p;
 vPosition=p;vNormal=normalize(cross(du,dv));vUV=uv;vStrip=strip;
 float depth=max(1.,7.+p.z);vec2 screen=p.xy*2.2/depth;screen.x*=uResolution.y/uResolution.x;
 if(copy>0.){vec2 q=screen*vec2(uResolution.x/uResolution.y,1.);float angle=copy*TAU/max(uForward,2.);if(mod(copy,2.)>.5){q.x=-q.x;vNormal.x=-vNormal.x;vPosition.x=-vPosition.x;}q=ribbonTurn(angle)*q;vNormal.xy=ribbonTurn(angle)*vNormal.xy;vPosition.xy=ribbonTurn(angle)*vPosition.xy;screen=q*vec2(uResolution.y/uResolution.x,1.);}
 gl_Position=vec4(screen,clamp(depth/20.,0.,1.),1.);
}
