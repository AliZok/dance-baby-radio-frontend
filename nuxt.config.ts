import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  runtimeConfig: {
    adminPassword: process.env.ADMIN_PASSWORD || "alifreeman1988",
    public: {
      baseUrl: process.env.API_BASE_URL || "http://localhost:4000",
    },
  },
  server: {
    port: 7000,
  },
  plugins: ["@/plugins/pwa.client.js"],
  devtools: { enabled: true },
  css: ["@/assets/style/main.scss"],
  build: {
    loaders: {
      transpile: ["vuetify",],
      scss: {
        additionalData: `@import "@/assets/style/variables.scss";`,
      },
    },
  },
  modules: [
    "@nuxt/image",
    "@vite-pwa/nuxt",
    "@pinia/nuxt",
    "@nuxtjs/sitemap",
    "@nuxtjs/tailwindcss",
    '@vee-validate/nuxt',
  ],
  site: {
    url: "https://dance-baby-radio.com",
    name: "Dance Baby Radio",
  },
  sitemap: {
    gzip: true,
    urls: ["/", "/playlists", "/login", "/register"],
  },
  image: {},
  pwa: {
    // ... keep your existing manifest config ...
    workbox: {
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,woff2,png,jpg,jpeg,svg,gif,webp,ico}'],
      runtimeCaching: [
        // ... keep your existing caching rules ...
      ],
      skipWaiting: true,
      cleanupOutdatedCaches: true,
      // Add this:
      clientsClaim: true,
      offlineGoogleAnalytics: false
    },
    devOptions: {
      enabled: false, // DISABLE IN DEV MODE
      type: 'module',
      navigateFallback: null,
    },
    // Add this:
    strategies: process.env.NODE_ENV === 'development' ? 'injectManifest' : 'generateSW',
    srcDir: './service-worker',
    filename: process.env.NODE_ENV === 'development' ? 'sw-dev.js' : 'sw.js',
  },
  app: {
    head: {
      htmlAttrs: {
        lang: "en",
      },
      title:
        "Dance Baby Radio | Electronic Music, Dance & Persian Music | موزیک الکترونیک و رادیو موزیک",
      titleTemplate: "%s",
      link: [
        {
          rel: "icon",
          type: "image/png",
          href: "/favicon/dancy-girl.png?v=2",
        },
        { rel: "canonical", href: "https://dance-baby-radio.com" },
        // { rel: "manifest", href: "/manifest.webmanifest" },
      ],
      style: [
        {
          // Critical first-paint: pure black before Vue/CSS bundles apply,
          // so brand/menu never flash during boot → loading → Let's GO.
          children:
            "html,body{background:#000!important;}#dbr-boot-splash{position:fixed;inset:0;z-index:1400;background:#000;pointer-events:none;}",
        },
      ],
      meta: [
        { charset: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        { name: "theme-color", content: "#000000" },
        { name: "mobile-web-app-capable", content: "yes" },
        {
          name: "apple-mobile-web-app-status-bar-style",
          content: "black-translucent",
        },
        {
          name: "description",
          content:
            "Dance Baby Radio — online radio for dance, electronic music, radio music and Persian music. Listen free to موزیک الکترونیک، رادیو موزیک، موزیک رقصی و موزیک شاد. Dance, رقص، جشن and party with Dance Baby.",
        },
        {
          name: "keywords",
          content:
            "dance baby, dance baby radio, dance, radio music, electronic music, persian music, موزیک الکترونیک, رادیو موزیک, رقص, جشن, موزیک رقصی, موزیک شاد",
        },
        { name: "author", content: "Dance Baby Radio" },
        {
          name: "robots",
          content:
            "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Dance Baby Radio" },
        {
          property: "og:title",
          content:
            "Dance Baby Radio | Electronic Music, Dance & Persian Music",
        },
        {
          property: "og:description",
          content:
            "Free online radio: electronic music, dance, Persian music, موزیک الکترونیک، رادیو موزیک، موزیک رقصی و موزیک شاد.",
        },
        {
          property: "og:image",
          content: "https://dance-baby-radio.com/images/background-dance-1.jpg",
        },
        { property: "og:url", content: "https://dance-baby-radio.com" },
        { property: "og:locale", content: "en_US" },
        { property: "og:locale:alternate", content: "fa_IR" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        {
          property: "og:image:alt",
          content:
            "Dance Baby Radio — electronic music, dance and Persian radio music",
        },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "Dance Baby Radio | Electronic Music & Dance",
        },
        {
          name: "twitter:description",
          content:
            "Listen to dance, electronic music and Persian music — موزیک الکترونیک، رادیو موزیک، رقص و جشن.",
        },
        {
          name: "twitter:image",
          content: "https://dance-baby-radio.com/images/background-dance-1.jpg",
        },
      ],
      script: [
        {
          src: "https://www.googletagmanager.com/gtag/js?id=G-240Y4GMB9W",
          async: true,
        },
        {
          innerHTML: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-240Y4GMB9W');
          `,
          type: "text/javascript",
          charset: "UTF-8",
        },
      ],
    },
  },
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
    optimizeDeps: {
      include: [],
    },
  },
});
