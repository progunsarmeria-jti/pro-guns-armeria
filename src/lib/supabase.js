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
  try {
    const { data, error } = await client.from(tabela).select('*')
    if (error) {
      console.error(`[Supabase] Erro ao carregar ${tabela}:`, error)
      return null
    }
    return data
  } catch (err) {
    console.error(`[Supabase] Exceção ao carregar ${tabela}:`, err)
    return null
  }
}

export async function dbUpsert(tabela, registro) {
  if (!isSupabaseConfigured() || !registro) return false
  const client = getSupabaseClient()
  try {
    const { error } = await client.from(tabela).upsert(registro, { onConflict: 'id' })
    if (error) {
      console.error(`[Supabase] Erro ao salvar registro em ${tabela}:`, error)
      return false
    }
    return true
  } catch (err) {
    console.error(`[Supabase] Exceção ao salvar em ${tabela}:`, err)
    return false
  }
}

export async function dbDelete(tabela, id) {
  if (!isSupabaseConfigured() || !id) return false
  const client = getSupabaseClient()
  try {
    const { error } = await client.from(tabela).delete().eq('id', id)
    if (error) {
      console.error(`[Supabase] Erro ao deletar de ${tabela}:`, error)
      return false
    }
    return true
  } catch (err) {
    console.error(`[Supabase] Exceção ao deletar de ${tabela}:`, err)
    return false
  }
}

export async function dbUpsertAll(tabela, registros) {
  if (!isSupabaseConfigured() || !registros?.length) return false
  const client = getSupabaseClient()
  try {
    // Garante que todos os objetos possuem ID válido
    const validos = registros.filter(r => r && r.id)
    if (validos.length === 0) return false

    const { error } = await client.from(tabela).upsert(validos, { onConflict: 'id' })
    if (error) {
      console.error(`[Supabase] Erro ao salvar lista em ${tabela}:`, error)
      return false
    }
    return true
  } catch (err) {
    console.error(`[Supabase] Exceção ao salvar lista em ${tabela}:`, err)
    return false
  }
}

// ─── Realtime: escuta mudanças de outras sessões em tempo real ───────────────

export function subscribeToTable(tabela, onUpdate) {
  if (!isSupabaseConfigured()) return null
  const client = getSupabaseClient()
  try {
    const channel = client
      .channel(`realtime_${tabela}_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tabela }, () => {
        // Dispara atualização instantânea quando qualquer dispositivo alterar dados
        if (typeof onUpdate === 'function') onUpdate()
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // console.log(`[Supabase Realtime] Conectado à tabela: ${tabela}`)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          // Se perder a conexão em segundo plano (ex: tablet apaga a tela), recarrega ao reconectar
          if (typeof onUpdate === 'function') onUpdate()
        }
      })
    return channel
  } catch (err) {
    console.error(`[Supabase Realtime] Erro ao inscrever no canal ${tabela}:`, err)
    return null
  }
}
