<template>
  <div v-if="!isReady" class="min-h-screen bg-gray-50 flex items-center justify-center">
    <p class="text-gray-500 text-sm">Loading...</p>
  </div>

  <div v-else-if="!isAuthenticated" class="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div class="w-full max-w-sm bg-white rounded-lg shadow p-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-2 text-center">Admin Login</h1>
      <p class="text-sm text-gray-500 mb-6 text-center">Enter the admin password to continue</p>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            v-model="adminPassword"
            type="password"
            autocomplete="current-password"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Admin password"
          />
        </div>

        <p v-if="loginError" class="text-sm text-red-600">{{ loginError }}</p>

        <button
          type="submit"
          :disabled="isLoggingIn || !adminPassword"
          class="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isLoggingIn ? 'Checking...' : 'Enter Admin' }}
        </button>
      </form>
    </div>
  </div>

  <div v-else class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8 gap-4">
        <h1 class="text-3xl font-bold text-gray-800">Admin Panel</h1>
        <button
          type="button"
          @click="handleLogout"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Logout
        </button>
      </div>
      
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

      <!-- Upload List Tab Content -->
      <div v-else-if="activeTab === 'upload-list'" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">آپلود لیست گروهی موزیک</h2>
        
        <div class="mb-6">
          <p class="text-gray-600 mb-4">
            لیست موزیک‌ها را در فرمت JSON array در textarea زیر بنویسید و ارسال کنید.
          </p>
          
          <!-- Example Format -->
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 class="text-sm font-medium text-gray-700 mb-2">فرمت نمونه:</h3>
            <pre class="text-xs bg-white border border-gray-300 rounded p-3 overflow-x-auto">[
  {
    "title": "Universe",
    "artist": "",
    "cover": "https://vmusic.ir/wp-content/uploads/2024/08/Jurrivh-Universe-2024.jpg",
    "audio": "https://dc.vmusic.ir/2024/08/Jurrivh - Universe (2024)/128k/01) Jurrivh - Universe.mp3",
    "genre": "relax",
    "duration": "00:2:03"
  },
  {
    "title": "Evolution",
    "artist": "Interplay Records",
    "cover": "https://vmusic.ir/wp-content/uploads/2024/07/Interplay-Records-Interplay-Radio-Episode-513-2024.jpg",
    "audio": "https://dc.vmusic.ir/2024/07/Interplay Records - Interplay Radio Episode 513 (2024)/128k/03) Interplay Records - Evolution (Interplay 51).mp3",
    "genre": "electronic trance",
    "duration": "00:3:40"
  }
]</pre>
          </div>
          
          <!-- Textarea for JSON input -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">لیست موزیک‌ها (JSON Array):</label>
            <textarea
              v-model="musicListData"
              rows="20"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="[
  {
    &quot;title&quot;: &quot;Song Title&quot;,
    &quot;artist&quot;: &quot;Artist Name&quot;,
    &quot;cover&quot;: &quot;https://example.com/cover.jpg&quot;,
    &quot;audio&quot;: &quot;https://example.com/audio.mp3&quot;,
    &quot;genre&quot;: &quot;pop&quot;,
    &quot;duration&quot;: &quot;3:45&quot;
  }
]"
            ></textarea>
          </div>
          
          <!-- Validation Errors -->
          <div v-if="validationErrors.length > 0" class="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <h4 class="text-sm font-medium text-red-800 mb-2">خطاهای اعتبارسنجی:</h4>
            <ul class="text-sm text-red-700 list-disc list-inside">
              <li v-for="(error, index) in validationErrors" :key="index">{{ error }}</li>
            </ul>
          </div>
          
          <!-- Buttons -->
          <div class="flex justify-end space-x-4">
            <button
              @click="clearListForm"
              class="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              پاک کردن فرم
            </button>
            <button
              @click="submitMusicList"
              :disabled="isSubmitting || !musicListData.trim()"
              class="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="isSubmitting">در حال ارسال...</span>
              <span v-else>ارسال لیست به سرور</span>
            </button>
          </div>
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
import { useAdminAuth } from '@/composables/useAdminAuth.js'

// Page metadata
definePageMeta({
  layout: 'default',
  title: 'Admin Panel',
  middleware: 'admin-auth',
})

const { isAuthenticated, isReady, init, login, logout } = useAdminAuth()
const adminPassword = ref('')
const loginError = ref('')
const isLoggingIn = ref(false)

const handleLogin = async () => {
  loginError.value = ''
  isLoggingIn.value = true

  try {
    await $fetch('/api/admin/unlock', {
      method: 'POST',
      body: { password: adminPassword.value },
    })
    if (import.meta.client) {
      sessionStorage.setItem('dbr_admin_auth', '1')
    }
    isAuthenticated.value = true
    adminPassword.value = ''
  } catch (error) {
    const status = error?.statusCode || error?.status
    if (status === 401) {
      loginError.value = 'Wrong password'
    } else if (login(adminPassword.value)) {
      // Fallback when server API is unavailable (static hosting)
      adminPassword.value = ''
    } else {
      loginError.value = 'Wrong password'
    }
  } finally {
    isLoggingIn.value = false
  }
}

const handleLogout = async () => {
  try {
    await $fetch('/api/admin/logout', { method: 'POST' })
  } catch {
    // ignore
  }
  logout()
  adminPassword.value = ''
  loginError.value = ''
}

// Reactive data
const activeTab = ref('add-music')
const isSubmitting = ref(false)
const message = ref('')
const messageType = ref('')
const musicListData = ref('')
const validationErrors = ref([])

// Tabs configuration
const tabs = [
  { id: 'add-music', name: 'Add Music' },
  { id: 'upload-list', name: 'آپلود لیست' },
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

// Upload List Methods
const clearListForm = () => {
  musicListData.value = ''
  validationErrors.value = []
  message.value = ''
  messageType.value = ''
}

const validateMusicList = (musicArray) => {
  const errors = []
  const validMusics = []
  
  if (!Array.isArray(musicArray)) {
    errors.push('داده باید یک آرایه باشد')
    return { errors, validMusics }
  }
  
  musicArray.forEach((music, index) => {
    const itemErrors = []
    
    // Check if it's an object
    if (typeof music !== 'object' || music === null) {
      itemErrors.push(`آیتم ${index + 1}: باید یک آبجکت باشد`)
      return
    }
    
    // Check required fields
    if (!music.audio || music.audio.trim() === '') {
      itemErrors.push(`آیتم ${index + 1}: فیلد audio الزامی است`)
    }
    
    if (!music.genre || music.genre.trim() === '') {
      itemErrors.push(`آیتم ${index + 1}: فیلد genre الزامی است`)
    }
    
    // Validate URLs
    if (music.cover && music.cover.trim() !== '' && !isValidUrl(music.cover)) {
      itemErrors.push(`آیتم ${index + 1}: cover باید یک URL معتبر باشد`)
    }
    
    if (music.audio && music.audio.trim() !== '' && !isValidUrl(music.audio)) {
      itemErrors.push(`آیتم ${index + 1}: audio باید یک URL معتبر باشد`)
    }
    
    // If no errors, add to valid musics
    if (itemErrors.length === 0) {
      validMusics.push({
        title: music.title || '',
        artist: music.artist || '',
        cover: music.cover || '',
        audio: music.audio,
        genre: music.genre,
        duration: music.duration || '',
        star: music.star || 4.6,
        reference: music.reference || ''
      })
    } else {
      errors.push(...itemErrors)
    }
  })
  
  return { errors, validMusics }
}

const submitMusicList = async () => {
  // Clear previous messages
  message.value = ''
  messageType.value = ''
  validationErrors.value = []
  
  try {
    // Parse JSON
    let parsedData
    try {
      parsedData = JSON.parse(musicListData.value)
    } catch (parseError) {
      validationErrors.value.push('فرمت JSON نامعتبر است. لطفاً سینتکس را بررسی کنید.')
      return
    }
    
    // Validate music list
    const { errors, validMusics } = validateMusicList(parsedData)
    
    if (errors.length > 0) {
      validationErrors.value = errors
      return
    }
    
    if (validMusics.length === 0) {
      validationErrors.value.push('هیچ موزیک معتبری برای ارسال وجود ندارد')
      return
    }
    
    // Submit to API
    isSubmitting.value = true
    
    const { addMultipleMusics } = useMusicAPI()
    const result = await addMultipleMusics(validMusics)
    
    if (result.success) {
      message.value = `${validMusics.length} موزیک با موفقیت به دیتابیس اضافه شد!`
      messageType.value = 'success'
      
      // Clear form after successful submission
      setTimeout(() => {
        clearListForm()
      }, 2000)
    } else {
      message.value = `خطا: ${result.error}`
      messageType.value = 'error'
    }
    
  } catch (error) {
    message.value = `خطای غیرمنتظره: ${error.message}`
    messageType.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}

// Initialize with one empty entry if array is empty
onMounted(() => {
  init()
  if (musicEntries.value.length === 0) {
    addMusicEntry()
  }
})
</script>
