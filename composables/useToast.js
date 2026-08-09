import { ref } from 'vue'

const toasts = ref([])
let seed = 0

const DEFAULT_DURATION = 4500

/**
 * Global toast queue. Multiple notifications stack under each other.
 *
 * @example
 * const { toast } = useToast()
 * toast.success('Saved')
 * toast.error('Something went wrong')
 * toast.info('Check your email', { duration: 10000 })
 */
export function useToast() {
  const remove = (id) => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index === -1) return

    const item = toasts.value[index]
    if (item._timer) clearTimeout(item._timer)
    toasts.value.splice(index, 1)
  }

  const clear = () => {
    toasts.value.forEach((t) => {
      if (t._timer) clearTimeout(t._timer)
    })
    toasts.value = []
  }

  const scheduleRemove = (item) => {
    if (!item || item.duration <= 0 || item._paused) return
    if (item._timer) clearTimeout(item._timer)

    item._deadline = Date.now() + item._remaining
    item._timer = setTimeout(() => remove(item.id), item._remaining)
  }

  const pause = (id) => {
    const item = toasts.value.find((t) => t.id === id)
    if (!item || item.duration <= 0 || item._paused) return

    if (item._timer) {
      clearTimeout(item._timer)
      item._timer = null
    }

    if (item._deadline) {
      item._remaining = Math.max(0, item._deadline - Date.now())
    }

    item._paused = true
    item._deadline = null
  }

  const resume = (id) => {
    const item = toasts.value.find((t) => t.id === id)
    if (!item || item.duration <= 0 || !item._paused) return

    item._paused = false

    if (item._remaining <= 0) {
      remove(id)
      return
    }

    scheduleRemove(item)
  }

  const push = (message, options = {}) => {
    const id = ++seed
    const type = options.type || 'info'
    const title = options.title || ''
    const highlight = options.highlight ? String(options.highlight) : ''
    const duration =
      options.duration === 0
        ? 0
        : typeof options.duration === 'number'
          ? options.duration
          : DEFAULT_DURATION

    const item = {
      id,
      type,
      title,
      message: String(message ?? ''),
      highlight,
      duration,
      createdAt: Date.now(),
      _timer: null,
      _remaining: duration,
      _deadline: null,
      _paused: false,
    }

    toasts.value.push(item)

    if (duration > 0) {
      scheduleRemove(item)
    }

    return id
  }

  const toast = {
    show: (message, options) => push(message, options),
    info: (message, options = {}) => push(message, { ...options, type: 'info' }),
    success: (message, options = {}) => push(message, { ...options, type: 'success' }),
    warning: (message, options = {}) => push(message, { ...options, type: 'warning' }),
    error: (message, options = {}) => push(message, { ...options, type: 'error' }),
  }

  return {
    toasts,
    toast,
    remove,
    clear,
    pause,
    resume,
  }
}
