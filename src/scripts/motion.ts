/** Progressive enhancement: HTML stays visible when scripts or effects are unavailable. */
export function initMotion(): () => void {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
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
  return (): void => { animations.forEach(animation => animation.cancel()); motion.removeEventListener('change', reduce); revealObserver.disconnect(); };
}
