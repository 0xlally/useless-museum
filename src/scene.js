import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ---------- Shared materials (never disposed with individual exhibits) ---------- */
/* Fine horizontal grain, used as a roughness map so brass reads as hand-finished rather than plastic. */
function brushedTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const v = 120 + Math.random() * 90 | 0;
    x.fillStyle = `rgba(${v},${v},${v},${.12 + Math.random() * .2})`;
    x.fillRect(0, Math.random() * 256, 256, Math.random() * 1.4 + .3);
  }
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.NoColorSpace;
  return t;
}
const brass = new T.MeshStandardMaterial({ color: 0xb98b47, metalness: .78, roughness: .62, roughnessMap: brushedTexture() });
const dark = new T.MeshStandardMaterial({ color: 0x30332d, metalness: .35, roughness: .45 });
const ceramic = new T.MeshStandardMaterial({ color: 0xe8e3d5, roughness: .32 });
const glass = new T.MeshPhysicalMaterial({ color: 0xa3bdc2, metalness: .05, roughness: .25, transparent: true, opacity: .66 });

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new T.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/* ---------- Procedural concept sculptures ---------- */
export function sculpture(kind = 'shadow') {
  const g = new T.Group();
  const add = (geo, mat, x, y, z) => { const m = mesh(geo, mat, x, y, z); g.add(m); return m; };
  add(new T.CylinderGeometry(1.03, 1.12, .18, 64), dark, 0, .09, 0);
  add(new T.CylinderGeometry(.95, 1.02, .08, 64), brass, 0, .21, 0);
  if (kind === 'shadow') {
    add(new T.BoxGeometry(.2, 1.7, .24), brass, 0, 1.08, 0);
    const ring = add(new T.TorusGeometry(.91, .055, 16, 100), brass, 0, 1.55, 0); ring.rotation.y = .14;
    add(new T.CylinderGeometry(.14, .14, .58, 24), dark, 0, .55, 0);
    add(new T.BoxGeometry(1.5, .08, .27), brass, 0, .55, .2);
    for (let i = 0; i < 12; i++) add(new T.BoxGeometry(.018, .013, i % 3 === 0 ? .22 : .12), dark, -.67 + i * .12, .598, .2);
    add(new T.CylinderGeometry(.085, .085, .8, 20), brass, .6, 1.12, .2);
    add(new T.CylinderGeometry(.18, .18, .055, 28), dark, .6, 1.53, .2);
    const lens = add(new T.CircleGeometry(.77, 64), glass, 0, 1.55, .015); lens.material.side = T.DoubleSide;
    add(new T.SphereGeometry(.11, 20, 12), brass, 0, 2.55, 0);
  } else if (kind === 'yawn') {
    add(new T.CylinderGeometry(.7, .7, 1.5, 48), glass, 0, 1.03, 0);
    add(new T.CylinderGeometry(.74, .74, .16, 48), brass, 0, 1.86, 0);
    add(new T.SphereGeometry(.14, 24, 16), brass, 0, 2.06, 0);
    const valve = add(new T.TorusGeometry(.24, .04, 12, 32), brass, .85, 1.3, 0); valve.rotation.y = Math.PI / 2;
    add(new T.CylinderGeometry(.055, .055, .5), brass, .6, 1.3, 0).rotation.z = Math.PI / 2;
    for (let i = 0; i < 5; i++) add(new T.TorusGeometry(.19 + i * .015, .012, 6, 32), ceramic, Math.sin(i) * .12, .65 + i * .2, 0).rotation.x = Math.PI / 2;
  } else if (kind === 'coffee') {
    add(new T.CylinderGeometry(.53, .4, 1.25, 48), ceramic, 0, .92, 0);
    for (let i = 0; i < 3; i++) add(new T.CylinderGeometry(.64 + i * .06, .58 + i * .06, .25, 48, 1, true), brass, 0, .55 + i * .33, 0);
    const h = add(new T.TorusGeometry(.33, .095, 12, 32), ceramic, .65, 1.0, 0); h.scale.x = .7;
    add(new T.CircleGeometry(.48, 48), dark, 0, 1.55, 0).rotation.x = -Math.PI / 2;
  } else if (kind === 'dust') {
    add(new T.BoxGeometry(1.65, .16, 1.4), ceramic, 0, .4, 0);
    for (let i = 0; i < 7; i++) add(new T.BoxGeometry(.04, .25, 1.25), brass, -.73 + i * .24, .6, 0);
    for (let i = 0; i < 7; i++) for (let j = 0; j < 5; j++) add(new T.SphereGeometry(.035, 8, 6), dark, -.6 + i * .2, .6, -.45 + j * .22);
    add(new T.BoxGeometry(.2, .9, .18), brass, -.72, .95, -.6); add(new T.BoxGeometry(1.6, .14, .18), brass, 0, 1.4, -.6);
  } else if (kind === 'wait') {
    add(new T.BoxGeometry(.16, 1.15, .18), brass, 0, .85, 0);
    const face = add(new T.CylinderGeometry(.76, .76, .18, 64), brass, 0, 1.7, 0); face.rotation.x = Math.PI / 2;
    add(new T.CircleGeometry(.68, 64), ceramic, 0, 1.7, .1);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; const mark = add(new T.BoxGeometry(.024, .10, .015), dark, Math.sin(a) * .55, 1.7 + Math.cos(a) * .55, .12); mark.rotation.z = -a; }
    const hand = add(new T.BoxGeometry(.035, .57, .025), dark, .12, 1.88, .14); hand.rotation.z = -.6;
    add(new T.SphereGeometry(.065, 12, 8), brass, 0, 1.7, .15);
  } else {
    add(new T.CylinderGeometry(.78, .9, .4, 8), brass, 0, .48, 0);
    const red = new T.MeshStandardMaterial({ color: 0xb95537, metalness: .3, roughness: .3 });
    add(new T.CylinderGeometry(.53, .57, .3, 48), red, 0, .82, 0);
    add(new T.BoxGeometry(.07, .06, .33), ceramic, -.12, .99, 0); add(new T.BoxGeometry(.07, .06, .33), ceramic, .12, .99, 0);
  }
  return g;
}

const TEXTURE_SLOTS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap'];
const easeOut = k => 1 - Math.pow(1 - k, 3);
const ENTER_MS = 520;
const SINGLE_CAMERA = new T.Vector3(4.5, 3.2, 6.5);

/**
 * MuseumScene owns the WebGL renderer.
 * - renders on demand (idle scene costs ~0 GPU) and pauses when off-screen
 * - image-based lighting via RoomEnvironment so brass/glass read as metal/glass
 * - callbacks: onStatus(text), onProgress(0..1 | null), onPick(index), onSnapshot(exhibit, dataUrl)
 */
export class MuseumScene {
  constructor(container, { onStatus, onProgress, onPick, onSnapshot } = {}) {
    Object.assign(this, { container, onStatus, onProgress, onPick, onSnapshot });
    this.disposed = false; this.auto = false; this.visible = true; this.dirty = true;
    this.galleryObjects = []; this.mode = 'single';
    this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      this.renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      container.innerHTML = '<div class="webgl-error">当前浏览器无法启动 3D 渲染。请开启硬件加速；展品说明和试用仍可浏览。</div>';
      onStatus?.('3D 渲染不可用');
      return;
    }
    const r = this.renderer;
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    r.outputColorSpace = T.SRGBColorSpace; r.setClearColor(0xeeeae2, 0);
    r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.15;
    const canvas = r.domElement;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', '可旋转的三维展品。聚焦后可用方向键旋转，加减号缩放');
    canvas.tabIndex = 0;
    container.append(canvas);

    this.scene = new T.Scene();
    this.camera = new T.PerspectiveCamera(36, 1, .1, 100);
    this.camera.position.copy(SINGLE_CAMERA);
    this.controls = new OrbitControls(this.camera, canvas);
    Object.assign(this.controls, { enableDamping: true, enablePan: false, minDistance: 3.4, maxDistance: 12, maxPolarAngle: Math.PI / 2 + .08 });
    this.controls.target.set(0, 1, 0);
    this.controls.addEventListener('change', () => { this.dirty = true; });

    const pmrem = new T.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
    this.scene.environmentIntensity = .48;
    pmrem.dispose();

    this.scene.add(new T.HemisphereLight(0xfff9f0, 0x5a524a, 1.4));
    const key = new T.DirectionalLight(0xfff5e8, 3.8);
    key.position.set(-3, 7, 4); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 }); key.shadow.bias = -.0005;
    this.scene.add(key);
    const rim = new T.DirectionalLight(0xffffff, 1.8); rim.position.set(4, 4, -4); this.scene.add(rim);

    // Spotlight for museum ambiance
    const spot = new T.SpotLight(0xfff4e0, 120, 18, Math.PI / 6, .85, 1.2);
    spot.position.set(0, 9, 0); spot.target.position.set(0, 0, 0);
    spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -.0004; spot.shadow.radius = 5;
    this.scene.add(spot); this.scene.add(spot.target);

    // Pedestal with shadow decal
    this.pedestal = new T.Group();
    const stone = new T.MeshStandardMaterial({ color: 0xddd8ca, roughness: .88 });
    this.pedestal.add(mesh(new T.CylinderGeometry(1.55, 1.55, .9, 96), stone, 0, -.45, 0));
    // chamfer: a slightly narrower, brighter lip on top catches the spotlight
    this.pedestal.add(mesh(new T.CylinderGeometry(1.5, 1.55, .05, 96), new T.MeshStandardMaterial({ color: 0xeee9dc, roughness: .5 }), 0, -.025, 0));
    // dark recessed plinth at the base
    this.pedestal.add(mesh(new T.CylinderGeometry(1.5, 1.5, .1, 96), new T.MeshStandardMaterial({ color: 0x2a2a28, roughness: .6 }), 0, -.86, 0));
    // thin brass inlay ring around the top edge
    const inlay = mesh(new T.TorusGeometry(1.43, .012, 8, 128), brass, 0, -.002, 0); inlay.rotation.x = Math.PI / 2;
    this.pedestal.add(inlay);
    this.scene.add(this.pedestal);

    // Dark circular shadow under pedestal
    const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 256;
    const ctx = shadowCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
    grad.addColorStop(0, 'rgba(0,0,0,0.18)'); grad.addColorStop(.6, 'rgba(0,0,0,0.06)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 256);
    const shadowTex = new T.CanvasTexture(shadowCanvas);
    const shadowDecal = mesh(new T.CircleGeometry(1.9, 64), new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }), 0, -.89, 0);
    shadowDecal.rotation.x = -Math.PI / 2; this.scene.add(shadowDecal);

    const ground = mesh(new T.PlaneGeometry(200, 200), new T.ShadowMaterial({ opacity: .15 }), 0, -.91, 0);
    ground.rotation.x = -Math.PI / 2; this.scene.add(ground);

    this.raycaster = new T.Raycaster(); this.pointer = new T.Vector2();
    this.bindInput(canvas);


    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(container);
    this.visibilityObserver = new IntersectionObserver(([entry]) => { this.visible = entry.isIntersecting; if (this.visible) this.dirty = true; }, { rootMargin: '120px' });
    this.visibilityObserver.observe(container);
    this.resize();
    r.setAnimationLoop(now => this.frame(now));
  }

  bindInput(canvas) {
    let down = null;
    canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('pointerup', e => {
      if (!down || this.mode !== 'gallery') { down = null; return; }
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
      if (moved < 6) { const i = this.pick(e); if (i >= 0) this.onPick?.(i); }
    });
    canvas.addEventListener('pointermove', e => {
      if (this.mode !== 'gallery' || e.buttons) return;
      canvas.style.cursor = this.pick(e) >= 0 ? 'pointer' : '';
    });
    canvas.addEventListener('keydown', e => {
      const actions = { ArrowLeft: () => this.rotate(-1), ArrowRight: () => this.rotate(1), ArrowUp: () => this.zoom(.88), ArrowDown: () => this.zoom(1.14), '+': () => this.zoom(.88), '=': () => this.zoom(.88), '-': () => this.zoom(1.14) };
      if (actions[e.key]) { e.preventDefault(); actions[e.key](); }
    });
  }

  pick(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.galleryObjects, true)[0];
    let o = hit?.object; while (o && o.userData.index === undefined) o = o.parent;
    return o ? o.userData.index : -1;
  }

  resize() {
    if (!this.renderer) return;
    const { width, height } = this.container.getBoundingClientRect();
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  frame(now) {
    if (this.disposed || !this.visible) return;
    let draw = this.dirty;

    if (this.holder) {
      if (this.enterStart !== undefined) {
        const k = Math.min(1, (now - this.enterStart) / ENTER_MS);
        this.holder.scale.setScalar(.9 + .1 * easeOut(k));
        draw = true;
        if (k >= 1) { this.enterStart = undefined; this.flushSnapshot(); }
      }
      if (this.auto) { this.holder.rotation.y += .004; draw = true; }
      const wobble = this.tryUntil > now ? Math.sin(now * .02) * .018 : 0;
      if (this.holder.rotation.z !== wobble) { this.holder.rotation.z = wobble; draw = true; }
    }
    if (this.walkAnim) {
      const a = this.walkAnim, k = Math.min(1, (now - a.start) / 900);
      const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      this.camera.position.lerpVectors(a.fromCam, a.toCam, e);
      this.controls.target.lerpVectors(a.fromTarget, a.toTarget, e);
      draw = true;
      if (k >= 1) this.walkAnim = null;
    }
    if (this.controls.update()) draw = true;
    if (!draw) return;
    this.dirty = false;
    this.renderer.render(this.scene, this.camera);
  }

  disposeObject(root) {
    root.traverse(o => {
      o.geometry?.dispose();
      if (!o.userData.loaded) return;
      for (const m of [].concat(o.material || [])) { for (const slot of TEXTURE_SLOTS) m[slot]?.dispose(); m.dispose(); }
    });
  }

  clear() {
    if (this.holder) { this.scene.remove(this.holder); this.disposeObject(this.holder); }
    this.holder = null; this.object = null; this.pendingSnapshot = null; this.enterStart = undefined;
    for (const o of this.galleryObjects) { this.scene.remove(o); o.traverse(n => n.geometry?.dispose()); }
    this.galleryObjects = [];
    for (const o of this.galleryExtras || []) { this.scene.remove(o); o.geometry.dispose(); o.material.dispose(); }
    this.galleryExtras = []; this.walkAnim = null; this.scene.fog = null;
  }

  place(content, scale = 1) {
    this.holder = new T.Group();
    this.holder.add(content);
    this.scene.add(this.holder);
    this.object = this.holder;
    if (this.reduceMotion) this.holder.scale.setScalar(1);
    else { this.holder.scale.setScalar(.9); this.enterStart = performance.now(); }
    this.dirty = true;
  }

  async show(exhibit) {
    if (!this.renderer) return;
    const token = this.token = Symbol();
    this.clear(); this.mode = 'single'; this.renderer.domElement.style.cursor = '';
    this.pedestal.visible = true;
    this.controls.maxDistance = 12;
    this.camera.position.copy(SINGLE_CAMERA); this.controls.target.set(0, 1, 0);
    this.place(sculpture(exhibit.kind));
    this.onProgress?.(exhibit.modelUrl ? null : 1);
    this.onStatus?.(exhibit.modelUrl ? '正在载入 Lux3D 模型…' : '交互概念模型 · 非 AI 生成');
    if (!exhibit.modelUrl) return;
    try {
      const gltf = await new GLTFLoader().loadAsync(exhibit.modelUrl, e => {
        if (this.token === token) this.onProgress?.(e.lengthComputable && e.total ? e.loaded / e.total : null);
      });
      if (this.token !== token) { this.disposeObject(gltf.scene); return; }
      this.clear();
      const model = gltf.scene;
      const box = new T.Box3().setFromObject(model);
      const size = box.getSize(new T.Vector3()), center = box.getCenter(new T.Vector3());
      const s = 2.65 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(s); model.position.set(-center.x * s, -box.min.y * s, -center.z * s);
      model.traverse(o => { o.castShadow = true; o.receiveShadow = true; o.userData.loaded = true; });
      this.place(model);
      this.pendingSnapshot = exhibit;
      if (this.reduceMotion) this.flushSnapshot();
      this.onProgress?.(1);
      this.onStatus?.('Lux3D 生成模型 · 真实资产');
    } catch {
      if (this.token !== token) return;
      this.onProgress?.(1);
      this.onStatus?.('模型载入失败 · 当前显示交互概念模型');
    }
  }

  gallery(exhibits) {
    if (!this.renderer) return;
    this.token = Symbol(); this.clear(); this.mode = 'gallery';
    this.pedestal.visible = false;
    const GAP = 3.4;
    this.rows = Math.ceil(exhibits.length / 2); this.row = 0;
    this.rowZ = r => ((this.rows - 1) / 2 - r) * GAP;
    exhibits.forEach((ex, i) => {
      const group = new T.Group(), left = i % 2 === 0, row = Math.floor(i / 2);
      const sc = sculpture(ex.kind); sc.scale.setScalar(.63); group.add(sc);
      group.add(mesh(new T.CylinderGeometry(1, 1, .8, 48), ceramic, 0, -.4, 0));
      group.position.set(left ? -2.3 : 2.3, 0, this.rowZ(row));
      group.rotation.y = left ? .5 : -.5;
      group.userData.index = i;
      this.scene.add(group); this.galleryObjects.push(group);
    });
    const len = this.rows * GAP + 14;
    const floor = new T.Mesh(new T.PlaneGeometry(9, len), new T.MeshStandardMaterial({ color: 0xe6e2d8, roughness: .85 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -.8; floor.receiveShadow = true;
    const runner = new T.Mesh(new T.PlaneGeometry(.05, len), new T.MeshBasicMaterial({ color: 0x0a0a0a }));
    runner.rotation.x = -Math.PI / 2; runner.position.y = -.795;
    this.scene.add(floor, runner); this.galleryExtras = [floor, runner];
    this.scene.fog = new T.Fog(0xeeeeea, 10, 26);
    this.controls.minDistance = 3.4; this.controls.maxDistance = 19;
    this.goRow(0, true);
    this.onProgress?.(1);
    this.onStatus?.('走廊总览 · 用 [ ] 前行 · 点击展台进入鉴赏');
    this.dirty = true;
  }

  goRow(r, instant = false) {
    const z = this.rowZ(r);
    const toCam = new T.Vector3(0, 3.6, z + 11.5), toTarget = new T.Vector3(0, .5, z - 2.2);
    if (instant || this.reduceMotion) {
      this.walkAnim = null;
      this.camera.position.copy(toCam); this.controls.target.copy(toTarget);
      this.controls.update(); this.dirty = true; return;
    }
    this.walkAnim = { start: performance.now(), fromCam: this.camera.position.clone(), fromTarget: this.controls.target.clone(), toCam, toTarget };
    this.dirty = true;
  }

  walk(delta) {
    if (this.mode !== 'gallery' || !this.rows) return undefined;
    this.row = (this.row + delta + this.rows) % this.rows;
    this.goRow(this.row);
    return this.row;
  }

  capture() {
    if (!this.renderer) return null;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  /** Crop a 4:3 thumbnail around the current object; called once the entrance animation settles. */
  flushSnapshot() {
    const exhibit = this.pendingSnapshot; this.pendingSnapshot = null;
    if (!exhibit || !this.onSnapshot || !this.holder) return;
    try {
      this.controls.update();
      this.renderer.render(this.scene, this.camera); this.dirty = false;
      const box = new T.Box3().setFromObject(this.holder);
      const canvas = this.renderer.domElement, v = new T.Vector3();
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
        v.set(x, y, z).project(this.camera);
        const px = (v.x * .5 + .5) * canvas.width, py = (-v.y * .5 + .5) * canvas.height;
        x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
      }
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      let w = Math.max((x1 - x0) * 1.3, ((y1 - y0) * 1.3) * 4 / 3), h = w * 3 / 4;
      w = Math.min(w, canvas.width); h = w * 3 / 4;
      const sx = Math.min(Math.max(cx - w / 2, 0), canvas.width - w), sy = Math.min(Math.max(cy - h / 2, 0), Math.max(canvas.height - h, 0));
      const out = document.createElement('canvas'); out.width = 360; out.height = 270;
      out.getContext('2d').drawImage(canvas, sx, sy, w, h, 0, 0, 360, 270);
      this.onSnapshot(exhibit, out.toDataURL('image/png'));
    } catch { /* thumbnail is a progressive enhancement */ }
  }

  rotate(dir) {
    if (!this.camera) return;
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.applyAxisAngle(new T.Vector3(0, 1, 0), dir * .35);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update(); this.dirty = true;
  }

  zoom(factor) {
    if (!this.camera) return;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const len = Math.min(Math.max(offset.length() * factor, this.controls.minDistance), this.controls.maxDistance);
    this.camera.position.copy(this.controls.target).add(offset.setLength(len));
    this.controls.update(); this.dirty = true;
  }

  trial() { this.tryUntil = performance.now() + 2200; this.dirty = true; }

  dispose() {
    this.disposed = true;
    this.renderer?.setAnimationLoop(null);
    this.resizeObserver?.disconnect(); this.visibilityObserver?.disconnect();
    this.controls?.dispose(); this.clear(); this.renderer?.dispose();
  }
}
