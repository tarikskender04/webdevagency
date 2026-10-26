const studioName = 'Prodigy Stdio';
const studioSlug = 'prodigy-stdio';

/** Confirmed brand, domain and Google Workspace inbox (hello@ is an alias of tarik@prodigystdio.com). */
export const site = {
  name: studioName,
  nameConfirmed: true,
  domain: 'prodigystdio.com',
  brandAssets: {
    logo: { ink: '/brand/prodigy-stdio-logo-ink.svg', white: '/brand/prodigy-stdio-logo-white.svg', width: 2300, height: 430 },
    wordmark: { ink: '/brand/prodigy-stdio-wordmark.svg', white: '/brand/prodigy-stdio-wordmark-white.svg', width: 1930, height: 342 },
    mark: { ink: '/brand/prodigy-stdio-mark-ink.svg', white: '/brand/prodigy-stdio-mark-white.svg', width: 692, height: 902 },
  },
  themeStorageKey: `${studioSlug}-theme`,
  /** The cookie notice (CookieNotice.astro). `optional` lists storage that needs the visitor's consent; while it is empty the
   *  notice only informs and asks for an OK, because nothing optional is installed. Add 'analytics' together with an
   *  analytics tool: the notice then offers Accept / Essential only, the tool must wait for hasConsent('analytics')
   *  (src/lib/consent.ts), and everyone is asked again because the stored answer names the list it was given for. */
  consent: { storageKey: `${studioSlug}-consent`, optional: [] as ('analytics')[] },
  briefFilename: `${studioSlug}-project-brief.txt`,
  founder: 'Tarik Skender',
  email: 'hello@prodigystdio.com',
  emailProvider: { name: 'Google Workspace', privacyUrl: 'https://cloud.google.com/terms/cloud-privacy-notice' },
  /** Sent briefs go out through Resend from this address (domain verified in Resend) to `email`, with the visitor as Reply-To. */
  enquiry: { from: `${studioName} <forms@prodigystdio.com>`, provider: { name: 'Resend', privacyUrl: 'https://resend.com/legal/privacy-policy' } },
  studio: {
    introduction: `${studioName} is an independent web studio based in Sarajevo, Bosnia and Herzegovina.`,
    focus: 'We design and build websites, online ordering and back offices for businesses in the US and Europe.',
  },
  description: `${studioName} designs and builds websites, online ordering and back offices for businesses in the US and Europe. See our work and start your next project.`,
  locale: 'en_US',
  language: 'en-US',
  /** Public profiles: the footer's Follow column and the Organization's sameAs. LinkedIn uses the public company URL, not the admin dashboard. */
  socialProfiles: [
    { name: 'LinkedIn', url: 'https://www.linkedin.com/company/prodigy-stdio/' },
    { name: 'X', url: 'https://x.com/prodigystdio' },
    { name: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61595389961132' },
  ] as { name: string; url: string }[],
  billboard: {
    headline: ['Your website is', 'costing you clients.'],
    response: 'We fix that.',
  },
};

// The user confirmed the operator and the Sarajevo address. Retention and transfer wording follows the providers'
// published practices (Cloudflare Workers Logs: 3 days on Free, 7 from 2026-12-01; Resend sends from eu-west-1, Ireland).
export const legal = {
  updated: '2026-10-25',
  operatorName: 'Tarik Skender',
  contactAddress: 'Gradačačka 118, 71000 Sarajevo, Bosnia and Herzegovina',
  /** The same address for structured data (BaseLayout's Organization). */
  postalAddress: { streetAddress: 'Gradačačka 118', postalCode: '71000', addressLocality: 'Sarajevo', addressCountry: 'BA' },
  hostingProvider: 'Cloudflare',
  hostingPrivacyUrl: 'https://www.cloudflare.com/privacypolicy/',
  hostingLogRetention: 'Cloudflare keeps the logs of our enquiry service for no more than 7 days. They record the request and any delivery error, not the contents of your brief.',
  processingLocationsAndTransfers: 'We work from Bosnia and Herzegovina. Our providers, Cloudflare (hosting), Google (email) and Resend (email delivery, from servers in Ireland), may process information in the European Union, the United States and other countries. They protect these transfers with safeguards such as the European Commission’s Standard Contractual Clauses.',
  enquiryRetention: 'We keep enquiries for up to two years after our last contact with you, so we can follow up on your project. If you become a client, we keep project records for as long as the law requires for business records. You can ask us to delete your enquiry at any time.',
};

export const policyDetailsPending = !(
  legal.operatorName && legal.contactAddress && site.email &&
  legal.hostingProvider && legal.hostingPrivacyUrl && legal.hostingLogRetention &&
  legal.processingLocationsAndTransfers && legal.enquiryRetention
);

export const designChoices: {
  hero: 'A' | 'B' | null;
  contact: '1a' | '1b' | null;
  footer: '1a' | '1b' | null;
} = { hero: 'B', contact: '1a', footer: '1b' };

// Roles are published only once confirmed; do not invent biographies.
export const team = [
  { name: 'Tarik Skender', role: 'Owner & CEO' },
  { name: 'Aladin Music', role: 'Sales & Outreach' },
  { name: 'Ishak Sacirbey', role: 'UI/UX Designer' },
  { name: 'Haris Sušić', role: 'Software Engineer' },
  { name: 'Kemal Mešić', role: 'Frontend Engineer' },
];
