import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://abqiprdggptuxebhpfyi.supabase.co'
const DEFAULT_SUPABASE_KEY = 'sb_publishable_ICNaKdexQDRj3ga7j8wQrQ_EQi349pw'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_KEY

const CLIENT_SLOT = '__HRADNIK_SUPABASE_CLIENT__'
if (!globalThis[CLIENT_SLOT]) {
  globalThis[CLIENT_SLOT] = createClient(SUPABASE_URL, SUPABASE_KEY)
}

export const supabase = globalThis[CLIENT_SLOT]
export const edgeFunctionUrl = (name) => `${SUPABASE_URL}/functions/v1/${name}`
