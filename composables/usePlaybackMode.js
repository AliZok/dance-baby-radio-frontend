/**
 * Shared live/random mode for the single `/` player.
 * Header requests a mode; PlayerMain applies it.
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
