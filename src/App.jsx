import React, { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import ModuloHome from './components/ModuloHome'
import ModuloAlertas from './components/ModuloAlertas'
import ModuloClientes from './components/ModuloClientes'
import ModuloOrdens from './components/ModuloOrdens'
import ModuloOrcamentos from './components/ModuloOrcamentos'
import ModuloEstoque from './components/ModuloEstoque'
import ModuloCaixa from './components/ModuloCaixa'
import ModuloFinanceiro from './components/ModuloFinanceiro'
import ModuloConfiguracoes from './components/ModuloConfiguracoes'
import ModuloUsuarios from './components/ModuloUsuarios'
import ModuloVendas from './components/ModuloVendas'
import ModalLogin from './components/ModalLogin'
import { AlertTriangle, RefreshCw, CheckCircle2, Loader } from 'lucide-react'

import {
  INITIAL_USUARIOS,
  INITIAL_CLIENTES,
  INITIAL_ARMAS,
  INITIAL_ORDENS,
  INITIAL_ORCAMENTOS,
  INITIAL_FINANCEIRO,
  INITIAL_ESTOQUE,
  INITIAL_CAIXAS,
  INITIAL_ALERTAS,
  INITIAL_CONFIG,
  INITIAL_LOGS
} from './lib/initialData'

import {
  isSupabaseConfigured,
  dbLoad,
  dbUpsert,
  dbUpdate,
  dbUpsertAll,
  dbDelete,
  subscribeToTable
} from './lib/supabase'

// ─── Componente ErrorBoundary (Proteção Global Contra Tela Preta) ─────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary capturou um erro de renderização:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleResetAll = () => {
    try {
      localStorage.clear()
    } catch(e) {}
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0A0B0D',
          color: '#F0F2F5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div className="card" style={{ maxWidth: '560px', width: '100%', padding: '2rem', borderLeft: '4px solid #F87171' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertTriangle size={32} color="#F87171" />
              <div>
                <h2 style={{ fontSize: '1.2rem', color: '#F87171', fontWeight: '800', margin: 0 }}>
                  Atenção: Falha de Execução no Módulo
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  O sistema identificou um erro nos dados do módulo atual e interrompeu a exibição para proteger seus registros.
                </p>
              </div>
            </div>

            <div style={{
              backgroundColor: '#161920',
              border: '1px solid #262B36',
              padding: '0.85rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              color: '#FCA5A5',
              fontFamily: 'monospace',
              marginBottom: '1.25rem',
              wordBreak: 'break-all'
            }}>
              {this.state.error?.toString() || 'Erro inesperado.'}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={this.handleReset}
                style={{ fontSize: '0.82rem' }}
              >
                <RefreshCw size={15} /> Recarregar Módulo
              </button>
              <button
                type="button"
                className="btn-gold"
                onClick={this.handleResetAll}
                style={{ fontSize: '0.82rem', backgroundColor: '#8B262A', borderColor: '#8B262A' }}
              >
                Limpar Cache e Restaurar
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// ─── Helper localStorage & sessionStorage ─────────────────────────────────────
const ls = {
  get: (key, fallback) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
    catch (e) { return fallback }
  },
  set: (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)) } catch (e) {}
  }
}

const ss = {
  get: (key, fallback) => {
    try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : fallback }
    catch (e) { return fallback }
  },
  set: (key, val) => {
    try { sessionStorage.setItem(key, JSON.stringify(val)) } catch (e) {}
  },
  remove: (key) => {
    try { sessionStorage.removeItem(key) } catch (e) {}
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [filtroStatusOrdens, setFiltroStatusOrdens] = useState('')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [syncStatus, setSyncStatus] = useState('idle')

  // Helper para obter dados iniciais respeitando o localStorage local e registros deletados
  const getInitial = (key, fallback) => {
    const saved = ls.get(key, null)
    const deletedKey = key.replace('PROGUNS_', 'PROGUNS_DELETED_')
    const deletedIds = ls.get(deletedKey, [])

    if (saved !== null && Array.isArray(saved)) {
      return saved.filter(item => item?.id && !deletedIds.includes(String(item.id)))
    }
    return fallback.filter(item => item?.id && !deletedIds.includes(String(item.id)))
  }

  // ─── Migração Automática: Purga Completa de Dados de Demonstração ────────────────
  const APP_DATA_VERSION = '3.0.0'
  if (ls.get('PROGUNS_DATA_VERSION', null) !== APP_DATA_VERSION) {
    const DEMO_IDS_ALL = ['c1', 'c2', 'c3', 'c4', 'a1', 'a2', 'a3', 'a4', 'a5', 'o1', 'o2', 'o3', 'o4', 'orc1', 'orc_1', 'orc_2', 'fin_1', 'fin_2', 'fin_3', 'f1', 'log_1001', 'log_1002', 'alt_1002', 'cx_20260720']

    const purgarDemo = (lsKey) => {
      const saved = ls.get(lsKey, null)
      if (Array.isArray(saved)) {
        const purged = saved.filter(item => item?.id && !DEMO_IDS_ALL.includes(String(item.id)))
        ls.set(lsKey, purged)
      } else {
        ls.set(lsKey, [])
      }
    }

    purgarDemo('PROGUNS_CAIXAS')
    purgarDemo('PROGUNS_ALERTAS')
    purgarDemo('PROGUNS_ORDENS')
    purgarDemo('PROGUNS_CLIENTES')
    purgarDemo('PROGUNS_ARMAS')
    purgarDemo('PROGUNS_ORCAMENTOS')
    purgarDemo('PROGUNS_FINANCEIRO')
    purgarDemo('PROGUNS_LOGS')

    // Se Supabase estiver configurado, envia a deleção dos IDs demo
    if (isSupabaseConfigured()) {
      DEMO_IDS_ALL.forEach(id => {
        dbDelete('ordens', id)
        dbDelete('clientes', id)
        dbDelete('armas', id)
        dbDelete('orcamentos', id)
        dbDelete('financeiro', id)
        dbDelete('caixas', id)
        dbDelete('alertas', id)
        dbDelete('logs', id)
      })
    }

    ls.set('PROGUNS_DATA_VERSION', APP_DATA_VERSION)
  }

  // ── Estados com fallback localStorage ─────────────────────────────────────
  const [usuarios,   setUsuarios]   = useState(() => getInitial('PROGUNS_USUARIOS',   INITIAL_USUARIOS))
  const [clientes,   setClientes]   = useState(() => getInitial('PROGUNS_CLIENTES',   INITIAL_CLIENTES))
  const [armas,      setArmas]      = useState(() => getInitial('PROGUNS_ARMAS',      INITIAL_ARMAS))
  const [ordens,     setOrdens]     = useState(() => getInitial('PROGUNS_ORDENS',     INITIAL_ORDENS))
  const [orcamentos, setOrcamentos] = useState(() => getInitial('PROGUNS_ORCAMENTOS', INITIAL_ORCAMENTOS))
  const [financeiro, setFinanceiro] = useState(() => getInitial('PROGUNS_FINANCEIRO', INITIAL_FINANCEIRO))
  const [estoque,    setEstoque]    = useState(() => getInitial('PROGUNS_ESTOQUE',    INITIAL_ESTOQUE))
  const [caixas,     setCaixas]     = useState(() => getInitial('PROGUNS_CAIXAS',     INITIAL_CAIXAS))
  const [alertas,    setAlertas]    = useState(() => getInitial('PROGUNS_ALERTAS',    INITIAL_ALERTAS))
  const [logs,       setLogs]       = useState(() => getInitial('PROGUNS_LOGS',       INITIAL_LOGS))
  const [vendas,     setVendas]     = useState(() => getInitial('PROGUNS_VENDAS',     []))
  const [config,     setConfig]     = useState(() => ls.get('PROGUNS_CONFIG',     INITIAL_CONFIG))

  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    localStorage.removeItem('PROGUNS_AUTH_USER')
    return ss.get('PROGUNS_AUTH_USER', null)
  })
  const [modalLoginAberto, setModalLoginAberto] = useState(false)
  const [notificacoes, setNotificacoes] = useState([])

  const handleLogoff = () => {
    ss.remove('PROGUNS_AUTH_USER')
    localStorage.removeItem('PROGUNS_AUTH_USER')
    setUsuarioLogado(null)
  }

  // ── Sincronização Automática em localStorage ──────────────────────────────────
  useEffect(() => { ls.set('PROGUNS_USUARIOS', usuarios) }, [usuarios])

  // ── Sincronização em Tempo Real das Permissões do Usuário Logado ────────────────
  useEffect(() => {
    if (usuarioLogado?.id && usuarios && usuarios.length > 0) {
      const uAtualizado = usuarios.find(u => String(u.id) === String(usuarioLogado.id) || u.email === usuarioLogado.email)
      if (uAtualizado) {
        if (
          JSON.stringify(uAtualizado.permissoes) !== JSON.stringify(usuarioLogado.permissoes) ||
          uAtualizado.perfil !== usuarioLogado.perfil ||
          uAtualizado.status !== usuarioLogado.status ||
          uAtualizado.cargo !== usuarioLogado.cargo
        ) {
          const novoUsuarioLogado = { ...usuarioLogado, ...uAtualizado }
          setUsuarioLogado(novoUsuarioLogado)
          ss.set('PROGUNS_AUTH_USER', novoUsuarioLogado)
        }
      }
    }
  }, [usuarios, usuarioLogado])

  const [osParaVisualizar, setOsParaVisualizar] = useState(null)

  // ── Sincronização em Tempo Real via Eventos de Armazenamento (Multi-Aba) ─────────
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'PROGUNS_ORDENS' && e.newValue) {
        try { setOrdens(JSON.parse(e.newValue)) } catch(err) {}
      }
      if (e.key === 'PROGUNS_ALERTAS' && e.newValue) {
        try { setAlertas(JSON.parse(e.newValue)) } catch(err) {}
      }
      if (e.key === 'PROGUNS_CONFIG' && e.newValue) {
        try { setConfig(JSON.parse(e.newValue)) } catch(err) {}
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  useEffect(() => { ls.set('PROGUNS_CLIENTES', clientes) }, [clientes])
  useEffect(() => { ls.set('PROGUNS_ARMAS', armas) }, [armas])
  useEffect(() => { ls.set('PROGUNS_ORDENS', ordens) }, [ordens])
  useEffect(() => { ls.set('PROGUNS_ORCAMENTOS', orcamentos) }, [orcamentos])
  useEffect(() => { ls.set('PROGUNS_FINANCEIRO', financeiro) }, [financeiro])
  useEffect(() => { ls.set('PROGUNS_ESTOQUE', estoque) }, [estoque])
  useEffect(() => { ls.set('PROGUNS_CAIXAS', caixas) }, [caixas])
  useEffect(() => { ls.set('PROGUNS_ALERTAS', alertas) }, [alertas])
  useEffect(() => { ls.set('PROGUNS_VENDAS', vendas) }, [vendas])

  // ─── MECANISMO INTELIGENTE DE INTEGRIDADE DA BASE DE DADOS (PURGA DE ÓRFÃOS & CORREÇÃO DE STATUS) ─────
  useEffect(() => {
    // 0. Auto-healing: Corrige O.S. com laudo/itens preenchidos mas com status preso em 'EM ANÁLISE'
    setOrdens(prevOrdens => {
      if (!Array.isArray(prevOrdens) || prevOrdens.length === 0) return prevOrdens
      let alterado = false
      const agora = new Date().toISOString()
      const corrigidos = prevOrdens.map(o => {
        if (o.status === 'EM ANÁLISE' && ((Array.isArray(o.itens_laudo) && o.itens_laudo.length > 0) || o.diagnostico_armeiro || (o.valor_servico && parseFloat(o.valor_servico) > 0))) {
          alterado = true
          const corrigida = { ...o, status: 'AGUARDANDO APROVAÇÃO', updated_at: agora }
          // Também corrige no Supabase via UPDATE direto (evita que o sync reverta)
          if (isSupabaseConfigured()) {
            dbUpdate('ordens', o.id, { status: 'AGUARDANDO APROVAÇÃO', updated_at: agora, numero_os: o.numero_os }, corrigida)
          }
          return corrigida
        }
        return o
      })
      if (alterado) {
        try { localStorage.setItem('PROGUNS_ORDENS', JSON.stringify(corrigidos)) } catch(e) {}
        return corrigidos
      }
      return prevOrdens
    })

    // 1. Purga Alertas Órfãos de O.S. ou Clientes excluídos
    setAlertas(prevAlertas => {
      const novos = (prevAlertas || []).filter(alerta => {
        if (alerta.ordem_id || alerta.os_numero) {
          const osExiste = (ordens || []).some(o => 
            String(o.id) === String(alerta.ordem_id) || 
            Number(o.numero_os) === Number(alerta.os_numero)
          )
          if (!osExiste) return false
        }
        if (alerta.cliente_id) {
          const clienteExiste = (clientes || []).some(c => String(c.id) === String(alerta.cliente_id))
          if (!clienteExiste) return false
        }
        return true
      })
      return novos.length !== (prevAlertas || []).length ? novos : prevAlertas
    })

    // 2. Purga Notificações Órfãs de O.S. excluídas
    setNotificacoes(prevNotifs => {
      const novas = (prevNotifs || []).filter(n => {
        if (n.os_numero) {
          return (ordens || []).some(o => Number(o.numero_os) === Number(n.os_numero))
        }
        return true
      })
      return novas.length !== (prevNotifs || []).length ? novas : prevNotifs
    })

    // 3. Purga Lançamentos Financeiros de O.S. excluídas
    setFinanceiro(prevFin => {
      const novos = (prevFin || []).filter(f => {
        if (f.ordem_id) {
          return (ordens || []).some(o => String(o.id) === String(f.ordem_id))
        }
        return true
      })
      return novos.length !== (prevFin || []).length ? novos : prevFin
    })

    // 4. Purga Armas de Clientes excluídos
    setArmas(prevArmas => {
      const novas = (prevArmas || []).filter(a => {
        if (a.cliente_id) {
          return (clientes || []).some(c => String(c.id) === String(a.cliente_id))
        }
        return true
      })
      return novas.length !== (prevArmas || []).length ? novas : prevArmas
    })

    // 5. Purga Orçamentos de Clientes excluídos
    setOrcamentos(prevOrc => {
      const novos = (prevOrc || []).filter(orc => {
        if (orc.cliente_id) {
          return (clientes || []).some(c => String(c.id) === String(orc.cliente_id))
        }
        return true
      })
      return novos.length !== (prevOrc || []).length ? novos : prevOrc
    })
  }, [ordens, clientes])
  useEffect(() => { ls.set('PROGUNS_LOGS', logs) }, [logs])
  useEffect(() => { ls.set('PROGUNS_CONFIG', config) }, [config])

  // Hierarquia de status de O.S. para merge inteligente (maior índice = mais avançado)
  const STATUS_ORDEM_PRIORIDADE = [
    'NÃO INICIADO', 'EM ANÁLISE', 'AGUARDANDO APROVAÇÃO',
    'APROVADO', 'EM MANUTENÇÃO', 'AGUARDANDO RETIRADA', 'CONCLUÍDO'
  ]

  // Helper de Fusão Inteligente
  const mesclarDados = (remotos, locais, tabela) => {
    const remotosList = Array.isArray(remotos) ? remotos : []
    const locaisList = Array.isArray(locais) ? locais : []
    const deletedIds = ls.get(`PROGUNS_DELETED_${tabela.toUpperCase()}`, [])
    const demoIdsToIgnore = [
      'c1', 'c2', 'c3', 'c4',
      'a1', 'a2', 'a3', 'a4', 'a5',
      'o1', 'o2', 'o3', 'o4',
      'p1', 'p2', 'p3', 'p4',
      'orc1', 'orc_1', 'orc_2',
      'fin_1', 'fin_2', 'fin_3', 'f1',
      'log_1001', 'log_1002',
      'alt_1002', 'cx_20260720'
    ]

    const mapa = new Map()

    // 1º Insere cache local do navegador
    locaisList.forEach(item => {
      if (item?.id && !deletedIds.includes(String(item.id)) && !demoIdsToIgnore.includes(String(item.id))) {
        mapa.set(String(item.id), item)
      }
    })

    // 2º Se Supabase retornou dados (remotos !== null), os dados remotos atualizados SOBRESCREVEM o cache local antigo
    // EXCEÇÃO CRÍTICA para O.S.: se o local tem status mais avançado no fluxo, ele vence
    if (remotos !== null) {
      remotosList.forEach(item => {
        if (item?.id && !deletedIds.includes(String(item.id)) && !demoIdsToIgnore.includes(String(item.id))) {
          // Busca no mapa local por ID ou por numero_os
          let localObj = mapa.get(String(item.id))
          if (!localObj && item.numero_os && tabela === 'ordens') {
            for (const [k, v] of mapa.entries()) {
              if (Number(v.numero_os) === Number(item.numero_os)) {
                localObj = v
                break
              }
            }
          }
          if (!localObj) localObj = {}

          if (tabela === 'ordens' && localObj.status && item.status) {
            const prioLocal  = STATUS_ORDEM_PRIORIDADE.indexOf(localObj.status)
            const prioRemoto = STATUS_ORDEM_PRIORIDADE.indexOf(item.status)

            if (prioLocal > prioRemoto) {
              // Local está mais avançado no fluxo de trabalho
              const merged = { ...item, ...localObj }
              mapa.set(String(item.id), merged)
              if (isSupabaseConfigured()) dbUpsert('ordens', merged)
              return
            }

            if (prioRemoto > prioLocal) {
              // Remoto está mais avançado: remoto substitui o local
              const merged = { ...localObj, ...item }
              mapa.set(String(item.id), merged)
              return
            }

            if (prioLocal === prioRemoto && localObj.updated_at && item.updated_at) {
              if (localObj.updated_at > item.updated_at) {
                const merged = { ...item, ...localObj }
                mapa.set(String(item.id), merged)
                if (isSupabaseConfigured()) dbUpsert('ordens', merged)
                return
              }
            }
          }

          mapa.set(String(item.id), { ...localObj, ...item })
        }
      })
    }

    const mesclado = Array.from(mapa.values())

    if (tabela === 'usuarios' || tabela === 'clientes') {
      mesclado.sort((a, b) => (a.nome_completo || '').localeCompare(b.nome_completo || ''))
    } else if (tabela === 'ordens') {
      mesclado.sort((a, b) => (Number(b.numero_os) || 0) - (Number(a.numero_os) || 0))
    }

    const faltantesNoSupabase = mesclado.filter(m => !remotosList.some(r => String(r.id) === String(m.id)))
    if (faltantesNoSupabase.length > 0 && isSupabaseConfigured()) {
      dbUpsertAll(tabela, faltantesNoSupabase)
    }

    return mesclado
  }

  // ─── CARREGAR DADOS DO SUPABASE ──────────────────────────────────────────────
  const carregarDoSupabase = useCallback(async (silencioso = false) => {
    if (!isSupabaseConfigured()) return
    if (!silencioso) setSyncStatus('loading')
    try {
      const [dbClientes, dbOrdens, dbOrcamentos, dbFinanceiro, dbUsuarios, dbArmas, dbEstoque, dbCaixas, dbAlertas, dbLogs, dbVendas, dbConfig] = await Promise.all([
        dbLoad('clientes'),
        dbLoad('ordens'),
        dbLoad('orcamentos'),
        dbLoad('financeiro'),
        dbLoad('usuarios'),
        dbLoad('armas'),
        dbLoad('estoque'),
        dbLoad('caixas'),
        dbLoad('alertas'),
        dbLoad('logs'),
        dbLoad('vendas'),
        dbLoad('config')
      ])

      const localClientes   = ls.get('PROGUNS_CLIENTES', INITIAL_CLIENTES)
      const localOrdens     = ls.get('PROGUNS_ORDENS', INITIAL_ORDENS)
      const localOrcamentos = ls.get('PROGUNS_ORCAMENTOS', INITIAL_ORCAMENTOS)
      const localFinanceiro = ls.get('PROGUNS_FINANCEIRO', INITIAL_FINANCEIRO)
      const localUsuarios   = ls.get('PROGUNS_USUARIOS', INITIAL_USUARIOS)
      const localArmas      = ls.get('PROGUNS_ARMAS', INITIAL_ARMAS)
      const localEstoque    = ls.get('PROGUNS_ESTOQUE', INITIAL_ESTOQUE)
      const localCaixas     = ls.get('PROGUNS_CAIXAS', INITIAL_CAIXAS)
      const localAlertas    = ls.get('PROGUNS_ALERTAS', INITIAL_ALERTAS)
      const localLogs       = ls.get('PROGUNS_LOGS', INITIAL_LOGS)
      const localVendas     = ls.get('PROGUNS_VENDAS', [])

      const finalClientes   = mesclarDados(dbClientes, localClientes, 'clientes')
      const finalOrdens     = mesclarDados(dbOrdens, localOrdens, 'ordens')
      const finalOrcamentos = mesclarDados(dbOrcamentos, localOrcamentos, 'orcamentos')
      const finalFinanceiro = mesclarDados(dbFinanceiro, localFinanceiro, 'financeiro')
      const finalUsuarios   = mesclarDados(dbUsuarios, localUsuarios, 'usuarios')
      const finalArmas      = mesclarDados(dbArmas, localArmas, 'armas')
      const finalEstoque    = mesclarDados(dbEstoque, localEstoque, 'estoque')
      const finalCaixas     = mesclarDados(dbCaixas, localCaixas, 'caixas')
      const finalAlertas    = mesclarDados(dbAlertas, localAlertas, 'alertas')
      const finalLogs       = mesclarDados(dbLogs, localLogs, 'logs')
      const finalVendas     = mesclarDados(dbVendas, localVendas, 'vendas')

      setClientes(prev => JSON.stringify(prev) === JSON.stringify(finalClientes) ? prev : finalClientes)
      setOrdens(prev => JSON.stringify(prev) === JSON.stringify(finalOrdens) ? prev : finalOrdens)
      setOrcamentos(prev => JSON.stringify(prev) === JSON.stringify(finalOrcamentos) ? prev : finalOrcamentos)
      setFinanceiro(prev => JSON.stringify(prev) === JSON.stringify(finalFinanceiro) ? prev : finalFinanceiro)
      setUsuarios(prev => JSON.stringify(prev) === JSON.stringify(finalUsuarios) ? prev : finalUsuarios)
      setArmas(prev => JSON.stringify(prev) === JSON.stringify(finalArmas) ? prev : finalArmas)
      setEstoque(prev => JSON.stringify(prev) === JSON.stringify(finalEstoque) ? prev : finalEstoque)
      setCaixas(prev => JSON.stringify(prev) === JSON.stringify(finalCaixas) ? prev : finalCaixas)
      setAlertas(prev => JSON.stringify(prev) === JSON.stringify(finalAlertas) ? prev : finalAlertas)
      setLogs(prev => JSON.stringify(prev) === JSON.stringify(finalLogs) ? prev : finalLogs)
      setVendas(prev => JSON.stringify(prev) === JSON.stringify(finalVendas) ? prev : finalVendas)

      if (Array.isArray(dbConfig) && dbConfig.length > 0) {
        const remoteCfg = dbConfig.find(c => c.id === 'main_config') || dbConfig[0]
        if (remoteCfg) {
          const remoteCopy = { ...remoteCfg }
          delete remoteCopy.id
          setConfig(prev => {
            const merged = { ...INITIAL_CONFIG, ...prev, ...remoteCopy }
            if (Array.isArray(remoteCopy.ordem_menu) && remoteCopy.ordem_menu.length > 0) {
              merged.ordem_menu = remoteCopy.ordem_menu
            }
            ls.set('PROGUNS_CONFIG', merged)
            return merged
          })
        }
      }

      if (!silencioso) setSyncStatus('ok')
      setTimeout(() => setSyncStatus('idle'), 3000)
    } catch (e) {
      console.error('[Supabase] Erro ao carregar:', e)
      if (!silencioso) setSyncStatus('error')
      setTimeout(() => setSyncStatus('idle'), 4000)
    }
  }, [])

  useEffect(() => {
    if (isSupabaseConfigured()) {
      carregarDoSupabase()
    }
  }, [carregarDoSupabase])

  useEffect(() => {
    const handleSync = () => { if (isSupabaseConfigured()) carregarDoSupabase(true) }
    const interval = setInterval(handleSync, 3000)
    window.addEventListener('focus', handleSync)
    document.addEventListener('visibilitychange', handleSync)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleSync)
      document.removeEventListener('visibilitychange', handleSync)
    }
  }, [carregarDoSupabase])

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const channels = [
      subscribeToTable('ordens',     () => carregarDoSupabase(true)),
      subscribeToTable('clientes',   () => carregarDoSupabase(true)),
      subscribeToTable('armas',      () => carregarDoSupabase(true)),
      subscribeToTable('orcamentos', () => carregarDoSupabase(true)),
      subscribeToTable('financeiro', () => carregarDoSupabase(true)),
      subscribeToTable('estoque',    () => carregarDoSupabase(true)),
      subscribeToTable('caixas',     () => carregarDoSupabase(true)),
      subscribeToTable('alertas',    () => carregarDoSupabase(true)),
      subscribeToTable('usuarios',   () => carregarDoSupabase(true)),
      subscribeToTable('config',     () => carregarDoSupabase(true)),
    ].filter(Boolean)

    return () => { channels.forEach(ch => { try { ch.unsubscribe() } catch(e) {} }) }
  }, [carregarDoSupabase])

  useEffect(() => { ls.set('PROGUNS_USUARIOS', usuarios) }, [usuarios])
  useEffect(() => { ls.set('PROGUNS_CLIENTES', clientes) }, [clientes])
  useEffect(() => { ls.set('PROGUNS_ARMAS', armas) }, [armas])
  useEffect(() => { ls.set('PROGUNS_ORDENS', ordens) }, [ordens])
  useEffect(() => { ls.set('PROGUNS_ORCAMENTOS', orcamentos) }, [orcamentos])
  useEffect(() => { ls.set('PROGUNS_FINANCEIRO', financeiro) }, [financeiro])
  useEffect(() => { ls.set('PROGUNS_ESTOQUE', estoque) }, [estoque])
  useEffect(() => { ls.set('PROGUNS_CAIXAS', caixas) }, [caixas])
  useEffect(() => { ls.set('PROGUNS_ALERTAS', alertas) }, [alertas])

  const handleAtualizarConfig = (novosDados) => {
    setConfig(novosDados)
    ls.set('PROGUNS_CONFIG', novosDados)
  }

  if (!usuarioLogado) {
    return (
      <ModalLogin
        usuarios={usuarios}
        usuarioLogado={usuarioLogado}
        setUsuarioLogado={setUsuarioLogado}
        config={config}
      />
    )
  }

  // Banner de status de sincronização
  const BannerSync = () => {
    if (isSupabaseConfigured()) {
      if (syncStatus === 'loading') return (
        <div style={{ backgroundColor: 'rgba(30,50,80,0.4)', borderBottom: '1px solid rgba(59,130,246,0.2)', padding: '0.3rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.73rem', color: '#93C5FD' }}>
          <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Sincronizando com o banco de dados...</span>
        </div>
      )
      if (syncStatus === 'ok') return (
        <div style={{ backgroundColor: 'rgba(19,70,51,0.25)', borderBottom: '1px solid rgba(52,211,153,0.2)', padding: '0.3rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.73rem', color: '#6EE7B7' }}>
          <CheckCircle2 size={13} />
          <span>Dados sincronizados com Supabase ✓</span>
        </div>
      )
      if (syncStatus === 'error') return (
        <div style={{ backgroundColor: 'rgba(139,38,42,0.2)', borderBottom: '1px solid rgba(139,38,42,0.3)', padding: '0.3rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.73rem', color: '#FCA5A5' }}>
          <AlertTriangle size={13} />
          <span>Erro ao sincronizar. Verifique a conexão Supabase em Configurações.</span>
        </div>
      )
      return null
    }

    return (
      <div style={{ backgroundColor: 'rgba(120,90,20,0.15)', borderBottom: '1px solid rgba(212,175,55,0.2)', padding: '0.35rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.73rem', color: '#D4AF37', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={13} />
          <span><strong>MODO LOCAL:</strong> dados salvos apenas neste dispositivo. Para sincronizar entre dispositivos, conecte o Supabase em <strong>Configurações</strong>.</span>
        </div>
        <button
          onClick={() => carregarDoSupabase(false)}
          style={{ background: 'none', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
        >
          <RefreshCw size={11} /> Recarregar
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar
        activeTab={activeTab}
        usuarioLogado={usuarioLogado}
        setModalLoginAberto={setModalLoginAberto}
        handleLogoff={handleLogoff}
        notificacoes={notificacoes}
        setNotificacoes={setNotificacoes}
        setActiveTab={setActiveTab}
        config={config}
        setMobileSidebarOpen={setMobileSidebarOpen}
      />

      <BannerSync />

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          usuarioLogado={usuarioLogado}
          config={config}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
          ordens={ordens}
          orcamentos={orcamentos}
          estoque={estoque}
          caixas={caixas}
          alertas={alertas}
        />

        <main style={{ flex: 1, overflowY: 'auto' }}>
          <ErrorBoundary key={activeTab}>
            {activeTab === 'home' && (
              <ModuloHome
                ordens={ordens}
                orcamentos={orcamentos}
                estoque={estoque}
                caixas={caixas}
                financeiro={financeiro}
                clientes={clientes}
                setActiveTab={setActiveTab}
                setFiltroStatusOrdens={setFiltroStatusOrdens}
              />
            )}

            {activeTab === 'alertas' && (
              <ModuloAlertas
                alertas={alertas} setAlertas={setAlertas}
                ordens={ordens} setOrdens={setOrdens}
                usuarioLogado={usuarioLogado}
                setActiveTab={setActiveTab}
                setFiltroStatusOrdens={setFiltroStatusOrdens}
                onAbrirImprimirOS={(targetOS) => {
                  setOsParaVisualizar(targetOS)
                  setActiveTab('ordens')
                }}
              />
            )}

            {activeTab === 'clientes' && (
              <ModuloClientes
                clientes={clientes} setClientes={setClientes}
                armas={armas} setArmas={setArmas}
                ordens={ordens} setOrdens={setOrdens}
                orcamentos={orcamentos} setOrcamentos={setOrcamentos}
                financeiro={financeiro} setFinanceiro={setFinanceiro}
                logs={logs} setLogs={setLogs}
                setActiveTab={setActiveTab}
                perfilOperador={usuarioLogado?.perfil || 'recepcao'}
                usuarioLogado={usuarioLogado}
                config={config}
              />
            )}

            {activeTab === 'ordens' && (
              <ModuloOrdens
                ordens={ordens} setOrdens={setOrdens}
                clientes={clientes} setClientes={setClientes}
                armas={armas} setArmas={setArmas}
                estoque={estoque} setEstoque={setEstoque}
                financeiro={financeiro} setFinanceiro={setFinanceiro}
                caixas={caixas} setCaixas={setCaixas}
                alertas={alertas} setAlertas={setAlertas}
                usuarios={usuarios}
                logs={logs} setLogs={setLogs}
                perfilOperador={usuarioLogado?.perfil || 'recepcao'}
                usuarioLogado={usuarioLogado}
                notificacoes={notificacoes} setNotificacoes={setNotificacoes}
                config={config}
                filtroInicial={filtroStatusOrdens}
                osParaVisualizar={osParaVisualizar}
                setOsParaVisualizar={setOsParaVisualizar}
              />
            )}

            {activeTab === 'orcamentos' && (
              <ModuloOrcamentos
                orcamentos={orcamentos} setOrcamentos={setOrcamentos}
                clientes={clientes}
                ordens={ordens} setOrdens={setOrdens}
                financeiro={financeiro} setFinanceiro={setFinanceiro}
                config={config}
                usuarioLogado={usuarioLogado}
                usuarios={usuarios}
              />
            )}

            {activeTab === 'estoque' && (
              <ModuloEstoque
                estoque={estoque} setEstoque={setEstoque}
                usuarioLogado={usuarioLogado}
                config={config}
              />
            )}

            {activeTab === 'caixa' && (
              <ModuloCaixa
                caixas={caixas} setCaixas={setCaixas}
                ordens={ordens} setOrdens={setOrdens}
                estoque={estoque} setEstoque={setEstoque}
                financeiro={financeiro} setFinanceiro={setFinanceiro}
                usuarioLogado={usuarioLogado}
                usuarios={usuarios}
                config={config}
              />
            )}

            {activeTab === 'financeiro' && (
              <ModuloFinanceiro
                financeiro={financeiro} setFinanceiro={setFinanceiro}
                usuarioLogado={usuarioLogado}
                usuarios={usuarios}
                config={config}
              />
            )}

            {activeTab === 'usuarios' && (
              <ModuloUsuarios
                usuarios={usuarios} setUsuarios={setUsuarios}
                usuarioLogado={usuarioLogado}
                logs={logs} setLogs={setLogs}
              />
            )}

            {activeTab === 'configuracoes' && (
              <ModuloConfiguracoes
                config={config} setConfig={setConfig}
                ordens={ordens} setOrdens={setOrdens}
              />
            )}

            {activeTab === 'vendas' && (
              <ModuloVendas
                vendas={vendas} setVendas={setVendas}
                estoque={estoque} setEstoque={setEstoque}
                caixas={caixas} setCaixas={setCaixas}
                financeiro={financeiro} setFinanceiro={setFinanceiro}
                clientes={clientes}
                usuarioLogado={usuarioLogado}
                setLogs={setLogs}
                config={config}
              />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {modalLoginAberto && (
        <ModalLogin
          usuarios={usuarios}
          usuarioLogado={usuarioLogado}
          setUsuarioLogado={setUsuarioLogado}
          onClose={() => setModalLoginAberto(false)}
          config={config}
        />
      )}
    </div>
  )
}
