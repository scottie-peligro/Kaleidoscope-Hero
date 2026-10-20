// Three.js is used only to decode models, never as a second rendering engine.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { Vector3, Matrix3, Matrix4, Box3, Group, Mesh, MeshStandardMaterial, ExtrudeGeometry, ShapeGeometry } from 'three';
const LIMIT=10*1024*1024;
function documentOf(bytes){
 const v=new DataView(bytes);if(bytes.byteLength<20||v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2||v.getUint32(8,true)!==bytes.byteLength||v.getUint32(16,true)!==0x4e4f534a)throw Error('Choose a glTF 2.0 .glb file.');
 const length=v.getUint32(12,true);if(length>1024*1024||length>bytes.byteLength-20)throw Error('Invalid GLB metadata.');
 const json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,length)));
 if(json.asset?.version!=='2.0'||!json.meshes?.length)throw Error('The model has no glTF 2.0 mesh.');
 for(const resource of [...json.buffers||[],...json.images||[]])if(resource.uri&&!/^data:(application\/(octet-stream|gltf-buffer)|image\/(png|jpeg|webp));base64,/.test(resource.uri))throw Error('Export a self-contained GLB with embedded textures.');
 if((json.images||[]).some(i=>i.mimeType&&!['image/png','image/jpeg','image/webp'].includes(i.mimeType)))throw Error('Export textures as PNG, JPEG or WebP.');
 if((json.accessors||[]).some(a=>a.count>500000)||(json.nodes||[]).length>2000)throw Error('This model is too complex. Use a low-poly export.');
 return json;
}
async function read(url,signal){
 const parsed=new URL(url,location.href);if(!['http:','https:'].includes(parsed.protocol))throw Error('Use an HTTP or HTTPS model URL.');
 const response=await fetch(parsed,{signal,credentials:'same-origin'});if(!response.ok)throw Error('Model unavailable ('+response.status+').');
 if(Number(response.headers.get('content-length'))>LIMIT)throw Error('Choose a model smaller than 10 MB.');
 const reader=response.body?.getReader();if(!reader){const b=await response.arrayBuffer();if(b.byteLength>LIMIT)throw Error('Choose a model smaller than 10 MB.');return b;}
 const pieces=[];let size=0;try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>LIMIT)throw Error('Choose a model smaller than 10 MB.');pieces.push(value);}}catch(e){await reader.cancel();throw e;}
 const result=new Uint8Array(size);let offset=0;for(const piece of pieces){result.set(piece,offset);offset+=piece.length;}return result.buffer;
}
function release(scene){
 const images=new Set(),textures=new Set(),materials=new Set(),geometries=new Set();
 scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m){materials.add(m);for(const v of Object.values(m))if(v?.isTexture){textures.add(v);if(v.image)images.add(v.image);}}});
 textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());images.forEach(i=>i.close?.());
}
async function load(url,signal,settings={}){
 if(settings.modelSource==='SVG extrusion')return loadSVG(url,signal,settings);
 const bytes=await read(url,signal),json=documentOf(bytes),loader=new GLTFLoader();let draco;
 loader.setMeshoptDecoder(MeshoptDecoder);
 if((json.extensionsUsed||[]).includes('KHR_draco_mesh_compression')){draco=new DRACOLoader();draco.setDecoderPath(window.DH_SCENES.modelDraco);draco.setWorkerLimit(1);loader.setDRACOLoader(draco);}
 let gltf;try{gltf=await loader.parseAsync(bytes,'');}finally{draco?.dispose();}
 return bake(gltf.scene,signal);
}
const svgTags=new Set(['svg','g','path','rect','circle','ellipse','polygon','polyline','line','defs','linearGradient','radialGradient','stop','style']);
const svgAttributes=new Set(['id','class','viewBox','width','height','x','y','x1','x2','y1','y2','cx','cy','r','rx','ry','d','points','transform','fill','fill-rule','fill-opacity','opacity','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-miterlimit','stroke-opacity','display','visibility','color','style','offset','stop-color','stop-opacity','gradientUnits','gradientTransform','spreadMethod','fx','fy','href']);
const svgProperties=new Set(['fill','fill-rule','fill-opacity','opacity','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-miterlimit','stroke-opacity','display','visibility','color','stop-color','stop-opacity']);
function safeValue(value){return !/[<>\\]|@|expression|javascript:|data:|https?:/i.test(value)&&!/url\s*\(/i.test(value.replace(/url\(\s*['"]?#[\w.-]+['"]?\s*\)/gi,''));}
function declarations(text){return text.split(';').map(item=>{const colon=item.indexOf(':'),key=item.slice(0,colon).trim(),value=item.slice(colon+1).trim();return colon>0&&svgProperties.has(key)&&safeValue(value)?key+':'+value:'';}).filter(Boolean).join(';');}
function sanitizeSVG(text){
 if(text.length>512*1024||/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(text))throw Error('Use a simple SVG smaller than 512 KB.');
 const doc=new DOMParser().parseFromString(text,'image/svg+xml');if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw Error('This is not a valid SVG.');
 const clean=document.implementation.createDocument('http://www.w3.org/2000/svg','svg'),root=clean.documentElement;let count=0;
 function copy(node,parent){
  if(node.nodeType!==1)return;
  const tag=node.localName;if(['title','desc','metadata','namedview'].includes(tag))return;
  if(!svgTags.has(tag))throw Error('Convert text, images, strokes and effects to filled paths before importing this SVG.');
  if(++count>1000)throw Error('Simplify this SVG to fewer than 1,000 elements.');
  const out=parent===null?root:clean.createElementNS('http://www.w3.org/2000/svg',tag);if(parent)parent.appendChild(out);
  for(const a of node.attributes){const key=a.localName;if(!svgAttributes.has(key))continue;let value=a.value;if(key==='style')value=declarations(value);else if(key==='href'&&!/^#[\w.-]+$/.test(value))continue;else if(!safeValue(value))continue;out.setAttribute(key,value);}
  if(tag==='style'){let css='';for(const match of node.textContent.matchAll(/([^{}]+)\{([^{}]*)\}/g)){const selector=match[1].trim(),body=declarations(match[2]);if(/^[.#\w\s,>-]+$/.test(selector)&&body)css+=selector+'{'+body+'}';}out.textContent=css;}
  else for(const child of node.children)copy(child,out);
 }
 copy(doc.documentElement,null);return new XMLSerializer().serializeToString(clean);
}
async function loadSVG(url,signal,settings){
 const bytes=await read(url,signal);if(bytes.byteLength>2*1024*1024)throw Error('Choose an SVG smaller than 512 KB.');let text=new TextDecoder().decode(bytes);
 if(text.trim().startsWith('{')){const record=JSON.parse(text);if(record.format!=='kaleidoscope-svg-1'||typeof record.svg!=='string')throw Error('Choose an SVG logo source.');text=record.svg;}
 const source=sanitizeSVG(text),data=new SVGLoader().parse(source),scene=new Group(),box=new Box3();let paths=0;
 for(const path of data.paths)for(const sub of path.subPaths)for(const point of sub.getPoints(12))box.expandByPoint(new Vector3(point.x,point.y,0));
 const size=box.getSize(new Vector3()),span=Math.max(size.x,size.y,.001),depth=Math.max(0,Math.min(.5,settings.svgDepth??.12))*span,bevel=Math.min(.05,Math.max(0,settings.svgBevel??.005))*span;
 try{
 for(const path of data.paths){
  const style=path.userData.style;if(style.display==='none'||style.visibility==='hidden')continue;
  if(style.stroke&&style.stroke!=='none'&&Number(style.strokeWidth)>0)throw Error('Convert strokes to filled paths before extruding this SVG.');
  const fill=SVGLoader.createFillMaterial(path);if(!fill)continue;
  const shapes=path.toShapes();if(!shapes.length){fill.dispose();continue;}
  if(++paths>64)throw Error('Simplify the SVG to fewer than 64 filled paths.');
  const geometry=depth>0?new ExtrudeGeometry(shapes,{depth,steps:1,curveSegments:12,bevelEnabled:bevel>0,bevelThickness:Math.min(bevel,depth*.3),bevelSize:bevel,bevelSegments:2}):new ShapeGeometry(shapes,12);
  const material=new MeshStandardMaterial({color:fill.color,map:fill.map,opacity:fill.opacity,transparent:fill.opacity<1,metalness:.25,roughness:.4});fill.dispose();
  const mesh=new Mesh(geometry,material);mesh.scale.set(1,-1,-1);scene.add(mesh);
 }
 return bake(scene,signal);
 }catch(e){release(scene);throw e;}
}
function bake(scene,signal){try{
 if(signal.aborted)throw new DOMException('Cancelled','AbortError');scene.updateMatrixWorld(true);
 const groups=[],box=new Box3(),position=new Vector3(),normal=new Vector3(),normalMatrix=new Matrix3(),matrix=new Matrix4();let triangles=0;
 scene.traverse(obj=>{
  if(!obj.isMesh||!obj.visible)return;obj.skeleton?.update();const g=obj.geometry,attribute=g.getAttribute('position');if(!attribute)return;
  const indices=g.index,materialList=Array.isArray(obj.material)?obj.material:[obj.material],ranges=g.groups.length?g.groups:[{start:0,count:indices?indices.count:attribute.count,materialIndex:0}];
  const copies=obj.isInstancedMesh?obj.count:1;if(copies>100)throw Error('Use fewer model instances.');
  for(let instance=0;instance<copies;instance++){
   matrix.copy(obj.matrixWorld);if(obj.isInstancedMesh){const local=new Matrix4();obj.getMatrixAt(instance,local);matrix.multiply(local);}normalMatrix.getNormalMatrix(matrix);
   for(const range of ranges){
    const m=Array.isArray(obj.material)?materialList[range.materialIndex||0]:obj.material;if(!m||m.visible===false)continue;
    const start=Math.max(range.start,g.drawRange.start),end=Math.min(range.start+range.count,g.drawRange.start+g.drawRange.count,indices?indices.count:attribute.count),count=Math.floor((end-start)/3)*3;
    if(!count)continue;triangles+=count/3;if(triangles>100000||groups.length>=128)throw Error('Use fewer than 100,000 triangles and 128 material groups.');
    const vertices=new Float32Array(count*12),colors=g.getAttribute('color'),uv=g.getAttribute(m.map?.channel===1?'uv1':'uv'),normals=g.getAttribute('normal');
    for(let k=0;k<count;k++){
     const index=indices?indices.getX(start+k):start+k,at=k*12;obj.getVertexPosition(index,position);position.applyMatrix4(matrix);box.expandByPoint(position);vertices.set(position.toArray(),at);
     if(normals){normal.fromBufferAttribute(normals,index).applyMatrix3(normalMatrix).normalize();vertices.set(normal.toArray(),at+3);}
     vertices.set(colors?[colors.getX(index),colors.getY(index),colors.getZ(index),colors.itemSize>3?colors.getW(index):1]:[1,1,1,1],at+6);
     vertices.set(uv?[uv.getX(index),uv.getY(index)]:[0,0],at+10);
    }
    // Missing normals get genuine face normals, preserving the low-poly facets.
    if(!normals)for(let k=0;k<count;k+=3){const a=new Vector3().fromArray(vertices,k*12),b=new Vector3().fromArray(vertices,(k+1)*12),c=new Vector3().fromArray(vertices,(k+2)*12);normal.crossVectors(b.sub(a),c.sub(a)).normalize();for(let j=0;j<3;j++)vertices.set(normal.toArray(),(k+j)*12+3);}
    if(m.map?.matrixAutoUpdate)m.map.updateMatrix();groups.push({vertices,color:m.color?.toArray()||[1,1,1],opacity:m.opacity,roughness:m.roughness??.65,metalness:m.metalness??0,alphaTest:m.alphaTest||0,unlit:!!m.isMeshBasicMaterial,map:m.map?{image:m.map.image,matrix:m.map.matrix.toArray(),flipY:m.map.flipY,wrapS:m.map.wrapS,wrapT:m.map.wrapT}:null});
   }
  }
 });
 if(!groups.length||box.isEmpty())throw Error('No triangle mesh was found in this model.');
 const center=box.getCenter(new Vector3()),extent=box.getSize(new Vector3());let radiusSquared=0;
 for(const group of groups){const v=group.vertices;for(let i=0;i<v.length;i+=12)radiusSquared=Math.max(radiusSquared,(v[i]-center.x)**2+(v[i+1]-center.y)**2+(v[i+2]-center.z)**2);}
 const scale=Math.min(3/Math.max(extent.x,extent.y,extent.z,.0001),1.9/Math.sqrt(Math.max(radiusSquared,.0001)));
 for(const group of groups){const v=group.vertices;for(let i=0;i<v.length;i+=12){v[i]=(v[i]-center.x)*scale;v[i+1]=(v[i+1]-center.y)*scale;v[i+2]=(v[i+2]-center.z)*scale;}}
 return {groups,triangles,release:()=>release(scene)};
 }catch(e){release(scene);throw e;}
}
window.DHModelLoader={load,bake,sanitizeSVG};
