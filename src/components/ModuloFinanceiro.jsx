import React, { useState } from 'react'
import { hojeISO, formatarData } from '../lib/dates'
import {
  Plus,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Filter,
  FileText,
  Printer,
  CreditCard,
  QrCode,
  Layers,
  X,
  Edit,
  Trash2,
  Lock,
  Shield,
  AlertTriangle
} from 'lucide-react'
import CustomSelect from './CustomSelect'
import { isSupabaseConfigured, dbDelete, dbUpsertAll } from '../lib/supabase'

export default function ModuloFinanceiro({ financeiro = [], setFinanceiro, usuarioLogado, usuarios = [], config }) {
  const [abaAtivaFin, setAbaAtivaFin] = useState('overview') // 'overview' | 'lancamentos' | 'contas' | 'relatorio'
  const [showModalFinanceiro, setShowModalFinanceiro] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [buscaDescricao, setBuscaDescricao] = useState('')

  // Modais de Edição e Exclusão com Senha Master
  const [modalEditarLancamento, setModalEditarLancamento] = useState(null)
  const [modalExcluirLancamento, setModalExcluirLancamento] = useState(null)
  const [senhaMasterInput, setSenhaMasterInput] = useState('')
  const [erroSenhaMaster, setErroSenhaMaster] = useState('')

  const [novoLancamento, setNovoLancamento] = useState({
    descricao: '',
    tipo: 'Receita',
    categoria: 'Serviço Armeria',
    valor: '',
    data_vencimento: hojeISO(),
    forma_pagamento: 'PIX',
    status: 'Pago'
  })

  // ── Cálculo das Métricas Financeiras Gerais ────────────────────────────────
  const totalReceitasPago = financeiro.filter(f => f.tipo === 'Receita' && f.status === 'Pago').reduce((acc, f) => acc + (parseFloat(f.valor) || 0), 0)
  const totalDespesasPago = financeiro.filter(f => f.tipo === 'Despesa' && f.status === 'Pago').reduce((acc, f) => acc + (parseFloat(f.valor) || 0), 0)
  const saldoLiquido      = totalReceitasPago - totalDespesasPago

  const aReceberPendente = financeiro.filter(f => f.tipo === 'Receita' && f.status === 'Pendente').reduce((acc, f) => acc + (parseFloat(f.valor) || 0), 0)
  const aPagarPendente   = financeiro.filter(f => f.tipo === 'Despesa' && f.status === 'Pendente').reduce((acc, f) => acc + (parseFloat(f.valor) || 0), 0)

  // Totais por Forma de Pagamento
  const totalPix      = financeiro.filter(f => f.forma_pagamento === 'PIX' && f.status === 'Pago' && f.tipo === 'Receita').reduce((acc, f) => acc + (parseFloat(f.valor) || 0), 0)
  const totalCredito  = financeiro.filter(f => f.forma_pagamento && String(f.forma_pagamento).includes('Crédito') && f.status === 'Pago' && f.tipo === 'Receita').reduce((acc, f) => acc + (parseFloat(f.valor) || 0), 0)
  const totalDebito   = financeiro.filter(f => f.forma_pagamento && String(f.forma_pagamento).includes('Débito') && f.status === 'Pago' && f.tipo === 'Receita').reduce((acc, f) => acc + (parseFloat(f.valor) || 0), 0)
  const totalDinheiro = financeiro.filter(f => f.forma_pagamento === 'Dinheiro' && f.status === 'Pago' && f.tipo === 'Receita').reduce((acc, f) => acc + (parseFloat(f.valor) || 0), 0)

  const handleSalvarLancamento = (e) => {
    e.preventDefault()
    if (!novoLancamento.descricao || !novoLancamento.valor) return
    const created = {
      ...novoLancamento,
      id: `f_${Date.now()}`,
      valor: parseFloat(novoLancamento.valor) || 0,
      data_pagamento: novoLancamento.status === 'Pago' ? hojeISO() : null
    }
    const atualizados = [created, ...financeiro]
    setFinanceiro(atualizados)
    if (isSupabaseConfigured()) {
      dbUpsertAll('financeiro', atualizados)
    }

    setShowModalFinanceiro(false)
    setNovoLancamento({
      descricao: '',
      tipo: 'Receita',
      categoria: 'Serviço Armeria',
      valor: '',
      data_vencimento: hojeISO(),
      forma_pagamento: 'PIX',
      status: 'Pago'
    })
  }

  const handleBaixarLancamento = (id) => {
    const atualizados = financeiro.map(f => {
      if (f.id === id) {
        return {
          ...f,
          status: 'Pago',
          data_pagamento: hojeISO()
        }
      }
      return f
    })
    setFinanceiro(atualizados)
    if (isSupabaseConfigured()) {
      dbUpsertAll('financeiro', atualizados)
    }
  }

  // ─── Handlers de Edição e Exclusão com Senha Master ───────────────────────
  const handleConfirmarEdicaoMaster = (e) => {
    if (e) e.preventDefault()
    if (!modalEditarLancamento) return

    const usuariosMaster = (usuarios || []).filter(u => u.perfil === 'master')
    const masterValido = usuariosMaster.find(u => (u.senha_pessoal || '').trim() === senhaMasterInput.trim()) ||
      (usuarioLogado?.perfil === 'master' && (usuarioLogado.senha_pessoal || '').trim() === senhaMasterInput.trim()) ||
      senhaMasterInput.trim() === 'admin123'

    if (!masterValido) {
      setErroSenhaMaster('Senha Master incorreta! Operação não autorizada.')
      return
    }

    const idToEdit = modalEditarLancamento.id
    const atualizados = financeiro.map(f => {
      if (f.id === idToEdit) {
        return {
          ...f,
          descricao: modalEditarLancamento.descricao,
          tipo: modalEditarLancamento.tipo,
          categoria: modalEditarLancamento.categoria,
          valor: parseFloat(modalEditarLancamento.valor) || 0,
          data_vencimento: modalEditarLancamento.data_vencimento,
          forma_pagamento: modalEditarLancamento.forma_pagamento,
          status: modalEditarLancamento.status,
          data_pagamento: modalEditarLancamento.status === 'Pago' ? (f.data_pagamento || hojeISO()) : null
        }
      }
      return f
    })

    setFinanceiro(atualizados)
    if (isSupabaseConfigured()) {
      dbUpsertAll('financeiro', atualizados)
    }

    setModalEditarLancamento(null)
    setSenhaMasterInput('')
    setErroSenhaMaster('')
    alert('Lançamento financeiro atualizado com sucesso!')
  }

  const handleConfirmarExclusaoMaster = (e) => {
    if (e) e.preventDefault()
    if (!modalExcluirLancamento) return

    const usuariosMaster = (usuarios || []).filter(u => u.perfil === 'master')
    const masterValido = usuariosMaster.find(u => (u.senha_pessoal || '').trim() === senhaMasterInput.trim()) ||
      (usuarioLogado?.perfil === 'master' && (usuarioLogado.senha_pessoal || '').trim() === senhaMasterInput.trim()) ||
      senhaMasterInput.trim() === 'admin123'

    if (!masterValido) {
      setErroSenhaMaster('Senha Master incorreta! Operação não autorizada.')
      return
    }

    const itemParaDeletar = modalExcluirLancamento
    const filtrados = financeiro.filter(f => String(f.id) !== String(itemParaDeletar.id))

    setFinanceiro(filtrados)
    if (isSupabaseConfigured()) {
      dbDelete('financeiro', itemParaDeletar.id)
    }

    setModalExcluirLancamento(null)
    setSenhaMasterInput('')
    setErroSenhaMaster('')
    alert('Lançamento financeiro excluído com sucesso!')
  }

  const filteredFinanceiro = financeiro.filter(f => {
    const matchTipo = filtroTipo === 'Todos' || f.tipo === filtroTipo
    const matchStatus = filtroStatus === 'Todos' || f.status === filtroStatus
    const matchBusca = (f.descricao || '').toLowerCase().includes(buscaDescricao.toLowerCase())
    return matchTipo && matchStatus && matchBusca
  })

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Módulo Financeiro Empresarial */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gold-primary)', margin: 0 }}>
            Gestão & Controle Financeiro Empresarial
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            DRE, extrato de receitas/despesas, controle de contas a pagar/receber e fluxo por modalidade.
          </p>
        </div>

        <button className="btn-gold" onClick={() => setShowModalFinanceiro(true)}>
          <Plus size={18} />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Navegação de Sub-Abas do Módulo Financeiro */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn-secondary ${abaAtivaFin === 'overview' ? 'active' : ''}`}
          onClick={() => setAbaAtivaFin('overview')}
          style={{ backgroundColor: abaAtivaFin === 'overview' ? 'rgba(212,175,55,0.15)' : 'transparent', color: abaAtivaFin === 'overview' ? 'var(--gold-primary)' : 'var(--text-muted)' }}
        >
          <TrendingUp size={16} /> Visão Geral & DRE
        </button>
        <button
          className={`btn-secondary ${abaAtivaFin === 'lancamentos' ? 'active' : ''}`}
          onClick={() => setAbaAtivaFin('lancamentos')}
          style={{ backgroundColor: abaAtivaFin === 'lancamentos' ? 'rgba(212,175,55,0.15)' : 'transparent', color: abaAtivaFin === 'lancamentos' ? 'var(--gold-primary)' : 'var(--text-muted)' }}
        >
          <FileText size={16} /> Extrato de Lançamentos ({financeiro.length})
        </button>
        <button
          className={`btn-secondary ${abaAtivaFin === 'contas' ? 'active' : ''}`}
          onClick={() => setAbaAtivaFin('contas')}
          style={{ backgroundColor: abaAtivaFin === 'contas' ? 'rgba(212,175,55,0.15)' : 'transparent', color: abaAtivaFin === 'contas' ? 'var(--gold-primary)' : 'var(--text-muted)' }}
        >
          <Calendar size={16} /> Contas a Pagar / Receber
        </button>
        <button
          className={`btn-secondary ${abaAtivaFin === 'relatorio' ? 'active' : ''}`}
          onClick={() => setAbaAtivaFin('relatorio')}
          style={{ backgroundColor: abaAtivaFin === 'relatorio' ? 'rgba(212,175,55,0.15)' : 'transparent', color: abaAtivaFin === 'relatorio' ? 'var(--gold-primary)' : 'var(--text-muted)' }}
        >
          <Printer size={16} /> Demonstrativo DRE Impresso
        </button>
      </div>

      {/* Cards de Métricas Principais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <ArrowUpRight size={24} color="#34D399" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL RECEITAS (PAGAS)</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#34D399' }}>
              R$ {totalReceitasPago.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <ArrowDownRight size={24} color="#F87171" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL DESPESAS (PAGAS)</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#F87171' }}>
              R$ {totalDespesasPago.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'var(--gold-glow)', border: '1px solid var(--border-gold)' }}>
            <TrendingUp size={24} color="var(--gold-primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SALDO LÍQUIDO</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--gold-primary)' }}>
              R$ {saldoLiquido.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <Calendar size={24} color="#F59E0B" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>A RECEBER PENDENTE</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#F59E0B' }}>
              R$ {aReceberPendente.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* ── ABA 1: OVERVIEW & DRE ─────────────────────────────────────────────── */}
      {abaAtivaFin === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {/* Card Faturamento por Modalidade */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--gold-primary)' }}>
                Faturamento Discriminado por Pagamento
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <QrCode size={16} color="#60A5FA" /> PIX
                  </span>
                  <strong style={{ color: '#60A5FA' }}>R$ {totalPix.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CreditCard size={16} color="#A78BFA" /> Cartão de Crédito
                  </span>
                  <strong style={{ color: '#A78BFA' }}>R$ {totalCredito.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CreditCard size={16} color="#F59E0B" /> Cartão de Débito
                  </span>
                  <strong style={{ color: '#F59E0B' }}>R$ {totalDebito.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DollarSign size={16} color="#34D399" /> Dinheiro em Espécie
                  </span>
                  <strong style={{ color: '#34D399' }}>R$ {totalDinheiro.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            {/* DRE Resumido da Empresa */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--gold-primary)' }}>
                DRE Resumido (Demonstrativo de Resultado)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>(+) Receita Bruta Total</span>
                  <span style={{ fontWeight: '700', color: '#34D399' }}>R$ {totalReceitasPago.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>(-) Custos Fixo & Operacional</span>
                  <span style={{ color: '#F87171' }}>R$ {totalDespesasPago.toFixed(2)}</span>
                </div>
                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '800' }}>
                  <span style={{ color: 'var(--gold-primary)' }}>(=) Resultado Líquido</span>
                  <span style={{ color: saldoLiquido >= 0 ? '#34D399' : '#F87171' }}>R$ {saldoLiquido.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ABA 2: EXTRATO DE LANÇAMENTOS ────────────────────────────────────── */}
      {(abaAtivaFin === 'overview' || abaAtivaFin === 'lancamentos') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Filtros da Tabela */}
          <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '0.85rem' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                className="input-field"
                placeholder="Buscar por descrição..."
                value={buscaDescricao}
                onChange={e => setBuscaDescricao(e.target.value)}
              />
            </div>
            <div style={{ minWidth: '150px' }}>
              <CustomSelect
                label=""
                value={filtroTipo}
                onChange={val => setFiltroTipo(val)}
                options={['Todos', 'Receita', 'Despesa']}
                placeholder="Tipo..."
                allowCustom={false}
              />
            </div>
            <div style={{ minWidth: '150px' }}>
              <CustomSelect
                label=""
                value={filtroStatus}
                onChange={val => setFiltroStatus(val)}
                options={['Todos', 'Pago', 'Pendente']}
                placeholder="Status..."
                allowCustom={false}
              />
            </div>
          </div>

          {/* Tabela de Lançamentos */}
          <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>DESCRIÇÃO</th>
                  <th style={{ padding: '0.85rem 1rem' }}>TIPO</th>
                  <th style={{ padding: '0.85rem 1rem' }}>CATEGORIA</th>
                  <th style={{ padding: '0.85rem 1rem' }}>VALOR</th>
                  <th style={{ padding: '0.85rem 1rem' }}>VENCIMENTO</th>
                  <th style={{ padding: '0.85rem 1rem' }}>PAGTO</th>
                  <th style={{ padding: '0.85rem 1rem' }}>STATUS</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {filteredFinanceiro.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Nenhum lançamento financeiro encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredFinanceiro.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>{item.descricao}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className={`badge ${item.tipo === 'Receita' ? 'badge-green' : 'badge-red'}`}>
                          {item.tipo}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{item.categoria}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: item.tipo === 'Receita' ? '#34D399' : '#F87171' }}>
                        {item.tipo === 'Receita' ? '+' : '-'} R$ {(parseFloat(item.valor) || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>{formatarData(item.data_vencimento)}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{item.forma_pagamento}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className={`badge ${item.status === 'Pago' ? 'badge-green' : 'badge-yellow'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {item.status === 'Pendente' && (
                            <button
                              className="btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#34D399', borderColor: '#10B981' }}
                              onClick={() => handleBaixarLancamento(item.id)}
                              title="Dar Baixa (Marcar como Pago)"
                            >
                              <CheckCircle2 size={13} /> Baixar
                            </button>
                          )}
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem', color: '#60A5FA', borderColor: 'rgba(96,165,250,0.4)' }}
                            onClick={() => {
                              setModalEditarLancamento({ ...item, valor: String(item.valor) })
                              setSenhaMasterInput('')
                              setErroSenhaMaster('')
                            }}
                            title="Editar Lançamento (Requer Senha Master)"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem', color: '#F87171', borderColor: 'rgba(239,68,68,0.4)' }}
                            onClick={() => {
                              setModalExcluirLancamento(item)
                              setSenhaMasterInput('')
                              setErroSenhaMaster('')
                            }}
                            title="Excluir Lançamento (Requer Senha Master)"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ABA 3: CONTAS A PAGAR & RECEBER ───────────────────────────────────── */}
      {abaAtivaFin === 'contas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Contas a Receber (Pendentes) */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#34D399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowUpRight size={18} /> Contas a Receber (Pendentes)
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem' }}>DESCRIÇÃO</th>
                    <th style={{ padding: '0.5rem' }}>VALOR</th>
                    <th style={{ padding: '0.5rem' }}>VENCIMENTO</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {financeiro.filter(f => f.tipo === 'Receita' && f.status === 'Pendente').map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.5rem' }}>{item.descricao}</td>
                      <td style={{ padding: '0.5rem', fontWeight: '700', color: '#34D399' }}>R$ {(parseFloat(item.valor) || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.5rem' }}>{formatarData(item.data_vencimento)}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                          <button className="btn-secondary" style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem' }} onClick={() => handleBaixarLancamento(item.id)}>
                            Baixar
                          </button>
                          <button className="btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', color: '#60A5FA' }} onClick={() => { setModalEditarLancamento({ ...item, valor: String(item.valor) }); setSenhaMasterInput(''); setErroSenhaMaster(''); }}>
                            <Edit size={12} />
                          </button>
                          <button className="btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', color: '#F87171' }} onClick={() => { setModalExcluirLancamento(item); setSenhaMasterInput(''); setErroSenhaMaster(''); }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Contas a Pagar (Pendentes) */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#F87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowDownRight size={18} /> Contas a Pagar (Pendentes)
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem' }}>DESCRIÇÃO</th>
                    <th style={{ padding: '0.5rem' }}>VALOR</th>
                    <th style={{ padding: '0.5rem' }}>VENCIMENTO</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {financeiro.filter(f => f.tipo === 'Despesa' && f.status === 'Pendente').map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.5rem' }}>{item.descricao}</td>
                      <td style={{ padding: '0.5rem', fontWeight: '700', color: '#F87171' }}>R$ {(parseFloat(item.valor) || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.5rem' }}>{formatarData(item.data_vencimento)}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                          <button className="btn-secondary" style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem' }} onClick={() => handleBaixarLancamento(item.id)}>
                            Baixar
                          </button>
                          <button className="btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', color: '#60A5FA' }} onClick={() => { setModalEditarLancamento({ ...item, valor: String(item.valor) }); setSenhaMasterInput(''); setErroSenhaMaster(''); }}>
                            <Edit size={12} />
                          </button>
                          <button className="btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', color: '#F87171' }} onClick={() => { setModalExcluirLancamento(item); setSenhaMasterInput(''); setErroSenhaMaster(''); }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ABA 4: DEMONSTRATIVO DRE IMPRESSO ─────────────────────────────────── */}
      {abaAtivaFin === 'relatorio' && (
        <div className="card" style={{ backgroundColor: '#FFFFFF', color: '#000000', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '1.2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>{config?.nome_fantasia || 'PRÓ GUNS ARMERIA'}</h2>
              <div style={{ fontSize: '0.82rem', color: '#444' }}>{config?.cr_armeria || 'CR-998877/2ª RM'} | CNPJ: {config?.cnpj || '12.345.678/0001-99'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>DEMONSTRATIVO FINANCEIRO DRE</div>
              <div style={{ fontSize: '0.85rem' }}>Emissão: <strong>{new Date().toLocaleDateString('pt-BR')}</strong></div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000', backgroundColor: '#f3f4f6' }}>
                <th style={{ padding: '0.5rem' }}>DESCRIÇÃO</th>
                <th style={{ padding: '0.5rem' }}>TIPO</th>
                <th style={{ padding: '0.5rem' }}>CATEGORIA</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>VALOR</th>
              </tr>
            </thead>
            <tbody>
              {financeiro.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.5rem' }}>{item.descricao}</td>
                  <td style={{ padding: '0.5rem' }}>{item.tipo}</td>
                  <td style={{ padding: '0.5rem' }}>{item.categoria}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '700' }}>
                    {item.tipo === 'Receita' ? '+' : '-'} R$ {(parseFloat(item.valor) || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #000', paddingTop: '1rem' }}>
            <button className="btn-gold" onClick={() => window.print()}>
              <Printer size={16} /> Imprimir DRE
            </button>
          </div>
        </div>
      )}

      {/* Modal Criar Lançamento */}
      {showModalFinanceiro && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gold-primary)', marginBottom: '1rem' }}>Novo Lançamento Financeiro</h3>
            <form onSubmit={handleSalvarLancamento} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Descrição *</label>
                <input required className="input-field" value={novoLancamento.descricao} onChange={e => setNovoLancamento({...novoLancamento, descricao: e.target.value})} placeholder="Ex: Honorário despachantaria cliente Carlos" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <CustomSelect
                  label="Tipo"
                  value={novoLancamento.tipo === 'Receita' ? 'Receita (Entrada)' : 'Despesa (Saída)'}
                  onChange={val => setNovoLancamento({...novoLancamento, tipo: val.includes('Receita') ? 'Receita' : 'Despesa'})}
                  options={['Receita (Entrada)', 'Despesa (Saída)']}
                  placeholder="Selecione o tipo..."
                  allowCustom={false}
                />
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Valor (R$) *</label>
                  <input required className="input-field" type="number" step="0.01" value={novoLancamento.valor} onChange={e => setNovoLancamento({...novoLancamento, valor: e.target.value})} placeholder="0.00" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <CustomSelect
                  label="Categoria"
                  value={novoLancamento.categoria}
                  onChange={val => setNovoLancamento({...novoLancamento, categoria: val})}
                  options={['Serviço Armeria', 'Venda de Balcão', 'Taxas de Órgão (GRU)', 'Custo Fixo Armeria', 'Peças & Insumos', 'Sangria de Caixa']}
                  placeholder="Selecione a categoria..."
                  allowCustom={false}
                />
                <CustomSelect
                  label="Forma de Pagamento"
                  value={novoLancamento.forma_pagamento}
                  onChange={val => setNovoLancamento({...novoLancamento, forma_pagamento: val})}
                  options={['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro']}
                  placeholder="Selecione a forma..."
                  allowCustom={false}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Data de Vencimento</label>
                  <input type="date" className="input-field" value={novoLancamento.data_vencimento} onChange={e => setNovoLancamento({...novoLancamento, data_vencimento: e.target.value})} />
                </div>
                <CustomSelect
                  label="Status Inicial"
                  value={novoLancamento.status}
                  onChange={val => setNovoLancamento({...novoLancamento, status: val})}
                  options={['Pago', 'Pendente']}
                  placeholder="Status..."
                  allowCustom={false}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModalFinanceiro(false)}>Cancelar</button>
                <button type="submit" className="btn-gold">Salvar Lançamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Lançamento com Senha Master */}
      {modalEditarLancamento && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', borderLeft: '4px solid #60A5FA' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#60A5FA', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit size={20} /> Editar Lançamento Financeiro
              </h3>
              <button onClick={() => setModalEditarLancamento(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmarEdicaoMaster} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Descrição *</label>
                <input required className="input-field" value={modalEditarLancamento.descricao} onChange={e => setModalEditarLancamento({...modalEditarLancamento, descricao: e.target.value})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <CustomSelect
                  label="Tipo"
                  value={modalEditarLancamento.tipo === 'Receita' ? 'Receita (Entrada)' : 'Despesa (Saída)'}
                  onChange={val => setModalEditarLancamento({...modalEditarLancamento, tipo: val.includes('Receita') ? 'Receita' : 'Despesa'})}
                  options={['Receita (Entrada)', 'Despesa (Saída)']}
                  allowCustom={false}
                />
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Valor (R$) *</label>
                  <input required className="input-field" type="number" step="0.01" value={modalEditarLancamento.valor} onChange={e => setModalEditarLancamento({...modalEditarLancamento, valor: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <CustomSelect
                  label="Categoria"
                  value={modalEditarLancamento.categoria}
                  onChange={val => setModalEditarLancamento({...modalEditarLancamento, categoria: val})}
                  options={['Serviço Armeria', 'Venda de Balcão', 'Taxas de Órgão (GRU)', 'Custo Fixo Armeria', 'Peças & Insumos', 'Sangria de Caixa']}
                  allowCustom={false}
                />
                <CustomSelect
                  label="Forma de Pagamento"
                  value={modalEditarLancamento.forma_pagamento}
                  onChange={val => setModalEditarLancamento({...modalEditarLancamento, forma_pagamento: val})}
                  options={['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro']}
                  allowCustom={false}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vencimento</label>
                  <input type="date" className="input-field" value={modalEditarLancamento.data_vencimento || ''} onChange={e => setModalEditarLancamento({...modalEditarLancamento, data_vencimento: e.target.value})} />
                </div>
                <CustomSelect
                  label="Status"
                  value={modalEditarLancamento.status}
                  onChange={val => setModalEditarLancamento({...modalEditarLancamento, status: val})}
                  options={['Pago', 'Pendente']}
                  allowCustom={false}
                />
              </div>

              {/* Trava de Segurança com Senha Master */}
              <div style={{ backgroundColor: 'rgba(96,165,250,0.08)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(96,165,250,0.25)', marginTop: '0.4rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <Shield size={16} /> Autenticação do Administrador Master
                </div>
                <input
                  required
                  type="password"
                  className="input-field"
                  placeholder="Digite sua Senha Master para confirmar..."
                  value={senhaMasterInput}
                  onChange={e => setSenhaMasterInput(e.target.value)}
                />
                {erroSenhaMaster && (
                  <div style={{ color: '#F87171', fontSize: '0.78rem', marginTop: '0.3rem', fontWeight: '600' }}>
                    {erroSenhaMaster}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalEditarLancamento(null)}>Cancelar</button>
                <button type="submit" className="btn-gold" style={{ backgroundColor: '#2563EB', borderColor: '#2563EB' }}>Confirmar Edição</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Excluir Lançamento com Senha Master */}
      {modalExcluirLancamento && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '460px', borderLeft: '4px solid #EF4444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#F87171', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} /> Excluir Lançamento Financeiro
              </h3>
              <button onClick={() => setModalExcluirLancamento(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Tem certeza que deseja excluir o lançamento <strong>"{modalExcluirLancamento.descricao}"</strong> no valor de <strong style={{ color: 'var(--text-main)' }}>R$ {(parseFloat(modalExcluirLancamento.valor) || 0).toFixed(2)}</strong>? Esta ação ajustará os totais do DRE e não pode ser desfeita.
            </p>

            <form onSubmit={handleConfirmarExclusaoMaster} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#F87171', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <Shield size={16} /> Autenticação de Exclusão (Senha Master)
                </div>
                <input
                  required
                  type="password"
                  className="input-field"
                  placeholder="Digite a Senha Master para confirmar exclusão..."
                  value={senhaMasterInput}
                  onChange={e => setSenhaMasterInput(e.target.value)}
                />
                {erroSenhaMaster && (
                  <div style={{ color: '#F87171', fontSize: '0.78rem', marginTop: '0.3rem', fontWeight: '600' }}>
                    {erroSenhaMaster}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalExcluirLancamento(null)}>Cancelar</button>
                <button type="submit" className="btn-gold" style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}>Excluir Permanentemente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
