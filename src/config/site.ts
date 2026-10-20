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
    introduction: `${studioName} is an independent web studio based in Chicago, operating in Bosnia and Herzegovina.`,
    focus: 'We design and build websites, online ordering and back offices for businesses in the US and Europe.',
  },
  description: `${studioName} designs and builds websites, online ordering and back offices for businesses in the US and Europe. See our work and start your next project.`,
  locale: 'en_US',
  language: 'en-US',
  socialProfiles: [] as string[],
  billboard: {
    headline: ['Your website is', 'costing you clients.'],
    response: 'We fix that.',
  },
};

// Keep unconfirmed details empty and complete them before public launch.
// The user explicitly confirmed the operator separately from the project contact.
export const legal = {
  updated: '2026-10-20',
  operatorName: 'Tarik Skender',
  contactAddress: '',
  hostingProvider: 'Cloudflare',
  hostingPrivacyUrl: 'https://www.cloudflare.com/privacypolicy/',
  hostingLogRetention: '',
  processingLocationsAndTransfers: '',
  enquiryRetention: '',
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
  { name: 'Ishak Sacirbey', role: '' },
  { name: 'Haris Susic', role: '' },
  { name: 'Kemal Mesic', role: '' },
];
