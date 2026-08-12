import { ref } from "vue";

// NOTE: This used to contain a ~545KB hardcoded `musicList` array (13,000+ lines)
// that was evaluated synchronously on every import. It was dead weight: track
// selection now happens entirely through the `get_random_track` Supabase RPC
// (see composables/useMusicAPI.js), and nothing in the live app ever read from
// this array (only ever overwritten). Removing it drastically cuts the JS
// parse/execute time that used to block the very first render + API call on
// every single page (since HeaderMain, present in the default layout, also
// imports this store).
const storeSimple = ref({
  musicList: [],
  genres: [
    {
      genre: "raghsi",
      icon: "pop",
      text: "Persian Pop",
      active: false,
    },
    {
      genre: "pop",
      icon: "pop",
      text: "Pop",
      active: false,
    },
    {
      genre: "relax",
      icon: "pop",
      text: "Relax",
      active: false,
    },
    {
      genre: "rock",
      icon: "pop",
      text: "Rock",
      active: false,
    },
    {
      genre: "electronic",
      icon: "pop",
      text: "Electronic",
      active: true,
    },
  ],
  go: false,
  isPlaying: false,
  // Mobile player chrome (next/genre/login-menu). Driven by PlayerMain tap-outside.
  mobileChromeVisible: false,
});

export default storeSimple;
