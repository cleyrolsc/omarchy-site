import Component from "./SiteDialogs.astro";
export default {
  title: "Components/SiteDialogs",
  component: Component,
  tags: ["autodocs"],
  argTypes: { preview: { control: "select", options: ["search", "themes"] } },
};
export const Search = { args: { preview: "search" } };
export const Themes = { args: { preview: "themes" } };
