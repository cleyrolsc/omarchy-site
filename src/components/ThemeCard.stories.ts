import Component from "./ThemeCard.astro";
export default {
  title: "Components/ThemeCard",
  component: Component,
  tags: ["autodocs"],
  argTypes: { theme: { control: "object" } },
};
export const Default = {
  args: {
    theme: {
      repo: "https://github.com/JJDizz1L/aetheria",
      image: "/assets/themes/aetheria.webp",
      name: "Aetheria",
    },
  },
};
