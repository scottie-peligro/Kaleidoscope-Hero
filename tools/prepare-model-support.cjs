const fs=require('node:fs'),path=require('node:path');
const assets=path.resolve(__dirname,'../assets'),file=path.join(assets,'kaleidoscope-hero.js');let source=fs.readFileSync(file,'utf8');
if(!source.includes('modelSize: 1')){
 source=source.replace('var DEF = {','var DEF = { modelUrl: "", modelDisplay: "Solid", modelColor: "Original materials", modelSize: 1, modelFloat: 1, modelRotation: "Automatic", modelAxis: "Y", modelRotationSpeed: .5, modelRotateX: 10, modelRotateY: 0, modelRotateZ: 0,');
 source=source.replace('var NUM = [','var NUM = ["modelSize","modelFloat","modelRotationSpeed","modelRotateX","modelRotateY","modelRotateZ",');
 source=source.replace('    if (STYLES.indexOf(o.style)',`    ['modelDisplay','modelColor','modelRotation','modelAxis'].forEach(function(key){var allowed={modelDisplay:['Solid','Wireframe','Particles'],modelColor:['Original materials','Palette'],modelRotation:['Automatic','Mouse','Off'],modelAxis:['X','Y','Z']};if(allowed[key].indexOf(o[key])<0)o[key]=DEF[key];});
    var modelBounds={modelSize:[.3,2],modelFloat:[0,2],modelRotationSpeed:[-2,2],modelRotateX:[-180,180],modelRotateY:[-180,180],modelRotateZ:[-180,180]};Object.keys(modelBounds).forEach(function(key){o[key]=Math.max(modelBounds[key][0],Math.min(modelBounds[key][1],Number.isFinite(o[key])?o[key]:DEF[key]));});
    if (STYLES.indexOf(o.style)`);
 source=source.replace('style: p(STYLES),','style: p(STYLES.filter(function(style){return style!==\'Custom 3D Object\';})),');
 source=source.replace("      if (d.style === 'Wireframe landscape') {",`      if (d.style === 'Custom 3D Object') {
        if (!self.model && !self.modelLoading && !self.modelLoadError) {
          self.modelLoading=true;
          if(!window.DHModelRenderLoading)window.DHModelRenderLoading=new Promise(function(resolve,reject){var script=document.createElement('script');script.src=window.DH_SCENES.modelRuntime;script.onload=function(){resolve(window.DHModelRuntime);};script.onerror=function(){script.remove();window.DHModelRenderLoading=null;reject(Error('3D renderer unavailable'));};document.head.appendChild(script);});
          window.DHModelRenderLoading.then(function(runtime){if(!self.disposed)self.model=runtime.create(gl,el,{mapPointer:mapScenePointer,rng:rng});self.modelLoading=false;}).catch(function(e){self.modelLoadError=String(e);self.modelLoading=false;});
        }
        if(self.model){
          particlePointer.tessMode=TESSELLATIONS.indexOf(self.tgt.tessellation);particlePointer.tessDensity=cur.tessellationDensity;particlePointer.tessZoom=cur.tessellationZoom;particlePointer.tessRotation=cur.tessellationRotation*Math.PI/180;
          particlePointer.fullKal=d.kaleidoscopeMode==='Forward elements'?0:d.kaleidoscope;particlePointer.autoVortex=autoAmount*autoDirection+vort*spinDir;particlePointer.autoSpin=autoSpin+spin;particlePointer.time=t;
          self.model.draw(cur,d,flowPos,c.width,c.height,look,tint,self.quality,shapeAmount,particlePointer,self.tgt);
        }else{gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);}
      } else if (d.style === 'Wireframe landscape') {`);
 source=source.replaceAll("(d.style === 'Iridescent ribbons' ?", "((d.style === 'Iridescent ribbons' || d.style === 'Custom 3D Object') ?");
 source=source.replace('      if (self.floating) self.floating.dispose();','      if (self.model) { self.model.dispose(); self.model=null; }\n      if (self.floating) self.floating.dispose();');
}
if(!source.includes('modelSource:')){
 source=source.replace('var DEF = {','var DEF = { modelSource: "3D model (GLB)", svgUrl: "", svgDepth: .12, svgBevel: .005,');
 source=source.replace('var NUM = [','var NUM = ["svgDepth","svgBevel",');
 source=source.replace('    if (STYLES.indexOf(o.style)',`    if(['3D model (GLB)','SVG extrusion'].indexOf(o.modelSource)<0)o.modelSource=DEF.modelSource;
    o.svgDepth=Math.max(0,Math.min(.5,o.svgDepth));o.svgBevel=Math.max(0,Math.min(.05,o.svgBevel));
    if (STYLES.indexOf(o.style)`);
}
if(!source.includes('modelOffsetX: 0')){
 source=source.replace('var DEF = {','var DEF = { modelOffsetX: 0,');
 source=source.replace('var NUM = [','var NUM = ["modelOffsetX",');
 source=source.replace('var modelBounds={','var modelBounds={modelOffsetX:[-50,50],');
}
fs.writeFileSync(file,source);
