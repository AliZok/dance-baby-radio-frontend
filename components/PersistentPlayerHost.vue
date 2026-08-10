<script setup>
const route = useRoute()

const isPlayerRoute = computed(() => isPlayerRoutePath(route.path))

const isAuthRoute = computed(() => {
  const path = route.path
  return path === '/login' || path === '/register'
})

// Keep the same PlayerMain instance across player → login/register so audio
// never tears down. Clear when leaving to any other page (e.g. playlists).
const keepPlayerForAuth = useState('persistent-player-for-auth', () => false)

watch(
  () => route.path,
  (path) => {
    const onPlayer = isPlayerRoutePath(path)
    const onAuth = path === '/login' || path === '/register'
    if (onPlayer) {
      keepPlayerForAuth.value = true
    } else if (!onAuth) {
      keepPlayerForAuth.value = false
    }
  },
  { immediate: true },
)

const shouldMount = computed(
  () => isPlayerRoute.value || (keepPlayerForAuth.value && isAuthRoute.value),
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
}
</style>
