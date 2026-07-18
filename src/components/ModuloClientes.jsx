import React, { useState } from 'react'
import {
  Search, Eye, Edit, Trash2, ArrowLeft, Plus, Phone, Mail, MapPin, Shield,
  FileText, DollarSign, Receipt, MessageCircle, History
} from 'lucide-react'
import ModalNovaOS from './ModalNovaOS'

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
  const [showModalEditarCliente, setShowModalEditarCliente] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState('os')
  const [mostrarHistoricoOS, setMostrarHistoricoOS] = useState(false)

  // Modais de ações do perfil
  const [showModalGerarOS, setShowModalGerarOS] = useState(false)
  const [showModalGerarOrcamento, setShowModalGerarOrcamento] = useState(false)
  const [showModalRecibo, setShowModalRecibo] = useState(null)

  // Cliente Form State (Usado em criar e editar)
  const [clienteForm, setClienteForm] = useState({
    nome_completo: '',
    cpf: '',
    rg: '',
    telefone: '',
    email: '',
    endereco: '',
    numero_cr: '',
    validade_cr: '',
    regiao_militar: '2ª RM',
    categorias: ['Atirador'],
    cidade: '',
    uf: 'SP'
  })

  const filteredClientes = clientes.filter(c =>
    c.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpf.includes(searchTerm)
  )

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
      endereco: cliente.endereco || '',
      numero_cr: cliente.numero_cr || '',
      validade_cr: cliente.validade_cr || '',
      regiao_militar: cliente.regiao_militar || '2ª RM',
      categorias: cliente.categorias || ['Atirador'],
      cidade: cliente.cidade || '',
      uf: cliente.uf || 'SP'
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
      endereco: '',
      numero_cr: '',
      validade_cr: '',
      regiao_militar: '2ª RM',
      categorias: ['Atirador'],
      cidade: '',
      uf: 'SP'
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
    const ordensEmAberto = ordensDoCliente.filter(o => o.status !== 'Concluído' && o.status !== 'Deferido')
    const ordensHistorico = ordensDoCliente.filter(o => o.status === 'Concluído' || o.status === 'Deferido')

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
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Perfil do Cliente</div>
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
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Coluna Esquerda: Informações Pessoais */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

                {selectedCliente.email && (
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>E-MAIL</div>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '0.15rem' }}>{selectedCliente.email}</div>
                  </div>
                )}

                {/* Campo de Endereço */}
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>ENDEREÇO</div>
                  <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={14} color="#60A5FA" />
                    <span>{selectedCliente.endereco || 'Endereço não cadastrado'}</span>
                    {selectedCliente.cidade && <span>({selectedCliente.cidade} - {selectedCliente.uf})</span>}
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
          </div>

          {/* Coluna Direita: Balões de Ações Rápidas & Histórico de O.S. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Grid dos Balões de Ações Rápidas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              {/* Balão 1: GERAR O.S. */}
              <button
                onClick={() => setShowModalGerarOS(true)}
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
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
                <FileText size={26} color="#60A5FA" />
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
                onClick={() => setShowModalRecibo({ valor: '450,00', descricao: 'Serviços de Despachantaria Bélica' })}
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
                  { id: 'os', label: 'O.S.', count: ordensDoCliente.length },
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
                    {/* Cabeçalho da Aba OS com filtro de HISTÓRICO */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                        {mostrarHistoricoOS ? 'HISTÓRICO DE O.S. CONCLUÍDAS' : 'ORDENS EM ABERTO'}
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
                          <div key={o.id} style={{ padding: '0.85rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                                OS #{o.numero_os} - {o.tipo_servico}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                Prot: {o.numero_protocolo || 'Pendente'} ({o.orgao_destino})
                              </div>
                            </div>
                            <span className={`badge ${o.status === 'Concluído' || o.status === 'Deferido' ? 'badge-green' : 'badge-yellow'}`}>
                              {o.status}
                            </span>
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
            <div className="card" style={{ width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#60A5FA', marginBottom: '1rem' }}>Editar Cadastro do Cliente</h3>
              <form onSubmit={handleSalvarEditarCliente} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nome Completo *</label>
                  <input required className="input-field" value={clienteForm.nome_completo} onChange={e => setClienteForm({...clienteForm, nome_completo: e.target.value})} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CPF *</label>
                    <input required className="input-field" value={clienteForm.cpf} onChange={e => setClienteForm({...clienteForm, cpf: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Telefone (WhatsApp) *</label>
                    <input required className="input-field" value={clienteForm.telefone} onChange={e => setClienteForm({...clienteForm, telefone: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Endereço Completo</label>
                  <input className="input-field" value={clienteForm.endereco} onChange={e => setClienteForm({...clienteForm, endereco: e.target.value})} placeholder="Rua, Número, Bairro" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cidade</label>
                    <input className="input-field" value={clienteForm.cidade} onChange={e => setClienteForm({...clienteForm, cidade: e.target.value})} placeholder="São Paulo" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>UF</label>
                    <input className="input-field" value={clienteForm.uf} onChange={e => setClienteForm({...clienteForm, uf: e.target.value})} placeholder="SP" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>E-mail</label>
                    <input className="input-field" type="email" value={clienteForm.email} onChange={e => setClienteForm({...clienteForm, email: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Número do CR</label>
                    <input className="input-field" value={clienteForm.numero_cr} onChange={e => setClienteForm({...clienteForm, numero_cr: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Validade do CR</label>
                  <input type="date" className="input-field" value={clienteForm.validade_cr} onChange={e => setClienteForm({...clienteForm, validade_cr: e.target.value})} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowModalEditarCliente(false)}>Cancelar</button>
                  <button type="submit" className="btn-gold">Salvar Alterações</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Gerar OS (Estilo Exato Portal GCAC 3 passos) */}
        {showModalGerarOS && (
          <ModalNovaOS
            clienteInicial={selectedCliente}
            clientes={clientes}
            ordens={ordens}
            setOrdens={setOrdens}
            financeiro={financeiro}
            setFinanceiro={setFinanceiro}
            onClose={() => setShowModalGerarOS(false)}
          />
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
  // 2. TELA: LISTA "MEUS CLIENTES"
  // ==========================================
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)' }}>
            Meus Clientes
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Gerencie a agenda de contatos para preenchimento rápido nas O.S.
          </p>
        </div>

        <button className="btn-gold" onClick={() => { resetForm(); setShowModalNovoCliente(true); }}>
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
                        onClick={() => handleAbrirEditar(cliente)}
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
            <form onSubmit={handleSalvarNovoCliente} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nome Completo *</label>
                <input required className="input-field" value={clienteForm.nome_completo} onChange={e => setClienteForm({...clienteForm, nome_completo: e.target.value})} placeholder="Ex: CARLOS EDUARDO SILVEIRA" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CPF *</label>
                  <input required className="input-field" value={clienteForm.cpf} onChange={e => setClienteForm({...clienteForm, cpf: e.target.value})} placeholder="123.456.789-00" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Telefone (WhatsApp) *</label>
                  <input required className="input-field" value={clienteForm.telefone} onChange={e => setClienteForm({...clienteForm, telefone: e.target.value})} placeholder="(11) 98765-4321" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Endereço Completo</label>
                <input className="input-field" value={clienteForm.endereco} onChange={e => setClienteForm({...clienteForm, endereco: e.target.value})} placeholder="Av. Paulista, 1500 - Bela Vista" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cidade</label>
                  <input className="input-field" value={clienteForm.cidade} onChange={e => setClienteForm({...clienteForm, cidade: e.target.value})} placeholder="São Paulo" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>UF</label>
                  <input className="input-field" value={clienteForm.uf} onChange={e => setClienteForm({...clienteForm, uf: e.target.value})} placeholder="SP" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>E-mail</label>
                  <input className="input-field" type="email" value={clienteForm.email} onChange={e => setClienteForm({...clienteForm, email: e.target.value})} placeholder="cliente@email.com" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Número do CR</label>
                  <input className="input-field" value={clienteForm.numero_cr} onChange={e => setClienteForm({...clienteForm, numero_cr: e.target.value})} placeholder="123456/2ª RM" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Validade do CR</label>
                <input type="date" className="input-field" value={clienteForm.validade_cr} onChange={e => setClienteForm({...clienteForm, validade_cr: e.target.value})} />
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
