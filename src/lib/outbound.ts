/**
 * Links to other sites open in a new tab, except author links. Decided at
 * the click rather than written on each link, since links come from many places -
 * components, the manual and news pages ported from HTML, the plugin
 * directory - and one rule keeps them all the same across Astro navigation.
 * Anything on another host over http(s) counts; same-site links, mail
 * links, author links and anchors stay as they are. A link that already
 * says where to open is left alone. The browser still does the rest: a middle click
 * or a modifier click keeps its own meaning.
 */
export function watchOutbound() {
  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented) return;
    const el = event.target instanceof Element ? event.target : null;
    const a = el?.closest<HTMLAnchorElement>("a[href]");
    if (!a || a.target || a.relList.contains("author")) return;
    let url: URL;
    try {
      url = new URL(a.href, location.href);
    } catch {
      return;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return;
    if (url.host === location.host) return;
    // Set before the default action runs, which reads it: the browser
    // opens the tab, so a modifier click or a middle click is untouched.
    a.target = "_blank";
    if (!a.relList.contains("noopener") && !a.relList.contains("noreferrer"))
      a.relList.add("noopener");
  };
  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}
