/**
 * Taps the radio <audio> elements through Web Audio so a visualizer can
 * read live frequency data. Playback is routed through the AudioContext;
 * only call connectElement() when the element loaded with CORS
 * (crossOrigin === 'anonymous'), otherwise Chrome/Safari will output silence.
 *
 * Graph is a module singleton: createMediaElementSource() can run only once
 * per element, and closing the context would permanently mute the player.
 * Never disconnect a MediaElementSource — that mutes the element until a
 * later play() on a different tag.
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
