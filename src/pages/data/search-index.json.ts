import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { documents } from "../../lib/markdown";
import { plainText } from "../../lib/content";
import catalogue from "../../data/plugins.json";
import themes from "../../data/themes.json";
export const GET: APIRoute = async () => {
  const docs = await documents();
  const entries = docs
    .filter((doc) => doc.path !== "/")
    .flatMap((doc) => {
      const section = doc.path.startsWith("/manual/")
        ? "Manual"
        : doc.path.startsWith("/news/")
          ? "News"
          : "Page";
      return [
        { title: doc.title, text: plainText(doc.body), url: doc.path, section },
      ];
    });
  for (const chapter of await getCollection("manual")) {
    const body = chapter.body || "";
    const headings = [
      ...body.matchAll(/<h[2-6]\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h[2-6]>/g),
    ];
    headings.forEach((heading, index) =>
      entries.push({
        title: plainText(heading[2]),
        text: plainText(
          body.slice(
            heading.index! + heading[0].length,
            headings[index + 1]?.index,
          ),
        ),
        url: `${chapter.data.path}#${heading[1]}`,
        section: `Manual · ${chapter.data.title}`,
      }),
    );
  }
  for (const theme of themes)
    entries.push({
      title: theme.name,
      text: "Community theme " + theme.repo,
      url: theme.repo,
      section: "Theme",
    });
  for (const plugin of catalogue.plugins)
    entries.push({
      title: plugin.name,
      text: plugin.description + " " + plugin.tags.join(" "),
      url:
        "https://plugins.omarchy.org/plugin.html?id=" +
        encodeURIComponent(plugin.id),
      section: "Plugin",
    });
  return new Response(JSON.stringify(entries), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
