import React, { useState } from 'react'
import {
  Search, Eye, Edit, Trash2, ArrowLeft, Plus, Phone, Mail, MapPin, Shield,
  UserCheck, Lock, Copy, FileText, DollarSign, Receipt, Calendar, MessageSquare,
  FileCheck, Crosshair, CheckCircle2
} from 'lucide-react'

export default function ModuloClientes({
  clientes,
  setClientes,
  armas,
  setArmas,
  ordens,
  setOrdens,
  orcamentos,
  setOrcamentos,
  financeiro,
  setFinanceiro
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCliente, setSelectedCliente] = useState(null)
  const [showModalNovoCliente, setShowModalNovoCliente] = useState(false)
  const [showModalArma, setShowModalArma] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState('os')

  // Modais de ações do perfil
  const [showModalGerarOS, setShowModalGerarOS] = useState(false)
  const [showModalGerarOrcamento, setShowModalGerarOrcamento] = useState(false)
  const [showModalRecibo, setShowModalRecibo] = useState(null)
  const [showModalDeclaracao, setShowModalDeclaracao] = useState(false)
  const [senhaCopiada, setSenhaCopiada] = useState(false)

  // Novo Cliente Form State
  const [novoCliente, setNovoCliente] = useState({
    nome_completo: '',
    cpf: '',
    rg: '',
    telefone: '',
    email: '',
    numero_cr: '',
    validade_cr: '',
    regiao_militar: '2ª RM',
    categorias: ['Atirador'],
    clube_filiado: 'CLUBE DE TIRO E CAÇA PRÓ TIRO (JATAÍ)',
    cidade: 'Jataí',
    uf: 'GO',
    senha_gov: 'Pradalto54*'
  })

  // Nova OS Form State
  const [novaOS, setNovaOS] = useState({
    tipo_servico: 'Autorização de Compra de Arma de Fogo',
    orgao_destino: 'Exército (SIGMA)',
    valor_servico: '450.00',
    valor_taxamento: '88.00',
    detalhes: ''
  })

  // Nova Arma Form State
  const [novaArma, setNovaArma] = useState({
    tipo: 'Pistola',
    marca: 'Glock',
    modelo: 'G17 Gen5',
    calibre: '9mm',
    numero_serie: '',
    numero_sigma_sinarm: '',
    orgao_registro: 'SIGMA',
    numero_craf: '',
    validade_craf: ''
  })

  const filteredClientes = clientes.filter(c =>
    c.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpf.includes(searchTerm)
  )

  const handleSalvarCliente = (e) => {
    e.preventDefault()
    if (!novoCliente.nome_completo || !novoCliente.cpf) return
    const created = {
      ...novoCliente,
      id: `c_${Date.now()}`,
      status: 'Ativo'
    }
    setClientes([created, ...clientes])
    setShowModalNovoCliente(false)
    setNovoCliente({
      nome_completo: '',
      cpf: '',
      rg: '',
      telefone: '',
      email: '',
      numero_cr: '',
      validade_cr: '',
      regiao_militar: '2ª RM',
      categorias: ['Atirador'],
      clube_filiado: 'CLUBE DE TIRO E CAÇA PRÓ TIRO (JATAÍ)',
      cidade: 'Jataí',
      uf: 'GO',
      senha_gov: 'Pradalto54*'
    })
  }

  const handleExcluirCliente = (clienteId, e) => {
    if (e) e.stopPropagation()
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      setClientes(clientes.filter(c => c.id !== clienteId))
      if (selectedCliente && selectedCliente.id === clienteId) {
        setSelectedCliente(null)
      }
    }
  }

  const handleSalvarOS = (e) => {
    e.preventDefault()
    if (!selectedCliente) return
    const created = {
      id: `o_${Date.now()}`,
      numero_os: 1000 + ordens.length + 1,
      cliente_id: selectedCliente.id,
      cliente_nome: selectedCliente.nome_completo,
      tipo_servico: novaOS.tipo_servico,
      orgao_destino: novaOS.orgao_destino,
      numero_protocolo: `2026.07.${Math.floor(1000 + Math.random() * 9000)}`,
      data_protocolo: new Date().toISOString().split('T')[0],
      valor_servico: parseFloat(novaOS.valor_servico) || 0,
      valor_taxamento: parseFloat(novaOS.valor_taxamento) || 0,
      status: 'Aguardando Doc',
      detalhes: novaOS.detalhes || 'Processo registrado.'
    }
    setOrdens([created, ...ordens])
    setShowModalGerarOS(false)
    alert(`Ordem de Serviço #${created.numero_os} gerada com sucesso!`)
  }

  const handleSalvarArma = (e) => {
    e.preventDefault()
    if (!novaArma.numero_serie || !selectedCliente) return
    const createdArma = {
      ...novaArma,
      id: `a_${Date.now()}`,
      cliente_id: selectedCliente.id,
      status: 'Regular'
    }
    setArmas([createdArma, ...armas])
    setShowModalArma(false)
  }

  const handleAbrirWhatsApp = (telefone) => {
    const limpo = (telefone || '').replace(/\D/g, '')
    const numero = limpo.length <= 11 ? `55${limpo}` : limpo
    window.open(`https://wa.me/${numero}`, '_blank')
  }

  const handleCopiarSenha = (senha) => {
    navigator.clipboard.writeText(senha || 'Pradalto54*')
    setSenhaCopiada(true)
    setTimeout(() => setSenhaCopiada(false), 2000)
  }

  // ==========================================
  // 1. TELA: PERFIL DO CLIENTE
  // ==========================================
  if (selectedCliente) {
    const ordensDoCliente = ordens.filter(o => o.cliente_id === selectedCliente.id || o.cliente_nome === selectedCliente.nome_completo)
    const orcamentosDoCliente = orcamentos.filter(o => o.cliente_id === selectedCliente.id || o.cliente_nome === selectedCliente.nome_completo)
    const armasDoCliente = armas.filter(a => a.cliente_id === selectedCliente.id)

    return (
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Top Header Perfil */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSelectedCliente(null)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {selectedCliente.nome_completo.toUpperCase()}
                </h1>
                <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                  NÃO CADASTRADO NO PORTAL GCAC
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Perfil do Cliente</div>
            </div>
          </div>

          {/* Botões Superiores de Ação do Perfil */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}>
              <Edit size={14} /> <span>EDITAR CADASTRO</span>
            </button>
            <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem', color: '#60A5FA' }}>
              <UserCheck size={14} /> <span>CONVIDAR PARA PORTAL</span>
            </button>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem', color: '#F87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              onClick={(e) => handleExcluirCliente(selectedCliente.id, e)}
            >
              <Trash2 size={14} /> <span>EXCLUIR CLIENTE</span>
            </button>
          </div>
        </div>

        {/* Grid Principal do Perfil */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Coluna Esquerda: Informações & Gov.br */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Card Informações Pessoais */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', paddingBottom: '0.6rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                  INFORMAÇÕES PESSOAIS
                </span>
                <Shield size={16} color="var(--text-muted)" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>NOME COMPLETO</div>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)', marginTop: '0.15rem' }}>{selectedCliente.nome_completo.toUpperCase()}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>CPF</div>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '0.15rem' }}>{selectedCliente.cpf}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>TELEFONE</div>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '0.15rem' }}>{selectedCliente.telefone}</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>CLUBE DE TIRO E CAÇA FILIADO</div>
                  <div style={{ fontWeight: '700', color: '#34D399', marginTop: '0.15rem', fontSize: '0.82rem' }}>
                    {selectedCliente.clube_filiado || 'CLUBE DE TIRO E CAÇA PRÓ TIRO (JATAÍ)'}
                  </div>
                </div>

                {selectedCliente.numero_cr && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>CR</div>
                      <div style={{ fontWeight: '700', color: '#FBBF24', marginTop: '0.15rem' }}>{selectedCliente.numero_cr}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>VALIDADE</div>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '0.15rem' }}>{selectedCliente.validade_cr || 'N/A'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card Acesso Gov.br */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Lock size={16} color="#60A5FA" />
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#60A5FA', letterSpacing: '0.5px' }}>
                    ACESSO GOV.BR
                  </span>
                </div>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}
                  onClick={() => handleCopiarSenha(selectedCliente.senha_gov)}
                >
                  <Copy size={12} />
                  <span>{senhaCopiada ? 'Copiado!' : 'COPIAR SENHA'}</span>
                </button>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                textAlign: 'center',
                fontFamily: 'monospace',
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#60A5FA',
                letterSpacing: '1px'
              }}>
                {selectedCliente.senha_gov || 'Pradalto54*'}
              </div>
            </div>
          </div>

          {/* Coluna Direita: Balões de Ações Rápidas & Histórico em Abas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Grid dos Balões de Ações Rápidas (Estilo Portal GCAC) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
              {/* Balão 1: GERAR O.S. */}
              <button
                onClick={() => setShowModalGerarOS(true)}
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '10px',
                  padding: '1.1rem 0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <FileText size={24} color="#60A5FA" />
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#60A5FA', letterSpacing: '0.5px' }}>
                  GERAR O.S.
                </span>
              </button>

              {/* Balão 2: GERAR ORÇAMENTO */}
              <button
                onClick={() => setShowModalGerarOrcamento(true)}
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '10px',
                  padding: '1.1rem 0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <DollarSign size={24} color="#FBBF24" />
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#FBBF24', letterSpacing: '0.5px' }}>
                  GERAR ORÇAMENTO
                </span>
              </button>

              {/* Balão 3: GERAR RECIBO */}
              <button
                onClick={() => setShowModalRecibo({ valor: '450,00', descricao: 'Serviços de Despachantaria Bélica' })}
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  padding: '1.1rem 0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Receipt size={24} color="#34D399" />
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#34D399', letterSpacing: '0.5px' }}>
                  GERAR RECIBO
                </span>
              </button>

              {/* Balão 4: AGENDAR LAUDO */}
              <button
                onClick={() => alert('Agendamento de laudo iniciado.')}
                style={{
                  backgroundColor: 'rgba(139, 92, 246, 0.12)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '10px',
                  padding: '1.1rem 0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Calendar size={24} color="#A78BFA" />
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#A78BFA', letterSpacing: '0.5px' }}>
                  AGENDAR LAUDO
                </span>
              </button>

              {/* Balão 5: INICIAR CONVERSA (WhatsApp Direct) */}
              <button
                onClick={() => handleAbrirWhatsApp(selectedCliente.telefone)}
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.18)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  borderRadius: '10px',
                  padding: '1.1rem 0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <MessageSquare size={24} color="#4ADE80" />
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#4ADE80', letterSpacing: '0.5px' }}>
                  INICIAR CONVERSA
                </span>
              </button>

              {/* Balão 6: GERAR DECLARAÇÃO */}
              <button
                onClick={() => setShowModalDeclaracao(true)}
                style={{
                  backgroundColor: 'rgba(30, 58, 138, 0.25)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '10px',
                  padding: '1.1rem 0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <FileCheck size={24} color="#93C5FD" />
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#93C5FD', letterSpacing: '0.5px' }}>
                  GERAR DECLARAÇÃO
                </span>
              </button>
            </div>

            {/* Container de Abas (O.S., ORÇAMENTOS, RECIBOS, AGENDAMENTOS, ACERVO & DOCS, HAVER) */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                overflowX: 'auto'
              }}>
                {[
                  { id: 'os', label: 'O.S.', count: ordensDoCliente.length },
                  { id: 'orcamentos', label: 'ORÇAMENTOS', count: orcamentosDoCliente.length },
                  { id: 'recibos', label: 'RECIBOS', count: 0 },
                  { id: 'agendamentos', label: 'AGENDAMENTOS', count: 0 },
                  { id: 'acervo', label: 'ACERVO & DOCS', count: armasDoCliente.length },
                  { id: 'haver', label: 'HAVER', count: 0 }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    style={{
                      padding: '0.85rem 1.1rem',
                      border: 'none',
                      backgroundColor: activeSubTab === tab.id ? 'var(--bg-card)' : 'transparent',
                      color: activeSubTab === tab.id ? '#60A5FA' : 'var(--text-muted)',
                      borderBottom: activeSubTab === tab.id ? '2px solid #60A5FA' : '2px solid transparent',
                      fontWeight: activeSubTab === tab.id ? '700' : '500',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '10px',
                        backgroundColor: activeSubTab === tab.id ? '#60A5FA' : 'var(--border-color)',
                        color: activeSubTab === tab.id ? '#0A0A0C' : 'var(--text-main)',
                        fontWeight: '700'
                      }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Conteúdo da Aba Ativa */}
              <div style={{ padding: '1.25rem' }}>
                {activeSubTab === 'os' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)' }}>ORDENS EM ABERTO</span>
                      <button
                        style={{ background: 'none', border: 'none', color: '#60A5FA', fontSize: '0.78rem', cursor: 'pointer', fontWeight: '600' }}
                        onClick={() => setShowModalGerarOS(true)}
                      >
                        + Nova Ordem de Serviço
                      </button>
                    </div>

                    {ordensDoCliente.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                        Não há ordens de serviço em aberto para este cliente.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {ordensDoCliente.map(o => (
                          <div key={o.id} style={{ padding: '0.85rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: '700', color: 'var(--gold-primary)', fontSize: '0.85rem' }}>
                                OS #{o.numero_os} - {o.tipo_servico}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                Prot: {o.numero_protocolo || 'Pendente'} ({o.orgao_destino})
                              </div>
                            </div>
                            <span className="badge badge-yellow">{o.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeSubTab === 'orcamentos' && (
                  <div>
                    {orcamentosDoCliente.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                        Nenhum orçamento cadastrado para este cliente.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {orcamentosDoCliente.map(orc => (
                          <div key={orc.id} style={{ padding: '0.85rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: '700', color: '#FBBF24', fontSize: '0.85rem' }}>
                                Orçamento #{orc.numero_orcamento} - R$ {orc.valor_final.toFixed(2)}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                Pagto: {orc.forma_pagamento}
                              </div>
                            </div>
                            <span className={`badge ${orc.status === 'Aprovado' ? 'badge-green' : 'badge-yellow'}`}>{orc.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeSubTab === 'acervo' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)' }}>ARMAS CADASTRADAS NO ACERVO</span>
                      <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setShowModalArma(true)}>
                        + Adicionar Arma
                      </button>
                    </div>

                    {armasDoCliente.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                        Nenhuma arma cadastrada neste acervo.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                              <th style={{ padding: '0.6rem' }}>TIPO</th>
                              <th style={{ padding: '0.6rem' }}>MARCA / MODELO</th>
                              <th style={{ padding: '0.6rem' }}>CALIBRE</th>
                              <th style={{ padding: '0.6rem' }}>N° SÉRIE</th>
                              <th style={{ padding: '0.6rem' }}>REGISTRO</th>
                            </tr>
                          </thead>
                          <tbody>
                            {armasDoCliente.map(arma => (
                              <tr key={arma.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.6rem', fontWeight: '600' }}>{arma.tipo}</td>
                                <td style={{ padding: '0.6rem' }}>{arma.marca} {arma.modelo}</td>
                                <td style={{ padding: '0.6rem', color: '#FBBF24' }}>{arma.calibre}</td>
                                <td style={{ padding: '0.6rem' }}>{arma.numero_serie}</td>
                                <td style={{ padding: '0.6rem' }}>{arma.numero_sigma_sinarm || 'SIGMA'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {(activeSubTab === 'recibos' || activeSubTab === 'agendamentos' || activeSubTab === 'haver') && (
                  <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    Nenhum registro encontrado nesta aba.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Gerar OS no Perfil */}
        {showModalGerarOS && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#60A5FA', marginBottom: '1rem' }}>Gerar Ordem de Serviço para {selectedCliente.nome_completo}</h3>
              <form onSubmit={handleSalvarOS} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tipo de Serviço / Processo</label>
                  <select className="input-field" value={novaOS.tipo_servico} onChange={e => setNovaOS({...novaOS, tipo_servico: e.target.value})}>
                    <option value="Autorização de Compra de Arma de Fogo">Autorização de Compra de Arma de Fogo</option>
                    <option value="Concessão de CR (Primeiro CR)">Concessão de CR (Primeiro CR)</option>
                    <option value="Renovação de CR">Renovação de CR</option>
                    <option value="Emissão de CRAF">Emissão de CRAF</option>
                    <option value="Guia de Tráfego (GT)">Guia de Tráfego (GT)</option>
                    <option value="Transferência de Propriedade">Transferência de Propriedade</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Órgão Destino</label>
                    <select className="input-field" value={novaOS.orgao_destino} onChange={e => setNovaOS({...novaOS, orgao_destino: e.target.value})}>
                      <option value="Exército (SIGMA)">Exército (SIGMA)</option>
                      <option value="Polícia Federal (SINARM)">Polícia Federal (SINARM)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Valor Serviço (R$)</label>
                    <input className="input-field" type="number" value={novaOS.valor_servico} onChange={e => setNovaOS({...novaOS, valor_servico: e.target.value})} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowModalGerarOS(false)}>Cancelar</button>
                  <button type="submit" className="btn-gold">Gerar O.S.</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Recibo Impressão */}
        {showModalRecibo && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '550px', backgroundColor: '#fff', color: '#000' }}>
              <div className="print-area">
                <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: '800', fontFamily: 'Cinzel, serif' }}>PRÓ GUNS ARMERIA</h2>
                  <div style={{ fontSize: '0.8rem' }}>RECIBO DE PAGAMENTO DE SERVIÇOS</div>
                </div>
                <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                  Recebemos de <strong>{selectedCliente.nome_completo}</strong> (CPF: {selectedCliente.cpf}) a quantia de <strong>R$ {showModalRecibo.valor}</strong> referente a {showModalRecibo.descricao}.
                </p>
                <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.8rem' }}>
                  <div style={{ borderTop: '1px solid #000', width: '220px', margin: '0 auto', paddingTop: '0.3rem' }}>
                    Pró Guns Armeria & Despachantaria
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.2rem' }}>
                <button className="btn-secondary" onClick={() => setShowModalRecibo(null)}>Fechar</button>
                <button className="btn-gold" onClick={() => window.print()}>Imprimir Recibo</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ==========================================
  // 2. TELA: LISTA "MEUS CLIENTES" (ESTILO GCAC)
  // ==========================================
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserCheck size={26} color="#60A5FA" />
            <span>Meus Clientes</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Gerencie a agenda de contatos para preenchimento rápido nas O.S.
          </p>
        </div>

        <button className="btn-gold" onClick={() => setShowModalNovoCliente(true)}>
          <Plus size={18} />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Tabela Principal "Meus Clientes" */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Barra de Pesquisa */}
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>

        {/* Tabela de Clientes */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>NOME / CPF</th>
                <th style={{ padding: '0.85rem 1rem' }}>CONTATO</th>
                <th style={{ padding: '0.85rem 1rem' }}>CLUBE FILIADO</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map(cliente => (
                <tr
                  key={cliente.id}
                  onClick={() => setSelectedCliente(cliente)}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                      {cliente.nome_completo.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {cliente.cpf}
                    </div>
                  </td>

                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                    {cliente.telefone}
                  </td>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: 'rgba(19, 70, 51, 0.3)',
                        color: '#34D399',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {cliente.clube_filiado || 'CLUBE DE TIRO E C...'}
                    </span>
                  </td>

                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.6rem' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        onClick={() => setSelectedCliente(cliente)}
                        title="Ver Perfil do Cliente"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        onClick={() => setSelectedCliente(cliente)}
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}
                        onClick={(e) => handleExcluirCliente(cliente.id, e)}
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Cliente */}
      {showModalNovoCliente && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#60A5FA', marginBottom: '1rem' }}>Novo Cliente / Contato</h3>
            <form onSubmit={handleSalvarCliente} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nome Completo *</label>
                <input required className="input-field" value={novoCliente.nome_completo} onChange={e => setNovoCliente({...novoCliente, nome_completo: e.target.value})} placeholder="ADALTO NUNES DE SOUZA" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CPF *</label>
                  <input required className="input-field" value={novoCliente.cpf} onChange={e => setNovoCliente({...novoCliente, cpf: e.target.value})} placeholder="130.443.701-91" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Telefone (WhatsApp) *</label>
                  <input required className="input-field" value={novoCliente.telefone} onChange={e => setNovoCliente({...novoCliente, telefone: e.target.value})} placeholder="(64) 99968-2860" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Clube de Tiro Filiado</label>
                <input className="input-field" value={novoCliente.clube_filiado} onChange={e => setNovoCliente({...novoCliente, clube_filiado: e.target.value})} placeholder="CLUBE DE TIRO E CAÇA PRÓ TIRO (JATAÍ)" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Senha Gov.br</label>
                  <input className="input-field" value={novoCliente.senha_gov} onChange={e => setNovoCliente({...novoCliente, senha_gov: e.target.value})} placeholder="Pradalto54*" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>N° do CR</label>
                  <input className="input-field" value={novoCliente.numero_cr} onChange={e => setNovoCliente({...novoCliente, numero_cr: e.target.value})} placeholder="123456/2ª RM" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModalNovoCliente(false)}>Cancelar</button>
                <button type="submit" className="btn-gold">Salvar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
