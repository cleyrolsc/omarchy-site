import Component from "./Brand.astro";
export default {
  title: "Components/Brand",
  component: Component,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: ["mark", "wordmark"] },
    label: { control: "text" },
    gradient: { control: "boolean" },
  },
};
export const Default = { args: { variant: "wordmark" } };
export const Gradient = { args: { variant: "wordmark", gradient: true } };
export const Mark = { args: { variant: "mark", label: "Omarchy" } };

export const DrawnMark = { args: { variant: "mark", drawn: true } };
