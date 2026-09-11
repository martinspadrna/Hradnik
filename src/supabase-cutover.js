const NEW_SUPABASE_URL = 'https://abqiprdggptuxebhpfyi.supabase.co'
const NEW_SUPABASE_HOST = 'abqiprdggptuxebhpfyi.supabase.co'
const NEW_SUPABASE_KEY = 'sb_publishable_ICNaKdexQDRj3ga7j8wQrQ_EQi349pw'

if (!globalThis.__HRADNIK_SUPABASE_CUTOVER__) {
  globalThis.__HRADNIK_SUPABASE_CUTOVER__ = true
  globalThis.__HRADNIK_SUPABASE = Object.freeze({ url: NEW_SUPABASE_URL, key: NEW_SUPABASE_KEY })

  const originalFetch = globalThis.fetch.bind(globalThis)
  globalThis.fetch = (input, init = {}) => {
    const originalUrl = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input?.url

    if (!originalUrl) return originalFetch(input, init)

    let parsed
    try { parsed = new URL(originalUrl, globalThis.location?.href) } catch { return originalFetch(input, init) }

    const isHradnikSupabaseRequest = parsed.hostname.endsWith('.supabase.co') && (
      parsed.pathname.startsWith('/rest/v1/hradnik_') ||
      parsed.pathname.startsWith('/functions/v1/hradnik-')
    )

    if (!isHradnikSupabaseRequest || parsed.hostname === NEW_SUPABASE_HOST) {
      return originalFetch(input, init)
    }

    parsed.protocol = 'https:'
    parsed.hostname = NEW_SUPABASE_HOST
    parsed.port = ''

    const baseHeaders = input instanceof Request ? input.headers : init.headers
    const headers = new Headers(baseHeaders || {})
    headers.set('apikey', NEW_SUPABASE_KEY)
    const auth = headers.get('authorization') || ''
    if (/^Bearer\s+sb_publishable_/i.test(auth)) headers.set('authorization', `Bearer ${NEW_SUPABASE_KEY}`)

    if (input instanceof Request) {
      const rewritten = new Request(parsed.toString(), input)
      const mergedHeaders = new Headers(rewritten.headers)
      for (const [name, value] of headers.entries()) mergedHeaders.set(name, value)
      return originalFetch(new Request(rewritten, { headers: mergedHeaders }), init)
    }

    return originalFetch(parsed.toString(), { ...init, headers })
  }
}
