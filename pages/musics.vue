<template>
  <section class="musics-page">
    <h1>Music Library</h1>
    <p class="status">Status: {{ statusMessage }}</p>
    <div v-if="isLoading">Loading musics from Supabase...</div>
    <div v-else-if="error" class="error">Error loading musics: {{ error }}</div>
    <div v-else>
      <p>{{ musics.length }} tracks loaded.</p>
      <ul class="music-list">
        <li v-for="music in musics" :key="music.id" class="music-item">
          <strong>{{ music.title }}</strong>
          <span v-if="music.artist"> — {{ music.artist }}</span>
          <div class="music-meta">
            <span v-if="music.genre">Genre: {{ music.genre }}</span>
            <span v-if="music.duration">Duration: {{ music.duration }}</span>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useMusicAPI } from '@/composables/useMusicAPI'
import storeSimple from '@/store/storeSimple'

const musics = ref([])
const isLoading = ref(true)
const error = ref(null)
const statusMessage = ref('ali start')

const { getMusics } = useMusicAPI()

const pickQueuedTracks = (loadedMusics) => {
  const availableTracks = (loadedMusics || []).filter((track) => track?.audio)
  if (!availableTracks.length) return

  const origin = availableTracks[Math.floor(Math.random() * availableTracks.length)]
  let support = availableTracks[Math.floor(Math.random() * availableTracks.length)]

  if (!support || support.audio === origin.audio || support.id === origin.id) {
    support = availableTracks.find((track) => track.audio !== origin.audio && track.id !== origin.id) || origin
  }

  storeSimple.value.musicList = availableTracks
  storeSimple.value.currentOriginTrack = origin
  storeSimple.value.currentSupportTrack = support
}

const loadMusics = async () => {
  console.log('ali start')
  statusMessage.value = 'ali start'
  isLoading.value = true
  error.value = null

  try {
    const { data, error: fetchError } = await getMusics()
    if (fetchError) {
      error.value = fetchError.message || 'Unable to load musics.'
      musics.value = []
    } else {
      musics.value = data || []
      pickQueuedTracks(musics.value)
    }
  } catch (err) {
    error.value = err.message || 'Unexpected error while fetching musics.'
    musics.value = []
  } finally {
    isLoading.value = false
    console.log('ali finish')
    statusMessage.value = 'ali finish'
  }
}

onMounted(loadMusics)
</script>

<style scoped>
.musics-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}
.music-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.music-item {
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.music-meta {
  font-size: 0.95rem;
  opacity: 0.8;
  margin-top: 6px;
}
.error {
  color: #ff6b6b;
}
</style>
