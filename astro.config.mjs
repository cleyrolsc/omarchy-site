import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
export default defineConfig({
  site: "https://omarchy.org",
  output: "static",
  trailingSlash: "always",
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes("/404") &&
        !page.includes("/plugins/") &&
        !page.includes("/discord/") &&
        !page.includes("/manual/toc/") &&
        !page.includes("/security/credits/"),
    }),
  ],
  markdown: { syntaxHighlight: false },
  vite: { css: { devSourcemap: true } },
});
