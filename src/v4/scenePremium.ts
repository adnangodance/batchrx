/**
 * BatchRx hero — premium studio still life (three.js).
 * Five pieces only: three printed cartons and two amber Rx bottles on a polished, reflective floor,
 * shot like a product photo. A slim bar of light glides across them and actually lights their faces;
 * when it reaches Lisinopril, a soft coral glow and a single "Shortage found" card appear.
 * The BatchRx mark floats behind, small and crisp.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { BRAND, frontArt, sideArt, topArt, rxLabel, ridgeBump, type Carton } from './sceneRealistic';

type Box = Omit<Carton, 't'> & { t: 'box'; rotY?: number };
type Bottle = { t: 'bottle'; x: number; z: number; r: number; h: number; drug: string };

const ITEMS: (Box | Bottle)[] = [
  { t: 'box', x: -1.75, z: -0.9, w: 1.3, d: 1.0, h: 2.45, drug: 'Metformin', mg: '500 mg', qty: '500 Tablets', brand: BRAND.green, rotY: 0.12 },
  { t: 'box', x: 0.15, z: 0.25, w: 1.25, d: 1.0, h: 1.9, drug: 'Lisinopril', mg: '10 mg', qty: '90 Tablets', brand: BRAND.coral, id: 'short', rotY: -0.08 },
  { t: 'box', x: 2.0, z: -0.65, w: 1.4, d: 1.0, h: 1.45, drug: 'Atorvastatin', mg: '20 mg', qty: '90 Tablets', brand: BRAND.teal, rotY: 0.18 },
  { t: 'bottle', x: -0.95, z: 1.35, r: 0.5, h: 1.45, drug: 'METFORMIN 500MG TAB' },
  { t: 'bottle', x: 1.35, z: 1.45, r: 0.4, h: 1.05, drug: 'ATORVASTATIN 20MG' },
];

const BG_TOP = '#21574b';
const BG_BOTTOM = '#0b231e';
const FLOOR = 0x0f2c26;

function backdrop() {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 512;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, BG_BOTTOM);
  grd.addColorStop(0.45, BG_TOP);
  grd.addColorStop(1, BG_BOTTOM);
  g.fillStyle = grd;
  g.fillRect(0, 0, 32, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const LOGO_PATH = { d: 1.25, s: 1.27, r: 0.3 };
function logoTile() {
  const { s: S, r: R } = LOGO_PATH;
  const h = S / 2;
  const sh = new THREE.Shape();
  sh.moveTo(-h + R, -h);
  sh.lineTo(h - R, -h);
  sh.quadraticCurveTo(h, -h, h, -h + R);
  sh.lineTo(h, h - R);
  sh.quadraticCurveTo(h, h, h - R, h);
  sh.lineTo(-h + R, h);
  sh.quadraticCurveTo(-h, h, -h, h - R);
  sh.lineTo(-h, -h + R);
  sh.quadraticCurveTo(-h, -h, -h + R, -h);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4, curveSegments: 24 });
  g.center();
  g.rotateZ(Math.PI / 4);
  return g;
}

export function mountPharmacyScene(host: HTMLElement, opts: { reduced: boolean; freeze?: number }) {
  RectAreaLightUniformsLib.init();
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = backdrop();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;

  // Camera — a calm three-quarter product angle
  const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 100);
  const camBase = new THREE.Vector3(5.4, 3.0, 8.0);
  const target = new THREE.Vector3(0.1, 1.15, 0.1);

  // Studio lighting: big soft key, mint rim, low fill
  scene.add(new THREE.HemisphereLight(0xfff6ec, 0x0a1f1a, 0.28));
  const key = new THREE.DirectionalLight(0xfff2e2, 2.3);
  key.position.set(-5, 9, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
  key.shadow.radius = 16;
  key.shadow.blurSamples = 24;
  key.shadow.bias = -0.0004;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7dffc4, 1.05);
  rim.position.set(-6, 4, -7);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xe6f2ee, 0.3);
  fill.position.set(8, 2, 5);
  scene.add(fill);

  // Polished floor: a mirror under a tinted, slightly glossy surface → soft, dimmed reflections
  const mirror = new Reflector(new THREE.PlaneGeometry(40, 40), {
    textureWidth: 1024,
    textureHeight: 1024,
    color: 0x4f6f66,
    clipBias: 0.003,
  });
  mirror.rotation.x = -Math.PI / 2;
  mirror.position.y = -0.001;
  scene.add(mirror);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshPhysicalMaterial({ color: FLOOR, roughness: 0.72, transparent: true, opacity: 0.86, clearcoat: 0.25, clearcoatRoughness: 0.35 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Materials
  const paper = (map: THREE.Texture) => {
    const m = new THREE.MeshPhysicalMaterial({ map, roughness: 0.58, clearcoat: 0.18, clearcoatRoughness: 0.5, sheen: 0.12 });
    m.emissive.setHex(0x57e8a4);
    m.emissiveIntensity = 0;
    return m;
  };
  const amber = new THREE.MeshPhysicalMaterial({
    color: 0xd98a2c,
    roughness: 0.1,
    transmission: 0.55,
    thickness: 0.5,
    ior: 1.5,
    attenuationColor: new THREE.Color(0x9a5208),
    attenuationDistance: 0.9,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
  });
  const capMat = new THREE.MeshPhysicalMaterial({ color: 0xf6f6f2, roughness: 0.4, bumpMap: ridgeBump(), bumpScale: 1.5, clearcoat: 0.3 });
  const capTop = new THREE.MeshPhysicalMaterial({ color: 0xf4f4ef, roughness: 0.45 });

  type Glint = { mats: THREE.MeshPhysicalMaterial[]; x: number };
  const glints: Glint[] = [];
  const anchors: Record<string, THREE.Vector3> = {};
  let shortX = 0;

  ITEMS.forEach((it, i) => {
    if (it.t === 'box') {
      const carton = { ...it, t: 'box' } as unknown as Carton;
      const mats = [
        paper(sideArt(carton, i)),
        paper(sideArt(carton, i + 2, true)),
        paper(topArt(carton)),
        paper(topArt(carton)),
        paper(frontArt(carton, i)),
        paper(frontArt(carton, i)),
      ];
      const m = new THREE.Mesh(new THREE.BoxGeometry(it.w, it.h, it.d), mats);
      m.position.set(it.x, it.h / 2, it.z);
      m.rotation.y = it.rotY ?? 0;
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
      glints.push({ mats, x: it.x });
      if (it.id === 'short') {
        anchors.short = new THREE.Vector3(it.x, it.h + 0.05, it.z);
        shortX = it.x;
      }
    } else {
      const bodyH = it.h * 0.74;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(it.r, it.r * 0.98, bodyH, 72), amber);
      body.position.set(it.x, bodyH / 2, it.z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(it.r * 0.86, it.r, 0.1, 72), amber);
      neck.position.set(it.x, bodyH + 0.05, it.z);
      scene.add(neck);
      const label = new THREE.Mesh(
        new THREE.CylinderGeometry(it.r + 0.004, it.r * 0.98 + 0.004, bodyH * 0.6, 72, 1, true, -Math.PI * 0.1, Math.PI * 1.3),
        new THREE.MeshPhysicalMaterial({ map: rxLabel(it.drug, i), roughness: 0.5, side: THREE.DoubleSide }),
      );
      label.position.set(it.x, bodyH * 0.47, it.z);
      label.rotation.y = -1.45; // printed text faces the camera
      scene.add(label);
      const capH = it.h - bodyH - 0.08;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(it.r * 1.07, it.r * 1.07, capH, 72), [capMat, capTop, capTop]);
      cap.position.set(it.x, bodyH + 0.08 + capH / 2, it.z);
      cap.castShadow = true;
      scene.add(cap);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(it.r * 1.04, 0.02, 10, 72), capTop);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(it.x, bodyH + 0.08 + capH, it.z);
      scene.add(ring);
    }
  });

  // The BatchRx mark — small, crisp, floating behind the products
  const tileGeo = logoTile();
  const face = new THREE.MeshPhysicalMaterial({ color: 0xf4fff9, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15, emissive: 0xbaf7d8, emissiveIntensity: 0.18 });
  const edge = new THREE.MeshPhysicalMaterial({ color: 0x3fd68a, roughness: 0.25, emissive: 0x26d07f, emissiveIntensity: 0.8 });
  const mark = new THREE.Group();
  const tiles: THREE.Mesh[] = [];
  (
    [
      [0, LOGO_PATH.d],
      [-LOGO_PATH.d, 0],
      [LOGO_PATH.d, 0],
      [0, -LOGO_PATH.d],
    ] as const
  ).forEach(([x, y], k) => {
    const t = new THREE.Mesh(tileGeo, [face, edge]);
    t.position.set(x, y, 0);
    t.userData = { x, y, k };
    t.castShadow = true;
    mark.add(t);
    tiles.push(t);
  });
  const markPivot = new THREE.Group();
  markPivot.add(mark);
  markPivot.position.set(-0.4, 3.7, -2.8);
  markPivot.scale.setScalar(0.48);
  markPivot.lookAt(camBase.x, 3.6, camBase.z);
  scene.add(markPivot);

  // Scan light: a slim vertical light bar that really lights the products as it passes
  const bar = new THREE.RectAreaLight(0x8dffc9, 0, 0.18, 3.4);
  bar.position.set(-4, 1.7, 3.2);
  bar.lookAt(-4, 1.7, 0);
  scene.add(bar);
  const barGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.04, 3.4),
    new THREE.MeshBasicMaterial({ color: 0xd8ffeb, transparent: true, opacity: 0 }),
  );
  barGlow.position.set(-4, 1.7, 3.2);
  scene.add(barGlow);
  const floorLine = new THREE.Mesh(
    new THREE.PlaneGeometry(0.035, 6.5),
    new THREE.MeshBasicMaterial({ color: 0xbfffe0, transparent: true, opacity: 0, depthWrite: false }),
  );
  floorLine.rotation.x = -Math.PI / 2;
  floorLine.position.set(-4, 0.004, 0);
  scene.add(floorLine);
  const coral = new THREE.PointLight(0xff6a48, 0, 3.5, 1.8);
  coral.position.set(shortX, 0.5, 1.2);
  scene.add(coral);

  // Post
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, 512, 512);
  gtao.blendIntensity = 0.9;
  gtao.updateGtaoMaterial({ radius: 0.4, distanceExponent: 1.4, thickness: 1.0, scale: 1.0, samples: 16 });
  composer.addPass(gtao);
  const bokeh = new BokehPass(scene, camera, {
    focus: camBase.distanceTo(new THREE.Vector3(0.15, 1.0, 0.25)),
    aperture: 0.0011,
    maxblur: 0.008,
  });
  composer.addPass(bokeh);
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.25, 0.5, 0.95);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const stageEl = host.parentElement;
  const tags = stageEl?.querySelectorAll<HTMLElement>('[data-anchor]') ?? [];

  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.fov = w / h < 0.9 ? 38 : 27;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    gtao.setSize(w, h);
    const dpr = renderer.getPixelRatio();
    mirror.getRenderTarget().setSize(Math.round((w * dpr) / 1.5), Math.round((h * dpr) / 1.5));
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e: PointerEvent) => {
    ptr.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ptr.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const smooth = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const CYCLE = 10;
  const SWEEP_FROM = 1.4;
  const SWEEP_TO = 5.2;
  const X0 = -3.6;
  const X1 = 3.8;
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  let raf = 0;
  let visible = true;
  let found = false;

  const frame = () => {
    const t = opts.freeze ?? (opts.reduced ? 6.5 : clock.getElapsedTime());
    const phase = t % CYCLE;

    // mark: assembles on load, then breathes very slightly
    const intro = ease(t / 2);
    tiles.forEach((tile) => {
      const { x, y, k } = tile.userData as { x: number; y: number; k: number };
      const o = 1 - intro;
      tile.position.set(x * (1 + o * 1.6), y * (1 + o * 1.6), o * 1.5);
      tile.rotation.z = o * (k % 2 ? 0.9 : -0.9);
    });
    markPivot.position.y = 3.7 + Math.sin(t * 0.8) * 0.06;

    // light bar sweep
    const sp = (phase - SWEEP_FROM) / (SWEEP_TO - SWEEP_FROM);
    const on = sp > 0 && sp < 1 ? Math.sin(sp * Math.PI) ** 0.5 : 0;
    const bx = X0 + Math.min(Math.max(sp, 0), 1) * (X1 - X0);
    bar.position.x = bx;
    bar.lookAt(bx, 1.7, 0);
    bar.intensity = 26 * on;
    barGlow.position.x = bx;
    (barGlow.material as THREE.MeshBasicMaterial).opacity = 0;
    floorLine.position.x = bx;
    (floorLine.material as THREE.MeshBasicMaterial).opacity = 0.85 * on;
    for (const g of glints) {
      const d = on ? Math.abs(bx - g.x) : 9;
      const v = Math.max(0, 1 - d / 0.7) * on;
      for (const m of g.mats) m.emissiveIntensity = v * 0.14;
    }

    // shortage reveal: once the bar passes Lisinopril, hold until the cycle fades
    const reveal = smooth(SWEEP_FROM + ((shortX - X0) / (X1 - X0)) * (SWEEP_TO - SWEEP_FROM), +0.5 + SWEEP_FROM + ((shortX - X0) / (X1 - X0)) * (SWEEP_TO - SWEEP_FROM), phase) * (1 - smooth(CYCLE - 1.2, CYCLE - 0.2, phase));
    coral.intensity = reveal * (5 + Math.sin(t * 2.2) * 1.5);
    const nowFound = reveal > 0.35;
    if (nowFound !== found) {
      found = nowFound;
      stageEl?.classList.toggle('is-found', found);
    }

    // camera: slow push-in on load, gentle drift, pointer parallax
    ptr.x += (ptr.tx - ptr.x) * 0.04;
    ptr.y += (ptr.ty - ptr.y) * 0.04;
    const push = 1 + (1 - ease(t / 3)) * 0.18;
    const drift = Math.sin(t * 0.09) * 0.35;
    camera.position.set((camBase.x + drift + ptr.x * 0.6) * push, (camBase.y - ptr.y * 0.3) * push, (camBase.z - drift * 0.6) * push);
    camera.lookAt(target);

    composer.render();

    tags.forEach((el) => {
      const p = anchors[el.dataset.anchor!];
      if (!p) return;
      tmp.copy(p).project(camera);
      el.style.left = `${((tmp.x + 1) / 2) * 100}%`;
      el.style.top = `${((1 - tmp.y) / 2) * 100}%`;
    });

    if (!opts.reduced && opts.freeze === undefined && visible) raf = requestAnimationFrame(frame);
  };

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !opts.reduced && opts.freeze === undefined) {
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
