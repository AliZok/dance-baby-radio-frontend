import { useSupabase } from '@/composables/useSupabase'
import { useMusicAPI } from '@/composables/useMusicAPI'
import playListLive from '@/store/playListLive'

export const LIVE_STATION_ID = 1
export const LIVE_POLL_MS = 5000

export function parseDurationToSeconds(value) {
    if (value == null || value === '') return null
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value > 0 ? value : null
    }

    const parts = String(value).trim().split(':').map(Number)
    if (!parts.length || parts.some((part) => !Number.isFinite(part))) return null

    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    return parts[0]
}

export function getLiveElapsedSeconds(startedAt) {
    if (!startedAt) return 0
    const start = new Date(startedAt).getTime()
    if (!Number.isFinite(start)) return 0
    return Math.max(0, (Date.now() - start) / 1000)
}

export function isLiveTrackExpired(row, graceSeconds = 1.25) {
    if (!row?.audio) return true
    if (!row?.startedAt) return true

    const elapsed = getLiveElapsedSeconds(row.startedAt)
    const duration = parseDurationToSeconds(row.duration)

    if (duration == null) {
        // Unknown length: treat as stale after 15 minutes so a dead station can recover.
        return elapsed > 15 * 60
    }

    return elapsed >= duration + graceSeconds
}

export function liveRowIdentity(row) {
    if (!row?.audio) return ''
    return `${row.audio}|${row.startedAt || ''}`
}

export function liveRowToTrack(row) {
    if (!row?.audio) return null

    return {
        id: row.audio,
        title: row.title || '',
        artist: row.artist || '',
        cover: row.cover || '',
        audio: row.audio,
        genre: row.genre || '',
        duration: row.duration || '',
        score: row.star,
        startedAt: row.startedAt,
    }
}

export function trackToLivePayload(track) {
    return {
        title: track?.title || '',
        artist: track?.artist || '',
        cover: track?.cover || '',
        audio: track?.audio || '',
        genre: track?.genre || '',
        duration: track?.duration || '',
        star: track?.score ?? track?.star ?? null,
        startedAt: new Date().toISOString(),
    }
}

export function useLiveRadio() {
    const { supabase } = useSupabase()
    const { getRandomActiveMusic } = useMusicAPI()

    const fetchLiveStation = async () => {
        const { data, error } = await supabase
            .from('live-music')
            .select('*')
            .eq('id', LIVE_STATION_ID)
            .maybeSingle()

        if (error) {
            console.error('fetchLiveStation Error:', error)
            return null
        }

        if (data) playListLive.liveMusic = data
        return data
    }

    const publishLiveStation = async (track) => {
        const payload = trackToLivePayload(track)
        const { data, error } = await supabase
            .from('live-music')
            .update(payload)
            .eq('id', LIVE_STATION_ID)
            .select()
            .maybeSingle()

        if (error) {
            console.error('publishLiveStation Error:', error)
            return null
        }

        if (data) playListLive.liveMusic = data
        return data
    }

    const claimLiveStation = async (expectedStartedAt, track) => {
        const payload = trackToLivePayload(track)
        let query = supabase
            .from('live-music')
            .update(payload)
            .eq('id', LIVE_STATION_ID)

        if (expectedStartedAt) {
            query = query.eq('startedAt', expectedStartedAt)
        } else {
            query = query.is('startedAt', null)
        }

        const { data, error } = await query.select()

        if (error) {
            console.error('claimLiveStation Error:', error)
            return { data: null, claimed: false, error }
        }

        if (data?.[0]) {
            playListLive.liveMusic = data[0]
            return { data: data[0], claimed: true, error: null }
        }

        return { data: null, claimed: false, error: null }
    }

    const pickStationTrack = async (excludeTrack = null) => {
        const { data, error } = await getRandomActiveMusic({
            genreFilters: [],
            excludeTrack,
        })
        if (error || !data?.audio) return null
        return data
    }

    const ensureLiveStation = async ({ excludeTrack = null } = {}) => {
        const current = await fetchLiveStation()
        if (current && !isLiveTrackExpired(current)) {
            return current
        }

        const nextTrack = await pickStationTrack(excludeTrack)
        if (!nextTrack) return current

        const claimed = await claimLiveStation(current?.startedAt, nextTrack)
        if (claimed.claimed) return claimed.data

        const latest = await fetchLiveStation()
        if (latest && !isLiveTrackExpired(latest)) return latest

        return await publishLiveStation(nextTrack) || latest
    }

    const advanceLiveStation = async ({ currentRow = null, excludeTrack = null } = {}) => {
        const current = currentRow || await fetchLiveStation()
        const nextTrack = await pickStationTrack(excludeTrack)
        if (!nextTrack) return current

        const claimed = await claimLiveStation(current?.startedAt, nextTrack)
        if (claimed.claimed) return claimed.data

        const latest = await fetchLiveStation()
        if (latest && liveRowIdentity(latest) !== liveRowIdentity(current)) {
            return latest
        }

        if (!latest || isLiveTrackExpired(latest)) {
            return await publishLiveStation(nextTrack)
        }

        return latest
    }

    const subscribeLiveStation = (onChange) => {
        let stopped = false

        const notify = (row) => {
            if (stopped || !row) return
            onChange(row)
        }

        const channel = supabase
            .channel(`live-radio-station-${LIVE_STATION_ID}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'live-music',
                    filter: `id=eq.${LIVE_STATION_ID}`,
                },
                (payload) => {
                    notify(payload.new)
                },
            )
            .subscribe()

        const pollId = setInterval(async () => {
            if (stopped) return
            const row = await fetchLiveStation()
            notify(row)
        }, LIVE_POLL_MS)

        return () => {
            stopped = true
            clearInterval(pollId)
            supabase.removeChannel(channel)
        }
    }

    return {
        fetchLiveStation,
        publishLiveStation,
        claimLiveStation,
        ensureLiveStation,
        advanceLiveStation,
        subscribeLiveStation,
        pickStationTrack,
        parseDurationToSeconds,
        getLiveElapsedSeconds,
        isLiveTrackExpired,
        liveRowIdentity,
        liveRowToTrack,
    }
}
