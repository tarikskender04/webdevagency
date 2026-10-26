/** Facts about Lupo that the /lupo/ page states. Keep them in step with the Lupo repo: the shortcuts are the defaults in
 *  Sources/LiveContext/HotKeys.swift, the requirements match Package.swift and Info.plist. */
export const lupo = {
  requirements: 'Free · macOS 26 Tahoe · Apple Silicon',
  shortcuts: { session: '⌥⇧Space', capture: '⌥⇧S' },
  /** Media slots, empty until the files exist. The video goes in public/lupo/media/ (H.264, faststart, with a poster);
   *  the GIF shows first-launch steps 3 and 4 recorded on macOS 26. Until then the video slot shows brand artwork and
   *  the GIF slot isn't rendered. */
  /** Re-encoded from ~/Documents/SHOWCASE/LUPOFINAL.mp4 (CRF 25, faststart) to stay under the Workers 25 MiB asset limit.
   *  The poster is the frame at 0:25. The captions are burned into the video. */
  demoVideo: { src: '/lupo/media/lupo-demo.mp4', poster: '/lupo/media/lupo-demo-poster.jpg', duration: '1:10' } as { src: string; poster: string; duration: string } | undefined,
  /** The hero's background loop: ~/Documents/SHOWCASE/Animate_dog_illustration_background_1080p_20261026170107.mp4, 8 s,
   *  with the audio dropped and the video stream copied as is (faststart), since re-encoding a 1080p clip shown full-window
   *  visibly softens it. The poster is its first frame, shown when motion is reduced. */
  backdrop: { src: '/lupo/media/lupo-backdrop.mp4', poster: '/lupo/media/lupo-backdrop-poster.jpg' },
  firstLaunchGif: undefined as { src: string; width: number; height: number; alt: string } | undefined,
};
