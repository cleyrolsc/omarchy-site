import { t } from '@/i18n/site'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  VolumeIcon,
  VolumeOffIcon,
} from '@/components/icons'
import { MUSIC_EVENT, MUSIC_TRACK_EVENT, loadMusic, music } from '@/lib/music'
import type { MusicState, Track } from '@/lib/music'

/** Bars in the little meter, and the pixel steps each can climb. */
const METER_BARS = 4
const METER_STEPS = 5

const clock = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** What the sound is doing, kept in step with the track, and whether this
 *  page shows a control at all: always on the home page, elsewhere only once
 *  the sound has been touched. */
function useMusicState(path = '/') {
  const home = useLocation({
    serverPath: path,
    select: (at) => at.pathname === '/',
  })
  // Starts from what the sound is doing now, not from "muted": the
  // control can be mounted fresh while the sound is already on.
  const [state, setState] = useState<MusicState>(() => music.state)
  const [track, setTrack] = useState<Track>(() => music.track)
  useEffect(() => {
    const onState = (event: Event) =>
      setState((event as CustomEvent<MusicState>).detail)
    const onTrack = (event: Event) =>
      setTrack((event as CustomEvent<Track>).detail)
    window.addEventListener(MUSIC_EVENT, onState)
    window.addEventListener(MUSIC_TRACK_EVENT, onTrack)
    if (home) void loadMusic()
    return () => {
      window.removeEventListener(MUSIC_EVENT, onState)
      window.removeEventListener(MUSIC_TRACK_EVENT, onTrack)
    }
  }, [home])

  return {
    state,
    track,
    on: state === 'playing' || state === 'loading',
    shown: home || music.touched,
    untouched: !music.touched,
  }
}

/** A song's name, without the parenthetical the mixes carry. */
const songTitle = (track: Track) => track.title.replace(/ \(.*\)$/, '')

export function MusicMenuControl({
  open,
  path,
}: {
  open: boolean
  path: string
}) {
  const { state, on, shown, track } = useMusicState(path)
  const bars = useRef<Array<HTMLSpanElement | null>>([])
  useEffect(() => {
    if (!open || !on) return
    const levels = new Float32Array(METER_BARS)
    const shownLevels = new Float32Array(METER_BARS)
    let frame = 0
    const tick = () => {
      frame = requestAnimationFrame(tick)
      music.meter(levels)
      for (let i = 0; i < METER_BARS; i++) {
        const rise = levels[i] > shownLevels[i]
        shownLevels[i] += (levels[i] - shownLevels[i]) * (rise ? 0.7 : 0.2)
        const bar = bars.current[i]
        if (bar)
          bar.style.height = `${Math.max(1, Math.round(shownLevels[i] * METER_STEPS)) * 2}px`
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [open, on])
  if (!shown) return null
  const title = songTitle(track)
  return (
    <button
      type="button"
      onClick={() => music.toggle()}
      aria-pressed={on}
      data-no-stamp
      className="flex h-[47px] w-full items-center gap-2.5 text-left text-[15px] text-text-secondary touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {on ? (
        <VolumeIcon className="size-5 shrink-0" />
      ) : (
        <VolumeOffIcon className="size-5 shrink-0" />
      )}
      <span className="relative flex h-full min-w-0 flex-1 items-center leading-tight">
        <span
          className={
            'motion-reduce:transition-none ' +
            (on
              ? '-translate-y-3 transition-transform duration-200 ease-in-out'
              : 'translate-y-0 transition-transform duration-150 ease-in')
          }
        >
          {state === 'failed'
            ? 'Sound unavailable'
            : on
              ? 'Sound on'
              : 'Sound off'}
        </span>
        <span
          aria-hidden={!on}
          className={
            'absolute inset-x-0 top-[27px] flex items-center gap-1.5 text-[12px] leading-tight motion-reduce:transition-none ' +
            (on
              ? 'translate-y-0 opacity-100 blur-none [transition:translate_200ms_ease-in-out,opacity_200ms_ease-in,filter_200ms_ease-in]'
              : '-translate-y-2 opacity-0 blur-[2px] [transition:translate_150ms_ease-in,opacity_150ms_ease-out,filter_150ms_ease-out]')
          }
        >
          {track.art ? (
            <img
              src={track.art}
              alt=""
              width={18}
              height={18}
              className="size-[18px] shrink-0 object-cover"
            />
          ) : null}
          <span className="min-w-0 truncate font-sans text-text">
            {track.artist} - {title}
          </span>
        </span>
      </span>
      <span
        aria-hidden="true"
        className={
          'flex w-[18px] shrink-0 items-end gap-[2px] motion-reduce:transition-none ' +
          (on
            ? 'opacity-100 transition-opacity duration-200 ease-in-out'
            : 'opacity-0 transition-opacity duration-150 ease-in')
        }
        style={{ height: METER_STEPS * 2 + 2 }}
      >
        {Array.from({ length: METER_BARS }, (_, i) => (
          <span
            key={i}
            ref={(el) => {
              bars.current[i] = el
            }}
            className="block w-[3px] shrink-0 bg-brand"
            style={{ height: 2 }}
          />
        ))}
      </span>
    </button>
  )
}

export function MusicControl({ path = '/' }: { path?: string }) {
  const { state, on, shown, untouched, track } = useMusicState(path)

  // The progress line, the meter and the readout are driven straight from
  // the track each frame, outside React, so the card never re-renders for
  // them. While a hand is on the range, the range leads and the track
  // follows; otherwise the track leads.
  const line = useRef<HTMLSpanElement>(null)
  const range = useRef<HTMLInputElement>(null)
  const readout = useRef<HTMLSpanElement>(null)
  const bars = useRef<Array<HTMLSpanElement | null>>([])
  const scrubbing = useRef(false)
  useEffect(() => {
    if (!shown) return
    const levels = new Float32Array(METER_BARS)
    const smoothed = new Float32Array(METER_BARS)
    let frame = 0
    const tick = () => {
      frame = requestAnimationFrame(tick)
      if (!scrubbing.current) {
        const at = music.progress
        if (line.current) line.current.style.transform = `scaleX(${at})`
        if (range.current) range.current.value = String(at * 1000)
        if (readout.current)
          readout.current.textContent = `${clock(music.time)} / ${clock(music.duration)}`
      }
      music.meter(levels)
      for (let i = 0; i < METER_BARS; i++) {
        const rise = levels[i] > smoothed[i]
        smoothed[i] += (levels[i] - smoothed[i]) * (rise ? 0.7 : 0.2)
        const bar = bars.current[i]
        if (bar)
          bar.style.height = `${Math.max(1, Math.round(smoothed[i] * METER_STEPS)) * 2}px`
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [shown])

  /** The range moved, by hand or key: show it at once, and go there. */
  const onScrub = (value: number) => {
    const at = value / 1000
    if (line.current) line.current.style.transform = `scaleX(${at})`
    if (readout.current)
      readout.current.textContent = `${clock(at * music.duration)} / ${clock(music.duration)}`
    music.seek(at * music.duration)
  }

  if (!shown) return null
  const title = songTitle(track)

  return (
    <div
      data-hero-quiet
      data-no-stamp
      className="group/card pointer-events-auto fixed bottom-5 left-5 z-(--z-dropdown) hidden h-[46px] items-stretch border border-border-subtle bg-bg/85 supports-backdrop-filter:backdrop-blur-sm sm:flex"
    >
      <button
        type="button"
        onClick={() => music.toggle()}
        aria-pressed={on}
        aria-label={on ? 'Turn the sound off' : 'Turn the sound on'}
        title={on ? 'Sound off' : 'Sound on'}
        className={
          'relative size-11 shrink-0 self-center border-r border-border-subtle bg-cover bg-center text-white touch-manipulation focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ' +
          // The radio's songs travel without art; the tile carries the
          // sound icon on its own ground instead of a cover.
          (track.art ? '' : 'bg-brand/20')
        }
        style={track.art ? { backgroundImage: `url(${track.art})` } : undefined}
      >
        {untouched ? (
          <span
            aria-hidden="true"
            className="music-ring pointer-events-none absolute -inset-px border border-brand"
          />
        ) : null}
        <span
          className={
            'absolute inset-0 flex items-center justify-center bg-black/45 transition-opacity duration-150 ease-out ' +
            (on
              ? 'opacity-0 group-hover/card:opacity-100 group-has-[:focus-visible]/card:opacity-100 pointer-coarse:opacity-100'
              : 'opacity-100')
          }
        >
          {on ? (
            <VolumeIcon className="size-[18px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]" />
          ) : (
            <VolumeOffIcon className="size-[18px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]" />
          )}
        </span>
      </button>
      <span className="flex flex-col justify-center pr-2 pl-3 leading-tight">
        <span className="font-sans text-[12px] font-medium text-text">
          {state === 'failed' ? 'The sound could not start' : title}
        </span>
        <span className="relative mt-0.5 font-mono text-[12px] text-text-secondary">
          <span className="transition-opacity duration-150 ease-out group-has-[input:hover]/card:opacity-0 group-has-[input:focus-visible]/card:opacity-0 group-has-[input:active]/card:opacity-0">
            {track.artist}
          </span>
          <span
            ref={readout}
            aria-hidden="true"
            className="absolute inset-0 opacity-0 transition-opacity duration-150 ease-out group-has-[input:hover]/card:opacity-100 group-has-[input:focus-visible]/card:opacity-100 group-has-[input:active]/card:opacity-100"
          />
        </span>
      </span>
      {/* Back and on through the playlist. Out of sight until the card is
          pointed at, so the corner rests the way it always did, and the
          first press is what fetches the radio. */}
      <span className="flex shrink-0 items-center self-center opacity-0 transition-opacity duration-150 ease-out group-hover/card:opacity-100 group-has-[:focus-visible]/card:opacity-100 pointer-coarse:opacity-100">
        <button
          type="button"
          onClick={() => void music.skip(-1)}
          aria-label={t('Previous track')}
          title={t('Previous track')}
          className="flex size-6 items-center justify-center text-text-secondary touch-manipulation hover:text-text focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => void music.skip(1)}
          aria-label={t('Next track')}
          title={t('Next track')}
          className="flex size-6 items-center justify-center text-text-secondary touch-manipulation hover:text-text focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </span>
      <span
        aria-hidden="true"
        className="mr-3 ml-1 flex w-[18px] items-end gap-[2px] self-center"
        style={{ height: METER_STEPS * 2 + 2 }}
      >
        {Array.from({ length: METER_BARS }, (_, i) => (
          <span
            key={i}
            ref={(el) => {
              bars.current[i] = el
            }}
            className="block w-[3px] shrink-0 bg-brand"
            style={{ height: 2 }}
          />
        ))}
      </span>
      {/* Progress and seeking, along the foot of the card. The painted line
          is the span; the range on top of it is the control, with a hit
          area a good deal taller than the line it draws and no handle of
          its own: the end of the line is the handle. */}
      <span
        ref={line}
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-brand transition-[height] duration-150 ease-out group-hover/card:h-[4px] group-has-[:focus-visible]/card:h-[4px]"
        style={{ transform: 'scaleX(0)' }}
      />
      <input
        ref={range}
        type="range"
        min={0}
        max={1000}
        step={5}
        defaultValue={0}
        aria-label={t('Position in the track')}
        onPointerDown={() => {
          scrubbing.current = true
        }}
        onPointerUp={() => {
          scrubbing.current = false
        }}
        onPointerCancel={() => {
          scrubbing.current = false
        }}
        onInput={(event) => onScrub(Number(event.currentTarget.value))}
        className="music-seek absolute inset-x-0 -bottom-[6px] h-[14px] w-full cursor-pointer touch-none appearance-none bg-transparent focus-visible:outline-none"
      />
    </div>
  )
}
