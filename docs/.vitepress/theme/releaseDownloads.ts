const releaseApiUrl =
  'https://api.github.com/repos/Darkatse/TauriTavern/releases/latest'

export const releasePageUrl =
  'https://github.com/Darkatse/TauriTavern/releases/latest'

export type PlatformId = 'windows' | 'macos' | 'linux' | 'android' | 'ios'

export type ArchitectureId = 'arm64' | 'armv7' | 'x64' | 'x86' | 'unknown'

export type VariantId =
  | 'installer'
  | 'portable'
  | 'msi'
  | 'apple-silicon'
  | 'intel'
  | 'dmg'
  | 'appimage'
  | 'deb'
  | 'rpm'
  | 'arm64'
  | 'armv7'
  | 'x64'
  | 'x86'
  | 'ipa'

type GitHubReleaseAsset = {
  name: string
  browser_download_url: string
  size: number
}

type GitHubLatestReleaseResponse = {
  tag_name: string
  html_url: string
  published_at: string
  assets: GitHubReleaseAsset[]
}

type ClassifiedAsset = {
  architectureId: ArchitectureId
  platformId: PlatformId
  variantId: VariantId
}

export type DeviceProfile = {
  architectureId: ArchitectureId
  platformId: PlatformId | null
}

export type DeviceSignals = {
  bitness?: string
  maxTouchPoints?: number
  platform?: string
  uaArchitecture?: string
  uaPlatform?: string
  userAgent?: string
}

export type ReleaseDownloadOption = {
  architectureId: ArchitectureId
  assetName: string
  size: number
  url: string
  variantId: VariantId
}

export type ReleaseDownloadPlatform = {
  platformId: PlatformId
  options: ReleaseDownloadOption[]
}

export type ReleaseDownloadsSnapshot = {
  htmlUrl: string
  publishedAt: string
  tagName: string
  platforms: ReleaseDownloadPlatform[]
}

const platformOrder: PlatformId[] = [
  'windows',
  'macos',
  'linux',
  'android',
  'ios',
]

const platformVariantOrder: Record<PlatformId, VariantId[]> = {
  windows: ['installer', 'portable', 'msi'],
  macos: ['apple-silicon', 'intel', 'dmg'],
  linux: ['appimage', 'deb', 'rpm', 'portable'],
  android: ['arm64', 'armv7', 'x64', 'x86'],
  ios: ['ipa'],
}

const architectureOrder: ArchitectureId[] = [
  'arm64',
  'x64',
  'armv7',
  'x86',
  'unknown',
]

let releaseDownloadsPromise: Promise<ReleaseDownloadsSnapshot> | undefined

function detectAssetArchitecture(assetName: string): ArchitectureId {
  if (/(arm64|aarch64|arm64-v8a)/i.test(assetName)) {
    return 'arm64'
  }

  if (/(armeabi-v7a|armv7)/i.test(assetName)) {
    return 'armv7'
  }

  if (/(x86_64|x64|amd64)/i.test(assetName)) {
    return 'x64'
  }

  if (/(^|[-_.])x86([-_.]|$)|i[3-6]86/i.test(assetName)) {
    return 'x86'
  }

  return 'unknown'
}

export function classifyReleaseAsset(assetName: string): ClassifiedAsset | null {
  if (/debug/i.test(assetName)) {
    return null
  }

  const architectureId = detectAssetArchitecture(assetName)

  if (/-setup\.exe$/i.test(assetName)) {
    return { architectureId, platformId: 'windows', variantId: 'installer' }
  }

  if (/portable\.exe$/i.test(assetName)) {
    return { architectureId, platformId: 'windows', variantId: 'portable' }
  }

  if (/\.msi$/i.test(assetName)) {
    return { architectureId, platformId: 'windows', variantId: 'msi' }
  }

  if (/\.dmg$/i.test(assetName)) {
    const variantId =
      architectureId === 'arm64'
        ? 'apple-silicon'
        : architectureId === 'x64'
          ? 'intel'
          : 'dmg'

    return { architectureId, platformId: 'macos', variantId }
  }

  if (/\.AppImage$/i.test(assetName)) {
    return { architectureId, platformId: 'linux', variantId: 'appimage' }
  }

  if (/\.deb$/i.test(assetName)) {
    return { architectureId, platformId: 'linux', variantId: 'deb' }
  }

  if (/\.rpm$/i.test(assetName)) {
    return { architectureId, platformId: 'linux', variantId: 'rpm' }
  }

  if (/linux-.*-portable(?:\.[^.]+)?$/i.test(assetName)) {
    return { architectureId, platformId: 'linux', variantId: 'portable' }
  }

  if (/\.apk$/i.test(assetName)) {
    if (architectureId === 'unknown') {
      return null
    }

    const variantId =
      architectureId === 'arm64'
        ? 'arm64'
        : architectureId === 'armv7'
          ? 'armv7'
          : architectureId === 'x64'
            ? 'x64'
            : 'x86'

    return { architectureId, platformId: 'android', variantId }
  }

  if (/\.ipa$/i.test(assetName)) {
    return { architectureId, platformId: 'ios', variantId: 'ipa' }
  }

  return null
}

export function detectDevice(signals: DeviceSignals): DeviceProfile {
  const userAgent = signals.userAgent ?? ''
  const platform = signals.platform ?? ''
  const uaPlatform = signals.uaPlatform ?? ''
  const platformSignals = `${uaPlatform} ${platform} ${userAgent}`.toLowerCase()

  let platformId: PlatformId | null = null

  if (
    /iphone|ipad|ipod/.test(platformSignals) ||
    (/mac/.test(platformSignals) && (signals.maxTouchPoints ?? 0) > 1)
  ) {
    platformId = 'ios'
  } else if (/android/.test(platformSignals)) {
    platformId = 'android'
  } else if (/windows|win32|win64/.test(platformSignals)) {
    platformId = 'windows'
  } else if (/macos|macintosh|macintel/.test(platformSignals)) {
    platformId = 'macos'
  } else if (!/cros|chrome os/.test(platformSignals) && /linux/.test(platformSignals)) {
    platformId = 'linux'
  }

  const architectureSignals = `${signals.uaArchitecture ?? ''} ${userAgent}`.toLowerCase()
  const bitness = signals.bitness ?? ''
  let architectureId: ArchitectureId = 'unknown'

  if (/arm64|aarch64/.test(architectureSignals)) {
    architectureId = 'arm64'
  } else if (/\barm\b/.test(architectureSignals)) {
    architectureId = bitness === '64' ? 'arm64' : 'armv7'
  } else if (/x86_64|x64|amd64|wow64|win64/.test(architectureSignals)) {
    architectureId = 'x64'
  } else if (/\bx86\b|i[3-6]86/.test(architectureSignals)) {
    architectureId = bitness === '64' ? 'x64' : 'x86'
  }

  return { architectureId, platformId }
}

export function normalizeLatestRelease(
  release: GitHubLatestReleaseResponse,
): ReleaseDownloadsSnapshot {
  const platformOptions = new Map<PlatformId, ReleaseDownloadOption[]>()

  for (const asset of release.assets) {
    const classified = classifyReleaseAsset(asset.name)

    if (!classified) {
      continue
    }

    const options = platformOptions.get(classified.platformId) ?? []

    options.push({
      architectureId: classified.architectureId,
      assetName: asset.name,
      size: asset.size,
      url: asset.browser_download_url,
      variantId: classified.variantId,
    })

    platformOptions.set(classified.platformId, options)
  }

  return {
    htmlUrl: release.html_url,
    publishedAt: release.published_at,
    tagName: release.tag_name,
    platforms: platformOrder
      .map((platformId) => {
        const options = platformOptions.get(platformId)

        if (!options || options.length === 0) {
          return null
        }

        const variantOrder = platformVariantOrder[platformId]

        return {
          platformId,
          options: [...options].sort((left, right) => {
            const variantDifference =
              variantOrder.indexOf(left.variantId) -
              variantOrder.indexOf(right.variantId)

            return (
              variantDifference ||
              architectureOrder.indexOf(left.architectureId) -
                architectureOrder.indexOf(right.architectureId)
            )
          }),
        }
      })
      .filter((platform): platform is ReleaseDownloadPlatform => platform !== null),
  }
}

export function getRecommendedDownload(
  release: ReleaseDownloadsSnapshot,
  device: DeviceProfile,
): ReleaseDownloadOption | undefined {
  if (!device.platformId) {
    return undefined
  }

  const platform = release.platforms.find(
    ({ platformId }) => platformId === device.platformId,
  )

  if (!platform) {
    return undefined
  }

  if (
    device.platformId === 'macos' &&
    device.architectureId === 'unknown' &&
    new Set(
      platform.options
        .map(({ architectureId }) => architectureId)
        .filter((architectureId) => architectureId !== 'unknown'),
    ).size > 1
  ) {
    return undefined
  }

  if (device.architectureId !== 'unknown') {
    const architectureMatch = platform.options.find(
      ({ architectureId }) => architectureId === device.architectureId,
    )

    if (architectureMatch) {
      return architectureMatch
    }
  }

  return platform.options[0]
}

export function verifyReleaseDownloadLogic(): void {
  const ipad = detectDevice({
    maxTouchPoints: 5,
    platform: 'MacIntel',
    userAgent: 'Mozilla/5.0 (Macintosh)',
  })
  const android = detectDevice({
    platform: 'Linux armv8l',
    userAgent: 'Mozilla/5.0 (Linux; Android 15)',
  })

  if (ipad.platformId !== 'ios' || android.platformId !== 'android') {
    throw new Error('Release download platform detection self-check failed.')
  }

  const macArm = classifyReleaseAsset('TauriTavern_2.1.1_aarch64.dmg')
  const debugBuild = classifyReleaseAsset('TauriTavern_2.1.1_aarch64-DEBUG.dmg')

  if (macArm?.variantId !== 'apple-silicon' || debugBuild !== null) {
    throw new Error('Release asset classification self-check failed.')
  }
}

async function fetchLatestReleaseSnapshot(): Promise<ReleaseDownloadsSnapshot> {
  const response = await fetch(releaseApiUrl)

  if (!response.ok) {
    throw new Error(
      `GitHub latest release request failed with ${response.status} ${response.statusText}`,
    )
  }

  const latestRelease =
    (await response.json()) as GitHubLatestReleaseResponse

  return normalizeLatestRelease(latestRelease)
}

export async function getLatestReleaseDownloads(): Promise<ReleaseDownloadsSnapshot> {
  if (!releaseDownloadsPromise) {
    releaseDownloadsPromise = fetchLatestReleaseSnapshot().catch((error) => {
      releaseDownloadsPromise = undefined
      throw error
    })
  }

  return await releaseDownloadsPromise
}
