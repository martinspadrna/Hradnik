import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

// Read-only preflight; does not connect to either Supabase project.
const APP_REF = 'abqiprdggptuxebhpfyi'
const OLD_REF = 'cgshssdjgzzuprlwnabl'
async function walk(dir, ext) {
  const output = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const filename = path.join(dir, entry.name)
    if (entry.isDirectory()) output.push(...await walk(filename, ext))
    else if (entry.isFile() && ext.test(filename)) output.push(filename)
  }
  return output
}

const browserFiles = await walk('src', /\.js$/)
const edgeFiles = await walk('supabase/functions', /\/index\.ts$/)
const staticFiles = ['index.html', 'vite.config.js', 'public/manifest.webmanifest', 'public/ios-install.html']
const sources = new Map()
for (const file of [...browserFiles, ...edgeFiles, ...staticFiles]) {
  const source = await readFile(file, 'utf8')
  sources.set(file, source)
  assert(!source.includes(OLD_REF), 'Old backend project reference in runtime source: ' + file)
}

const frontendClients = browserFiles.filter(file => /\bcreateClient\s*\(/.test(sources.get(file)))
assert.deepEqual(frontendClients, [path.join('src', 'supabase.js')], 'Frontend must create exactly one shared Supabase client in src/supabase.js')
const frontendClient = sources.get(path.join('src', 'supabase.js'))
assert(frontendClient.includes('https://' + APP_REF + '.supabase.co'), 'Central frontend fallback must use the independent Hradnik Supabase')
assert(frontendClient.includes('globalThis[CLIENT_SLOT]'), 'Frontend client singleton has been removed')
assert(frontendClient.includes('edgeFunctionUrl'), 'Edge function routing must be derived from the shared project URL')
assert(!/\bservice_role\b|SERVICE_ROLE_KEY|sb_secret_/i.test(frontendClient), 'Privileged key must never enter the browser bundle')

for (const file of ['src/main.legacy.js', 'src/enhancements.legacy.js', 'src/info-ui.js', 'src/account-ui.js', 'src/admin.legacy.js', 'src/quality-ui.legacy.js']) {
  assert(sources.get(file).includes('./supabase.js'), 'A browser data module no longer uses the shared Supabase client: ' + file)
}
for (const file of edgeFiles) {
  assert(sources.get(file).includes('SUPABASE_URL'), 'Edge function no longer obtains its project URL from Supabase environment: ' + file)
}

const account = sources.get('src/account-ui.js')
assert(account.includes('error?.status===401||error?.status===403'), 'Only explicit unauthorized status may revoke a session')
assert(account.includes("localStorage.removeItem('hradnik_session')"), 'Session rejection path missing')
assert(account.includes('relaci ponechávám'), 'Temporary session outage must preserve the token')

console.log('Hradnik runtime isolation preflight PASS (' + browserFiles.length + ' JS, ' + edgeFiles.length + ' Edge functions, ' + staticFiles.length + ' static files).')
