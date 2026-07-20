import React, { useState, useEffect, useCallback } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import ModuloClientes from './components/ModuloClientes'
import ModuloOrdens from './components/ModuloOrdens'
import ModuloOrcamentos from './components/ModuloOrcamentos'
import ModuloFinanceiro from './components/ModuloFinanceiro'
import ModuloConfiguracoes from './components/ModuloConfiguracoes'
import ModuloUsuarios from './components/ModuloUsuarios'
import ModalLogin from './components/ModalLogin'
import { AlertTriangle, RefreshCw, CheckCircle2, Loader } from 'lucide-react'

import {
  INITIAL_USUARIOS,
  INITIAL_CLIENTES,
  INITIAL_ARMAS,
  INITIAL_ORDENS,
  INITIAL_ORCAMENTOS,
  INITIAL_FINANCEIRO,
  INITIAL_CONFIG
} from './lib/initialData'

import {
  isSupabaseConfigured,
  dbLoad,
  dbUpsert,
  dbUpsertAll,
  dbDelete,
  subscribeToTable
} from './lib/supabase'

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
  const [activeTab, setActiveTab] = useState('clientes')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle' | 'loading' | 'ok' | 'error'

  // ── Estados com fallback localStorage ─────────────────────────────────────
  const [usuarios,   setUsuarios]   = useState(() => ls.get('PROGUNS_USUARIOS',   INITIAL_USUARIOS))
  const [clientes,   setClientes]   = useState(() => ls.get('PROGUNS_CLIENTES',   INITIAL_CLIENTES))
  const [armas,      setArmas]      = useState(() => ls.get('PROGUNS_ARMAS',      INITIAL_ARMAS))
  const [ordens,     setOrdens]     = useState(() => ls.get('PROGUNS_ORDENS',     INITIAL_ORDENS))
  const [orcamentos, setOrcamentos] = useState(() => ls.get('PROGUNS_ORCAMENTOS', INITIAL_ORCAMENTOS))
  const [financeiro, setFinanceiro] = useState(() => ls.get('PROGUNS_FINANCEIRO', INITIAL_FINANCEIRO))
  const [config,     setConfig]     = useState(() => ls.get('PROGUNS_CONFIG',     INITIAL_CONFIG))

  // Sessão do usuário guardada apenas no sessionStorage para exigir novo login ao fechar aba/GUI
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    localStorage.removeItem('PROGUNS_AUTH_USER') // Limpa resquícios antigos do localStorage
    return ss.get('PROGUNS_AUTH_USER', null)
  })
  const [modalLoginAberto, setModalLoginAberto] = useState(false)

  const [notificacoes, setNotificacoes] = useState([{
    id: 'n1', os_numero: 1002, cliente_nome: 'ROBERTO ALVES MENDES',
    mensagem: 'Armeiro concluiu o laudo técnico da Carabina Rossi.',
    tipo: 'LAUDO_PRONTO', lida: false, created_at: 'Há 10 min'
  }])

  const handleLogoff = () => {
    ss.remove('PROGUNS_AUTH_USER')
    localStorage.removeItem('PROGUNS_AUTH_USER')
    setUsuarioLogado(null)
  }

  // Helper de Fusão Inteligente: une os dados do Supabase com os salvos localmente
  const mesclarDados = (remotos, locais, tabela) => {
    if (remotos === null) return locais // Se erro de rede, mantém os locais
    const remotosList = Array.isArray(remotos) ? remotos : []
    const locaisList = Array.isArray(locais) ? locais : []
    const mapa = new Map()

    locaisList.forEach(item => {
      if (item?.id) mapa.set(String(item.id), item)
    })

    remotosList.forEach(item => {
      if (item?.id) mapa.set(String(item.id), item)
    })

    const mesclado = Array.from(mapa.values())

    // Envia para o Supabase qualquer item local que ainda não estava na nuvem
    const faltantesNoSupabase = mesclado.filter(m => !remotosList.some(r => String(r.id) === String(m.id)))
    if (faltantesNoSupabase.length > 0) {
      dbUpsertAll(tabela, faltantesNoSupabase)
    }

    return mesclado
  }

  // ─── CARREGAR DADOS DO SUPABASE (ao iniciar) ────────────────────────────────
  const carregarDoSupabase = useCallback(async (silencioso = false) => {
    if (!isSupabaseConfigured()) return
    if (!silencioso) setSyncStatus('loading')
    try {
      const [dbClientes, dbOrdens, dbOrcamentos, dbFinanceiro, dbUsuarios] = await Promise.all([
        dbLoad('clientes'),
        dbLoad('ordens'),
        dbLoad('orcamentos'),
        dbLoad('financeiro'),
        dbLoad('usuarios'),
      ])

      const localClientes   = ls.get('PROGUNS_CLIENTES', INITIAL_CLIENTES)
      const localOrdens     = ls.get('PROGUNS_ORDENS', INITIAL_ORDENS)
      const localOrcamentos = ls.get('PROGUNS_ORCAMENTOS', INITIAL_ORCAMENTOS)
      const localFinanceiro = ls.get('PROGUNS_FINANCEIRO', INITIAL_FINANCEIRO)
      const localUsuarios   = ls.get('PROGUNS_USUARIOS', INITIAL_USUARIOS)

      const finalClientes   = mesclarDados(dbClientes, localClientes, 'clientes')
      const finalOrdens     = mesclarDados(dbOrdens, localOrdens, 'ordens')
      const finalOrcamentos = mesclarDados(dbOrcamentos, localOrcamentos, 'orcamentos')
      const finalFinanceiro = mesclarDados(dbFinanceiro, localFinanceiro, 'financeiro')
      const finalUsuarios   = mesclarDados(dbUsuarios, localUsuarios, 'usuarios')

      setClientes(finalClientes);     ls.set('PROGUNS_CLIENTES',   finalClientes)
      setOrdens(finalOrdens);         ls.set('PROGUNS_ORDENS',     finalOrdens)
      setOrcamentos(finalOrcamentos); ls.set('PROGUNS_ORCAMENTOS', finalOrcamentos)
      setFinanceiro(finalFinanceiro); ls.set('PROGUNS_FINANCEIRO', finalFinanceiro)
      setUsuarios(finalUsuarios);     ls.set('PROGUNS_USUARIOS',   finalUsuarios)

      if (!silencioso) setSyncStatus('ok')
      setTimeout(() => setSyncStatus('idle'), 3000)
    } catch (e) {
      console.error('[Supabase] Erro ao carregar:', e)
      if (!silencioso) setSyncStatus('error')
      setTimeout(() => setSyncStatus('idle'), 4000)
    }
  }, [])

  // Carrega ao montar
  useEffect(() => {
    if (isSupabaseConfigured()) {
      carregarDoSupabase()
    }
  }, [carregarDoSupabase])

  // Recarrega ao focar a janela (voltar ao app no tablet/celular)
  useEffect(() => {
    const handleFocus = () => {
      if (isSupabaseConfigured()) {
        carregarDoSupabase(true)
      } else {
        // Fallback localStorage entre abas
        try {
          const ords = localStorage.getItem('PROGUNS_ORDENS')
          const clis = localStorage.getItem('PROGUNS_CLIENTES')
          const orcs = localStorage.getItem('PROGUNS_ORCAMENTOS')
          const fins = localStorage.getItem('PROGUNS_FINANCEIRO')
          if (ords) setOrdens(JSON.parse(ords))
          if (clis) setClientes(JSON.parse(clis))
          if (orcs) setOrcamentos(JSON.parse(orcs))
          if (fins) setFinanceiro(JSON.parse(fins))
        } catch (e) {}
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [carregarDoSupabase])

  // ─── REALTIME: escuta mudanças de outros dispositivos ────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const channels = [
      subscribeToTable('ordens',     () => carregarDoSupabase(true)),
      subscribeToTable('clientes',   () => carregarDoSupabase(true)),
      subscribeToTable('orcamentos', () => carregarDoSupabase(true)),
      subscribeToTable('financeiro', () => carregarDoSupabase(true)),
    ].filter(Boolean)
    return () => { channels.forEach(ch => { try { ch.unsubscribe() } catch(e) {} }) }
  }, [carregarDoSupabase])

  // ─── PERSISTÊNCIA: salva localStorage E Supabase ao mudar estado ─────────────
  useEffect(() => {
    ls.set('PROGUNS_USUARIOS', usuarios)
    if (isSupabaseConfigured()) dbUpsertAll('usuarios', usuarios)
  }, [usuarios])

  useEffect(() => {
    ls.set('PROGUNS_CLIENTES', clientes)
    if (isSupabaseConfigured()) dbUpsertAll('clientes', clientes)
  }, [clientes])

  useEffect(() => {
    ls.set('PROGUNS_ARMAS', armas)
  }, [armas])

  useEffect(() => {
    ls.set('PROGUNS_ORDENS', ordens)
    if (isSupabaseConfigured()) dbUpsertAll('ordens', ordens)
  }, [ordens])

  useEffect(() => {
    ls.set('PROGUNS_ORCAMENTOS', orcamentos)
    if (isSupabaseConfigured()) dbUpsertAll('orcamentos', orcamentos)
  }, [orcamentos])

  useEffect(() => {
    ls.set('PROGUNS_FINANCEIRO', financeiro)
    if (isSupabaseConfigured()) dbUpsertAll('financeiro', financeiro)
  }, [financeiro])

  // Sincronização entre abas do mesmo dispositivo
  useEffect(() => {
    if (isSupabaseConfigured()) return // Supabase já cuida disso
    let channel
    try {
      channel = new BroadcastChannel('PROGUNS_SYNC')
      channel.onmessage = (event) => {
        const { key, data } = event.data
        if (key === 'PROGUNS_ORDENS')     setOrdens(data)
        if (key === 'PROGUNS_CLIENTES')   setClientes(data)
        if (key === 'PROGUNS_ORCAMENTOS') setOrcamentos(data)
        if (key === 'PROGUNS_FINANCEIRO') setFinanceiro(data)
        if (key === 'PROGUNS_USUARIOS')   setUsuarios(data)
      }
    } catch (e) {}
    return () => { try { channel?.close() } catch (e) {} }
  }, [])

  const handleAtualizarConfig = (novosDados) => {
    setConfig(novosDados)
    ls.set('PROGUNS_CONFIG', novosDados)
  }

  // Verifica permissões
  useEffect(() => {
    if (!usuarioLogado || usuarioLogado.perfil === 'master') return
    const permissoes = usuarioLogado.permissoes || {}
    const reqMap = {
      clientes: 'ver_clientes', ordens: 'ver_ordens', orcamentos: 'ver_orcamentos',
      financeiro: 'ver_financeiro', usuarios: 'gerenciar_usuarios', configuracoes: 'ver_configuracoes'
    }
    const reqPerm = reqMap[activeTab]
    if (reqPerm && !permissoes[reqPerm]) {
      const disponiveis = Object.keys(reqMap)
      const primeiraLivre = disponiveis.find(tab => permissoes[reqMap[tab]]) || 'clientes'
      setActiveTab(primeiraLivre)
    }
  }, [usuarioLogado, activeTab])

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
      return null // sincronizado e idle: sem banner
    }

    // Modo local
    return (
      <div style={{ backgroundColor: 'rgba(120,90,20,0.15)', borderBottom: '1px solid rgba(212,175,55,0.2)', padding: '0.35rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.73rem', color: '#D4AF37', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={13} />
          <span><strong>MODO LOCAL:</strong> dados salvos apenas neste dispositivo. Para sincronizar entre dispositivos, conecte o Supabase em <strong>Configurações</strong>.</span>
        </div>
        <button
          onClick={() => {
            try {
              const ords = localStorage.getItem('PROGUNS_ORDENS')
              const clis = localStorage.getItem('PROGUNS_CLIENTES')
              if (ords) setOrdens(JSON.parse(ords))
              if (clis) setClientes(JSON.parse(clis))
            } catch (e) {}
          }}
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
        />

        <main style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'clientes' && (
            <ModuloClientes
              clientes={clientes} setClientes={setClientes}
              armas={armas} setArmas={setArmas}
              ordens={ordens} setOrdens={setOrdens}
              orcamentos={orcamentos} setOrcamentos={setOrcamentos}
              financeiro={financeiro} setFinanceiro={setFinanceiro}
              setActiveTab={setActiveTab}
              perfilOperador={usuarioLogado?.perfil || 'recepcao'}
              usuarioLogado={usuarioLogado}
              config={config}
            />
          )}

          {activeTab === 'ordens' && (
            <ModuloOrdens
              ordens={ordens} setOrdens={setOrdens}
              clientes={clientes}
              financeiro={financeiro} setFinanceiro={setFinanceiro}
              perfilOperador={usuarioLogado?.perfil || 'recepcao'}
              usuarioLogado={usuarioLogado}
              notificacoes={notificacoes} setNotificacoes={setNotificacoes}
              config={config}
            />
          )}

          {activeTab === 'orcamentos' && (
            <ModuloOrcamentos
              orcamentos={orcamentos} setOrcamentos={setOrcamentos}
              clientes={clientes}
              ordens={ordens} setOrdens={setOrdens}
              financeiro={financeiro} setFinanceiro={setFinanceiro}
              config={config}
            />
          )}

          {activeTab === 'financeiro' && (
            <ModuloFinanceiro
              financeiro={financeiro} setFinanceiro={setFinanceiro}
            />
          )}

          {activeTab === 'usuarios' && (
            <ModuloUsuarios
              usuarios={usuarios} setUsuarios={setUsuarios}
              usuarioLogado={usuarioLogado}
            />
          )}

          {activeTab === 'configuracoes' && (
            <ModuloConfiguracoes
              config={config} setConfig={handleAtualizarConfig}
            />
          )}
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
