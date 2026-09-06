import { defineConfig } from "astro/config";
// storybook-astro renders through Vite's websocket in development. Render the
// named story states with Astro too, so a published Storybook is self-contained.
export default defineConfig({
  srcDir: "./.storybook/site",
  outDir: "./.storybook-rendered",
  publicDir: "./.storybook/empty-public",
  output: "static",
  trailingSlash: "always",
});
