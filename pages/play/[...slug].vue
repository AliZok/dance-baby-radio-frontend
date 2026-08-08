<template>
  <div class="player-page-slot"></div>
</template>

<script setup>
const route = useRoute()

// Parse details for meta tags to have dynamic head titles and page metadata!
let title = ""
let artist = ""

const slug = route.params.slug
if (Array.isArray(slug) && slug.length > 0) {
  const protocolIndex = slug.findIndex(item => item.startsWith('http:') || item.startsWith('https:'));
  if (protocolIndex !== -1) {
    if (protocolIndex > 0) title = decodeURIComponent(slug[0]);
    if (protocolIndex > 1) artist = decodeURIComponent(slug[1]);
  }
}

if (!title) title = route.query.title || route.query.name || ""
if (!artist) artist = route.query.artist || route.query.musician || ""

const pageTitle = computed(() => {
  if (title && artist) {
    return `${title} - ${artist} | DANCE BABY RADIO`
  } else if (title) {
    return `${title} | DANCE BABY RADIO`
  } else {
    return "DANCE BABY RADIO"
  }
})

useHead({
  title: pageTitle,
  meta: [
    {
      name: "description",
      content: "Listen to Beauties and Dance"
    }
  ],
})
</script>
