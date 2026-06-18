#!/usr/bin/env node
/**
 * Download Petory .dmg/.exe installers from a GitHub Release.
 *
 * Usage:
 *   node scripts/download-release-installers.mjs v2.4.25 release
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const [tagArg, outDirArg] = process.argv.slice(2)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'))
const tag = tagArg || `v${pkg.version}`
const outDir = path.resolve(outDirArg || path.join(root, 'release'))
const repo = process.env.PETORY_GITHUB_REPO ?? process.env.GITHUB_REPOSITORY ?? 'geyaovip/petory'
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || ''

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${await res.text()}`)
  }
  return res.json()
}

async function download(url, dest) {
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  })
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`)
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
}

const release = await fetchJson(`https://api.github.com/repos/${repo}/releases/tags/${encodeURIComponent(tag)}`)
const assets = (release.assets || []).filter((asset) => /\.(dmg|exe)$/.test(asset.name))

if (assets.length === 0) {
  throw new Error(`No .dmg/.exe assets found on ${repo}@${tag}`)
}

fs.mkdirSync(outDir, { recursive: true })

for (const asset of assets) {
  const dest = path.join(outDir, asset.name)
  console.log(`→ ${asset.name}`)
  await download(asset.browser_download_url, dest)
}

console.log(`Downloaded ${assets.length} installer(s) from ${repo}@${tag}`)
