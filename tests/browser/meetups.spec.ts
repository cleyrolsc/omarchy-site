import { test, expect } from "@playwright/test";
import { prepare } from "../layout-metrics.mjs";
import fs from "node:fs";
import type { Meetup } from "../../src/lib/meetups";
const events: Meetup[] = JSON.parse(
  fs.readFileSync("src/data/meetups.json", "utf8"),
).events;
import { regionOf } from "../../src/lib/regions";
const now = Date.parse("2026-09-06T20:00:00Z");
const upcoming = events.filter((e) => Date.parse(e.start) >= now);

test("meetup region and country filters coordinate the cards and map", async ({
  page,
}) => {
  await prepare(page);
  await page.goto("/meetups/");
  const nav = page.getByRole("navigation", {
    name: "Filter the meetups by region",
  });
  const cards = page.locator("[data-months] [data-meetup-card]:visible");
  await expect(cards).toHaveCount(upcoming.length);
  await nav.getByRole("button", { name: /^Europe/ }).click();
  await expect(cards).toHaveCount(
    upcoming.filter((e) => !e.country || regionOf(e.country) === "Europe")
      .length,
  );
  await expect(page.locator('[data-map-country="DE"]')).toHaveAttribute(
    "data-lit",
    "true",
  );
  await nav.getByRole("button", { name: /^Germany/ }).click();
  await expect(cards).toHaveCount(
    upcoming.filter((e) => e.country === "DE").length,
  );
  await expect(page.locator('[data-map-country="DE"]')).toHaveAttribute(
    "data-chosen",
    "true",
  );
  await expect(page.locator("[data-map-world]")).not.toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  await nav.getByRole("button", { name: /^Everywhere/ }).click();
  await expect(cards).toHaveCount(upcoming.length);
  await expect(page.locator("[data-map-world]")).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  await expect(
    page.locator("[data-meetup-archive] [data-meetup-card]"),
  ).toHaveCount(events.length - upcoming.length);
});

test("map pins are keyboard links and event cards highlight their matching pin", async ({
  page,
}) => {
  await prepare(page);
  await page.goto("/meetups/");
  const pin = page.locator('[data-map-pin][data-past="false"]').first();
  const id = await pin.getAttribute("data-map-pin");
  await pin.focus();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await expect(page.getByRole("tooltip")).toContainText(
    (await pin.getAttribute("data-title")) as string,
  );
  await expect(pin).toHaveAttribute("href", /^https:\/\/luma.com\//);
  await expect(page.locator(`[data-meetup-card="${id}"]`)).toHaveClass(
    /is-active/,
  );
  await expect(page.locator("[data-active-pin]")).toHaveAttribute(
    "visibility",
    "visible",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toBeHidden();
  await page.locator(`[data-meetup-card="${id}"] a`).focus();
  await expect(page.getByRole("tooltip")).toBeVisible();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.locator('footer a[href="/teams/"]').click();
  await page.locator('footer a[href="/meetups/"]').click();
  await page.getByRole("button", { name: /^Europe/ }).click();
  await expect(page.getByRole("button", { name: /^Europe/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(errors).toEqual([]);
});

test("visitor date moves completed events into the archive", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2027-01-01T00:00:00Z"));
  await page.goto("/meetups/");
  await expect(page.locator("[data-meetup-empty]")).toBeVisible();
  await expect(
    page.locator("[data-months] [data-meetup-card]:visible"),
  ).toHaveCount(0);
  await expect(
    page.locator("[data-meetup-archive] [data-meetup-card]"),
  ).toHaveCount(events.length);
  await expect(page.locator('[data-map-pin][data-past="false"]')).toHaveCount(
    0,
  );
});

test("static meetup HTML and Markdown contain events and guidelines", async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4322/meetups/");
  await expect(
    page.getByRole("heading", { name: "Meetups", exact: true }),
  ).toBeVisible();
  await expect(page.locator("[data-meetup-card]")).toHaveCount(events.length);
  await expect(page.locator("#run-your-own")).toContainText("Community-run");
  const response = await request.get("/meetups.md");
  const text = await response.text();
  expect(text).toContain("## Upcoming meetups");
  expect(text).toContain("## Already happened");
  expect(text).toContain(events[0].title);
  expect(text).toContain("Run Your Own Omarchy Meetup");
  await context.close();
});

test.describe("meetups on touch screens", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  test("phone filters work with the map hidden; tablet pins keep finger-sized targets", async ({
    page,
  }) => {
    await prepare(page);
    await page.goto("/meetups/");
    await expect(page.locator("[data-meetup-map]")).toBeHidden();
    await page.getByRole("button", { name: /^Europe/ }).click();
    await expect(page.getByRole("button", { name: /^Germany/ })).toBeVisible();
    await page.getByRole("button", { name: /^Germany/ }).click();
    await expect(
      page.locator("[data-months] [data-meetup-card]:visible"),
    ).toHaveCount(upcoming.filter((e) => e.country === "DE").length);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(390);
    await page.setViewportSize({ width: 650, height: 900 });
    await expect(page.locator("[data-meetup-map]")).toBeVisible();
    const pin = page
      .locator('[data-map-pin][data-past="false"][data-shown="true"]')
      .first();
    await pin.focus();
    const target = await pin.locator(".pin-target").boundingBox();
    expect(target!.width).toBeGreaterThanOrEqual(43.9);
    const tip = page.getByRole("tooltip");
    await expect(tip).toBeVisible();
    const box = await tip.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(650);
  });
});

test("homepage meetup rail turns a full view and fades arriving cards during the glide", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await prepare(page);
  await page.goto("/");
  const rail = page.locator("#meetups [data-carousel-rail]");
  const next = page.getByRole("button", { name: "Next meetups", exact: true });
  await next.scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("button", { name: "Previous meetups", exact: true }),
  ).toBeDisabled();
  const before = await rail.evaluate((el) => el.scrollLeft);
  await next.click();
  // Class changes at the start of the motion, before scroll-snap settles.
  await expect(rail.locator('[data-slide="4"]')).not.toHaveClass(/is-outside/);
  await expect(rail.locator('[data-slide="0"]')).toHaveClass(/is-outside/);
  await expect
    .poll(() => rail.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(before + 1100);
  await expect(
    page.getByRole("button", { name: "Previous meetups", exact: true }),
  ).toBeEnabled();
  await page.waitForTimeout(450);
  const at = await rail.evaluate((el) => el.scrollLeft);
  const box = await rail.boundingBox();
  await page.mouse.move(box!.x + 700, box!.y + 80);
  await page.mouse.down();
  await page.mouse.move(box!.x + 200, box!.y + 80, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(() => rail.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(at);
  await expect(page).toHaveURL(/\/$/);
});

for (const mobile of [false, true])
  test(`new podcast retains its start offset on ${mobile ? "mobile" : "desktop"}`, async ({
    page,
  }) => {
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
    );
    await prepare(page);
    await page.goto("/");
    const gallery = page.locator(".video-gallery");
    if (!mobile) {
      for (let i = 0; i < 6; i++)
        await gallery
          .getByRole("button", { name: "Next video", exact: true })
          .filter({ visible: true })
          .click();
      await gallery.locator('[data-carousel-video="NYFGCESmikA"]').click();
    }
    await expect(gallery.locator('iframe[src*="NYFGCESmikA"]')).toHaveAttribute(
      "src",
      /start=2326/,
    );
  });
