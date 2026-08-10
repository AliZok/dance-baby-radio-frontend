const SITE_URL = 'https://dance-baby-radio.com'
const SITE_NAME = 'Dance Baby Radio'
const OG_IMAGE = `${SITE_URL}/images/background-dance-1.jpg`

export const DEFAULT_TITLE =
  'Dance Baby Radio | Electronic Music, Dance & Persian Music | موزیک الکترونیک و رادیو موزیک'

export const DEFAULT_DESCRIPTION =
  'Dance Baby Radio — online radio for dance, electronic music, radio music and Persian music. Listen free to موزیک الکترونیک، رادیو موزیک، موزیک رقصی و موزیک شاد. Dance, رقص، جشن and party with Dance Baby.'

export const DEFAULT_KEYWORDS = [
  'dance baby',
  'dance baby radio',
  'dance',
  'radio music',
  'electronic music',
  'persian music',
  'موزیک الکترونیک',
  'رادیو موزیک',
  'رقص',
  'جشن',
  'موزیک رقصی',
  'موزیک شاد',
].join(', ')

/**
 * @param {{ title?: string | import('vue').Ref | import('vue').ComputedRef, description?: string | import('vue').Ref | import('vue').ComputedRef, path?: string, image?: string, includeJsonLd?: boolean }} [overrides]
 */
export function useSiteSeo(overrides = {}) {
  const title = computed(() => unref(overrides.title) || DEFAULT_TITLE)
  const description = computed(() => unref(overrides.description) || DEFAULT_DESCRIPTION)
  const path = overrides.path || '/'
  const canonical = `${SITE_URL}${path === '/' ? '' : path}`
  const image = overrides.image || OG_IMAGE
  const includeJsonLd = overrides.includeJsonLd !== false

  useSeoMeta({
    title,
    description,
    keywords: DEFAULT_KEYWORDS,
    author: SITE_NAME,
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    ogType: 'website',
    ogSiteName: SITE_NAME,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
    ogImage: image,
    ogImageSecureUrl: image,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: 'Dance Baby Radio — electronic music, dance and Persian radio music',
    ogLocale: 'en_US',
    ogLocaleAlternate: 'fa_IR',
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
    twitterImageAlt: 'Dance Baby Radio',
  })

  const headConfig = {
    htmlAttrs: {
      lang: 'en',
    },
    link: [
      { rel: 'canonical', href: canonical },
      { rel: 'alternate', hreflang: 'en', href: canonical },
      { rel: 'alternate', hreflang: 'fa', href: canonical },
      { rel: 'alternate', hreflang: 'x-default', href: SITE_URL },
    ],
  }

  if (includeJsonLd) {
    headConfig.script = [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              '@id': `${SITE_URL}/#website`,
              url: SITE_URL,
              name: SITE_NAME,
              alternateName: ['Dance Baby', 'رادیو دنس بیبی', 'Dance Baby Radio'],
              description: DEFAULT_DESCRIPTION,
              inLanguage: ['en', 'fa'],
              publisher: { '@id': `${SITE_URL}/#radiostation` },
            },
            {
              '@type': 'RadioStation',
              '@id': `${SITE_URL}/#radiostation`,
              name: SITE_NAME,
              alternateName: 'Dance Baby',
              url: SITE_URL,
              image: OG_IMAGE,
              logo: `${SITE_URL}/favicon/dance-baby-radio-no-back.png`,
              description: DEFAULT_DESCRIPTION,
              genre: [
                'Electronic music',
                'Dance music',
                'Persian music',
                'Radio music',
                'موزیک الکترونیک',
                'موزیک رقصی',
                'موزیک شاد',
              ],
            },
            {
              '@type': 'MusicPlaylist',
              name: 'Dance Baby Radio Live Stream',
              description:
                'Continuous dance, electronic and Persian music playlist on Dance Baby Radio — موزیک الکترونیک، رادیو موزیک، رقص و جشن.',
              url: SITE_URL,
              genre: ['electronic', 'dance', 'persian'],
            },
          ],
        }),
      },
    ]
  }

  useHead(headConfig)

  return {
    SITE_URL,
    SITE_NAME,
    DEFAULT_TITLE,
    DEFAULT_DESCRIPTION,
    DEFAULT_KEYWORDS,
  }
}
