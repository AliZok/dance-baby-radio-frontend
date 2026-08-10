<template>
  <!-- PlayerMain lives in PersistentPlayerHost (app.vue) so audio survives login/register. -->
  <div class="player-page-slot">
    <section class="seo-about" aria-label="About Dance Baby Radio">
      <h2>Dance Baby Radio</h2>
      <p>
        Dance Baby Radio is a free online radio for
        <strong>dance</strong>,
        <strong>electronic music</strong>,
        <strong>radio music</strong>, and
        <strong>Persian music</strong>.
        Stream Dance Baby hits for your party —
        <span lang="fa">موزیک الکترونیک، رادیو موزیک، موزیک رقصی، موزیک شاد، رقص و جشن</span>.
      </p>
      <p lang="fa">
        رادیو دنس بیبی (Dance Baby Radio) جایی برای گوش دادن به موزیک الکترونیک،
        رادیو موزیک، موزیک رقصی و موزیک شاد است. رقص کن، جشن بگیر و با Dance Baby
        انرژی بگیر.
      </p>
      <ul>
        <li>Dance Baby — electronic music &amp; dance radio</li>
        <li>Persian music / موزیک الکترونیک</li>
        <li>Radio music — موزیک رقصی و موزیک شاد</li>
        <li>Dance, رقص، جشن</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
useSiteSeo({ path: '/' })
</script>

<style scoped>
/* Crawlable SEO copy: kept accessible to bots/screen readers without covering the player UI. */
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
