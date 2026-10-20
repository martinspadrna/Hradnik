import assert from 'node:assert/strict'

const url = 'https://abqiprdggptuxebhpfyi.supabase.co/functions/v1/'
const actions = [
  ['hradnik-admin', 'list'],
  ['hradnik-quality', 'list'],
  ['hradnik-auth', 'session']
]

for (const [service, action] of actions) {
  const response = await fetch(url + service, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
    signal: AbortSignal.timeout(20000)
  })
  const body = await response.text()
  assert([401, 403].includes(response.status), service + ': anonymous request unexpectedly allowed (HTTP ' + response.status + ')')
  assert(!/"(?:places|users|state|token|password|session)"\s*:/i.test(body), service + ': anonymous response appears to contain protected data')
  console.log('Anonymous ' + service + ' / ' + action + ': HTTP ' + response.status + ' (correctly denied)')
}

const migration = await fetch(url + 'hradnik-migrate-temporary', { signal: AbortSignal.timeout(20000) })
assert.equal(migration.status, 410, 'Old migration helper must remain deliberately disabled')
console.log('Temporary migration helper: HTTP 410 (disabled)')
console.log('Hradnik live backend unauthenticated access smoke test PASS; no credentials, reads or writes used.')
