<script setup>
import storeSimple from "@/store/storeSimple"

const route = useRoute()
const router = useRouter()
const { isLoggedIn, currentUser, initAuth, signOut } = useSupabase()

const isPlaying = computed(() => storeSimple.value.isPlaying)
const isPlayerRoute = computed(() => {
  const path = route.path
  return path === '/' || path.startsWith('/play')
})
const isAuthRoute = computed(() => {
  const path = route.path
  return path === '/login' || path === '/register'
})
// Keep the playing indicator while music continues on auth pages.
const showPlayingIcon = computed(
  () => isPlaying.value && (isPlayerRoute.value || isAuthRoute.value),
)
const menuOpen = ref(false)
const menuRoot = ref(null)

const toggleMenu = () => {
    menuOpen.value = !menuOpen.value
}

const closeMenu = () => {
    menuOpen.value = false
}

const handleClickOutside = (event) => {
    if (!menuRoot.value) return
    if (!menuRoot.value.contains(event.target)) {
        closeMenu()
    }
}

const apkUrl = '/downloads/dance-baby-radio-version-5.apk'

const goToPlaylists = () => {
    closeMenu()
    router.push('/playlists')
}

const handleLogout = async () => {
    closeMenu()
    await signOut()
    await router.push('/login')
}

onMounted(async () => {
    await initAuth()
    document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
    <div class="HeaderMain">
        <div class="inner-header">
            <div class="auto-shadow my-brand mb-2 flex hello">
                <h1 class="font-days home-link-title">
                    <NuxtLink to="/">DANCE BABY RADIO</NuxtLink>
                </h1>

                <div v-if="showPlayingIcon" class="tape-wrapper">
                    <img class="visual" src="/public/test-pics/radio-playing-2.webp" alt="">
                </div>
            </div>
        </div>

        <div v-if="isLoggedIn" ref="menuRoot" class="user-menu">
            <button type="button" class="user-menu-trigger" @click.stop="toggleMenu" aria-label="Account menu">
                <span class="user-menu-icon">☰</span>
            </button>

            <div v-if="menuOpen" class="user-menu-dropdown">
                <div class="user-menu-email">{{ currentUser?.email }}</div>
                <button type="button" class="user-menu-item" @click="goToPlaylists">
                    Playlists
                </button>
                <a
                    class="user-menu-item user-menu-download"
                    :href="apkUrl"
                    download="dance-baby-radio.apk"
                    @click="closeMenu"
                >
                    Download Android App
                </a>
                <button type="button" class="user-menu-item danger" @click="handleLogout">
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

.tape-wrapper {
    display: inline-block;
    width: 44px;
    height: 25px;
    overflow: hidden;
    border-radius: 0px;
    opacity: 0.6;
    border-radius: 4px;

    .visual {
        width: 117%;
        height: 126%;
        transform: translate(-5px, -5px);
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
    pointer-events: none;

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
    background: rgba(10, 22, 26, 0.92);
    color: #94d4e3;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
        background: rgba(10, 22, 26, 0.98);
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
    min-width: 180px;
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
}

a.user-menu-download {
    color: #84f3ff;
}

.com {
    font-size: 10px;
}

.auto-shadow {
    // animation: mymove 5s;
    // animation-iteration-count: infinite;
}

.my-brand {
    font-size: 18px;

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
