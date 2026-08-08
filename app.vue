<template>
  <NuxtPwaManifest />
  <div class="app-shell">
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
</template>

<script setup>
const route = useRoute()

const isPlayerRoute = computed(() => {
  const path = route.path
  return path === '/' || path.startsWith('/play')
})
</script>

<style>
.app-shell {
  position: relative;
  min-height: 100vh;
}

.app-chrome {
  position: relative;
  z-index: 2;
}

/* Let clicks reach the player under the transparent layout chrome. */
.app-chrome.chrome-passthrough {
  pointer-events: none;
}

.app-chrome.chrome-passthrough .HeaderMain .inner-header,
.app-chrome.chrome-passthrough .HeaderMain .user-menu {
  pointer-events: auto;
}
</style>
