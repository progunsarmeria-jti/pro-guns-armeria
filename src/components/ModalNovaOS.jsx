import React, { useState } from 'react'
import { X, Search, Plus, Trash2, CheckCircle2, DollarSign, User, Shield, Lock, MapPin } from 'lucide-react'
import CustomSelect from './CustomSelect'
import { hojeISO } from '../lib/dates'

export const CATALOGO_SERVICOS = [
  { id: 's1', nome: 'ATUALIZAÇÃO DE ATIVIDADES', valor: 350.00, categoria: 'Honorários' },
  { id: 's2', nome: 'ATUALIZAÇÃO DE DADOS PESSOAIS', valor: 350.00, categoria: 'Honorários' },
  { id: 's3', nome: 'ATUALIZAÇÃO DE ENDEREÇO', valor: 300.00, categoria: 'Honorários' },
  { id: 's4', nome: 'AUTORIZAÇÃO DE AQUISIÇÃO (PEDIDO DE COMPRA ARMA)', valor: 200.00, categoria: 'Honorários' },
  { id: 's5', nome: 'CONCESSÃO DE CR (PRIMEIRO CR)', valor: 500.00, categoria: 'Honorários' },
  { id: 's6', nome: 'RENOVAÇÃO DE CR', valor: 450.00, categoria: 'Honorários' },
  { id: 's7', nome: 'EMISSÃO DE CRAF', valor: 300.00, categoria: 'Honorários' },
  { id: 's8', nome: 'GUIA DE TRÁFEGO (GT ELETRÔNICA)', valor: 250.00, categoria: 'Honorários' },
  { id: 's9', nome: 'TRANSFERÊNCIA DE PROPRIEDADE (SIGMA / SINARM)', valor: 400.00, categoria: 'Honorários' },
  { id: 's10', nome: 'TAXA GRU REQUERIMENTO EXÉRCITO', valor: 88.00, categoria: 'Taxas' },
  { id: 's11', nome: 'TAXA GRU RENOVAÇÃO CR / CONCESSÃO', valor: 100.00, categoria: 'Taxas' },
  { id: 's12', nome: 'LAUDO PSICOLÓGICO (TERCEIROS)', valor: 250.00, categoria: 'Laudos' }
]

export default function ModalNovaOS({
  clienteInicial,
  clientes,
  ordens,
  setOrdens,
  financeiro,
  setFinanceiro,
  onClose
}) {
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState(clienteInicial?.id || clientes[0]?.id || '')

  const clienteAtual = clientes.find(c => c.id === clienteSelecionadoId) || clienteInicial || {
    nome_completo: 'ADALTO NUNES DE SOUZA',
    cpf: '130.443.701-91',
    telefone: '(64) 99968-2860',
    senha_gov: 'Pradalto54*',
    endereco: 'Rua das Armas, 100 - Centro, Jataí-GO',
    clube_filiado: 'CLUBE DE TIRO E CAÇA PRÓ TIRO (JATAÍ)'
  }

  // Serviços selecionados (Bloquinhos)
  const [servicosSelecionados, setServicosSelecionados] = useState([
    CATALOGO_SERVICOS[0] // ATUALIZAÇÃO DE ATIVIDADES R$ 350,00 por padrão
  ])

  const [searchServico, setSearchServico] = useState('')
  const [dropdownAberto, setDropdownAberto] = useState(false)

  // Resumo Financeiro
  const [desconto, setDesconto] = useState(0)
  const [valorPago, setValorPago] = useState(0)
  const [statusPagamento, setStatusPagamento] = useState('Aguardando Pagamento') // 'Aguardando Pagamento', 'Parcialmente Pago', 'Gratuidade', 'Pago'

  const handleAdicionarServico = (servico) => {
    setServicosSelecionados([...servicosSelecionados, servico])
    setDropdownAberto(false)
    setSearchServico('')
  }

  const handleRemoverServico = (index) => {
    setServicosSelecionados(servicosSelecionados.filter((_, i) => i !== index))
  }

  // Cálculos Financeiros em tempo real
  const totalHonorarios = servicosSelecionados
    .filter(s => s.categoria === 'Honorários')
    .reduce((acc, s) => acc + s.valor, 0)

  const totalTaxas = servicosSelecionados
    .filter(s => s.categoria === 'Taxas')
    .reduce((acc, s) => acc + s.valor, 0)

  const totalLaudos = servicosSelecionados
    .filter(s => s.categoria === 'Laudos')
    .reduce((acc, s) => acc + s.valor, 0)

  const valorBruto = totalHonorarios + totalTaxas + totalLaudos
  const totalGeral = Math.max(0, valorBruto - (parseFloat(desconto) || 0))
  const saldoRestante = Math.max(0, totalGeral - (parseFloat(valorPago) || 0))

  const servicosFiltrados = CATALOGO_SERVICOS.filter(s =>
    s.nome.toLowerCase().includes(searchServico.toLowerCase())
  )

  const handleSalvarOS = (e) => {
    e.preventDefault()
    if (servicosSelecionados.length === 0) {
      alert('Selecione ao menos um serviço para a Ordem de Serviço!')
      return
    }

    const maxOS = (ordens || []).reduce((max, o) => Math.max(max, Number(o.numero_os) || 1000), 1000)
    const novaOSObj = {
      id: `o_${Date.now()}`,
      numero_os: maxOS + 1,
      cliente_id: clienteAtual.id,
      cliente_nome: clienteAtual.nome_completo,
      tipo_servico: servicosSelecionados.map(s => s.nome).join(' + '),
      orgao_destino: 'Exército (SIGMA)',
      numero_protocolo: `2026.07.${Math.floor(1000 + Math.random() * 9000)}`,
      data_protocolo: hojeISO(),
      valor_servico: totalGeral,
      valor_taxamento: totalTaxas,
      status: 'Aguardando Doc',
      status_pagamento: statusPagamento,
      detalhes: `Serviços: ${servicosSelecionados.map(s => s.nome).join(', ')}`
    }

    setOrdens([novaOSObj, ...ordens])

    // Se houver pagamento, lança no financeiro
    if (totalGeral > 0 && setFinanceiro && financeiro) {
      const novoLancamento = {
        id: `f_${Date.now()}`,
        descricao: `OS #${novaOSObj.numero_os} - ${clienteAtual.nome_completo}`,
        tipo: 'Receita',
        categoria: 'Serviço',
        valor: statusPagamento === 'Pago' ? totalGeral : (parseFloat(valorPago) || 0),
        data_vencimento: hojeISO(),
        data_pagamento: statusPagamento === 'Pago' ? hojeISO() : null,
        status: statusPagamento === 'Pago' ? 'Pago' : 'Pendente',
        forma_pagamento: 'PIX'
      }
      setFinanceiro([novoLancamento, ...financeiro])
    }

    alert(`Ordem de Serviço #${novaOSObj.numero_os} criada com sucesso para ${clienteAtual.nome_completo}!`)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
        {/* Top Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)' }}>
            Nova Ordem de Serviço
          </h2>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSalvarOS} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* PASSO 1: DADOS DO CLIENTE */}
          <div style={{ backgroundColor: 'var(--bg-input)', padding: '1.1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem', fontSize: '0.9rem', fontWeight: '700', color: '#60A5FA' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#60A5FA', color: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>1</span>
              <span>Dados do Cliente</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Nome Completo *</label>
                {!clienteInicial && clientes && clientes.length > 0 ? (
                  <CustomSelect
                    label=""
                    value={
                      clienteAtual
                        ? `${clienteAtual.nome_completo.toUpperCase()} (${clienteAtual.cpf})`
                        : ''
                    }
                    onChange={val => {
                      const c = clientes.find(item => `${item.nome_completo.toUpperCase()} (${item.cpf})` === val)
                      if (c) setClienteSelecionadoId(c.id)
                    }}
                    options={clientes.map(c => `${c.nome_completo.toUpperCase()} (${c.cpf})`)}
                    placeholder="Selecione o Cliente..."
                    allowCustom={false}
                  />
                ) : (
                  <input className="input-field" readOnly value={clienteAtual.nome_completo?.toUpperCase()} style={{ fontWeight: '700' }} />
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contato (Telefone / WhatsApp) *</label>
                  <input className="input-field" readOnly value={clienteAtual.telefone || '(64) 99968-2860'} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CPF *</label>
                  <input className="input-field" readOnly value={clienteAtual.cpf || '130.443.701-91'} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Senha GOV.br</label>
                  <input className="input-field" type="password" readOnly value={clienteAtual.senha_gov || '••••••••'} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Endereço Completo</label>
                <input className="input-field" readOnly value={clienteAtual.endereco || 'RUA, NÚMERO, BAIRRO, CEP, CIDADE-UF...'} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Clube de Tiro e Caça Filiado</label>
                <input className="input-field" readOnly value={clienteAtual.clube_filiado || 'CLUBE DE TIRO E CAÇA PRÓ TIRO (JATAÍ)'} />
              </div>
            </div>
          </div>

          {/* PASSO 2: DESCRIÇÃO DO SERVIÇO (SELETOR BLOQUINHOS ESTILO GCAC) */}
          <div style={{ backgroundColor: 'var(--bg-input)', padding: '1.1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem', fontSize: '0.9rem', fontWeight: '700', color: '#60A5FA' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#60A5FA', color: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>2</span>
              <span>Descrição do Serviço</span>
            </div>

            {/* Dropdown Seletor com busca */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <button
                type="button"
                className="input-field"
                onClick={() => setDropdownAberto(!dropdownAberto)}
                style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: 'var(--bg-dark)' }}
              >
                <span>≡ Selecionar serviço</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Clique para adicionar</span>
              </button>

              {dropdownAberto && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  backgroundColor: '#161920', border: '1px solid var(--border-color)', borderRadius: '6px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)', zIndex: 100, padding: '0.5rem', marginTop: '0.2rem'
                }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Pesquisar serviço..."
                    value={searchServico}
                    onChange={e => setSearchServico(e.target.value)}
                    style={{ marginBottom: '0.5rem' }}
                    autoFocus
                  />

                  <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {servicosFiltrados.map(s => (
                      <div
                        key={s.id}
                        onClick={() => handleAdicionarServico(s)}
                        style={{
                          padding: '0.6rem 0.8rem',
                          borderRadius: '4px',
                          display: 'flex',
                          justify: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          backgroundColor: 'var(--bg-dark)',
                          fontSize: '0.82rem'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-dark)'}
                      >
                        <span style={{ fontWeight: '600' }}>{s.nome}</span>
                        <span style={{ color: '#34D399', fontWeight: '700' }}>R$ {s.valor.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Lista de Serviços Adicionados (Bloquinhos) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {servicosSelecionados.map((item, index) => (
                <div key={index} style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-dark)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>{item.nome}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Categoria: {item.categoria}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#34D399' }}>R$ {item.valor.toFixed(2)}</span>
                    <button type="button" style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }} onClick={() => handleRemoverServico(index)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PASSO 3: RESUMO FINANCEIRO & STATUS DO PAGAMENTO (ESTILO EXACTO GCAC) */}
          <div style={{ backgroundColor: 'var(--bg-input)', padding: '1.1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            {/* Badges de Categoria */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.78rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              <div>HONORÁRIOS: <strong style={{ color: '#60A5FA' }}>R$ {totalHonorarios.toFixed(2)}</strong></div>
              <div>TAXAS (GOV): <strong style={{ color: '#FBBF24' }}>R$ {totalTaxas.toFixed(2)}</strong></div>
              <div>LAUDOS (TERCEIROS): <strong style={{ color: '#A78BFA' }}>R$ {totalLaudos.toFixed(2)}</strong></div>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '0.75rem' }}>
              TOTAL GERAL (O QUE O CLIENTE PAGA NO TOTAL): <span style={{ color: '#34D399', fontSize: '1.1rem', marginLeft: '0.4rem' }}>R$ {totalGeral.toFixed(2)}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Valor Bruto (R$)</label>
                <input className="input-field" readOnly value={`R$ ${valorBruto.toFixed(2)}`} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Desconto (R$)</label>
                <input className="input-field" type="number" step="0.01" value={desconto} onChange={e => setDesconto(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Valor Pago (Saldo: R$ {saldoRestante.toFixed(2)})</label>
                <input className="input-field" type="number" step="0.01" value={valorPago} onChange={e => setValorPago(e.target.value)} />
              </div>
            </div>

            {/* Status do Pagamento (Botões GCAC) */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Status do Pagamento</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {[
                  { id: 'Aguardando Pagamento', label: 'Aguardando Pagamento', color: '#FBBF24' },
                  { id: 'Parcialmente Pago', label: 'Parcialmente Pago', color: '#60A5FA' },
                  { id: 'Gratuidade', label: 'Gratuidade', color: '#9CA3AF' },
                  { id: 'Pago', label: 'Pago', color: '#34D399' }
                ].map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusPagamento(st.id)}
                    style={{
                      padding: '0.55rem 0.4rem',
                      borderRadius: '6px',
                      border: statusPagamento === st.id ? `2px solid ${st.color}` : '1px solid var(--border-color)',
                      backgroundColor: statusPagamento === st.id ? 'rgba(0,0,0,0.4)' : 'var(--bg-dark)',
                      color: statusPagamento === st.id ? st.color : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-gold">Criar Ordem de Serviço</button>
          </div>
        </form>
      </div>
    </div>
  )
}
