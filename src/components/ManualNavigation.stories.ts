import Component from "./ManualNavigation.astro";
export default {
  title: "Components/ManualNavigation",
  component: Component,
  tags: ["autodocs"],
  argTypes: {
    chapters: { control: "object" },
    currentPath: { control: "text" },
  },
};
export const Default = {
  args: {
    chapters: [
      { title: "Welcome to Omarchy!", path: "/manual/" },
      { title: "Getting started", path: "/manual/getting-started/" },
    ],
    currentPath: "/manual/",
  },
};
