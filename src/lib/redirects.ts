import core from "../data/redirects.json";
import catalogue from "../data/plugins.json";

// Derive plugin routes from the refreshed catalogue so new entries keep working.
export const redirects: Record<string, string> = {
  ...Object.fromEntries(
    catalogue.plugins.map((plugin) => [
      `/plugins/${plugin.id}/`,
      `https://plugins.omarchy.org/plugin.html?id=${encodeURIComponent(plugin.id)}`,
    ]),
  ),
  ...core,
};
