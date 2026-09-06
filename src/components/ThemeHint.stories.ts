import Component from "./ThemeHint.astro";
export default {
  title: "Components/ThemeHint",
  component: Component,
  tags: ["autodocs"],
  argTypes: { visible: { control: "boolean" } },
};
export const Default = { args: { visible: true } };
