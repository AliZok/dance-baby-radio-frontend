/**
 * Shared live/random mode for the single `/` player.
 * Every visit starts in random mode — the LIVE toggle next to the playing
 * radio icon in the header switches to the live station and back.
 */

export function usePlaybackMode() {
  const desiredMode = useState('playback-desired-mode', () => 'random')
  const actualMode = useState('playback-actual-mode', () => 'random')
  const modeBusy = useState('playback-mode-busy', () => false)

  const isLive = computed(() => actualMode.value === 'live')
  const wantLive = computed(() => desiredMode.value === 'live')

  const requestLive = () => {
    desiredMode.value = 'live'
  }

  const requestRandom = () => {
    desiredMode.value = 'random'
  }

  return {
    desiredMode,
    actualMode,
    modeBusy,
    isLive,
    wantLive,
    requestLive,
    requestRandom,
  }
}
