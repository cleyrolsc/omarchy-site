export const site = {
  name: "Omarchy",
  url: "https://omarchy.org",
  description:
    "The malleable OS for the age of agents. Vibe your way through every alteration, tweak, or trouble.",
  defaultTitle: "Omarchy - Beautiful, fun & agentic Linux by DHH",
  defaultOgImage: "/brand/omarchy-og.png",
  locale: "en_US",
  social: {
    github: "https://github.com/omacom/omarchy",
    discord: "https://discord.gg/tXFUdasqhY",
  },
  llms: {
    summary:
      "Omarchy is an omakase Linux distribution based on Arch, Hyprland, and Quickshell. It provides an opinionated, customizable desktop with development tools, applications, themes, and community plugins.",
    corePages: [
      {
        title: "Home",
        path: "/",
        markdownPath: "/index.md",
        description:
          "What Omarchy is, ways to try and install it, and the people behind it.",
      },
      {
        title: "Manual",
        path: "/manual/",
        markdownPath: "/manual.md",
        description: "The complete user manual and chapter navigation.",
      },
      {
        title: "Getting started",
        path: "/manual/getting-started/",
        markdownPath: "/manual/getting-started.md",
        description:
          "Installation, requirements, and getting to your first desktop.",
      },
      {
        title: "News",
        path: "/news/",
        markdownPath: "/news.md",
        description:
          "Announcements from the Omarchy project and Omacom Foundation.",
      },
      {
        title: "Themes",
        path: "/themes/",
        markdownPath: "/themes.md",
        description: "Community themes and their source repositories.",
      },
      {
        title: "Teams",
        path: "/teams/",
        markdownPath: "/teams.md",
        description: "The core, security, design, and ranger teams.",
      },
      {
        title: "Foundation",
        path: "/foundation/",
        markdownPath: "/foundation.md",
        description: "The nonprofit funding Omarchy and its dependencies.",
      },
      {
        title: "Security",
        path: "/security/",
        markdownPath: "/security.md",
        description: "Security policy, reporting, and contributor credits.",
      },
    ],
  },
} as const;
export function absoluteUrl(path = "/") {
  return new URL(path, site.url).toString();
}
export function markdownAlternatePath(pathname: string) {
  return `${pathname.replace(/\/$/, "") || "/index"}.md`;
}
