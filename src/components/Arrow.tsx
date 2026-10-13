import type { JSX } from 'react';
interface Props { diagonal?: boolean; }
export function Arrow({ diagonal = false }: Props): JSX.Element {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d={diagonal ? 'M3 13 13 3M13 3H5M13 3v8' : 'M2 8h12M9 3l5 5-5 5'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
