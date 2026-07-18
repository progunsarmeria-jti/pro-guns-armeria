import React, { useState } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import ModuloClientes from './components/ModuloClientes'
import ModuloOrdens from './components/ModuloOrdens'
import ModuloOrcamentos from './components/ModuloOrcamentos'
import ModuloFinanceiro from './components/ModuloFinanceiro'
import ModuloConfiguracoes from './components/ModuloConfiguracoes'

import {
  INITIAL_CLIENTES,
  INITIAL_ARMAS,
  INITIAL_ORDENS,
  INITIAL_ORCAMENTOS,
  INITIAL_FINANCEIRO,
  INITIAL_CONFIG
} from './lib/initialData'

export default function App() {
  const [activeTab, setActiveTab] = useState('clientes')

  // Perfil de Acesso Ativo ('recepcao' | 'armeiro')
  const [perfilOperador, setPerfilOperador] = useState('recepcao')

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar
        activeTab={activeTab}
        perfilOperador={perfilOperador}
        setPerfilOperador={setPerfilOperador}
        notificacoes={notificacoes}
        setNotificacoes={setNotificacoes}
        setActiveTab={setActiveTab}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

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
              perfilOperador={perfilOperador}
            />
          )}

          {activeTab === 'ordens' && (
            <ModuloOrdens
              ordens={ordens}
              setOrdens={setOrdens}
              clientes={clientes}
              financeiro={financeiro}
              setFinanceiro={setFinanceiro}
              perfilOperador={perfilOperador}
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

          {activeTab === 'configuracoes' && (
            <ModuloConfiguracoes
              config={config}
              setConfig={setConfig}
            />
          )}
        </main>
      </div>
    </div>
  )
}
