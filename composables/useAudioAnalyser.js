/**
 * Web Audio tap for the radio <audio> elements (visualizer spectrum data).
 *
 * ── DANGER: DO NOT WIRE THIS BACK TO THE PLAYER ELEMENTS ──
 * Track files are served from a mix of hosts: CORS-enabled (Supabase Storage
 * signed URLs) and plain hosts without CORS headers (dl.iraniandj.ir,
 * dc.vmusic.ir, ...). Tracks from the latter load via the no-CORS fallback
 * (retryAudioWithoutCors in PlayerMain). Once an element is routed through
 * createMediaElementSource(), the routing is PERMANENT, and per the Web Audio
 * spec a MediaElementSourceNode outputs SILENCE for any resource that is
 * CORS-cross-origin — i.e. every no-CORS fallback track played on that
 * element after the tap. That is what silenced random playback after leaving
 * live mode: the live station row is a CORS-capable Supabase Storage URL, so
 * live mode always tapped the element, and the next random track (usually a
 * no-CORS host) played muted while the UI showed normal playback.
 *
 * An element can only ever be captured by one MediaElementSource (one-shot
 * WeakSet here), and disconnecting one mutes the element for the rest of its
 * life. There is no way to un-route an element, so this composable must stay
 * unused until all track hosts send CORS headers, or the player dedicates
 * fresh elements to CORS-approved tracks only.
 */
let ctx = null
let analyser = null
let mixGain = null
let freqData = null
let timeData = null
const connected = new WeakSet()

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

export function useAudioAnalyser() {
    const getContext = () => {
        if (ctx) {
            applyAnalyserSettings()
            return ctx
        }
        if (typeof window === 'undefined') return null

        const AC = window.AudioContext || window.webkitAudioContext
        if (!AC) return null

        ctx = new AC()
        analyser = ctx.createAnalyser()
        applyAnalyserSettings()

        mixGain = ctx.createGain()
        mixGain.gain.value = 1
        mixGain.connect(analyser)
        analyser.connect(ctx.destination)

        return ctx
    }

    const unlock = () => {
        const audioCtx = getContext()
        if (audioCtx?.state === 'suspended') {
            return audioCtx.resume().catch(() => {})
        }
        return Promise.resolve()
    }

    const canTap = (el) => !!el && el.crossOrigin === 'anonymous'

    const connectElement = (el) => {
        if (!canTap(el)) return false
        if (connected.has(el)) return true
        if (!el.currentSrc || el.paused) return false

        const audioCtx = getContext()
        if (!audioCtx || !mixGain) return false
        if (audioCtx.state !== 'running') return false

        try {
            const source = audioCtx.createMediaElementSource(el)
            source.connect(mixGain)
            connected.add(el)
            return true
        } catch (error) {
            console.warn('Audio analyser could not tap element:', error)
            return false
        }
    }

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

    return {
        unlock,
        connectElement,
        canTap,
        read,
    }
}
