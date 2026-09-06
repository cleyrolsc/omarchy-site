import snapshot from "../data/meetups.json";
export type Meetup = {
  id: string;
  title: string;
  url: string;
  start: string;
  timezone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  cover: string | null;
  coverWidth?: number;
  coverHeight?: number;
  geo: { lat: number; lon: number; approximate?: boolean } | null;
};
export const events: Meetup[] = snapshot.events;
export const snapshotTime = Date.parse(`${snapshot.refreshed}T00:00:00Z`);
const names = new Intl.DisplayNames(["en"], { type: "region" });
export function countryOf(code: string) {
  try {
    return names.of(code) || code;
  } catch {
    return code;
  }
}
export function whereOf(event: Meetup) {
  const country = event.country ? countryOf(event.country) : "";
  if (event.city)
    return !country || event.city.includes(country)
      ? event.city
      : `${event.city}, ${country}`;
  return event.address || country;
}
export const inZone = (event: Meetup, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone: event.timezone || "UTC",
  }).format(new Date(event.start));
export const whenOf = (event: Meetup) =>
  `${inZone(event, { weekday: "short", month: "short", day: "numeric" })} · ${inZone(event, { hour: "numeric", minute: "2-digit" })}`;
export function byMonth(list: Meetup[]) {
  const groups: { name: string; id: string; events: Meetup[] }[] = [];
  for (const event of list) {
    const name = inZone(event, { month: "long", year: "numeric" });
    const last = groups.at(-1);
    if (last?.name === name) last.events.push(event);
    else
      groups.push({
        name,
        id: name.toLowerCase().replace(/\s+/g, "-"),
        events: [event],
      });
  }
  return groups;
}
