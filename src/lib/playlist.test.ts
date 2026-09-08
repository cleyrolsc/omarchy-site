import assert from 'node:assert/strict'
import { test } from 'node:test'
import { RADIO, playlistFrom } from './playlist.ts'
import type { Track } from './playlist.ts'

const OPENER: Track = {
  title: 'We Can Fix Everything (The Ultimate Machine)',
  artist: 'Kevin Koontz',
  src: '/music/kevin_koontz-we_can_fix_everything.mp3',
  art: '/music/kevin_koontz-we_can_fix_everything.webp',
}

const entry = (title: string, artist: string, file: string) => ({
  title,
  artist,
  file,
})

test('the opener keeps its place, and its own copy', () => {
  const { tracks, cursor } = playlistFrom(
    {
      tracks: [
        entry('Omarchy Oligarchy', 'YZL81', 'yzl81-omarchy-oligarchy.mp3'),
        entry(OPENER.title, OPENER.artist, 'kevin-koontz-we-can-fix.mp3'),
        entry(
          'Still Licensed',
          'Michel Krapf',
          'michel-krapf-still-licensed.mp3',
        ),
      ],
    },
    OPENER,
  )
  assert.equal(tracks.length, 3)
  assert.equal(cursor, 1)
  // The local copy, art and all - not the radio's URL for the same song.
  assert.equal(tracks[1], OPENER)
  assert.equal(tracks[1].src, OPENER.src)
})

test('a song is addressed at the radio, with its name escaped', () => {
  const { tracks } = playlistFrom(
    { tracks: [entry('Fork o Clock', 'Boyd', "boyd-it's fork.mp3")] },
    OPENER,
  )
  assert.equal(tracks[1].src, `${RADIO}/tracks/boyd-it's%20fork.mp3`)
})

test('an entry may name a song hosted elsewhere', () => {
  const { tracks } = playlistFrom(
    {
      tracks: [
        {
          title: 'Elsewhere',
          artist: 'Someone',
          url: 'https://example.com/a.mp3',
        },
      ],
    },
    OPENER,
  )
  assert.equal(tracks[1].src, 'https://example.com/a.mp3')
})

test('a playlist without the opener puts it first', () => {
  const { tracks, cursor } = playlistFrom(
    { tracks: [entry('Still Licensed', 'Michel Krapf', 'michel.mp3')] },
    OPENER,
  )
  assert.equal(cursor, 0)
  assert.equal(tracks[0], OPENER)
  assert.equal(tracks.length, 2)
})

test('the same title by another artist is another song', () => {
  const { tracks, cursor } = playlistFrom(
    { tracks: [entry(OPENER.title, 'Ryan R. Hughes', 'ryan.mp3')] },
    OPENER,
  )
  assert.equal(cursor, 0)
  assert.equal(tracks.length, 2)
  assert.equal(tracks[0], OPENER)
})

test('entries with nothing to play are dropped', () => {
  const { tracks } = playlistFrom(
    {
      tracks: [
        { title: 'No file', artist: 'Nobody' },
        { artist: 'No title', file: 'x.mp3' },
        entry('Real', 'Someone', 'real.mp3'),
      ],
    },
    OPENER,
  )
  assert.deepEqual(
    tracks.map((track) => track.title),
    [OPENER.title, 'Real'],
  )
})

test('a playlist that does not arrive leaves the opener playing', () => {
  for (const nothing of [
    null,
    undefined,
    {},
    { tracks: [] },
    { tracks: 'no' },
    'nope',
  ]) {
    const { tracks, cursor } = playlistFrom(nothing, OPENER)
    assert.deepEqual(tracks, [OPENER])
    assert.equal(cursor, 0)
  }
})
