/** The Design Kit icon set (design/prototypes/BranchedMenu.jsx): 16px box, 1.5px stroke, round caps.
 *  `play` and `cookie` are additions drawn to the same rules: play for the walkthrough and reel motifs, cookie for the
 *  cookie notice. */
export const iconPaths = {
  arrow: 'M4 12L12 4M12 4H6M12 4v6',
  plus: 'M8 3v10M3 8h10',
  check: 'M3.5 8.5l3 3L13 5',
  chevron: 'M6 3l5 5-5 5',
  swatch: 'M3 4.5h10M3 8h10M3 11.5h7',
  type: 'M3 4h10M8 4v8M5.5 12h5',
  grid: 'M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z',
  chart: 'M3 13V8M6.5 13V4M10 13v-3M13.5 13V6',
  spark: 'M8 2.5l1.6 3.5L13 8l-3.4 1.6L8 13.5 6.4 9.6 3 8l3.4-1.6L8 2.5z',
  image: 'M2.5 4.5h11v8h-11zM2.5 10l3-3 2.5 2.5 2-2 3.5 3.5',
  target: 'M8 2.5v11M2.5 8h11',
  layers: 'M8 2.5L14 6l-6 3.5L2 6l6-3.5zM2.5 9.5L8 12.7l5.5-3.2',
  play: 'M5 3.2v9.6L12.6 8z',
  cookie: 'M13.5 8.6A5.5 5.5 0 1 1 7.4 2.5a1.8 1.8 0 0 0 2.4 2.3 1.8 1.8 0 0 0 2.3 2.4 1.8 1.8 0 0 0 1.4 1.4zM5.6 6.4h.01M9.6 10.4h.01M5.9 10.6h.01',
} as const;
export type IconName = keyof typeof iconPaths;
