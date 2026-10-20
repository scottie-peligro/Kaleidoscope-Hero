#version 300 es
precision highp float;
uniform float uTerrainGrid,uTerrainHeight,uGlow,uBright,uMulti;
uniform vec3 uTint,uTint2;
in vec3 vWorld;
in float vDistance;
out vec4 outColor;
void main(){
 vec2 grid=vWorld.xz*uTerrainGrid*.65,footprint=max(fwidth(grid),vec2(.0001));
 vec2 edge=abs(fract(grid-.5)-.5),line=exp(-.5*pow(edge/(footprint*.8),vec2(2.)));
 float wire=max(line.x,line.y),unresolved=smoothstep(.22,.75,max(footprint.x,footprint.y));
 // Subpixel wires resolve to a quiet average rather than flashing whole cells.
 wire=mix(wire,.055,unresolved);
 float height=clamp((vWorld.y+2.)/max(uTerrainHeight*4.5,.1),0.,1.);
 vec3 tint=mix(uTint,uTint2,height),spectrum=clamp(.55+.55*cos(6.2831853*(vWorld.y*.045+vWorld.z*.001+vec3(0.,.33,.67))),0.,1.)*1.1;
 tint=mix(tint,spectrum,uMulti*.65);
 float fog=exp(-vDistance*.016)*(1.-smoothstep(140.,210.,vDistance));
 vec3 light=tint*(wire*(.65+uGlow*.28)+.008)*fog;
 outColor=vec4(pow(1.-exp(-light*uBright*1.15),vec3(.92)),1.);
}
