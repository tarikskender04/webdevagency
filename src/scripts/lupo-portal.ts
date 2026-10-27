/** The /lupo/ hero: play the background loop while it is on screen, and push the camera into the Mac's screen on scroll
 *  (lupo-portal.css). The demo figure moves into the screen while the portal runs; there is only one copy of it. */
export function initLupoPortal(): () => void {
  const root = document.querySelector<HTMLElement>('[data-lupo-portal-root]');
  const stage = root?.querySelector<HTMLElement>('.lupo-portal-stage');
  const hero = root?.querySelector<HTMLElement>('.lupo-hero');
  const mac = root?.querySelector<HTMLElement>('.lupo-mac');
  const screen = root?.querySelector<HTMLElement>('.lupo-mac-screen');
  const desktop = root?.querySelector<HTMLElement>('.lupo-mac-desktop');
  const backdrop = root?.querySelector<HTMLVideoElement>('[data-lupo-backdrop]');
  const figure = document.querySelector<HTMLElement>('[data-lupo-demo]');
  const demo = figure?.parentElement;
  if (!root || !stage || !hero || !mac || !screen || !desktop) return (): void => {};

  // The loop is motion: it only plays without a reduced-motion preference, and only while the stage is on screen.
  // On Data Saver or a 2G/3G connection it isn't loaded at all. Otherwise (and without JavaScript, or if the video fails)
  // the poster, its first frame, stands still.
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  const slow = Boolean(connection?.saveData || /(^|-)(2g|3g)$/.test(connection?.effectiveType ?? ''));
  let onScreen = false;
  const play = (): void => {
    if (!backdrop || slow) return;
    if (onScreen && !still.matches) void backdrop.play().catch(() => {});
    else backdrop.pause();
  };
  const visibility = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; play(); });
  visibility.observe(stage);
  still.addEventListener('change', play);

  const supported = CSS.supports('animation-timeline: view()') && Boolean(figure && demo);
  const preference = matchMedia('(prefers-reduced-motion: no-preference) and (min-height: 560px)');
  let active = false;
  const set = (name: string, value: string): void => { root.style.setProperty(name, value); };
  const measure = (): void => {
    if (!active) return;
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    // The screen takes the window's shape, within a laptop's range, so the desktop fills it at rest and covers the window at the end.
    const ratio = Math.min(1.8, Math.max(1.45, width / height));
    set('--lupo-screen-ratio', String(ratio));
    // The Mac stands right under the copy, as large as the room below allows. Up to a third of the lid (bezels plus a
    // screen of this ratio) may run off the bottom of the window. On wide screens it stops short of the dog's face.
    const top = hero.offsetTop + hero.offsetHeight + 36;
    const lid = .065 + .968 / ratio;
    const room = (height - top) / (lid * .68);
    const reach = width < 761 ? width * .86 : Math.min(width * .62 - hero.offsetLeft, 1120);
    const macWidth = Math.max(320, Math.min(room, reach));
    set('--lupo-mac-top', `${top}px`);
    set('--lupo-mac-w', `${macWidth}px`);
    // Offsets ignore the running scroll transform, so measuring mid-animation can't feed the current zoom back in.
    let x = 0;
    let y = 0;
    for (let node: HTMLElement | null = screen; node && node !== stage; node = node.offsetParent as HTMLElement | null) {
      x += node.offsetLeft;
      y += node.offsetTop;
    }
    const centreX = x + screen.offsetWidth / 2;
    const centreY = y + screen.offsetHeight / 2;
    const zoom = Math.max(width / screen.offsetWidth, height / screen.offsetHeight) * 1.004;
    set('--lupo-stage-w', `${width}px`);
    set('--lupo-stage-h', `${height}px`);
    set('--lupo-zoom', String(zoom));
    set('--lupo-desktop-scale', String(1 / zoom));
    set('--lupo-ox', `${centreX}px`);
    set('--lupo-oy', `${centreY}px`);
    set('--lupo-pan-x', `${width / 2 - centreX}px`);
    set('--lupo-pan-y', `${height / 2 - centreY}px`);
  };
  const sync = (): void => {
    active = supported && preference.matches;
    if (!figure || !demo) return;
    if (active) {
      desktop.append(figure);
      demo.hidden = true;
      root.dataset.lupoPortal = '';
      measure();
    } else {
      delete root.dataset.lupoPortal;
      demo.append(figure);
      demo.hidden = false;
    }
  };
  const resize = new ResizeObserver(measure);
  resize.observe(stage);
  resize.observe(hero);
  resize.observe(mac);
  preference.addEventListener('change', sync);
  sync();
  return (): void => {
    visibility.disconnect();
    resize.disconnect();
    still.removeEventListener('change', play);
    preference.removeEventListener('change', sync);
    delete root.dataset.lupoPortal;
    if (figure && demo) { demo.append(figure); demo.hidden = false; }
  };
}
