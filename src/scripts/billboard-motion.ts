/** Pull the Process closing scene back into the real display in the supplied photograph. */
export function initBillboardMotion(): () => void {
  const root = document.querySelector<HTMLElement>('#billboard');
  const stage = root?.querySelector<HTMLElement>('.billboard-stage');
  const view = root?.querySelector<HTMLElement>('.billboard-view');
  const scene = root?.querySelector<HTMLElement>('.billboard-scene');
  const screen = root?.querySelector<HTMLElement>('.billboard-screen');
  const closing = root?.querySelector<HTMLElement>('.billboard-process');
  if (!root || !stage || !view || !scene || !screen || !closing || !CSS.supports('animation-timeline: view()')) return (): void => {};

  const preference = matchMedia('(prefers-reduced-motion: no-preference) and (min-height: 560px)');
  let active = false;
  const measure = (): void => {
    if (!active) return;
    // Layout dimensions stay unscaled while the scroll animation is running. Reading transformed bounds here
    // would feed the current zoom back into the next resize and make the screen drift away from the photograph.
    const x = stage.clientWidth / 2 + screen.offsetLeft + screen.offsetWidth / 2 - scene.offsetWidth / 2;
    const y = scene.offsetTop + screen.offsetTop + screen.offsetHeight / 2;
    const zoom = Math.max(stage.clientWidth / screen.offsetWidth, stage.clientHeight / screen.offsetHeight) * 1.01;
    root.style.setProperty('--billboard-zoom', String(zoom));
    root.style.setProperty('--billboard-origin-x', `${x}px`);
    root.style.setProperty('--billboard-origin-y', `${y}px`);
    root.style.setProperty('--billboard-pan-x', `${stage.clientWidth / 2 - x}px`);
    root.style.setProperty('--billboard-pan-y', `${view.clientHeight / 2 - y}px`);
  };
  const sync = (): void => {
    active = preference.matches;
    if (active) {
      // Move the existing static closing band into the live screen. There is only one copy of its text and CTA.
      screen.append(closing);
      root.dataset.billboardPortal = '';
      measure();
    } else {
      delete root.dataset.billboardPortal;
      root.prepend(closing);
    }
  };
  const observer = new ResizeObserver(measure);
  observer.observe(stage);
  observer.observe(view);
  preference.addEventListener('change', sync);
  document.addEventListener('themechange', measure);
  sync();
  return (): void => {
    observer.disconnect();
    preference.removeEventListener('change', sync);
    document.removeEventListener('themechange', measure);
    delete root.dataset.billboardPortal;
    root.prepend(closing);
  };
}
