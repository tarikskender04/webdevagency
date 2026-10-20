/** Capabilities track: native swipe everywhere, GSAP-pinned scrub on suitable desktops. */
function attachDrag(track: HTMLDivElement, move: (left: number) => void, settle: () => void, start: () => void = () => {}): () => void {
  let startX = 0;
  let startLeft = 0;
  let dragging = false;
  const down = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || (event.target as Element).closest('button, a, input, select, textarea')) return;
    start(); startX = event.clientX; startLeft = track.scrollLeft; dragging = true; track.setPointerCapture(event.pointerId); track.classList.add('dragging');
  };
  const drag = (event: PointerEvent): void => { if (dragging) move(Math.max(0, Math.min(track.scrollWidth - track.clientWidth, startLeft + startX - event.clientX))); };
  const up = (): void => { if (dragging) { dragging = false; track.classList.remove('dragging'); settle(); } };
  track.addEventListener('pointerdown', down); track.addEventListener('pointermove', drag); track.addEventListener('pointerup', up); track.addEventListener('pointercancel', up);
  return (): void => { track.removeEventListener('pointerdown', down); track.removeEventListener('pointermove', drag); track.removeEventListener('pointerup', up); track.removeEventListener('pointercancel', up); };
}

export async function initCapabilitiesMotion(): Promise<() => void> {
  const track = document.querySelector<HTMLDivElement>('.cap-track');
  const stage = document.querySelector<HTMLElement>('.cap-stage');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!track || !stage) return (): void => {};
  const last = track.children.length - 1;
  const updateControls = (): void => {
    const current = Math.round(track.scrollLeft / track.clientWidth);
    const label = stage.querySelector('[data-cap-current]');
    if (label) label.textContent = String(current + 1).padStart(2, '0');
    stage.querySelectorAll<HTMLButtonElement>('[data-cap-index]').forEach(button => {
      const active = Number(button.dataset.capIndex) === current;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    });
    stage.querySelector<HTMLButtonElement>('[data-cap-direction="-1"]')!.disabled = current === 0;
    stage.querySelector<HTMLButtonElement>('[data-cap-direction="1"]')!.disabled = current === last;
  };
  track.addEventListener('scroll', updateControls, { passive: true });
  let navigateTo = (index: number): void => track.scrollTo({ left: index * track.clientWidth, behavior: motion.matches ? 'auto' : 'smooth' });
  const click = (event: MouseEvent): void => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button[data-cap-index], button[data-cap-direction]');
    if (!button) return;
    navigateTo(button.dataset.capIndex !== undefined ? Number(button.dataset.capIndex) : Math.round(track.scrollLeft / track.clientWidth) + Number(button.dataset.capDirection));
  };
  stage.addEventListener('click', click);
  track.dataset.motionReady = 'true';
  // Touch layouts use native swipe, without downloading GSAP.
  if (motion.matches || !window.matchMedia('(min-width: 1000px) and (min-height: 700px) and (pointer: fine)').matches) {
    const stopDrag = attachDrag(track, left => { track.scrollLeft = left; }, () => navigateTo(Math.round(track.scrollLeft / track.clientWidth)));
    return (): void => { stopDrag(); stage.removeEventListener('click', click); track.removeEventListener('scroll', updateControls); };
  }
  // Load scroll enhancements only near this section.
  // A new pin inserts height above later sections. Preserve anchor navigation
  // after that first layout change, unless the visitor has started scrolling.
  let fragment = window.location.hash;
  let fragmentInterrupted = false;
  const interruptFragment = (): void => { fragmentInterrupted = true; };
  const updateFragment = (): void => { fragment = window.location.hash; fragmentInterrupted = false; };
  window.addEventListener('wheel', interruptFragment, { passive: true });
  window.addEventListener('touchstart', interruptFragment, { passive: true });
  window.addEventListener('keydown', interruptFragment);
  window.addEventListener('hashchange', updateFragment);
  const stopFragmentTracking = (): void => {
    window.removeEventListener('wheel', interruptFragment);
    window.removeEventListener('touchstart', interruptFragment);
    window.removeEventListener('keydown', interruptFragment);
    window.removeEventListener('hashchange', updateFragment);
  };
  await new Promise<void>(resolve => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { observer.disconnect(); resolve(); } }, { rootMargin: '200px' });
    observer.observe(stage);
  });
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  let pin: ReturnType<typeof ScrollTrigger.create> | undefined;
  let scrollTween: ReturnType<typeof gsap.to> | undefined;
  media.add('(min-width: 1000px) and (min-height: 700px) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    stage.classList.add('cap-pinned');
    track.style.scrollSnapType = 'none';
    pin = ScrollTrigger.create({
      trigger: stage, start: 'top top', end: () => `+=${(track.scrollWidth - track.clientWidth) * .72}`, pin: true, invalidateOnRefresh: true,
      onUpdate: self => { track.scrollLeft = self.progress * (track.scrollWidth - track.clientWidth); },
    });
    return (): void => { pin = undefined; stage.classList.remove('cap-pinned'); track.style.scrollSnapType = ''; };
  });
  const go = (index: number): void => {
    const left = Math.max(0, Math.min(last, index)) * track.clientWidth;
    if (pin) {
      scrollTween?.kill();
      const position = { y: window.scrollY };
      scrollTween = gsap.to(position, { y: pin.start + (left / (track.scrollWidth - track.clientWidth)) * (pin.end - pin.start), duration: .7, ease: 'power2.out', onUpdate: () => window.scrollTo({ top: position.y, behavior: 'instant' }) });
    } else track.scrollTo({ left, behavior: motion.matches ? 'auto' : 'smooth' });
  };
  navigateTo = go;
  const focus = (event: FocusEvent): void => {
    const slide = (event.target as Element).closest('.cap-slide');
    if (!slide || !pin) return;
    const index = Array.from(track.children).indexOf(slide);
    if (index !== Math.round(pin.progress * last)) go(index);
  };
  track.addEventListener('focusin', focus);
  const stopDrag = attachDrag(track, left => {
    if (pin) window.scrollTo({ top: pin.start + left / (track.scrollWidth - track.clientWidth) * (pin.end - pin.start), behavior: 'instant' });
    else track.scrollLeft = left;
  }, () => { if (!pin) go(Math.round(track.scrollLeft / track.clientWidth)); }, () => { scrollTween?.kill(); });
  void document.fonts.ready.then(() => {
    ScrollTrigger.refresh();
    const target = fragment ? document.getElementById(fragment.slice(1)) : null;
    if (!fragmentInterrupted && fragment === window.location.hash && target && (stage.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING)) {
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
    stopFragmentTracking();
  });
  return (): void => { stopFragmentTracking(); stopDrag(); scrollTween?.kill(); media.revert(); stage.removeEventListener('click', click); track.removeEventListener('scroll', updateControls); track.removeEventListener('focusin', focus); };
}
