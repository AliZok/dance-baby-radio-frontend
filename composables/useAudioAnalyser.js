/**
 * Web Audio spectrum source for the LedLights visualizer.
 *
 * ── DANGER: NEVER CAPTURE THE PLAYER'S <audio> ELEMENTS ──
 * Track files are served from a mix of hosts: CORS-enabled (Supabase Storage
 * signed URLs) and plain hosts without CORS headers (dl.iraniandj.ir,
 * dc.vmusic.ir, ...). Player tracks load with crossOrigin="anonymous" and
 * fall back to a no-CORS reload (retryAudioWithoutCors in PlayerMain) when
 * the host sends no Access-Control-Allow-Origin.
 *
 * Per the Web Audio spec a MediaElementSourceNode outputs SILENCE for any
 * resource loaded without CORS, the capture is PERMANENT, and an element can
 * only ever be captured once. Routing a player element therefore silenced
 * every later no-CORS fallback track played on it — that is exactly what
 * silenced random playback after leaving live mode (the live station is a
 * CORS-capable Supabase URL, so live mode always captured myMusic).
 *
 * Instead the spectrum now comes from a dedicated hidden "mirror" element:
 *  - the mirror is owned by this module; the player never plays through it;
 *  - it only ever loads the URL of a track that is already playing through a
 *    proven-CORS player element, so its own load re-verifies CORS — if the
 *    host is not CORS-capable the mirror load simply fails and the lights
 *    fall back to the ambient animation;
 *  - its graph output ends in a gain of 0, so it can never make sound, and
 *    the audible player elements stay untouched and unsilenceable.
 */
let ctx = null
let analyser = null
let silentGain = null
let freqData = null
let timeData = null

// Hidden duplicate <audio> routed through the graph above. Module singleton:
// createMediaElementSource() can run only once per element.
let mirrorEl = null
let mirrorUnavailable = false
let mirrorUrl = ''
let mirrorNeedPlay = false
let mirrorLastPlayTry = 0
let mirrorDeadUntil = 0
let lastResumeTry = 0

const applyAnalyserSettings = () => {
    if (!analyser) return
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.28
    analyser.minDecibels = -72
    analyser.maxDecibels = -12
    if (!freqData || freqData.length !== analyser.frequencyBinCount) {
        freqData = new Uint8Array(analyser.frequencyBinCount)
        timeData = new Uint8Array(analyser.fftSize)
    }
}

const ensureGraph = () => {
    if (ctx) {
        applyAnalyserSettings()
        return true
    }
    if (typeof window === 'undefined') return false

    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return false

    ctx = new AC()
    analyser = ctx.createAnalyser()
    applyAnalyserSettings()

    // Gain 0 between analyser and destination keeps the graph rendering
    // (browsers may skip subgraphs that reach no output) while the mirror
    // element stays completely inaudible.
    silentGain = ctx.createGain()
    silentGain.gain.value = 0
    analyser.connect(silentGain)
    silentGain.connect(ctx.destination)

    return true
}

const unlock = () => {
    // A user gesture is exactly what unblocks autoplay — let the mirror retry
    // its play() immediately instead of waiting out a backoff.
    mirrorDeadUntil = 0
    if (!ensureGraph()) return Promise.resolve()
    if (ctx.state === 'suspended') {
        return ctx.resume().catch(() => {})
    }
    return Promise.resolve()
}

const ensureMirror = () => {
    if (mirrorEl) return mirrorEl
    if (mirrorUnavailable) return null
    if (!ensureGraph()) return null

    try {
        const el = new Audio()
        el.crossOrigin = 'anonymous'
        el.preload = 'auto'
        el.setAttribute('playsinline', '')

        // One-shot capture of the mirror element. Safe here precisely because
        // the mirror is dedicated to the visualizer: the player never plays
        // through it and it only ever receives proven-CORS URLs, so its
        // permanent routing can never silence audible playback.
        const source = ctx.createMediaElementSource(el)
        source.connect(analyser)
        el.addEventListener('error', () => {
            // CORS/network failure of the mirror copy: back off and let the
            // ambient animation run — the audible player is unaffected.
            mirrorDeadUntil = performance.now() + 30000
            mirrorNeedPlay = false
        })

        mirrorEl = el
        return mirrorEl
    } catch (error) {
        console.warn('Audio analyser could not build the mirror element:', error)
        mirrorUnavailable = true
        return null
    }
}

const pauseMirror = () => {
    if (mirrorEl && !mirrorEl.paused) {
        try {
            mirrorEl.pause()
        } catch {
            // ignore
        }
    }
    mirrorNeedPlay = true
}

// An element is CORS-safe when its crossOrigin="anonymous" load succeeded:
// the no-CORS fallback marks the element and strips crossOrigin from it.
const isCorsSafeSource = (el) =>
    !!el &&
    el.crossOrigin === 'anonymous' &&
    el.dataset?.corsFallback !== '1' &&
    !el.error

const read = () => {
    applyAnalyserSettings()
    if (!analyser || !ctx || !freqData || !timeData) return null
    analyser.getByteFrequencyData(freqData)
    analyser.getByteTimeDomainData(timeData)
    return {
        freq: freqData,
        time: timeData,
        binCount: analyser.frequencyBinCount,
        sampleRate: ctx.sampleRate,
    }
}

/**
 * Called every animation frame with the player element that is currently
 * sounding (PlayerMain passes `originAudio ? myMusicSupport : myMusic`).
 * Keeps the hidden mirror in sync and returns a spectrum snapshot, or null
 * when no CORS-safe spectrum is available (ambient animation fallback).
 * The player element itself is only READ here — never captured.
 */
const sample = (sourceEl) => {
    if (typeof window === 'undefined') return null

    if (!isCorsSafeSource(sourceEl) || sourceEl.paused || sourceEl.readyState < 2) {
        pauseMirror()
        return null
    }

    const url = sourceEl.currentSrc || ''
    if (!url) {
        pauseMirror()
        return null
    }

    const el = ensureMirror()
    if (!el) return null

    const now = performance.now()

    if (mirrorUrl !== url) {
        mirrorUrl = url
        mirrorDeadUntil = 0
        try {
            el.pause()
        } catch {
            // ignore
        }
        el.src = url
        el.load()
        mirrorNeedPlay = true
    }

    if (ctx.state === 'suspended' && now - lastResumeTry > 1000) {
        lastResumeTry = now
        ctx.resume().catch(() => {})
    }

    if (
        !el.error &&
        (mirrorNeedPlay || (el.paused && now > mirrorDeadUntil && now - mirrorLastPlayTry > 4000))
    ) {
        mirrorNeedPlay = false
        mirrorLastPlayTry = now
        el.play().catch(() => {
            mirrorDeadUntil = performance.now() + 15000
        })
    }

    if (el.paused || el.ended) return null

    const drift = Math.abs(el.currentTime - sourceEl.currentTime)
    if (Number.isFinite(drift) && drift > 0.35) {
        try {
            el.currentTime = sourceEl.currentTime
        } catch {
            // ignore
        }
    }

    return read()
}

const release = () => {
    pauseMirror()
    mirrorNeedPlay = false
    mirrorUrl = ''
    if (mirrorEl) {
        try {
            mirrorEl.pause()
            mirrorEl.removeAttribute('src')
            mirrorEl.load()
        } catch {
            // ignore
        }
    }
}

export function useAudioAnalyser() {
    return {
        unlock,
        sample,
        release,
    }
}
