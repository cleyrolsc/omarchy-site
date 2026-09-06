import { test, expect } from "@playwright/test";
import fs from "node:fs";
const index = JSON.parse(
  fs.readFileSync("storybook-static/index.json", "utf8"),
) as { entries: Record<string, { type: string; id: string; title: string }> };
for (const story of Object.values(index.entries).filter(
  (entry) => entry.type === "story",
))
  test(`Storybook ${story.id}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(
      `http://127.0.0.1:6007/iframe.html?id=${story.id}&viewMode=story`,
    );
    await expect
      .poll(() =>
        page
          .locator("#storybook-root")
          .evaluate((root) => root.querySelectorAll("*").length),
      )
      .toBeGreaterThan(1);
    await expect(page.locator("body")).not.toContainText(
      /Failed to render|Render Error|Missing prerendered/,
    );
    expect(
      await page
        .locator("#storybook-root")
        .evaluate((root) => root.querySelectorAll("*").length),
    ).toBeGreaterThan(1);
    expect(errors).toEqual([]);
  });
