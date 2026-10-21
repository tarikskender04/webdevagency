/** Process choreography from the handoff, at its confirmed Restrained intensity. */
export function initProcessMotion(): () => void {
  const root = document.querySelector<HTMLElement>('#process');
  if (!root) return (): void => {};
  const blur = document.querySelector<HTMLElement>('.process-bottom-blur');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let disposed = false;
  let loading = false;
  let near = false;
  let stop: (() => void) | undefined;

  const load = async (): Promise<void> => {
    if (disposed || loading || !near || preference.matches) return;
    loading = true;
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
    if (disposed) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add({ motion: '(prefers-reduced-motion: no-preference)', stacked: '(max-width: 919px)' }, context => {
      if (!context.conditions?.motion) return;
      const stacked = Boolean(context.conditions.stacked);
      const k = .55;
      root.dataset.processMotion = 'ready';
      const rows = Array.from(root.querySelectorAll<HTMLElement>('.process-row'));
      const reveal = (element: HTMLElement, timeline: gsap.core.Timeline, start: string): void => {
        ScrollTrigger.create({ trigger: element, start, once: true, onEnter: () => { timeline.play(); } });
        // Resolve passed content immediately on deep links; reveal visible content now.
        const bounds = element.getBoundingClientRect();
        if (bounds.bottom < 0) timeline.progress(1);
        else if (bounds.top < window.innerHeight * parseFloat(start.split(' ')[1]) / 100) timeline.play();
      };
      rows.forEach(row => {
        const direction = row.classList.contains('process-row-reverse') ? -1 : 1;
        const visual = row.querySelector<HTMLElement>('.process-visual');
        const parallax = row.querySelector<HTMLElement>('.process-parallax');
        const bits = row.querySelectorAll('.process-copy > :not(.process-motif)');
        const pieces = row.querySelectorAll<HTMLElement>('[data-process-piece]');
        const glass = row.querySelector<HTMLElement>('[data-process-glass]');
        const dot = row.querySelector<HTMLElement>('.process-dot');
        const timeline = gsap.timeline({ paused: true, onStart: () => row.classList.add('entered') });
        // Stacked rows can span two phone screens. Reveal copy and the card separately so the pencil,
        // typing and review pieces begin when the card is visible, rather than finishing below the fold.
        const copyTimeline = stacked ? gsap.timeline({ paused: true }) : timeline;
        if (bits) copyTimeline.fromTo(bits,
          { opacity: 0, y: stacked ? 12 : 30 * k, x: stacked ? 0 : -14 * k * direction },
          { opacity: 1, y: 0, x: 0, duration: stacked ? .5 : .8, stagger: stacked ? .045 : .085, ease: 'power3.out' }, 0);
        if (visual) timeline.fromTo(visual,
          { opacity: 0, x: stacked ? 0 : 110 * k * direction, y: stacked ? 18 : 34 * k, rotation: stacked ? 0 : 3 * k * direction, scale: stacked ? 1 : 1 - .06 * k, filter: stacked ? 'none' : `blur(${14 * k}px)` },
          { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1, filter: stacked ? 'none' : 'blur(0px)', duration: stacked ? .6 : 1.2, ease: 'expo.out', onComplete: () => { gsap.set(visual, { clearProps: 'filter' }); } }, 0);
        if (pieces.length) timeline.fromTo(pieces,
          { opacity: 0, y: 26 * k, x: (_index: number, element: HTMLElement) => stacked ? 0 : Number(element.dataset.px || 0) * k, scale: 1 - .12 * k },
          { opacity: 1, y: 0, x: 0, scale: 1, duration: .7, stagger: .055, ease: 'back.out(1.4)' }, .42);
        if (glass) timeline.fromTo(glass,
          { opacity: 0, yPercent: 100 },
          { opacity: 1, yPercent: 0, duration: 1.05, ease: 'expo.out' }, .55);
        if (dot) timeline.fromTo(dot,
          { backgroundColor: '#FFFFFF', scale: 1 },
          { backgroundColor: '#0C7CC4', boxShadow: '0 0 0 4px rgba(12,124,196,.16)', scale: 1.15, duration: .45, ease: 'power2.out' }, 0);

        const stickers = Array.from(row.querySelectorAll<HTMLElement>('[data-sticker]'));
        const pencil = row.querySelector<HTMLElement>('[data-pencil]');
        const drawingSpeed = stacked ? .45 : 1;
        let at = .5;
        if (pencil && stickers.length) {
          const first = stickers[0];
          timeline.set(pencil, { left: `${first.dataset.x}%`, top: `${Number(first.dataset.y) + Number(first.dataset.h) / 2}%` }, at)
            .to(pencil, { opacity: 1, duration: .15 }, at);
          at += .15;
        }
        stickers.forEach(sticker => {
          const x = Number(sticker.dataset.x), y = Number(sticker.dataset.y);
          const w = Number(sticker.dataset.w), h = Number(sticker.dataset.h), rotation = Number(sticker.dataset.rot);
          if (pencil) timeline.to(pencil, { left: `${x}%`, top: `${y + h * .3}%`, duration: .18 * drawingSpeed, ease: 'power1.inOut' }, at);
          timeline.fromTo(sticker,
            { opacity: 0, clipPath: 'inset(0% 100% 0% 0%)', scale: 1.06, y: -6, rotation: rotation - 3 },
            { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: .6 * drawingSpeed, ease: 'power2.inOut' }, at + .16 * drawingSpeed)
            .to(sticker, { scale: 1, y: 0, rotation, duration: .45 * drawingSpeed, ease: 'back.out(2.2)' }, at + .6 * drawingSpeed);
          if (pencil) timeline.to(pencil, { keyframes: [
            { left: `${x + w}%`, top: `${y + h * .5}%` },
            { left: `${x + w * .2}%`, top: `${y + h * .75}%` },
            { left: `${x + w * .9}%`, top: `${y + h}%` },
          ], duration: .6 * drawingSpeed, ease: 'none' }, at + .16 * drawingSpeed);
          at += stacked ? .42 : 1.05;
        });
        if (pencil) timeline.to(pencil, { opacity: 0, duration: .25 }, at);

        // Clip the existing HTML instead of rewriting it: text stays selectable,
        // readable by assistive technology and complete when motion is disabled.
        let typedAt = .95;
        row.querySelectorAll<HTMLElement>('[data-process-type]').forEach(line => {
          const length = line.dataset.processType?.length || 1;
          const duration = Math.max(.22, length * (stacked ? .014 : .032));
          timeline.fromTo(line, { clipPath: 'inset(0 100% 0 0)' },
            { clipPath: 'inset(0 0% 0 0)', duration, ease: `steps(${length})` }, typedAt);
          typedAt += duration;
        });
        // On phones each part starts as its top edge comes on screen, so it has settled by the time it is read.
        if (stacked) reveal(row, copyTimeline, 'top 96%');
        reveal(stacked && visual ? visual : row, timeline, stacked ? 'top 100%' : 'top 72%');
        if (parallax && !stacked) gsap.fromTo(parallax, { yPercent: 5 * k },
          { yPercent: -7 * k, ease: 'none', scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: .7 } });
      });
      const fill = root.querySelector('.process-spine > span');
      if (fill) gsap.fromTo(fill, { scaleY: 0 },
        { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.process-rows', start: 'top 72%', end: 'bottom 62%', scrub: .5 } });
      const closing = root.querySelector<HTMLElement>('.process-closing');
      if (closing) reveal(closing, gsap.timeline({ paused: true }).fromTo(closing,
        { opacity: 0, y: 44 * k, scale: 1 - .03 * k },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'expo.out' }), 'top 86%');
      // The bottom blur covers the rows only: the opening film runs full bleed and stays sharp.
      const inner = root.querySelector<HTMLElement>('.process-inner') ?? root;
      ScrollTrigger.create({ trigger: root, start: 'top bottom', end: 'bottom top',
        onToggle: self => { root.classList.toggle('process-in-view', self.isActive); } });
      ScrollTrigger.create({ trigger: inner, start: 'top bottom', end: 'bottom top',
        onToggle: self => { blur?.classList.toggle('active', self.isActive); } });
      const visible = (element: HTMLElement): boolean => {
        const bounds = element.getBoundingClientRect();
        return bounds.bottom > 0 && bounds.top < window.innerHeight;
      };
      root.classList.toggle('process-in-view', visible(root));
      blur?.classList.toggle('active', visible(inner));
      return (): void => {
        delete root.dataset.processMotion;
        root.classList.remove('process-in-view');
        rows.forEach(row => row.classList.remove('entered'));
        blur?.classList.remove('active');
      };
    }, root);
    stop = (): void => media.revert();
    void document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
  };
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    near = true;
    observer.disconnect();
    void load();
  }, { rootMargin: '400px' });
  observer.observe(root);
  const changed = (): void => { void load(); };
  preference.addEventListener('change', changed);
  return (): void => { disposed = true; observer.disconnect(); preference.removeEventListener('change', changed); stop?.(); };
}
