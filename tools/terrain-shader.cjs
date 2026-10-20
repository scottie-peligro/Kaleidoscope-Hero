// Reduce a shared shader to only the functions reachable by the terrain pass.
module.exports=function(fragment){
 const functions=new Map(),declaration=/\b(?:void|float|vec[234]|mat[234]|int|bool)\s+(\w+)\s*\([^{};]*\)\s*\{/g;let match;
 while((match=declaration.exec(fragment))){let depth=1,end=declaration.lastIndex;while(depth&&end<fragment.length){if(fragment[end]==='{')depth++;if(fragment[end]==='}')depth--;end++;}if(depth)throw Error('Unbalanced function '+match[1]);functions.set(match[1],fragment.slice(match.index,end));declaration.lastIndex=end;}
 functions.set('scene','vec3 scene(vec3 ro,vec3 rd,float tm){return dsTerrain(ro,rd)*uBright;}');
 const needed=new Set();function visit(name){if(needed.has(name))return;needed.add(name);for(const call of functions.get(name).matchAll(/\b(\w+)\s*\(/g))if(functions.has(call[1]))visit(call[1]);}visit('main');
 const uniforms=[...fragment.matchAll(/\buniform\s+[^;]+;/g)].map(m=>m[0]).join('\n');
 return '#version 300 es\nprecision highp float;\n'+uniforms+'\nout vec4 outColor;vec3 L;\n'+[...functions].filter(([name])=>needed.has(name)).map(([,body])=>body).join('\n');
};
