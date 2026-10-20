const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const adjacent=path.resolve(__dirname,'../assets'),root=fs.existsSync(adjacent)?adjacent:path.resolve(__dirname,'../app/public/wp-content/plugins/kaleidoscope-hero/assets');
for(const [file,api] of [['kaleidoscope-hero','KaleidoscopeHero'],['dh-floating','FloatingShapeHero'],['dh-disco','KaleidoscopeDiscoHero']]){
 const window={DH_SCENES:{},matchMedia:()=>({matches:false})};vm.runInNewContext(fs.readFileSync(path.join(root,file+'.min.js'),'utf8'),{window,navigator:{},document:{}});
 const h=Object.create(window[api].Hero.prototype);h.disc={};
 for(const [input,expected] of [[undefined,0],[-100,-50],[-25,-25],[25,25],[100,50],['invalid',0],[Infinity,0]]){h.update({modelOffsetX:input});assert.equal(h.base.modelOffsetX,expected);}
 h.update({modelOffsetX:-25,randomize:true});for(let i=0;i<100;i++)assert.equal(h.randomCfg().modelOffsetX,-25,'Random cycle must retain chosen position');
 h.update({modelOffsetX:0});h.cur={...h.base};h.bg1=[0,0,0];h.bg2=[0,0,0];h.blendColor=[0,0,0];h.fade=1;
 h.update({modelOffsetX:25});h.tick(0,.1);assert(h.cur.modelOffsetX>0&&h.cur.modelOffsetX<25,'Position should ease to the target');h.tick(1,100);assert.equal(h.cur.modelOffsetX,25);
 console.log(file+': centered default, bounds, random preservation and smooth updates passed');
}
