import type { JSX } from 'react';
import type { Assets } from '../lib/assets';
import { AssetImage } from './AssetImage';
import { useDemoCycle } from './useDemoCycle';
interface Props { assets: Pick<Assets, 'square'>; }
export function ReviewPanel({ assets }: Props): JSX.Element {
  const { ref, phase, choose } = useDemoCycle(3);
  return <div ref={ref} className="process-card review-card"><div className="process-card-header"><span className="status-dot" /><span className="eyebrow">Crochê — every state, tested</span></div><div className="review-tabs" role="tablist" aria-label="Review preview states">{['Ready', 'At launch', 'Loading'].map((name, index) => <button key={name} id={`review-tab-${index}`} role="tab" aria-selected={phase === index} aria-controls="review-content" tabIndex={phase === index ? 0 : -1} className={phase === index ? 'selected' : ''} onClick={() => choose(index)} onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); const next = (phase + (event.key === 'ArrowRight' ? 1 : 2)) % 3; choose(next); document.getElementById(`review-tab-${next}`)?.focus(); } }}> {name}</button>)}</div><div id="review-content" className="review-content" role="tabpanel" aria-labelledby={`review-tab-${phase}`}>
    {phase === 2 ? <div className="skeleton-preview" aria-label="Loading state preview"><span /><span /><div /><span /></div> : <><div className="review-product"><AssetImage asset={assets.square} alt="Square bag catalogue preview" /><span className="stock-label">{phase === 0 ? 'In stock' : 'Opens at launch'}</span></div><div className="review-product-info"><h4 className="serif">Square</h4><span>Classic · 70 KM</span><span className="mini-label">{phase === 0 ? 'Natural / Wine' : 'A little more summer. Soon.'}</span></div></>}
  </div><div className="review-checks"><span>✓ Skeleton, empty and error states</span><span>✓ Copy pass in Bosnian, diacritics kept</span><span>✓ Emails tested across devices</span></div></div>;
}
