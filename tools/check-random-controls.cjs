const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'../assets')+'/',results={};
const groups={randomStyle:['style'],randomPalette:['palette','multicolor'],randomKaleidoscope:['kaleidoscope','kaleidoscopeMode','kaleidoscopeFraming'],randomSpeeds:['flow','trailSpeed','modelRotationSpeed','morphDuration','morphHold','autoVortexSpeed'],randomFinish:['density','glow','brightness'],randomBackground:['bgColor1','bgColor2','gradient','gradientAngle']};
const flags=Object.fromEntries(Object.keys(groups).map(k=>[k,false]));
for(const [name,api] of [['kaleidoscope-hero','KaleidoscopeHero'],['dh-floating','FloatingShapeHero'],['dh-disco','KaleidoscopeDiscoHero']]){
 const w={DH_SCENES:{},matchMedia:()=>({matches:false})},ctx=vm.createContext({window:w,navigator:{},document:{},console});
 vm.runInContext(fs.readFileSync(root+name+'.js','utf8'),ctx);
 const proto=w[api].Hero.prototype,h=Object.create(proto);h.disc={};h.update({randomize:true,...flags,style:'Custom 3D Object',kaleidoscope:7,kaleidoscopeMode:'Both',kaleidoscopeFraming:'Centered',gradient:'Linear'});
 const base=JSON.parse(JSON.stringify(h.base));
 assert.deepEqual(JSON.parse(JSON.stringify(h.randomCfg())),base,'all off');
 for(const flag of Object.keys(groups)){
  h.update({...base,[flag]:true});const snapshots=Array.from({length:200},()=>JSON.parse(JSON.stringify(h.randomCfg())));
  for(const c of snapshots){for(const k of Object.keys(c))if(!groups[flag].includes(k))assert.deepEqual(c[k],h.base[k],flag+' leaked into '+k);assert.notEqual(c.style,undefined);}
  for(const k of groups[flag])assert(snapshots.some(c=>c[k]!==base[k]),flag+' never changes '+k);
  if(flag==='randomStyle')assert(snapshots.every(c=>c.style!=='Custom 3D Object'));
 }
 for(const tone of ['Light','Dark','Both']){
  h.update({...base,randomBackground:true,randomBackgroundTone:tone});let light=0,dark=0;
  for(let i=0;i<1000;i++){
   const c=h.randomCfg(),colors=[c.bgColor1,c.bgColor2].map(hex=>{assert.match(hex,/^#[0-9a-f]{6}$/);return hex.slice(1).match(/../g).map(n=>parseInt(n,16)/255);});
   const isLight=colors.every(rgb=>Math.min(...rgb)>.6),isDark=colors.every(rgb=>Math.max(...rgb)<.3);assert(isLight||isDark,'mixed/invalid tone');light+=isLight;dark+=isDark;
   assert(tone!=='Light'||isLight);assert(tone!=='Dark'||isDark);
  }
  if(tone==='Both')assert(light>100&&dark>100);
 }
 h.update({randomize:'yes',randomStyle:'false',randomPalette:'0',randomSpeeds:'no',randomFinish:0,randomKaleidoscope:false,randomBackground:'on',randomBackgroundTone:'invalid',kaleidoscopeFraming:'invalid'});
 assert.equal(h.base.randomBackground,true);assert.equal(h.base.randomStyle,false);assert.equal(h.base.randomBackgroundTone,'Dark');assert.equal(h.base.kaleidoscopeFraming,'Full screen');
 h.update({...base,randomBackground:true});h.cur={...h.base};h.bg1=[0,0,0];h.bg2=[0,0,0];h.blendColor=[0,0,0];h.fade=1;
 let calls=0;const cfg=h.randomCfg;h.randomCfg=function(){calls++;return cfg.call(h);};h.tick(0,.01);h.tick(14,.01);assert.equal(calls,1);h.tick(15,.01);assert.equal(calls,2);
 h.update({...base,randomize:false});h.tick(31,100);assert.deepEqual(JSON.parse(JSON.stringify(h.tgt)),JSON.parse(JSON.stringify(h.base)));assert.equal(calls,2);assert.equal(h.disc.kaleidoscopeFraming,'Centered');
 h.update({randomize:true});assert(Object.keys(groups).filter(k=>k!=='randomBackground').every(k=>h.base[k]===true));assert.equal(h.base.randomBackground,false);
 results[name]={groups_isolated:true,all_groups_off_unchanged:true,tone_cases:3000,interval_and_toggle:true,legacy_defaults:true};
}
console.log(JSON.stringify(results,null,2));
