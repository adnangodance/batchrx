/**
 * BatchRx hero — real-time 3D pharmacy scene (three.js).
 * A tidy pharmacy counter of medicine boxes and amber Rx bottles. A scan line sweeps across it,
 * matched stock glows mint, one shortage glows coral, and the BatchRx mark floats above.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

type Kind = 'white' | 'green' | 'red';
type BoxSpec = { t: 'box'; x: number; z: number; w: number; d: number; h: number; k: Kind; id?: string };
type BottleSpec = { t: 'bottle'; x: number; z: number; r: number; h: number };
type Spec = BoxSpec | BottleSpec;

const ITEMS: Spec[] = [
  // back row
  { t: 'box', x: -3.7, z: -2.7, w: 1.25, d: 1.25, h: 1.55, k: 'white' },
  { t: 'box', x: -2.15, z: -2.7, w: 1.1, d: 1.25, h: 2.3, k: 'green' },
  { t: 'box', x: -0.6, z: -2.7, w: 1.45, d: 1.25, h: 1.25, k: 'white' },
  { t: 'box', x: 0.95, z: -2.7, w: 1.1, d: 1.25, h: 2.65, k: 'white' },
  { t: 'box', x: 2.45, z: -2.7, w: 1.3, d: 1.25, h: 1.8, k: 'green' },
  { t: 'box', x: 3.85, z: -2.7, w: 0.95, d: 1.25, h: 1.1, k: 'white' },
  // middle row
  { t: 'bottle', x: -3.75, z: -0.35, r: 0.5, h: 1.5 },
  { t: 'bottle', x: -2.55, z: -0.3, r: 0.42, h: 1.15 },
  { t: 'box', x: -1.05, z: -0.35, w: 1.3, d: 1.25, h: 2.0, k: 'red', id: 'short' },
  { t: 'box', x: 0.6, z: -0.35, w: 1.2, d: 1.25, h: 1.4, k: 'white' },
  { t: 'box', x: 2.3, z: -0.35, w: 1.5, d: 1.25, h: 2.2, k: 'green', id: 'match' },
  { t: 'bottle', x: 3.9, z: -0.3, r: 0.45, h: 1.35 },
  // front row
  { t: 'box', x: -3.45, z: 2.0, w: 1.6, d: 1.15, h: 0.95, k: 'white' },
  { t: 'box', x: -1.75, z: 2.0, w: 1.0, d: 1.15, h: 1.5, k: 'green' },
  { t: 'bottle', x: -0.3, z: 2.05, r: 0.46, h: 1.3 },
  { t: 'bottle', x: 0.85, z: 2.1, r: 0.4, h: 1.0 },
  { t: 'box', x: 2.2, z: 2.0, w: 1.3, d: 1.15, h: 1.6, k: 'white' },
  { t: 'box', x: 3.75, z: 2.0, w: 1.15, d: 1.15, h: 1.05, k: 'green' },
];

const COLORS = {
  slab: 0x12352d,
  slabTop: 0x16413a,
  white: 0xf2f3ee,
  green: 0x4fdc96,
  greenEm: 0x1fc27a,
  red: 0xff8d70,
  redEm: 0xe0452a,
  amber: 0xd98a24,
  mint: 0x8ff0bd,
};

// Cinematic look: every block fades from a bright top into a dark, olive-green base.
const BG_RENDER = 0x1d4a40;
const GRAD: Record<Kind, [number, number]> = {
  white: [0x3b4a33, 0xf6f2e4],
  green: [0x0f4a33, 0x7cf2b4],
  red: [0x5a1d12, 0xffb19c],
};
function gradientBox(w: number, h: number, d: number, k: Kind) {
  const g = new RoundedBoxGeometry(w, h, d, 3, 0.05);
  const pos = g.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const bot = new THREE.Color(GRAD[k][0]);
  const top = new THREE.Color(GRAD[k][1]);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) + h / 2) / h;
    c.copy(bot).lerp(top, Math.pow(t, 0.7));
    cols.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return g;
}

function labelTexture(kind: Kind | 'bottle', seed: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d')!;
  const bg = kind === 'green' ? '#e9fbf1' : kind === 'red' ? '#fff1ec' : '#ffffff';
  const accent = kind === 'green' ? '#1d9a61' : kind === 'red' ? '#d9583c' : kind === 'bottle' ? '#1d5043' : '#1d5043';
  g.fillStyle = bg;
  g.fillRect(0, 0, 256, 128);
  g.fillStyle = accent;
  g.fillRect(0, 0, 256, 18);
  g.fillStyle = 'rgba(13,43,39,.85)';
  g.font = '600 26px Inter, system-ui, sans-serif';
  const names = ['Atorvastatin', 'Lisinopril', 'Metformin', 'Gabapentin', 'Amlodipine', 'Omeprazole', 'Losartan', 'Sertraline'];
  g.fillText(names[seed % names.length], 16, 56);
  g.font = '400 18px Inter, system-ui, sans-serif';
  g.fillStyle = 'rgba(13,43,39,.55)';
  g.fillText(`${[10, 20, 50, 100][seed % 4]} MG · ${[30, 90, 100][seed % 3]} TAB`, 16, 84);
  // barcode
  g.fillStyle = 'rgba(13,43,39,.7)';
  for (let i = 0; i < 26; i++) {
    const w = (i * 7 + seed) % 3 === 0 ? 3 : 1.5;
    g.fillRect(16 + i * 6, 98, w, 18);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function fadeTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, 'rgba(255,255,255,0)');
  grd.addColorStop(0.75, 'rgba(255,255,255,.35)');
  grd.addColorStop(1, 'rgba(255,255,255,1)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 4, 256);
  return new THREE.CanvasTexture(c);
}

export function mountPharmacyScene(host: HTMLElement, opts: { reduced: boolean }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG_RENDER);
  scene.fog = new THREE.Fog(BG_RENDER, 14, 30);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.22;

  // ---------- Camera: low, close, cinematic perspective ----------
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const camBase = new THREE.Vector3(9.4, 5.2, 10.6);
  const target = new THREE.Vector3(-0.5, 2.3, -0.6);
  camera.position.copy(camBase);
  camera.lookAt(target);

  // ---------- Lights ----------
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x07170f, 0.3));
  const key = new THREE.DirectionalLight(0xfff0d8, 1.8);
  key.position.set(-4, 12, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -9;
  key.shadow.camera.right = 9;
  key.shadow.camera.top = 9;
  key.shadow.camera.bottom = -9;
  key.shadow.radius = 6;
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x5cffb0, 1.3);
  rim.position.set(-9, 5, -8);
  scene.add(rim);
  const logoLight = new THREE.PointLight(0x3fd68a, 5, 9, 2);
  logoLight.position.set(-0.4, 4.2, -1.2);
  scene.add(logoLight);

  // ---------- Ground ----------
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 90),
    new THREE.MeshStandardMaterial({ color: BG_RENDER, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // ---------- Materials ----------
  const mats = {
    white: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.46, clearcoat: 0.35, clearcoatRoughness: 0.35 }),
    green: () =>
      new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        emissive: COLORS.greenEm,
        emissiveIntensity: 0.12,
        roughness: 0.3,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2,
      }),
    red: () =>
      new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        emissive: COLORS.redEm,
        emissiveIntensity: 0.3,
        roughness: 0.3,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2,
      }),
    amber: new THREE.MeshPhysicalMaterial({
      color: COLORS.amber,
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      sheen: 0.2,
      emissive: 0x6b3305,
      emissiveIntensity: 0.15,
    }),
    cap: new THREE.MeshPhysicalMaterial({ color: 0xfafaf7, roughness: 0.35, clearcoat: 0.5 }),
  };

  type Anim = { mesh: THREE.Mesh; mat: THREE.MeshPhysicalMaterial; base: number; x: number; flash: number; k: Kind };
  const anims: Anim[] = [];
  const anchors: Record<string, THREE.Vector3> = {};

  ITEMS.forEach((it, i) => {
    if (it.t === 'box') {
      const mat = it.k === 'white' ? mats.white.clone() : it.k === 'green' ? mats.green() : mats.red();
      const geo = gradientBox(it.w, it.h, it.d, it.k);
      const m = new THREE.Mesh(geo, mat);
      m.position.set(it.x, it.h / 2, it.z);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
      // labels on the two camera-facing faces (+z front, +x side)
      if (it.h > 0.9) {
        const tex = labelTexture(it.k, i);
        const lh = Math.min(0.62, it.h * 0.42);
        const lw = it.w * 0.84;
        const lmat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 });
        const front = new THREE.Mesh(new THREE.PlaneGeometry(lw, lh), lmat);
        front.position.set(it.x, it.h * 0.5, it.z + it.d / 2 + 0.004);
        front.receiveShadow = true;
        scene.add(front);
        const sideTex = labelTexture(it.k, i + 3);
        const side = new THREE.Mesh(
          new THREE.PlaneGeometry(it.d * 0.84, lh),
          new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.55 }),
        );
        side.rotation.y = Math.PI / 2;
        side.position.set(it.x + it.w / 2 + 0.004, it.h * 0.5, it.z);
        side.receiveShadow = true;
        scene.add(side);
      }
      if (it.k === 'white') {
        mat.emissive.setHex(0x1fc27a);
        mat.emissiveIntensity = 0;
      }
      anims.push({ mesh: m, mat, base: mat.emissiveIntensity, x: it.x, flash: 0, k: it.k });
      if (it.id) anchors[it.id] = new THREE.Vector3(it.x, it.h + 0.15, it.z);
    } else {
      const bodyH = it.h * 0.74;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(it.r, it.r, bodyH, 48), mats.amber);
      body.position.set(it.x, bodyH / 2, it.z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(it.r * 0.9, it.r, 0.08, 48), mats.amber);
      shoulder.position.set(it.x, bodyH + 0.04, it.z);
      scene.add(shoulder);
      // wrap-around label
      const label = new THREE.Mesh(
        new THREE.CylinderGeometry(it.r + 0.006, it.r + 0.006, bodyH * 0.52, 48, 1, true, -Math.PI * 0.1, Math.PI * 1.2),
        new THREE.MeshStandardMaterial({ map: labelTexture('bottle', i), roughness: 0.5, side: THREE.DoubleSide }),
      );
      label.position.set(it.x, bodyH * 0.48, it.z);
      scene.add(label);
      // child-resistant cap
      const capH = it.h - bodyH - 0.06;
      const capCyl = new THREE.Mesh(new THREE.CylinderGeometry(it.r * 1.06, it.r * 1.06, capH, 48), mats.cap);
      capCyl.position.set(it.x, bodyH + 0.06 + capH / 2, it.z);
      capCyl.castShadow = true;
      scene.add(capCyl);
      const capTop = new THREE.Mesh(
        new THREE.TorusGeometry(it.r * 0.98, 0.025, 8, 48),
        new THREE.MeshPhysicalMaterial({ color: 0xe6e8e2, roughness: 0.4 }),
      );
      capTop.rotation.x = Math.PI / 2;
      capTop.position.set(it.x, bodyH + 0.06 + capH, it.z);
      scene.add(capTop);
    }
  });

  // ---------- Floating BatchRx mark ----------
  const logo = new THREE.Group();
  const tileMat = new THREE.MeshPhysicalMaterial({
    color: COLORS.mint,
    emissive: COLORS.greenEm,
    emissiveIntensity: 0.35,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  });
  const s = 1.18;
  const u = 0.9;
  [
    [-u, -u],
    [-u, u],
    [u, -u],
    [u, u],
  ].forEach(([dx, dz]) => {
    const t = new THREE.Mesh(new RoundedBoxGeometry(s, 0.5, s, 5, 0.2), tileMat);
    t.position.set(dx, 0, dz);
    t.castShadow = true;
    logo.add(t);
  });
  // Stand the mark up to face the camera (slightly tilted back) so the diamond reads clearly.
  logo.rotation.y = Math.PI / 4; // tiles → diamond arrangement
  const logoSpin = new THREE.Group();
  logoSpin.add(logo);
  logoSpin.rotation.x = Math.PI / 2 - 0.42; // lift the mark's face toward the viewer
  const logoPivot = new THREE.Group();
  logoPivot.add(logoSpin);
  logoPivot.position.set(-0.6, 4.75, -1.3);
  logoPivot.lookAt(camBase.x, 4.75, camBase.z);
  scene.add(logoPivot);

  // soft light cone under the mark
  const coneGeo = new THREE.CylinderGeometry(0.9, 2.2, 4.4, 48, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0x3fd68a,
    alphaMap: fadeTexture(),
    transparent: true,
    opacity: 0.07,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.set(-0.6, 2.4, -1.3);
  scene.add(cone);

  // ---------- Scan line ----------
  const scan = new THREE.Group();
  const scanPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(8.0, 2.6),
    new THREE.MeshBasicMaterial({
      color: 0x3fd68a,
      alphaMap: fadeTexture(),
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  scanPlane.rotation.y = Math.PI / 2;
  scanPlane.position.y = 1.3;
  scan.add(scanPlane);
  const scanEdge = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 0.035, 8.0),
    new THREE.MeshBasicMaterial({ color: 0xb8ffd8 }),
  );
  scanEdge.position.y = 0.03;
  scan.add(scanEdge);
  scan.position.set(-6, 0, -0.35);
  scene.add(scan);

  // ---------- Post-processing ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.32, 0.5, 0.95);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- Callouts ----------
  const tags = host.parentElement?.querySelectorAll<HTMLElement>('[data-anchor]') ?? [];

  // ---------- Sizing ----------
  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.fov = w / h < 0.9 ? 42 : 30;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.resolution.set(w, h);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // ---------- Pointer parallax ----------
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  // ---------- Loop ----------
  const clock = new THREE.Clock();
  const CYCLE = 8;
  const SWEEP = 5.6;
  const tmp = new THREE.Vector3();
  let raf = 0;
  let visible = true;

  const frame = () => {
    const t = opts.reduced ? 2.8 : clock.getElapsedTime();
    // scan sweep
    const phase = t % CYCLE;
    const sx = phase < SWEEP ? -6 + (phase / SWEEP) * 12 : 7;
    scan.position.x = sx;
    (scanPlane.material as THREE.MeshBasicMaterial).opacity = phase < SWEEP ? 0.1 : 0;
    scanEdge.visible = phase < SWEEP;

    for (const a of anims) {
      const d = Math.abs(sx - a.x);
      if (d < 0.35 && phase < SWEEP) a.flash = 1;
      a.flash *= 0.94;
      a.mat.emissiveIntensity =
        a.k === 'red' ? 0.3 + (Math.sin(t * 2.4) * 0.5 + 0.5) * 0.45 + a.flash * 0.4 : a.base + a.flash * 0.55;
    }

    // logo float
    logoPivot.position.y = 4.75 + Math.sin(t * 0.9) * 0.15;
    logoSpin.rotation.z = Math.sin(t * 0.35) * 0.06;
    logoLight.intensity = 5 + Math.sin(t * 0.9) * 1.2;

    // camera parallax
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    const drift = Math.sin(t * 0.1) * 0.5;
    camera.position.set(camBase.x + drift + pointer.x * 0.9, camBase.y - pointer.y * 0.45, camBase.z - drift * 0.5 - pointer.x * 0.5);
    camera.lookAt(target);

    composer.render();

    // project callouts
    tags.forEach((el) => {
      const p = anchors[el.dataset.anchor!];
      if (!p) return;
      tmp.copy(p).project(camera);
      el.style.left = `${((tmp.x + 1) / 2) * 100}%`;
      el.style.top = `${((1 - tmp.y) / 2) * 100}%`;
    });

    if (!opts.reduced && visible) raf = requestAnimationFrame(frame);
  };

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !opts.reduced) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }
  });
  io.observe(host);
  frame();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    window.removeEventListener('pointermove', onMove);
    renderer.dispose();
  };
}
