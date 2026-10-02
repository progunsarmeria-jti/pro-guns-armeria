import { createClient } from '@supabase/supabase-js'

// Credenciais padrão de fallback da Pró Guns Armeria (Supabase)
const DEFAULT_SUPABASE_URL = 'https://moddyvtltodywvtzzwft.supabase.co'
const DEFAULT_SUPABASE_KEY = 'sb_publishable_8saf-ghPOB_703jfDbdT3A_DVvRjYLr'

// Lê credenciais salvas pelo usuário em Configurações, ou na URL (para sincronia mobile), ou .env, ou credenciais padrão
export const getUrl = () => {
  const urlParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('sb_url') : null
  if (urlParam) return decodeURIComponent(urlParam)
  const lsVal = typeof localStorage !== 'undefined' ? localStorage.getItem('PROGUNS_SUPABASE_URL') : null
  return lsVal || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || DEFAULT_SUPABASE_URL
}

export const getKey = () => {
  const keyParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('sb_key') : null
  if (keyParam) return decodeURIComponent(keyParam)
  const lsVal = typeof localStorage !== 'undefined' ? localStorage.getItem('PROGUNS_SUPABASE_ANON_KEY') : null
  return lsVal || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_KEY
}

// Mapeamento de nomes de tabelas isoladas para o Pró Guns Armeria (evita colisão com outros projetos no mesmo Supabase)
const TABLE_MAP = {
  ordens: 'proguns_ordens',
  clientes: 'proguns_clientes',
  armas: 'proguns_armas',
  orcamentos: 'proguns_orcamentos',
  financeiro: 'proguns_financeiro',
  usuarios: 'proguns_usuarios',
  empresa_config: 'proguns_config',
  config: 'proguns_config',
  logs: 'proguns_logs',
  estoque: 'proguns_estoque',
  caixas: 'proguns_caixas',
  alertas: 'proguns_alertas',
  vendas: 'proguns_vendas',
  notas_fiscais: 'proguns_notas_fiscais'
}

export const getTableName = (tabela) => TABLE_MAP[tabela] || tabela

export const isSupabaseConfigured = () => {
  const url = getUrl()
  const key = getKey()
  return Boolean(url && key && url.startsWith('http'))
}

// Cliente singleton (reutilizado durante toda a sessão para manter conexões e Realtime estáveis)
let _client = null
export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) return null
  if (!_client) {
    _client = createClient(getUrl(), getKey())
  }
  return _client
}

export const supabase = new Proxy({}, {
  get(_, prop) {
    const c = getSupabaseClient()
    return c ? c[prop] : undefined
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

export let _useLocalServer = false
export let _localServerUrl = 'http://localhost:3001'

export const checkLocalServer = async () => {
  // Quando o Supabase em nuvem está configurado com credenciais válidas,
  // SEMPRE prioriza o Supabase Cloud diretamente para sincronização multiusuário em tempo real entre PCs e Tablets!
  if (isSupabaseConfigured()) {
    _useLocalServer = false
    return false
  }

  try {
    const host = window.location.hostname || 'localhost'
    const port = '3001'
    const testUrl = `http://${host}:${port}`
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 1200)
    const res = await fetch(`${testUrl}/api/ping`, { signal: controller.signal })
    clearTimeout(id)
    if (res.ok) {
      _useLocalServer = true
      _localServerUrl = testUrl
      console.log(`[Database Router] Servidor Local ativo em: ${testUrl}`)
      return true
    }
  } catch (e) {
    // Falha local
  }
  _useLocalServer = false
  console.log(`[Database Router] Servidor Local inativo. Usando Supabase diretamente.`)
  return false
}

// Tenta verificar o servidor local imediatamente
checkLocalServer()

// ─── Funções de CRUD genérico Híbrido ───────────────────────────────────────

export async function dbLoad(tabela) {
  if (_useLocalServer) {
    try {
      const res = await fetch(`${_localServerUrl}/api/db/${tabela}`)
      if (res.ok) return await res.json()
    } catch (e) {
      console.warn(`[Local Server] Falha no dbLoad de ${tabela}, tentando Supabase Nuvem...`, e)
    }
  }

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

const PROGUNS_CONFIG_ALLOWED_COLUMNS = new Set([
  'id', 'nome_fantasia', 'razao_social', 'cnpj', 'cr_armeria',
  'validade_cr', 'rm_armeria', 'telefone', 'whatsapp', 'email',
  'endereco', 'cidade', 'uf', 'logo_url', 'created_at'
])

export async function dbUpsert(tabela, registro) {
  if (!registro) return false
  
  if (_useLocalServer) {
    try {
      const res = await fetch(`${_localServerUrl}/api/db/${tabela}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registro)
      })
      if (res.ok) return true
    } catch (e) {
      console.warn(`[Local Server] Falha no dbUpsert de ${tabela}, tentando Supabase Nuvem...`, e)
    }
  }

  if (!isSupabaseConfigured()) return false
  const client = getSupabaseClient()
  const realTable = getTableName(tabela)
  try {
    const registroSeguro = {}
    for (const [k, v] of Object.entries(registro)) {
      if (v !== null && v !== undefined) {
        if (realTable === 'proguns_config' && !PROGUNS_CONFIG_ALLOWED_COLUMNS.has(k)) {
          continue
        }
        registroSeguro[k] = v
      }
    }
    // Compatibilidade automática para tabela de vendas
    if (realTable === 'proguns_vendas') {
      if (registroSeguro.valor_total === undefined && registroSeguro.valor_final !== undefined) {
        registroSeguro.valor_total = registroSeguro.valor_final
      }
      if (!registroSeguro.status && (registroSeguro.status_venda || registroSeguro.status_tramite_arma)) {
        registroSeguro.status = registroSeguro.status_venda || 'CONCLUIDA'
      }
    }

    let { error } = await client.from(realTable).upsert(registroSeguro, { onConflict: 'id' })
    if (error) {
      console.warn(`[Supabase] Erro ao salvar registro em ${realTable}:`, error.message)

      // Se o erro for de coluna ainda não existente no Supabase (ex: novas colunas fiscais ou de trâmite de armas)
      // Remove dinamicamente a coluna rejeitada e tenta novamente até gravar com sucesso
      if (error.message && error.message.includes('Could not find the') && error.message.includes('column')) {
        let registroLimpo = { ...registroSeguro }
        let retryError = error
        for (let attempt = 0; attempt < 35; attempt++) {
          const colMatch = retryError?.message?.match(/Could not find the '([^']+)' column/)
          if (colMatch && colMatch[1]) {
            delete registroLimpo[colMatch[1]]
            const res = await client.from(realTable).upsert(registroLimpo, { onConflict: 'id' })
            retryError = res.error
            if (!retryError) {
              console.log(`[Supabase] Registro em ${realTable} salvo com sucesso após contornar coluna pendente '${colMatch[1]}'.`)
              return true
            }
          } else {
            break
          }
        }
      }

      const { error: err1 } = await client.from(realTable).upsert(registroSeguro)
      if (!err1) return true
      return false
    }
    return true
  } catch (err) {
    console.error(`[Supabase] Exceção ao salvar em ${realTable}:`, err)
    return false
  }
}

export async function dbUpdate(tabela, id, campos, registroCompleto = null) {
  if (!campos) return false

  if (_useLocalServer) {
    try {
      const payload = registroCompleto ? { ...registroCompleto, ...campos } : { id, ...campos }
      const res = await fetch(`${_localServerUrl}/api/db/${tabela}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) return true
    } catch (e) {
      console.warn(`[Local Server] Falha no dbUpdate de ${tabela}, tentando Supabase Nuvem...`, e)
    }
  }

  if (!isSupabaseConfigured()) return false
  const client = getSupabaseClient()
  const realTable = getTableName(tabela)
  const numeroOS = campos.numero_os || registroCompleto?.numero_os

  try {
    if (id) {
      const { data, error } = await client
        .from(realTable)
        .update(campos)
        .eq('id', id)
        .select('id, status')
      if (!error && data && data.length > 0) return true
    }
    if (numeroOS) {
      const { data, error } = await client
        .from(realTable)
        .update(campos)
        .eq('numero_os', Number(numeroOS))
        .select('id, status')
      if (!error && data && data.length > 0) return true
    }
    if (registroCompleto) {
      return await dbUpsert(tabela, registroCompleto)
    }
    return false
  } catch (err) {
    console.error(`[Supabase] Exceção ao atualizar ${realTable}:`, err)
    if (registroCompleto) return await dbUpsert(tabela, registroCompleto)
    return false
  }
}

export async function dbUpdateStatus(tabela, id, novoStatus, numeroOS = null) {
  if ((!id && !numeroOS) || !novoStatus) return false

  if (_useLocalServer) {
    try {
      const resLoad = await fetch(`${_localServerUrl}/api/db/${tabela}`)
      if (resLoad.ok) {
        const list = await resLoad.json()
        const match = list.find(r => r.id === id || (numeroOS && r.numero_os === Number(numeroOS)))
        if (match) {
          match.status = novoStatus
          match.updated_at = new Date().toISOString()
          const resSave = await fetch(`${_localServerUrl}/api/db/${tabela}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(match)
          })
          if (resSave.ok) return true
        }
      }
    } catch (e) {
      console.warn(`[Local Server] Falha no dbUpdateStatus de ${tabela}, tentando Supabase Nuvem...`, e)
    }
  }

  if (!isSupabaseConfigured()) return false
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
        if (!error && data && data.length > 0) return true
      }
      if (numeroOS) {
        const { data, error } = await client
          .from(realTable)
          .update({ status: novoStatus, updated_at: new Date().toISOString() })
          .eq('numero_os', Number(numeroOS))
          .select('id, status')
        if (!error && data && data.length > 0) return true
      }
      if (tentativa < 3) await new Promise(r => setTimeout(r, tentativa * 500))
    } catch (err) {
      if (tentativa < 3) await new Promise(r => setTimeout(r, tentativa * 500))
    }
  }
  return false
}

export async function dbDelete(tabela, id) {
  if (!id) return false

  try {
    const key = `PROGUNS_DELETED_${tabela.toUpperCase()}`
    const deleted = JSON.parse(localStorage.getItem(key) || '[]')
    if (!deleted.includes(String(id))) {
      deleted.push(String(id))
      localStorage.setItem(key, JSON.stringify(deleted))
    }
  } catch (e) {}

  if (_useLocalServer) {
    try {
      const res = await fetch(`${_localServerUrl}/api/db/${tabela}/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) return true
    } catch (e) {
      console.warn(`[Local Server] Falha no dbDelete de ${tabela}, tentando Supabase Nuvem...`, e)
    }
  }

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
  if (!registros?.length) return false

  if (_useLocalServer) {
    try {
      const res = await fetch(`${_localServerUrl}/api/db/${tabela}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registros)
      })
      if (res.ok) return true
    } catch (e) {
      console.warn(`[Local Server] Falha no dbUpsertAll de ${tabela}, tentando Supabase Nuvem...`, e)
    }
  }

  if (!isSupabaseConfigured()) return false
  const client = getSupabaseClient()
  const realTable = getTableName(tabela)
  try {
    const validos = registros.filter(r => r && r.id).map(r => {
      if (realTable === 'proguns_config') {
        const filtered = {}
        for (const [k, v] of Object.entries(r)) {
          if (PROGUNS_CONFIG_ALLOWED_COLUMNS.has(k) && v !== null && v !== undefined) {
            filtered[k] = v
          }
        }
        return filtered
      }
      return r
    })
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

export function subscribeToTable(tabela, onUpdate) {
  if (_useLocalServer) {
    try {
      const host = window.location.hostname || 'localhost'
      const wsUrl = `ws://${host}:3001`
      const socket = new WebSocket(wsUrl)
      
      socket.onopen = () => {
        socket.send(JSON.stringify({ action: 'join', channel: getTableName(tabela) }))
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.event === 'reload' && (data.table === tabela || getTableName(data.table) === getTableName(tabela))) {
            if (typeof onUpdate === 'function') onUpdate()
          }
        } catch (e) {}
      }

      return {
        unsubscribe: () => {
          socket.close()
        }
      }
    } catch (e) {
      console.warn('[Local WS] Falha ao assinar canal local, usando Supabase...', e)
    }
  }

  if (!isSupabaseConfigured()) return null
  const client = getSupabaseClient()
  const realTable = getTableName(tabela)
  try {
    const channelName = `realtime_${realTable}`
    const channel = client
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: realTable }, (payload) => {
        if (typeof onUpdate === 'function') onUpdate(payload)
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          if (typeof onUpdate === 'function') onUpdate()
        }
      })

    return {
      unsubscribe: () => {
        try {
          client.removeChannel(channel)
        } catch (e) {
          try { channel.unsubscribe() } catch (err) {}
        }
      }
    }
  } catch (err) {
    console.error(`[Supabase Realtime] Erro ao inscrever no canal ${realTable}:`, err)
    return null
  }
}

export async function uploadGTFile(file, fileName) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não está configurado.')
  }
  if (!file) {
    throw new Error('Nenhum arquivo fornecido para upload.')
  }
  const client = getSupabaseClient()
  const bucketName = 'guias_trafego'
  try {
    const { data, error } = await client.storage
      .from(bucketName)
      .upload(fileName, file, { cacheControl: '3600', upsert: true })
    if (error) {
      console.error('[Supabase Storage] Erro ao subir arquivo:', error)
      let message = error.message || 'Erro desconhecido.'
      if (message.includes('Bucket not found')) {
        message = "O bucket 'guias_trafego' não existe no Supabase. Crie-o no painel do Supabase com acesso público."
      } else if (message.includes('row level security') || error.status === 403 || error.statusCode === '403') {
        message = "Permissão negada (RLS). Certifique-se de configurar políticas públicas de leitura/escrita para o bucket 'guias_trafego' no Supabase."
      }
      throw new Error(message)
    }
    const { data: urlData } = client.storage.from(bucketName).getPublicUrl(fileName)
    if (!urlData?.publicUrl) {
      throw new Error('Não foi possível obter a URL pública do arquivo.')
    }
    return urlData.publicUrl
  } catch (err) {
    console.error('[Supabase Storage] Exceção ao subir arquivo:', err)
    throw err
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
