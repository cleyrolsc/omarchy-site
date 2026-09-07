import { initHome } from "./home";
import { initRails } from "./rail";
import { initThemePicker } from "./theme-picker";
import { initClusters } from "./clusters";
import { navigate } from "astro:transitions/client";
import {
  switchTheme,
  readTheme,
  SITE_THEMES,
  HINT_KEY,
  THEME_EVENT,
  OPEN_PICKER_EVENT,
  PICKER_STATE_EVENT,
  paintFavicon,
  watchChrome,
  groundOf,
} from "../lib/theme";
import { MUSIC_EVENT, music, loadMusic } from "../lib/music";
import { watchOutbound } from "../lib/outbound";
import { EFFECTS, ETCH_EVENT, effectFromLocation } from "../lib/etch";

import { searchAll, KIND_LABEL, type SearchEntry } from "../lib/search";
let searchPromise: Promise<SearchEntry[]> | undefined;
let dispose: (() => void) | undefined;
const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export function initSite() {
  dispose?.();
  const controller = new AbortController();
  const { signal } = controller;
  initClusters(signal);
  initHome(signal);
  if (document.querySelector("[data-meetups-page]"))
    void import("./meetups").then(({ initMeetups }) => {
      if (!signal.aborted) initMeetups(signal);
    });
  initRails(signal);
  const cleanups: (() => void)[] = [];
  const on = (target: EventTarget, event: string, handler: EventListener) =>
    target.addEventListener(event, handler, { signal });
  const q = <T extends Element = HTMLElement>(selector: string) =>
    document.querySelector<T>(selector);
  const all = <T extends Element = HTMLElement>(selector: string) => [
    ...document.querySelectorAll<T>(selector),
  ];
  const searchDialog = q<HTMLDialogElement>("#site-search");
  const themeDialog = q<HTMLDialogElement>("#site-themes");
  const prepareThemePicker = initThemePicker(themeDialog, signal);
  const mediaDialog = q<HTMLDialogElement>("#site-media");
  const mediaContent = q("[data-media-content]");
  const input = q<HTMLInputElement>("#site-search-input");
  const results = q("[data-search-results]");
  const status = q("[data-search-status]");
  const announcement = q("[data-search-announcement]");
  let searchVersion = 0;
  let selected = -1;
  all(
    "[data-open-search], [data-open-theme], [data-copy], [data-carousel-prev], [data-carousel-next]",
  ).forEach((el) => (el.hidden = false));

  let hintDismissed = false;
  const dismissHint = () => {
    hintDismissed = true;
    const hint = q<HTMLElement>("[data-theme-hint]");
    if (hint) hint.hidden = true;
    try {
      localStorage.setItem(HINT_KEY, "true");
    } catch {
      /* storage may be unavailable */
    }
  };
  try {
    if (!localStorage.getItem(HINT_KEY)) {
      const hintTimer = setTimeout(() => {
        const hint = q<HTMLElement>("[data-theme-hint]");
        if (hint && !hintDismissed && !q("dialog[open]")) hint.hidden = false;
      }, 1600);
      cleanups.push(() => clearTimeout(hintTimer));
    }
  } catch {
    /* optional hint stays hidden when storage is unavailable */
  }
  const openDialog = (dialog: HTMLDialogElement | null) => {
    if (!dialog) return;
    if (dialog === themeDialog) {
      dismissHint();
      prepareThemePicker();
    }
    if (dialog === searchDialog && input) {
      input.value = "";
      void runSearch();
    }
    for (const other of all<HTMLDialogElement>("dialog[open]"))
      if (other !== dialog) other.close();
    if (!dialog.open) dialog.showModal();
    if (dialog === themeDialog) dialog.focus({ preventScroll: true });
    dialog.querySelector<HTMLInputElement>("input")?.focus();
    if (dialog === themeDialog)
      window.dispatchEvent(
        new CustomEvent(PICKER_STATE_EVENT, { detail: { open: true } }),
      );
  };
  for (const dialog of all<HTMLDialogElement>("dialog")) {
    on(dialog, "click", (event) => {
      if (event.target === dialog) {
        const r = dialog.getBoundingClientRect();
        const e = event as MouseEvent;
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          dialog.close();
      }
    });
    on(dialog, "close", () => {
      if (dialog === mediaDialog) mediaContent?.replaceChildren();
      if (dialog === themeDialog)
        window.dispatchEvent(
          new CustomEvent(PICKER_STATE_EVENT, { detail: { open: false } }),
        );
    });
  }
  const effectPicker = q<HTMLElement>("[data-effect-picker]");
  if (effectPicker && new URLSearchParams(location.search).has("etch")) {
    effectPicker.hidden = false;
    const current = effectFromLocation();
    const label = q("[data-effect-name]");
    if (label) label.textContent = current;
    all("[data-effect]").forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.effect === current),
      ),
    );
  }
  const syncTheme = () => {
    const id = document.documentElement.dataset.theme || readTheme();
    const theme = SITE_THEMES.find((t) => t.id === id) || SITE_THEMES[0];
    all<HTMLButtonElement>("[data-set-theme]").forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.setTheme === id),
      ),
    );
    for (const label of all("[data-theme-name]"))
      label.textContent = theme.name;
    const preview = q<HTMLImageElement>("[data-theme-preview]");
    if (preview && !preview.src.endsWith(`/${id}.webp`)) {
      const next = new Image();
      next.src = `/assets/images/theme-previews/${id}.webp`;
      next.alt = `${theme.name} desktop preview`;
      next.width = 1800;
      next.height = 1012;
      next.dataset.themePreview = "";
      void next
        .decode()
        .then(() => {
          if (signal.aborted || document.documentElement.dataset.theme !== id)
            return;
          preview.removeAttribute("data-theme-preview");
          preview.parentElement?.append(next);
          next
            .animate([{ opacity: 0 }, { opacity: 1 }], {
              duration: matchMedia("(prefers-reduced-motion: reduce)").matches
                ? 0
                : 200,
            })
            .finished.then(() => preview.remove());
        })
        .catch(() => {});
    }
  };
  syncTheme();
  paintFavicon();
  cleanups.push(watchChrome());
  on(window, THEME_EVENT, syncTheme);
  on(window, OPEN_PICKER_EVENT, () => openDialog(themeDialog));

  const updateSelection = () => {
    const links = all<HTMLAnchorElement>("[data-search-results] a");
    links.forEach((link, i) =>
      link.toggleAttribute("data-selected", i === selected),
    );
    links[selected]?.scrollIntoView({ block: "nearest" });
  };
  async function runSearch() {
    if (!input || !results || !status) return;
    const version = ++searchVersion;
    const query = input.value.trim().toLowerCase();
    selected = -1;
    if (announcement) announcement.textContent = "";
    if (!query) {
      results.replaceChildren();
      status.hidden = false;
      status.textContent =
        "The manual, the news, every plugin and every theme.";
      return;
    }
    status.hidden = false;
    status.textContent = "Reading…";
    searchPromise ??= fetch("/data/search-index.json")
      .then((response) => {
        if (!response.ok) throw new Error("Search unavailable");
        return response.json() as Promise<SearchEntry[]>;
      })
      .catch((error) => {
        searchPromise = undefined;
        throw error;
      });
    try {
      const entries = await searchPromise;
      if (signal.aborted || version !== searchVersion) return;
      const matches = searchAll(entries, query);
      if (announcement)
        announcement.textContent = matches.length
          ? `${matches.length} ${matches.length === 1 ? "result" : "results"}`
          : "No matches";
      results.replaceChildren(
        ...matches.map((entry) => {
          const li = document.createElement("li"),
            a = document.createElement("a");
          a.href = entry.url;
          a.tabIndex = -1;
          const row = document.createElement("span");
          row.className = "search-result-title";
          const title = document.createElement("strong");
          title.textContent = entry.heading || entry.title;
          const meta = document.createElement("span");
          meta.className = "search-result-meta";
          meta.textContent =
            entry.kind === "manual"
              ? entry.heading
                ? entry.title
                : ""
              : entry.meta || "";
          const kind = document.createElement("span");
          kind.className = "search-result-kind";
          kind.textContent = KIND_LABEL[entry.kind];
          row.append(title, meta, kind);
          a.append(row);
          if (entry.snippet) {
            const summary = document.createElement("span");
            summary.className = "search-snippet";
            const mark = document.createElement("mark");
            mark.textContent = entry.snippet.match;
            summary.append(entry.snippet.before, mark, entry.snippet.after);
            a.append(summary);
          }
          li.append(a);
          return li;
        }),
      );
      status.hidden = matches.length > 0;
      status.textContent = matches.length
        ? ""
        : `Nothing matches ${input.value.trim()}.`;
      selected = 0;
      updateSelection();
    } catch {
      if (!signal.aborted && version === searchVersion) {
        status.textContent =
          "Search is unavailable right now. Please try again.";
        if (announcement) announcement.textContent = status.textContent;
      }
    }
  }
  if (input) {
    on(input, "input", () => {
      void runSearch();
    });
    on(input, "keydown", (event) => {
      const e = event as KeyboardEvent;
      const links = all<HTMLAnchorElement>("[data-search-results] a");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        selected = Math.max(
          0,
          Math.min(
            links.length - 1,
            selected + (e.key === "ArrowDown" ? 1 : -1),
          ),
        );
        updateSelection();
      }
      if (e.key === "Enter" && links.length) {
        e.preventDefault();
        links[Math.max(0, selected)].click();
      }
    });
  }
  function openVideo(id: string, title: string) {
    if (!mediaContent || !mediaDialog) return;
    const frame = document.createElement("iframe");
    frame.title = title;
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    mediaContent.replaceChildren(frame);
    openDialog(mediaDialog);
  }
  on(document, "click", (event) => {
    const element = event.target instanceof Element ? event.target : null;
    if (!element) return;
    const link = element.closest<HTMLAnchorElement>("a");
    const modified =
      event instanceof MouseEvent &&
      (event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0);
    if (element.closest("[data-close-dialog]")) {
      element.closest("dialog")?.close();
      return;
    }
    if (element.closest("[data-hint-dismiss]")) {
      dismissHint();
      return;
    }
    if (element.closest("[data-open-search]")) {
      q(".mobile-menu")?.removeAttribute("open");
      openDialog(searchDialog);
      return;
    }
    if (element.closest("[data-open-theme]")) {
      q(".mobile-menu")?.removeAttribute("open");
      openDialog(themeDialog);
      return;
    }
    const theme =
      element.closest<HTMLElement>("[data-set-theme]")?.dataset.setTheme;
    if (theme) {
      switchTheme(theme);
      return;
    }
    const effect =
      element.closest<HTMLElement>("[data-effect]")?.dataset.effect;
    if (
      effect &&
      (effect === "random" || (EFFECTS as readonly string[]).includes(effect))
    ) {
      const url = new URL(location.href);
      url.searchParams.set("etch", effect);
      history.replaceState(history.state, "", url);
      const label = q("[data-effect-name]");
      if (label) label.textContent = effect;
      all("[data-effect]").forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.effect === effect),
        ),
      );
      window.dispatchEvent(new CustomEvent(ETCH_EVENT, { detail: effect }));
      return;
    }
    if (element.closest("[data-music-toggle]")) {
      music.toggle();
      return;
    }
    const copy = element.closest<HTMLButtonElement>("[data-copy]");
    if (copy) {
      const label = copy.textContent;
      void navigator.clipboard
        ?.writeText(copy.dataset.copy || "")
        .then(() => {
          copy.textContent = "Copied!";
          setTimeout(() => {
            if (copy.isConnected) copy.textContent = label;
          }, 1800);
        })
        .catch(() => {
          copy.textContent = "Copy unavailable";
        });
      return;
    }
    if (!modified && link?.dataset.video) {
      event.preventDefault();
      openVideo(link.dataset.video, link.dataset.videoTitle || "Omarchy video");
      return;
    }
    const gallery = element
      .closest(".workstations__image")
      ?.querySelector<HTMLImageElement>("img");
    if (gallery && !modified && mediaContent) {
      event.preventDefault();
      const image = document.createElement("img");
      image.src = gallery.currentSrc || gallery.src;
      image.alt = gallery.alt || "Community workstation";
      mediaContent.replaceChildren(image);
      openDialog(mediaDialog);
      return;
    }
    if (link?.closest("dialog") && !modified) {
      link.closest("dialog")?.close();
    }
    if (link?.closest(".mobile-menu"))
      link.closest("details")?.removeAttribute("open");
  });
  on(document, "keydown", (event) => {
    const e = event as KeyboardEvent;
    const editing =
      e.target instanceof Element &&
      Boolean(
        e.target.closest('input,textarea,select,[contenteditable="true"]'),
      );
    if (e.defaultPrevented) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openDialog(searchDialog);
      return;
    }
    if (e.code === "Space" && e.metaKey && e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      if (themeDialog?.open) themeDialog.close();
      else openDialog(themeDialog);
      return;
    }
    if (editing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "/" && !q("dialog[open]")) {
      e.preventDefault();
      openDialog(searchDialog);
    }
    if (
      e.key.toLowerCase() === "t" &&
      (!q("dialog[open]") || themeDialog?.open)
    ) {
      e.preventDefault();
      if (themeDialog?.open) themeDialog.close();
      else openDialog(themeDialog);
    }
    if (
      !q("dialog[open]") &&
      (e.key === "ArrowLeft" || e.key === "ArrowRight") &&
      e.target === document.body
    ) {
      const a = q<HTMLAnchorElement>(
        e.key === "ArrowLeft" ? 'a[rel="prev"]' : 'a[rel="next"]',
      );
      if (a) {
        e.preventDefault();
        void navigate(a.href);
      }
    }
  });
  // Match Omarchy's context-menu shortcut over the animated wordmark.
  const sentinel = q("[data-hero-sentinel]");
  if (sentinel) {
    on(sentinel, "contextmenu", (event) => {
      if (
        !(event.target instanceof Element) ||
        event.target.closest("a,button,input")
      )
        return;
      event.preventDefault();
      openDialog(themeDialog);
    });
    const observer = new IntersectionObserver(
      ([entry]) =>
        q(".site-header")?.classList.toggle("over-hero", entry.isIntersecting),
      {
        rootMargin: `-${parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) * 16}px 0px 0px`,
      },
    );
    observer.observe(sentinel);
    cleanups.push(() => observer.disconnect());
  }
  const header = q<HTMLElement>(".site-header");
  if (header) {
    const menu = q<HTMLDetailsElement>(".mobile-menu");
    const heroHost = q<HTMLElement>("[data-hero-sentinel]");
    const ghost = heroHost ? document.createElement("div") : null;
    if (ghost && heroHost) {
      const copy = header
        .querySelector(".header-inner")!
        .cloneNode(true) as HTMLElement;
      ghost.dataset.navGhost = "";
      ghost.inert = true;
      ghost.setAttribute("aria-hidden", "true");
      Object.assign(ghost.style, {
        position: "fixed",
        inset: "0 0 auto",
        zIndex: "var(--z-nav)",
        mixBlendMode: "difference",
        pointerEvents: "none",
        paddingTop: "env(safe-area-inset-top,0px)",
      });
      for (const el of [copy, ...copy.querySelectorAll<HTMLElement>("*")]) {
        for (const name of el.getAttributeNames())
          if (
            name === "id" ||
            name === "aria-label" ||
            (name.startsWith("data-") && !name.startsWith("data-astro-"))
          )
            el.removeAttribute(name);
      }
      copy
        .querySelectorAll<HTMLElement>(".home-mark,.install-link")
        .forEach((el) => (el.style.visibility = "hidden"));
      copy
        .querySelectorAll<HTMLElement>(".desktop-nav a,.icon-button,summary")
        .forEach((el) => (el.style.color = "var(--t-hdr-text-2)"));
      ghost.append(copy);
      heroHost.append(ghost);
      cleanups.push(() => ghost.remove());
    }
    const labels = [
      ...header.querySelectorAll<HTMLElement>(
        ".desktop-nav a,.icon-button,summary",
      ),
    ];
    let wasMenuOpen = Boolean(menu?.open),
      ghostAfter = 0,
      foldTimer = 0;
    cleanups.push(() => clearTimeout(foldTimer));
    const phone = matchMedia("(max-width: 639.98px)");
    let hovering =
      matchMedia("(hover: hover)").matches && header.matches(":hover");
    type Ground = { top: number; bottom: number; color: string };
    let grounds: Ground[] = [];
    let height = 0;
    let heroBottom = 0;
    const at = (y: number) =>
      grounds.findLast((g) => g.top <= y && g.bottom > y);
    const surface = () => {
      if (wasMenuOpen && !menu?.open) ghostAfter = performance.now() + 260;
      wasMenuOpen = Boolean(menu?.open);
      clearTimeout(foldTimer);
      const y = scrollY;
      const top = at(y),
        bottom = at(y + height);
      const ground = phone.matches
        ? (top ?? bottom)
        : top && top === bottom
          ? top
          : null;
      let image = "";
      // Keep the phone bar filled on both sides of a moving section edge.
      if (phone.matches && !menu?.open && top !== bottom) {
        const edge =
          top && bottom
            ? Math.min(top.bottom, bottom.top > y ? bottom.top : Infinity)
            : top
              ? top.bottom
              : bottom!.top;
        const split = Math.round(edge - y);
        const wash = (g: Ground | undefined) =>
          g ? `color-mix(in srgb, ${g.color} 90%, transparent)` : "transparent";
        image = `linear-gradient(to bottom, ${wash(top)} ${split}px, ${wash(bottom)} ${split}px)`;
      }
      header.style.setProperty("--nav-image", image || "none");
      header.style.setProperty("--nav-fill", image ? "0" : "1");
      header.toggleAttribute(
        "data-nav-past-hero",
        !heroHost || (phone.matches ? y + height : y) >= heroBottom,
      );
      header.style.setProperty(
        "--nav-surface",
        ground || !heroHost ? "1" : "0",
      );
      header.style.setProperty(
        "--nav-ground",
        ground?.color ?? "var(--color-bg)",
      );
      let blend = Boolean(
        ghost && heroBottom > y + height && !hovering && !menu?.open,
      );
      // Keep the real bars painted through their closing fold before restoring the ghost.
      if (blend && performance.now() < ghostAfter) {
        blend = false;
        foldTimer = window.setTimeout(surface, ghostAfter - performance.now());
      }
      if (ghost) ghost.style.opacity = blend ? "1" : "0";
      labels.forEach((el) => (el.style.color = blend ? "transparent" : ""));
    };
    const survey = () => {
      height = header.getBoundingClientRect().height;
      heroBottom = heroHost
        ? heroHost.getBoundingClientRect().bottom + scrollY
        : 0;
      const sections = all<HTMLElement>("main>section,main [data-ground]");
      const nodes = sections.length ? sections : all<HTMLElement>("main");
      const footer = q<HTMLElement>(".site-footer");
      if (footer) nodes.push(footer);
      grounds = nodes
        .filter((node) => !node.hasAttribute("data-hero-sentinel"))
        .map((node) => {
          const box = node.getBoundingClientRect();
          return {
            top: box.top + scrollY,
            bottom: box.bottom + scrollY,
            color: groundOf(node) ?? "var(--color-bg)",
          };
        });
      surface();
    };
    on(header, "pointerenter", (event) => {
      if ((event as PointerEvent).pointerType !== "mouse") return;
      hovering = true;
      surface();
    });
    on(header, "pointerleave", (event) => {
      if ((event as PointerEvent).pointerType !== "mouse") return;
      hovering = false;
      surface();
    });
    on(phone, "change", surface);
    on(window, "scroll", surface);
    on(window, "resize", survey);
    on(window, THEME_EVENT, survey);
    const sizes = new ResizeObserver(survey);
    const main = q("main");
    if (main) sizes.observe(main);
    sizes.observe(header);
    cleanups.push(() => sizes.disconnect());
    survey();
    if (menu) {
      on(menu, "toggle", () => {
        surface();
        menu
          .querySelector("summary")
          ?.setAttribute("aria-label", menu.open ? "Close menu" : "Menu");
      });
      on(q("[data-menu-scrim]") || document, "click", (e) => {
        if ((e.target as Element).hasAttribute("data-menu-scrim"))
          menu.open = false;
      });
      on(document, "keydown", (e) => {
        if ((e as KeyboardEvent).key === "Escape") menu.open = false;
      });
    }
  }
  const ua = navigator.userAgent;
  const device = /iPhone|iPad/.test(ua)
    ? null
    : /Mac/.test(ua)
      ? "mac"
      : /Win/.test(ua)
        ? "windows"
        : null;
  if (device) q(`[data-try="${device}"]`)?.classList.add("btn--primary");
  const syncMusic = () => {
    const control = q("[data-music-control]");
    if (control) control.hidden = location.pathname !== "/" && !music.touched;
    all("[data-music-toggle]").forEach((button) => {
      button.setAttribute("aria-pressed", String(music.sounding));
      button.setAttribute(
        "aria-label",
        music.sounding ? "Turn the sound off" : "Turn the sound on",
      );
    });
    const ring = q<HTMLElement>("[data-music-ring]");
    if (ring) ring.hidden = music.touched;
    const toggle = q("[data-music-toggle]");
    toggle?.setAttribute("aria-pressed", String(music.sounding));
    toggle?.setAttribute(
      "aria-label",
      music.sounding ? "Turn the sound off" : "Turn the sound on",
    );
    const state = q("[data-music-state]");
    if (state)
      state.textContent =
        music.state === "playing"
          ? "Sound on"
          : music.state === "loading"
            ? "Loading…"
            : music.state === "failed"
              ? "Could not play; try again"
              : "Sound off";
  };
  syncMusic();
  on(window, MUSIC_EVENT, syncMusic);
  const seek = q<HTMLInputElement>("[data-music-seek]");
  if (seek)
    on(seek, "input", () =>
      music.seek((Number(seek.value) / 100) * music.duration),
    );
  const levels = new Float32Array(4);
  const tick = setInterval(() => {
    const line = q<HTMLElement>("[data-music-progress]");
    if (line) line.style.transform = `scaleX(${music.progress})`;
    const readout = q("[data-music-readout]");
    if (readout)
      readout.textContent = `${clock(music.time)} / ${clock(music.duration)}`;
    music.meter(levels);
    all<HTMLElement>("[data-music-bar]").forEach(
      (bar, i) =>
        (bar.style.height = `${Math.max(1, Math.round(levels[i] * 5)) * 2}px`),
    );
    if (seek && document.activeElement !== seek) {
      seek.value = String(music.progress * 100);
      seek.setAttribute(
        "aria-valuetext",
        `${clock(music.time)} of ${clock(music.duration)}`,
      );
    }
  }, 80);
  cleanups.push(() => clearInterval(tick));
  if (location.pathname === "/" || music.touched) void loadMusic();
  // The same engine powers the hero and footer; mount only after fonts settle.
  void Promise.all([import("../lib/pixel-field"), document.fonts.ready])
    .then(([engine]) => {
      if (signal.aborted) return;
      for (const canvas of all<HTMLCanvasElement>("canvas[data-pixel-field]")) {
        const variant = canvas.dataset.pixelField;
        const init = async () => {
          const glyph =
            variant === "not-found"
              ? await import("../data/not-found-bitmap").then((g) => ({
                  rows: g.NOT_FOUND_ROWS,
                  width: g.NOT_FOUND_WIDTH,
                  height: g.NOT_FOUND_HEIGHT,
                }))
              : undefined;
          if (signal.aborted) return;
          const cleanup = engine.mountPixelField(canvas, {
            variant: variant === "field" ? "field" : "hero",
            glyph,
            onPainted: () => {
              if (variant !== "field")
                q("[data-hero-wordmark]")?.setAttribute("data-painted", "");
            },
            onGlyphPress:
              variant === "not-found"
                ? () => {
                    void navigate("/");
                  }
                : () => openDialog(themeDialog),
          });
          if (cleanup) cleanups.push(cleanup);
        };
        void init();
      }
    })
    .catch(() => {
      /* The static wordmark stays visible if the optional renderer cannot load. */
    });
  cleanups.push(watchOutbound());
  dispose = () => {
    controller.abort();
    for (const cleanup of cleanups) cleanup();
    for (const dialog of all<HTMLDialogElement>("dialog[open]")) dialog.close();
  };
}
document.addEventListener("astro:before-swap", () => dispose?.());
