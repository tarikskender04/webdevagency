import { site } from '../config/site';

type ThemePreference = 'system' | 'light' | 'dark';
type Theme = 'light' | 'dark';
const root = document.documentElement;
const system = matchMedia('(prefers-color-scheme: dark)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const storageKey = site.themeStorageKey;
let preference: ThemePreference = root.dataset.themePreference === 'light' || root.dataset.themePreference === 'dark' ? root.dataset.themePreference : 'system';

const resolve = (choice: ThemePreference): Theme => choice === 'system' ? (system.matches ? 'dark' : 'light') : choice;
// Theme sources carry 'all' / 'not all' once the pre-paint script has run, so their own media no longer says which theme they serve.
const sourceMedia = (source: HTMLSourceElement, theme: Theme): string => source.hasAttribute('data-theme-source') ? (theme === 'dark' ? (source.dataset.themeBreakpoint || 'all') : 'not all') : source.media;

function applyTheme(): void {
  const theme = resolve(preference);
  root.dataset.themePreference = preference;
  root.dataset.theme = theme;
  document.querySelectorAll<HTMLSourceElement>('[data-theme-source]').forEach(source => { source.media = sourceMedia(source, theme); });
  document.querySelectorAll<HTMLButtonElement>('.theme-switch').forEach(control => { control.setAttribute('aria-checked', String(theme === 'dark')); control.hidden = false; });
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0A1A25' : '#FFFFFF');
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme, preference } }));
}

// Photographs can't interpolate, so each themed picture on screen gets a still copy of its current frame laid over it,
// which fades out while the live picture underneath takes the new plate. Everything else fades live in CSS.
const themedPictures = (): HTMLPictureElement[] => [...new Set([...document.querySelectorAll('[data-theme-source]')].map(source => source.parentElement))]
  .filter((picture): picture is HTMLPictureElement => picture instanceof HTMLPictureElement && onScreen(picture.querySelector('img')));
function onScreen(image: HTMLImageElement | null): image is HTMLImageElement {
  if (!image?.currentSrc || !image.complete) return false;
  const box = image.getBoundingClientRect();
  return box.width > 0 && box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth;
}
// Warm and decode the incoming plates first, so the copy never fades onto a half-loaded picture.
async function preload(pictures: HTMLPictureElement[], theme: Theme): Promise<void> {
  const pending = pictures.map(picture => {
    const image = picture.querySelector('img')!;
    const source = [...picture.querySelectorAll('source')].find(candidate => { const media = sourceMedia(candidate, theme); return !media || matchMedia(media).matches; });
    const probe = new Image();
    probe.sizes = source?.sizes || image.sizes;
    probe.srcset = source?.srcset || image.srcset;
    if (!probe.srcset) probe.src = image.src;
    return probe.decode().catch(() => undefined);
  });
  await Promise.race([Promise.all(pending), new Promise(resolve => setTimeout(resolve, 600))]);
}
const ghosts = new Map<HTMLPictureElement, HTMLImageElement>();
function fadePicture(picture: HTMLPictureElement, duration: number): void {
  const image = picture.querySelector('img')!;
  let ghost = ghosts.get(picture);
  let from = 1;
  if (ghost) {
    // Reversed mid-fade: the copy takes the plate that was coming in, at the opacity that leaves the blend unchanged.
    from = 1 - Number(getComputedStyle(ghost).opacity);
    ghost.getAnimations().forEach(animation => animation.cancel());
  } else {
    ghost = image.cloneNode(false) as HTMLImageElement;
    ['srcset', 'sizes', 'fetchpriority', 'loading', 'id'].forEach(name => ghost!.removeAttribute(name));
    ghost.classList.add('theme-ghost');
    ghost.setAttribute('aria-hidden', 'true');
    if (getComputedStyle(image).position === 'static') {
      // In-flow pictures (the logo) get a positioned host for the copy, restored when it's removed.
      const host = picture.parentElement!;
      if (getComputedStyle(host).position === 'static') { host.style.position = 'relative'; ghost.dataset.host = ''; }
      Object.assign(ghost.style, { position: 'absolute', left: `${picture.offsetLeft}px`, top: `${picture.offsetTop}px`, width: `${picture.offsetWidth}px`, height: `${picture.offsetHeight}px` });
    }
    // After the picture, not inside it, so the copy ignores the picture's sources and keeps the old plate.
    picture.after(ghost);
    ghosts.set(picture, ghost);
  }
  ghost.src = image.currentSrc;
  const fade = ghost.animate([{ opacity: from }, { opacity: 0 }], { duration: duration * from, easing: 'ease-in-out', fill: 'forwards' });
  fade.finished.then(() => {
    if ('host' in ghost!.dataset) picture.parentElement!.style.position = '';
    ghost!.remove();
    ghosts.delete(picture);
  }, () => undefined);
}

let fadeEnd = 0;
let request = 0;
async function changeTheme(next: ThemePreference): Promise<void> {
  const ticket = ++request;
  const theme = resolve(next);
  const commit = (): void => { preference = next; applyTheme(); };
  // The switch answers at once, even while the incoming plates are still warming.
  document.querySelectorAll<HTMLButtonElement>('.theme-switch').forEach(control => control.setAttribute('aria-checked', String(theme === 'dark')));
  if (reducedMotion.matches || theme === root.dataset.theme) { commit(); return; }
  const pictures = themedPictures();
  await preload(pictures.filter(picture => !ghosts.has(picture)), theme);
  if (ticket !== request) return;
  // The minifier may rewrite 1000ms as 1s.
  const fade = getComputedStyle(root).getPropertyValue('--theme-fade').trim();
  const duration = (fade.endsWith('ms') ? parseFloat(fade) : parseFloat(fade) * 1000) || 1000;
  clearTimeout(fadeEnd);
  root.dataset.themeFading = '';
  pictures.forEach(picture => fadePicture(picture, duration));
  commit();
  // Keep the fade's transition list until every colour has landed; dropping it early would snap them.
  fadeEnd = window.setTimeout(() => { delete root.dataset.themeFading; }, duration + 100);
}

document.addEventListener('click', event => {
  const control = event.target instanceof Element ? event.target.closest('.theme-switch') : null;
  if (!control) return;
  const next = control.getAttribute('aria-checked') === 'true' ? 'light' : 'dark';
  try { localStorage.setItem(storageKey, next); } catch { /* The choice still works when storage is unavailable. */ }
  void changeTheme(next);
});
// Warm the other theme's plates as soon as someone reaches for the switch.
const warm = (event: Event): void => {
  const control = event.target instanceof Element ? event.target.closest('.theme-switch') : null;
  const from = (event as FocusEvent | PointerEvent).relatedTarget;
  if (!control || (from instanceof Node && control.contains(from)) || reducedMotion.matches) return;
  void preload(themedPictures(), root.dataset.theme === 'dark' ? 'light' : 'dark');
};
document.addEventListener('pointerover', warm);
document.addEventListener('focusin', warm);
system.addEventListener('change', () => { if (preference === 'system') void changeTheme('system'); });
window.addEventListener('storage', event => {
  if (event.key !== storageKey && event.key !== null) return;
  void changeTheme(event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : 'system');
});
applyTheme();
