# Homepage verification

Verified locally on 2026-10-13 and 2026-10-14 using real Chrome through Playwright. Preview tests cover desktop 1440×900, tablet 768 px, mobile 320/390 px, a short desktop viewport using native drag, reduced-motion rendering, and no-JavaScript content.

Checks include capability navigation and dragging; shape/yarn selection; catalogue toggles; form validation and retained details; brief download contents; broken images; horizontal overflow; browser/console errors; and automated WCAG A/AA checks. Screenshots are saved to ignored artifacts/. These checks do not replace manual assistive-technology testing.

The final mobile Lighthouse run against a local production-configured build returned:

| Category | Score |
| --- | --- |
| Performance | 95 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |

LCP: 2.6 s. FCP: 2.1 s. Total blocking time: 0 ms. CLS: 0. These are simulated mobile lab results on a local server; repeat on the actual deployment and monitor field Core Web Vitals. This run met the handoff's ≥95 performance score target. LCP still has room to improve toward the good threshold under the test conditions.

The production check used PUBLIC_SITE_URL=https://meridian-ci.invalid and PUBLIC_SITE_INDEXABLE=true solely as a local test fixture. The normal setup build retains noindex and does not advertise a sitemap. Its lower Lighthouse SEO score is expected because it is deliberately not indexable. A 100 Lighthouse SEO score checks technical basics and does not predict US or European rankings.

Original design file hashes still match the imported handoff and root CLAUDE.md remains an exact copy. GitHub CI runs the build, type checks, SEO checks, importer tests, and browser tests, and uploads screenshots.

Unverified launch requirements: real domain and inbox, scheduler integration and enquiry delivery, other clients' project screenshots, legal/social links, service/package page content and prices. Exact motion/refraction refinements remain listed in docs/screen-map.json. No live booking or outbound enquiry has been tested because neither is configured.
