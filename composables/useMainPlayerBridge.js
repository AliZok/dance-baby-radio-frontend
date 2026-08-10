/**
 * Tiny bridge so overlay pages (e.g. /playlists) can pause the hidden
 * PersistentPlayerHost without importing PlayerMain.
 */
const pauseSignal = () => useState('main-player-pause-signal', () => 0)

export function useMainPlayerBridge() {
  const signal = pauseSignal()

  const requestPauseMainPlayer = () => {
    signal.value += 1
  }

  return {
    pauseSignal: signal,
    requestPauseMainPlayer,
  }
}
