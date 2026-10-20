#version 300 es
precision highp float;
uniform sampler2D uMap;
uniform vec3 uColor,uTint,uTint2;
uniform float uHasMap,uOpacity,uAlphaTest,uRoughness,uMetalness,uUnlit,uPalette,uMulti,uBright,uGlow,uPoints,uWire;
in vec3 vNormal,vBary;
in vec4 vColor;
in vec2 vUV;
out vec4 color;
void main(){
 vec4 base=vec4(uColor,uOpacity)*vColor;if(uHasMap>.5)base*=texture(uMap,vUV);
 if(base.a<max(.001,uAlphaTest))discard;
 vec3 n=normalize(vNormal);if(!gl_FrontFacing&&uPoints<.5)n=-n;
 vec3 tint=mix(uTint,uTint2,clamp(n.x*.5+.5,0.,1.));tint=mix(tint,.55+.45*cos(6.2831853*(n.y*.2+vec3(0.,.33,.67))),uMulti*.65);
 vec3 albedo=mix(base.rgb,tint,uPalette),light=normalize(vec3(-.6,.8,-1.)),view=vec3(0.,0.,-1.);
 float diffuse=.24+.85*abs(dot(n,light)),rim=pow(1.-abs(n.z),3.);
 float spec=pow(max(0.,dot(n,normalize(light+view))),mix(72.,8.,uRoughness));
 vec3 lit=albedo*diffuse+mix(vec3(1.),albedo,uMetalness)*spec*(.25+uGlow*.6)+tint*rim*.12;
 lit=mix(lit,albedo,uUnlit);
 if(uWire>.5){vec3 edge=smoothstep(vec3(0.),fwidth(vBary)*1.3,vBary);float wire=1.-min(edge.x,min(edge.y,edge.z));lit=tint*(wire*(1.+uGlow*.65)+.015);}
 if(uPoints>.5){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;base.a*=1.-smoothstep(.25,1.,d);lit=albedo*(.7+uGlow*.65)+vec3(spec*.3);}
 color=vec4(pow(1.-exp(-max(lit,vec3(0.))*uBright*1.15),vec3(.92)),base.a);
}
