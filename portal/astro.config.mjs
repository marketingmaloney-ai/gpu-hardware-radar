import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://price-drop-radar.com',
  integrations: [tailwind()]
});
