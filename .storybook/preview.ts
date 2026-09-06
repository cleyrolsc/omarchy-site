/**
 * Storybook — preview configuration
 *
 * Global decorators, backgrounds, viewports, and font loading applied
 * to every story. Mirrors the environment the real site renders in
 * (dark-first starter canvas, project font loaded, standard breakpoints).
 */

// Global stylesheet entry — tokens, reset, base, layout, components, utilities.
import "../src/styles/main.css";

// Token reader for the brand-reference components. Stored on window
// because Astro's `<script>` tags are hoisted into bundled modules,
// and the Container API (what storybook-astro uses) does not emit
// hoisted scripts in its rendered HTML. Each brand component uses
// `<script is:inline>` that calls window.__brandReadRootTokens.
//
// Walks all same-origin stylesheets for `:root` / `html` rules that
// declare CSS custom properties matching the given prefix. Resolves
// each through getComputedStyle so aliased tokens surface their final
// value. First declaration wins (source order).
type BrandTokenEntry = {
  name: string;
  shortName: string;
  value: string;
  resolved: string;
};

declare global {
  interface Window {
    __brandReadRootTokens?: (prefix: string) => BrandTokenEntry[];
    __brandPrettyValue?: (v: string) => string;
  }
}

if (typeof window !== "undefined") {
  // Match any selector that targets :root or the <html> element as its
  // subject. Split on commas so grouped selectors (`:root, html`) are
  // handled, and do explicit prefix checks — JavaScript's \b word-boundary
  // fails against `:` (non-word char), so `\b:root\b` silently never matches.
  const selectorTargetsRoot = (selectorText: string): boolean =>
    selectorText.split(/\s*,\s*/).some((raw) => {
      const s = raw.trim();
      if (s === ":root" || s.startsWith(":root ")) return true;
      if (s.startsWith(":root") && /^[:.\[#(]/.test(s[5] ?? "")) return true;
      if (s === "html" || s.startsWith("html ")) return true;
      if (s.startsWith("html") && /^[:.\[#]/.test(s[4] ?? "")) return true;
      return false;
    });

  window.__brandReadRootTokens = (prefix: string): BrandTokenEntry[] => {
    const seen = new Map<string, string>();
    const walk = (rules: CSSRuleList) => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSGroupingRule) {
          walk(rule.cssRules);
          continue;
        }
        if (!(rule instanceof CSSStyleRule)) continue;
        if (!selectorTargetsRoot(rule.selectorText)) continue;
        for (let i = 0; i < rule.style.length; i++) {
          const prop = rule.style.item(i);
          if (!prop.startsWith(prefix)) continue;
          if (!seen.has(prop)) {
            seen.set(prop, rule.style.getPropertyValue(prop).trim());
          }
        }
      }
    };

    for (const sheet of Array.from(document.styleSheets)) {
      try {
        walk(sheet.cssRules);
      } catch {
        // CORS-restricted — skip
      }
    }

    // Fallback: if no rules were enumerable (e.g., all stylesheets are
    // CORS-blocked or Vite hoisted the CSS in a way we can't walk),
    // enumerate every `--<prefix>*` property that getComputedStyle
    // reports on :root. Not source-ordered, but correct.
    if (seen.size === 0) {
      const cs = getComputedStyle(document.documentElement);
      for (let i = 0; i < cs.length; i++) {
        const prop = cs[i];
        if (prop && prop.startsWith(prefix)) {
          seen.set(prop, cs.getPropertyValue(prop).trim());
        }
      }
    }

    const computed = getComputedStyle(document.documentElement);
    return Array.from(seen, ([name, value]) => ({
      name,
      shortName: name.slice(prefix.length),
      value,
      resolved: computed.getPropertyValue(name).trim() || value,
    }));
  };

  window.__brandPrettyValue = (v: string): string => {
    const hex = v.match(/^#([0-9a-fA-F]{3,8})$/);
    return hex ? `#${hex[1].toUpperCase()}` : v;
  };
}

const renderedStories = import.meta.glob<string>(
  "../.storybook-rendered/*/index.html",
  { query: "?raw", import: "default", eager: true },
);

const preview = {
  decorators: [
    (story: () => unknown, context: { id: string }) => {
      if (!import.meta.env.PROD) return story();
      const html =
        renderedStories[`../.storybook-rendered/${context.id}/index.html`];
      if (!html)
        throw new Error(`Missing prerendered Astro story: ${context.id}`);
      const doc = new DOMParser().parseFromString(html, "text/html");
      const element = document.createElement("div");
      element.append(
        ...doc.head.querySelectorAll('link[rel="stylesheet"],style'),
        ...doc.body.childNodes,
      );
      requestAnimationFrame(() => {
        for (const previous of element.querySelectorAll("script")) {
          const script = document.createElement("script");
          for (const attr of previous.attributes)
            script.setAttribute(attr.name, attr.value);
          script.textContent = previous.textContent;
          previous.replaceWith(script);
        }
      });
      return element;
    },
  ],
  parameters: {
    options: {
      storySort: {
        // Brand/Overview first (the full tour), then sections in the
        // same spec order DESIGN.md uses.
        order: [
          "Brand",
          [
            "Overview",
            "Colors",
            "Typography",
            "Spacing",
            "Shapes",
            "Elevation",
            "Gradients",
            "Breakpoints",
          ],
          "Components",
          "Sections",
          "Layouts",
        ],
      },
    },

    actions: { argTypesRegex: "^on[A-Z].*" },

    controls: {
      disable: import.meta.env.PROD,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    // Dark-first: Canvas matches the production starter. Add light
    // options so components can be checked on paper/white surfaces.
    backgrounds: {
      options: {
        canvas: { name: "Canvas (default)", value: "var(--color-bg)" },
        panel: { name: "Panel", value: "var(--color-surface)" },
        paper: { name: "Paper (light)", value: "var(--color-paper)" },
        white: { name: "White", value: "var(--color-white)" },
      },
    },

    viewport: {
      options: {
        mobile: {
          name: "Mobile (375)",
          styles: { width: "375px", height: "667px" },
        },
        phoneLandscape: {
          name: "Phone landscape (640)",
          styles: { width: "640px", height: "480px" },
        },
        tablet: {
          name: "Tablet (768)",
          styles: { width: "768px", height: "1024px" },
        },
        laptop: {
          name: "Laptop (1024)",
          styles: { width: "1024px", height: "768px" },
        },
        desktop: {
          name: "Desktop (1280)",
          styles: { width: "1280px", height: "900px" },
        },
        wide: {
          name: "Wide (1440)",
          styles: { width: "1440px", height: "900px" },
        },
      },
    },

    layout: "padded",
  },

  tags: ["autodocs"],

  initialGlobals: {
    backgrounds: { value: "canvas" },
  },
};

export default preview;
