import type { JSX, KeyboardEvent } from 'react';
import type { Assets } from '../lib/assets';
import { AssetImage } from './AssetImage';
import { useDemoCycle } from './useDemoCycle';
import { site } from '../config/site';
interface Props { assets: Pick<Assets, 'square' | 'special'>; }
const tabs = ['Ready', 'At launch', 'Loading'];
const annotations = [
  { text: 'Skeletons keep the real geometry. No text inside.', author: `${site.name} QA`, status: 'Resolved' },
  { text: 'Wait 200 ms before showing it, then keep it 500 ms.', author: site.name, status: 'Resolved' },
  { text: "Loading can't shove the price around.", author: `${site.name} QA`, status: 'Open' },
];
export function ReviewPanel({ assets }: Props): JSX.Element {
  const { ref, phase, choose } = useDemoCycle(3);
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    let next: number;
    if (event.key === 'ArrowRight') next = (phase + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (phase + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    choose(next);
    document.getElementById(`review-tab-${next}`)?.focus();
  };
  return <div ref={ref} className="process-card review-card">
    <div className="process-card-header review-header">
      <span className="eyebrow">Crochê — review preview</span>
      <div className="review-tabs" role="tablist" aria-label="Review preview states">{tabs.map((name, index) => <button key={name} id={`review-tab-${index}`} role="tab" aria-selected={phase === index} aria-controls="review-content" tabIndex={phase === index ? 0 : -1} className={phase === index ? 'selected' : ''} onClick={() => choose(index)} onKeyDown={keyDown}>{name}</button>)}</div>
    </div>
    <div id="review-content" className="review-content" data-phase={phase} role="tabpanel" aria-labelledby={`review-tab-${phase}`}>
      <div className="review-preview">
        <div className="review-product-card">
          {phase === 2 ? <div className="skeleton-preview" role="img" aria-label="Loading state preview"><span className="review-skeleton-image" /><span className="review-skeleton-title" /><span className="review-skeleton-detail" /><span className="review-skeleton-action" /></div> : <div className="review-product-state">
            <div className={`review-product ${phase === 1 ? 'review-product-launch' : ''}`}><AssetImage asset={phase === 0 ? assets.square : assets.special} alt={phase === 0 ? 'Square bag catalogue preview' : 'Special bag launch preview'} sizes="(max-width: 480px) 100vw, 240px" />{phase === 1 && <span className="review-launch-label">At launch</span>}</div>
            <h4>{phase === 0 ? 'Square' : 'Special'}</h4>
            <span className="review-product-detail">{phase === 0 ? 'Classic · 70 KM' : 'Opens at launch'}</span>
            <span className="review-product-action">{phase === 0 ? 'CHOOSE A SIZE ↗' : 'LET ME KNOW'}</span>
          </div>}
          {[1, 2, 3].map(number => <span key={number} className={`review-pin review-pin-${number} review-entrance-piece`} aria-hidden="true">{number}</span>)}
        </div>
      </div>
      <ol className="review-annotations" aria-label="Sample review annotations">{annotations.map((note, index) => <li key={note.text} className="review-entrance-piece">
        <span className={`review-note-number review-note-number-${index + 1}`} aria-hidden="true">{index + 1}</span>
        <div><p>{note.text}</p><span className="review-note-meta">{note.author}<span aria-hidden="true">·</span><span className={note.status === 'Open' ? 'review-note-open' : ''}>{note.status}</span></span></div>
      </li>)}</ol>
    </div>
    <div className="glass-zone"><div className="review-checks glass-strip"><span><i aria-hidden="true">✓</i>Skeleton, empty and error states</span><span><i aria-hidden="true">✓</i>Copy pass in Bosnian, diacritics kept</span><span><i className="review-check-pending" aria-hidden="true" />Emails tested across devices</span></div></div>
  </div>;
}
