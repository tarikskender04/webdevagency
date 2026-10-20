import { useCallback, useRef, type JSX, type ReactNode } from 'react';
import PixelSwap, { type ScrollPhase } from './PixelSwap';

interface Props { title?: ReactNode; world?: ReactNode; }
const SWAP_RANGE = [30, 76] as const;

/** One scroll timeline opens the portal, reveals the real intro through its pixel mask, and settles the
 * chapters. The browser samples every visual; React only updates accessibility at the reveal boundaries. */
export function ProcessIntro({ title, world }: Props): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const onScrollPhase = useCallback((phase: ScrollPhase | null): void => {
    const track = ref.current?.closest<HTMLElement>('.portal-open');
    if (!track) return;
    if (phase === null) delete track.dataset.portal;
    else track.dataset.portal = phase === 'before' ? 'rest' : phase === 'after' ? 'done' : 'open';
  }, []);

  return <div ref={ref} className="portal-intro">
    <PixelSwap
      className="portal-swap"
      trigger="scroll"
      scrollTarget=".portal-open"
      scrollTimeline="--process-open"
      scrollRange={SWAP_RANGE}
      onScrollPhase={onScrollPhase}
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
