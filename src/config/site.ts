/** Replace these values with verified business details before launch. */
export const site = {
  name: 'Meridian',
  nameConfirmed: true,
  founder: 'Tarik Skender',
  email: '',
  description: 'Custom websites built with React and TypeScript, with clear content, fast performance, and search visibility in mind for businesses serving the US market.',
  locale: 'en_US',
  language: 'en-US',
  socialProfiles: [] as string[],
};

export const designChoices: {
  hero: 'A' | 'B' | null;
  contact: '1a' | '1b' | null;
  footer: '1a' | '1b' | null;
} = { hero: 'B', contact: '1a', footer: '1b' };

// Roles are published only once confirmed; do not invent biographies.
export const team = [
  { name: 'Tarik Skender', role: '' },
  { name: 'Aladin Music', role: 'Sales & Outreach' },
  { name: 'Ishak Sacirbey', role: '' },
  { name: 'Haris Susic', role: '' },
  { name: 'Kemal Mesic', role: '' },
];
