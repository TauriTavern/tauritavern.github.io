import { copyFile, mkdir, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

import type { Plugin } from 'vite'

const excludedDirectories = new Set(['.vitepress', 'node_modules', 'public'])

export async function copyMarkdownSources(
  srcDir: string,
  outDir: string,
): Promise<void> {
  for (const entry of await readdir(srcDir, { withFileTypes: true })) {
    if (excludedDirectories.has(entry.name)) {
      continue
    }

    const sourcePath = path.join(srcDir, entry.name)

    if (entry.isDirectory()) {
      await copyMarkdownSources(sourcePath, path.join(outDir, entry.name))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      await mkdir(outDir, { recursive: true })
      await copyFile(sourcePath, path.join(outDir, entry.name))
    }
  }
}

export function serveMarkdownSourcesPlugin(srcDir: string): Plugin {
  const rootDir = path.resolve(srcDir)

  return {
    name: 'tt-serve-markdown-sources',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestUrl = req.url ?? ''

        if (requestUrl.includes('?')) {
          next()
          return
        }

        const pathname = decodeURIComponent(requestUrl)

        if (!pathname.endsWith('.md')) {
          next()
          return
        }

        const filePath = path.join(rootDir, pathname)

        if (!filePath.startsWith(rootDir + path.sep)) {
          next()
          return
        }

        readFile(filePath)
          .then((content) => {
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
            res.end(content)
          })
          .catch(() => next())
      })
    },
  }
}
