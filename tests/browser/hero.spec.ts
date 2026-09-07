import { test, expect } from "@playwright/test";
import { prepare } from "../layout-metrics.mjs";
import {
  observeEffects,
  playedEffects,
  wordmarkCenter,
} from "../hero-effects.mjs";

test.beforeEach(async ({ page }) => {
  await prepare(page);
  await observeEffects(page);
});

for (const touch of [false, true]) {
  test.describe(touch ? "touch hero" : "mouse hero", () => {
    test.use({
      reducedMotion: "no-preference",
      hasTouch: touch,
      isMobile: touch,
      viewport: touch
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1000 },
    });

    test("loads an effect and replays different effects without opening the theme picker", async ({
      page,
    }) => {
      await page.goto("/");
      await expect.poll(() => playedEffects(page)).toHaveLength(1);
      const point = await wordmarkCenter(page);
      for (let i = 0; i < 3; i++) {
        if (touch) await page.touchscreen.tap(point.x, point.y);
        else await page.mouse.click(point.x, point.y);
        await expect.poll(() => playedEffects(page)).toHaveLength(i + 2);
        const effects = await playedEffects(page);
        expect(effects.at(-1)).not.toBe(effects.at(-2));
        await expect(
          page.getByRole("dialog", { name: "Theme picker" }),
        ).toBeHidden();
        await expect(page.locator("html")).toHaveAttribute(
          "data-theme",
          "tokyo-night",
        );
      }
    });

    if (touch)
      test("the requested-effect panel leaves the wordmark available on phones", async ({
        page,
      }) => {
        await page.goto("/?etch=laseretch");
        await expect.poll(() => playedEffects(page)).toEqual(["laseretch"]);
        const point = await wordmarkCenter(page);
        await page.touchscreen.tap(point.x, point.y);
        await expect
          .poll(() => playedEffects(page))
          .toEqual(["laseretch", "laseretch"]);
        await page.getByRole("button", { name: "beams", exact: true }).tap();
        await expect
          .poll(() => playedEffects(page))
          .toEqual(["laseretch", "laseretch", "beams"]);
        await expect(page).toHaveURL(/etch=beams/);
        await page.locator(".effect-picker summary").tap();
        await expect(
          page.getByRole("group", { name: "Wordmark effect" }),
        ).toBeHidden();
        await page.touchscreen.tap(point.x, point.y);
        await expect
          .poll(() => playedEffects(page))
          .toEqual(["laseretch", "laseretch", "beams", "beams"]);
      });
  });
}

test.describe("hero effect lifecycle", () => {
  test.use({ reducedMotion: "no-preference" });

  test("honors the requested effect and preserves native right-click behavior", async ({
    page,
  }) => {
    await page.goto("/?etch=laseretch");
    await expect.poll(() => playedEffects(page)).toEqual(["laseretch"]);
    const point = await wordmarkCenter(page);
    await page.mouse.click(point.x, point.y);
    await expect
      .poll(() => playedEffects(page))
      .toEqual(["laseretch", "laseretch"]);
    await page.evaluate(() => {
      window.addEventListener(
        "contextmenu",
        (event) => {
          (window as any).contextMenuPrevented = event.defaultPrevented;
        },
        { once: true },
      );
    });
    await page.mouse.click(point.x, point.y, { button: "right" });
    expect(
      await page.evaluate(() => (window as any).contextMenuPrevented),
    ).toBe(false);
    await expect(
      page.getByRole("dialog", { name: "Theme picker" }),
    ).toBeHidden();
    await page.keyboard.press("Escape");
    await page.keyboard.press("t");
    await expect(
      page.getByRole("dialog", { name: "Theme picker" }),
    ).toBeVisible();
  });

  test("starts a fresh effect after Astro navigation without duplicating listeners", async ({
    page,
  }) => {
    await page.goto("/");
    await expect.poll(() => playedEffects(page)).toHaveLength(1);
    await page
      .locator(".site-header .desktop-nav")
      .getByRole("link", { name: "News", exact: true })
      .click();
    await expect(page).toHaveURL(/\/news\/$/);
    await page
      .getByRole("banner")
      .getByRole("link", { name: "Omarchy home", exact: true })
      .click();
    await expect.poll(() => playedEffects(page)).toHaveLength(2);
    const point = await wordmarkCenter(page);
    await page.mouse.click(point.x, point.y);
    await expect.poll(() => playedEffects(page)).toHaveLength(3);
    await page.waitForTimeout(150);
    expect(await playedEffects(page)).toHaveLength(3);
  });

  test("keeps the static wordmark available when browser modules cannot load", async ({
    page,
  }) => {
    await page.route("**/_astro/*.js", (route) => route.abort());
    await page.goto("/");
    await expect(page.locator("[data-hero-wordmark]")).toBeHidden();
    await expect(page.locator("[data-hero-wordmark]")).toBeVisible({
      timeout: 7000,
    });
    expect(await playedEffects(page)).toEqual([]);
  });

  test("replays once after choosing a theme, without playing while browsing the deck", async ({
    page,
  }) => {
    await page.goto("/");
    await expect.poll(() => playedEffects(page)).toHaveLength(1);
    await page.keyboard.press("t");
    await expect(
      page.getByRole("dialog", { name: "Theme picker" }),
    ).toBeVisible();
    await page.keyboard.press("ArrowRight");
    expect(await playedEffects(page)).toHaveLength(1);
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      "vantablack",
    );
    await expect(
      page.getByRole("dialog", { name: "Theme picker" }),
    ).toBeHidden();
    await expect.poll(() => playedEffects(page)).toHaveLength(2);
    await page.waitForTimeout(150);
    expect(await playedEffects(page)).toHaveLength(2);
  });
});

test("reduced motion leaves the wordmark still and the 404 logo still goes home", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("[data-hero-wordmark]")).toHaveAttribute(
    "data-painted",
    "",
  );
  const point = await wordmarkCenter(page);
  await page.mouse.click(point.x, point.y);
  expect(await playedEffects(page)).toEqual([]);
  await expect(page.getByRole("dialog", { name: "Theme picker" })).toBeHidden();
  await page.goto("/404/");
  await expect(page.locator("[data-hero-wordmark]")).toHaveAttribute(
    "data-painted",
    "",
  );
  const home = await wordmarkCenter(page);
  await page.mouse.click(home.x, home.y);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("h1")).toContainText("Beautiful, fun");
});
