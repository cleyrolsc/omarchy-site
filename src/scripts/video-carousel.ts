export function initVideoCarousels(signal: AbortSignal) {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  for (const host of document.querySelectorAll<HTMLElement>(
    "[data-carousel]",
  )) {
    const rail = host.querySelector<HTMLElement>("[data-carousel-rail]")!;
    const slides = [...rail.querySelectorAll<HTMLElement>("[data-slide]")];
    const originals = slides.map((slide) => slide.innerHTML);
    const thumb = host.querySelector<HTMLElement>("[data-video-thumb]")!;
    let index = 0,
      frame = 0,
      drag:
        | {
            id: number;
            x: number;
            left: number;
            moved: number;
            index: number;
            lastX: number;
            lastT: number;
            speed: number;
          }
        | undefined;
    let swallow = false;
    const on = (
      el: EventTarget,
      type: string,
      fn: EventListener,
      options: AddEventListenerOptions = {},
    ) => el.addEventListener(type, fn, { ...options, signal });
    const nearest = () => {
      const center = rail.getBoundingClientRect().left + rail.clientWidth / 2;
      let best = 0,
        dist = Infinity;
      slides.forEach((slide, i) => {
        const box = slide.getBoundingClientRect();
        const d = Math.abs(box.left + box.width / 2 - center);
        if (d < dist) {
          best = i;
          dist = d;
        }
      });
      return best;
    };
    const select = (i: number) => {
      index = i;
      slides.forEach((slide, n) => {
        slide.classList.toggle("is-current", n === i);
        if (n !== i && slide.querySelector("iframe[data-playing]"))
          slide.innerHTML = originals[n];
        const a = slide.querySelector<HTMLAnchorElement>("a");
        if (a)
          a.setAttribute(
            "aria-label",
            `${n === i ? "Play" : "Show"}: ${a.dataset.videoTitle}`,
          );
      });
    };
    const narrow = matchMedia("(max-width:639.98px)");
    const mobilePlayers = () => {
      slides.forEach((slide, i) => {
        if (narrow.matches) {
          if (slide.querySelector("iframe")) return;
          const a = slide.querySelector<HTMLAnchorElement>(
            "[data-carousel-video]",
          )!;
          const embed = document.createElement("iframe");
          embed.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(a.dataset.carouselVideo!)}`;
          embed.title = a.dataset.videoTitle!;
          embed.allow = "autoplay; encrypted-media; picture-in-picture";
          embed.allowFullscreen = true;
          embed.loading = "lazy";
          slide.replaceChildren(embed);
        } else if (slide.querySelector("iframe:not([data-playing])"))
          slide.innerHTML = originals[i];
      });
    };
    mobilePlayers();
    on(narrow, "change", mobilePlayers);
    const sync = () => {
      const ratio = Math.min(1, rail.clientWidth / rail.scrollWidth),
        reach = rail.scrollWidth - rail.clientWidth,
        progress = reach > 0 ? rail.scrollLeft / reach : 0;
      thumb.style.width = `${ratio * 100}%`;
      thumb.style.transform = `translateX(${(progress * (1 - ratio) * 100) / ratio}%)`;
      if (!frame && !drag) select(nearest());
    };
    const glide = (i: number) => {
      cancelAnimationFrame(frame);
      frame = 0;
      i = (i + slides.length) % slides.length;
      select(i);
      const from = rail.scrollLeft;
      const slide = slides[i].getBoundingClientRect(),
        box = rail.getBoundingClientRect();
      const to = Math.max(
        0,
        Math.min(
          rail.scrollWidth - rail.clientWidth,
          from + slide.left - box.left - (rail.clientWidth - slide.width) / 2,
        ),
      );
      rail.style.scrollSnapType = "none";
      if (still || Math.abs(to - from) < 1) {
        rail.scrollLeft = to;
        rail.style.scrollSnapType = "";
        sync();
        return;
      }
      let start: number | undefined;
      const tick = (now: number) => {
        start ??= now;
        const t = Math.min(1, Math.max(0, (now - start) / 420));
        rail.scrollLeft = from + (to - from) * (1 - (1 - t) ** 3);
        if (t < 1) frame = requestAnimationFrame(tick);
        else {
          frame = 0;
          rail.style.scrollSnapType = "";
          sync();
        }
      };
      frame = requestAnimationFrame(tick);
    };
    for (const button of host.querySelectorAll<HTMLButtonElement>(
      "[data-carousel-prev],[data-carousel-next]",
    )) {
      button.hidden = false;
      on(button, "click", (e) => {
        e.stopPropagation();
        glide(index + (button.hasAttribute("data-carousel-next") ? 1 : -1));
      });
    }
    on(rail, "scroll", sync, { passive: true });
    const resize = new ResizeObserver(sync);
    resize.observe(rail);
    sync();
    on(rail, "pointerdown", (event) => {
      const e = event as PointerEvent;
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      cancelAnimationFrame(frame);
      frame = 0;
      drag = {
        id: e.pointerId,
        x: e.clientX,
        left: rail.scrollLeft,
        moved: 0,
        index: nearest(),
        lastX: e.clientX,
        lastT: performance.now(),
        speed: 0,
      };
      rail.style.scrollSnapType = "none";
    });
    on(rail, "pointermove", (event) => {
      const e = event as PointerEvent;
      if (!drag || e.pointerId !== drag.id) return;
      const now = performance.now(),
        elapsed = now - drag.lastT;
      if (elapsed > 0)
        drag.speed =
          drag.speed * 0.6 + ((e.clientX - drag.lastX) / elapsed) * 0.4;
      drag.lastX = e.clientX;
      drag.lastT = now;
      drag.moved = Math.max(drag.moved, Math.abs(e.clientX - drag.x));
      if (drag.moved > 6) {
        try {
          rail.setPointerCapture(e.pointerId);
        } catch {}
        rail.scrollLeft = drag.left - (e.clientX - drag.x);
      }
    });
    const end = () => {
      if (!drag) return;
      const step = slides[1]
        ? slides[1].getBoundingClientRect().left -
          slides[0].getBoundingClientRect().left
        : rail.clientWidth;
      const travelled =
        rail.scrollLeft -
        drag.left +
        (performance.now() - drag.lastT < 90 ? -drag.speed * 150 : 0);
      const target =
        drag.index +
        (travelled > step * 0.2 ? 1 : travelled < -step * 0.2 ? -1 : 0);
      swallow = drag.moved > 6;
      drag = undefined;
      glide(Math.max(0, Math.min(slides.length - 1, target)));
    };
    on(rail, "pointerup", end);
    on(rail, "pointercancel", end);
    on(
      rail,
      "click",
      (event) => {
        const e = event as MouseEvent;
        if (swallow) {
          swallow = false;
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        const a = (e.target as Element).closest<HTMLAnchorElement>(
          "[data-carousel-video]",
        );
        if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        e.stopPropagation();
        const slide = a.closest<HTMLElement>("[data-slide]")!,
          i = Number(slide.dataset.slide);
        if (i !== index) {
          glide(i);
          return;
        }
        const frame = document.createElement("iframe");
        frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(a.dataset.carouselVideo!)}?autoplay=1`;
        frame.title = a.dataset.videoTitle!;
        frame.allow =
          "autoplay; encrypted-media; picture-in-picture; fullscreen";
        frame.allowFullscreen = true;
        frame.dataset.playing = "";
        slide.replaceChildren(frame);
      },
      { capture: true },
    );
    let thumbDrag: { x: number; left: number } | undefined;
    on(thumb, "pointerdown", (event) => {
      const e = event as PointerEvent;
      if (e.button !== 0) return;
      e.preventDefault();
      cancelAnimationFrame(frame);
      frame = 0;
      rail.style.scrollSnapType = "none";
      thumbDrag = { x: e.clientX, left: rail.scrollLeft };
      thumb.setPointerCapture(e.pointerId);
    });
    on(thumb, "pointermove", (event) => {
      if (!thumbDrag) return;
      const room = thumb.parentElement!.clientWidth - thumb.clientWidth;
      if (room > 0)
        rail.scrollLeft =
          thumbDrag.left +
          (((event as PointerEvent).clientX - thumbDrag.x) *
            (rail.scrollWidth - rail.clientWidth)) /
            room;
    });
    const thumbEnd = () => {
      if (!thumbDrag) return;
      thumbDrag = undefined;
      glide(nearest());
    };
    on(thumb, "pointerup", thumbEnd);
    on(thumb, "pointercancel", thumbEnd);
    signal.addEventListener(
      "abort",
      () => {
        cancelAnimationFrame(frame);
        resize.disconnect();
      },
      { once: true },
    );
  }
}
