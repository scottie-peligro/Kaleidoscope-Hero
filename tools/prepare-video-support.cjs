// Repeatable video integration for the full and compact shared renderers.
const fs=require('node:fs');
const path=require('node:path');
const assets=path.resolve(__dirname,'../assets');
const file=path.join(assets,'kaleidoscope-hero.js');
let source=fs.readFileSync(file,'utf8');
function insert(before,block){if(source.includes(block.trim()))return; if(!source.includes(before))throw Error('Missing video insertion point: '+before.slice(0,60)); source=source.replace(before,block+before);}
function replaceOnce(before,after){if(source.includes(after))return;if(!source.includes(before))throw Error('Missing video replacement point: '+before.slice(0,60));source=source.replace(before,after);}
insert('  var NUM = ',`  // DH_VIDEO_SETTINGS_BEGIN
  var VIDEO_NUM=['videoPlaybackSpeed','videoParticleSpacing','videoParticleSize','videoDepth','videoThreshold','videoContrast'];
  var VIDEO_DEF={videoUrl:'',videoPoster:'',videoDisplay:'Particle wall',videoFit:'Cover',videoPlaybackSpeed:1,videoLoop:true,videoParticleSpacing:6,videoParticleSize:3,videoParticleShape:'Round',videoColor:'Original video',videoDepth:0,videoThreshold:0,videoContrast:1};
  // DH_VIDEO_SETTINGS_END
`);
source=source.replace('videoParticleSpacing:8,videoParticleSize:3,videoParticleShape', 'videoParticleSpacing:6,videoParticleSize:3,videoParticleShape').replace('videoDepth:0,videoThreshold:.05,videoContrast:1','videoDepth:0,videoThreshold:0,videoContrast:1');
if(!source.includes('var NUM = VIDEO_NUM.concat('))source=source.replace(/  var NUM = (\[[^\r\n]*\]);/,(_,list)=>'  var NUM = VIDEO_NUM.concat('+list+');');
insert('  var motion = ',`  Object.assign(DEF,VIDEO_DEF);
`);
insert('    if ([\'Mixed landscape\'',`    var videoBounds={videoPlaybackSpeed:[0,2],videoParticleSpacing:[3,24],videoParticleSize:[.5,10],videoDepth:[0,2],videoThreshold:[0,1],videoContrast:[.5,2]};
    Object.keys(videoBounds).forEach(function(key){o[key]=Math.max(videoBounds[key][0],Math.min(videoBounds[key][1],o[key]));});
    o.videoLoop=truthy(o.videoLoop);
    ['videoDisplay','videoFit','videoParticleShape','videoColor'].forEach(function(key){var allowed={videoDisplay:['Video','Particle wall'],videoFit:['Cover','Contain'],videoParticleShape:['Round','Square'],videoColor:['Original video','Palette','Monochrome']};if(allowed[key].indexOf(o[key])<0)o[key]=DEF[key];});
    ['videoUrl','videoPoster'].forEach(function(key){if(!/^https?:\\/\\//i.test(o[key]))o[key]='';});
`);
replaceOnce("style!=='Custom 3D Object';", "style!=='Custom 3D Object'&&style!=='Video wall';");
if(!source.includes("if(d.style!=='Video wall'&&self.videoWall)"))insert("      if (d.style === 'Custom 3D Object') {",`      if(d.style!=='Video wall'&&self.videoWall){self.videoWall.dispose();self.videoWall=null;el.classList.remove('dh-video-ready');}
      if (d.style === 'Video wall') {
        if(!self.videoWall&&!self.videoLoading&&!self.videoLoadError){
          self.videoLoading=true;
          if(!window.DHVideoRenderLoading)window.DHVideoRenderLoading=new Promise(function(resolve,reject){var script=document.createElement('script');script.src=window.DH_SCENES.videoRuntime;script.onload=function(){resolve(window.DHVideoRuntime);};script.onerror=function(){script.remove();window.DHVideoRenderLoading=null;reject(Error('Video renderer unavailable'));};document.head.appendChild(script);});
          window.DHVideoRenderLoading.then(function(runtime){if(!self.disposed&&self.disc.style==='Video wall')self.videoWall=runtime.create(gl,el);self.videoLoading=false;}).catch(function(e){self.videoLoadError=String(e);self.videoLoading=false;});
        }
        if(self.videoWall)self.videoWall.draw(cur,self.tgt,c.width,c.height,tint,self.quality);
        else{gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);}
      } else `);
// The previous insertion terminates before the existing branch; collapse the shared prefix.
source=source.replace("      } else       if (d.style === 'Custom 3D Object') {","      } else if (d.style === 'Custom 3D Object') {");
replaceOnce("    this.pause = function () { active = false; cancelAnimationFrame(self.raf); clearTimeout(self.frameTimer); self.raf = self.frameTimer = 0; zoom.t = 0; };","    this.pause = function () { active = false; cancelAnimationFrame(self.raf); clearTimeout(self.frameTimer); self.raf = self.frameTimer = 0; zoom.t = 0; if(self.videoWall)self.videoWall.pause(); };");
insert("      active = true; needsResize = true;",`      if(self.videoWall)self.videoWall.resume();
`);
insert("      if (self.model) { self.model.dispose(); self.model=null; }",`      if (self.videoWall) { self.videoWall.dispose(); self.videoWall=null; }
`);
fs.writeFileSync(file,source);
