import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://xyzlab.dev',
  output: 'static',
  server: {
    host: '0.0.0.0',
    port: 4321,
  },
});