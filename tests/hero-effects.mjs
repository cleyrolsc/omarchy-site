// Observe real ttfx sessions without replacing the animation or its WASM engine.
export async function observeEffects(page) {
  await page.addInitScript(() => {
    window.__heroEffects = [];
  });
  await page.route("**/ttfx/0.3.2/ttfx.js", async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    const constructor =
      "constructor(input, effect, columns, rows, seed, frame_rate, palette, background) {";
    if (!body.includes(constructor))
      throw new Error(
        "Update the ttfx observer for the new session constructor",
      );
    await route.fulfill({
      response,
      body: body.replace(
        constructor,
        // Palette-less sessions measure offsets offscreen; they are not replays.
        constructor + "\nif (palette) window.__heroEffects.push(effect);",
      ),
    });
  });
}

export const playedEffects = (page) =>
  page.evaluate(() => window.__heroEffects);

export const wordmarkCenter = (page) =>
  page.locator("[data-hero-wordmark]").evaluate((el) => {
    const box = el.getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  });
