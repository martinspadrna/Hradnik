import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const source = await readFile(path.resolve('public/hradnik-app-icon.svg'))
// An opaque iOS fallback: preserve the original gold shield and its interior,
// flatten only the *outside* against the existing dark application theme.
const vector = await sharp(source, { density: 288 }).resize(180, 180).png().toBuffer()
const png = await sharp({
  create: { width: 180, height: 180, channels: 3, background: '#080b0e' }
}).composite([{ input: vector, blend: 'over' }])
  .removeAlpha().png({ compressionLevel: 9 }).toBuffer()
const info = await sharp(png).metadata()
assert.equal(info.width, 180)
assert.equal(info.height, 180)
assert.equal(info.hasAlpha, false)
const iconName = 'apple-touch-icon-ios-v012.png'
await writeFile(path.resolve('public', iconName), png)
const dataUrl = 'data:image/png;base64,' + png.toString('base64')
const html = `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#080b0e">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Hradník">
<link rel="manifest" href="/manifest.webmanifest?v=0.1.2">
<link rel="apple-touch-icon" sizes="180x180" href="${dataUrl}">
<link rel="icon" type="image/png" sizes="180x180" href="/${iconName}">
<title>Hradník – instalace na iPhone</title>
<style>body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#080b0e;color:#f3f1eb;font-family:system-ui,-apple-system,Arial,sans-serif}main{max-width:390px;margin:24px;text-align:center}img{width:118px;height:118px;border-radius:24px}h1{font-size:1.5rem}p{line-height:1.55;color:#c4cdd0}a{color:#f0c44a}</style>
</head><body><main>
<img width="118" height="118" src="/${iconName}" alt="Logo Hradníku – zlatý hrad ve štítu">
<h1>Hradník – instalace na iPhone</h1>
<p>V Microsoft Edge otevři nabídku Sdílet a zvol Přidat na plochu. Ikona je vložená přímo do této instalační stránky.</p>
<p><a href="/">Otevřít Hradník</a></p>
</main>
<script>if(window.navigator.standalone||window.matchMedia('(display-mode: standalone)').matches)window.location.replace('/?source=pwa');</script>
</body></html>
`
assert(html.includes(dataUrl))
await writeFile(path.resolve('public/ios-install.html'), html, 'utf8')
console.log('iOS install source generated:', iconName, info.width + 'x' + info.height, 'opaque, HTML data URL embedded')
