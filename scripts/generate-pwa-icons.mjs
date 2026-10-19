import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'

const publicDir = resolve('public')
const source = await readFile(resolve(publicDir, 'hradnik-app-icon.svg'))
const sourceText = source.toString('utf8')
if (/<rect\b[^>]*\bwidth="512"[^>]*\bheight="512"/i.test(sourceText)) {
  throw new Error('The logo contains an opaque outer square')
}

// One exact logo source. Render at 4x and downsample with Lanczos for sharp,
// antialiased RGBA icons without inventing a background behind the shield.
const master = await sharp(source, { density: 288 }).ensureAlpha().png().toBuffer()
const targets = new Map([
  [16, ['favicon-16.png']],
  [32, ['favicon-32.png']],
  [48, ['favicon-48.png']],
  [64, ['favicon-64.png']],
  [128, ['icon-128.png']],
  [152, ['apple-touch-icon-152.png']],
  [180, ['apple-touch-icon.png', 'apple-touch-icon-v011.png']],
  [192, ['icon-192.png', 'icon-192-v011.png']],
  [256, ['icon-256.png']],
  [384, ['icon-384.png']],
  [512, ['icon-512.png', 'icon-512-v011.png']],
  [1024, ['icon-1024.png']]
])
const pngs = new Map()
for (const [size, names] of targets) {
  const png = await sharp(master).resize(size, size, { kernel: 'lanczos3' })
    .ensureAlpha().png({ compressionLevel: 9 }).toBuffer()
  pngs.set(size, png)
  for (const name of names) await writeFile(resolve(publicDir, name), png)
}

// ICO with 16/32/48 px PNG frames for Windows and classic favicon consumers.
const sizes = [16, 32, 48]
const header = Buffer.alloc(6 + sizes.length * 16)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(sizes.length, 4)
let offset = header.length
const images = sizes.map((size, i) => {
  const image = pngs.get(size)
  const entry = 6 + i * 16
  header[entry] = size
  header[entry + 1] = size
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(image.length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += image.length
  return image
})
await writeFile(resolve(publicDir, 'favicon.ico'), Buffer.concat([header, ...images]))
console.log('Hradník: all transparent PNG/ICO application icons generated')
