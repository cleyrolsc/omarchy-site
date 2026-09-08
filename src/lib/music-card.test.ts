import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MUSIC_CARD_KEY, musicCardInitScript } from './music-card.ts'

/**
 * Run the before-paint script against a stubbed browser and report what it
 * left on the root element. `stored` is what localStorage answers with, or
 * a function to throw from it.
 */
function runInit(stored: string | null | (() => never)) {
  const documentElement = { dataset: {} as Record<string, string> }
  const localStorage = {
    getItem(key: string) {
      if (typeof stored === 'function') stored()
      return key === MUSIC_CARD_KEY ? stored : null
    },
  }
  new Function('localStorage', 'document', musicCardInitScript)(localStorage, {
    documentElement,
  })
  return documentElement.dataset.musicCardOff
}

test('the card is left out when it has never been put away', () => {
  assert.equal(runInit(null), undefined)
})

test('a card that was put away is marked before the page paints', () => {
  assert.equal(runInit('off'), '')
})

test('any other stored value leaves the card out', () => {
  assert.equal(runInit('on'), undefined)
})

test('storage that throws leaves the card out', () => {
  assert.equal(
    runInit(() => {
      throw new Error('storage unavailable')
    }),
    undefined,
  )
})
