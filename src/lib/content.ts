import { getCollection, type CollectionEntry } from "astro:content";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
export const newsPath = (entry: CollectionEntry<"news">) =>
  `/news/${entry.id}/`;
export function plainText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
export function excerpt(value: string, length = 240) {
  const text = plainText(value);
  return text.length > length
    ? text.slice(0, length).replace(/\s+\S*$/, "") + "…"
    : text;
}
export async function newsEntries() {
  return (await getCollection("news")).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
}
export async function newsSummaries() {
  return (await newsEntries()).map((post) => ({
    title: post.data.title,
    date: post.data.date.toISOString(),
    path: newsPath(post),
    excerpt: post.data.description || excerpt(post.body || ""),
  }));
}
export async function manualEntries() {
  return (await getCollection("manual")).sort(
    (a, b) => a.data.order - b.data.order,
  );
}
const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});
turndown.use(gfm);
turndown.remove(["script", "style", "nav"]);
turndown.addRule("mediaButtons", {
  filter: "button",
  replacement: (content, node) =>
    (node as HTMLElement).querySelector("img") ? content : "",
});
turndown.addRule("frames", {
  filter: "iframe",
  replacement: (_, node) =>
    `\n\n[Watch or open embedded content](${(node as HTMLElement).getAttribute("src") || ""})\n\n`,
});
export function cleanMarkdown(body: string) {
  return /<(?:p|div|h[1-6]|section|figure|ul|ol|table)\b/.test(body)
    ? turndown.turndown(body)
    : body.trim();
}
export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
