// Pixel-aware point filtering and refined intersections prevent temporal shimmer.
vec3 particles(vec3 ro,vec3 rd,float tmax){
  vec3 acc=vec3(0.);
  float footprint=max(length(dFdx(rd)),length(dFdy(rd)));
  float zo=mod(uFlow*.3*gFS,4000.);
  float g=mix(.3,.09,uDensity);
  for(int k=0;k<3;k++){
    if(uStyle<1.5)break;
    float fk=float(k),t=1.2,pt=t,pf=(ro+rd*t).y-sheetH(k,(ro+rd*t).xz,zo);
    for(int i=0;i<48;i++){
      t+=.35+t*.06;if(t>tmax)break;
      vec3 p=ro+rd*t;float f=p.y-sheetH(k,p.xz,zo);
      if(sign(f)!=sign(pf)){
        float a=pt,b=t;
        for(int j=0;j<8;j++){float m=.5*(a+b);vec3 q=ro+rd*m;float fm=q.y-sheetH(k,q.xz,zo);if(sign(fm)==sign(pf))a=m;else b=m;}
        float th=.5*(a+b);vec3 P=ro+rd*th;
        float z=P.z+zo,cx=(5.5+fk*2.)*sin(z*.045+fk*2.1+iTime*.07)+(fk-1.)*5.,xr=P.x-cx;
        float wid=2.6+1.4*sin(z*.06+fk*1.7+iTime*.1);
        float band=smoothstep(wid,wid*.45,abs(xr));
        if(band>.001){
          vec2 uv=vec2(xr,z)/vec2(g,g*2.6);
          vec2 cl=fract(uv)-.5;float dd=length(cl*vec2(g,g*2.6));
          float px=max(th*.0022+.002,th*footprint*1.3),r=g*.2;
          float dotm=1.6*smoothstep(r+px,max(r-px,0.),dd)+.2*uGlow*exp(-dd*dd/(r*r*9.));
          dotm=mix(dotm,.18+.06*uGlow,smoothstep(g*.6,g*2.5,px));
          float sh=hash(dot(floor(uv),vec2(17.1,93.7))+fk*7.);
          float tw=.82+.18*sin(iTime*(.5+sh*1.2)+sh*40.);
          float gx=clamp(xr/wid*.5+.5,0.,1.);
          vec3 c=mix(uTint,uTint2,gx);
          c=mix(c,spec(gx*.6+fk*.25+z*.004+iTime*.02),uMulti);
          c=pow(c,vec3(2.2))*2.+vec3(1.,.45,.1)*pow(band,8.)*.6;
          acc+=c*dotm*band*tw*(.6+.8*pow(band,3.))*exp(-th*.03)*smoothstep(80.,40.,th)*smoothstep(3.,8.,th);
        }
      }
      pt=t;pf=f;
    }
  }
  return acc*1.4;
}
