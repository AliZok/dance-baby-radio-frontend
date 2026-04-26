// Example usage of the new music API functions
// This file demonstrates how to use the addMusic and addMultipleMusics functions

import { useMusicAPI } from '@/composables/useMusicAPI.js'

// Example 1: Add a single music
const addSingleMusic = async () => {
    const { addMusic } = useMusicAPI()
    
    const musicData = {
        title: "Example Song",
        artist: "Example Artist",
        cover: "https://example.com/cover.jpg",
        audio: "https://example.com/audio.mp3",
        genre: "pop",
        duration: "3:45"
    }
    
    const result = await addMusic(musicData)
    
    if (result.success) {
        console.log("Music added successfully:", result.data)
    } else {
        console.error("Failed to add music:", result.error)
    }
}

// Example 2: Add multiple musics from an array
const addMultipleMusics = async () => {
    const { addMultipleMusics } = useMusicAPI()
    
    const musicArray = [
        {
            title: "Song 1",
            artist: "Artist 1",
            cover: "https://example.com/cover1.jpg",
            audio: "https://example.com/audio1.mp3",
            genre: "rock",
            duration: "4:20"
        },
        {
            title: "Song 2",
            artist: "Artist 2",
            cover: "https://example.com/cover2.jpg",
            audio: "https://example.com/audio2.mp3",
            genre: "electronic",
            duration: "3:15"
        },
        {
            title: "Song 3",
            artist: "Artist 3",
            cover: "https://example.com/cover3.jpg",
            audio: "https://example.com/audio3.mp3",
            genre: "jazz",
            duration: "5:30"
        }
    ]
    
    const result = await addMultipleMusics(musicArray)
    
    if (result.success) {
        console.log("Multiple musics added successfully:", result.data)
    } else {
        console.error("Failed to add multiple musics:", result.error)
    }
}

// Example 3: Usage in a Vue component
/*
<template>
    <div>
        <button @click="addSampleMusic">Add Sample Music</button>
        <button @click="addSamplePlaylist">Add Sample Playlist</button>
    </div>
</template>

<script setup>
import { useMusicAPI } from '@/composables/useMusicAPI.js'

const { addMusic, addMultipleMusics } = useMusicAPI()

const addSampleMusic = async () => {
    const musicData = {
        title: "New Song",
        artist: "New Artist",
        cover: "https://example.com/new-cover.jpg",
        audio: "https://example.com/new-audio.mp3",
        genre: "pop",
        duration: "3:30"
    }
    
    const result = await addMusic(musicData)
    console.log(result)
}

const addSamplePlaylist = async () => {
    const playlist = [
        {
            title: "Track 1",
            artist: "Artist A",
            cover: "https://example.com/track1-cover.jpg",
            audio: "https://example.com/track1.mp3",
            genre: "electronic",
            duration: "4:00"
        },
        {
            title: "Track 2",
            artist: "Artist B",
            cover: "https://example.com/track2-cover.jpg",
            audio: "https://example.com/track2.mp3",
            genre: "house",
            duration: "5:15"
        }
    ]
    
    const result = await addMultipleMusics(playlist)
    console.log(result)
}
</script>
*/

export { addSingleMusic, addMultipleMusics }
