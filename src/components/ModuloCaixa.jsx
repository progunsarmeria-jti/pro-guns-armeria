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
  FileCheck,
  Edit,
  Trash2,
  Shield
} from 'lucide-react'
import CustomSelect from './CustomSelect'
import { isSupabaseConfigured, dbDelete, dbUpsertAll } from '../lib/supabase'
import { hojeISO, formatarData, formatarDataHora } from '../lib/dates'

const fmtBRL = (val) => {
  const num = parseFloat(val)
  return (isNaN(num) ? 0 : num).toFixed(2)
}

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
  usuarios = [],
  config
}) {
  // hojeStr é YYYY-MM-DD para comparações internas; exibição usa formatarData()
  const hojeStr = hojeISO()
  const horaAgoraStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  // Seletor de Abas Principais: 'atual' | 'historico'
  const [abaCaixaAtiva, setAbaCaixaAtiva] = useState('atual')

  // Caixa do dia atual (se existir)
  const caixaAtual = caixas.find(c => c.data === hojeStr) || null

  // Modais State
  const [modalAbrirCaixa, setModalAbrirCaixa] = useState(false)
  const [modalNovoLancamento, setModalNovoLancamento] = useState(false)
  const [modalFecharCaixa, setModalFecharCaixa] = useState(false)
  const [modalRelatorioIntegra, setModalRelatorioIntegra] = useState(null)

  // Modais de Edição e Exclusão com Senha Master
  const [modalEditarCaixaMaster, setModalEditarCaixaMaster] = useState(null)
  const [modalExcluirCaixaMaster, setModalExcluirCaixaMaster] = useState(null)
  const [senhaMasterInput, setSenhaMasterInput] = useState('')
  const [erroSenhaMaster, setErroSenhaMaster] = useState('')

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
  const movimentacoes = Array.isArray(caixaAtual?.movimentacoes) ? caixaAtual.movimentacoes : []
  
  // 1. Vendas / OS Geradas no Caixa
  const vendasGeradasList = movimentacoes.filter(m => m && (m.tipo === 'RECEBIMENTO_OS' || m.tipo === 'VENDA_BALCAO'))
  const qtdVendasGeradas = vendasGeradasList.length
  const valorTotalVendasGeradas = vendasGeradasList.reduce((acc, m) => acc + (parseFloat(m?.valor) || 0), 0)

  // 2. Pagamentos Recebidos por Modalidade (Valor e Qtd de Transações)
  const pagamentosDinheiro = movimentacoes.filter(m => m && m.forma_pagamento === 'Dinheiro' && m.tipo !== 'SANGRIA' && m.tipo !== 'REFORCO')
  const totalDinheiro      = pagamentosDinheiro.reduce((acc, m) => acc + (parseFloat(m?.valor) || 0), 0)
  const qtdDinheiro        = pagamentosDinheiro.length

  const pagamentosPix      = movimentacoes.filter(m => m && m.forma_pagamento === 'PIX')
  const totalPix           = pagamentosPix.reduce((acc, m) => acc + (parseFloat(m?.valor) || 0), 0)
  const qtdPix             = pagamentosPix.length

  const pagamentosCredito  = movimentacoes.filter(m => m && m.forma_pagamento && String(m.forma_pagamento).includes('Crédito'))
  const totalCredito       = pagamentosCredito.reduce((acc, m) => acc + (parseFloat(m?.valor) || 0), 0)
  const qtdCredito         = pagamentosCredito.length

  const pagamentosDebito   = movimentacoes.filter(m => m && m.forma_pagamento && String(m.forma_pagamento).includes('Débito'))
  const totalDebito        = pagamentosDebito.reduce((acc, m) => acc + (parseFloat(m?.valor) || 0), 0)
  const qtdDebito          = pagamentosDebito.length

  const totalPagosRecebidos = totalDinheiro + totalPix + totalCredito + totalDebito
  const qtdTotalPagamentos  = qtdDinheiro + qtdPix + qtdCredito + qtdDebito

  // 3. Sangrias e Reforços
  const sangriasList = movimentacoes.filter(m => m && m.tipo === 'SANGRIA')
  const totalSangrias = sangriasList.reduce((acc, m) => acc + (parseFloat(m?.valor) || 0), 0)

  const reforcosList = movimentacoes.filter(m => m && (m.tipo === 'REFORCO' || m.tipo === 'SUPRIMENTO'))
  const totalReforcos = reforcosList.reduce((acc, m) => acc + (parseFloat(m?.valor) || 0), 0)

  const saldoInicial = parseFloat(caixaAtual?.saldo_inicial) || 0
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
    if (e) e.preventDefault()
    if (!caixaAtual) return

    const dinInf = parseFloat(dinheiroInformado) || 0
    const pixInf = parseFloat(pixInformado) || 0
    const credInf = parseFloat(creditoInformado) || 0
    const debInf = parseFloat(debitoInformado) || 0

    const divDinheiro = dinInf - (saldoFinalDinheiroGaveta || 0)
    const horaFechamentoCompleta = `${hojeStr} ${horaAgoraStr}`

    const caixaAtualizadoItem = {
      ...caixaAtual,
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

    const caixasAtualizados = (caixas || []).map(c => {
      if (c && c.id === caixaAtual.id) {
        return caixaAtualizadoItem
      }
      return c
    })

    if (typeof setCaixas === 'function') {
      setCaixas(caixasAtualizados)
    }

    setModalFecharCaixa(false)
    setDinheiroInformado('')
    setPixInformado('')
    setCreditoInformado('')
    setDebitoInformado('')
    setObsFechamento('')
    setModalRelatorioIntegra(caixaAtualizadoItem)
  }

  const trocoCalculado = Math.max(0, (parseFloat(valorPagoCliente) || 0) - (parseFloat(valorLancamento) || 0))

  // Helper de Cálculo de Dados do Relatório na Íntegra (Modelo Tiro Digital)
  const getRelatorioData = (targetCaixa) => {
    if (!targetCaixa) return null
    const movs = Array.isArray(targetCaixa.movimentacoes) ? targetCaixa.movimentacoes : []
    
    const vnds = movs.filter(m => m && (m.tipo === 'RECEBIMENTO_OS' || m.tipo === 'VENDA_BALCAO'))
    const totalVendas = vnds.reduce((a, b) => a + (parseFloat(b?.valor) || 0), 0)
    
    const din = movs.filter(m => m && m.forma_pagamento === 'Dinheiro' && m.tipo !== 'SANGRIA' && m.tipo !== 'REFORCO')
    const pix = movs.filter(m => m && m.forma_pagamento === 'PIX')
    const cred = movs.filter(m => m && m.forma_pagamento && String(m.forma_pagamento).includes('Crédito'))
    const deb = movs.filter(m => m && m.forma_pagamento && String(m.forma_pagamento).includes('Débito'))
    
    const totDin = din.reduce((a, b) => a + (parseFloat(b?.valor) || 0), 0)
    const totPix = pix.reduce((a, b) => a + (parseFloat(b?.valor) || 0), 0)
    const totCred = cred.reduce((a, b) => a + (parseFloat(b?.valor) || 0), 0)
    const totDeb = deb.reduce((a, b) => a + (parseFloat(b?.valor) || 0), 0)
    const totPagos = totDin + totPix + totCred + totDeb

    const sangrias = movs.filter(m => m && m.tipo === 'SANGRIA')
    const totSangrias = sangrias.reduce((a, b) => a + (parseFloat(b?.valor) || 0), 0)

    const reforcos = movs.filter(m => m && (m.tipo === 'REFORCO' || m.tipo === 'SUPRIMENTO'))
    const totReforcos = reforcos.reduce((a, b) => a + (parseFloat(b?.valor) || 0), 0)

    const saldoIni = parseFloat(targetCaixa.saldo_inicial) || 0
    const saldoFinalDin = saldoIni + totDin + totReforcos - totSangrias

    return {
      vendasCount: vnds.length,
      totalVendas: Number(totalVendas) || 0,
      totalPagos: Number(totPagos) || 0,
      saldoFinalDin: Number(saldoFinalDin) || 0,
      saldoIni: Number(saldoIni) || 0,
      totSangrias: Number(totSangrias) || 0,
      totReforcos: Number(totReforcos) || 0,
      totDin: Number(totDin) || 0, qtdDin: din.length,
      totPix: Number(totPix) || 0, qtdPix: pix.length,
      totCred: Number(totCred) || 0, qtdCred: cred.length,
      totDeb: Number(totDeb) || 0, qtdDeb: deb.length,
      sangrias,
      reforcos
    }
  }

  const relData = modalRelatorioIntegra ? getRelatorioData(modalRelatorioIntegra) : null

  // ─── Handlers de Edição e Exclusão de Caixas com Senha Master ───────────────
  const handleConfirmarEdicaoCaixaMaster = (e) => {
    if (e) e.preventDefault()
    if (!modalEditarCaixaMaster) return

    const usuariosMaster = (usuarios || []).filter(u => u.perfil === 'master')
    const masterValido = usuariosMaster.find(u => (u.senha_pessoal || '').trim() === senhaMasterInput.trim()) ||
      (usuarioLogado?.perfil === 'master' && (usuarioLogado.senha_pessoal || '').trim() === senhaMasterInput.trim())

    if (!masterValido) {
      setErroSenhaMaster('Senha Master incorreta! Operação não autorizada.')
      return
    }

    const caixasAtualizados = caixas.map(c => {
      if (c.id === modalEditarCaixaMaster.id) {
        return {
          ...c,
          saldo_inicial: parseFloat(modalEditarCaixaMaster.saldo_inicial) || 0,
          status: modalEditarCaixaMaster.status,
          operador_abertura: modalEditarCaixaMaster.operador_abertura || c.operador_abertura,
          operador_fechamento: modalEditarCaixaMaster.operador_fechamento || c.operador_fechamento
        }
      }
      return c
    })

    if (typeof setCaixas === 'function') {
      setCaixas(caixasAtualizados)
    }

    if (isSupabaseConfigured()) {
      dbUpsertAll('caixas', caixasAtualizados)
    }

    setModalEditarCaixaMaster(null)
    setSenhaMasterInput('')
    setErroSenhaMaster('')
    alert('Caixa diário atualizado com sucesso!')
  }

  const handleConfirmarExclusaoCaixaMaster = (e) => {
    if (e) e.preventDefault()
    if (!modalExcluirCaixaMaster) return

    const usuariosMaster = (usuarios || []).filter(u => u.perfil === 'master')
    const masterValido = usuariosMaster.find(u => (u.senha_pessoal || '').trim() === senhaMasterInput.trim()) ||
      (usuarioLogado?.perfil === 'master' && (usuarioLogado.senha_pessoal || '').trim() === senhaMasterInput.trim())

    if (!masterValido) {
      setErroSenhaMaster('Senha Master incorreta! Operação não autorizada.')
      return
    }

    const caixaParaDeletar = modalExcluirCaixaMaster
    const caixasFiltrados = caixas.filter(c => String(c.id) !== String(caixaParaDeletar.id))

    if (typeof setCaixas === 'function') {
      setCaixas(caixasFiltrados)
    }

    if (isSupabaseConfigured()) {
      dbDelete('caixas', caixaParaDeletar.id)
    }

    setModalExcluirCaixaMaster(null)
    setSenhaMasterInput('')
    setErroSenhaMaster('')
    alert(`Caixa do dia ${formatarData(caixaParaDeletar.data)} excluído com sucesso!`)
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header do Módulo Caixa */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--gold-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Wallet size={24} color="var(--gold-accent)" />
            <span>Caixa Registradora & Frente de Loja</span>
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Abertura, recebimentos por modalidade (Dinheiro, Cartão Crédito, Débito, PIX), sangrias, reforços e relatório na íntegra.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {!caixaAtual || caixaAtual.status === 'FECHADO' ? (
            <button className="btn-gold" onClick={() => setModalAbrirCaixa(true)}>
              <Unlock size={16} />
              <span>Abrir Caixa do Dia</span>
            </button>
          ) : (
            <>
              <button className="btn-gold" onClick={() => setModalNovoLancamento(true)}>
                <Plus size={16} />
                <span>Registrar Pagamento / Venda</span>
              </button>
              <button className="btn-secondary" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#F87171', borderColor: '#EF4444' }} onClick={() => setModalFecharCaixa(true)}>
                <Lock size={16} />
                <span>Fechar Caixa</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* SELETOR DE ABAS PRINCIPAIS DO CAIXA: CAIXA DO DIA vs HISTÓRICO */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '2px solid var(--border-color)',
        paddingBottom: '0.1rem',
        overflowX: 'auto'
      }}>
        <button
          type="button"
          onClick={() => setAbaCaixaAtiva('atual')}
          style={{
            padding: '0.65rem 1.2rem',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            borderBottom: abaCaixaAtiva === 'atual' ? '3px solid var(--gold-primary)' : '3px solid transparent',
            backgroundColor: abaCaixaAtiva === 'atual' ? 'var(--bg-card)' : 'transparent',
            color: abaCaixaAtiva === 'atual' ? 'var(--gold-primary)' : 'var(--text-muted)',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
        >
          <Wallet size={16} />
          <span>Caixa do Dia ({formatarData(hojeStr)})</span>
          {caixaAtual?.status === 'ABERTO' ? (
            <span className="badge badge-green" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>ABERTO</span>
          ) : (
            <span className="badge badge-red" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>FECHADO</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setAbaCaixaAtiva('historico')}
          style={{
            padding: '0.65rem 1.2rem',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            borderBottom: abaCaixaAtiva === 'historico' ? '3px solid #60A5FA' : '3px solid transparent',
            backgroundColor: abaCaixaAtiva === 'historico' ? 'var(--bg-card)' : 'transparent',
            color: abaCaixaAtiva === 'historico' ? '#60A5FA' : 'var(--text-muted)',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
        >
          <Clock size={16} />
          <span>Histórico de Caixas Anteriores</span>
          <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
            {caixas.filter(c => c.data !== hojeStr).length}
          </span>
        </button>
      </div>

      {/* ─── ABA 1: CAIXA DO DIA ATUAL ────────────────────────────────────────── */}
      {abaCaixaAtiva === 'atual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 4 CARDS KPI DE RESUMO DO CAIXA DO DIA */}
          {caixaAtual && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="card" style={{ borderLeft: '4px solid #3B82F6' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>VENDAS ¹</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#60A5FA', marginTop: '0.2rem' }}>
                  {qtdVendasGeradas}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Vendas / O.S. geradas</div>
              </div>

              <div className="card" style={{ borderLeft: '4px solid #F59E0B' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>VALOR EM VENDAS ¹</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#F59E0B', marginTop: '0.2rem' }}>
                  R$ {fmtBRL(valorTotalVendasGeradas)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Valor bruto total em vendas</div>
              </div>

              <div className="card" style={{ borderLeft: '4px solid #10B981' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>PAGOS RECEBIDOS ²</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#34D399', marginTop: '0.2rem' }}>
                  R$ {fmtBRL(totalPagosRecebidos)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{qtdTotalPagamentos} pagamentos efetuados</div>
              </div>

              <div className="card" style={{ borderLeft: '4px solid var(--gold-primary)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>SALDO FINAL EM DINHEIRO ⁴</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--gold-primary)', marginTop: '0.2rem' }}>
                  R$ {fmtBRL(saldoFinalDinheiroGaveta)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Disponível em espécie na gaveta</div>
              </div>
            </div>
          )}

          {/* CARD DE STATUS DO CAIXA DO DIA */}
          {caixaAtual ? (
            <div className="card" style={{
              backgroundColor: caixaAtual.status === 'ABERTO' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
              borderColor: caixaAtual.status === 'ABERTO' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '10px',
                    backgroundColor: caixaAtual.status === 'ABERTO' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Wallet size={22} color={caixaAtual.status === 'ABERTO' ? '#34D399' : '#F87171'} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)' }}>
                        Caixa Recepção ({formatarData(hojeStr)})
                      </span>
                      <span className={`badge ${caixaAtual.status === 'ABERTO' ? 'badge-green' : 'badge-red'}`}>
                        {caixaAtual.status === 'ABERTO' ? 'ABERTO' : 'FECHADO'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Aberto em: <strong>{caixaAtual.hora_abertura}</strong> | Aberto por: <strong>{caixaAtual.operador_abertura}</strong>
                    </div>
                  </div>
                </div>
                <button className="btn-secondary" onClick={() => setModalRelatorioIntegra(caixaAtual)} style={{ fontSize: '0.82rem' }}>
                  <Printer size={16} />
                  <span>Ver Íntegra do Caixa</span>
                </button>
              </div>
            </div>
          ) : (
            /* Nenhum caixa aberto/registrado hoje — exibe orientação limpa sem induzir erro */
            <div className="card" style={{
              backgroundColor: 'rgba(96, 165, 250, 0.05)',
              borderColor: 'rgba(96, 165, 250, 0.25)',
              display: 'flex', alignItems: 'center', gap: '1rem'
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                backgroundColor: 'rgba(96, 165, 250, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Unlock size={22} color="#60A5FA" />
              </div>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  Nenhum caixa aberto hoje ({formatarData(hojeStr)})
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Nenhum caixa foi iniciado para o dia de hoje. Clique em <strong style={{ color: '#60A5FA' }}>"Abrir Caixa do Dia"</strong> para começar.
                </div>
              </div>
            </div>
          )}

          {/* TABELA DE MOVIMENTAÇÕES DO CAIXA DO DIA */}
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-color)', fontWeight: '700', color: 'var(--gold-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Movimentações Registradas no Caixa Atual ({movimentacoes.length})</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Recebido: R$ {fmtBRL(totalPagosRecebidos)}</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>HORÁRIO</th>
                  <th style={{ padding: '0.75rem 1rem' }}>TIPO</th>
                  <th style={{ padding: '0.75rem 1rem' }}>DESCRIÇÃO</th>
                  <th style={{ padding: '0.75rem 1rem' }}>FORMA PAGAMENTO</th>
                  <th style={{ padding: '0.75rem 1rem' }}>VALOR (R$)</th>
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
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{m.hora}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`badge ${m.tipo === 'SANGRIA' ? 'badge-red' : m.tipo === 'REFORCO' ? 'badge-yellow' : 'badge-green'}`}>
                          {m.tipo === 'RECEBIMENTO_OS' ? 'Recebimento O.S' : m.tipo === 'VENDA_BALCAO' ? 'Venda Balcão' : m.tipo}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{m.descricao}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          border: '1px solid var(--border-color)'
                        }}>
                          {m.forma_pagamento}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: m.tipo === 'SANGRIA' ? '#F87171' : '#34D399' }}>
                        {m.tipo === 'SANGRIA' ? '-' : '+'} R$ {fmtBRL(m.valor)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ABA 2: HISTÓRICO DE CAIXAS ANTERIORES ────────────────────────────── */}
      {abaCaixaAtiva === 'historico' && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-color)', fontWeight: '700', color: '#60A5FA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Histórico de Caixas Anteriores ({caixas.length})</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>* Apenas Admin Master pode Editar ou Excluir Caixas</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>DATA</th>
                <th style={{ padding: '0.75rem 1rem' }}>OPERADOR ABERTURA</th>
                <th style={{ padding: '0.75rem 1rem' }}>HORA ABERTURA</th>
                <th style={{ padding: '0.75rem 1rem' }}>HORA FECHAMENTO</th>
                <th style={{ padding: '0.75rem 1rem' }}>SALDO INICIAL</th>
                <th style={{ padding: '0.75rem 1rem' }}>STATUS</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {caixas.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum caixa registrado no histórico.
                  </td>
                </tr>
              ) : (
                caixas.map(cx => (
                  <tr key={cx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: 'var(--gold-accent)' }}>{formatarData(cx.data)}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{cx.operador_abertura}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{cx.hora_abertura}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{cx.hora_fechamento || 'Em aberto'}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>R$ {fmtBRL(cx.saldo_inicial)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${cx.status === 'ABERTO' ? 'badge-green' : 'badge-red'}`}>
                        {cx.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                          onClick={() => setModalRelatorioIntegra(cx)}
                          title="Ver Íntegra do Caixa"
                        >
                          <Printer size={13} />
                          <span>Íntegra</span>
                        </button>

                        <button
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', color: '#60A5FA', borderColor: 'rgba(96,165,250,0.4)' }}
                          onClick={() => { setModalEditarCaixaMaster(cx); setSenhaMasterInput(''); setErroSenhaMaster('') }}
                          title="Editar Caixa (Requer Senha Master)"
                        >
                          <Edit size={13} />
                          <span>Editar</span>
                        </button>

                        <button
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', color: '#F87171', borderColor: 'rgba(239,68,68,0.4)' }}
                          onClick={() => { setModalExcluirCaixaMaster(cx); setSenhaMasterInput(''); setErroSenhaMaster('') }}
                          title="Excluir Caixa (Requer Senha Master)"
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
      )}

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
                <input disabled className="input-field" value={`${formatarData(hojeStr)} ${horaAgoraStr}`} />
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
                        OS #{o.numero_os} - {o.cliente_nome} ({o.marca_arma} {o.modelo_arma}) - R$ {fmtBRL(o.valor_servico)}
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
                          setValorLancamento(fmtBRL(p.preco_venda * (parseInt(qtdPeca) || 1)))
                        }
                      }}
                    >
                      <option value="">-- Escolha da lista --</option>
                      {estoque.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nome} (Qtd: {p.quantidade}) - R$ {fmtBRL(p.preco_venda)}
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
                        if (p) setValorLancamento(fmtBRL(p.preco_venda * (parseInt(q) || 1)))
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
                      R$ {fmtBRL(trocoCalculado)}
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
                  <input required type="number" step="0.01" className="input-field" value={dinheiroInformado} onChange={e => setDinheiroInformado(e.target.value)} placeholder={`Esperado R$ ${fmtBRL(saldoFinalDinheiroGaveta)}`} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#60A5FA' }}>Total Extrato PIX (R$)</label>
                  <input type="number" step="0.01" className="input-field" value={pixInformado} onChange={e => setPixInformado(e.target.value)} placeholder={`Esperado R$ ${fmtBRL(totalPix)}`} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#A78BFA' }}>Cartão Crédito Máquina (R$)</label>
                  <input type="number" step="0.01" className="input-field" value={creditoInformado} onChange={e => setCreditoInformado(e.target.value)} placeholder={`Esperado R$ ${fmtBRL(totalCredito)}`} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#F59E0B' }}>Cartão Débito Máquina (R$)</label>
                  <input type="number" step="0.01" className="input-field" value={debitoInformado} onChange={e => setDebitoInformado(e.target.value)} placeholder={`Esperado R$ ${fmtBRL(totalDebito)}`} />
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
          <div className="card print-area" style={{
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
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827' }}>R$ {fmtBRL(relData.totalVendas)}</div>
              </div>
              <div style={{ border: '1px solid #D1D5DB', borderRadius: '6px', padding: '0.75rem 0.5rem', textAlign: 'center', backgroundColor: '#F9FAFB' }}>
                <div style={{ fontSize: '0.7rem', color: '#4B5563', fontWeight: '600' }}>Pagos Recebidos ²</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827' }}>R$ {fmtBRL(relData.totalPagos)}</div>
              </div>
              <div style={{ border: '1px solid #D1D5DB', borderRadius: '6px', padding: '0.75rem 0.5rem', textAlign: 'center', backgroundColor: '#F9FAFB' }}>
                <div style={{ fontSize: '0.7rem', color: '#4B5563', fontWeight: '600' }}>Saldo Final ⁴</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827' }}>R$ {fmtBRL(relData.saldoFinalDin)}</div>
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
                  <td style={{ padding: '0.5rem', fontWeight: '600' }}>R$ {fmtBRL(relData.saldoIni)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '0.5rem', color: '#4B5563' }}>Diferença de Abertura</td>
                  <td style={{ padding: '0.5rem', fontWeight: '600' }}>R$ 0,00</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                  <td style={{ padding: '0.5rem', fontWeight: '700' }}>Saldo Final em Dinheiro</td>
                  <td style={{ padding: '0.5rem', fontWeight: '800', fontSize: '0.92rem' }}>R$ {fmtBRL(relData.saldoFinalDin)}</td>
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
                  <td style={{ padding: '0.5rem', fontWeight: '600' }}>R$ {fmtBRL(relData.totDin)}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{relData.qtdDin}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '0.5rem' }}>Cartão de Crédito na máquina</td>
                  <td style={{ padding: '0.5rem', fontWeight: '600' }}>R$ {fmtBRL(relData.totCred)}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{relData.qtdCred}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '0.5rem' }}>Cartão de Débito na máquina</td>
                  <td style={{ padding: '0.5rem', fontWeight: '600' }}>R$ {fmtBRL(relData.totDeb)}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{relData.qtdDeb}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '0.5rem' }}>PIX</td>
                  <td style={{ padding: '0.5rem', fontWeight: '600' }}>R$ {fmtBRL(relData.totPix)}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{relData.qtdPix}</td>
                </tr>
                <tr style={{ borderBottom: '2px solid #111827', fontWeight: '800', backgroundColor: '#F9FAFB' }}>
                  <td style={{ padding: '0.55rem' }}>Total</td>
                  <td style={{ padding: '0.55rem' }}>R$ {fmtBRL(relData.totalPagos)}</td>
                  <td style={{ padding: '0.55rem', textAlign: 'right' }}>{(relData.qtdDin || 0) + (relData.qtdCred || 0) + (relData.qtdDeb || 0) + (relData.qtdPix || 0)}</td>
                </tr>
              </tbody>
            </table>

            {/* 3. Sangrias Registradas */}
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#111827', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
              Sangrias Registradas
            </h3>
            {(!relData.sangrias || relData.sangrias.length === 0) ? (
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
                  {relData.sangrias.map((s, idx) => (
                    <tr key={s?.id || idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '0.5rem' }}>{s?.hora || '-'}</td>
                      <td style={{ padding: '0.5rem', fontWeight: '600' }}>R$ {fmtBRL(s?.valor)}</td>
                      <td style={{ padding: '0.5rem' }}>{s?.descricao || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 4. Reforços Registrados */}
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#111827', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.4rem', marginBottom: '0.6rem' }}>
              Reforços Registrados
            </h3>
            {(!relData.reforcos || relData.reforcos.length === 0) ? (
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
                  {relData.reforcos.map((r, idx) => (
                    <tr key={r?.id || idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '0.5rem' }}>{r?.hora || '-'}</td>
                      <td style={{ padding: '0.5rem', fontWeight: '600' }}>R$ {fmtBRL(r?.valor)}</td>
                      <td style={{ padding: '0.5rem' }}>{r?.descricao || '-'}</td>
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
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
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

      {/* ── MODAL EDITAR CAIXA (REQUER SENHA MASTER) ─────────────────────────── */}
      {modalEditarCaixaMaster && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', borderLeft: '4px solid #60A5FA' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#60A5FA', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit size={20} /> Editar Caixa ({formatarData(modalEditarCaixaMaster.data)})
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setModalEditarCaixaMaster(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmarEdicaoCaixaMaster} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>DATA DO CAIXA</label>
                  <input disabled className="input-field" value={formatarData(modalEditarCaixaMaster.data)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>STATUS DO CAIXA</label>
                  <select
                    className="input-field"
                    value={modalEditarCaixaMaster.status}
                    onChange={e => setModalEditarCaixaMaster({ ...modalEditarCaixaMaster, status: e.target.value })}
                  >
                    <option value="ABERTO">ABERTO</option>
                    <option value="FECHADO">FECHADO</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>SALDO INICIAL (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  value={modalEditarCaixaMaster.saldo_inicial}
                  onChange={e => setModalEditarCaixaMaster({ ...modalEditarCaixaMaster, saldo_inicial: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>OPERADOR ABERTURA</label>
                  <input
                    className="input-field"
                    value={modalEditarCaixaMaster.operador_abertura || ''}
                    onChange={e => setModalEditarCaixaMaster({ ...modalEditarCaixaMaster, operador_abertura: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>OPERADOR FECHAMENTO</label>
                  <input
                    className="input-field"
                    value={modalEditarCaixaMaster.operador_fechamento || ''}
                    onChange={e => setModalEditarCaixaMaster({ ...modalEditarCaixaMaster, operador_fechamento: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <label style={{ fontSize: '0.78rem', color: '#F87171', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                  <Shield size={15} /> SENHA DO USUÁRIO MASTER *
                </label>
                <input
                  type="password"
                  required
                  className="input-field"
                  placeholder="Digite a Senha Master..."
                  value={senhaMasterInput}
                  onChange={e => { setSenhaMasterInput(e.target.value); setErroSenhaMaster('') }}
                />
                {erroSenhaMaster && (
                  <div style={{ color: '#F87171', fontSize: '0.78rem', marginTop: '0.4rem', fontWeight: '700' }}>
                    {erroSenhaMaster}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalEditarCaixaMaster(null)}>Cancelar</button>
                <button type="submit" className="btn-gold">
                  <span>Salvar Alterações (Master)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL EXCLUIR CAIXA (REQUER SENHA MASTER) ────────────────────────── */}
      {modalExcluirCaixaMaster && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', borderLeft: '4px solid #F87171' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#F87171', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={20} /> Excluir Caixa ({formatarData(modalExcluirCaixaMaster.data)})
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setModalExcluirCaixaMaster(null)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Você está prestes a excluir o registro do Caixa do dia <strong>{formatarData(modalExcluirCaixaMaster.data)}</strong>. Esta ação é irreversível e excluirá o histórico de sangrias e movimentações deste dia.
            </p>

            <form onSubmit={handleConfirmarExclusaoCaixaMaster} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
                  DIGITE A SENHA DO USUÁRIO MASTER *
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  className="input-field"
                  placeholder="Senha Master do Usuário..."
                  value={senhaMasterInput}
                  onChange={e => { setSenhaMasterInput(e.target.value); setErroSenhaMaster('') }}
                />
                {erroSenhaMaster && (
                  <div style={{ color: '#F87171', fontSize: '0.78rem', marginTop: '0.4rem', fontWeight: '700' }}>
                    {erroSenhaMaster}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalExcluirCaixaMaster(null)}>Cancelar</button>
                <button type="submit" className="btn-red" style={{ backgroundColor: '#DC2626' }}>
                  <Trash2 size={16} />
                  <span>Excluir Caixa Permanentemente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
