import type { UserThemeConfig } from 'valaxy-theme-yun'
import { defineValaxyConfig } from 'valaxy'

// add icons what you will need
const safelist = [
  'i-ri-home-line',
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
    'valaxy-addon-artalk'
  ],

   themeConfig: {
    outline: [1, 6],
    banner: {
      enable: true,
      title: '云边的小旅店',
    },
	
    bg_image: {
      enable: true,
      url: 'https://cachetide.top/background.jpg',
      dark: 'https://cachetide.top/background.jpg',
      opacity: 0.7
    },

    pages: [
      {
        name: '我的小伙伴们',
        url: '/links/',
        icon: 'i-ri-genderless-line',
        color: 'dodgerblue',
      },
      {
        name: '喜欢的女孩子',
        url: '/girls/',
        icon: 'i-ri-women-line',
        color: 'hotpink',
      },
    ],

    footer: {
      since: 2023,
      beian: {
        enable: true,
        icp: '',
      },
    },
  },

  unocss: { safelist },
})
