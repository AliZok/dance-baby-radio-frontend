<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex flex-col gap-4 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold text-gray-800">Manage Music</h2>
          <p class="text-sm text-gray-500 mt-1">
            {{ rangeLabel }}
          </p>
        </div>
        <button
          type="button"
          class="self-start sm:self-auto px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          :disabled="isLoading"
          @click="loadMusics"
        >
          Refresh
        </button>
      </div>

      <div class="relative">
        <input
          v-model="searchInput"
          type="search"
          autocomplete="off"
          placeholder="Search title, artist, genre or id..."
          class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          v-if="searchInput"
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 px-1"
          aria-label="Clear search"
          @click="clearSearch"
        >
          ×
        </button>
      </div>
    </div>

    <p v-if="playError" class="mb-4 text-sm text-red-600">{{ playError }}</p>

    <div v-if="isLoading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <div
        v-for="n in 10"
        :key="n"
        class="rounded-xl border border-gray-200 overflow-hidden animate-pulse"
      >
        <div class="aspect-square bg-gray-200"></div>
        <div class="p-3 space-y-2">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-3 bg-gray-100 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {{ error }}
    </div>

    <div v-else-if="!musics.length" class="text-center py-16 text-gray-500">
      {{ searchQuery ? 'No music matched this search.' : 'No music found.' }}
    </div>

    <div v-else>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <article
          v-for="music in musics"
          :key="music.id"
          class="group rounded-xl border overflow-hidden bg-white transition-shadow"
          :class="isActiveTrack(music)
            ? 'border-blue-500 shadow-md ring-1 ring-blue-200'
            : 'border-gray-200 hover:shadow-md'"
        >
          <div class="relative">
            <button
              type="button"
              class="relative block w-full aspect-square bg-gray-100"
              :disabled="!hasAudio(music) || playBusy"
              :title="playButtonTitle(music)"
              @click="toggleTrack(music)"
            >
              <img
                :src="coverSrc(music)"
                :alt="music.title || 'Cover'"
                class="absolute inset-0 w-full h-full object-cover"
                @error="onCoverError($event)"
              />
              <span
                class="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors"
                :class="{ 'bg-black/45': isActiveTrack(music) }"
              ></span>
              <span class="absolute inset-0 flex items-center justify-center">
                <span class="w-12 h-12 rounded-full bg-white/95 text-blue-600 flex items-center justify-center shadow">
                  <span
                    v-if="isActiveTrack(music) && isPlaying"
                    class="flex items-center gap-[3px]"
                  >
                    <span class="w-[3px] h-3.5 bg-blue-600 rounded-sm"></span>
                    <span class="w-[3px] h-3.5 bg-blue-600 rounded-sm"></span>
                  </span>
                  <span
                    v-else
                    class="ml-0.5 w-0 h-0 border-y-[7px] border-y-transparent border-l-[12px] border-l-blue-600"
                  ></span>
                </span>
              </span>
              <span
                v-if="!music.is_active"
                class="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-gray-800/80 text-white"
              >
                Inactive
              </span>
            </button>

            <button
              type="button"
              class="absolute top-2 right-2 z-10 px-2 py-1 rounded text-[11px] font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              :disabled="deletingId === music.id"
              title="Delete from database"
              @click.stop="confirmDelete(music)"
            >
              {{ deletingId === music.id ? '...' : 'Delete' }}
            </button>
          </div>

          <div class="p-3">
            <h3 class="text-sm font-semibold text-gray-900 truncate" :title="music.title">
              {{ music.title || 'Untitled' }}
            </h3>
            <p class="text-xs text-gray-500 truncate mt-0.5" :title="music.artist">
              {{ music.artist || 'Unknown artist' }}
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-400">
              <span v-if="music.genre" class="truncate max-w-[8rem]">{{ music.genre }}</span>
              <span v-if="music.duration">{{ music.duration }}</span>
              <span>#{{ music.id }}</span>
            </div>
            <input
              v-if="isActiveTrack(music)"
              type="range"
              class="mt-2 w-full h-1.5 accent-blue-600 cursor-pointer"
              min="0"
              step="0.1"
              :max="sliderMax"
              :value="currentTime"
              :disabled="!duration"
              @input="onSeekInput"
              @change="onSeekChange"
            />
          </div>
        </article>
      </div>

      <div class="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-sm text-gray-500">{{ rangeLabel }}</p>
        <nav class="flex flex-wrap items-center justify-center gap-1" aria-label="Pagination">
          <button
            type="button"
            class="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="currentPage <= 1 || isLoading"
            @click="goToPage(currentPage - 1)"
          >
            Prev
          </button>
          <template v-for="(page, index) in visiblePages" :key="page">
            <span
              v-if="index > 0 && page - visiblePages[index - 1] > 1"
              class="px-1 text-gray-400"
            >…</span>
            <button
              type="button"
              class="min-w-[2.25rem] px-2 py-1.5 text-sm rounded-md border"
              :class="page === currentPage
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'"
              :disabled="isLoading"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </template>
          <button
            type="button"
            class="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="currentPage >= totalPages || isLoading"
            @click="goToPage(currentPage + 1)"
          >
            Next
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
const PAGE_SIZE = 50
const FALLBACK_COVER = '/images/background-dance-1.jpg'

const { getMusicsPaginated, deleteMusicById } = useMusicAPI()
const { requestPauseMainPlayer } = useMainPlayerBridge()
const { toast } = useToast()

const musics = ref([])
const currentPage = ref(1)
const totalCount = ref(0)
const isLoading = ref(false)
const error = ref(null)
const searchInput = ref('')
const searchQuery = ref('')
const deletingId = ref(null)
const playError = ref('')

const activeTrackId = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const isSeeking = ref(false)
const playBusy = ref(false)

let previewAudio = null
let searchTimer = null

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)))

const rangeLabel = computed(() => {
  if (!totalCount.value) {
    return searchQuery.value ? 'No search results' : '0 tracks'
  }
  const start = (currentPage.value - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage.value * PAGE_SIZE, totalCount.value)
  const prefix = searchQuery.value ? `Search “${searchQuery.value}”: ` : ''
  return `${prefix}Showing ${start}–${end} of ${totalCount.value} (50 per page)`
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages = new Set([1, total])
  for (let page = current - 2; page <= current + 2; page++) {
    if (page >= 1 && page <= total) pages.add(page)
  }
  return [...pages].sort((a, b) => a - b)
})

const sliderMax = computed(() => {
  const value = Number(duration.value)
  return value && !Number.isNaN(value) ? value : 1
})

const isActiveTrack = (music) => music?.id === activeTrackId.value

const toPlayableAudioUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return ''
  const trimmed = raw.trim()
  if (!trimmed) return ''

  try {
    const url = new URL(trimmed)
    url.pathname = url.pathname
      .split('/')
      .map((part) => {
        if (!part) return part
        try {
          return encodeURIComponent(decodeURIComponent(part))
        } catch {
          return encodeURIComponent(part)
        }
      })
      .join('/')
    return url.toString()
  } catch {
    return trimmed.replace(/ /g, '%20').replace(/#/g, '%23')
  }
}

const hasAudio = (music) => Boolean(toPlayableAudioUrl(music?.audio || music?.audio_url))

const playButtonTitle = (music) => {
  if (!hasAudio(music)) return 'No audio'
  return isActiveTrack(music) && isPlaying.value ? 'Pause' : 'Play'
}

const coverSrc = (music) => music?.cover || FALLBACK_COVER

const onCoverError = (event) => {
  const img = event.target
  if (img.dataset.fallback) return
  img.dataset.fallback = '1'
  img.src = FALLBACK_COVER
}

const bindPreviewAudio = (audio) => {
  audio.preload = 'auto'
  audio.referrerPolicy = 'no-referrer'
  audio.addEventListener('timeupdate', onTimeUpdate)
  audio.addEventListener('loadedmetadata', onLoadedMetadata)
  audio.addEventListener('ended', onEnded)
  audio.addEventListener('play', () => { isPlaying.value = true })
  audio.addEventListener('pause', () => { isPlaying.value = false })
  audio.addEventListener('error', onAudioError)
}

const getPreviewAudio = () => {
  if (!import.meta.client) return null
  if (!previewAudio) {
    previewAudio = new Audio()
    bindPreviewAudio(previewAudio)
  }
  return previewAudio
}

const mediaErrorMessage = (audio) => {
  const code = audio?.error?.code
  if (code === MediaError.MEDIA_ERR_ABORTED) return 'Playback was aborted.'
  if (code === MediaError.MEDIA_ERR_NETWORK) return 'Network error while loading audio.'
  if (code === MediaError.MEDIA_ERR_DECODE) return 'Audio file could not be decoded.'
  if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) return 'Audio URL is missing or not supported.'
  return 'Could not play this track.'
}

const onAudioError = () => {
  playError.value = mediaErrorMessage(previewAudio)
  isPlaying.value = false
  playBusy.value = false
}

const stopPlayback = () => {
  if (previewAudio) {
    previewAudio.pause()
    previewAudio.removeAttribute('src')
    previewAudio.load()
  }
  activeTrackId.value = null
  isPlaying.value = false
  currentTime.value = 0
  duration.value = 0
  isSeeking.value = false
  playError.value = ''
}

const playTrack = async (music) => {
  const src = toPlayableAudioUrl(music?.audio || music?.audio_url)
  const audio = getPreviewAudio()
  if (!src || !audio) {
    playError.value = 'This track has no playable audio URL.'
    return
  }

  playBusy.value = true
  playError.value = ''

  try {
    requestPauseMainPlayer()

    if (activeTrackId.value !== music.id || (audio.getAttribute('src') || '') !== src) {
      activeTrackId.value = music.id
      currentTime.value = 0
      duration.value = 0
      audio.src = src
    }

    await audio.play()
    isPlaying.value = true
  } catch (err) {
    if (err?.name === 'AbortError') {
      try {
        await audio.play()
        isPlaying.value = true
        return
      } catch (retryErr) {
        playError.value = retryErr?.message || 'Could not play this track.'
        isPlaying.value = false
      }
    } else {
      console.error('playTrack failed:', err)
      playError.value = err?.message || mediaErrorMessage(audio)
      isPlaying.value = false
    }
  } finally {
    playBusy.value = false
  }
}

const pauseTrack = () => {
  previewAudio?.pause()
  isPlaying.value = false
}

const toggleTrack = async (music) => {
  if (!hasAudio(music)) {
    playError.value = 'This track has no playable audio URL.'
    return
  }
  if (isActiveTrack(music) && isPlaying.value) {
    pauseTrack()
    return
  }
  await playTrack(music)
}

const onTimeUpdate = () => {
  if (isSeeking.value || !previewAudio) return
  currentTime.value = previewAudio.currentTime || 0
}

const onLoadedMetadata = () => {
  if (!previewAudio) return
  duration.value = previewAudio.duration || 0
}

const onEnded = () => {
  isPlaying.value = false
  currentTime.value = 0
  if (previewAudio) previewAudio.currentTime = 0
}

const onSeekInput = (event) => {
  isSeeking.value = true
  const next = Number(event.target.value) || 0
  currentTime.value = next
  if (previewAudio) previewAudio.currentTime = next
}

const onSeekChange = (event) => {
  const next = Number(event.target.value) || 0
  currentTime.value = next
  if (previewAudio) previewAudio.currentTime = next
  isSeeking.value = false
}

const loadMusics = async () => {
  isLoading.value = true
  error.value = null
  stopPlayback()

  try {
    const { data, error: fetchError, count } = await getMusicsPaginated({
      page: currentPage.value,
      pageSize: PAGE_SIZE,
      search: searchQuery.value,
    })

    if (fetchError) {
      error.value = fetchError.message || 'Unable to load musics.'
      musics.value = []
      totalCount.value = 0
    } else {
      totalCount.value = count || 0
      const lastPage = Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE) || 1)
      if (currentPage.value > lastPage) {
        currentPage.value = lastPage
        return
      }
      musics.value = data || []
    }
  } catch (err) {
    error.value = err.message || 'Unexpected error while fetching musics.'
    musics.value = []
    totalCount.value = 0
  } finally {
    isLoading.value = false
  }
}

const goToPage = (page) => {
  const next = Math.min(totalPages.value, Math.max(1, page))
  if (next === currentPage.value) return
  currentPage.value = next
}

const clearSearch = () => {
  searchInput.value = ''
  searchQuery.value = ''
  currentPage.value = 1
}

const confirmDelete = async (music) => {
  const label = music?.title || `#${music?.id}`
  const ok = window.confirm(`Delete "${label}" permanently from the database? This cannot be undone.`)
  if (!ok) return

  deletingId.value = music.id
  try {
    if (isActiveTrack(music)) stopPlayback()
    const result = await deleteMusicById(music.id)
    if (!result.success) {
      toast.error(result.error || 'Could not delete this track.', { title: 'Delete Music' })
      return
    }
    toast.success('Track deleted from the database.', { title: 'Delete Music' })
    musics.value = musics.value.filter((item) => item.id !== music.id)
    totalCount.value = Math.max(0, totalCount.value - 1)
    if (!musics.value.length && currentPage.value > 1) {
      currentPage.value -= 1
    } else if (!musics.value.length) {
      await loadMusics()
    }
  } finally {
    deletingId.value = null
  }
}

watch(searchInput, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    searchQuery.value = value.trim()
    currentPage.value = 1
  }, 350)
})

watch([currentPage, searchQuery], loadMusics, { immediate: true })

onBeforeUnmount(() => {
  clearTimeout(searchTimer)
  stopPlayback()
  if (previewAudio) {
    previewAudio.removeEventListener('timeupdate', onTimeUpdate)
    previewAudio.removeEventListener('loadedmetadata', onLoadedMetadata)
    previewAudio.removeEventListener('ended', onEnded)
    previewAudio.removeEventListener('error', onAudioError)
    previewAudio = null
  }
})
</script>
