import { deckOffset, deckReach } from '../lib/deck';

/** Hero work deck: the active client card stands on the pedestal, the others wait on the arc, and the client strip
 *  picks one. Clicking a side card brings it forward. The deck advances when the active name's progress underline
 *  finishes (a CSS animation), so holding the deck just pauses that animation: hover, keyboard focus, an offscreen
 *  hero or a hidden tab hold it, and the pause button holds it until pressed again. Under reduced motion it never
 *  advances on its own and every move is instant. */
export function initWorkDeck(): () => void {
  const deck = document.querySelector<HTMLElement>('.deck-stage');
  const strip = document.querySelector<HTMLElement>('.hero .client-strip');
  const track = deck?.querySelector<HTMLElement>('.deck');
  if (!deck || !strip || !track) return (): void => {};
  const slots = Array.from(deck.querySelectorAll<HTMLElement>('.deck-slot'));
  const picks = Array.from(strip.querySelectorAll<HTMLButtonElement>('.work-pick'));
  const toggle = strip.querySelector<HTMLButtonElement>('.work-toggle');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const count = slots.length;
  const reach = deckReach(count);
  const holds = new Set<string>();
  const timers = new Set<number>();
  let active = 0;
  let paused = false;

  const place = (slot: HTMLElement, position: number, instant = false): void => {
    slot.dataset.pos = String(position);
    slot.toggleAttribute('data-parked', Math.abs(position) > reach);
    slot.toggleAttribute('data-instant', instant);
  };
  const later = (callback: () => void, delay: number): void => {
    const id = window.setTimeout(() => { timers.delete(id); callback(); }, delay);
    timers.add(id);
  };
  const sync = (): void => {
    const playing = !motion.matches;
    const held = paused || holds.size > 0;
    strip.classList.toggle('is-playing', playing);
    strip.classList.toggle('is-held', held);
    deck.classList.toggle('is-still', paused || holds.has('offscreen') || holds.has('hidden'));
    // Announce the new card only when it was not the deck moving on by itself.
    track.setAttribute('aria-live', playing && !held ? 'off' : 'polite');
    if (!toggle) return;
    toggle.hidden = !playing;
    toggle.toggleAttribute('data-paused', paused);
    toggle.setAttribute('aria-label', paused ? 'Play selected work' : 'Pause selected work');
  };

  const go = (target: number): void => {
    target = (target % count + count) % count;
    if (target === active) return;
    const shift = deckOffset(target, active, count);
    active = target;
    timers.forEach(id => window.clearTimeout(id));
    timers.clear();
    slots.forEach((slot, index) => {
      const from = Number(slot.dataset.pos);
      const to = deckOffset(index, active, count);
      const current = to === 0;
      const link = slot.querySelector('a');
      if (current) { slot.removeAttribute('aria-hidden'); link?.removeAttribute('tabindex'); }
      else { slot.setAttribute('aria-hidden', 'true'); link?.setAttribute('tabindex', '-1'); }
      const travel = from - shift;
      if (travel === to || motion.matches) { place(slot, to); return; }
      // The card wraps round the ring: it leaves off one end of the arc and comes back in from the other.
      const exit = Math.max(-reach - 1, Math.min(reach + 1, travel));
      const entry = -Math.sign(exit) * (reach + 1);
      const hidden = Math.abs(from) > reach;
      if (!hidden) place(slot, exit);
      later(() => {
        if (Math.abs(to) > reach) { place(slot, to, true); return; }
        place(slot, entry, true);
        void slot.offsetWidth;
        place(slot, to);
      }, hidden ? 0 : 450);
    });
    picks.forEach((pick, index) => index === active ? pick.setAttribute('aria-current', 'true') : pick.removeAttribute('aria-current'));
  };

  const hold = (reason: string, on: boolean): void => { if (on) holds.add(reason); else holds.delete(reason); sync(); };
  const inside = (node: EventTarget | null): boolean => node instanceof Node && (deck.contains(node) || strip.contains(node));
  const onPick = (event: MouseEvent): void => {
    const pick = (event.target as Element).closest<HTMLButtonElement>('.work-pick');
    if (pick) go(picks.indexOf(pick));
  };
  const onCard = (event: MouseEvent): void => {
    const slot = (event.target as Element).closest<HTMLElement>('.deck-slot');
    if (!slot || slot.dataset.pos === '0') return;
    event.preventDefault();
    go(slots.indexOf(slot));
  };
  const onProgress = (event: AnimationEvent): void => {
    if (event.animationName === 'work-progress' && event.target === picks[active]) go(active + 1);
  };
  const onToggle = (): void => { paused = !paused; sync(); };
  // Keyboard focus holds the deck while someone reads it; a mouse click on a name does not.
  const onFocusIn = (event: FocusEvent): void => hold('focus', (event.target as Element).matches(':focus-visible'));
  const onFocusOut = (event: FocusEvent): void => { if (!inside(event.relatedTarget)) hold('focus', false); };
  const onEnter = (): void => hold('pointer', true);
  const onLeave = (event: PointerEvent): void => { if (!inside(event.relatedTarget)) hold('pointer', false); };
  const onVisibility = (): void => hold('hidden', document.hidden);
  const observer = new IntersectionObserver(([entry]) => hold('offscreen', !entry.isIntersecting));

  observer.observe(deck);
  strip.addEventListener('click', onPick);
  deck.addEventListener('click', onCard);
  strip.addEventListener('animationend', onProgress);
  toggle?.addEventListener('click', onToggle);
  for (const area of [deck, strip]) {
    area.addEventListener('focusin', onFocusIn);
    area.addEventListener('focusout', onFocusOut);
    area.addEventListener('pointerenter', onEnter);
    area.addEventListener('pointerleave', onLeave);
  }
  document.addEventListener('visibilitychange', onVisibility);
  motion.addEventListener('change', sync);
  sync();
  return (): void => {
    timers.forEach(id => window.clearTimeout(id));
    observer.disconnect();
    strip.removeEventListener('click', onPick);
    deck.removeEventListener('click', onCard);
    strip.removeEventListener('animationend', onProgress);
    toggle?.removeEventListener('click', onToggle);
    for (const area of [deck, strip]) {
      area.removeEventListener('focusin', onFocusIn);
      area.removeEventListener('focusout', onFocusOut);
      area.removeEventListener('pointerenter', onEnter);
      area.removeEventListener('pointerleave', onLeave);
    }
    document.removeEventListener('visibilitychange', onVisibility);
    motion.removeEventListener('change', sync);
  };
}
