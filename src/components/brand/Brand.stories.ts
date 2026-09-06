/**
 * Brand — consolidated reference stories.
 *
 * One story file, one top-level sidebar group, one auto-generated Docs
 * page that stacks every section. Each story renders a different brand
 * component via its `render` function so we avoid the "nested
 * Docs-per-title" explosion that separate story files produce.
 *
 * Imports are renamed (`PaletteComponent`, etc.) so story exports can
 * keep their natural names (Colors, Gradients, Breakpoints, …) without
 * shadowing the imported components.
 */
import BrandTourComponent from "./BrandTour.astro";
import PaletteComponent from "./Palette.astro";
import TypeScaleComponent from "./TypeScale.astro";
import SpacingComponent from "./SpacingScale.astro";
import RadiiComponent from "./Radii.astro";
import ShadowsComponent from "./Shadows.astro";
import GradientsComponent from "./Gradients.astro";
import BreakpointsComponent from "./Breakpoints.astro";

const meta = {
  title: "Brand",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Every section below reads tokens from `:root` at runtime — the same tokens the real site renders against. Fork `src/styles/brand.css` and these stories reflect the new project automatically.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;

export const Overview = {
  args: {
    title: "Omarchy — token reference",
    subtitle: "The Omarchy palettes, native CSS tokens, typefaces and spacing.",
  },
  parameters: {
    docs: {
      description: {
        story:
          "The full brand reference in one scrollable document — every section stacked in spec order.",
      },
    },
  },
  render: () => BrandTourComponent,
};

export const Colors = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "Every `--color-*` token on `:root`, in source order. Semantic aliases render with their resolved value. Transparent tokens show over a checker pattern.",
      },
    },
  },
  render: () => PaletteComponent,
};

export const Typography = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "Every `--text-*` token rendered at its real size, plus weight / leading / tracking reference tables.",
      },
    },
  },
  render: () => TypeScaleComponent,
};

export const Spacing = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Base 4px. Every `--space-*` token as a bar at its real width.",
      },
    },
  },
  render: () => SpacingComponent,
};

export const Shapes = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Every `--radius-*` token applied to a box — sharp to pill.",
      },
    },
  },
  render: () => RadiiComponent,
};

export const Elevation = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "`--shadow-*` tokens on raised cards, plus `--glow-*` accents for hover / focus states.",
      },
    },
  },
  render: () => ShadowsComponent,
};

export const Gradients = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "Brand gradients. Accent pieces only — never full-section backgrounds.",
      },
    },
  },
  render: () => GradientsComponent,
};

export const Breakpoints = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "Reference only. CSS custom properties can't appear inside `@media` conditions, so queries use the literal rem values.",
      },
    },
  },
  render: () => BreakpointsComponent,
};
