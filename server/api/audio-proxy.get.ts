/**
 * Visualizer audio proxy.
 *
 * The EQ/sparkle lights (components/LedLights) need same-origin (or CORS-clean)
 * audio to read spectrum data through the Web Audio API. Most catalog tracks
 * sit on hosts that send no CORS headers, so useAudioAnalyser downloads a copy
 * of the track through this route as a blob and analyzes that instead.
 *
 * IMPORTANT:
 *  - This route serves ONLY the visualizer. The audible player keeps streaming
 *    directly from the music hosts, so playback never depends on this proxy.
 *  - Only hosts that appear in the music catalog are proxyable. When tracks
 *    are added from a NEW host, add it to ALLOWED_HOSTS — until then those
 *    tracks simply keep the ambient animation.
 *  - https only. (Some catalog rows use plain http URLs; browsers block those
 *    as mixed content on the https site, so there is nothing to visualize.)
 */
const ALLOWED_HOSTS = new Set([
    'cdn.mp3wr.com',
    'db.vmusic.ir',
    'dc.vmusic.ir',
    'dl.aftabmusic.com',
    'dl.bandmusic.ir',
    'dl.behmelody.in',
    'dl.ememay.ir',
    'dl.iraniandj.ir',
    'dl.javanmelody.ir',
    'dl.mehrdl.top',
    'dl.mp3index.ir',
    'dl.musicdagh.ir',
    'dl.musicdel.ir',
    'dl.musicdrum.ir',
    'dl.musicsweb.ir',
    'dl.shabamusic.com',
    'dl.somemusic.ir',
    'dl.songsara.net',
    'dl.uptrack.ir',
    'dl.vmusic.ir',
    'dl3.songsara.net',
    'dl5.songsara.net',
    'dl6.songsara.net',
    'dlmuweb.musicmellnet.com',
    'ememay.ir',
    'fdveybzxmfvhbznemfpr.supabase.co',
    'github.com',
    'irsv.upmusics.com',
    'miowhffogcqhjcjjhabr.supabase.co',
    'release-assets.githubusercontent.com',
    'sv.ahoramusics.ir',
    'sv2.mybia2music.com',
    'uploadb.me',
])

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const raw = typeof query.url === 'string' ? query.url : ''

    if (!raw) {
        throw createError({ statusCode: 400, statusMessage: 'Missing url' })
    }

    let target
    try {
        target = new URL(raw)
    } catch {
        throw createError({ statusCode: 400, statusMessage: 'Invalid url' })
    }

    if (target.protocol !== 'https:' || !ALLOWED_HOSTS.has(target.hostname)) {
        throw createError({ statusCode: 403, statusMessage: 'Host not allowed' })
    }

    // Cancel the upstream download when the client goes away (track switch,
    // tab close) so the function does not keep pulling bytes.
    const controller = new AbortController()
    event.node.res.on('close', () => controller.abort())

    let upstream
    try {
        upstream = await fetch(target.href, {
            redirect: 'follow',
            signal: controller.signal,
        })
    } catch {
        throw createError({ statusCode: 502, statusMessage: 'Track host unreachable' })
    }

    if (!upstream.ok || !upstream.body) {
        throw createError({
            statusCode: 502,
            statusMessage: `Track host responded ${upstream.status}`,
        })
    }

    const headers = new Headers()
    const contentType = upstream.headers.get('content-type')
    headers.set('content-type', contentType || 'audio/mpeg')
    const contentLength = upstream.headers.get('content-length')
    if (contentLength) headers.set('content-length', contentLength)
    headers.set('access-control-allow-origin', '*')
    // Browser cache for replays of the same track, edge cache for repeats
    // across listeners where the platform supports it.
    headers.set('cache-control', 'public, max-age=3600')
    headers.set('netlify-cdn-cache-control', 'public, max-age=86400')

    return sendWebResponse(
        event,
        new Response(upstream.body, { status: 200, headers }),
    )
})
