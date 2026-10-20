// Vertex heightfield with rounded ridges and continuous second derivatives.
uniform float uTerrainType,uTerrainHeight,uTerrainScale;
float landHash(vec2 p){
 // Integer cell hashing gives a shared corner exactly the same height from
 // either neighboring cell, including across negative/world-zero boundaries.
 uvec2 cell=uvec2(ivec2(p));uint h=cell.x*1597334677u^cell.y*3812015801u;
 h=(h^(h>>16u))*2246822519u;h=(h^(h>>13u))*3266489917u;h^=h>>16u;
 return float(h>>8u)*(1./16777216.);
}
float landNoise(vec2 p){
 // Derive the fraction from the same cell, rather than a separate fract()
 // expression: driver reassociation near a boundary can otherwise choose a
 // different cell for the two operations and make the height jump.
 vec2 i=floor(p),f=clamp(p-i,0.,1.);f=f*f*f*(f*(f*6.-15.)+10.);
 return mix(mix(landHash(i),landHash(i+vec2(1.,0.)),f.x),mix(landHash(i+vec2(0.,1.)),landHash(i+vec2(1.)),f.x),f.y);
}
float landHeight(vec2 world){
 vec2 p=world*.05/uTerrainScale;
 float broad=landNoise(p*.7),detail=landNoise(p*1.8+17.),n=landNoise(p*1.25+41.);
 float ridge=1.-pow(n*2.-1.,2.);
 float hill=broad*2.+detail*.55,mountain=ridge*ridge*(1.2+broad*3.6)+detail*.3;
 float desert=.1+.12*sin(p.x*2.+p.y*.7)+landNoise(p*2.)*.1;
 float zone=landNoise(vec2(p.y*.25,13.));
 float h=mix(desert,hill,smoothstep(.23,.48,zone));h=mix(h,mountain,smoothstep(.56,.8,zone));
 if(uTerrainType>.5)h=uTerrainType<1.5?hill:uTerrainType<2.5?mountain:desert;
 return -2.+h*uTerrainHeight;
}
