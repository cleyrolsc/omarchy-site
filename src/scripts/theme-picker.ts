import { readTheme, SITE_THEMES, switchTheme } from "../lib/theme";
export function initThemePicker(
  dialog: HTMLDialogElement | null,
  signal: AbortSignal,
) {
  if (!dialog) return () => {};
  const cards = [...dialog.querySelectorAll<HTMLElement>("[data-picker-card]")];
  let index = 0;
  let trigger: HTMLElement | null = null;
  let ring = false;
  const label = dialog.querySelector<HTMLElement>("[data-picker-name]")!;
  const chooseButton = dialog.querySelector<HTMLButtonElement>(
    "[data-choose-theme]",
  )!;
  function render() {
    cards.forEach((card, i) => {
      const raw = i - index,
        half = cards.length / 2,
        offset =
          raw > half
            ? raw - cards.length
            : raw < -half
              ? raw + cards.length
              : raw,
        depth = Math.abs(offset),
        shift = offset === 0 ? 0 : Math.sign(offset) * (6 + depth * 12);
      card.hidden = depth > 2;
      card.dataset.depth = String(depth);
      card.setAttribute("aria-hidden", String(offset !== 0));
      card.style.transform = `translateX(${shift}%) scale(${depth === 0 ? 1 : 0.88})`;
      card.style.zIndex = String(10 - depth);
      card
        .querySelector("button")
        ?.setAttribute(
          "aria-label",
          `${offset === 0 ? "Use" : "Show"} ${SITE_THEMES[i].name}`,
        );
      const img = card.querySelector<HTMLImageElement>("img")!;
      if (depth <= 2 && !img.getAttribute("src"))
        img.src = img.dataset.themeSrc!;
    });
    const theme = SITE_THEMES[index];
    label.textContent = theme.name;
    label.dataset.theme = theme.id;
    label.toggleAttribute("data-light", Boolean(theme.light));
    chooseButton.setAttribute("aria-label", `Use ${theme.name}`);
  }
  const step = (delta: number) => {
    index = (index + delta + cards.length) % cards.length;
    render();
  };
  const close = () => {
    dialog.close();
    trigger?.focus({ preventScroll: true, focusVisible: ring } as FocusOptions);
  };
  const choose = () => {
    const theme = SITE_THEMES[index];
    if (theme.id === readTheme()) close();
    else switchTheme(theme.id, close, { frosted: true });
  };
  let swipe = { id: -1, from: 0, moved: 0 };
  dialog.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType === "touch")
        swipe = { id: event.pointerId, from: event.clientX, moved: 0 };
    },
    { signal },
  );
  dialog.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerId === swipe.id)
        swipe.moved = event.clientX - swipe.from;
    },
    { signal },
  );
  dialog.addEventListener(
    "pointerup",
    (event) => {
      if (event.pointerId !== swipe.id) return;
      swipe.id = -1;
      if (Math.abs(swipe.moved) > 44) step(swipe.moved < 0 ? 1 : -1);
    },
    { signal },
  );
  dialog.addEventListener(
    "click",
    (event) => {
      if (Math.abs(swipe.moved) > 44) {
        swipe.moved = 0;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      const target = event.target as HTMLElement;
      const button = target.closest<HTMLElement>("[data-picker-card-button]");
      if (button) {
        const next = Number(button.dataset.pickerCardButton);
        if (next === index) choose();
        else {
          index = next;
          render();
        }
      }
      const arrow = target.closest<HTMLElement>("[data-theme-step]");
      if (arrow) step(Number(arrow.dataset.themeStep));
      if (target.closest("[data-choose-theme]")) choose();
    },
    { signal, capture: true },
  );
  dialog.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        step(event.key === "ArrowRight" ? 1 : -1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        choose();
      }
    },
    { signal },
  );
  dialog.addEventListener(
    "cancel",
    (event) => {
      event.preventDefault();
      close();
    },
    { signal },
  );
  cards.forEach((card) =>
    card.querySelector("img")?.addEventListener(
      "error",
      (event) => {
        const img = event.target as HTMLImageElement;
        if (img.hasAttribute("data-retried")) return;
        img.dataset.retried = "";
        setTimeout(() => {
          if (!signal.aborted) img.src = `${img.dataset.themeSrc}?retry`;
        }, 1000);
      },
      { signal },
    ),
  );
  return () => {
    trigger = document.activeElement as HTMLElement;
    ring = trigger?.matches(":focus-visible") ?? false;
    index = Math.max(
      0,
      SITE_THEMES.findIndex((theme) => theme.id === readTheme()),
    );
    render();
  };
}
