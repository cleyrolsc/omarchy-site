import { test, expect } from "@playwright/test";
import fs from "node:fs";
const reference = JSON.parse(
  fs.readFileSync("tests/fixtures/layout.json", "utf8"),
);
import { prepare, metrics, viewports } from "../layout-metrics.mjs";
for (const [name, viewport] of Object.entries(viewports)) {
  for (const route of Object.keys(reference.viewports.desktop)) {
    test(`redesign layout ${name} ${route}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await prepare(page);
      await page.goto(route === "/not-a-real-page/" ? "/404/" : route, {
        waitUntil: "networkidle",
      });
      const actual = await metrics(page),
        expected = (reference.viewports as any)[name][route];
      expect(actual.overflow).toBe(false);
      expect(
        Math.abs(actual.main.h - expected.main.h),
        "main height",
      ).toBeLessThan(4);
      expect(
        Math.abs(actual.footer.h - expected.footer.h),
        "footer height",
      ).toBeLessThan(1);
      expect(actual.controls).toHaveLength(expected.controls.length);
      for (const [i, control] of expected.controls.entries()) {
        const current = actual.controls[i];
        expect(current.text).toBe(control.text);
        for (const dimension of ["x", "y", "w", "h"])
          expect(
            Math.abs(current[dimension] - control[dimension]),
            `${control.text} ${dimension}`,
          ).toBeLessThan(1);
        for (const property of ["font", "size", "weight", "color"])
          expect(current[property], `${control.text} ${property}`).toBe(
            control[property],
          );
      }
      const used = new Set<number>();
      for (const heading of expected.headings) {
        const at = actual.headings.findIndex(
          (h: any, i: number) => h.text === heading.text && !used.has(i),
        );
        expect(at, heading.text).toBeGreaterThanOrEqual(0);
        used.add(at);
        const h = actual.headings[at];
        for (const dimension of ["x", "y", "w", "h"])
          expect(
            Math.abs(h[dimension] - heading[dimension]),
            `${heading.text} ${dimension}`,
          ).toBeLessThan(4);
        for (const property of ["font", "size", "weight", "color"])
          expect(h[property], `${heading.text} ${property}`).toBe(
            heading[property],
          );
      }
    });
  }
}
