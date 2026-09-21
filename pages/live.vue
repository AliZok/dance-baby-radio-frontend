<template>
  <!-- PlayerMain lives in PersistentPlayerHost (app.vue) so audio survives login/register. -->
  <div class="player-page-slot">
    <section class="seo-about" aria-label="About Dance Baby Live">
      <h1><strong>Dance Baby Live</strong></h1>
      <p>
        <strong>Dance Baby Live</strong> is the shared radio station —
        everyone hears the same dance, electronic, and Persian track at the same time.
      </p>
      <p lang="fa">
        رادیو زنده دنس بیبی. همه هم‌زمان به یک موزیک گوش می‌دهند.
      </p>
    </section>
  </div>
</template>

<script setup>
useSiteSeo({
  path: '/live',
  title: 'Dance Baby Live | Shared Radio | Electronic Music, Dance & Persian Music',
  description:
    'Dance Baby Live — everyone hears the same track at the same time. Shared dance, electronic and Persian radio. موزیک الکترونیک، رادیو موزیک، رقص و جشن.',
})
</script>

<style scoped>
.seo-about {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
