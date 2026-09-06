# Omarchy website

The Omarchy redesign, migrated to [ThinkOodle’s Astro starter framework](https://github.com/ThinkOodle/astro-starter-framework). Astro 6 builds a static site from native Astro components, typed content collections, and committed data snapshots. TypeScript handles the interactive controls and the original canvas/audio engines. Styling uses native CSS layers and semantic tokens. The site has no React runtime, TanStack router, or Tailwind dependency.

The migration source is `barisgirismen/omarchy-site`, branch `redesign`, commit `a91c42895cc5fe29dc3e92955d547d419e9c1ff2`. The original content, URLs, images, installers, fonts, themes, music, and WebAssembly effects are retained. Production identity is `https://omarchy.org`.

## Development

Use Node 22.12+ and npm.

```sh
npm ci
npm run dev:astro       # http://localhost:4321
npm run dev:storybook   # http://localhost:6006
npm run dev             # both servers
```

`bin/serve` starts Astro on port 4321. The core page content works without JavaScript. Browser modules add search, theme selection, media dialogs, gallery filtering, keyboard shortcuts, music, and pixel effects. Astro’s client router keeps the audio module alive between ordinary pages. `/screensaver/` uses a full document navigation with its own original renderer.

## Editing the site

| Content | Source |
| --- | --- |
| Manual chapters | `src/content/manual/*.md` |
| News posts | `src/content/news/YYYY/MM/*.md` |
| Foundation, patrons, security, and other pages | `src/content/pages/**/*.md` |
| Homepage introduction | `src/content/marketing/home.md` |
| Homepage cards, videos, and featured plugin IDs | `src/data/home.json` |
| Themes, teams, patrons, voices, and other datasets | `src/data/*.json` |
| Images, fonts, installers, audio, WebAssembly | `public/` (served at the root) |
| Identity, metadata, and curated LLM links | `src/config/site.ts` |
| Palettes and project tokens | `src/styles/brand.css` |

Collection schemas are in `src/content.config.ts`. Imported manual and standalone documents use semantic HTML inside Markdown to preserve existing heading IDs and formatting. New content can use Markdown. News retains its Markdown source. Keep existing routes and heading IDs when editing published pages.

Shared layouts own metadata, canonical URLs, JSON-LD, and Markdown alternates. Important routes have `.md` twins built from the same content; `/llms.txt` is a curated map and `/llms-full.txt` a digest. News also publishes complete articles at `/news/rss.xml`.

Read [AGENTS.md](AGENTS.md) and [DESIGN.md](DESIGN.md) for the framework and design contracts. Each public Astro component has a sibling Storybook story; the `Brand` stories expose the design tokens. Development Storybook supports live prop controls. The static Storybook prerenders each named state with Astro, including its CSS, and disables arbitrary prop editing because no render server is running. Component styles belong in scoped Astro blocks; shared patterns live in layered stylesheets.

## Refreshing external data

```sh
npm run refresh-data
node scripts/add-voice.mjs https://x.com/HANDLE/status/POST_ID --dry
```

The scheduled workflow refreshes the plugin catalogue, release, meetup and momentum snapshots, commits changes, and triggers the static deployment. Refreshing is separate from building: a normal build does not fetch content. Plugin redirects are derived from the catalogue automatically; the marketplace remains at `https://plugins.omarchy.org`.

The refresh script supports `GITHUB_TOKEN`, `LUMA_API_KEY`, `CLOUDFLARE_API_TOKEN`, and `CLOUDFLARE_ZONE_ID` for the corresponding providers. Existing snapshots remain available when optional providers cannot be read. The voice helper writes images under `public/assets/images/voices/`.

## Validation and deployment

```sh
npm run check
npm run build
npm run parity
npm run build:storybook
npx playwright install chromium
npm run test:browser
npm run preview
```

Parity checks compare built pages and assets with a captured reference from the original redesign, then check local links, redirects, metadata, Markdown twins, feeds, and framework structure. Browser checks cover static content without JavaScript, keyboard navigation, search, themes, mobile layouts, media, music, accessibility, and Storybook rendering. Refresh the migration reference deliberately with `node tests/capture-reference.mjs /path/to/original-redesign`; do not regenerate it from the migrated site to hide a regression.

Astro writes the complete deployable site to `dist/`. GitHub Pages deploys this folder on pushes to `master` or manual workflow dispatch. Storybook builds separately to `storybook-static/`; neither output is committed. No application server or database is required at runtime.

The Astro 6 starter dependency tree currently has five upstream npm audit advisories (including two high severity). The available Astro fix requires a framework major upgrade; this migration retains the requested framework major. Storybook development binds to localhost.
