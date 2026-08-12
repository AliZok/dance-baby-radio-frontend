<template>
  <NuxtPwaManifest />
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

const isPlayerRoute = computed(() => isPlayerRoutePath(route.path))

watch(
  isPlayerRoute,
  (locked) => {
    if (!import.meta.client) return
    document.documentElement.classList.toggle('player-route', locked)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.documentElement.classList.remove('player-route')
})
</script>

<style>
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
