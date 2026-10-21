# Business information and policy launch notes

Prodigy Stdio is based in Sarajevo, Bosnia and Herzegovina, at Gradačačka 118, 71000 Sarajevo (confirmed by the user on 2026-10-21, replacing the earlier Chicago description). It is not a registered business. Tarik Skender is the confirmed operator and Owner & CEO; hello@prodigystdio.com (an alias of tarik@prodigystdio.com on Google Workspace) is the confirmed public enquiry/privacy email. The website describes an independent studio, without inventing a corporation, registration number or US office.

## Implemented

- `/about/`: confirmed location, services, team names and the supplied Sales & Outreach role, plus links to real project overviews.
- `/privacy/`: draft Privacy & Cookies notice, written around the actual local brief flow and theme storage.
- `/terms/`: draft Website Terms; project contracts remain separate.
- Shared footer links and a form privacy link. Contact instructions and CTA copy follow the available booking/email configuration.
- Form fields remain disabled until the local React handler is ready. Without JavaScript, the form cannot fall back to a native GET containing names, email addresses or phone numbers.
- Decorative footer glow/lettering does not receive pointer events, so native policy links remain clickable with JavaScript disabled.
- Existing setup noindex behavior is unchanged. The user owns prodigystdio.com and set up the Google Workspace mailbox. Hosting is Cloudflare Workers; the site is deployed at prodigystdio.com and indexing was turned on at launch (2026-10-21). No business registration, scheduler or analytics account has been created.

## Policy details (finalized 2026-10-21)

All `legal` fields in `src/config/site.ts` are filled, so /privacy/ and /terms/ no longer show the draft notice.

| Field | Source |
| --- | --- |
| Contact address | Supplied by the user. Also published in the footer and the Organization structured data. |
| Hosting log retention | Workers observability (wrangler.jsonc) logs only the /api/enquiry/ worker: 3 days on Workers Free, 7 days from 2026-12-01 ([Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/), [Observability pricing](https://developers.cloudflare.com/observability/pricing/)). The notice says "no more than 7 days". The worker logs only a delivery status on failure, never the brief. |
| Processing locations and transfers | Cloudflare, Google Workspace and Resend (eu-west-1, Ireland); providers' Standard Contractual Clauses. |
| Enquiry retention | Two years after last contact, longer for client project records as the law requires. A default chosen for the user: the inbox should actually be cleaned on that schedule. |
| Booking URL | Still none; the notice only mentions a calendar when PUBLIC_BOOKING_URL is set. |

A privacy notice is not business registration. Check registration/licensing rules for operating in Bosnia and Herzegovina separately. Confirm permission to publish client logos/artwork and obtain client agreements covering scope, payment, ownership and any data-processing responsibilities.

## Current data inventory

- Brief: name, email, optional phone, business category, budget and timeline, in React page memory. Review/download makes no submission request. In builds with `PUBLIC_ENQUIRY_ENABLED=true`, “Send your brief” posts those fields to `/api/enquiry/` on the Cloudflare Worker, which does not store them and passes them to Resend for delivery to hello@prodigystdio.com. Resend keeps sent-message records under its own retention; add its processing location and transfer safeguards to the notice before launch. A downloaded file remains on the visitor’s device. Browser autofill/download management is independent of Prodigy Stdio.
- Email: `mailto:` creates a draft addressed to hello@prodigystdio.com in the visitor’s email application. It does not send automatically. With sending on, the draft is offered only after a failed send. Prodigy Stdio’s receiving provider is Google Workspace; provider locations/retention and applicable transfer safeguards still need to be finalized for the notice.
- Calendar, if configured: opens the external provider with no brief fields added to its URL. Booking is completed there; identify that provider and its processing before launch.
- Cookie notice answer: `localStorage['prodigy-stdio-consent']`, written when the visitor answers the notice. It holds the choice, the list of optional storage it applied to and the time, and nothing else. No automatic expiry; a changed list asks again.
- Theme: `localStorage['prodigy-stdio-theme']`, written on selection, read on subsequent visits, no automatic expiry. It contains only Auto (`system`), Light or Dark, not form values. Auto does not delete the saved item; browser site-data settings can clear it.
- Cloudflare Web Analytics (RUM beacon, enabled in the Cloudflare dashboard, not in the code) counts page views and Core Web Vitals without cookies, device storage or stored IP addresses ([RUM beacon](https://developers.cloudflare.com/speed/observatory/rum-beacon/)); /privacy/ describes it. No advertising trackers, remote fonts, embedded calendars or application-set cookies are installed. Recheck network requests, cookies and storage on the deployed origin: hosting/protection layers may differ from the local preview.
- Hosting logs are separate from the brief form. Do not claim that the whole website processes no personal information.

A cookie notice was added at the user's request on 2026-10-20 (src/components/CookieNotice.astro). Because nothing optional is installed, it informs and asks for an OK rather than consent; the footer's "Cookie settings" brings it back. Before adding analytics, advertising, chat, video/map embeds or other services: list the category in `site.consent.optional` (the notice then offers Accept / Essential only and asks everyone again), load the service only through `whenConsented()` in src/lib/consent.ts, and update the Privacy & Cookies notice. Do not assume that a tool is exempt merely because it calls itself cookieless.

## References checked 2026-10-15

- [Bosnia and Herzegovina regulator: privacy notice information](https://azlp.ba/Provodenje_ZZLP/default.aspx?id=4833&langTag=en-US&pageIndex=1)
- [Bosnia and Herzegovina regulator: individual rights and controllers](https://www.azlp.ba/Gradani/default.aspx?id=4702&langTag=bs-BA&pageIndex=1&template_id=149)
- [CNIL: cookies, local storage and user-interface preference exemptions](https://cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi)
- [Your Europe: GDPR scope, transparency and processor contracts](https://europa.eu/youreurope/business/governance-and-sustainability/digital-and-data-compliance/data-protection-gdpr/index_en.htm)
- [Google privacy information for the confirmed Gmail inbox](https://policies.google.com/privacy)
