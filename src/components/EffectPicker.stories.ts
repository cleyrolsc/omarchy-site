import Component from "./EffectPicker.astro";
export default {
  title: "Components/EffectPicker",
  component: Component,
  tags: ["autodocs"],
  argTypes: { visible: { control: "boolean" } },
};
export const Default = { args: { visible: true } };
