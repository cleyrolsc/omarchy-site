import Component from "./Brand.astro";
export default {
  title: "Components/Brand",
  component: Component,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: ["mark", "wordmark"] },
    label: { control: "text" },
  },
};
export const Default = { args: { variant: "wordmark" } };
export const Mark = { args: { variant: "mark", label: "Omarchy" } };
