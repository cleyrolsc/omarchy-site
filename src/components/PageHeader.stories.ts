import PageHeader from "./PageHeader.astro";
export default {
  title: "Components/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    level: { control: "select", options: ["h1", "p"] },
    spaced: { control: "boolean" },
    narrow: { control: "boolean" },
  },
};
export const Default = { args: { title: "Community themes" } };
export const Article = { args: { title: "News", level: "p", spaced: true } };
