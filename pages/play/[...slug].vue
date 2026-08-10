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
    return `${title} - ${artist} | Dance Baby Radio | Electronic & Persian Music`
  } else if (title) {
    return `${title} | Dance Baby Radio | موزیک الکترونیک و رادیو موزیک`
  } else {
    return "Dance Baby Radio | Electronic Music, Dance & Persian Music"
  }
})

const pageDescription = computed(() => {
  const trackBit = title
    ? `Now playing: ${title}${artist ? ` by ${artist}` : ''}. `
    : ''
  return `${trackBit}Dance Baby Radio — dance, electronic music, radio music and Persian music. Listen to موزیک الکترونیک، رادیو موزیک، موزیک رقصی و موزیک شاد. رقص و جشن with Dance Baby.`
})

useSiteSeo({
  title: pageTitle,
  description: pageDescription,
  path: route.path,
  includeJsonLd: false,
})
</script>
