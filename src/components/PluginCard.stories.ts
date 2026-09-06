import Component from "./PluginCard.astro";
export default {
  title: "Components/PluginCard",
  component: Component,
  tags: ["autodocs"],
  argTypes: { plugin: { control: "object" } },
};
export const Default = {
  args: {
    plugin: {
      id: "lacuna.shell-suite",
      name: "Lacuna",
      description:
        "A complete visual shell for Omarchy with a custom bar, attached utility sidebar, system controls, expressive widgets, and optional desktop ambience.",
      author: "OldJobobo",
      category: "Desktop",
      kind: "Suite",
      tags: ["bar", "quickshell"],
      stars: 23,
      version: "0.1.0-beta",
      verified: false,
      verificationStatus: "unverified",
      verificationCoverage: "unverified",
      verificationSnapshotStatus: "unverified",
      sourceType: "community",
      builtIn: false,
      placeholder: false,
      repo: "https://github.com/OldJobobo/lacuna-shell",
      sourceUrl: null,
      repositoryLayout: "suite",
      installAvailable: false,
      installCommand: "",
      installNote:
        "This repository is a shell suite with its own installer, not an installable Omarchy Quattro plugin repository.",
      status: "Manual setup",
      license: "See repository",
      addedAt: "2026-07-28",
      listedAt: "2026-07-28T00:00:00.000Z",
      updatedAt: "2026-08-20T01:14:35Z",
      repositoryRelease: {
        tag: "v0.1.0-beta.5",
        url: "https://github.com/OldJobobo/lacuna-shell/tree/v0.1.0-beta.5",
      },
      listingValidatedCommit: "37f5bfb6bfaa8a4cecee6d6f17cc593cbefa21f5",
      listingValidatedAt: "2026-07-28T12:24:24.000Z",
      listingValidatedBranch: "master",
      upstreamCheckStatus: "passed",
      upstreamCheckedAt: "2026-09-06T08:39:56.316Z",
      upstreamObservedCommit: "ec309f8203097934ae409c9412e4eb3ba443bc3b",
      upstreamObservedBranch: "master",
      upstreamValidatedCommit: "ec309f8203097934ae409c9412e4eb3ba443bc3b",
      thumb:
        "https://plugins.omarchy.org/assets/img/plugins/9-oldjobobo-lacuna-shell-card.webp",
      thumbW: 720,
      thumbH: 405,
      image:
        "https://plugins.omarchy.org/assets/img/plugins/9-oldjobobo-lacuna-shell-detail.webp",
      accent: "violet",
      initials: "LA",
    },
  },
};
