import type { JSX } from 'react';
import type { Asset } from '../lib/assets';
interface Props { asset: Asset; alt: string; className?: string; eager?: boolean; sizes?: string; priority?: boolean; }
export function AssetImage({ asset, alt, className, eager = false, sizes = '(max-width: 760px) 180px, 240px', priority = false }: Props): JSX.Element {
  return <img src={asset.src} srcSet={asset.srcSet || undefined} sizes={asset.srcSet ? sizes : undefined} width={asset.width} height={asset.height} alt={alt} className={className} loading={eager ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : undefined} />;
}
