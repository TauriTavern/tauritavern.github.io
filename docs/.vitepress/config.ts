import { defineConfig, type DefaultTheme } from 'vitepress'

import { installPageMarkdownActions } from './markdown/pageMarkdownActions'

const sharedSocialLinks: DefaultTheme.Config['socialLinks'] = [
  { icon: 'github', link: 'https://github.com/Darkatse/TauriTavern' },
]

const sharedFooter: DefaultTheme.Config['footer'] = {
  message: 'Released under AGPL-3.0.',
  copyright: 'Copyright © 2026 TauriTavern',
}

const zhThemeConfig: DefaultTheme.Config = {
  logo: '/logo.png',
  logoLink: '/',
  siteTitle: 'TauriTavern Docs',
  nav: [
    { text: '指南', link: '/guide/introduction' },
    { text: '架构', link: '/architecture/overview' },
    { text: 'API', link: '/api/' },
  ],
  sidebar: {
    '/guide/': [
      {
        text: '指南',
        items: [
          { text: '项目介绍', link: '/guide/introduction' },
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '文档写作工作流', link: '/guide/docs-workflow' },
        ],
      },
    ],
    '/architecture/': [
      {
        text: '架构',
        items: [
          { text: '总览', link: '/architecture/overview' },
          { text: '前端集成', link: '/architecture/frontend' },
          { text: '后端分层', link: '/architecture/backend' },
          { text: '技术栈', link: '/architecture/tech-stack' },
        ],
      },
    ],
    '/api/': [
      {
        text: 'API',
        items: [
          { text: '总览', link: '/api/' },
          { text: 'Layout API', link: '/api/layout' },
          { text: 'Extension API', link: '/api/extensions' },
        ],
      },
    ],
  },
  socialLinks: sharedSocialLinks,
  search: {
    provider: 'local',
    options: {
      translations: {
        button: {
          buttonText: '搜索',
          buttonAriaLabel: '搜索文档',
        },
        modal: {
          displayDetails: '显示详情',
          resetButtonTitle: '清除查询条件',
          backButtonTitle: '关闭搜索',
          noResultsText: '没有找到相关结果',
          footer: {
            selectText: '选择',
            selectKeyAriaLabel: '回车键',
            navigateText: '切换',
            navigateUpKeyAriaLabel: '上箭头',
            navigateDownKeyAriaLabel: '下箭头',
            closeText: '关闭',
            closeKeyAriaLabel: 'Esc 键',
          },
        },
      },
    },
  },
  outline: {
    level: [2, 3],
    label: '本页导航',
  },
  docFooter: {
    prev: '上一页',
    next: '下一页',
  },
  editLink: {
    pattern: 'https://github.com/TauriTavern/tauritavern.github.io/edit/main/docs/:path',
    text: '在 GitHub 上编辑此页',
  },
  footer: sharedFooter,
  sidebarMenuLabel: '菜单',
  returnToTopLabel: '返回顶部',
  darkModeSwitchLabel: '主题',
  lightModeSwitchTitle: '切换到浅色模式',
  darkModeSwitchTitle: '切换到深色模式',
  langMenuLabel: '切换语言',
  lastUpdated: {
    text: '最后更新于',
  },
}

const enThemeConfig: DefaultTheme.Config = {
  logo: '/logo.png',
  logoLink: '/en/',
  siteTitle: 'TauriTavern Docs',
  nav: [
    { text: 'Guide', link: '/en/guide/introduction' },
    { text: 'Architecture', link: '/en/architecture/overview' },
    { text: 'API', link: '/en/api/' },
  ],
  sidebar: {
    '/en/guide/': [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/en/guide/introduction' },
          { text: 'Getting Started', link: '/en/guide/getting-started' },
          { text: 'Docs Workflow', link: '/en/guide/docs-workflow' },
        ],
      },
    ],
    '/en/architecture/': [
      {
        text: 'Architecture',
        items: [
          { text: 'Overview', link: '/en/architecture/overview' },
          { text: 'Frontend Integration', link: '/en/architecture/frontend' },
          { text: 'Backend Layers', link: '/en/architecture/backend' },
          { text: 'Tech Stack', link: '/en/architecture/tech-stack' },
        ],
      },
    ],
    '/en/api/': [
      {
        text: 'API',
        items: [
          { text: 'Overview', link: '/en/api/' },
          { text: 'Layout API', link: '/en/api/layout' },
          { text: 'Extension API', link: '/en/api/extensions' },
        ],
      },
    ],
  },
  socialLinks: sharedSocialLinks,
  search: {
    provider: 'local',
    options: {
      translations: {
        button: {
          buttonText: 'Search',
          buttonAriaLabel: 'Search docs',
        },
        modal: {
          displayDetails: 'Display detailed list',
          resetButtonTitle: 'Clear query',
          backButtonTitle: 'Close search',
          noResultsText: 'No relevant results found',
          footer: {
            selectText: 'Select',
            selectKeyAriaLabel: 'enter key',
            navigateText: 'Navigate',
            navigateUpKeyAriaLabel: 'up arrow',
            navigateDownKeyAriaLabel: 'down arrow',
            closeText: 'Close',
            closeKeyAriaLabel: 'escape key',
          },
        },
      },
    },
  },
  outline: {
    level: [2, 3],
    label: 'On this page',
  },
  docFooter: {
    prev: 'Previous page',
    next: 'Next page',
  },
  editLink: {
    pattern: 'https://github.com/TauriTavern/tauritavern.github.io/edit/main/docs/:path',
    text: 'Edit this page on GitHub',
  },
  footer: sharedFooter,
  sidebarMenuLabel: 'Menu',
  returnToTopLabel: 'Return to top',
  darkModeSwitchLabel: 'Appearance',
  lightModeSwitchTitle: 'Switch to light theme',
  darkModeSwitchTitle: 'Switch to dark theme',
  langMenuLabel: 'Change language',
  lastUpdated: {
    text: 'Last updated',
  },
}

export default defineConfig({
  lang: 'zh-CN',
  title: 'TauriTavern',
  description:
    'TauriTavern 文档站：围绕 Tauri v2、Rust 后端与 SillyTavern 1.16.0 前端兼容的工程文档。',
  lastUpdated: true,
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      title: 'TauriTavern',
      description:
        'TauriTavern 文档站：围绕 Tauri v2、Rust 后端与 SillyTavern 1.16.0 前端兼容的工程文档。',
      head: [
        ['meta', { property: 'og:title', content: 'TauriTavern Docs' }],
        [
          'meta',
          {
            property: 'og:description',
            content: 'TauriTavern 的架构、API 与开发文档站点。',
          },
        ],
      ],
      themeConfig: zhThemeConfig,
    },
    en: {
      label: 'English',
      lang: 'en-US',
      title: 'TauriTavern',
      description:
        'TauriTavern documentation for architecture, APIs, development workflows, and engineering constraints.',
      head: [
        ['meta', { property: 'og:title', content: 'TauriTavern Docs' }],
        [
          'meta',
          {
            property: 'og:description',
            content:
              'TauriTavern documentation for architecture, APIs, development workflows, and engineering constraints.',
          },
        ],
      ],
      themeConfig: enThemeConfig,
    },
  },
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'TauriTavern Docs' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'TauriTavern 的架构、API 与开发文档站点。',
      },
    ],
  ],
  markdown: {
    config(md) {
      installPageMarkdownActions(md)
    },
  },
  themeConfig: {
    socialLinks: sharedSocialLinks,
    footer: sharedFooter,
    i18nRouting: true,
  },
})
