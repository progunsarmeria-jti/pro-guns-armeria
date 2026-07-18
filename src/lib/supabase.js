import { createClient } from '@supabase/supabase-js'

// Lê credenciais salvas pelo usuário em Configurações
const getUrl = () => localStorage.getItem('PROGUNS_SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL || ''
const getKey = () => localStorage.getItem('PROGUNS_SUPABASE_ANON_KEY') || import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = () => {
  const url = getUrl()
  const key = getKey()
  return Boolean(url && key && url.startsWith('http'))
}

export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) return null
  return createClient(getUrl(), getKey())
}

// Cliente singleton (reutilizado durante a sessão)
let _client = null
export const supabase = new Proxy({}, {
  get(_, prop) {
    if (!_client && isSupabaseConfigured()) {
      _client = createClient(getUrl(), getKey())
    }
    return _client ? _client[prop] : undefined
  }
})

export const saveSupabaseKeys = (url, key) => {
  localStorage.setItem('PROGUNS_SUPABASE_URL', url.trim())
  localStorage.setItem('PROGUNS_SUPABASE_ANON_KEY', key.trim())
  _client = null // reseta o cliente para reconectar com novas credenciais
  window.location.reload()
}

export const clearSupabaseKeys = () => {
  localStorage.removeItem('PROGUNS_SUPABASE_URL')
  localStorage.removeItem('PROGUNS_SUPABASE_ANON_KEY')
  _client = null
  window.location.reload()
}

// ─── Funções de CRUD genérico ───────────────────────────────────────────────

export async function dbLoad(tabela) {
  if (!isSupabaseConfigured()) return null
  const client = getSupabaseClient()
  const { data, error } = await client.from(tabela).select('*').order('created_at', { ascending: false })
  if (error) { console.error(`[Supabase] Erro ao carregar ${tabela}:`, error); return null }
  return data
}

export async function dbUpsert(tabela, registro) {
  if (!isSupabaseConfigured()) return false
  const client = getSupabaseClient()
  const { error } = await client.from(tabela).upsert(registro, { onConflict: 'id' })
  if (error) { console.error(`[Supabase] Erro ao salvar em ${tabela}:`, error); return false }
  return true
}

export async function dbDelete(tabela, id) {
  if (!isSupabaseConfigured()) return false
  const client = getSupabaseClient()
  const { error } = await client.from(tabela).delete().eq('id', id)
  if (error) { console.error(`[Supabase] Erro ao deletar de ${tabela}:`, error); return false }
  return true
}

export async function dbUpsertAll(tabela, registros) {
  if (!isSupabaseConfigured() || !registros?.length) return false
  const client = getSupabaseClient()
  const { error } = await client.from(tabela).upsert(registros, { onConflict: 'id' })
  if (error) { console.error(`[Supabase] Erro ao salvar lista em ${tabela}:`, error); return false }
  return true
}

// ─── Realtime: escuta mudanças de outras sessões ──────────────────────────────

export function subscribeToTable(tabela, onUpdate) {
  if (!isSupabaseConfigured()) return null
  const client = getSupabaseClient()
  const channel = client
    .channel(`realtime_${tabela}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: tabela }, () => {
      // Quando qualquer outro dispositivo fizer uma mudança, recarrega os dados
      onUpdate()
    })
    .subscribe()
  return channel
}
