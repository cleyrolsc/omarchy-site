/**
 * Whether the music card is out.
 *
 * The card is the player in the corner of the page; this is only about the
 * card. The sound itself, and the controls for it in the site menu, are in
 * music.ts and stay where they are either way - putting the card away
 * clears the corner, it does not take the music off the site.
 *
 * The answer is read twice: once by musicCardInitScript, before the page
 * paints, which marks the root element so CSS can hide a card that was put
 * away before it is ever seen - a mark of its own, so that a query for the
 * card itself cannot come back with the root element; and once by the card itself on hydration,
 * which takes it out of the tree for good.
 */

export const MUSIC_CARD_KEY = 'omarchy-music-card'

export const musicCardInitScript = `(function(){try{if(localStorage.getItem('${MUSIC_CARD_KEY}')==='off')document.documentElement.dataset.musicCardOff=''}catch(e){}})()`

/** Whether the card should be out. Storage that will not answer means yes. */
export function readMusicCard(): boolean {
  try {
    return localStorage.getItem(MUSIC_CARD_KEY) !== 'off'
  } catch {
    /* storage unavailable */
    return true
  }
}

/** Put the card away, or bring it back - now, and for the next visit. */
export function setMusicCard(shown: boolean) {
  try {
    if (shown) localStorage.removeItem(MUSIC_CARD_KEY)
    else localStorage.setItem(MUSIC_CARD_KEY, 'off')
  } catch {
    /* storage unavailable */
  }
  if (shown) delete document.documentElement.dataset.musicCardOff
  else document.documentElement.dataset.musicCardOff = ''
}
