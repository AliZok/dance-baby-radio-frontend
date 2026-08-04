<template>
  <section class="playlists-page">
    <div class="playlists-shell">
      <header class="page-header">
        <div>
          <h1 class="font-days title">{{ selectedPlaylist ? selectedPlaylist.name : 'Playlists' }}</h1>
          <p class="subtitle">
            <template v-if="selectedPlaylist">
              {{ tracks.length }} track{{ tracks.length === 1 ? '' : 's' }} in this playlist
            </template>
            <template v-else>
              Your personal collections
            </template>
          </p>
        </div>

        <button
          v-if="selectedPlaylist"
          type="button"
          class="back-btn"
          @click="closePlaylist"
        >
          ← Back
        </button>
      </header>

      <div class="content-panel">
        <button
          v-if="authReady && isLoggedIn && !selectedPlaylist"
          type="button"
          class="add-btn"
          title="Create playlist"
          @click="openCreateModal"
        >
          +
        </button>

        <!-- Auth gate -->
        <div v-if="!authReady" class="state">Loading...</div>

        <div v-else-if="!isLoggedIn" class="empty-block">
          <div class="empty-icon">♪</div>
          <h3>Login required</h3>
          <p>Sign in to view and manage your playlists.</p>
          <button type="button" class="primary-btn" @click="goToLogin">
            Login
          </button>
        </div>

        <!-- Loading -->
        <div v-else-if="isLoading" class="state">Loading...</div>

        <!-- Error -->
        <div v-else-if="error" class="state error">{{ error }}</div>

        <!-- Playlist detail: tracks -->
        <div v-else-if="selectedPlaylist" class="tracks-view">
          <div v-if="tracksLoading" class="state">Loading tracks...</div>
          <div v-else-if="!tracks.length" class="empty-block">
            <div class="empty-icon">♪</div>
            <h3>No tracks yet</h3>
            <p>This playlist is empty. Tracks you add will show up here.</p>
          </div>
          <ul v-else class="track-list">
            <li
              v-for="track in tracks"
              :key="track.rowId || track.id"
              class="track-row"
              :class="{ 'is-active': isActiveTrack(track) }"
            >
              <button
                type="button"
                class="track-cover"
                :class="{ playing: isActiveTrack(track) && isPlaying }"
                :disabled="!track.audio || playBusy"
                :title="isActiveTrack(track) && isPlaying ? 'Pause' : 'Play'"
                @click="toggleTrack(track)"
              >
                <span class="play-icon" :class="{ paused: isActiveTrack(track) && isPlaying }"></span>
              </button>

              <div class="track-main">
                <div class="track-info">
                  <div class="track-title">{{ track.title || 'Untitled' }}</div>
                  <div class="track-meta">
                    <span v-if="track.artist">{{ track.artist }}</span>
                    <span v-if="track.genre">{{ track.genre }}</span>
                  </div>
                </div>

                <div class="track-timeline" :class="{ visible: isActiveTrack(track) }">
                  <input
                    type="range"
                    class="track-slider"
                    min="0"
                    step="0.1"
                    :max="isActiveTrack(track) ? sliderMax : 1"
                    :value="isActiveTrack(track) ? currentTime : 0"
                    :style="isActiveTrack(track) ? sliderProgressStyle : undefined"
                    :disabled="!isActiveTrack(track) || !duration"
                    @input="onSeekInput($event)"
                    @change="onSeekChange($event)"
                  />
                </div>
              </div>
            </li>
          </ul>

          <audio
            ref="audioEl"
            preload="metadata"
            @timeupdate="onTimeUpdate"
            @loadedmetadata="onLoadedMetadata"
            @ended="onEnded"
            @play="isPlaying = true"
            @pause="isPlaying = false"
          />
        </div>

        <!-- Playlists grid -->
        <div v-else class="grid-view">
          <div v-if="!playlists.length" class="empty-block">
            <div class="empty-icon">＋</div>
            <h3>No playlists yet</h3>
            <p>You don't have any playlists. Tap the + button to create your first one.</p>
            <button type="button" class="primary-btn" @click="openCreateModal">
              Create playlist
            </button>
          </div>

          <div v-else class="playlist-grid">
            <button
              v-for="playlist in playlists"
              :key="playlist.id"
              type="button"
              class="playlist-card"
              @click="openPlaylist(playlist)"
            >
              <div class="card-art">
                <div class="card-glow"></div>
                <span class="card-initial">{{ playlistInitial(playlist.name) }}</span>
              </div>
              <div class="card-body">
                <div class="card-name">{{ playlist.name || 'Untitled' }}</div>
                <div class="card-count">
                  {{ playlist.trackCount }} track{{ playlist.trackCount === 1 ? '' : 's' }}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create modal -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="modal-backdrop" @click.self="closeCreateModal">
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="create-playlist-title">
          <h2 id="create-playlist-title">New playlist</h2>
          <p class="modal-sub">Give your playlist a name</p>

          <form @submit.prevent="handleCreatePlaylist">
            <input
              ref="nameInput"
              v-model="newPlaylistName"
              type="text"
              maxlength="80"
              placeholder="e.g. Night Drive"
              class="modal-input"
              :disabled="creating"
            />

            <p v-if="createError" class="create-error">{{ createError }}</p>

            <div class="modal-actions">
              <button type="button" class="ghost-btn" :disabled="creating" @click="closeCreateModal">
                Cancel
              </button>
              <button type="submit" class="primary-btn" :disabled="creating || !newPlaylistName.trim()">
                {{ creating ? 'Creating...' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
definePageMeta({
  layout: 'default',
})

const router = useRouter()
const { isLoggedIn, initAuth } = useSupabase()
const {
  getUserPlaylists,
  createPlaylist,
  getPlaylistTracks,
} = usePlaylistsAPI()

const playlists = ref([])
const selectedPlaylist = ref(null)
const tracks = ref([])
const isLoading = ref(false)
const tracksLoading = ref(false)
const error = ref(null)
const authReady = ref(false)

const audioEl = ref(null)
const activeTrackId = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const isSeeking = ref(false)
const playBusy = ref(false)

const trackKey = (track) => track?.rowId || track?.id || null

const isActiveTrack = (track) => trackKey(track) === activeTrackId.value

const sliderMax = computed(() => {
  const value = Number(duration.value)
  return value && !Number.isNaN(value) ? value : 1
})

const sliderProgressStyle = computed(() => {
  const max = sliderMax.value
  const progress = max > 0 ? Math.min(100, (Number(currentTime.value) / max) * 100) : 0
  return {
    background: `linear-gradient(to right, rgba(132, 243, 255, 0.85) ${progress}%, rgba(132, 243, 255, 0.18) ${progress}%)`,
  }
})

const stopPlayback = () => {
  const audio = audioEl.value
  if (audio) {
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
  }
  activeTrackId.value = null
  isPlaying.value = false
  currentTime.value = 0
  duration.value = 0
  isSeeking.value = false
}

const playTrack = async (track) => {
  if (!track?.audio || !audioEl.value) return

  playBusy.value = true
  try {
    const audio = audioEl.value
    const key = trackKey(track)

    if (activeTrackId.value !== key) {
      activeTrackId.value = key
      currentTime.value = 0
      duration.value = 0
      audio.src = track.audio
      audio.load()
    }

    await audio.play()
    isPlaying.value = true
  } catch (err) {
    console.error('playTrack failed:', err)
    isPlaying.value = false
  } finally {
    playBusy.value = false
  }
}

const pauseTrack = () => {
  audioEl.value?.pause()
  isPlaying.value = false
}

const toggleTrack = async (track) => {
  if (!track?.audio) return

  if (isActiveTrack(track) && isPlaying.value) {
    pauseTrack()
    return
  }

  await playTrack(track)
}

const onTimeUpdate = () => {
  if (isSeeking.value || !audioEl.value) return
  currentTime.value = audioEl.value.currentTime || 0
}

const onLoadedMetadata = () => {
  if (!audioEl.value) return
  duration.value = audioEl.value.duration || 0
}

const onEnded = () => {
  isPlaying.value = false
  currentTime.value = 0
  if (audioEl.value) audioEl.value.currentTime = 0
}

const onSeekInput = (event) => {
  isSeeking.value = true
  const next = Number(event.target.value) || 0
  currentTime.value = next
  if (audioEl.value) audioEl.value.currentTime = next
}

const onSeekChange = (event) => {
  const next = Number(event.target.value) || 0
  currentTime.value = next
  if (audioEl.value) audioEl.value.currentTime = next
  isSeeking.value = false
}

const goToLogin = () => {
  router.push('/login')
}

const showCreateModal = ref(false)
const newPlaylistName = ref('')
const createError = ref('')
const creating = ref(false)
const nameInput = ref(null)

const playlistInitial = (name = '') => {
  const cleaned = name.trim()
  return cleaned ? cleaned.charAt(0).toUpperCase() : '?'
}

const loadPlaylists = async () => {
  isLoading.value = true
  error.value = null

  const { data, error: fetchError } = await getUserPlaylists()
  if (fetchError) {
    error.value = fetchError
    playlists.value = []
  } else {
    playlists.value = data || []
  }

  isLoading.value = false
}

const openPlaylist = async (playlist) => {
  stopPlayback()
  selectedPlaylist.value = playlist
  tracks.value = []
  tracksLoading.value = true
  error.value = null

  const { data, error: tracksError } = await getPlaylistTracks(playlist.id)
  if (tracksError) {
    error.value = tracksError
    tracks.value = []
  } else {
    tracks.value = data || []
  }

  tracksLoading.value = false
}

const closePlaylist = () => {
  stopPlayback()
  selectedPlaylist.value = null
  tracks.value = []
  error.value = null
}

const openCreateModal = async () => {
  createError.value = ''
  newPlaylistName.value = ''
  showCreateModal.value = true
  await nextTick()
  nameInput.value?.focus()
}

const closeCreateModal = () => {
  if (creating.value) return
  showCreateModal.value = false
  createError.value = ''
  newPlaylistName.value = ''
}

const handleCreatePlaylist = async () => {
  createError.value = ''
  creating.value = true

  const { data, error: createErr } = await createPlaylist({
    name: newPlaylistName.value,
  })

  creating.value = false

  if (createErr) {
    createError.value = createErr
    return
  }

  playlists.value = [data, ...playlists.value]
  showCreateModal.value = false
  newPlaylistName.value = ''
}

onMounted(async () => {
  await initAuth()
  authReady.value = true
  if (!isLoggedIn.value) return
  await loadPlaylists()
})

onBeforeUnmount(() => {
  stopPlayback()
})
</script>

<style scoped>
.playlists-page {
  min-height: 100vh;
  padding: 84px 20px 48px;
  color: #e8fbff;
  background:
    radial-gradient(ellipse at top right, rgba(40, 120, 140, 0.22), transparent 45%),
    radial-gradient(ellipse at bottom left, rgba(10, 50, 60, 0.35), transparent 50%),
    linear-gradient(165deg, #06161b 0%, #0a2228 52%, #07141a 100%);
}

.playlists-shell {
  max-width: 980px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.title {
  margin: 0;
  color: #94d4e3;
  font-size: 34px;
  letter-spacing: 1px;
}

.subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  opacity: 0.7;
}

.back-btn {
  border: 1px solid rgba(132, 243, 255, 0.25);
  background: rgba(8, 40, 44, 0.65);
  color: #84f3ff;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.back-btn:hover {
  background: rgba(8, 40, 44, 0.9);
  border-color: rgba(132, 243, 255, 0.45);
}

.content-panel {
  position: relative;
  min-height: 420px;
  padding: 68px 22px 22px;
  border-radius: 18px;
  border: 1px solid rgba(132, 243, 255, 0.16);
  background: rgba(8, 40, 44, 0.42);
  backdrop-filter: blur(12px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
}

.add-btn {
  position: absolute;
  top: 14px;
  left: 14px;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid rgba(132, 243, 255, 0.35);
  background: rgba(132, 243, 255, 0.14);
  color: #84f3ff;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  z-index: 2;
}

.add-btn:hover {
  transform: translateY(-1px) scale(1.04);
  background: rgba(132, 243, 255, 0.28);
  box-shadow: 0 0 18px rgba(132, 243, 255, 0.2);
}

.state {
  padding: 28px 18px;
  text-align: center;
  border-radius: 12px;
  border: 1px dashed rgba(132, 243, 255, 0.18);
  background: rgba(0, 0, 0, 0.18);
}

.state.error {
  color: #ff8da3;
  border-style: solid;
}

.empty-block {
  max-width: 420px;
  margin: 40px auto;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 14px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 28px;
  color: #84f3ff;
  border: 1px solid rgba(132, 243, 255, 0.25);
  background: rgba(132, 243, 255, 0.08);
}

.empty-block h3 {
  margin: 0 0 8px;
  font-size: 20px;
}

.empty-block p {
  margin: 0 0 18px;
  opacity: 0.7;
  line-height: 1.5;
  font-size: 14px;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.playlist-card {
  appearance: none;
  border: 1px solid rgba(132, 243, 255, 0.14);
  background: rgba(6, 28, 34, 0.72);
  border-radius: 16px;
  padding: 12px;
  text-align: left;
  color: inherit;
  cursor: pointer;
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.playlist-card:hover {
  transform: translateY(-4px);
  border-color: rgba(132, 243, 255, 0.4);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.28);
}

.card-art {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background:
    linear-gradient(145deg, rgba(132, 243, 255, 0.22), rgba(8, 40, 44, 0.9) 55%, rgba(3, 18, 24, 0.95));
  border: 1px solid rgba(132, 243, 255, 0.12);
}

.card-glow {
  position: absolute;
  inset: -30% auto auto -20%;
  width: 70%;
  height: 70%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(132, 243, 255, 0.35), transparent 70%);
  pointer-events: none;
}

.card-initial {
  position: relative;
  z-index: 1;
  font-family: days, sans-serif;
  font-size: 42px;
  color: #d8f6ff;
  text-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
}

.card-body {
  margin-top: 10px;
}

.card-name {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-count {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.65;
}

.track-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.track-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(132, 243, 255, 0.1);
  background: rgba(6, 28, 34, 0.55);
  transition: background 0.2s ease, border-color 0.2s ease;
}

.track-row:hover {
  background: rgba(6, 28, 34, 0.8);
  border-color: rgba(132, 243, 255, 0.24);
}

.track-row.is-active {
  border-color: rgba(132, 243, 255, 0.4);
  background: rgba(8, 40, 44, 0.85);
}

.track-cover {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  padding: 0;
  border-radius: 10px;
  border: 1px solid rgba(132, 243, 255, 0.35);
  background: rgba(132, 243, 255, 0.14);
  color: #84f3ff;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.track-cover:hover:not(:disabled) {
  background: rgba(132, 243, 255, 0.28);
  border-color: rgba(132, 243, 255, 0.55);
  transform: scale(1.04);
}

.track-cover:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.track-cover.playing {
  background: rgba(132, 243, 255, 0.32);
  border-color: rgba(132, 243, 255, 0.6);
}

.play-icon {
  width: 0;
  height: 0;
  margin-left: 2px;
  border-style: solid;
  border-width: 7px 0 7px 12px;
  border-color: transparent transparent transparent #84f3ff;
  transition: border-width 0.15s ease, width 0.15s ease, height 0.15s ease, margin 0.15s ease;
}

.play-icon.paused {
  width: 12px;
  height: 14px;
  margin-left: 0;
  border: none;
  background:
    linear-gradient(#84f3ff, #84f3ff) 0 0 / 3.5px 100% no-repeat,
    linear-gradient(#84f3ff, #84f3ff) 8.5px 0 / 3.5px 100% no-repeat;
}

.track-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.track-title {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.65;
}

.track-timeline {
  opacity: 0.45;
  transition: opacity 0.2s ease;
}

.track-timeline.visible {
  opacity: 1;
}

.track-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 5px;
  border-radius: 5px;
  background: rgba(132, 243, 255, 0.18);
  outline: none;
  cursor: pointer;
}

.track-row.is-active .track-slider {
  background: rgba(132, 243, 255, 0.18);
}

.track-slider:disabled {
  cursor: default;
}

.track-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #84f3ff;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(132, 243, 255, 0.35);
}

.track-slider:disabled::-webkit-slider-thumb {
  background: rgba(132, 243, 255, 0.35);
  box-shadow: none;
  cursor: default;
}

.track-slider::-moz-range-thumb {
  width: 13px;
  height: 13px;
  border: 0;
  border-radius: 50%;
  background: #84f3ff;
  cursor: pointer;
}

.track-slider:disabled::-moz-range-thumb {
  background: rgba(132, 243, 255, 0.35);
  cursor: default;
}

.primary-btn,
.ghost-btn {
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s ease, opacity 0.2s ease;
}

.primary-btn {
  border: 1px solid rgba(132, 243, 255, 0.35);
  background: rgba(132, 243, 255, 0.28);
  color: #fff;
}

.primary-btn:hover:not(:disabled) {
  background: rgba(132, 243, 255, 0.5);
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ghost-btn {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: #cfeef5;
}

.ghost-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.06);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(4px);
}

.modal-card {
  width: 100%;
  max-width: 400px;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba(132, 243, 255, 0.22);
  background: rgba(6, 28, 34, 0.96);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
  animation: modal-in 0.25s ease;
}

.modal-card h2 {
  margin: 0;
  font-size: 20px;
}

.modal-sub {
  margin: 6px 0 18px;
  opacity: 0.65;
  font-size: 13px;
}

.modal-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(132, 243, 255, 0.2);
  background: rgba(16, 25, 26, 0.85);
  color: #fff;
  outline: none;
}

.modal-input:focus {
  border-color: rgba(132, 243, 255, 0.55);
}

.create-error {
  margin: 10px 0 0;
  color: #ff8da3;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 640px) {
  .title {
    font-size: 28px;
  }

  .content-panel {
    padding: 68px 14px 14px;
  }

  .playlist-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .track-row {
    gap: 10px;
    padding: 10px;
  }

  .track-cover {
    width: 44px;
    height: 44px;
  }
}
</style>
