<script setup>
const props = defineProps({
    originEl: { default: null },
    supportEl: { default: null },
    playing: { type: Boolean, default: false },
})

const wrapEl = ref(null)
const canvasEl = ref(null)

const { unlock, connectElement, canTap, read } = useAudioAnalyser()

let ctx2d = null
let rafId = 0
let lastTs = 0
let tapped = false
let reducedMotion = false
let hidden = false

const peaks = []
const displayed = []
const sparkles = []
let logRanges = null
let logRangesKey = ''
let glow = 0
let flash = 0
let bassEma = 0
let bassPeakPrev = 0
let kickEnv = 0
let lastKickAt = 0
let breath = 0

const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

const fillRoundRect = (ctx, x, y, w, h, r) => {
    if (w <= 0 || h <= 0) return
    const radius = Math.max(0, Math.min(r, w / 2, h / 2))
    if (radius < 0.4) {
        ctx.fillRect(x, y, w, h)
        return
    }
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.arcTo(x + w, y, x + w, y + h, radius)
    ctx.arcTo(x + w, y + h, x, y + h, radius)
    ctx.arcTo(x, y + h, x, y, radius)
    ctx.arcTo(x, y, x + w, y, radius)
    ctx.closePath()
    ctx.fill()
}

const ledRgb = (t, flashAmt) => {
    let r
    let g
    let b
    if (t < 0.34) {
        const k = t / 0.34
        r = 36 + k * 96
        g = 232 + k * 11
        b = 168 + k * 87
    } else if (t < 0.66) {
        const k = (t - 0.34) / 0.32
        r = 132 + k * -55
        g = 243 + k * -118
        b = 255
    } else {
        const k = (t - 0.66) / 0.34
        r = 77 + k * 115
        g = 125 + k * -18
        b = 255
    }
    if (flashAmt > 0) {
        r = Math.min(255, r + flashAmt * 36)
        b = Math.min(255, b + flashAmt * 28)
    }
    return [r | 0, g | 0, b | 0]
}

const avgRange = (freq, start, end) => {
    const a = Math.max(0, start)
    const b = Math.min(freq.length, end)
    if (b <= a) return 0
    let sum = 0
    for (let i = a; i < b; i++) sum += freq[i]
    return sum / (b - a) / 255
}

const maxRange = (freq, start, end) => {
    const a = Math.max(0, start)
    const b = Math.min(freq.length, end)
    if (b <= a) return 0
    let m = 0
    for (let i = a; i < b; i++) if (freq[i] > m) m = freq[i]
    return m / 255
}

const rmsTime = (time) => {
    let acc = 0
    for (let i = 0; i < time.length; i++) {
        const v = (time[i] - 128) / 128
        acc += v * v
    }
    return Math.sqrt(acc / time.length)
}

const getLogRanges = (binCount, sampleRate, barCount) => {
    const key = `${binCount}:${sampleRate}:${barCount}`
    if (logRanges && logRangesKey === key) return logRanges

    const ranges = []
    const bassBars = Math.min(8, Math.max(5, Math.floor(barCount * 0.2)))
    for (let i = 0; i < bassBars; i++) {
        ranges.push([1 + i, 2 + i])
    }

    const startBin = 1 + bassBars
    const minF = Math.max(80, (startBin / binCount) * (sampleRate / 2))
    const maxF = Math.min(16000, sampleRate * 0.48)
    const rest = barCount - bassBars
    for (let i = 0; i < rest; i++) {
        const t0 = i / rest
        const t1 = (i + 1) / rest
        const f0 = minF * (maxF / minF) ** t0
        const f1 = minF * (maxF / minF) ** t1
        const b0 = Math.max(startBin, Math.floor((f0 / (sampleRate / 2)) * binCount))
        const b1 = Math.max(b0 + 1, Math.floor((f1 / (sampleRate / 2)) * binCount))
        ranges.push([b0, Math.min(binCount, b1)])
    }
    logRanges = ranges
    logRangesKey = key
    return ranges
}

const seedSparkles = (width, height, count) => {
    sparkles.length = 0
    for (let i = 0; i < count; i++) {
        const n = Math.sin(i * 127.1 + 311.7) * 43758.5453
        const n2 = Math.sin(i * 269.5 + 19.2) * 23421.631
        const u = n - Math.floor(n)
        const v = n2 - Math.floor(n2)
        sparkles.push({
            x: u * width,
            y: 0.08 * height + v * height * 0.52,
            s: 1.1 + (u * 1.8),
            band: 0.55 + v * 0.4,
        })
    }
}

const resizeCanvas = () => {
    const canvas = canvasEl.value
    const wrap = wrapEl.value
    if (!canvas || !wrap) return

    const rect = wrap.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(1, Math.floor(rect.width))
    const height = Math.max(1, Math.floor(rect.height))
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx2d = canvas.getContext('2d', { alpha: true, desynchronized: true })
    if (ctx2d) ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)
    seedSparkles(width, height, width < 768 ? 28 : 48)
}

const tryConnect = () => {
    if (canTap(props.originEl)) {
        if (connectElement(props.originEl)) tapped = true
    }
    if (canTap(props.supportEl)) {
        if (connectElement(props.supportEl)) tapped = true
    }
}

const drawColumn = (ctx, x, bottom, colW, colH, leds, level, peak, flashAmt) => {
    const gap = Math.max(1.5, colW * 0.16)
    const ledH = (colH - gap * (leds - 1)) / leds
    const lit = Math.max(0, Math.min(leds, Math.round(level * leds)))
    const peakIdx = Math.max(0, Math.min(leds - 1, Math.round(peak * leds) - 1))

    for (let i = 0; i < leds; i++) {
        const y = bottom - (i + 1) * ledH - i * gap
        const t = leds === 1 ? 0 : i / (leds - 1)
        if (i < lit) {
            const [r, g, b] = ledRgb(t, flashAmt)
            const fade = 0.55 + 0.45 * (i + 1) / lit
            ctx.fillStyle = `rgba(${r},${g},${b},${fade})`
            fillRoundRect(ctx, x, y, colW, ledH, Math.min(2.2, ledH * 0.35))
        } else {
            ctx.fillStyle = 'rgba(18, 24, 62, 0.28)'
            fillRoundRect(ctx, x, y, colW, ledH, Math.min(2.2, ledH * 0.35))
        }
    }

    if (peak > 0.06) {
        const y = bottom - (peakIdx + 1) * ledH - peakIdx * gap
        const [r, g, b] = ledRgb(peakIdx / Math.max(1, leds - 1), 1)
        ctx.fillStyle = `rgba(${Math.min(255, r + 18)},${Math.min(255, g + 12)},${Math.min(255, b + 40)},0.95)`
        fillRoundRect(ctx, x, y, colW, ledH, Math.min(2.2, ledH * 0.35))
    }
}

const drawFrame = (ts) => {
    rafId = 0
    const canvas = canvasEl.value
    if (!canvas || !ctx2d) return

    const dt = Math.min(0.05, lastTs ? (ts - lastTs) / 1000 : 0.016)
    lastTs = ts

    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (w < 2 || h < 2) return

    if (reducedMotion) {
        ctx2d.clearRect(0, 0, w, h)
        return
    }

    const snapshot = tapped ? read() : null
    let bass = 0
    let highs = 0
    let energy = 0
    let hasSignal = false
    const isMobile = w < 768
    const barCount = isMobile ? 26 : 42
    const leds = isMobile ? 12 : 16
    const levels = new Array(barCount).fill(0)
    const nowSec = ts / 1000

    if (snapshot) {
        const { freq, time, binCount, sampleRate } = snapshot
        let freqSum = 0
        for (let i = 1; i < freq.length; i++) freqSum += freq[i]
        hasSignal = freqSum > 8
        if (hasSignal) {
            const bassPeak = maxRange(freq, 1, 6)
            bassEma = bassEma * 0.9 + bassPeak * 0.1
            const flux = Math.max(0, bassPeak - bassPeakPrev)
            bassPeakPrev = bassPeak
            const punch = Math.max(0, bassPeak - bassEma * 0.82)
            if ((punch > 0.08 || flux > 0.06) && nowSec - lastKickAt > 0.12) {
                lastKickAt = nowSec
                kickEnv = 1
                flash = 1
            }

            const ranges = getLogRanges(binCount, sampleRate, barCount)
            const bassBars = Math.min(8, Math.max(5, Math.floor(barCount * 0.2)))
            for (let i = 0; i < barCount; i++) {
                const [a, b] = ranges[i]
                const raw = maxRange(freq, a, b)
                if (i < bassBars) {
                    const t = 1 - i / bassBars
                    const bounced = Math.max(0, raw - bassEma * 0.92) * 4.2
                    levels[i] = Math.min(1, bounced * 0.85 + kickEnv * (0.5 + t * 0.5) + raw * 0.08)
                } else {
                    const pump = kickEnv * (0.28 * (1 - (i - bassBars) / Math.max(1, barCount - bassBars)))
                    levels[i] = Math.min(1, raw ** 0.78 * 1.2 + pump)
                }
            }
            bass = Math.min(1, punch * 2.2 + kickEnv * 0.85 + bassPeak * 0.15)
            highs = avgRange(freq, Math.floor(binCount * 0.45), Math.floor(binCount * 0.85))
            energy = Math.min(1, rmsTime(time) * 2.4)
        }
    }

    kickEnv = Math.max(0, kickEnv - dt * 7.5)
    flash = Math.max(0, flash - dt * 4.2)

    const live = props.playing && !reducedMotion && !hidden
    if (!hasSignal) {
        breath += dt * (live ? 1.6 : 0.4)
        const pulse = live ? (Math.sin(breath) * 0.5 + 0.5) * 0.16 : 0
        bass = glow * 0.92 + pulse * 0.08
        energy = pulse
    }

    while (peaks.length < barCount) peaks.push(0)
    while (displayed.length < barCount) displayed.push(0)
    if (peaks.length > barCount) peaks.length = barCount
    if (displayed.length > barCount) displayed.length = barCount
    for (let i = 0; i < barCount; i++) {
        const target = levels[i]
        const follow = target > displayed[i] ? Math.min(1, dt * 28) : Math.min(1, dt * 9)
        displayed[i] += (target - displayed[i]) * follow
        if (displayed[i] < 0.004) displayed[i] = 0
        peaks[i] = Math.max(displayed[i], peaks[i] - dt * 1.15)
    }

    glow += (bass - glow) * Math.min(1, dt * 12)

    ctx2d.clearRect(0, 0, w, h)

    const anyMotion = live || glow > 0.012 || flash > 0.012 || peaks.some((p) => p > 0.02)
    if (!anyMotion) return

    const floorTop = h * (isMobile ? 0.72 : 0.7)
    const floorGrad = ctx2d.createLinearGradient(0, floorTop, 0, h)
    floorGrad.addColorStop(0, 'rgba(0,0,0,0)')
    floorGrad.addColorStop(1, `rgba(0, 6, 10, ${0.16 + glow * 0.18})`)
    ctx2d.fillStyle = floorGrad
    ctx2d.fillRect(0, floorTop, w, h - floorTop)

    ctx2d.save()
    ctx2d.globalCompositeOperation = 'lighter'

    const bloom = glow * 0.52 + flash * 0.22
    const radius = Math.max(w, h) * (0.22 + glow * 0.18 + flash * 0.08)
    const bloomGrad = ctx2d.createRadialGradient(w * 0.5, h * 0.48, 0, w * 0.5, h * 0.48, radius)
    bloomGrad.addColorStop(0, `rgba(132, 243, 255, ${bloom})`)
    bloomGrad.addColorStop(0.38, `rgba(90, 120, 255, ${bloom * 0.32})`)
    bloomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx2d.fillStyle = bloomGrad
    ctx2d.fillRect(0, 0, w, h)

    if (flash > 0.05) {
        const kickGrad = ctx2d.createRadialGradient(w * 0.5, h * 0.82, 0, w * 0.5, h * 0.82, w * 0.55)
        kickGrad.addColorStop(0, `rgba(180, 110, 255, ${flash * 0.2})`)
        kickGrad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx2d.fillStyle = kickGrad
        ctx2d.fillRect(0, h * 0.5, w, h * 0.5)
    }

    const specH = isMobile ? h * 0.22 : h * 0.24
    const specBottom = h - (isMobile ? 18 : 26)
    const specTop = specBottom - specH
    const padX = isMobile ? 16 : 40
    const innerW = w - padX * 2
    const gapX = innerW / barCount
    const colW = Math.max(4, gapX * 0.58)
    const offset = padX + (gapX - colW) / 2

    for (let i = 0; i < barCount; i++) {
        const x = offset + i * gapX
        const level = displayed[i]
        drawColumn(ctx2d, x, specBottom, colW, specH, leds, level, peaks[i], flash)

        if (level > 0.04) {
            ctx2d.globalAlpha = 0.22 * level
            ctx2d.fillStyle = 'rgba(132, 243, 255, 1)'
            ctx2d.fillRect(x, specTop + specH, colW, Math.min(28, specH * 0.22) * level)
            ctx2d.globalAlpha = 1
        }
    }

    const twinkle = hasSignal ? highs : energy * 0.5
    for (let i = 0; i < sparkles.length; i++) {
        const p = sparkles[i]
        const tw = 0.15 + 0.85 * Math.abs(Math.sin(nowSec * (1.4 + p.band) + i))
        const a = twinkle * tw * (0.25 + glow * 0.55 + kickEnv * 0.35)
        if (a < 0.02) continue
        const violet = i % 3 === 0
        ctx2d.fillStyle = violet
            ? `rgba(196, 132, 252, ${Math.min(0.7, a)})`
            : `rgba(132, 243, 255, ${Math.min(0.7, a)})`
        ctx2d.beginPath()
        ctx2d.arc(p.x, p.y, p.s * (0.7 + flash * 0.6), 0, Math.PI * 2)
        ctx2d.fill()
    }

    ctx2d.restore()

    const shouldKeepRunning =
        live ||
        glow > 0.01 ||
        flash > 0.01 ||
        peaks.some((p) => p > 0.02)

    if (shouldKeepRunning) schedule()
}

const schedule = () => {
    if (rafId) return
    rafId = requestAnimationFrame(drawFrame)
}

const stopLoop = () => {
    if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = 0
    }
    lastTs = 0
}

const onUnlock = () => {
    unlock()
}

const onAudioPlaying = () => {
    unlock()?.then(() => {
        if (props.originEl?.paused && props.supportEl?.paused) return
        tryConnect()
    })
}

const onVisibility = () => {
    hidden = document.hidden
    if (hidden) return
    unlock()?.then(() => {
        if (props.playing) tryConnect()
        if (props.playing) schedule()
    })
}

let resizeObs = null
let boundEls = []

const bindPlaying = () => {
    for (const el of boundEls) el.removeEventListener('playing', onAudioPlaying)
    boundEls = [props.originEl, props.supportEl].filter(Boolean)
    for (const el of boundEls) el.addEventListener('playing', onAudioPlaying)
}

onMounted(() => {
    reducedMotion = prefersReducedMotion()
    resizeCanvas()
    window.addEventListener('pointerdown', onUnlock, { capture: true })
    window.addEventListener('keydown', onUnlock)
    window.addEventListener('focus', onUnlock)
    window.addEventListener('pageshow', onUnlock)
    document.addEventListener('visibilitychange', onVisibility)
    resizeObs = new ResizeObserver(resizeCanvas)
    if (wrapEl.value) resizeObs.observe(wrapEl.value)
    bindPlaying()
    if (props.playing) schedule()
})

onBeforeUnmount(() => {
    window.removeEventListener('pointerdown', onUnlock, { capture: true })
    window.removeEventListener('keydown', onUnlock)
    window.removeEventListener('focus', onUnlock)
    window.removeEventListener('pageshow', onUnlock)
    document.removeEventListener('visibilitychange', onVisibility)
    for (const el of boundEls) el.removeEventListener('playing', onAudioPlaying)
    boundEls = []
    resizeObs?.disconnect()
    stopLoop()
})

watch(
    () => [props.originEl, props.supportEl, props.playing],
    () => {
        bindPlaying()
        unlock()?.then(() => {
            if (props.playing) tryConnect()
            schedule()
        })
    },
)
</script>

<template>
    <div ref="wrapEl" class="LedLights" aria-hidden="true">
        <canvas ref="canvasEl" />
    </div>
</template>

<style scoped lang="scss">
.LedLights {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    overflow: hidden;
    opacity: 0.48;

    canvas {
        display: block;
        width: 100%;
        height: 100%;
    }
}
</style>
