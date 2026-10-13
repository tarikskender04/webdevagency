const { useEffect, useRef } = React;

/* Strands + Prism (React Bits, ogl) ported to this project: no npm imports,
   no CSS files, ogl loaded from the CDN the same way Aurora.jsx does. */

let oglPromise = null;
function loadOgl() {
  if (window.ogl) return Promise.resolve(window.ogl);
  if (!oglPromise) {
    oglPromise = new Promise((resolve, reject) => {
      const done = () => (window.ogl ? resolve(window.ogl) : reject(new Error('ogl missing')));
      window.addEventListener('ogl-ready', done, { once: true });
      const s = document.createElement('script');
      s.type = 'module';
      s.textContent =
        "import * as ogl from 'https://esm.sh/ogl@1.0.11';" +
        "window.ogl = ogl; window.dispatchEvent(new Event('ogl-ready'));";
      s.onerror = () => reject(new Error('ogl failed to load'));
      document.head.appendChild(s);
    });
  }
  return oglPromise;
}

const num = (v, d) => { const n = typeof v === 'number' ? v : parseFloat(v); return Number.isFinite(n) ? n : d; };
const bool = (v, d) => (v === undefined || v === null || v === '' ? d : v === true || v === 'true');
const toList = (v, fallback) => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.indexOf('#') >= 0) return v.split(',').map(s => s.trim()).filter(Boolean);
  return fallback;
};

/* ── Strands ───────────────────────────────────────────────────────────── */
const MAX_STRANDS = 12;
const MAX_COLORS = 8;

const S_VERT = `#version 300 es
in vec2 position;
void main(){ gl_Position = vec4(position, 0.0, 1.0); }
`;

const S_FRAG = `#version 300 es
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uColorCount;
uniform int uStrandCount;
uniform float uSpeed, uAmplitude, uWaviness, uThickness, uGlow, uTaper, uSpread;
uniform float uHueShift, uIntensity, uOpacity, uScale, uSaturation, uLightMode;
out vec4 fragColor;
const float PI = 3.14159265;

vec3 spectrum(float t){ return 0.5 + 0.5 * cos(2.0 * PI * (t + vec3(0.00, 0.33, 0.67))); }
vec3 samplePalette(float t){
  t = fract(t);
  float scaled = t * float(uColorCount);
  int idx = int(floor(scaled));
  float blend = fract(scaled);
  int nextIdx = idx + 1;
  if (nextIdx >= uColorCount) nextIdx = 0;
  return mix(uColors[idx], uColors[nextIdx], blend);
}
vec3 strandColor(float t){ if (uColorCount > 0) return samplePalette(t); return spectrum(t); }

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  uv /= max(uScale, 0.0001);
  float e = 0.06 + uIntensity * 0.94;
  float env = pow(max(cos(uv.x * PI * 1.3), 0.0), uTaper);
  vec3 col = vec3(0.0);
  for (int i = 0; i < ${MAX_STRANDS}; i++) {
    if (i >= uStrandCount) break;
    float fi = float(i);
    float ph = fi * 1.7 * uSpread;
    float freq = (2.0 + fi * 0.35) * uWaviness;
    float spd = 1.4 + fi * 1.2;
    float tt = uTime * uSpeed;
    float w = sin(uv.x * freq + tt * spd + ph) * 0.60
            + sin(uv.x * freq * 1.1 - tt * spd * 0.7 + ph * 1.7) * 0.40;
    float amp = (0.1 + 0.02 * e) * env * uAmplitude;
    float y = w * amp;
    float d = abs(uv.y - y);
    float thick = (0.001 + 0.05 * e) * (0.35 + env) * uThickness;
    float g = thick / (d + thick * 0.45);
    g = g * g;
    float h = fi / float(uStrandCount) + uv.x * 0.30 + uTime * 0.04 + uHueShift;
    col += strandColor(h) * g * env;
  }
  col *= 0.45 + 0.7 * e;
  col = 1.0 - exp(-col * uGlow);
  float gray = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(mix(vec3(gray), col, uSaturation), 0.0);
  float lum = max(max(col.r, col.g), col.b);
  float alpha = clamp(lum, 0.0, 1.0) * uOpacity;
  if (uLightMode > 0.5) {
    // ink-on-white: keep the hue, invert the luminance so strands read on a light ground
    vec3 chroma = col / max(lum, 0.0001);
    vec3 onWhite = mix(vec3(1.0), chroma, clamp(lum, 0.0, 1.0));
    fragColor = vec4(onWhite * alpha, alpha);
  } else {
    fragColor = vec4(col * uOpacity, alpha);
  }
}
`;

function Strands(props) {
  const ctn = useRef(null);
  const p = useRef(props); p.current = props;
  useEffect(() => {
    const el = ctn.current; if (!el) return;
    let teardown = () => {};
    let alive = true;
    loadOgl().then(({ Renderer, Program, Mesh, Color, Triangle }) => {
      if (!alive) return;
      const renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: true });
      const gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.canvas.style.cssText = 'display:block;width:100%;height:100%;background:transparent';

      const geometry = new Triangle(gl);
      if (geometry.attributes.uv) delete geometry.attributes.uv;

      const palette = list => {
        const filled = list && list.length ? list : ['#ffffff'];
        const out = [];
        for (let i = 0; i < MAX_COLORS; i++) {
          const c = new Color(filled[i] ?? filled[filled.length - 1]);
          out.push([c.r, c.g, c.b]);
        }
        return out;
      };
      const read = () => {
        const c = p.current;
        return {
          colors: toList(c.colors, ['#0C7CC4', '#2BD2C8', '#9CCCEB']),
          count: num(c.count, 3), speed: num(c.speed, 0.45), amplitude: num(c.amplitude, 1),
          waviness: num(c.waviness, 1), thickness: num(c.thickness, 0.7), glow: num(c.glow, 2.2),
          taper: num(c.taper, 3), spread: num(c.spread, 1), hueShift: num(c.hueShift, 0),
          intensity: num(c.intensity, 0.55), saturation: num(c.saturation, 1.2),
          opacity: num(c.opacity, 1), scale: num(c.scale, 1.5), lightMode: bool(c.lightMode, false)
        };
      };
      const v = read();
      const program = new Program(gl, {
        vertex: S_VERT, fragment: S_FRAG,
        uniforms: {
          uTime: { value: 0 }, uResolution: { value: [el.offsetWidth, el.offsetHeight] },
          uColors: { value: palette(v.colors) }, uColorCount: { value: Math.min(v.colors.length, MAX_COLORS) },
          uStrandCount: { value: Math.min(v.count, MAX_STRANDS) }, uSpeed: { value: v.speed },
          uAmplitude: { value: v.amplitude }, uWaviness: { value: v.waviness }, uThickness: { value: v.thickness },
          uGlow: { value: v.glow }, uTaper: { value: v.taper }, uSpread: { value: v.spread },
          uHueShift: { value: v.hueShift }, uIntensity: { value: v.intensity }, uOpacity: { value: v.opacity },
          uScale: { value: v.scale }, uSaturation: { value: v.saturation }, uLightMode: { value: v.lightMode ? 1 : 0 }
        }
      });
      const mesh = new Mesh(gl, { geometry, program });
      el.appendChild(gl.canvas);

      let retryId = 0;
      const resize = () => {
        const w = el.offsetWidth || 1, h = el.offsetHeight || 1;
        renderer.setSize(w, h);
        program.uniforms.uResolution.value = [w, h];
        if ((w <= 1 || h <= 1) && retryId < 40) { retryId++; setTimeout(resize, 50); }
      };
      window.addEventListener('resize', resize);
      resize();
      let ro = null;
      if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(resize); ro.observe(el); }
      requestAnimationFrame(resize);
      setTimeout(resize, 150);

      let raf = 0;
      const update = t => {
        raf = requestAnimationFrame(update);
        const c = read(), u = program.uniforms;
        u.uTime.value = t * 0.001;
        u.uColors.value = palette(c.colors);
        u.uColorCount.value = Math.min(c.colors.length, MAX_COLORS);
        u.uStrandCount.value = Math.min(Math.max(Math.round(c.count), 1), MAX_STRANDS);
        u.uSpeed.value = c.speed; u.uAmplitude.value = c.amplitude; u.uWaviness.value = c.waviness;
        u.uThickness.value = c.thickness; u.uGlow.value = c.glow; u.uTaper.value = c.taper;
        u.uSpread.value = c.spread; u.uHueShift.value = c.hueShift; u.uIntensity.value = c.intensity;
        u.uOpacity.value = c.opacity; u.uScale.value = c.scale; u.uSaturation.value = c.saturation;
        u.uLightMode.value = c.lightMode ? 1 : 0;
        renderer.render({ scene: mesh });
      };
      raf = requestAnimationFrame(update);

      teardown = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        if (ro) ro.disconnect();
        if (gl.canvas.parentNode === el) el.removeChild(gl.canvas);
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      };
    }).catch(() => {});
    return () => { alive = false; teardown(); };
  }, []);
  return <div ref={ctn} style={{ position: 'relative', width: '100%', height: '100%', background: 'transparent', ...(props.style || {}) }} />;
}

/* ── Prism ─────────────────────────────────────────────────────────────── */
const P_VERT = `
attribute vec2 position;
void main(){ gl_Position = vec4(position, 0.0, 1.0); }
`;

const P_FRAG = `
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uHeight, uBaseHalf, uGlow, uNoise, uSaturation, uScale, uHueShift;
uniform float uColorFreq, uBloom, uCenterShift, uInvBaseHalf, uInvHeight, uMinAxis, uPxScale;
uniform float uTimeScale, uLightMode;
uniform mat3 uRot;
uniform int uUseBaseWobble;
uniform vec2 uOffsetPx;

vec4 tanh4(vec4 x){ vec4 e2x = exp(2.0*x); return (e2x - 1.0) / (e2x + 1.0); }
float rand(vec2 co){ return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123); }
float sdOctaAnisoInv(vec3 p){
  vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);
  float m = q.x + q.y + q.z - 1.0;
  return m * uMinAxis * 0.5773502691896258;
}
float sdPyramidUpInv(vec3 p){ return max(sdOctaAnisoInv(p), -p.y); }
mat3 hueRotation(float a){
  float c = cos(a), s = sin(a);
  mat3 W = mat3(0.299,0.587,0.114, 0.299,0.587,0.114, 0.299,0.587,0.114);
  mat3 U = mat3(0.701,-0.587,-0.114, -0.299,0.413,-0.114, -0.300,-0.588,0.886);
  mat3 V = mat3(0.168,-0.331,0.500, 0.328,0.035,-0.500, -0.497,0.296,0.201);
  return W + U * c + V * s;
}
void main(){
  vec2 f = (gl_FragCoord.xy - 0.5 * iResolution.xy - uOffsetPx) * uPxScale;
  float z = 5.0, d = 0.0;
  vec3 p; vec4 o = vec4(0.0);
  mat2 wob = mat2(1.0);
  if (uUseBaseWobble == 1) {
    float t = iTime * uTimeScale;
    wob = mat2(cos(t), cos(t + 33.0), cos(t + 11.0), cos(t));
  }
  for (int i = 0; i < 100; i++) {
    p = vec3(f, z);
    p.xz = p.xz * wob;
    p = uRot * p;
    vec3 q = p; q.y += uCenterShift;
    d = 0.1 + 0.2 * abs(sdPyramidUpInv(q));
    z -= d;
    o += (sin((p.y + z) * uColorFreq + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0) / d;
  }
  o = tanh4(o * o * (uGlow * uBloom) / 1e5);
  vec3 col = o.rgb;
  col += (rand(gl_FragCoord.xy + vec2(iTime)) - 0.5) * uNoise;
  col = clamp(col, 0.0, 1.0);
  float L = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = clamp(mix(vec3(L), col, uSaturation), 0.0, 1.0);
  if (abs(uHueShift) > 0.0001) col = clamp(hueRotation(uHueShift) * col, 0.0, 1.0);
  if (uLightMode > 0.5) {
    float peak = max(col.r, max(col.g, col.b));
    vec3 chroma = pow(clamp(col / max(peak, 0.0001), 0.0, 1.0), vec3(1.14));
    gl_FragColor = vec4(mix(vec3(1.0), chroma, o.a * 0.94), 1.0);
  } else {
    gl_FragColor = vec4(col, o.a);
  }
}
`;

function Prism(props) {
  const ctn = useRef(null);
  const p = useRef(props); p.current = props;
  useEffect(() => {
    const container = ctn.current; if (!container) return;
    let teardown = () => {};
    let alive = true;
    loadOgl().then(({ Renderer, Program, Mesh, Triangle }) => {
      if (!alive) return;
      const c = p.current;
      const H = Math.max(0.001, num(c.height, 3.5));
      const BASE_HALF = Math.max(0.001, num(c.baseWidth, 5.5)) * 0.5;
      const animationType = c.animationType || 'rotate';
      const transparent = bool(c.transparent, true);
      const SCALE = Math.max(0.001, num(c.scale, 3.6));
      const TS = Math.max(0, num(c.timeScale, 0.4));
      const HOVSTR = Math.max(0, num(c.hoverStrength, 2));
      const INERT = Math.min(1, Math.max(0, num(c.inertia, 0.06)));
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      const renderer = new Renderer({ dpr, alpha: transparent, antialias: false, webgl: 1 });
      const gl = renderer.gl;
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND);
      Object.assign(gl.canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' });
      container.appendChild(gl.canvas);

      const geometry = new Triangle(gl);
      const iResBuf = new Float32Array(2);
      const offsetPxBuf = new Float32Array(2);
      const program = new Program(gl, {
        vertex: P_VERT, fragment: P_FRAG,
        uniforms: {
          iResolution: { value: iResBuf }, iTime: { value: 0 },
          uHeight: { value: H }, uBaseHalf: { value: BASE_HALF },
          uUseBaseWobble: { value: animationType === 'rotate' ? 1 : 0 },
          uRot: { value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]) },
          uGlow: { value: Math.max(0, num(c.glow, 1)) }, uOffsetPx: { value: offsetPxBuf },
          uNoise: { value: Math.max(0, num(c.noise, 0.3)) },
          uSaturation: { value: transparent ? 1.5 : 1 }, uScale: { value: SCALE },
          uHueShift: { value: num(c.hueShift, 0) }, uColorFreq: { value: Math.max(0, num(c.colorFrequency, 1)) },
          uBloom: { value: Math.max(0, num(c.bloom, 1)) }, uCenterShift: { value: H * 0.25 },
          uInvBaseHalf: { value: 1 / BASE_HALF }, uInvHeight: { value: 1 / H },
          uMinAxis: { value: Math.min(BASE_HALF, H) },
          uPxScale: { value: 1 / ((gl.drawingBufferHeight || 1) * 0.1 * SCALE) },
          uTimeScale: { value: TS }, uLightMode: { value: bool(c.lightMode, false) ? 1 : 0 }
        }
      });
      const mesh = new Mesh(gl, { geometry, program });

      const resize = () => {
        renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
        iResBuf[0] = gl.drawingBufferWidth; iResBuf[1] = gl.drawingBufferHeight;
        offsetPxBuf[0] = num(p.current.offsetX, 0) * dpr;
        offsetPxBuf[1] = num(p.current.offsetY, 0) * dpr;
        program.uniforms.uPxScale.value = 1 / ((gl.drawingBufferHeight || 1) * 0.1 * SCALE);
      };
      const ro = new ResizeObserver(resize); ro.observe(container); resize();

      const rotBuf = new Float32Array(9);
      const setMat3 = (yawY, pitchX, rollZ, out) => {
        const cy = Math.cos(yawY), sy = Math.sin(yawY);
        const cx = Math.cos(pitchX), sx = Math.sin(pitchX);
        const cz = Math.cos(rollZ), sz = Math.sin(rollZ);
        out[0] = cy * cz + sy * sx * sz; out[1] = cx * sz; out[2] = -sy * cz + cy * sx * sz;
        out[3] = -cy * sz + sy * sx * cz; out[4] = cx * cz; out[5] = sy * sz + cy * sx * cz;
        out[6] = sy * cx; out[7] = -sx; out[8] = cy * cx;
        return out;
      };
      const rnd = () => Math.random();
      const wX = 0.3 + rnd() * 0.6, wY = 0.2 + rnd() * 0.7, wZ = 0.1 + rnd() * 0.5;
      const phX = rnd() * Math.PI * 2, phZ = rnd() * Math.PI * 2;
      let yaw = 0, pitch = 0, roll = 0;
      const lerp = (a, b, t) => a + (b - a) * t;
      const pointer = { x: 0, y: 0, inside: false };
      const onMove = e => {
        const ww = Math.max(1, window.innerWidth), wh = Math.max(1, window.innerHeight);
        pointer.x = Math.max(-1, Math.min(1, (e.clientX - ww * 0.5) / (ww * 0.5)));
        pointer.y = Math.max(-1, Math.min(1, (e.clientY - wh * 0.5) / (wh * 0.5)));
        pointer.inside = true;
      };
      const onLeave = () => { pointer.inside = false; };
      if (animationType === 'hover') {
        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('mouseleave', onLeave);
        window.addEventListener('blur', onLeave);
      }

      let raf = 0;
      const t0 = performance.now();
      const render = t => {
        const time = (t - t0) * 0.001;
        program.uniforms.iTime.value = time;
        if (animationType === 'hover') {
          const target = 0.6 * HOVSTR;
          yaw = lerp(yaw, (pointer.inside ? -pointer.x : 0) * target, INERT);
          pitch = lerp(pitch, (pointer.inside ? pointer.y : 0) * target, INERT);
          roll = lerp(roll, 0, 0.1);
          program.uniforms.uRot.value = setMat3(yaw, pitch, roll, rotBuf);
        } else if (animationType === '3drotate') {
          const ts = time * TS;
          program.uniforms.uRot.value = setMat3(ts * wY, Math.sin(ts * wX + phX) * 0.6, Math.sin(ts * wZ + phZ) * 0.5, rotBuf);
        } else {
          rotBuf.set([1, 0, 0, 0, 1, 0, 0, 0, 1]);
          program.uniforms.uRot.value = rotBuf;
        }
        renderer.render({ scene: mesh });
        raf = requestAnimationFrame(render);
      };
      raf = requestAnimationFrame(render);

      teardown = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        if (animationType === 'hover') {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('mouseleave', onLeave);
          window.removeEventListener('blur', onLeave);
        }
        if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      };
    }).catch(() => {});
    return () => { alive = false; teardown(); };
  }, []);
  return <div ref={ctn} style={{ position: 'relative', width: '100%', height: '100%', ...(props.style || {}) }} />;
}

module.exports = { Strands, Prism };
