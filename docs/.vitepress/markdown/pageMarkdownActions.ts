import type MarkdownIt from 'markdown-it'

type RenderRule = NonNullable<MarkdownIt['renderer']['rules']['heading_open']>

interface PageMarkdownActionsEnv {
  __ttPageMarkdownActionsInjected?: boolean
  __ttPageMarkdownActionsOpen?: boolean
}

function renderTokenFallback(tokens: Parameters<RenderRule>[0], index: number, options: Parameters<RenderRule>[2], _env: Parameters<RenderRule>[3], self: Parameters<RenderRule>[4]) {
  return self.renderToken(tokens, index, options)
}

export function installPageMarkdownActions(md: MarkdownIt): void {
  const defaultHeadingOpen = md.renderer.rules.heading_open ?? renderTokenFallback
  const defaultHeadingClose = md.renderer.rules.heading_close ?? renderTokenFallback

  md.renderer.rules.heading_open = (tokens, index, options, env: PageMarkdownActionsEnv, self) => {
    const token = tokens[index]

    if (token.tag !== 'h1' || env.__ttPageMarkdownActionsInjected) {
      return defaultHeadingOpen(tokens, index, options, env, self)
    }

    env.__ttPageMarkdownActionsInjected = true
    env.__ttPageMarkdownActionsOpen = true

    return `<div class="tt-doc-heading">${defaultHeadingOpen(tokens, index, options, env, self)}`
  }

  md.renderer.rules.heading_close = (tokens, index, options, env: PageMarkdownActionsEnv, self) => {
    const token = tokens[index]

    if (token.tag !== 'h1' || !env.__ttPageMarkdownActionsOpen) {
      return defaultHeadingClose(tokens, index, options, env, self)
    }

    env.__ttPageMarkdownActionsOpen = false

    return `${defaultHeadingClose(tokens, index, options, env, self)}<PageMarkdownActions /></div>`
  }
}
