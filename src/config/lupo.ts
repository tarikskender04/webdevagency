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
  firstLaunchGif: undefined as { src: string; width: number; height: number; alt: string } | undefined,
};
