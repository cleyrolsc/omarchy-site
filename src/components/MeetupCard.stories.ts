import MeetupCard from "./MeetupCard.astro";
import { events } from "../lib/meetups";
export default {
  title: "Components/MeetupCard",
  component: MeetupCard,
  tags: ["autodocs"],
  argTypes: { past: { control: "boolean" } },
};
export const Upcoming = { args: { event: events[0] } };
export const Past = { args: { event: events[0], past: true } };
export const NoCover = { args: { event: { ...events[0], cover: null } } };
