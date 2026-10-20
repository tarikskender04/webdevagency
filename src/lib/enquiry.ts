import { site } from '../config/site';

/** Shared by the brief form and the enquiry endpoint, so the server accepts exactly the choices the form offers. */
export const briefOptions = {
  business: ['Restaurant / café', 'Retail', 'Salon / beauty', 'Trades / services', 'Other'],
  budget: ['Under $3k', '$3–6k', '$6–12k', '$12k+'],
  timeline: ['ASAP', '1–2 months', '3+ months', 'Just exploring'],
} as const;

export interface Brief { name: string; email: string; phone: string; business: string; budget: string; timeline: string; }

export const briefLimits = { name: 100, email: 254, phone: 40 } as const;
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The plain-text brief used for the download, the email draft and the enquiry notification. */
export function briefText(brief: Brief): string {
  return `${site.name} project brief\n\nName: ${brief.name.trim()}\nEmail: ${brief.email.trim()}\nPhone: ${brief.phone || 'Not provided'}\nBusiness: ${brief.business || 'To discuss'}\nBudget: ${brief.budget || 'To discuss'}\nTimeline: ${brief.timeline || 'To discuss'}\n`;
}

const controlCharacters = /[\u0000-\u001f\u007f]+/g;
function field(value: unknown, max: number): string | null {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') return null;
  const clean = value.replace(controlCharacters, ' ').trim();
  return clean.length > max ? null : clean;
}
function choice(value: unknown, options: readonly string[]): string | null {
  if (value === undefined || value === null || value === '') return '';
  return typeof value === 'string' && options.includes(value) ? value : null;
}

/** Validates an untrusted request body. Returns null when anything is missing, too long or not one of the offered choices. */
export function parseBrief(body: unknown): Brief | null {
  if (!body || typeof body !== 'object') return null;
  const input = body as Record<string, unknown>;
  const brief = {
    name: field(input.name, briefLimits.name),
    email: field(input.email, briefLimits.email),
    phone: field(input.phone, briefLimits.phone),
    business: choice(input.business, briefOptions.business),
    budget: choice(input.budget, briefOptions.budget),
    timeline: choice(input.timeline, briefOptions.timeline),
  };
  if (Object.values(brief).some(value => value === null)) return null;
  const valid = brief as Brief;
  return valid.name && emailPattern.test(valid.email) ? valid : null;
}
