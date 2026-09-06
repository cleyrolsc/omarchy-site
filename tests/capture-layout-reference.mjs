// Captures the source redesign, never the converted site's output.
import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { prepare, metrics, routes, viewports } from "./layout-metrics.mjs";
const [base, source] = process.argv.slice(2);
if (!base || !source)
  throw new Error(
    "Usage: node tests/capture-layout-reference.mjs <source URL> <source checkout>",
  );
const branch = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: source,
  encoding: "utf8",
}).trim();
const browser = await chromium.launch();
const result = { sourceCommit: branch, viewports: {}, states: {} };
for (const [name, viewport] of Object.entries(viewports)) {
  const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
  await prepare(page);
  result.viewports[name] = {};
  result.states[name] = {};
  for (const route of routes) {
    await page.goto(new URL(route, base).href, { waitUntil: "networkidle" });
    result.viewports[name][route] = await metrics(page);
    if (route === "/meetups/") {
      await page.getByRole("button", { name: /^Europe/ }).click();
      await page.waitForTimeout(500);
      result.states[name].meetupsEurope = await metrics(page);
    }
  }
  await page.close();
}
await fs.writeFile(
  "tests/fixtures/layout.json",
  JSON.stringify(result, null, 2) + "\n",
);
await browser.close();
console.log(
  `Captured ${routes.length} routes at ${Object.keys(viewports).length} viewports from ${branch}`,
);
