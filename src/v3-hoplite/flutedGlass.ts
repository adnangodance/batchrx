/**
 * BatchRx Fluted Glass WebGL Backdrop (Hoplite.sh architecture in BatchRx palette).
 *
 * - Warm clinical stone (#f3f3f1) upper field matching Version 1 seamlessly
 * - Sunlit diagonal aurora rising from bottom-left to top-right in BatchRx brand colors:
 *   luminous seafoam-mint (#8ff0bd) -> vibrant BatchRx emerald (#2ed482) ->
 *   rich clinical teal (#0f5c49) -> deep forest pine (#0d2b27) -> radiant white-mint
 * - Crisp 56px 15°-tilted glass reeds with optical step-refraction and
 *   gossamer-sharp 1.5px white specular rib edges.
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
varying vec2 vUv;

uniform vec2 uRes;
uniform vec2 uCssSize;
uniform float uTime;
uniform float uFlute;
uniform float uRise;
uniform float uPitch;

const vec2 ACROSS = vec2(0.9659258, 0.2588190);
const vec2 ALONG  = vec2(-0.2588190, 0.9659258);

// BatchRx signature botanical-clinical emerald & forest-teal palette
const vec3 GROUND       = vec3(0.953, 0.953, 0.945); // #f3f3f1 (exact V1 --lt)
const vec3 PURE_WHITE   = vec3(0.976, 0.996, 0.986); // airy mint-white core
const vec3 MINT_LIGHT   = vec3(0.561, 0.941, 0.741); // #8ff0bd (--glow-2)
const vec3 EMERALD_GLOW = vec3(0.180, 0.831, 0.510); // #2ed482 (vivid --glow)
const vec3 FOREST_TEAL  = vec3(0.067, 0.369, 0.294); // #115e4b (rich clinical teal)
const vec3 DEEP_PINE    = vec3(0.051, 0.169, 0.153); // #0d2b27 (--dk)

vec3 hueShift(vec3 c, float angle) {
  const vec3 k = vec3(0.57735);
  float co = cos(angle);
  return clamp(c * co + cross(k, c) * sin(angle) + k * dot(k, c) * (1.0 - co), 0.0, 1.0);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Smooth, airy luminous BatchRx emerald/teal ribbons sweeping from lower-left to upper-right
vec3 sampleAurora(vec2 pCss, float t, vec3 mintCol, vec3 emCol, vec3 tealCol) {
  vec2 n = pCss / max(uCssSize, vec2(1.0));
  float nx = clamp(n.x, -0.15, 1.25);

  // Sweeping diagonal ridge: low on the left, soaring high on the right
  float wave =
    0.045 * sin(nx * 4.8 + 0.40 * sin(t * 0.25)) +
    0.016 * sin(nx * 8.6 - t * 0.35);

  float ridgeY = 0.86 - 0.64 * smoothstep(0.0, 0.98, nx) + wave;
  float flare  = 0.72 + 0.56 * smoothstep(0.22, 1.0, nx);

  float d = (n.y - ridgeY) / flare;

  // Normalized additive-style weights so emerald/mint/teal stay crystal-clean (zero mud)
  float wMint    = smoothstep(-0.18, -0.02, d) * (1.0 - smoothstep(0.03, 0.14, d));
  float wEmerald = smoothstep(-0.04,  0.06, d) * (1.0 - smoothstep(0.14, 0.26, d));
  float wTeal    = smoothstep( 0.11,  0.21, d) * (1.0 - smoothstep(0.29, 0.42, d));
  float wPine    = smoothstep( 0.18,  0.26, d) * (1.0 - smoothstep(0.32, 0.44, d)) * 0.55;
  float wWhite   = smoothstep( 0.30,  0.48, d);

  float sum = wMint + wEmerald + wTeal + wPine + wWhite;
  float inv = sum > 1.0 ? 1.0 / sum : 1.0;
  wMint    *= inv;
  wEmerald *= inv;
  wTeal    *= inv;
  wPine    *= inv;
  wWhite   *= inv;
  float wGround = max(0.0, 1.0 - (wMint + wEmerald + wTeal + wPine + wWhite));

  vec3 col =
    GROUND     * wGround  +
    mintCol    * wMint    +
    emCol      * wEmerald +
    tealCol    * wTeal    +
    DEEP_PINE  * wPine    +
    PURE_WHITE * wWhite;

  // Soft sunlit luminosity boost along the mint-to-emerald crest
  float glow = exp(-pow((d - 0.06) / 0.16, 2.0)) * 0.10;
  col = mix(col, PURE_WHITE, glow);

  return col;
}

void main() {
  vec2 posCss = vUv * uCssSize;

  vec2 drift = vec2(sin(uTime * 0.14), cos(uTime * 0.10) * 0.55) * 14.0;
  drift += vec2(
    sin(posCss.y * 0.0036 + uTime * 0.40),
    cos(posCss.x * 0.0030 + uTime * 0.32)
  ) * 10.0;

  // Delicate emerald-to-cyan breath
  float shift = 0.055 * sin(uTime * 0.28 + vUv.x * 1.4 - vUv.y * 0.8);
  vec3 mintCol = hueShift(MINT_LIGHT, shift);
  vec3 emCol   = hueShift(EMERALD_GLOW, shift);
  vec3 tealCol = hueShift(FOREST_TEAL, shift);

  float pxStep = uCssSize.x / max(uRes.x, 1.0);
  vec3 accum = vec3(0.0);

  for (int i = 0; i < 4; i++) {
    vec2 g = posCss + ACROSS * (float(i) - 1.5) * 0.25 * pxStep;
    float s = dot(g, ACROSS);
    float u = fract(s / uPitch);

    float lens = (u - 0.5) * 2.0;
    float offAcross = (lens * 0.72 + lens * lens * lens * 0.28) * uPitch * 1.55 * uFlute;
    float offAlong  = (lens * lens - 0.35) * uPitch * 0.45 * uFlute;

    vec2 q = g + ACROSS * offAcross + ALONG * offAlong + drift + vec2(0.0, uRise);
    vec3 backdrop = sampleAurora(q, uTime, mintCol, emCol, tealCol);

    // Whisper-thin pure white glass edge catchlights + clean reed transparency
    float hairline = 0.46 * exp(-pow((u - 0.018) / 0.012, 2.0));
    float sheen    = 0.055 * exp(-pow((u - 0.10) / 0.09, 2.0));
    float backEdge = 0.14 * exp(-pow((u - 0.985) / 0.012, 2.0));
    float subtleTint = 1.0 - 0.022 * smoothstep(0.45, 0.96, u) * uFlute;

    float chroma = max(backdrop.r, max(backdrop.g, backdrop.b)) - min(backdrop.r, min(backdrop.g, backdrop.b));
    float edgeBoost = mix(0.40, 1.0, smoothstep(0.01, 0.20, chroma));

    vec3 reed = backdrop * subtleTint + vec3((hairline + sheen + backEdge) * uFlute * edgeBoost);
    accum += reed * 0.25;
  }

  accum += (hash(floor(vUv * uRes)) - 0.5) / 255.0;
  gl_FragColor = vec4(clamp(accum, 0.0, 1.0), 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type);
  if (!s) throw new Error('Shader alloc failed');
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) || 'Shader compile error');
  }
  return s;
}

function render2DFallback(canvas: HTMLCanvasElement, flute: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = (canvas.width = Math.max(300, Math.round(canvas.clientWidth * dpr)));
  const h = (canvas.height = Math.max(200, Math.round(canvas.clientHeight * dpr)));
  const grad = ctx.createLinearGradient(0, h * 0.88, w * 0.92, h * 0.12);
  grad.addColorStop(0, '#f3f3f1');
  grad.addColorStop(0.38, '#8ff0bd');
  grad.addColorStop(0.54, '#2ed482');
  grad.addColorStop(0.74, '#115e4b');
  grad.addColorStop(0.92, '#f7fdf9');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  if (flute > 0) {
    const pitch = Math.round(56 * dpr);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(0.26);
    for (let x = -w; x < w; x += pitch) {
      const g = ctx.createLinearGradient(x, 0, x + pitch, 0);
      g.addColorStop(0, 'rgba(255,255,255,0.52)');
      g.addColorStop(0.04, 'rgba(255,255,255,0.08)');
      g.addColorStop(0.94, 'rgba(13,43,39,0.03)');
      g.addColorStop(1, 'rgba(255,255,255,0.22)');
      ctx.fillStyle = g;
      ctx.fillRect(x, -h * 1.5, pitch, h * 3);
    }
    ctx.restore();
  }
}

export function mountFlutedGlass(canvas: HTMLCanvasElement): () => void {
  const flute = Number(canvas.dataset.flute ?? '1');
  const pitch = Number(canvas.dataset.pitch ?? '56');
  const doRise = canvas.dataset.rise !== undefined;

  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch {
    gl = null;
  }

  if (!gl) {
    render2DFallback(canvas, flute);
    return () => {};
  }

  let prog: WebGLProgram | null = null;
  try {
    prog = gl.createProgram();
    if (!prog) throw new Error('Program failed');
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) || 'Link failed');
    }
  } catch {
    render2DFallback(canvas, flute);
    return () => {};
  }

  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uCssSize = gl.getUniformLocation(prog, 'uCssSize');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uFlute = gl.getUniformLocation(prog, 'uFlute');
  const uRise = gl.getUniformLocation(prog, 'uRise');
  const uPitch = gl.getUniformLocation(prog, 'uPitch');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true;
  let raf = 0;
  let elapsed = 0;
  let last = performance.now();
  const start = last;

  const draw = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reduced) elapsed += dt;

    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const cssW = Math.max(1, canvas.clientWidth);
    const cssH = Math.max(1, canvas.clientHeight);
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const riseProgress = doRise && !reduced ? Math.min(1, (now - start) / 1600) : 1;
    const riseOffset = 180 * Math.pow(1 - riseProgress, 3);

    gl!.viewport(0, 0, w, h);
    gl!.uniform2f(uRes, w, h);
    gl!.uniform2f(uCssSize, cssW, cssH);
    gl!.uniform1f(uTime, elapsed);
    gl!.uniform1f(uFlute, flute);
    gl!.uniform1f(uRise, riseOffset);
    gl!.uniform1f(uPitch, pitch);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);

    if (!reduced && visible) {
      raf = requestAnimationFrame(draw);
    }
  };

  const io = new IntersectionObserver(
    ([entry]) => {
      visible = !!entry?.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(draw);
      } else if (!visible && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    { rootMargin: '150px 0px' },
  );
  io.observe(canvas);
  raf = requestAnimationFrame(draw);

  return () => {
    io.disconnect();
    if (raf) cancelAnimationFrame(raf);
  };
}
