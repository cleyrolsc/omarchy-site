import type { APIRoute } from "astro";
import { site, absoluteUrl } from "../config/site";
export const GET: APIRoute = () =>
  new Response(
    [
      `# ${site.name}`,
      `> ${site.llms.summary}`,
      "",
      "## Core pages",
      ...site.llms.corePages.map(
        (page) =>
          `- [${page.title}](${absoluteUrl(page.path)}): ${page.description} [Markdown](${absoluteUrl(page.markdownPath)})`,
      ),
      "",
      "## Community and source",
      `- [GitHub](${site.social.github})`,
      `- [Discord](${site.social.discord})`,
      "- [Plugin marketplace](https://plugins.omarchy.org/)",
      "- [Full digest](https://omarchy.org/llms-full.txt)",
    ].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
