import { site } from '../config/site';

/** The visitor's answer to the cookie notice, kept in local storage under site.consent.storageKey.
 *  `optional` records the list of optional storage the answer was given for; when that list changes, the answer no longer
 *  applies and the notice asks again. Without storage the answer lives for the current page only. */
export type OptionalStorage = (typeof site.consent.optional)[number];
export type ConsentChoice = 'acknowledged' | 'accepted' | 'essential';
export interface Consent { choice: ConsentChoice; optional: string; at: string; }

const key = site.consent.storageKey;
const scope = site.consent.optional.join(',');
let memory: Consent | undefined;

export function readConsent(): Consent | undefined {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as Consent | null;
    if (saved && saved.optional === scope && ['acknowledged', 'accepted', 'essential'].includes(saved.choice)) return saved;
  } catch { /* Blocked or malformed storage: fall back to this page's answer. */ }
  return memory;
}

export function saveConsent(choice: ConsentChoice): Consent {
  memory = { choice, optional: scope, at: new Date().toISOString() };
  try { localStorage.setItem(key, JSON.stringify(memory)); } catch { /* Storage blocked: the answer holds for this page. */ }
  dispatchEvent(new CustomEvent<Consent>('consentchange', { detail: memory }));
  return memory;
}

/** True only after the visitor accepted, and only for storage the notice asked about. Load optional tools behind this. */
export function hasConsent(kind: OptionalStorage): boolean {
  return site.consent.optional.includes(kind) && readConsent()?.choice === 'accepted';
}

/** Runs `callback` now if consent is already given, otherwise once the visitor accepts. */
export function whenConsented(kind: OptionalStorage, callback: () => void): void {
  if (hasConsent(kind)) { callback(); return; }
  const listen = (): void => { if (hasConsent(kind)) { removeEventListener('consentchange', listen); callback(); } };
  addEventListener('consentchange', listen);
}
