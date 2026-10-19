#version 300 es
precision highp float;
uniform float uTime,uTransparency,uIridescence,uEdge,uBright,uGlow,uMulti;
uniform vec3 uTint,uTint2;
in vec3 vPosition,vNormal;
in vec2 vUV;
in float vStrip;
out vec4 outColor;
void main(){
 vec3 n=normalize(vNormal),view=normalize(vec3(0.,0.,-7.)-vPosition);
 if(dot(n,view)<0.)n=-n;
 float facing=clamp(dot(n,view),0.,1.),fresnel=pow(1.-facing,3.);
 float phase=(1.-facing)*1.05+vStrip*.14+vUV.x*.12+uTime*.017;
 vec3 film=.5+.5*cos(6.2831853*(phase+vec3(0.,.33,.67)));
 vec3 base=mix(uTint,uTint2,.5+.5*sin(vUV.x*2.+vStrip*1.3));
 vec3 color=mix(base,film,clamp(uIridescence*(.55+uMulti*.15),0.,1.));
 vec3 key=normalize(vec3(-.65,.75,-1.)),fill=normalize(vec3(.8,-.2,-.6));
 float lit=max(dot(n,key),0.),specular=pow(max(dot(n,normalize(key+view)),0.),70.)+pow(max(dot(n,normalize(fill+view)),0.),110.)*.65;
 float edge=exp(-(1.-abs(vUV.y))*28.);
 float coverage=smoothstep(0.,max(.02,fwidth(vUV.y)*1.5),1.-abs(vUV.y))*smoothstep(0.,.025,1.-abs(vUV.x));
 vec3 reflected=mix(vec3(.16,.32,.65),vec3(1.,.7,.92),.5+.5*sin(reflect(-view,n).y*6.+vStrip));
 vec3 light=color*(.24+lit*.55+fresnel*.55)+reflected*fresnel*.5+mix(color,vec3(1.),.75)*(specular*(1.+uGlow*.4)+edge*uEdge*.75);
 float alpha=clamp((1.-uTransparency)*.82+fresnel*.24+edge*.24,0.,.95)*coverage;
 outColor=vec4(light*uBright,alpha);
}
