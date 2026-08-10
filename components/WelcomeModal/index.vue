<template>
  <!-- Teleport so loading / Let's GO sit above header chrome (login, brand, menus). -->
  <Teleport to="body">
    <div
      v-if="showMe"
      id="welcome-modal-container"
      class="WelcomeModal"
      :class="{ 'not-ready': !isReady }"
      @click="handleClick"
      :onclick="isReady ? 'const el = document.getElementById(\'welcome-modal-container\'); if (el) { el.style.display = \'none\'; } window.__welcomeClicked = true; if (window.__onWelcomeClick) { window.__onWelcomeClick(); }' : null"
    >
      <div v-if="!isReady" class="field" aria-hidden="true">
        <div class="field-grid"></div>
        <div class="field-glow"></div>
        <div class="scan-line scan-loading"></div>
        <div class="scan-line scan-line--delay scan-loading"></div>
      </div>

      <div class="inner">
        <div class="go-button-wrap">
          <button class="hologram" :class="{ 'is-loading-btn': !isReady }" type="button" :disabled="!isReady">
            <span v-if="isReady" data-text="Let's GO" class="text-go">Let's GO</span>
            <span v-else data-text="LOADING..." class="text-loading">LOADING...</span>

            <div v-if="!isReady" class="cyber-spinner-wrap">
              <div class="cyber-spinner"></div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
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
  /* Above header chrome (login / menus ~210) and app promo (1300). */
  z-index: 1500;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.922);
  overflow: hidden;
  
  &.not-ready {
    cursor: wait !important;
    background: rgba(0, 0, 0, 0.94);
    
    .inner {
      pointer-events: none;
    }
  }

  .field {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .field-grid {
    position: absolute;
    inset: -20%;
    background-image:
      linear-gradient(rgba(0, 255, 204, 0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px);
    background-size: 48px 48px;
    transform: perspective(600px) rotateX(58deg) translateY(-12%);
    transform-origin: center top;
    animation: gridDrift 12s linear infinite;
    opacity: 0.55;
    mask-image: linear-gradient(to bottom, transparent 0%, black 28%, black 78%, transparent 100%);
  }

  .field-glow {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 70% 45% at 50% 42%, rgba(0, 255, 204, 0.12), transparent 70%),
      radial-gradient(ellipse 90% 60% at 50% 100%, rgba(0, 180, 220, 0.08), transparent 55%);
    animation: glowPulse 3.5s ease-in-out infinite;
  }

  .go-button-wrap {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
  }

  .inner {
    position: relative;
    height: 100vh;
    z-index: 2;
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
      border: none;
      background: transparent;
      box-shadow: none;
      backdrop-filter: none;
      width: auto;
      height: auto;
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
    left: 0;
    width: 100%;
    height: 2px;
    top: 0;
    filter: blur(0.6px);
    
    &.scan-loading {
      background: linear-gradient(to right,
        transparent,
        rgba(0, 255, 204, 0.15),
        rgba(0, 255, 204, 0.9),
        rgba(0, 255, 204, 0.15),
        transparent);
      animation: scan 1.6s linear infinite;
      box-shadow: 0 0 22px 3px rgba(0, 255, 204, 0.3);
    }

    &.scan-line--delay {
      opacity: 0.35;
      height: 1px;
      filter: blur(1.2px);

      &.scan-loading {
        animation-duration: 2.4s;
        animation-delay: -0.8s;
      }
    }
  }

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
    0% { top: -5%; }
    100% { top: 105%; }
  }

  @keyframes textPulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; text-shadow: 0 0 15px rgba(0, 255, 204, 1); }
  }

  @keyframes cyberSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes gridDrift {
    0% { background-position: 0 0, 0 0; }
    100% { background-position: 0 48px, 48px 0; }
  }

  @keyframes glowPulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
}
</style>
