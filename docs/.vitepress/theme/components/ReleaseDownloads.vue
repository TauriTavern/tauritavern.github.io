<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useData } from 'vitepress'

import {
  detectDevice,
  getLatestReleaseDownloads,
  getRecommendedDownload,
  releasePageUrl,
  verifyReleaseDownloadLogic,
  type ArchitectureId,
  type DeviceProfile,
  type PlatformId,
  type ReleaseDownloadsSnapshot,
  type VariantId,
} from '../releaseDownloads'

type NavigatorUAData = {
  architecture?: string
  bitness?: string
  platform?: string
  getHighEntropyValues?: (
    hints: string[],
  ) => Promise<{ architecture?: string; bitness?: string }>
}

if (import.meta.env.DEV) {
  verifyReleaseDownloadLogic()
}

const props = withDefaults(
  defineProps<{ mode?: 'landing' | 'catalog' }>(),
  { mode: 'landing' },
)
const { lang } = useData()
const latestRelease = ref<ReleaseDownloadsSnapshot>()
const device = ref<DeviceProfile>({ architectureId: 'unknown', platformId: null })
const selectedPlatformId = ref<PlatformId>('windows')
const isLoading = ref(true)
const hasError = ref(false)
const currentYear = new Date().getFullYear()

const isChinese = computed(() => lang.value.startsWith('zh'))
const catalogPath = computed(() =>
  isChinese.value ? '/downloads/platforms/' : '/en/downloads/platforms/',
)
const landingPath = computed(() =>
  isChinese.value ? '/downloads/' : '/en/downloads/',
)

const messages = computed(() =>
  isChinese.value
    ? {
        tagline: 'SillyTavern 的原生桌面版本',
        loading: '正在获取最新版本',
        loadingDetail: '同时识别这台设备',
        error: '前往 GitHub Releases',
        errorDetail: '暂时无法读取最新版本',
        retry: '重新读取',
        testFlightPolicy: '可用性受 Apple TestFlight 政策限制。',
        publicBeta: '公开测试',
        joinTestFlight: '加入测试',
        downloadVersion: (version: string) => '下载 ' + version,
        official: '正式版，适合大部分人使用',
        released: '最新正式版发布于',
        new: '新',
        releaseNotes: '版本说明',
        detectedIntro: '这台设备看起来是：',
        unknownDevice: '未能识别',
        otherPlatforms: '下载其他平台版本',
        recommendedDownload: '返回推荐下载',
        chooseMacChip: '请选择你的 Mac 芯片',
        choosePlatform: '选择下载版本',
        allBuilds: '其他平台版本',
        allBuildsDescription: '选择你的平台和安装格式。',
        platformSelectorLabel: '选择下载平台',
        download: '下载',
        platformTitles: {
          windows: 'Windows',
          macos: 'macOS',
          linux: 'Linux',
          android: 'Android',
          ios: 'iOS',
        } satisfies Record<PlatformId, string>,
        platformDescriptions: {
          windows: '安装版适合大多数用户；便携版无需安装。',
          macos: 'M 系列芯片选择 Apple Silicon，旧款机型选择 Intel。',
          linux: 'AppImage 可直接运行，也可选择 DEB 或 RPM。',
          android: '近年的手机和平板通常使用 ARM64。',
          ios: '可通过 TestFlight 安装，或下载 IPA 自行签名与侧载。',
        } satisfies Record<PlatformId, string>,
        optionLabels: {
          installer: '安装版',
          portable: '便携版',
          msi: 'MSI 安装包',
          'apple-silicon': 'Apple Silicon',
          intel: 'Intel Mac',
          dmg: 'DMG',
          appimage: 'AppImage',
          deb: 'DEB 软件包',
          rpm: 'RPM 软件包',
          arm64: 'ARM64',
          armv7: 'ARMv7',
          x64: 'x86_64',
          x86: 'x86',
          ipa: 'IPA',
        } satisfies Record<VariantId, string>,
        architectureLabels: {
          arm64: 'ARM64',
          armv7: 'ARMv7',
          x64: '64 位',
          x86: '32 位',
          unknown: '',
        } satisfies Record<ArchitectureId, string>,
      }
    : {
        tagline: 'SillyTavern, as a native desktop app',
        loading: 'Getting the latest release',
        loadingDetail: 'Detecting this device at the same time',
        error: 'Open GitHub Releases',
        errorDetail: 'The latest release is temporarily unavailable',
        retry: 'Try again',
        testFlightPolicy: 'Availability is subject to Apple TestFlight policies.',
        publicBeta: 'Public beta',
        joinTestFlight: 'Join beta',
        downloadVersion: (version: string) => 'Download ' + version,
        official: 'Stable release',
        released: 'Latest stable release published',
        new: 'New',
        releaseNotes: 'Release notes',
        detectedIntro: 'This device looks like:',
        unknownDevice: 'Not detected',
        otherPlatforms: 'Download for another platform',
        recommendedDownload: 'Back to recommended download',
        chooseMacChip: 'Choose your Mac chip',
        choosePlatform: 'Choose a download',
        allBuilds: 'Other platforms',
        allBuildsDescription: 'Choose a platform and installation format.',
        platformSelectorLabel: 'Choose a download platform',
        download: 'Download',
        platformTitles: {
          windows: 'Windows',
          macos: 'macOS',
          linux: 'Linux',
          android: 'Android',
          ios: 'iOS',
        } satisfies Record<PlatformId, string>,
        platformDescriptions: {
          windows: 'The installer is best for most people; portable needs no installation.',
          macos: 'Choose Apple Silicon for M-series Macs, or Intel for older Macs.',
          linux: 'Run the AppImage directly, or choose DEB or RPM.',
          android: 'Most recent phones and tablets use ARM64.',
          ios: 'Install with TestFlight, or download the IPA for signing or sideloading.',
        } satisfies Record<PlatformId, string>,
        optionLabels: {
          installer: 'Installer',
          portable: 'Portable',
          msi: 'MSI package',
          'apple-silicon': 'Apple Silicon',
          intel: 'Intel Mac',
          dmg: 'DMG',
          appimage: 'AppImage',
          deb: 'DEB package',
          rpm: 'RPM package',
          arm64: 'ARM64',
          armv7: 'ARMv7',
          x64: 'x86_64',
          x86: 'x86',
          ipa: 'IPA',
        } satisfies Record<VariantId, string>,
        architectureLabels: {
          arm64: 'ARM64',
          armv7: 'ARMv7',
          x64: '64-bit',
          x86: '32-bit',
          unknown: '',
        } satisfies Record<ArchitectureId, string>,
      },
)

const recommendedDownload = computed(() =>
  latestRelease.value
    ? getRecommendedDownload(latestRelease.value, device.value)
    : undefined,
)

const detectedPlatform = computed(() => {
  const platformId = device.value.platformId

  return platformId
    ? latestRelease.value?.platforms.find((platform) => platform.platformId === platformId)
    : undefined
})

const selectedPlatform = computed(() =>
  latestRelease.value?.platforms.find(
    ({ platformId }) => platformId === selectedPlatformId.value,
  ),
)

const macArchitectureChoices = computed(() => {
  if (
    device.value.platformId !== 'macos' ||
    device.value.architectureId !== 'unknown'
  ) {
    return []
  }

  const options =
    detectedPlatform.value?.options.filter(
      ({ variantId }) =>
        variantId === 'apple-silicon' || variantId === 'intel',
    ) ?? []

  return new Set(options.map(({ architectureId }) => architectureId)).size > 1
    ? options
    : []
})

const publishedAt = computed(() => {
  if (!latestRelease.value) {
    return ''
  }

  return new Intl.DateTimeFormat(isChinese.value ? 'zh-CN' : 'en-US', {
    dateStyle: 'medium',
  }).format(new Date(latestRelease.value.publishedAt))
})

const detectedVariantLabel = computed(() => {
  if (recommendedDownload.value) {
    return messages.value.optionLabels[recommendedDownload.value.variantId]
  }

  return messages.value.architectureLabels[device.value.architectureId]
})

async function detectCurrentDevice(): Promise<DeviceProfile> {
  const browserNavigator = navigator as Navigator & {
    userAgentData?: NavigatorUAData
  }
  const userAgentData = browserNavigator.userAgentData
  let uaArchitecture = userAgentData?.architecture
  let bitness = userAgentData?.bitness

  if (userAgentData?.getHighEntropyValues) {
    try {
      const entropy = await userAgentData.getHighEntropyValues([
        'architecture',
        'bitness',
      ])
      uaArchitecture = entropy.architecture ?? uaArchitecture
      bitness = entropy.bitness ?? bitness
    } catch {
      // The lower-entropy platform signal is still useful as a fallback.
    }
  }

  return detectDevice({
    bitness,
    maxTouchPoints: browserNavigator.maxTouchPoints,
    platform: browserNavigator.platform,
    uaArchitecture,
    uaPlatform: userAgentData?.platform,
    userAgent: browserNavigator.userAgent,
  })
}

function formatSize(bytes: number): string {
  if (!bytes) {
    return '—'
  }

  const megabytes = bytes / 1024 / 1024
  const value = new Intl.NumberFormat(isChinese.value ? 'zh-CN' : 'en-US', {
    maximumFractionDigits: megabytes >= 100 ? 0 : 1,
  }).format(megabytes)

  return value + ' MB'
}

function selectPlatform(platformId: PlatformId): void {
  selectedPlatformId.value = platformId
}

async function loadRelease(): Promise<void> {
  isLoading.value = true
  hasError.value = false

  try {
    latestRelease.value = await getLatestReleaseDownloads()
    const preferredPlatform = device.value.platformId

    if (
      preferredPlatform &&
      latestRelease.value.platforms.some(
        ({ platformId }) => platformId === preferredPlatform,
      )
    ) {
      selectedPlatformId.value = preferredPlatform
    } else if (latestRelease.value.platforms[0]) {
      selectedPlatformId.value = latestRelease.value.platforms[0].platformId
    }
  } catch {
    hasError.value = true
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  device.value = await detectCurrentDevice()
  await loadRelease()
})
</script>

<template>
  <section
    class="tt-downloads"
    :class="{ 'tt-downloads--catalog': props.mode === 'catalog' }"
  >
    <template v-if="props.mode === 'landing'">
      <div class="tt-downloads__shell">
        <main class="tt-downloads__hero">
          <div class="tt-downloads__content">
            <div class="tt-downloads__lockup">
              <h1 class="tt-downloads__brand">
                <img src="/logo.png" alt="TauriTavern" />
              </h1>
              <p class="tt-downloads__tagline">{{ messages.tagline }}</p>
            </div>

            <div class="tt-downloads__action" aria-live="polite">
              <div class="tt-downloads__action-main">
                <div
                  v-if="isLoading"
                  class="tt-downloads__primary tt-downloads__primary--loading"
                  aria-disabled="true"
                >
                  <strong>{{ messages.loading }}</strong>
                  <small>{{ messages.loadingDetail }}</small>
                </div>

                <div v-else-if="hasError" class="tt-downloads__error">
                  <a
                    class="tt-downloads__primary"
                    :href="releasePageUrl"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <strong>{{ messages.error }}</strong>
                    <small>{{ messages.errorDetail }}</small>
                  </a>
                  <button type="button" @click="loadRelease">{{ messages.retry }}</button>
                </div>

                <div
                  v-else-if="macArchitectureChoices.length > 1"
                  class="tt-downloads__mac-choice"
                >
                  <p>{{ messages.chooseMacChip }}</p>
                  <div>
                    <a
                      v-for="option in macArchitectureChoices"
                      :key="option.assetName"
                      class="tt-downloads__primary"
                      :href="option.url"
                    >
                      <strong>{{ messages.download }} {{ messages.optionLabels[option.variantId] }}</strong>
                      <small>{{ latestRelease?.tagName }} · {{ formatSize(option.size) }}</small>
                    </a>
                  </div>
                </div>

                <a
                  v-else-if="recommendedDownload && detectedPlatform"
                  class="tt-downloads__primary"
                  :href="recommendedDownload.url"
                >
                  <strong>{{ messages.downloadVersion(latestRelease?.tagName ?? '') }}</strong>
                  <small>{{ messages.official }}</small>
                </a>

                <a
                  v-else
                  class="tt-downloads__primary"
                  :href="catalogPath"
                >
                  <strong>{{ messages.choosePlatform }}</strong>
                  <small>{{ messages.official }}</small>
                </a>
              </div>

              <p v-if="latestRelease" class="tt-downloads__release-note">
                <span>{{ messages.new }}</span>
                {{ messages.released }} {{ publishedAt }}
                <a :href="latestRelease.htmlUrl" target="_blank" rel="noreferrer">
                  {{ messages.releaseNotes }}
                </a>
              </p>
            </div>

            <div v-if="!isLoading && !hasError" class="tt-downloads__device">
              <span>{{ messages.detectedIntro }}</span>
              <template v-if="device.platformId">
                <b>{{ messages.platformTitles[device.platformId] }}</b>
                <b v-if="detectedVariantLabel">{{ detectedVariantLabel }}</b>
              </template>
              <em v-else>{{ messages.unknownDevice }}</em>
              <a :href="catalogPath">{{ messages.otherPlatforms }}</a>
            </div>
          </div>
        </main>

        <footer class="tt-downloads__footer">
          <span>© {{ currentYear }} TauriTavern Contributors</span>
          <nav aria-label="TauriTavern">
            <a href="https://github.com/Darkatse/TauriTavern" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a
              v-if="latestRelease"
              :href="latestRelease.htmlUrl"
              target="_blank"
              rel="noreferrer"
            >
              {{ messages.releaseNotes }}
            </a>
          </nav>
        </footer>
      </div>
    </template>

    <section v-else class="tt-downloads__catalog">
      <div class="tt-downloads__catalog-inner">
        <a class="tt-downloads__back" :href="landingPath">
          ← {{ messages.recommendedDownload }}
        </a>
        <header>
          <h1>{{ messages.allBuilds }}</h1>
          <p>{{ messages.allBuildsDescription }}</p>
        </header>

        <div v-if="isLoading" class="tt-downloads__catalog-status" aria-live="polite">
          {{ messages.loading }}…
        </div>

        <div v-else-if="hasError" class="tt-downloads__catalog-status">
          <p>{{ messages.errorDetail }}</p>
          <button type="button" @click="loadRelease">{{ messages.retry }}</button>
          <a :href="releasePageUrl" target="_blank" rel="noreferrer">
            GitHub Releases
          </a>
        </div>

        <template v-else-if="latestRelease">
          <nav
            class="tt-downloads__platforms"
            role="group"
            :aria-label="messages.platformSelectorLabel"
          >
            <button
              v-for="platform in latestRelease.platforms"
              :key="platform.platformId"
              type="button"
              :aria-pressed="selectedPlatformId === platform.platformId"
              @click="selectPlatform(platform.platformId)"
            >
              {{ messages.platformTitles[platform.platformId] }}
            </button>
          </nav>

          <div v-if="selectedPlatform" class="tt-downloads__builds">
            <div class="tt-downloads__builds-heading">
              <h2>{{ messages.platformTitles[selectedPlatform.platformId] }}</h2>
              <p>{{ messages.platformDescriptions[selectedPlatform.platformId] }}</p>
            </div>

            <ul>
              <li v-if="selectedPlatform.platformId === 'ios'">
                <div>
                  <strong>TestFlight</strong>
                  <span class="tt-downloads__build-note">
                    {{ messages.testFlightPolicy }}
                  </span>
                </div>
                <small>{{ messages.publicBeta }}</small>
                <a
                  href="https://testflight.apple.com/join/gpqAdeTm"
                  target="_blank"
                  rel="noreferrer"
                >
                  {{ messages.joinTestFlight }}
                </a>
              </li>
              <li v-for="option in selectedPlatform.options" :key="option.assetName">
                <div>
                  <strong>{{ messages.optionLabels[option.variantId] }}</strong>
                  <code>{{ option.assetName }}</code>
                </div>
                <small>{{ formatSize(option.size) }}</small>
                <a :href="option.url">{{ messages.download }}</a>
              </li>
            </ul>
          </div>
        </template>
      </div>
    </section>
  </section>
</template>

<style scoped>
.tt-downloads {
  --background: #fff;
  --foreground: #0a0a0a;
  --muted: #666;
  --soft: #f2f2f2;
  --line: #e5e5e5;
  --button: var(--vp-button-brand-bg, #0d6877);
  --button-hover: var(--vp-button-brand-hover-bg, #11798a);
  --button-text: var(--vp-button-brand-text, #fff);
  --pattern-opacity: 1;
  --pattern-filter: none;
  --ambient:
    radial-gradient(ellipse at 32% 38%, rgba(22, 136, 155, 0.12), transparent 42%),
    radial-gradient(ellipse at 72% 68%, rgba(247, 190, 44, 0.075), transparent 34%);

  position: relative;
  min-height: calc(100vh - var(--vp-nav-height));
  overflow: hidden;
  background-color: var(--background);
  background-image: var(--ambient);
  color: var(--foreground);
  font-family:
    "IBM Plex Sans SC",
    "Noto Sans SC",
    "PingFang SC",
    ui-sans-serif,
    system-ui,
    sans-serif;
  font-size: 17.5px;
  line-height: 1.5;
}

.tt-downloads::before {
  position: absolute;
  z-index: 0;
  inset: 0 0 auto;
  height: max(720px, calc(100svh - var(--vp-nav-height)));
  background: url("/download-pattern.svg") center / max(1180px, 100vw) auto no-repeat;
  content: "";
  filter: var(--pattern-filter);
  opacity: var(--pattern-opacity);
  pointer-events: none;
}

:global(html.dark .tt-downloads) {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --muted: #a3a3a3;
  --soft: #262626;
  --line: #333;
  --pattern-opacity: 0.42;
  --pattern-filter: none;
  --ambient:
    radial-gradient(ellipse at 32% 38%, rgba(51, 185, 203, 0.12), transparent 42%),
    radial-gradient(ellipse at 72% 68%, rgba(247, 190, 44, 0.045), transparent 34%);
}

.tt-downloads__shell {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: min(960px, 100%);
  min-height: calc(100svh - var(--vp-nav-height));
  margin: 0 auto;
  padding: 0 40px;
}

.tt-downloads__hero {
  display: flex;
  align-items: center;
  flex: 1;
  width: 100%;
  padding-left: 45px;
}

.tt-downloads__content {
  --download-control-width: 250px;
  --lockup-width: min(360px, 85vw);

  width: 100%;
  padding: 24px 0;
}

.tt-downloads__lockup {
  width: var(--lockup-width);
  text-align: center;
  transform: translateX(
    calc((var(--download-control-width) - var(--lockup-width)) / 2)
  );
}

.tt-downloads__brand {
  position: relative;
  width: var(--lockup-width);
  aspect-ratio: 18 / 11;
  margin: 0 auto;
  overflow: hidden;
  line-height: 0;
}

.tt-downloads__brand img {
  position: absolute;
  top: -34%;
  left: 0;
  display: block;
  width: 100%;
  max-width: none;
}

.tt-downloads__tagline {
  position: relative;
  left: calc((var(--lockup-width) - var(--download-control-width)) / 2);
  width: max-content;
  margin: 0;
  font-size: clamp(22px, 2.4vw, 30px);
  letter-spacing: -0.025em;
  line-height: 1.35;
  text-align: left;
  white-space: nowrap;
}

.tt-downloads__action {
  margin-top: 32px;
}

.tt-downloads__action-main {
  display: flex;
  justify-content: flex-start;
  width: var(--download-control-width);
}

.tt-downloads__action-main > * {
  flex: 0 0 auto;
}

.tt-downloads__action-main > .tt-downloads__primary {
  width: 100%;
}

.tt-downloads__primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-width: 250px;
  min-height: 70px;
  padding: 10px 20px;
  border: 0;
  border-radius: 8px;
  background: var(--button);
  color: var(--button-text);
  text-align: center;
  text-decoration: none;
  transition: background-color 0.16s ease;
}

.tt-downloads__primary:hover {
  background: var(--button-hover);
  color: var(--button-text);
}

.tt-downloads__primary strong,
.tt-downloads__primary small {
  display: block;
  font-size: 17.5px;
  font-weight: 500;
  line-height: 1.42;
  white-space: nowrap;
}

.tt-downloads__primary--loading {
  opacity: 0.72;
}

.tt-downloads__error {
  display: flex;
  align-items: center;
  gap: 16px;
}

.tt-downloads__error button {
  padding: 0;
  border: 0;
  border-bottom: 1px solid currentColor;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.tt-downloads__mac-choice > p {
  margin: 0 0 10px;
}

.tt-downloads__mac-choice > div {
  display: flex;
  gap: 12px;
}

.tt-downloads__mac-choice .tt-downloads__primary {
  min-width: 220px;
}

.tt-downloads__release-note {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0 0;
}

.tt-downloads__release-note > span {
  padding: 1px 9px 2px;
  border-radius: 6px;
  background: #67bd62;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
}

.tt-downloads__release-note a,
.tt-downloads__device a {
  color: inherit;
  font-weight: 500;
  text-underline-offset: 3px;
}

.tt-downloads__device {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 32px;
}

.tt-downloads__device b,
.tt-downloads__device em {
  padding: 3px 12px;
  border-radius: 6px;
  background: var(--soft);
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
}

.tt-downloads__device a {
  margin-left: 10px;
  padding: 7px 10px;
}

.tt-downloads__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 64px;
  color: var(--muted);
  font-size: 14px;
}

.tt-downloads__footer nav {
  display: flex;
  gap: 24px;
}

.tt-downloads__footer a {
  color: inherit;
  text-decoration: none;
}

.tt-downloads__footer a:hover {
  color: var(--foreground);
}

.tt-downloads__catalog {
  position: relative;
  z-index: 1;
  min-height: calc(100svh - var(--vp-nav-height));
}

.tt-downloads__catalog-inner {
  width: min(960px, 100%);
  margin: 0 auto;
  padding: 72px 40px 96px;
}

.tt-downloads__back {
  display: inline-block;
  margin-bottom: 32px;
  color: var(--muted);
  font-size: 14px;
  text-decoration: none;
}

.tt-downloads__back:hover {
  color: var(--foreground);
}

.tt-downloads__catalog header h1 {
  margin: 0;
  font-size: 36px;
  font-weight: 500;
  letter-spacing: -0.035em;
  line-height: 1.2;
}

.tt-downloads__catalog header p {
  margin: 8px 0 0;
  color: var(--muted);
}

.tt-downloads__catalog-status {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  min-height: 120px;
  margin-top: 36px;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  color: var(--muted);
}

.tt-downloads__catalog-status p {
  margin: 0;
}

.tt-downloads__catalog-status button {
  padding: 0;
  border: 0;
  border-bottom: 1px solid currentColor;
  background: transparent;
  color: var(--foreground);
  font: inherit;
  cursor: pointer;
}

.tt-downloads__catalog-status a {
  color: var(--foreground);
  text-underline-offset: 3px;
}

.tt-downloads__platforms {
  display: flex;
  gap: 28px;
  margin-top: 36px;
  border-bottom: 1px solid var(--line);
}

.tt-downloads__platforms button {
  padding: 0 0 10px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--muted);
  font: inherit;
  cursor: pointer;
}

.tt-downloads__platforms button:hover,
.tt-downloads__platforms button[aria-pressed="true"] {
  border-bottom-color: currentColor;
  color: var(--foreground);
}

.tt-downloads__builds {
  margin-top: 44px;
}

.tt-downloads__builds-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 28px;
}

.tt-downloads__builds-heading h2,
.tt-downloads__builds-heading p {
  margin: 0;
}

.tt-downloads__builds-heading h2 {
  font-size: 26px;
  font-weight: 500;
}

.tt-downloads__builds-heading p {
  color: var(--muted);
  font-size: 15px;
}

.tt-downloads__builds ul {
  margin: 24px 0 0;
  padding: 0;
  border-top: 1px solid var(--line);
  list-style: none;
}

.tt-downloads__builds li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 24px;
  min-height: 76px;
  border-bottom: 1px solid var(--line);
}

.tt-downloads__builds li > div {
  display: flex;
  align-items: baseline;
  min-width: 0;
  gap: 16px;
}

.tt-downloads__builds strong {
  flex: 0 0 130px;
  font-weight: 500;
}

.tt-downloads__builds code,
.tt-downloads__builds small,
.tt-downloads__build-note {
  color: var(--muted);
  font-size: 12px;
}

.tt-downloads__builds code {
  overflow: hidden;
  background: transparent;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tt-downloads__builds a {
  color: var(--foreground);
  font-weight: 500;
  text-underline-offset: 3px;
}

.tt-downloads a:focus-visible,
.tt-downloads button:focus-visible {
  outline: 3px solid var(--foreground);
  outline-offset: 4px;
}

@media (max-width: 700px) {
  .tt-downloads {
    --pattern-opacity: 0.55;

    font-size: 17px;
  }

  .tt-downloads::before {
    height: 720px;
    background-position: 70% top;
    background-size: 1050px auto;
  }

  .tt-downloads__shell {
    min-height: calc(100svh - var(--vp-nav-height));
    padding: 0 20px;
  }

  .tt-downloads__hero {
    align-items: flex-start;
    padding: 40px 0 48px;
  }

  .tt-downloads__content {
    --download-control-width: min(280px, 100%);
    --lockup-width: min(330px, 88vw);

    padding: 0;
  }

  .tt-downloads__tagline {
    width: 100%;
    font-size: 25px;
    white-space: normal;
  }

  .tt-downloads__primary {
    width: min(280px, 100%);
    min-width: 0;
  }

  .tt-downloads__primary strong,
  .tt-downloads__primary small {
    white-space: normal;
  }

  .tt-downloads__mac-choice > div {
    align-items: flex-start;
    flex-direction: column;
  }

  .tt-downloads__mac-choice .tt-downloads__primary {
    width: min(280px, 100%);
    min-width: 0;
  }

  .tt-downloads__release-note {
    max-width: 340px;
  }

  .tt-downloads__device {
    max-width: 350px;
    margin-top: 28px;
  }

  .tt-downloads__device a {
    margin-left: 0;
    padding-left: 0;
  }

  .tt-downloads__footer {
    align-items: flex-start;
    flex-direction: column;
    justify-content: center;
    min-height: 90px;
    padding: 18px 0;
  }

  .tt-downloads__catalog-inner {
    padding: 56px 20px 80px;
  }

  .tt-downloads__platforms {
    gap: 20px;
    overflow-x: auto;
  }

  .tt-downloads__platforms button {
    flex: 0 0 auto;
  }

  .tt-downloads__builds-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .tt-downloads__builds li {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px 16px;
    padding: 16px 0;
  }

  .tt-downloads__builds li > div {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .tt-downloads__builds strong {
    flex-basis: auto;
  }

  .tt-downloads__builds small {
    grid-column: 2;
    grid-row: 1;
  }

  .tt-downloads__builds li > a {
    grid-column: 2;
    grid-row: 2;
  }

  .tt-downloads__builds code {
    max-width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tt-downloads * {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
