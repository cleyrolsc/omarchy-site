import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { newsEntries, newsPath, excerpt } from "../../lib/content";
import { site } from "../../config/site";
export const GET: APIRoute = async () => {
  const markdown = await createMarkdownProcessor({ syntaxHighlight: false });
  const posts = await newsEntries();
  const items = await Promise.all(
    posts.map(async (post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      link: newsPath(post),
      author: post.data.author,
      description: post.data.description || excerpt(post.body || ""),
      content: (await markdown.render(post.body || "")).code.replace(
        /(href|src)="\/(?!\/)/g,
        `$1="${site.url}/`,
      ),
    })),
  );
  return rss({
    title: "Omarchy News",
    description: "Notes on the people, ideas, and releases shaping Omarchy.",
    site: site.url,
    items,
    customData: "<language>en</language>",
  });
};
