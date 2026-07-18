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

  // Lista de Usuários e Usuário Logado Autenticado
  const [usuarios, setUsuarios] = useState(INITIAL_USUARIOS)

  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    const saved = localStorage.getItem('PROGUNS_AUTH_USER')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { return null }
    }
    return null // Por padrão inicia deslogado exigindo CPF e Senha
  })

  const [modalLoginAberto, setModalLoginAberto] = useState(false)

  const handleLogoff = () => {
    localStorage.removeItem('PROGUNS_AUTH_USER')
    setUsuarioLogado(null)
  }

  // Configurações Institucionais da Armeria com Persistência em LocalStorage
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('PROGUNS_CONFIG')
    return saved ? JSON.parse(saved) : INITIAL_CONFIG
  })

  const handleAtualizarConfig = (novosDados) => {
    setConfig(novosDados)
    localStorage.setItem('PROGUNS_CONFIG', JSON.stringify(novosDados))
  }

  // Central de Notificações / Alertas da Recepção
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

  // Data state
  const [clientes, setClientes] = useState(INITIAL_CLIENTES)
  const [armas, setArmas] = useState(INITIAL_ARMAS)
  const [ordens, setOrdens] = useState(INITIAL_ORDENS)
  const [orcamentos, setOrcamentos] = useState(INITIAL_ORCAMENTOS)
  const [financeiro, setFinanceiro] = useState(INITIAL_FINANCEIRO)

  // Verifica se o usuário logado possui permissão para acessar a aba atual. Se não, redireciona.
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
      />

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          usuarioLogado={usuarioLogado}
          config={config}
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
