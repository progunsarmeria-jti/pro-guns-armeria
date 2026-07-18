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

  // Lista de Usuários e Usuário Logado
  const [usuarios, setUsuarios] = useState(INITIAL_USUARIOS)
  const [usuarioLogado, setUsuarioLogado] = useState(INITIAL_USUARIOS[0]) // Admin Master por padrão
  const [modalLoginAberto, setModalLoginAberto] = useState(false)

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
  const [config, setConfig] = useState(INITIAL_CONFIG)

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
      // Procura a primeira aba permitida
      const disponiveis = ['clientes', 'ordens', 'orcamentos', 'financeiro', 'usuarios', 'configuracoes']
      const primeiraLivre = disponiveis.find(tab => permissoes[reqMap[tab]]) || 'clientes'
      setActiveTab(primeiraLivre)
    }
  }, [usuarioLogado, activeTab])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar
        activeTab={activeTab}
        usuarioLogado={usuarioLogado}
        setModalLoginAberto={setModalLoginAberto}
        notificacoes={notificacoes}
        setNotificacoes={setNotificacoes}
        setActiveTab={setActiveTab}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          usuarioLogado={usuarioLogado}
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
              setConfig={setConfig}
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
        />
      )}
    </div>
  )
}
