<script setup>
import storeSimple from "@/store/storeSimple"
// import { useGlobalStore } from  "@/store/myPinia";
import playListLive from "@/store/playListLive"

const { getLiveMusic, updateMusicById, getRandomActiveMusic } = useMusicAPI()
const {
    getUserPlaylists,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    getTrackPlaylistIds,
    getPlaylistTracks,
} = usePlaylistsAPI()
const { isLoggedIn } = useSupabase()
const { createFinishTime, getUTCnewFormat, createDateFromTime } = useGlobalFunctions()
const { toast } = useToast()


// createDateFromTime("00:10:10")

const myMusic = ref(null);
const myMusicSupport = ref(null);
const originAudio = ref(false)
const currentTime = ref(0);
const duration = ref(0);
const coverMusic = ref('')
const isCoverLoaded = ref(false)
const currentOriginTrack = ref(null)
const currentSupportTrack = ref(null)
const genres = ref([])
const isLoading = ref(true)
const isAudioReady = ref(false)
const notShowing = ref(true)
const letsGoModal = ref(true)
const autoPlayAfterLogin = ref(false)
const videoElement = ref(null)
const volume = ref(100)
const boxWrapper = ref(null)
const voiceControlItem = ref(null)
const playerBox = ref(null)
const shouldShowVideo = ref(false)
const videoLoaded = ref(false)

const route = useRoute()
const router = useRouter()

const getCustomTrackFromRoute = () => {
    let audio = route.query.audio || route.query.link || route.query.url;
    let title = route.query.title || route.query.name || '';
    let artist = route.query.artist || route.query.musician || route.query.author || '';
    let cover = route.query.cover || '';

    const slug = route.params.slug;
    if (!audio && Array.isArray(slug) && slug.length > 0) {
        const protocolIndex = slug.findIndex(item => item.startsWith('http:') || item.startsWith('https:'));
        
        if (protocolIndex !== -1) {
            if (protocolIndex > 0) {
                title = decodeURIComponent(slug[0]);
            }
            if (protocolIndex > 1) {
                artist = decodeURIComponent(slug[1]);
            }
            
            const protocol = slug[protocolIndex];
            const restOfUrl = slug.slice(protocolIndex + 1);
            
            let pathPart = restOfUrl.join('/');
            while (pathPart.startsWith('/')) {
                pathPart = pathPart.substring(1);
            }
            audio = `${protocol}//${pathPart}`;
        } else {
            const lastSegment = slug[slug.length - 1];
            if (lastSegment && (lastSegment.includes('.') || lastSegment.startsWith('http'))) {
                audio = slug.join('/');
            }
        }
    }

    if (audio) {
        if (audio.startsWith('https:/') && !audio.startsWith('https://')) {
            audio = audio.replace('https:/', 'https://');
        } else if (audio.startsWith('http:/') && !audio.startsWith('http://')) {
            audio = audio.replace('http:/', 'http://');
        }

        return {
            title: title || 'Music Link',
            artist: artist || '',
            audio: audio,
            cover: cover || '',
            genre: 'custom',
            duration: '00:00:00'
        };
    }
    return null;
}

createFinishTime("00:10:10")
getUTCnewFormat()

const setAudioSource = (audioElement, track) => {
    if (!audioElement || !track?.audio) return

    const nextSrc = track.audio
    if (audioElement.src !== nextSrc && audioElement.currentSrc !== nextSrc) {
        audioElement.src = nextSrc
        audioElement.load()
    }
}

// Keywords of the currently active genre filters (e.g. ["electronic", "relax"]), passed straight
// to the `get_random_track` Postgres function so filtering happens in the database, not in the browser.
const activeGenreFilters = computed(() => (genres.value || []).filter((genre) => genre.active).map((genre) => genre.genre))

// When set, the player queues only tracks from this playlist instead of the radio RPC.
const activePlaybackPlaylist = ref(null)
const activePlaylistTracks = ref([])
const playlistPlayBusy = ref(false)

const pickTrackFromActivePlaylist = (excludeTrack = null) => {
    const tracks = (activePlaylistTracks.value || []).filter((track) => track?.audio)
    if (!tracks.length) return null

    const candidates = excludeTrack?.id
        ? tracks.filter((track) => track.id !== excludeTrack.id)
        : tracks
    const pool = candidates.length ? candidates : tracks
    return pool[Math.floor(Math.random() * pool.length)]
}

// Asks the database for one random active track matching the active genres (see get_random_track SQL function).
// If a playlist is active, picks only from that playlist's tracks.
async function getRandomNumber() {
    let selected = null

    if (activePlaybackPlaylist.value && activePlaylistTracks.value.length) {
        selected = pickTrackFromActivePlaylist(currentSupportTrack.value)
    } else {
        const { data } = await getRandomActiveMusic({
            genreFilters: activeGenreFilters.value,
            excludeTrack: currentSupportTrack.value,
        })
        selected = data
    }

    if (!selected) return null

    currentOriginTrack.value = selected
    storeSimple.value.currentOriginTrack = selected
    setAudioSource(myMusic.value, selected)
    return selected
}

async function getRandomNumberSupport() {
    let selected = null

    if (activePlaybackPlaylist.value && activePlaylistTracks.value.length) {
        selected = pickTrackFromActivePlaylist(currentOriginTrack.value)
    } else {
        const { data } = await getRandomActiveMusic({
            genreFilters: activeGenreFilters.value,
            excludeTrack: currentOriginTrack.value,
        })
        selected = data
    }

    if (!selected) return null

    currentSupportTrack.value = selected
    storeSimple.value.currentSupportTrack = selected
    setAudioSource(myMusicSupport.value, selected)
    return selected
}


const PLAYBACK_TIMEOUT_MS = 9000

let playerInitResolve = null
const playerInitPromise = new Promise((resolve) => {
    playerInitResolve = resolve
})

const waitForAudioReady = (audioElement, timeoutMs = PLAYBACK_TIMEOUT_MS) => {
    return new Promise((resolve, reject) => {
        if (!audioElement) {
            reject(new Error('Audio element not ready'))
            return
        }

        if (audioElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            resolve()
            return
        }

        let timeoutId

        const cleanup = () => {
            clearTimeout(timeoutId)
            audioElement.removeEventListener('canplay', onCanPlay)
            audioElement.removeEventListener('error', onError)
        }

        const onCanPlay = () => {
            cleanup()
            resolve()
        }

        const onError = () => {
            cleanup()
            reject(new Error('Audio failed to load'))
        }

        timeoutId = setTimeout(() => {
            cleanup()
            reject(new Error(`Audio loading timed out after ${timeoutMs / 1000} seconds`))
        }, timeoutMs)

        audioElement.addEventListener('canplay', onCanPlay, { once: true })
        audioElement.addEventListener('error', onError, { once: true })
    })
}

const attemptPlayAudio = async (audioElement) => {
    await waitForAudioReady(audioElement)
    await audioElement.play()

    if (audioElement.paused) {
        throw new Error('Playback did not start')
    }
}

const onPlaybackSuccess = (useSupportTrack) => {
    isLoading.value = false
    storeSimple.value.isPlaying = true
    updateMediaSession('playing')

    const activeElement = useSupportTrack ? myMusicSupport.value : myMusic.value
    if (activeElement && activeElement.duration) {
        duration.value = activeElement.duration
    }

    const newCover = useSupportTrack ? currentSupportTrack.value?.cover : currentOriginTrack.value?.cover
    if (newCover !== coverMusic.value) {
        isCoverLoaded.value = false
        coverMusic.value = newCover
    }
}

const ensureTracksSelected = async () => {
    if (!currentOriginTrack.value) await getRandomNumber()
    if (!currentSupportTrack.value) await getRandomNumberSupport()
    return !!currentOriginTrack.value?.audio
}

const isPaused = ref(false)

const playAudio = async () => {
    isPaused.value = false
    try {
        if (!(await ensureTracksSelected())) {
            throw new Error('No tracks available')
        }

        setAudioSource(myMusic.value, currentOriginTrack.value)
        setAudioSource(myMusicSupport.value, currentSupportTrack.value)
        myMusic.value.load()
        myMusicSupport.value.load()
        await playBetter()
        checkGenreAndSetupVideo()
    } catch (error) {
        console.error('playAudio failed:', error)
        isLoading.value = false
        nextOrRepeat()
    }
}

// The very first time playBetter runs, both tracks were just fetched moments ago (in onMounted),
// so there's no need to immediately fetch a replacement for the "other" one. From the second call
// onward, prefetch a fresh replacement as usual so the next track is ready in advance.
const hasStartedPlaybackOnce = ref(false)

async function playBetter() {
    const isFirstPlay = !hasStartedPlaybackOnce.value
    hasStartedPlaybackOnce.value = true

    if (originAudio.value) {
        console.log("runnig support")
        if (!isFirstPlay) getRandomNumber()
        setAudioSource(myMusicSupport.value, currentSupportTrack.value)

        if (!currentSupportTrack.value?.audio) {
            throw new Error('No support track selected')
        }

        try {
            seekAudio()
            await attemptPlayAudio(myMusicSupport.value)
            onPlaybackSuccess(true)
        } catch (error) {
            console.error('myMusicSupport not loaded...', error)
            isLoading.value = false
            storeSimple.value.isPlaying = false
            console.log("myMusicSupport:", currentSupportTrack.value)

            if (currentSupportTrack.value?.id) {
                await updateMusicById(currentSupportTrack.value.id, { is_active: false })
            }

            originAudio.value = false
            await playBetter()
        }
    } else {
        console.log("running origin")
        if (!isFirstPlay) getRandomNumberSupport()
        setAudioSource(myMusic.value, currentOriginTrack.value)

        if (!currentOriginTrack.value?.audio) {
            throw new Error('No origin track selected')
        }

        try {
            seekAudio()
            await attemptPlayAudio(myMusic.value)
            onPlaybackSuccess(false)
        } catch (error) {
            console.error('myMusic not loaded...', error)
            isLoading.value = false
            storeSimple.value.isPlaying = false
            console.log("myMusic:", currentOriginTrack.value)

            if (currentOriginTrack.value?.id) {
                await updateMusicById(currentOriginTrack.value.id, { is_active: false })
            }

            originAudio.value = true
            await playBetter()
        }
    }
}


const getAbsoluteUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return url;
    }
    if (typeof window !== 'undefined') {
        return window.location.origin + (url.startsWith('/') ? '' : '/') + url;
    }
    return url;
};

function updateMediaMetadata() {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    const track = originAudio.value ? currentSupportTrack.value : currentOriginTrack.value;
    if (!track) return;

    navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || 'Dance Baby Radio',
        artist: track.artist || '',
        album: 'Dance Baby Radio',
        artwork: track.cover ? [
            { src: getAbsoluteUrl(track.cover), sizes: '96x96', type: 'image/jpeg' },
            { src: getAbsoluteUrl(track.cover), sizes: '128x128', type: 'image/jpeg' },
            { src: getAbsoluteUrl(track.cover), sizes: '192x192', type: 'image/jpeg' },
            { src: getAbsoluteUrl(track.cover), sizes: '256x256', type: 'image/jpeg' },
            { src: getAbsoluteUrl(track.cover), sizes: '384x384', type: 'image/jpeg' },
            { src: getAbsoluteUrl(track.cover), sizes: '512x512', type: 'image/jpeg' },
        ] : [
            { src: getAbsoluteUrl('/images/background-dance-1.jpg'), sizes: '512x512', type: 'image/jpeg' }
        ]
    });
}

const updatePlaybackPosition = () => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;

    const activeElement = originAudio.value ? myMusicSupport.value : myMusic.value;
    if (activeElement && activeElement.duration && !isNaN(activeElement.duration)) {
        try {
            navigator.mediaSession.setPositionState({
                duration: activeElement.duration,
                playbackRate: activeElement.playbackRate || 1.0,
                position: activeElement.currentTime || 0
            });
        } catch (error) {
            console.error('Error setting mediaSession position state:', error);
        }
    }
};

function updateMediaSession(state) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (state === 'playing') {
        navigator.mediaSession.playbackState = 'playing';
        updateMediaMetadata();
        updatePlaybackPosition();
    } else {
        navigator.mediaSession.playbackState = 'paused';
    }
}

const pauseAudio = async () => {
    seekAudio()
    originAudio.value ? await myMusicSupport.value.pause() : await myMusic.value.pause();

    isPaused.value = true
    storeSimple.value.isPlaying = false
    updateMediaSession('paused');
    if (videoElement.value) {
        videoElement.value.pause();
    }
};

// Simply resumes the already-loaded, already-selected track (no new track picked, no API call) —
// used when the user pauses and then presses play again on the same track.
const resumeAudio = async () => {
    isLoading.value = true
    try {
        const activeElement = originAudio.value ? myMusicSupport.value : myMusic.value
        seekAudio()
        await attemptPlayAudio(activeElement)
        isPaused.value = false
        onPlaybackSuccess(originAudio.value)
        checkGenreAndSetupVideo()
    } catch (error) {
        console.error('resumeAudio failed:', error)
        isLoading.value = false
        nextOrRepeat()
    }
}

const playMusic = async () => {
    letsGoModal.value = false

    // If the API hasn't finished loading yet, or the audio isn't buffered enough, show the loading spinner immediately
    if (!currentOriginTrack.value || (myMusic.value && myMusic.value.readyState < 3)) {
        isLoading.value = true
    }

    await playerInitPromise

    if (!(await ensureTracksSelected())) {
        toast.warning('No music available', { title: 'Player' })
        isLoading.value = false
        return
    }

    if (storeSimple.value.isPlaying) {
        pauseAudio()
    } else if (isPaused.value) {
        await resumeAudio()
    } else {
        isLoading.value = true
        await playAudio()
    }
}

defineExpose({ playMusic })

const isEmpty = ref(false)
const isRepeat = ref(false)

const toggleRepeat = () => {
    isRepeat.value = !isRepeat.value
    if (isRepeat.value) {
        toast.info('This track will repeat when it ends.', { title: 'Repeat on' })
    } else {
        toast.info('Repeat off — next track will play as usual.', { title: 'Repeat off' })
    }
}

const getActiveAudio = () => (originAudio.value ? myMusicSupport.value : myMusic.value)

const syncDurationFromActive = () => {
    const activeElement = getActiveAudio()
    if (activeElement?.duration && !isNaN(activeElement.duration)) {
        duration.value = activeElement.duration
    }
}

const nextOrRepeat = () => {
    if (isRepeat.value) {
        goToStart()
        playAudio();
    } else {
        playNextMusic()
    }
}

const onOriginEnded = () => {
    if (!originAudio.value) nextOrRepeat()
}

const onSupportEnded = () => {
    if (originAudio.value) nextOrRepeat()
}

const playbackHistory = ref([])

const playPreviousMusic = async () => {
    if (currentTime.value > 3) {
        goToStart();
        const activeElement = originAudio.value ? myMusicSupport.value : myMusic.value;
        if (activeElement) {
            activeElement.currentTime = 0;
            if (storeSimple.value.isPlaying) {
                try {
                    await attemptPlayAudio(activeElement);
                } catch (e) {
                    console.error(e);
                }
            }
        }
        return;
    }

    if (playbackHistory.value.length === 0) {
        goToStart();
        return;
    }

    isLoading.value = true;
    pauseAudio();

    const prevTrack = playbackHistory.value.pop();

    if (originAudio.value) {
        currentSupportTrack.value = prevTrack;
        storeSimple.value.currentSupportTrack = prevTrack;
        setAudioSource(myMusicSupport.value, prevTrack);
    } else {
        currentOriginTrack.value = prevTrack;
        storeSimple.value.currentOriginTrack = prevTrack;
        setAudioSource(myMusic.value, prevTrack);
    }

    goToStart();

    try {
        const activeElement = originAudio.value ? myMusicSupport.value : myMusic.value;
        await attemptPlayAudio(activeElement);
        onPlaybackSuccess(originAudio.value);
        checkGenreAndSetupVideo();
    } catch (error) {
        console.error('playPreviousMusic failed:', error);
        isLoading.value = false;
        nextOrRepeat();
    }
}

const playNextMusic = async () => {
    isLoading.value = true
    isEmpty.value = true
    pauseAudio();

    const currentTrack = originAudio.value ? currentSupportTrack.value : currentOriginTrack.value;
    if (currentTrack) {
        if (playbackHistory.value.length === 0 || playbackHistory.value[playbackHistory.value.length - 1].id !== currentTrack.id) {
            playbackHistory.value.push(currentTrack);
            if (playbackHistory.value.length > 20) {
                playbackHistory.value.shift();
            }
        }
    }

    originAudio.value = !originAudio.value

    isEmpty.value = false

    goToStart()
    playAudio()
}

const formatTime = (value) => {
    const totalSeconds = Math.max(0, Number(value) || 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

const isSeeking = ref(false);

const onSliderInput = () => {
    isSeeking.value = true;
    currentTime.value = Number(currentTime.value) || 0;
};

const onSliderChange = () => {
    currentTime.value = Number(currentTime.value) || 0;
    seekAudio();
    isSeeking.value = false;
};

const FADE_OUT_SECONDS = 4

// Fades only the real audio output (element.volume). Never touches the UI volume slider.
const getEndFadeMultiplier = (audioElement) => {
    const trackLength = audioElement?.duration
    if (!trackLength || isNaN(trackLength)) return 1

    const remaining = trackLength - (audioElement.currentTime || 0)
    if (remaining >= FADE_OUT_SECONDS) return 1
    if (remaining <= 0) return 0
    return remaining / FADE_OUT_SECONDS
}

const updateRange = () => {
    if (originAudio.value) return

    if (!isSeeking.value && myMusic.value) {
        currentTime.value = myMusic.value.currentTime;
        updatePlaybackPosition();
    }
    updateVolume();
};

const updateRangeSupport = () => {
    if (!originAudio.value) return

    if (!isSeeking.value && myMusicSupport.value) {
        currentTime.value = myMusicSupport.value.currentTime;
        updatePlaybackPosition();
    }
    updateVolume();
};

const seekAudio = () => {
    const activeElement = getActiveAudio()
    if (activeElement) {
        // Only seek the active track. Syncing both can push the inactive
        // (often shorter) track to its end and fire `ended` → next track.
        activeElement.currentTime = Number(currentTime.value) || 0
    }
    updateVolume();
};

const updateVolume = () => {
    const uiVolume = volume.value / 100;
    if (myMusic.value) {
        const fade = originAudio.value ? 1 : getEndFadeMultiplier(myMusic.value)
        myMusic.value.volume = uiVolume * fade
    }
    if (myMusicSupport.value) {
        const fade = originAudio.value ? getEndFadeMultiplier(myMusicSupport.value) : 1
        myMusicSupport.value.volume = uiVolume * fade
    }
};

const matchVoiceControlWidth = () => {
    if (boxWrapper.value && voiceControlItem.value) {
        const boxWidth = boxWrapper.value.offsetWidth - 80;
        voiceControlItem.value.style.width = boxWidth + 'px';
    }
};

const goToStart = () => {
    if (myMusic.value) myMusic.value.currentTime = 0
    if (myMusicSupport.value) myMusicSupport.value.currentTime = 0
    currentTime.value = 0
    syncDurationFromActive()
    updateVolume()
}

const trackHasGenre = (track, genreKeyword) => {
    if (!track?.genre || !genreKeyword) return false
    return String(track.genre).toLowerCase().includes(String(genreKeyword).toLowerCase())
}

// When a genre is turned off, the idle (upcoming) buffer may still hold a matching track.
// Refresh that buffer so the deactivated genre is not played next. Never touch the playing buffer.
const refreshQueuedTrackIfMatchesGenre = async (genreKeyword) => {
    if (activePlaybackPlaylist.value) return

    const upcomingIsSupport = !originAudio.value
    const upcomingTrack = upcomingIsSupport ? currentSupportTrack.value : currentOriginTrack.value
    if (!trackHasGenre(upcomingTrack, genreKeyword)) return

    if (upcomingIsSupport) {
        await getRandomNumberSupport()
        myMusicSupport.value?.load()
    } else {
        await getRandomNumber()
        myMusic.value?.load()
    }
}

const activeGenre = async (item) => {
    item.active = !item.active
    openGenres.value = false
    openGenres.value = true
    localStorage.removeItem('myGenres')
    localStorage.setItem('myGenres', JSON.stringify(genres.value))

    const name = item.text || item.genre
    if (item.active) {
        toast.info(`You'll also hear ${name}.`, { title: 'Genre', highlight: name })
    } else {
        toast.info(`You won't hear ${name} in upcoming tracks.`, { title: 'Genre', highlight: name })
        await refreshQueuedTrackIfMatchesGenre(item.genre)
    }
}

const openGenres = ref(false)
const openPlaylists = ref(false)
const userPlaylists = ref([])
const trackPlaylistIds = ref([])
const playlistActionBusy = ref(false)

const currentPlayingTrack = computed(() => (
    originAudio.value ? currentSupportTrack.value : currentOriginTrack.value
))

const isInAnyPlaylist = computed(() => trackPlaylistIds.value.length > 0)

const playlistMenuItems = computed(() => (
    (userPlaylists.value || []).map((playlist) => ({
        ...playlist,
        active: trackPlaylistIds.value.includes(playlist.id),
        isPlayingSource: activePlaybackPlaylist.value?.id === playlist.id,
    }))
))

const loadUserPlaylists = async () => {
    if (!isLoggedIn.value) {
        userPlaylists.value = []
        trackPlaylistIds.value = []
        return
    }

    const { data } = await getUserPlaylists()
    userPlaylists.value = data || []
}

const refreshTrackPlaylistIds = async () => {
    const musicId = currentPlayingTrack.value?.id
    if (!isLoggedIn.value || !musicId) {
        trackPlaylistIds.value = []
        return
    }

    const { data } = await getTrackPlaylistIds(musicId)
    trackPlaylistIds.value = data || []
}

const togglePlaylistMenu = () => {
    openPlaylists.value = !openPlaylists.value
}

const openPlaylistMenuDesktop = () => {
    openPlaylists.value = true
    notShowing.value = false
}

const closePlaylistMenuDesktop = () => {
    openPlaylists.value = false
    // If the pointer left the player entirely through the menu, hide controls again.
    requestAnimationFrame(() => {
        if (!openPlaylists.value && playerBox.value && !playerBox.value.matches(':hover')) {
            notShowing.value = true
        }
    })
}

const onPlayerBoxLeave = () => {
    // Keep controls visible while the playlist menu is open so the mouse can
    // travel from the icon onto the dropdown without collapsing everything.
    if (openPlaylists.value) return
    notShowing.value = true
}

const goToPlaylistsPage = () => {
    openPlaylists.value = false
    router.push('/playlists')
}

const goToLogin = () => {
    openPlaylists.value = false
    router.push('/login')
}

const closeMenusOnMobile = () => {
    if (window.innerWidth <= 768) {
        openGenres.value = false
        openPlaylists.value = false
    }
}

const onPlaylistClick = async (playlist) => {
    const musicId = currentPlayingTrack.value?.id
    if (!musicId || !playlist?.id || playlistActionBusy.value) return

    const playlistName = playlist.name || 'Untitled'
    const trackTitle = currentPlayingTrack.value?.title || 'Track'
    const alreadyInPlaylist = trackPlaylistIds.value.includes(playlist.id)

    playlistActionBusy.value = true

    if (alreadyInPlaylist) {
        const { error } = await removeTrackFromPlaylist(playlist.id, musicId)
        playlistActionBusy.value = false

        if (error) {
            console.error('Failed to remove track from playlist:', error)
            toast.error(error.message || 'Could not remove this track from the playlist.', {
                title: 'Playlist',
            })
            return
        }

        trackPlaylistIds.value = trackPlaylistIds.value.filter((id) => id !== playlist.id)
        toast.success(`“${trackTitle}” removed from “${playlistName}”.`, {
            title: 'Removed from playlist',
        })
        openPlaylists.value = false
        openPlaylists.value = true
        return
    }

    const { error } = await addTrackToPlaylist(playlist.id, musicId)
    playlistActionBusy.value = false

    if (error) {
        console.error('Failed to add track to playlist:', error)
        toast.error(error.message || 'Could not add this track to the playlist.', {
            title: 'Playlist',
        })
        return
    }

    trackPlaylistIds.value = [...trackPlaylistIds.value, playlist.id]
    toast.success(`“${trackTitle}” added to “${playlistName}”.`, {
        title: 'Added to playlist',
    })
    openPlaylists.value = false
    openPlaylists.value = true
}

const returnToMainRandom = async () => {
    activePlaybackPlaylist.value = null
    activePlaylistTracks.value = []

    pauseAudio()
    letsGoModal.value = false
    isPaused.value = false
    hasStartedPlaybackOnce.value = false
    originAudio.value = false
    isLoading.value = true

    currentOriginTrack.value = null
    currentSupportTrack.value = null
    storeSimple.value.currentOriginTrack = null
    storeSimple.value.currentSupportTrack = null

    const [origin, support] = await Promise.all([getRandomNumber(), getRandomNumberSupport()])
    if (origin && support && origin.id === support.id) {
        await getRandomNumberSupport()
    }

    goToStart()
    await playAudio()

    toast.success('Back to main radio shuffle.', { title: 'Radio' })
}

const playFromPlaylist = async (playlist) => {
    if (!playlist?.id || playlistPlayBusy.value) return

    // Clicking the active playlist's play button exits playlist mode
    // and resumes the main random radio list.
    if (activePlaybackPlaylist.value?.id === playlist.id) {
        playlistPlayBusy.value = true
        openPlaylists.value = false
        try {
            await returnToMainRandom()
        } catch (err) {
            console.error('returnToMainRandom failed:', err)
            toast.error(err.message || 'Could not return to radio.', { title: 'Radio' })
            isLoading.value = false
        } finally {
            playlistPlayBusy.value = false
        }
        return
    }

    playlistPlayBusy.value = true
    openPlaylists.value = false

    try {
        const { data, error } = await getPlaylistTracks(playlist.id)

        if (error) {
            toast.error(error || 'Could not load this playlist.', { title: 'Playlist' })
            return
        }

        const playableTracks = (data || []).filter((track) => track?.audio)
        if (!playableTracks.length) {
            toast.error(`“${playlist.name || 'Untitled'}” has no playable tracks yet.`, {
                title: 'Empty playlist',
            })
            return
        }

        activePlaybackPlaylist.value = {
            id: playlist.id,
            name: playlist.name || 'Untitled',
        }
        activePlaylistTracks.value = playableTracks

        pauseAudio()
        letsGoModal.value = false
        isPaused.value = false
        hasStartedPlaybackOnce.value = false
        originAudio.value = false
        isLoading.value = true

        const first = playableTracks[Math.floor(Math.random() * playableTracks.length)]
        const second = playableTracks.find((track) => track.id !== first.id) || first

        currentOriginTrack.value = first
        currentSupportTrack.value = second
        storeSimple.value.currentOriginTrack = first
        storeSimple.value.currentSupportTrack = second
        setAudioSource(myMusic.value, first)
        setAudioSource(myMusicSupport.value, second)

        goToStart()
        await playAudio()

        toast.success(`Now playing from “${playlist.name || 'Untitled'}”.`, {
            title: 'Playlist',
        })
    } catch (err) {
        console.error('playFromPlaylist failed:', err)
        toast.error(err.message || 'Could not play this playlist.', { title: 'Playlist' })
        isLoading.value = false
    } finally {
        playlistPlayBusy.value = false
    }
}

watch(isLoggedIn, async (loggedIn) => {
    if (loggedIn) {
        await loadUserPlaylists()
        await refreshTrackPlaylistIds()
    } else {
        userPlaylists.value = []
        trackPlaylistIds.value = []
        openPlaylists.value = false
        activePlaybackPlaylist.value = null
        activePlaylistTracks.value = []
    }
})

watch(
    () => [currentPlayingTrack.value?.id, isLoggedIn.value],
    async () => {
        await refreshTrackPlaylistIds()
    }
)

const handleKeyPlays = (event) => {
    if (letsGoModal.value) return

    // Player stays mounted (hidden) on auth pages — don't steal typing keys.
    const path = route.path
    if (path !== '/' && !path.startsWith('/play')) return

    const tag = event.target?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) return

    if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault()
        playMusic()
    }
    else if (event.code === 'ArrowRight') {
        playNextMusic()
    }
};


const checkGenreAndSetupVideo = async () => {
    const currentMusic = originAudio.value ? currentSupportTrack.value : currentOriginTrack.value
    const currentGenre = currentMusic?.genre || ''

    if (currentMusic && (currentGenre.includes('electronic') || currentGenre.includes('relax'))) {
        shouldShowVideo.value = true
        await setupVideo()
    } else {
        shouldShowVideo.value = false
        if (videoElement.value) {
            videoElement.value.pause()
            videoElement.value.currentTime = 0
        }
    }
}

const setupVideo = async () => {
    if (videoElement.value && shouldShowVideo.value) {
        // Ensure video is muted for autoplay to work
        videoElement.value.muted = true
        videoElement.value.volume = 0

        // Remove controls if they were set by default
        videoElement.value.controls = false

        // Set to loop if desired
        videoElement.value.loop = true

        // For mobile Safari - prevents fullscreen playback
        videoElement.value.playsinline = true

        // Some browsers require explicit loading
        if (!videoLoaded.value) {
            await videoElement.value.load()
            videoLoaded.value = true
        }

        // Attempt to play
        const playPromise = videoElement.value.play()

        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('Autoplay prevented:', error)

            })
        }
    }
}


// Start the API call IMMEDIATELY on the client during component creation (the `created` hook phase).
// This fires the Supabase fetch as soon as the JS file is evaluated in the browser, without
// waiting for compiling the template, mounting DOM, or rendering any sub-components.
// It runs in the background and is COMPLETELY non-blocking, so the WelcomeModal and background
// stars render instantly (under 10ms) without any white screen or blank delays.
let genresReady = false
const initializeTracks = async () => {
    let lastGenres = null
    if (import.meta.client) {
        lastGenres = localStorage.getItem('myGenres')
    }

    if (!!lastGenres) {
        genres.value = JSON.parse(lastGenres)
    } else {
        genres.value = storeSimple.value.genres
    }
    genresReady = true

    // Origin/support tracks are picked directly in the database via the get_random_track
    // RPC function, so no music list needs to be downloaded here anymore.
    const customTrack = getCustomTrackFromRoute()
    if (customTrack) {
        currentOriginTrack.value = customTrack
        storeSimple.value.currentOriginTrack = customTrack

        // Still pick a random support track so radio transitions seamlessly afterward
        await getRandomNumberSupport()
    } else {
        // Fire both DB requests in parallel instead of one-after-the-other — halves the
        // network round-trip time before the very first track is ready to play. Both
        // exclude-checks are no-ops on this first call anyway (both refs start out null),
        // so behavior is unchanged except for the rare case where the two random picks
        // land on the same track, which we detect and correct right after.
        const [origin, support] = await Promise.all([getRandomNumber(), getRandomNumberSupport()])
        if (origin && support && origin.id === support.id) {
            await getRandomNumberSupport()
        }
    }
}

let tracksInitPromise = null
if (import.meta.client) {
    tracksInitPromise = initializeTracks()
}

const initMediaSession = () => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', async () => {
        if (isPaused.value) {
            await resumeAudio();
        } else {
            await playAudio();
        }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
        pauseAudio();
    });

    navigator.mediaSession.setActionHandler('previoustrack', async () => {
        await playNextMusic();
    });

    navigator.mediaSession.setActionHandler('nexttrack', async () => {
        await playNextMusic();
    });

    if ('setActionHandler' in navigator.mediaSession) {
        try {
            navigator.mediaSession.setActionHandler('seekto', (details) => {
                const activeElement = originAudio.value ? myMusicSupport.value : myMusic.value;
                if (activeElement && details.seekTime !== undefined) {
                    activeElement.currentTime = details.seekTime;
                    currentTime.value = details.seekTime;
                    updatePlaybackPosition();
                }
            });
        } catch (error) {
            console.warn('seekto action handler not supported', error);
        }

        try {
            navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                const activeElement = originAudio.value ? myMusicSupport.value : myMusic.value;
                if (activeElement) {
                    const offset = details.seekOffset || 10;
                    activeElement.currentTime = Math.max(activeElement.currentTime - offset, 0);
                    currentTime.value = activeElement.currentTime;
                    updatePlaybackPosition();
                }
            });
        } catch (error) {
            console.warn('seekbackward action handler not supported', error);
        }

        try {
            navigator.mediaSession.setActionHandler('seekforward', (details) => {
                const activeElement = originAudio.value ? myMusicSupport.value : myMusic.value;
                if (activeElement) {
                    const offset = details.seekOffset || 10;
                    activeElement.currentTime = Math.min(activeElement.currentTime + offset, activeElement.duration || 0);
                    currentTime.value = activeElement.currentTime;
                    updatePlaybackPosition();
                }
            });
        } catch (error) {
            console.warn('seekforward action handler not supported', error);
        }
    }
};

onMounted(async () => {
    try {
        if (import.meta.client && sessionStorage.getItem('skipLetsGo') === '1') {
            sessionStorage.removeItem('skipLetsGo')
            autoPlayAfterLogin.value = true
            letsGoModal.value = false
        }

        // Await the fetch that was already kicked off in the creation (created/setup) phase.
        await (tracksInitPromise || (tracksInitPromise = initializeTracks()))

        if (!genresReady) {
            genres.value = storeSimple.value.genres
        }

        // The DB fetch above may have resolved before the <audio> elements existed (their
        // refs are only populated once mounting completes), so `setAudioSource` inside
        // getRandomNumber/getRandomNumberSupport would have been a no-op back then. Apply
        // the sources now that the refs are guaranteed to exist.
        setAudioSource(myMusic.value, currentOriginTrack.value)
        setAudioSource(myMusicSupport.value, currentSupportTrack.value)

        myMusic.value.addEventListener('loadedmetadata', () => {
            if (!originAudio.value) syncDurationFromActive()
        });

        myMusicSupport.value.addEventListener('loadedmetadata', () => {
            if (originAudio.value) syncDurationFromActive()
        });

        // Set the initial track as ready as soon as the browser can play it
        const checkInitialAudioLoaded = () => {
            if (myMusic.value && myMusic.value.readyState >= 2) { // HAVE_CURRENT_DATA
                isAudioReady.value = true;
            }
        };

        myMusic.value.addEventListener('canplay', () => {
            isAudioReady.value = true;
        });

        // Safe fallback in case preload policies block non-user-initiated preloading
        setTimeout(() => {
            if (currentOriginTrack.value) {
                isAudioReady.value = true;
            }
        }, 3000);

        // Check if already ready immediately (e.g. from cache)
        checkInitialAudioLoaded();

        // Dynamic Loading state bound directly to native HTML5 Audio events of the active track
        const bindAudioLoadingEvents = (audioElement, isSupport) => {
            const isActive = () => {
                return originAudio.value === isSupport;
            };

            audioElement.addEventListener('loadstart', () => {
                if (isActive()) isLoading.value = true;
            });
            audioElement.addEventListener('waiting', () => {
                if (isActive()) isLoading.value = true;
            });
            audioElement.addEventListener('seeking', () => {
                if (isActive()) isLoading.value = true;
            });
            audioElement.addEventListener('playing', () => {
                if (isActive()) isLoading.value = false;
            });
            audioElement.addEventListener('play', () => {
                // Only trigger visual loading spinner on play IF the audio doesn't have enough buffered data yet.
                // Checking readyState < 3 (HAVE_FUTURE_DATA) prevents the annoying loading spinner flash on instant playback.
                if (isActive() && audioElement.readyState < 3) {
                    isLoading.value = true;
                }
            });
            audioElement.addEventListener('pause', () => {
                if (isActive()) isLoading.value = false;
            });
        };

        bindAudioLoadingEvents(myMusic.value, false);
        bindAudioLoadingEvents(myMusicSupport.value, true);

        initMediaSession();

        setTimeout(() => {
            updateMediaSession('paused');
            updateMediaMetadata();
        }, 200);

        window.addEventListener('keydown', handleKeyPlays);

        updateVolume();

        setTimeout(matchVoiceControlWidth, 100);

        await loadUserPlaylists()
        await refreshTrackPlaylistIds()
        window.addEventListener('resize', matchVoiceControlWidth);
    } finally {
        playerInitResolve?.()

        if (autoPlayAfterLogin.value) {
            try {
                await playMusic()
            } catch (error) {
                console.warn('Autoplay after login failed:', error)
            }
        }
    }
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyPlays);
    window.removeEventListener('resize', matchVoiceControlWidth);

    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        if ('seekto' in navigator.mediaSession) {
            navigator.mediaSession.setActionHandler('seekto', null);
        }
        if ('seekbackward' in navigator.mediaSession) {
            navigator.mediaSession.setActionHandler('seekbackward', null);
        }
        if ('seekforward' in navigator.mediaSession) {
            navigator.mediaSession.setActionHandler('seekforward', null);
        }
    }
});

watch(() => originAudio.value, (newV) => {
    if (newV) {
        getRandomNumber().then(() => myMusic.value?.load())
    } else {
        getRandomNumberSupport().then(() => myMusicSupport.value?.load())
    }
})

const currentMusicIndex = ref(-1)

watch(() => coverMusic.value, (newCover, oldCover) => {
    if (newCover !== oldCover) {
        isCoverLoaded.value = false
    }
})

</script>


<template>
    <div class="PlayerMain">

        <div class="main-container" @click="closeMenusOnMobile()">
            <div v-show="shouldShowVideo && videoLoaded" class="video-wrap">
                <video ref="videoElement" autoplay playsinline loop class="">
                    <source
                        src="https://static.vecteezy.com/system/resources/previews/003/769/185/mp4/interstellar-space-travel-universe-to-the-m31-spiral-galaxy-free-video.mp4"
                        type="video/mp4">
                </video>
            </div>
            <div class="back-img"
                :style="`background-image: url(${!!coverMusic ? coverMusic : 'images/background-dance-1.jpg'})`">
            </div>
            <Stars class="bg-stars" />

            <!-- <div class="back-dark" :class="{ 'no-image': !currentOriginTrack?.cover }"></div> -->

            <div ref="playerBox" class="player-box" @mouseover="notShowing = false" @mouseleave="onPlayerBoxLeave">
                <div @click.stop="toggleRepeat" class="cursor-pointer control-item" :class="{ 'show': !notShowing || openPlaylists }">
                    <div class="repeat-icon" :class="{ 'active': isRepeat }">
                        <IconsRepeat />
                    </div>
                </div>

                <div
                    class="cursor-pointer control-item playlist-control"
                    :class="{ 'show': !notShowing || openPlaylists, 'menu-open': openPlaylists }"
                    @click.stop
                >
                    <div class="isMobile" @click.stop="togglePlaylistMenu">
                        <div class="repeat-icon" :class="{ 'active': isInAnyPlaylist }">
                            <IconsPlaylist />
                        </div>
                        <div class="playlist-menu-wrap">
                            <div class="genre-list playlist-list" :class="{ 'close-genres': !openPlaylists }" @click.stop>
                                <div v-if="!isLoggedIn" class="playlist-empty">
                                    <div class="py-2 genre-element playlist-empty-title">Login required</div>
                                    <div class="playlist-empty-text">
                                        Sign in to create playlists and save tracks.
                                    </div>
                                    <button type="button" class="playlist-empty-link" @click.stop="goToLogin">
                                        <span>Login</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                                            <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5" />
                                            <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z" />
                                        </svg>
                                    </button>
                                </div>
                                <div v-else-if="!playlistMenuItems.length" class="playlist-empty">
                                    <div class="py-2 genre-element playlist-empty-title">No playlists</div>
                                    <div class="playlist-empty-text">
                                        Create a playlist first, then you can add this track.
                                    </div>
                                    <button type="button" class="playlist-empty-link" @click.stop="goToPlaylistsPage">
                                        <span>Create playlist</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                                            <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5" />
                                            <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z" />
                                        </svg>
                                    </button>
                                </div>
                                <template v-else>
                                    <div
                                        v-for="playlistEl in playlistMenuItems"
                                        :key="playlistEl.id"
                                        class="py-2 genre-element playlist-item-row"
                                        :class="{ 'is-playing': playlistEl.isPlayingSource }"
                                    >
                                        <div
                                            class="d-flex fs-13 playlist-item-name"
                                            :class="{ 'opacity-05': !playlistEl.active && !playlistEl.isPlayingSource }"
                                            @click.stop="onPlaylistClick(playlistEl)"
                                        >
                                            <div>{{ playlistEl.name || 'Untitled' }}</div>
                                        </div>
                                        <button
                                            type="button"
                                            class="playlist-play-btn"
                                            :class="{ active: playlistEl.isPlayingSource }"
                                            :disabled="playlistPlayBusy"
                                            :title="playlistEl.isPlayingSource ? 'Back to main radio' : 'Play this playlist'"
                                            @click.stop="playFromPlaylist(playlistEl)"
                                        >
                                            <span
                                                class="playlist-play-icon"
                                                :class="{ paused: playlistEl.isPlayingSource }"
                                                aria-hidden="true"
                                            ></span>
                                        </button>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                    <div
                        class="isDesktop"
                        @mouseenter="openPlaylistMenuDesktop"
                        @mouseleave="closePlaylistMenuDesktop"
                    >
                        <div class="repeat-icon" :class="{ 'active': isInAnyPlaylist }">
                            <IconsPlaylist />
                        </div>
                        <div class="playlist-menu-wrap">
                            <div class="genre-list playlist-list" :class="{ 'close-genres': !openPlaylists }">
                                <div v-if="!isLoggedIn" class="playlist-empty">
                                    <div class="py-2 genre-element playlist-empty-title">Login required</div>
                                    <div class="playlist-empty-text">
                                        Sign in to create playlists and save tracks.
                                    </div>
                                    <button type="button" class="playlist-empty-link" @click.stop="goToLogin">
                                        <span>Login</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                                            <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5" />
                                            <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z" />
                                        </svg>
                                    </button>
                                </div>
                                <div v-else-if="!playlistMenuItems.length" class="playlist-empty">
                                    <div class="py-2 genre-element playlist-empty-title">No playlists</div>
                                    <div class="playlist-empty-text">
                                        Create a playlist first, then you can add this track.
                                    </div>
                                    <button type="button" class="playlist-empty-link" @click.stop="goToPlaylistsPage">
                                        <span>Create playlist</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                                            <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5" />
                                            <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z" />
                                        </svg>
                                    </button>
                                </div>
                                <template v-else>
                                    <div
                                        v-for="playlistEl in playlistMenuItems"
                                        :key="playlistEl.id"
                                        class="py-2 genre-element playlist-item-row"
                                        :class="{ 'is-playing': playlistEl.isPlayingSource }"
                                    >
                                        <div
                                            class="d-flex fs-13 playlist-item-name"
                                            :class="{ 'opacity-05': !playlistEl.active && !playlistEl.isPlayingSource }"
                                            @click="onPlaylistClick(playlistEl)"
                                        >
                                            <div>{{ playlistEl.name || 'Untitled' }}</div>
                                        </div>
                                        <button
                                            type="button"
                                            class="playlist-play-btn"
                                            :class="{ active: playlistEl.isPlayingSource }"
                                            :disabled="playlistPlayBusy"
                                            :title="playlistEl.isPlayingSource ? 'Back to main radio' : 'Play this playlist'"
                                            @click.stop="playFromPlaylist(playlistEl)"
                                        >
                                            <span
                                                class="playlist-play-icon"
                                                :class="{ paused: playlistEl.isPlayingSource }"
                                                aria-hidden="true"
                                            ></span>
                                        </button>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>

                <div ref="voiceControlItem" class="voice-control-item " :class="{ 'show': !notShowing }">
                    <input v-model="volume" @input="updateVolume" type="range" class="voice-slider" id="voiceRange"
                        min="0" max="100">
                </div>

                <div ref="boxWrapper" class="box-wrapper curve">
                    <div @click="playMusic()" class="cover-music">
                        <h1 v-if="!coverMusic || !isCoverLoaded" class="back-logo dance-baby-text">
                            <div class="font-days cover-text">
                                DANCE BABY RADIO
                            </div>
                        </h1>

                        <img v-if="!coverMusic || !isCoverLoaded" class="curve radio-poster"
                            :class="{ 'shine-me': storeSimple.isPlaying }" src="/images/background-dance-1.jpg">

                        <img v-if="!!coverMusic && !isEmpty" class="curve cover"
                            :class="{ 'shine-me  ': storeSimple.isPlaying, 'loading': !isCoverLoaded, 'loaded': isCoverLoaded }"
                            :src="coverMusic" @load="isCoverLoaded = true" @error="coverMusic = ''">

                        <div v-if="!!currentOriginTrack && !isLoading"
                            :class="{ 'opacity-0': storeSimple.isPlaying }" @click.stop="playMusic()"
                            class="play-button-box">
                            <div class="inner">
                                <div class="play-shape">
                                    <div class='button-icon' :class="{ 'paused': storeSimple.isPlaying }"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="">
                        <svg class="loading-svg" v-if="isLoading" xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 200 200">
                            <circle fill="none" stroke-opacity="1" stroke="#64EEFF" stroke-width=".5" cx="100" cy="100"
                                r="0">
                                <animate attributeName="r" calcMode="spline" dur="2" values="1;80" keyTimes="0;1"
                                    keySplines="0 .2 .5 1" repeatCount="indefinite"></animate>
                                <animate attributeName="stroke-width" calcMode="spline" dur="2" values="0;25"
                                    keyTimes="0;1" keySplines="0 .2 .5 1" repeatCount="indefinite"></animate>
                                <animate attributeName="stroke-opacity" calcMode="spline" dur="2" values="1;0"
                                    keyTimes="0;1" keySplines="0 .2 .5 1" repeatCount="indefinite"></animate>
                            </circle>
                        </svg>
                    </div>
                    <input v-model="currentTime" :max="duration" @input="onSliderInput" @change="onSliderChange" type="range" class="slider"
                        id="myRange">
                    <div class="d-flex justify-space-between max-h-100 overflow-hidden text-10 fs-9 transit"
                        :class="{ 'max-h-0': notShowing }">
                        <div class="pt-2 pl-1 text-left fs-12 titles">
                            <div>{{ originAudio ? currentSupportTrack?.title : currentOriginTrack?.title }}</div>
                            <div>{{ originAudio ? currentSupportTrack?.artist : currentOriginTrack?.artist }}</div>
                        </div>
                        <span class="">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
                    </div>

                    <audio ref="myMusic" class="my-music d-none" @timeupdate="updateRange" @ended="onOriginEnded">
                        <source :src="currentOriginTrack?.audio" type="audio/mpeg" preload="auto">
                    </audio>
                    <audio ref="myMusicSupport" class="my-music-support d-none" @timeupdate="updateRangeSupport"
                        @ended="onSupportEnded">
                        <source :src="currentSupportTrack?.audio" type="audio/mpeg" preload="auto">
                    </audio>

                </div>
            </div>

            <div @click.stop="playNextMusic()" class="next-button-box">
                <div class="inner">
                    <div class="play-shape">
                        <div class='button-icon smaller'></div>
                    </div>
                    <div class="play-shape">
                        <div class='button-icon smaller'></div>
                    </div>
                </div>
            </div>


            <div :class="'isMobile'" @click.stop="openGenres = !openGenres" class="px-1 py-1 genre-button-box">
                <div class="inner fs-10">
                    <span class="text-genre">GENRE</span>
                    <div class="position-relative h-0">
                        <div class="genre-list" :class="{ 'close-genres': !openGenres }" @click.stop>
                            <div v-for="(genreEl, index) in genres" :key="index" class="py-2 genre-element">
                                <div class="d-flex fs-13" :class="{ 'opacity-05': !genreEl.active }"
                                    @click.stop="activeGenre(genreEl)">
                                    <div>
                                        {{ genreEl.text }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div :class="'isDesktop'" @mouseover="openGenres = true" @mouseleave="openGenres = false"
                class="px-1 py-1 genre-button-box">
                <div class="inner fs-10">
                    <span class="text-genre">GENRE</span>
                    <div class="position-relative h-0">
                        <div class="genre-list" :class="{ 'close-genres': !openGenres }">
                            <div v-for="(genreEl, index) in genres" :key="index" class="py-2 genre-element">
                                <div class="d-flex fs-13" :class="{ 'opacity-05': !genreEl.active }"
                                    @click="activeGenre(genreEl)">
                                    <div>
                                        {{ genreEl.text }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <WelcomeModal :is-ready="!!currentOriginTrack && isAudioReady" @letsGo="playMusic()" v-if="letsGoModal" />
    </div>
</template>


<style lang="scss" scoped>
.PlayerMain {
    height: 100vh;

    .box-wrapper {
        background: rgba(8, 14, 16, 0.88);
        box-shadow: 0 0 30px #111a1e;
        display: inline-block;
        max-width: 400px;
        min-width: 295px;
        // min-width: 300px;
        padding: 18px;
        position: relative;
        text-align: center;
        width: 100%;
        z-index: 200;
        border: solid 1px #003e47;

        @media only screen and (max-width: 768px) {
            padding-top: 40px;
        }
    }

    .shine-me {
        box-shadow: 0 0 9px 2px #84f3ff29;
    }

    .main-container {
        height: 100%;
        width: 100%;
        position: relative;
        overflow: hidden;

        .back-img {
            position: absolute;
            background-position: center;
            background-size: cover;
            width: 100%;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 0;
        }

        .video-wrap {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 2;
            opacity: 0.5;
            overflow: hidden;

            video {
                width: 100vw;
                height: 100vh;
                object-fit: cover;

            }
        }

        // .video-content {
        //     position: absolute;
        //     top: 50%;
        //     left: 50%;
        //     transform: translate(-50%, -50%);
        //     min-width: 100%;
        //     min-height: 100%;
        //     width: auto;
        //     height: auto;
        //     object-fit: cover;
        //     z-index: -1;
        // }

        .back-dark {
            position: absolute;
            background: rgba(36, 36, 36, 0.89);
            width: 100%;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 2;

            &.no-image {
                background: rgb(36 36 36 / 67%);
            }
        }

        .bg-stars {
            opacity: 0.5;
        }

        .player-box {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            z-index: 5;
            padding: 16px;
            box-sizing: border-box;
            text-align: center;
        }

        .cover-music {
            position: relative;
            display: inline-block;
            min-height: 300px;
            width: 100%;

            @media (max-width: 768px) {

                .play-button-box {
                    width: 165px !important;
                    height: 165px !important;
                }
            }

            .cover {
                // max-width: 400px;
                // width: 100%;
                transition: width 0.5s ease, height 0.5s ease;

                &.loading {
                    width: 0;
                    height: 0;
                }

                &.loaded {
                    width: 300px;
                    height: 300px;
                }
            }

            .play-button-box {
                width: 220px;
                height: 220px;
                background-color: rgba(10, 22, 26, 0.82);
                position: absolute;
                bottom: 50%;
                transform: translate(-50%, 50%);
                left: 50%;
                border-radius: 50%;
                opacity: 0.4;
                cursor: pointer;

                &:hover {
                    opacity: 1;
                }

                .inner {
                    position: relative;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;

                }

                .triangle {
                    width: 0px;
                    height: 0px;
                    margin-left: 5px;
                    border-style: solid;
                    border-width: 0 10px 15px 10px;
                    border-color: transparent transparent #7fc1d5 transparent;
                    transform: rotate(90deg);
                }

            }


        }
    }

    .next-button-box {
        background-color: rgba(10, 22, 26, 0.9);
        border-radius: 7px;
        bottom: 27px;
        cursor: pointer;
        height: 89px;
        opacity: .85;
        position: absolute;
        right: 20px;
        width: 91px;
        z-index: 20;

        &:hover {
            opacity: 1;
        }

        .inner {
            position: relative;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;

        }

        .triangle {
            width: 0px;
            height: 0px;
            margin-left: 5px;
            border-style: solid;
            border-width: 0 10px 15px 10px;
            border-color: transparent transparent #7fc1d5 transparent;
            transform: rotate(90deg);
        }

    }

    .genre-button-box {
        width: 88px;
        height: 88px;
        background-color: rgba(10, 22, 26, 0.9);
        position: absolute;
        bottom: 27px;
        left: 20px;
        border-radius: 7px;
        cursor: pointer;
        z-index: 20;

        .text-genre {
            opacity: 0.75
        }

        &:hover {
            .text-genre {
                opacity: 1;
            }
        }

        .inner {
            position: relative;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;

        }

    }


    .slidecontainer {
        width: 100%;
    }

    .slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 5px;
        border-radius: 5px;
        // background: #52dcff;
        background: #58d1ef;
        outline: none;
        opacity: 0.7;
        -webkit-transition: .2s;
        transition: opacity .2s;
        cursor: pointer;
    }

    .slider:hover {
        opacity: 1;
    }

    .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 15px;
        height: 15px;
        border-radius: 50%;
        background: #4e4e4e;
        cursor: pointer;
    }

    .slider::-moz-range-thumb {
        width: 15px;
        height: 15px;
        border: 0;
        border-radius: 50%;
        background: #4e4e4e;
        cursor: pointer;
    }

    // .slider::-webkit-slider-thumb {
    //     -webkit-appearance: none;
    //     appearance: none;
    //     width: 25px;
    //     height: 25px;
    //     border-radius: 50%;
    //     background: #4e4e4e;
    //     cursor: pointer;
    // }

    .voice-control-item {
        position: absolute;
        left: 35px;
        transition: 0.5s;
        transform: rotate(-90deg);
        opacity: 0;
        z-index: 0;
        width: 0;
        height: 0;
        overflow: hidden;
        background-color: rgba(10, 22, 26, 0.92);
        border-radius: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        top: 50%;

        &.show {
            left: -125px;
            top: 50%;
            opacity: 1;
            width: 40px;
            height: 30px;
            z-index: 201;
            transition: 0;


            @media only screen and (max-width: 600px) {
                left: 16px;
                top: -19px;
                transform: rotate(0deg);
            }
        }
    }

    .voice-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 86%;
        height: 5px;
        transform-origin: center;
        border-radius: 5px;
        background: #58d1ef;
        outline: none;
        opacity: 0.7;
        -webkit-transition: .2s;
        transition: opacity .2s, height .2s;
        cursor: pointer;

        &:hover {
            opacity: 1;
            height: 9px;
        }

        &::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background: #4e4e4e;
            cursor: pointer;
            transition: width .2s, height .2s;
        }

        &::-moz-range-thumb {
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background: #4e4e4e;
            cursor: pointer;
            border: none;
            transition: width .2s, height .2s;
        }

        &::-moz-range-track {
            width: 100%;
            height: 5px;
            background: #58d1ef;
            border-radius: 5px;
        }
    }

    // Explicit hover styles for slider thumb
    .voice-slider:hover::-webkit-slider-thumb {
        width: 21px;
        height: 21px;
    }

    .voice-slider:hover::-moz-range-thumb {
        width: 21px;
        height: 21px;
    }

}

.loading-svg {
    width: 200px;
    height: 200px;
    position: absolute;
    bottom: 50%;
    transform: translate(-50%, 85px);
    left: 50%;

}

.cover-text {
    width: 250px;
}

.titles {
    color: #23c1d2;
}

.genre-list {
    position: absolute;
    left: 5px;
    bottom: 25px;
    padding: 10px 13px;
    background: rgba(8, 18, 22, 0.94);
    border: 1px solid rgba(132, 243, 255, 0.14);
    backdrop-filter: blur(8px);
    border-radius: 12px;
    width: 200px;
    transition: 0.2s;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);

    &.close-genres {
        width: 0;
        height: 0;
        overflow: hidden;
        min-width: 0;
        padding: 0;

    }

    &.playlist-list {
        position: relative;
        left: auto;
        right: auto;
        bottom: auto;
        top: auto;
    }

    &.playlist-list:not(.close-genres) {
        width: 250px;
        min-width: 250px;
        min-height: 120px;
        white-space: normal;
    }

    &.playlist-list.close-genres {
        width: 0;
        min-width: 0;
        min-height: 0;
        height: 0;
        padding: 0;
        overflow: hidden;
    }
}

.playlist-empty {
    padding: 2px 0 4px;
}

.playlist-empty-title {
    font-size: 13px;
    font-weight: 600;
    opacity: 1;
    color: #84f3ff;
}

.playlist-empty-text {
    font-size: 12px;
    line-height: 1.45;
    opacity: 0.8;
    margin: 2px 0 12px;
    color: #84f3ff;
}

.playlist-empty-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 11px;
    border: 1px solid rgba(132, 243, 255, 0.45);
    border-radius: 7px;
    background: rgba(10, 22, 26, 0.92);
    color: #84f3ff;
    font-size: 12px;
    cursor: pointer;

    &:hover {
        border-color: rgba(132, 243, 255, 0.85);
        background: rgba(10, 22, 26, 0.98);
    }
}

.playlist-item-row {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin: 2px 0;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid rgba(132, 243, 255, 0.08);
    background: rgba(6, 16, 20, 0.55);
    overflow: hidden;
    isolation: isolate;
    transition:
        background 0.25s ease,
        border-color 0.25s ease,
        box-shadow 0.25s ease,
        transform 0.2s ease;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: -1;
        opacity: 0;
        background:
            linear-gradient(120deg, rgba(132, 243, 255, 0.18), rgba(8, 40, 44, 0.35) 55%, rgba(132, 243, 255, 0.08));
        transition: opacity 0.25s ease;
    }

    &:hover {
        border-color: rgba(132, 243, 255, 0.28);
        box-shadow: inset 0 0 0 1px rgba(132, 243, 255, 0.08);
        transform: translateX(1px);

        &::before {
            opacity: 1;
        }

        .playlist-item-name {
            opacity: 1;
            color: #e8fbff;
        }
    }

    &.is-playing {
        border-color: rgba(132, 243, 255, 0.45);
        box-shadow:
            inset 0 0 0 1px rgba(132, 243, 255, 0.12),
            0 0 16px rgba(132, 243, 255, 0.12);
        background:
            linear-gradient(115deg, rgba(132, 243, 255, 0.22), rgba(10, 48, 56, 0.72) 48%, rgba(132, 243, 255, 0.1));

        &::before {
            opacity: 0;
        }

        .playlist-item-name {
            opacity: 1;
            color: #d8f6ff;
            font-weight: 600;
        }
    }
}

.playlist-item-name {
    flex: 1;
    min-width: 0;
    cursor: pointer;
    transition: color 0.2s ease, opacity 0.2s ease;

    > div {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

.playlist-play-btn {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    border: 1px solid rgba(132, 243, 255, 0.35);
    background: rgba(132, 243, 255, 0.12);
    color: #84f3ff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;

    &:hover:not(:disabled) {
        background: rgba(132, 243, 255, 0.28);
        border-color: rgba(132, 243, 255, 0.7);
        transform: scale(1.06);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &.active {
        background: rgba(132, 243, 255, 0.5);
        border-color: rgba(132, 243, 255, 0.95);
        box-shadow: 0 0 12px rgba(132, 243, 255, 0.35);
    }
}

.playlist-play-icon {
    width: 0;
    height: 0;
    margin-left: 2px;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 8px solid currentColor;

    &.paused {
        width: 8px;
        height: 10px;
        margin-left: 0;
        border: none;
        background:
            linear-gradient(currentColor, currentColor) 0 0 / 3px 100% no-repeat,
            linear-gradient(currentColor, currentColor) 100% 0 / 3px 100% no-repeat;
    }
}

@media only screen and (max-width: 768px) {
    .player-box {
        // width: 100%;
    }

    .cover-music {
        width: 80% !important;
        margin-bottom:10px
    }
}



.button-icon {
    box-sizing: border-box;
    width: 0;
    height: 15px;

    border-color: transparent transparent transparent #52dcff;
    transition: 100ms all ease;
    cursor: pointer;
    opacity: 0.7;
    // play state
    border-style: solid;
    border-width: 19px 0 19px 28px;
    margin-left: 6px;

    &.paused {
        border-style: double;
        border-width: 0px 0 0px 12px;
        margin-left: 0px;

    }

    &:hover {
        opacity: 1;
    }

    &.smaller {
        border-width: 8px 0 8px 12px;
        margin-left: 3px;
    }
}

.back-logo {
    position: absolute;
    left: 50%;
    top: 71%;
    transform: translate(-50%, -50%);

}

.max-h-0 {
    max-height: 0 !important;
}

.max-h-100 {
    max-height: 100px;
}

.transit {
    transition: 1s;
}
</style>