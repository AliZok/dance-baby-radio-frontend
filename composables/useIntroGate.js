/**
 * Boot → Loading → Let's GO gate.
 * Keeps a pure-black cover on player routes until WelcomeModal (or skip) takes over,
 * so HeaderMain never flashes on first paint.
 */
export function useIntroGate() {
  const introCoverActive = useState('dbr-intro-cover-active', () => true)
  const welcomeUiMounted = useState('dbr-welcome-ui-mounted', () => false)

  const releaseIntroCover = () => {
    introCoverActive.value = false
  }

  const markWelcomeUiMounted = () => {
    welcomeUiMounted.value = true
    releaseIntroCover()
  }

  const resetIntroGate = () => {
    introCoverActive.value = true
    welcomeUiMounted.value = false
  }

  return {
    introCoverActive,
    welcomeUiMounted,
    releaseIntroCover,
    markWelcomeUiMounted,
    resetIntroGate,
  }
}
