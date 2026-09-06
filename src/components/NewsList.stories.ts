import Component from "./NewsList.astro";
export default {
  title: "Components/NewsList",
  component: Component,
  tags: ["autodocs"],
  argTypes: { compact: { control: "boolean" }, posts: { control: "object" } },
};
export const Default = {
  args: {
    posts: [
      {
        title: "The Omarchy Core Team",
        path: "/news/2026/09/the-omarchy-core-team/",
        date: "2026-09-01T12:00:00Z",
        excerpt: "The people guiding Omarchy.",
      },
    ],
    compact: false,
  },
};
export const Empty = { args: { posts: [] } };
