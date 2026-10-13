import { useState, type JSX } from 'react';
import type { Assets } from '../lib/assets';
import { AssetImage } from './AssetImage';
import { DemoFrame } from './DemoFrame';
import { useDemoCycle } from './useDemoCycle';
export type DemoKind = 'brand' | 'ordering' | 'editing' | 'dashboard' | 'emails';
interface Props { kind: DemoKind; assets: Pick<Assets, 'clutch' | 'square' | 'productTriangle' | 'crocheLogo'>; }

function BrandDemo({ assets }: Pick<Props, 'assets'>): JSX.Element {
  const { ref, phase, choose } = useDemoCycle(3, 3400);
  const palettes = [
    { name: 'Kost', colors: ['#F4F0E9', '#E4DCCB', '#B9A78C', '#14110F', '#7B1E3A'] },
    { name: 'Sun & Salt', colors: ['#FAF6EC', '#E4DCCB', '#B9A78C', '#14110F', '#7B1E3A'] },
    { name: 'Wine', colors: ['#F4F0E9', '#E4DCCB', '#7B1E3A', '#14110F', '#B9A78C'] },
  ];
  return <div ref={ref}><DemoFrame address="croche.ba/design-system">
    <div className="demo-toolbar"><strong>Design system</strong><span className="mini-label">Build</span><span className="mock-save">Applied ✓</span></div>
    <div className="brand-builder">
      <aside className="brand-controls"><span className="mini-label">Palette</span>{palettes.map((palette, index) => <button className={`palette-choice ${phase === index ? 'selected' : ''}`} aria-pressed={phase === index} key={palette.name} onClick={() => choose(index)}><span>{palette.name}</span><span className="palette-strip">{palette.colors.map((color, i) => <i key={i} style={{ background: color }} />)}</span></button>)}<span className="mini-label">Display type</span><div className="type-choice"><span className="serif">Aa</span><span>Bodoni Moda<small>Names & collections</small></span></div><span className="mini-label">Mark</span><AssetImage asset={assets.crocheLogo} alt="Crochê logo" className="builder-logo" /></aside>
      <div className="brand-preview" style={{ background: palettes[phase].colors[0] }}><AssetImage asset={assets.crocheLogo} alt="" className="preview-logo" /><span className="mini-label">Handmade. One at a time.</span><h4 className="serif">Salt &amp; Sun</h4><p>A bag with a little summer in it.</p><div className="preview-product"><AssetImage asset={assets.clutch} alt="Crochê handmade clutch bag" /></div><div className="swatch-row">{palettes[phase].colors.map((color, i) => <span key={i} style={{ background: color }} />)}</div><div className="brand-preview-bottom"><span>Clutch · Classic</span><span>60 KM</span></div></div>
    </div>
  </DemoFrame></div>;
}

function OrderingDemo({ assets }: Pick<Props, 'assets'>): JSX.Element {
  const { ref, phase, choose } = useDemoCycle(3, 3600);
  const [selectedYarns, setSelectedYarns] = useState<string[]>(['Natural']);
  const [size, setSize] = useState('Classic');
  const models = [{ name: 'Clutch', image: assets.clutch, price: 60 }, { name: 'Square', image: assets.square, price: 70 }, { name: 'Triangle', image: assets.productTriangle, price: 70 }];
  const yarns = [{ name: 'Natural', color: '#E4DCCB' }, { name: 'Wine', color: '#7B1E3A' }, { name: 'Ink', color: '#14110F' }, { name: 'Warm', color: '#B9A78C' }];
  function toggleYarn(name: string): void { choose(phase); setSelectedYarns(current => current.includes(name) ? current.filter(item => item !== name) : current.length < 3 ? [...current, name] : current); }
  return <div ref={ref}><DemoFrame address="croche.ba/make-your-bag">
    <div className="shop-nav"><AssetImage asset={assets.crocheLogo} alt="Crochê" /><span>Make your bag</span></div>
    <div className="order-builder"><div className="order-product"><span className="mini-label">Made for you</span><AssetImage asset={models[phase].image} alt={`${models[phase].name} bag preview`} /><span className="serif">{models[phase].name}</span></div><div className="order-controls"><span className="mini-label">01 / Choose your shape</span><div className="mock-options">{models.map((model, index) => <button type="button" key={model.name} aria-pressed={phase === index} className={phase === index ? 'selected' : ''} onClick={() => choose(index)}>{model.name}</button>)}</div><span className="mini-label">02 / Size</span><div className="mock-options">{['Classic', 'Mini'].map(item => <button key={item} aria-pressed={size === item} className={size === item ? 'selected' : ''} onClick={() => setSize(item)}>{item}</button>)}</div><span className="mini-label">03 / Up to three yarns</span><div className="yarn-options">{yarns.map(yarn => <button key={yarn.name} className={selectedYarns.includes(yarn.name) ? 'selected' : ''} aria-label={`${yarn.name} yarn`} aria-pressed={selectedYarns.includes(yarn.name)} onClick={() => toggleYarn(yarn.name)} style={{ background: yarn.color }} />)}</div><p className="mock-note">{selectedYarns.length} / 3 colours selected</p><div className="order-total"><span>Your bag</span><strong>{models[phase].price} KM</strong></div><p className="mock-note">Cash or card when it arrives.</p></div></div>
  </DemoFrame></div>;
}

function EditingDemo({ assets }: Pick<Props, 'assets'>): JSX.Element {
  const [stock, setStock] = useState(true);
  const [launch, setLaunch] = useState(false);
  const [saved, setSaved] = useState(false);
  return <DemoFrame address="croche.ba/owner/catalogue">
    <div className="demo-toolbar"><strong>Catalogue</strong><span className="mini-label">Owner's dashboard</span></div>
    <div className="editing-panel"><span className="mini-label">Models / Square</span><div className="editing-product"><AssetImage asset={assets.square} alt="Square bag" /><div><h4 className="serif">Square</h4><p>Classic · 70 KM</p><span className="stock-label">{stock ? 'In stock' : 'Sold out'}</span></div></div><div className="editing-row"><span>Available to order<small>Shown in the shop right away</small></span><button className="toggle" role="switch" aria-checked={stock} aria-label="Available to order" onClick={() => { setStock(!stock); setSaved(false); }}><span /></button></div><div className="editing-row"><span>Open at launch<small>Keep it hidden until opening day</small></span><button className="toggle" role="switch" aria-checked={launch} aria-label="Open at launch" onClick={() => { setLaunch(!launch); setSaved(false); }}><span /></button></div><button className="mock-primary" onClick={() => setSaved(true)}>{saved ? 'Preview updated ✓' : 'Update preview'}</button><span className="mock-note" role="status">{saved ? 'The shop preview reflects your changes.' : 'Your catalogue. Your call.'}</span></div>
  </DemoFrame>;
}

function DashboardDemo(): JSX.Element {
  const { ref, phase, choose } = useDemoCycle(3, 4200);
  const periods = ['This week', 'This month', 'All time'];
  return <div ref={ref}><DemoFrame address="croche.ba/owner">
    <div className="demo-toolbar"><strong>Good morning, Iman.</strong><span className="mini-label">Sample data</span></div><div className="dashboard-panel"><div className="dashboard-top"><h4>Here's your day.</h4><div className="mock-options">{periods.map((period, index) => <button key={period} aria-pressed={phase === index} className={phase === index ? 'selected' : ''} onClick={() => choose(index)}>{period}</button>)}</div></div><div className="dashboard-stats">{[['Waiting', '04'], ['In the making', '08'], ['Ready to send', '03']].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="chart-title"><span>Orders over time</span><span className="mini-label">{periods[phase]}</span></div><div className="mock-chart" role="img" aria-label="Sample order activity chart">{[25, 40, 31, 55, 43, 72, 63, 80, 52, 67, 91, 75].map((height, index) => <span key={index} style={{ height: `${Math.max(12, height - phase * (index % 3) * 8)}%` }} />)}</div><div className="dashboard-orders"><div><span>CR-MYB-0182</span><span>Square · Classic</span><span className="stock-label">In the making</span></div><div><span>CR-MYB-0181</span><span>Clutch · Natural</span><span className="stock-label">Ready to send</span></div></div></div>
  </DemoFrame></div>;
}

function EmailsDemo({ assets }: Pick<Props, 'assets'>): JSX.Element {
  const { ref, phase, choose } = useDemoCycle(3, 3400);
  const stages = ['Confirmed', 'Finished', 'Shipped'];
  return <div ref={ref}><DemoFrame address="croche.ba/owner/orders/0182"><div className="demo-toolbar"><strong>Order CR-MYB-0182</strong><span className="mini-label">Customer emails</span></div><div className="email-panel"><div className="email-timeline">{stages.map((stage, index) => <button key={stage} aria-pressed={phase === index} className={phase === index ? 'selected' : ''} onClick={() => choose(index)}><span>{`0${index + 1}`}</span>{stage}</button>)}</div><div className="email-preview" key={phase}><span className="mini-label">Email preview / {stages[phase]}</span><AssetImage asset={assets.crocheLogo} alt="Crochê" /><h4 className="serif">{['Your bag starts here.', 'Made, just for you.', 'On its way to you.'][phase]}</h4><p>{['Your order is confirmed. Iman will let you know when she starts making your bag.', 'The last stitch is in. Here is your finished Square, ready for its first outing.', 'Your bag is packed and on its way. Follow its journey with your tracking number.'][phase]}</p><div className="email-product"><AssetImage asset={assets.square} alt="Square bag in the email preview" /><div><strong>Square · Classic</strong><span>Natural / Wine</span><span>70 KM</span></div></div><span className="email-signoff serif">Made slowly. Carried everywhere.</span></div></div></DemoFrame></div>;
}

export function CapabilityDemo({ kind, assets }: Props): JSX.Element {
  switch (kind) {
    case 'brand': return <BrandDemo assets={assets} />;
    case 'ordering': return <OrderingDemo assets={assets} />;
    case 'editing': return <EditingDemo assets={assets} />;
    case 'dashboard': return <DashboardDemo />;
    case 'emails': return <EmailsDemo assets={assets} />;
  }
}
