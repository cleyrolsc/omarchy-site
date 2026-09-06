import { navigate } from "astro:transitions/client";
import {
  applyTheme,
  readTheme,
  SITE_THEMES,
  HINT_KEY,
  THEME_EVENT,
  OPEN_PICKER_EVENT,
  PICKER_STATE_EVENT,
  paintFavicon,
  watchChrome,
} from "../lib/theme";
import { MUSIC_EVENT, music, loadMusic } from "../lib/music";
import { watchOutbound } from "../lib/outbound";
import { EFFECTS, ETCH_EVENT, effectFromLocation } from "../lib/etch";

type SearchEntry = {
  title: string;
  text: string;
  url: string;
  section: string;
};
let searchPromise: Promise<SearchEntry[]> | undefined;
let dispose: (() => void) | undefined;
const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export function initSite() {
  dispose?.();
  const controller = new AbortController();
  const { signal } = controller;
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
  const mediaDialog = q<HTMLDialogElement>("#site-media");
  const mediaContent = q("[data-media-content]");
  const input = q<HTMLInputElement>("#site-search-input");
  const results = q("[data-search-results]");
  const status = q("[data-search-status]");
  let searchVersion = 0;
  let selected = -1;
  let timer: ReturnType<typeof setTimeout>;
  all(
    "[data-open-search], [data-open-theme], [data-copy], [data-carousel-prev], [data-carousel-next]",
  ).forEach((el) => (el.hidden = false));

  let hintDismissed = false;
  const dismissHint = () => {
    hintDismissed = true;
    const hint = q<HTMLElement>("[data-theme-hint]");
    if (hint) hint.hidden = true;
    try {
      localStorage.setItem(HINT_KEY, "1");
    } catch {
      /* storage may be unavailable */
    }
  };
  try {
    if (!localStorage.getItem(HINT_KEY)) {
      const hintTimer = setTimeout(() => {
        const hint = q<HTMLElement>("[data-theme-hint]");
        if (hint && !hintDismissed && !q("dialog[open]")) hint.hidden = false;
      }, 2500);
      cleanups.push(() => clearTimeout(hintTimer));
    }
  } catch {
    /* optional hint stays hidden when storage is unavailable */
  }
  const openDialog = (dialog: HTMLDialogElement | null) => {
    if (!dialog) return;
    if (dialog === themeDialog) dismissHint();
    for (const other of all<HTMLDialogElement>("dialog[open]"))
      if (other !== dialog) other.close();
    if (!dialog.open) dialog.showModal();
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
    if (preview) {
      preview.src = `/assets/images/theme-previews/${id}.webp`;
      preview.alt = `${theme.name} desktop preview`;
    }
  };
  syncTheme();
  paintFavicon();
  cleanups.push(watchChrome());
  on(window, THEME_EVENT, syncTheme);
  on(window, OPEN_PICKER_EVENT, () => openDialog(themeDialog));
  on(q<HTMLInputElement>("#theme-filter") || document, "input", (event) => {
    const needle =
      (event.target as HTMLInputElement).value?.trim().toLowerCase() || "";
    all("[data-theme-option]").forEach(
      (button) =>
        (button.hidden = !button.textContent?.toLowerCase().includes(needle)),
    );
  });

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
    if (!query) {
      results.replaceChildren();
      status.textContent = "Start typing to search.";
      return;
    }
    status.textContent = "Searching…";
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
      const words = query.split(/\s+/);
      const matches = entries
        .map((entry) => ({
          entry,
          score: words.every((word) =>
            `${entry.title} ${entry.text}`.toLowerCase().includes(word),
          )
            ? (entry.title.toLowerCase().includes(query) ? 100 : 0) +
              words.filter((w) => entry.title.toLowerCase().includes(w))
                .length *
                10 +
              1
            : 0,
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);
      results.replaceChildren(
        ...matches.map(({ entry }) => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = entry.url;
          const title = document.createElement("strong");
          title.textContent = entry.title;
          const summary = document.createElement("span");
          summary.textContent = `${entry.section} · ${entry.text.slice(0, 150)}`;
          a.append(title, summary);
          li.append(a);
          return li;
        }),
      );
      status.textContent = matches.length
        ? `${matches.length} results`
        : `No results for “${input.value.trim()}”.`;
    } catch {
      if (!signal.aborted)
        status.textContent =
          "Search is unavailable right now. Please try again.";
    }
  }
  if (input) {
    on(input, "input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => void runSearch(), 100);
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
      openDialog(searchDialog);
      return;
    }
    if (element.closest("[data-open-theme]")) {
      openDialog(themeDialog);
      return;
    }
    const theme =
      element.closest<HTMLElement>("[data-set-theme]")?.dataset.setTheme;
    if (theme) {
      applyTheme(theme);
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
    const railButton = element.closest(
      "[data-carousel-prev],[data-carousel-next]",
    );
    if (railButton) {
      const rail = railButton
        .closest("[data-carousel]")
        ?.querySelector("[data-carousel-rail]");
      rail?.scrollBy({
        left:
          rail.clientWidth *
          (railButton.hasAttribute("data-carousel-next") ? 1 : -1) *
          0.8,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
      return;
    }
    const cluster = element.closest("[data-cluster-toggle]");
    if (cluster) {
      const root = cluster.closest("[data-team-cluster]");
      const expanded = root?.toggleAttribute("data-open");
      cluster.setAttribute("aria-expanded", String(Boolean(expanded)));
      return;
    }
    const voices = element.closest("[data-voices-toggle]");
    if (voices) {
      const wall = q("[data-voices-wall]");
      const collapsed = wall?.toggleAttribute("data-collapsed");
      voices.setAttribute("aria-expanded", String(!collapsed));
      voices.textContent = collapsed ? "Show more voices" : "Show fewer voices";
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
    if (editing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "/" && !q("dialog[open]")) {
      e.preventDefault();
      openDialog(searchDialog);
    }
    if (e.key.toLowerCase() === "t" && !q("dialog[open]")) {
      e.preventDefault();
      openDialog(themeDialog);
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
  const gallerySearch = q<HTMLInputElement>("[data-gallery-search]");
  if (gallerySearch)
    on(gallerySearch, "input", () => {
      let count = 0;
      const needle = gallerySearch.value.trim().toLowerCase();
      all("[data-theme-card]").forEach((card) => {
        card.hidden = !card.dataset.searchText?.includes(needle);
        if (!card.hidden) count++;
      });
      const label = q("[data-gallery-count]");
      if (label) label.textContent = `${count} themes`;
    });
  const wall = q("[data-voices-wall]");
  if (wall) {
    wall.setAttribute("data-collapsed", "");
    const toggle = q("[data-voices-toggle]");
    if (toggle) toggle.hidden = false;
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
    const toggle = q("[data-music-toggle]");
    toggle?.setAttribute("aria-pressed", String(music.sounding));
    toggle?.setAttribute(
      "aria-label",
      music.sounding ? "Mute background music" : "Play background music",
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
  const tick = setInterval(() => {
    if (seek && document.activeElement !== seek) {
      seek.value = String(music.progress * 100);
      seek.setAttribute(
        "aria-valuetext",
        `${clock(music.time)} of ${clock(music.duration)}`,
      );
    }
  }, 400);
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
  const typed = q("[data-typewriter]");
  if (typed && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const words = [
      "thing.",
      " missing app.",
      " incompatibility.",
      " paper cut.",
    ];
    let word = 0;
    let position = words[0].length;
    let erasing = true;
    let pause = 20;
    const interval = setInterval(() => {
      if (!typed.isConnected) return;
      if (pause-- > 0) return;
      const phrase = words[word];
      position += erasing ? -1 : 1;
      typed.textContent = phrase.slice(0, Math.max(0, position));
      if (position <= 0) {
        erasing = false;
        word = (word + 1) % words.length;
        pause = 2;
      } else if (position >= phrase.length && !erasing) {
        erasing = true;
        pause = 26;
      }
    }, 85);
    cleanups.push(() => clearInterval(interval));
  }
  dispose = () => {
    controller.abort();
    clearTimeout(timer);
    for (const cleanup of cleanups) cleanup();
    for (const dialog of all<HTMLDialogElement>("dialog[open]")) dialog.close();
  };
}
document.addEventListener("astro:before-swap", () => dispose?.());
