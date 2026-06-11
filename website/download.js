async function loadManifest() {
  const versionEl = document.getElementById('release-version')
  const macLink = document.getElementById('mac-download')
  const winLink = document.getElementById('win-download')
  const macMeta = document.getElementById('mac-meta')
  const winMeta = document.getElementById('win-meta')

  try {
    const response = await fetch('releases/latest.json', { cache: 'no-store' })
    const data = await response.json()

    versionEl.textContent = data.version
    macLink.href = data.mac.url
    macLink.textContent = `下载 ${data.mac.fileName}`
    macMeta.textContent = data.mac.sizeLabel || ''

    winLink.href = data.win.url
    winLink.textContent = `下载 ${data.win.fileName}`
    winMeta.textContent = data.win.sizeLabel || ''
  } catch {
    versionEl.textContent = '1.0.0'
    macMeta.textContent = '暂时无法获取下载链接，请稍后再试'
    winMeta.textContent = '暂时无法获取下载链接，请稍后再试'
    macLink.href = '#'
    winLink.href = '#'
  }
}

void loadManifest()
