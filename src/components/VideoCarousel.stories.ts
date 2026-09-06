import Component from "./VideoCarousel.astro";
export default {
  title: "Components/VideoCarousel",
  component: Component,
  tags: ["autodocs"],
  argTypes: { videos: { control: "object" } },
};
export const Default = {
  args: {
    videos: [
      {
        id: "F7fe9pa8OeE",
        title: "Omarchy Quattro by David Heinemeier Hansson",
        channel: "DHH",
        thumb: "/assets/images/video/omarchy-quattro.webp",
      },
      {
        id: "9SDkU5VDQEQ",
        title: "You need to switch to Linux RIGHT NOW!!",
        channel: "NetworkChuck",
        thumb: "/assets/images/video/networkchuck.webp",
      },
      {
        id: "5JPYJfN7HY0",
        title: "They finally fixed linux",
        channel: "typecraft",
        thumb: "/assets/images/video/typecraft.webp",
      },
      {
        id: "qBKMe8AatY0",
        title: "I Didn't Expect Omarchy 4 to Be This Good",
        channel: "LinuxBTW",
        thumb: "/assets/images/video/linuxbtw.webp",
      },
      {
        id: "KO2T0oET9go",
        title: "If you use AI, switch to Omarchy immediately",
        channel: "Alex Finn",
        thumb: "/assets/images/video/alex-finn.webp",
      },
    ],
  },
};
