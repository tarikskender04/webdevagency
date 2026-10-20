import type { JSX, CSSProperties } from 'react';
import type { Assets, ImageKey } from '../lib/assets';
import { work } from '../config/work';
import { deckOffset, deckReach } from '../lib/deck';
import { WorkArt } from './WorkArt';
import { Arrow } from './Arrow';
import '../styles/hero.css';
interface Props { assets: Assets; }
const capabilities = ['Brand identity', 'Online ordering', 'Content editing', "Owner's dashboard", 'Customer emails'];
const phases = ['Plan it out', 'Take it digital', 'Engineer it', 'Polish it', 'Ship it'];
// Fixed positions keep the server render deterministic: x%, start height%, size px, duration s, delay s.
const motes = [[8, 18, 3, 19, 0], [14, 42, 2, 23, 6], [21, 12, 4, 17, 3], [29, 55, 2, 25, 9], [36, 30, 3, 21, 1], [44, 64, 2, 27, 12], [52, 22, 3, 18, 5], [58, 48, 2, 24, 2], [65, 14, 4, 20, 8], [71, 58, 2, 26, 4], [78, 34, 3, 22, 10], [85, 20, 2, 19, 7], [91, 50, 3, 24, 11], [33, 74, 2, 28, 13], [62, 80, 2, 23, 14], [48, 8, 3, 21, 15]];
export function Hero({ assets }: Props): JSX.Element {
  return <section className="hero" aria-labelledby="hero-heading">
    <div className="hero-scene" aria-hidden="true">
      <picture>
        <source data-theme-source media="(prefers-color-scheme: dark)" srcSet={assets.heroPlate.srcSet} sizes="100vw" />
        <img className="hero-plate" src={assets.heroPlateLight.src} srcSet={assets.heroPlateLight.srcSet} sizes="100vw" width={assets.heroPlateLight.width} height={assets.heroPlateLight.height} alt="" loading="eager" decoding="async" fetchPriority="high" />
      </picture>
      <div className="hero-rays"><span /><span /><span /></div>
      <div className="hero-shade" />
      <div className="hero-motes">
        {motes.map(([x, y, size, duration, delay], index) => <span key={index} style={{ '--x': `${x}%`, '--y': `${y}%`, '--s': `${size}px`, '--d': `${duration}s`, '--delay': `-${delay}s` } as CSSProperties} />)}
      </div>
    </div>
    <ul className="hero-rail hero-rail-left" aria-hidden="true">{capabilities.map(item => <li key={item}>{item}</li>)}</ul>
    <ul className="hero-rail hero-rail-right" aria-hidden="true">{phases.map(item => <li key={item}>{item}</li>)}</ul>
    <div className="hero-copy container">
      <div className="hero-title">
        <h1 id="hero-heading">The best site your business <em>has ever had</em></h1>
      </div>
      <p className="hero-sub">We design and build the site, write the words, and hand you a system your team can run.</p>
      <div className="hero-actions">
        <a className="button hero-primary" href="#start">Start a project <Arrow /></a>
        <a className="button hero-secondary" href="#process">See the work</a>
      </div>
    </div>
    {/* Selected work: the active client stands on the pedestal and the strip below picks one (src/scripts/work-deck.ts). */}
    <div className="deck-stage" id="work-deck" role="region" aria-roledescription="carousel" aria-labelledby="work-label">
      <div className="deck-beam" aria-hidden="true" />
      <div className="deck-pedestal" aria-hidden="true"><span /></div>
      <div className="deck" aria-live="off">
        {work.map(({ id, client, tag, description, href, linkLabel }, index) => {
          const offset = deckOffset(index, 0, work.length);
          const badge = assets[`${id}Badge` as ImageKey];
          const art = <WorkArt id={id} assets={assets} eager={offset === 0} />;
          return <div key={id} className={`deck-slot work-${id}`} data-pos={offset} data-parked={Math.abs(offset) > deckReach(work.length) || undefined} role="group" aria-roledescription="slide" aria-label={`${client}, ${index + 1} of ${work.length}`} aria-hidden={offset !== 0 || undefined} style={{ '--deal-delay': `${.45 + Math.min(Math.abs(offset), 2) * .12}s` } as CSSProperties}>
            <span className="deck-float">
              <span className="deck-tag"><img className="deck-badge" src={badge.src} srcSet={badge.srcSet} sizes="34px" width={badge.width} height={badge.height} alt="" decoding="async" /><span className="deck-tag-label"><span>{tag}</span></span></span>
              <a className="deck-link" href={href} aria-label={linkLabel} tabIndex={offset === 0 ? undefined : -1}>
                <span className="deck-card work-art" role="img" aria-label={description}>{art}</span>
                <span className="deck-open" aria-hidden="true">View project <Arrow /></span>
              </a>
            </span>
          </div>;
        })}
      </div>
    </div>
    <div className="client-strip container">
      <span className="eyebrow" id="work-label">Selected work</span>
      <div className="work-picks" role="group" aria-labelledby="work-label">
        {work.map(({ id, client }, index) => {
          const badge = assets[`${id}Badge` as ImageKey];
          return <button key={id} type="button" className="work-pick" aria-controls="work-deck" aria-current={index === 0 || undefined}><img src={badge.src} srcSet={badge.srcSet} sizes="22px" width={badge.width} height={badge.height} alt="" decoding="async" />{client}</button>;
        })}
        <button type="button" className="work-toggle" aria-controls="work-deck" aria-label="Pause selected work" hidden>
          <svg className="work-toggle-pause" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><rect x="1.5" y="1" width="2.4" height="8" rx=".6" /><rect x="6.1" y="1" width="2.4" height="8" rx=".6" /></svg>
          <svg className="work-toggle-play" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.6 1.2v7.6a.5.5 0 0 0 .76.43l6.1-3.8a.5.5 0 0 0 0-.86L3.36.77a.5.5 0 0 0-.76.43z" /></svg>
        </button>
      </div>
      <noscript><div className="work-links">{work.map(({ id, client, href }) => <a key={id} href={href}>{client} ↗</a>)}</div></noscript>
    </div>
  </section>;
}
