/**
 * Shared live/random mode for the single `/` player.
 * Default is live. The last explicit user choice is kept in localStorage.
 */
const STORAGE_KEY = 'dbr-playback-mode'

const readStoredMode = () => {
  if (!import.meta.client) return 'live'
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    if (value === 'live' || value === 'random') return value
  } catch {
    // private mode / blocked storage
  }
  return 'live'
}

const writeStoredMode = (mode) => {
  if (!import.meta.client) return
  try {
    window.localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // private mode / blocked storage
  }
}

export function usePlaybackMode() {
  const desiredMode = useState('playback-desired-mode', () => 'live')
  const actualMode = useState('playback-actual-mode', () => 'live')
  const modeBusy = useState('playback-mode-busy', () => false)
  const restored = useState('playback-mode-restored', () => false)

  if (import.meta.client && !restored.value) {
    restored.value = true
    const stored = readStoredMode()
    desiredMode.value = stored
  }

  const isLive = computed(() => actualMode.value === 'live')
  const wantLive = computed(() => desiredMode.value === 'live')

  const requestLive = () => {
    desiredMode.value = 'live'
    writeStoredMode('live')
  }

  const requestRandom = () => {
    desiredMode.value = 'random'
    writeStoredMode('random')
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
