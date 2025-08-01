<template>
  <div v-if="showMe" class="WelcomeModal" @click="handleClick">
    <div class="inner ">
      <div class="go-button-wrap">
        <button class="hologram" type="button">
          <span data-text="Let's GO" class="text-go">Let's GO</span>
          <div class="scan-line"></div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const Emit = defineEmits(['letsGo'])
const showMe = ref(true)

function handleClick() {
  showMe.value = false
  Emit('letsGo')
}

const handleKeyPlays = (event) => {
  if (event.code === 'Space' || event.code === 'Enter') {
    handleClick()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyPlays)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyPlays)
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

    &:hover {
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
    color: #ff00ff;
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
}
</style>