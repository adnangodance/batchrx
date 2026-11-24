/**
 * BatchRx hero — photoreal pharmacy scene (three.js).
 * Real-looking pharmaceutical cartons (printed artwork on every face) and translucent amber prescription
 * bottles with child-proof caps and pharmacy labels, on a semi-gloss counter. Ambient occlusion, soft
 * shadows and a shallow depth of field give it a photographic feel. A scan line sweeps the stock, one
 * shortage glows coral, and the BatchRx mark floats above in frosted mint glass.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export type Carton = {
  t: 'box';
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  drug: string;
  mg: string;
  qty: string;
  brand: string; // accent colour
  id?: string;
  short?: number; // units billed above purchases
};
type Bottle = { t: 'bottle'; x: number; z: number; r: number; h: number; drug: string };
type Item = Carton | Bottle;

export const BRAND = {
  green: '#1f8a5b',
  blue: '#2563a8',
  teal: '#0f766e',
  orange: '#d9792b',
  plum: '#6b4f9a',
  coral: '#d0472e',
  navy: '#1e3a5f',
};

const ITEMS: Item[] = [
  // back row
  { t: 'box', x: -3.7, z: -2.7, w: 1.25, d: 1.0, h: 1.55, drug: 'Amlodipine', mg: '5 mg', qty: '90 Tablets', brand: BRAND.blue },
  { t: 'box', x: -2.15, z: -2.7, w: 1.1, d: 1.0, h: 2.3, drug: 'Sertraline', mg: '50 mg', qty: '30 Tablets', brand: BRAND.plum },
  { t: 'box', x: -0.6, z: -2.7, w: 1.45, d: 1.0, h: 1.25, drug: 'Losartan', mg: '50 mg', qty: '90 Tablets', brand: BRAND.teal },
  { t: 'box', x: 0.95, z: -2.7, w: 1.1, d: 1.0, h: 2.65, drug: 'Gabapentin', mg: '300 mg', qty: '100 Capsules', brand: BRAND.orange, short: 30 },
  { t: 'box', x: 2.45, z: -2.7, w: 1.3, d: 1.0, h: 1.8, drug: 'Atorvastatin', mg: '20 mg', qty: '90 Tablets', brand: BRAND.green },
  { t: 'box', x: 3.85, z: -2.7, w: 0.95, d: 1.0, h: 1.1, drug: 'Albuterol', mg: '90 mcg', qty: '1 Inhaler', brand: BRAND.navy },
  // middle row
  { t: 'bottle', x: -3.75, z: -0.35, r: 0.5, h: 1.5, drug: 'METFORMIN 500MG TAB' },
  { t: 'bottle', x: -2.55, z: -0.3, r: 0.42, h: 1.15, drug: 'OMEPRAZOLE 20MG CAP' },
  { t: 'box', x: -1.05, z: -0.35, w: 1.3, d: 1.0, h: 2.0, drug: 'Lisinopril', mg: '10 mg', qty: '90 Tablets', brand: BRAND.coral, id: 'short', short: 30 },
  { t: 'box', x: 0.6, z: -0.35, w: 1.2, d: 1.0, h: 1.4, drug: 'Levothyroxine', mg: '50 mcg', qty: '90 Tablets', brand: BRAND.blue },
  { t: 'box', x: 2.3, z: -0.35, w: 1.5, d: 1.0, h: 2.2, drug: 'Metformin', mg: '500 mg', qty: '500 Tablets', brand: BRAND.green, id: 'match' },
  { t: 'bottle', x: 3.9, z: -0.3, r: 0.45, h: 1.35, drug: 'ATORVASTATIN 20MG' },
  // front row
  { t: 'box', x: -3.45, z: 2.0, w: 1.6, d: 1.0, h: 0.95, drug: 'Omeprazole', mg: '20 mg', qty: '30 Capsules', brand: BRAND.plum },
  { t: 'box', x: -1.75, z: 2.0, w: 1.0, d: 1.0, h: 1.5, drug: 'Rosuvastatin', mg: '10 mg', qty: '30 Tablets', brand: BRAND.teal },
  { t: 'bottle', x: -0.3, z: 2.05, r: 0.46, h: 1.3, drug: 'LOSARTAN 50MG TAB' },
  { t: 'bottle', x: 0.85, z: 2.1, r: 0.4, h: 1.0, drug: 'SERTRALINE 50MG' },
  { t: 'box', x: 2.2, z: 2.0, w: 1.3, d: 1.0, h: 1.6, drug: 'Atorvastatin', mg: '40 mg', qty: '90 Tablets', brand: BRAND.green },
  { t: 'box', x: 3.75, z: 2.0, w: 1.15, d: 1.0, h: 1.05, drug: 'Amoxicillin', mg: '500 mg', qty: '21 Capsules', brand: BRAND.orange },
];

const BG = 0x163d35;
const PX = 360; // texture pixels per world unit
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';

// ---------- Printed carton artwork ----------
function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(64, Math.round(w * PX));
  c.height = Math.max(64, Math.round(h * PX));
  return [c, c.getContext('2d')!] as const;
}
function tex(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function paperBase(g: CanvasRenderingContext2D, W: number, H: number) {
  g.fillStyle = '#f7f6f1';
  g.fillRect(0, 0, W, H);
  // faint paper grain
  for (let i = 0; i < (W * H) / 900; i++) {
    g.fillStyle = `rgba(0,0,0,${Math.random() * 0.025})`;
    g.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
  }
}
function fit(g: CanvasRenderingContext2D, text: string, weight: number, maxW: number, start: number) {
  let s = start;
  do {
    g.font = `${weight} ${s}px ${FONT}`;
    s -= 2;
  } while (g.measureText(text).width > maxW && s > 8);
  return s + 2;
}
export function frontArt(b: Carton, seed: number) {
  const [c, g] = canvas(b.w, b.h);
  const W = c.width;
  const H = c.height;
  paperBase(g, W, H);
  const pad = W * 0.08;
  // brand band + swoosh
  g.fillStyle = b.brand;
  g.fillRect(0, H * 0.7, W, H * 0.3);
  g.beginPath();
  g.moveTo(0, H * 0.7);
  g.bezierCurveTo(W * 0.35, H * 0.58, W * 0.7, H * 0.78, W, H * 0.62);
  g.lineTo(W, H * 0.7);
  g.closePath();
  g.fill();
  g.globalAlpha = 0.25;
  g.beginPath();
  g.moveTo(0, H * 0.66);
  g.bezierCurveTo(W * 0.4, H * 0.55, W * 0.7, H * 0.72, W, H * 0.56);
  g.lineTo(W, H * 0.62);
  g.bezierCurveTo(W * 0.7, H * 0.78, W * 0.35, H * 0.58, 0, H * 0.7);
  g.fill();
  g.globalAlpha = 1;
  // NDC + Rx only
  g.fillStyle = '#4a4f4c';
  g.font = `500 ${Math.round(W * 0.05)}px ${FONT}`;
  g.fillText(`NDC 00000-0${100 + seed}-${10 + (seed % 80)}`, pad, pad + W * 0.04);
  g.textAlign = 'right';
  g.fillStyle = b.brand;
  g.font = `700 ${Math.round(W * 0.055)}px ${FONT}`;
  g.fillText('Rx only', W - pad, pad + W * 0.04);
  g.textAlign = 'left';
  // drug name
  g.fillStyle = '#16211d';
  const ns = fit(g, b.drug, 700, W - pad * 2, Math.round(W * 0.16));
  g.font = `700 ${ns}px ${FONT}`;
  g.fillText(b.drug, pad, H * 0.3);
  g.fillStyle = '#58605c';
  g.font = `400 ${Math.round(W * 0.055)}px ${FONT}`;
  g.fillText(b.qty.includes('Capsule') ? 'Capsules, USP' : 'Tablets, USP', pad, H * 0.3 + W * 0.08);
  // strength
  g.fillStyle = b.brand;
  g.font = `700 ${Math.round(W * 0.13)}px ${FONT}`;
  g.fillText(b.mg, pad, H * 0.55);
  // bottom band text
  g.fillStyle = '#ffffff';
  g.font = `600 ${Math.round(W * 0.06)}px ${FONT}`;
  g.fillText(b.qty, pad, H * 0.9);
  // tiny maker mark
  g.textAlign = 'right';
  g.globalAlpha = 0.85;
  g.font = `600 ${Math.round(W * 0.045)}px ${FONT}`;
  g.fillText(['Northfield', 'Kestrel', 'Aurelia', 'Meridian'][seed % 4] + ' Pharma', W - pad, H * 0.9);
  g.globalAlpha = 1;
  g.textAlign = 'left';
  return tex(c);
}
export function sideArt(b: Carton, seed: number, back = false) {
  const [c, g] = canvas(b.d, b.h);
  const W = c.width;
  const H = c.height;
  paperBase(g, W, H);
  const pad = W * 0.1;
  g.fillStyle = b.brand;
  g.fillRect(0, 0, W, H * 0.06);
  g.fillRect(0, H * 0.94, W, H * 0.06);
  g.fillStyle = '#16211d';
  g.font = `700 ${Math.round(W * 0.1)}px ${FONT}`;
  g.fillText(b.drug, pad, H * 0.17);
  g.fillStyle = '#5c6460';
  g.font = `400 ${Math.round(W * 0.055)}px ${FONT}`;
  const lines = back
    ? ['Store at 20°–25°C (68°–77°F).', 'Keep out of reach of children.', 'Dispense in a tight container.']
    : [`Each tablet contains ${b.mg}`, `of ${b.drug.toLowerCase()}.`, 'See package insert for dosage.'];
  lines.forEach((l, i) => g.fillText(l, pad, H * 0.27 + i * W * 0.075));
  // barcode
  const bx = pad;
  const by = H * 0.6;
  const bw = W - pad * 2;
  const bh = H * 0.18;
  g.fillStyle = '#ffffff';
  g.fillRect(bx - 6, by - 6, bw + 12, bh + 40);
  g.fillStyle = '#111';
  let x = bx;
  let i = 0;
  while (x < bx + bw) {
    const w = ((i * 7 + seed * 3) % 4) + 1;
    if ((i + seed) % 3 !== 0) g.fillRect(x, by, w * 1.6, bh);
    x += w * 2.6;
    i++;
  }
  g.font = `500 ${Math.round(W * 0.045)}px ${FONT}`;
  g.fillText(`3 00000 ${100 + seed} ${10 + seed} 4`, bx, by + bh + W * 0.06);
  g.fillStyle = '#5c6460';
  g.fillText(`LOT ${4120 + seed * 7}A   EXP 09/2028`, pad, H * 0.9);
  return tex(c);
}
export function topArt(b: Carton) {
  const [c, g] = canvas(b.w, b.d);
  const W = c.width;
  const H = c.height;
  paperBase(g, W, H);
  g.fillStyle = b.brand;
  g.fillRect(0, H * 0.42, W, H * 0.16);
  // tuck flap seam
  g.strokeStyle = 'rgba(0,0,0,.12)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, H * 0.12);
  g.lineTo(W, H * 0.12);
  g.stroke();
  g.fillStyle = '#16211d';
  g.font = `700 ${Math.round(Math.min(W, H) * 0.14)}px ${FONT}`;
  g.fillText(b.drug, W * 0.06, H * 0.36);
  return tex(c);
}

// ---------- Prescription label ----------
export function rxLabel(drug: string, seed: number) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 384;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fbfbf7';
  g.fillRect(0, 0, 1024, 384);
  g.fillStyle = '#1d5043';
  g.fillRect(0, 0, 1024, 54);
  g.fillStyle = '#fff';
  g.font = `700 30px ${FONT}`;
  g.fillText('MAIN ST. PHARMACY', 300, 38);
  g.fillStyle = '#16211d';
  g.font = `600 26px ${FONT}`;
  g.fillText(`Rx# ${4410900 + seed * 37}`, 300, 98);
  g.font = `700 40px ${FONT}`;
  g.fillText(drug, 300, 152);
  g.font = `400 26px ${FONT}`;
  g.fillStyle = '#3d4743';
  g.fillText('TAKE 1 TABLET BY MOUTH DAILY', 300, 200);
  g.fillText(`QTY: ${[30, 90, 60][seed % 3]}     REFILLS: ${seed % 4}`, 300, 240);
  g.fillText('DR. A. PATEL', 300, 280);
  g.fillStyle = '#c9432c';
  g.fillRect(300, 300, 280, 40);
  g.fillStyle = '#fff';
  g.font = `700 22px ${FONT}`;
  g.fillText('MAY CAUSE DROWSINESS', 312, 328);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// ---------- Cap ridges (bump) ----------
export function ridgeBump() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 8;
  const g = c.getContext('2d')!;
  for (let x = 0; x < 256; x += 8) {
    const grd = g.createLinearGradient(x, 0, x + 8, 0);
    grd.addColorStop(0, '#000');
    grd.addColorStop(0.5, '#fff');
    grd.addColorStop(1, '#000');
    g.fillStyle = grd;
    g.fillRect(x, 0, 8, 8);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(3, 1);
  return t;
}

function fadeTexture() {
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

// ---------- AR "scan" tags ----------
function tagTexture(kind: 'ok' | 'bad', line1: string, line2: string) {
  const c = document.createElement('canvas');
  c.width = 560;
  c.height = 168;
  const g = c.getContext('2d')!;
  const r = 22;
  g.beginPath();
  g.moveTo(r, 6);
  g.arcTo(554, 6, 554, 162, r);
  g.arcTo(554, 162, 6, 162, r);
  g.arcTo(6, 162, 6, 6, r);
  g.arcTo(6, 6, 554, 6, r);
  g.closePath();
  g.fillStyle = kind === 'ok' ? 'rgba(10,38,32,.78)' : 'rgba(255,255,255,.94)';
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = kind === 'ok' ? 'rgba(143,240,189,.65)' : 'rgba(208,71,46,.9)';
  g.stroke();
  // status dot
  g.beginPath();
  g.arc(52, 84, 16, 0, Math.PI * 2);
  g.fillStyle = kind === 'ok' ? '#3fd68a' : '#d0472e';
  g.fill();
  if (kind === 'ok') {
    g.strokeStyle = '#0a2620';
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(44, 85);
    g.lineTo(50, 91);
    g.lineTo(61, 78);
    g.stroke();
  } else {
    g.fillStyle = '#fff';
    g.fillRect(49, 72, 6, 15);
    g.fillRect(49, 91, 6, 6);
  }
  g.fillStyle = kind === 'ok' ? '#e9fff3' : '#16211d';
  g.font = `700 46px ${FONT}`;
  g.fillText(line1, 88, 78);
  g.fillStyle = kind === 'ok' ? 'rgba(201,255,227,.75)' : '#a2402c';
  g.font = `500 34px ${FONT}`;
  g.fillText(line2, 88, 124);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,.5)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function mountPharmacyScene(host: HTMLElement, opts: { reduced: boolean; freeze?: number }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 20, 40);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.3;

  // Camera: low, close, cinematic perspective
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const camBase = new THREE.Vector3(9.4, 5.2, 10.6);
  const target = new THREE.Vector3(-0.5, 2.3, -0.6);
  camera.position.copy(camBase);
  camera.lookAt(target);

  // Lights: soft warm key (large, soft shadows), green rim, cool fill
  scene.add(new THREE.HemisphereLight(0xfff6ea, 0x0b2019, 0.25));
  const key = new THREE.DirectionalLight(0xfff1de, 2.2);
  key.position.set(-4, 12, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
  key.shadow.radius = 14;
  key.shadow.blurSamples = 20;
  key.shadow.bias = -0.0004;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6dffbc, 1.2);
  rim.position.set(-9, 5, -8);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xdfeee8, 0.35);
  fill.position.set(10, 3, 6);
  scene.add(fill);

  // Counter: semi-gloss dark green surface that catches reflections
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 90),
    new THREE.MeshPhysicalMaterial({ color: 0x173f36, roughness: 0.38, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Materials
  const paper = (map: THREE.Texture) =>
    new THREE.MeshPhysicalMaterial({ map, roughness: 0.62, clearcoat: 0.15, clearcoatRoughness: 0.6, sheen: 0.15 });
  const amber = new THREE.MeshPhysicalMaterial({
    color: 0xd98a2c,
    roughness: 0.12,
    transmission: 0.55,
    thickness: 0.5,
    ior: 1.5,
    attenuationColor: new THREE.Color(0x9a5208),
    attenuationDistance: 0.9,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });
  const bump = ridgeBump();
  const capMat = new THREE.MeshPhysicalMaterial({ color: 0xf6f6f2, roughness: 0.42, bumpMap: bump, bumpScale: 1.5, clearcoat: 0.3 });
  const capTopMat = new THREE.MeshPhysicalMaterial({ color: 0xf3f3ee, roughness: 0.45 });

  type Flash = { mats: THREE.MeshPhysicalMaterial[]; x: number; v: number };
  type Scan = { x: number; top: THREE.Vector3; short: number; tag: THREE.Sprite; line: THREE.Line; at: number };
  const scans: Scan[] = [];
  // AR tags live in their own overlay scene, drawn after post-processing
  const overlay = new THREE.Scene();
  const flashes: Flash[] = [];
  const anchors: Record<string, THREE.Vector3> = {};
  let shortageLight: THREE.PointLight | null = null;
  let shortagePos: THREE.Vector3 | null = null;

  ITEMS.forEach((it, i) => {
    if (it.t === 'box') {
      // BoxGeometry face order: +x, -x, +y, -y, +z, -z
      const side = sideArt(it, i);
      const back = sideArt(it, i + 2, true);
      const face = frontArt(it, i);
      const top = topArt(it);
      const mats = [paper(side), paper(back), paper(top), paper(top), paper(face), paper(face)];
      mats.forEach((m) => {
        m.emissive.setHex(0x34d68a);
        m.emissiveIntensity = 0;
      });
      const box = new THREE.Mesh(new THREE.BoxGeometry(it.w, it.h, it.d), mats);
      box.position.set(it.x, it.h / 2, it.z);
      box.castShadow = true;
      box.receiveShadow = true;
      scene.add(box);
      flashes.push({ mats, x: it.x, v: 0 });
      {
        const isShort = !!it.short;
        const units = [240, 90, 500, 180, 300, 120, 140][i % 7];
        const tag = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: isShort
              ? tagTexture('bad', `−${it.short} units`, it.drug)
              : tagTexture('ok', 'Matched', `${units} / ${units}`),
            transparent: true,
            depthWrite: false,
            depthTest: false,
            toneMapped: false,
            opacity: 0,
          }),
        );
        const sc = isShort ? 1.0 : 0.78;
        tag.scale.set(1.5 * sc, 0.45 * sc, 1);
        const top = new THREE.Vector3(it.x, it.h, it.z);
        tag.position.set(it.x, it.h + (isShort ? 0.95 : 0.7), it.z);
        tag.renderOrder = 10;
        overlay.add(tag);
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([top.clone().add(new THREE.Vector3(0, 0.02, 0)), tag.position.clone().add(new THREE.Vector3(0, -0.22 * sc, 0))]),
          new THREE.LineBasicMaterial({ color: isShort ? 0xff8a6c : 0x8ff0bd, transparent: true, opacity: 0, depthWrite: false, depthTest: false, toneMapped: false }),
        );
        overlay.add(line);
        scans.push({ x: it.x, top, short: it.short ?? 0, tag, line, at: -1 });
      }
      if (it.id) anchors[it.id] = new THREE.Vector3(it.x, it.h + 0.08, it.z);
      if (it.id === 'short') {
        shortagePos = new THREE.Vector3(it.x, 0.6, it.z + 0.9);
        shortageLight = new THREE.PointLight(0xff6a48, 6, 3.2, 1.8);
        shortageLight.position.copy(shortagePos);
        scene.add(shortageLight);
      }
    } else {
      const bodyH = it.h * 0.74;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(it.r, it.r * 0.98, bodyH, 64), amber);
      body.position.set(it.x, bodyH / 2, it.z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(it.r * 0.86, it.r, 0.1, 64), amber);
      neck.position.set(it.x, bodyH + 0.05, it.z);
      scene.add(neck);
      const label = new THREE.Mesh(
        new THREE.CylinderGeometry(it.r + 0.004, it.r * 0.98 + 0.004, bodyH * 0.6, 64, 1, true, -Math.PI * 0.05, Math.PI * 1.35),
        new THREE.MeshPhysicalMaterial({ map: rxLabel(it.drug, i), roughness: 0.55, side: THREE.DoubleSide }),
      );
      label.position.set(it.x, bodyH * 0.47, it.z);
      label.rotation.y = Math.PI * 0.12;
      label.castShadow = true;
      scene.add(label);
      const capH = it.h - bodyH - 0.08;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(it.r * 1.07, it.r * 1.07, capH, 72), [capMat, capTopMat, capTopMat]);
      cap.position.set(it.x, bodyH + 0.08 + capH / 2, it.z);
      cap.castShadow = true;
      scene.add(cap);
      const rimRing = new THREE.Mesh(new THREE.TorusGeometry(it.r * 1.04, 0.022, 10, 64), capTopMat);
      rimRing.rotation.x = Math.PI / 2;
      rimRing.position.set(it.x, bodyH + 0.08 + capH, it.z);
      scene.add(rimRing);
    }
  });

  // Floating BatchRx mark — built from the logo's real proportions:
  // four rounded squares turned 45°, centres 1.25 apart, side ≈ 1.01× that distance, corner radius ≈ 25% of the side.
  const LOGO = { d: 1.25, s: 1.27, r: 0.3, depth: 0.2, bevel: 0.035 };
  const tileShape = (() => {
    const { s: S, r: R } = LOGO;
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
    return sh;
  })();
  const tileGeo = new THREE.ExtrudeGeometry(tileShape, {
    depth: LOGO.depth,
    bevelEnabled: true,
    bevelThickness: LOGO.bevel,
    bevelSize: LOGO.bevel,
    bevelSegments: 4,
    curveSegments: 24,
  });
  tileGeo.center();
  tileGeo.rotateZ(Math.PI / 4);
  // index 0 = front/back faces, index 1 = sides (incl. bevel)
  // face finish: soft vertical sheen from white (top) to pale mint (bottom), in shape UV space
  const faceTex = (() => {
    const c = document.createElement('canvas');
    c.width = 8;
    c.height = 256;
    const g = c.getContext('2d')!;
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, '#d9f7e8');
    grd.addColorStop(1, '#ffffff');
    g.fillStyle = grd;
    g.fillRect(0, 0, 8, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    // ExtrudeGeometry face UVs are shape coordinates (−s/2…s/2); map them to 0…1
    t.repeat.set(1 / LOGO.s, 1 / LOGO.s);
    t.offset.set(0.5, 0.5);
    return t;
  })();
  const faceMat = new THREE.MeshPhysicalMaterial({
    map: faceTex,
    color: 0xffffff,
    roughness: 0.38,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
    sheen: 0.3,
    sheenColor: new THREE.Color(0x9ff5c8),
    emissive: 0x9ff5c8,
    emissiveIntensity: 0.32,
  });
  const edgeMat = new THREE.MeshPhysicalMaterial({
    color: 0x3fd68a,
    roughness: 0.25,
    clearcoat: 1,
    emissive: 0x26d07f,
    emissiveIntensity: 0.9,
  });
  const logo = new THREE.Group();
  const tiles: THREE.Mesh[] = [];
  [
    [0, LOGO.d],
    [-LOGO.d, 0],
    [LOGO.d, 0],
    [0, -LOGO.d],
  ].forEach(([x, y], k) => {
    const t = new THREE.Mesh(tileGeo, [faceMat, edgeMat]);
    t.position.set(x, y, 0);
    t.castShadow = true;
    t.userData = { x, y, k };
    logo.add(t);
    tiles.push(t);
  });
  // soft mint halo behind the mark
  const haloTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, 'rgba(120,255,190,.55)');
    grd.addColorStop(0.45, 'rgba(63,214,138,.18)');
    grd.addColorStop(1, 'rgba(63,214,138,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  })();
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 6.4),
    new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  halo.position.z = -0.4;
  logo.add(halo);

  const logoSpin = new THREE.Group(); // gentle sway
  logoSpin.add(logo);
  logo.rotation.x = -0.28; // tilt the top back slightly so the bevel catches light
  const logoPivot = new THREE.Group();
  logoPivot.add(logoSpin);
  logoPivot.position.set(-0.6, 4.35, -1.3);
  logoPivot.lookAt(camBase.x, 4.2, camBase.z);
  logoPivot.scale.setScalar(0.82);
  scene.add(logoPivot);
  // soft key light on the face of the mark
  const logoKey = new THREE.SpotLight(0xffffff, 24, 16, 0.34, 1.0, 1.6);
  logoKey.position.set(camBase.x * 0.55, 7.5, camBase.z * 0.55);
  logoKey.target.position.copy(logoPivot.position);
  scene.add(logoKey, logoKey.target);
  const logoLight = new THREE.PointLight(0x3fd68a, 4, 7, 2);
  logoLight.position.set(-0.6, 3.6, -1.0);
  scene.add(logoLight);
  const cone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 2.2, 4.4, 48, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x3fd68a,
      alphaMap: fadeTexture(),
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  cone.position.set(-0.6, 2.4, -1.3);
  scene.add(cone);

  // Scanner: a fan of light from the BatchRx mark down to a laser line on the counter
  const Z0 = -3.6;
  const Z1 = 2.9;
  const fanGeo = new THREE.BufferGeometry();
  fanGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9 * 2), 3));
  fanGeo.setAttribute(
    'color',
    new THREE.BufferAttribute(new Float32Array([0.05, 0.2, 0.12, 0.35, 1, 0.65, 0.35, 1, 0.65, 0.05, 0.2, 0.12, 0.35, 1, 0.65, 0.35, 1, 0.65]), 3),
  );
  const fan = new THREE.Mesh(
    fanGeo,
    new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  fan.frustumCulled = false;
  scene.add(fan);
  const laser = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.03, Z1 - Z0),
    new THREE.MeshBasicMaterial({ color: 0xe8fff2 }),
  );
  // bright edges of the fan (mark → both ends of the laser line)
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
  const fanEdges = new THREE.LineSegments(
    edgeGeo,
    new THREE.LineBasicMaterial({ color: 0x9dffd0, transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  fanEdges.frustumCulled = false;
  scene.add(fanEdges);
  laser.position.set(0, 0.02, (Z0 + Z1) / 2);
  scene.add(laser);
  const apex = new THREE.Vector3();

  // Dust motes drifting through the light
  const DUST = 280;
  const dustPos = new Float32Array(DUST * 3);
  const dustSeed = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    dustPos[i * 3] = -5 + Math.random() * 9;
    dustPos[i * 3 + 1] = 0.3 + Math.random() * 5;
    dustPos[i * 3 + 2] = -3.8 + Math.random() * 7;
    dustSeed[i] = Math.random() * 100;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      size: 0.045,
      map: dotTexture(),
      color: 0xd6ffe9,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  scene.add(dust);

  // Post: AO → depth of field → subtle bloom → output
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, 512, 512);
  gtao.output = GTAOPass.OUTPUT.Default;
  gtao.blendIntensity = 1.0;
  gtao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.5, thickness: 1.2, scale: 1.1, samples: 16 });
  composer.addPass(gtao);
  const focusDist = camBase.distanceTo(new THREE.Vector3(-1.05, 1.2, -0.35));
  const bokeh = new BokehPass(scene, camera, { focus: focusDist, aperture: 0.0005, maxblur: 0.004 });
  composer.addPass(bokeh);
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.22, 0.45, 0.96);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const tags = host.parentElement?.querySelectorAll<HTMLElement>('[data-anchor]') ?? [];

  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.fov = w / h < 0.9 ? 42 : 30;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    gtao.setSize(w, h);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  // HUD (DOM) hooks
  const stageEl = host.parentElement;
  const hud = {
    items: stageEl?.querySelector<HTMLElement>('[data-hud-items]'),
    short: stageEl?.querySelector<HTMLElement>('[data-hud-short]'),
    risk: stageEl?.querySelector<HTMLElement>('[data-hud-risk]'),
    state: stageEl?.querySelector<HTMLElement>('[data-hud-state]'),
    bar: stageEl?.querySelector<HTMLElement>('[data-hud-bar]'),
  };
  const PER_UNIT = 65; // illustrative $ at risk per unit
  let hudKey = '';

  const clock = new THREE.Clock();
  const CYCLE = 11;
  const SWEEP = 6;
  const X0 = -5.2;
  const X1 = 5.2;
  const tmp = new THREE.Vector3();
  const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  let raf = 0;
  let visible = true;
  const START = 1.8;

  const frame = () => {
    const t = opts.freeze ?? (opts.reduced ? 9.6 : clock.getElapsedTime());
    // scanning starts once the mark has assembled; timing is analytic (frame-rate independent)
    const st = Math.max(0, t - START);
    const started = t >= START;
    const phase = st % CYCLE;
    const sweeping = started && phase < SWEEP;
    const sx = X0 + (Math.min(phase, SWEEP) / SWEEP) * (X1 - X0);

    // logo fly-in (first 2s), then float
    const intro = ease(t / 2.2);
    tiles.forEach((tile) => {
      const { x, y, k } = tile.userData as { x: number; y: number; k: number };
      const out = 1 - intro;
      tile.position.set(x * (1 + out * 2.2), y * (1 + out * 2.2), out * 2.5);
      tile.rotation.z = out * (k % 2 ? 1 : -1) * 1.2;
    });
    logoPivot.position.y = 4.35 + Math.sin(t * 0.9) * 0.12;
    logoSpin.rotation.z = Math.sin(t * 0.35) * 0.06;
    logoLight.intensity = 4 + Math.sin(t * 0.9) * 1;

    // scanner fan from the mark
    tiles[3].getWorldPosition(apex);
    const fanOn = sweeping ? Math.sin((phase / SWEEP) * Math.PI) ** 0.4 : 0;
    const pa = fanGeo.attributes.position as THREE.BufferAttribute;
    pa.setXYZ(0, apex.x, apex.y, apex.z);
    pa.setXYZ(1, sx, 0.02, Z0);
    pa.setXYZ(2, sx, 0.02, (Z0 + Z1) / 2);
    pa.setXYZ(3, apex.x, apex.y, apex.z);
    pa.setXYZ(4, sx, 0.02, (Z0 + Z1) / 2);
    pa.setXYZ(5, sx, 0.02, Z1);
    pa.needsUpdate = true;
    (fan.material as THREE.MeshBasicMaterial).opacity = 0.75 * fanOn;
    const ea = edgeGeo.attributes.position as THREE.BufferAttribute;
    ea.setXYZ(0, apex.x, apex.y, apex.z);
    ea.setXYZ(1, sx, 0.03, Z0);
    ea.setXYZ(2, apex.x, apex.y, apex.z);
    ea.setXYZ(3, sx, 0.03, Z1);
    ea.needsUpdate = true;
    (fanEdges.material as THREE.LineBasicMaterial).opacity = 0.6 * fanOn;
    laser.position.x = sx;
    laser.visible = fanOn > 0.05;
    cone.visible = true;
    (cone.material as THREE.MeshBasicMaterial).opacity = 0.03 + 0.03 * fanOn;

    // flashes + tags
    let done = 0;
    let shorts = 0;
    let units = 0;
    for (const f of flashes) {
      const d = sweeping ? Math.abs(sx - f.x) : 9;
      f.v = Math.max(0, 1 - d / 0.6);
      for (const m of f.mats) m.emissiveIntensity = f.v * 0.25;
    }
    const fadeOut = phase > CYCLE - 1.4 ? 1 - (phase - (CYCLE - 1.4)) / 1.4 : 1;
    for (const sc of scans) {
      const cross = ((sc.x - X0) / (X1 - X0)) * SWEEP;
      const scanned = started && phase >= cross;
      if (!scanned) {
        (sc.tag.material as THREE.SpriteMaterial).opacity = 0;
        (sc.line.material as THREE.LineBasicMaterial).opacity = 0;
        continue;
      }
      done++;
      if (sc.short) {
        shorts++;
        units += sc.short;
      }
      const age = phase - cross;
      const pop = ease(age / 0.45);
      // matched tags blink in then settle away; shortage tags stay until the cycle ends
      const life = sc.short ? fadeOut : Math.max(0, 1 - Math.max(0, age - 1.4) / 0.8);
      const o = pop * life;
      (sc.tag.material as THREE.SpriteMaterial).opacity = o;
      const base = sc.short ? 1.0 : 0.78;
      sc.tag.scale.set(1.5 * base * (0.85 + 0.15 * pop), 0.45 * base * (0.85 + 0.15 * pop), 1);
      (sc.line.material as THREE.LineBasicMaterial).opacity = o * 0.8;
    }
    if (shortageLight) shortageLight.intensity = scans.some((x) => x.short && x.at >= 0) ? 4 + (Math.sin(t * 2.2) * 0.5 + 0.5) * 7 : 1.5;

    // dust drift
    const dp = dustGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < DUST; i++) {
      let y = dp.getY(i) + 0.0025;
      if (y > 5.4) y = 0.3;
      dp.setY(i, y);
      dp.setX(i, dp.getX(i) + Math.sin(t * 0.3 + dustSeed[i]) * 0.0015);
    }
    dp.needsUpdate = true;

    // HUD
    const key = `${done}|${shorts}|${sweeping}`;
    if (key !== hudKey) {
      hudKey = key;
      if (hud.items) hud.items.textContent = `${done}/${scans.length}`;
      if (hud.short) hud.short.textContent = String(shorts);
      if (hud.risk) hud.risk.textContent = '$' + (units * PER_UNIT * 2).toLocaleString('en-US');
      if (hud.state) hud.state.textContent = sweeping ? 'Reconciling' : done ? 'Reconciled' : 'Connecting';
      if (hud.bar) hud.bar.style.transform = `scaleX(${done / scans.length})`;
      stageEl?.classList.toggle('is-found', shorts > 0);
    }

    // camera: slow push-in on load, drift, pointer parallax
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    const push = 1 + (1 - ease(t / 3.2)) * 0.28;
    const drift = Math.sin(t * 0.1) * 0.5;
    camera.position.set(
      (camBase.x + drift + pointer.x * 0.9) * push,
      (camBase.y - pointer.y * 0.45) * push,
      (camBase.z - drift * 0.5 - pointer.x * 0.5) * push,
    );
    camera.lookAt(target);

    composer.render();
    renderer.autoClear = false;
    renderer.render(overlay, camera);
    renderer.autoClear = true;

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
