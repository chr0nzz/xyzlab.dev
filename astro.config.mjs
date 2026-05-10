import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://xyzlab.dev',
  output: 'static',
  integrations: [sitemap()],
  server: {
    host: '0.0.0.0',
    port: 4321,
  },
});