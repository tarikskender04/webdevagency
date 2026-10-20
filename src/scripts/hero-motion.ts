/** Hero parallax: the plate, deck and props follow the pointer (fine pointers only) and the plate drifts with scroll.
 *  Writes --pointer-x/-y (-1..1) and --scroll (px) on the hero; under reduced motion everything stays at rest. */
export function initHeroMotion(): () => void {
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) return (): void => {};
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  let frame = 0;
  let visible = false;
  const write = (): void => {
    frame = 0;
    current.x += (target.x - current.x) * .08;
    current.y += (target.y - current.y) * .08;
    hero.style.setProperty('--pointer-x', current.x.toFixed(4));
    hero.style.setProperty('--pointer-y', current.y.toFixed(4));
    hero.style.setProperty('--scroll', String(Math.round(Math.min(window.scrollY, hero.offsetHeight))));
    if (Math.abs(target.x - current.x) > .001 || Math.abs(target.y - current.y) > .001) request();
  };
  const request = (): void => { if (!frame && visible && !motion.matches) frame = requestAnimationFrame(write); };
  const onPointer = (event: PointerEvent): void => {
    if (!finePointer.matches) return;
    target.x = event.clientX / window.innerWidth * 2 - 1;
    target.y = event.clientY / window.innerHeight * 2 - 1;
    request();
  };
  const onLeave = (event: PointerEvent): void => { if (event.relatedTarget) return; target.x = 0; target.y = 0; request(); };
  const reset = (): void => {
    if (!motion.matches) { request(); return; }
    cancelAnimationFrame(frame);
    frame = 0;
    target.x = target.y = current.x = current.y = 0;
    ['--pointer-x', '--pointer-y', '--scroll'].forEach(property => hero.style.removeProperty(property));
  };
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; request(); });
  observer.observe(hero);
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('pointerout', onLeave);
  window.addEventListener('scroll', request, { passive: true });
  motion.addEventListener('change', reset);
  return (): void => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener('pointermove', onPointer);
    document.removeEventListener('pointerout', onLeave);
    window.removeEventListener('scroll', request);
    motion.removeEventListener('change', reset);
  };
}
