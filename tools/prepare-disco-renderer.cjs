// Build the disco renderer from shared sources, retaining only reachable GLSL functions.
const fs = require('node:fs'), path = require('node:path');
const assets = path.resolve(__dirname, '../assets');
const source = fs.readFileSync(path.join(assets, 'kaleidoscope-hero.js'), 'utf8');
const fragmentMatch = source.match(/var FRAG = ("(?:[^"\\]|\\.)*");/);
if (!fragmentMatch) throw Error('Shared fragment shader missing');
const fragment = JSON.parse(fragmentMatch[1]);
const functions = new Map();
const declaration = /\b(?:void|float|vec[234]|mat[234]|int|bool)\s+(\w+)\s*\([^{};]*\)\s*\{/g;
let match;
while ((match = declaration.exec(fragment))) {
  let depth = 1, end = declaration.lastIndex;
  while (depth && end < fragment.length) {
    if (fragment[end] === '{') depth++;
    if (fragment[end] === '}') depth--;
    end++;
  }
  if (depth) throw Error('Unbalanced function: ' + match[1]);
  functions.set(match[1], fragment.slice(match.index, end));
  declaration.lastIndex = end;
}
functions.set('scene', 'vec3 scene(vec3 ro,vec3 rd,float tm){return dsDisco(ro,rd);}');
functions.set('main', functions.get('main')
  .replace('vec3 rs=uStyle>2.5?rd:normalize(vec3(rd.x,abs(rd.y)+.004,rd.z));', 'vec3 rs=rd;')
  .replace('if(uStyle<2.5){rk.y=abs(rk.y)+.004;rk=normalize(rk);}', ''));
const needed = new Set();
function visit(name) {
  if (needed.has(name)) return;
  needed.add(name);
  const body = functions.get(name);
  if (!body) throw Error('Missing function: ' + name);
  for (const call of body.matchAll(/\b(\w+)\s*\(/g)) {
    if (functions.has(call[1])) visit(call[1]);
  }
}
visit('main');
const uniforms = [...fragment.matchAll(/\buniform\s+[^;]+;/g)].map(m => m[0]).join('\n');
const constants = 'out vec4 outColor; vec3 L; const float lsPI=3.14159265,lsTAU=6.2831853;';
const body = [...functions].filter(([name]) => needed.has(name)).map(([,body]) => body).join('\n');
const compact = (uniforms + '\n' + constants + '\n' + body)
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\r\n]*/g, '').replace(/\s+/g, ' ').trim();
const discoFragment = '#version 300 es\nprecision highp float;\n' + compact;
const output = source.replace(fragmentMatch[0], 'var FRAG = ' + JSON.stringify(discoFragment) + ';')
  .replace(/  \/\/ DH_FLOAT_BEGIN[\s\S]*?  \/\/ DH_FLOAT_END\r?\n/,'')
  .replace(/  \/\/ DH_RIBBON_BEGIN[\s\S]*?  \/\/ DH_RIBBON_END\r?\n/,'')
  .replace(/  \/\/ DH_TERRAIN_BEGIN[\s\S]*?  \/\/ DH_TERRAIN_END\r?\n/,'')
  .replace(/var WORDS = \[[^\n]*\];/, 'var WORDS = [];')
  .replaceAll('window.KaleidoscopeHero', 'window.KaleidoscopeDiscoHero');
fs.writeFileSync(path.join(assets, 'dh-disco.js'), output);
fs.writeFileSync(path.join(__dirname, 'disco-shader-size.json'), JSON.stringify({
  fullShaderBytes: Buffer.byteLength(fragment), discoShaderBytes: Buffer.byteLength(discoFragment),
  fullFunctions: functions.size, discoFunctions: needed.size
}, null, 2) + '\n');
