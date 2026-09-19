import { ref } from 'vue'
import playListLive from "@/store/playListLive"
import { useSupabase } from '@/composables/useSupabase'

const { supabase } = useSupabase()

export const useMusicAPI = () => {
    const TimeGetNewMusic = ref('')
    const getLiveMusic = async (id = 1) => {
        const { data, error } = await supabase
            .from('live-music')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error('Fetch Error:', error);
            return null;
        }

        playListLive.liveMusic = data
        return playListLive.liveMusic
    }

    const updateLiveMusic = async (objectToInsert, id = 1) => {
        const payload = {
            ...objectToInsert,
            startedAt: objectToInsert?.startedAt || new Date().toISOString(),
        }

        const { data, error } = await supabase
            .from('live-music')
            .update(payload)
            .eq('id', id)
            .select()
            .maybeSingle()

        if (error) {
            console.error('updateLiveMusic Error:', error)
            return null
        }

        playListLive.liveMusic = data
        return data
    }

    const getMusicList = async () => {
        const { data, error } = await supabase.from('save-json').select('*')

        if (error) {
            console.error('getMusicList Error:', error)
            return { data: null, error }
        }

        const pureList = data[0]?.musics || {}
        const musicsArray = Object.values(pureList)
        playListLive.musics = musicsArray
        return { data: musicsArray, error: null }
    }

    const getMusics = async () => {
        const { data, error } = await supabase
            .from('musics')
            .select('*')
            .order('id', { ascending: true })

        return { data, error }
    }

    // Normalize RPC / table row shapes so the player always gets `audio` + `cover`.
    // After the musics schema / get_random_track rewrite, the RPC may return
    // `audio_url` / `cover_url` (and an empty `playlists` array) instead of the
    // column names used everywhere else in the app.
    const normalizeTrack = (track) => {
        if (!track) return null

        return {
            ...track,
            audio: track.audio || track.audio_url || '',
            cover: track.cover || track.cover_url || '',
        }
    }

    // Calls the `get_random_track` Postgres function (created in Supabase's SQL editor), which does the
    // random pick (is_active + genre filter + ORDER BY random() LIMIT 1) directly in the database,
    // so only one lightweight request is needed per pick.
    const getRandomTrack = async (genreFilters = []) => {
        const targetGenres = genreFilters && genreFilters.length ? genreFilters : null

        const { data, error } = await supabase.rpc('get_random_track', { target_genres: targetGenres })

        if (error) {
            console.error('getRandomTrack Error:', error)
            return { data: null, error }
        }

        const track = Array.isArray(data) ? data[0] : data
        return { data: normalizeTrack(track), error: null }
    }

    // Picks one random active track, optionally avoiding `excludeTrack` (used to keep origin/support distinct).
    // Only retries once on a collision to keep the request count minimal.
    const getRandomActiveMusic = async ({ genreFilters = [], excludeTrack = null } = {}) => {
        const { data: selected, error } = await getRandomTrack(genreFilters)
        if (error || !selected) {
            return { data: null, error }
        }

        if (excludeTrack && selected.id === excludeTrack.id) {
            const { data: retrySelected } = await getRandomTrack(genreFilters)
            if (retrySelected) {
                return { data: retrySelected, error: null }
            }
        }

        return { data: selected, error: null }
    }

    const updateMusicById = async (id, updates) => {
        const { data, error } = await supabase
            .from('musics')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Update Music Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data?.[0] || null };
    }

    const toNumberOrNull = (value) => {
        if (value === '' || value === null || value === undefined) return null
        const n = Number(value)
        return Number.isFinite(n) ? n : null
    }

    const mapMusicForInsert = (music) => ({
        title: music.title || '',
        artist: music.artist || '',
        cover: music.cover || '',
        audio: music.audio,
        genre: music.genre,
        duration: music.duration || '',
        score: toNumberOrNull(music.score) ?? 4.4,
        reference: music.reference || '',
        is_active: music.is_active !== false,
    })

    const addMusic = async (musicData) => {
        const { data, error } = await supabase
            .from('musics')
            .insert([mapMusicForInsert(musicData)])
            .select();

        if (error) {
            console.error('Add Music Error:', error);
            return { success: false, error: error.message };
        } else {
            console.log('Add Music Success:', data);
            return { success: true, data: data[0] };
        }
    }

    const addMultipleMusics = async (musicArray) => {
        const musicToInsert = musicArray.map(mapMusicForInsert);

        const { data, error } = await supabase
            .from('musics')
            .insert(musicToInsert)
            .select();

        if (error) {
            console.error('Add Multiple Musics Error:', error);
            return { success: false, error: error.message };
        } else {
            console.log('Add Multiple Musics Success:', data);
            return { success: true, data: data };
        }
    }

    return {
        getLiveMusic,
        updateLiveMusic,
        getMusicList,
        getMusics,
        addMusic,
        addMultipleMusics,
        updateMusicById,
        getRandomTrack,
        getRandomActiveMusic
    }
}