# Search foundations and launch

The site uses static HTML from Astro and React. BaseLayout handles titles, descriptions, US English language, canonicals, social metadata, and Organization JSON-LD for the confirmed brand when a domain is configured. robots.txt and the sitemap are generated from environment settings. A 404 stays noindex.

During setup, pages use noindex and no sitemap is advertised. Robots still permits crawling so search engines can read that noindex directive. Before launch:

1. Finish the selected design, real contact channel, business information, and proof of actual work. Confirm the organization details in src/config/site.ts. Complete the operator, privacy contact and hosting details in the [policy launch notes](legal-launch.md), then finalize the draft Privacy & Cookies and Website Terms pages.
2. Configure PUBLIC_SITE_URL=https://prodigystdio.com, the confirmed owned production origin. Set PUBLIC_SITE_INDEXABLE=true for production only. Rebuild; environment settings are applied at build time. Keep preview environments false.
3. Regenerate the branded 1200×630 social card if the Hero changes (`npm run asset:social` against the port 4322 preview). Production metadata includes the image, alt text and dimensions. Choose real service pages and helpful articles based on customer needs rather than creating thin city pages. Package prices and scope must be supplied before adding a packages page.
4. Run npm run verify with the production variables. Test mobile layouts, keyboard navigation, the real contact flow, and PageSpeed Insights. Do not present lab checks as actual Core Web Vitals.
5. Verify the domain in Google Search Console and submit /sitemap-index.xml. Check URL Inspection for indexing and monitor real queries, impressions, leads, and Core Web Vitals after launch.

Structured data is one JSON-LD @graph per page: Organization (with its founder) everywhere, WebSite on the homepage for the site name in results, and a VideoObject for the Crochê walkthrough on /work/ (name, description, thumbnails, upload date, 2:12 duration, file URL). /work/ shares the walkthrough thumbnail as its social image. The sitemap leaves out the 404 and the old /work/<slug>/ pages, which are noindex redirects; on a host with server redirects, also make those real 301s (Astro's static build writes meta-refresh pages). npm run verify checks all of this.

Structured data describes verified visible information. Do not add LocalBusiness with a fabricated US location, fake reviews, or unsupported claims. Google retired FAQ rich results in May 2026; keep helpful question-and-answer content without promising that feature. AEO/GEO starts with clear questions, factual answers, visible expertise, and content that crawlers can read; there is no ranking guarantee.

References: [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization), [Google updates, May 8 and June 15, 2026](https://developers.google.com/search/updates).
