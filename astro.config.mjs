// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
export default defineConfig({
  site: "https://cal.jupocket.com",
  integrations: [sitemap()],
});
