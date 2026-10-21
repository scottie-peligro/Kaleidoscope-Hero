const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const full=read('assets/kaleidoscope-hero.js');
const checks={
  version:read('kaleidoscope-hero.php').includes("define( 'DH_VERSION', '1.23.0' )"),
  style:read('kaleidoscope-hero.php').includes("'Video wall'"),
  runtime:fs.statSync(path.join(root,'assets/dh-video-runtime.min.js')).size<8192,
  lazy_load:read('assets/dh-scenes.js').includes("'Custom 3D Object','Video wall'"),
  random_exclusion:full.includes("style!=='Video wall'"),
  appearance_controls:full.includes("d.style === 'Video wall' || d.kaleidoscopeMode"),
  no_bundled_stock:!fs.existsSync(path.join(root,'assets/video-wall-city-compressed.webm')),
};
console.log(JSON.stringify(checks,null,2));if(Object.values(checks).some(v=>!v))process.exitCode=1;
