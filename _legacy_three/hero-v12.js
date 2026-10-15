/** JUGEND portfolio 3D — static GitHub Pages release.
 * Local metre-authored GLBs guarantee a working baseline; CC0 Poly Haven PBR/furniture upgrades it in-place.
 * No photographic background planes, no paid APIs, no authentication keys.
 */
const $ = id => document.getElementById(id);
const lab=$('lab'),canvas=$('labCanvas'),portal=$('portal'),stationNo=$('stationNo'),stationName=$('stationName');
const loader=$('loader'),loaderText=$('loaderText'),loaderBar=$('loaderBar'),assetError=$('assetError');
const nav=[...document.querySelectorAll('[data-stage-jump]')],prefersReduced=matchMedia('(prefers-reduced-motion: reduce)');
const routes=[
 {name:'EXTERIOR',href:null},
 {name:'ABOUT',href:'about.html'},
 {name:'PRESENTATION',href:'presentation.html?v=5'},
 {name:'LP',href:'lp.html?v=5'},
 {name:'WEB',href:'https://www.originalsoccerball.com/',external:true},
 {name:'DIRECTION',href:'https://new.express.adobe.com/webpage/XRy2MzIpmkxug',external:true},
 {name:'OTHER',href:'other.html'}
];
const ASSET_ROOT='./assets/architecture/';
const ASSETS=['city.glb','dome.glb','rooms.glb','interactions.glb'];
// Same-origin PBR maps keep the visual layer deterministic on GitHub Pages and localhost.
const LOCAL_PBR='./assets/pbr/';
const POLYHAVEN_MIRROR='https://cdn.jsdelivr.net/gh/Gunratna/Gunratna.github.io@main/web/public/lab/';
const PBR_SETS={
 // Poly Haven scan-derived CC0 maps are preferred for the hero; local maps are deterministic fallbacks.
 walnut:{base:'walnut_base.jpg',normal:'walnut_normal.jpg',roughness:'walnut_roughness.jpg',
   remote:['textures/wood_table_001/wood_table_001_diff_1k.jpg','textures/wood_table_001/wood_table_001_nor_gl_1k.jpg','textures/wood_table_001/wood_table_001_arm_1k.jpg']},
 leather:{base:'leather_base.jpg',normal:'leather_normal.jpg',roughness:'leather_roughness.jpg',
   remote:['textures/fabric_leather_02/fabric_leather_02_diff_1k.jpg','textures/fabric_leather_02/fabric_leather_02_nor_gl_1k.jpg','textures/fabric_leather_02/fabric_leather_02_arm_1k.jpg']},
 plaster:{base:'plaster_base.jpg',normal:'plaster_normal.jpg',roughness:'plaster_roughness.jpg',
   remote:['textures/painted_plaster_wall/painted_plaster_wall_diff_1k.jpg','textures/painted_plaster_wall/painted_plaster_wall_nor_gl_1k.jpg','textures/painted_plaster_wall/painted_plaster_wall_arm_1k.jpg']},
 facade:{base:'facade_base.jpg',normal:'facade_normal.jpg',roughness:'facade_roughness.jpg'},
 asphalt:{base:'asphalt_base.jpg',normal:'asphalt_normal.jpg',roughness:'asphalt_roughness.jpg'},
 metal:{base:'aluminum_base.jpg',normal:'aluminum_normal.jpg',roughness:'aluminum_roughness.jpg',
   remote:['textures/metal_plate/metal_plate_diff_1k.jpg','textures/metal_plate/metal_plate_nor_gl_1k.jpg','textures/metal_plate/metal_plate_arm_1k.jpg']},
 charcoal:{base:'charcoal_base.jpg',normal:'charcoal_normal.jpg',roughness:'charcoal_roughness.jpg'},
 stone:{base:'stone_base.jpg',normal:'stone_normal.jpg',roughness:'stone_roughness.jpg'}
};
const CC0_MODELS={
 chair:POLYHAVEN_MIRROR+'models/mid_century_lounge_chair/mid_century_lounge_chair.gltf',
 desk:POLYHAVEN_MIRROR+'models/metal_office_desk/metal_office_desk.gltf',
 shelf:POLYHAVEN_MIRROR+'models/wooden_bookshelf_worn/wooden_bookshelf_worn.gltf'
};
const CC0_HDR=POLYHAVEN_MIRROR+'hdri/brown_photostudio_02_1k.hdr';
const PREVIEW_FILES=['about','presentation','lp','web','direction','other'];
const ACCESS=['GUESTBOOK','GALLERY DISPLAY','DESK LAPTOP','LAPTOP','STUDIO SCREEN','WORKBOOK'];
const METER=1, FLOOR_HEIGHT=4.65;
let model=null, scrollProgress=0, currentStage=0, lastHeight=innerHeight, viewportFixing=false,scrollScheduled=false,initAttempt=0;
const clamp=(v,lo=0,hi=1)=>Math.min(hi,Math.max(lo,v));
const smoother=v=>{const x=clamp(v);return x*x*x*(x*(x*6-15)+10);};
// Slow editorial pacing: 30% hold, 40% physical travel, 30% hold.
// The long DOM track below makes both the elevator ride and the thumbnail dwell deliberate.
const journey=v=>{const r=clamp(v)*6;if(r>=6)return 1;const s=Math.floor(r),q=r-s;return (s+smoother((q-.30)/.40))/6};

function setStage(stage){
 if(stage===currentStage&&lab.dataset.stage===String(stage))return;
 currentStage=stage; lab.dataset.stage=String(stage);const s=routes[stage];
 stationNo.textContent=String(stage).padStart(2,'0');stationName.textContent=s.name;
 nav.forEach(btn=>btn.classList.toggle('is-active',Number(btn.dataset.stageJump)===stage));
 $('portalFloor').textContent=`${String(stage).padStart(2,'0')}F`;
 $('portalMode').textContent=stage>0?ACCESS[stage-1]:'';
 $('portalTitle').textContent=s.name;
 const link=$('portalLink'); if(s.href){link.href=s.href}else{link.removeAttribute('href')}
 if(s.external){link.target='_blank';link.rel='noopener noreferrer'} else{link.removeAttribute('target');link.removeAttribute('rel')}
}
function getScrollRange(){return Math.max(1,lab.offsetHeight-innerHeight)}
function syncScroll(){
 scrollScheduled=false;
 scrollProgress=clamp((scrollY-lab.offsetTop)/getScrollRange());
 const raw=journey(scrollProgress)*6;
 const nearest=clamp(Math.round(raw),0,6);
 if(currentStage!==nearest)setStage(nearest);
 const onPortal=nearest>0&&Math.abs(raw-nearest)<0.14;
 portal.classList.toggle('is-visible',onPortal);
 portal.setAttribute('aria-hidden',String(!onPortal));$('portalLink').tabIndex=onPortal?0:-1;
 model?.setProgress(journey(scrollProgress));
 window.__LAB_QA__.progress=journey(scrollProgress);window.__LAB_QA__.scrollFraction=scrollProgress;window.__LAB_QA__.stage=nearest;
}
function scheduleScroll(){if(!scrollScheduled){scrollScheduled=true;requestAnimationFrame(syncScroll)}}
addEventListener('scroll',scheduleScroll,{passive:true});
nav.forEach(btn=>btn.addEventListener('click',()=>{
 const n=Number(btn.dataset.stageJump);if(!Number.isInteger(n)||n<1||n>6)return;
 scrollTo({top:lab.offsetTop+getScrollRange()*(n/6),behavior:prefersReduced.matches?'instant':'smooth'});
}));
// Keep the same fraction and floor after browser UI changes / rotation.
addEventListener('resize',()=>{
 if(viewportFixing)return;
 const h=innerHeight;if(Math.abs(h-lastHeight)<2)return;lastHeight=h;
 const preserve=scrollProgress;viewportFixing=true;
 requestAnimationFrame(()=>{window.scrollTo({top:lab.offsetTop+getScrollRange()*preserve,behavior:'instant'});viewportFixing=false;scheduleScroll();model?.resize();});
},{passive:true});

const contactLayer=$('contactLayer');
function openContact(){contactLayer.hidden=false;$('[data-contact-close]')?.focus();}
function closeContact(){contactLayer.hidden=true;document.querySelector('[data-contact]')?.focus()}
document.querySelector('[data-contact]')?.addEventListener('click',openContact);
document.querySelector('[data-contact-close]')?.addEventListener('click',closeContact);
addEventListener('keydown',e=>{if(e.key==='Escape'&&!contactLayer.hidden)closeContact()});
$('retryAssets')?.addEventListener('click',()=>{model?.dispose();model=null;void boot();});
window.__LAB_QA__={progress:0,stage:0,assetsLoaded:[],previewsLoaded:[],enhancersLoaded:[],enhancersFailed:[],warnings:[],renderedFrames:0,camera:null,ready:false,error:null,metersPerUnit:METER,floorMeters:FLOOR_HEIGHT,elevatorY:null,activeSurface:null,entranceDoors:null};
setStage(0);syncScroll();

async function loadEngine(){
 let err;
 const providers=[
  async()=>[await import('three'),(await import('three/addons/loaders/GLTFLoader.js')).GLTFLoader,(await import('three/addons/loaders/RGBELoader.js')).RGBELoader],
  async()=>[await import('https://esm.sh/three@0.186.1'),(await import('https://esm.sh/three@0.186.1/examples/jsm/loaders/GLTFLoader.js')).GLTFLoader,(await import('https://esm.sh/three@0.186.1/examples/jsm/loaders/RGBELoader.js')).RGBELoader]
 ];
 for(const provider of providers){try{return await provider()}catch(e){err=e;console.warn('Three.js provider unavailable:',e)}}
 throw new Error('Three.js module could not be loaded from either free provider.',{cause:err});
}
async function boot(){
 const attempt=++initAttempt;
 assetError.hidden=true;loader.classList.remove('is-done');loaderText.textContent='LOADING 3D';
 loaderBar.style.transform='scaleX(.02)';window.__LAB_QA__.error=null;window.__LAB_QA__.ready=false;window.__LAB_QA__.assetsLoaded=[];window.__LAB_QA__.previewsLoaded=[];
 try{
  const [THREE,GLTFLoader,RGBELoader]=await loadEngine();
  if(attempt!==initAttempt)return;
  model=await createWorld(THREE,GLTFLoader,RGBELoader);
  if(attempt!==initAttempt){model.dispose();return}
  model.setProgress(journey(scrollProgress));loaderBar.style.transform='scaleX(1)';loaderText.textContent='READY';
  window.__LAB_QA__.ready=window.__LAB_QA__.assetsLoaded.length===ASSETS.length && window.__LAB_QA__.previewsLoaded.length===PREVIEW_FILES.length;
  if(!window.__LAB_QA__.ready){$('errorText').textContent='LOCAL 3D ASSET ERROR';assetError.hidden=false;}
  setTimeout(()=>loader.classList.add('is-done'),400);
 }catch(e){
  console.error('Portfolio 3D scene did not initialize:',e);
  window.__LAB_QA__.error=String(e?.message||e);
  loader.classList.add('is-done');$('errorText').textContent='3D LOAD ERROR';assetError.hidden=false;
 }
}

async function createWorld(T,GLTFLoader,RGBELoader){
 const renderer=new T.WebGLRenderer({canvas,antialias:devicePixelRatio<1.8,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:false});
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
 renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<760?1.3:1.65));renderer.shadowMap.enabled=innerWidth>=850;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const palette={ivory:0xf1efe8,softWhite:0xf7f5ef,charcoal:0x272624,walnut:0x4b3021,darkBrown:0x30221c,aluminium:0x9d9c96,stone:0xaaa8a1,smoke:0x6b6a66};
 const scene=new T.Scene();scene.background=new T.Color(0xb9b9b5);
 scene.fog=new T.FogExp2(0xb5b5b0,.00046);
 // Procedural atmosphere: sky is a shader on a sphere, never a photograph plane.
 const sky=new T.Mesh(new T.SphereGeometry(1850,64,32),new T.ShaderMaterial({
  side:T.BackSide,depthWrite:false,fog:false,
  vertexShader:`varying vec3 d;void main(){d=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`varying vec3 d;void main(){float h=clamp(d.y*.5+.5,0.,1.);vec3 horizon=vec3(.91,.90,.86);vec3 zenith=vec3(.58,.59,.58);vec3 c=mix(horizon,zenith,smoothstep(.22,.92,h));float sun=max(0.,dot(normalize(d),normalize(vec3(-.43,.29,-.56))));c+=vec3(1.,.93,.82)*pow(sun,30.)*.18;gl_FragColor=vec4(c,1.);}`
 }));sky.frustumCulled=false;scene.add(sky);
 // Sky illumination and soft architectural practicals.
 scene.add(new T.HemisphereLight(0xffefd2,0x4a4035,1.10));
 const sun=new T.DirectionalLight(0xffd6a0,4.35);sun.position.set(-130,210,-180);sun.castShadow=renderer.shadowMap.enabled;
 sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-90;sun.shadow.camera.right=90;sun.shadow.camera.top=90;sun.shadow.camera.bottom=-90;sun.shadow.camera.near=2;sun.shadow.camera.far=500;sun.shadow.bias=-.00009;scene.add(sun);
 // A small local scene generates reflection information for PBR metal and glass.
 const envRoom=new T.Scene();envRoom.background=new T.Color(palette.ivory);
 [[-7,1,0,6,6,0xffe7c0],[7,2,0,6,6,0xd7c7aa],[0,8,0,14,14,0xffd29a],[0,2,-7,12,7,0x7a6d59]].forEach(([x,y,z,w,h,color])=>{
  const plane=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color,side:T.DoubleSide}));plane.position.set(x,y,z);plane.lookAt(0,0,0);envRoom.add(plane);
 });
 const pmrem=new T.PMREMGenerator(renderer);const env=pmrem.fromScene(envRoom,.10);scene.environment=env.texture;
 const camera=new T.PerspectiveCamera(43,1,.075,2100);
 const gltfLoader=new GLTFLoader();
 // All actual 3D files are on the SAME ORIGIN. No third-party model CDN.
 const objects=[];
 for(let i=0;i<ASSETS.length;i++){
  const name=ASSETS[i];loaderText.textContent=`LOADING 3D   ${i+1}/${ASSETS.length}`;
  try{
   const gltf=await gltfLoader.loadAsync(new URL(ASSET_ROOT+name,document.baseURI).href);
   const object=gltf.scene;object.name=name;scene.add(object);objects.push(object);
   window.__LAB_QA__.assetsLoaded.push(name);
   loaderBar.style.transform=`scaleX(${.10+(i+1)*.14})`;
  }catch(e){
   console.error('Local GLB not loaded:',name,e);
   window.__LAB_QA__.warnings.push('Missing local GLB: '+name);
   // Keep render loop alive; do not block all content due to one asset failure.
  }
 }
 if(!objects.length)throw new Error('No local architectural model loaded. Verify assets/architecture/*.glb.');
 // 1960s modern material direction: walnut, dark leather, off-white enamel, charcoal and brushed aluminium.
 // Existing authored texture maps are preserved; colors below tint those maps rather than flattening them.
 const facade=[];const outerShell=[];const localMeshes=[];
 const colorForName=(n)=>{
  if(['wood','timber','darkwood'].includes(n))return palette.walnut;
  if(n==='leather')return palette.darkBrown;
  if(['steel','frame','blackmetal'].includes(n))return palette.charcoal;
  if(n==='aluminium'||n==='brass'||n==='gold')return palette.aluminium;
  if(n==='paper'||n==='white'||n==='wall'||n==='warmconcrete')return palette.softWhite;
  if(n==='concrete'||n==='stone'||n==='curb'||n==='plaza')return palette.stone;
  if(n==='brick'||n==='brick2'||n==='darkconcrete')return 0x4d4b46;
  if(n==='asphalt')return 0x343331;
  if(n==='soil')return 0x4a4038;
  if(n==='leaf')return 0x655f55;
  if(n==='leaf2')return 0x756d61;
  return null;
 };
 objects.forEach(o=>o.traverse(node=>{
  if(!node.isMesh)return;localMeshes.push(node);
  node.frustumCulled=true;
  const mat=node.material;const n=(mat?.name||node.name||'').toLowerCase();
  if(mat){
   if('envMapIntensity' in mat)mat.envMapIntensity=1.36;
   const c=colorForName(n);if(c!==null&&mat.color)mat.color.setHex(c);
   if('roughness' in mat&&Number.isFinite(mat.roughness))mat.roughness=Math.min(.9,Math.max(.16,mat.roughness));
   mat.needsUpdate=true;
  }
  if(n==='glass3'&&o.name==='dome.glb'){
   const gl=new T.MeshPhysicalMaterial({color:0xc5c8c5,metalness:.04,roughness:.055,transmission:.08,ior:1.46,thickness:.08,clearcoat:.88,clearcoatRoughness:.055,
    transparent:true,opacity:.88,depthWrite:true,side:T.DoubleSide,envMapIntensity:2.35});node.material=gl;outerShell.push(gl);
  }else if(n==='glass2'&&o.name==='dome.glb'){
   const gl=new T.MeshPhysicalMaterial({color:0xd4d6d2,metalness:.02,roughness:.07,transmission:.09,ior:1.45,thickness:.05,clearcoat:.70,clearcoatRoughness:.07,
    transparent:true,opacity:.68,depthWrite:true,side:T.DoubleSide,envMapIntensity:2.0});node.material=gl;facade.push(gl);
  }else if((n==='windows'||n==='glass'||n==='glass2')&&o.name==='city.glb'){
    const gl=new T.MeshPhysicalMaterial({color:n==='windows'?0x2d2d2b:0x8f9492,metalness:n==='windows'?.32:.06,roughness:n==='windows'?.14:.08,
      transmission:n==='windows'?.02:.16,ior:1.46,thickness:.025,clearcoat:.55,clearcoatRoughness:.08,
      transparent:n!=='windows',opacity:n==='windows'?1:.62,depthWrite:true,side:T.DoubleSide,envMapIntensity:1.75});node.material=gl;
  }else if(n==='water'&&o.name==='city.glb'){
    node.material=new T.MeshPhysicalMaterial({color:0x666a68,metalness:.06,roughness:.10,clearcoat:1,clearcoatRoughness:.05,
      transmission:.03,transparent:true,opacity:.90,side:T.DoubleSide,envMapIntensity:2.0});
  }else if(n==='winwarm'){
    mat.color?.setHex(0x3c3027);mat.emissive=new T.Color(0xe8a64c);mat.emissiveIntensity=.82;
  }else if(n==='wincold'){
    mat.color?.setHex(0x323230);mat.emissive=new T.Color(0xd7d4cb);mat.emissiveIntensity=.12;
  }else if(n==='windows'){
    mat.color?.setHex(0x2c3430);if('metalness' in mat)mat.metalness=.25;if('roughness' in mat)mat.roughness=.18;
  }else if(n==='light'){
    mat.color?.setHex(0xf2e7d2);mat.emissive=new T.Color(0xffddb3);mat.emissiveIntensity=1.35;
  }else if(n==='screen'){
    mat.color?.setHex(0x1d201d);mat.emissive=new T.Color(0x252d26);mat.emissiveIntensity=.20;
  }
  node.castShadow=renderer.shadowMap.enabled&&o.name!=='city.glb'&&!n.startsWith('glass')&&!n.startsWith('win');
  node.receiveShadow=o.name!=='city.glb';
 }));
 // --- Free photoreal enhancement layer -----------------------------------------------
 // Baseline architecture above is same-origin and immediately usable. These CC0 assets and
 // PBR maps are optional refinements, loaded in the background from a single GitHub/jsDelivr source.
 const enhancementRoot=new T.Group();enhancementRoot.name='cc0-enhancements';scene.add(enhancementRoot);
 const enhancementObjects=[];let hdEnvironment=null;
 const localCity=objects.find(o=>o.name==='city.glb');
 const localDome=objects.find(o=>o.name==='dome.glb');
 const localRooms=objects.find(o=>o.name==='rooms.glb');
 const localInteractions=objects.find(o=>o.name==='interactions.glb');
 function ensureBoxUV(geometry,scale=2.25){
  if(geometry.attributes.uv)return geometry;
  let g=geometry.index?geometry.toNonIndexed():geometry;
  const pos=g.attributes.position,nor=g.attributes.normal;const uv=new Float32Array(pos.count*2);
  for(let i=0;i<pos.count;i++){
   const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);const nx=Math.abs(nor?.getX(i)||0),ny=Math.abs(nor?.getY(i)||0),nz=Math.abs(nor?.getZ(i)||0);
   let u,v;if(nx>=ny&&nx>=nz){u=z/scale;v=y/scale}else if(ny>=nx&&ny>=nz){u=x/scale;v=z/scale}else{u=x/scale;v=y/scale}
   uv[i*2]=u;uv[i*2+1]=v;
  }
  g.setAttribute('uv',new T.BufferAttribute(uv,2));return g;
 }
 async function withTimeout(promise,label,ms=12000){
  let timer;try{return await Promise.race([promise,new Promise((_,rej)=>timer=setTimeout(()=>rej(new Error(label+' timed out')),ms))])}finally{clearTimeout(timer)}
 }
 async function loadPBRSet(key){
  const spec=PBR_SETS[key],loader=new T.TextureLoader();
  const local=[
   new URL(LOCAL_PBR+spec.base,document.baseURI).href,
   new URL(LOCAL_PBR+spec.normal,document.baseURI).href,
   new URL(LOCAL_PBR+spec.roughness,document.baseURI).href
  ];
  const remote=spec.remote?.map(p=>POLYHAVEN_MIRROR+p);
  const loadTriplet=async urls=>Promise.all(urls.map(url=>withTimeout(loader.loadAsync(url),'PBR '+key,12000)));
  let textures,source='LOCAL';
  if(remote){
   try{textures=await loadTriplet(remote);source='POLY HAVEN CC0'}
   catch(e){console.warn('CC0 PBR mirror unavailable, using local fallback:',key,e);textures=await loadTriplet(local)}
  }else textures=await loadTriplet(local);
  const [diff,nor,rough]=textures;diff.colorSpace=T.SRGBColorSpace;
  for(const tex of textures){tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=Math.min(12,renderer.capabilities.getMaxAnisotropy())}
  window.__LAB_QA__.enhancersLoaded.push(source+' '+key.toUpperCase());
  return {diff,nor,rough};
 }
 function applyPBR(root,names,set,{tint=0xffffff,uvScale=2.25,normal=.58,metalness=0,roughness=.55}={}){
  const wanted=new Set(names);
  root?.traverse(node=>{
   if(!node.isMesh)return;const mats=Array.isArray(node.material)?node.material:[node.material];
   mats.forEach(mat=>{
    if(!mat)return;const n=(mat.name||'').toLowerCase();if(!wanted.has(n))return;
    node.geometry=ensureBoxUV(node.geometry,uvScale);
    mat.map=set.diff;mat.normalMap=set.nor;mat.roughnessMap=set.rough;mat.metalnessMap=null;mat.normalScale?.set(normal,normal);mat.color?.setHex(tint);
    if('roughness' in mat)mat.roughness=roughness;if('metalness' in mat)mat.metalness=metalness;
    if('envMapIntensity' in mat)mat.envMapIntensity=metalness>.4?1.7:1.15;
    mat.needsUpdate=true;
   });
  });
 }
 function tuneEnhancer(root){root.traverse(node=>{if(!node.isMesh)return;node.castShadow=renderer.shadowMap.enabled;node.receiveShadow=true;const mats=Array.isArray(node.material)?node.material:[node.material];mats.forEach(m=>{if(m&&'envMapIntensity' in m)m.envMapIntensity=1.55})})}
 function metricPlace(root,{x=0,y=.65,z=-13,ry=0,scale=1}={}){root.rotation.y=ry;root.scale.setScalar(scale);root.updateMatrixWorld(true);const b=new T.Box3().setFromObject(root),c=new T.Vector3();b.getCenter(c);root.position.x+=x-c.x;root.position.z+=z-c.z;root.updateMatrixWorld(true);const b2=new T.Box3().setFromObject(root);root.position.y+=y-b2.min.y;root.updateMatrixWorld(true);return root}
 async function loadEnhancerModel(url,label){
  try{const gltf=await withTimeout(gltfLoader.loadAsync(url),label,18000);window.__LAB_QA__.enhancersLoaded.push(label);return gltf.scene}
  catch(e){window.__LAB_QA__.enhancersFailed.push(label);window.__LAB_QA__.warnings.push('Optional CC0 enhancer unavailable: '+label);console.warn(label,e);return null}
 }
 async function enhanceScene(){
  try{
   const [walnut,leather,plaster,facade,asphalt,metal,charcoal,stone]=await Promise.all(['walnut','leather','plaster','facade','asphalt','metal','charcoal','stone'].map(loadPBRSet));
   applyPBR(localCity,['concrete','warmconcrete','white'],facade,{uvScale:3.0,normal:.40,roughness:.76,metalness:0});
   applyPBR(localCity,['curb','plaza','stone'],stone,{uvScale:2.7,normal:.28,roughness:.70,metalness:0});
   applyPBR(localCity,['frame','aluminium','darkconcrete'],metal,{uvScale:1.8,normal:.24,roughness:.31,metalness:.78});
   applyPBR(localCity,['asphalt'],asphalt,{uvScale:2.4,normal:.50,roughness:.86,metalness:0});
   applyPBR(localDome,['frame','steel','aluminium','gold'],metal,{uvScale:1.15,normal:.22,roughness:.27,metalness:.84});
   applyPBR(localDome,['concrete','stone'],plaster,{uvScale:2.8,normal:.30,roughness:.81,metalness:0});
   applyPBR(localRooms,['wood','timber'],walnut,{uvScale:1.25,normal:.68,roughness:.46,metalness:0});
   applyPBR(localRooms,['plaza','stone'],stone,{uvScale:2.0,normal:.32,roughness:.64,metalness:0});
   applyPBR(localRooms,['wall','white','warmconcrete'],plaster,{uvScale:2.7,normal:.30,roughness:.83,metalness:0});
   applyPBR(localRooms,['steel','aluminium','frame'],metal,{uvScale:1.15,normal:.23,roughness:.31,metalness:.78});
   applyPBR(localInteractions,['darkwood'],walnut,{uvScale:.70,normal:.68,roughness:.43,metalness:0});
   applyPBR(localInteractions,['leather'],leather,{uvScale:.55,normal:.84,roughness:.61,metalness:0});
   applyPBR(localInteractions,['aluminium','brass'],metal,{uvScale:.62,normal:.22,roughness:.28,metalness:.82});
   applyPBR(localInteractions,['blackmetal','keycap','rubber'],charcoal,{uvScale:.70,normal:.18,roughness:.42,metalness:.34});
   window.__LAB_QA__.enhancersLoaded.push('LOCAL PBR MATERIALS');
  }catch(e){window.__LAB_QA__.enhancersFailed.push('LOCAL PBR MATERIALS');window.__LAB_QA__.warnings.push('Local PBR map failed: '+String(e?.message||e));console.warn('Local PBR maps unavailable',e)}
 }
 void enhanceScene();
 // CC0 Poly Haven HDRI lights/reflections only; the visible background remains the procedural sky.
 void (async()=>{
  try{
   const hdr=await withTimeout(new RGBELoader().loadAsync(CC0_HDR),'CC0 HDRI',18000);
   const hd=pmrem.fromEquirectangular(hdr);hdr.dispose();scene.environment=hd.texture;hdEnvironment=hd;
   window.__LAB_QA__.enhancersLoaded.push('POLY HAVEN CC0 HDRI');
  }catch(e){window.__LAB_QA__.enhancersFailed.push('POLY HAVEN CC0 HDRI');console.warn('CC0 HDRI unavailable; local reflection rig remains active',e)}
 })();
 // Real CC0 Poly Haven furniture is optional and never blocks the local scene.
 // It is kept outside the portal sight-lines; the work surface always owns the camera centre.
 async function addCC0Furniture(){
  if(innerWidth<720)return;
  const [chair,desk,shelf]=await Promise.all([
   loadEnhancerModel(CC0_MODELS.chair,'POLY HAVEN MID-CENTURY CHAIR'),
   loadEnhancerModel(CC0_MODELS.desk,'POLY HAVEN METAL DESK'),
   loadEnhancerModel(CC0_MODELS.shelf,'POLY HAVEN WOODEN SHELF')
  ]);
  if(chair){
   tuneEnhancer(chair);
   const placements=[
    [-2.25,.65,31.0,.35],[2.25,.65,31.0,-.35],
    [-9,5.30,-13.1,.75],[9,9.95,-13.0,-.75],
    [8.8,14.60,-14.6,-.65],[-8.7,19.25,-13.4,.65],[8.7,23.90,-13.5,-.65]
   ];
   for(const [x,y,z,ry] of placements){const c=chair.clone(true);metricPlace(c,{x,y,z,ry,scale:.92});enhancementRoot.add(c);enhancementObjects.push(c)}
  }
  if(desk){
   tuneEnhancer(desk);
   for(const cfg of [[-9.2,5.30,-17.0,.12],[8.7,14.60,-17.0,-.08],[8.6,23.90,-16.6,-.08]]){
    const d=desk.clone(true);metricPlace(d,{x:cfg[0],y:cfg[1],z:cfg[2],ry:cfg[3],scale:.92});enhancementRoot.add(d);enhancementObjects.push(d)
   }
  }
  if(shelf){
   tuneEnhancer(shelf);
   for(const cfg of [[-12.6,5.30,-18.55,0],[12.5,9.95,-18.55,0],[-12.4,23.90,-18.55,0]]){
    const b=shelf.clone(true);metricPlace(b,{x:cfg[0],y:cfg[1],z:cfg[2],ry:cfg[3],scale:.92});enhancementRoot.add(b);enhancementObjects.push(b)
   }
  }
 }
 void addCC0Furniture();
 // Subtle warm interior pools illuminate the 6 full-scale floors.
 const practicals=[];
 for(let i=0;i<6;i++){
  const y=.65+i*4.65;
  for(const x of [-11,11]){
    const light=new T.PointLight(0xffd3a4,innerWidth>760?48:30,26,1.65);light.position.set(x,y+3.15,-13.5);scene.add(light);practicals.push(light);
  }
 }
 // A real entrance/vestibule breaks the dome shell and gives the macro→micro move a readable threshold.
 const entrance=new T.Group();entrance.name='dome-entrance';scene.add(entrance);
 const eWalnut=new T.MeshPhysicalMaterial({color:palette.walnut,roughness:.42,metalness:.02,clearcoat:.18,clearcoatRoughness:.35});
 const eCream=new T.MeshStandardMaterial({color:palette.softWhite,roughness:.72,metalness:.02});
 const eMetal=new T.MeshPhysicalMaterial({color:palette.charcoal,roughness:.26,metalness:.82,clearcoat:.24,clearcoatRoughness:.18});
 const eRoof=new T.MeshPhysicalMaterial({color:palette.charcoal,roughness:.36,metalness:.52,clearcoat:.12});
 const eGlass=new T.MeshPhysicalMaterial({color:0xd3d6d3,roughness:.06,metalness:.01,transmission:.54,ior:1.46,thickness:.045,transparent:true,opacity:.62,depthWrite:false,side:T.DoubleSide});
 function ebox(w,h,d,x,y,z,mat){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=renderer.shadowMap.enabled;m.receiveShadow=true;entrance.add(m);return m}
 // The dome GLB itself is physically cut at +Z; this vestibule passes through that real aperture.
 ebox(6.45,.24,5.4,0,3.78,39.0,eRoof);ebox(6.45,.18,5.4,0,.12,39.0,eCream);
 ebox(.20,3.55,5.1,-3.12,1.96,39.0,eWalnut);ebox(.20,3.55,5.1,3.12,1.96,39.0,eWalnut);
 ebox(6.05,3.38,.08,0,1.96,41.48,eGlass);ebox(6.05,3.38,.08,0,1.96,36.52,eGlass);
 for(const x of [-3.0,-1.5,0,1.5,3.0]){ebox(.060,3.48,.12,x,1.98,41.43,eMetal);ebox(.060,3.48,.12,x,1.98,36.57,eMetal)}
 const entranceDoors=[ebox(2.18,3.10,.065,-1.10,1.73,41.38,eGlass),ebox(2.18,3.10,.065,1.10,1.73,41.38,eGlass)];
 ebox(4.85,.13,.22,0,3.38,41.34,eMetal);ebox(.13,3.10,.20,-2.42,1.73,41.34,eMetal);ebox(.13,3.10,.20,2.42,1.73,41.34,eMetal);
 // Substantial reception desk, closer to the richer v10 arrangement.
 ebox(7.4,.94,1.18,0,1.03,34.20,eWalnut);ebox(7.05,.10,1.30,0,1.55,34.20,eCream);
 ebox(6.65,.09,.08,0,1.32,33.60,eMetal);
 // Reception guestbook: the first portfolio portal is now an actual object at the entrance.
 const bookCover=new T.MeshPhysicalMaterial({color:0x3b281e,roughness:.48,metalness:.01,clearcoat:.18,clearcoatRoughness:.3});
 ebox(.82,.055,.56,0,1.645,34.05,bookCover);ebox(.72,.018,.47,0,1.683,34.05,eCream);
 for(const x of [-2.4,2.4]){const l=new T.PointLight(0xffd7ab,42,11,1.8);l.position.set(x,3.10,37.9);entrance.add(l)}
 function updateEntrance(u){const raw=clamp(u)*6;const open=smoother(clamp((raw-.43)/.22));entranceDoors[0].position.x=-1.15-open*1.25;entranceDoors[1].position.x=1.15+open*1.25;window.__LAB_QA__.entranceDoors=+open.toFixed(3)}

 // Small 1960s industrial-design accents give the rooms a coherent visual language without
 // inventing portfolio copy or obscuring the work surfaces.
 const decor=new T.Group();decor.name='mid-century-decor';scene.add(decor);
 const dCream=new T.MeshPhysicalMaterial({color:palette.ivory,roughness:.42,metalness:.05,clearcoat:.28,clearcoatRoughness:.24});
 const dChar=new T.MeshPhysicalMaterial({color:palette.charcoal,roughness:.34,metalness:.58,clearcoat:.12});
 const dWalnut=new T.MeshPhysicalMaterial({color:palette.walnut,roughness:.47,metalness:.02,clearcoat:.16,clearcoatRoughness:.31});
 const accentColors=[palette.darkBrown,palette.charcoal,palette.walnut,palette.charcoal,palette.darkBrown,palette.walnut];
 function decorBox(parent,w,h,d,x,y,z,mat){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=renderer.shadowMap.enabled;m.receiveShadow=true;parent.add(m);return m}
 function makeAudioUnit(y,x,z,accent){const g=new T.Group();g.position.set(x,y,z);decor.add(g);decorBox(g,1.55,.52,.46,0,.32,0,dCream);decorBox(g,.12,.56,.50,-.79,.33,0,dWalnut);decorBox(g,.12,.56,.50,.79,.33,0,dWalnut);decorBox(g,1.18,.25,.015,0,.34,-.238,dChar);for(let k=0;k<4;k++){const knob=new T.Mesh(new T.CylinderGeometry(.055,.055,.035,20),new T.MeshStandardMaterial({color:k===0?palette.charcoal:palette.aluminium,metalness:.78,roughness:.25}));knob.rotation.x=Math.PI/2;knob.position.set(-.42+k*.28,.34,-.267);g.add(knob)}const led=new T.Mesh(new T.BoxGeometry(.18,.035,.02),new T.MeshBasicMaterial({color:0xd7cdbd}));led.position.set(.45,.47,-.265);g.add(led);return g}
 for(let i=0;i<6;i++){
  const y=.65+i*FLOOR_HEIGHT;
  // restrained walnut / charcoal feature wall: no blue, yellow or green accents.
  const panelMat=new T.MeshStandardMaterial({color:i%2?palette.walnut:palette.charcoal,roughness:.54,metalness:i%2?.02:.34});
  for(let s=0;s<9;s++)decorBox(decor,.26,2.15,.09,(i%2?-13.8:13.8)+(s-4)*.34,y+1.75,-19.72,panelMat);
  makeAudioUnit(y+1.02,i%2?-12.2:12.2,-12.2,accentColors[i]);
 }

 // Physical portal surfaces: a visitor book, wall display, designer folio,
 // working laptop, conference monitor, and studio workbook.
 // Source images are derived exclusively from existing original portfolio assets.
 const routeRaycaster=new T.Raycaster(),pointer=new T.Vector2();
 const surfaces=[];const surfaceFrames=[]; const texLoader=new T.TextureLoader();
 const surfaceSpec=[
  {type:'GUESTBOOK',xyz:[0,1.686,34.05],wh:[.697,.47],rx:-Math.PI/2},
  {type:'GALLERY DISPLAY',xyz:[0,7.020,-19.128],wh:[1.45,.816],rx:0},
  {type:'LP LAPTOP',xyz:[0,10.873,-16.024],wh:[.357,.195],rx:0},
  {type:'WEB LAPTOP',xyz:[-3,15.519,-12.912],wh:[.360,.195],rx:0},
  {type:'DIRECTION SCREEN',xyz:[0,20.970,-19.128],wh:[1.22,.686],rx:0},
  {type:'OTHER WORKBOOK',xyz:[3.70,24.708,-17.18],wh:[.43,.31],rx:-Math.PI/2}
 ];
 for(let i=0;i<6;i++){
  const conf=surfaceSpec[i];
  const fallback=new T.MeshStandardMaterial({color:0x2d2b28,roughness:.42,metalness:.06,side:T.FrontSide,transparent:false,depthWrite:true,depthTest:true});
  const mesh=new T.Mesh(new T.PlaneGeometry(...conf.wh),fallback);
  mesh.position.set(...conf.xyz); mesh.rotation.x=conf.rx;
  mesh.userData.stage=i+1;mesh.name='work-surface-'+(i+1);
  // This is a physical display surface, not a HUD overlay. Normal depth rules must apply.
  mesh.renderOrder=0;mesh.material.depthTest=true;mesh.material.depthWrite=true;
  const frameGeo=new T.EdgesGeometry(new T.PlaneGeometry(conf.wh[0]*1.045,conf.wh[1]*1.045));
  const frameMat=new T.LineBasicMaterial({color:0xe7e3da,transparent:true,opacity:0,depthTest:true,depthWrite:false});
  const frame=new T.LineSegments(frameGeo,frameMat);frame.renderOrder=0;frame.position.z=.0015;mesh.add(frame);surfaceFrames.push(frame);scene.add(mesh);surfaces.push(mesh);
 }
 await Promise.all(surfaces.map(async(mesh,i)=>{
  const path=new URL(`./assets/previews/${PREVIEW_FILES[i]}.webp`,document.baseURI).href;
  try{
   const t=await texLoader.loadAsync(path);t.colorSpace=T.SRGBColorSpace;
   t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
   mesh.material.dispose();mesh.material=new T.MeshBasicMaterial({map:t,side:T.FrontSide,toneMapped:false,transparent:false,depthWrite:true,depthTest:true});mesh.renderOrder=0;
   window.__LAB_QA__.previewsLoaded.push(PREVIEW_FILES[i]);
  }catch(e){window.__LAB_QA__.warnings.push('Thumbnail unavailable: '+PREVIEW_FILES[i]);console.warn(path,e)}
 }));

 // One full-scale glass lift car, visible during ascent. 2.65m wide x 3.1m tall.
 const lift=new T.Group();const liftMat=new T.MeshStandardMaterial({color:palette.charcoal,metalness:.82,roughness:.25});
 const liftGlass=new T.MeshPhysicalMaterial({color:0xd3d5d2,metalness:.02,roughness:.07,transmission:.54,transparent:true,opacity:.27,depthWrite:false,side:T.DoubleSide});
 const doorMat=new T.MeshPhysicalMaterial({color:0xbfc1bd,metalness:.12,roughness:.12,transmission:.34,transparent:true,opacity:.46,depthWrite:false,side:T.DoubleSide});
 function box(w,h,d,x,y,z,mat){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=false;lift.add(m);return m}
 box(2.55,.10,2.43,0,-.06,0,liftMat);box(2.55,.09,2.43,0,3.05,0,liftMat);
 for(const x of [-1.25,1.25]){
  box(.08,3.1,.08,x,1.52,-1.19,liftMat);box(.08,3.1,.08,x,1.52,1.17,liftMat);
  box(.08,1.25,2.32,x,1.65,0,liftGlass);
 }
 box(2.45,2.9,.075,0,1.48,1.16,liftGlass);
 const liftDoors=[box(1.19,2.83,.065,-.59,1.48,-1.18,doorMat),box(1.19,2.83,.065,.59,1.48,-1.18,doorMat)];
 const liftLight=new T.PointLight(0xffe7bc,38,9,1.6);liftLight.position.set(0,2.79,0);lift.add(liftLight);
 lift.position.set(0,.65,0);scene.add(lift);
 // Stops show a recognisable object and its actual portfolio thumbnail,
 // rather than an ambiguous floating ring.
 const targetSpec=[
  // Every stop is composed around the actual clickable surface, not the surrounding furniture.
  // FOV intentionally tight: the work itself is the dominant composition during each dwell.
  {p:[0,2.89,35.29],t:[0,1.686,34.05],f:20},
  {p:[0,7.05,-16.57],t:[0,7.020,-19.128],f:25},
  {p:[0,11.31,-15.18],t:[0,10.873,-16.024],f:17},
  {p:[-3,15.60,-11.81],t:[-3,15.519,-12.912],f:14},
  {p:[0,20.99,-16.78],t:[0,20.970,-19.128],f:23},
  {p:[3.70,26.07,-17.16],t:[3.70,24.708,-17.18],f:18}
 ];
 const exterior={p:[118,72,164],t:[0,16,3],f:43};
 const floorY=(idx)=>.65+(idx-1)*FLOOR_HEIGHT;
 const interp=(a,b,t)=>({p:a.p.map((v,j)=>T.MathUtils.lerp(v,b.p[j],smoother(t))),t:a.t.map((v,j)=>T.MathUtils.lerp(v,b.t[j],smoother(t))),f:T.MathUtils.lerp(a.f,b.f,smoother(t))});
 function pathValue(keyframes,q){
  if(q<=keyframes[0][0])return keyframes[0][1];
  for(let j=1;j<keyframes.length;j++){
   const [u,b]=keyframes[j], [prev,a]=keyframes[j-1];
   if(q<=u)return interp(a,b,(q-prev)/(u-prev));
  }
  return keyframes.at(-1)[1];
 }
 const pose=(p,t,f=48)=>({p,t,f});
 function cameraOnPath(u){
  const raw=clamp(u)*6;
  if(raw<=1){const q=raw;const y=floorY(1);
   return pathValue([
    [0,exterior],
    [.16,pose([58,36,105],[0,13,7],43)],
    [.34,pose([20,14,71],[0,6,26],44)],
    [.50,pose([0,5.8,55],[0,3.0,39],46)],
    [.64,pose([0,2.75,47.2],[0,2.15,39.5],43)],
    [.74,pose([0,2.42,40.0],[0,2.0,34.3],43)],
    [.88,pose([0,2.65,36.6],[0,1.82,34.05],34)],
    [1,targetSpec[0]]
   ],q);
  }
  const i=Math.min(5,Math.floor(raw));const q=i===6?1:raw-i;
  const prev=targetSpec[i-1],next=targetSpec[i];const y0=floorY(i),y1=floorY(i+1);
  if(i===1)return pathValue([
   [0,prev],
   [.12,pose([0,2.65,29.0],[0,2.05,18],40)],
   [.25,pose([0,2.45,16.0],[0,2.0,4],44)],
   [.38,pose([0,y0+2.15,-.55],[0,y0+2.05,-10],50)],
   [.62,pose([0,y1+2.15,-.55],[0,y1+2.05,-10],50)],
   [.74,pose([0,y1+2.25,-4.4],[0,y1+2.0,-13],46)],
   [.88,pose([0,y1+2.20,-10.4],next.t,38)],
   [1,next]
  ],q);
  return pathValue([
   [0,prev],
   [.14,pose([prev.p[0]*.42,y0+2.30,-9.4],[0,y0+1.9,-15.2],43)],
   [.27,pose([0,y0+2.25,-4.4],[0,y0+2.0,-11.5],46)],
   [.38,pose([0,y0+2.15,-.55],[0,y0+2.08,-10.0],50)],
   [.62,pose([0,y1+2.15,-.55],[0,y1+2.08,-10.0],50)],
   [.72,pose([0,y1+2.25,-4.4],[0,y1+2.0,-13.0],46)],
   [.85,pose([next.p[0]*.52,y1+2.25,-10.0],next.t,39)],
   [.94,pose([next.p[0]*.82,T.MathUtils.lerp(y1+2.18,next.p[1],.72),T.MathUtils.lerp(-10,next.p[2],.68)],next.t,34)],
   [1,next]
  ],q);
 }
 function updateLift(u){
  const raw=clamp(u)*6;
  if(raw<=1){lift.position.y=.65;liftDoors[0].position.x=-1.18;liftDoors[1].position.x=1.18;return}
  const i=Math.min(5,Math.floor(raw)),q=i===6?1:raw-i;
  const y0=floorY(i),y1=floorY(i+1);
  lift.position.y=T.MathUtils.lerp(y0,y1,smoother(clamp((q-.39)/.23)));
  const openBefore=1-clamp((q-.30)/.09),openAfter=clamp((q-.64)/.10),open=Math.max(openBefore,openAfter);
  liftDoors[0].position.x=-.59-open*.68;liftDoors[1].position.x=.59+open*.68;
 }
 let progressTarget=0,progressRender=0,animation=0,disposed=false,last=0;
 let lookTarget={x:0,y:0},look={x:0,y:0};
 function onPointer(e){if(e.pointerType==='touch')return;lookTarget.x=(e.clientX/innerWidth-.5)*2;lookTarget.y=(e.clientY/innerHeight-.5)*2}
 function pointerLeave(){lookTarget.x=0;lookTarget.y=0}
 addEventListener('pointermove',onPointer,{passive:true});addEventListener('pointerleave',pointerLeave,{passive:true});
 function surfaceHit(event){
  const floor=Math.round(journey(scrollProgress)*6);
  if(floor<=0||floor>6||Math.abs(journey(scrollProgress)*6-floor)>.12)return null;
  const rect=canvas.getBoundingClientRect();
  pointer.set((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height*2-1));
  routeRaycaster.setFromCamera(pointer,camera);
  return routeRaycaster.intersectObject(surfaces[floor-1],false)[0]||null;
 }
 function onCanvasClick(e){
  const hit=surfaceHit(e);if(!hit)return;
  const floor=hit.object.userData.stage,route=routes[floor];
  if(route.external)open(route.href,'_blank','noopener');else location.href=route.href;
 }
 function onCanvasHover(e){canvas.style.cursor=surfaceHit(e)?'pointer':'auto'}
 canvas.addEventListener('click',onCanvasClick);
 canvas.addEventListener('pointermove',onCanvasHover,{passive:true});
 function resize(){
  const w=Math.max(1,canvas.clientWidth||innerWidth),h=Math.max(1,canvas.clientHeight||innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,w<780?1.3:1.65));renderer.setSize(w,h,false);
  camera.aspect=w/h;camera.updateProjectionMatrix();
 }
 resize();addEventListener('resize',resize,{passive:true});
 const focusRaycaster=new T.Raycaster();let hiddenOccluders=[];
 function restoreOccluders(){for(const m of hiddenOccluders)m.visible=true;hiddenOccluders=[]}
 function updateFocusOcclusion(){restoreOccluders()}
 function render(time){
  if(disposed)return;
  animation=requestAnimationFrame(render);const dt=last?Math.min(.09,(time-last)/1000):1/60;last=time;
  const rate=prefersReduced.matches?15:4.6;
  progressRender+=(progressTarget-progressRender)*(1-Math.exp(-dt*rate));
  if(Math.abs(progressRender-progressTarget)<.00003)progressRender=progressTarget;
  look.x+=(lookTarget.x-look.x)*(1-Math.exp(-dt*3.6));look.y+=(lookTarget.y-look.y)*(1-Math.exp(-dt*3.6));
  const pose=cameraOnPath(progressRender);
  const ratio=Math.max(.40,canvas.clientWidth/Math.max(1,canvas.clientHeight));
  const traveled=progressRender*6,at=Math.round(traveled),stageDelta=Math.abs(traveled-at),focusStrength=at>=1&&at<=6?clamp((.18-stageDelta)/.12):0;
  // Make the physical thumbnail the central subject at every stop while keeping
  // the complete image inside the viewport. This moves the camera, never the thumbnail.
  if(at>=1&&at<=6&&stageDelta<.20){
   const spec=surfaceSpec[at-1],center=new T.Vector3(...spec.xyz),pos=new T.Vector3(...pose.p),target=new T.Vector3(...pose.t);
   const forward=target.clone().sub(pos).normalize(),right=new T.Vector3().crossVectors(forward,new T.Vector3(0,1,0));
   if(right.lengthSq()<1e-8)right.set(1,0,0);else right.normalize();
   const up=new T.Vector3().crossVectors(right,forward).normalize();
   const hw=spec.wh[0]/2,hh=spec.wh[1]/2,corners=[
    new T.Vector3(-hw,-hh,0),new T.Vector3(hw,-hh,0),new T.Vector3(hw,hh,0),new T.Vector3(-hw,hh,0)
   ];
   const cr=Math.cos(spec.rx),sr=Math.sin(spec.rx),tanV=Math.tan(T.MathUtils.degToRad(pose.f)/2),tanH=tanV*ratio;
   let maxNdc=0;
   for(const c of corners){
    const y=c.y*cr-c.z*sr,z=c.y*sr+c.z*cr,world=center.clone().add(new T.Vector3(c.x,y,z)),rel=world.sub(pos),depth=rel.dot(forward);
    if(depth<=.02)continue;
    const nx=Math.abs(rel.dot(right)/(depth*tanH)),ny=Math.abs(rel.dot(up)/(depth*tanV));
    maxNdc=Math.max(maxNdc,nx,ny);
   }
   // 0.72 means the work fills roughly 72% of the limiting half-viewport: large,
   // obvious and clickable, but never cropped on portrait or landscape screens.
   const desired=.72;
   if(maxNdc>.001){
    const scale=maxNdc/desired;
    const view=pos.clone().sub(target);
    const adjusted=target.clone().add(view.multiplyScalar(T.MathUtils.lerp(1,scale,focusStrength)));
    pose.p=adjusted.toArray();
   }
  }
  camera.position.set(...pose.p);const target=new T.Vector3(...pose.t);
  updateLift(progressRender);updateEntrance(progressRender);
  // At a portal stop the thumbnail is the composition: pointer parallax collapses almost to zero.
  const parallax=1-focusStrength*.94;camera.position.x+=look.x*.22*parallax;camera.position.y-=look.y*.08*parallax;target.x+=look.x*.62*parallax;target.y-=look.y*.16*parallax;
  camera.lookAt(target);camera.fov=pose.f;camera.updateProjectionMatrix();
  updateFocusOcclusion(at,focusStrength);
  // The dome reads as solid glazed architecture from outside; it clears only after passing the vestibule.
  const delta=clamp((progressRender*6-.73)/.19);
  for(const m of outerShell){m.opacity=.88*(1-delta)+.055*delta;m.depthWrite=delta<.38;}
  for(const m of facade){m.opacity=.68*(1-delta)+.12*delta;m.depthWrite=delta<.38;}
  // Screen/book content exists as part of the room at all times. It is never forced
  // above geometry; furniture, doors and architecture occlude it normally.
  surfaces.forEach((m,i)=>{m.visible=true;if(surfaceFrames[i]){const d=Math.abs(traveled-(i+1));surfaceFrames[i].material.opacity=clamp((.24-d)/.12)*.34;}});
  window.__LAB_QA__.activeSurface=at>0&&stageDelta<.20?ACCESS[at-1]:null;window.__LAB_QA__.elevatorY=+lift.position.y.toFixed(3);
  sky.position.copy(camera.position);renderer.render(scene,camera);restoreOccluders();
  const qa=window.__LAB_QA__;qa.renderedFrames++;if(qa.renderedFrames%30===0){qa.camera=camera.position.toArray().map(v=>+v.toFixed(3));qa.focusStrength=+focusStrength.toFixed(3)}
 }
 animation=requestAnimationFrame(render);
 return {
  setProgress(v){progressTarget=clamp(v)},resize,
  dispose(){disposed=true;cancelAnimationFrame(animation);canvas.removeEventListener('click',onCanvasClick);canvas.removeEventListener('pointermove',onCanvasHover);removeEventListener('pointermove',onPointer);removeEventListener('pointerleave',pointerLeave);removeEventListener('resize',resize);surfaces.forEach(m=>{m.geometry.dispose();m.material.map?.dispose();m.material.dispose()});surfaceFrames.forEach(f=>{f.geometry.dispose();f.material.dispose()});lift.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});objects.forEach(o=>o.traverse(n=>{n.geometry?.dispose();if(n.material){(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>m.dispose())}}));enhancementObjects.forEach(o=>o.traverse(n=>{n.geometry?.dispose();if(n.material){(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>m.dispose())}}));entrance.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose?.()});decor.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose?.()});practicals.forEach(p=>scene.remove(p));hdEnvironment?.texture?.dispose();env.texture.dispose();pmrem.dispose();renderer.dispose()}
 };
}
void boot();
