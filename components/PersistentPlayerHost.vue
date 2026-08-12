<script setup>
const route = useRoute()

const isPlayerRoute = computed(() => isPlayerRoutePath(route.path))
const isKeepAliveRoute = computed(() => isPlayerKeepAlivePath(route.path))

// Keep the same PlayerMain instance across player → login/register/playlists
// so audio never tears down. Only set after visiting a player route first —
// cold loads of /playlists etc. do not mount the player (keeps initial load light).
const keepPlayerAlive = useState('persistent-player-for-auth', () => false)

watch(
  () => route.path,
  (path) => {
    if (isPlayerRoutePath(path)) {
      keepPlayerAlive.value = true
    } else if (!isPlayerKeepAlivePath(path)) {
      keepPlayerAlive.value = false
    }
  },
  { immediate: true },
)

const shouldMount = computed(
  () => isPlayerRoute.value || (keepPlayerAlive.value && isKeepAliveRoute.value),
)

const showUi = computed(() => isPlayerRoute.value)
</script>

<template>
  <div
    v-if="shouldMount"
    v-show="showUi"
    class="persistent-player-host"
    :aria-hidden="!showUi"
  >
    <PlayerMain />
  </div>
</template>

<style scoped>
.persistent-player-host {
  position: fixed;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  height: 100%;
  height: 100dvh;
  max-height: 100dvh;
}
</style>
