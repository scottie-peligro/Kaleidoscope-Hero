#version 300 es
precision highp float;
uniform float uTime,uSeed,uShape,uShapeB,uMorph,uStagger,uSize,uFloat,uExplosion,uStrength,uLobes,uTwist,uPointSize,uMulti,uBright,uGlow,uForward;
uniform vec2 uResolution,uLook;
uniform vec3 uTint,uTint2;
out vec3 vColor;
out float vAlpha;
const float PI=3.14159265,TAU=6.2831853;
uint mixBits(uint n){n=(n^(n>>16u))*0x7feb352du;n=(n^(n>>15u))*0x846ca68bu;return n^(n>>16u);}
vec3 random3(float id){uint n=uint(id)+uint(uSeed)*7919u;return vec3(mixBits(n),mixBits(n+123u),mixBits(n+357u))/4294967295.;}
mat2 turn(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
vec3 knot(float a){return vec3((1.+.3*cos(3.*a))*cos(2.*a),(1.+.3*cos(3.*a))*sin(2.*a),.48*sin(3.*a));}
vec3 shapeAt(float shape,vec3 h,out vec3 normal){
 float a=h.x*TAU,b=h.y*TAU;
 normal=vec3(cos(a)*sqrt(max(0.,1.-pow(h.y*2.-1.,2.))),h.y*2.-1.,sin(a)*sqrt(max(0.,1.-pow(h.y*2.-1.,2.))));vec3 p=normal;
 if(shape<.5){vec3 center=knot(a),tangent=normalize(knot(a+.002)-center),side=normalize(cross(tangent,normalize(center))),up=cross(side,tangent);normal=side*cos(b)+up*sin(b);p=center*.73+normal*.24;}
 else if(shape<1.5){normal=vec3(cos(a)*cos(b),sin(a)*cos(b),sin(b));p=vec3(.8*cos(a),.8*sin(a),0.)+normal*.3;}
 else if(shape<2.5){p=normal*(.93+.045*sin(a*5.+uTime*.4)*sin(b*3.));}
 else if(shape<3.5){float w=(h.y-.5)*.85,t=uTwist*a;normal=normalize(vec3(cos(a)*sin(t),sin(a)*sin(t),-cos(t)));p=vec3((.9+w*cos(t))*cos(a),(.9+w*cos(t))*sin(a),w*sin(t));}
 else if(shape<4.5){a=(h.x-.5)*TAU*1.6;vec3 center=vec3(.65*cos(a),(h.x-.5)*1.9,.65*sin(a)),tangent=normalize(vec3(-.65*sin(a),1.9/(TAU*1.6),.65*cos(a))),side=vec3(cos(a),0.,sin(a));normal=side*cos(b)+cross(tangent,side)*sin(b);p=center+normal*.18;}
 else if(shape<5.5){float radius=.66+.42*pow(max(0.,cos(a*uLobes)),2.)*pow(1.-abs(normal.y),.5);p=normal*radius;}
 else if(shape<6.5){p=normal/(abs(normal.x)+abs(normal.y)+abs(normal.z))*1.35;normal=normalize(sign(normal));}
 else{float phase=uSeed*.17;float radius=.82+.2*sin(a*uLobes+normal.y*uTwist*4.+phase)*sin(b*3.+phase)+.1*cos(b*5.-a*2.);p=normal*radius;}
 return p;
}
void main(){
 vec3 h=random3(float(gl_VertexID)+1.),normal;
 vec3 p=shapeAt(uShape,h,normal);
 if(uMorph>0.){
  vec3 nextNormal,next=shapeAt(uShapeB,h,nextNormal);
  // Every point keeps its identity; smooth endpoints also join consecutive cycles.
  float m=clamp((uMorph-h.z*uStagger)/max(.2,1.-uStagger),0.,1.);
  m=m*m*m*(m*(m*6.-15.)+10.);
  if(m>=1.){p=next;normal=nextNormal;}
  else{p=mix(p,next,m);vec3 blended=mix(normal,nextNormal,m);normal=dot(blended,blended)>.00001?normalize(blended):normal;}
 }
 // Fixed per-particle paths allow a clean return to the exact original surface.
 vec3 direction=normalize(normal*.7+(random3(float(gl_VertexID)+341.)-.5)*1.7);
 float explosion=uExplosion*uStrength;
 p+=direction*explosion*(.5+h.z*1.6);
 p.xz=turn(explosion*(h.y-.5)*1.3)*p.xz;
 float rotation=uTime*.19;p.xz=turn(rotation)*p.xz;normal.xz=turn(rotation)*normal.xz;
 p.xy=turn(.35+sin(uTime*.23)*.18*uFloat)*p.xy;normal.xy=turn(.35+sin(uTime*.23)*.18*uFloat)*normal.xy;
 p*=uSize;p.y+=sin(uTime*.6)*.12*uFloat;
 p.xz=turn(-uLook.x*.65)*p.xz;p.yz=turn(uLook.y*.22)*p.yz;
 float depth=4.8+p.z;vec2 screen=p.xy*2.4/max(depth,.5);screen.x*=uResolution.y/uResolution.x;
 // Repeat a folded particle wedge for the forward kaleidoscope mode.
 if(gl_InstanceID>0){vec2 q=screen*vec2(uResolution.x/uResolution.y,1.);float sector=TAU/max(uForward,2.),angle=mod(atan(q.y,q.x),sector);angle=abs(angle-sector*.5)+float(gl_InstanceID-1)*sector;q=length(q)*vec2(cos(angle),sin(angle));screen=q*vec2(uResolution.y/uResolution.x,1.);}
 gl_Position=vec4(screen,clamp(depth/12.,0.,1.),1.);
 gl_PointSize=clamp(uPointSize*(.65+h.z*.9)*4.8/max(depth,.5),1.,7.);
 vec3 light=normalize(vec3(-.65,.7,-.8));float lit=max(dot(normal,light),0.),rim=pow(1.-abs(normal.z),3.);
 vec3 color=mix(uTint,uTint2,smoothstep(-.45,.45,normal.x+(h.z-.5)*.2));
 color=mix(color,.55+.45*cos(TAU*(h.z+vec3(0.,.33,.67))),uMulti*.65);
 float sparkle=pow(max(0.,sin(h.x*173.+uTime*(.4+h.z))),28.);
 vColor=(color*(.3+lit*2.3+rim*.8)+vec3(1.)*(pow(lit,14.)*.7+sparkle*uGlow*.65))*uBright;
 vAlpha=(.7+h.z*.3)*mix(1.,.6,clamp(explosion*.4,0.,1.));
}
