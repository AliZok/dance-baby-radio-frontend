<template>
  <div 
    v-if="showMe" 
    id="welcome-modal-container"
    class="WelcomeModal" 
    :class="{ 'not-ready': !isReady }"
    @click="handleClick"
    :onclick="isReady ? 'const el = document.getElementById(\'welcome-modal-container\'); if (el) { el.style.display = \'none\'; } window.__welcomeClicked = true; if (window.__onWelcomeClick) { window.__onWelcomeClick(); }' : null"
  >
    <div class="inner ">
      <div class="go-button-wrap">
        <button class="hologram" :class="{ 'is-loading-btn': !isReady }" type="button" :disabled="!isReady">
          <span v-if="isReady" data-text="Let's GO" class="text-go">Let's GO</span>
          <span v-else data-text="LOADING..." class="text-loading">LOADING...</span>
          <div class="scan-line" :class="{ 'scan-loading': !isReady }"></div>
          
          <!-- Cyberpunk glowing spinner inside the holographic button container -->
          <div v-if="!isReady" class="cyber-spinner-wrap">
            <div class="cyber-spinner"></div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  isReady: {
    type: Boolean,
    default: false
  }
})

const Emit = defineEmits(['letsGo'])
const showMe = ref(true)

function handleClick() {
  if (!props.isReady || !showMe.value) return
  showMe.value = false
  Emit('letsGo')
}

const handleKeyPlays = (event) => {
  if (!props.isReady) return
  if (event.code === 'Space' || event.code === 'Enter') {
    handleClick()
  }
}

onMounted(() => {
  if (props.isReady && window.__welcomeClicked) {
    handleClick()
  } else {
    window.__onWelcomeClick = () => {
      handleClick()
    }
  }
  window.addEventListener('keydown', handleKeyPlays)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyPlays)
  if (window.__onWelcomeClick) {
    window.__onWelcomeClick = null
  }
})
</script>

<style lang="scss">
.WelcomeModal {
  width: 100%;
  height: 100%;
  z-index: 1100;
  position: fixed;
  background: rgba(0, 0, 0, 0.922);
  top: 0;
  
  &.not-ready {
    cursor: wait !important;
    pointer-events: none; // Disables clicking anything on the overlay while loading
    
    .inner {
      pointer-events: none;
    }
  }

  .go-button-wrap {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .inner {
    position: relative;
    height: 100vh;
  }

  .text-go {
    transition: 0.7s;
  }

  .text-loading {
    color: #00ffcc;
    text-shadow: 0 0 10px rgba(0, 255, 204, 0.8);
    font-size: 1rem;
    letter-spacing: 2px;
    animation: textPulse 1.5s infinite ease-in-out;
  }

  .hologram {
    position: relative;
    padding: 1.5rem 3rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
    background: none;
    border: none;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.4s ease;

    &:hover:not(:disabled) {
      box-shadow: 0 0 10px 4px #c7387ead;

      .text-go {
        font-size: 26px;
      }
    }
  }

  button.hologram {
    border: 2px solid rgba(0, 255, 255, 0.5);
    background: rgba(0, 255, 255, 0.1);
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
    backdrop-filter: blur(5px);
    width: 240px;
    height: 230px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 15px;
    
    &.is-loading-btn {
      border-color: rgba(0, 255, 204, 0.3);
      background: rgba(0, 255, 204, 0.05);
      box-shadow: 0 0 15px rgba(0, 255, 204, 0.15);
      cursor: wait !important;
      pointer-events: none;
    }
  }

  .hologram span {
    position: relative;
    display: inline-block;
    text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
  }

  .hologram span::before,
  .hologram span::after {
    content: attr(data-text);
    position: absolute;
    left: 0;
    opacity: 0;
    filter: blur(1px);
    transition: all 0.3s ease;
  }

  .hologram span::before {
    top: -2px;
    color: #00ffcc;
    transform: translateX(0);
    animation: glitch 2s infinite;
  }

  .hologram span::after {
    bottom: -2px;
    color: #00ffff;
    transform: translateX(0);
    animation: glitch 2s infinite reverse;
  }

  .scan-line {
    position: absolute;
    width: 100%;
    height: 2px;
    background: linear-gradient(to right,
      transparent,
      rgba(0, 255, 255, 0.8),
      transparent);
    top: 0;
    animation: scan 2s linear infinite;
    filter: blur(1px);
    
    &.scan-loading {
      background: linear-gradient(to right,
        transparent,
        rgba(0, 255, 204, 0.8),
        transparent);
      animation: scan 1s linear infinite; // Scans twice as fast during loading
    }
  }

  // Neon Cyberpunk Spinner (Cyan & Mint Green, minimized purple)
  .cyber-spinner-wrap {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cyber-spinner {
    width: 40px;
    height: 40px;
    border: 2px solid transparent;
    border-top-color: #00ffcc;
    border-bottom-color: #00ffff;
    border-radius: 50%;
    animation: cyberSpin 1.2s cubic-bezier(0.53, 0.21, 0.29, 0.67) infinite;
    box-shadow: 0 0 8px rgba(0, 255, 204, 0.5), inset 0 0 8px rgba(0, 255, 255, 0.5);
  }

  @keyframes glitch {
    0%, 100% { transform: translateX(0); opacity: 0.3; }
    20% { transform: translateX(-5px); opacity: 0.5; }
    40% { transform: translateX(5px); opacity: 0.7; }
    60% { transform: translateX(-3px); opacity: 0.5; }
    80% { transform: translateX(3px); opacity: 0.3; }
  }

  @keyframes scan {
    0% { top: -10%; }
    100% { top: 110%; }
  }

  @keyframes textPulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; text-shadow: 0 0 15px rgba(0, 255, 204, 1); }
  }

  @keyframes cyberSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
}
</style>