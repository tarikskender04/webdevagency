# Prodigy Stdio brand assets

The combined logo, symbol, and custom lettering are available separately. Every
SVG is a standalone vector with a transparent background: no embedded bitmap,
external font, or network dependency. Matching PNGs also have transparent
backgrounds.

| File stem | Artwork | Background |
| --- | --- | --- |
| `prodigy-stdio-logo` | Blue/white folded symbol + ink lettering | Light |
| `prodigy-stdio-logo-ink` | Solid ink symbol + ink lettering | Light; small website headers |
| `prodigy-stdio-logo-white` | Blue/white folded symbol + white lettering | Dark |
| `prodigy-stdio-mark` | Blue/white folded symbol | Light or dark |
| `prodigy-stdio-mark-ink` | Solid ink symbol | Light |
| `prodigy-stdio-mark-white` | Solid white symbol | Dark |
| `prodigy-stdio-wordmark` | Ink lettering | Light |
| `prodigy-stdio-wordmark-white` | White lettering | Dark |

Each stem has `.svg` and `.png` versions. The ZIP contains the complete export set
and this guide. Use SVG on the website and for scaling; use PNG where SVG is not
supported. PNG symbols are 1384px wide; lettering and combined logos are 2400px
wide. Keep the original aspect ratio when resizing.

## Source and fidelity

The symbol was rebuilt with three smooth vector faces and blue/white fold
gradients, using the supplied
`src/assets/ChatGPT Image Oct 16, 2026, 10_30_26 PM-1.png` as reference. The
lettering was traced from the downloaded PNG, preserved at
`src/assets/brand/source-wordmark.png`, with stray pixels and small cutout defects
removed. These are cleaned reconstructions from raster artwork; edge geometry
and shading may differ slightly from the PNGs. The horizontal combined version
places the symbol beside the lettering without changing their aspect ratios.

The editable vector masters are `src/assets/brand/mark.svg` and
`src/assets/brand/wordmark.svg`. To regenerate all exports and the ZIP from them,
run `node scripts/render-brand-assets.mjs` from the repository root. The script
uses the installed Sharp dependency and the system `zip` command.

The same script renders `public/favicon.svg` and `public/apple-touch-icon.png`
with the colored symbol on an ink tile, so its white face stays visible.
