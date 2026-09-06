export const viewports = {
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 },
};
export const routes = [
  "/",
  "/themes/",
  "/teams/",
  "/news/",
  "/manual/",
  "/manual/getting-started/",
  "/foundation/",
  "/patrons/",
  "/patrons/badges/",
  "/security/",
  "/security/credits/",
  "/brand/",
  "/meetups/",
  "/workstations/",
  "/not-a-real-page/",
];
export async function prepare(page) {
  await page.clock.setFixedTime(new Date("2026-09-06T20:00:00Z"));
  await page.addInitScript(() => {
    localStorage.setItem("omarchy-site-theme", "tokyo-night");
    localStorage.setItem("omarchy-theme-hint-seen", "true");
    sessionStorage.setItem("omarchy-intro-seen", "true");
  });
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<style>html{background:#000}</style><title>Video preview</title>",
    }),
  );
}
export async function metrics(page) {
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => {
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height };
    };
    const style = (el) => {
      const s = getComputedStyle(el);
      return {
        font: s.fontFamily,
        size: s.fontSize,
        line: s.lineHeight,
        weight: s.fontWeight,
        color: s.color,
        background: s.backgroundColor,
        radius: s.borderRadius,
      };
    };
    const main = document.querySelector("main");
    const footer = document.querySelector("footer");
    const headings = [...main.querySelectorAll("h1,h2,h3,h4")]
      .filter((el) => el.getBoundingClientRect().height > 1)
      .map((el) => ({
        text: el.textContent.replace(/\s+/g, " ").trim(),
        ...box(el),
        ...style(el),
      }));
    const controls = [
      ...document.querySelectorAll("header a,[data-hero-cta] a"),
    ]
      .filter(
        (el) =>
          ["Install", "Get Omarchy", "See it in action"].includes(
            el.textContent.trim(),
          ) &&
          el.getBoundingClientRect().width > 0 &&
          !el.closest("details:not([open])"),
      )
      .map((el) => ({ text: el.textContent.trim(), ...box(el), ...style(el) }));
    return {
      main: box(main),
      footer: footer ? box(footer) : null,
      sections: [...main.querySelectorAll(":scope>section[id]")].map((el) => ({
        id: el.id,
        ...box(el),
        ...style(el),
      })),
      headings,
      controls,
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });
}
