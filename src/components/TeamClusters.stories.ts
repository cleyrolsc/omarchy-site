import Component from "./TeamClusters.astro";
export default {
  title: "Components/TeamClusters",
  component: Component,
  tags: ["autodocs"],
  argTypes: { maxFaces: { control: "number" } },
};
export const Default = { args: {} };
export const Compact = { args: { maxFaces: 3 } };
