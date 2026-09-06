/** Enhancements for the statically rendered homepage. */
export function initHome(signal: AbortSignal) {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cleanups: (() => void)[] = [];
  const on = (el: EventTarget, type: string, fn: EventListener) =>
    el.addEventListener(type, fn, { signal });
  for (const rail of document.querySelectorAll<HTMLElement>(
    "[data-card-rail]",
  )) {
    const thumb =
      rail.nextElementSibling?.querySelector<HTMLElement>("[data-rail-thumb]");
    const sync = () => {
      if (!thumb) return;
      const ratio = Math.min(1, rail.clientWidth / rail.scrollWidth);
      const progress =
        rail.scrollWidth > rail.clientWidth
          ? rail.scrollLeft / (rail.scrollWidth - rail.clientWidth)
          : 0;
      thumb.style.width = `${ratio * 100}%`;
      thumb.style.transform = `translateX(${(progress * (1 - ratio) * 100) / ratio}%)`;
    };
    on(rail, "scroll", sync);
    const observer = new ResizeObserver(sync);
    observer.observe(rail);
    cleanups.push(() => observer.disconnect());
    sync();
  }
  let count = 0;
  const now = Date.now();
  for (const event of document.querySelectorAll<HTMLElement>(
    "[data-meetup-start]",
  ))
    event.hidden = Date.parse(event.dataset.meetupStart!) < now || ++count > 15;
  const wall = document.querySelector<HTMLElement>("[data-voices-wall]");
  const toggle = document.querySelector<HTMLButtonElement>(
    "[data-voices-toggle]",
  );
  if (wall && toggle) {
    toggle.hidden = false;
    on(toggle, "click", () => {
      const open = !wall.classList.contains("voices-open");
      wall.style.maxHeight = `${wall.offsetHeight}px`;
      void wall.offsetHeight;
      wall.classList.toggle("voices-open", open);
      wall.style.maxHeight = open ? `${wall.scrollHeight}px` : "42rem";
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Show less" : "View more";
      if (still && open) wall.style.maxHeight = "none";
    });
    on(wall, "transitionend", (e) => {
      if (
        e.target === wall &&
        (e as TransitionEvent).propertyName === "max-height" &&
        wall.classList.contains("voices-open")
      )
        wall.style.maxHeight = "none";
    });
  }
  const frames = new Set<number>();
  const figures = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        figures.unobserve(entry.target);
        const el = entry.target.querySelector<HTMLElement>("[data-count]");
        if (!el || still) continue;
        const target = Number(el.dataset.count);
        let start: number | undefined;
        const tick = (time: number) => {
          if (signal.aborted) return;
          start ??= time;
          const t = Math.min(1, (time - start) / 1100);
          el.textContent =
            (el.dataset.prefix || "") +
            Math.round(target * (1 - (1 - t) ** 3)).toLocaleString("en-US");
          if (t < 1) {
            const id = requestAnimationFrame(tick);
            frames.add(id);
          }
        };
        const id = requestAnimationFrame(tick);
        frames.add(id);
        entry.target
          .querySelectorAll<HTMLElement>(".figure-chart")
          .forEach((chart) =>
            chart.animate(
              [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0)" }],
              { duration: 1200, easing: "cubic-bezier(.21,.47,.32,.98)" },
            ),
          );
      }
    },
    { threshold: 0.6 },
  );
  document
    .querySelectorAll("[data-figure]")
    .forEach((el) => figures.observe(el));
  cleanups.push(() => {
    figures.disconnect();
    frames.forEach(cancelAnimationFrame);
  });
  const chart = document.querySelector<HTMLElement>("[data-week-chart]");
  const tip = chart?.querySelector<HTMLElement>("[data-week-tooltip]");
  if (chart && tip) {
    on(chart, "pointermove", (e) => {
      const target = (e.target as Element).closest<HTMLElement>(
        "[data-week-label]",
      );
      if (!target) return;
      tip.hidden = false;
      tip.querySelector("[data-week-count]")!.textContent =
        target.dataset.weekLabel!;
      tip.querySelector("[data-week-time]")!.textContent =
        target.dataset.weekDate!;
      tip.style.left = `${target.offsetLeft + target.offsetWidth / 2}px`;
    });
    on(chart, "pointerleave", () => (tip.hidden = true));
  }
  const hero = document.querySelector<HTMLElement>("[data-hero-sentinel]");
  if (hero)
    try {
      if (!sessionStorage.getItem("omarchy-intro-seen")) {
        hero.classList.add("hero-intro");
        sessionStorage.setItem("omarchy-intro-seen", "true");
      }
    } catch {}
  const typed = document.querySelector<HTMLElement>("[data-typewriter]");
  if (typed && !still) {
    const phrases = [
      "thing.",
      " missing app.",
      " incompatibility.",
      " paper cut.",
    ];
    const block = typed.closest<HTMLElement>("[data-typed-block]");
    let index = 0,
      length = 0,
      deleting = false,
      running = false,
      timer = 0;
    const reserve = () => {
      if (!block) return;
      const before = typed.textContent;
      block.style.minHeight = "";
      let tallest = 0;
      for (const phrase of phrases) {
        typed.textContent = phrase;
        tallest = Math.max(tallest, block.getBoundingClientRect().height);
      }
      typed.textContent = before;
      block.style.minHeight = `${Math.ceil(tallest)}px`;
    };
    const step = () => {
      const phrase = phrases[index],
        nextPhrase = phrases[(index + 1) % phrases.length];
      typed.textContent = phrase.slice(0, length);
      let shared = 0;
      while (
        shared < phrase.length &&
        shared < nextPhrase.length &&
        phrase[shared] === nextPhrase[shared]
      )
        shared++;
      let delay = deleting
        ? 27
        : 58 +
          Math.random() * 60 +
          (phrase[length - 1] === " " ? 95 : 0) +
          (length >= phrase.length - 2 ? 70 : 0) +
          (Math.random() < 0.07 ? 140 : 0);
      if (!deleting && length === phrase.length) {
        deleting = true;
        delay = 2100;
      } else if (deleting && length === shared) {
        deleting = false;
        index = (index + 1) % phrases.length;
        delay = 420;
      } else length += deleting ? -1 : 1;
      typed.parentElement?.setAttribute(
        "data-typing",
        delay === 2100 || delay === 420 ? "0" : "1",
      );
      timer = window.setTimeout(step, delay);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          step();
        } else if (!entry.isIntersecting) {
          running = false;
          clearTimeout(timer);
        }
      },
      { rootMargin: "96px" },
    );
    void document.fonts.ready.then(() => {
      if (signal.aborted) return;
      reserve();
      observer.observe(block || typed);
    });
    on(window, "resize", reserve);
    cleanups.push(() => {
      clearTimeout(timer);
      observer.disconnect();
    });
  }
  signal.addEventListener("abort", () => cleanups.forEach((fn) => fn()), {
    once: true,
  });
}
