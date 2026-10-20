#version 300 es
precision highp float;
// DH_TERRAIN_HEIGHT
uniform float uFlow,uFar,uZoom;
uniform vec2 uResolution,uLook,uSegments;
out vec3 vWorld;
out float vDistance;
void main(){
 int cell=gl_VertexID/6,corner=gl_VertexID%6;
 vec2 offset=corner==0?vec2(0.,0.):corner==1?vec2(1.,0.):corner==2?vec2(0.,1.):corner==3?vec2(0.,1.):corner==4?vec2(1.,0.):vec2(1.);
 vec2 grid=vec2(mod(float(cell),uSegments.x),floor(float(cell)/uSegments.x))+offset;
 float spacing=uFar/(uSegments.y-2.),travel=uFlow*2.;
 float worldZ=(floor(travel/spacing)+grid.y-1.)*spacing,depth=worldZ-travel;
 // Rows recycle outside the frustum. Existing rows retain their world positions.
 float aspect=uResolution.x/uResolution.y,x=(grid.x/uSegments.x*2.-1.)*(16.+max(depth,0.)*aspect*.46*(1.+.3*uZoom));
 float yaw=uLook.x*.65,pitch=-.03+uLook.y*.22;
 vec2 worldXZ=vec2(cos(yaw)*x+sin(yaw)*depth,-sin(yaw)*x+cos(yaw)*depth+travel);
 vWorld=vec3(worldXZ.x,landHeight(worldXZ),worldXZ.y);
 vec3 origin=vec3(0.,4.5+max(0.,uTerrainHeight-1.)*5.2,travel),p=vWorld-origin;
 vec3 forward=normalize(vec3(sin(yaw),pitch,cos(yaw))),right=normalize(cross(vec3(0.,1.,0.),forward)),up=cross(forward,right);
 vec3 camera=vec3(dot(p,right),dot(p,up),dot(p,forward));vDistance=length(p);
 float near=.1,far=uFar+40.,focal=2.5/(1.+.3*uZoom);
 gl_Position=vec4(camera.x*focal/aspect,camera.y*focal,(far+near)/(far-near)*camera.z-2.*far*near/(far-near),camera.z);
}
