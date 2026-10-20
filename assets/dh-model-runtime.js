// Optional importer is downloaded only after a Custom 3D Object becomes visible.
function modelImporter(){
 if(window.DHModelLoader)return Promise.resolve(window.DHModelLoader);
 if(!window.DHModelLoading)window.DHModelLoading=new Promise(function(resolve,reject){var script=document.createElement('script');script.src=window.DH_SCENES.modelLoader;script.onload=function(){if(window.DHModelLoader)resolve(window.DHModelLoader);else{window.DHModelLoading=null;reject(Error('The model importer is unavailable.'));}};script.onerror=function(){script.remove();window.DHModelLoading=null;reject(Error('The model loader could not be downloaded.'));};document.head.appendChild(script);});
 return window.DHModelLoading;
}
function makeModel(gl,el,helpers){
 var mapScenePointer=helpers.mapPointer,rng=helpers.rng;
 var program=gl.createProgram(),shaders=[];
 [[gl.VERTEX_SHADER,MODEL_VERT],[gl.FRAGMENT_SHADER,MODEL_FRAG]].forEach(function(pair){var s=gl.createShader(pair[0]);gl.shaderSource(s,pair[1]);gl.compileShader(s);gl.attachShader(program,s);shaders.push(s);});gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(shaders.map(function(s){return gl.getShaderInfoLog(s);}).join('\n')||gl.getProgramInfoLog(program));
 shaders.forEach(function(s){gl.detachShader(program,s);gl.deleteShader(s);});
 var u={},batches=[],depth=gl.createRenderbuffer(),target=null,width=0,height=0,url='',generation=0,abort=null,disposed=false;
 var message=document.createElement('span');message.className='dh-model-status';message.setAttribute('role','status');message.setAttribute('aria-live','polite');el.appendChild(message);
 ['uRotation','uUV','uResolution','uTime','uSize','uFloat','uForward','uPoints','uPointSize','uExplosion','uStrength','uMouseForce','uMouseRadius','uMouseStrength','uMouseGlobal','uPointer','uMap','uColor','uTint','uTint2','uHasMap','uOpacity','uAlphaTest','uRoughness','uMetalness','uUnlit','uPalette','uMulti','uBright','uGlow','uWire'].forEach(function(k){u[k]=gl.getUniformLocation(program,k);});
 var api={program:program,status:'empty',triangles:0,points:0,error:null};
 function status(state,error){api.status=state;api.error=error||null;el.dataset.dhModelStatus=state;message.hidden=state==='ready';message.textContent=state==='loading'?'Loading 3D object…':state==='error'?(el.classList.contains('dh-hero--preview')?error:'3D object unavailable.'):'';}
 function clear(){batches.forEach(function(b){gl.deleteVertexArray(b.mesh.vao);gl.deleteBuffer(b.mesh.buffer);gl.deleteVertexArray(b.cloud.vao);gl.deleteBuffer(b.cloud.buffer);gl.deleteTexture(b.texture);});batches=[];api.points=api.triangles=0;}
 function geometry(data){var vao=gl.createVertexArray(),buffer=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);[['aPosition',3,0],['aNormal',3,3],['aColor',4,6],['aUV',2,10]].forEach(function(a){var loc=gl.getAttribLocation(program,a[0]);if(loc>=0){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,a[1],gl.FLOAT,false,48,a[2]*4);}});return {vao:vao,buffer:buffer,count:data.length/12};}
 function areaTable(v){var c=new Float64Array(v.length/36),total=0;for(var i=0;i<c.length;i++){var k=i*36,ax=v[k+12]-v[k],ay=v[k+13]-v[k+1],az=v[k+14]-v[k+2],bx=v[k+24]-v[k],by=v[k+25]-v[k+1],bz=v[k+26]-v[k+2];total+=Math.hypot(ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx);c[i]=total;}return {c:c,total:total};}
 function cloud(v,areas,count){var out=new Float32Array(count*12),random=rng(179);for(var i=0;i<count;i++){var r=random()*areas.total,lo=0,hi=areas.c.length-1;while(lo<hi){var mid=(lo+hi)>>1;if(areas.c[mid]<r)lo=mid+1;else hi=mid;}var root=Math.sqrt(random()),b=random(),weights=[1-root,root*(1-b),root*b];for(var k=0;k<12;k++)out[i*12+k]=v[lo*36+k]*weights[0]+v[lo*36+12+k]*weights[1]+v[lo*36+24+k]*weights[2];}return out;}
 function load(next,settings,key){
  url=key;api.source=next;var token=++generation;if(abort)abort.abort();abort=new AbortController();var signal=abort.signal;status('loading');
  modelImporter().then(function(loader){if(disposed||signal.aborted)return null;return loader.load(next,signal,settings);}).then(function(model){
   if(!model)return;if(disposed||token!==generation){model.release();return;}
   var previousVAO=gl.getParameter(gl.VERTEX_ARRAY_BINDING),previousActive=gl.getParameter(gl.ACTIVE_TEXTURE);gl.activeTexture(gl.TEXTURE4);var previousTexture=gl.getParameter(gl.TEXTURE_BINDING_2D);
   try{
    var tables=model.groups.map(function(g){if(!g.vertices.every(Number.isFinite))throw Error('The model contains invalid vertex coordinates.');return areaTable(g.vertices);}),total=tables.reduce(function(a,t){return a+t.total;},0);if(total<.000001)throw Error('The model has no surface area.');
    clear();model.groups.forEach(function(g,i){var texture=gl.createTexture(),b={material:g,texture:texture};gl.bindTexture(gl.TEXTURE_2D,texture);
     if(g.map&&g.map.image){var image=g.map.image;if(image.width>2048||image.height>2048){var resize=document.createElement('canvas'),scale=Math.min(2048/image.width,2048/image.height);resize.width=Math.max(1,Math.round(image.width*scale));resize.height=Math.max(1,Math.round(image.height*scale));resize.getContext('2d').drawImage(image,0,0,resize.width,resize.height);image=resize;}gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,!!g.map.flipY);gl.texImage2D(gl.TEXTURE_2D,0,gl.SRGB8_ALPHA8,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);}
     else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);var wrap=function(v){return v===1000?gl.REPEAT:v===1002?gl.MIRRORED_REPEAT:gl.CLAMP_TO_EDGE;};gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,wrap(g.map&&g.map.wrapS));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,wrap(g.map&&g.map.wrapT));gl.generateMipmap(gl.TEXTURE_2D);
     b.mesh=geometry(g.vertices);var count=Math.max(1,Math.floor(24000*tables[i].total/total));b.cloud=geometry(cloud(g.vertices,tables[i],count));api.points+=count;batches.push(b);delete g.vertices;if(g.map)delete g.map.image;
    });api.triangles=model.triangles;status('ready');
   }catch(e){clear();status('error',String(e.message||e));}finally{model.release();gl.bindVertexArray(previousVAO&&gl.isVertexArray(previousVAO)?previousVAO:null);gl.bindTexture(gl.TEXTURE_2D,previousTexture&&gl.isTexture(previousTexture)?previousTexture:null);gl.activeTexture(previousActive);}
  }).catch(function(e){if(!disposed&&token===generation&&!signal.aborted){clear();status('error',String(e.message||e));}});
 }
 api.draw=function(cur,disc,time,w,h,look,tints,quality,amount,pointer,settings){
  var svg=settings.modelSource==='SVG extrusion',next=svg?(settings.svgUrl||window.DH_SCENES.svgSample):(settings.modelUrl||window.DH_SCENES.modelSample),key=next+'|'+settings.modelSource+(svg?'|'+settings.svgDepth+'|'+settings.svgBevel:'');if(key!==url)load(next,settings,key);
  target=gl.getParameter(gl.FRAMEBUFFER_BINDING);if(width!==w||height!==h){width=w;height=h;gl.bindRenderbuffer(gl.RENDERBUFFER,depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);}gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depth);
  gl.viewport(0,0,w,h);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.clearDepth(1);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.disable(gl.CULL_FACE);gl.useProgram(program);
  var yaw=cur.modelRotateY*Math.PI/180,pitch=cur.modelRotateX*Math.PI/180,roll=cur.modelRotateZ*Math.PI/180;
  var automatic=settings.modelRotation==='Automatic'?time*.25*cur.modelRotationSpeed:0;
  if(settings.modelAxis==='X')pitch+=automatic;else if(settings.modelAxis==='Z')roll+=automatic;else yaw+=automatic;
  if(settings.modelRotation==='Mouse'){yaw+=look.x*Math.PI;pitch+=look.y*.9;}
  yaw-=look.x*cur.lookRange*.65;pitch+=look.y*cur.lookRange*.22;
  var cx=Math.cos(pitch),sx=Math.sin(pitch),cy=Math.cos(yaw),sy=Math.sin(yaw),cz=Math.cos(roll),sz=Math.sin(roll),rotation=[cy*cz,cy*sz,-sy,sx*sy*cz-cx*sz,sx*sy*sz+cx*cz,sx*cy,cx*sy*cz+sx*sz,cx*sy*sz-sx*cz,cx*cy];
  pointer=pointer||{};var mouse=mapScenePointer(pointer,w,h),effect=disc.shapeMouseEffect||'Off',points=settings.modelDisplay==='Particles',mirrors=disc.kaleidoscopeMode==='Whole screen'?0:disc.kaleidoscope;
  var values={uTime:time,uSize:cur.modelSize,uFloat:cur.modelFloat,uForward:mirrors,uPoints:points?1:0,uWire:settings.modelDisplay==='Wireframe'?1:0,uPointSize:Math.max(2,h/220),uExplosion:amount,uStrength:cur.shapeExplode,uMouseForce:effect==='Attract'?-1:effect==='Repel'?1:0,uMouseRadius:cur.shapeMouseRadius,uMouseStrength:cur.shapeMouseStrength,uMouseGlobal:cur.shapeMouseGlobal,uPalette:settings.modelColor==='Palette'?1:0,uMulti:cur.multicolor,uBright:cur.brightness,uGlow:cur.glow};
  Object.keys(values).forEach(function(k){gl.uniform1f(u[k],values[k]);});gl.uniformMatrix3fv(u.uRotation,false,rotation);gl.uniform2f(u.uResolution,w,h);gl.uniform4f(u.uPointer,mouse[0],mouse[1],pointer.presence||0,effect==='Local explosion'?pointer.explosion||0:0);gl.uniform3fv(u.uTint,tints[0]);gl.uniform3fv(u.uTint2,tints[1]);gl.uniform1i(u.uMap,4);gl.activeTexture(gl.TEXTURE4);
  batches.forEach(function(b){var m=b.material,g=points?b.cloud:b.mesh;gl.bindVertexArray(g.vao);gl.bindTexture(gl.TEXTURE_2D,b.texture);gl.uniformMatrix3fv(u.uUV,false,m.map?m.map.matrix:[1,0,0,0,1,0,0,0,1]);gl.uniform3fv(u.uColor,m.color);gl.uniform1f(u.uHasMap,m.map?1:0);gl.uniform1f(u.uOpacity,m.opacity);gl.uniform1f(u.uRoughness,m.roughness);gl.uniform1f(u.uMetalness,m.metalness);gl.uniform1f(u.uUnlit,m.unlit?1:0);gl.uniform1f(u.uAlphaTest,m.alphaTest);
   if(points||m.opacity<1){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,points?gl.ONE:gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);}else{gl.disable(gl.BLEND);gl.depthMask(true);}
   var count=points?Math.max(1,Math.floor(g.count*Math.min(1,cur.density)*({low:.25,medium:.65,high:1}[quality]||.65))):g.count;gl.drawArraysInstanced(points?gl.POINTS:gl.TRIANGLES,0,count,mirrors>=2?1+Math.floor(mirrors):1);
  });gl.depthMask(true);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.activeTexture(gl.TEXTURE0);
 };
 api.dispose=function(){disposed=true;++generation;if(abort)abort.abort();clear();var previous=gl.getParameter(gl.FRAMEBUFFER_BINDING);if(target&&gl.isFramebuffer(target)){gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,null);}gl.bindFramebuffer(gl.FRAMEBUFFER,previous);gl.deleteRenderbuffer(depth);gl.deleteProgram(program);message.remove();delete el.dataset.dhModelStatus;};
 return api;
}
