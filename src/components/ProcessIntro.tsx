import { useCallback, useEffect, useRef, useState, type JSX, type ReactNode } from 'react';
import PixelSwap, { type ScrollPhase } from './PixelSwap';

interface Props { title?: ReactNode; world?: ReactNode; }
const SWAP_RANGE = [30, 76] as const;
// Phones (data-portal-mode="timed"): the hole opens over 1s, the pixels swap from 1s to 2.4s, and the wash and
// chapters settle by 3s (process-portal.css holds the matching delays).
const TIMED_SWAP_AT = 1000;
const TIMED_DONE_AT = 3000;
const MOTION = '(prefers-reduced-motion: no-preference) and (min-height: 560px)';

/** One scroll timeline opens the portal, reveals the real intro through its pixel mask, and settles the
 * chapters. The browser samples every visual; React only updates accessibility at the reveal boundaries.
 * On phones the same opening plays as a timed sequence once most of the stage is in view, and resets once it has
 * left the screen so it plays again on the way back. */
export function ProcessIntro({ title, world }: Props): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [timed, setTimed] = useState(false);
  const [swapped, setSwapped] = useState(false);
  // Remounting the swap returns it to the title card at once, rather than playing the pixels in reverse.
  const [cycle, setCycle] = useState(0);
  const onScrollPhase = useCallback((phase: ScrollPhase | null): void => {
    const track = ref.current?.closest<HTMLElement>('.portal-open');
    if (!track) return;
    if (phase === null) delete track.dataset.portal;
    else track.dataset.portal = phase === 'before' ? 'rest' : phase === 'after' ? 'done' : 'open';
  }, []);

  useEffect(() => {
    const track = ref.current?.closest<HTMLElement>('.portal-open');
    if (!track || track.dataset.portalMode !== 'timed') return;
    setTimed(true);
    const motion = window.matchMedia(MOTION);
    const timers: number[] = [];
    let ratio = 0;
    const reset = (): void => {
      timers.splice(0).forEach(timer => clearTimeout(timer));
      setSwapped(false);
      setCycle(value => value + 1);
    };
    const play = (): void => {
      track.dataset.portal = 'open';
      timers.push(window.setTimeout(() => setSwapped(true), TIMED_SWAP_AT));
      timers.push(window.setTimeout(() => { track.dataset.portal = 'done'; }, TIMED_DONE_AT));
    };
    const update = (): void => {
      if (!motion.matches) {
        if (track.dataset.portal) { delete track.dataset.portal; reset(); }
        return;
      }
      if (!track.dataset.portal) track.dataset.portal = 'rest';
      if (track.dataset.portal === 'rest' && ratio >= .6) play();
      else if (track.dataset.portal !== 'rest' && ratio === 0) { track.dataset.portal = 'rest'; reset(); }
    };
    const observer = new IntersectionObserver(([entry]) => { ratio = entry.isIntersecting ? entry.intersectionRatio : 0; update(); }, { threshold: [0, .6] });
    observer.observe(track);
    motion.addEventListener('change', update);
    return (): void => { timers.forEach(timer => clearTimeout(timer)); observer.disconnect(); motion.removeEventListener('change', update); };
  }, []);

  const mode = timed
    ? { trigger: 'manual' as const, active: swapped }
    : { trigger: 'scroll' as const, scrollTarget: '.portal-open', scrollTimeline: '--process-open', scrollRange: SWAP_RANGE, onScrollPhase };
  return <div ref={ref} className="portal-intro">
    <PixelSwap
      key={cycle}
      className="portal-swap"
      {...mode}
      aspectRatio="auto"
      pattern="center"
      randomness={.35}
      pixelSize={96}
      pixelScale={.3}
      duration={1400}
      pixelDuration={600}
      firstContent={<div className="portal-title-card"><div className="portal-title">{title}</div></div>}
      secondContent={world}
    />
  </div>;
}
