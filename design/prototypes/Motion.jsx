const { useEffect, useRef, useState, useMemo, useCallback } = React;

/* Dependency-free ports of the React Bits motion set, tuned to the kit:
   restrained distances, 260–900ms, ease-out. No gsap, no motion, no Tailwind. */

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const num = (v, d) => { const n = typeof v === 'number' ? v : parseFloat(v); return Number.isFinite(n) ? n : d; };
const bool = (v, d) => (v === undefined || v === null || v === '' ? d : v === true || v === 'true');
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a || 1e-6), 0, 1); return t * t * (3 - 2 * t); };

function ensureStyle(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id; s.textContent = css;
  document.head.appendChild(s);
}

function useReduced() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setR(m.matches); on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return r;
}

function useInView(ref, threshold, once) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); if (once) io.disconnect(); }
      else if (!once) setSeen(false);
    }, { threshold: clamp(threshold, 0, 1), rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);
  return seen;
}

/* ── ScrollFloat ─────────────────────────────────────────────────────────
   Characters rise into place, scrubbed by scroll position. Headline only. */
function ScrollFloat(props) {
  const ref = useRef(null);
  const text = typeof props.children === 'string' ? props.children : (props.text || '');
  const stagger = num(props.stagger, 0.035);
  const rise = num(props.rise, 100);
  const startAt = num(props.scrollStart, 0.9);
  const endAt = num(props.scrollEnd, 0.42);
  const reduced = useReduced();

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const chars = el.querySelectorAll('[data-char]');
    if (reduced) { chars.forEach(c => { c.style.opacity = 1; c.style.transform = 'none'; }); return; }
    const span = Math.max(1, chars.length) * stagger + 1;
    let raf = 0;
    const paint = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = clamp((vh * startAt - r.top) / (vh * Math.max(0.05, startAt - endAt)), 0, 1);
      chars.forEach((c, i) => {
        const cp = clamp((p * span - i * stagger), 0, 1);
        const e = 1 - Math.pow(1 - cp, 3);
        c.style.opacity = e;
        c.style.transform = `translateY(${(1 - e) * rise}%) scaleY(${1 + 0.9 * (1 - e)}) scaleX(${1 - 0.18 * (1 - e)})`;
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint); };
    paint();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [text, stagger, rise, startAt, endAt, reduced]);

  return (
    <span ref={ref} style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: '0.12em', ...(props.style || {}) }}>
      {text.split('').map((ch, i) => (
        <span key={i} data-char style={{ display: 'inline-block', opacity: 0, transformOrigin: '50% 0%', willChange: 'transform, opacity' }}>
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  );
}

/* ── TextReveal (SplitText) ──────────────────────────────────────────────
   One-shot staggered entry on enter. Words by default — chars only on
   short display lines. */
function TextReveal(props) {
  const ref = useRef(null);
  const text = props.text || (typeof props.children === 'string' ? props.children : '');
  const mode = props.splitType === 'chars' ? 'chars' : 'words';
  const delay = num(props.delay, 34);
  const duration = num(props.duration, 0.62);
  const y = num(props.y, 22);
  const blur = bool(props.blur, false);
  const reduced = useReduced();
  const seen = useInView(ref, num(props.threshold, 0.15), true);
  const parts = useMemo(() => (mode === 'chars' ? text.split('') : text.split(/(\s+)/)), [text, mode]);
  const on = seen || reduced;

  return (
    <span ref={ref} style={{ display: 'inline-block', ...(props.style || {}) }}>
      {parts.map((p, i) => (
        <span key={i} style={{
          display: 'inline-block',
          whiteSpace: 'pre',
          opacity: on ? 1 : 0,
          filter: blur && !on ? 'blur(6px)' : 'blur(0px)',
          transform: on ? 'none' : `translateY(${y}px)`,
          transition: reduced ? 'none' : `opacity ${duration}s cubic-bezier(.22,.61,.36,1) ${i * delay}ms, transform ${duration}s cubic-bezier(.22,.61,.36,1) ${i * delay}ms, filter ${duration}s ease ${i * delay}ms`,
          willChange: 'transform, opacity'
        }}>{p}</span>
      ))}
    </span>
  );
}

/* ── FadeContent ─────────────────────────────────────────────────────────
   The default. Anything that isn't a headline uses this. */
function FadeContent(props) {
  const ref = useRef(null);
  const reduced = useReduced();
  const seen = useInView(ref, num(props.threshold, 0.12), true);
  const duration = num(props.duration, 700);
  const delay = num(props.delay, 0);
  const blur = bool(props.blur, false);
  const y = num(props.y, 16);
  const on = seen || reduced;
  return (
    <div ref={ref} style={{
      opacity: on ? 1 : num(props.initialOpacity, 0),
      transform: on ? 'none' : `translateY(${y}px)`,
      filter: blur && !on ? 'blur(10px)' : 'blur(0px)',
      transition: reduced ? 'none' : `opacity ${duration}ms cubic-bezier(.22,.61,.36,1) ${delay}ms, transform ${duration}ms cubic-bezier(.22,.61,.36,1) ${delay}ms, filter ${duration}ms ease ${delay}ms`,
      willChange: 'transform, opacity',
      ...(props.style || {})
    }}>{props.children}</div>
  );
}

/* ── ShinyText ───────────────────────────────────────────────────────────
   Metallic sweep. Reserved for one small label per page. */
function ShinyText(props) {
  ensureStyle('kit-shiny', '@keyframes kit-shine{0%{background-position:150% center}100%{background-position:-50% center}}');
  const color = props.color || '#7D8F9C';
  const shine = props.shineColor || '#0A1A25';
  const speed = num(props.speed, 3.4);
  const spread = num(props.spread, 110);
  return (
    <span style={{
      display: 'inline-block',
      backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 38%, ${shine} 50%, ${color} 62%, ${color} 100%)`,
      backgroundSize: '200% auto',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      animation: `kit-shine ${speed}s linear infinite`,
      ...(props.style || {})
    }}>{props.text || props.children}</span>
  );
}

/* ── GlareHover ──────────────────────────────────────────────────────────
   A single light pass across a surface on hover. Cards and CTAs. */
function GlareHover(props) {
  const [hover, setHover] = useState(false);
  const angle = num(props.glareAngle, -32);
  const size = num(props.glareSize, 280);
  const dur = num(props.transitionDuration, 900);
  const c = props.glareColor || '#FFFFFF';
  const o = num(props.glareOpacity, 0.55);
  const rgba = (() => {
    const h = c.replace('#', '');
    if (!/^[0-9A-Fa-f]{6}$/.test(h)) return c;
    return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${o})`;
  })();
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', overflow: 'hidden', width: props.width || '100%', height: props.height || '100%',
        background: props.background || '#FFFFFF', borderRadius: props.borderRadius || '20px',
        border: `1px solid ${props.borderColor || '#E3EAF0'}`, ...(props.style || {})
      }}>
      {props.children}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `linear-gradient(${angle}deg, rgba(0,0,0,0) 58%, ${rgba} 70%, rgba(0,0,0,0) 82%, rgba(0,0,0,0) 100%)`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${size}% ${size}%`,
        backgroundPosition: hover ? '100% 100%' : '-100% -100%',
        transition: `background-position ${dur}ms ease`
      }} />
    </div>
  );
}

/* ── ScrollExpand ────────────────────────────────────────────────────────
   A pinned frame that opens to full bleed as you scroll. One per page. */
function ScrollExpand(props) {
  const rootRef = useRef(null), trackRef = useRef(null), stageRef = useRef(null);
  const frameRef = useRef(null), mediaRef = useRef(null), titleRef = useRef(null);
  const overlayRef = useRef(null), scrimRef = useRef(null);
  const cfg = {
    startWidth: num(props.startWidth, 44), startHeight: num(props.startHeight, 56),
    startRadius: num(props.startRadius, 24), endRadius: num(props.endRadius, 0),
    mediaZoom: num(props.mediaZoom, 1.3), scrollDistance: num(props.scrollDistance, 1.1),
    holdDistance: num(props.holdDistance, 0.3), overlayScrim: num(props.overlayScrim, 0.45),
    useWindowScroll: bool(props.useWindowScroll, false)
  };
  const cfgRef = useRef(cfg); cfgRef.current = cfg;

  const apply = useCallback(p => {
    const f = frameRef.current, m = mediaRef.current; if (!f) return;
    const c = cfgRef.current, e = smoothstep(0, 1, p);
    const w = c.startWidth + (100 - c.startWidth) * e, h = c.startHeight + (100 - c.startHeight) * e;
    const ix = Math.max(0, (100 - w) / 2), iy = Math.max(0, (100 - h) / 2);
    const r = c.startRadius + (c.endRadius - c.startRadius) * e;
    f.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;
    if (m) m.style.transform = `scale(${c.mediaZoom + (1 - c.mediaZoom) * e})`;
    if (scrimRef.current) scrimRef.current.style.opacity = String(c.overlayScrim * e);
    if (titleRef.current) {
      const out = smoothstep(0.4, 0.88, p);
      titleRef.current.style.opacity = String(1 - out);
      titleRef.current.style.transform = `translate3d(0,${-24 * out}px,0)`;
    }
    if (overlayRef.current) {
      const inn = smoothstep(0.7, 1, p);
      overlayRef.current.style.opacity = String(inn);
      overlayRef.current.style.transform = `translate3d(0,${16 * (1 - inn)}px,0)`;
    }
  }, []);

  useEffect(() => {
    const root = rootRef.current, track = trackRef.current, stage = stageRef.current;
    if (!root || !track || !stage) return;
    let raf = 0, stageH = 0;
    const measure = () => {
      stageH = (cfgRef.current.useWindowScroll ? window.innerHeight : root.clientHeight) || window.innerHeight;
      stage.style.height = `${stageH}px`;
      track.style.height = `${stageH * (1 + cfgRef.current.scrollDistance + cfgRef.current.holdDistance)}px`;
    };
    const read = () => {
      const span = stageH * Math.max(0.01, cfgRef.current.scrollDistance);
      if (cfgRef.current.useWindowScroll) return clamp(-track.getBoundingClientRect().top / span, 0, 1);
      return clamp(root.scrollTop / span, 0, 1);
    };
    const paint = () => { raf = 0; apply(read()); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint); };
    const onResize = () => { measure(); apply(read()); };
    measure(); apply(read());
    root.addEventListener('scroll', onScroll, { passive: true });
    if (cfgRef.current.useWindowScroll) window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize); ro.observe(root);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      root.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [apply]);

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', overscrollBehavior: 'contain', ...(props.style || {}) }}>
      <div ref={trackRef} style={{ position: 'relative', width: '100%' }}>
        <div ref={stageRef} style={{ position: 'sticky', top: 0, width: '100%', overflow: 'hidden', background: props.background || '#EAF2F8' }}>
          <div ref={frameRef} style={{ position: 'absolute', inset: 0, willChange: 'clip-path' }}>
            <div ref={mediaRef} style={{ position: 'absolute', inset: 0, background: props.media || 'linear-gradient(140deg,#0A1A25 0%,#0C3F63 55%,#0C7CC4 100%)', willChange: 'transform', transformOrigin: 'center' }} />
            <div ref={scrimRef} style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none', background: 'linear-gradient(to top, rgba(4,16,24,.8), rgba(4,16,24,.05) 50%, rgba(4,16,24,.4))' }} />
            {props.children ? (
              <div ref={overlayRef} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '6%', opacity: 0, color: '#FFFFFF' }}>
                {props.children}
              </div>
            ) : null}
          </div>
          {props.title ? (
            <div ref={titleRef} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6%', textAlign: 'center', fontSize: 'clamp(22px,4.4vw,54px)', fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1.04, color: '#0A1A25', pointerEvents: 'none' }}>
              {props.title}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

module.exports = { ScrollFloat, TextReveal, FadeContent, ShinyText, GlareHover, ScrollExpand };
