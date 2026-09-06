// Run only when deliberately updating the migration reference snapshot.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { load } from "cheerio";
const source = path.resolve(process.argv[2] || "../omarchy-site-baris");
const json = (name) =>
  JSON.parse(fs.readFileSync(path.join(source, "src/data", `${name}.json`)));
const normalize = (text) =>
  text
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s*[—–]\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
const docs = [];
function capture(route, title, html, selector) {
  const $ = load(html);
  const fragments = $("p,pre,li,td,th,h2,h3,h4,figcaption")
    .map((_, el) => normalize($(el).text()).replace(/\s*#$/, ""))
    .get()
    .filter(Boolean);
  const ids = $("[id]")
    .map((_, el) => $(el).attr("id"))
    .get();
  const assets = $("img[src],video[src],source[src]")
    .map(
      (_, el) =>
        new URL($(el).attr("src"), `https://omarchy.org${route}`).pathname,
    )
    .get();
  docs.push({ route, title, selector, fragments, ids, assets });
}
for (const page of json("manual"))
  capture(
    page.slug === "index" ? "/manual/" : `/manual/${page.slug}/`,
    page.title,
    page.html,
    ".manual-prose",
  );
for (const post of json("news-posts"))
  capture(post.path, post.title, post.html, ".article-content");
for (const [slug, page] of Object.entries(json("pages"))) {
  if (slug === "teams") continue; // Its redesigned roster is checked against the team data below.
  capture(
    slug === "security/credits" ? "/security/" : `/${slug}/`,
    slug === "security/credits" ? "Security" : page.title,
    page.html,
    ".standalone-content",
  );
}
const assets = {};
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? walk(path.join(dir, entry.name))
        : [path.join(dir, entry.name)],
    );
}
for (const directory of ["public", "assets"]) {
  for (const file of walk(path.join(source, directory))) {
    const url =
      (directory === "assets" ? "/assets/" : "/") +
      path.relative(path.join(source, directory), file);
    if (["/robots.txt", "/favicon.svg"].includes(url)) continue;
    assets[url] = createHash("sha256")
      .update(fs.readFileSync(file))
      .digest("hex");
  }
}
fs.writeFileSync(
  "tests/fixtures/static-assets.json",
  JSON.stringify(assets, null, 2) + "\n",
);
fs.writeFileSync(
  "tests/fixtures/content.json",
  JSON.stringify(
    {
      sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: source,
        encoding: "utf8",
      }).trim(),
      docs,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Captured ${docs.length} content pages and ${Object.keys(assets).length} static assets.`,
);
