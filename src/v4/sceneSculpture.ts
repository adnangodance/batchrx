/**
 * BatchRx hero — monumental "ledger" sculpture (three.js), in the style of a cinematic block render.
 * Long chamfered bars stand in rows like purchased-vs-billed records. Rows step and notch where they
 * don't line up, and one row has a gap (the discrepancy) with mint light glowing up out of it.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

type Mat = 'cream' | 'mint' | 'teal';
type Bar = { x0: number; x1: number; z: number; h: number; m: Mat; d?: number };

const DEPTH = 1.05;
const BARS: Bar[] = [
  // back
  { x0: -3.2, x1: 3.6, z: -4.6, h: 2.5, m: 'cream' },
  { x0: -4.4, x1: 0.9, z: -3.35, h: 2.1, m: 'mint' },
  { x0: 1.15, x1: 5.6, z: -3.35, h: 2.9, m: 'cream' },
  { x0: -1.8, x1: 2.2, z: -2.1, h: 1.55, m: 'teal' },
  { x0: 2.45, x1: 6.4, z: -2.1, h: 2.3, m: 'mint' },
  // middle — the discrepancy row: two bars with a glowing gap between them
  { x0: -5.0, x1: -0.15, z: -0.85, h: 1.85, m: 'cream' },
  { x0: 1.35, x1: 4.2, z: -0.85, h: 1.85, m: 'cream' },
  { x0: 4.45, x1: 7.0, z: -0.85, h: 2.6, m: 'teal' },
  // front
  { x0: -3.4, x1: 1.0, z: 0.4, h: 1.5, m: 'mint' },
  { x0: 1.25, x1: 2.6, z: 0.4, h: 1.15, m: 'cream' },
  { x0: 2.85, x1: 6.8, z: 0.4, h: 2.75, m: 'cream' },
  { x0: -5.4, x1: -0.9, z: 1.65, h: 1.25, m: 'cream' },
  { x0: -0.65, x1: 3.2, z: 1.65, h: 1.05, m: 'mint' },
  { x0: 3.45, x1: 7.4, z: 1.65, h: 1.7, m: 'teal' },
  { x0: -2.6, x1: 2.4, z: 2.9, h: 0.8, m: 'cream' },
  { x0: 2.65, x1: 6.0, z: 2.9, h: 1.3, m: 'mint' },
];
const GAP = { x: 0.6, z: -0.85, w: 1.5 };

// vertical gradients per material: [bottom, top]
const GRAD: Record<Mat, [number, number]> = {
  cream: [0x3b4a33, 0xf6f2e4],
  mint: [0x0f4a33, 0x7cf2b4],
  teal: [0x0c2b25, 0x3f8c74],
};
const BG = 0x0f2a25;
const BG_RENDER = 0x1d4a40; // brighter so it lands on brand green after tone mapping

function gradientBox(w: number, h: number, d: number, m: Mat) {
  const g = new RoundedBoxGeometry(w, h, d, 3, 0.05);
  const pos = g.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const bot = new THREE.Color(GRAD[m][0]);
  const top = new THREE.Color(GRAD[m][1]);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) + h / 2) / h;
    c.copy(bot).lerp(top, Math.pow(t, 0.75));
    cols.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return g;
}

export function mountSculpture(host: HTMLElement, opts: { reduced: boolean }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.78;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG_RENDER);
  scene.fog = new THREE.Fog(BG_RENDER, 14, 30);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.22;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const camBase = new THREE.Vector3(-10.5, 5.6, 9.6);
  const target = new THREE.Vector3(1.2, 1.9, -0.4);

  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x07170f, 0.28));
  const key = new THREE.DirectionalLight(0xfff0d8, 1.7);
  key.position.set(-6, 11, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 });
  key.shadow.radius = 6;
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x5cffb0, 1.3);
  rim.position.set(10, 5, -6);
  scene.add(rim);
  const front = new THREE.DirectionalLight(0xdff7ec, 0.25);
  front.position.set(-2, 3, 12);
  scene.add(front);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ color: BG_RENDER, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const mat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.46, clearcoat: 0.35, clearcoatRoughness: 0.35 });
  const mintMat = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.4,
    clearcoat: 0.45,
    clearcoatRoughness: 0.3,
    emissive: 0x10a463,
    emissiveIntensity: 0.12,
  });
  type Rise = { g: THREE.Object3D; delay: number; from: number };
  const rises: Rise[] = [];
  const sculpture = new THREE.Group();
  sculpture.rotation.y = -0.5;
  scene.add(sculpture);
  BARS.forEach((b, k) => {
    const w = b.x1 - b.x0;
    const m = new THREE.Mesh(gradientBox(w, b.h, b.d ?? DEPTH, b.m), b.m === 'mint' ? mintMat : mat);
    m.position.set((b.x0 + b.x1) / 2, b.h / 2, b.z);
    m.castShadow = true;
    m.receiveShadow = true;
    const g = new THREE.Group();
    g.add(m);
    sculpture.add(g);
    rises.push({ g, delay: 0.2 + k * 0.06, from: -(b.h + 0.6) });
  });

  const glowStrip = new THREE.Mesh(
    new THREE.BoxGeometry(GAP.w - 0.1, 0.04, DEPTH * 0.9),
    new THREE.MeshBasicMaterial({ color: 0xa8ffd2 }),
  );
  glowStrip.position.set(GAP.x, 0.02, GAP.z);
  sculpture.add(glowStrip);
  const gapLight = new THREE.PointLight(0x40f09c, 7, 4, 1.6);
  gapLight.position.set(GAP.x, 0.9, GAP.z);
  sculpture.add(gapLight);

  const glide = new THREE.PointLight(0x7dffc0, 5, 6, 1.8);
  scene.add(glide);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.3, 0.5, 1.0);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.fov = w / h < 0.9 ? 42 : 30;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
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

  const clock = new THREE.Clock();
  let raf = 0;
  let visible = true;
  const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 4);

  const frame = () => {
    const t = opts.reduced ? 20 : clock.getElapsedTime();
    for (const r of rises) r.g.position.y = (1 - ease((t - r.delay) / 1.6)) * r.from;

    ptr.x += (ptr.tx - ptr.x) * 0.04;
    ptr.y += (ptr.ty - ptr.y) * 0.04;
    const drift = Math.sin(t * 0.1) * 0.6;
    camera.position.set(camBase.x + drift + ptr.x * 0.9, camBase.y - ptr.y * 0.45, camBase.z + drift * 0.4);
    camera.lookAt(target);

    const sweep = (t * 0.16) % 1;
    glide.position.set(-5 + sweep * 13, 3.6, 1.5 - sweep * 4);
    glide.intensity = 5 * Math.sin(sweep * Math.PI);
    gapLight.intensity = 7 + Math.sin(t * 1.6) * 2;

    composer.render();
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
