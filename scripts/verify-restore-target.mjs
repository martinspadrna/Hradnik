import assert from 'node:assert/strict'

// Offline preflight only: does not connect to GitHub, Supabase or Vercel.
// No project creation or deployment happens here.
const productionRef = 'abqiprdggptuxebhpfyi'
const oldRef = 'cgshssdjgzzuprlwnabl'
const target = String(process.env.HRADNIK_RESTORE_TARGET_URL || '').trim()
const preview = String(process.env.HRADNIK_PREVIEW_URL || '').trim()
const consent = String(process.env.HRADNIK_RESTORE_APPROVED || '').trim()

assert.equal(consent, 'yes', 'Explicit HRADNIK_RESTORE_APPROVED=yes required for planning a real restore')
assert(target, 'HRADNIK_RESTORE_TARGET_URL must be supplied explicitly')
const url = new URL(target)
assert.equal(url.protocol, 'https:', 'Only HTTPS test Supabase is allowed')
assert(/^[a-z0-9]{20}\.supabase\.co$/.test(url.hostname), 'Target must be an explicit Supabase project hostname')
assert(url.username === '' && url.password === '' && url.pathname === '/' && !url.search && !url.hash, 'Target URL may contain only the root project URL')
const ref = url.hostname.split('.')[0]
assert(![productionRef, oldRef].includes(ref), 'Production or legacy Supabase MUST NEVER be a restore target')
assert(preview, 'Separate isolated preview URL must be supplied')
const previewUrl = new URL(preview)
assert.equal(previewUrl.protocol, 'https:')
assert(previewUrl.hostname !== 'hradnik.vercel.app', 'Never target production Vercel')
assert(previewUrl.hostname.endsWith('.vercel.app'), 'Use a distinct Vercel preview hostname')
console.log('PASS: offline P2-10 target isolation preflight for explicitly approved test-only environment.')
