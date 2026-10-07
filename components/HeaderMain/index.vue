<script setup>
import storeSimple from "@/store/storeSimple"

const route = useRoute()
const router = useRouter()
const { isLoggedIn, currentUser, initAuth, signOut } = useSupabase()
const { introCoverActive } = useIntroGate()
const { wantLive, requestLive, requestRandom, modeBusy } = usePlaybackMode()

const isPlaying = computed(() => storeSimple.value.isPlaying)
const isPlayerRoute = computed(() => isPlayerRoutePath(route.path))
const isAuthRoute = computed(() => {
  const path = route.path
  return path === '/login' || path === '/register'
})
const isPlaylistsRoute = computed(() => route.path === '/playlists')
// Keep the playing indicator while music continues on auth / playlists.
const showPlayingIcon = computed(
  () => isPlaying.value && (isPlayerRoute.value || isAuthRoute.value || isPlaylistsRoute.value),
)
// LIVE toggle sits beside the playing tape icon. It stays available on the player
// page even while stopped/paused; on other routes it follows the playing indicator.
const showLiveToggle = computed(() => isPlayerRoute.value || showPlayingIcon.value)
// Hide brand/menu only while the black boot cover is active — driven by Vue state
// (not a sticky html class) so it always comes back after intro.
const hideForBoot = computed(
  () => isPlayerRoute.value && introCoverActive.value,
)
const menuOpen = ref(false)
const menuRoot = ref(null)
const isMobileViewport = ref(
    import.meta.client && window.matchMedia('(max-width: 768px)').matches,
)
const mobileChromeVisible = computed(() => !!storeSimple.value.mobileChromeVisible)
// Only off-canvas on real mobile viewports (CSS ≤768). Desktop must stay clickable
// even while player chrome is hidden — otherwise the ☰ is visible but dead.
const mobileOffcanvas = computed(
    () => isMobileViewport.value && isPlayerRoute.value && !mobileChromeVisible.value && !menuOpen.value,
)

const showLoginItem = computed(() => !isLoggedIn.value && !isAuthRoute.value)

const toggleMenu = () => {
    menuOpen.value = !menuOpen.value
}

const closeMenu = () => {
    menuOpen.value = false
}

watch(mobileChromeVisible, (visible) => {
    if (!visible) closeMenu()
})

const handleClickOutside = (event) => {
    if (menuRoot.value && !menuRoot.value.contains(event.target)) {
        closeMenu()
    }
}

// Toggle beside the playing radio icon: active plays the live stream, inactive
// shows a low-key gray "GO LIVE" label and keeps the random shuffle.
const toggleLiveMode = () => {
    if (modeBusy.value) return
    if (wantLive.value) requestRandom()
    else requestLive()
}

let mobileMq = null
const syncMobileViewport = () => {
    isMobileViewport.value = !!mobileMq?.matches
}

const apkUrl = 'https://github.com/AliZok/android-app---dance-baby-radio-/releases/download/android-app/dance-baby-radio-version-8.3.apk'

const goToPlaylists = () => {
    closeMenu()
    router.push('/playlists')
}

const goToLogin = () => {
    closeMenu()
    router.push('/login')
}

const handleLogout = async () => {
    closeMenu()
    await signOut()
    await router.push('/login')
}

onMounted(async () => {
    await initAuth()
    document.addEventListener('click', handleClickOutside)
    if (typeof window !== 'undefined') {
        mobileMq = window.matchMedia('(max-width: 768px)')
        syncMobileViewport()
        mobileMq.addEventListener?.('change', syncMobileViewport)
    }
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
    mobileMq?.removeEventListener?.('change', syncMobileViewport)
})
</script>

<template>
    <div class="HeaderMain" :class="{ 'header-boot-hidden': hideForBoot }">
        <div class="inner-header">
            <div class="auto-shadow my-brand mb-2 flex hello">
                <h1 class="font-days home-link-title">
                    <NuxtLink to="/">DANCE BABY RADIO</NuxtLink>
                </h1>

                <div v-if="showLiveToggle" class="playing-status">
                    <div v-if="showPlayingIcon" class="tape-wrapper">
                        <img class="visual" src="/public/test-pics/radio-playing-2.webp" alt="Dance Baby Radio playing electronic dance music">
                    </div>
                    <button
                        type="button"
                        class="live-toggle"
                        :class="{ active: wantLive }"
                        :disabled="modeBusy"
                        :aria-pressed="wantLive"
                        :title="wantLive ? 'Live radio on — click for random mode' : 'Click to go live'"
                        @click="toggleLiveMode"
                    >
                        <span class="live-dot" aria-hidden="true"></span>
                        {{ wantLive ? 'LIVE' : 'GO LIVE' }}
                    </button>
                </div>
            </div>
        </div>

        <div
            ref="menuRoot"
            class="user-menu"
            :class="{ 'mobile-offcanvas': mobileOffcanvas }"
        >
            <button type="button" class="user-menu-trigger" @click.stop="toggleMenu" aria-label="Menu">
                <span class="user-menu-icon">☰</span>
            </button>

            <div v-if="menuOpen" class="user-menu-dropdown">
                <div v-if="isLoggedIn" class="user-menu-email">{{ currentUser?.email }}</div>
                <button v-if="isLoggedIn" type="button" class="user-menu-item" @click="goToPlaylists">
                    Playlists
                </button>
                <a
                    class="user-menu-item user-menu-download"
                    :href="apkUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click="closeMenu"
                >
                    Download Android App
                </a>
                <button v-if="showLoginItem" type="button" class="user-menu-item" @click="goToLogin">
                    Login
                </button>
                <button v-if="isLoggedIn" type="button" class="user-menu-item danger" @click="handleLogout">
                    Log out
                </button>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
.home-link-title {
    font-size: 27px;
    display: inline-block;
    margin-right: 17px;

    @media only screen and (max-width: 768px) {
        // font-size: 19px;
    }
}

.playing-status {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 4px;
}

.tape-wrapper {
    display: inline-block;
    width: 44px;
    height: 25px;
    overflow: hidden;
    border-radius: 4px;
    opacity: 0.6;
    flex-shrink: 0;

    .visual {
        width: 117%;
        height: 126%;
        transform: translate(-5px, -5px);
        pointer-events: none;
        border-radius: 8px;
    }
}

.live-toggle {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 9px;
    border: none;
    background: transparent;
    // Rounds the hover tint; invisible at rest since bg/border are none.
    border-radius: 7px;
    color: #90999d;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.18em;
    line-height: 1;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition:
        color 0.25s ease,
        background 0.25s ease,
        opacity 0.25s ease;

    .live-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #6d7579;
        flex-shrink: 0;
    }

    &.active {
        color: #ff8da3;

        .live-dot {
            background: #ff4d6d;
            box-shadow: 0 0 6px rgba(255, 77, 109, 0.9);
            animation: live-pulse 1.2s ease-in-out infinite;
        }
    }

    &:not(:disabled):active {
        scale: 0.96;
    }

    @media (hover: hover) {
        &:not(:disabled):hover {
            color: #ccd5d9;
            background: rgba(144, 153, 157, 0.14);

            .live-dot {
                background: #9aa4a9;
            }
        }

        &.active:not(:disabled):hover {
            color: #ffb3c2;
            background: rgba(255, 77, 109, 0.12);
        }
    }

    &:disabled {
        opacity: 0.55;
        cursor: default;
    }

    @media only screen and (max-width: 768px) {
        padding: 9px 12px;
    }
}

@keyframes live-pulse {
    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.45;
        transform: scale(0.72);
    }
}

.HeaderMain {
    position: absolute;
    z-index: 100;
    padding-top: 10px;
    padding-left: 10px;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    overflow: hidden;
    pointer-events: none;

    &.header-boot-hidden {
        visibility: hidden;
    }

    .inner-header,
    .user-menu {
        pointer-events: auto;
    }
}

.user-menu {
    position: absolute;
    top: 10px;
    right: 14px;
    z-index: 200;
    transition: transform 0.4s ease, opacity 0.35s ease;
}

@media only screen and (max-width: 768px) {
    .HeaderMain .user-menu.mobile-offcanvas {
        transform: translate(calc(100% + 28px), calc(-100% - 28px));
        opacity: 0;
        pointer-events: none;
    }
}

.user-menu-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: none;
    border-radius: 7px;
    background: rgba(10, 22, 26, 0.9);
    color: #94d4e3;
    cursor: pointer;
    opacity: 1;
    scale: 1;
    -webkit-tap-highlight-color: transparent;
    box-shadow:
        0 10px 28px rgba(6, 18, 22, 0.55),
        0 0 18px rgba(132, 243, 255, 0.12),
        0 0 1px rgba(132, 243, 255, 0.25);
    transition:
        background 0.35s ease,
        color 0.35s ease,
        box-shadow 0.35s ease,
        scale 0.22s ease;

    &:active {
        scale: 1.08;
        color: #84f3ff;
        background: rgba(10, 22, 26, 0.98);
        box-shadow:
            0 12px 32px rgba(6, 18, 22, 0.65),
            0 0 26px rgba(132, 243, 255, 0.28),
            0 0 1px rgba(132, 243, 255, 0.45);
    }

    @media (hover: hover) {
        &:hover {
            scale: 1.08;
            color: #84f3ff;
            background: rgba(10, 22, 26, 0.98);
            box-shadow:
                0 12px 32px rgba(6, 18, 22, 0.65),
                0 0 26px rgba(132, 243, 255, 0.28),
                0 0 1px rgba(132, 243, 255, 0.45);
        }
    }
}

.user-menu-icon {
    font-size: 15px;
    line-height: 1;
}

.user-menu-email {
    padding: 8px 12px 10px;
    margin-bottom: 2px;
    border-bottom: 1px solid rgba(132, 243, 255, 0.12);
    font-size: 12px;
    color: #94d4e3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.user-menu-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    min-width: 196px;
    max-width: min(260px, calc(100vw - 28px));
    padding: 6px;
    border-radius: 10px;
    border: 1px solid rgba(132, 243, 255, 0.22);
    background: rgba(6, 28, 34, 0.96);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(10px);
}

.user-menu-item {
    display: block;
    width: 100%;
    padding: 10px 12px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #e8fbff;
    text-align: left;
    font-size: 13px;
    cursor: pointer;
    text-decoration: none;
    box-sizing: border-box;
    transition: background 0.2s ease;

    &:hover {
        background: rgba(132, 243, 255, 0.12);
    }

    &.danger {
        color: #ff8da3;

        &:hover {
            background: rgba(255, 107, 138, 0.12);
        }
    }

    &:disabled {
        opacity: 0.6;
        cursor: default;
    }
}

a.user-menu-download {
    color: #84f3ff;
}

.com {
    font-size: 10px;
}

.my-brand {
    font-size: 18px;
    align-items: center;

    a {
        text-decoration: none;
        color: #7edee3;
        color: #94d4e3;
    }
}

@keyframes mymove {
    0% {
        text-shadow: 5px 1px 8px #ccfbf700;
    }

    50% {
        text-shadow: 5px 1px 10px #ccfbf7a8;
    }

    100% {
        text-shadow: 5px 1px 8px #ccfbf700;
    }
}
</style>
