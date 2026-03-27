import { defineSiteConfig } from 'valaxy'

export default defineSiteConfig({
  url: 'https://cachetide.top/',
  lang: 'zh-CN',
  title: '云边的小旅店',
  favicon: '/favicon.jpg',
  author: {
    name: '编汐译梦CacheTide',
	avatar: '/favicon.jpg',
	status: {
      emoji: '😺'
    },
  },
  subtitle: '',
  description: '无人相伴的路，惝恍迷离的舞',
  social: [
    {
      name: 'GitHub',
      link: 'https://github.com/cachetide',
      icon: 'i-ri-github-line',
      color: '#6e5494',
    },
    {
      name: '哔哩哔哩',
      link: 'https://space.bilibili.com/',
      icon: 'i-ri-bilibili-line',
      color: '#FF8EB3',
    },
    {
      name: '邮箱',
      link: 'mailto:cachetide@proton.me',
      icon: 'i-ri-mail-line',
      color: '#00A3EE',
    },
    {
      name: 'Twitter',
      link: 'https://x.com/cachetide',
      icon: 'i-ri-twitter-x-fill',
      color: 'black',
    },
    {
      name: 'Telegram Channel',
      link: 'https://t.me/CacheTide',
      icon: 'i-ri-telegram-line',
      color: '#0088CC',
    },
  ],

  search: {
    enable: true,
    type: 'fuse'
  },

  sponsor: {
    enable: true,
    title: '我很可爱，请给我葱！',
    methods: [
      {
        name: '支付宝',
        url: '/mikupayment2.png',
        color: '#00A3EE',
        icon: 'i-ri-alipay-line',
      },
      {
        name: 'QQ 支付',
        url: '/mikupayment1.png',
        color: '#12B7F5',
        icon: 'i-ri-qq-line',
      },
      {
        name: '微信支付',
        url: '/mikupayment3.png',
        color: '#2DC100',
        icon: 'i-ri-wechat-pay-line',
      },
    ],
  },
})
