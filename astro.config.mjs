// @ts-check
import { defineConfig } from 'astro/config';

// PUBLIC_SITE_URL is the production origin (for example https://www.example.co.za).
// It is not known yet; canonical and social-preview URLs are only emitted once it is set.
const site = process.env.PUBLIC_SITE_URL || undefined;

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  devToolbar: {
    enabled: false,
  },
});
