---
version: 1
status: active
name: Omarchy
source: barisgirismen/omarchy-site@221b61bf912123f04dd8a53c3b5fc231d05393bf
description: Preserve the Omarchy redesign while adopting the ThinkOodle Astro starter framework.
colors:
  background: "#1a1b26"
  surface: "#1f2230"
  text: "#c0caf5"
  accent: "#9ece6a"
typography:
  body: JetBrains Mono Variable
  display: Geist Variable
---

# Omarchy design system

The existing redesign is the visual and content source of truth. This is a framework migration, not a rebrand. Omarchy is a beautiful, fun, agentic Linux distribution by DHH, for people who want to shape their computers with agents. The primary action is downloading or trying Omarchy. The canonical production domain is https://omarchy.org.

Preserve the wordmarks, ASCII/terminal identity, pixel canvas, all 22 selectable stock palettes, square corners, fine borders, alternating grounds, portraits, screenshots, editorial copy, news, manual, and community data. Tokyo Night is the fallback theme; the first visit retains the redesign's random theme choice. Persist a visitor's selection across pages. All palette values live in src/styles/brand.css.

Self-host Geist Variable for display headings and selected labels, and JetBrains Mono Variable for body text, navigation, code and captions. Both families are already used by the redesign. Use only Latin/Latin Extended font files. Body text is approximately 15px; the reading measure is 48rem and the wider container 72rem. Retain the starter's portable spacing and type scales; use semantic aliases for project differences.

Use native Astro components and semantic, layered CSS. Keep the original content and claims; do not invent endorsements or marketing copy. News and manual live in Astro content collections. Preserve original paths and section IDs, downloadable installer bytes, images, the RSS feed route, and redirects. The plugin marketplace remains external at https://plugins.omarchy.org; the parked internal marketplace is not an active feature of this redesign.

Core content, links, headings, download buttons and media posters must work without JavaScript. Browser modules enhance theme selection, search, navigation, media playback, gallery dialogs, and the existing canvas/audio engine. Respect reduced motion and require a gesture for audible music. Desktop videos load a player when selected; the mobile rail retains the source’s lazy native YouTube players. Keep controls keyboard accessible and label every dialog and form field.

Inline links in the install section use the main text color and a subtle underline. Hover changes only the underline to the accent color; the link text keeps its color.

The hero wordmark plays a ttfx effect on arrival and on each click or tap. The default draws a different effect each time; an explicit `?etch=` selection is replayed. Keep the static wordmark hidden only during the initial canvas handover, with a fallback if browser modules fail, and respect reduced motion. Theme selection remains on T, the palette controls, and the welcome hint; right-click keeps its browser behavior. The 404 wordmark returns home. Match the optional effect panel's compact spacing so it leaves the phone wordmark reachable, and use the source's 300ms desktop theme-preview fade.

BaseLayout owns canonical metadata, Open Graph, JSON-LD, fonts and Markdown alternates. Every important HTML page gets a clean Markdown twin. Curate llms.txt and llms-full.txt around the product, installation, manual, news and foundation. Every public Astro component has a Storybook story. Run Astro checks, production and Storybook builds, route/content/asset parity checks, and browser interaction checks before completion.

Imported manual and standalone page bodies declare `format: html` so Astro preserves the source’s trusted semantic HTML, including indented elements. New Markdown content uses the default `format: markdown`. Preserve the source’s parallelogram theme deck, 200ms frosted theme wipe, 420ms video glide, circular portrait clusters, testimonial fold, and compact footer. Layout fixtures captured from the source cover desktop and mobile typography, geometry, and controls; interaction tests cover behavior with motion enabled.

The reviewed redesign baseline is tracked in `redesign-source.json`. Shared page wordmarks and small mono subtitles unify news, every manual chapter, teams, themes, patrons, and security. Meetups use the source's Equal Earth country outlines, region/country chips, linked pins, responsive hover/focus cards, and distinct archive. The homepage meetup rail shares the 420ms glide and draggable scrollbar with videos; arriving cards brighten as the glide starts. Preserve the Windows showcase and video start offsets.

On phones, show meetup filters and cards without the map; from 640px up, show the interactive map. Keep country filters compact with extended touch targets. The theme-picker dimmer sits outside its named view-transition layer so it can blur the underlying page. Keep the real menu icon visible for its full 260ms closing fold before handing back to the hero ghost.

The phone header swaps the mark for a 112px wordmark as the first section touches the bar. Its background follows both grounds across a moving section edge, with a subtle bottom hairline; the menu instead shares one uninterrupted surface and dims/blurs the page beneath it. Keep that backdrop outside the header surface's blur layer, and ignore touch-generated hover when deciding whether the hero ghost owns the labels. Give portrait clusters six pixels of clearance at either edge so lifted faces and their rings stay whole. Search announces the number of results and presents a search action on phone keyboards; news publishes its article date in the shared metadata layout.
