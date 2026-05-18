import { readdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, relative } from 'node:path'

const root = process.cwd()
const distDir = join(root, 'dist')
const postsDir = join(root, 'pages/posts')
const sitemapPath = join(distDir, 'sitemap.xml')
const siteUrl = 'https://cachetide.top/'
const staticExcludedRoutes = new Set(['/404'])

await normalizeEncodedHtmlFiles(join(distDir, 'posts'))
await rewriteSitemap()

async function normalizeEncodedHtmlFiles(dir) {
  for (const filePath of await listFiles(dir)) {
    if (extname(filePath) !== '.html')
      continue

    const name = basename(filePath, '.html')
    const normalizedName = decodeRepeatedly(name)
    if (normalizedName === name)
      continue

    await rename(filePath, join(dirname(filePath), `${normalizedName}.html`))
  }
}

async function rewriteSitemap() {
  const noindexRoutes = await getNoindexRoutes()
  const sitemap = await readFile(sitemapPath, 'utf8')
  const seen = new Set()
  const rewrittenUrls = []

  for (const match of sitemap.matchAll(/<url>[\s\S]*?<\/url>/g)) {
    const block = match[0]
    const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1]
    if (!loc)
      continue

    const canonicalLoc = canonicalizeLoc(loc)
    const decodedPath = decodeRepeatedly(new URL(canonicalLoc).pathname)
    if (staticExcludedRoutes.has(decodedPath) || noindexRoutes.has(decodedPath) || seen.has(canonicalLoc))
      continue

    seen.add(canonicalLoc)
    rewrittenUrls.push(block.replace(/<loc>.*?<\/loc>/, `<loc>${canonicalLoc}</loc>`))
  }

  await writeFile(
    sitemapPath,
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${rewrittenUrls.join('')}</urlset>`,
  )
}

async function getNoindexRoutes() {
  const routes = new Set()

  for (const filePath of await listFiles(postsDir)) {
    if (extname(filePath) !== '.md')
      continue

    const content = await readFile(filePath, 'utf8')
    if (!hasNoindexFrontmatter(content))
      continue

    const slug = basename(filePath, '.md')
    routes.add(`/posts/${decodeRepeatedly(slug)}`)
  }

  return routes
}

function hasNoindexFrontmatter(content) {
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  return Boolean(frontmatter?.[1].match(/^noindex:\s*true\s*$/m))
}

function canonicalizeLoc(loc) {
  const url = new URL(loc)
  const decodedPath = decodeRepeatedly(url.pathname)
  return new URL(decodedPath, siteUrl).href
}

function decodeRepeatedly(value) {
  let current = value

  for (let i = 0; i < 5; i++) {
    try {
      const decoded = decodeURIComponent(current)
      if (decoded === current)
        return current
      current = decoded
    }
    catch {
      return current
    }
  }

  return current
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const filePath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await listFiles(filePath))
      continue
    }

    if (entry.isFile() || (entry.isSymbolicLink() && (await stat(filePath)).isFile()))
      files.push(filePath)
  }

  return files.sort((a, b) => relative(root, a).localeCompare(relative(root, b)))
}
