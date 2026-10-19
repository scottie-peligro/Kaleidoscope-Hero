const fs=require('node:fs'),path=require('node:path');
const assets=path.resolve(__dirname,'../assets'),file=path.join(assets,'kaleidoscope-hero.js');let source=fs.readFileSync(file,'utf8');
const match=source.match(/var FRAG = ("(?:[^"\\]|\\.)*");/);if(!match)throw Error('Missing shared shader');
let shader=JSON.parse(match[1]).replace(/\/\/ DH_STRUCTURES_BEGIN[\s\S]*?\/\/ DH_STRUCTURES_END\n/,'');
shader=shader.replace(/(?:\/\/ Pixel-aware point filtering[^\n]*\n)?vec3 particles\([\s\S]*?(?=vec3 fibers\()/,fs.readFileSync(path.join(assets,'dh-particle-waves.glsl'),'utf8'));
shader=shader.replace(/uniform vec4 uRip\[8\];\nvec2 ripple[^\n]*\n/,'').replace('uniform float uNoWater;','').replace(/float waterMap[^\n]*\n/,'');
shader=shader.replace(/(vec3 scene\(vec3 ro,vec3 rd,float tm\)\{return )[^\n]*?(?=uStyle>7\.5\?wordRain)/,'$1');
shader=shader.replace('vec3 scene(vec3 ro,vec3 rd,float tm){','// DH_STRUCTURES_BEGIN\n'+fs.readFileSync(path.join(assets,'dh-digital-structures.glsl'),'utf8')+'\n'+fs.readFileSync(path.join(assets,'dh-light-shows.glsl'),'utf8')+'\n// DH_STRUCTURES_END\nvec3 scene(vec3 ro,vec3 rd,float tm){');
shader=shader.replace('vec3 scene(vec3 ro,vec3 rd,float tm){return ','vec3 scene(vec3 ro,vec3 rd,float tm){return uStyle>13.5?vec3(0.):uStyle>12.5?dsDisco(ro,rd):uStyle>11.5?dsLEDGlobe(ro,rd):uStyle>10.5?dsCity(ro,rd,true):uStyle>9.5?dsCity(ro,rd,false):uStyle>8.5?dsFabric(ro,rd):');
source=source.replace(match[0],'var FRAG = '+JSON.stringify(shader)+';');
// Keep both kaleidoscope passes in one dynamic loop. Duplicating the full scene
// call makes some WebGL drivers expand every structure twice during compilation.
shader=shader.replace('  col=scene(ro,rs,75.);\n  if(kal>.5){','  col=vec3(0.);\n  for(int pass=0;pass<int(1.+kal);pass++){\n    vec3 ray=rs;\n    if(pass==1){').replace('    col+=scene(ro,rk,75.);\n  }','    ray=rk;\n    }\n    col+=scene(ro,ray,75.);\n  }');
source=source.replace(/var FRAG = ("(?:[^"\\]|\\.)*");/,'var FRAG = '+JSON.stringify(shader)+';');
source=source.replace(/var POST = ("(?:[^"\\]|\\.)*");/,'var POST = '+JSON.stringify(fs.readFileSync(path.join(assets,'dh-post.glsl'),'utf8'))+';');
source=source.replace(/  \/\/ DH_FLOAT_BEGIN[\s\S]*?  \/\/ DH_FLOAT_END\r?\n/,'');
const floating='  // DH_FLOAT_BEGIN\n  var FLOAT_VERT = '+JSON.stringify(fs.readFileSync(path.join(assets,'dh-floating.vert'),'utf8'))+';\n  var FLOAT_FRAG = '+JSON.stringify(fs.readFileSync(path.join(assets,'dh-floating.frag'),'utf8'))+';\n'+fs.readFileSync(path.join(assets,'dh-floating-runtime.js'),'utf8')+'\n  // DH_FLOAT_END\n';
source=source.replace('  var VERT = ',floating+'  var VERT = ');
const styles=['Digital grid','Fiber optics','Particle waves','Wireframe tunnel','Data rings','Voronoi crystal','Constellation','Fractal flythrough','Word rain','Digital fabric','Blueprint city','Dot matrix structures','LED globe','Digital disco ball','Floating shape','Morphing sculptures'];
source=source.replace(/var STYLES = (.*);/,'var STYLES = '+JSON.stringify(styles)+';').replace(", 'uRip'",'').replace(", 'uNoWater'",'').replace(/    gl\.uniform4fv\(U\.uRip, new Float32Array\(32\)\);\r?\n/,'').replace('gl.uniform1f(U.uNoWater, 0); ','');fs.writeFileSync(file,source);
require('./prepare-disco-renderer.cjs');
require('./prepare-floating-renderer.cjs');
