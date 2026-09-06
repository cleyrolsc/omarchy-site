import { events, byMonth } from "../lib/meetups";
import { COUNTRIES_OF, regionOf, type Region } from "../lib/regions";
import { WHOLE_MAP, PIN_AT, boxAround, type MapBox } from "../lib/meetup-map";

export function initMeetups(signal: AbortSignal) {
  const page = document.querySelector<HTMLElement>("[data-meetups-page]");
  if (!page) return;
  const on = (el: EventTarget, type: string, fn: EventListener) =>
    el.addEventListener(type, fn, { signal });
  const now = Date.now();
  const upcoming = events
    .filter((e) => Date.parse(e.start) >= now)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const past = events
    .filter((e) => Date.parse(e.start) < now)
    .sort((a, b) => Date.parse(b.start) - Date.parse(a.start));
  const cards = new Map(
    [...page.querySelectorAll<HTMLElement>("[data-meetup-card]")].map((el) => [
      el.dataset.meetupCard!,
      el,
    ]),
  );
  const months = page.querySelector<HTMLElement>("[data-months]")!;
  const archive = page.querySelector<HTMLElement>("[data-meetup-archive]")!;
  // Reuse static cards when an event passes. No content fetch or HTML string rendering.
  for (const group of byMonth(upcoming)) {
    let section = [
      ...months.querySelectorAll<HTMLElement>("[data-month]"),
    ].find((el) => el.dataset.month === group.name);
    if (!section) {
      section = document.createElement("section");
      section.className = "meetup-month";
      section.dataset.month = group.name;
      section.setAttribute("aria-labelledby", `month-${group.id}`);
      const heading = document.createElement("div");
      heading.className = "month-heading";
      const h = document.createElement("h2");
      h.id = `month-${group.id}`;
      h.textContent = group.name;
      const count = document.createElement("span");
      count.dataset.monthCount = "";
      heading.append(h, count);
      const list = document.createElement("ul");
      list.className = "meetup-grid";
      section.append(heading, list);
      months.append(section);
    }
    for (const event of group.events) {
      const card = cards.get(event.id)!;
      card.classList.remove("is-past");
      section.querySelector("ul")!.append(card);
    }
  }
  for (const event of past) {
    const card = cards.get(event.id)!;
    card.classList.add("is-past");
    archive.querySelector("ul")!.append(card);
  }
  archive.hidden = !past.length;
  archive.querySelector("[data-past-count]")!.textContent = String(past.length);
  const filters = page.querySelector<HTMLElement>("[data-meetup-filters]")!;
  filters.hidden = false;
  for (const option of filters.querySelectorAll<HTMLElement>(
    "[data-region-option]",
  )) {
    const r = option.dataset.regionOption;
    const count = r
      ? upcoming.filter((e) => regionOf(e.country) === r).length
      : upcoming.length;
    option.hidden = !!r && count === 0;
    option.querySelector("span")!.textContent = String(count);
  }
  const frame = page.querySelector<HTMLElement>("[data-meetup-map]")!;
  const world = frame.querySelector<SVGGElement>("[data-map-world]")!;
  const paths = [
    ...world.querySelectorAll<SVGPathElement>("[data-map-country]"),
  ];
  const pins = [...world.querySelectorAll<SVGAElement>("[data-map-pin]")];
  const pickable = new Set(
    upcoming.flatMap((e) => (e.country ? [e.country] : [])),
  );
  const activeDot = world.querySelector<SVGCircleElement>("[data-active-pin]")!;
  const tooltip = frame.querySelector<HTMLElement>("[data-map-tooltip]")!;
  const coarse = matchMedia("(pointer: coarse)");
  let region: Region | null = null,
    country: string | null = null,
    active: string | null = null,
    box: MapBox = WHOLE_MAP;
  const matches = (event: (typeof events)[number]) =>
    (!region || !event.country || regionOf(event.country) === region) &&
    (!country || event.country === country);
  const scale = () => WHOLE_MAP.width / box.width;
  const showActive = (id: string | null) => {
    active = id;
    cards.forEach((card, key) =>
      card.classList.toggle("is-active", key === id),
    );
    const pin = pins.find((p) => p.dataset.mapPin === id);
    const point = id ? PIN_AT.get(id) : undefined;
    tooltip.hidden = !pin || !point;
    activeDot.setAttribute("visibility", pin && point ? "visible" : "hidden");
    if (!pin || !point) return;
    const k = 1 / Math.sqrt(scale()),
      was = pin.dataset.past === "true";
    activeDot.setAttribute("cx", String(point.x));
    activeDot.setAttribute("cy", String(point.y));
    activeDot.setAttribute("r", String((was ? 3 : 5) * k));
    activeDot.setAttribute("stroke-width", String(1.2 * k));
    tooltip.dataset.past = String(was);
    tooltip.querySelector("[data-tip-title]")!.textContent = pin.dataset.title!;
    tooltip.querySelector("[data-tip-when]")!.textContent = pin.dataset.when!;
    const where = tooltip.querySelector<HTMLElement>("[data-tip-where]")!;
    where.textContent =
      (pin.dataset.where || "") +
      (pin.dataset.approximate === "true" ? " · about" : "");
    where.hidden = !pin.dataset.where;
    const cover = tooltip.querySelector<HTMLImageElement>("[data-tip-cover]")!;
    cover.hidden = !pin.dataset.cover;
    if (pin.dataset.cover) cover.src = pin.dataset.cover;
    else cover.removeAttribute("src");
    tooltip.querySelector("[data-tip-status]")!.textContent =
      `${was ? "Already happened" : "Coming up"} · opens on Luma`;
    const width = frame.clientWidth,
      compact = width < 672;
    tooltip.classList.toggle("compact", compact);
    tooltip.style.cssText = "";
    if (!compact) {
      const fx = (point.x - box.x) / box.width,
        fy = (point.y - box.y) / box.height;
      const flip = fx * width + 336 > width,
        above = fy > 0.55;
      tooltip.style.left = `${fx * 100}%`;
      tooltip.style.top = `${fy * 100}%`;
      tooltip.style.marginLeft = flip ? "-16px" : "16px";
      tooltip.style.marginTop = above ? "-12px" : "12px";
      tooltip.style.transform = `translate(${flip ? "-100%" : "0"},${above ? "-100%" : "0"})`;
    }
  };
  const measure = () => {
    const zoom = scale(),
      k = 1 / Math.sqrt(zoom),
      pxPerUnit = frame.clientWidth / WHOLE_MAP.width || 1;
    const target = coarse.matches
      ? Math.max(5.5 * k, 22 / (pxPerUnit * zoom))
      : 5.5 * k;
    for (const pin of pins) {
      const dot = pin.querySelector(".pin-dot")!;
      dot.setAttribute(
        "r",
        String(
          (pin.dataset.past === "true"
            ? 2.2
            : pin.dataset.shown === "true"
              ? 4
              : 2.8) * k,
        ),
      );
      dot.setAttribute("stroke-width", String(1.2 * k));
      pin.querySelector(".pin-target")!.setAttribute("r", String(target));
    }
    paths.forEach((path) => path.setAttribute("stroke-width", String(0.7 * k)));
    showActive(active);
  };
  const update = () => {
    const shown = upcoming.filter(matches);
    for (const event of upcoming) cards.get(event.id)!.hidden = !matches(event);
    let firstMonth = true;
    for (const section of months.querySelectorAll<HTMLElement>(
      "[data-month]",
    )) {
      const count = section.querySelectorAll(
        "[data-meetup-card]:not([hidden])",
      ).length;
      section.hidden = count === 0;
      section.toggleAttribute("data-first-month", firstMonth && count > 0);
      if (count > 0) firstMonth = false;
      section.querySelector("[data-month-count]")!.textContent = String(count);
    }
    const empty = page.querySelector<HTMLElement>("[data-meetup-empty]")!;
    empty.hidden = shown.length > 0;
    empty.textContent =
      region || country
        ? "Nothing coming up there yet. The next one may be yours."
        : "Nothing on the calendar right now. The next one may be yours.";
    for (const button of filters.querySelectorAll<HTMLButtonElement>(
      "[data-region]",
    ))
      button.setAttribute(
        "aria-pressed",
        String((button.dataset.region || null) === region),
      );
    const countries = new Set(
      upcoming
        .filter((e) => region && regionOf(e.country) === region)
        .map((e) => e.country),
    );
    for (const button of filters.querySelectorAll<HTMLButtonElement>(
      "[data-country]",
    )) {
      const code = button.dataset.country!;
      button.parentElement!.hidden =
        countries.size <= 1 || !countries.has(code);
      button.setAttribute("aria-pressed", String(country === code));
      button.querySelector(".country-count")!.textContent = String(
        upcoming.filter((e) => e.country === code).length,
      );
    }
    const lit = country
      ? new Set([country])
      : region
        ? COUNTRIES_OF(region)
        : new Set<string>();
    for (const path of paths) {
      const code = path.dataset.mapCountry!;
      path.dataset.lit = String(lit.has(code));
      path.dataset.chosen = String(country === code);
      path.dataset.pickable = String(pickable.has(code));
    }
    for (const pin of pins) {
      const event = events.find((e) => e.id === pin.dataset.mapPin)!;
      pin.dataset.past = String(Date.parse(event.start) < now);
      pin.dataset.shown = String(matches(event));
    }
    box =
      region || country
        ? boxAround(
            shown.flatMap((e) => (PIN_AT.has(e.id) ? [PIN_AT.get(e.id)!] : [])),
          )
        : WHOLE_MAP;
    world.style.transform = `scale(${scale()}) translate(${-box.x}px, ${-box.y}px)`;
    measure();
  };
  for (const button of filters.querySelectorAll<HTMLButtonElement>(
    "[data-region]",
  ))
    on(button, "click", () => {
      region = (button.dataset.region || null) as Region | null;
      country = null;
      update();
    });
  for (const button of filters.querySelectorAll<HTMLButtonElement>(
    "[data-country]",
  ))
    on(button, "click", () => {
      country =
        country === button.dataset.country ? null : button.dataset.country!;
      update();
    });
  for (const path of paths)
    on(path, "click", () => {
      const code = path.dataset.mapCountry!;
      if (!pickable.has(code)) return;
      country = country === code ? null : code;
      if (country) region = regionOf(country);
      update();
    });
  for (const [id, card] of cards) {
    on(card, "mouseenter", () => showActive(id));
    on(card, "mouseleave", () => showActive(null));
    on(card, "focusin", () => showActive(id));
    on(card, "focusout", () => showActive(null));
  }
  for (const pin of pins) {
    on(pin, "mouseenter", () => showActive(pin.dataset.mapPin!));
    on(pin, "mouseleave", () => showActive(null));
    on(pin, "focus", () => showActive(pin.dataset.mapPin!));
    on(pin, "blur", () => showActive(null));
  }
  on(document, "keydown", (event) => {
    if ((event as KeyboardEvent).key === "Escape") showActive(null);
  });
  const observer = new ResizeObserver(measure);
  observer.observe(frame);
  on(coarse, "change", measure);
  update();
  const arriving = pins.filter(
    (p) => p.dataset.past === "false" && p.dataset.shown === "true",
  );
  arriving.forEach((pin, i) => {
    pin.classList.add("arriving");
    pin.style.animationDelay = `${i * 35}ms`;
  });
  const timer = setTimeout(
    () =>
      arriving.forEach((pin) => {
        pin.classList.remove("arriving");
        pin.style.animationDelay = "";
      }),
    3000,
  );
  signal.addEventListener(
    "abort",
    () => {
      clearTimeout(timer);
      observer.disconnect();
    },
    { once: true },
  );
}
