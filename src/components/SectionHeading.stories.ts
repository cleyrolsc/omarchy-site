import Component from "./SectionHeading.astro";
export default {
  title: "Components/SectionHeading",
  component: Component,
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    level: { control: "select", options: [2, 3] },
  },
};
export const Default = {
  args: {
    title: "Pick a theme, change everything",
    description: "Make the desktop your own.",
    href: "/themes/",
    link: "More community themes",
  },
};
export const WithoutAction = {
  args: {
    title: "The complete manual",
    description: "Every chapter in one place.",
  },
};
