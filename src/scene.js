import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** Web derivatives use Meshopt + WebP, so every loader needs the decoder before parsing. */
function modelLoader() {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  return loader;
}

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

/* ---------- Gallery textures (procedural canvases, generated once) ---------- */
const GALLERY_BG = 0x0b0a09;
const GAL_GAP = 4.6, HALL_LEN = 34, HALL_W = 11, FLOOR_Y = -.8, CEIL_Y = 5.9, GAL_I = 62;

function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c);
  if (srgb) t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function marbleTexture() {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const t = canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#d9d4c8'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const v = 200 + rnd() * 40 | 0;
      x.fillStyle = `rgba(${v},${v - 4},${v - 12},.05)`;
      x.fillRect(rnd() * w, rnd() * h, rnd() * 18 + 2, rnd() * 18 + 2);
    }
    for (let i = 0; i < 9; i++) {
      x.beginPath(); let px = rnd() * w, py = 0; x.moveTo(px, py);
      while (py < h) { px += (rnd() - .5) * 70; py += 20 + rnd() * 30; x.lineTo(px, py); }
      x.strokeStyle = `rgba(90,86,80,${.08 + rnd() * .18})`; x.lineWidth = .5 + rnd() * 1.6; x.stroke();
    }
  });
  t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}

/** Dark polished "golden brick" floor: tight square tiles with subtle per-tile tone and hairline joints. */
function jinzhuanTexture() {
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const t = canvasTex(1024, 1024, (x, w, h) => {
    const n = 8, c = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = 26 + rnd() * 16 | 0;
      x.fillStyle = `rgb(${v + 4},${v + 2},${v - 2})`; x.fillRect(i * c, j * c, c, c);
      const g = x.createLinearGradient(i * c, j * c, (i + 1) * c, (j + 1) * c);
      g.addColorStop(0, 'rgba(255,240,210,.07)'); g.addColorStop(1, 'rgba(0,0,0,.12)');
      x.fillStyle = g; x.fillRect(i * c, j * c, c, c);
    }
    x.strokeStyle = 'rgba(0,0,0,.7)'; x.lineWidth = 3;
    for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * c, 0); x.lineTo(i * c, h); x.stroke(); x.beginPath(); x.moveTo(0, i * c); x.lineTo(w, i * c); x.stroke(); }
  });
  t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}

/** Gold-on-vermilion painted beam (xuanzi-style band): repeating lozenges and a gold edge line. */
function caihuaTexture() {
  const t = canvasTex(512, 96, (x, w, h) => {
    x.fillStyle = '#5a1710'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#7a2216'; x.fillRect(0, 10, w, h - 20);
    x.strokeStyle = '#c9a961'; x.lineWidth = 3; x.strokeRect(0, 8, w, h - 16);
    for (let i = 0; i < 6; i++) {
      const cx = 43 + i * 85.3, cy = h / 2;
      x.beginPath(); x.moveTo(cx - 30, cy); x.lineTo(cx, cy - 22); x.lineTo(cx + 30, cy); x.lineTo(cx, cy + 22); x.closePath();
      x.strokeStyle = '#d8b96f'; x.lineWidth = 2.5; x.stroke();
      x.beginPath(); x.arc(cx, cy, 7, 0, 7); x.fillStyle = '#2a6a64'; x.fill(); x.strokeStyle = '#d8b96f'; x.lineWidth = 1.5; x.stroke();
    }
  });
  t.wrapS = T.RepeatWrapping;
  return t;
}

const glowTexture = () => canvasTex(256, 256, (x, w, h) => {
  const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(255,226,170,1)'); g.addColorStop(.5, 'rgba(255,226,170,.32)'); g.addColorStop(1, 'rgba(255,226,170,0)');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
});

/** Diagonal window lattice (lingge): dark timber bars with a hairline gold edge, transparent between bars. */
function latticeTexture() {
  const t = canvasTex(512, 512, (x, w, h) => {
    const step = 64;
    const lines = () => {
      x.beginPath();
      for (let i = -h; i <= w + h; i += step) { x.moveTo(i, 0); x.lineTo(i + h, h); x.moveTo(i, h); x.lineTo(i + h, 0); }
    };
    x.strokeStyle = '#0d0805'; x.lineWidth = 11; lines(); x.stroke();
    x.strokeStyle = 'rgba(201,162,92,.85)'; x.lineWidth = 1.5; lines(); x.stroke();
  });
  t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}

/** Warm backlight seen through the lattice. */
const windowGlowTexture = () => canvasTex(256, 256, (x, w, h) => {
  const g = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * .75);
  g.addColorStop(0, '#ffd9a0'); g.addColorStop(1, '#4a2a12');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
});

/** Thin gold measuring ring projected on the floor around each plinth (instrument-dial look). */
const ringTexture = () => canvasTex(512, 512, (x, w) => {
  x.translate(w / 2, w / 2); x.strokeStyle = '#ffd58a';
  [[236, 2], [214, 1], [150, 1]].forEach(([r, lw]) => { x.lineWidth = lw; x.beginPath(); x.arc(0, 0, r, 0, 7); x.stroke(); });
  for (let a = 0; a < 360; a += 5) {
    const big = a % 30 === 0, rad = a * Math.PI / 180, r1 = big ? 204 : 222;
    x.lineWidth = big ? 2.5 : 1; x.beginPath();
    x.moveTo(Math.cos(rad) * 236, Math.sin(rad) * 236); x.lineTo(Math.cos(rad) * r1, Math.sin(rad) * r1); x.stroke();
  }
  x.lineWidth = 2;
  for (let k = 0; k < 4; k++) { x.rotate(Math.PI / 2); x.beginPath(); x.moveTo(0, -150); x.lineTo(0, -118); x.stroke(); }
});

/** Brass museum label for one exhibit; text is redrawn once the page font has loaded. */
function plaqueTexture(ex, onReady) {
  const draw = (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#c9a25c'); g.addColorStop(.5, '#a77f3e'); g.addColorStop(1, '#8a6930');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(40,28,10,.55)'; x.lineWidth = 3; x.strokeRect(10, 10, w - 20, h - 20);
    x.fillStyle = '#2a1d09';
    x.font = '500 22px ui-monospace, Consolas, monospace'; x.fillText('NO. ' + ex.no, 34, 56);
    x.font = '700 50px "Noto Serif SC", "Songti SC", serif'; x.fillText(ex.name, 34, 118);
    x.font = '500 17px ui-monospace, Consolas, monospace'; x.fillText((ex.en || '').slice(0, 34), 34, 156);
  };
  const t = canvasTex(512, 192, draw);
  document.fonts?.load('700 50px "Noto Serif SC"', ex.name).then(() => {
    draw(t.image.getContext('2d'), t.image.width, t.image.height); t.needsUpdate = true; onReady?.();
  }).catch(() => {});
  return t;
}

/** Back wall: large gold inscription over a lacquered panel. Redraws when web fonts are ready. */
function backWallTexture(onReady) {
  const W = 2048, H = 1152;
  const BRUSH = '"Long Cang", "STXingkai", "KaiTi", "Noto Serif SC", serif';
  const draw = (x) => {
    x.clearRect(0, 0, W, H);
    // dark dyed-stone wall: fine mottling only, no frame, no board
    x.fillStyle = '#0f0a08'; x.fillRect(0, 0, W, H);
    let seed = 9; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 2200; i++) {
      const g = 14 + rnd() * 16 | 0;
      x.fillStyle = `rgba(${g + 8},${g},${g - 4},${.05 + rnd() * .1})`;
      x.fillRect(rnd() * W, rnd() * H, rnd() * 140 + 20, rnd() * 3 + .6);
    }
    // soft halo behind the name, as if lit from behind
    const halo = x.createRadialGradient(W / 2, H * .47, 40, W / 2, H * .47, W * .5);
    halo.addColorStop(0, 'rgba(255,196,120,.22)'); halo.addColorStop(.5, 'rgba(255,170,90,.07)'); halo.addColorStop(1, 'rgba(255,170,90,0)');
    x.fillStyle = halo; x.fillRect(0, 0, W, H);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    // the name: warm pale gold, drawn in layers (glow, body, hot core) so it reads as light, not paint
    const NAME = '无用需求博物馆', cx = W / 2 + 14, cy = H * .47;
    x.font = `236px ${BRUSH}`;
    if ('letterSpacing' in x) x.letterSpacing = '28px';
    x.fillStyle = 'rgba(255,184,100,.55)'; x.shadowColor = 'rgba(255,170,80,.9)'; x.shadowBlur = 70;
    x.fillText(NAME, cx, cy);
    x.shadowBlur = 26; x.fillStyle = 'rgba(255,205,140,.8)'; x.fillText(NAME, cx, cy);
    x.shadowBlur = 0;
    const body = x.createLinearGradient(0, cy - 140, 0, cy + 140);
    body.addColorStop(0, '#fff0cf'); body.addColorStop(.55, '#f1d49a'); body.addColorStop(1, '#d9b06a');
    x.fillStyle = body; x.fillText(NAME, cx, cy);
    if ('letterSpacing' in x) x.letterSpacing = '0px';
    // one small cinnabar seal, tucked under the last character
    const sx = W / 2 + 640, sy = cy + 205, ss = 84;
    x.save(); x.translate(sx, sy); x.rotate(-.05);
    x.fillStyle = '#a62c1c'; x.fillRect(-ss / 2, -ss / 2, ss, ss);
    for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(15,10,8,${.25 + rnd() * .4})`; x.fillRect(-ss / 2 + rnd() * ss, -ss / 2 + rnd() * ss, 2 + rnd() * 3, 2 + rnd() * 3); }
    x.fillStyle = '#f6dfcf'; x.font = `38px ${BRUSH}`;
    x.fillText('无', -ss / 4 + 1, -ss / 4 + 2); x.fillText('用', ss / 4 - 1, -ss / 4 + 2);
    x.fillText('之', -ss / 4 + 1, ss / 4); x.fillText('巅', ss / 4 - 1, ss / 4);
    x.restore();
  };
  const t = canvasTex(W, H, draw);
  t.anisotropy = 8;
  document.fonts?.load('236px "Long Cang"', '无用需求博物馆之巅')
    .then(() => { draw(t.image.getContext('2d')); t.needsUpdate = true; onReady?.(); }).catch(() => {});
  return t;
}

const TEXTURE_SLOTS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap'];
const easeOut = k => 1 - Math.pow(1 - k, 3);
const ENTER_MS = 520;
const SCAN_MS = 2400;
const SINGLE_CAMERA = new T.Vector3(4.5, 3.2, 6.5);

/**
 * MuseumScene owns the WebGL renderer.
 * - renders on demand (idle scene costs ~0 GPU) and pauses when off-screen
 * - image-based lighting via RoomEnvironment so brass/glass read as metal/glass
 * - callbacks: onStatus(text), onProgress(0..1 | null), onPick(index), onSnapshot(exhibit, dataUrl)
 */
export class MuseumScene {
  constructor(container, { onStatus, onProgress, onPick, onSnapshot, onModel, onHover, onRow } = {}) {
    Object.assign(this, { container, onStatus, onProgress, onPick, onSnapshot, onModel, onHover, onRow });
    this.disposed = false; this.auto = false; this.visible = true; this.dirty = true;
    this.galleryObjects = []; this.mode = 'single';
    this.dbg = new Map(); this.viewMode = 'shaded';
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
    r.localClippingEnabled = true;
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

    this.hemi = new T.HemisphereLight(0xfff9f0, 0x5a524a, 1.4); this.scene.add(this.hemi);
    const key = new T.DirectionalLight(0xfff5e8, 3.8);
    key.position.set(-3, 7, 4); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 }); key.shadow.bias = -.0005;
    this.scene.add(key); this.key = key;
    const rim = new T.DirectionalLight(0xffffff, 1.8); rim.position.set(4, 4, -4); this.scene.add(rim); this.rim = rim;

    // Spotlight for museum ambiance
    const spot = new T.SpotLight(0xfff4e0, 120, 18, Math.PI / 6, .85, 1.2);
    spot.position.set(0, 9, 0); spot.target.position.set(0, 0, 0);
    spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -.0004; spot.shadow.radius = 5;
    this.scene.add(spot); this.scene.add(spot.target); this.spot = spot;
    this.base = { hemi: 1.4, key: 3.8, rim: 1.8, spot: 120, env: .48, exposure: 1.15 };

    // one dormant spotlight per gallery plinth (intensity 0 outside the gallery, so no shader recompiles)
    this.galSpots = Array.from({ length: 6 }, () => {
      const sp = new T.SpotLight(0xffe6c2, 0, 0, .36, 1, 2);
      this.scene.add(sp, sp.target);
      return sp;
    });

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

    // dust motes drifting through the spotlight (decorative; hidden in gallery mode)
    const N = 140, dustPos = new Float32Array(N * 3);
    this.dustSeed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      dustPos[i * 3] = (Math.random() - .5) * 6; dustPos[i * 3 + 1] = Math.random() * 6 - .4; dustPos[i * 3 + 2] = (Math.random() - .5) * 6;
      this.dustSeed[i] = Math.random() * 100;
    }
    const dustGeo = new T.BufferGeometry(); dustGeo.setAttribute('position', new T.BufferAttribute(dustPos, 3));
    this.dust = new T.Points(dustGeo, new T.PointsMaterial({ color: 0xb8924a, size: .035, transparent: true, opacity: .55, depthWrite: false }));
    this.scene.add(this.dust);

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
      if (moved < 6) { const i = this.pick(e); if (i >= 0) this.onPick?.(i); else if (this.focus != null) this.onPick?.(-1); }
    });
    canvas.addEventListener('pointermove', e => {
      if (this.mode !== 'gallery' || e.buttons) return;
      const i = this.pick(e);
      canvas.style.cursor = i >= 0 ? 'pointer' : '';
      if (i !== this.hover) { this.hover = i; this.onHover?.(i); this.dirty = true; }
    });
    canvas.addEventListener('pointerleave', () => { if (this.hover !== -1) { this.hover = -1; this.onHover?.(-1); this.dirty = true; } });
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

    if (this.dust?.visible && !this.reduceMotion) {
      const arr = this.dust.geometry.attributes.position, a = arr.array, sd = this.dustSeed, t = now * .001;
      for (let i = 0; i < sd.length; i++) {
        a[i * 3] += Math.sin(t * .6 + sd[i]) * .0006;
        a[i * 3 + 1] += .0016;
        a[i * 3 + 2] += Math.cos(t * .5 + sd[i]) * .0006;
        if (a[i * 3 + 1] > 5.5) a[i * 3 + 1] = -.4;
      }
      arr.needsUpdate = true; draw = true;
    }
    if (this.mode === 'gallery' && this.galleryObjects.length) {
      for (const g of this.galleryObjects) {
        const want = g.userData.index === this.hover || g.userData.index === this.focus ? 1 : 0;
        const cur = g.userData.lift || 0, next = cur + (want - cur) * .16;
        if (Math.abs(next - cur) > .001) {
          g.userData.lift = next; g.children[0].position.y = next * .1; g.userData.ring.scale.setScalar(1 + next * .03);
          g.userData.ring.material = next > .5 ? this.glintMat ||= new T.MeshStandardMaterial({ color: 0xffd98a, emissive: 0xc9a25c, emissiveIntensity: .9, metalness: .9, roughness: .25 }) : g.userData.ring.userData.mat || g.userData.ring.material;
          draw = true;
        }
      }
    }
    if (this.rings?.length && !this.reduceMotion) { for (const r of this.rings) r.rotation.z += .0012; draw = true; }
    if (this.scan) {
      const sc = this.scan, k = Math.min(1, Math.max(0, (now - sc.start) / SCAN_MS));
      const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const y = sc.y0 + (sc.y1 - sc.y0) * e;
      sc.solid.constant = y; sc.ghost.constant = -y;
      sc.ring.position.y = y; sc.ring.material.opacity = k > 0 && k < 1 ? .9 : 0;
      draw = true;
      if (k >= 1) this.endScan(true);
    }
    if (this.holder) {
      if (this.enterStart !== undefined) {
        const k = Math.min(1, (now - this.enterStart) / ENTER_MS);
        this.holder.scale.setScalar(.9 + .1 * easeOut(k));
        draw = true;
        if (k >= 1) { this.enterStart = undefined; if (!this.scan) this.flushSnapshot(); }
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
    this.endScan();
    this.restoreMaterials();
    if (this.holder) { this.scene.remove(this.holder); this.disposeObject(this.holder); }
    this.holder = null; this.object = null; this.pendingSnapshot = null; this.enterStart = undefined;
    for (const o of this.galleryObjects) {
      this.scene.remove(o);
      o.traverse(n => {
        n.geometry?.dispose();
        if (n.userData.loaded) { for (const m of [].concat(n.material || [])) { for (const slot of TEXTURE_SLOTS) m[slot]?.dispose(); m.dispose(); } }
        else if (n.material?.map?.isCanvasTexture) n.material.map.dispose();
      });
    }
    this.galleryObjects = [];
    for (const o of this.galleryExtras || []) {
      this.scene.remove(o);
      o.traverse(n => {
        n.geometry?.dispose();
        for (const m of [].concat(n.material || [])) { if (m.map && m.map !== this.glow && m.map !== this.beam) m.map.dispose(); m.dispose(); }
      });
    }
    this.galleryExtras = []; this.walkAnim = null; this.scene.fog = null; this.scene.background = null;
    if (this.base) {
      const B = this.base;
      this.hemi.intensity = B.hemi; this.key.intensity = B.key; this.rim.intensity = B.rim; this.spot.intensity = B.spot;
      this.scene.environmentIntensity = B.env; this.renderer.toneMappingExposure = B.exposure;
      this.galSpots?.forEach(sp => { sp.intensity = 0; });
      if (this.dust) this.dust.material.opacity = .55;
    }
    this.hover = -1; this.focus = null; this.rings = []; this.ringTex = null;
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
    this.pedestal.visible = true; this.viewMode = 'shaded';
    if (this.dust) this.dust.visible = true;
    this.controls.maxDistance = 12;
    this.camera.position.copy(SINGLE_CAMERA); this.controls.target.set(0, 1, 0);
    this.place(sculpture(exhibit.kind));
    this.onModel?.({ real: false, ...this.inspect() });
    this.onProgress?.(exhibit.modelUrl ? null : 1);
    this.onStatus?.(exhibit.modelUrl ? '正在载入 Lux3D 模型…' : '交互概念模型 · 非 AI 生成');
    if (!exhibit.modelUrl) return;
    try {
      let bytes = 0;
      const gltf = await modelLoader().loadAsync(exhibit.modelUrl, e => {
        bytes = e.loaded || bytes;
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
      this.startScan(model);
      this.onModel?.({ real: true, bytes, ...this.inspect() });
      if (this.reduceMotion) this.flushSnapshot();
      this.onProgress?.(1);
      this.onStatus?.('Lux3D 生成模型 · 真实资产');
    } catch {
      if (this.token !== token) return;
      this.onProgress?.(1);
      this.onStatus?.('模型载入失败 · 当前显示交互概念模型');
    }
  }

  /** Replace a procedural stand-in with the real Lux3D asset once it arrives. */
  async loadGalleryModel(exhibit, group, placeholder, index) {
    const token = this.token;
    try {
      const gltf = await modelLoader().loadAsync(exhibit.modelUrl);
      gltf.scene.traverse(o => { o.castShadow = true; o.receiveShadow = true; o.userData.loaded = true; });
      if (this.token !== token || this.mode !== 'gallery' || !group.parent) { this.disposeObject(gltf.scene); return; }
      const model = gltf.scene;
      const box = new T.Box3().setFromObject(model);
      const size = box.getSize(new T.Vector3());
      const s = 1.62 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(s);
      const fitted = new T.Box3().setFromObject(model);
      const center = fitted.getCenter(new T.Vector3());
      model.position.set(-center.x, -fitted.min.y - .03, -center.z);
      group.remove(placeholder);
      placeholder.traverse(o => o.geometry?.dispose());
      group.add(model);
      this.dirty = true;
      this.onStatus?.('Lux3D 生成模型 · ' + (index + 1) + ' / ' + this.galleryObjects.length + ' 已载入');
    } catch { /* offline or unsupported asset: the procedural model remains as a labelled stand-in */ }
  }

  gallery(exhibits) {
    if (!this.renderer) return;
    this.token = Symbol(); this.clear(); this.mode = 'gallery';
    this.pedestal.visible = false;
    if (this.dust) { this.dust.visible = true; this.dust.material.opacity = .4; }
    this.hover = -1; this.focus = null;
    this.rows = Math.ceil(exhibits.length / 2); this.row = 0;
    this.rowZ = r => ((this.rows - 1) / 2 - r) * GAL_GAP;
    const z0 = this.rowZ(0), z1 = this.rowZ(this.rows - 1);
    const hallZ0 = z0 + 9, hallZ1 = z1 - 11, midZ = (hallZ0 + hallZ1) / 2, len = hallZ0 - hallZ1;
    const keep = [];
    const add = (o) => { this.scene.add(o); keep.push(o); return o; };

    this.scene.background = new T.Color(GALLERY_BG);
    this.scene.fog = new T.Fog(GALLERY_BG, 11, 30);
    this.renderer.toneMappingExposure = 1.05;
    this.hemi.intensity = .2; this.key.intensity = 0; this.rim.intensity = 0; this.spot.intensity = 0;
    this.scene.environmentIntensity = .3;
    this.rings = [];

    const ft = jinzhuanTexture(); ft.repeat.set(HALL_W / 3.2, len / 3.2);
    const floor = new T.Mesh(new T.PlaneGeometry(HALL_W, len), new T.MeshStandardMaterial({ map: ft, roughness: .32, metalness: .12, envMapIntensity: 1.1 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, FLOOR_Y, midZ); floor.receiveShadow = true; add(floor);
    const run = new T.Mesh(new T.PlaneGeometry(1.5, len - 2), new T.MeshStandardMaterial({ color: 0x5b1b12, roughness: .85 }));
    run.rotation.x = -Math.PI / 2; run.position.set(0, FLOOR_Y + .004, midZ); add(run);
    for (const sx of [-.78, .78]) {
      const edge = new T.Mesh(new T.PlaneGeometry(.045, len - 2), new T.MeshStandardMaterial({ color: 0xb98b47, metalness: .8, roughness: .4 }));
      edge.rotation.x = -Math.PI / 2; edge.position.set(sx, FLOOR_Y + .006, midZ); add(edge);
    }

    const ceil = new T.Mesh(new T.PlaneGeometry(HALL_W, len), new T.MeshStandardMaterial({ color: 0x120e0b, roughness: .9 }));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(0, CEIL_Y, midZ); add(ceil);
    const painted = caihuaTexture();
    const lacquer = new T.MeshStandardMaterial({ color: 0x5c1a11, roughness: .38, metalness: .1 });
    const bandMat = new T.MeshStandardMaterial({ map: painted, roughness: .5, metalness: .25 });
    const gold = new T.MeshStandardMaterial({ color: 0xc9a25c, metalness: .85, roughness: .32 });
    painted.repeat.set(HALL_W / 4.4, 1);
    for (let r = 0; r <= this.rows; r++) {
      const z = (r === this.rows ? this.rowZ(this.rows - 1) - GAL_GAP : this.rowZ(r)) + GAL_GAP / 2;
      const beam = new T.Mesh(new T.BoxGeometry(HALL_W, .5, .34), lacquer); beam.position.set(0, CEIL_Y - .25, z); add(beam);
      const band = new T.Mesh(new T.PlaneGeometry(HALL_W, .3), bandMat); band.position.set(0, CEIL_Y - .27, z + .175); add(band);
      const slot = new T.Mesh(new T.BoxGeometry(HALL_W - 3.4, .03, .14), new T.MeshBasicMaterial({ color: 0xfff0d6 }));
      slot.position.set(0, CEIL_Y - .52, z); add(slot);
    }

    const wallMat = new T.MeshStandardMaterial({ color: 0x4a140d, roughness: .62, metalness: .05, emissive: 0x1a0603, emissiveIntensity: .5 });
    const colMat = new T.MeshStandardMaterial({ color: 0x7a1d12, roughness: .2, metalness: .12, envMapIntensity: 1.5, emissive: 0x1c0603, emissiveIntensity: .5 });
    const baseMat = new T.MeshStandardMaterial({ color: 0x2b2824, roughness: .7 });
    for (const side of [-1, 1]) {
      const wx = side * HALL_W / 2;
      const wall = new T.Mesh(new T.PlaneGeometry(len, CEIL_Y - FLOOR_Y), wallMat);
      wall.rotation.y = -side * Math.PI / 2; wall.position.set(wx, (CEIL_Y + FLOOR_Y) / 2, midZ); add(wall);
      for (let r = 0; r <= this.rows; r++) {
        const z = (r === this.rows ? this.rowZ(this.rows - 1) - GAL_GAP : this.rowZ(r)) + GAL_GAP / 2;
        const col = new T.Mesh(new T.CylinderGeometry(.27, .3, CEIL_Y - FLOOR_Y - .5, 28), colMat);
        col.position.set(wx - side * .45, (CEIL_Y + FLOOR_Y) / 2 + .1, z); col.castShadow = true; add(col);
        const base = new T.Mesh(new T.CylinderGeometry(.42, .46, .28, 28), baseMat); base.position.set(wx - side * .45, FLOOR_Y + .14, z); add(base);
        const capital = new T.Mesh(new T.BoxGeometry(.7, .22, .7), gold); capital.position.set(wx - side * .45, CEIL_Y - .52, z); add(capital);
        for (const ry of [FLOOR_Y + .62, CEIL_Y - .88]) {
          const rg = new T.Mesh(new T.TorusGeometry(.285, .02, 8, 40), gold);
          rg.rotation.x = Math.PI / 2; rg.position.set(wx - side * .45, ry, z); add(rg);
        }
      }
    }
    const winW = GAL_GAP - .95, winH = 3.0, winY = 1.9;
    for (const side of [-1, 1]) {
      const wx = side * HALL_W / 2 - side * .03;
      for (let r = 0; r < this.rows; r++) {
        const z = this.rowZ(r), g = new T.Group();
        g.position.set(wx, winY, z); g.rotation.y = -side * Math.PI / 2;
        const glow = new T.Mesh(new T.PlaneGeometry(winW, winH), new T.MeshBasicMaterial({ map: windowGlowTexture() }));
        const lat = latticeTexture(); lat.repeat.set(winW / 1.4, winH / 1.4);
        const grid = new T.Mesh(new T.PlaneGeometry(winW, winH), new T.MeshBasicMaterial({ map: lat, transparent: true, depthWrite: false }));
        grid.position.z = .012;
        g.add(glow, grid);
        for (const [bw, bh, bx, by] of [[winW + .1, .06, 0, winH / 2], [winW + .1, .06, 0, -winH / 2], [.06, winH, winW / 2, 0], [.06, winH, -winW / 2, 0]]) {
          const bar = new T.Mesh(new T.BoxGeometry(bw, bh, .05), gold); bar.position.set(bx, by, .02); g.add(bar);
        }
        add(g);
      }
      const skirt = new T.Mesh(new T.BoxGeometry(.035, .035, len - 1), new T.MeshBasicMaterial({ color: 0xffc27a }));
      skirt.position.set(side * (HALL_W / 2 - .05), FLOOR_Y + .06, midZ); add(skirt);
      const cove = new T.Mesh(new T.BoxGeometry(.04, .04, len - 1), new T.MeshBasicMaterial({ color: 0x7fa6d8 }));
      cove.position.set(side * (HALL_W / 2 - .12), CEIL_Y - .06, midZ); add(cove);
    }

    const back = new T.Mesh(new T.PlaneGeometry(HALL_W, CEIL_Y - FLOOR_Y), new T.MeshBasicMaterial({ map: backWallTexture(() => { this.dirty = true; }), fog: false }));
    back.position.set(0, (CEIL_Y + FLOOR_Y) / 2, hallZ1); add(back);


    const marble = marbleTexture();
    const stone = new T.MeshStandardMaterial({ map: marble, color: 0xcfc8b8, roughness: .42, metalness: .05, envMapIntensity: .8 });
    const dark = new T.MeshStandardMaterial({ color: 0x1b1916, roughness: .5, metalness: .3 });
    exhibits.forEach((ex, i) => {
      const left = i % 2 === 0, row = Math.floor(i / 2);
      const group = new T.Group();
      const sc = sculpture(ex.kind); sc.scale.setScalar(.56); group.add(sc);
      const body = new T.Mesh(new T.CylinderGeometry(.92, .98, .62, 64), stone); body.position.y = -.4; body.castShadow = body.receiveShadow = true; group.add(body);
      const top = new T.Mesh(new T.CylinderGeometry(1.0, 1.0, .06, 64), stone); top.position.y = -.06; group.add(top);
      const band = new T.Mesh(new T.TorusGeometry(.95, .014, 8, 96), gold); band.rotation.x = Math.PI / 2; band.position.y = -.1; group.add(band);
      const foot = new T.Mesh(new T.CylinderGeometry(1.08, 1.12, .16, 64), dark); foot.position.y = -.72; group.add(foot);
      group.position.set(left ? -2.35 : 2.35, 0, this.rowZ(row));
      group.rotation.y = left ? .5 : -.5;
      group.userData.index = i;
      group.userData.baseScale = 1;
      group.userData.ring = band;
      this.scene.add(group); this.galleryObjects.push(group);
      if (ex.modelUrl) this.loadGalleryModel(ex, group, sc, i);

      const sp = this.galSpots[i];
      if (sp) {
        sp.intensity = GAL_I; sp.distance = 12; sp.angle = .27; sp.penumbra = .55; sp.decay = 1.6; sp.color.set(0xfff1dc);
        sp.position.set(group.position.x * .35, CEIL_Y - .7, group.position.z + .6);
        sp.target.position.set(group.position.x, .3, group.position.z);
        sp.castShadow = false;
      }
      const ring = new T.Mesh(new T.PlaneGeometry(4.6, 4.6), new T.MeshBasicMaterial({ map: this.ringTex ||= ringTexture(), transparent: true, opacity: .55, depthWrite: false, blending: T.AdditiveBlending }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(group.position.x, FLOOR_Y + .014, group.position.z); add(ring); this.rings.push(ring);
      const pool = new T.Mesh(new T.CircleGeometry(1.9, 48), new T.MeshBasicMaterial({ map: this.glow ||= glowTexture(), transparent: true, opacity: .3, depthWrite: false, blending: T.AdditiveBlending }));
      pool.rotation.x = -Math.PI / 2; pool.position.set(group.position.x, FLOOR_Y + .012, group.position.z); add(pool);
      const plq = new T.Mesh(new T.PlaneGeometry(.92, .345), new T.MeshStandardMaterial({ map: plaqueTexture(ex, () => { this.dirty = true; }), roughness: .35, metalness: .7 }));
      plq.position.set(group.position.x, -.44, group.position.z + 1.07); plq.rotation.x = -.1;
      plq.userData.noPick = true; add(plq);
    });
    for (let i = exhibits.length; i < this.galSpots.length; i++) this.galSpots[i].intensity = 0;

    this.galleryExtras = keep;
    this.controls.minDistance = 3.4; this.controls.maxDistance = 19;
    this.goRow(0, true);
    this.onProgress?.(1);
    this.onStatus?.('朱墙长廊 · 拖动环视 · 滚轮推近 · 底部按钮前行 · 点击展台了解展品');
    this.onRow?.(0, this.rows);
    this.dirty = true;
  }

  setFocus(index) {
    this.focus = index;
    this.galleryObjects.forEach((g, i) => {
      const spot = this.galSpots[i];
      if (spot) spot.intensity = index == null ? GAL_I : (i === index ? GAL_I * 1.9 : GAL_I * .12);
    });
    this.dirty = true;
  }

  goRow(r, instant = false) {
    const z = this.rowZ(r);
    const toCam = new T.Vector3(0, 3.1, z + 12.6), toTarget = new T.Vector3(0, .4, z - 2.4);
    if (instant || this.reduceMotion) {
      this.walkAnim = null;
      this.camera.position.copy(toCam); this.controls.target.copy(toTarget);
      this.controls.update(); this.dirty = true; return;
    }
    this.walkAnim = { start: performance.now(), fromCam: this.camera.position.clone(), fromTarget: this.controls.target.clone(), toCam, toTarget };
    this.dirty = true;
  }

  flyTo(index) {
    const g = this.galleryObjects[index];
    if (!g) return;
    const toTarget = new T.Vector3(g.position.x + 2.0, .55, g.position.z);
    const toCam = new T.Vector3(g.position.x + 2.0, 1.9, g.position.z + 8.4);
    this.walkAnim = { start: performance.now(), fromCam: this.camera.position.clone(), fromTarget: this.controls.target.clone(), toCam, toTarget };
    this.dirty = true;
  }

  walk(delta) {
    if (this.mode !== 'gallery' || !this.rows) return undefined;
    this.row = (this.row + delta + this.rows) % this.rows;
    this.goRow(this.row);
    this.onRow?.(this.row, this.rows);
    return this.row;
  }

  capture() {
    if (!this.renderer) return null;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  /* ---------- inspection: render modes + measured statistics ---------- */
  debugMaterial(mode, base) {
    const key = mode + ':' + base.uuid;
    let m = this.dbg.get(key);
    if (m) return m;
    if (mode === 'wire') m = new T.MeshBasicMaterial({ color: 0xd4492d, wireframe: true, transparent: true, opacity: .16, depthWrite: false });
    else if (mode === 'normal') m = new T.MeshNormalMaterial();
    else m = new T.MeshBasicMaterial({ map: base.map || null, color: base.map ? 0xffffff : base.color || 0xcccccc });
    this.dbg.set(key, m);
    return m;
  }

  setViewMode(mode) {
    this.viewMode = mode;
    if (!this.holder) return;
    this.holder.traverse(o => {
      if (!o.isMesh || o.userData.scanOverlay) return;
      o.userData.origMat ??= o.material;
      const base = o.userData.origMat;
      o.material = mode === 'shaded' ? base : Array.isArray(base) ? base.map(b => this.debugMaterial(mode, b)) : this.debugMaterial(mode, base);
    });
    this.dirty = true;
  }

  restoreMaterials() {
    this.holder?.traverse(o => { if (o.userData.origMat) o.material = o.userData.origMat; });
    for (const m of this.dbg.values()) m.dispose();
    this.dbg.clear();
  }

  /** Counts come from the geometry actually loaded in the viewer; nothing is estimated. */
  inspect() {
    if (!this.holder) return null;
    let verts = 0, tris = 0, meshes = 0;
    const mats = new Set(), tex = new Map();
    this.holder.traverse(o => {
      if (!o.isMesh || o.userData.scanOverlay) return;
      meshes++;
      const g = o.geometry, pos = g.attributes.position;
      verts += pos.count; tris += (g.index ? g.index.count : pos.count) / 3;
      for (const m of [].concat(o.userData.origMat || o.material)) {
        mats.add(m);
        for (const slot of TEXTURE_SLOTS) {
          const t = m[slot];
          if (!t?.image) continue;
          const rec = tex.get(t.uuid) || { slots: [], w: t.image.width, h: t.image.height };
          rec.slots.push(slot); tex.set(t.uuid, rec);
        }
      }
    });
    const label = sl => sl.includes('roughnessMap') || sl.includes('metalnessMap') ? 'Metal-Rough' : sl.includes('map') ? 'BaseColor'
      : sl.includes('normalMap') ? 'Normal' : sl.includes('aoMap') ? 'AO' : sl.includes('emissiveMap') ? 'Emissive' : 'Alpha';
    return { meshes, verts, tris: Math.round(tris), materials: mats.size, textures: [...tex.values()].map(t => ({ label: label(t.slots), w: t.w, h: t.h })) };
  }

  /* ---------- scan-line reveal for generated models: wireframe above the line, PBR below ---------- */
  startScan(model) {
    if (this.reduceMotion || !this.holder) return;
    const prev = this.holder.scale.x;
    this.holder.scale.setScalar(1); this.holder.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(model);
    this.holder.scale.setScalar(prev);
    const y0 = box.min.y - .02, y1 = box.max.y + .02;
    const radius = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * .62;
    const solid = new T.Plane(new T.Vector3(0, -1, 0), y0), ghost = new T.Plane(new T.Vector3(0, 1, 0), -y0);
    const wireMat = new T.MeshBasicMaterial({ color: 0xd4492d, wireframe: true, transparent: true, opacity: .5, clippingPlanes: [ghost], depthWrite: false });
    const meshes = [], touched = [], overlays = [];
    model.traverse(o => { if (o.isMesh) meshes.push(o); });
    for (const o of meshes) {
      for (const m of [].concat(o.material)) { m.clippingPlanes = [solid]; m.needsUpdate = true; touched.push(m); }
      const w = new T.Mesh(o.geometry, wireMat);
      w.userData.scanOverlay = true;
      w.position.copy(o.position); w.quaternion.copy(o.quaternion); w.scale.copy(o.scale);
      o.parent.add(w); overlays.push(w);
    }
    const ring = new T.Mesh(new T.RingGeometry(radius * .94, radius, 96), new T.MeshBasicMaterial({ color: 0xd4492d, transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = y0; this.scene.add(ring);
    this.scan = { start: performance.now() + ENTER_MS, y0, y1, solid, ghost, wireMat, ring, touched, overlays };
    this.dirty = true;
  }

  endScan(flush = false) {
    const sc = this.scan;
    if (!sc) return;
    this.scan = null;
    for (const m of sc.touched) { m.clippingPlanes = null; m.needsUpdate = true; }
    for (const w of sc.overlays) w.parent?.remove(w);
    sc.wireMat.dispose(); sc.ring.geometry.dispose(); sc.ring.material.dispose(); this.scene.remove(sc.ring);
    this.dirty = true;
    if (flush) this.flushSnapshot();
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
