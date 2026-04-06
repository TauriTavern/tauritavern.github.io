<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useData } from 'vitepress'

import {
  getLatestReleaseDownloads,
  type ReleaseDownloadOption,
  type ReleaseDownloadsSnapshot,
} from '../releaseDownloads'

type PlatformId = ReleaseDownloadsSnapshot['platforms'][number]['platformId']
type VariantId = ReleaseDownloadOption['variantId']

type ReleaseDownloadsMessages = {
  title: string
  loading: string
  error: string
  viewReleaseNotes: string
  publishedAt: string
  platformTitles: Record<PlatformId, string>
  platformDescriptions: Record<PlatformId, string>
  optionLabels: Record<VariantId, string>
}

const { lang } = useData()

const latestRelease = ref<ReleaseDownloadsSnapshot>()
const error = ref<string>()

const messages = computed<ReleaseDownloadsMessages>(() =>
  lang.value.startsWith('zh')
    ? {
        title: '最新版本下载',
        loading: '正在读取 GitHub 最新 Release…',
        error: '读取 GitHub 最新 Release 失败：',
        viewReleaseNotes: '查看完整发布说明',
        publishedAt: '发布时间',
        platformTitles: {
          windows: 'Windows',
          macos: 'macOS',
          linux: 'Linux',
          android: 'Android',
          ios: 'iOS',
        },
        platformDescriptions: {
          windows: '优先使用安装版；便携版适合免安装场景。',
          macos: '若只显示 Apple Silicon，表示当前最新版本仅提供 ARM 构建。',
          linux: '优先使用 AppImage；也可按发行版习惯选择 deb、rpm 或便携版。',
          android: '大多数 Android 设备优先选择 arm64。',
          ios: 'IPA 需要通过 iOS 可用的签名或侧载方式安装。',
        },
        optionLabels: {
          installer: '安装版',
          portable: '便携版',
          msi: 'MSI 安装包',
          'apple-silicon': 'Apple Silicon',
          intel: 'Intel',
          dmg: 'DMG',
          appimage: 'AppImage',
          deb: 'DEB',
          rpm: 'RPM',
          arm64: 'ARM64',
          armv7: 'ARMv7',
          x64: 'x86_64',
          x86: 'x86',
          ipa: 'IPA',
        },
      }
    : {
        title: 'Latest Downloads',
        loading: 'Loading the latest GitHub release…',
        error: 'Failed to load the latest GitHub release:',
        viewReleaseNotes: 'View full release notes',
        publishedAt: 'Published',
        platformTitles: {
          windows: 'Windows',
          macos: 'macOS',
          linux: 'Linux',
          android: 'Android',
          ios: 'iOS',
        },
        platformDescriptions: {
          windows: 'Use the installer first; portable is for no-install setups.',
          macos: 'If only Apple Silicon is shown, the latest release currently ships ARM builds only.',
          linux: 'AppImage is the default choice; deb, rpm, and portable builds are also available.',
          android: 'Most Android devices should use the arm64 build.',
          ios: 'IPA packages need to be installed through a supported iOS signing or sideload workflow.',
        },
        optionLabels: {
          installer: 'Installer',
          portable: 'Portable',
          msi: 'MSI',
          'apple-silicon': 'Apple Silicon',
          intel: 'Intel',
          dmg: 'DMG',
          appimage: 'AppImage',
          deb: 'DEB',
          rpm: 'RPM',
          arm64: 'ARM64',
          armv7: 'ARMv7',
          x64: 'x86_64',
          x86: 'x86',
          ipa: 'IPA',
        },
      },
)

const publishedAt = computed(() => {
  if (!latestRelease.value) {
    return ''
  }

  return new Intl.DateTimeFormat(lang.value.startsWith('zh') ? 'zh-CN' : 'en-US', {
    dateStyle: 'medium',
  }).format(new Date(latestRelease.value.publishedAt))
})

onMounted(async () => {
  try {
    latestRelease.value = await getLatestReleaseDownloads()
  } catch (caughtError) {
    error.value =
      caughtError instanceof Error ? caughtError.message : String(caughtError)
  }
})
</script>

<template>
  <section class="tt-release-downloads">
    <header class="tt-release-downloads__hero">
      <div class="tt-release-downloads__hero-text">
        <p class="tt-release-downloads__eyebrow">{{ messages.title }}</p>
        <template v-if="latestRelease">
          <h2 class="tt-release-downloads__version">{{ latestRelease.tagName }}</h2>
          <p class="tt-release-downloads__meta">
            {{ messages.publishedAt }} · {{ publishedAt }}
          </p>
        </template>
        <p v-else-if="error" class="tt-release-downloads__error">
          {{ messages.error }} {{ error }}
        </p>
        <p v-else class="tt-release-downloads__loading">{{ messages.loading }}</p>
      </div>

      <a
        v-if="latestRelease"
        class="tt-release-downloads__release-link"
        :href="latestRelease.htmlUrl"
      >
        {{ messages.viewReleaseNotes }}
      </a>
    </header>

    <div v-if="latestRelease" class="tt-release-downloads__grid">
      <article
        v-for="platform in latestRelease.platforms"
        :key="platform.platformId"
        class="tt-release-downloads__card"
      >
        <div class="tt-release-downloads__card-header">
          <h3>{{ messages.platformTitles[platform.platformId] }}</h3>
          <p>{{ messages.platformDescriptions[platform.platformId] }}</p>
        </div>

        <div class="tt-release-downloads__actions">
          <a
            v-for="option in platform.options"
            :key="option.assetName"
            class="tt-release-downloads__button"
            :href="option.url"
          >
            {{ messages.optionLabels[option.variantId] }}
          </a>
        </div>

        <ul class="tt-release-downloads__assets">
          <li
            v-for="option in platform.options"
            :key="`${platform.platformId}-${option.assetName}`"
          >
            <span>{{ messages.optionLabels[option.variantId] }}</span>
            <code :title="option.assetName">{{ option.assetName }}</code>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<style scoped>
.tt-release-downloads {
  display: grid;
  gap: 20px;
  margin: 28px 0 12px;
}

.tt-release-downloads__hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 18px;
  background: linear-gradient(180deg, var(--vp-c-bg-soft) 0%, var(--vp-c-bg) 100%);
}

.tt-release-downloads__hero-text {
  display: grid;
  gap: 6px;
}

.tt-release-downloads__eyebrow {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tt-release-downloads__version {
  margin: 0;
  font-size: 28px;
  line-height: 1.1;
}

.tt-release-downloads__meta,
.tt-release-downloads__loading,
.tt-release-downloads__error {
  margin: 0;
  color: var(--vp-c-text-2);
}

.tt-release-downloads__error {
  color: var(--vp-c-danger-1);
}

.tt-release-downloads__release-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-weight: 600;
  white-space: nowrap;
  text-decoration: none;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;
}

.tt-release-downloads__release-link:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.tt-release-downloads__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.tt-release-downloads__card {
  display: grid;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 18px;
  align-content: start;
  background: var(--vp-c-bg-soft);
}

.tt-release-downloads__card-header {
  display: grid;
  gap: 6px;
}

.tt-release-downloads__card-header h3,
.tt-release-downloads__card-header p {
  margin: 0;
}

.tt-release-downloads__card-header p {
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.tt-release-downloads__actions {
  display: flex;
  align-content: flex-start;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 10px;
}

.tt-release-downloads__button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  align-self: flex-start;
  justify-content: center;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 12px;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color 0.18s ease,
    transform 0.18s ease;
}

.tt-release-downloads__button:hover {
  background: var(--vp-c-brand-2);
  transform: translateY(-1px);
}

.tt-release-downloads__assets {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tt-release-downloads__assets li {
  display: grid;
  gap: 6px;
  min-width: 0;
  padding-top: 10px;
  border-top: 1px solid var(--vp-c-divider);
}

.tt-release-downloads__assets span {
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 600;
}

.tt-release-downloads__assets code {
  display: block;
  overflow: hidden;
  padding: 0;
  background: transparent;
  color: var(--vp-c-text-1);
  font-size: 12px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .tt-release-downloads__hero {
    align-items: stretch;
    flex-direction: column;
    padding: 18px;
  }

  .tt-release-downloads__release-link {
    width: 100%;
  }

  .tt-release-downloads__grid {
    grid-template-columns: 1fr;
  }
}
</style>
