# AGENTS.md — astro-starter-framework

You are an AI coding assistant working in `astro-starter-framework`: a reusable Astro foundation for marketing, docs, and content-heavy sites. Read this file before making changes. It defines the project architecture, starter intake flow, implementation patterns, and the things agents must not do.

The companion documents are:

- **[DESIGN.md](./DESIGN.md)** — brand, visual system, tone, content rules, and token intent. Once completed for a project, this is the source of truth for visual/content decisions.
- **[CLAUDE.md](./CLAUDE.md)** — pointer back here for Claude-specific tooling.

---

## Project overview

This repo is a **portable Astro framework** for building fast, accessible, AI-friendly sites without re-deciding the basics each time. It includes:

- Astro 6 + TypeScript.
- Content collections for structured Markdown/MDX content.
- Storybook for component contracts and visual review.
- Native CSS with cascade layers and semantic tokens — no Tailwind, no Sass.
- Markdown twins for important HTML routes.
- `/llms.txt` and `/llms-full.txt` endpoints for curated machine-readable context.
- SEO metadata, canonical URLs, Open Graph/Twitter tags, JSON-LD hooks, sitemap, and permissive robots defaults.

The checked-in design/content is intentionally neutral. It is a starter, not a finished brand.

### Non-negotiables for autonomous work

- Read `AGENTS.md` and `DESIGN.md` before non-trivial changes.
- If `DESIGN.md` still has `status: starter-template`, do **not** invent a brand. Ask the user for the missing inputs or ask them to provide a project-specific `DESIGN.md`.
- Use Astro components by default. Add client-side islands only for genuine interactivity.
- Use semantic tokens. No raw brand hex outside `src/styles/brand.css`, `DESIGN.md`, and static brand assets such as SVGs.
- Every important HTML route needs a matching Markdown twin (`/page` → `/page.md`).
- Core content must render in static HTML without JavaScript.
- Every public component gets a Storybook story.
- Layout, metadata, schema, and Markdown alternate behavior belong in shared layouts/helpers, not copied ad hoc per page.
- Run `npm run check` and `npm run build` before marking implementation work complete.

---

## First-run / new-site intake flow

When a user clones this starter and asks you to “get started,” “make this site,” “set up the project,” or similar:

1. **Inspect the source of truth files first:**
   - `DESIGN.md`
   - `src/config/site.ts`
   - `src/styles/brand.css`
   - `astro.config.mjs`
   - `package.json`
2. **Decide whether the project identity is real or still the starter.** Signals that it is still the starter include `status: starter-template`, `Starter Brand`, `example.com`, placeholder social links, or neutral copy.
3. **If design/brand inputs are missing, stop and ask.** Ask concise questions; do not start inventing colors, typography, positioning, or pages.
4. **Minimum questions to ask when DESIGN.md is missing or placeholder:**
   - What is the project/product name?
   - What is the canonical domain or expected launch URL?
   - What is the one-sentence description?
   - Who is the primary audience?
   - What is the primary CTA?
   - Do you have an existing `DESIGN.md`, brand guide, logo, colors, fonts, or sample sites to match?
   - What pages are required for launch?
   - Should the site include blog/docs/changelog/case studies, or only a marketing surface?
   - Any SEO, compliance, analytics, or deployment requirements?
5. **Once inputs exist, update in this order:**
   1. `DESIGN.md`
   2. `src/config/site.ts`
   3. `astro.config.mjs`
   4. `src/styles/brand.css`
   5. `public/favicon.svg`, `public/robots.txt`, and OG/social assets
   6. content files and routes
   7. components and stories
6. **Keep the framework portable.** Re-brand the project-specific layer; do not rewrite the architecture unless explicitly asked.

A good initial user-facing response is usually: “I’ll inspect the starter and DESIGN.md first. If the design system is still a placeholder, I’ll ask for the missing brand inputs before changing code.”

---

## Stack

- [Astro 6](https://docs.astro.build) — static site generator, islands architecture.
- TypeScript — strict mode via `astro/tsconfigs/strict`.
- Native CSS — layered architecture, no preprocessor, no utility framework.
- MDX — for rich content when needed.
- Content collections — type-safe content with schema validation.
- Storybook + `storybook-astro` — isolated Astro component rendering.
- `@astrojs/sitemap` — sitemap generation.
- `@lucide/astro` — default icon library.

**Non-goals**

- React/Vue/Svelte components unless there is a specific, justified island requirement.
- Tailwind, Bulma, Bootstrap, Sass, CSS-in-JS, or broad CSS frameworks.
- Complex state management.
- Hiding core content behind JavaScript.
- Fake “AI SEO” tricks.

---

## Directory structure

```
astro-starter-framework/
├── AGENTS.md              # repository instructions for agents
├── CLAUDE.md              # pointer to AGENTS.md
├── DESIGN.md              # brand/design/source-of-truth template
├── README.md              # setup and starter usage
├── astro.config.mjs       # Astro + integrations config
├── package.json
├── tsconfig.json
├── .storybook/            # Storybook config
│   ├── main.ts
│   └── preview.ts
├── public/                # static assets served as-is
└── src/
    ├── components/        # .astro components; public components need sibling *.stories.ts
    │   └── brand/         # live token/style-guide reference stories
    ├── config/
    │   └── site.ts        # name, URL, description, social links, curated LLM page lists
    ├── content/
    │   ├── marketing/     # source prose for important marketing pages
    │   └── blog/          # example content collection
    ├── content.config.ts  # Astro content collection schemas/loaders
    ├── icons/             # custom SVGs imported as Astro components
    ├── layouts/           # page layouts; BaseLayout owns metadata and global CSS
    ├── pages/             # file-based routes (.astro, .mdx, [slug].astro, .md.ts)
    └── styles/
        ├── main.css       # entry point — layer declaration + imports
        ├── tokens.css     # generic scales (portable)
        ├── brand.css      # project-specific colors, fonts, gradients, semantic aliases
        ├── reset.css      # @layer reset
        ├── base.css       # @layer base — element defaults
        ├── layout.css     # @layer components — container, page-stack, stack, cluster
        ├── components.css # @layer components — btn, card, badge, prose, divider
        └── utilities.css  # @layer utilities — thin utility layer
```

---

## CSS architecture

Native CSS with explicit `@layer` cascade. **Not Tailwind. Not Sass. Not CSS-in-JS.** Semantic class names with a thin utility escape hatch.

### Cascade order

```
reset → base → components → utilities
```

Declared in `src/styles/main.css`. Utilities win over components; components win over base. Scoped Astro `<style>` blocks are more specific than global layer rules.

### File responsibilities

| File | Layer | Owns | Portable? |
| --- | --- | --- | --- |
| `tokens.css` | — | generic spacing/type/radius/motion/z-index/layout scales | yes |
| `brand.css` | — | project colors, typeface, gradients, semantic aliases | no — replace per project |
| `reset.css` | `reset` | modern CSS reset | yes |
| `base.css` | `base` | element defaults | yes |
| `layout.css` | `components` | containers, stacks, clusters, section bands | yes |
| `components.css` | `components` | reusable primitives like `.btn`, `.card`, `.badge`, `.prose` | yes |
| `utilities.css` | `utilities` | small one-purpose helpers | yes |

### Writing styles

1. Put component-specific CSS in a scoped `<style>` block inside the `.astro` component.
2. Use semantic tokens: `var(--color-text-muted)`, `var(--color-accent)`, `var(--space-4)`.
3. If a semantic role does not exist, add it to `src/styles/brand.css` before using it.
4. Do not add brand-specific raw values to portable CSS files.
5. Promote to `components.css` only when a pattern is reused in 2+ places.
6. Layouts own the gap between sections; components own internal padding only when they are a distinct band/card/panel.

### Adding a global CSS file

Only add a new global stylesheet when the pattern is genuinely global (for example, a complex editor or third-party embed shell):

1. Create it under `src/styles/`.
2. Wrap rules in the appropriate `@layer`.
3. Import it from `src/styles/main.css` in cascade order.
4. Continue to use semantic tokens.

---

## Component patterns

### Astro components

- File per component: `src/components/ComponentName.astro`.
- Props interface at the top of the frontmatter; destructure with defaults.
- Use semantic HTML and WCAG AA accessibility.
- Lazy-load below-the-fold images.
- Name components by pattern, not page content: `StatGrid`, not `HomepageStats`.
- Public components need sibling stories: `ComponentName.stories.ts`.

Example:

```astro
---
export interface Props {
  title: string;
  description: string;
  href?: string;
}

const { title, description, href } = Astro.props;
const Tag = href ? 'a' : 'article';
---

<Tag class="feature-card" href={href}>
  <h2>{title}</h2>
  <p>{description}</p>
</Tag>

<style>
  .feature-card {
    display: block;
    padding: var(--space-5);
    color: inherit;
    background: var(--color-bg-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }
</style>
```

### Icons

Use [Lucide](https://lucide.dev/icons) first via `@lucide/astro`:

```astro
---
import { ArrowRight, Check } from '@lucide/astro';
---

<Check class="icon" size={16} />
<ArrowRight class="icon" size={20} stroke-width={2} />
```

Use custom SVGs in `src/icons/` for logos, brand marks, product-specific glyphs, or multi-color artwork. Custom SVGs must include `viewBox` and should prefer `currentColor` unless the asset is intentionally brand-colored.

---

## Storybook

Storybook is wired with `storybook-astro` so raw `.astro` components render in isolation.

**Every public component in `src/components/` must have a sibling `.stories.ts` file.** Internal token-reference components under `src/components/brand/` are covered by `src/components/brand/Brand.stories.ts`.

### Scripts

```bash
npm run dev:storybook
npm run build:storybook
```

### Story conventions

- Filename: `ComponentName.stories.ts`.
- Title: `Components/ComponentName`, `Sections/SectionName`, `Layouts/LayoutName`, or `Brand/...`.
- Add `tags: ['autodocs']`.
- Describe props in `argTypes`.
- Every story export includes an `args` object, even if empty: `export const Default = { args: {} };`.
- Cover default, variants, important states, edge cases, accessibility-critical combinations, and responsive behavior.

---

## Content collections

Content collection schema lives in `src/content.config.ts`. Content lives under `src/content/<collection>/`.

The starter includes:

- `marketing` — source prose for important marketing pages that need both HTML and Markdown output.
- `blog` — complete example collection with index, detail, and Markdown twin routes.

Pattern:

```ts
import { getCollection, getEntry } from 'astro:content';

const posts = await getCollection('blog', (post) => !post.data.draft);
const post = await getEntry('blog', 'example-post');
```

Add docs, changelog, case studies, guides, or other collections when the project needs them. Update `src/config/site.ts` whenever a new important page should appear in `/llms.txt` or `/llms-full.txt`.

---

## Pages, routing, and Markdown twins

Astro uses file-based routing under `src/pages/`.

- Static pages: `src/pages/about.astro`.
- Dynamic collection routes: `src/pages/blog/[slug].astro` with `getStaticPaths()`.
- Markdown endpoints: sibling `.md.ts` files returning `text/markdown`.

Every important page gets a Markdown twin:

| HTML | Markdown twin |
| --- | --- |
| `/` | `/index.md` |
| `/about` | `/about.md` |
| `/pricing` | `/pricing.md` |
| `/services/widget` | `/services/widget.md` |
| `/blog/<slug>` | `/blog/<slug>.md` |
| `/docs/<slug>` | `/docs/<slug>.md` |
| `/case-studies/<slug>` | `/case-studies/<slug>.md` |

Markdown twins should contain useful content only: title, summary, body, FAQs, key facts, links, and CTA/contact info. No navigation chrome, scripts, tracking, or hidden claims.

---

## AI- and machine-readable site rules

Build for humans first, but make the content easy for crawlers and AI tools to understand.

### Page completion checklist

Before marking an important page complete:

- HTML route renders core content without JavaScript.
- Matching `.md` route exists and contains the same claims in clean Markdown.
- `BaseLayout` receives title, description, canonical path, and Markdown alternate path.
- Page has exactly one `<h1>` and logical heading order.
- Relevant JSON-LD is passed through the layout.
- Important pages are listed in `src/config/site.ts` for LLM endpoints.
- `npm run check` and `npm run build` pass.

### `/llms.txt`

`src/pages/llms.txt.ts` generates a curated map. It is not a sitemap dump. Keep it short and useful: core pages, Markdown alternates, docs/resources, and contact/source links.

### `/llms-full.txt`

`src/pages/llms-full.txt.ts` generates a focused digest. Include summaries of important pages, key offerings, top resources, FAQ content, and contact details. Do not blindly dump every URL.

### Robots and sitemap

`public/robots.txt` is permissive by default and documents intent for search, AI, and social-preview bots. Only add `Disallow` rules for paths that genuinely must not be crawled. Update the `Sitemap:` URL when the project domain is known.

`@astrojs/sitemap` is configured in `astro.config.mjs`. Keep canonical URL, route filtering, priorities, and change frequencies aligned with the project.

### No fake AI-SEO tricks

Do not use:

- invented AI meta tags,
- hidden keyword dumps,
- color-on-color or offscreen crawler text,
- HTML comments as crawler hints,
- user-agent cloaking,
- AI-only pages with different claims than public pages,
- doorway pages.

If a technique only works because humans cannot see it, do not ship it.

---

## Rendering, fonts, and performance

- Images: use optimized formats (WebP/AVIF), explicit dimensions, responsive sources, and `fetchpriority="high"` for LCP images.
- Fonts: load only the weights used by the design system. Consider self-hosting if font latency or privacy matters.
- Motion: respect `prefers-reduced-motion`.
- Scripts: islands only for genuine interactivity.
- Accessibility: keyboard focus, contrast, form labels, landmarks, and alt text are not optional.
- Lighthouse targets before launch: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO = 100.

---

## Commands

```bash
npm install                      # install deps
npm run dev                      # astro + storybook in parallel
npm run dev:astro                # astro dev only (http://localhost:4321)
npm run dev:storybook            # storybook only (http://localhost:6006)
npm run build                    # production build → dist/
npm run build:storybook          # static Storybook → storybook-static/ (gitignored)
npm run preview                  # preview production build locally
npm run check                    # astro check
```

---

## Git and commit etiquette

- Never run destructive git operations (`push --force`, `reset --hard`, `checkout -- .`, `clean -f`, `branch -D`) without explicit user approval.
- Do not commit generated build output (`dist/`, `storybook-static/`) or dependencies (`node_modules/`).
- Branch names: `feature/...`, `fix/...`, `refactor/...`, `docs/...`, `chore/...`.
- Commit messages: concise subject ≤70 characters; explain why in the body when useful.
- Do not skip hooks or checks unless explicitly asked.

---

## What NOT to do

- Do not invent a brand when `DESIGN.md` is still a starter template. Ask for inputs.
- Do not add a CSS framework.
- Do not introduce raw brand colors outside `brand.css`, `DESIGN.md`, or static brand assets.
- Do not add a second typeface unless `DESIGN.md` specifies it.
- Do not hardcode one-off pixel spacing when a token exists.
- Do not add React/Vue/Svelte for static content Astro can render.
- Do not ship fake AI-SEO tricks.
- Do not ship an important page without a Markdown twin.
- Do not ship a public component without a Storybook story.
- Do not create extra documentation files unless asked; prefer updating `AGENTS.md`, `DESIGN.md`, or `README.md`.
- Do not write comments explaining obvious code. Comment the why when the why is non-obvious.
- Do not expand scope silently. Mention tangential issues in the summary instead of fixing them unasked.

---

## When you are stuck

- Token unclear? Check `src/styles/tokens.css`, `src/styles/brand.css`, then `DESIGN.md`.
- Brand decision unclear? `DESIGN.md` wins. If it is incomplete, ask the user.
- Page/Markdown/LLM behavior unclear? Re-read the “Pages, routing, and Markdown twins” and “AI- and machine-readable site rules” sections.
- Storybook error says it expected HTML? Ensure every story export has `args`.
- Still stuck? Ask. Do not guess at brand, content, or business decisions.
