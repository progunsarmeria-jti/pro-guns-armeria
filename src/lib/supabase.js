import { createClient } from '@supabase/supabase-js'

// Ler do LocalStorage ou Variáveis de Ambiente
const SUPABASE_URL = localStorage.getItem('PROGUNS_SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = localStorage.getItem('PROGUNS_SUPABASE_ANON_KEY') || import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

export const saveSupabaseKeys = (url, key) => {
  localStorage.setItem('PROGUNS_SUPABASE_URL', url.trim())
  localStorage.setItem('PROGUNS_SUPABASE_ANON_KEY', key.trim())
  window.location.reload()
}

export const clearSupabaseKeys = () => {
  localStorage.removeItem('PROGUNS_SUPABASE_URL')
  localStorage.removeItem('PROGUNS_SUPABASE_ANON_KEY')
  window.location.reload()
}
