import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { load } from "cheerio";
const root = path.resolve("dist");
const read = (file) => fs.readFileSync(file, "utf8");
const json = (file) => JSON.parse(read(file));
const normalize = (text) =>
  text
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s*[—–]\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
const failures = [];
let checks = 0;
function check(condition, message) {
  checks++;
  if (!condition) failures.push(message);
}
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? walk(path.join(dir, entry.name))
        : [path.join(dir, entry.name)],
    );
}
const fileFor = (url) => {
  const pathname = decodeURIComponent(
    new URL(url, "https://omarchy.org").pathname,
  );
  const file = path.join(root, pathname);
  if (pathname === "/404/" || pathname === "/404")
    return path.join(root, "404.html");
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  if (fs.existsSync(path.join(file, "index.html")))
    return path.join(file, "index.html");
  return undefined;
};
const pages = new Map(
  walk(root)
    .filter((file) => file.endsWith(".html"))
    .map((file) => [file, load(read(file))]),
);
for (const [url, hash] of Object.entries(
  json("tests/fixtures/static-assets.json"),
)) {
  const file = fileFor(url);
  check(Boolean(file), `Missing original asset ${url}`);
  if (file)
    check(
      createHash("sha256").update(fs.readFileSync(file)).digest("hex") === hash,
      `Changed original asset ${url}`,
    );
}
const reference = json("tests/fixtures/content.json");
const sync = json("redesign-source.json");
check(
  /^[0-9a-f]{40}$/.test(sync.lastReviewedCommit),
  "Source sync record needs a full commit hash",
);
for (const fixture of [reference, json("tests/fixtures/layout.json")])
  check(
    fixture.sourceCommit === sync.lastReviewedCommit,
    "Source sync record and captured references disagree",
  );
for (const doc of reference.docs) {
  const file = fileFor(doc.route);
  check(Boolean(file), `Missing original route ${doc.route}`);
  if (!file) continue;
  const $ = pages.get(file);
  const text = normalize($(doc.selector).text());
  for (const fragment of doc.fragments)
    check(
      text.includes(fragment),
      `Content missing from ${doc.route}: ${fragment.slice(0, 140)}`,
    );
  for (const id of doc.ids)
    check(
      $("[id]")
        .toArray()
        .some((el) => $(el).attr("id") === id),
      `Lost anchor ${doc.route}#${id}`,
    );
  for (const asset of doc.assets)
    check(Boolean(fileFor(asset)), `Missing content asset ${asset}`);
}
let contentPages = 0;
for (const [file, $] of pages) {
  const route =
    file === path.join(root, "404.html")
      ? "/404/"
      : "/" + path.relative(root, file).replace(/index\.html$/, "");
  const redirect = $('meta[http-equiv="refresh"]').attr("content");
  if (redirect) {
    const target = redirect.replace(/^\d+;\s*url=/i, "");
    check(
      $("a").attr("href") === target,
      `Redirect fallback mismatch: ${route}`,
    );
    if (target.startsWith("/"))
      check(Boolean(fileFor(target)), `Broken redirect ${route} -> ${target}`);
    continue;
  }
  contentPages++;
  check($("h1").length === 1, `Expected one h1: ${route}`);
  check($("main").length === 1, `Expected one main landmark: ${route}`);
  check(
    Boolean($('meta[name="description"]').attr("content")),
    `Missing description: ${route}`,
  );
  check(
    $('link[rel="canonical"]').attr("href") === `https://omarchy.org${route}`,
    `Canonical mismatch: ${route}`,
  );
  for (const schema of $('script[type="application/ld+json"]').toArray()) {
    try {
      JSON.parse($(schema).text());
    } catch {
      check(false, `Invalid JSON-LD: ${route}`);
    }
  }
  if (!route.includes("404")) {
    const alternate = $('link[rel="alternate"][type="text/markdown"]').attr(
      "href",
    );
    const twin = alternate && fileFor(alternate);
    check(Boolean(twin), `Missing Markdown twin: ${route}`);
    if (twin) {
      const md = read(twin);
      check(md.startsWith("# "), `Missing Markdown title: ${route}`);
      check(
        !/<(?:script|style|nav)\b/i.test(md),
        `Chrome in Markdown: ${route}`,
      );
      check(md.length > 100, `Empty Markdown: ${route}`);
    }
  }
  for (const el of $("[href],[src],[poster]").toArray()) {
    for (const attr of ["href", "src", "poster"]) {
      const value = $(el).attr(attr);
      if (!value || /^(?:data:|mailto:|tel:|javascript:)/.test(value)) continue;
      const url = new URL(value, `https://omarchy.org${route}`);
      if (url.origin !== "https://omarchy.org") continue;
      const target = fileFor(url.href);
      check(Boolean(target), `Broken local ${attr}: ${route} -> ${value}`);
      if (
        target &&
        url.hash &&
        pages.has(target) &&
        !pages.get(target)('meta[http-equiv="refresh"]').length
      ) {
        const dest = pages.get(target);
        const id = decodeURIComponent(url.hash.slice(1));
        check(
          dest("[id],[name]")
            .toArray()
            .some(
              (node) =>
                dest(node).attr("id") === id || dest(node).attr("name") === id,
            ),
          `Broken anchor: ${route} -> ${value}`,
        );
      }
    }
  }
}
for (const group of json("src/data/teams.json"))
  for (const member of group.members)
    check(
      pages.get(fileFor("/teams/"))("main").text().includes(member.name),
      `Team member missing: ${member.name}`,
    );
for (const plugin of json("src/data/plugins.json").plugins) {
  const $ = pages.get(fileFor(`/plugins/${plugin.id}/`));
  check(
    $?.("a").attr("href") ===
      `https://plugins.omarchy.org/plugin.html?id=${encodeURIComponent(plugin.id)}`,
    `Plugin redirect missing: ${plugin.id}`,
  );
}
const search = json("dist/data/search-index.json");
check(
  search.some(
    (entry) => entry.url.startsWith("/manual/") && entry.url.includes("#"),
  ),
  "Search lost manual section anchors",
);
const rss = load(read("dist/news/rss.xml"), { xmlMode: true });
check(rss("item").length === 20, "RSS post count changed");
check(
  rss("item").first().find("content\\:encoded").text().length > 500,
  "RSS missing full article content",
);
for (const endpoint of [
  "llms.txt",
  "llms-full.txt",
  "sitemap-index.xml",
  "robots.txt",
])
  check(
    read(path.join(root, endpoint)).includes("https://omarchy.org"),
    `Wrong identity: ${endpoint}`,
  );
const pkg = json("package.json");
for (const name of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }))
  check(
    !/^(react|react-dom|@astrojs\/react|@tanstack\/|tailwindcss|@tailwindcss\/)/.test(
      name,
    ),
    `Legacy application dependency: ${name}`,
  );
for (const file of walk("src")) {
  if (
    file.endsWith(".astro") &&
    file.startsWith("src/components/") &&
    !file.startsWith("src/components/brand/")
  )
    check(
      fs.existsSync(file.replace(/\.astro$/, ".stories.ts")),
      `Story missing: ${file}`,
    );
  if (/\.(ts|astro|css)$/.test(file))
    check(
      !/from ['"](?:react|@tanstack\/)|@import ['"]tailwindcss/.test(
        read(file),
      ),
      `Legacy application import: ${file}`,
    );
}
if (failures.length) {
  console.error(failures.join("\n"));
  assert.fail(`${failures.length} failures across ${checks} checks`);
}
console.log(
  `Passed ${checks} checks: ${contentPages} HTML pages, ${reference.docs.length} source documents, assets, links, redirects, Markdown, feeds, and framework structure.`,
);
