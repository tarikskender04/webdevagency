/** Progressive enhancement: HTML stays visible when scripts or effects are unavailable. */
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

export async function initMotion(): Promise<() => void> {
  const track = document.querySelector<HTMLDivElement>('.cap-track');
  const stage = document.querySelector<HTMLElement>('.cap-stage');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!track || !stage) return (): void => {};
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
    stage.querySelector<HTMLButtonElement>('[data-cap-direction="1"]')!.disabled = current === 6;
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
  // Touch layouts use native swipe and small reveals, without downloading GSAP.
  if (motion.matches || !window.matchMedia('(min-width: 1000px) and (min-height: 700px) and (pointer: fine)').matches) {
    const animations = new Set<Animation>();
    const reduce = (): void => { if (motion.matches) animations.forEach(animation => animation.finish()); };
    motion.addEventListener('change', reduce);
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (!motion.matches) {
          const animation = (entry.target as HTMLElement).animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.22,.61,.36,1)' });
          animations.add(animation);
          void animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
        }
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .1 });
    if (!motion.matches) document.querySelectorAll('[data-reveal]').forEach(element => revealObserver.observe(element));
    const stopDrag = attachDrag(track, left => { track.scrollLeft = left; }, () => navigateTo(Math.round(track.scrollLeft / track.clientWidth)));
    return (): void => { animations.forEach(animation => animation.cancel()); motion.removeEventListener('change', reduce); stopDrag(); revealObserver.disconnect(); stage.removeEventListener('click', click); track.removeEventListener('scroll', updateControls); };
  }
  // Keep the main content static. Load scroll enhancements only near this section.
  await new Promise<void>(resolve => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { observer.disconnect(); resolve(); } }, { rootMargin: '200px' });
    observer.observe(stage);
  });
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  let pin: ReturnType<typeof ScrollTrigger.create> | undefined;
  let scrollTween: ReturnType<typeof gsap.to> | undefined;
  media.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(element => {
      gsap.from(element, { y: element.classList.contains('process-visual') ? 36 : 16, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 94%', once: true } });
    });
    gsap.to('.process-spine > span', { scaleY: 1, transformOrigin: 'top', ease: 'none', scrollTrigger: { trigger: '.process-rows', start: 'top 55%', end: 'bottom 55%', scrub: true } });
    document.querySelectorAll<HTMLElement>('.process-row').forEach(row => {
      ScrollTrigger.create({ trigger: row, start: 'top 65%', onEnter: () => row.classList.add('entered'), onLeaveBack: () => row.classList.remove('entered') });
    });
  });
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
    const left = Math.max(0, Math.min(6, index)) * track.clientWidth;
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
    if (index !== Math.round(pin.progress * 6)) go(index);
  };
  track.addEventListener('focusin', focus);
  const stopDrag = attachDrag(track, left => {
    if (pin) window.scrollTo({ top: pin.start + left / (track.scrollWidth - track.clientWidth) * (pin.end - pin.start), behavior: 'instant' });
    else track.scrollLeft = left;
  }, () => { if (!pin) go(Math.round(track.scrollLeft / track.clientWidth)); }, () => { scrollTween?.kill(); });
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  return (): void => { stopDrag(); scrollTween?.kill(); media.revert(); stage.removeEventListener('click', click); track.removeEventListener('scroll', updateControls); track.removeEventListener('focusin', focus); };
}
