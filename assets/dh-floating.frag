#version 300 es
precision highp float;
in vec3 vColor;in float vAlpha;out vec4 outColor;
void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float alpha=exp(-r*r*3.5)*(1.-smoothstep(.7,1.,r))*vAlpha;outColor=vec4(1.-exp(-vColor*1.2),alpha);}
