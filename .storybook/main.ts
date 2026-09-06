/**
 * Storybook — main configuration
 *
 * Uses the `storybook-astro` framework so we can author stories in raw
 * Astro components (imported by path). Stories live alongside src/ and
 * are discovered by glob.
 */
import type { StorybookConfig } from "storybook-astro";
import type { UserConfig, Plugin, PluginOption } from "vite";

async function flattenPlugins(option: PluginOption): Promise<Plugin[]> {
  const resolved = await option;
  if (!resolved) return [];
  if (Array.isArray(resolved))
    return (await Promise.all(resolved.map(flattenPlugins))).flat();
  return [resolved];
}

const config: StorybookConfig & {
  viteFinal: (
    config: UserConfig,
    options: { configType?: string },
  ) => Promise<UserConfig>;
} = {
  stories: ["../src/**/*.stories.@(ts|tsx|js|jsx|mdx)"],

  addons: ["@storybook/addon-docs"],
  staticDirs: [
    "../public",
    ...(process.argv.includes("build")
      ? [{ from: "../.storybook-rendered/_astro", to: "/_astro" }]
      : []),
  ],

  framework: {
    name: "storybook-astro",
    options: {
      // Global styles injected into every story frame. Keep this in
      // sync with src/layouts/*.astro — every story should see the same
      // tokens, reset, base, components, and utilities the real site does.
      stylesheets: ["/src/styles/main.css"],
    },
  },

  core: {
    builder: "@storybook/builder-vite",
  },

  async viteFinal(config, { configType }) {
    if (configType !== "PRODUCTION") return config;
    // Named states are already rendered by Astro. Its application HTML plugins
    // would consume Storybook's iframe.html, so the static preview uses stubs.
    const plugins = (await flattenPlugins(config.plugins || [])).filter(
      (plugin) =>
        !plugin?.name?.startsWith("astro:") &&
        !plugin?.name?.startsWith("storybook-astro:"),
    );
    return {
      ...config,
      // Storybook staticDirs owns public assets; a second Vite copy races it.
      publicDir: false,
      plugins: [
        ...plugins,
        {
          name: "omarchy-static-astro-stories",
          enforce: "pre",
          resolveId(id: string) {
            if (id.startsWith("virtual:astro-storybook/")) return id;
          },
          load(id: string) {
            if (id === "virtual:astro-storybook/styles")
              return "export const stylesheets = []";
            if (id === "virtual:astro-storybook/scripts")
              return "export const scripts = []";
            if (id.endsWith(".astro"))
              return "export default function AstroStory() {}";
          },
        },
      ],
    };
  },
};

export default config;
