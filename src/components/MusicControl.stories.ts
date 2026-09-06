import Component from "./MusicControl.astro";
export default {
  title: "Components/MusicControl",
  component: Component,
  tags: ["autodocs"],
  argTypes: { visible: { control: "boolean" } },
};
export const Default = { args: { visible: true } };
