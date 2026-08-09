<template>
  <div class="notify-stack" aria-live="polite" aria-relevant="additions">
    <TransitionGroup name="notify">
        <div
          v-for="item in toasts"
          :key="item.id"
          class="notify-card"
          :class="[
            `notify-card--${item.type}`,
            { 'notify-card--paused': item._paused },
          ]"
          role="status"
          @mouseenter="pause(item.id)"
          @mouseleave="resume(item.id)"
        >
          <div class="notify-card__icon" aria-hidden="true">
          <svg v-if="item.type === 'success'" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" />
            <path d="M8 12.2l2.6 2.6L16.2 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <svg v-else-if="item.type === 'error'" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" />
            <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          <svg v-else-if="item.type === 'warning'" viewBox="0 0 24 24" fill="none">
            <path d="M12 4.5L21 19.5H3L12 4.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
            <path d="M12 10v4.5M12 17.2v.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" />
            <path d="M12 11v5.5M12 8.2v.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </div>

        <div class="notify-card__body">
          <p v-if="item.title" class="notify-card__title">{{ item.title }}</p>
          <p class="notify-card__message">
            <template v-if="item.highlight">
              <template v-for="(part, index) in splitHighlight(item.message, item.highlight)" :key="index">
                <span v-if="part.accent" class="notify-card__accent-text">{{ part.text }}</span>
                <template v-else>{{ part.text }}</template>
              </template>
            </template>
            <template v-else>{{ item.message }}</template>
          </p>
        </div>

        <button
          type="button"
          class="notify-card__close"
          aria-label="Dismiss notification"
          @click="remove(item.id)"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </button>

        <div
          v-if="item.duration > 0"
          class="notify-card__progress"
          :style="{ animationDuration: `${item.duration}ms` }"
        ></div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
const { toasts, remove, pause, resume } = useToast()

const splitHighlight = (message = '', highlight = '') => {
  if (!highlight) return [{ text: message, accent: false }]

  const parts = []
  let remaining = String(message)
  const needle = String(highlight)

  while (remaining.length) {
    const at = remaining.indexOf(needle)
    if (at === -1) {
      parts.push({ text: remaining, accent: false })
      break
    }
    if (at > 0) parts.push({ text: remaining.slice(0, at), accent: false })
    parts.push({ text: needle, accent: true })
    remaining = remaining.slice(at + needle.length)
  }

  return parts
}
</script>

<style scoped lang="scss">
.notify-stack {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1400;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(380px, calc(100vw - 32px));
  pointer-events: none;
}

.notify-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 40px 16px 14px;
  overflow: hidden;
  pointer-events: auto;
  color: #e8fbff;
  background: rgba(6, 28, 34, 0.94);
  border: 1px solid rgba(132, 243, 255, 0.28);
  border-radius: 12px;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow:
    0 14px 36px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(132, 243, 255, 0.08);
}

.notify-card__icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  margin-top: 1px;
  color: #84f3ff;

  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.notify-card__body {
  min-width: 0;
  flex: 1;
}

.notify-card__title {
  margin: 0 0 3px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: #d8f6ff;
}

.notify-card__message {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(232, 251, 255, 0.92);
  word-break: break-word;
}

.notify-card__accent-text {
  color: #84f3ff;
  font-weight: 600;
}

.notify-card__close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(232, 251, 255, 0.55);
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    color: #e8fbff;
    background: rgba(132, 243, 255, 0.1);
  }
}

.notify-card__progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  transform-origin: left center;
  background: linear-gradient(90deg, rgba(132, 243, 255, 0.95), rgba(88, 209, 239, 0.55));
  animation-name: notify-progress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

.notify-card--paused .notify-card__progress {
  animation-play-state: paused;
}

.notify-card--success {
  border-color: rgba(100, 238, 180, 0.35);

  .notify-card__icon {
    color: #64eeb4;
  }

  .notify-card__progress {
    background: linear-gradient(90deg, #64eeb4, rgba(100, 238, 180, 0.45));
  }
}

.notify-card--error {
  border-color: rgba(255, 107, 138, 0.4);

  .notify-card__icon {
    color: #ff6b8a;
  }

  .notify-card__progress {
    background: linear-gradient(90deg, #ff6b8a, rgba(255, 107, 138, 0.45));
  }
}

.notify-card--warning {
  border-color: rgba(255, 208, 96, 0.4);

  .notify-card__icon {
    color: #ffd060;
  }

  .notify-card__progress {
    background: linear-gradient(90deg, #ffd060, rgba(255, 208, 96, 0.45));
  }
}

.notify-enter-active,
.notify-leave-active {
  transition:
    opacity 0.28s ease,
    transform 0.28s ease;
}

.notify-enter-from {
  opacity: 0;
  transform: translateX(18px) scale(0.98);
}

.notify-leave-to {
  opacity: 0;
  transform: translateX(18px) scale(0.98);
}

.notify-move {
  transition: transform 0.28s ease;
}

@keyframes notify-progress {
  from {
    transform: scaleX(1);
  }

  to {
    transform: scaleX(0);
  }
}

@media (max-width: 640px) {
  .notify-stack {
    top: 14px;
    right: 16px;
    left: 16px;
    width: auto;
  }
}
</style>
