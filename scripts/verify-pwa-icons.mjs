import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'

const icons = new Map([
  ['favicon-16.png',16], ['favicon-32.png',32], ['favicon-48.png',48],
  ['apple-touch-icon.png',180], ['apple-touch-icon-v011.png',180],
  ['apple-touch-icon-152.png',152], ['icon-128.png',128],
  ['icon-192-v011.png',192], ['icon-512-v011.png',512],
  ['icon-192.png',192], ['icon-256.png',256], ['icon-384.png',384],
  ['icon-512.png',512], ['icon-1024.png',1024]
])
for (const [name, expectedSize] of icons) {
  const path = resolve('public', name)
  const meta = await sharp(path).metadata()
  assert.equal(meta.width, expectedSize, name)
  assert.equal(meta.height, expectedSize, name)
  assert.equal(meta.format, 'png', name)
  assert.equal(meta.hasAlpha, true, name + ' must have an alpha channel')
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject:true })
  assert.equal(info.channels, 4, name + ' must decode to RGBA')
  assert.equal(data[3], 0, name + ' upper-left background must be transparent')
  assert.equal(data[(expectedSize * expectedSize - 1) * 4 + 3], 0, name + ' lower-right background must be transparent')
  assert(data.some((byte, i) => i % 4 === 3 && byte >= 200), name + ' must still contain visible logo')
}
const ico = await readFile(resolve('public/favicon.ico'))
assert.equal(ico.readUInt16LE(2), 1)
assert.equal(ico.readUInt16LE(4), 3)
for (const name of ['hradnik-app-icon.svg','hradnik-icon.svg','pwa-192.svg','pwa-512.svg','favicon.svg']) {
  const source = await readFile(resolve('public',name),'utf8')
  assert(!/<rect\b[^>]*\bwidth="512"[^>]*\bheight="512"/i.test(source),name + ' still contains the old square')
}
const iconPaths = ['/icon-192-v011.png', '/icon-512-v011.png', '/apple-touch-icon-ios-v012.png']
for (const path of ['public/manifest.webmanifest', 'dist/manifest.webmanifest']) {
  const manifest = JSON.parse(await readFile(resolve(path),'utf8'))
  assert.equal(manifest.id, '/', path)
  assert.equal(manifest.display, 'standalone', path)
  assert.deepEqual(manifest.icons.map(icon=>icon.src), iconPaths, path)
  assert(manifest.icons.every(icon => icon.type === 'image/png' && icon.purpose === 'any'), path)
}
const index = await readFile(resolve('dist/index.html'),'utf8')
assert(index.includes('favicon.ico') && index.includes('apple-touch-icon-ios-v012.png'))
const sw = await readFile(resolve('dist/sw.js'),'utf8')
for (const name of ['icon-192-v011.png','icon-512-v011.png','apple-touch-icon-ios-v012.png','ios-install.html']) {
  assert(sw.includes(name), 'Service worker precache must include ' + name)
}
const iosIcon = await readFile(resolve('public/apple-touch-icon-ios-v012.png'))
const opaque = await sharp(iosIcon).metadata()
assert.equal(opaque.width, 180)
assert.equal(opaque.height, 180)
assert.equal(opaque.hasAlpha, false, 'iOS Edge icon must be opaque')
const installer = await readFile(resolve('public/ios-install.html'), 'utf8')
const embedded = installer.match(/rel="apple-touch-icon" sizes="180x180" href="data:image\/png;base64,([A-Za-z0-9+/=]+)"/)
assert(embedded, 'iOS installer must contain directly embedded PNG, not an external link')
assert.deepEqual(Buffer.from(embedded[1], 'base64'), iosIcon, 'Embedded image must be the exact committed PNG')
const deployedInstaller = await readFile(resolve('dist/ios-install.html'), 'utf8')
assert(deployedInstaller.includes(embedded[1]), 'The actual installation HTML must be copied to production build output')
assert(installer.includes("window.location.replace('/?source=pwa')"), 'Installed shortcut must launch the application')
console.log('Hradník: PNG transparency, ICO, manifest, SW precache, opaque iOS PNG and static installer verified')
