# Prodigy Stdio

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
npm run preview   # Preview the built site and worker locally (Cloudflare workerd)
npm run test:browser # Chrome/Chromium screenshots, interaction and accessibility checks
```

## Design handoffs

```sh
npm run design:sync -- /path/to/design.zip
npm run design:status
```

The first 50-file handoff is imported in design/. The importer stores the original export, copies its CLAUDE.md into the root, and records hashes. Read [the sync workflow](docs/design-sync.md). Selected variants: **Hero B, Contact 1a, Footer 1b**. [Confirmed business details](docs/decisions.md) override export placeholders. The homepage includes the work deck, Stand out band, five process rows, an animated Prodigy Stdio billboard, a project-brief form, and a theme-aware footer. The shared header offers Auto, Light and Dark modes; the saved choice also updates the hero and billboard display, and the whole /work/ page has its own night design. The Capabilities section (five interactive previews) is detached from the homepage and kept in src/components/Capabilities.astro for a future page. [The screen map](docs/screen-map.json) records remaining fidelity and integration work.

To continue in Claude Code or Codex: "Read AGENTS.md, docs/decisions.md, design/CHANGELOG.md, and docs/screen-map.json. Implement the remaining approved design refinements and update the map."

Browser checks use local Chrome when available. Otherwise install Chromium with `npx playwright install chromium`. Tests start a separate preview on port 4322 and save screenshots under ignored artifacts/. The existing development server on 4321 stays independent.

See [verification results and limits](docs/verification.md) for the local browser and Lighthouse measurements.

Contact details are kept in memory and the brief can be downloaded. No enquiry is sent or call booked by default. Add a real PUBLIC_BOOKING_URL when available; it opens the provider's calendar from the review step. Email delivery and an embedded live calendar require a subsequent integration.

Studio information is at /about/. Draft Privacy & Cookies and Website Terms pages are at /privacy/ and /terms/, linked from the shared footer and form. Complete the verified operator/contact/provider details in src/config/site.ts before launch; see [policy launch notes](docs/legal-launch.md). The brief controls stay disabled until hydration so a browser cannot send personal details through a native form fallback.

## Search and launch

Copy .env.example to .env locally; the confirmed production origin is https://prodigystdio.com (the spelling is intentional). The supplied SVG logo appears in the shared header and billboard; its custom lettering appears in Stand out and the large footer. The symbol is also the favicon and Apple touch icon. Light and dark variants follow the page surfaces and selected theme. Brand asset paths are centralized in src/config/site.ts; [the brand kit guide](public/brand/README.md) documents the editable masters, exports and regeneration command. Confirm hosting and launch readiness before enabling indexing. Preview content defaults to noindex. See [the launch checklist](docs/seo-launch.md), [installed SEO skill](docs/seo-skill.md), and [Frontend Engineer skill](docs/frontend-skill.md). GitHub Actions checks preview and production SEO output and runs browser checks; the CI domain is a test fixture, never a deployment target. A 1200×630 branded social card ships in public/social-card.jpg; regenerate it against a preview on port 4322 with npm run asset:social after changing the hero.

## Project map

- src/components/ — React TypeScript sections.
- src/layouts/BaseLayout.astro — shared HTML and metadata.
- src/config/site.ts — identity, content, team, and design choices.
- src/pages/ — Astro routes, 404, and robots.txt.
- src/styles/ — shared styles and design tokens.
- design/ — original Claude handoff, kept separate from implementation.
- docs/screen-map.json — design section to source mapping and status.
- AGENTS.md — engineering guidance shared across assistants.

Hosting is Cloudflare Workers (wrangler.jsonc). `npm run build` writes static pages to dist/client and the worker to dist/server; Cloudflare's Git integration deploys with `npx wrangler deploy`. Every page is prerendered except POST /api/enquiry/, which emails sent briefs through Resend. To turn sending on, set the `RESEND_API_KEY` secret on the worker and build with `PUBLIC_ENQUIRY_ENABLED=true`. For local testing put the key in .dev.vars (see .dev.vars.example); `npm run preview` reads dist/server/.dev.vars. This setup does not publish a live website.
