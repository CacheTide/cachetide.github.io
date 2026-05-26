import type { UserThemeConfig } from 'valaxy-theme-yun'
import { defineValaxyConfig } from 'valaxy'
import { addonBangumi } from 'valaxy-addon-bangumi'
import { addonFoodMap } from 'valaxy-addon-food-map'

// add icons what you will need
const safelist = [
  'i-ri-home-line',
  'i-ri-map-pin-line',
]

/**
 * User Config
 */
export default defineValaxyConfig<UserThemeConfig>({
  // site config see site.config.ts

  theme: 'yun',
  addons: [
    'valaxy-addon-twikoo',
    'valaxy-addon-waline',
    'valaxy-addon-artalk',
    // 👇 2. 在这里追加 bangumi 插件配置
    addonBangumi({
      api: 'https://cachetide--eb2baf80366c11f1869342b51c65c3df.web.val.run',
      bgmUid: '995914',
      bilibiliEnabled: false,
    }),
    addonFoodMap({
      jsonPath: '/food-map/index.json',
      sources: [
        {
          id: 'nocturne-archive',
          name: 'Nocturne Archive',
          url: 'https://icarusfell.top/food-map/index.json',
          homepage: 'https://icarusfell.top',
        },
      ],
    }),
  ],

   themeConfig: {
    outline: [1, 6],
    banner: {
      enable: true,
      title: '云边的小旅店',
      cloud: {
        enable: true,
      },
    },

    nav: [
      { text: 'menu.posts', link: '/posts/', icon: 'i-ri-article-line' },
      { text: '友情链接', link: '/links/', icon: 'i-ri-link' },
      { text: '追番列表', link: '/bangumi/', icon: 'i-ri-tv-line' },
      { text: '美食地图', link: '/food-map', icon: 'i-ri-map-pin-line' },
    ],

    bg_image: {
      enable: true,
      url: '/background.jpg',
      dark: '/background.jpg',
      opacity: 0.7
    },

    pages: [
      {
        name: '我的小伙伴们',
        url: '/links/',
        icon: 'i-ri-link',
        color: 'dodgerblue',
      },
      {
        name: '追番列表',
        url: '/bangumi/',
        icon: 'i-ri-tv-line',
        color: '#f09199',
      },
      {
        name: '美食地图',
        url: '/food-map',
        icon: 'i-ri-map-pin-line',
        color: '#f97316',
      },
    ],

    footer: {
      since: 2023,
      beian: {
        enable: true,
        icp: '',
        police: '',
      },
    },
  },

  unocss: { safelist },
  vite: {
    ssr: {
      noExternal: ['gsap']
    }
  }
})
