<template>
  <NuxtPwaManifest />
  <!--
    SSR black boot cover: paints with the first HTML so HeaderMain (brand + menu)
    never flash before ClientOnly PlayerMain / WelcomeModal hydrate.
    Sequence: black → WelcomeModal LOADING → Let's GO
  -->
  <div
    v-if="showBootCover"
    id="dbr-boot-splash"
    class="dbr-boot-splash"
    aria-hidden="true"
  />
  <div class="app-shell" :class="{ 'player-locked': isPlayerRoute }">
    <ClientOnly>
      <PersistentPlayerHost />
    </ClientOnly>
    <div
      class="app-chrome"
      :class="{ 'chrome-passthrough': isPlayerRoute }"
    >
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
  </div>
  <NotificationStack />
  <ClientOnly>
    <AndroidAppPromo />
  </ClientOnly>
</template>

<script setup>
const route = useRoute()
const { introCoverActive, resetIntroGate } = useIntroGate()

const isPlayerRoute = computed(() => isPlayerRoutePath(route.path))

const showBootCover = computed(
  () => isPlayerRoute.value && introCoverActive.value,
)

// Imperative classList — avoid useHead html class (can stick across hydration).
watch(
  isPlayerRoute,
  (locked) => {
    if (!import.meta.client) return
    document.documentElement.classList.toggle('player-route', locked)
    // Drop legacy class from older builds that permanently hid HeaderMain.
    document.documentElement.classList.remove('dbr-intro-pending')
  },
  { immediate: true },
)

// Fresh player entry (e.g. cold / or /play/...): restore black cover until Welcome mounts.
watch(
  () => route.path,
  (path, prev) => {
    if (!isPlayerRoutePath(path)) return
    if (prev && isPlayerRoutePath(prev)) return
    // Coming from auth/playlists with keep-alive player: do not re-flash boot.
    if (prev && isPlayerKeepAlivePath(prev)) return
    resetIntroGate()
  },
)

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.documentElement.classList.remove('player-route')
})
</script>

<style>
.dbr-boot-splash {
  position: fixed;
  inset: 0;
  z-index: 1400;
  background: #000;
  pointer-events: none;
}

.app-shell {
  position: relative;
  min-height: 100vh;
}

.app-shell.player-locked {
  height: 100dvh;
  max-height: 100dvh;
  min-height: 0;
  overflow: hidden;
}

.app-chrome {
  position: relative;
  z-index: 2;
}

/* Let clicks reach the player under the transparent layout chrome. */
.app-chrome.chrome-passthrough {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.app-chrome.chrome-passthrough .HeaderMain .inner-header,
.app-chrome.chrome-passthrough .HeaderMain .user-menu {
  pointer-events: auto;
}

/* Off-canvas menu must not steal taps while hidden on mobile. */
@media only screen and (max-width: 768px) {
  .app-chrome.chrome-passthrough .HeaderMain .user-menu.mobile-offcanvas {
    pointer-events: none;
  }
}

html.player-route,
html.player-route body {
  overflow: hidden !important;
  overscroll-behavior: none;
  height: 100%;
  max-height: 100dvh;
}
</style>
