import React, { useState } from 'react'
import { hojeISO, formatarData, formatarDataHora } from '../lib/dates'
import { Plus, Printer, FileText, CheckCircle2, Wrench, Package, MessageCircle, DollarSign, Send, ChevronDown, X, Eye, Filter, Shield, Trash2, Lock, Edit3, Calendar } from 'lucide-react'
import ModalNovaOSArmeria from './ModalNovaOSArmeria'
import CustomSelect from './CustomSelect'
import { dbUpsert, dbDelete, isSupabaseConfigured } from '../lib/supabase'
import { registrarLog } from '../lib/auditLogger'

const STATUS_CONFIG = {
  'NÃO INICIADO':        { color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' },
  'EM ANÁLISE':          { color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
  'AGUARDANDO APROVAÇÃO':{ color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  'APROVADO':            { color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
  'EM MANUTENÇÃO':       { color: '#06B6D4', bg: 'rgba(6,182,212,0.15)' },
  'AGUARDANDO RETIRADA': { color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  'CONCLUÍDO':           { color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
}

const STATUS_LISTA = Object.keys(STATUS_CONFIG)

export default function ModuloOrdens({
  ordens,
  setOrdens,
  clientes,
  setClientes,
  armas,
  setArmas,
  financeiro,
  setFinanceiro,
  caixas,
  setCaixas,
  alertas,
  setAlertas,
  usuarios,
  logs,
  setLogs,
  perfilOperador,
  usuarioLogado,
  notificacoes,
  setNotificacoes,
  config,
  filtroInicial
}) {
  const [showModalOrdem, setShowModalOrdem] = useState(false)
  const [docModalOrdem, setDocModalOrdem] = useState(null)
  const [modalLaudoArmeiro, setModalLaudoArmeiro] = useState(null)
  const [modalCheckoutRetirada, setModalCheckoutRetirada] = useState(null)
  const [modalExcluirOS, setModalExcluirOS] = useState(null)
  const [modalEditarOS, setModalEditarOS] = useState(null)
  const [senhaMasterInput, setSenhaMasterInput] = useState('')
  const [erroSenhaMaster, setErroSenhaMaster] = useState('')
  const [formaPagamentoCheckout, setFormaPagamentoCheckout] = useState('Dinheiro')
  const [valorPagoClienteCheckout, setValorPagoClienteCheckout] = useState('')
  const [ordemExpandida, setOrdemExpandida] = useState(null)
  const [filtroStatus, setFiltroStatus] = useState(filtroInicial || 'TODAS')

  React.useEffect(() => {
    if (filtroInicial) setFiltroStatus(filtroInicial)
  }, [filtroInicial])

  // Helper para tocar som de notificação apenas quando a O.S. passa para AGUARDANDO APROVAÇÃO ou AGUARDANDO RETIRADA
  const tocarSomNotificacao = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.4)
    } catch (e) {}
  }

  // Helper para Disparar Alerta para o Painel da Recepção
  const dispararAlertaRecepcao = (ordemTarget, tipoAlerta, mensagemAlerta) => {
    if (!setAlertas) return
    const cliObj = (clientes || []).find(c => String(c.id) === String(ordemTarget.cliente_id))
    const novoAlerta = {
      id: `alt_${Date.now()}`,
      os_id: ordemTarget.id,
      os_numero: ordemTarget.numero_os,
      cliente_nome: ordemTarget.cliente_nome,
      cliente_telefone: cliObj?.telefone || '',
      equipamento: `${ordemTarget.marca_arma} ${ordemTarget.modelo_arma}`,
      tipo_alerta: tipoAlerta,
      mensagem: mensagemAlerta,
      status: 'PENDENTE',
      created_at: new Date().toISOString(),
      tentativas_contato: [],
      resolucao: null
    }
    setAlertas(prev => [novoAlerta, ...(prev || [])])
    if (isSupabaseConfigured()) dbUpsert('alertas', novoAlerta)
  }

  // Form State do Laudo do Armeiro
  const [diagnosticoArmeiro, setDiagnosticoArmeiro] = useState('')
  const [solucaoProposta, setSolucaoProposta] = useState('')
  const [valorPecasMaoDeObra, setValorPecasMaoDeObra] = useState('')

  const handleMudarStatus = (ordemId, novoStatus) => {
    setOrdens(prev => {
      const proximo = prev.map(o => {
        if (o.id === ordemId) {
          const atualizada = { ...o, status: novoStatus }
          dbUpsert('ordens', atualizada)
          registrarLog({
            usuario: usuarioLogado,
            acao: 'MUDANÇA DE STATUS',
            descricao: `Status da OS #${o.numero_os} alterado de '${o.status}' para '${novoStatus}'.`,
            osId: o.id,
            osNumero: o.numero_os,
            setLogs
          })

          // Toca som de notificação APENAS para 'AGUARDANDO RETIRADA' ou 'AGUARDANDO APROVAÇÃO'
          if (novoStatus === 'AGUARDANDO RETIRADA' || novoStatus === 'AGUARDANDO APROVAÇÃO') {
            tocarSomNotificacao()
            dispararAlertaRecepcao(
              o,
              novoStatus,
              novoStatus === 'AGUARDANDO RETIRADA'
                ? `Manutenção concluída pelo armeiro (${usuarioLogado?.nome_completo || 'Oficina'}). Equipamento pronto para retirada pelo cliente.`
                : `Laudo e orçamento disponibilizado pelo armeiro para aprovação do cliente.`
            )
          }

          return atualizada
        }
        return o
      })
      return proximo
    })
  }

  const handleIniciarAnalise = (ordem) => {
    const atualizada = { ...ordem, status: 'EM ANÁLISE' }
    dbUpsert('ordens', atualizada)
    setOrdens(prev => prev.map(o => o.id === ordem.id ? atualizada : o))
    registrarLog({
      usuario: usuarioLogado,
      acao: 'INÍCIO DE ANÁLISE',
      descricao: `Armeiro iniciou a análise técnica da OS #${ordem.numero_os} (${ordem.marca_arma} ${ordem.modelo_arma}).`,
      osId: ordem.id,
      osNumero: ordem.numero_os,
      setLogs
    })
    setDiagnosticoArmeiro(ordem.diagnostico_armeiro || '')
    setSolucaoProposta(ordem.solucao_proposta || '')
    setValorPecasMaoDeObra(ordem.valor_servico ? ordem.valor_servico.toString() : '')
    setModalLaudoArmeiro(atualizada)
  }

  const handleSalvarLaudoArmeiro = (e) => {
    e.preventDefault()
    if (!modalLaudoArmeiro) return
    const valorTotal = parseFloat(valorPecasMaoDeObra) || 0
    const ordemAtualizada = {
      ...modalLaudoArmeiro,
      diagnostico_armeiro: diagnosticoArmeiro,
      solucao_proposta: solucaoProposta,
      valor_servico: valorTotal,
      status: 'AGUARDANDO APROVAÇÃO'
    }
    dbUpsert('ordens', ordemAtualizada)
    setOrdens(prev => prev.map(o => o.id === modalLaudoArmeiro.id ? ordemAtualizada : o))
    registrarLog({
      usuario: usuarioLogado,
      acao: 'LAUDO E ORÇAMENTO',
      descricao: `Laudo técnico preenchido e orçamento de R$ ${valorTotal.toFixed(2)} registrado para a OS #${modalLaudoArmeiro.numero_os}.`,
      osId: modalLaudoArmeiro.id,
      osNumero: modalLaudoArmeiro.numero_os,
      setLogs
    })

    // Toca som de notificação APENAS quando o armeiro define status AGUARDANDO APROVAÇÃO
    tocarSomNotificacao()

    // Dispara Alerta automático para o Painel de Alerta da Recepção
    dispararAlertaRecepcao(
      modalLaudoArmeiro,
      'AGUARDANDO APROVAÇÃO',
      `Armeiro ${usuarioLogado?.nome_completo || 'Técnico'} concluiu o laudo técnico. Orçamento de R$ ${valorTotal.toFixed(2)} pendente de aprovação com o cliente.`
    )
    const novaNotificacao = {
      id: `n_${Date.now()}`,
      os_numero: modalLaudoArmeiro.numero_os,
      cliente_nome: modalLaudoArmeiro.cliente_nome,
      mensagem: `Laudo técnico da OS #${modalLaudoArmeiro.numero_os} concluído. Orçamento: R$ ${valorTotal.toFixed(2)}.`,
      tipo: 'LAUDO_PRONTO',
      lida: false,
      created_at: 'Agora'
    }
    setNotificacoes([novaNotificacao, ...notificacoes])
    alert(`Laudo concluído! Recepção será notificada para entrar em contato com ${modalLaudoArmeiro.cliente_nome}.`)
    setModalLaudoArmeiro(null)
  }

  const handleEnviarOrcamentoWhatsApp = (ordem) => {
    const clienteObj = clientes.find(c => c.id === ordem.cliente_id || c.nome_completo === ordem.cliente_nome)
    const telefone = clienteObj?.telefone || ''
    const limpo = telefone.replace(/\D/g, '')
    const numero = limpo.length <= 11 ? `55${limpo}` : limpo
    const msg = `Olá ${ordem.cliente_nome}, aqui é da ${config?.nome_fantasia || 'Pró Guns Armeria'}! 🛡️\n\nConcluímos a análise técnica da sua ${ordem.marca_arma} ${ordem.modelo_arma} (OS #${ordem.numero_os}).\n\n🛠️ *Laudo:* ${ordem.diagnostico_armeiro || 'Manutenção técnica recomendada.'}\n💰 *Valor Total:* R$ ${(ordem.valor_servico || 0).toFixed(2)}\n\nPodemos aprovar o início do serviço?`
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const handleAprovarPelaRecepcao = (ordemId) => {
    setOrdens(prev => prev.map(o => {
      if (o.id === ordemId) {
        const atualizada = { ...o, status: 'APROVADO' }
        dbUpsert('ordens', atualizada)
        registrarLog({
          usuario: usuarioLogado,
          acao: 'APROVAÇÃO DE SERVIÇO',
          descricao: `Orçamento da OS #${o.numero_os} aprovado pelo cliente/recepção.`,
          osId: o.id,
          osNumero: o.numero_os,
          setLogs
        })
        return atualizada
      }
      return o
    }))
  }

  const handleAbrirCheckoutRetirada = (ordem) => {
    setModalCheckoutRetirada(ordem)
    setFormaPagamentoCheckout('Dinheiro')
    setValorPagoClienteCheckout('')
  }

  const handleConfirmarCheckoutRetirada = (e) => {
    e.preventDefault()
    if (!modalCheckoutRetirada) return
    const ordem = modalCheckoutRetirada
    const valorCobrado = parseFloat(ordem.valor_servico) || 350.00
    const hojeStr = hojeISO()
    const horaAgoraStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    // 1. Atualiza Ordem de Serviço -> status: 'CONCLUÍDO'
    const ordemAtualizada = { ...ordem, status: 'CONCLUÍDO' }
    dbUpsert('ordens', ordemAtualizada)
    setOrdens(prev => prev.map(o => o.id === ordem.id ? ordemAtualizada : o))

    // 2. Registra Log de Auditoria
    registrarLog({
      usuario: usuarioLogado,
      acao: 'RETIRADA E PAGAMENTO',
      descricao: `OS #${ordem.numero_os} concluída. Retirada de equipamento realizada por ${ordem.cliente_nome}. Pagamento de R$ ${valorCobrado.toFixed(2)} registrado em ${formaPagamentoCheckout}.`,
      osId: ordem.id,
      osNumero: ordem.numero_os,
      setLogs
    })

    // 3. Lança no Caixa Aberto da Recepção daquele momento
    if (caixas && setCaixas) {
      const caixaAbertoHoje = caixas.find(c => c.data === hojeStr && c.status === 'ABERTO') || caixas[0]
      if (caixaAbertoHoje) {
        const novaMovCaixa = {
          id: `mov_os_${Date.now()}`,
          tipo: 'RECEBIMENTO_OS',
          descricao: `Recebimento OS #${ordem.numero_os} (${ordem.cliente_nome})`,
          forma_pagamento: formaPagamentoCheckout,
          valor: valorCobrado,
          hora: horaAgoraStr,
          os_numero: ordem.numero_os
        }
        const caixasAtualizados = caixas.map(c => {
          if (c.id === caixaAbertoHoje.id) {
            return { ...c, movimentacoes: [...(c.movimentacoes || []), novaMovCaixa] }
          }
          return c
        })
        setCaixas(caixasAtualizados)
      }
    }

    // 4. Lança no Financeiro Empresarial
    if (setFinanceiro && financeiro) {
      const novoLancamentoFin = {
        id: `f_${Date.now()}`,
        descricao: `OS #${ordem.numero_os} - ${ordem.marca_arma} ${ordem.modelo_arma} (${ordem.cliente_nome})`,
        tipo: 'Receita',
        categoria: 'Serviço Armeria',
        valor: valorCobrado,
        data_vencimento: hojeStr,
        data_pagamento: hojeStr,
        status: 'Pago',
        forma_pagamento: formaPagamentoCheckout
      }
      setFinanceiro([novoLancamentoFin, ...financeiro])
    }

    // 5. Exibe Comprovante / Ficha de Retirada
    setModalCheckoutRetirada(null)
    setDocModalOrdem(ordemAtualizada)
  }

  const handleConfirmarExclusaoOS = (e) => {
    e.preventDefault()
    if (!modalExcluirOS) return

    const usuariosMaster = (usuarios || []).filter(u => u.perfil === 'master')
    
    const masterValido = usuariosMaster.find(u => (u.senha_pessoal || '').trim() === senhaMasterInput.trim()) ||
      (usuarioLogado?.perfil === 'master' && (usuarioLogado.senha_pessoal || '').trim() === senhaMasterInput.trim())

    if (!masterValido) {
      setErroSenhaMaster('Senha Master incorreta! Operação não autorizada.')
      return
    }

    const osParaDeletar = modalExcluirOS

    // 1. Remove do estado de ordens
    setOrdens(prev => prev.filter(o => String(o.id) !== String(osParaDeletar.id)))

    // 2. Remove do Supabase se configurado
    if (isSupabaseConfigured()) {
      dbDelete('ordens', osParaDeletar.id)
    }

    // 3. Registra no Log de Auditoria
    registrarLog({
      usuario: usuarioLogado,
      acao: 'EXCLUSÃO DE OS',
      descricao: `OS #${osParaDeletar.numero_os} (${osParaDeletar.cliente_nome}) excluída permanentemente pelo Master ${masterValido.nome_completo || 'Admin'}.`,
      osId: osParaDeletar.id,
      osNumero: osParaDeletar.numero_os,
      setLogs
    })

    // 4. Limpa modal
    setModalExcluirOS(null)
    setSenhaMasterInput('')
    setErroSenhaMaster('')
    alert(`Ordem de Serviço #${osParaDeletar.numero_os} excluída com sucesso!`)
  }

  // Handler para Salvar Edição Completa da O.S.
  const handleSalvarEdicaoOS = (e) => {
    e.preventDefault()
    if (!modalEditarOS) return
    const ordemAtualizada = { ...modalEditarOS }
    dbUpsert('ordens', ordemAtualizada)
    setOrdens(prev => prev.map(o => String(o.id) === String(ordemAtualizada.id) ? ordemAtualizada : o))
    registrarLog({
      usuario: usuarioLogado,
      acao: 'EDIÇÃO DE O.S.',
      descricao: `Ordem de Serviço #${ordemAtualizada.numero_os} (${ordemAtualizada.cliente_nome}) editada por ${usuarioLogado?.nome_completo || 'Operador'}.`,
      osId: ordemAtualizada.id,
      osNumero: ordemAtualizada.numero_os,
      setLogs
    })
    alert(`Ordem de Serviço #${ordemAtualizada.numero_os} atualizada com sucesso!`)
    setModalEditarOS(null)
  }

  // Filtro de ordens — sempre em ordem numérica crescente de emissão
  const ordensOrdenadas = [...ordens].sort((a, b) => (a.numero_os || 0) - (b.numero_os || 0))

  const ordensFiltradas = filtroStatus === 'TODAS'
    ? ordensOrdenadas
    : filtroStatus === 'EM ABERTO'
      ? ordensOrdenadas.filter(o => o.status !== 'CONCLUÍDO')
      : ordensOrdenadas.filter(o => o.status === filtroStatus)

  const ordensPorStatus = STATUS_LISTA.reduce((acc, s) => {
    acc[s] = ordens.filter(o => o.status === s).length
    return acc
  }, {})

  return (
    <div style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--gold-accent)' }}>
            Ordens de Serviço
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {ordens.filter(o => o.status !== 'CONCLUÍDO').length} em aberto · {ordens.filter(o => o.status === 'CONCLUÍDO').length} concluídas
          </p>
        </div>
        <button className="btn-red" onClick={() => setShowModalOrdem(true)}>
          <Plus size={18} />
          <span>Dar Entrada O.S.</span>
        </button>
      </div>

      {/* ── FILTRO DE STATUS EM LISTA (CUSTOM SELECT ESCURO SEM FLASH BRANCO) ── */}
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <CustomSelect
          label="FILTRAR O.S. POR STATUS"
          value={
            filtroStatus === 'TODAS'
              ? `📋 TODAS AS O.S. (${ordens.length})`
              : filtroStatus === 'EM ABERTO'
              ? `⚡ EM ABERTO (${ordens.filter(o => o.status !== 'CONCLUÍDO').length})`
              : `• ${filtroStatus} (${ordensPorStatus[filtroStatus] || 0})`
          }
          onChange={val => {
            if (val.includes('TODAS AS O.S.')) {
              setFiltroStatus('TODAS')
            } else if (val.includes('EM ABERTO')) {
              setFiltroStatus('EM ABERTO')
            } else {
              const st = STATUS_LISTA.find(s => val.includes(s))
              if (st) setFiltroStatus(st)
            }
          }}
          options={[
            `📋 TODAS AS O.S. (${ordens.length})`,
            `⚡ EM ABERTO (${ordens.filter(o => o.status !== 'CONCLUÍDO').length})`,
            ...STATUS_LISTA.map(s => `• ${s} (${ordensPorStatus[s] || 0})`)
          ]}
          placeholder="Selecione o filtro..."
          allowCustom={false}
        />
      </div>

      {/* ── LISTA DE ORDENS ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Cabeçalho da Tabela */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr 1fr 160px 100px 60px',
          backgroundColor: 'var(--bg-input)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0.6rem 1rem',
          fontSize: '0.7rem',
          fontWeight: '800',
          color: 'var(--text-muted)',
          letterSpacing: '0.4px'
        }}>
          <div>OS #</div>
          <div>CLIENTE</div>
          <div>EQUIPAMENTO</div>
          <div>STATUS</div>
          <div>VALOR</div>
          <div></div>
        </div>

        {ordensFiltradas.length === 0 && (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Nenhuma ordem de serviço encontrada.
          </div>
        )}

        {ordensFiltradas.map((ordem, idx) => {
          const cfg = STATUS_CONFIG[ordem.status] || { color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' }
          const expandida = ordemExpandida === ordem.id

          return (
            <div key={ordem.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {/* LINHA PRINCIPAL */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 1fr 160px 100px 60px',
                  padding: '0.75rem 1rem',
                  alignItems: 'center',
                  backgroundColor: expandida ? 'rgba(255,255,255,0.03)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onClick={() => setOrdemExpandida(expandida ? null : ordem.id)}
              >
                <div style={{ fontWeight: '800', color: 'var(--red-light)', fontSize: '0.83rem', whiteSpace: 'nowrap' }}>
                  #{ordem.numero_os}
                </div>

                <div style={{ overflow: 'hidden', paddingRight: '0.5rem' }}>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.83rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ordem.cliente_nome?.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ordem.categoria_arma || 'Arma de Fogo'}
                  </div>
                </div>

                <div style={{ overflow: 'hidden', paddingRight: '0.5rem' }}>
                  <div style={{ fontWeight: '600', color: 'var(--gold-accent)', fontSize: '0.81rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ordem.marca_arma} {ordem.modelo_arma}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ordem.calibre_arma} · S/N: {ordem.numero_serie_arma || ordem.numero_serie || '—'}
                  </div>
                </div>

                <div style={{ overflow: 'hidden' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    maxWidth: '100%',
                    overflow: 'hidden'
                  }}>
                    <span style={{
                      width: '7px', height: '7px',
                      borderRadius: '50%',
                      backgroundColor: cfg.color,
                      flexShrink: 0,
                      display: 'inline-block'
                    }} />
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: '600',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {ordem.status}
                    </span>
                  </span>
                </div>

                <div style={{ fontWeight: '800', color: ordem.valor_servico ? '#FBBF24' : 'var(--text-muted)', fontSize: '0.83rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ordem.valor_servico ? `R$ ${parseFloat(ordem.valor_servico).toFixed(2)}` : '—'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDocModalOrdem(ordem) }}
                    style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', padding: '0.25rem' }}
                    title="Visualizar / Imprimir O.S."
                  >
                    <Printer size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setModalEditarOS(ordem) }}
                    style={{ background: 'none', border: 'none', color: '#FBBF24', cursor: 'pointer', padding: '0.25rem' }}
                    title="Editar O.S."
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setModalExcluirOS(ordem)
                      setSenhaMasterInput('')
                      setErroSenhaMaster('')
                    }}
                    style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: '0.25rem' }}
                    title="Excluir O.S. (Requer Senha Master)"
                  >
                    <Trash2 size={16} />
                  </button>
                  <ChevronDown
                    size={16}
                    color="var(--text-muted)"
                    style={{ transform: expandida ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
                  />
                </div>
              </div>

              {/* PAINEL EXPANDIDO DE DETALHES + AÇÕES */}
              {expandida && (
                <div style={{
                  padding: '0.85rem 1rem 1rem 1rem',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {/* Linha 1: Detalhes da O.S. */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.82rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#34D399' }}>
                      <Calendar size={13} />
                      <span style={{ fontWeight: '700' }}>Abertura: {formatarDataHora(ordem.created_at || ordem.data_abertura)}</span>
                    </div>
                    {ordem.problema_relatado && (
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>QUEIXA DO CLIENTE: </span>
                        <span style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>"{ordem.problema_relatado}"</span>
                      </div>
                    )}
                    {ordem.acessorios_acompanhantes && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#60A5FA' }}>
                        <Package size={13} />
                        <span style={{ fontWeight: '600' }}>Acessórios: {ordem.acessorios_acompanhantes}</span>
                      </div>
                    )}
                    {ordem.diagnostico_armeiro && (
                      <div>
                        <span style={{ color: '#FBBF24', fontWeight: '700' }}>LAUDO: </span>
                        <span style={{ color: 'var(--text-main)' }}>{ordem.diagnostico_armeiro}</span>
                      </div>
                    )}
                  </div>

                  {/* Linha 2: Ações Operacionais */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    {/* BOTÃO EXPLICITO: ABRIR / VISUALIZAR / IMPRIMIR O.S. */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDocModalOrdem(ordem) }}
                      style={{ backgroundColor: 'rgba(96,165,250,0.18)', border: '1px solid #60A5FA', color: '#93C5FD', padding: '0.35rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Printer size={14} /> Abrir / Imprimir O.S.
                    </button>

                    {/* BOTÃO EXPLICITO: EDITAR O.S. */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setModalEditarOS(ordem) }}
                      style={{ backgroundColor: 'rgba(245,158,11,0.18)', border: '1px solid #F59E0B', color: '#FBBF24', padding: '0.35rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Edit3 size={14} /> Editar O.S.
                    </button>

                    {/* ALTERAR STATUS MANUAL (CUSTOM SELECT ESCURO) */}
                    <div style={{ minWidth: '220px' }} onClick={e => e.stopPropagation()}>
                      <CustomSelect
                        label="STATUS:"
                        value={ordem.status}
                        onChange={val => handleMudarStatus(ordem.id, val)}
                        options={STATUS_LISTA}
                        placeholder="Selecione o Status..."
                        allowCustom={false}
                      />
                    </div>

                    {/* BOTÃO: Armeiro pega arma não iniciada */}
                    {perfilOperador === 'armeiro' && ordem.status === 'NÃO INICIADO' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleIniciarAnalise(ordem) }}
                        style={{ backgroundColor: 'rgba(96,165,250,0.2)', border: '1px solid #60A5FA', color: '#60A5FA', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Wrench size={13} /> Iniciar Análise
                      </button>
                    )}

                    {/* BOTÃO: Armeiro preenche laudo */}
                    {perfilOperador === 'armeiro' && ordem.status === 'EM ANÁLISE' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDiagnosticoArmeiro(ordem.diagnostico_armeiro || ''); setSolucaoProposta(ordem.solucao_proposta || ''); setValorPecasMaoDeObra(ordem.valor_servico?.toString() || ''); setModalLaudoArmeiro(ordem) }}
                        style={{ backgroundColor: 'rgba(245,158,11,0.2)', border: '1px solid #F59E0B', color: '#FBBF24', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <FileText size={13} /> Preencher Laudo & Orçamento
                      </button>
                    )}

                    {/* BOTÃO: Recepção envia WhatsApp e aprova */}
                    {perfilOperador === 'recepcao' && ordem.status === 'AGUARDANDO APROVAÇÃO' && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEnviarOrcamentoWhatsApp(ordem) }}
                          style={{ backgroundColor: 'rgba(34,197,94,0.2)', border: '1px solid #25D366', color: '#25D366', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <MessageCircle size={13} /> Enviar WhatsApp
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAprovarPelaRecepcao(ordem.id) }}
                          style={{ backgroundColor: '#134633', border: '1px solid #34D399', color: '#fff', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <CheckCircle2 size={13} /> Cliente Aprovou
                        </button>
                      </>
                    )}

                    {/* BOTÃO: Armeiro inicia manutenção */}
                    {perfilOperador === 'armeiro' && ordem.status === 'APROVADO' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMudarStatus(ordem.id, 'EM MANUTENÇÃO') }}
                        style={{ backgroundColor: '#134633', border: '1px solid #34D399', color: '#fff', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Wrench size={13} /> Iniciar Manutenção
                      </button>
                    )}

                    {/* BOTÃO: Armeiro conclui manutenção */}
                    {perfilOperador === 'armeiro' && ordem.status === 'EM MANUTENÇÃO' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMudarStatus(ordem.id, 'AGUARDANDO RETIRADA') }}
                        style={{ backgroundColor: '#06B6D4', color: '#fff', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <CheckCircle2 size={13} /> Concluir & Colocar em Saída
                      </button>
                    )}

                    {/* BOTÃO: Recepção / Master realiza Checkout Unificado de Retirada */}
                    {ordem.status === 'AGUARDANDO RETIRADA' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAbrirCheckoutRetirada(ordem) }}
                        style={{ backgroundColor: '#10B981', color: '#FFF', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}
                      >
                        <DollarSign size={14} /> 💰 Checkout de Retirada & Caixa
                      </button>
                    )}
                    {/* BOTÃO: Excluir O.S. (Requer Senha Master) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setModalExcluirOS(ordem)
                        setSenhaMasterInput('')
                        setErroSenhaMaster('')
                      }}
                      style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', color: '#FCA5A5', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: 'auto' }}
                      title="Excluir Ordem de Serviço (Requer Senha Master)"
                    >
                      <Trash2 size={13} /> Excluir O.S. (Master)
                    </button>
                  </div>

                  {/* Linha 3: Histórico de Auditoria & Trilha do Gestor */}
                  <div style={{ marginTop: '0.4rem', backgroundColor: '#121418', borderRadius: '8px', padding: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--gold-accent)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                      <Shield size={13} /> TRILHA DE AUDITORIA DA O.S. #{ordem.numero_os} (QUEM & QUANDO)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '140px', overflowY: 'auto' }}>
                      {logs && logs.filter(l => String(l.os_id) === String(ordem.id) || String(l.os_numero) === String(ordem.numero_os)).length > 0 ? (
                        logs.filter(l => String(l.os_id) === String(ordem.id) || String(l.os_numero) === String(ordem.numero_os)).map(log => (
                          <div key={log.id} style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.3rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.2rem' }}>
                            <div>
                              <span style={{ color: 'var(--gold-accent)', fontWeight: '700' }}>[{log.created_at}] </span>
                              <span style={{ color: '#60A5FA', fontWeight: '800' }}>{log.usuario_nome?.toUpperCase()} </span>
                              <span style={{ color: '#9CA3AF', fontWeight: '600' }}>({log.usuario_perfil?.toUpperCase()}): </span>
                              <span style={{ color: '#F0F2F5' }}>{log.descricao}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Sem alterações gravadas para esta Ordem de Serviço.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── MODAL ENTRADA DE EQUIPAMENTO ── */}
      {showModalOrdem && (
        <ModalNovaOSArmeria
          clientes={clientes}
          setClientes={setClientes}
          ordens={ordens}
          setOrdens={setOrdens}
          armas={armas}
          setArmas={setArmas}
          setLogs={setLogs}
          usuarioLogado={usuarioLogado}
          onClose={() => setShowModalOrdem(false)}
        />
      )}

      {/* ── MODAL LAUDO DO ARMEIRO ── */}
      {modalLaudoArmeiro && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800' }}>
                <Wrench size={18} /> Laudo Técnico — OS #{modalLaudoArmeiro.numero_os}
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setModalLaudoArmeiro(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div><strong style={{ color: 'var(--text-muted)' }}>Cliente:</strong> {modalLaudoArmeiro.cliente_nome}</div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Equipamento:</strong> {modalLaudoArmeiro.marca_arma} {modalLaudoArmeiro.modelo_arma} ({modalLaudoArmeiro.calibre_arma}) · S/N: {modalLaudoArmeiro.numero_serie_arma || modalLaudoArmeiro.numero_serie}</div>
              {modalLaudoArmeiro.problema_relatado && (
                <div style={{ color: '#F87171', fontStyle: 'italic' }}>Queixa: "{modalLaudoArmeiro.problema_relatado}"</div>
              )}
            </div>

            <form onSubmit={handleSalvarLaudoArmeiro} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>DIAGNÓSTICO TÉCNICO *</label>
                <textarea
                  required
                  className="input-field"
                  rows="3"
                  value={diagnosticoArmeiro}
                  onChange={e => setDiagnosticoArmeiro(e.target.value)}
                  placeholder="Ex: Extrator desgastado, mola enfraquecida e resíduos na câmara..."
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>SOLUÇÃO PROPOSTA & SERVIÇOS *</label>
                <textarea
                  required
                  className="input-field"
                  rows="2"
                  value={solucaoProposta}
                  onChange={e => setSolucaoProposta(e.target.value)}
                  placeholder="Ex: Substituição do extrator, troca da mola e limpeza ultrassônica."
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>VALOR TOTAL (PEÇAS + MÃO DE OBRA) R$ *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  className="input-field"
                  value={valorPecasMaoDeObra}
                  onChange={e => setValorPecasMaoDeObra(e.target.value)}
                  placeholder="350.00"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.3rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalLaudoArmeiro(null)}>Cancelar</button>
                <button type="submit" className="btn-gold">
                  <Send size={15} />
                  <span>Concluir Laudo → Aguardar Aprovação</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL UNIFICADO: CHECKOUT DE RETIRADA & CAIXA ── */}
      {modalCheckoutRetirada && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--gold-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <DollarSign size={22} color="#34D399" />
                  Checkout de Retirada & Quitação — OS #{modalCheckoutRetirada.numero_os}
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Entrega de equipamento e lançamento financeiro automático no caixa
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setModalCheckoutRetirada(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmarCheckoutRetirada} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Resumo do Cliente e Equipamento */}
              <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.83rem' }}>
                <div><strong>CLIENTE:</strong> <span style={{ color: 'var(--gold-accent)', fontWeight: '700' }}>{modalCheckoutRetirada.cliente_nome?.toUpperCase()}</span></div>
                <div><strong>EQUIPAMENTO:</strong> {modalCheckoutRetirada.marca_arma} {modalCheckoutRetirada.modelo_arma} ({modalCheckoutRetirada.calibre_arma}) — S/N: {modalCheckoutRetirada.numero_serie_arma || modalCheckoutRetirada.numero_serie || 'N/A'}</div>
                {modalCheckoutRetirada.solucao_proposta && <div><strong>SERVIÇOS REALIZADOS:</strong> {modalCheckoutRetirada.solucao_proposta}</div>}
              </div>

              {/* Formas de Pagamento */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <CustomSelect
                  label="Forma de Pagamento *"
                  value={formaPagamentoCheckout}
                  onChange={val => setFormaPagamentoCheckout(val)}
                  options={['Dinheiro', 'PIX', 'Cartão de Crédito na máquina', 'Cartão de Débito na máquina']}
                  placeholder="Selecione a forma..."
                  allowCustom={false}
                />
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: '700' }}>Valor do Serviço/Peças (R$) *</label>
                  <input
                    disabled
                    className="input-field"
                    value={`R$ ${(parseFloat(modalCheckoutRetirada.valor_servico) || 350).toFixed(2)}`}
                  />
                </div>
              </div>

              {/* Se Dinheiro -> Troco */}
              {formaPagamentoCheckout === 'Dinheiro' && (
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#34D399' }}>Valor Entregue pelo Cliente (R$)</label>
                    <input type="number" step="0.01" className="input-field" value={valorPagoClienteCheckout} onChange={e => setValorPagoClienteCheckout(e.target.value)} placeholder="0.00" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Troco a Devolver (R$)</label>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: (parseFloat(valorPagoClienteCheckout) || 0) > (parseFloat(modalCheckoutRetirada.valor_servico) || 350) ? '#F59E0B' : '#FFFFFF', paddingTop: '0.4rem' }}>
                      R$ {Math.max(0, (parseFloat(valorPagoClienteCheckout) || 0) - (parseFloat(modalCheckoutRetirada.valor_servico) || 350)).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Status do Caixa */}
              <div style={{ backgroundColor: 'rgba(59,130,246,0.1)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(59,130,246,0.3)', fontSize: '0.78rem', color: '#93C5FD', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} />
                <span>O valor recebido será registrado automaticamente no <strong>Caixa ABERTO da Recepção</strong> e no Financeiro.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalCheckoutRetirada(null)}>Cancelar</button>
                <button type="submit" className="btn-gold" style={{ backgroundColor: '#10B981', color: '#FFF' }}>
                  <CheckCircle2 size={16} />
                  <span>Finalizar Retirada & Dar Baixa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL COMPROVANTE / FICHA DA O.S. (VISUALIZAR E IMPRIMIR) ── */}
      {docModalOrdem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 9999, padding: '2rem 1rem', overflowY: 'auto' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '720px', backgroundColor: '#FFFFFF', color: '#111827', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', padding: '2.2rem', margin: 'auto 0' }}>
            {/* Botão Fechar Modal */}
            <button
              onClick={() => setDocModalOrdem(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#F3F4F6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4B5563' }}
              title="Fechar"
            >
              <X size={18} />
            </button>

            {/* ÁREA IMPRESSA DO COMPROVANTE DA O.S. */}
            <div className="print-area" style={{ fontFamily: 'Inter, sans-serif' }}>
              {/* CABEÇALHO DA ARMERIA (LAYOUT INSTITUCIONAL DE IMPRESSÃO) */}
              <div style={{ textAlign: 'center', marginBottom: '0.6rem' }}>
                {/* 1º: Logo da Armeria (Lado Superior Central) */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.4rem' }}>
                  <img
                    src={config?.logo_url || "/logo.png"}
                    alt={config?.nome_fantasia || 'Pró Guns Armeria'}
                    style={{ maxHeight: '80px', maxWidth: '240px', objectFit: 'contain' }}
                  />
                </div>

                {/* 2º Título: Nome Fantasia (Negrito, Centralizado, Abaixo da Logo) */}
                <h1 style={{ fontSize: '1.35rem', fontWeight: '800', fontFamily: 'Cinzel, serif', color: '#000000', margin: '0.2rem 0 0.1rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {config?.nome_fantasia || 'PRÓ GUNS ARMERIA'}
                </h1>

                {/* 3º Subtítulo: Razão Social (Fonte tamanho menor, Centralizado abaixo do Nome Fantasia) */}
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151', margin: '0.1rem 0', textTransform: 'uppercase' }}>
                  {config?.razao_social || 'SANTOS E OLIVIERA JUNIOR LTDA'}
                </div>

                {/* 4º: CNPJ (Centralizado abaixo da Razão Social) */}
                <div style={{ fontSize: '0.8rem', color: '#4B5563', margin: '0.1rem 0' }}>
                  CNPJ: {config?.cnpj || '12.345.678/0001-99'}
                </div>

                {/* 5º: N° do CR e Região Militar */}
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1F2937', margin: '0.1rem 0' }}>
                  CR: {config?.cr_armeria || 'CR-998877/2ª RM'} — {config?.rm_armeria || '2ª Região Militar'}
                </div>

                {/* 6º: Data e Hora de Abertura (Lado Esquerdo) */}
                <div style={{ textAlign: 'left', fontSize: '0.8rem', color: '#374151', marginTop: '0.75rem', fontWeight: '600' }}>
                  Data e Hora de Abertura: {formatarDataHora(docModalOrdem.created_at || docModalOrdem.data_abertura)}
                </div>

                {/* 7º: Traço Longo fazendo a divisão do cabeçalho */}
                <hr style={{ border: 'none', borderTop: '2px solid #000000', marginTop: '0.4rem', marginBottom: '1.2rem' }} />
              </div>

              {/* TÍTULO DA ORDEM DE SERVIÇO */}
              <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#111827', textTransform: 'uppercase', margin: 0 }}>
                  ORDEM DE SERVIÇO Nº {docModalOrdem.numero_os}
                </h2>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: '600', marginTop: '0.15rem' }}>
                  Status Atual: <strong style={{ color: '#111827' }}>{docModalOrdem.status}</strong>
                </div>
              </div>

              {/* CORPO DO DOCUMENTO DA O.S. (DADOS ORGANIZADOS & FORMATADOS) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem', color: '#1F2937' }}>
                {/* BLOCO 1: DADOS DO CLIENTE REQUERENTE */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0.75rem 0.9rem', backgroundColor: '#F9FAFB' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>
                    CLIENTE REQUERENTE
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    <div><strong>Nome:</strong> {docModalOrdem.cliente_nome?.toUpperCase()}</div>
                    <div>
                      <strong>CPF / CR:</strong> {
                        (() => {
                          const c = (clientes || []).find(item => String(item.id) === String(docModalOrdem.cliente_id) || item.nome_completo === docModalOrdem.cliente_nome)
                          return c ? `${c.cpf} | CR: ${c.numero_cr || 'N/A'}` : 'Cadastrado'
                        })()
                      }
                    </div>
                  </div>
                </div>

                {/* BLOCO 2: DADOS DO EQUIPAMENTO / ARMA */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0.75rem 0.9rem', backgroundColor: '#F9FAFB' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>
                    DADOS DO EQUIPAMENTO
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    <div><strong>Categoria:</strong> {docModalOrdem.categoria_arma || 'Arma de Fogo'}</div>
                    <div><strong>Tipo:</strong> {docModalOrdem.tipo_arma || 'Pistola'}</div>
                    <div><strong>Marca / Modelo:</strong> {docModalOrdem.marca_arma} {docModalOrdem.modelo_arma}</div>
                    <div><strong>Calibre:</strong> {docModalOrdem.calibre_arma}</div>
                    <div><strong>N° de Série:</strong> <span style={{ fontWeight: '700' }}>{docModalOrdem.numero_serie_arma || docModalOrdem.numero_serie}</span></div>
                    <div><strong>Órgão Registro:</strong> {docModalOrdem.orgao_registro || 'SIGMA'}</div>
                  </div>
                </div>

                {/* BLOCO 3: GUIA DE TRÁFEGO DE MANUTENÇÃO (GT) */}
                {docModalOrdem.gt_protocolo && docModalOrdem.gt_protocolo !== 'N/A (Ar Comprimido)' && (
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0.75rem 0.9rem', backgroundColor: '#F9FAFB' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>
                      GUIA DE TRÁFEGO DE MANUTENÇÃO (GT)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.4rem' }}>
                      <div><strong>N° GT:</strong> {docModalOrdem.gt_protocolo}</div>
                      <div><strong>Emissão:</strong> {formatarData(docModalOrdem.gt_data_emissao)}</div>
                      <div><strong>Vencimento:</strong> {formatarData(docModalOrdem.gt_data_vencimento)}</div>
                    </div>
                  </div>
                )}

                {/* BLOCO 4: CHECKLIST E SERVIÇO SOLICITADO */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0.75rem 0.9rem', backgroundColor: '#F9FAFB' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>
                    CHECKLIST & DETALHES DA O.S.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div><strong>Acessórios Acompanhantes:</strong> {docModalOrdem.acessorios_acompanhantes || 'Nenhum'}</div>
                    <div><strong>Problema Relatado / Queixa:</strong> "{docModalOrdem.problema_relatado}"</div>
                    {docModalOrdem.diagnostico_armeiro && (
                      <div><strong>Laudo Técnico do Armeiro:</strong> {docModalOrdem.diagnostico_armeiro}</div>
                    )}
                    {docModalOrdem.solucao_proposta && (
                      <div><strong>Serviços Executados / Propostos:</strong> {docModalOrdem.solucao_proposta}</div>
                    )}
                    {docModalOrdem.valor_servico > 0 && (
                      <div><strong>Valor Total Orçado:</strong> <span style={{ fontWeight: '800', color: '#111827' }}>R$ {parseFloat(docModalOrdem.valor_servico).toFixed(2)}</span></div>
                    )}
                  </div>
                </div>
              </div>

              {/* RODAPÉ E LINHAS DE ASSINATURA */}
              <div style={{ marginTop: '3.5rem', display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '0.78rem', color: '#374151' }}>
                <div style={{ width: '45%' }}>
                  <div style={{ borderTop: '1.5px solid #000000', paddingTop: '0.4rem' }}>
                    <strong>{docModalOrdem.cliente_nome?.toUpperCase()}</strong><br />
                    <span>Proprietário / Requerente</span>
                  </div>
                </div>

                <div style={{ width: '45%' }}>
                  <div style={{ borderTop: '1.5px solid #000000', paddingTop: '0.4rem' }}>
                    <strong>{config?.nome_fantasia || 'PRÓ GUNS ARMERIA'}</strong><br />
                    <span>Responsável Técnico Armeiro</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AÇÕES NO RODAPÉ DO MODAL (NÃO SAEM NA IMPRESSÃO) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
              <button
                className="btn-secondary"
                style={{ backgroundColor: '#F3F4F6', color: '#374151', borderColor: '#D1D5DB' }}
                onClick={() => setDocModalOrdem(null)}
              >
                Fechar
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{ backgroundColor: '#25D366', color: '#FFFFFF', borderColor: '#25D366', fontWeight: '700' }}
                onClick={() => {
                  const cliObj = (clientes || []).find(c => String(c.id) === String(docModalOrdem.cliente_id) || c.nome_completo === docModalOrdem.cliente_nome)
                  const tel = (cliObj?.telefone || '').replace(/\D/g, '')
                  const numTel = tel.length === 10 || tel.length === 11 ? `55${tel}` : tel
                  const msg = `Olá *${docModalOrdem.cliente_nome}*, tudo bem?\n\nAqui é da recepção da *${config?.nome_fantasia || 'Pró Guns Armeria'}*.\n\n*ORDEM DE SERVIÇO Nº ${docModalOrdem.numero_os}*\nEquipamento: ${docModalOrdem.marca_arma} ${docModalOrdem.modelo_arma} (${docModalOrdem.calibre_arma})\nN° de Série: ${docModalOrdem.numero_serie_arma || docModalOrdem.numero_serie || 'N/A'}\nStatus Atual: *${docModalOrdem.status}*\nQueixa/Serviço: "${docModalOrdem.problema_relatado}"\n${docModalOrdem.valor_servico > 0 ? `Valor Orçado: R$ ${parseFloat(docModalOrdem.valor_servico).toFixed(2)}\n` : ''}\nPara qualquer dúvida, entre em contato!`
                  window.open(`https://wa.me/${numTel}?text=${encodeURIComponent(msg)}`, '_blank')
                }}
              >
                <MessageCircle size={15} />
                <span>Enviar via WhatsApp</span>
              </button>

              <button
                type="button"
                className="btn-gold"
                style={{ backgroundColor: '#F59E0B', borderColor: '#D97706', color: '#FFFFFF', fontWeight: '700' }}
                onClick={() => {
                  const targetOS = { ...docModalOrdem }
                  setDocModalOrdem(null)
                  setModalEditarOS(targetOS)
                }}
              >
                <Edit3 size={15} />
                <span>Editar O.S.</span>
              </button>

              <button
                type="button"
                className="btn-gold"
                style={{ backgroundColor: '#134633', borderColor: '#134633' }}
                onClick={() => window.print()}
              >
                <Printer size={15} />
                <span>Imprimir O.S.</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE EXCLUSÃO DE OS (AUTENTICAÇÃO MASTER) ────────────────────────── */}
      {modalExcluirOS && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '460px', borderLeft: '4px solid #EF4444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#F87171', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={20} color="#F87171" />
                Autorização Master Requerida
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setModalExcluirOS(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmarExclusaoOS} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.83rem', color: '#FCA5A5' }}>
                <div><strong>ATENÇÃO:</strong> Você está excluindo permanentemente a <strong>OS #{modalExcluirOS.numero_os}</strong> ({modalExcluirOS.cliente_nome} — {modalExcluirOS.marca_arma} {modalExcluirOS.modelo_arma}).</div>
                <div style={{ marginTop: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Esta ação não poderá ser desfeita. Digite a senha de um usuário Master para autorizar.</div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: '700' }}>Senha Pessoal do Usuário Master *</label>
                <input
                  required
                  autoFocus
                  type="password"
                  className="input-field"
                  value={senhaMasterInput}
                  onChange={e => { setSenhaMasterInput(e.target.value); setErroSenhaMaster('') }}
                  placeholder="Digite a senha master..."
                  style={{ textTransform: 'none' }}
                />
              </div>

              {erroSenhaMaster && (
                <div style={{ color: '#F87171', fontSize: '0.78rem', fontWeight: '700' }}>
                  ⚠️ {erroSenhaMaster}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalExcluirOS(null)}>Cancelar</button>
                <button type="submit" className="btn-gold" style={{ backgroundColor: '#DC2626', color: '#FFF' }}>
                  <Trash2 size={16} /> Excluir O.S. Permanentemente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR ORDEM DE SERVIÇO ── */}
      {modalEditarOS && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800' }}>
                <Edit3 size={18} /> Editar Ordem de Serviço #{modalEditarOS.numero_os}
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setModalEditarOS(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicaoOS} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Cliente Requerente */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>CLIENTE REQUERENTE *</label>
                <input
                  required
                  className="input-field"
                  value={modalEditarOS.cliente_nome || ''}
                  onChange={e => setModalEditarOS({ ...modalEditarOS, cliente_nome: e.target.value })}
                />
              </div>

              {/* Grid 2 colunas: Equipamento */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>MARCA / FABRICANTE *</label>
                  <input
                    required
                    className="input-field"
                    value={modalEditarOS.marca_arma || ''}
                    onChange={e => setModalEditarOS({ ...modalEditarOS, marca_arma: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>MODELO *</label>
                  <input
                    required
                    className="input-field"
                    value={modalEditarOS.modelo_arma || ''}
                    onChange={e => setModalEditarOS({ ...modalEditarOS, modelo_arma: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>CALIBRE *</label>
                  <input
                    required
                    className="input-field"
                    value={modalEditarOS.calibre_arma || ''}
                    onChange={e => setModalEditarOS({ ...modalEditarOS, calibre_arma: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>N° DE SÉRIE *</label>
                  <input
                    required
                    className="input-field"
                    value={modalEditarOS.numero_serie_arma || modalEditarOS.numero_serie || ''}
                    onChange={e => setModalEditarOS({ ...modalEditarOS, numero_serie_arma: e.target.value, numero_serie: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>ÓRGÃO REGISTRO</label>
                  <input
                    className="input-field"
                    value={modalEditarOS.orgao_registro || 'SIGMA'}
                    onChange={e => setModalEditarOS({ ...modalEditarOS, orgao_registro: e.target.value })}
                  />
                </div>
              </div>

              {/* Guia de Tráfego */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>GUIA DE TRÁFEGO (GT)</label>
                <input
                  className="input-field"
                  value={modalEditarOS.gt_protocolo || ''}
                  onChange={e => setModalEditarOS({ ...modalEditarOS, gt_protocolo: e.target.value })}
                  placeholder="Ex: GT-123456"
                />
              </div>

              {/* Queixa / Problema Relatado */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>PROBLEMA RELATADO / QUEIXA *</label>
                <textarea
                  required
                  rows="2"
                  className="input-field"
                  value={modalEditarOS.problema_relatado || ''}
                  onChange={e => setModalEditarOS({ ...modalEditarOS, problema_relatado: e.target.value })}
                />
              </div>

              {/* Acessórios Acompanhantes */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>CHECKLIST DE ACESSÓRIOS</label>
                <input
                  className="input-field"
                  value={modalEditarOS.acessorios_acompanhantes || ''}
                  onChange={e => setModalEditarOS({ ...modalEditarOS, acessorios_acompanhantes: e.target.value })}
                />
              </div>

              {/* Status e Valor */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <CustomSelect
                  label="STATUS DA O.S."
                  value={modalEditarOS.status}
                  onChange={val => setModalEditarOS({ ...modalEditarOS, status: val })}
                  options={STATUS_LISTA}
                  allowCustom={false}
                />
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>VALOR DO SERVIÇO (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={modalEditarOS.valor_servico || 0}
                    onChange={e => setModalEditarOS({ ...modalEditarOS, valor_servico: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalEditarOS(null)}>Cancelar</button>
                <button type="submit" className="btn-gold" style={{ backgroundColor: '#F59E0B', borderColor: '#D97706', color: '#FFF' }}>
                  <Edit3 size={15} />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
