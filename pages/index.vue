<template>
  <div>
    <PlayerMain></PlayerMain>
  </div>
</template>
<script setup>
// Music list fetching is already handled by PlayerMain's own onMounted hook,
// which stores the result in storeSimple for playback. No need to fetch it here too.

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
