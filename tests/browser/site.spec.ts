import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() =>
    localStorage.setItem("omarchy-site-theme", "tokyo-night"),
  );
});

test("core pages and downloads work without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const [path, heading] of [
    ["/", "Beautiful, fun"],
    ["/manual/getting-started/", "Getting"],
    ["/news/", "News"],
    ["/teams/", "Teams"],
    ["/patrons/badges/", "Patron badges"],
  ]) {
    await page.goto(`http://127.0.0.1:4322${path}`);
    await expect(page.locator("h1")).toContainText(heading);
    await expect(page.locator("main")).toBeVisible();
  }
  await page.goto("http://127.0.0.1:4322/");
  await expect(
    page.getByRole("link", { name: /Download Omarchy/ }),
  ).toHaveAttribute("href", /\.iso$/);
  await expect(page.locator("[data-open-search]")).toBeHidden();
  await page.goto("http://127.0.0.1:4322/screensaver/");
  await expect(page.locator("#screensaver-art")).toBeVisible();
  await context.close();
});

test("search works by keyboard and links to manual sections", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("[data-open-search]")).toBeVisible();
  await page.keyboard.press("/");
  await expect(
    page.getByRole("dialog", { name: "Search Omarchy" }),
  ).toBeVisible();
  await page.locator("#site-search-input").fill("SSH access");
  await expect(page.locator("[data-search-results] a").first()).toHaveAttribute(
    "href",
    /\/manual\/.*#ssh-access/,
  );
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#ssh-access$/);
  await expect(page.locator("#ssh-access")).toBeInViewport();
  await expect(page.locator("#site-search")).not.toBeVisible();
});

test("themes persist through Astro navigation and dialogs restore focus", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", {
    name: "Choose a theme",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Choose a theme" });
  await dialog.getByRole("button", { name: "Nord Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "nord");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.evaluate(() => {
    (window as Window & { migrationNavigation?: boolean }).migrationNavigation =
      true;
  });
  await page
    .locator(".desktop-nav")
    .getByRole("link", { name: "Manual", exact: true })
    .click();
  await expect(page).toHaveURL(/\/manual\/$/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "nord");
  expect(
    await page.evaluate(
      () =>
        (window as Window & { migrationNavigation?: boolean })
          .migrationNavigation,
    ),
  ).toBe(true);
  await page.keyboard.press("t");
  await expect(page.locator("#site-themes")).toBeVisible();
  await page.keyboard.press("Escape");
});

test("mobile menu, gallery filtering and layouts fit a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByLabel("Open navigation").click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Themes", exact: true })
    .click();
  await expect(page).toHaveURL(/\/themes\/$/);
  await page.locator("[data-gallery-search]").fill("aetheria");
  await expect(page.locator("[data-theme-card]:visible")).toHaveCount(1);
  await page
    .locator("[data-gallery-search]")
    .fill("no-theme-matches-this-query");
  await expect(page.locator("[data-gallery-count]")).toHaveText("0 themes");
  for (const route of [
    "/",
    "/manual/getting-started/",
    "/teams/",
    "/patrons/badges/",
  ]) {
    await page.goto(route);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      route,
    ).toBe(true);
  }
});

test("video players load only after interaction and are removed on close", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (/youtube|youtu\.be/.test(request.url())) requests.push(request.url());
  });
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<title>Video player test</title>",
    }),
  );
  await page.goto("/");
  expect(requests).toEqual([]);
  await page.locator("a[data-video]").first().click();
  await expect(page.locator("#site-media iframe")).toHaveAttribute(
    "src",
    /youtube-nocookie\.com\/embed\//,
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("#site-media iframe")).toHaveCount(0);
});

test("gallery images open using the keyboard", async ({ page }) => {
  await page.goto("/workstations/");
  const photo = page.locator(".workstations__image").first();
  await photo.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#site-media")).toBeVisible();
  await expect(page.locator("#site-media img")).toBeVisible();
  await page.keyboard.press("Escape");
});

test("music requires a gesture and survives internal navigation", async ({
  page,
}) => {
  const audioRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith(".mp3")) audioRequests.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator("[data-music-control]")).toBeVisible();
  expect(audioRequests).toEqual([]);
  await page.locator("[data-music-toggle]").click();
  await expect(page.locator("[data-music-state]")).toHaveText("Sound on", {
    timeout: 15_000,
  });
  await page
    .locator(".desktop-nav")
    .getByRole("link", { name: "News", exact: true })
    .click();
  await expect(page).toHaveURL(/\/news\/$/);
  await expect(page.locator("[data-music-state]")).toHaveText("Sound on");
  await page.locator("[data-music-toggle]").click();
  await expect(page.locator("[data-music-state]")).toHaveText("Sound off");
});

test("canvas paints, effect controls remain available, and pages have no runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?etch=beams");
  await expect(page.locator("[data-hero-wordmark]")).toHaveAttribute(
    "data-painted",
    "",
  );
  const painted = await page
    .locator('canvas[data-pixel-field="hero"]')
    .evaluate((canvas: HTMLCanvasElement) => {
      const data = canvas
        .getContext("2d")!
        .getImageData(0, 0, canvas.width, canvas.height).data;
      return data.some((value, index) => index % 4 !== 3 && value > 0);
    });
  expect(painted).toBe(true);
  await expect(page.locator("[data-effect-picker]")).toBeVisible();
  await page.locator('[data-effect="laseretch"]').click();
  await expect(page).toHaveURL(/etch=laseretch/);
  for (const route of [
    "/manual/",
    "/news/",
    "/security/",
    "/screensaver/",
    "/404",
  ])
    await page.goto(route);
  expect(errors).toEqual([]);
});

for (const route of ["/", "/manual/getting-started/", "/teams/", "/themes/"])
  test(`accessibility ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("[data-open-search]")).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  });
