import type { JSX, ReactNode } from 'react';
interface Props { address: string; children: ReactNode; className?: string; }
export function DemoFrame({ address, children, className = '' }: Props): JSX.Element {
  return <div className={`demo-frame ${className}`}>
    <div className="browser-bar" aria-hidden="true"><span className="browser-dots"><i /><i /><i /></span><span className="browser-address">{address}</span><span className="browser-corner">↗</span></div>
    <div className="demo-content">{children}</div>
    <div className="demo-caption"><span className="status-dot" />Interactive preview</div>
  </div>;
}
