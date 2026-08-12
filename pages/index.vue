<template>
  <!-- PlayerMain lives in PersistentPlayerHost (app.vue) so audio survives login/register. -->
  <div class="player-page-slot">
    <section class="seo-about" aria-label="About Dance Baby">
      <h1><strong>Dance Baby</strong></h1>
      <p>
        <strong>Dance Baby</strong> is a free online radio for
        dance, electronic music, radio music, and Persian music.
        Stream <strong>Dance Baby</strong> hits for your party —
        <span lang="fa">موزیک الکترونیک، رادیو موزیک، موزیک رقصی، موزیک شاد، رقص و جشن</span>.
      </p>
      <p lang="fa">
        رادیو دنس بیبی (<strong>Dance Baby</strong>) جایی برای گوش دادن به موزیک الکترونیک،
        رادیو موزیک، موزیک رقصی و موزیک شاد است. رقص کن، جشن بگیر و با <strong>Dance Baby</strong>
        انرژی بگیر.
      </p>
      <ul>
        <li><strong>Dance Baby</strong> — electronic music &amp; dance radio</li>
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
