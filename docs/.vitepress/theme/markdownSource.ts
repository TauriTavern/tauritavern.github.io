const markdownSourceLoaders = import.meta.glob('../../**/*.md', {
  import: 'default',
  query: '?raw',
})

const sourcePathPrefix = '../../'

export async function loadPageMarkdownSource(relativePath: string): Promise<string> {
  const loader = markdownSourceLoaders[`${sourcePathPrefix}${relativePath}`]

  if (!loader) {
    throw new Error(`Markdown source loader not found for "${relativePath}".`)
  }

  return (await loader()) as string
}

export function getPageMarkdownDownloadName(relativePath: string): string {
  return relativePath.replaceAll('/', '--')
}
