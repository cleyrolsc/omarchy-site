import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { newsEntries, newsPath, plainText } from "../../lib/content";
import type { SearchEntry } from "../../lib/search";
import catalogue from "../../data/plugins.json";
import themes from "../../data/themes.json";
export const GET: APIRoute = async () => {
  const entries: SearchEntry[] = [];
  const strip = (s: string) =>
    plainText(s)
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  const chapters = (await getCollection("manual")).sort(
    (a, b) => a.data.order - b.data.order,
  );
  for (const chapter of chapters) {
    const html = chapter.body || "";
    let cursor = 0,
      heading: string | null = null,
      hash: string | null = null;
    const push = (end: number) => {
      const text = strip(html.slice(cursor, end));
      if (text)
        entries.push({
          kind: "manual",
          title: chapter.data.title,
          heading,
          text,
          url: chapter.data.path + (hash ? "#" + hash : ""),
          section: "Manual",
        });
    };
    for (const match of html.matchAll(
      /<h([23])[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi,
    )) {
      push(match.index!);
      heading = strip(match[3]).replace(/\s*#\s*$/, "");
      hash = match[2];
      cursor = match.index! + match[0].length;
    }
    push(html.length);
  }
  for (const post of await newsEntries())
    entries.push({
      kind: "news",
      title: post.data.title,
      text: strip(post.body || ""),
      url: newsPath(post),
      section: "News",
      meta: post.data.date.toLocaleDateString("en-US", {
        timeZone: "America/New_York",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    });
  for (const plugin of catalogue.plugins)
    entries.push({
      kind: "plugin",
      title: plugin.name,
      text: [plugin.category, plugin.author, ...plugin.tags]
        .filter(Boolean)
        .join(" "),
      url:
        "https://plugins.omarchy.org/plugin.html?id=" +
        encodeURIComponent(plugin.id),
      section: "Plugin",
      meta: [plugin.category, plugin.author].filter(Boolean).join(" · "),
    });
  for (const theme of themes) {
    const owner =
      new URL(theme.repo).pathname.split("/").filter(Boolean)[0] || "community";
    entries.push({
      kind: "theme",
      title: theme.name,
      text: owner,
      url: theme.repo,
      section: "Theme",
      meta: owner,
    });
  }
  return new Response(JSON.stringify(entries), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
