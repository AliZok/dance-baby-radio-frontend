<script setup>
definePageMeta({
  layout: false,
})

const { requestLive } = usePlaybackMode()
requestLive()
await navigateTo('/', { replace: true })
</script>
