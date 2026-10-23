import assert from 'node:assert/strict'

// Offline preflight only. Never connects to GitHub, Supabase or Vercel.
// Passing this check is NOT approval to create a project, import data or deploy.
const productionRef = 'abqiprdggptuxebhpfyi'
const oldRef = 'cgshssdjgzzuprlwnabl'
const target = String(process.env.HRADNIK_RESTORE_TARGET_URL || '').trim()
const preview = String(process.env.HRADNIK_PREVIEW_URL || '').trim()
const consent = String(process.env.HRADNIK_RESTORE_APPROVED || '').trim()

function requireRootHttpsUrl(value, label) {
  assert(value, label + ' must be supplied explicitly')
  const url = new URL(value)
  assert.equal(url.protocol, 'https:', label + ' must use HTTPS')
  assert.equal(url.username, '', label + ' must not include username')
  assert.equal(url.password, '', label + ' must not include password')
  assert.equal(url.port, '', label + ' must not specify a custom port')
  assert.equal(url.pathname, '/', label + ' must be a root URL')
  assert.equal(url.search, '', label + ' must not include query parameters')
  assert.equal(url.hash, '', label + ' must not include a fragment')
  return url
}

assert.equal(consent, 'yes', 'Explicit HRADNIK_RESTORE_APPROVED=yes required for planning a real restore')

const url = requireRootHttpsUrl(target, 'HRADNIK_RESTORE_TARGET_URL')
assert(/^[a-z0-9]{20}\.supabase\.co$/.test(url.hostname), 'Target must be an explicit Supabase project hostname')
const ref = url.hostname.split('.')[0]
assert(![productionRef, oldRef].includes(ref), 'Production or legacy Supabase MUST NEVER be a restore target')

const previewUrl = requireRootHttpsUrl(preview, 'HRADNIK_PREVIEW_URL')
assert(previewUrl.hostname !== 'hradnik.vercel.app', 'Never target production Vercel')
assert(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.vercel\.app$/.test(previewUrl.hostname), 'Use a distinct Vercel preview hostname')
console.log('PASS: offline P2-10 URL-format and known-environment isolation preflight. Independently verify preview deployment and secrets before any restore.')
