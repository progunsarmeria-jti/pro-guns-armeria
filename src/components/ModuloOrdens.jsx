import React, { useState } from 'react'
import { hojeISO, formatarData, formatarDataHora } from '../lib/dates'
import { Plus, Printer, FileText, CheckCircle2, Wrench, Package, MessageCircle, DollarSign, Send, ChevronDown, X, Eye, Filter, Shield, Trash2, Lock, Edit3, Calendar } from 'lucide-react'
import ModalNovaOSArmeria from './ModalNovaOSArmeria'
import CustomSelect from './CustomSelect'
import { isSupabaseConfigured, dbUpsert, dbUpdate, dbDelete } from '../lib/supabase'
import { registrarLog } from '../lib/auditLogger'
import { INITIAL_CONFIG } from '../lib/initialData'

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
  ordens = [],
  setOrdens,
  clientes = [],
  setClientes,
  armas = [],
  setArmas,
  estoque = [],
  setEstoque,
  financeiro = [],
  setFinanceiro,
  caixas = [],
  setCaixas,
  alertas = [],
  setAlertas,
  usuarios = [],
  logs = [],
  setLogs,
  perfilOperador = 'recepcao',
  usuarioLogado,
  notificacoes = [],
  setNotificacoes,
  config,
  filtroInicial,
  osParaVisualizar,
  setOsParaVisualizar
}) {
  const [modalOrdem, setModalOrdem] = useState(false)
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

  // Form State do Laudo do Armeiro
  const [diagnosticoArmeiro, setDiagnosticoArmeiro] = useState('')
  const [solucaoProposta, setSolucaoProposta] = useState('')
  const [valorPecasMaoDeObra, setValorPecasMaoDeObra] = useState('')
  const [itensLaudo, setItensLaudo] = useState([])
  const [observacoesArmeiro, setObservacoesArmeiro] = useState('')

  // Form State para inclusão de itens no laudo
  const [servicoSelecionadoId, setServicoSelecionadoId] = useState('')
  const [servicoSelecionadoLaudo, setServicoSelecionadoLaudo] = useState('')
  const [customServicoNome, setCustomServicoNome] = useState('')
  const [precoServicoInput, setPrecoServicoInput] = useState('')
  const [pecaEstoqueSelecionadaId, setPecaEstoqueSelecionadaId] = useState('')

  React.useEffect(() => {
    if (filtroInicial) setFiltroStatus(filtroInicial)
  }, [filtroInicial])

  React.useEffect(() => {
    if (osParaVisualizar) {
      setDocModalOrdem(osParaVisualizar)
      if (setOsParaVisualizar) setOsParaVisualizar(null)
    }
  }, [osParaVisualizar])

  // Recalcula valor total automaticamente a partir de itensLaudo
  const recalcularTotalLaudo = (lista) => {
    const soma = lista.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0)
    setValorPecasMaoDeObra(soma.toFixed(2))
  }

  const handleAbrirLaudoArmeiroModal = (ordem) => {
    setDiagnosticoArmeiro(ordem.diagnostico_armeiro || '')
    setSolucaoProposta(ordem.solucao_proposta || '')
    setValorPecasMaoDeObra(ordem.valor_servico ? ordem.valor_servico.toString() : '0')
    setItensLaudo(ordem.itens_laudo || [])
    setObservacoesArmeiro(ordem.observacoes_armeiro || '')
    setServicoSelecionadoId('')
    setServicoSelecionadoLaudo('')
    setCustomServicoNome('')
    setPrecoServicoInput('')
    setPecaEstoqueSelecionadaId('')
    setModalLaudoArmeiro(ordem)
  }

  const handleAdicionarServicoLaudo = () => {
    const nomeServico = servicoSelecionadoId === '__CUSTOM__' ? customServicoNome.trim() : servicoSelecionadoLaudo
    if (!nomeServico) {
      alert('Selecione ou digite o nome do serviço!')
      return
    }
    const unit = parseFloat(precoServicoInput) || 0
    const novoItem = {
      id: `srv_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      tipo: 'SERVICO',
      nome: nomeServico,
      quantidade: 1,
      valor_unitario: unit,
      subtotal: unit
    }
    const proximaLista = [...itensLaudo, novoItem]
    setItensLaudo(proximaLista)
    recalcularTotalLaudo(proximaLista)
    setServicoSelecionadoId('')
    setServicoSelecionadoLaudo('')
    setCustomServicoNome('')
    setPrecoServicoInput('')
  }

  const handleAdicionarPecaEstoqueLaudo = (estoqueId) => {
    if (!estoqueId) return
    const peca = (estoque || []).find(p => String(p.id) === String(estoqueId))
    if (!peca) return
    const unit = parseFloat(peca.preco_venda) || 0
    const novoItem = {
      id: `peca_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      tipo: 'PECA',
      estoque_id: peca.id,
      nome: `${peca.nome} (${peca.codigo_sku || 'S/SKU'})`,
      quantidade: 1,
      valor_unitario: unit,
      subtotal: unit
    }
    const proximaLista = [...itensLaudo, novoItem]
    setItensLaudo(proximaLista)
    recalcularTotalLaudo(proximaLista)
    setPecaEstoqueSelecionadaId('')
  }

  const handleAtualizarItemLaudo = (id, campo, val) => {
    const proximaLista = itensLaudo.map(it => {
      if (it.id === id) {
        const mod = { ...it, [campo]: val }
        const qtd = Number(mod.quantidade) || 1
        const unit = parseFloat(mod.valor_unitario) || 0
        mod.subtotal = qtd * unit
        return mod
      }
      return it
    })
    setItensLaudo(proximaLista)
    recalcularTotalLaudo(proximaLista)
  }

  const handleRemoverItemLaudo = (id) => {
    const proximaLista = itensLaudo.filter(it => it.id !== id)
    setItensLaudo(proximaLista)
    recalcularTotalLaudo(proximaLista)
  }

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

  const handleMudarStatus = (ordemId, novoStatus) => {
    const agora = new Date().toISOString()
    setOrdens(prev => {
      const proximo = prev.map(o => {
        if (String(o.id) === String(ordemId) || Number(o.numero_os) === Number(ordemId)) {
          const atualizada = { ...o, status: novoStatus, updated_at: agora }
          // UPDATE direto no Supabase (mais confiável que upsert para propagação)
          if (isSupabaseConfigured()) {
            dbUpdate('ordens', o.id, { status: novoStatus, updated_at: agora, numero_os: o.numero_os }, atualizada)
          }
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
              atualizada,
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
      try { localStorage.setItem('PROGUNS_ORDENS', JSON.stringify(proximo)) } catch(e) {}
      return proximo
    })
  }

  const handleIniciarAnalise = (ordem) => {
    const agora = new Date().toISOString()
    const atualizada = { ...ordem, status: 'EM ANÁLISE', updated_at: agora }
    // UPDATE direto no Supabase
    if (isSupabaseConfigured()) {
      dbUpdate('ordens', ordem.id, { status: 'EM ANÁLISE', updated_at: agora, numero_os: ordem.numero_os }, atualizada)
    }
    setOrdens(prev => {
      const proximo = prev.map(o => (String(o.id) === String(ordem.id) || Number(o.numero_os) === Number(ordem.numero_os)) ? atualizada : o)
      try { localStorage.setItem('PROGUNS_ORDENS', JSON.stringify(proximo)) } catch(e) {}
      return proximo
    })
    registrarLog({
      usuario: usuarioLogado,
      acao: 'INÍCIO DE ANÁLISE',
      descricao: `Armeiro iniciou a análise técnica da OS #${ordem.numero_os} (${ordem.marca_arma} ${ordem.modelo_arma}).`,
      osId: ordem.id,
      osNumero: ordem.numero_os,
      setLogs
    })
    handleAbrirLaudoArmeiroModal(atualizada)
  }

  const handleSalvarLaudoArmeiro = async (e) => {
    e.preventDefault()
    if (!modalLaudoArmeiro) return

    const valorTotal = parseFloat(valorPecasMaoDeObra) || 0
    const resumoSolucao = itensLaudo.length > 0
      ? itensLaudo.map(it => `${it.quantidade}x ${it.nome} (R$ ${(it.subtotal || 0).toFixed(2)})`).join(' | ')
      : (solucaoProposta || 'Serviços técnicos de armaria.')

    const agora = new Date().toISOString()

    const ordemAtualizada = {
      ...modalLaudoArmeiro,
      diagnostico_armeiro: diagnosticoArmeiro,
      solucao_proposta: resumoSolucao,
      itens_laudo: itensLaudo,
      observacoes_armeiro: observacoesArmeiro,
      valor_servico: valorTotal,
      status: 'AGUARDANDO APROVAÇÃO',
      updated_at: agora,
      laudo_concluido_em: agora
    }

    // ── 1. Salva imediatamente no localStorage para garantir consistência local ──
    setOrdens(prev => {
      const proximo = prev.map(o =>
        (String(o.id) === String(modalLaudoArmeiro.id) || Number(o.numero_os) === Number(modalLaudoArmeiro.numero_os))
          ? ordemAtualizada : o
      )
      try { localStorage.setItem('PROGUNS_ORDENS', JSON.stringify(proximo)) } catch(err) {}
      return proximo
    })

    // ── 2. Atualiza o modal de documento se estiver aberto ──
    if (docModalOrdem && (String(docModalOrdem.id) === String(modalLaudoArmeiro.id) || Number(docModalOrdem.numero_os) === Number(modalLaudoArmeiro.numero_os))) {
      setDocModalOrdem(ordemAtualizada)
    }

    // ── 3. Persiste no Supabase com duas estratégias: UPDATE direto + UPSERT completo ──
    if (isSupabaseConfigured()) {
      const camposUpdate = {
        status: 'AGUARDANDO APROVAÇÃO',
        diagnostico_armeiro: diagnosticoArmeiro,
        solucao_proposta: resumoSolucao,
        valor_servico: valorTotal,
        observacoes_armeiro: observacoesArmeiro,
        updated_at: agora,
        laudo_concluido_em: agora,
        numero_os: modalLaudoArmeiro.numero_os
      }
      try { camposUpdate.itens_laudo = itensLaudo } catch(e) {}

      dbUpdate('ordens', modalLaudoArmeiro.id, camposUpdate, ordemAtualizada)
    }

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

    // Dispara Alerta automático para o Painel de Alerta da Recepção com o objeto atualizado
    dispararAlertaRecepcao(
      ordemAtualizada,
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
    const clienteObj = clientes.find(c => String(c.id) === String(ordem.cliente_id) || c.nome_completo === ordem.cliente_nome)
    const telefone = clienteObj?.telefone || ''
    const limpo = telefone.replace(/\D/g, '')
    const numero = limpo.length <= 11 ? `55${limpo}` : limpo
    const msg = `Olá ${ordem.cliente_nome}, aqui é da ${config?.nome_fantasia || 'Pró Guns Armeria'}! 🛡️\n\nConcluímos a análise técnica da sua ${ordem.marca_arma} ${ordem.modelo_arma} (OS #${ordem.numero_os}).\n\n🛠️ *Laudo:* ${ordem.diagnostico_armeiro || 'Manutenção técnica recomendada.'}\n💰 *Valor Total:* R$ ${(ordem.valor_servico || 0).toFixed(2)}\n\nPodemos aprovar o início do serviço?`
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const handleAprovarPelaRecepcao = (ordemId) => {
    setOrdens(prev => {
      const proximo = prev.map(o => {
        if (String(o.id) === String(ordemId) || Number(o.numero_os) === Number(ordemId)) {
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
      })
      try { localStorage.setItem('PROGUNS_ORDENS', JSON.stringify(proximo)) } catch(e) {}
      return proximo
    })
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
    setOrdens(prev => {
      const proximo = prev.map(o => (String(o.id) === String(ordem.id) || Number(o.numero_os) === Number(ordem.numero_os)) ? ordemAtualizada : o)
      try { localStorage.setItem('PROGUNS_ORDENS', JSON.stringify(proximo)) } catch(e) {}
      return proximo
    })

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

  const listaStatusAtivos = (config?.status_ordens && Array.isArray(config.status_ordens) && config.status_ordens.length > 0)
    ? config.status_ordens
    : STATUS_LISTA

  const ordensPorStatus = listaStatusAtivos.reduce((acc, s) => {
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
                        options={listaStatusAtivos}
                        placeholder="Selecione o Status..."
                        allowCustom={true}
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
                        onClick={(e) => { e.stopPropagation(); handleAbrirLaudoArmeiroModal(ordem) }}
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
          <div className="card" style={{ width: '100%', maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800', margin: 0 }}>
                <Wrench size={20} /> Laudo Técnico & Orçamento — OS #{modalLaudoArmeiro.numero_os}
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setModalLaudoArmeiro(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.75rem 0.9rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', border: '1px solid var(--border-color)' }}>
              <div><strong style={{ color: 'var(--text-muted)' }}>CLIENTE:</strong> <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>{modalLaudoArmeiro.cliente_nome?.toUpperCase()}</span></div>
              <div><strong style={{ color: 'var(--text-muted)' }}>EQUIPAMENTO:</strong> {modalLaudoArmeiro.marca_arma} {modalLaudoArmeiro.modelo_arma} ({modalLaudoArmeiro.calibre_arma}) · S/N: {modalLaudoArmeiro.numero_serie_arma || modalLaudoArmeiro.numero_serie || '—'}</div>
              {modalLaudoArmeiro.problema_relatado && (
                <div style={{ color: '#F87171', fontStyle: 'italic', marginTop: '0.1rem' }}>Queixa: "{modalLaudoArmeiro.problema_relatado}"</div>
              )}
            </div>

            <form onSubmit={handleSalvarLaudoArmeiro} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* 1. DIAGNÓSTICO TÉCNICO */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
                  DIAGNÓSTICO TÉCNICO *
                </label>
                <textarea
                  required
                  className="input-field"
                  rows="3"
                  value={diagnosticoArmeiro}
                  onChange={e => setDiagnosticoArmeiro(e.target.value)}
                  placeholder="Ex: Extrator desgastado, mola enfraquecida e resíduos acumulados na câmara..."
                />
              </div>

              {/* 2. SERVIÇOS & PEÇAS PRE-CADASTRADAS DO ESTOQUE */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--gold-accent)', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                  <Package size={16} /> SOLUÇÃO PROPOSTA: SELEÇÃO DE SERVIÇOS & PEÇAS DO ESTOQUE
                </div>

                {/* Adicionar Serviço */}
                <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#60A5FA' }}>+ ADICIONAR SERVIÇO DE ARMERIA (DO CATÁLOGO & TABELA DE VALORES)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      className="input-field"
                      value={servicoSelecionadoId}
                      onChange={e => {
                        const val = e.target.value
                        setServicoSelecionadoId(val)
                        if (val === '__CUSTOM__') {
                          setServicoSelecionadoLaudo('')
                          setPrecoServicoInput('')
                        } else {
                          const lista = (config?.catalogo_servicos?.length > 0 ? config.catalogo_servicos : INITIAL_CONFIG.catalogo_servicos)
                          const srvObj = lista.find(s => String(s.id) === String(val) || s.nome === val)
                          if (srvObj) {
                            setServicoSelecionadoLaudo(srvObj.nome)
                            setPrecoServicoInput(srvObj.valor ? srvObj.valor.toString() : '0')
                          }
                        }
                      }}
                      style={{ fontSize: '0.8rem' }}
                    >
                      <option value="">-- Selecione o Serviço do Catálogo / Tabela de Valores --</option>
                      {(config?.catalogo_servicos?.length > 0 ? config.catalogo_servicos : INITIAL_CONFIG.catalogo_servicos).map((srv, idx) => (
                        <option key={srv.id || idx} value={srv.id || srv.nome}>
                          {srv.nome} — R$ {(parseFloat(srv.valor) || 0).toFixed(2)} ({srv.categoria || 'Geral'})
                        </option>
                      ))}
                      <option value="__CUSTOM__">+ Outro Serviço Customizado...</option>
                    </select>

                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      placeholder="Valor R$"
                      value={precoServicoInput}
                      onChange={e => setPrecoServicoInput(e.target.value)}
                      style={{ fontSize: '0.8rem' }}
                    />

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleAdicionarServicoLaudo}
                      style={{ fontSize: '0.75rem', padding: '0.42rem 0.8rem', backgroundColor: 'rgba(96, 165, 250, 0.15)', borderColor: '#60A5FA', color: '#93C5FD', fontWeight: '700' }}
                    >
                      + Incluir Serviço
                    </button>
                  </div>

                  {servicoSelecionadoId === '__CUSTOM__' && (
                    <input
                      className="input-field"
                      placeholder="Digite o nome do serviço customizado..."
                      value={customServicoNome}
                      onChange={e => setCustomServicoNome(e.target.value)}
                      style={{ marginTop: '0.3rem', fontSize: '0.8rem' }}
                    />
                  )}
                </div>

                {/* Adicionar Peça do Estoque */}
                <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#F59E0B' }}>+ ADICIONAR PEÇA / COMPONENTE DO ESTOQUE</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      className="input-field"
                      value={pecaEstoqueSelecionadaId}
                      onChange={e => {
                        setPecaEstoqueSelecionadaId(e.target.value)
                        handleAdicionarPecaEstoqueLaudo(e.target.value)
                      }}
                      style={{ fontSize: '0.8rem' }}
                    >
                      <option value="">-- Selecione uma peça cadastrada no Estoque --</option>
                      {(estoque || []).map(item => (
                        <option key={item.id} value={item.id}>
                          {item.nome} ({item.codigo_sku || 'S/SKU'}) — R$ {(parseFloat(item.preco_venda) || 0).toFixed(2)} [{item.quantidade} un. disponíveis]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* TABELA DE ITENS INCLUÍDOS */}
                <div style={{ marginTop: '0.3rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    ITENS E SERVIÇOS SELECIONADOS PARA ESTA O.S.:
                  </div>

                  {itensLaudo.length === 0 ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
                      Nenhum serviço ou peça selecionada ainda. Escolha acima para incluir no orçamento.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {itensLaudo.map(item => (
                        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1.8fr 70px 100px 90px auto', gap: '0.5rem', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: '800', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: item.tipo === 'SERVICO' ? 'rgba(96,165,250,0.2)' : 'rgba(245,158,11,0.2)', color: item.tipo === 'SERVICO' ? '#93C5FD' : '#FBBF24' }}>
                            {item.tipo === 'SERVICO' ? 'SERVIÇO' : 'PEÇA'}
                          </span>

                          <input
                            className="input-field"
                            value={item.nome}
                            onChange={e => handleAtualizarItemLaudo(item.id, 'nome', e.target.value)}
                            style={{ fontSize: '0.78rem', padding: '0.2rem 0.4rem' }}
                          />

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Qtd:</span>
                            <input
                              type="number"
                              min="1"
                              className="input-field"
                              value={item.quantidade}
                              onChange={e => handleAtualizarItemLaudo(item.id, 'quantidade', e.target.value)}
                              style={{ fontSize: '0.78rem', padding: '0.2rem 0.4rem', textAlign: 'center' }}
                            />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>R$:</span>
                            <input
                              type="number"
                              step="0.01"
                              className="input-field"
                              value={item.valor_unitario}
                              onChange={e => handleAtualizarItemLaudo(item.id, 'valor_unitario', e.target.value)}
                              style={{ fontSize: '0.78rem', padding: '0.2rem 0.4rem' }}
                            />
                          </div>

                          <div style={{ fontWeight: '800', color: '#34D399', textAlign: 'right' }}>
                            R$ {(item.subtotal || 0).toFixed(2)}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoverItemLaudo(item.id)}
                            style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: '0.2rem' }}
                            title="Remover Item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. OBSERVAÇÕES ADICIONAIS DO ARMEIRO */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
                  OBSERVAÇÕES ADICIONAIS DO ARMEIRO (OPCIONAL)
                </label>
                <textarea
                  className="input-field"
                  rows="2"
                  value={observacoesArmeiro}
                  onChange={e => setObservacoesArmeiro(e.target.value)}
                  placeholder="Digite aqui recomendações técnicas, observações de conservação ou orientações..."
                />
              </div>

              {/* 4. PAINEL INTELIGENTE DE CÁLCULO AUTOMÁTICO & APLICAÇÃO DE DESCONTO */}
              {(() => {
                const somaItens = (itensLaudo || []).reduce((acc, i) => acc + (parseFloat(i.subtotal) || 0), 0)
                const subtotalBase = somaItens > 0 ? somaItens : (parseFloat(valorPecasMaoDeObra) || 0)

                const aplicarDescontoRapido = (tipo, val) => {
                  let valorFinal = subtotalBase
                  if (tipo === 'PERCENT') {
                    const descR$ = subtotalBase * (val / 100)
                    valorFinal = Math.max(0, subtotalBase - descR$)
                  } else if (tipo === 'FIXED') {
                    valorFinal = Math.max(0, subtotalBase - val)
                  } else if (tipo === 'NONE') {
                    valorFinal = subtotalBase
                  }
                  setValorPecasMaoDeObra(valorFinal.toFixed(2))
                }

                const valorFinalNum = parseFloat(valorPecasMaoDeObra) || 0
                const valorDesconto = Math.max(0, subtotalBase - valorFinalNum)
                const percentualDesconto = subtotalBase > 0 ? ((valorDesconto / subtotalBase) * 100).toFixed(1) : 0

                return (
                  <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--gold-accent)', borderRadius: '8px', padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--gold-accent)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        🧮 CALCULADORA INTELIGENTE DE SOMA & DESCONTO
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Soma Bruta dos Itens: <strong style={{ color: 'var(--text-main)' }}>R$ {subtotalBase.toFixed(2)}</strong>
                      </span>
                    </div>

                    {/* Atalhos de Desconto Rápido */}
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '0.3rem' }}>
                        APLICAR DESCONTO RÁPIDO NA O.S.:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        <button type="button" onClick={() => aplicarDescontoRapido('NONE', 0)} style={{ fontSize: '0.72rem', padding: '0.22rem 0.55rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '700' }}>Integral (0%)</button>
                        <button type="button" onClick={() => aplicarDescontoRapido('PERCENT', 5)} style={{ fontSize: '0.72rem', padding: '0.22rem 0.55rem', borderRadius: '4px', border: '1px solid #F59E0B', background: 'rgba(245,158,11,0.18)', color: '#FBBF24', cursor: 'pointer', fontWeight: '700' }}>-5%</button>
                        <button type="button" onClick={() => aplicarDescontoRapido('PERCENT', 10)} style={{ fontSize: '0.72rem', padding: '0.22rem 0.55rem', borderRadius: '4px', border: '1px solid #F59E0B', background: 'rgba(245,158,11,0.18)', color: '#FBBF24', cursor: 'pointer', fontWeight: '700' }}>-10%</button>
                        <button type="button" onClick={() => aplicarDescontoRapido('PERCENT', 15)} style={{ fontSize: '0.72rem', padding: '0.22rem 0.55rem', borderRadius: '4px', border: '1px solid #F59E0B', background: 'rgba(245,158,11,0.18)', color: '#FBBF24', cursor: 'pointer', fontWeight: '700' }}>-15%</button>
                        <button type="button" onClick={() => aplicarDescontoRapido('PERCENT', 20)} style={{ fontSize: '0.72rem', padding: '0.22rem 0.55rem', borderRadius: '4px', border: '1px solid #F59E0B', background: 'rgba(245,158,11,0.18)', color: '#FBBF24', cursor: 'pointer', fontWeight: '700' }}>-20%</button>
                        <button type="button" onClick={() => aplicarDescontoRapido('FIXED', 50)} style={{ fontSize: '0.72rem', padding: '0.22rem 0.55rem', borderRadius: '4px', border: '1px solid #10B981', background: 'rgba(16,185,129,0.18)', color: '#34D399', cursor: 'pointer', fontWeight: '700' }}>- R$ 50</button>
                        <button type="button" onClick={() => aplicarDescontoRapido('FIXED', 100)} style={{ fontSize: '0.72rem', padding: '0.22rem 0.55rem', borderRadius: '4px', border: '1px solid #10B981', background: 'rgba(16,185,129,0.18)', color: '#34D399', cursor: 'pointer', fontWeight: '700' }}>- R$ 100</button>
                      </div>
                    </div>

                    {/* Resumo de Cálculo Final */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', gap: '0.6rem', backgroundColor: 'var(--bg-card)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>Soma Itens:</span>
                        <strong style={{ color: 'var(--text-main)' }}>R$ {subtotalBase.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#F87171', display: 'block' }}>Desconto:</span>
                        <strong style={{ color: '#F87171' }}>- R$ {valorDesconto.toFixed(2)} ({percentualDesconto}%)</strong>
                      </div>
                      <div>
                        <span style={{ color: '#34D399', display: 'block', fontWeight: '800' }}>VALOR TOTAL FINAL R$:</span>
                        <input
                          required
                          type="number"
                          step="0.01"
                          className="input-field"
                          value={valorPecasMaoDeObra}
                          onChange={e => setValorPecasMaoDeObra(e.target.value)}
                          placeholder="0.00"
                          style={{ fontSize: '1.05rem', fontWeight: '800', color: '#34D399', padding: '0.3rem 0.5rem', marginTop: '0.15rem' }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
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
      {docModalOrdem && (() => {
        const activeDoc = (ordens || []).find(o => 
          String(o.id) === String(docModalOrdem.id) || 
          Number(o.numero_os) === Number(docModalOrdem.numero_os)
        ) || docModalOrdem

        return (
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

                  {/* 5º.1: Endereço Institucional da Armeria */}
                  {(config?.endereco || config?.cidade) && (
                    <div style={{ fontSize: '0.78rem', color: '#374151', margin: '0.1rem 0' }}>
                      📍 {config?.endereco || 'Av. das Armas, 1000 - Centro'}{config?.cidade ? ` — ${config.cidade}/${config.uf || ''}` : ''}
                    </div>
                  )}

                  {/* 5º.2: Contatos Institucionais (Telefone, WhatsApp, Email) */}
                  <div style={{ fontSize: '0.78rem', color: '#4B5563', margin: '0.1rem 0' }}>
                    📞 Tel: {config?.telefone || '(11) 3344-5566'} | 📱 WhatsApp: {config?.whatsapp || '(11) 98888-7777'}{config?.email ? ` | ✉️ ${config.email}` : ''}
                  </div>

                  {/* 6º: Data e Hora de Abertura (Lado Esquerdo) */}
                  <div style={{ textAlign: 'left', fontSize: '0.8rem', color: '#374151', marginTop: '0.75rem', fontWeight: '600' }}>
                    Data e Hora de Abertura: {formatarDataHora(activeDoc.created_at || activeDoc.data_abertura)}
                  </div>

                  {/* 7º: Traço Longo fazendo a divisão do cabeçalho */}
                  <hr style={{ border: 'none', borderTop: '2px solid #000000', marginTop: '0.4rem', marginBottom: '1.2rem' }} />
                </div>

                {/* TÍTULO DA ORDEM DE SERVIÇO */}
                <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#111827', textTransform: 'uppercase', margin: 0 }}>
                    ORDEM DE SERVIÇO Nº {activeDoc.numero_os}
                  </h2>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: '600', marginTop: '0.15rem' }}>
                    Status Atual: <strong style={{ color: '#111827' }}>{activeDoc.status}</strong>
                  </div>
                </div>

                {/* CORPO DO DOCUMENTO DA O.S. (DADOS ORGANIZADOS & FORMATADOS) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem', color: '#1F2937' }}>
                  {/* BLOCO 1: DADOS DO CLIENTE REQUERENTE */}
                  {(() => {
                    const c = (clientes || []).find(item =>
                      String(item.id) === String(activeDoc.cliente_id) ||
                      (item.nome_completo && item.nome_completo.trim().toLowerCase() === (activeDoc.cliente_nome || '').trim().toLowerCase())
                    )
                    const telCliente = c?.telefone || activeDoc.cliente_telefone || 'Não informado'
                    const emailCliente = c?.email || 'Não informado'
                    const endCliente = (c?.logradouro || c?.endereco)
                      ? `${c.logradouro || c.endereco}${c.numero ? ', ' + c.numero : ''}${c.cidade ? ' - ' + c.cidade + '/' + (c.uf || '') : ''}`
                      : null

                    return (
                      <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0.75rem 0.9rem', backgroundColor: '#F9FAFB' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>
                          CLIENTE REQUERENTE & CONTATO
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                          <div><strong>Nome:</strong> {activeDoc.cliente_nome?.toUpperCase()}</div>
                          <div>
                            <strong>CPF / CR:</strong> {c ? `${c.cpf || 'N/A'} | CR: ${c.numero_cr || 'N/A'}` : 'Cadastrado'}
                          </div>
                          <div><strong>Contato / WhatsApp:</strong> <span style={{ fontWeight: '700', color: '#111827' }}>{telCliente}</span></div>
                          <div><strong>E-mail:</strong> {emailCliente}</div>
                          {endCliente && (
                            <div style={{ gridColumn: 'span 2' }}><strong>Endereço do Cliente:</strong> {endCliente}</div>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {/* BLOCO 2: DADOS DO EQUIPAMENTO / ARMA */}
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0.75rem 0.9rem', backgroundColor: '#F9FAFB' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>
                      DADOS DO EQUIPAMENTO
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                      <div><strong>Categoria:</strong> {activeDoc.categoria_arma || 'Arma de Fogo'}</div>
                      <div><strong>Tipo:</strong> {activeDoc.tipo_arma || 'Pistola'}</div>
                      <div><strong>Marca / Modelo:</strong> {activeDoc.marca_arma} {activeDoc.modelo_arma}</div>
                      <div><strong>Calibre:</strong> {activeDoc.calibre_arma}</div>
                      <div><strong>N° de Série:</strong> <span style={{ fontWeight: '700' }}>{activeDoc.numero_serie_arma || activeDoc.numero_serie}</span></div>
                      <div><strong>Órgão Registro:</strong> {activeDoc.orgao_registro || 'SIGMA'}</div>
                    </div>
                  </div>

                  {/* BLOCO 3: GUIA DE TRÁFEGO DE MANUTENÇÃO (GT) */}
                  {activeDoc.gt_protocolo && activeDoc.gt_protocolo !== 'N/A (Ar Comprimido)' && (
                    <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0.75rem 0.9rem', backgroundColor: '#F9FAFB' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>
                        GUIA DE TRÁFEGO DE MANUTENÇÃO (GT)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.4rem' }}>
                        <div><strong>N° GT:</strong> {activeDoc.gt_protocolo}</div>
                        <div><strong>Emissão:</strong> {formatarData(activeDoc.gt_data_emissao)}</div>
                        <div><strong>Vencimento:</strong> {formatarData(activeDoc.gt_data_vencimento)}</div>
                      </div>
                    </div>
                  )}

                  {/* BLOCO 4: CHECKLIST E SERVIÇO SOLICITADO */}
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0.75rem 0.9rem', backgroundColor: '#F9FAFB' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>
                      CHECKLIST & DETALHES DA O.S.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div><strong>Acessórios Acompanhantes:</strong> {activeDoc.acessorios_acompanhantes || 'Nenhum'}</div>
                      <div><strong>Problema Relatado / Queixa:</strong> "{activeDoc.problema_relatado}"</div>
                      {activeDoc.diagnostico_armeiro && (
                        <div><strong>Laudo Técnico do Armeiro:</strong> {activeDoc.diagnostico_armeiro}</div>
                      )}

                      {activeDoc.itens_laudo && activeDoc.itens_laudo.length > 0 ? (
                        <div style={{ marginTop: '0.4rem' }}>
                          <div style={{ fontWeight: '700', marginBottom: '0.2rem' }}>Serviços Executados & Peças Utilizadas:</div>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #D1D5DB', textAlign: 'left' }}>
                                <th style={{ padding: '0.25rem 0' }}>TIPO</th>
                                <th style={{ padding: '0.25rem 0' }}>ITEM / SERVIÇO</th>
                                <th style={{ padding: '0.25rem 0', textAlign: 'center' }}>QTD</th>
                                <th style={{ padding: '0.25rem 0', textAlign: 'right' }}>VALOR UNIT.</th>
                                <th style={{ padding: '0.25rem 0', textAlign: 'right' }}>SUBTOTAL</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeDoc.itens_laudo.map((it, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                  <td style={{ padding: '0.25rem 0', fontWeight: '700', fontSize: '0.72rem' }}>{it.tipo === 'SERVICO' ? 'SERVIÇO' : 'PEÇA'}</td>
                                  <td style={{ padding: '0.25rem 0' }}>{it.nome}</td>
                                  <td style={{ padding: '0.25rem 0', textAlign: 'center', fontWeight: '700' }}>{it.quantidade}</td>
                                  <td style={{ padding: '0.25rem 0', textAlign: 'right' }}>R$ {(parseFloat(it.valor_unitario) || 0).toFixed(2)}</td>
                                  <td style={{ padding: '0.25rem 0', textAlign: 'right', fontWeight: '700' }}>R$ {(parseFloat(it.subtotal) || 0).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        activeDoc.solucao_proposta && (
                          <div><strong>Serviços Executados / Propostos:</strong> {activeDoc.solucao_proposta}</div>
                        )
                      )}

                      {activeDoc.observacoes_armeiro && (
                        <div style={{ marginTop: '0.3rem', fontStyle: 'italic', color: '#4B5563' }}>
                          <strong>Observações do Armeiro:</strong> {activeDoc.observacoes_armeiro}
                        </div>
                      )}

                      {activeDoc.valor_servico > 0 && (
                        <div style={{ marginTop: '0.3rem' }}><strong>Valor Total Orçado:</strong> <span style={{ fontWeight: '800', color: '#111827' }}>R$ {parseFloat(activeDoc.valor_servico).toFixed(2)}</span></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* RODAPÉ E LINHAS DE ASSINATURA */}
                <div style={{ marginTop: '3.5rem', display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '0.78rem', color: '#374151' }}>
                  <div style={{ width: '45%' }}>
                    <div style={{ borderTop: '1.5px solid #000000', paddingTop: '0.4rem' }}>
                      <strong>{activeDoc.cliente_nome?.toUpperCase()}</strong><br />
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
                    const cliObj = (clientes || []).find(c => String(c.id) === String(activeDoc.cliente_id) || c.nome_completo === activeDoc.cliente_nome)
                    const tel = (cliObj?.telefone || '').replace(/\D/g, '')
                    const numTel = tel.length === 10 || tel.length === 11 ? `55${tel}` : tel
                    const msg = `Olá *${activeDoc.cliente_nome}*, tudo bem?\n\nAqui é da recepção da *${config?.nome_fantasia || 'Pró Guns Armeria'}*.\n\n*ORDEM DE SERVIÇO Nº ${activeDoc.numero_os}*\nEquipamento: ${activeDoc.marca_arma} ${activeDoc.modelo_arma} (${activeDoc.calibre_arma})\nN° de Série: ${activeDoc.numero_serie_arma || activeDoc.numero_serie || 'N/A'}\nStatus Atual: *${activeDoc.status}*\nQueixa/Serviço: "${activeDoc.problema_relatado}"\n${activeDoc.valor_servico > 0 ? `Valor Orçado: R$ ${parseFloat(activeDoc.valor_servico).toFixed(2)}\n` : ''}\nPara qualquer dúvida, entre em contato!`
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
                    const targetOS = { ...activeDoc }
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
        )
      })()}

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
