import { initReel } from './reels';
/** /work/ jump bar: marks the project currently in view and keeps its pill visible in the scrolling strip. */
const strip = document.querySelector<HTMLOListElement>('.work-jump ol');
const links = [...document.querySelectorAll<HTMLAnchorElement>('.work-jump a')];
const sections = links.map(link => document.getElementById(link.hash.slice(1)));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const page = document.querySelector<HTMLElement>('.work-page');
const aurora = document.querySelector<HTMLElement>('.work-aurora');
// The glow's colour above the first project, as the page rendered it.
const restingTone = page?.style.getPropertyValue('--work-tone');
let current: number | undefined;
let queued = false;

// Scroll reveals (Design Kit FadeContent): project.css hides [data-reveal] under .reveal-ready, which the inline script
// in the page sets and lifts again if this script never marks itself live. Each element reveals once, after its
// --reveal-delay, then drops the attribute so its own hover transitions apply again. Reduced motion shows everything.
document.documentElement.setAttribute('data-reveal-live', '');
const revealTargets = document.querySelectorAll<HTMLElement>('.work-page [data-reveal]');
const settle = (element: HTMLElement): void => { element.removeAttribute('data-reveal'); element.classList.remove('is-revealed'); };
const revealer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const element = entry.target as HTMLElement;
    revealer.unobserve(element);
    element.classList.add('is-revealed');
    if (reduced.matches) { settle(element); continue; }
    // Every variant moves transform, and it is the longest of each variant's transitions.
    const done = (event: TransitionEvent): void => {
      if (event.target !== element || event.propertyName !== 'transform') return;
      element.removeEventListener('transitionend', done);
      settle(element);
    };
    element.addEventListener('transitionend', done);
  }
}, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
revealTargets.forEach(element => revealer.observe(element));

// The current project is the last one whose top has passed a line 35% down the viewport; above the first, none is.
function update(): void {
  queued = false;
  const line = innerHeight * .35;
  let index: number | undefined;
  sections.forEach((section, i) => { if (section && section.getBoundingClientRect().top <= line) index = i; });
  if (index === current) return;
  current = index;
  tone();
  links.forEach((link, i) => {
    if (i === index) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  if (strip && strip.scrollWidth > strip.clientWidth) {
    const left = index === undefined ? 0 : links[index].parentElement!.offsetLeft - strip.offsetLeft - 16;
    strip.scrollTo({ left, behavior: reduced.matches ? 'auto' : 'smooth' });
  }
}
// The background aurora (and its static fallback glow) takes the colours of the project in view, using its night palette
// after dark where it has one. Above the first project the stops are cleared, so the aurora shows its own day or night
// ramp and the glow returns to the page's resting tone.
function tone(): void {
  const section = current === undefined ? undefined : sections[current];
  const stops = (document.documentElement.dataset.theme === 'dark' && section?.dataset.auroraNight) || section?.dataset.aurora;
  if (aurora) aurora.dataset.stops = stops ?? '';
  if (page && restingTone) page.style.setProperty('--work-tone', stops?.split(',')[0] ?? restingTone);
}
document.addEventListener('themechange', tone);
const schedule = (): void => { if (!queued) { queued = true; requestAnimationFrame(update); } };
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', schedule);
update();

// Project sheets open full size in a modal; Esc, the close button or a click outside the image closes it.
const lightbox = document.querySelector<HTMLDialogElement>('.work-lightbox');
if (lightbox) {
  const image = lightbox.querySelector('img')!;
  const caption = lightbox.querySelector('figcaption')!;
  document.addEventListener('click', event => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-lightbox]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    image.src = link.href;
    const preview = link.querySelector('img');
    image.alt = preview?.alt ?? '';
    if (preview) lightbox.style.setProperty('--ratio', String(preview.width / preview.height));
    caption.textContent = link.dataset.caption ?? '';
    lightbox.showModal();
  });
  lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
}

// Walkthrough: the supplied thumbnail stands in for the player; pressing it removes the thumbnail and starts the video.
const start = document.querySelector<HTMLButtonElement>('.walkthrough-start');
const video = start?.parentElement?.querySelector('video');
if (start && video) {
  start.addEventListener('click', () => {
    start.remove();
    video.focus();
    video.play().catch(() => { /* Playback refused: the native controls remain. */ });
  });
}

// Phone swipe strips: the bar after each strip shows how much of it is in view, where the view sits, and which item leads.
for (const strip of document.querySelectorAll<HTMLElement>('[data-swipe]')) {
  const bar = strip.nextElementSibling;
  if (!bar?.classList.contains('swipe-bar')) continue;
  const count = bar.querySelector('.swipe-count b');
  const items = [...strip.querySelectorAll<HTMLElement>('.work-tile, .work-fit-card, .project-detail, .walkthrough-chapters li')];
  let pending = false;
  const measure = (): void => {
    pending = false;
    const range = strip.scrollWidth - strip.clientWidth;
    // A strip of text cards has nothing focusable inside, so while it scrolls it takes focus itself and the arrow keys
    // move it; where it fits (desktop) it is no tab stop.
    if (!strip.querySelector('a, button, video')) {
      if (range > 0) strip.tabIndex = 0;
      else strip.removeAttribute('tabindex');
    }
    if (range <= 0) return;
    bar.setAttribute('style', `--swipe-visible: ${(strip.clientWidth / strip.scrollWidth).toFixed(3)}; --swipe-progress: ${(strip.scrollLeft / range).toFixed(3)}`);
    // The leading item is the last one whose left edge has reached the strip's padding; at the very end, the last item.
    const edge = strip.getBoundingClientRect().left + parseFloat(getComputedStyle(strip).scrollPaddingLeft || '0') + 8;
    let lead = 0;
    items.forEach((item, i) => { if (item.getBoundingClientRect().left <= edge) lead = i; });
    if (strip.scrollLeft >= range - 2) lead = items.length - 1;
    if (count) count.textContent = String(lead + 1).padStart(2, '0');
  };
  const queue = (): void => { if (!pending) { pending = true; requestAnimationFrame(measure); } };
  strip.addEventListener('scroll', queue, { passive: true });
  new ResizeObserver(queue).observe(strip);
}

for (const reel of document.querySelectorAll<HTMLElement>('.work-tile-reel')) initReel(reel, reduced);
