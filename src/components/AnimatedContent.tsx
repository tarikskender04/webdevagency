import { useEffect, useRef, type HTMLAttributes, type JSX, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** AnimatedContent from React Bits (JavaScript + CSS variant), typed, with three changes:
 *  - `play`: when given, the entrance waits for it to turn true instead of its own ScrollTrigger. Content inside a
 *    sticky stage (the Process portal) needs this, because ScrollTrigger measures a stuck element in the wrong place.
 *  - Under prefers-reduced-motion the content shows at its end state and never moves.
 *  - Once started it inherits visibility rather than forcing `visible`, so a hidden parent (a PixelSwap layer) can
 *    still hide it. */
export interface AnimatedContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onAnimationEnd'> {
  children?: ReactNode;
  container?: string | HTMLElement | null;
  distance?: number;
  direction?: 'vertical' | 'horizontal';
  reverse?: boolean;
  duration?: number;
  ease?: string;
  initialOpacity?: number;
  animateOpacity?: boolean;
  scale?: number;
  threshold?: number;
  delay?: number;
  disappearAfter?: number;
  disappearDuration?: number;
  disappearEase?: string;
  onComplete?: () => void;
  onDisappearanceComplete?: () => void;
  play?: boolean;
}

export default function AnimatedContent({
  children,
  container,
  distance = 100,
  direction = 'vertical',
  reverse = false,
  duration = 0.8,
  ease = 'power3.out',
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold = 0.1,
  delay = 0,
  disappearAfter = 0,
  disappearDuration = 0.5,
  disappearEase = 'power3.in',
  onComplete,
  onDisappearanceComplete,
  play,
  className = '',
  ...props
}: AnimatedContentProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const playRef = useRef(play);
  playRef.current = play;
  const manual = play !== undefined;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const axis = direction === 'horizontal' ? 'x' : 'y';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(el, { [axis]: 0, scale: 1, opacity: 1, visibility: 'inherit' });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    let scrollerTarget: string | HTMLElement | null = container || document.getElementById('snap-main-container') || null;

    if (typeof scrollerTarget === 'string') {
      scrollerTarget = document.querySelector<HTMLElement>(scrollerTarget);
    }

    const offset = reverse ? -distance : distance;
    const startPct = (1 - threshold) * 100;

    gsap.set(el, {
      [axis]: offset,
      scale,
      opacity: animateOpacity ? initialOpacity : 1,
      visibility: 'inherit'
    });

    const tl = gsap.timeline({
      paused: true,
      delay,
      onComplete: () => {
        if (onComplete) onComplete();
        if (disappearAfter > 0) {
          gsap.to(el, {
            [axis]: reverse ? distance : -distance,
            scale: 0.8,
            opacity: animateOpacity ? initialOpacity : 0,
            delay: disappearAfter,
            duration: disappearDuration,
            ease: disappearEase,
            onComplete: () => onDisappearanceComplete?.()
          });
        }
      }
    });

    tl.to(el, {
      [axis]: 0,
      scale: 1,
      opacity: 1,
      duration,
      ease
    });
    timelineRef.current = tl;

    const st = manual
      ? null
      : ScrollTrigger.create({
          trigger: el,
          scroller: scrollerTarget ?? undefined,
          start: `top ${startPct}%`,
          once: true,
          onEnter: () => { tl.play(); }
        });
    if (manual && playRef.current) tl.play();

    return () => {
      st?.kill();
      tl.kill();
      timelineRef.current = null;
    };
  }, [
    container,
    distance,
    direction,
    reverse,
    duration,
    ease,
    initialOpacity,
    animateOpacity,
    scale,
    threshold,
    delay,
    disappearAfter,
    disappearDuration,
    disappearEase,
    onComplete,
    onDisappearanceComplete,
    manual
  ]);

  useEffect(() => {
    if (play) timelineRef.current?.play();
  }, [play]);

  return (
    <div ref={ref} className={className} style={{ visibility: 'hidden' }} {...props}>
      {children}
    </div>
  );
}
