import { getCollection, getEntry } from "astro:content";
import { cleanMarkdown, manualEntries, newsEntries, newsPath } from "./content";
import { SITE_THEMES } from "./theme";
import { site, absoluteUrl } from "../config/site";
import showcases from "../data/showcases.json";
import meetups from "../data/meetups.json";
import home from "../data/home.json";
import release from "../data/version.json";
import catalogue from "../data/plugins.json";
import themes from "../data/themes.json";
import teams from "../data/teams.json";
import patrons from "../data/patrons.json";
import voices from "../data/voices.json";
import momentum from "../data/momentum.json";
import banner from "../data/banner.json";
export type Document = {
  path: string;
  title: string;
  description: string;
  body: string;
};
const link = (title: string, path: string) =>
  `[${title}](${absoluteUrl(path)})`;
const people = (groups: typeof teams | typeof patrons) =>
  groups
    .map(
      (group) =>
        `### ${group.name}\n\n${group.description}\n\n${group.members.map((member) => `- ${member.href ? link(member.name, member.href) : member.name}${member.meta ? " — " + member.meta : ""}`).join("\n")}`,
    )
    .join("\n\n");
export async function documents(): Promise<Document[]> {
  const [manual, news, pages, entry] = await Promise.all([
    manualEntries(),
    newsEntries(),
    getCollection("pages"),
    getEntry("marketing", "home"),
  ]);
  const homeBody = [
    "Beautiful, fun & agentic Linux by " + link("DHH", "https://dhh.dk"),
    site.description,
    banner ? `${cleanMarkdown(banner.html)}: ${absoluteUrl(banner.href)}` : "",
    "## We can fix everything",
    entry?.body || "",
    `> ${home.quote.text}\n\n— ${link(home.quote.name, home.quote.href)}, ${home.quote.role}`,
    "## See it in action",
    "Experience a transfer of enthusiasm.",
    ...home.videos.map(
      (video) =>
        `- ${link(video.title, "https://www.youtube.com/watch?v=" + video.id)} — ${video.channel}`,
    ),
    "## Install Omarchy",
    "Be up and running in as little as 35 seconds on the fastest machines, and in less than two minutes on the majority of computers.",
    "### Full-disk or dual-boot installation",
    "Write the ISO to a USB stick and answer five questions. It hands back a finished desktop.",
    link(`Download Omarchy ${release.version}`, release.isoUrl),
    `Under a minute from stick to desktop. Verify the file: ${link("SHA-256", release.isoUrl + ".sha256")}, ${link("signature", release.isoUrl + ".sig")}.`,
    "### Try it first",
    "All of Omarchy running in a virtual machine, so you can get a taste first.",
    link("Try on Mac", "https://github.com/omacom/try-omarchy") +
      " · " +
      link("Try on Windows", "https://github.com/omacom/try-omarchy-windows"),
    "Apple Silicon Macs, Windows 10 and 11. On Linux, the ISO is the way in.",
    link("Full installation guide", "/manual/getting-started/") +
      " · " +
      link("Dual booting beside Windows", "/manual/dual-boot-install/") +
      " · " +
      link("Unattended installs", "/manual/unattended-installs/"),
    "## It runs on almost anything",
    "You don't need a new machine to try Omarchy. But if you get one, today's laptops are amazing.",
    ...home.hardware.map(
      (item) =>
        `### ${item.title}\n\n${item.description}\n\n${link(item.link, item.href)}`,
    ),
    "## A plugin for every dream, every desire",
    "Thousands of community plugins are available for Omarchy. Don't find what you need? Just put your agent on the job, then share when done.",
    ...home.featuredPluginIds.map((id) => {
      const p = catalogue.plugins.find((p) => p.id === id)!;
      return `### ${link(p.name, "https://plugins.omarchy.org/plugin.html?id=" + encodeURIComponent(p.id))}\n\n${p.description}\n\n${p.installCommand}`;
    }),
    "## The agentic OS for the age of agents",
    "Your agent should feel at home on your computer. Omarchy gives it the tools and skills to help you understand, fix, and shape the whole system.",
    ...showcases.features.map(
      (item) => `### ${item.title}\n\n${item.description}`,
    ),
    showcases.agents.map(([name, , href]) => link(name, href)).join(" · "),
    link("Meet your new agent", "/manual/ai/"),
    "## Pick a theme, change everything",
    "A theme restyles the whole system at once: terminal, bar, notifications, wallpaper. Pick one and this site wears it too. Or press T to flip through them.",
    SITE_THEMES.map((theme) => theme.name).join(" / "),
    link("More community themes", "/themes/"),
    "## Developed by developers for developers",
    "The tools you know, set up to work together. Bring your projects, choose your favorites, and get straight to building.",
    ...showcases.tools.map(
      (item) => `### ${item.title}\n\n${item.description}`,
    ),
    "## All work and all play is all good",
    "Omarchy comes ready for Steam, RetroArch, and a whole world of gaming. Graphics drivers and configuration, including NVIDIA on supported hardware, are sorted during installation.",
    ...showcases.games.map(
      (game) =>
        `### ${link(game.name, "/manual/gaming/#" + game.section)}\n\n${game.description}`,
    ),
    link("Get your game on", "/manual/gaming/"),
    "## What's been happening",
    ...news
      .slice(0, 6)
      .map(
        (post) =>
          `### ${link(post.data.title, newsPath(post))}\n\n${post.data.date.toISOString()}\n\n${post.data.description || cleanMarkdown(post.body || "").split("\n\n")[0]}`,
      ),
    "## Momentum by the numbers",
    "Donations, downloads, and contributions. Momentum is based on all of it.",
    `Omacom Foundation: $${momentum.foundation.total}M. ISO downloads: ${momentum.downloads.total.toLocaleString("en-US")} across ${momentum.downloads.countries} countries. GitHub stars: ${momentum.github.stars.toLocaleString("en-US")}. Contributors: ${momentum.github.contributors}. Pull requests: ${momentum.github.pullRequests}. Commits this year: ${momentum.github.commitsYear}. Figures checked ${momentum.checked}.`,
    ...momentum.downloads.periods.map(
      (p) => `${p.label}: ${p.count.toLocaleString("en-US")} downloads.`,
    ),
    "## People love Omarchy",
    "What people posted on X after installing it.",
    ...voices.map((post) => `### ${link(post.name, post.url)}\n\n${post.text}`),
    "## It takes a village to raise a distro",
    "Omarchy Core sets the direction, the Security team keeps your system safe, Design shapes how it looks and feels, and the Rangers help others find their way.",
    people(teams),
    "## Backed by the oligarchy",
    "The billionaires, mere millionaires, and corporations funding the lion's share of the development, maintenance, and spread of Omarchy.",
    people(patrons),
    link("Our shadowy agenda? Better Linux.", "https://oligarchy.fyi"),
    "## Share the love of beautiful, fun & agentic Linux",
    "Get together with others who love computers as much as you do. Share plugins, present work, and help newcomers into the community.",
    ...meetups.events
      .filter(
        (event) => Date.parse(event.start) >= Date.parse(meetups.refreshed),
      )
      .slice(0, 15)
      .map(
        (event) =>
          `- ${link(event.title, event.url)} · ${event.start}${event.city ? " · " + event.city : ""}`,
      ),
    link("More meetups", "https://luma.com/omarchy"),
    "Don't see a meetup in your city? " + link("Start your own", "/meetups/"),
    "## Get involved with Omarchy",
    "Command your agent, and hang out with the people doing the same.",
    ...home.community.map(
      (card) =>
        `### ${card.title}\n\n${card.body}\n\n${link(card.cta, card.href)}`,
    ),
  ]
    .filter(Boolean)
    .join("\n\n");
  return [
    {
      path: "/",
      title: "Omarchy",
      description: site.description,
      body: homeBody,
    },
    ...manual.map((chapter) => ({
      path: chapter.data.path,
      title: chapter.data.title,
      description: chapter.data.description,
      body:
        cleanMarkdown(chapter.body || "") +
        (chapter.id === "index"
          ? "\n\n## Manual chapters\n\n" +
            manual.map((c) => "- " + link(c.data.title, c.data.path)).join("\n")
          : ""),
    })),
    ...news.map((post) => ({
      path: newsPath(post),
      title: post.data.title,
      description: post.data.description || "",
      body: `${post.data.date.toISOString()} · ${post.data.author}\n\n${cleanMarkdown(post.body || "")}`,
    })),
    ...pages
      .filter((page) => page.id !== "teams")
      .map((page) => ({
        path: page.data.path,
        title: page.data.title,
        description: page.data.description,
        body: cleanMarkdown(page.body || ""),
      })),
    {
      path: "/news/",
      title: "Omarchy News",
      description: "Notes on the people, ideas, and releases shaping Omarchy.",
      body:
        news
          .map(
            (post) =>
              `- ${link(post.data.title, newsPath(post))} — ${post.data.date.toISOString()}`,
          )
          .join("\n") +
        "\n\n" +
        link("RSS feed", "/news/rss.xml"),
    },
    {
      path: "/teams/",
      title: "Teams",
      description:
        "The people guiding Omarchy: Core, Security, Design, and the Rangers.",
      body: people(teams),
    },
    {
      path: "/themes/",
      title: "Community themes",
      description: "Themes made by the Omarchy community.",
      body: themes
        .map(
          (theme) =>
            `- ${link(theme.name, theme.repo)} — ${link("Screenshot", theme.image)}`,
        )
        .join("\n"),
    },
    {
      path: "/screensaver/",
      title: "Omarchy screensaver",
      description: "Terminal text effects in your browser.",
      body:
        "The Omarchy screensaver animates the wordmark using the ttfx WebAssembly engine. It cycles through terminal effects automatically. Press F to toggle fullscreen. Motion respects your system preference.\n\n" +
        link("Open the screensaver", "/screensaver/"),
    },
  ];
}
export const documentMarkdown = (doc: Document) =>
  `# ${doc.title}\n\n${doc.description}\n\n${doc.body}\n`;
