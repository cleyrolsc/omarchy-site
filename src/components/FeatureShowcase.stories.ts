import FeatureShowcase from "./FeatureShowcase.astro";
export default {
  title: "Sections/FeatureShowcase",
  component: FeatureShowcase,
  tags: ["autodocs"],
};
export const Hardware = { args: { kind: "hardware" } };
export const Agents = { args: { kind: "agents" } };
export const Developers = { args: { kind: "developers" } };
export const Gaming = { args: { kind: "gaming" } };
