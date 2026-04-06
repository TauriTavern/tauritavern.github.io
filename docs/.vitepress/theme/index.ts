import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import PageMarkdownActions from './components/PageMarkdownActions.vue'
import ReleaseDownloads from './components/ReleaseDownloads.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PageMarkdownActions', PageMarkdownActions)
    app.component('ReleaseDownloads', ReleaseDownloads)
  },
} satisfies Theme
