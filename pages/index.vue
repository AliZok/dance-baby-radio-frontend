<template>
  <div>
    <PlayerMain></PlayerMain>
    <!-- <PlayerMain2></PlayerMain2> -->

    <div id="welcome-modal" class="WelcomeModal" onclick="this.style.display='none'">
      <div class="inner">
        <div class="go-button-wrap">
          <button class="hologram" type="button">
            <span data-text="Let's GO" class="text-go">Let's GO</span>
            <div class="scan-line"></div>
          </button>
        </div>
      </div>
    </div>
  </div>


</template>
<script setup>

useHead({
  title: 'DANCE BABY RADIO',
  meta: [
    {
      name: 'description',
      content: "Listen to Beauties and Dance"
    }
  ],
  script: [
    {
      innerHTML: `
        window.addEventListener('keydown', function(e) {
          if (e.code === 'Enter' || e.code === 'Space') {
            var modal = document.getElementById('welcome-modal');
            if (modal) {
              e.preventDefault();
              modal.style.display = 'none';
            }
          }
        }, { once: true }); 
      `,
      type: 'text/javascript',
    }
  ],
  // This is important to allow the innerHTML script to work
  noscript: [{ children: 'JavaScript is required' }]
})
</script>