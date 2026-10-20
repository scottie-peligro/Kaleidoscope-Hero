// World-anchored heightfield; shared noise cells keep moving ridges continuous.
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
 float hill=broad*2.+detail*.55;
 // A squared inverse-noise ridge was almost entirely a high, broad plateau.
 // Narrower, layered crests give mountains actual relief rather than ripples.
 float ridge=1.-sqrt(pow(n*2.-1.,2.)+.012);
 float crest=pow(max(ridge,0.),2.4);
 float mass=broad*.35+detail*.2+n*.45;
 float mountain=.35+pow(mass,2.6)*38.+crest*2.;
 // Keep an open valley along the flight path, with ranges on either side.
 // Its slow bends are fixed in world space, so scrolling never reshapes land.
 float valleyCenter=sin(p.y*.55)*3.;
 float valley=smoothstep(5.,30.*uTerrainScale,abs(world.x-valleyCenter));
 mountain=mix(.2+detail*.35,mountain,valley);
 float desert=.1+.12*sin(p.x*2.+p.y*.7)+landNoise(p*2.)*.1;
 float zone=landNoise(vec2(p.y*.25,13.));
 float h=mix(desert,hill,smoothstep(.23,.48,zone));h=mix(h,mountain,smoothstep(.56,.8,zone));
 if(uTerrainType>.5)h=uTerrainType<1.5?hill:uTerrainType<2.5?mountain:desert;
 return -2.+h*uTerrainHeight;
}
