<template>
  <Teleport to="body">
    <Transition name="apk-promo">
      <div
        v-if="visible"
        class="AndroidAppPromo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="apk-promo-title"
      >
        <div class="AndroidAppPromo__backdrop" @click="dismiss" />

        <div class="AndroidAppPromo__card">
          <div class="AndroidAppPromo__glow" aria-hidden="true" />
          <div class="AndroidAppPromo__scan" aria-hidden="true" />

          <button
            type="button"
            class="AndroidAppPromo__close"
            aria-label="Close"
            @click="dismiss"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>

          <div class="AndroidAppPromo__icon" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none">
              <rect x="12" y="6" width="24" height="36" rx="4" stroke="currentColor" stroke-width="2" />
              <path d="M20 10h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <circle cx="24" cy="36" r="2" fill="currentColor" />
              <path d="M18 20h12M18 26h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.7" />
            </svg>
          </div>

          <h2 id="apk-promo-title" class="AndroidAppPromo__title">
            Android app
          </h2>

          <p class="AndroidAppPromo__text">
            Keep listening with the screen locked.
          </p>

          <div class="AndroidAppPromo__actions">
            <a
              class="AndroidAppPromo__download"
              :href="apkUrl"
              download="dance-baby-radio.apk"
              @click="onDownload"
            >
              <span class="AndroidAppPromo__download-glow" aria-hidden="true" />
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 4v10m0 0l-4-4m4 4l4-4M5 18h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>Download APK</span>
            </a>

            <button type="button" class="AndroidAppPromo__later" @click="dismiss">
              Not now
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const STORAGE_KEY = 'dbr-android-apk-promo-dismissed'
const apkUrl = '/downloads/dance-baby-radio-version-5.apk'

const visible = ref(false)
let mediaQuery = null
let welcomePollTimer = null
let showTimer = null

const isNativeApp = () => {
  if (!import.meta.client) return false
  try {
    return !!(window.Capacitor?.isNativePlatform?.())
  } catch {
    return false
  }
}

const isMobileViewport = () => {
  if (!import.meta.client) return false
  return window.matchMedia('(max-width: 768px)').matches
}

const wasDismissed = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

const markDismissed = () => {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // ignore quota / private mode
  }
}

const welcomeStillOpen = () => {
  if (window.__welcomeClicked) return false
  const el = document.getElementById('welcome-modal-container')
  if (!el) return false
  return getComputedStyle(el).display !== 'none'
}

const maybeShow = () => {
  if (wasDismissed() || isNativeApp() || !isMobileViewport()) {
    visible.value = false
    return
  }

  if (welcomeStillOpen()) {
    clearTimeout(welcomePollTimer)
    welcomePollTimer = setTimeout(maybeShow, 600)
    return
  }

  clearTimeout(showTimer)
  showTimer = setTimeout(() => {
    if (!wasDismissed() && isMobileViewport() && !isNativeApp()) {
      visible.value = true
    }
  }, 700)
}

const dismiss = () => {
  visible.value = false
  markDismissed()
}

const onDownload = () => {
  markDismissed()
  // Keep modal briefly so the download gesture feels intentional, then close.
  setTimeout(() => {
    visible.value = false
  }, 350)
}

const onViewportChange = () => {
  if (!isMobileViewport()) {
    visible.value = false
    return
  }
  if (!visible.value && !wasDismissed() && !isNativeApp()) {
    maybeShow()
  }
}

onMounted(() => {
  if (!import.meta.client) return
  mediaQuery = window.matchMedia('(max-width: 768px)')
  mediaQuery.addEventListener?.('change', onViewportChange)
  maybeShow()
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener?.('change', onViewportChange)
  clearTimeout(welcomePollTimer)
  clearTimeout(showTimer)
})
</script>

<style scoped lang="scss">
.AndroidAppPromo {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  pointer-events: none;
}

.AndroidAppPromo__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(2, 10, 14, 0.72);
  backdrop-filter: blur(4px);
  pointer-events: auto;
}

.AndroidAppPromo__card {
  position: relative;
  width: min(100%, 420px);
  margin-bottom: max(12px, env(safe-area-inset-bottom));
  padding: 28px 22px 20px;
  border-radius: 22px;
  border: 1px solid rgba(0, 255, 255, 0.35);
  background:
    linear-gradient(160deg, rgba(8, 36, 44, 0.96), rgba(4, 18, 24, 0.98)),
    radial-gradient(circle at top right, rgba(0, 255, 204, 0.12), transparent 55%);
  box-shadow:
    0 0 0 1px rgba(132, 243, 255, 0.08),
    0 18px 50px rgba(0, 0, 0, 0.55),
    0 0 40px rgba(0, 255, 255, 0.12);
  overflow: hidden;
  pointer-events: auto;
  color: #dffcff;
}

.AndroidAppPromo__glow {
  position: absolute;
  inset: -40% -20% auto;
  height: 140px;
  background: radial-gradient(circle, rgba(0, 255, 204, 0.22), transparent 70%);
  pointer-events: none;
}

.AndroidAppPromo__scan {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(to right, transparent, rgba(0, 255, 255, 0.75), transparent);
  animation: apkScan 2.8s linear infinite;
  filter: blur(0.5px);
  pointer-events: none;
  opacity: 0.7;
}

.AndroidAppPromo__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(132, 243, 255, 0.25);
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.25);
  color: #84f3ff;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: rgba(0, 255, 255, 0.12);
    border-color: rgba(0, 255, 255, 0.55);
  }
}

.AndroidAppPromo__icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 14px;
  color: #00ffcc;
  filter: drop-shadow(0 0 10px rgba(0, 255, 204, 0.45));
  animation: apkFloat 3s ease-in-out infinite;

  svg {
    width: 100%;
    height: 100%;
  }
}

.AndroidAppPromo__title {
  margin: 0 0 10px;
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #fff;
  text-shadow: 0 0 18px rgba(0, 255, 255, 0.35);
}

.AndroidAppPromo__text {
  margin: 0 0 20px;
  text-align: center;
  font-size: 0.95rem;
  line-height: 1.5;
  color: rgba(223, 252, 255, 0.88);
}

.AndroidAppPromo__actions {
  display: grid;
  gap: 10px;
}

.AndroidAppPromo__download {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 52px;
  padding: 0 18px;
  border-radius: 14px;
  border: 1px solid rgba(0, 255, 255, 0.55);
  background: linear-gradient(135deg, rgba(0, 255, 204, 0.22), rgba(0, 180, 255, 0.16));
  color: #fff;
  text-decoration: none;
  font-weight: 700;
  font-size: 1rem;
  overflow: hidden;
  box-shadow: 0 0 22px rgba(0, 255, 255, 0.22);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(0, 255, 255, 0.9);
    box-shadow: 0 0 28px rgba(0, 255, 255, 0.35);
  }

  &:active {
    transform: translateY(0);
  }
}

.AndroidAppPromo__download-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.18) 50%, transparent 70%);
  transform: translateX(-120%);
  animation: apkShine 2.8s ease-in-out infinite;
  pointer-events: none;
}

.AndroidAppPromo__later {
  min-height: 42px;
  border: none;
  background: transparent;
  color: rgba(132, 243, 255, 0.75);
  font-size: 0.9rem;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: #84f3ff;
  }
}

.apk-promo-enter-active,
.apk-promo-leave-active {
  transition: opacity 0.28s ease;
}

.apk-promo-enter-active .AndroidAppPromo__card,
.apk-promo-leave-active .AndroidAppPromo__card {
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease;
}

.apk-promo-enter-from,
.apk-promo-leave-to {
  opacity: 0;
}

.apk-promo-enter-from .AndroidAppPromo__card,
.apk-promo-leave-to .AndroidAppPromo__card {
  opacity: 0;
  transform: translateY(28px) scale(0.97);
}

@keyframes apkScan {
  0% { top: -5%; }
  100% { top: 105%; }
}

@keyframes apkFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes apkShine {
  0%, 40% { transform: translateX(-120%); }
  70%, 100% { transform: translateX(120%); }
}
</style>
