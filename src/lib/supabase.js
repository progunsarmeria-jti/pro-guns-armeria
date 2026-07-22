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
    const registroSeguro = {}
    for (const [k, v] of Object.entries(registro)) {
      if (v !== null && v !== undefined) {
        registroSeguro[k] = v
      }
    }
    const { error } = await client.from(realTable).upsert(registroSeguro, { onConflict: 'id' })
    if (error) {
      console.error(`[Supabase] Erro ao salvar registro em ${realTable}:`, error.message, error.details, error.hint)
      // Fallback 1: tenta upsert sem 'onConflict'
      const { error: err1 } = await client.from(realTable).upsert(registroSeguro)
      if (!err1) return true

      // Fallback 2: tenta upsert apenas com campos primitivos (sem objetos/arrays aninhados)
      const registroSimples = {}
      for (const [k, v] of Object.entries(registro)) {
        if (typeof v !== 'object' || v === null || v instanceof Date) {
          registroSimples[k] = v
        }
      }
      if (Object.keys(registroSimples).length > 1) {
        const { error: err2 } = await client.from(realTable).upsert(registroSimples)
        if (!err2) {
          console.warn(`[Supabase] Salvo com campos primitivos apenas em ${realTable}`)
          return true
        }
      }
      return false
    }
    return true
  } catch (err) {
    console.error(`[Supabase] Exceção ao salvar em ${realTable}:`, err)
    return false
  }
}

// Atualiza campos específicos de um registro via UPDATE direto (com verificação de .select() e fallback por numero_os/UPSERT)
export async function dbUpdate(tabela, id, campos, registroCompleto = null) {
  if (!isSupabaseConfigured() || !campos) return false
  const client = getSupabaseClient()
  const realTable = getTableName(tabela)
  const numeroOS = campos.numero_os || registroCompleto?.numero_os

  try {
    // 1. Tenta UPDATE por ID com .select() para confirmar se alterou alguma linha
    if (id) {
      const { data, error } = await client
        .from(realTable)
        .update(campos)
        .eq('id', id)
        .select('id, status')

      if (!error && data && data.length > 0) {
        console.log(`[Supabase] UPDATE ok por ID (${id}) em ${realTable}:`, data)
        return true
      }
      if (error) {
        console.warn(`[Supabase] Erro no UPDATE por ID (${id}) em ${realTable}:`, error.message)
      }
    }

    // 2. Tenta UPDATE por numero_os (se for a tabela de ordens ou tiver numero_os)
    if (numeroOS) {
      const { data, error } = await client
        .from(realTable)
        .update(campos)
        .eq('numero_os', Number(numeroOS))
        .select('id, status')

      if (!error && data && data.length > 0) {
        console.log(`[Supabase] UPDATE ok por numero_os (${numeroOS}) em ${realTable}:`, data)
        return true
      }
    }

    // 3. Se nenhuma linha foi alterada no Supabase (ex: registro ainda não existia no banco), faz UPSERT completo
    if (registroCompleto) {
      console.log(`[Supabase] Linha não encontrada via UPDATE. Fazendo UPSERT completo em ${realTable}...`)
      return await dbUpsert(tabela, registroCompleto)
    }

    return false
  } catch (err) {
    console.error(`[Supabase] Exceção ao atualizar ${realTable}:`, err)
    if (registroCompleto) {
      return await dbUpsert(tabela, registroCompleto)
    }
    return false
  }
}

// FUNÇÃO CRÍTICA: Atualiza APENAS o status — funciona por ID ou por numero_os com retries
export async function dbUpdateStatus(tabela, id, novoStatus, numeroOS = null) {
  if (!isSupabaseConfigured() || (!id && !numeroOS) || !novoStatus) return false
  const client = getSupabaseClient()
  const realTable = getTableName(tabela)

  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      if (id) {
        const { data, error } = await client
          .from(realTable)
          .update({ status: novoStatus, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('id, status')

        if (!error && data && data.length > 0) {
          console.log(`[Supabase] Status atualizado via ID em ${realTable} (${id}) → ${novoStatus}`)
          return true
        }
      }

      if (numeroOS) {
        const { data, error } = await client
          .from(realTable)
          .update({ status: novoStatus, updated_at: new Date().toISOString() })
          .eq('numero_os', Number(numeroOS))
          .select('id, status')

        if (!error && data && data.length > 0) {
          console.log(`[Supabase] Status atualizado via numero_os em ${realTable} (${numeroOS}) → ${novoStatus}`)
          return true
        }
      }

      if (tentativa < 3) await new Promise(r => setTimeout(r, tentativa * 500))
    } catch (err) {
      console.error(`[Supabase] Exceção na tentativa ${tentativa} de atualizar status:`, err)
      if (tentativa < 3) await new Promise(r => setTimeout(r, tentativa * 500))
    }
  }
  return false
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

export async function uploadGTFile(file, fileName) {
  if (!isSupabaseConfigured() || !file) return null
  const client = getSupabaseClient()
  try {
    const bucketName = 'guias_trafego'
    const { data, error } = await client.storage
      .from(bucketName)
      .upload(fileName, file, { cacheControl: '3600', upsert: true })
    if (error) {
      console.error('[Supabase Storage] Erro ao subir arquivo:', error)
      return null
    }
    const { data: urlData } = client.storage.from(bucketName).getPublicUrl(fileName)
    return urlData?.publicUrl || null
  } catch (err) {
    console.error('[Supabase Storage] Exceção ao subir arquivo:', err)
    return null
  }
}

export async function getGTFileUrl(fileNameOrUrl, expiresIn = 600) {
  if (!isSupabaseConfigured() || !fileNameOrUrl) return null
  const client = getSupabaseClient()
  try {
    const bucketName = 'guias_trafego'
    let fileName = fileNameOrUrl
    if (fileNameOrUrl.includes('/')) {
      fileName = fileNameOrUrl.split('/').pop()
    }
    if (fileName.includes('?')) {
      fileName = fileName.split('?')[0]
    }
    const { data, error } = await client.storage
      .from(bucketName)
      .createSignedUrl(fileName, expiresIn)
    if (error) {
      console.error('[Supabase Storage] Erro ao criar URL assinada:', error)
      return null
    }
    return data?.signedUrl || null
  } catch (err) {
    console.error('[Supabase Storage] Exceção ao criar URL assinada:', err)
    return null
  }
}
