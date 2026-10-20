import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type JSX, type KeyboardEvent, type ReactNode } from 'react';
import '../styles/pixel-swap.css';

/** PixelSwap from React Bits, typed and rendered through one shared SVG mask.
 * Each block animates a lightweight rectangle instead of cloning and counter-scaling
 * the entire incoming layer. Content is rendered once and stays stationary behind the mask.
 * Visibility hides inactive content; the incoming layer is inert during its reveal. */

// Bound the mask geometry even when a very small pixel size is requested.
const MAX_PIXELS = 220;
const KEYFRAME_STEPS = 14;

type Pattern = 'random' | 'center' | 'edges' | 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top' | 'diagonal' | 'spiral';
const PATTERNS: Record<Pattern, (x: number, y: number) => number | null> = {
  random: () => null,
  center: (x, y) => Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2,
  edges: (x, y) => Math.min(x, 1 - x, y, 1 - y) * 2,
  'left-to-right': x => x,
  'right-to-left': x => 1 - x,
  'top-to-bottom': (_x, y) => y,
  'bottom-to-top': (_x, y) => 1 - y,
  diagonal: (x, y) => (x + y) / 2,
  spiral: (x, y) => {
    const angle = (Math.atan2(y - 0.5, x - 0.5) + Math.PI) / (Math.PI * 2);
    const radius = Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2;
    return (angle + radius) % 1;
  }
};

const EASINGS: Record<string, number[]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1]
};

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const noise = (seed: number): number => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const makeEasing = (value: string): ((progress: number) => number) => {
  const match = /cubic-bezier\(([^)]+)\)/.exec(value);
  const points = match ? match[1].split(',').map(Number) : EASINGS[value];
  if (!points || points.length !== 4 || points.some(Number.isNaN)) return makeEasing('ease');

  const [x1, y1, x2, y2] = points;
  if (x1 === y1 && x2 === y2) return progress => progress;

  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  return progress => {
    let t = progress;
    for (let i = 0; i < 5; i += 1) {
      const slope = (3 * ax * t + 2 * bx) * t + cx;
      if (!slope) break;
      t -= (((ax * t + bx) * t + cx) * t - progress) / slope;
    }
    t = clamp(t, 0, 1);
    return ((ay * t + by) * t + cy) * t;
  };
};

// Pixels grow slightly past their own box so gaps and rounded corners close
// completely by the end. Overlap is invisible because every pixel shows the
// same content locked to the same origin.
const coverScale = (size: number, gap: number, radius: number): number => {
  const p = clamp(radius, 0, 50) / 100;
  const corner = Math.SQRT1_2 / (Math.SQRT2 * (0.5 - p) + p);
  // Overlap by a pixel on each edge to prevent antialiased seams in the shared mask.
  return ((size + gap + 2) / size) * Math.max(1, corner);
};

interface Pixel { id: number; left: number; top: number; offset: number; }
interface Grid { pixels: Pixel[]; size: number; gap: number; width: number; height: number; }

const buildGrid = ({ width, height, pixelSize, gap, pattern, randomness }: { width: number; height: number; pixelSize: number; gap: number; pattern: Pattern; randomness: number }): Grid => {
  if (!width || !height) return { pixels: [], size: pixelSize, gap, width, height };
  let size = pixelSize;
  let columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
  let rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));

  if (columns * rows > MAX_PIXELS) {
    size = Math.ceil(size * Math.sqrt((columns * rows) / MAX_PIXELS));
    columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
    rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));
  }

  // Overhang the box so edge pixels stay square instead of being cut short.
  const stride = size + gap;
  const originX = (width - (columns * stride - gap)) / 2;
  const originY = (height - (rows * stride - gap)) / 2;
  const order = PATTERNS[pattern] ?? PATTERNS.random;
  const mix = clamp(randomness, 0, 1);
  const pixels: Pixel[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      const x = columns <= 1 ? 0.5 : column / (columns - 1);
      const y = rows <= 1 ? 0.5 : row / (rows - 1);
      const base = order(x, y);
      const random = noise(index + 1);

      pixels.push({
        id: index,
        left: originX + column * stride,
        top: originY + row * stride,
        offset: base === null ? random : base * (1 - mix) + random * mix
      });
    }
  }

  return { pixels, size, gap, width, height };
};

const buildKeyframes = ({ ease, startScale, endScale, spin, fade }: { ease: (progress: number) => number; startScale: number; endScale: number; spin: number; fade: boolean }): Keyframe[] => {
  const keyframes: Keyframe[] = [];

  for (let step = 0; step <= KEYFRAME_STEPS; step += 1) {
    const progress = step / KEYFRAME_STEPS;
    const eased = ease(progress);
    const scale = startScale + (endScale - startScale) * eased;
    const angle = spin * (1 - eased);

    keyframes.push({
      offset: progress,
      opacity: fade ? Math.min(1, eased * 1.6) : 1,
      transform: `rotate(${angle}deg) scale(${scale})`
    });
  }

  return keyframes;
};

export interface PixelSwapProps {
  firstContent?: ReactNode;
  secondContent?: ReactNode;
  pixelSize?: number;
  gap?: number;
  pixelRadius?: number;
  pixelSpin?: number;
  pixelScale?: number;
  fade?: boolean;
  duration?: number;
  pixelDuration?: number;
  pattern?: Pattern;
  randomness?: number;
  easing?: string;
  trigger?: 'hover' | 'click' | 'manual' | 'scroll';
  scrollTarget?: string;
  scrollTimeline?: string;
  scrollRange?: readonly [number, number];
  onScrollPhase?: (phase: ScrollPhase | null) => void;
  initialActive?: boolean;
  active?: boolean;
  onActiveChange?: (active: boolean) => void;
  onComplete?: (active: boolean) => void;
  aspectRatio?: string;
  className?: string;
  style?: CSSProperties;
}

export type ScrollPhase = 'before' | 'during' | 'after';
const DEFAULT_SCROLL_RANGE = [0, 100] as const;

export default function PixelSwap({
  firstContent,
  secondContent,
  pixelSize = 64,
  gap = 0,
  pixelRadius = 0,
  pixelSpin = 0,
  pixelScale = 0.35,
  fade = true,
  duration = 1400,
  pixelDuration = 450,
  pattern = 'random',
  randomness = 0,
  easing = 'cubic-bezier(0.22, 1, 0.36, 1)',
  trigger = 'hover',
  scrollTarget,
  scrollTimeline = '--pixel-swap',
  scrollRange = DEFAULT_SCROLL_RANGE,
  onScrollPhase,
  initialActive = false,
  active,
  onActiveChange,
  onComplete,
  aspectRatio = '16 / 10',
  className = '',
  style
}: PixelSwapProps): JSX.Element {
  const [internalActive, setInternalActive] = useState(initialActive);
  const [shownActive, setShownActive] = useState(active ?? initialActive);
  const [transition, setTransition] = useState<{ to: boolean; grid: Grid } | null>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [scrollPhase, setScrollPhase] = useState<ScrollPhase | null>(null);
  const scrollDriven = trigger === 'scroll';
  const [scrollStart, scrollEnd] = scrollRange;
  const phaseCallback = useRef(onScrollPhase);
  phaseCallback.current = onScrollPhase;

  const containerRef = useRef<HTMLDivElement>(null);
  const pixelRefs = useRef<(SVGRectElement | null)[]>([]);
  const animationsRef = useRef<Animation[]>([]);
  const maskId = `pixel-mask-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const desiredActive = active ?? internalActive;
  const incomingIndex = transition?.to ? 1 : 0;

  const grid = useMemo(
    () =>
      buildGrid({
        width: box.width,
        height: box.height,
        pixelSize: Math.max(8, Math.round(pixelSize)),
        gap: Math.max(0, Math.round(gap)),
        pattern,
        randomness
      }),
    [box.width, box.height, pixelSize, gap, pattern, randomness]
  );

  // Snapshot the animation inputs so a transition already in flight is never
  // rebuilt halfway through by an unrelated prop change.
  const config = { duration, pixelDuration, pixelSpin, pixelScale, pixelRadius, fade, easing, onComplete };
  const configRef = useRef(config);
  const gridRef = useRef(grid);
  configRef.current = config;
  gridRef.current = grid;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Measure the padding box, which is the coordinate space the absolutely
    // positioned layers and pixel grid actually live in.
    const measure = (): void => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      setBox(current => (current.width === width && current.height === height ? current : { width, height }));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const stopAnimations = useCallback(() => {
    animationsRef.current.forEach(animation => animation.cancel());
    animationsRef.current = [];
  }, []);

  useEffect(() => stopAnimations, [stopAnimations]);

  useEffect(() => {
    if (!scrollDriven || !scrollTarget) return;
    const track = containerRef.current?.closest<HTMLElement>(scrollTarget);
    if (!track) return;
    const preference = matchMedia('(prefers-reduced-motion: no-preference) and (min-height: 560px)');
    const supported = CSS.supports('animation-timeline: view()');
    let frame = 0;
    let previous: ScrollPhase | null | undefined;
    const measure = (): void => {
      frame = 0;
      const progress = -track.getBoundingClientRect().top / Math.max(1, track.offsetHeight - innerHeight) * 100;
      const phase = !supported || !preference.matches ? null : progress <= scrollStart ? 'before' : progress >= scrollEnd ? 'after' : 'during';
      // No per-frame React work: only the two boundaries change visibility, inert and aria-hidden.
      if (phase === previous) return;
      previous = phase;
      setScrollPhase(phase);
      phaseCallback.current?.(phase);
    };
    const request = (): void => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(request);
    observer.observe(track);
    measure();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    preference.addEventListener('change', request);
    return (): void => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
      preference.removeEventListener('change', request);
    };
  }, [scrollDriven, scrollTarget, scrollStart, scrollEnd]);

  useEffect(() => {
    if (scrollDriven || transition || desiredActive === shownActive) return;
    setTransition({ to: desiredActive, grid: gridRef.current });
  }, [scrollDriven, desiredActive, shownActive, transition]);

  useEffect(() => {
    if (!transition) return;
    const settings = configRef.current;
    const { grid: frozenGrid, to } = transition;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let finished = false;

    const finish = (): void => {
      if (finished) return;
      finished = true;
      stopAnimations();
      setShownActive(to);
      setTransition(null);
      settings.onComplete?.(to);
    };

    if (!frozenGrid.pixels.length || preference.matches || frozenGrid.width !== box.width || frozenGrid.height !== box.height) {
      finish();
      return;
    }

    const total = Math.max(200, settings.duration);
    const pixelMs = clamp(settings.pixelDuration, 60, total);
    const spread = Math.max(0, total - pixelMs);
    const endScale = coverScale(frozenGrid.size, frozenGrid.gap, settings.pixelRadius);
    const keyframes = buildKeyframes({
      ease: makeEasing(settings.easing),
      startScale: clamp(settings.pixelScale, 0.05, 1) * endScale,
      endScale,
      spin: settings.pixelSpin,
      fade: settings.fade
    });

    // Give every block the same clock origin. All mask geometry exists before playback;
    // no DOM copies, React updates or per-frame work are needed while it runs.
    const began = document.timeline.currentTime;
    frozenGrid.pixels.forEach((pixel, index) => {
      const pixelElement = pixelRefs.current[index];
      if (!pixelElement) return;
      const animation = pixelElement.animate(keyframes, { duration: pixelMs, delay: pixel.offset * spread, easing: 'linear', fill: 'both' });
      animation.startTime = began;
      animationsRef.current.push(animation);
    });

    const changed = (): void => { if (preference.matches) finish(); };
    preference.addEventListener('change', changed);
    // Wait for actual playback rather than a timeout that can cut off delayed frames.
    void Promise.all(animationsRef.current.map(animation => animation.finished)).then(finish, () => {});
    return (): void => {
      finished = true;
      preference.removeEventListener('change', changed);
      stopAnimations();
    };
  }, [box.width, box.height, stopAnimations, transition]);

  const requestActive = useCallback(
    (next: boolean) => {
      if (active === undefined) setInternalActive(next);
      onActiveChange?.(next);
    },
    [active, onActiveChange]
  );

  const interactionProps = useMemo(() => {
    if (trigger === 'hover') {
      return {
        onMouseEnter: () => requestActive(true),
        onMouseLeave: () => requestActive(false),
        onFocus: () => requestActive(true),
        onBlur: () => requestActive(false),
        tabIndex: 0
      };
    }

    if (trigger === 'click') {
      return {
        onClick: () => requestActive(!desiredActive),
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            requestActive(!desiredActive);
          }
        },
        role: 'button',
        tabIndex: 0
      };
    }

    return {};
  }, [desiredActive, requestActive, trigger]);

  const renderLayer = (content: ReactNode, index: number): JSX.Element => {
    const isShown = scrollDriven ? index === 0 ? scrollPhase !== 'after' : scrollPhase !== null && scrollPhase !== 'before' : index === (shownActive ? 1 : 0);
    const isIncoming = !scrollDriven && transition !== null && index === incomingIndex;
    const masked = scrollDriven ? index === 1 && scrollPhase !== null : isIncoming;
    const inaccessible = scrollDriven ? scrollPhase !== null && (index === 1 ? scrollPhase !== 'after' : scrollPhase === 'after') : isIncoming;
    return (
      <div
        key={index}
        className="pixel-swap__layer"
        data-visible={isShown || isIncoming}
        aria-hidden={inaccessible || undefined}
        inert={inaccessible || undefined}
        style={{ zIndex: scrollDriven ? index + 2 : isIncoming ? 3 : isShown ? 2 : 1, maskImage: masked ? `url(#${maskId})` : undefined }}
      >
        {content}
      </div>
    );
  };

  const maskGrid = transition?.grid ?? grid;
  const scale = coverScale(maskGrid.size, maskGrid.gap, pixelRadius);
  const pixelShare = clamp(pixelDuration / Math.max(200, duration), 0, 1);

  return (
    <div
      ref={containerRef}
      className={`pixel-swap ${className}`.trim()}
      style={{ aspectRatio, ...style }}
      data-active={scrollDriven ? scrollPhase === 'after' : shownActive}
      data-transitioning={scrollDriven ? scrollPhase === 'during' : !!transition}
      data-scroll-driven={scrollDriven || undefined}
      {...interactionProps}
    >
      {renderLayer(firstContent, 0)}
      {renderLayer(secondContent, 1)}

      {(transition || scrollDriven && scrollPhase !== null) && (
        <svg className="pixel-swap__grid" aria-hidden="true" focusable="false">
          <defs>
            <mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
              x="0"
              y="0"
              width={maskGrid.width}
              height={maskGrid.height}
              style={{ maskType: 'alpha' }}
            >
              {maskGrid.pixels.map((pixel, index) => {
                const start = scrollStart + pixel.offset * (scrollEnd - scrollStart) * (1 - pixelShare);
                const end = start + (scrollEnd - scrollStart) * pixelShare;
                return (
                <rect
                  key={pixel.id}
                  ref={element => {
                    pixelRefs.current[index] = element;
                  }}
                  className="pixel-swap__pixel"
                  x={pixel.left}
                  y={pixel.top}
                  width={maskGrid.size}
                  height={maskGrid.size}
                  rx={maskGrid.size * clamp(pixelRadius, 0, 50) / 100}
                  fill="white"
                  style={{
                    transformOrigin: `${pixel.left + maskGrid.size / 2}px ${pixel.top + maskGrid.size / 2}px`,
                    ...(scrollDriven ? {
                      '--pixel-start-scale': clamp(pixelScale, .05, 1) * scale,
                      '--pixel-end-scale': scale,
                      '--pixel-spin': `${pixelSpin}deg`,
                      '--pixel-start-opacity': fade ? 0 : 1,
                      animationName: 'pixel-swap-scroll',
                      animationTimingFunction: easing,
                      animationFillMode: 'both',
                      animationTimeline: scrollTimeline,
                      animationRangeStart: `contain ${start}%`,
                      animationRangeEnd: `contain ${end}%`,
                    } : {}),
                  } as CSSProperties}
                />
              ); })}
            </mask>
          </defs>
        </svg>
      )}
    </div>
  );
}
