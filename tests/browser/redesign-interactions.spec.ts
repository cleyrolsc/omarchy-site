import { test, expect } from "@playwright/test";
import { prepare } from "../layout-metrics.mjs";
test.use({ reducedMotion: "no-preference" });
test.beforeEach(async ({ page }) => {
  await prepare(page);
});
test("theme deck browses without applying and chooses with the frosted wipe", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Change website theme" }).click();
  const dialog = page.getByRole("dialog", { name: "Theme picker" });
  await expect(dialog.locator("[data-picker-card]:visible")).toHaveCount(5);
  await expect(dialog.locator('[data-depth="0"] .theme-frame')).toHaveCSS(
    "clip-path",
    "polygon(2.5% 0%, 100% 0%, 97.5% 100%, 0% 100%)",
  );
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    "tokyo-night",
  );
  await expect(dialog.locator("[data-picker-name]")).toHaveText("Vantablack");
  await page.evaluate(() => {
    (window as any).wipes = [];
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = ((update: any) => {
      (window as any).wipes.push(document.documentElement.className);
      return start(update);
    }) as typeof document.startViewTransition;
  });
  const before = await page.evaluate(() => scrollY);
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    "vantablack",
  );
  await expect(dialog).not.toBeVisible();
  expect(await page.evaluate(() => (window as any).wipes)).toEqual([
    expect.stringContaining("theme-wipe-frosted"),
  ]);
  await expect(page.locator("html")).not.toHaveClass(/theme-switching/);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await page.keyboard.press("t");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("t");
  await expect(dialog).not.toBeVisible();
});
test("voices unfolds, team faces fan out, and mobile rails track a swipe", async ({
  page,
}) => {
  await page.goto("/");
  const wall = page.locator("[data-voices-wall]");
  const toggle = page.locator("[data-voices-toggle]");
  await toggle.scrollIntoViewIfNeeded();
  await toggle.click();
  await expect(toggle).toHaveText("Show less");
  await expect(wall).toHaveCSS("max-height", "none");
  await toggle.click();
  await expect(toggle).toHaveText("View more");
  await expect(wall).toHaveCSS("max-height", "672px");
  const portrait = page.locator("#teams .team-face img").first();
  await portrait.scrollIntoViewIfNeeded();
  await portrait.hover();
  await expect(portrait).toHaveCSS("border-radius", "50%");
  await page.setViewportSize({ width: 390, height: 844 });
  const rail = page.locator("#plugins [data-card-rail]");
  await rail.scrollIntoViewIfNeeded();
  await rail.evaluate((el) =>
    el.scrollTo({ left: el.clientWidth, behavior: "instant" }),
  );
  await expect(page.locator("#plugins [data-rail-thumb]")).not.toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
});
