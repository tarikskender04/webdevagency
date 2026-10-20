/** Cookie notice: shown until the visitor answers, then remembered (src/lib/consent.ts). The footer's "Cookie settings"
 *  button shows it again. It slides up after the page has settled and drops away on an answer; with reduced motion it
 *  simply appears and disappears. */
import { readConsent, saveConsent, type ConsentChoice } from '../lib/consent';

const notice = document.querySelector<HTMLElement>('[data-cookie-notice]');
if (notice) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let returnFocus: HTMLElement | null = null;

  const show = (focus = false): void => {
    notice.hidden = false;
    // Next frame, so the entrance transition runs from its hidden state.
    requestAnimationFrame(() => requestAnimationFrame(() => notice.classList.add('is-open')));
    if (focus) notice.querySelector<HTMLButtonElement>('[data-consent]')?.focus({ preventScroll: true });
  };
  const hide = (): void => {
    notice.classList.remove('is-open');
    const done = (): void => { notice.hidden = true; };
    if (reduced.matches) done();
    else setTimeout(done, 260);
    returnFocus?.focus({ preventScroll: true });
    returnFocus = null;
  };

  notice.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-consent]');
    if (!button) return;
    saveConsent(button.dataset.consent as ConsentChoice);
    hide();
  });
  notice.addEventListener('keydown', event => { if (event.key === 'Escape' && returnFocus) hide(); });

  for (const opener of document.querySelectorAll<HTMLButtonElement>('[data-cookie-settings]')) {
    opener.addEventListener('click', () => { returnFocus = opener; show(true); });
  }

  if (!readConsent()) {
    // Wait for the page's own opening to finish so the notice never competes with it.
    const delay = reduced.matches ? 0 : 900;
    const open = (): void => { setTimeout(() => show(), delay); };
    if (document.readyState === 'complete') open();
    else addEventListener('load', open, { once: true });
  }
}
