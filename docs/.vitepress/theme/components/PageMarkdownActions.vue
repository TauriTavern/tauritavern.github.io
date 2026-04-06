<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useData } from 'vitepress'

import {
  getPageMarkdownDownloadName,
  loadPageMarkdownSource,
} from '../markdownSource'

const { frontmatter, lang, page } = useData()

const rootRef = ref<HTMLDivElement>()
const isMenuOpen = ref(false)

const isDocPage = computed(() => {
  const layout = frontmatter.value.layout
  return layout === undefined || layout === 'doc'
})

const messages = computed(() =>
  lang.value.startsWith('zh')
    ? {
        copy: '复制 Markdown',
        actions: '更多 Markdown 操作',
        download: '下载 Markdown',
      }
    : {
        copy: 'Copy Markdown',
        actions: 'More Markdown actions',
        download: 'Download Markdown',
      },
)

async function getCurrentMarkdownSource(): Promise<string> {
  return await loadPageMarkdownSource(page.value.relativePath)
}

async function copyMarkdown(): Promise<void> {
  await navigator.clipboard.writeText(await getCurrentMarkdownSource())
}

function toggleMenu(): void {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu(): void {
  isMenuOpen.value = false
}

async function downloadMarkdown(): Promise<void> {
  const markdown = await getCurrentMarkdownSource()
  const objectUrl = URL.createObjectURL(
    new Blob([markdown], { type: 'text/markdown;charset=utf-8' }),
  )
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = getPageMarkdownDownloadName(page.value.relativePath)
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
  closeMenu()
}

function handleDocumentPointerDown(event: PointerEvent): void {
  if (!rootRef.value?.contains(event.target as Node)) {
    closeMenu()
  }
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleDocumentKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeydown)
})
</script>

<template>
  <div v-if="isDocPage" ref="rootRef" class="tt-page-markdown-actions">
    <button
      class="tt-page-markdown-actions__button"
      type="button"
      :aria-label="messages.copy"
      :title="messages.copy"
      @click="copyMarkdown"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M9 9.75A2.25 2.25 0 0 1 11.25 7.5h6.5A2.25 2.25 0 0 1 20 9.75v8A2.25 2.25 0 0 1 17.75 20h-6.5A2.25 2.25 0 0 1 9 17.75z"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.75"
        />
        <path
          d="M15 7.5v-.25A2.25 2.25 0 0 0 12.75 5h-6.5A2.25 2.25 0 0 0 4 7.25v8A2.25 2.25 0 0 0 6.25 17.5H9"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.75"
        />
      </svg>
    </button>

    <div class="tt-page-markdown-actions__menu">
      <button
        class="tt-page-markdown-actions__button tt-page-markdown-actions__button--menu"
        type="button"
        :aria-label="messages.actions"
        :title="messages.actions"
        aria-haspopup="menu"
        :aria-expanded="String(isMenuOpen)"
        @click="toggleMenu"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="m7 10 5 5 5-5"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.75"
          />
        </svg>
      </button>

      <div v-if="isMenuOpen" class="tt-page-markdown-actions__dropdown" role="menu">
        <button
          class="tt-page-markdown-actions__menu-item"
          type="button"
          role="menuitem"
          @click="downloadMarkdown"
        >
          {{ messages.download }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tt-page-markdown-actions {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--tt-page-markdown-action-radius, 10px);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  line-height: 0;
  overflow: visible;
}

.tt-page-markdown-actions__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-block: var(--tt-page-markdown-action-padding-block, 7px);
  padding-inline: var(--tt-page-markdown-action-padding-inline, 8px);
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 0;
  line-height: 0;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}

.tt-page-markdown-actions__button:hover,
.tt-page-markdown-actions__button--menu[aria-expanded='true'] {
  background: var(--vp-c-default-soft);
}

.tt-page-markdown-actions__button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: -2px;
}

.tt-page-markdown-actions__button svg {
  width: var(--tt-page-markdown-action-icon-size, 20px);
  height: var(--tt-page-markdown-action-icon-size, 20px);
}

.tt-page-markdown-actions__menu {
  position: relative;
  display: flex;
  line-height: 0;
  z-index: 1;
}

.tt-page-markdown-actions__button--menu {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid var(--vp-c-divider);
  list-style: none;
  padding-inline: var(--tt-page-markdown-action-menu-padding-inline, 9px);
}

.tt-page-markdown-actions__dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: var(--tt-page-markdown-dropdown-min-width, 136px);
  padding: var(--tt-page-markdown-dropdown-padding, 4px);
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--tt-page-markdown-action-radius, 10px);
  background: var(--vp-c-bg-elv);
  box-shadow: var(--vp-shadow-3);
}

.tt-page-markdown-actions__menu-item {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: flex-start;
  padding-block: var(--tt-page-markdown-menu-item-padding-block, 7px);
  padding-inline: var(--tt-page-markdown-menu-item-padding-inline, 9px);
  border: 0;
  border-radius: var(--tt-page-markdown-menu-item-radius, 6px);
  background: transparent;
  color: var(--vp-c-text-1);
  font: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}

.tt-page-markdown-actions__menu-item:hover {
  background: var(--vp-c-default-soft);
}

.tt-page-markdown-actions__menu-item:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}
</style>
