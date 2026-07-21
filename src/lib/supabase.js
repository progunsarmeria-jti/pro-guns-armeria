import { createClient } from '@supabase/supabase-js'

// Credenciais padrão de fallback da Pró Guns Armeria (Supabase)
const DEFAULT_SUPABASE_URL = 'https://xknexpjapjanozsuowod.supabase.co'
const DEFAULT_SUPABASE_KEY = 'sb_publishable_HAFcm7qicaIH-FrexVz3lQ_mqRRhurR'

// Lê credenciais salvas pelo usuário em Configurações, ou .env, ou credenciais padrão
const getUrl = () => localStorage.getItem('PROGUNS_SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const getKey = () => localStorage.getItem('PROGUNS_SUPABASE_ANON_KEY') || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY

// Mapeamento de nomes de tabelas isoladas para o Pró Guns Armeria (evita colisão com outros projetos no mesmo Supabase)
const TABLE_MAP = {
  ordens: 'proguns_ordens',
  clientes: 'proguns_clientes',
  armas: 'proguns_armas',
  orcamentos: 'proguns_orcamentos',
  financeiro: 'proguns_financeiro',
  usuarios: 'proguns_usuarios',
  empresa_config: 'proguns_config',
  logs: 'proguns_logs',
  estoque: 'proguns_estoque',
  caixas: 'proguns_caixas',
  alertas: 'proguns_alertas'
}

export const getTableName = (tabela) => TABLE_MAP[tabela] || tabela

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
  _client = null
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
  const realTable = getTableName(tabela)
  try {
    const { data, error } = await client.from(realTable).select('*')
    if (error) {
      console.error(`[Supabase] Erro ao carregar ${realTable}:`, error)
      return null
    }
    return data
  } catch (err) {
    console.error(`[Supabase] Exceção ao carregar ${realTable}:`, err)
    return null
  }
}

export async function dbUpsert(tabela, registro) {
  if (!isSupabaseConfigured() || !registro) return false
  const client = getSupabaseClient()
  const realTable = getTableName(tabela)
  try {
    // Serializa campos complexos (arrays/objetos) para garantir compatibilidade com Supabase JSONB
    const registroSeguro = {}
    for (const [k, v] of Object.entries(registro)) {
      if (v !== null && v !== undefined && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
        // Objeto aninhado não-array: converte para JSON string se não for um objeto simples
        registroSeguro[k] = v
      } else if (Array.isArray(v)) {
        // Arrays: envia como array diretamente (Supabase JSONB aceita)
        registroSeguro[k] = v
      } else {
        registroSeguro[k] = v
      }
    }
    const { error } = await client.from(realTable).upsert(registroSeguro, { onConflict: 'id' })
    if (error) {
      console.error(`[Supabase] Erro ao salvar registro em ${realTable}:`, error.message, error.details, error.hint)
      // Fallback: tenta upsert apenas com campos primitivos (sem arrays/objetos aninhados)
      const registroSimples = {}
      for (const [k, v] of Object.entries(registro)) {
        if (typeof v !== 'object' || v === null || v instanceof Date) {
          registroSimples[k] = v
        }
      }
      if (Object.keys(registroSimples).length > 1) {
        const { error: err2 } = await client.from(realTable).upsert(registroSimples, { onConflict: 'id' })
        if (err2) {
          console.error(`[Supabase] Fallback simples também falhou em ${realTable}:`, err2.message)
          return false
        }
        console.warn(`[Supabase] Salvo com campos primitivos apenas em ${realTable} (campos complexos ignorados)`)
        return true
      }
      return false
    }
    return true
  } catch (err) {
    console.error(`[Supabase] Exceção ao salvar em ${realTable}:`, err)
    return false
  }
}

// Atualiza campos específicos de um registro via UPDATE direto (mais seguro que upsert para atualizações parciais)
export async function dbUpdate(tabela, id, campos) {
  if (!isSupabaseConfigured() || !id || !campos) return false
  const client = getSupabaseClient()
  const realTable = getTableName(tabela)
  try {
    const { error } = await client.from(realTable).update(campos).eq('id', id)
    if (error) {
      console.error(`[Supabase] Erro ao atualizar ${realTable} id=${id}:`, error.message, error.details)
      return false
    }
    return true
  } catch (err) {
    console.error(`[Supabase] Exceção ao atualizar ${realTable}:`, err)
    return false
  }
}


export async function dbDelete(tabela, id) {
  if (!id) return false

  // Registra ID deletado no localStorage para que mesclarDados nunca ressuscite o item
  try {
    const key = `PROGUNS_DELETED_${tabela.toUpperCase()}`
    const deleted = JSON.parse(localStorage.getItem(key) || '[]')
    if (!deleted.includes(String(id))) {
      deleted.push(String(id))
      localStorage.setItem(key, JSON.stringify(deleted))
    }
  } catch (e) {}

  if (!isSupabaseConfigured()) return true
  const client = getSupabaseClient()
  const realTable = getTableName(tabela)
  try {
    const { error } = await client.from(realTable).delete().eq('id', id)
    if (error) {
      console.error(`[Supabase] Erro ao deletar de ${realTable}:`, error)
      return false
    }
    return true
  } catch (err) {
    console.error(`[Supabase] Exceção ao deletar de ${realTable}:`, err)
    return false
  }
}

export async function dbUpsertAll(tabela, registros) {
  if (!isSupabaseConfigured() || !registros?.length) return false
  const client = getSupabaseClient()
  const realTable = getTableName(tabela)
  try {
    const validos = registros.filter(r => r && r.id)
    if (validos.length === 0) return false

    const { error } = await client.from(realTable).upsert(validos, { onConflict: 'id' })
    if (error) {
      console.error(`[Supabase] Erro ao salvar lista em ${realTable}:`, error)
      return false
    }
    return true
  } catch (err) {
    console.error(`[Supabase] Exceção ao salvar lista em ${realTable}:`, err)
    return false
  }
}

// ─── Realtime: escuta mudanças de outras sessões em tempo real ───────────────

export function subscribeToTable(tabela, onUpdate) {
  if (!isSupabaseConfigured()) return null
  const client = getSupabaseClient()
  const realTable = getTableName(tabela)
  try {
    const channel = client
      .channel(`realtime_${realTable}_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: realTable }, () => {
        if (typeof onUpdate === 'function') onUpdate()
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          if (typeof onUpdate === 'function') onUpdate()
        }
      })
    return channel
  } catch (err) {
    console.error(`[Supabase Realtime] Erro ao inscrever no canal ${realTable}:`, err)
    return null
  }
}
