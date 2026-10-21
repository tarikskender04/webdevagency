import { useEffect, useRef, type JSX } from 'react';
import { vert, frag } from '../effects/aurora-shaders';
import { curtainFrag } from '../effects/aurora-curtain-shader';

interface Props {
  amplitude?: number;
  speed?: number;
  variant?: 'wash' | 'curtain';
  colorStops?: readonly string[];
  darkColorStops?: readonly string[];
  blend?: number;
  height?: number;
  scale?: number;
  glow?: number;
  brightness?: number;
  layers?: number;
  direction?: 'top' | 'bottom';
  lightMode?: boolean;
  opacity?: number;
  intro?: boolean;
  mouseInteraction?: boolean;
  /** Follow a comma-separated `data-stops` on the nearest ancestor that has one, easing to each new palette over `transition` ms. */
  liveStops?: boolean;
  transition?: number;
}
const DEFAULT_STOPS = ['#FFFFFF', '#9CCCEB', '#0C7CC4'];
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const toLab = (rgb: readonly number[]): number[] => {
  const [r, g, b] = rgb.map(c => c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4));
  const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b);
  const m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b);
  const s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
  return [.2104542553 * l + .793617785 * m - .0040720468 * s, 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, .0259040371 * l + .7827717662 * m - .808675766 * s];
};
// The supplied shader blends in OKLCH. Preserve hue continuity between stops.
const toPalette = (labs: readonly (readonly number[])[]): Float32Array => {
  const stops = labs.map(([lightness, a, b]) => [lightness, Math.hypot(a, b), Math.atan2(b, a)]);
  let previous = stops.find(stop => stop[1] > .02)?.[2] ?? 0;
  const palette = new Float32Array(15);
  stops.forEach(([lightness, chroma, angle], index) => {
    let hue = chroma > .02 ? angle : previous;
    while (hue - previous > Math.PI) hue -= Math.PI * 2;
    while (hue - previous < -Math.PI) hue += Math.PI * 2;
    previous = hue;
    palette.set([lightness, chroma, hue], index * 3);
  });
  return palette;
};
const mixStops = (from: readonly (readonly number[])[], to: readonly (readonly number[])[], t: number): number[][] =>
  to.map((stop, index) => stop.map((value, channel) => (from[index] ?? stop)[channel] + (value - (from[index] ?? stop)[channel]) * t));

export function Aurora({
  amplitude = 1.1, speed = .3, variant = 'wash', colorStops = DEFAULT_STOPS, darkColorStops,
  blend = .55, height = .45, scale = 1, glow = .6, brightness = 1, layers = 1,
  direction = 'top', lightMode = true, opacity = 1, intro = true, mouseInteraction = false,
  liveStops = false, transition = 1800,
}: Props): JSX.Element {
  const container = useRef<HTMLDivElement>(null);
  const paletteKey = colorStops.join(',');
  const darkPaletteKey = darkColorStops?.join(',');
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Astro wraps the island in its own element, so the stops live on an ancestor, not necessarily the parent.
    const stopsSource = liveStops ? element.parentElement?.closest<HTMLElement>('[data-stops]') : null;
    let disposed = false;
    let generation = 0;
    let reduced = motion.matches;
    let cleanup = (): void => {};
    const syncMotion = (): void => {
      const current = ++generation;
      cleanup();
      cleanup = (): void => {};
      if (motion.matches) return;
      void import('ogl').then(({ Renderer, Program, Mesh, Color, Triangle }) => {
        if (disposed || current !== generation || motion.matches) return;
        let renderer: InstanceType<typeof Renderer>;
        // The glow is a soft blur, so phones render it at 1x: less than half the pixels, no visible difference.
        try { renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: false, dpr: Math.min(window.devicePixelRatio, matchMedia('(max-width: 760px)').matches ? 1 : 1.5), webgl: 2 }); }
        catch { return; }
        const gl = renderer.gl;
        const geometry = new Triangle(gl);
        const getPalette = (): { colors: number[][]; night: boolean } => {
          const night = Boolean(darkPaletteKey && document.documentElement.dataset.theme === 'dark');
          const live = stopsSource?.dataset.stops;
          const stops = (live || (night ? darkPaletteKey! : paletteKey)).split(',').map(stop => stop.trim()).filter(Boolean).slice(0, 5);
          if (stops.length < 2) stops.push(stops[0] || '#0C7CC4', '#9CCCEB');
          return { colors: stops.map(hex => [...new Color(hex)]), night };
        };
        const { colors, night } = getPalette();
        const curtain = variant === 'curtain';
        const program = new Program(gl, {
          vertex: vert, fragment: curtain ? curtainFrag : frag,
          uniforms: {
            uTime: { value: 0 }, uAmplitude: { value: Math.max(0, amplitude) }, uBlend: { value: clamp(blend, 0, 1) }, uLightMode: { value: !night && lightMode ? 1 : 0 },
            uColorStops: { value: Array.from({ length: 3 }, (_, index) => colors[Math.min(index, colors.length - 1)]) },
            // OGL identifies uniform arrays through Array.isArray, including flat palettes.
            uStops: { value: Array.from(toPalette(colors.map(toLab))) }, uStopCount: { value: colors.length },
            uResolution: { value: [1, 1] },
            uHeight: { value: clamp(height, 0, 1) }, uScale: { value: Math.max(.1, scale) },
            uGlow: { value: Math.max(0, glow) }, uBrightness: { value: Math.max(0, brightness) },
            uLayers: { value: clamp(Math.round(layers), 1, 3) }, uFlip: { value: direction === 'bottom' ? 1 : 0 },
            uPointer: { value: [0, .5, 0] }, uReveal: { value: intro ? 0 : 1 }, uOpacity: { value: clamp(opacity, 0, 1) },
          },
        });
        const mesh = new Mesh(gl, { geometry, program });
        element.appendChild(gl.canvas);
        let frame = 0;
        let visible = false;
        let previous = 0;
        let last = 0;
        let clock = 0;
        let reveal = intro ? 0 : 1;
        // The palette shown, in OKLab and sRGB, with its day/night render mode, and the tween towards the latest one.
        // The curtain blends its day and night output by uLightMode, so a theme change eases rather than flips.
        let shown = { labs: colors.map(toLab), rgbs: colors, light: !night && lightMode ? 1 : 0 };
        let tween: { from: typeof shown; to: typeof shown; start: number } | undefined;
        const applyPalette = ({ labs, rgbs, light }: typeof shown): void => {
          program.uniforms.uColorStops.value = Array.from({ length: 3 }, (_, index) => rgbs[Math.min(index, rgbs.length - 1)]);
          program.uniforms.uStops.value = Array.from(toPalette(labs));
          program.uniforms.uStopCount.value = labs.length;
          program.uniforms.uLightMode.value = light;
        };
        const stepTween = (time: number): void => {
          if (!tween) return;
          const t = clamp((time - tween.start) / Math.max(1, transition), 0, 1);
          const eased = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          const { from, to } = tween;
          shown = { labs: mixStops(from.labs, to.labs, eased), rgbs: mixStops(from.rgbs, to.rgbs, eased), light: from.light + (to.light - from.light) * eased };
          applyPalette(shown);
          if (t >= 1) tween = undefined;
        };
        const pointer = { x: 0, y: .5, inside: false };
        const follow = [0, .5, 0];
        const draw = (time: number): void => {
          frame = 0;
          if (motion.matches !== reduced) { checkMotion(); return; }
          if (!visible || document.hidden || motion.matches) return;
          const dt = last ? clamp((time - last) * .001, 0, .05) : 1 / 60;
          last = time;
          clock += dt * speed;
          reveal = Math.min(1, reveal + dt / 2.4);
          const ease = 1 - Math.exp(-dt / .6);
          follow[0] += (pointer.x - follow[0]) * ease;
          follow[1] += (pointer.y - follow[1]) * ease;
          follow[2] += ((pointer.inside ? 1 : 0) - follow[2]) * ease;
          if (time - previous > 32) {
            stepTween(time);
            program.uniforms.uTime.value = curtain ? clock : time * .001 * speed;
            program.uniforms.uReveal.value = 1 - Math.pow(1 - reveal, 3);
            program.uniforms.uPointer.value = follow;
            renderer.render({ scene: mesh });
            previous = time;
          }
          frame = requestAnimationFrame(draw);
        };
        const resume = (): void => { cancelAnimationFrame(frame); frame = 0; last = 0; if (visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(draw); };
        const syncPalette = (): void => {
          const { colors, night } = getPalette();
          const next = { labs: colors.map(toLab), rgbs: colors, light: !night && lightMode ? 1 : 0 };
          // Ease while the loop runs; otherwise (hidden, offscreen) land on the new palette at once.
          if (frame && next.labs.length === shown.labs.length) { tween = { from: shown, to: next, start: performance.now() }; return; }
          tween = undefined;
          shown = next;
          applyPalette(next);
          if (visible && !document.hidden) renderer.render({ scene: mesh });
        };
        if (darkPaletteKey) document.addEventListener('themechange', syncPalette);
        const stopsObserver = new MutationObserver(syncPalette);
        if (stopsSource) stopsObserver.observe(stopsSource, { attributes: true, attributeFilter: ['data-stops'] });
        const pointerMove = (event: PointerEvent): void => {
          const bounds = element.getBoundingClientRect();
          pointer.x = (event.clientX - bounds.left - bounds.width / 2) / Math.max(1, bounds.height);
          const y = (event.clientY - bounds.top) / Math.max(1, bounds.height);
          pointer.y = direction === 'bottom' ? 1 - y : y;
          pointer.inside = event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
        };
        const resize = (): void => {
          // Bound the GPU buffer, while keeping the displayed wash attached to
          // its entire section. OGL's setSize writes inline pixel dimensions.
          const width = Math.max(1, Math.min(element.clientWidth, 960));
          const height = Math.max(1, Math.min(element.clientHeight, 720));
          renderer.setSize(width, height);
          gl.canvas.style.width = '100%';
          gl.canvas.style.height = '100%';
          program.uniforms.uResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(element);
        const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); });
        observer.observe(element);
        document.addEventListener('visibilitychange', resume);
        if (curtain && mouseInteraction) window.addEventListener('pointermove', pointerMove, { passive: true });
        resize();
        cleanup = (): void => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          resizeObserver.disconnect();
          stopsObserver.disconnect();
          document.removeEventListener('visibilitychange', resume);
          document.removeEventListener('themechange', syncPalette);
          window.removeEventListener('pointermove', pointerMove);
          gl.canvas.remove();
          geometry.remove();
          gl.deleteProgram(program.program);
          gl.getExtension('WEBGL_lose_context')?.loseContext();
        };
      });
    };
    const checkMotion = (): void => {
      if (motion.matches === reduced) return;
      reduced = motion.matches;
      syncMotion();
    };
    // A viewport resize can delay a media-query change event in Chromium. Recheck
    // when the page switches layouts too, including while this effect is offscreen.
    const layoutObserver = new ResizeObserver(checkMotion);
    layoutObserver.observe(document.documentElement);
    motion.addEventListener('change', checkMotion);
    syncMotion();
    return (): void => { disposed = true; ++generation; layoutObserver.disconnect(); motion.removeEventListener('change', checkMotion); cleanup(); };
  }, [amplitude, speed, variant, paletteKey, darkPaletteKey, blend, height, scale, glow, brightness, layers, direction, lightMode, opacity, intro, mouseInteraction, liveStops, transition]);
  return <div ref={container} className="aurora-canvas" aria-hidden="true" />;
}
