/** Reels: silent screen recordings that loop while in view (/work/ gallery tiles and Process's Ship it card). With
 *  reduced motion they wait on their poster until the toggle is pressed; the toggle always pauses or resumes, and a reel
 *  paused by hand stays paused. `root` holds the video and a `.work-reel-toggle`; it gets `.is-playing` while it plays. */
export function initReel(root: HTMLElement, reduced: MediaQueryList): void {
  const video = root.querySelector('video');
  const toggle = root.querySelector<HTMLButtonElement>('.work-reel-toggle');
  if (!video || !toggle) return;
  // React's server render drops `muted`, and browsers only autoplay muted video.
  video.muted = true;
  let held = reduced.matches;
  const sync = (): void => {
    const playing = !video.paused;
    root.classList.toggle('is-playing', playing);
    toggle.setAttribute('aria-label', (playing ? toggle.dataset.pause : toggle.dataset.play) ?? '');
  };
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  // Follow the visitor's last choice, not the video's state: it is also paused while loading or out of view.
  toggle.addEventListener('click', () => {
    held = !held;
    if (held) video.pause();
    else video.play().catch(sync);
  });
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !held) video.play().catch(sync);
    else if (!entry.isIntersecting) video.pause();
  }, { threshold: .35 }).observe(root);
}
