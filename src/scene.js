import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const brass=new T.MeshStandardMaterial({color:0xb98b47,metalness:.76,roughness:.28});
const dark=new T.MeshStandardMaterial({color:0x30332d,metalness:.35,roughness:.45});
const ceramic=new T.MeshStandardMaterial({color:0xe8e3d5,roughness:.32});
const glass=new T.MeshPhysicalMaterial({color:0xa3bdc2,metalness:.05,roughness:.25,transparent:true,opacity:.66});
function mesh(geo,mat,x=0,y=0,z=0){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m;}
export function sculpture(kind='shadow'){
 const g=new T.Group();const add=(geo,mat,x,y,z)=>{const m=mesh(geo,mat,x,y,z);g.add(m);return m;};
 add(new T.CylinderGeometry(1.03,1.12,.18,64),dark,0,.09,0);
 add(new T.CylinderGeometry(.95,1.02,.08,64),brass,0,.21,0);
 if(kind==='shadow'){
  add(new T.BoxGeometry(.2,1.7,.24),brass,0,1.08,0);
  const ring=add(new T.TorusGeometry(.91,.055,16,100),brass,0,1.55,0);ring.rotation.y=.14;
  add(new T.CylinderGeometry(.14,.14,.58,24),dark,0,.55,0);
  add(new T.BoxGeometry(1.5,.08,.27),brass,0,.55,.2);
  for(let i=0;i<12;i++)add(new T.BoxGeometry(.018,.013,i%3===0?.22:.12),dark,-.67+i*.12,.598,.2);
  add(new T.CylinderGeometry(.085,.085,.8,20),brass,.6,1.12,.2);
  add(new T.CylinderGeometry(.18,.18,.055,28),dark,.6,1.53,.2);
  const lens=add(new T.CircleGeometry(.77,64),glass,0,1.55,.015);lens.material.side=T.DoubleSide;
  add(new T.SphereGeometry(.11,20,12),brass,0,2.55,0);
 }else if(kind==='yawn'){
  add(new T.CylinderGeometry(.7,.7,1.5,48),glass,0,1.03,0);
  add(new T.CylinderGeometry(.74,.74,.16,48),brass,0,1.86,0);
  add(new T.SphereGeometry(.14,24,16),brass,0,2.06,0);
  const valve=add(new T.TorusGeometry(.24,.04,12,32),brass,.85,1.3,0);valve.rotation.y=Math.PI/2;
  add(new T.CylinderGeometry(.055,.055,.5),brass,.6,1.3,0).rotation.z=Math.PI/2;
  for(let i=0;i<5;i++)add(new T.TorusGeometry(.19+i*.015,.012,6,32),ceramic,Math.sin(i)*.12,.65+i*.2,0).rotation.x=Math.PI/2;
 }else if(kind==='coffee'){
  add(new T.CylinderGeometry(.53,.4,1.25,48),ceramic,0,.92,0);
  for(let i=0;i<3;i++)add(new T.CylinderGeometry(.64+i*.06,.58+i*.06,.25,48,1,true),brass,0,.55+i*.33,0);
  const h=add(new T.TorusGeometry(.33,.095,12,32),ceramic,.65,1.0,0);h.scale.x=.7;
  add(new T.CircleGeometry(.48,48),dark,0,1.55,0).rotation.x=-Math.PI/2;
 }else if(kind==='dust'){
  add(new T.BoxGeometry(1.65,.16,1.4),ceramic,0,.4,0);
  for(let i=0;i<7;i++)add(new T.BoxGeometry(.04,.25,1.25),brass,-.73+i*.24,.6,0);
  for(let i=0;i<7;i++)for(let j=0;j<5;j++)add(new T.SphereGeometry(.035,8,6),dark,-.6+i*.2,.6,-.45+j*.22);
  add(new T.BoxGeometry(.2,.9,.18),brass,-.72,.95,-.6);add(new T.BoxGeometry(1.6,.14,.18),brass,0,1.4,-.6);
 }else if(kind==='wait'){
  add(new T.BoxGeometry(.16,1.15,.18),brass,0,.85,0);
  const face=add(new T.CylinderGeometry(.76,.76,.18,64),brass,0,1.7,0);face.rotation.x=Math.PI/2;
  const f=add(new T.CircleGeometry(.68,64),ceramic,0,1.7,.1);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;const mark=add(new T.BoxGeometry(.024,.10,.015),dark,Math.sin(a)*.55,1.7+Math.cos(a)*.55,.12);mark.rotation.z=-a;}
  const hand=add(new T.BoxGeometry(.035,.57,.025),dark,.12,1.88,.14);hand.rotation.z=-.6;
  add(new T.SphereGeometry(.065,12,8),brass,0,1.7,.15);
 }else{
  add(new T.CylinderGeometry(.78,.9,.4,8),brass,0,.48,0);
  const red=new T.MeshStandardMaterial({color:0xb95537,metalness:.3,roughness:.3});
  add(new T.CylinderGeometry(.53,.57,.3,48),red,0,.82,0);
  add(new T.BoxGeometry(.07,.06,.33),ceramic,-.12,.99,0);add(new T.BoxGeometry(.07,.06,.33),ceramic,.12,.99,0);
 }
 return g;
}
export class MuseumScene{
 constructor(container,onStatus){
  this.container=container;this.onStatus=onStatus;this.disposed=false;this.auto=false;this.time=0;
  try{this.renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{container.innerHTML='<div class="webgl-error">当前浏览器无法启动 3D 渲染。请开启硬件加速；展品说明和试用仍可浏览。</div>';onStatus?.('3D 渲染不可用');return;}
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.setClearColor(0xeeeae2,0);this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.35;
  container.append(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label','可旋转的三维展品，用方向按钮也可操作');
  this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(33,1,.1,100);this.camera.position.set(4.5,3.2,6.5);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(0,1,0);this.controls.enableDamping=true;this.controls.enablePan=false;this.controls.minDistance=3.4;this.controls.maxDistance=12;this.controls.maxPolarAngle=Math.PI/2+.08;
  this.scene.add(new T.HemisphereLight(0xfffaf0,0x776e59,3));
  const key=new T.DirectionalLight(0xffe9c4,6);key.position.set(-3,7,4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7});key.shadow.bias=-.0005;this.scene.add(key);
  const rim=new T.DirectionalLight(0xffffff,3);rim.position.set(4,4,-4);this.scene.add(rim);
  this.pedestal=mesh(new T.CylinderGeometry(1.55,1.55,.9,96),new T.MeshStandardMaterial({color:0xe0dace,roughness:.9}),0,-.45,0);this.scene.add(this.pedestal);
  const ground=mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.12}),0,-.91,0);ground.rotation.x=-Math.PI/2;this.scene.add(ground);
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(container);this.resize();
  this.renderer.setAnimationLoop(()=>{if(this.disposed)return;if(this.auto&&this.object)this.object.rotation.y+=.004;if(this.tryUntil>performance.now()&&this.object){this.object.rotation.z=Math.sin(performance.now()*.02)*.018;}else if(this.object)this.object.rotation.z=0;this.controls.update();this.renderer.render(this.scene,this.camera);});
 }
 resize(){if(!this.renderer)return;const {width,height}=this.container.getBoundingClientRect();this.renderer.setSize(width,height,false);this.camera.aspect=width/Math.max(height,1);this.camera.updateProjectionMatrix();}
 clear(){if(this.object){this.scene.remove(this.object);this.object.traverse(o=>{o.geometry?.dispose();if(o.userData.loaded){for(const m of [].concat(o.material||[]))m.dispose();}});}this.galleryObjects?.forEach(o=>this.scene.remove(o));this.galleryObjects=[];}
 async show(exhibit){if(!this.renderer)return;const token=this.token=Symbol();this.clear();this.pedestal.visible=true;this.object=sculpture(exhibit.kind);this.scene.add(this.object);this.camera.position.set(4.5,3.2,6.5);this.controls.target.set(0,1,0);this.onStatus?.(exhibit.modelUrl?'正在载入 Lux3D 模型…':'交互概念模型 · 非 AI 生成');
  if(exhibit.modelUrl){try{const gltf=await new GLTFLoader().loadAsync(exhibit.modelUrl);if(this.token!==token)return;this.scene.remove(this.object);this.object=gltf.scene;const box=new T.Box3().setFromObject(this.object),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());const s=2.65/Math.max(size.x,size.y,size.z);this.object.scale.setScalar(s);this.object.position.set(-center.x*s,-box.min.y*s,-center.z*s);this.object.traverse(o=>{o.castShadow=true;o.receiveShadow=true;o.userData.loaded=true;});this.scene.add(this.object);this.onStatus?.('Lux3D 生成模型 · 真实资产');}catch(e){this.onStatus?.('模型载入失败 · 当前显示交互概念模型');}}
 }
 gallery(exhibits){if(!this.renderer)return;this.token=Symbol();this.clear();this.pedestal.visible=false;for(let i=0;i<exhibits.length;i++){const group=new T.Group(),col=i%3,row=Math.floor(i/3);const s=sculpture(exhibits[i].kind);s.scale.setScalar(.63);group.add(s);group.add(mesh(new T.CylinderGeometry(1,1,.8,48),ceramic,0,-.4,0));group.position.set((col-1)*2.7,0,(row-.5)*3.1);this.scene.add(group);this.galleryObjects.push(group);}this.object=null;this.camera.position.set(8,7.8,10);this.controls.maxDistance=19;this.controls.target.set(0,.5,0);this.onStatus?.('空间总览 · 六件交互概念装置');}
 rotate(dir){if(!this.camera)return;const offset=this.camera.position.clone().sub(this.controls.target);offset.applyAxisAngle(new T.Vector3(0,1,0),dir*.35);this.camera.position.copy(this.controls.target).add(offset);this.controls.update();}
 zoom(factor){if(!this.camera)return;this.camera.position.sub(this.controls.target).multiplyScalar(factor).add(this.controls.target);this.controls.update();}
 trial(){this.tryUntil=performance.now()+2200;}
 dispose(){this.disposed=true;this.renderer?.setAnimationLoop(null);this.observer?.disconnect();this.controls?.dispose();this.clear();this.renderer?.dispose();}
}
