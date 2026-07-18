import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import ModuloClientes from './components/ModuloClientes'
import ModuloOrdens from './components/ModuloOrdens'
import ModuloOrcamentos from './components/ModuloOrcamentos'
import ModuloFinanceiro from './components/ModuloFinanceiro'
import ModuloConfiguracoes from './components/ModuloConfiguracoes'
import ModuloUsuarios from './components/ModuloUsuarios'
import ModalLogin from './components/ModalLogin'

import {
  INITIAL_USUARIOS,
  INITIAL_CLIENTES,
  INITIAL_ARMAS,
  INITIAL_ORDENS,
  INITIAL_ORCAMENTOS,
  INITIAL_FINANCEIRO,
  INITIAL_CONFIG
} from './lib/initialData'

export default function App() {
  const [activeTab, setActiveTab] = useState('clientes')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // 1. USUÁRIOS COM PERSISTÊNCIA EM LOCALSTORAGE
  const [usuarios, setUsuarios] = useState(() => {
    const saved = localStorage.getItem('PROGUNS_USUARIOS')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { return INITIAL_USUARIOS }
    }
    return INITIAL_USUARIOS
  })

  // 2. USUÁRIO LOGADO SESSÃO
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    const saved = localStorage.getItem('PROGUNS_AUTH_USER')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { return null }
    }
    return null
  })

  const [modalLoginAberto, setModalLoginAberto] = useState(false)

  const handleLogoff = () => {
    localStorage.removeItem('PROGUNS_AUTH_USER')
    setUsuarioLogado(null)
  }

  // 3. CONFIGURAÇÕES INSTITUCIONAIS COM PERSISTÊNCIA
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('PROGUNS_CONFIG')
    return saved ? JSON.parse(saved) : INITIAL_CONFIG
  })

  const handleAtualizarConfig = (novosDados) => {
    setConfig(novosDados)
    localStorage.setItem('PROGUNS_CONFIG', JSON.stringify(novosDados))
  }

  // 4. CENTRAL DE NOTIFICAÇÕES
  const [notificacoes, setNotificacoes] = useState([
    {
      id: 'n1',
      os_numero: 1002,
      cliente_nome: 'ROBERTO ALVES MENDES',
      mensagem: 'Armeiro concluiu o laudo técnico da Carabina Rossi. Aguardando contato para aprovação com cliente.',
      tipo: 'LAUDO_PRONTO',
      lida: false,
      created_at: 'Há 10 min'
    }
  ])

  // 5. CLIENTES COM PERSISTÊNCIA EM LOCALSTORAGE
  const [clientes, setClientes] = useState(() => {
    const saved = localStorage.getItem('PROGUNS_CLIENTES')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { return INITIAL_CLIENTES }
    }
    return INITIAL_CLIENTES
  })

  // 6. ARMAS COM PERSISTÊNCIA EM LOCALSTORAGE
  const [armas, setArmas] = useState(() => {
    const saved = localStorage.getItem('PROGUNS_ARMAS')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { return INITIAL_ARMAS }
    }
    return INITIAL_ARMAS
  })

  // 7. ORDENS DE SERVIÇO (O.S.) COM PERSISTÊNCIA EM LOCALSTORAGE
  const [ordens, setOrdens] = useState(() => {
    const saved = localStorage.getItem('PROGUNS_ORDENS')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { return INITIAL_ORDENS }
    }
    return INITIAL_ORDENS
  })

  // 8. ORÇAMENTOS COM PERSISTÊNCIA EM LOCALSTORAGE
  const [orcamentos, setOrcamentos] = useState(() => {
    const saved = localStorage.getItem('PROGUNS_ORCAMENTOS')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { return INITIAL_ORCAMENTOS }
    }
    return INITIAL_ORCAMENTOS
  })

  // 9. FINANCEIRO COM PERSISTÊNCIA EM LOCALSTORAGE
  const [financeiro, setFinanceiro] = useState(() => {
    const saved = localStorage.getItem('PROGUNS_FINANCEIRO')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { return INITIAL_FINANCEIRO }
    }
    return INITIAL_FINANCEIRO
  })

  // =========================================================
  // HOOKS DE SINCRONIZAÇÃO AUTOMÁTICA EM TEMPO REAL NO BROWSER
  // =========================================================
  useEffect(() => {
    localStorage.setItem('PROGUNS_USUARIOS', JSON.stringify(usuarios))
  }, [usuarios])

  useEffect(() => {
    localStorage.setItem('PROGUNS_CLIENTES', JSON.stringify(clientes))
  }, [clientes])

  useEffect(() => {
    localStorage.setItem('PROGUNS_ARMAS', JSON.stringify(armas))
  }, [armas])

  useEffect(() => {
    localStorage.setItem('PROGUNS_ORDENS', JSON.stringify(ordens))
  }, [ordens])

  useEffect(() => {
    localStorage.setItem('PROGUNS_ORCAMENTOS', JSON.stringify(orcamentos))
  }, [orcamentos])

  useEffect(() => {
    localStorage.setItem('PROGUNS_FINANCEIRO', JSON.stringify(financeiro))
  }, [financeiro])

  // Verifica permissões do usuário
  useEffect(() => {
    if (!usuarioLogado) return
    if (usuarioLogado.perfil === 'master') return

    const permissoes = usuarioLogado.permissoes || {}
    const reqMap = {
      clientes: 'ver_clientes',
      ordens: 'ver_ordens',
      orcamentos: 'ver_orcamentos',
      financeiro: 'ver_financeiro',
      usuarios: 'gerenciar_usuarios',
      configuracoes: 'ver_configuracoes'
    }

    const reqPerm = reqMap[activeTab]
    if (reqPerm && !permissoes[reqPerm]) {
      const disponiveis = ['clientes', 'ordens', 'orcamentos', 'financeiro', 'usuarios', 'configuracoes']
      const primeiraLivre = disponiveis.find(tab => permissoes[reqMap[tab]]) || 'clientes'
      setActiveTab(primeiraLivre)
    }
  }, [usuarioLogado, activeTab])

  // TELA DE LOGIN OBRIGATÓRIA CASO NÃO ESTEJA AUTENTICADO
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

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          usuarioLogado={usuarioLogado}
          config={config}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

        <main style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'clientes' && (
            <ModuloClientes
              clientes={clientes}
              setClientes={setClientes}
              armas={armas}
              setArmas={setArmas}
              ordens={ordens}
              setOrdens={setOrdens}
              orcamentos={orcamentos}
              setOrcamentos={setOrcamentos}
              financeiro={financeiro}
              setFinanceiro={setFinanceiro}
              setActiveTab={setActiveTab}
              perfilOperador={usuarioLogado?.perfil || 'recepcao'}
              usuarioLogado={usuarioLogado}
              config={config}
            />
          )}

          {activeTab === 'ordens' && (
            <ModuloOrdens
              ordens={ordens}
              setOrdens={setOrdens}
              clientes={clientes}
              financeiro={financeiro}
              setFinanceiro={setFinanceiro}
              perfilOperador={usuarioLogado?.perfil || 'recepcao'}
              usuarioLogado={usuarioLogado}
              notificacoes={notificacoes}
              setNotificacoes={setNotificacoes}
              config={config}
            />
          )}

          {activeTab === 'orcamentos' && (
            <ModuloOrcamentos
              orcamentos={orcamentos}
              setOrcamentos={setOrcamentos}
              clientes={clientes}
              ordens={ordens}
              setOrdens={setOrdens}
              financeiro={financeiro}
              setFinanceiro={setFinanceiro}
              config={config}
            />
          )}

          {activeTab === 'financeiro' && (
            <ModuloFinanceiro
              financeiro={financeiro}
              setFinanceiro={setFinanceiro}
            />
          )}

          {activeTab === 'usuarios' && (
            <ModuloUsuarios
              usuarios={usuarios}
              setUsuarios={setUsuarios}
              usuarioLogado={usuarioLogado}
            />
          )}

          {activeTab === 'configuracoes' && (
            <ModuloConfiguracoes
              config={config}
              setConfig={handleAtualizarConfig}
            />
          )}
        </main>
      </div>

      {/* Modal de Autenticação / Troca de Operador */}
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
