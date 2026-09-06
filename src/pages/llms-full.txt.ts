import type { APIRoute } from "astro";
import { site, absoluteUrl } from "../config/site";
import { documents, documentMarkdown } from "../lib/markdown";
export const GET: APIRoute = async () => {
  const docs = await documents();
  const selected = site.llms.corePages.map((page) => ({
    page,
    doc: docs.find((doc) => doc.path === page.path),
  }));
  const sections = selected.map(({ page, doc }) =>
    page.path === "/"
      ? `## Omarchy\n\n${site.description}\n\n${absoluteUrl("/index.md")}\n\nInstall: https://omarchy.org/#install. Try on Mac or Windows before installing. The manual covers supported hardware, installation, themes, applications, and development tools.`
      : `## ${page.title}\n\n${absoluteUrl(page.path)}\n\n${doc ? (page.path === "/themes/" ? `${doc.description}\n\nBrowse the complete catalogue: ${absoluteUrl(page.markdownPath)}` : documentMarkdown(doc)) : page.description}`,
  );
  return new Response(
    `# ${site.name} — site digest\n\n${site.llms.summary}\n\n${sections.join("\n\n")}\n\nSource: ${site.social.github}\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
};
