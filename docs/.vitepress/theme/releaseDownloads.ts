const releaseApiUrl =
  'https://api.github.com/repos/Darkatse/TauriTavern/releases/latest'

type PlatformId = 'windows' | 'macos' | 'linux' | 'android' | 'ios'

type VariantId =
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
}

type GitHubLatestReleaseResponse = {
  tag_name: string
  html_url: string
  published_at: string
  assets: GitHubReleaseAsset[]
}

type ClassifiedAsset = {
  platformId: PlatformId
  variantId: VariantId
}

export type ReleaseDownloadOption = {
  assetName: string
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

let releaseDownloadsPromise: Promise<ReleaseDownloadsSnapshot> | undefined

function classifyReleaseAsset(assetName: string): ClassifiedAsset | null {
  if (/debug/i.test(assetName)) {
    return null
  }

  if (/-setup\.exe$/i.test(assetName)) {
    return { platformId: 'windows', variantId: 'installer' }
  }

  if (/portable\.exe$/i.test(assetName)) {
    return { platformId: 'windows', variantId: 'portable' }
  }

  if (/\.msi$/i.test(assetName)) {
    return { platformId: 'windows', variantId: 'msi' }
  }

  if (/\.dmg$/i.test(assetName)) {
    if (/(aarch64|arm64)/i.test(assetName)) {
      return { platformId: 'macos', variantId: 'apple-silicon' }
    }

    if (/(x64|amd64)/i.test(assetName)) {
      return { platformId: 'macos', variantId: 'intel' }
    }

    return { platformId: 'macos', variantId: 'dmg' }
  }

  if (/\.AppImage$/i.test(assetName)) {
    return { platformId: 'linux', variantId: 'appimage' }
  }

  if (/\.deb$/i.test(assetName)) {
    return { platformId: 'linux', variantId: 'deb' }
  }

  if (/\.rpm$/i.test(assetName)) {
    return { platformId: 'linux', variantId: 'rpm' }
  }

  if (/linux-.*portable$/i.test(assetName)) {
    return { platformId: 'linux', variantId: 'portable' }
  }

  if (/\.apk$/i.test(assetName)) {
    if (/arm64/i.test(assetName)) {
      return { platformId: 'android', variantId: 'arm64' }
    }

    if (/armeabi-v7a/i.test(assetName)) {
      return { platformId: 'android', variantId: 'armv7' }
    }

    if (/x86_64/i.test(assetName)) {
      return { platformId: 'android', variantId: 'x64' }
    }

    if (/x86/i.test(assetName)) {
      return { platformId: 'android', variantId: 'x86' }
    }
  }

  if (/\.ipa$/i.test(assetName)) {
    return { platformId: 'ios', variantId: 'ipa' }
  }

  return null
}

function normalizeLatestRelease(
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
      assetName: asset.name,
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
          options: [...options].sort(
            (left, right) =>
              variantOrder.indexOf(left.variantId) -
              variantOrder.indexOf(right.variantId),
          ),
        }
      })
      .filter((platform): platform is ReleaseDownloadPlatform => platform !== null),
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
