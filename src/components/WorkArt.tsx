import type { JSX } from 'react';
import type { Assets, ImageKey } from '../lib/assets';
import type { WorkId } from '../config/work';
import '../styles/work-art.css';
interface Props { id: WorkId; assets: Assets; eager: boolean; sizes?: string; }
/** A client's showcase card, rebuilt from its thumbnail in layers. `.work-layer` pieces drift against the pointer
 *  (hero.css), and the active card runs its own small loop: Crochê's photo drifts, Captured's viewfinder focuses on the
 *  wordmark and Tierd's dot pulses. Una's card is its supplied poster artwork, river included. */
export function WorkArt({ id, assets, eager, sizes = '(max-width: 760px) 46vw, 240px' }: Props): JSX.Element {
  const layer = (key: ImageKey, className: string): JSX.Element => <img className={`work-layer ${className}`} src={assets[key].src} srcSet={assets[key].srcSet} sizes={sizes} width={assets[key].width} height={assets[key].height} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" />;
  if (id === 'croche') return <>
    {layer('crochePhoto', 'croche-photo')}
    <span className="croche-shade" />
    <span className="work-layer croche-brand">
      <img className="croche-logo" src={assets.crocheLogoWhite.src} width={assets.crocheLogoWhite.width} height={assets.crocheLogoWhite.height} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" />
      <span className="croche-tagline">Hand-crocheted bags · Sarajevo</span>
    </span>
  </>;
  if (id === 'una') return layer('unaPoster', 'una-poster');
  if (id === 'captured') return <>
    {layer('capturedPhoto', 'cap-scene')}
    <span className="work-layer cap-mark">
      <img src={assets.capturedWordmark.src} srcSet={assets.capturedWordmark.srcSet} sizes={sizes} width={assets.capturedWordmark.width} height={assets.capturedWordmark.height} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" />
      <i className="cap-c cap-tl" /><i className="cap-c cap-tr" /><i className="cap-c cap-bl" /><i className="cap-c cap-br" />
    </span>
    {/* The bowl is cut from the same photo, so it moves with the photo and only the wordmark slips behind it. */}
    {layer('capturedBowl', 'cap-scene')}
    <span className="cap-fade" />
    <span className="cap-caption"><span>Creative agency</span><span><i className="cap-dot" />Vaasa, Finland</span></span>
  </>;
  return <>
    <span className="work-layer tierd-glow" />
    {layer('tierdType', 'tierd-type')}
    {layer('tierdDot', 'tierd-type tierd-dot')}
    <span className="tierd-tagline">The ranked dev platform</span>
  </>;
}
