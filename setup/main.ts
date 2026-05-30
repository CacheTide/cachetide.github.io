import { useHead } from '@unhead/vue'
import { computed } from 'vue'
import { defineAppSetup, useSiteConfig } from 'valaxy'

interface NoindexFrontMatter {
  noindex?: boolean | 'true' | 'false'
}

export default defineAppSetup(({ app, router }) => {
  app.runWithContext(() => {
    const siteConfig = useSiteConfig()

    useHead(computed(() => ({
      link: [
        {
          rel: 'canonical',
          href: getCanonicalUrl(siteConfig.value.url, router.currentRoute?.value?.path || '/'),
        },
      ],
      meta: isNoindexEnabled(getRouteFrontmatter(router).noindex)
        ? [
            {
              name: 'robots',
              content: 'noindex, nofollow',
            },
          ]
        : [],
    })))
  })
})

function getRouteFrontmatter(router: { currentRoute?: { value?: { meta?: { frontmatter?: NoindexFrontMatter } } } }) {
  return router.currentRoute?.value?.meta?.frontmatter || {}
}

function isNoindexEnabled(value: NoindexFrontMatter['noindex']) {
  return value === true || value === 'true'
}

function getCanonicalUrl(siteUrl: string, path: string) {
  const normalizedSiteUrl = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`
  const normalizedPath = path === '/' ? '/' : path.replace(/\/$/, '')
  return new URL(normalizedPath, normalizedSiteUrl).href
}
