import { ref } from 'vue'
import playListLive from "@/store/playListLive"
import { useSupabase } from '@/composables/useSupabase'

const { supabase } = useSupabase()

export const useMusicAPI = () => {
    const TimeGetNewMusic = ref('')
    const getLiveMusic = async (id) => {
        const { data, error } = await supabase
            .from('live-music')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Fetch Error:', error);
            return null;
        }

        playListLive.liveMusic = data
        // TimeGetNewMusic.value = 
        return playListLive.liveMusic

    }

    const updateLiveMusic = async (objectToInsert) => {
        // const objectToInsert = {
        //     title: 'Evolution',
        //     artist: 'Interplay Records',
        //     cover: 'https://vmusic.ir/wp-content/uploads/2024/07/Interplay-Records-Interplay-Radio-Episode-513-2024.jpg',
        //     audio: 'https://dc.vmusic.ir/2024/07/Interplay Records - Interplay Radio Episode 513 (2024)/128k/03) Interplay Records - Evolution (Interplay 51).mp3',
        //     genre: 'electronic trance',
        //     duration: '3:40',
        //     star: 4,
        //     finishAt: '',
        // }
        console.log("fuck alizoka 111111", objectToInsert)


        objectToInsert.startedAt = new Date()
        
        const { data, error } = await supabase.from('musics').update(objectToInsert).eq('id', 1);

        if (error) {
            console.error('Insert Error:', error);
        } else {
            console.log('Insert Success:', data);
        }

        console.log("fuck alizoka", objectToInsert)
        
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
        return { data: track || null, error: null }
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

    const addMusic = async (musicData) => {
        const { data, error } = await supabase
            .from('musics')
            .insert([
                {
                    title: musicData.title,
                    artist: musicData.artist,
                    cover: musicData.cover,
                    audio: musicData.audio,
                    genre: musicData.genre,
                    duration: musicData.duration
                }
            ])
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
        const musicToInsert = musicArray.map(music => ({
            title: music.title,
            artist: music.artist,
            cover: music.cover,
            audio: music.audio,
            genre: music.genre,
            duration: music.duration
        }));

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