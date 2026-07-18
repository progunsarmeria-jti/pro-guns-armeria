import React, { useState } from 'react'
import {
  Search, Eye, Edit, Trash2, ArrowLeft, Plus, Phone, Mail, MapPin, Shield,
  FileText, DollarSign, Receipt, MessageCircle, History, Calendar, Award, Printer, X
} from 'lucide-react'
import ModalNovaOSArmeria from './ModalNovaOSArmeria'

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
  setFinanceiro,
  config
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCliente, setSelectedCliente] = useState(null)
  const [showModalNovoCliente, setShowModalNovoCliente] = useState(false)
  const [showModalEditarCliente, setShowModalEditarCliente] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState('os')
  const [mostrarHistoricoOS, setMostrarHistoricoOS] = useState(false)

  // Modais de ações do perfil
  const [showModalGerarOS, setShowModalGerarOS] = useState(false)
  const [showModalGerarOrcamento, setShowModalGerarOrcamento] = useState(false)
  const [showModalRecibo, setShowModalRecibo] = useState(null)
  const [modalVerOSDetalhes, setModalVerOSDetalhes] = useState(null)

  // Lista de Opções de Atividades Apostiladas (Sem Recarga de Munição)
  const OPCOES_ATIVIDADES = [
    'Atirador Desportivo',
    'Caçador Excepcional',
    'Colecionador'
  ]

  // Form State do Cliente (Novo & Editar)
  const [clienteForm, setClienteForm] = useState({
    nome_completo: '',
    cpf: '',
    rg: '',
    telefone: '',
    email: '',
    data_nascimento: '',
    endereco: '',
    cidade: '',
    uf: 'SP',
    numero_cr: '',
    data_emissao_cr: '',
    validade_cr: '',
    atividades_apostiladas: ['Atirador Desportivo']
  })

  const filteredClientes = clientes.filter(c =>
    c.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpf.includes(searchTerm)
  )

  const handleToggleAtividade = (atv) => {
    const atvas = clienteForm.atividades_apostiladas || []
    if (atvas.includes(atv)) {
      setClienteForm({ ...clienteForm, atividades_apostiladas: atvas.filter(a => a !== atv) })
    } else {
      setClienteForm({ ...clienteForm, atividades_apostiladas: [...atvas, atv] })
    }
  }

  const handleSalvarNovoCliente = (e) => {
    e.preventDefault()
    if (!clienteForm.nome_completo || !clienteForm.cpf) return
    const created = {
      ...clienteForm,
      id: `c_${Date.now()}`,
      status: 'Ativo'
    }
    setClientes([created, ...clientes])
    setShowModalNovoCliente(false)
    resetForm()
  }

  const handleSalvarEditarCliente = (e) => {
    e.preventDefault()
    if (!selectedCliente || !clienteForm.nome_completo) return
    const updated = {
      ...selectedCliente,
      ...clienteForm
    }
    setClientes(clientes.map(c => c.id === selectedCliente.id ? updated : c))
    setSelectedCliente(updated)
    setShowModalEditarCliente(false)
    alert('Cadastro do cliente atualizado com sucesso!')
  }

  const handleAbrirEditar = (cliente) => {
    setClienteForm({
      nome_completo: cliente.nome_completo || '',
      cpf: cliente.cpf || '',
      rg: cliente.rg || '',
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      data_nascimento: cliente.data_nascimento || '',
      endereco: cliente.endereco || '',
      cidade: cliente.cidade || '',
      uf: cliente.uf || 'SP',
      numero_cr: cliente.numero_cr || '',
      data_emissao_cr: cliente.data_emissao_cr || '',
      validade_cr: cliente.validade_cr || '',
      atividades_apostiladas: (cliente.atividades_apostiladas || ['Atirador Desportivo']).filter(a => a !== 'Recarga de Munição')
    })
    setShowModalEditarCliente(true)
  }

  const resetForm = () => {
    setClienteForm({
      nome_completo: '',
      cpf: '',
      rg: '',
      telefone: '',
      email: '',
      data_nascimento: '',
      endereco: '',
      cidade: '',
      uf: 'SP',
      numero_cr: '',
      data_emissao_cr: '',
      validade_cr: '',
      atividades_apostiladas: ['Atirador Desportivo']
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

  const handleAbrirWhatsApp = (telefone) => {
    const limpo = (telefone || '').replace(/\D/g, '')
    const numero = limpo.length <= 11 ? `55${limpo}` : limpo
    window.open(`https://wa.me/${numero}`, '_blank')
  }

  // ==========================================
  // 1. TELA: PERFIL DO CLIENTE
  // ==========================================
  if (selectedCliente) {
    const ordensDoCliente = ordens.filter(o => o.cliente_id === selectedCliente.id || o.cliente_nome === selectedCliente.nome_completo)
    const orcamentosDoCliente = orcamentos.filter(o => o.cliente_id === selectedCliente.id || o.cliente_nome === selectedCliente.nome_completo)

    // Filtros de O.S. Em Aberto vs Histórico (Concluídos)
    const ordensEmAberto = ordensDoCliente.filter(o => o.status !== 'CONCLUÍDO')
    const ordensHistorico = ordensDoCliente.filter(o => o.status === 'CONCLUÍDO')

    const ordensExibidas = mostrarHistoricoOS ? ordensHistorico : ordensEmAberto

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
              <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {selectedCliente.nome_completo.toUpperCase()}
              </h1>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Perfil do Cliente — {config?.nome_fantasia || 'Pró Guns Armeria'}</div>
            </div>
          </div>

          {/* Botões Superiores de Ação do Perfil */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', cursor: 'pointer' }}
              onClick={() => handleAbrirEditar(selectedCliente)}
            >
              <Edit size={14} /> <span>EDITAR CADASTRO</span>
            </button>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', color: '#F87171', borderColor: 'rgba(239, 68, 68, 0.3)', cursor: 'pointer' }}
              onClick={(e) => handleExcluirCliente(selectedCliente.id, e)}
            >
              <Trash2 size={14} /> <span>EXCLUIR CLIENTE</span>
            </button>
          </div>
        </div>

        {/* Grid Principal do Perfil */}
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Coluna Esquerda: Informações Pessoais & Dados de CR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', paddingBottom: '0.6rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                  INFORMAÇÕES PESSOAIS & LEGISLAÇÃO
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
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>DATA NASCIMENTO</div>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '0.15rem' }}>{selectedCliente.data_nascimento || 'N/A'}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>TELEFONE</div>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '0.15rem' }}>{selectedCliente.telefone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>E-MAIL</div>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '0.15rem' }}>{selectedCliente.email || 'N/A'}</div>
                  </div>
                </div>

                {/* Campo de Endereço */}
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>ENDEREÇO COMPLETO</div>
                  <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={14} color="#60A5FA" />
                    <span>{selectedCliente.endereco || 'Não informado'}</span>
                    {selectedCliente.cidade && <span>({selectedCliente.cidade} - {selectedCliente.uf})</span>}
                  </div>
                </div>

                {/* DADOS DO CR */}
                <div style={{ paddingTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>NÚMERO DO CR</div>
                      <div style={{ fontWeight: '700', color: '#FBBF24', marginTop: '0.15rem' }}>{selectedCliente.numero_cr || 'Sem CR'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>EMISSÃO DO CR</div>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '0.15rem' }}>{selectedCliente.data_emissao_cr || 'N/A'}</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>VALIDADE DO CR</div>
                    <div style={{ fontWeight: '700', color: '#34D399', marginTop: '0.15rem' }}>{selectedCliente.validade_cr || 'N/A'}</div>
                  </div>

                  {/* ATIVIDADES APOSTILADAS NO CR */}
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.3rem' }}>
                      ATIVIDADES APOSTILADAS NO CR
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {selectedCliente.atividades_apostiladas && selectedCliente.atividades_apostiladas.filter(a => a !== 'Recarga de Munição').length > 0 ? (
                        selectedCliente.atividades_apostiladas.filter(a => a !== 'Recarga de Munição').map(atv => (
                          <span key={atv} className="badge badge-green" style={{ fontSize: '0.7rem' }}>{atv}</span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nenhuma atividade cadastrada</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Balões de Ações Rápidas & Histórico de O.S. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Grid dos Balões de Ações Rápidas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              {/* Balão 1: GERAR O.S. DE ARMERIA */}
              <button
                onClick={() => setShowModalGerarOS(true)}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '10px',
                  padding: '1.2rem 0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <FileText size={26} color="#F87171" />
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#F87171', letterSpacing: '0.5px' }}>
                  DAR ENTRADA NA O.S.
                </span>
              </button>

              {/* Balão 2: GERAR ORÇAMENTO */}
              <button
                onClick={() => setShowModalGerarOrcamento(true)}
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '10px',
                  padding: '1.2rem 0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <DollarSign size={26} color="#FBBF24" />
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#FBBF24', letterSpacing: '0.5px' }}>
                  GERAR ORÇAMENTO
                </span>
              </button>

              {/* Balão 3: GERAR RECIBO */}
              <button
                onClick={() => setShowModalRecibo({ valor: '450,00', descricao: 'Serviços de Manutenção e Armeria' })}
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  padding: '1.2rem 0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Receipt size={26} color="#34D399" />
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#34D399', letterSpacing: '0.5px' }}>
                  GERAR RECIBO
                </span>
              </button>

              {/* Balão 4: INICIAR CONVERSA (WHATSAPP) */}
              <button
                onClick={() => handleAbrirWhatsApp(selectedCliente.telefone)}
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.18)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  borderRadius: '10px',
                  padding: '1.2rem 0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <MessageCircle size={28} color="#25D366" fill="#25D366" />
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#25D366', letterSpacing: '0.5px' }}>
                  INICIAR CONVERSA
                </span>
              </button>
            </div>

            {/* Container de Abas (O.S., ORÇAMENTOS, RECIBOS, HAVER) */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                overflowX: 'auto'
              }}>
                {[
                  { id: 'os', label: 'O.S. DE ARMERIA', count: ordensDoCliente.length },
                  { id: 'orcamentos', label: 'ORÇAMENTOS', count: orcamentosDoCliente.length },
                  { id: 'recibos', label: 'RECIBOS', count: 0 },
                  { id: 'haver', label: 'HAVER', count: 0 }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    style={{
                      padding: '0.85rem 1.3rem',
                      border: 'none',
                      backgroundColor: activeSubTab === tab.id ? 'var(--bg-card)' : 'transparent',
                      color: activeSubTab === tab.id ? '#F87171' : 'var(--text-muted)',
                      borderBottom: activeSubTab === tab.id ? '2px solid #F87171' : '2px solid transparent',
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
                        backgroundColor: activeSubTab === tab.id ? 'var(--red-tactical)' : 'var(--border-color)',
                        color: '#FFFFFF',
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
                    {/* Cabeçalho da Aba OS com filtro de HISTÓRICO */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                        {mostrarHistoricoOS ? 'HISTÓRICO DE O.S. CONCLUÍDAS' : 'ORDENS DE MANUTENÇÃO EM ABERTO'}
                      </span>

                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: mostrarHistoricoOS ? '#34D399' : '#60A5FA',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                        onClick={() => setMostrarHistoricoOS(!mostrarHistoricoOS)}
                      >
                        <History size={14} />
                        <span>{mostrarHistoricoOS ? 'Ver Ordens em Aberto' : `Histórico de O.S. (${ordensHistorico.length})`}</span>
                      </button>
                    </div>

                    {ordensExibidas.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                        {mostrarHistoricoOS
                          ? 'Nenhuma ordem de serviço concluída no histórico deste cliente.'
                          : 'Não há ordens de serviço em aberto para este cliente.'}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {ordensExibidas.map(o => (
                          <div
                            key={o.id}
                            onClick={() => setModalVerOSDetalhes(o)}
                            style={{
                              padding: '0.85rem 1rem',
                              backgroundColor: 'var(--bg-input)',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              justify: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#F87171'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                          >
                            <div>
                              <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                                OS #{o.numero_os} — {o.marca_arma} {o.modelo_arma} ({o.calibre_arma})
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                N° Série: {o.numero_serie_arma || o.numero_serie} — Categoria: {o.categoria_arma || 'Arma de Fogo'}
                              </div>
                              {o.problema_relatado && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--gold-accent)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                                  "{o.problema_relatado}"
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span className={`badge ${o.status === 'CONCLUÍDO' ? 'badge-green' : 'badge-yellow'}`}>
                                {o.status}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#60A5FA', textDecoration: 'underline' }}>Abrir O.S.</span>
                            </div>
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
                                Orçamento #{orc.numero_orcamento} — R$ {orc.valor_final.toFixed(2)}
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

                {(activeSubTab === 'recibos' || activeSubTab === 'haver') && (
                  <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    Nenhum registro encontrado nesta aba.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Editar Cadastro do Cliente */}
        {showModalEditarCliente && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#60A5FA', marginBottom: '1rem' }}>Editar Cadastro do Cliente & CR</h3>
              <form onSubmit={handleSalvarEditarCliente} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nome Completo *</label>
                  <input required className="input-field" value={clienteForm.nome_completo} onChange={e => setClienteForm({...clienteForm, nome_completo: e.target.value})} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CPF *</label>
                    <input required className="input-field" value={clienteForm.cpf} onChange={e => setClienteForm({...clienteForm, cpf: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>RG</label>
                    <input className="input-field" value={clienteForm.rg} onChange={e => setClienteForm({...clienteForm, rg: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Data de Nasc.</label>
                    <input type="date" className="input-field" value={clienteForm.data_nascimento} onChange={e => setClienteForm({...clienteForm, data_nascimento: e.target.value})} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Telefone (WhatsApp) *</label>
                    <input required className="input-field" value={clienteForm.telefone} onChange={e => setClienteForm({...clienteForm, telefone: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>E-mail</label>
                    <input className="input-field" type="email" value={clienteForm.email} onChange={e => setClienteForm({...clienteForm, email: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Endereço Completo</label>
                  <input className="input-field" value={clienteForm.endereco} onChange={e => setClienteForm({...clienteForm, endereco: e.target.value})} placeholder="Rua, Número, Bairro" />
                </div>

                {/* DADOS DO CR */}
                <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.9rem', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#FBBF24' }}>DADOS DO CR (CERTIFICADO DE REGISTRO)</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>N° do CR</label>
                      <input className="input-field" value={clienteForm.numero_cr} onChange={e => setClienteForm({...clienteForm, numero_cr: e.target.value})} placeholder="123456/2ª RM" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Data de Emissão</label>
                      <input type="date" className="input-field" value={clienteForm.data_emissao_cr} onChange={e => setClienteForm({...clienteForm, data_emissao_cr: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Data de Validade</label>
                      <input type="date" className="input-field" value={clienteForm.validade_cr} onChange={e => setClienteForm({...clienteForm, validade_cr: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Atividades Apostiladas no CR</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {OPCOES_ATIVIDADES.map(atv => {
                        const isSelected = (clienteForm.atividades_apostiladas || []).includes(atv)
                        return (
                          <button
                            key={atv}
                            type="button"
                            onClick={() => handleToggleAtividade(atv)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              border: isSelected ? '1px solid #34D399' : '1px solid var(--border-color)',
                              backgroundColor: isSelected ? 'rgba(19, 70, 51, 0.4)' : 'var(--bg-dark)',
                              color: isSelected ? '#34D399' : 'var(--text-muted)',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            {isSelected ? '✓ ' : '+ '} {atv}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowModalEditarCliente(false)}>Cancelar</button>
                  <button type="submit" className="btn-gold">Salvar Alterações</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Gerar OS de Entrada na Armeria */}
        {showModalGerarOS && (
          <ModalNovaOSArmeria
            clienteInicial={selectedCliente}
            clientes={clientes}
            ordens={ordens}
            setOrdens={setOrdens}
            onClose={() => setShowModalGerarOS(false)}
          />
        )}

        {/* Modal Visualizar Ficha/Detalhes da O.S. (MODAL FLUTUANTE MODERNO SEM CORTES) */}
        {modalVerOSDetalhes && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            overflowY: 'auto',
            padding: '2rem 1rem',
            display: 'flex',
            justify: 'center',
            alignItems: 'flex-start'
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '680px',
              backgroundColor: '#FFFFFF',
              color: '#111827',
              borderRadius: '12px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
              padding: '2rem',
              margin: 'auto 0'
            }}>
              {/* Botão Fechar 'X' no canto superior */}
              <button
                onClick={() => setModalVerOSDetalhes(null)}
                style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  background: '#F3F4F6', border: 'none', borderRadius: '50%',
                  width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#4B5563'
                }}
              >
                <X size={18} />
              </button>

              <div className="print-area">
                <div style={{ borderBottom: '2px solid #111827', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: '800', fontFamily: 'Cinzel, serif', color: '#111827', margin: 0, paddingRight: '2rem' }}>
                    {(config?.razao_social || config?.nome_fantasia || 'PRÓ GUNS ARMERIA').toUpperCase()}
                  </h2>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#8B262A' }}>
                      ORDEM DE SERVIÇO #{modalVerOSDetalhes.numero_os} — MANUTENÇÃO
                    </div>
                    <span style={{ padding: '0.35rem 0.75rem', backgroundColor: '#111827', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: '800', borderRadius: '6px' }}>
                      STATUS: {modalVerOSDetalhes.status}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.88rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#F9FAFB', padding: '0.85rem', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                    <div><strong>Proprietário:</strong> {modalVerOSDetalhes.cliente_nome?.toUpperCase()}</div>
                    <div><strong>Categoria:</strong> {modalVerOSDetalhes.categoria_arma || 'Arma de Fogo'}</div>
                  </div>

                  <div style={{ backgroundColor: '#F9FAFB', padding: '0.85rem', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                    <div><strong>Equipamento:</strong> {modalVerOSDetalhes.tipo_arma} — {modalVerOSDetalhes.marca_arma} {modalVerOSDetalhes.modelo_arma} ({modalVerOSDetalhes.calibre_arma})</div>
                    <div><strong>Número de Série:</strong> {modalVerOSDetalhes.numero_serie_arma || modalVerOSDetalhes.numero_serie}</div>
                  </div>

                  <div style={{ backgroundColor: '#FEF3C7', padding: '0.85rem', borderRadius: '6px', border: '1px solid #FCD34D' }}>
                    <strong style={{ color: '#92400E' }}>Problema Relatado pelo Cliente:</strong>
                    <div style={{ marginTop: '0.2rem', fontStyle: 'italic', color: '#111827' }}>"{modalVerOSDetalhes.problema_relatado || 'Revisão e manutenção técnica solicitada.'}"</div>
                  </div>

                  {modalVerOSDetalhes.gt_protocolo && modalVerOSDetalhes.gt_protocolo !== 'N/A (Ar Comprimido)' && (
                    <div style={{ backgroundColor: '#EFF6FF', padding: '0.85rem', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                      <div style={{ color: '#1E40AF' }}><strong>Protocolo da Guia de Tráfego:</strong> {modalVerOSDetalhes.gt_protocolo}</div>
                      {modalVerOSDetalhes.gt_data_vencimento && <div style={{ color: '#1E40AF' }}><strong>Vencimento da Guia:</strong> {modalVerOSDetalhes.gt_data_vencimento}</div>}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '0.8rem' }}>
                  <div>
                    <div style={{ borderTop: '1px solid #111827', width: '200px', paddingTop: '0.3rem', fontWeight: '600' }}>
                      {modalVerOSDetalhes.cliente_nome}
                      <br /> <span style={{ color: '#6B7280' }}>Proprietário / Requerente</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ borderTop: '1px solid #111827', width: '200px', paddingTop: '0.3rem', fontWeight: '600' }}>
                      {config?.nome_fantasia || 'Pró Guns Armeria'}
                      <br /> <span style={{ color: '#6B7280' }}>Responsável Técnico Armeiro</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
                <button
                  onClick={() => setModalVerOSDetalhes(null)}
                  style={{
                    backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB',
                    padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  Fechar
                </button>
                <button
                  onClick={() => window.print()}
                  style={{
                    background: 'linear-gradient(135deg, #8B262A 0%, #134633 100%)', color: '#FFFFFF', border: 'none',
                    padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: '700', cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '0.4rem'
                  }}
                >
                  <Printer size={16} />
                  <span>Imprimir Ficha da O.S.</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Recibo Impressão */}
        {showModalRecibo && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#fff', color: '#000', padding: '1.5rem' }}>
              <div className="print-area">
                <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: '800', fontFamily: 'Cinzel, serif' }}>
                    {(config?.nome_fantasia || 'PRÓ GUNS ARMERIA').toUpperCase()}
                  </h2>
                  <div style={{ fontSize: '0.8rem' }}>RECIBO DE PAGAMENTO DE SERVIÇOS</div>
                </div>
                <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                  Recebemos de <strong>{selectedCliente.nome_completo}</strong> (CPF: {selectedCliente.cpf}) a quantia de <strong>R$ {showModalRecibo.valor}</strong> referente a {showModalRecibo.descricao}.
                </p>
                <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.8rem' }}>
                  <div style={{ borderTop: '1px solid #000', width: '220px', margin: '0 auto', paddingTop: '0.3rem' }}>
                    {config?.nome_fantasia || 'Pró Guns Armeria'}
                    <br /> {config?.cr_armeria || 'CR-998877/2ª RM'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button className="btn-secondary" style={{ backgroundColor: '#e5e7eb', color: '#1f2937' }} onClick={() => setShowModalRecibo(null)}>Fechar</button>
                <button className="btn-gold" onClick={() => window.print()}>Imprimir Recibo</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ==========================================
  // 2. TELA: LISTA DE CLIENTES
  // ==========================================
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gold-primary)' }}>
            Clientes (CACs & Acervo)
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Gestão de clientes, dados pessoais, acervo de armas e ordens de serviço.
          </p>
        </div>

        <button className="btn-gold" onClick={() => { resetForm(); setShowModalNovoCliente(true); }}>
          <Plus size={18} />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Bar de Pesquisa */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="input-field"
            placeholder="Pesquisar por Nome ou CPF..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>NOME DO CLIENTE</th>
              <th style={{ padding: '0.85rem 1rem' }}>CPF</th>
              <th style={{ padding: '0.85rem 1rem' }}>CONTATO</th>
              <th style={{ padding: '0.85rem 1rem' }}>N° DO CR</th>
              <th style={{ padding: '0.85rem 1rem' }}>VALIDADE CR</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {filteredClientes.map(cliente => (
              <tr
                key={cliente.id}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                onClick={() => setSelectedCliente(cliente)}
              >
                <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  {cliente.nome_completo.toUpperCase()}
                </td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{cliente.cpf}</td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{cliente.telefone}</td>
                <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#FBBF24' }}>
                  {cliente.numero_cr || 'Sem CR'}
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span className="badge badge-green">{cliente.validade_cr || 'N/A'}</span>
                </td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      onClick={(e) => { e.stopPropagation(); setSelectedCliente(cliente); }}
                    >
                      <Eye size={14} /> <span>Acessar Perfil</span>
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', color: '#F87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      onClick={(e) => handleExcluirCliente(cliente.id, e)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Novo Cliente */}
      {showModalNovoCliente && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gold-primary)', marginBottom: '1rem' }}>Cadastrar Novo Cliente CAC</h3>
            <form onSubmit={handleSalvarNovoCliente} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nome Completo *</label>
                <input required className="input-field" value={clienteForm.nome_completo} onChange={e => setClienteForm({...clienteForm, nome_completo: e.target.value})} placeholder="Ex: CARLOS EDUARDO SILVEIRA" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CPF *</label>
                  <input required className="input-field" value={clienteForm.cpf} onChange={e => setClienteForm({...clienteForm, cpf: e.target.value})} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>RG</label>
                  <input className="input-field" value={clienteForm.rg} onChange={e => setClienteForm({...clienteForm, rg: e.target.value})} placeholder="00.000.000-0" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Data Nasc.</label>
                  <input type="date" className="input-field" value={clienteForm.data_nascimento} onChange={e => setClienteForm({...clienteForm, data_nascimento: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Telefone (WhatsApp) *</label>
                  <input required className="input-field" value={clienteForm.telefone} onChange={e => setClienteForm({...clienteForm, telefone: e.target.value})} placeholder="(11) 99999-8888" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>E-mail</label>
                  <input className="input-field" type="email" value={clienteForm.email} onChange={e => setClienteForm({...clienteForm, email: e.target.value})} placeholder="cliente@email.com" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Endereço Completo</label>
                <input className="input-field" value={clienteForm.endereco} onChange={e => setClienteForm({...clienteForm, endereco: e.target.value})} placeholder="Rua, Número, Bairro, Cidade - UF" />
              </div>

              {/* DADOS DO CR */}
              <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.9rem', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#FBBF24' }}>DADOS DO CR (CERTIFICADO DE REGISTRO)</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>N° do CR</label>
                    <input className="input-field" value={clienteForm.numero_cr} onChange={e => setClienteForm({...clienteForm, numero_cr: e.target.value})} placeholder="123456/2ª RM" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Emissão CR</label>
                    <input type="date" className="input-field" value={clienteForm.data_emissao_cr} onChange={e => setClienteForm({...clienteForm, data_emissao_cr: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Validade CR</label>
                    <input type="date" className="input-field" value={clienteForm.validade_cr} onChange={e => setClienteForm({...clienteForm, validade_cr: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Atividades Apostiladas no CR</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {OPCOES_ATIVIDADES.map(atv => {
                      const isSelected = (clienteForm.atividades_apostiladas || []).includes(atv)
                      return (
                        <button
                          key={atv}
                          type="button"
                          onClick={() => handleToggleAtividade(atv)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            border: isSelected ? '1px solid #34D399' : '1px solid var(--border-color)',
                            backgroundColor: isSelected ? 'rgba(19, 70, 51, 0.4)' : 'var(--bg-dark)',
                            color: isSelected ? '#34D399' : 'var(--text-muted)',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          {isSelected ? '✓ ' : '+ '} {atv}
                        </button>
                      )
                    })}
                  </div>
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
