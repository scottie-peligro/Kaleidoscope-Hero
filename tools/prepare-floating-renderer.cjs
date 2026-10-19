// Dedicated floating bundle uses the same lifecycle and compositor, without ray-marched effects.
const fs=require('node:fs'),path=require('node:path');
const assets=path.resolve(__dirname,'../assets');
const source=fs.readFileSync(path.join(assets,'kaleidoscope-hero.js'),'utf8');
const empty='#version 300 es\nprecision highp float;out vec4 outColor;void main(){outColor=vec4(0.,0.,0.,1.);}';
const output=source.replace(/var FRAG = ("(?:[^"\\]|\\.)*");/,'var FRAG = '+JSON.stringify(empty)+';')
 .replace(/var WORDS = \[[^\n]*\];/,'var WORDS = [];')
 .replaceAll('window.KaleidoscopeHero','window.FloatingShapeHero');
fs.writeFileSync(path.join(assets,'dh-floating.js'),output);
