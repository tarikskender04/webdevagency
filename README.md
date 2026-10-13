# Meridian

An agency website built with Astro, React, and strict TypeScript. Marketing content is generated as HTML; interactive React components can be hydrated where needed.

## Start in VS Code

Node.js 24 is recommended (minimum 22.12). Python 3 is required only for importing design exports.

```sh
npm ci
npm run dev
```

Open http://localhost:4321. Install the recommended Astro VS Code extension.

```sh
npm run verify    # Type checks, production build, rendered SEO checks
npm run preview   # Preview dist/ locally
npm run test:browser # Chrome/Chromium screenshots, interaction and accessibility checks
```

## Design handoffs

```sh
npm run design:sync -- /path/to/design.zip
npm run design:status
```

The first 50-file handoff is imported in design/. The importer stores the original export, copies its CLAUDE.md into the root, and records hashes. Read [the sync workflow](docs/design-sync.md). Selected variants: **Hero B, Contact 1a, Footer 1b**. [Confirmed business details](docs/decisions.md) override export placeholders. The homepage includes the work deck, five interactive capability previews, five process rows, a project-brief form, and the dark footer. [The screen map](docs/screen-map.json) records remaining fidelity and integration work.

To continue in Claude Code or Codex: "Read AGENTS.md, docs/decisions.md, design/CHANGELOG.md, and docs/screen-map.json. Implement the remaining approved design refinements and update the map."

Browser checks use local Chrome when available. Otherwise install Chromium with `npx playwright install chromium`. Tests start a separate preview on port 4322 and save screenshots under ignored artifacts/. The existing development server on 4321 stays independent.

See [verification results and limits](docs/verification.md) for the local browser and Lighthouse measurements.

Contact details are kept in memory and the brief can be downloaded. No enquiry is sent or call booked by default. Add a real PUBLIC_BOOKING_URL when available; it opens the provider's calendar from the review step. Email delivery and an embedded live calendar require a subsequent integration.

## Search and launch

Copy .env.example to .env locally; set the real production URL before launch. Preview content defaults to noindex. See [the launch checklist](docs/seo-launch.md), [installed SEO skill](docs/seo-skill.md), and [Frontend Engineer skill](docs/frontend-skill.md). GitHub Actions checks preview and production SEO output and runs browser checks; the CI domain is a test fixture, never a deployment target. A 1200×630 branded social card ships in public/social-card.jpg; regenerate it against a preview on port 4322 with npm run asset:social after changing the hero.

## Project map

- src/components/ — React TypeScript sections.
- src/layouts/BaseLayout.astro — shared HTML and metadata.
- src/config/site.ts — identity, content, team, and design choices.
- src/pages/ — Astro routes, 404, and robots.txt.
- src/styles/ — shared styles and design tokens.
- design/ — original Claude handoff, kept separate from implementation.
- docs/screen-map.json — design section to source mapping and status.
- AGENTS.md — engineering guidance shared across assistants.

Deploy dist/ to any static host using npm run build. Configure the production environment there; this setup does not publish a live website.
