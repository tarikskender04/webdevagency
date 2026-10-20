import { useId, type JSX } from 'react';
import type { Assets, ImageKey } from '../lib/assets';
import { AssetImage } from './AssetImage';
import { DemoFrame } from './DemoFrame';
interface Props { kind: 'notebook' | 'design' | 'code' | 'launch'; assets: Assets; }
const code = ['const order = await createOrder({', '  model: "Square",', '  size: "Classic",', '  yarns: ["Natural", "Wine"],', '  payment: "on_delivery",', '});', '', 'await notifyCustomer(order);', 'return { status: "confirmed" };'];
const stickers: { asset: ImageKey; name: string; alt: string; rotation: number; x: number; y: number; w: number; h: number }[] = [
  { asset: 'sitemap', name: 'sitemap', alt: 'Crochê sitemap planning sketch', rotation: -3, x: 0, y: 0, w: 56, h: 26 },
  { asset: 'logoSketch', name: 'logo', alt: 'Crochê logo sketches', rotation: 4, x: 54, y: 2, w: 46, h: 30 },
  { asset: 'sunSalt', name: 'collection', alt: 'Sun and Salt collection planning', rotation: 3, x: 0, y: 31, w: 44, h: 40 },
  { asset: 'palette', name: 'palette', alt: 'Crochê colour palette', rotation: -2, x: 42, y: 34, w: 56, h: 21 },
  { asset: 'film', name: 'film', alt: 'Homepage film storyboard', rotation: -3, x: 36, y: 60, w: 62, h: 37 },
];
export function ProcessVisual({ kind, assets }: Props): JSX.Element {
  const paperId = useId().replace(/:/g, '');
  if (kind === 'notebook') return <div className="notebook">
    <div className="notebook-paper">
      <svg className="notebook-texture" aria-hidden="true" focusable="false">
        <defs>
          <filter id={`${paperId}-mottle`}><feTurbulence type="fractalNoise" baseFrequency=".011" numOctaves="2" seed="7" /><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .45  0 0 0 0 .3  0 0 0 .09 0" /></filter>
          <filter id={`${paperId}-grain`}><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 .3  0 0 0 0 .25  0 0 0 0 .16  0 0 0 .16 0" /></filter>
        </defs>
        <rect width="100%" height="100%" filter={`url(#${paperId}-mottle)`} /><rect width="100%" height="100%" filter={`url(#${paperId}-grain)`} />
      </svg>
      <div className="notebook-top"><span>Crochê — planning notebook</span><span>p. 01</span></div>
      <div className="notebook-collage">
        {stickers.map(sticker => <div key={sticker.name} className={`sticker sticker-${sticker.name}`} data-sticker data-rot={sticker.rotation} data-x={sticker.x} data-y={sticker.y} data-w={sticker.w} data-h={sticker.h}><AssetImage asset={assets[sticker.asset]} alt={sticker.alt} sizes="(max-width: 760px) 50vw, 280px" /></div>)}
        <span className="notebook-pencil" data-pencil aria-hidden="true" />
      </div>
      <div className="notebook-bottom">Frame by frame, before a line of code</div>
    </div>
    <span className="notebook-tape tape-left" aria-hidden="true" /><span className="notebook-tape tape-right" aria-hidden="true" />
    <div className="sticky-note-piece" data-process-piece data-px="40"><span className="sticky-note">the bag is the only warm thing in frame</span></div>
  </div>;
  if (kind === 'design') return <div className="process-card design-card">
    <div className="process-card-header"><span className="status-dot" /><span className="eyebrow">Crochê — design system v1.1</span></div>
    <div className="design-card-body">
      <div data-process-piece><AssetImage asset={assets.crocheLogo} alt="Crochê primary logo" className="design-logo" /></div>
      <div className="design-swatches">{[['Kost', '#F4F0E9'], ['Tone', '#E4DCCB'], ['Warm', '#B9A78C'], ['Ink', '#14110F'], ['Wine', '#7B1E3A']].map(([name, color]) => <div key={name} data-process-piece><div className="design-swatch"><span style={{ background: color }} /><strong>{name}</strong><small>{color}</small></div></div>)}</div>
      <div className="design-type" data-process-piece><span className="serif">Salt &amp; Sun</span><span className="mini-label">Bodoni Moda / Archivo / Mono</span></div>
      <div className="design-price" data-process-piece><span>Clutch · Classic</span><span>60 KM</span></div><div className="design-price" data-process-piece><span>Square · Classic</span><span>70 KM</span></div>
    </div>
    <div className="glass-zone"><div className="glass-strip" data-process-glass><span>System rules</span><strong>Radius 0</strong><strong>No icons, only words</strong><strong>Accent under 5%</strong></div></div>
  </div>;
  if (kind === 'code') return <DemoFrame address="croche.ba / development" className="code-card">
    <div className="process-build-preview">
      <div className="process-storefront">
        <div className="process-storefront-title" data-process-piece><span className="serif">Crochê</span><span className="mini-label">Salt &amp; Sun</span></div>
        <AssetImage asset={assets.square} alt="Square bag website preview" className="process-storefront-hero" sizes="240px" />
        <div className="process-products">{(['clutch', 'square', 'productTriangle'] as const).map((name, index) => <div key={name} data-process-piece><div className="process-product"><AssetImage asset={assets[name]} alt="" sizes="90px" /><span>{['Clutch', 'Square', 'Triangle'][index]}</span></div></div>)}</div>
      </div>
      <div className="code-editor">
        <div className="code-editor-top"><span>order.ts</span><span className="mini-label">React + Supabase</span></div>
        <pre tabIndex={0} aria-label="Illustrative order code"><code>{code.map((line, i) => <span className="code-line" key={i}><span aria-hidden="true">{i + 1}</span><span className="code-type" data-process-type={line}>{line || ' '}</span></span>)}</code></pre>
        <div className="code-status" data-process-piece><span className="status-dot" />Build passed<span>All checks clear</span></div>
      </div>
    </div>
    <div className="glass-zone"><div className="glass-strip" data-process-glass><span>Built around the maker</span><strong>One catalogue. Both order tracks.</strong></div></div>
  </DemoFrame>;
  return <div className="process-card launch-card">
    <div className="process-card-header"><span className="status-dot" /><span className="eyebrow">Crochê — ready for opening day</span></div>
    <div className="launch-screen"><AssetImage asset={assets.comingSoon} alt="Crochê coming-soon website" sizes="(max-width: 760px) 100vw, 560px" /><span className="launch-badge" data-process-piece>Launch assets</span></div>
    <div className="launch-checklist">{['Coming-soon page', 'Catalogue & ordering', "Owner's dashboard", 'Customer emails'].map(label => <div key={label} data-process-piece><span><i>✓</i> {label}</span></div>)}</div>
    <div className="glass-zone"><div className="glass-strip" data-process-glass><span>From the first sketch to launch</span><strong>Still on the phone with you</strong></div></div>
  </div>;
}
