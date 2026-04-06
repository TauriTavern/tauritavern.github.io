import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import PageMarkdownActions from './components/PageMarkdownActions.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PageMarkdownActions', PageMarkdownActions)
  },
} satisfies Theme
