import playListLive from "@/store/playListLive"

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
        objectToInsert.startedAt = new Date()
        const { data, error } = await supabase.from('live-music').update(objectToInsert).eq('id', 1);

        if (error) {
            console.error('Insert Error:', error);
        } else {
            console.log('Insert Success:', data);
        }
    }

    const getMusicList = async () => {
        const { data, error } = await supabase.from('save-json').select('*')

        if (error) {
            console.error('gettttt Error:', error)
        } else {
            const pureList = data[0].musics
            playListLive.musics = []
             Object.entries(pureList).map(item => playListLive.musics.push(item[1]) )
        }
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
        addMusic,
        addMultipleMusics
    }
}