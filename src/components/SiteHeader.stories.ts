import Component from "./SiteHeader.astro";
export default {
  title: "Components/SiteHeader",
  component: Component,
  tags: ["autodocs"],
  argTypes: { pathname: { control: "text" } },
};
export const Default = { args: { pathname: "/manual/" } };
