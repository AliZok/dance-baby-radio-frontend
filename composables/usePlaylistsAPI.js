// composables/usePlaylistsAPI.js

import { useSupabase } from '@/composables/useSupabase'

export const usePlaylistsAPI = () => {
  const { supabase, currentUser } = useSupabase()

  const getUserPlaylists = async () => {
    if (!currentUser.value?.id) {
      return { data: [], error: 'Not authenticated' }
    }

    let { data, error } = await supabase
      .from('playlists')
      .select('*, playlist_tracks(count)')
      .eq('user_id', currentUser.value.id)
      .order('created_at', { ascending: false })

    // Fallback if the FK relationship for nested count is not configured yet
    if (error) {
      console.warn('Playlist track count join failed, falling back:', error.message)
      const fallback = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', currentUser.value.id)
        .order('created_at', { ascending: false })

      data = fallback.data
      error = fallback.error
    }

    if (error) {
      console.error('getUserPlaylists Error:', error)
      return { data: [], error: error.message }
    }

    const playlists = (data || []).map((playlist) => ({
      ...playlist,
      trackCount: playlist.playlist_tracks?.[0]?.count ?? 0,
    }))

    return { data: playlists, error: null }
  }

  const createPlaylist = async ({ name, isPublic = false }) => {
    if (!currentUser.value?.id) {
      return { data: null, error: 'Not authenticated' }
    }

    const trimmedName = (name || '').trim()
    if (!trimmedName) {
      return { data: null, error: 'Playlist name is required.' }
    }

    const { data, error } = await supabase
      .from('playlists')
      .insert([
        {
          name: trimmedName,
          is_public: isPublic,
          user_id: currentUser.value.id,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('createPlaylist Error:', error)
      return { data: null, error: error.message }
    }

    return { data: { ...data, trackCount: 0 }, error: null }
  }

  const deletePlaylist = async (playlistId) => {
    const { error: tracksError } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)

    if (tracksError) {
      console.error('deletePlaylist tracks Error:', tracksError)
      return { success: false, error: tracksError.message }
    }

    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId)
      .eq('user_id', currentUser.value?.id)

    if (error) {
      console.error('deletePlaylist Error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  }

  const getPlaylistTracks = async (playlistId) => {
    // Prefer nested join when FK exists; fall back to manual fetch if needed.
    const { data, error } = await supabase
      .from('playlist_tracks')
      .select(`
        id,
        created_at,
        music_id,
        playlist_id,
        musics (
          id,
          title,
          artist,
          cover,
          audio,
          genre,
          duration
        )
      `)
      .eq('playlist_id', playlistId)
      .order('created_at', { ascending: true })

    if (!error) {
      const tracks = (data || [])
        .filter((row) => row.music_id)
        .map((row) => ({
          rowId: row.id,
          playlistId: row.playlist_id,
          addedAt: row.created_at,
          ...(row.musics || { id: row.music_id }),
        }))

      return { data: tracks, error: null }
    }

    console.warn('Nested playlist tracks join failed, falling back:', error.message)

    const { data: rows, error: rowsError } = await supabase
      .from('playlist_tracks')
      .select('*')
      .eq('playlist_id', playlistId)
      .order('created_at', { ascending: true })

    if (rowsError) {
      console.error('getPlaylistTracks Error:', rowsError)
      return { data: [], error: rowsError.message }
    }

    const musicIds = [...new Set((rows || []).map((row) => row.music_id).filter(Boolean))]
    if (!musicIds.length) {
      return { data: [], error: null }
    }

    const { data: musics, error: musicsError } = await supabase
      .from('musics')
      .select('id, title, artist, cover, audio, genre, duration')
      .in('id', musicIds)

    if (musicsError) {
      console.error('getPlaylistTracks musics Error:', musicsError)
      return { data: [], error: musicsError.message }
    }

    const musicMap = Object.fromEntries((musics || []).map((music) => [music.id, music]))
    const tracks = (rows || [])
      .filter((row) => row.music_id && musicMap[row.music_id])
      .map((row) => ({
        rowId: row.id,
        playlistId: row.playlist_id,
        addedAt: row.created_at,
        ...musicMap[row.music_id],
      }))

    return { data: tracks, error: null }
  }

  const addTrackToPlaylist = async (playlistId, musicId) => {
    const { data, error } = await supabase
      .from('playlist_tracks')
      .insert([
        {
          playlist_id: playlistId,
          music_id: musicId,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('addTrackToPlaylist Error:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  }

  const removeTrackFromPlaylist = async (playlistId, musicId) => {
    const { error } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('music_id', musicId)

    if (error) {
      console.error('removeTrackFromPlaylist Error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  }

  // Returns playlist ids (owned by the current user) that already contain this track.
  const getTrackPlaylistIds = async (musicId) => {
    if (!musicId || !currentUser.value?.id) {
      return { data: [], error: null }
    }

    const { data: userPlaylists, error: playlistsError } = await supabase
      .from('playlists')
      .select('id')
      .eq('user_id', currentUser.value.id)

    if (playlistsError) {
      console.error('getTrackPlaylistIds playlists Error:', playlistsError)
      return { data: [], error: playlistsError.message }
    }

    const playlistIds = (userPlaylists || []).map((playlist) => playlist.id)
    if (!playlistIds.length) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase
      .from('playlist_tracks')
      .select('playlist_id')
      .eq('music_id', musicId)
      .in('playlist_id', playlistIds)

    if (error) {
      console.error('getTrackPlaylistIds Error:', error)
      return { data: [], error: error.message }
    }

    return {
      data: [...new Set((data || []).map((row) => row.playlist_id))],
      error: null,
    }
  }

  return {
    getUserPlaylists,
    createPlaylist,
    deletePlaylist,
    getPlaylistTracks,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    getTrackPlaylistIds,
  }
}
