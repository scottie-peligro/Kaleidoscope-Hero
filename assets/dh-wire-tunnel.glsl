// Cylindrical grid with independently timed runners. Travel uses the Flow clock,
// so Flow 0 freezes both the tunnel and its particles (including reduced motion).
uniform float uTrailSpeed,uTrailLength,uTrailAmount;
vec3 wireTunnel(vec3 rd){
 float r=length(rd.xy)+1e-4,z=1.6*max(rd.z,.001)/r,zz=z+uFlow*1.4;
 float a=atan(rd.y,rd.x)+zz*.012+.35*sin(zz*.045+uFlow*.1)+uFlow*.012;
 float N=floor(mix(10.,40.,uDensity)),u=a/6.2831853*N,v=zz*mix(.5,1.4,uDensity);
 float du=max(fwidth(u),1e-4),dv=max(fwidth(v),1e-4);
 float eu=abs(u-floor(u+.5)),ev=abs(v-floor(v+.5));
 float lu=(1.-smoothstep(0.,du*1.4,eu))*(1.-smoothstep(.2,.6,du));
 float lv=(1.-smoothstep(0.,dv*1.4,ev))*(1.-smoothstep(.2,.6,dv));
 float lane=mod(floor(u+.5),N),seed=hash(lane*7.31+11.);
 vec3 c=mix(uTint,uTint2,seed);c=mix(c,spec(zz*.008+lane/N),uMulti);
 // Each runner heads toward decreasing depth. Its tail remains behind it along
 // the same longitudinal wire; modulo wraps only the distant train of runners.
 float period=18.+seed*22.,speed=(1.5+hash(lane*13.7)*3.5)*uTrailSpeed;
 float phase=mod(zz+uFlow*speed+seed*period,period);
 float tail=exp(-phase/max(.1,uTrailLength*2.4))*(1.-smoothstep(period*.65,period,phase));
 float head=exp(-pow(min(phase,period-phase)/(.11+fwidth(zz)*.65),2.));
 float width=max(du*.9,.014),wire=exp(-pow(eu/width,2.))*(1.-smoothstep(.25,.65,du));
 float enabled=1.-smoothstep(uTrailAmount-.07,uTrailAmount,seed*.94);
 float runner=(tail*.9+head*4.)*wire*enabled;
 // A smaller second set races around selected cross rings, on the grid itself.
 float ring=floor(v+.5),ringSeed=hash(ring*9.13),angle=mod(u-uFlow*uTrailSpeed*(.5+ringSeed)+ringSeed*N,N);
 float ringTail=exp(-angle/max(.12,uTrailLength*.6))*(1.-smoothstep(N*.6,N,angle));
 float ringHead=exp(-pow(min(angle,N-angle)/max(du,.07),2.));
 float ringWire=exp(-pow(ev/max(dv,.014),2.))*(1.-smoothstep(.2,.6,dv));
 runner+=(ringTail*.5+ringHead*2.)*ringWire*step(.75,ringSeed)*(1.-smoothstep(uTrailAmount-.05,uTrailAmount,hash(ring*3.17)));
 float fade=exp(-z*.035)*smoothstep(.3,1.5,z);
 return (c*(lu+lv)*.34+mix(c,vec3(1.),.65)*runner*(.5+uGlow*.5))*fade*1.4;
}
