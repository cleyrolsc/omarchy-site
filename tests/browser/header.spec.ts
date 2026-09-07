import { test, expect } from "@playwright/test";
import { prepare } from "../layout-metrics.mjs";

test.beforeEach(async ({ page }) => prepare(page));

test.describe("phone header", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test("wordmark arrives with the surface and the bar stays filled across section edges", async ({
    page,
  }) => {
    await page.goto("/");
    const header = page.locator(".site-header");
    const surface = header.locator(".header-surface");
    const mark = header.locator(".brand-mark");
    const wordmark = header.locator(".nav-wordmark");
    await expect(mark).toHaveCSS("opacity", "1");
    await expect(wordmark).toHaveCSS("opacity", "0");
    await expect(surface).toHaveCSS(
      "background-color",
      "color(srgb 0 0 0 / 0)",
    );
    const boundary = await page
      .locator("[data-hero-sentinel]")
      .evaluate((el) => el.getBoundingClientRect().bottom + scrollY);
    await page.evaluate(
      (y) => scrollTo({ top: y - 28, behavior: "instant" }),
      boundary,
    );
    await expect(wordmark).toHaveCSS("opacity", "1");
    await expect(mark).toHaveCSS("opacity", "0");
    await expect(surface).toHaveCSS(
      "background-image",
      /linear-gradient.*28px/,
    );
    await expect(surface).toHaveCSS("box-shadow", /inset/);
    await page.evaluate(
      (y) => scrollTo({ top: y + 100, behavior: "instant" }),
      boundary,
    );
    await expect(surface).toHaveCSS("background-image", "none");
    await expect(surface).toHaveCSS("backdrop-filter", "blur(12px)");
    const section = await page
      .locator("main>section")
      .nth(2)
      .evaluate((el) => el.getBoundingClientRect().top + scrollY);
    await page.evaluate(
      (y) => scrollTo({ top: y - 28, behavior: "instant" }),
      section,
    );
    await expect(surface).toHaveCSS(
      "background-image",
      /linear-gradient.*28px/,
    );
    await expect(surface).toHaveCSS("backdrop-filter", "blur(12px)");
    await expect(wordmark).toHaveCSS("opacity", "1");
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await expect(wordmark).toHaveCSS("opacity", "0");
    await expect(mark).toHaveCSS("opacity", "1");
    await page.goto("/manual/getting-started/");
    await expect(wordmark).toHaveCSS("opacity", "1");
    await expect(surface).toHaveCSS("backdrop-filter", "blur(12px)");
  });

  test("touch menu dims and blurs the page, then returns the labels to the hero", async ({
    page,
  }) => {
    await page.goto("/");
    const summary = page.locator(".site-header summary");
    await summary.tap();
    const scrim = page.locator(".site-header [data-menu-scrim]");
    await expect(scrim).toBeVisible();
    await expect(scrim).toHaveCSS(
      "background-color",
      "color(srgb 0 0 0 / 0.55)",
    );
    await expect(scrim).toHaveCSS("backdrop-filter", "blur(4px)");
    await summary.tap();
    await expect(scrim).toBeHidden();
    await expect(summary).toHaveCSS("color", "rgba(0, 0, 0, 0)");
    await expect(page.locator("[data-nav-ghost]")).toHaveCSS("opacity", "1");
  });
});

test("skip link and manual navigation expose visible keyboard focus", async ({
  page,
}) => {
  await page.goto("/manual/getting-started/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  expect(
    await page
      .locator("main")
      .evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  const current = page.locator('.manual-navigation [aria-current="page"]');
  await current.focus();
  await expect(current).toHaveCSS("outline-style", "solid");
  await expect(current).toHaveCSS("outline-width", "2px");
  await page.locator('a[rel="next"]').focus();
  await expect(page.locator('a[rel="next"]')).toHaveCSS("outline-width", "2px");
});

test("malformed hashes do not break initial loads or Astro navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/manual/getting-started/#%E0%A4%A");
  await expect(page.locator("h1")).toContainText("Getting Started");
  await page
    .locator(".site-header .desktop-nav")
    .getByRole("link", { name: "News", exact: true })
    .click();
  await expect(page).toHaveURL(/\/news\/$/);
  await page.evaluate(() => {
    const link = document.createElement("a");
    link.href = "/manual/#%E0%A4%A";
    document.body.append(link);
    link.click();
  });
  await expect(page).toHaveURL(/\/manual\/#%E0%A4%A$/);
  await expect(page.locator("h1")).toContainText("Welcome to Omarchy!");
  await page.keyboard.press("/");
  await expect(page.locator("#site-search")).toBeVisible();
  expect(errors).toEqual([]);
});
