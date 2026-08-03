<template>
  <section class="playlists-page">
    <div class="playlists-inner">
      <h1 class="font-days title">Playlists</h1>
      <p class="subtitle">Your tracks from Dance Baby Radio</p>

      <div v-if="isLoading" class="state">Loading playlists...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>
      <div v-else-if="!musics.length" class="state">No tracks found.</div>
      <ul v-else class="music-list">
        <li v-for="music in musics" :key="music.id" class="music-item">
          <div class="music-main">
            <strong>{{ music.title || 'Untitled' }}</strong>
            <span v-if="music.artist" class="artist"> — {{ music.artist }}</span>
          </div>
          <div class="music-meta">
            <span v-if="music.genre">{{ music.genre }}</span>
            <span v-if="music.duration">{{ music.duration }}</span>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
definePageMeta({
  layout: 'default',
})

const musics = ref([])
const isLoading = ref(true)
const error = ref(null)
const { getMusics } = useMusicAPI()
const { isLoggedIn, initAuth } = useSupabase()
const router = useRouter()

const loadMusics = async () => {
  isLoading.value = true
  error.value = null

  try {
    const { data, error: fetchError } = await getMusics()
    if (fetchError) {
      error.value = fetchError.message || 'Unable to load playlists.'
      musics.value = []
    } else {
      musics.value = data || []
    }
  } catch (err) {
    error.value = err.message || 'Unexpected error while fetching playlists.'
    musics.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await initAuth()
  if (!isLoggedIn.value) {
    await router.push('/login')
    return
  }
  await loadMusics()
})
</script>

<style scoped>
.playlists-page {
  min-height: 100vh;
  padding: 80px 20px 40px;
  background:
    radial-gradient(ellipse at top, rgba(20, 60, 70, 0.45), transparent 55%),
    linear-gradient(160deg, #06161b 0%, #0a2228 55%, #07141a 100%);
  color: #e8fbff;
}

.playlists-inner {
  max-width: 720px;
  margin: 0 auto;
}

.title {
  color: #94d4e3;
  font-size: 32px;
  margin: 0 0 6px;
}

.subtitle {
  margin: 0 0 28px;
  opacity: 0.7;
  font-size: 14px;
}

.state {
  padding: 18px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(132, 243, 255, 0.12);
}

.error {
  color: #ff8da3;
}

.music-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.music-item {
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(8, 40, 44, 0.55);
  border: 1px solid rgba(132, 243, 255, 0.14);
}

.music-main {
  font-size: 15px;
}

.artist {
  opacity: 0.75;
  font-weight: 400;
}

.music-meta {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.65;
}
</style>
