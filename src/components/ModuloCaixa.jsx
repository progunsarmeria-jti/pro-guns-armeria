import React, { useState } from 'react'
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CreditCard,
  DollarSign,
  QrCode,
  FileText,
  X,
  Lock,
  Unlock,
  RefreshCw,
  ShoppingBag
} from 'lucide-react'
import CustomSelect from './CustomSelect'

export default function ModuloCaixa({
  caixas = [],
  setCaixas,
  ordens = [],
  setOrdens,
  estoque = [],
  setEstoque,
  financeiro = [],
  setFinanceiro,
  usuarioLogado,
  config
}) {
  const hojeStr = new Date().toISOString().split('T')[0]
  
  // Caixa do dia atual (se existir)
  const caixaAtual = caixas.find(c => c.data === hojeStr) || null

  // Modais State
  const [modalAbrirCaixa, setModalAbrirCaixa] = useState(false)
  const [modalNovoLancamento, setModalNovoLancamento] = useState(false)
  const [modalFecharCaixa, setModalFecharCaixa] = useState(false)
  const [modalRelatorioIntegra, setModalRelatorioIntegra] = useState(null) // guarda o caixa para emitir o relatório

  // Forms State
  const [fundoTrocoInicial, setFundoTrocoInicial] = useState('200.00')

  // State Novo Lançamento em Caixa
  const [tipoLancamento, setTipoLancamento] = useState('RECEBIMENTO_OS') // 'RECEBIMENTO_OS' | 'VENDA_BALCAO' | 'SANGRIA' | 'SUPRIMENTO'
  const [osSelecionadaId, setOsSelecionadaId] = useState('')
  const [pecaSelecionadaId, setPecaSelecionadaId] = useState('')
  const [qtdPeca, setQtdPeca] = useState('1')
  const [descricaoLancamento, setDescricaoLancamento] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('PIX') // 'Dinheiro' | 'PIX' | 'Cartão de Crédito' | 'Cartão de Débito'
  const [valorLancamento, setValorLancamento] = useState('')
  const [valorPagoCliente, setValorPagoCliente] = useState('')

  // State Fechamento de Caixa
  const [dinheiroInformado, setDinheiroInformado] = useState('')
  const [pixInformado, setPixInformado] = useState('')
  const [creditoInformado, setCreditoInformado] = useState('')
  const [debitoInformado, setDebitoInformado] = useState('')
  const [obsFechamento, setObsFechamento] = useState('')

  // ── Totais do Caixa Atual ──────────────────────────────────────────────────
  const movimentacoes = caixaAtual?.movimentacoes || []
  
  const totalDinheiro = movimentacoes.filter(m => m.forma_pagamento === 'Dinheiro' && m.tipo !== 'SANGRIA').reduce((acc, m) => acc + m.valor, 0)
  const totalPix      = movimentacoes.filter(m => m.forma_pagamento === 'PIX').reduce((acc, m) => acc + m.valor, 0)
  const totalCredito  = movimentacoes.filter(m => m.forma_pagamento === 'Cartão de Crédito').reduce((acc, m) => acc + m.valor, 0)
  const totalDebito   = movimentacoes.filter(m => m.forma_pagamento === 'Cartão de Débito').reduce((acc, m) => acc + m.valor, 0)
  const totalSangrias = movimentacoes.filter(m => m.tipo === 'SANGRIA').reduce((acc, m) => acc + m.valor, 0)
  const totalSuprimentos = movimentacoes.filter(m => m.tipo === 'SUPRIMENTO').reduce((acc, m) => acc + m.valor, 0)

  const saldoInicial = caixaAtual?.saldo_inicial || 0
  const faturamentoTotal = totalDinheiro + totalPix + totalCredito + totalDebito
  const esperadoEmDinheiro = saldoInicial + totalDinheiro + totalSuprimentos - totalSangrias

  // ── Handler Abertura de Caixa ───────────────────────────────────────────────
  const handleAbrirCaixa = (e) => {
    e.preventDefault()
    const fundo = parseFloat(fundoTrocoInicial) || 0
    const novoCaixa = {
      id: `cx_${Date.now()}`,
      data: hojeStr,
      hora_abertura: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      hora_fechamento: null,
      operador_abertura: usuarioLogado?.nome_completo || 'Operador Recepção',
      operador_fechamento: null,
      saldo_inicial: fundo,
      status: 'ABERTO',
      movimentacoes: [],
      conferencia: {}
    }
    setCaixas([novoCaixa, ...caixas])
    setModalAbrirCaixa(false)
  }

  // ── Handler Novo Lançamento de Caixa ─────────────────────────────────────────
  const handleSalvarLancamento = (e) => {
    e.preventDefault()
    if (!caixaAtual || caixaAtual.status !== 'ABERTO') return

    const val = parseFloat(valorLancamento) || 0
    if (val <= 0) return

    let desc = descricaoLancamento
    let osNumero = null

    // Se for recebimento de O.S
    if (tipoLancamento === 'RECEBIMENTO_OS') {
      const osFound = ordens.find(o => String(o.id) === String(osSelecionadaId))
      if (osFound) {
        desc = `Recebimento OS #${osFound.numero_os} (${osFound.cliente_nome})`
        osNumero = osFound.numero_os
        // Atualiza status da OS para CONCLUÍDO se pago integralmente
        const osAtualizada = { ...osFound, status: 'CONCLUÍDO' }
        setOrdens(prev => prev.map(o => o.id === osFound.id ? osAtualizada : o))
      }
    } else if (tipoLancamento === 'VENDA_BALCAO') {
      const pecaFound = estoque.find(p => String(p.id) === String(pecaSelecionadaId))
      const qtd = parseInt(qtdPeca) || 1
      if (pecaFound) {
        desc = `Venda Balcão: ${qtd}x ${pecaFound.nome}`
        // Abate estoque
        const estoqueAtualizado = estoque.map(p => {
          if (p.id === pecaFound.id) {
            return { ...p, quantidade: Math.max(0, p.quantidade - qtd) }
          }
          return p
        })
        setEstoque(estoqueAtualizado)
      }
    }

    const novaMov = {
      id: `mov_${Date.now()}`,
      tipo: tipoLancamento,
      descricao: desc,
      forma_pagamento: formaPagamento,
      valor: val,
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      os_numero: osNumero
    }

    // Atualiza Caixa
    const caixasAtualizados = caixas.map(c => {
      if (c.id === caixaAtual.id) {
        return {
          ...c,
          movimentacoes: [...(c.movimentacoes || []), novaMov]
        }
      }
      return c
    })
    setCaixas(caixasAtualizados)

    // Lança automaticamente no Financeiro Geral
    if (tipoLancamento === 'RECEBIMENTO_OS' || tipoLancamento === 'VENDA_BALCAO' || tipoLancamento === 'SUPRIMENTO') {
      const novoFin = {
        id: `f_${Date.now()}`,
        descricao: `[CAIXA] ${desc}`,
        tipo: 'Receita',
        categoria: tipoLancamento === 'RECEBIMENTO_OS' ? 'Serviço Armeria' : 'Venda de Balcão',
        valor: val,
        data_vencimento: hojeStr,
        data_pagamento: hojeStr,
        status: 'Pago',
        forma_pagamento: formaPagamento
      }
      setFinanceiro([novoFin, ...financeiro])
    } else if (tipoLancamento === 'SANGRIA') {
      const novoFin = {
        id: `f_${Date.now()}`,
        descricao: `[SANGRIA CAIXA] ${desc}`,
        tipo: 'Despesa',
        categoria: 'Sangria de Caixa',
        valor: val,
        data_vencimento: hojeStr,
        data_pagamento: hojeStr,
        status: 'Pago',
        forma_pagamento: 'Dinheiro'
      }
      setFinanceiro([novoFin, ...financeiro])
    }

    // Limpa modal
    setModalNovoLancamento(false)
    setValorLancamento('')
    setValorPagoCliente('')
    setDescricaoLancamento('')
    setOsSelecionadaId('')
    setPecaSelecionadaId('')
  }

  // ── Handler Fechamento de Caixa ──────────────────────────────────────────────
  const handleFecharCaixa = (e) => {
    e.preventDefault()
    if (!caixaAtual) return

    const dinInf = parseFloat(dinheiroInformado) || 0
    const pixInf = parseFloat(pixInformado) || 0
    const credInf = parseFloat(creditoInformado) || 0
    const debInf = parseFloat(debitoInformado) || 0

    const divDinheiro = dinInf - esperadoEmDinheiro

    const caixasAtualizados = caixas.map(c => {
      if (c.id === caixaAtual.id) {
        return {
          ...c,
          status: 'FECHADO',
          hora_fechamento: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          operador_fechamento: usuarioLogado?.nome_completo || 'Operador Recepção',
          conferencia: {
            dinheiro_informado: dinInf,
            pix_informado: pixInf,
            cartao_credito_informado: credInf,
            cartao_debito_informado: debInf,
            divergencia_dinheiro: divDinheiro,
            observacoes: obsFechamento
          }
        }
      }
      return c
    })

    setCaixas(caixasAtualizados)
    setModalFecharCaixa(false)
    
    // Abre o relatório na íntegra do caixa fechado
    const caixaFechado = caixasAtualizados.find(c => c.id === caixaAtual.id)
    setModalRelatorioIntegra(caixaFechado)
  }

  const trocoCalculado = Math.max(0, (parseFloat(valorPagoCliente) || 0) - (parseFloat(valorLancamento) || 0))

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header do Módulo Caixa */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gold-primary)', margin: 0 }}>
            Caixa Registradora & Frente de Loja
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Abertura, recebimentos por modalidade (Crédito, Débito, PIX, Dinheiro), sangrias, fechamento e relatório na íntegra.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {!caixaAtual || caixaAtual.status === 'FECHADO' ? (
            <button className="btn-gold" onClick={() => setModalAbrirCaixa(true)}>
              <Unlock size={18} />
              <span>Abrir Caixa do Dia</span>
            </button>
          ) : (
            <>
              <button className="btn-gold" onClick={() => setModalNovoLancamento(true)}>
                <Plus size={18} />
                <span>Registrar Pagamento / Venda</span>
              </button>
              <button className="btn-secondary" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#F87171', borderColor: '#EF4444' }} onClick={() => setModalFecharCaixa(true)}>
                <Lock size={18} />
                <span>Fechar Caixa</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Card Status do Caixa Atual */}
      <div className="card" style={{
        backgroundColor: caixaAtual?.status === 'ABERTO' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
        borderColor: caixaAtual?.status === 'ABERTO' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '12px',
              backgroundColor: caixaAtual?.status === 'ABERTO' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Wallet size={26} color={caixaAtual?.status === 'ABERTO' ? '#34D399' : '#F87171'} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  Caixa de Hoje ({hojeStr})
                </span>
                <span className={`badge ${caixaAtual?.status === 'ABERTO' ? 'badge-green' : 'badge-red'}`}>
                  {caixaAtual?.status === 'ABERTO' ? 'ABERTO' : 'FECHADO'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {caixaAtual ? (
                  <>Operador: <strong>{caixaAtual.operador_abertura}</strong> | Abertura: {caixaAtual.hora_abertura} hs</>
                ) : (
                  <>Nenhum caixa aberto para a data de hoje. Clique em "Abrir Caixa do Dia" para iniciar.</>
                )}
              </div>
            </div>
          </div>

          {caixaAtual && (
            <button
              className="btn-secondary"
              onClick={() => setModalRelatorioIntegra(caixaAtual)}
              style={{ fontSize: '0.82rem' }}
            >
              <Printer size={16} />
              <span>Ver Relatório Completo</span>
            </button>
          )}
        </div>
      </div>

      {/* Cards de Resumo Financeiro por Modalidade (quando Caixa Aberto) */}
      {caixaAtual && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>FUNDO INICIAL</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-main)' }}>R$ {saldoInicial.toFixed(2)}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: '#34D399', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <DollarSign size={14} /> DINHEIRO EM GAVETA
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#34D399' }}>R$ {esperadoEmDinheiro.toFixed(2)}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: '#60A5FA', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <QrCode size={14} /> RECEBIDOS PIX
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#60A5FA' }}>R$ {totalPix.toFixed(2)}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: '#A78BFA', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <CreditCard size={14} /> CARTÃO CRÉDITO
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#A78BFA' }}>R$ {totalCredito.toFixed(2)}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <CreditCard size={14} /> CARTÃO DÉBITO
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#F59E0B' }}>R$ {totalDebito.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Tabela de Movimentações do Caixa de Hoje */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: '700', color: 'var(--gold-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Movimentações Registradas Hoje ({movimentacoes.length})</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Faturamento Total: R$ {faturamentoTotal.toFixed(2)}</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>HORÁRIO</th>
              <th style={{ padding: '0.85rem 1rem' }}>TIPO</th>
              <th style={{ padding: '0.85rem 1rem' }}>DESCRIÇÃO</th>
              <th style={{ padding: '0.85rem 1rem' }}>PAGAMENTO</th>
              <th style={{ padding: '0.85rem 1rem' }}>VALOR (R$)</th>
            </tr>
          </thead>
          <tbody>
            {movimentacoes.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Nenhuma movimentação registrada no caixa de hoje ainda.
                </td>
              </tr>
            ) : (
              movimentacoes.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{m.hora}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`badge ${m.tipo === 'SANGRIA' ? 'badge-red' : 'badge-green'}`}>
                      {m.tipo === 'RECEBIMENTO_OS' ? 'Recebimento O.S' : m.tipo === 'VENDA_BALCAO' ? 'Venda Balcão' : m.tipo}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>{m.descricao}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      border: '1px solid var(--border-color)'
                    }}>
                      {m.forma_pagamento}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: m.tipo === 'SANGRIA' ? '#F87171' : '#34D399' }}>
                    {m.tipo === 'SANGRIA' ? '-' : '+'} R$ {m.valor.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Histórico de Caixas Anteriores Fechados */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--gold-primary)' }}>
          Histórico de Caixas Anteriores
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>DATA</th>
                <th style={{ padding: '0.75rem' }}>OPERADOR</th>
                <th style={{ padding: '0.75rem' }}>ABERTURA</th>
                <th style={{ padding: '0.75rem' }}>FECHAMENTO</th>
                <th style={{ padding: '0.75rem' }}>FUNDO INICIAL</th>
                <th style={{ padding: '0.75rem' }}>STATUS</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {caixas.map(cx => (
                <tr key={cx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: '700' }}>{cx.data}</td>
                  <td style={{ padding: '0.75rem' }}>{cx.operador_abertura}</td>
                  <td style={{ padding: '0.75rem' }}>{cx.hora_abertura} hs</td>
                  <td style={{ padding: '0.75rem' }}>{cx.hora_fechamento ? `${cx.hora_fechamento} hs` : '-'}</td>
                  <td style={{ padding: '0.75rem' }}>R$ {cx.saldo_inicial.toFixed(2)}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge ${cx.status === 'ABERTO' ? 'badge-green' : 'badge-gray'}`}>
                      {cx.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                      onClick={() => setModalRelatorioIntegra(cx)}
                    >
                      <Printer size={14} /> Relatório na Íntegra
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL ABRIR CAIXA ────────────────────────────────────────────────── */}
      {modalAbrirCaixa && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gold-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Unlock size={20} /> Abertura do Caixa Diário
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
              Informe o fundo de troco inicial da gaveta para iniciar a operação do dia.
            </p>
            <form onSubmit={handleAbrirCaixa} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Operador Responsável</label>
                <input disabled className="input-field" value={usuarioLogado?.nome_completo || 'Operador Recepção'} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Data do Caixa</label>
                <input disabled className="input-field" value={hojeStr} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: '700' }}>Fundo de Troco Inicial (R$) *</label>
                <input required type="number" step="0.01" className="input-field" value={fundoTrocoInicial} onChange={e => setFundoTrocoInicial(e.target.value)} placeholder="200.00" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalAbrirCaixa(false)}>Cancelar</button>
                <button type="submit" className="btn-gold">Confirmar Abertura</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL NOVO LANÇAMENTO / RECEBIMENTO DE O.S / VENDA ─────────────────── */}
      {modalNovoLancamento && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gold-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={20} /> Registar Lançamento no Caixa
            </h3>
            <form onSubmit={handleSalvarLancamento} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <CustomSelect
                label="Tipo de Lançamento"
                value={
                  tipoLancamento === 'RECEBIMENTO_OS' ? 'Recebimento de O.S.' :
                  tipoLancamento === 'VENDA_BALCAO' ? 'Venda de Peça/Insumo' :
                  tipoLancamento === 'SANGRIA' ? 'Sangria (Retirada)' : 'Suprimento (Aporte)'
                }
                onChange={val => {
                  if (val.includes('O.S')) setTipoLancamento('RECEBIMENTO_OS')
                  else if (val.includes('Venda')) setTipoLancamento('VENDA_BALCAO')
                  else if (val.includes('Sangria')) setTipoLancamento('SANGRIA')
                  else setTipoLancamento('SUPRIMENTO')
                }}
                options={['Recebimento de O.S.', 'Venda de Peça/Insumo', 'Sangria (Retirada)', 'Suprimento (Aporte)']}
                placeholder="Selecione o tipo..."
                allowCustom={false}
              />

              {/* Se for Recebimento de O.S. */}
              {tipoLancamento === 'RECEBIMENTO_OS' && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Selecione a Ordem de Serviço *</label>
                  <select
                    className="input-field"
                    value={osSelecionadaId}
                    onChange={e => {
                      const id = e.target.value
                      setOsSelecionadaId(id)
                      const os = ordens.find(o => String(o.id) === String(id))
                      if (os) {
                        setValorLancamento(os.valor_servico ? os.valor_servico.toString() : '0')
                      }
                    }}
                  >
                    <option value="">-- Escolha uma O.S em aberto --</option>
                    {ordens.filter(o => o.status !== 'CONCLUÍDO').map(o => (
                      <option key={o.id} value={o.id}>
                        OS #{o.numero_os} - {o.cliente_nome} ({o.marca_arma} {o.modelo_arma}) - R$ {(o.valor_servico || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Se for Venda de Peças */}
              {tipoLancamento === 'VENDA_BALCAO' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Peça / Insumo do Estoque *</label>
                    <select
                      className="input-field"
                      value={pecaSelecionadaId}
                      onChange={e => {
                        const id = e.target.value
                        setPecaSelecionadaId(id)
                        const p = estoque.find(item => String(item.id) === String(id))
                        if (p) {
                          const valCalc = (p.preco_venda * (parseInt(qtdPeca) || 1)).toFixed(2)
                          setValorLancamento(valCalc)
                        }
                      }}
                    >
                      <option value="">-- Escolha do Estoque --</option>
                      {estoque.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nome} (Qtd em estoque: {p.quantidade}) - R$ {p.preco_venda.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Qtd *</label>
                    <input
                      type="number" min="1" className="input-field"
                      value={qtdPeca}
                      onChange={e => {
                        const q = e.target.value
                        setQtdPeca(q)
                        const p = estoque.find(item => String(item.id) === String(pecaSelecionadaId))
                        if (p) {
                          setValorLancamento((p.preco_venda * (parseInt(q) || 1)).toFixed(2))
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {(tipoLancamento === 'SANGRIA' || tipoLancamento === 'SUPRIMENTO') && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Motivo / Descrição *</label>
                  <input className="input-field" value={descricaoLancamento} onChange={e => setDescricaoLancamento(e.target.value)} placeholder="Ex: Retirada para depósito no banco" />
                </div>
              )}

              {/* Seleção de Forma de Pagamento */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <CustomSelect
                  label="Forma de Pagamento *"
                  value={formaPagamento}
                  onChange={val => setFormaPagamento(val)}
                  options={['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito']}
                  placeholder="Selecione a forma..."
                  allowCustom={false}
                />
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: '700' }}>Valor a Cobrar (R$) *</label>
                  <input required type="number" step="0.01" className="input-field" value={valorLancamento} onChange={e => setValorLancamento(e.target.value)} placeholder="0.00" />
                </div>
              </div>

              {/* Se Pagamento em Dinheiro -> Campo Troco */}
              {formaPagamento === 'Dinheiro' && (
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#34D399' }}>Valor Recebido do Cliente (R$)</label>
                    <input type="number" step="0.01" className="input-field" value={valorPagoCliente} onChange={e => setValorPagoCliente(e.target.value)} placeholder="0.00" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Troco a Devolver (R$)</label>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: trocoCalculado > 0 ? '#F59E0B' : '#FFFFFF', paddingTop: '0.4rem' }}>
                      R$ {trocoCalculado.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalNovoLancamento(false)}>Cancelar</button>
                <button type="submit" className="btn-gold">Confirmar Lançamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL FECHAR CAIXA (CONFERÊNCIA FINANCEIRA) ────────────────────────── */}
      {modalFecharCaixa && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#F87171', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={20} /> Encerramento e Fechamento do Caixa
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Informe os valores contados na gaveta para realizar a conferência financeira final do dia.
            </p>

            <form onSubmit={handleFecharCaixa} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#34D399' }}>Contagem Dinheiro (Gaveta R$) *</label>
                  <input required type="number" step="0.01" className="input-field" value={dinheiroInformado} onChange={e => setDinheiroInformado(e.target.value)} placeholder={`Esperado R$ ${esperadoEmDinheiro.toFixed(2)}`} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#60A5FA' }}>Total Extrato PIX (R$)</label>
                  <input type="number" step="0.01" className="input-field" value={pixInformado} onChange={e => setPixInformado(e.target.value)} placeholder={`Esperado R$ ${totalPix.toFixed(2)}`} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#A78BFA' }}>Cartão Crédito (Maquininha R$)</label>
                  <input type="number" step="0.01" className="input-field" value={creditoInformado} onChange={e => setCreditoInformado(e.target.value)} placeholder={`Esperado R$ ${totalCredito.toFixed(2)}`} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#F59E0B' }}>Cartão Débito (Maquininha R$)</label>
                  <input type="number" step="0.01" className="input-field" value={debitoInformado} onChange={e => setDebitoInformado(e.target.value)} placeholder={`Esperado R$ ${totalDebito.toFixed(2)}`} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Observações da Conferência</label>
                <textarea className="input-field" rows={2} value={obsFechamento} onChange={e => setObsFechamento(e.target.value)} placeholder="Ex: Fundo de troco conferido sem divergências." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalFecharCaixa(false)}>Cancelar</button>
                <button type="submit" className="btn-gold" style={{ backgroundColor: '#DC2626', color: '#FFF' }}>
                  Encerrar e Fechar Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL RELATÓRIO NA ÍNTEGRA DO CAIXA (FOLHA COMPLETA) ──────────────── */}
      {modalRelatorioIntegra && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#FFFFFF', color: '#000000', padding: '2rem' }}>
            {/* Header de Impressão */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '1.2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>{config?.nome_fantasia || 'PRÓ GUNS ARMERIA'}</h2>
                <div style={{ fontSize: '0.82rem', color: '#444' }}>{config?.cr_armeria || 'CR-998877/2ª RM'} | CNPJ: {config?.cnpj || '12.345.678/0001-99'}</div>
                <div style={{ fontSize: '0.82rem', color: '#444' }}>{config?.endereco || 'Av. das Armas, 1000 - São Paulo SP'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>RELATÓRIO INTEGRAL DE CAIXA</div>
                <div style={{ fontSize: '0.85rem' }}>Data: <strong>{modalRelatorioIntegra.data}</strong></div>
                <div style={{ fontSize: '0.85rem' }}>Status: <strong>{modalRelatorioIntegra.status}</strong></div>
              </div>
            </div>

            {/* Informações da Abertura */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.82rem', backgroundColor: '#f3f4f6', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.2rem' }}>
              <div><strong>Operador Abertura:</strong> {modalRelatorioIntegra.operador_abertura}</div>
              <div><strong>Hora Abertura:</strong> {modalRelatorioIntegra.hora_abertura} hs</div>
              <div><strong>Fundo de Troco:</strong> R$ {modalRelatorioIntegra.saldo_inicial.toFixed(2)}</div>
              <div><strong>Operador Fechamento:</strong> {modalRelatorioIntegra.operador_fechamento || 'Em Aberto'}</div>
              <div><strong>Hora Fechamento:</strong> {modalRelatorioIntegra.hora_fechamento || 'Em Aberto'}</div>
            </div>

            {/* Tabela Integral de Movimentações */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.5rem', borderBottom: '1px solid #ccc', paddingBottom: '0.3rem' }}>
              EXTRATO DETALHADO DAS MOVIMENTAÇÕES
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '1.5rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000', backgroundColor: '#e5e7eb' }}>
                  <th style={{ padding: '0.4rem' }}>HORA</th>
                  <th style={{ padding: '0.4rem' }}>TIPO</th>
                  <th style={{ padding: '0.4rem' }}>DESCRIÇÃO</th>
                  <th style={{ padding: '0.4rem' }}>PAGAMENTO</th>
                  <th style={{ padding: '0.4rem', textAlign: 'right' }}>VALOR</th>
                </tr>
              </thead>
              <tbody>
                {(modalRelatorioIntegra.movimentacoes || []).map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.4rem' }}>{m.hora}</td>
                    <td style={{ padding: '0.4rem' }}>{m.tipo}</td>
                    <td style={{ padding: '0.4rem' }}>{m.descricao}</td>
                    <td style={{ padding: '0.4rem' }}>{m.forma_pagamento}</td>
                    <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: '700' }}>R$ {m.valor.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Resumo por Forma de Pagamento */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.5rem', borderBottom: '1px solid #ccc', paddingBottom: '0.3rem' }}>
              RESUMO CONSOLIDADO POR FORMA DE PAGAMENTO
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
              <div style={{ border: '1px solid #ddd', padding: '0.6rem', borderRadius: '4px' }}>
                <div>DINHEIRO:</div>
                <strong style={{ fontSize: '1rem' }}>R$ {(modalRelatorioIntegra.movimentacoes || []).filter(m => m.forma_pagamento === 'Dinheiro').reduce((a,b)=>a+b.valor,0).toFixed(2)}</strong>
              </div>
              <div style={{ border: '1px solid #ddd', padding: '0.6rem', borderRadius: '4px' }}>
                <div>PIX:</div>
                <strong style={{ fontSize: '1rem' }}>R$ {(modalRelatorioIntegra.movimentacoes || []).filter(m => m.forma_pagamento === 'PIX').reduce((a,b)=>a+b.valor,0).toFixed(2)}</strong>
              </div>
              <div style={{ border: '1px solid #ddd', padding: '0.6rem', borderRadius: '4px' }}>
                <div>CARTÃO CRÉDITO:</div>
                <strong style={{ fontSize: '1rem' }}>R$ {(modalRelatorioIntegra.movimentacoes || []).filter(m => m.forma_pagamento === 'Cartão de Crédito').reduce((a,b)=>a+b.valor,0).toFixed(2)}</strong>
              </div>
              <div style={{ border: '1px solid #ddd', padding: '0.6rem', borderRadius: '4px' }}>
                <div>CARTÃO DÉBITO:</div>
                <strong style={{ fontSize: '1rem' }}>R$ {(modalRelatorioIntegra.movimentacoes || []).filter(m => m.forma_pagamento === 'Cartão de Débito').reduce((a,b)=>a+b.valor,0).toFixed(2)}</strong>
              </div>
            </div>

            {/* Assinatura */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '2.5rem', textAlign: 'center', fontSize: '0.78rem' }}>
              <div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '0.3rem' }}>Assinatura Operador de Caixa</div>
                <div>{modalRelatorioIntegra.operador_abertura}</div>
              </div>
              <div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '0.3rem' }}>Assinatura Gerência / Armeiro Responsável</div>
                <div>{config?.nome_fantasia || 'Pró Guns Armeria'}</div>
              </div>
            </div>

            {/* Ações do Modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
              <button className="btn-secondary" style={{ color: '#333' }} onClick={() => setModalRelatorioIntegra(null)}>Fechar</button>
              <button className="btn-gold" onClick={() => window.print()}>
                <Printer size={16} /> Imprimir / PDF na Íntegra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
