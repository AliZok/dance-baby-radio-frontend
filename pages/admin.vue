<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-800 mb-8">Admin Panel</h1>
      
      <!-- Tabs -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors'
            ]"
          >
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div v-if="activeTab === 'add-music'" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">Add Music</h2>
        
        <!-- Music Entries -->
        <div class="space-y-6">
          <div
            v-for="(music, index) in musicEntries"
            :key="index"
            class="border border-gray-200 rounded-lg p-4 bg-gray-50"
          >
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-700">Music Entry #{{ index + 1 }}</h3>
              <button
                v-if="musicEntries.length > 1"
                @click="removeMusicEntry(index)"
                class="text-red-600 hover:text-red-800 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  v-model="music.title"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter song title"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Artist *</label>
                <input
                  v-model="music.artist"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter artist name"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Cover URL</label>
                <input
                  v-model="music.cover"
                  type="url"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/cover.jpg"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Audio URL *</label>
                <input
                  v-model="music.audio"
                  type="url"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/audio.mp3"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                <div class="grid grid-cols-3 gap-2">
                  <label v-for="genreOption in genreOptions" :key="genreOption" class="flex items-center">
                    <input
                      type="checkbox"
                      :value="genreOption"
                      v-model="music.genre"
                      class="mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span class="text-sm text-gray-700 capitalize">{{ genreOption }}</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input
                  v-model="music.duration"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="3:45"
                  pattern="[0-9]{1,2}:[0-9]{2}"
                  title="Format: MM:SS"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Star Rating</label>
                <input
                  v-model="music.star"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="4.6"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <input
                  v-model="music.reference"
                  type="url"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Add Another Music Button -->
        <div class="mt-6 flex justify-center">
          <button
            @click="addMusicEntry"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Add Another Music
          </button>
        </div>

        <!-- Submit Button -->
        <div class="mt-8 flex justify-end space-x-4">
          <button
            @click="clearForm"
            class="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Clear Form
          </button>
          <button
            @click="submitMusic"
            :disabled="isSubmitting"
            class="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="isSubmitting">Submitting...</span>
            <span v-else>Submit All Music</span>
          </button>
        </div>

        <!-- Success/Error Messages -->
        <div v-if="message" :class="[
          'mt-6 p-4 rounded-md',
          messageType === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        ]">
          {{ message }}
        </div>
      </div>

      <!-- Other Tab Contents (placeholder) -->
      <div v-else class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600">This tab content is not yet implemented.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMusicAPI } from '@/composables/useMusicAPI.js'

// Page metadata
definePageMeta({
  layout: 'default',
  title: 'Admin Panel'
})

// Reactive data
const activeTab = ref('add-music')
const isSubmitting = ref(false)
const message = ref('')
const messageType = ref('')

// Tabs configuration
const tabs = [
  { id: 'add-music', name: 'Add Music' },
  { id: 'manage-music', name: 'Manage Music' },
  { id: 'users', name: 'Users' },
  { id: 'settings', name: 'Settings' }
]

// Genre options
const genreOptions = [
  'electronic', 'house', 'pop', 'techno', 'rock', 'metal', 'relax', 'raghsi', 'ambient', 'piano'
]

// Music entries form
const musicEntries = ref([
  {
    title: '',
    artist: '',
    cover: '',
    audio: '',
    genre: [],
    duration: '',
    star: 4.6,
    reference: ''
  }
])

// Methods
const addMusicEntry = () => {
  musicEntries.value.push({
    title: '',
    artist: '',
    cover: '',
    audio: '',
    genre: [],
    duration: '',
    star: 4.6,
    reference: ''
  })
}

const removeMusicEntry = (index) => {
  if (musicEntries.value.length > 1) {
    musicEntries.value.splice(index, 1)
  }
}

const clearForm = () => {
  musicEntries.value = [
    {
      title: '',
      artist: '',
      cover: '',
      audio: '',
      genre: [],
      duration: '',
      star: 4.6,
      reference: ''
    }
  ]
  message.value = ''
  messageType.value = ''
}

const validateMusicEntry = (music) => {
  if (!music.audio.trim()) {
    return 'Audio URL is required'
  }
  
  if (!music.genre || music.genre.length === 0) {
    return 'At least one genre must be selected'
  }
  
  return null
}

const isValidUrl = (string) => {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

const submitMusic = async () => {
  message.value = ''
  messageType.value = ''
  
  // Validate all entries
  const validEntries = []
  const errors = []
  
  musicEntries.value.forEach((music, index) => {
    const error = validateMusicEntry(music)
    if (error) {
      errors.push(`Entry #${index + 1}: ${error}`)
    } else {
        // Only include entries with at least required fields
        if (music.audio.trim() && music.genre.length > 0) {
          validEntries.push({
            title: music.title.trim() || '',
            artist: music.artist.trim() || '',
            cover: music.cover.trim() || '',
            audio: music.audio.trim(),
            genre: Array.isArray(music.genre) ? music.genre.join(' ') : music.genre,
            duration: music.duration.trim() || '',
            star: music.star || 4.6,
            reference: music.reference.trim() || ''
          })
        }
      }
  })
  
  if (errors.length > 0) {
    message.value = errors.join('; ')
    messageType.value = 'error'
    return
  }
  
  if (validEntries.length === 0) {
    message.value = 'Please fill in at least one music entry with audio URL and genre'
    messageType.value = 'error'
    return
  }
  
  // Submit to API
  isSubmitting.value = true
  
  try {
    const { addMultipleMusics } = useMusicAPI()
    const result = await addMultipleMusics(validEntries)
    
    if (result.success) {
      message.value = `Successfully added ${validEntries.length} music entries to the database!`
      messageType.value = 'success'
      
      // Clear form after successful submission
      setTimeout(() => {
        clearForm()
      }, 2000)
    } else {
      message.value = `Error: ${result.error}`
      messageType.value = 'error'
    }
  } catch (error) {
    message.value = `Unexpected error: ${error.message}`
    messageType.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}

// Initialize with one empty entry if array is empty
onMounted(() => {
  if (musicEntries.value.length === 0) {
    addMusicEntry()
  }
})
</script>
