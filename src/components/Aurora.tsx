import { useEffect, useRef, type JSX } from 'react';
import { vert, frag } from '../effects/aurora-shaders';
interface Props { amplitude?: number; speed?: number; }
export function Aurora({ amplitude = 1.1, speed = .3 }: Props): JSX.Element {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = container.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!element || motion.matches) return;
    let disposed = false;
    let cleanup = (): void => {};
    void import('ogl').then(({ Renderer, Program, Mesh, Color, Triangle }) => {
      if (disposed || motion.matches) return;
      let renderer: InstanceType<typeof Renderer>;
      try { renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: false, dpr: Math.min(window.devicePixelRatio, 1.5), webgl: 2 }); }
      catch { return; }
      const gl = renderer.gl;
      const geometry = new Triangle(gl);
      const program = new Program(gl, {
        vertex: vert, fragment: frag,
        uniforms: {
          uTime: { value: 0 }, uAmplitude: { value: amplitude }, uBlend: { value: .55 }, uLightMode: { value: 1 },
          uColorStops: { value: ['#FFFFFF', '#9CCCEB', '#0C7CC4'].map(hex => [...new Color(hex)]) },
          uResolution: { value: [1, 1] },
        },
      });
      const mesh = new Mesh(gl, { geometry, program });
      element.appendChild(gl.canvas);
      let frame = 0;
      let visible = false;
      let previous = 0;
      const draw = (time: number): void => {
        frame = 0;
        if (!visible || document.hidden || motion.matches) return;
        if (time - previous > 32) { program.uniforms.uTime.value = time * .001 * speed; renderer.render({ scene: mesh }); previous = time; }
        frame = requestAnimationFrame(draw);
      };
      const resume = (): void => { cancelAnimationFrame(frame); frame = 0; if (visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(draw); };
      const resize = (): void => {
        // A bounded drawing buffer keeps the full-section wash affordable.
        const width = Math.max(1, Math.min(element.clientWidth, 960));
        const height = Math.max(1, Math.min(element.clientHeight, 720));
        renderer.setSize(width, height);
        program.uniforms.uResolution.value = [width, height];
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(element);
      const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); });
      observer.observe(element);
      document.addEventListener('visibilitychange', resume);
      const changeMotion = (): void => { gl.canvas.hidden = motion.matches; resume(); };
      motion.addEventListener('change', changeMotion);
      resize();
      cleanup = (): void => { cancelAnimationFrame(frame); observer.disconnect(); resizeObserver.disconnect(); document.removeEventListener('visibilitychange', resume); motion.removeEventListener('change', changeMotion); gl.canvas.remove(); gl.getExtension('WEBGL_lose_context')?.loseContext(); };
    });
    return (): void => { disposed = true; cleanup(); };
  }, [amplitude, speed]);
  return <div ref={container} className="aurora-canvas" aria-hidden="true" />;
}
