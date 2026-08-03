<script setup>
import storeSimple from "@/store/storeSimple"

const router = useRouter()
const { isLoggedIn, currentUser, initAuth, signOut } = useSupabase()

const isPlaying = computed(() => storeSimple.value.isPlaying)
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

                <div v-if="isPlaying" class="tape-wrapper">
                    <img class="visual" src="/public/test-pics/radio-playing-2.webp" alt="">
                </div>
            </div>
        </div>

        <div v-if="isLoggedIn" ref="menuRoot" class="user-menu">
            <button type="button" class="user-menu-trigger" @click.stop="toggleMenu" aria-label="Account menu">
                <span class="user-menu-icon">☰</span>
                <span class="user-menu-email">{{ currentUser?.email }}</span>
            </button>

            <div v-if="menuOpen" class="user-menu-dropdown">
                <button type="button" class="user-menu-item" @click="goToPlaylists">
                    Playlists
                </button>
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
    gap: 8px;
    max-width: 220px;
    padding: 8px 12px;
    border-radius: 10px;
    border: 1px solid rgba(132, 243, 255, 0.28);
    background: rgba(8, 40, 44, 0.75);
    color: #94d4e3;
    cursor: pointer;
    backdrop-filter: blur(8px);
    transition: background 0.2s ease, border-color 0.2s ease;

    &:hover {
        background: rgba(8, 40, 44, 0.92);
        border-color: rgba(132, 243, 255, 0.5);
    }
}

.user-menu-icon {
    font-size: 14px;
    line-height: 1;
}

.user-menu-email {
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.user-menu-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    min-width: 160px;
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
