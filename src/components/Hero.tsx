import type { JSX, CSSProperties } from 'react';
import type { Assets } from '../lib/assets';
import { AssetImage } from './AssetImage';
import { Arrow } from './Arrow';
interface Props { assets: Assets; }
export function Hero({ assets }: Props): JSX.Element {
  return <section className="hero" aria-labelledby="hero-heading">
    <div className="hero-halo" aria-hidden="true" />
    <div className="hero-heading container">
      <h1 id="hero-heading">The best site your business <em>has ever had</em></h1>
      <AssetImage asset={assets.butterfly} alt="" className="motif hero-butterfly" sizes="(max-width: 760px) 70px, 120px" eager />
      <AssetImage asset={assets.blueMark} alt="" className="motif hero-blue-mark" sizes="(max-width: 760px) 60px, 103px" eager />
    </div>
    <div className="work-deck" aria-label="Crochê project previews">
      <div className="deck-glow" aria-hidden="true" />
      {(['clutch', 'square', 'special', 'comingSoon', 'productTriangle', 'film', 'sunSalt'] as const).map((key, index) => (
        <a key={key} href="#work" className={`deck-item deck-item-${index}`} aria-label="Explore the Crochê project and our capabilities" style={{ '--deal-delay': `${.3 + Math.abs(index - 3) * .08}s` } as CSSProperties}>
          {index === 0 && <span className="project-tag">Crochê · brand + site</span>}
          <div className={`deck-card ${index === 3 ? 'deck-card-featured' : ''}`}>
            <AssetImage asset={assets[key]} alt={index === 3 ? 'Crochê website coming-soon screen' : `Crochê ${key === 'film' ? 'website storyboard' : key === 'sunSalt' ? 'collection design' : 'handmade bag'}`} sizes="(max-width: 760px) 100px, 206px" eager={index !== 0 && index !== 6} />
          </div>
        </a>
      ))}
    </div>
    <div className="hero-bottom container">
      <p>We design and build the site, write the words, and hand you a system your team can run.</p>
      <div className="hero-actions">
        <AssetImage asset={assets.triangle} alt="" className="motif cta-triangle" sizes="110px" />
        <AssetImage asset={assets.star} alt="" className="motif cta-star" sizes="90px" />
        <a className="button button-glass" href="#start">Start a project <Arrow /></a>
        <a className="button button-glass" href="#work">See the work</a>
      </div>
    </div>
    <div className="client-strip container"><span className="eyebrow">Selected work</span><ul aria-label="Clients"><li>Crochê</li><li>Una Adventure</li><li>Tierd</li><li>Captured</li></ul></div>
  </section>;
}
