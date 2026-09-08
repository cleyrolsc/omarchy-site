/**
 * The radio's playlist, turned into tracks the deck can play.
 *
 * radio.omarchy.org keeps the songs and the order they play in; every one
 * of them arrived there as a pull request. This reads that file and nothing
 * else - no fetching, no audio - so the awkward parts (an entry with no
 * file, a playlist that never arrives, finding the one track the page
 * already ships) can be tested on their own.
 */

export type Track = {
  title: string
  artist: string
  src: string
  /** Cover art, where there is one. The radio's songs travel without. */
  art?: string
}

export const RADIO = 'https://radio.omarchy.org'
export const PLAYLIST_URL = `${RADIO}/tracks/playlist.json`

type RadioEntry = {
  title?: string
  artist?: string
  file?: string
  url?: string
}

/**
 * The playlist, with the opener seated in it.
 *
 * The opener is one of the radio's own songs, shipped with the page: it is
 * already loaded, it is the only one with art and a timeline, and so the
 * copy that came with the page is the one kept. It stands where the radio
 * puts it, so next and back read in the radio's own order. A playlist that
 * does not have it - or does not arrive at all - leaves the opener as the
 * whole of what there is to play.
 */
export function playlistFrom(
  data: unknown,
  opener: Track,
): { tracks: Track[]; cursor: number } {
  const entries = (data as { tracks?: unknown } | null | undefined)?.tracks
  const tracks: Track[] = (
    Array.isArray(entries) ? (entries as RadioEntry[]) : []
  )
    .filter((entry) => entry && entry.title && (entry.url || entry.file))
    .map((entry) => ({
      title: entry.title as string,
      artist: entry.artist ?? '',
      src:
        entry.url ||
        `${RADIO}/tracks/${encodeURIComponent(entry.file as string)}`,
    }))
  if (!tracks.length) return { tracks: [opener], cursor: 0 }

  const mine = tracks.findIndex(
    (track) => track.title === opener.title && track.artist === opener.artist,
  )
  if (mine < 0) return { tracks: [opener, ...tracks], cursor: 0 }
  tracks[mine] = opener
  return { tracks, cursor: mine }
}
