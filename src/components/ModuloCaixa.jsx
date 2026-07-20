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
  ShoppingBag,
  TrendingUp,
  FileCheck
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
  const horaAgoraStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  // Caixa do dia atual (se existir)
  const caixaAtual = caixas.find(c => c.data === hojeStr) || null

  // Modais State
  const [modalAbrirCaixa, setModalAbrirCaixa] = useState(false)
  const [modalNovoLancamento, setModalNovoLancamento] = useState(false)
  const [modalFecharCaixa, setModalFecharCaixa] = useState(false)
  const [modalRelatorioIntegra, setModalRelatorioIntegra] = useState(null)

  // Forms State
  const [fundoTrocoInicial, setFundoTrocoInicial] = useState('100.00')

  // State Novo Lançamento em Caixa
  const [tipoLancamento, setTipoLancamento] = useState('RECEBIMENTO_OS') // 'RECEBIMENTO_OS' | 'VENDA_BALCAO' | 'SANGRIA' | 'REFORCO'
  const [osSelecionadaId, setOsSelecionadaId] = useState('')
  const [pecaSelecionadaId, setPecaSelecionadaId] = useState('')
  const [qtdPeca, setQtdPeca] = useState('1')
  const [descricaoLancamento, setDescricaoLancamento] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro') // 'Dinheiro' | 'PIX' | 'Cartão de Crédito na máquina' | 'Cartão de Débito na máquina'
  const [valorLancamento, setValorLancamento] = useState('')
  const [valorPagoCliente, setValorPagoCliente] = useState('')

  // State Fechamento de Caixa
  const [dinheiroInformado, setDinheiroInformado] = useState('')
  const [pixInformado, setPixInformado] = useState('')
  const [creditoInformado, setCreditoInformado] = useState('')
  const [debitoInformado, setDebitoInformado] = useState('')
  const [obsFechamento, setObsFechamento] = useState('')

  // ─── Cálculos e Métricas Padrão Tiro Digital ─────────────────────────────────
  const movimentacoes = caixaAtual?.movimentacoes || []
  
  // 1. Vendas / OS Geradas no Caixa
  const vendasGeradasList = movimentacoes.filter(m => m.tipo === 'RECEBIMENTO_OS' || m.tipo === 'VENDA_BALCAO')
  const qtdVendasGeradas = vendasGeradasList.length
  const valorTotalVendasGeradas = vendasGeradasList.reduce((acc, m) => acc + (m.valor || 0), 0)

  // 2. Pagamentos Recebidos por Modalidade (Valor e Qtd de Transações)
  const pagamentosDinheiro = movimentacoes.filter(m => m.forma_pagamento === 'Dinheiro' && m.tipo !== 'SANGRIA' && m.tipo !== 'REFORCO')
  const totalDinheiro      = pagamentosDinheiro.reduce((acc, m) => acc + (m.valor || 0), 0)
  const qtdDinheiro        = pagamentosDinheiro.length

  const pagamentosPix      = movimentacoes.filter(m => m.forma_pagamento === 'PIX')
  const totalPix           = pagamentosPix.reduce((acc, m) => acc + (m.valor || 0), 0)
  const qtdPix             = pagamentosPix.length

  const pagamentosCredito  = movimentacoes.filter(m => m.forma_pagamento?.includes('Crédito'))
  const totalCredito       = pagamentosCredito.reduce((acc, m) => acc + (m.valor || 0), 0)
  const qtdCredito         = pagamentosCredito.length

  const pagamentosDebito   = movimentacoes.filter(m => m.forma_pagamento?.includes('Débito'))
  const totalDebito        = pagamentosDebito.reduce((acc, m) => acc + (m.valor || 0), 0)
  const qtdDebito          = pagamentosDebito.length

  const totalPagosRecebidos = totalDinheiro + totalPix + totalCredito + totalDebito
  const qtdTotalPagamentos  = qtdDinheiro + qtdPix + qtdCredito + qtdDebito

  // 3. Sangrias e Reforços
  const sangriasList = movimentacoes.filter(m => m.tipo === 'SANGRIA')
  const totalSangrias = sangriasList.reduce((acc, m) => acc + (m.valor || 0), 0)

  const reforcosList = movimentacoes.filter(m => m.tipo === 'REFORCO' || m.tipo === 'SUPRIMENTO')
  const totalReforcos = reforcosList.reduce((acc, m) => acc + (m.valor || 0), 0)

  const saldoInicial = caixaAtual?.saldo_inicial || 0
  const saldoFinalDinheiroGaveta = saldoInicial + totalDinheiro + totalReforcos - totalSangrias

  // ─── Handler Abertura de Caixa ───────────────────────────────────────────────
  const handleAbrirCaixa = (e) => {
    e.preventDefault()
    const fundo = parseFloat(fundoTrocoInicial) || 0
    const horaAgora = `${hojeStr} ${horaAgoraStr}`
    
    // Cria movimentação inicial de reforço da abertura
    const movAbertura = {
      id: `mov_abertura_${Date.now()}`,
      tipo: 'REFORCO',
      descricao: 'Abertura do caixa recepção (Fundo de troco)',
      forma_pagamento: 'Dinheiro',
      valor: fundo,
      hora: horaAgoraStr
    }

    const novoCaixa = {
      id: `cx_${Date.now()}`,
      data: hojeStr,
      hora_abertura: horaAgora,
      hora_fechamento: null,
      operador_abertura: usuarioLogado?.nome_completo || 'WELTON PEREIRA LACERDA',
      operador_fechamento: null,
      saldo_inicial: fundo,
      status: 'ABERTO',
      movimentacoes: [movAbertura],
      conferencia: {}
    }
    setCaixas([novoCaixa, ...caixas])
    setModalAbrirCaixa(false)
  }

  // ─── Handler Novo Lançamento no Caixa ────────────────────────────────────────
  const handleSalvarLancamento = (e) => {
    e.preventDefault()
    if (!caixaAtual || caixaAtual.status !== 'ABERTO') return

    const val = parseFloat(valorLancamento) || 0
    if (val <= 0) return

    let desc = descricaoLancamento
    let osNumero = null

    if (tipoLancamento === 'RECEBIMENTO_OS') {
      const osFound = ordens.find(o => String(o.id) === String(osSelecionadaId))
      if (osFound) {
        desc = `Recebimento OS #${osFound.numero_os} (${osFound.cliente_nome})`
        osNumero = osFound.numero_os
        const osAtualizada = { ...osFound, status: 'CONCLUÍDO' }
        setOrdens(prev => prev.map(o => o.id === osFound.id ? osAtualizada : o))
      }
    } else if (tipoLancamento === 'VENDA_BALCAO') {
      const pecaFound = estoque.find(p => String(p.id) === String(pecaSelecionadaId))
      const qtd = parseInt(qtdPeca) || 1
      if (pecaFound) {
        desc = `Venda Balcão: ${qtd}x ${pecaFound.nome}`
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
      hora: horaAgoraStr,
      os_numero: osNumero
    }

    const caixasAtualizados = caixas.map(c => {
      if (c.id === caixaAtual.id) {
        return { ...c, movimentacoes: [...(c.movimentacoes || []), novaMov] }
      }
      return c
    })
    setCaixas(caixasAtualizados)

    // Lança no Financeiro Empresarial
    if (tipoLancamento === 'RECEBIMENTO_OS' || tipoLancamento === 'VENDA_BALCAO' || tipoLancamento === 'REFORCO') {
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

    setModalNovoLancamento(false)
    setValorLancamento('')
    setValorPagoCliente('')
    setDescricaoLancamento('')
    setOsSelecionadaId('')
    setPecaSelecionadaId('')
  }

  // ─── Handler Fechamento de Caixa ─────────────────────────────────────────────
  const handleFecharCaixa = (e) => {
    e.preventDefault()
    if (!caixaAtual) return

    const dinInf = parseFloat(dinheiroInformado) || 0
    const pixInf = parseFloat(pixInformado) || 0
    const credInf = parseFloat(creditoInformado) || 0
    const debInf = parseFloat(debitoInformado) || 0

    const divDinheiro = dinInf - saldoFinalDinheiroGaveta

    const horaFechamentoCompleta = `${hojeStr} ${horaAgoraStr}`

    const caixasAtualizados = caixas.map(c => {
      if (c.id === caixaAtual.id) {
        return {
          ...c,
          status: 'FECHADO',
          hora_fechamento: horaFechamentoCompleta,
          operador_fechamento: usuarioLogado?.nome_completo || 'WELTON PEREIRA LACERDA',
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
    
    const caixaFechado = caixasAtualizados.find(c => c.id === caixaAtual.id)
    setModalRelatorioIntegra(caixaFechado)
  }

  const trocoCalculado = Math.max(0, (parseFloat(valorPagoCliente) || 0) - (parseFloat(valorLancamento) || 0))

  // Helper de Cálculo de Dados do Relatório na Íntegra (Modelo Tiro Digital)
  const getRelatorioData = (targetCaixa) => {
    if (!targetCaixa) return null
    const movs = targetCaixa.movimentacoes || []
    
    const vnds = movs.filter(m => m.tipo === 'RECEBIMENTO_OS' || m.tipo === 'VENDA_BALCAO')
    const totalVendas = vnds.reduce((a, b) => a + (b.valor || 0), 0)
    
    const din = movs.filter(m => m.forma_pagamento === 'Dinheiro' && m.tipo !== 'SANGRIA' && m.tipo !== 'REFORCO')
    const pix = movs.filter(m => m.forma_pagamento === 'PIX')
    const cred = movs.filter(m => m.forma_pagamento?.includes('Crédito'))
    const deb = movs.filter(m => m.forma_pagamento?.includes('Débito'))
    
    const totDin = din.reduce((a, b) => a + (b.valor || 0), 0)
    const totPix = pix.reduce((a, b) => a + (b.valor || 0), 0)
    const totCred = cred.reduce((a, b) => a + (b.valor || 0), 0)
    const totDeb = deb.reduce((a, b) => a + (b.valor || 0), 0)
    const totPagos = totDin + totPix + totCred + totDeb

    const sangrias = movs.filter(m => m.tipo === 'SANGRIA')
    const totSangrias = sangrias.reduce((a, b) => a + (b.valor || 0), 0)

    const reforcos = movs.filter(m => m.tipo === 'REFORCO' || m.tipo === 'SUPRIMENTO')
    const totReforcos = reforcos.reduce((a, b) => a + (b.valor || 0), 0)

    const saldoIni = targetCaixa.saldo_inicial || 0
    const saldoFinalDin = saldoIni + totDin + totReforcos - totSangrias

    return {
      vendasCount: vnds.length,
      totalVendas,
      totalPagos,
      saldoFinalDin,
      saldoIni,
      totSangrias,
      totReforcos,
      totDin, qtdDin: din.length,
      totPix, qtdPix: pix.length,
      totCred, qtdCred: cred.length,
      totDeb, qtdDeb: deb.length,
      sangrias,
      reforcos
    }
  }

  const relData = modalRelatorioIntegra ? getRelatorioData(modalRelatorioIntegra) : null

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header do Módulo Caixa (Tiro Digital Style) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gold-primary)', margin: 0 }}>
            Caixa Registradora & Frente de Loja (Tiro Digital)
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Abertura, recebimentos por modalidade (Dinheiro, Cartão Crédito, Débito, PIX), sangrias, reforços e relatório na íntegra.
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

      {/* ─── BLCOS KPI DE ÍNTEGRA DO CAIXA (MODELO TIRO DIGITAL) ──────────────── */}
      {caixaAtual && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="card" style={{ borderLeft: '4px solid #3B82F6' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>VENDAS ¹</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#60A5FA', marginTop: '0.2rem' }}>
              {qtdVendasGeradas}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Vendas / O.S. geradas</div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #F59E0B' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>VALOR EM VENDAS ¹</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#F59E0B', marginTop: '0.2rem' }}>
              R$ {valorTotalVendasGeradas.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Valor bruto total em vendas</div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #10B981' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>PAGOS RECEBIDOS ²</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#34D399', marginTop: '0.2rem' }}>
              R$ {totalPagosRecebidos.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{qtdTotalPagamentos} pagamentos efetuados</div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid var(--gold-primary)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>SALDO FINAL EM DINHEIRO ⁴</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--gold-primary)', marginTop: '0.2rem' }}>
              R$ {saldoFinalDinheiroGaveta.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Disponível em espécie na gaveta</div>
          </div>
        </div>
      )}

      {/* Card Status Geral do Caixa */}
      <div className="card" style={{
        backgroundColor: caixaAtual?.status === 'ABERTO' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
        borderColor: caixaAtual?.status === 'ABERTO' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              backgroundColor: caixaAtual?.status === 'ABERTO' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Wallet size={24} color={caixaAtual?.status === 'ABERTO' ? '#34D399' : '#F87171'} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  Caixa Recepção ({hojeStr})
                </span>
                <span className={`badge ${caixaAtual?.status === 'ABERTO' ? 'badge-green' : 'badge-red'}`}>
                  {caixaAtual?.status === 'ABERTO' ? 'ABERTO' : 'FECHADO'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {caixaAtual ? (
                  <>Aberto em: <strong>{caixaAtual.hora_abertura}</strong> | Aberto por: <strong>{caixaAtual.operador_abertura}</strong></>
                ) : (
                  <>Caixa atualmente encerrado. Para iniciar os recebimentos do dia, clique em "Abrir Caixa do Dia".</>
                )}
              </div>
            </div>
          </div>

          {caixaAtual && (
            <button className="btn-secondary" onClick={() => setModalRelatorioIntegra(caixaAtual)} style={{ fontSize: '0.82rem' }}>
              <Printer size={16} />
              <span>Ver Íntegra do Caixa</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Movimentações em Aberto */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: '700', color: 'var(--gold-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Movimentações Registradas no Caixa Atual ({movimentacoes.length})</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Recebido: R$ {totalPagosRecebidos.toFixed(2)}</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>HORÁRIO</th>
              <th style={{ padding: '0.85rem 1rem' }}>TIPO</th>
              <th style={{ padding: '0.85rem 1rem' }}>DESCRIÇÃO</th>
              <th style={{ padding: '0.85rem 1rem' }}>FORMA PAGAMENTO</th>
              <th style={{ padding: '0.85rem 1rem' }}>VALOR (R$)</th>
            </tr>
          </thead>
          <tbody>
            {movimentacoes.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Nenhuma movimentação no caixa do dia ainda.
                </td>
              </tr>
            ) : (
              movimentacoes.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{m.hora}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`badge ${m.tipo === 'SANGRIA' ? 'badge-red' : m.tipo === 'REFORCO' ? 'badge-yellow' : 'badge-green'}`}>
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
          Histórico de Caixas Encerrados
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>DATA</th>
                <th style={{ padding: '0.75rem' }}>OPERADOR ABERTURA</th>
                <th style={{ padding: '0.75rem' }}>ABERTURA</th>
                <th style={{ padding: '0.75rem' }}>FECHAMENTO</th>
                <th style={{ padding: '0.75rem' }}>SALDO INICIAL</th>
                <th style={{ padding: '0.75rem' }}>STATUS</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>RELATÓRIO</th>
              </tr>
            </thead>
            <tbody>
              {caixas.map(cx => (
                <tr key={cx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: '700' }}>{cx.data}</td>
                  <td style={{ padding: '0.75rem' }}>{cx.operador_abertura}</td>
                  <td style={{ padding: '0.75rem' }}>{cx.hora_abertura}</td>
                  <td style={{ padding: '0.75rem' }}>{cx.hora_fechamento || '-'}</td>
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
                      <Printer size={14} /> Íntegra do Caixa
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
              Informe o valor em dinheiro do fundo de troco inicial para iniciar as operações.
            </p>
            <form onSubmit={handleAbrirCaixa} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Operador Responsável</label>
                <input disabled className="input-field" value={usuarioLogado?.nome_completo || 'WELTON PEREIRA LACERDA'} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Data da Abertura</label>
                <input disabled className="input-field" value={`${hojeStr} ${horaAgoraStr}`} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: '700' }}>Saldo Inicial em Dinheiro (R$) *</label>
                <input required type="number" step="0.01" className="input-field" value={fundoTrocoInicial} onChange={e => setFundoTrocoInicial(e.target.value)} placeholder="100.00" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalAbrirCaixa(false)}>Cancelar</button>
                <button type="submit" className="btn-gold">Confirmar Abertura</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL NOVO LANÇAMENTO DE PAGAMENTO / VENDA ────────────────────────── */}
      {modalNovoLancamento && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gold-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={20} /> Registrar Pagamento / Venda no Caixa
            </h3>
            <form onSubmit={handleSalvarLancamento} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <CustomSelect
                label="Tipo de Operação *"
                value={
                  tipoLancamento === 'RECEBIMENTO_OS' ? 'Recebimento de O.S.' :
                  tipoLancamento === 'VENDA_BALCAO' ? 'Venda de Peça/Insumo' :
                  tipoLancamento === 'SANGRIA' ? 'Sangria (Retirada)' : 'Reforço / Suprimento (Aporte)'
                }
                onChange={val => {
                  if (val.includes('O.S')) setTipoLancamento('RECEBIMENTO_OS')
                  else if (val.includes('Venda')) setTipoLancamento('VENDA_BALCAO')
                  else if (val.includes('Sangria')) setTipoLancamento('SANGRIA')
                  else setTipoLancamento('REFORCO')
                }}
                options={['Recebimento de O.S.', 'Venda de Peça/Insumo', 'Sangria (Retirada)', 'Reforço / Suprimento (Aporte)']}
                placeholder="Selecione o tipo..."
                allowCustom={false}
              />

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
                    <option value="">-- Selecione a O.S --</option>
                    {ordens.filter(o => o.status !== 'CONCLUÍDO').map(o => (
                      <option key={o.id} value={o.id}>
                        OS #{o.numero_os} - {o.cliente_nome} ({o.marca_arma} {o.modelo_arma}) - R$ {(o.valor_servico || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {tipoLancamento === 'VENDA_BALCAO' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Peça do Estoque *</label>
                    <select
                      className="input-field"
                      value={pecaSelecionadaId}
                      onChange={e => {
                        const id = e.target.value
                        setPecaSelecionadaId(id)
                        const p = estoque.find(item => String(item.id) === String(id))
                        if (p) {
                          setValorLancamento((p.preco_venda * (parseInt(qtdPeca) || 1)).toFixed(2))
                        }
                      }}
                    >
                      <option value="">-- Escolha da lista --</option>
                      {estoque.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nome} (Qtd: {p.quantidade}) - R$ {p.preco_venda.toFixed(2)}
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
                        if (p) setValorLancamento((p.preco_venda * (parseInt(q) || 1)).toFixed(2))
                      }}
                    />
                  </div>
                </div>
              )}

              {(tipoLancamento === 'SANGRIA' || tipoLancamento === 'REFORCO') && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Motivo / Observação *</label>
                  <input className="input-field" value={descricaoLancamento} onChange={e => setDescricaoLancamento(e.target.value)} placeholder="Ex: Aporte de troco para gaveta" />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <CustomSelect
                  label="Forma de Pagamento *"
                  value={formaPagamento}
                  onChange={val => setFormaPagamento(val)}
                  options={['Dinheiro', 'PIX', 'Cartão de Crédito na máquina', 'Cartão de Débito na máquina']}
                  placeholder="Selecione a forma..."
                  allowCustom={false}
                />
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: '700' }}>Valor Recebido (R$) *</label>
                  <input required type="number" step="0.01" className="input-field" value={valorLancamento} onChange={e => setValorLancamento(e.target.value)} placeholder="0.00" />
                </div>
              </div>

              {formaPagamento === 'Dinheiro' && (
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#34D399' }}>Valor Entregue pelo Cliente (R$)</label>
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
                <button type="submit" className="btn-gold">Confirmar Operação</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL FECHAR CAIXA ────────────────────────────────────────────────── */}
      {modalFecharCaixa && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#F87171', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={20} /> Encerrar e Fechar Caixa
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Confirme os valores contados em caixa para emissão do relatório final da íntegra.
            </p>

            <form onSubmit={handleFecharCaixa} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#34D399' }}>Contagem Dinheiro Gaveta (R$) *</label>
                  <input required type="number" step="0.01" className="input-field" value={dinheiroInformado} onChange={e => setDinheiroInformado(e.target.value)} placeholder={`Esperado R$ ${saldoFinalDinheiroGaveta.toFixed(2)}`} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#60A5FA' }}>Total Extrato PIX (R$)</label>
                  <input type="number" step="0.01" className="input-field" value={pixInformado} onChange={e => setPixInformado(e.target.value)} placeholder={`Esperado R$ ${totalPix.toFixed(2)}`} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#A78BFA' }}>Cartão Crédito Máquina (R$)</label>
                  <input type="number" step="0.01" className="input-field" value={creditoInformado} onChange={e => setCreditoInformado(e.target.value)} placeholder={`Esperado R$ ${totalCredito.toFixed(2)}`} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#F59E0B' }}>Cartão Débito Máquina (R$)</label>
                  <input type="number" step="0.01" className="input-field" value={debitoInformado} onChange={e => setDebitoInformado(e.target.value)} placeholder={`Esperado R$ ${totalDebito.toFixed(2)}`} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalFecharCaixa(false)}>Cancelar</button>
                <button type="submit" className="btn-gold" style={{ backgroundColor: '#DC2626', color: '#FFF' }}>
                  Encerrar e Gerar Íntegra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL RELATÓRIO "ÍNTEGRA DO CAIXA" (MODELO EXATO TIRO DIGITAL) ──────── */}
      {modalRelatorioIntegra && relData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '1rem' }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '800px',
            maxHeight: '92vh',
            overflowY: 'auto',
            backgroundColor: '#FFFFFF',
            color: '#111827',
            padding: '2.5rem',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            {/* Título do Documento */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.8rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '1px', fontWeight: '700' }}>
                {config?.nome_fantasia || 'PRÓ GUNS ARMERIA'} - SISTEMA DE GESTÃO
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#111827', margin: '0.2rem 0' }}>
                Íntegra do Caixa
              </h1>
            </div>

            {/* 4 Cards KPI Superiores (Modelo Tiro Digital) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ border: '1px solid #D1D5DB', borderRadius: '6px', padding: '0.75rem 0.5rem', textAlign: 'center', backgroundColor: '#F9FAFB' }}>
                <div style={{ fontSize: '0.7rem', color: '#4B5563', fontWeight: '600' }}>Vendas ¹</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#111827' }}>{relData.vendasCount}</div>
              </div>
              <div style={{ border: '1px solid #D1D5DB', borderRadius: '6px', padding: '0.75rem 0.5rem', textAlign: 'center', backgroundColor: '#F9FAFB' }}>
                <div style={{ fontSize: '0.7rem', color: '#4B5563', fontWeight: '600' }}>Valor em Vendas ¹</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827' }}>R$ {relData.totalVendas.toFixed(2)}</div>
              </div>
              <div style={{ border: '1px solid #D1D5DB', borderRadius: '6px', padding: '0.75rem 0.5rem', textAlign: 'center', backgroundColor: '#F9FAFB' }}>
                <div style={{ fontSize: '0.7rem', color: '#4B5563', fontWeight: '600' }}>Pagos Recebidos ²</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827' }}>R$ {relData.totalPagos.toFixed(2)}</div>
              </div>
              <div style={{ border: '1px solid #D1D5DB', borderRadius: '6px', padding: '0.75rem 0.5rem', textAlign: 'center', backgroundColor: '#F9FAFB' }}>
                <div style={{ fontSize: '0.7rem', color: '#4B5563', fontWeight: '600' }}>Saldo Final ⁴</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827' }}>R$ {relData.saldoFinalDin.toFixed(2)}</div>
              </div>
            </div>

            {/* 1. Visão Geral */}
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#111827', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
              Visão Geral
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '0.5rem', color: '#4B5563', width: '35%' }}>Caixa</td>
                  <td style={{ padding: '0.5rem', fontWeight: '600' }}>Caixa Recepção</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '0.5rem', color: '#4B5563' }}>Aberto em</td>
                  <td style={{ padding: '0.5rem', fontWeight: '600' }}>{modalRelatorioIntegra.hora_abertura}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '0.5rem', color: '#4B5563' }}>Aberto por</td>
                  <td style={{ padding: '0.5rem', fontWeight: '600' }}>{modalRelatorioIntegra.operador_abertura}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '0.5rem', color: '#4B5563' }}>Fechado em</td>
                  <td style={{ padding: '0.5rem', fontWeight: '600' }}>{modalRelatorioIntegra.hora_fechamento || 'Em aberto'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '0.5rem', color: '#4B5563' }}>Fechado por</td>
                  <td style={{ padding: '0.5rem', fontWeight: '600' }}>{modalRelatorioIntegra.operador_fechamento || 'Em aberto'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '0.5rem', color: '#4B5563' }}>Saldo Inicial em Dinheiro</td>
                  <td style={{ padding: '0.5rem', fontWeight: '600' }}>R$ {relData.saldoIni.toFixed(2)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '0.5rem', color: '#4B5563' }}>Diferença de Abertura</td>
                  <td style={{ padding: '0.5rem', fontWeight: '600' }}>R$ 0,00</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                  <td style={{ padding: '0.5rem', fontWeight: '700' }}>Saldo Final em Dinheiro</td>
                  <td style={{ padding: '0.5rem', fontWeight: '800', fontSize: '0.92rem' }}>R$ {relData.saldoFinalDin.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            {/* 2. Pagamentos Recebidos */}
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#111827', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
              Pagamentos Recebidos
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '1.5rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #D1D5DB', backgroundColor: '#F3F4F6' }}>
                  <th style={{ padding: '0.55rem' }}>Forma de Pagamento</th>
                  <th style={{ padding: '0.55rem' }}>Valor</th>
                  <th style={{ padding: '0.55rem', textAlign: 'right' }}>Qtd. de Pagamentos</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '0.5rem' }}>Dinheiro</td>
                  <td style={{ padding: '0.5rem', fontWeight: '600' }}>R$ {relData.totDin.toFixed(2)}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{relData.qtdDin}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '0.5rem' }}>Cartão de Crédito na máquina</td>
                  <td style={{ padding: '0.5rem', fontWeight: '600' }}>R$ {relData.totCred.toFixed(2)}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{relData.qtdCred}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '0.5rem' }}>Cartão de Débito na máquina</td>
                  <td style={{ padding: '0.5rem', fontWeight: '600' }}>R$ {relData.totDeb.toFixed(2)}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{relData.qtdDeb}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '0.5rem' }}>PIX</td>
                  <td style={{ padding: '0.5rem', fontWeight: '600' }}>R$ {relData.totPix.toFixed(2)}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{relData.qtdPix}</td>
                </tr>
                <tr style={{ borderBottom: '2px solid #111827', fontWeight: '800', backgroundColor: '#F9FAFB' }}>
                  <td style={{ padding: '0.55rem' }}>Total</td>
                  <td style={{ padding: '0.55rem' }}>R$ {relData.totalPagos.toFixed(2)}</td>
                  <td style={{ padding: '0.55rem', textAlign: 'right' }}>{relData.qtdDin + relData.qtdCred + relData.qtdDeb + relData.qtdPix}</td>
                </tr>
              </tbody>
            </table>

            {/* 3. Sangrias Registradas */}
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#111827', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
              Sangrias Registradas
            </h3>
            {relData.sangrias.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#6B7280', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                Nenhuma sangria registrada.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #D1D5DB', backgroundColor: '#F3F4F6' }}>
                    <th style={{ padding: '0.5rem' }}>Horário</th>
                    <th style={{ padding: '0.5rem' }}>Valor</th>
                    <th style={{ padding: '0.5rem' }}>Obs.</th>
                  </tr>
                </thead>
                <tbody>
                  {relData.sangrias.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '0.5rem' }}>{s.hora}</td>
                      <td style={{ padding: '0.5rem', fontWeight: '600' }}>R$ {s.valor.toFixed(2)}</td>
                      <td style={{ padding: '0.5rem' }}>{s.descricao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 4. Reforços Registrados */}
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#111827', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
              Reforços Registrados
            </h3>
            {relData.reforcos.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#6B7280', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                Nenhum reforço registrado.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #D1D5DB', backgroundColor: '#F3F4F6' }}>
                    <th style={{ padding: '0.5rem' }}>Horário</th>
                    <th style={{ padding: '0.5rem' }}>Valor</th>
                    <th style={{ padding: '0.5rem' }}>Obs.</th>
                  </tr>
                </thead>
                <tbody>
                  {relData.reforcos.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '0.5rem' }}>{r.hora}</td>
                      <td style={{ padding: '0.5rem', fontWeight: '600' }}>R$ {r.valor.toFixed(2)}</td>
                      <td style={{ padding: '0.5rem' }}>{r.descricao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 5. Vendas a Prazo Registradas */}
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#111827', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
              Vendas a Prazo Registradas
            </h3>
            <div style={{ fontSize: '0.8rem', color: '#6B7280', fontStyle: 'italic', marginBottom: '1.5rem' }}>
              Nenhuma venda a prazo registrada.
            </div>

            {/* Rodapé Explicativo (Modelo Tiro Digital) */}
            <div style={{ borderTop: '1px solid #D1D5DB', paddingTop: '1rem', fontSize: '0.72rem', color: '#4B5563', lineHeight: '1.5' }}>
              <p style={{ margin: '0.2rem 0' }}>¹ As vendas ou serviços exibidos representam todas as vendas e O.S. registradas para este caixa durante o período de abertura.</p>
              <p style={{ margin: '0.2rem 0' }}>² O valor de pagos recebidos se refere ao total de pagamentos recebidos por dinheiro, cartão, PIX, etc., para as vendas/OS deste ou de outros caixas.</p>
              <p style={{ margin: '0.2rem 0' }}>³ Os pagamentos em dinheiro efetuados em datas anteriores ou posteriores referente a vendas deste caixa serão computados conforme sua data.</p>
              <p style={{ margin: '0.2rem 0' }}>⁴ O saldo final representa o valor total em dinheiro em espécie disponível na gaveta do caixa.</p>
            </div>

            {/* Ações do Modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
              <button className="btn-secondary" style={{ color: '#374151', borderColor: '#D1D5DB' }} onClick={() => setModalRelatorioIntegra(null)}>
                Fechar
              </button>
              <button className="btn-gold" onClick={() => window.print()}>
                <Printer size={16} /> Imprimir Íntegra do Caixa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
