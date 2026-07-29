<template>
  <div>
    <PlayerMain></PlayerMain>
  </div>
</template>
<script setup>
import { onMounted } from 'vue'
import { useMusicAPI } from '@/composables/useMusicAPI'

const { getMusics } = useMusicAPI()

const loadHomeMusics = async () => {
  console.log('ali start')
  try {
    const { data, error } = await getMusics()
    console.log('home route musics fetch result:', { data, error })
  } catch (err) {
    console.error('home route musics fetch error:', err)
  } finally {
    console.log('ali finish')
  }
}

onMounted(loadHomeMusics)

useHead({
  title: 'DANCE BABY RADIO',
  meta: [
    {
      name: 'description',
      content: "Listen to Beauties and Dance"
    }
  ],
})
</script>
