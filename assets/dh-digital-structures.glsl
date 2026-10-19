// Shared procedural structures. All geometry and detail are generated in the shader.
mat2 dsRotate(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float dsFabricHeight(vec2 p,float k){
 float z=p.y+uFlow*.65+k*9.;
 return (k-1.)*2.8+2.3*sin(p.x*.36+z*.16+k*1.9+iTime*.22)
  +1.2*sin(z*.095-p.x*.23+k*2.7+iTime*.17)+.055*p.x*p.x*sin(z*.055+k);
}
vec3 dsFabric(vec3 ro,vec3 rd){
 vec3 acc=vec3(0.);
 for(int sheet=0;sheet<3;sheet++){
  if(sheet==2&&uDensity<.45)break;float k=float(sheet),angle=(k-1.)*.62;
  vec3 origin=ro,ray=rd;origin.xy=dsRotate(angle)*(origin.xy-vec2(0.,.5));ray.xy=dsRotate(angle)*ray.xy;
  float t=.4,previousT=t;vec3 p=origin+ray*t;float previous=p.y-dsFabricHeight(p.xz,k);int hits=0;
  for(int sampleIndex=0;sampleIndex<int(40.+uDensity*10.);sampleIndex++){
   t+=.24+t*.085;if(t>75.)break;p=origin+ray*t;float f=p.y-dsFabricHeight(p.xz,k);
   if(sign(f)!=sign(previous)){
    float a=previousT,b=t;
    for(int refine=0;refine<5;refine++){float m=(a+b)*.5;vec3 q=origin+ray*m;float fm=q.y-dsFabricHeight(q.xz,k);if(sign(fm)==sign(previous))a=m;else b=m;}
    float distance=(a+b)*.5;vec3 q=origin+ray*distance;float z=q.z+uFlow*.65+k*9.;
    float center=2.*sin(z*.065+k*2.1),width=7.5+1.5*sin(z*.075+k),edge=width-abs(q.x-center);
    float band=smoothstep(0.,.65,edge)*smoothstep(1.,4.,distance);
    vec2 epsilon=vec2(.025,0.);vec3 normal=normalize(vec3(dsFabricHeight(q.xz-epsilon,k)-dsFabricHeight(q.xz+epsilon,k),.05,dsFabricHeight(q.xz-epsilon.yx,k)-dsFabricHeight(q.xz+epsilon.yx,k)));
    float fresnel=pow(1.-abs(dot(normal,ray)),3.),sheen=pow(max(dot(reflect(ray,normal),normalize(vec3(-.3,.8,-.4))),0.),24.);
    vec2 uv=vec2(q.x,z),cell=uv/mix(.21,.11,uDensity),local=fract(cell)-.5;
    float aa=.006+distance*.0012,thread=min(abs(local.x),abs(local.y))*mix(.21,.11,uDensity);
    float weave=(1.-smoothstep(.002,.002+aa,thread))*.07;
    float glint=exp(-dot(local,local)*90.)*step(.985,hash(dot(floor(cell),vec2(13.1,7.7))))*.3;
    vec3 color=mix(uTint,uTint2,.5+.5*sin(q.x*.12+z*.035+k));color=mix(color,spec(q.x*.025+z*.012+k*.2),uMulti*.55);
    float rim=exp(-max(edge,0.)*9.)*.3;
    vec3 silk=color*(.025+weave+fresnel*.36+glint*(1.+uGlow*.25))+mix(color,vec3(1.),.7)*(sheen*.55+rim);
    acc+=silk*band*exp(-distance*.028);hits++;if(hits>=3)break;
   }
   previousT=t;previous=f;
  }
 }
 return acc;
}
vec2 dsBoxHit(vec3 ro,vec3 rd,vec3 center,vec3 size){
 vec3 inv=sign(rd)/max(abs(rd),vec3(.00001)),a=(center-size-ro)*inv,b=(center+size-ro)*inv;
 vec3 near=min(a,b),far=max(a,b);return vec2(max(near.x,max(near.y,near.z)),min(far.x,min(far.y,far.z)));
}
vec2 dsClipPlane(vec2 interval,vec3 ro,vec3 rd,vec3 normal,float limit){
 float direction=dot(rd,normal),distance=limit-dot(ro,normal);
 if(abs(direction)<.00001)return distance<0.?vec2(1.,-1.):interval;
 float t=distance/direction;if(direction>0.)interval.y=min(interval.y,t);else interval.x=max(interval.x,t);return interval;
}
vec2 dsDotShape(vec3 ro,vec3 rd,vec3 size,int kind){
 if(kind==1){
  vec2 a=dsBoxHit(ro,rd,vec3(-size.x*.55,0.,0.),size*vec3(.45,1.,1.));
  vec2 b=dsBoxHit(ro,rd,vec3(0.,-size.y*.55,0.),size*vec3(1.,.45,1.));
  bool hitA=a.y>max(a.x,.1),hitB=b.y>max(b.x,.1);if(!hitA)return b;if(!hitB)return a;return vec2(min(a.x,b.x),max(a.y,b.y));
 }
 vec2 interval=dsBoxHit(ro,rd,vec3(0.),size);
 if(kind==2)interval=dsClipPlane(interval,ro,rd,vec3(1./size.x,1./size.y,0.),.25);
 if(kind==3)for(int face=0;face<8;face++){vec3 normal=vec3((face&1)==0?-1.:1.,(face&2)==0?-1.:1.,(face&4)==0?-1.:1.)/size;interval=dsClipPlane(interval,ro,rd,normal,1.45);}
 return interval;
}
vec3 dsBuildingFace(vec3 q,vec3 size,float t,float seed,float progress){
 float aa=.006+t*.0015;vec3 face=abs(abs(q)-size);float outline=max(min(face.x,face.y),min(max(face.x,face.y),face.z));
 float edge=1.-smoothstep(.014,.014+aa,outline);
 vec2 uv=face.z<face.x?q.xy:q.zy;uv.y+=size.y;
 float floorLine=abs(fract(uv.y*1.4)-.5)/1.4,windowLine=abs(fract(uv.x*1.5)-.5)/1.5;
 float grid=(1.-smoothstep(.007,.007+aa,min(floorLine,windowLine)))*.3;
 float lit=step(.84,hash(dot(floor(uv*vec2(1.5,1.4)),vec2(7.3,13.1))+seed));
 float fill=lit*smoothstep(.4,.25,abs(fract(uv.x*1.5)-.5))*smoothstep(.4,.25,abs(fract(uv.y*1.4)-.5));
 float scan=exp(-abs(q.y-size.y)*20.)*(1.-progress);
 vec3 color=mix(uTint,uTint2,seed);color=mix(color,spec(seed*.6+q.y*.04),uMulti*.5);
 return color*(.012+grid+edge*.95+fill*.3+scan*.8)+mix(color,vec3(1.),.7)*edge*step(.8,seed)*.35;
}
vec3 dsCity(vec3 ro,vec3 rd,bool dots){
 vec3 acc=vec3(0.);float offset=uFlow*1.05,first=floor((ro.z+offset)/6.5);
 for(int row=0;row<int(7.+uDensity*3.);row++)for(int column=0;column<8;column++){
  if(!dots&&column>=4)break;
  float r=dots?float(row):first+float(row),side=column<2?-1.:1.,lane=mod(float(column),2.);vec3 h=hash3(vec3(r,float(column),39.));if(h.x>.4+uDensity*.6)continue;
  vec3 motion=hash3(vec3(r,float(column),91.));
  float z=dots?.5+mod((r+.5)*6.5+motion.z*20.-uFlow*(.45+motion.x*1.9),65.):(r+.5)*6.5-offset;if(z<.3)continue;
  float progress=1.-smoothstep(9.,54.,z),fullHeight=2.+pow(h.y,1.2)*10.,height=fullHeight*(.035+.965*progress);
  vec3 size=vec3(.85+h.z*.6,height*.5,1.4+h.x*.6),center=vec3(side*(2.7+lane*3.8),height*.5-.45,z);
  if(dots){float angle=(float(column)+.5)*.785398,rad=3.2+h.x*1.2;center=vec3(cos(angle)*rad,.5+sin(angle)*rad,z);size=vec3(.45+h.x*1.1,.55+h.y*1.4,.8+h.z*1.4);}
  vec3 localOrigin=ro-center,localRay=rd;int kind=0;
  vec3 spin=(h-.5)*3.+uFlow*(.1+motion*.35)*mix(vec3(-1.),vec3(1.),step(vec3(.5),hash3(vec3(r,float(column),117.))));
  if(dots){kind=int(floor(hash(r*31.+float(column)*7.)*5.));localOrigin.xy=dsRotate(spin.x)*localOrigin.xy;localRay.xy=dsRotate(spin.x)*localRay.xy;localOrigin.xz=dsRotate(spin.y)*localOrigin.xz;localRay.xz=dsRotate(spin.y)*localRay.xz;localOrigin.yz=dsRotate(spin.z)*localOrigin.yz;localRay.yz=dsRotate(spin.z)*localRay.yz;if(kind==4){localOrigin.x-=localOrigin.y*.65;localRay.x-=localRay.y*.65;}}
  vec2 interval=dots?dsDotShape(localOrigin,localRay,size,kind):dsBoxHit(ro,rd,center,size);if(interval.y<=max(interval.x,.1))continue;
  float t=max(.1,interval.x);vec3 q=localOrigin+localRay*t;
  if(dots){
   vec3 face=abs(abs(q)-size);vec2 uv=face.y<min(face.x,face.z)?q.xz:face.z<face.x?q.xy:q.zy;
   vec3 normalPoint=q,normalSize=size;
   if(kind==1){vec3 barSize=size*vec3(.45,1.,1.),armSize=size*vec3(1.,.45,1.);vec3 bar=q+vec3(size.x*.55,0.,0.),arm=q+vec3(0.,size.y*.55,0.);bool useBar=abs(sdBox(bar,barSize))<abs(sdBox(arm,armSize));normalPoint=useBar?bar:arm;normalSize=useBar?barSize:armSize;}
   vec3 normalFace=abs(abs(normalPoint)-normalSize);vec3 normal=normalFace.x<min(normalFace.y,normalFace.z)?vec3(sign(normalPoint.x),0.,0.):normalFace.y<normalFace.z?vec3(0.,sign(normalPoint.y),0.):vec3(0.,0.,sign(normalPoint.z));
   if(kind==2&&abs(q.x/size.x+q.y/size.y-.25)<.02)normal=normalize(vec3(1./size.x,1./size.y,0.));
   if(kind==3&&dot(abs(q),1./size)>1.43)normal=normalize(sign(q)/size);
   if(kind==4)normal.y-=normal.x*.65;
   normal.yz=dsRotate(-spin.z)*normal.yz;normal.xz=dsRotate(-spin.y)*normal.xz;normal.xy=dsRotate(-spin.x)*normal.xy;
   float shade=.28+.92*max(dot(normalize(normal),normalize(vec3(-.5,.8,-.4))),0.);
   if(kind==2&&abs(q.x/size.x+q.y/size.y-.25)<.02)uv=vec2(q.x*1.4,q.z);
   if(kind==3)uv=vec2(q.x+q.z*.65,q.y+q.z*.35);
   float spacing=mix(.2,.10,uDensity);
   vec2 cell=uv/spacing;vec2 local=(fract(cell)-.5)*spacing;float aa=.004+t*.001;
   float dotMask=1.-smoothstep(spacing*.12,spacing*.12+aa,length(local));
   vec3 color=mix(uTint,uTint2,h.z);float pulse=.55+.45*sin(iTime*.8+floor(cell.y)*.1+r*.7);
   float route=step(.82,hash(floor(cell.y)*7.+r))*exp(-abs(fract(cell.x*.1-uFlow*.3)-.5)*18.);
   acc+=color*(dotMask*(.7+.7*pulse)+route*.12*uGlow)*shade*exp(-t*.035);
  }else{
   acc+=dsBuildingFace(q,size,t,h.z,progress)*exp(-t*.033);
   vec3 back=ro+rd*interval.y-center;acc+=dsBuildingFace(back,size,interval.y,h.z,progress)*exp(-interval.y*.035)*.18;
  }
 }
 if(!dots&&rd.y<-.001){float t=(-.45-ro.y)/rd.y;if(t>0.&&t<80.){vec3 p=ro+rd*t;p.z+=offset;vec2 f=abs(fract(p.xz)-.5);float grid=1.-smoothstep(.012,.012+t*.001,min(f.x,f.y));acc+=uTint*grid*.13*exp(-t*.045);}}
 return acc;
}
