import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'PUBLIC_');
const siteUrl = process.env.PUBLIC_SITE_URL || env.PUBLIC_SITE_URL;
const indexable = (process.env.PUBLIC_SITE_INDEXABLE || env.PUBLIC_SITE_INDEXABLE) === 'true';
if (siteUrl) {
  const url = new URL(siteUrl);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error('PUBLIC_SITE_URL must be an HTTPS origin with no path, query, or credentials.');
  }
}
if (indexable && !siteUrl) throw new Error('An indexable build requires PUBLIC_SITE_URL.');

export default defineConfig({
  site: siteUrl || undefined,
  output: 'static',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'always' },
  integrations: [react(), ...(indexable ? [sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/404') })] : [])],
});
