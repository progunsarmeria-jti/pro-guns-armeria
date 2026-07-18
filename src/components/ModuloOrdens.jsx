import React, { useState } from 'react'
import { Plus, Printer, FileText, CheckCircle2, Wrench, Package, MessageCircle, DollarSign, Send, ChevronDown, X, Eye } from 'lucide-react'
import ModalNovaOSArmeria from './ModalNovaOSArmeria'

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
  financeiro,
  setFinanceiro,
  perfilOperador,
  usuarioLogado,
  notificacoes,
  setNotificacoes,
  config
}) {
  const [showModalOrdem, setShowModalOrdem] = useState(false)
  const [docModalOrdem, setDocModalOrdem] = useState(null)
  const [modalLaudoArmeiro, setModalLaudoArmeiro] = useState(null)
  const [ordemExpandida, setOrdemExpandida] = useState(null)
  const [filtroStatus, setFiltroStatus] = useState('TODAS')

  // Form State do Laudo do Armeiro
  const [diagnosticoArmeiro, setDiagnosticoArmeiro] = useState('')
  const [solucaoProposta, setSolucaoProposta] = useState('')
  const [valorPecasMaoDeObra, setValorPecasMaoDeObra] = useState('')

  const handleMudarStatus = (ordemId, novoStatus) => {
    setOrdens(ordens.map(o => o.id === ordemId ? { ...o, status: novoStatus } : o))
  }

  const handleIniciarAnalise = (ordem) => {
    setOrdens(ordens.map(o => o.id === ordem.id ? { ...o, status: 'EM ANÁLISE' } : o))
    setDiagnosticoArmeiro(ordem.diagnostico_armeiro || '')
    setSolucaoProposta(ordem.solucao_proposta || '')
    setValorPecasMaoDeObra(ordem.valor_servico ? ordem.valor_servico.toString() : '')
    setModalLaudoArmeiro({ ...ordem, status: 'EM ANÁLISE' })
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
    setOrdens(ordens.map(o => o.id === modalLaudoArmeiro.id ? ordemAtualizada : o))
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
    setOrdens(ordens.map(o => o.id === ordemId ? { ...o, status: 'APROVADO' } : o))
  }

  const handleConcluirERetirar = (ordem) => {
    setOrdens(ordens.map(o => o.id === ordem.id ? { ...o, status: 'CONCLUÍDO' } : o))
    if (setFinanceiro && financeiro) {
      const novoLancamento = {
        id: `f_${Date.now()}`,
        descricao: `OS #${ordem.numero_os} - ${ordem.marca_arma} ${ordem.modelo_arma} (${ordem.cliente_nome})`,
        tipo: 'Receita',
        categoria: 'Serviço Armeria',
        valor: ordem.valor_servico || 350.00,
        data_vencimento: new Date().toISOString().split('T')[0],
        data_pagamento: new Date().toISOString().split('T')[0],
        status: 'Pago',
        forma_pagamento: 'PIX'
      }
      setFinanceiro([novoLancamento, ...financeiro])
    }
    alert(`OS #${ordem.numero_os} concluída! Receita lançada no Financeiro.`)
  }

  // Filtro de ordens
  const ordensFiltradas = filtroStatus === 'TODAS'
    ? ordens
    : filtroStatus === 'EM ABERTO'
      ? ordens.filter(o => o.status !== 'CONCLUÍDO')
      : ordens.filter(o => o.status === filtroStatus)

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

      {/* ── RESUMO DE STATUS (CHIPS CLICÁVEIS) ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        <button
          onClick={() => setFiltroStatus('TODAS')}
          style={{
            padding: '0.3rem 0.75rem', borderRadius: '20px', border: '1px solid var(--border-color)',
            backgroundColor: filtroStatus === 'TODAS' ? 'var(--red-tactical)' : 'var(--bg-input)',
            color: filtroStatus === 'TODAS' ? '#fff' : 'var(--text-muted)',
            fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer'
          }}
        >
          TODAS ({ordens.length})
        </button>
        <button
          onClick={() => setFiltroStatus('EM ABERTO')}
          style={{
            padding: '0.3rem 0.75rem', borderRadius: '20px', border: '1px solid var(--border-color)',
            backgroundColor: filtroStatus === 'EM ABERTO' ? '#F59E0B' : 'var(--bg-input)',
            color: filtroStatus === 'EM ABERTO' ? '#000' : 'var(--text-muted)',
            fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer'
          }}
        >
          EM ABERTO ({ordens.filter(o => o.status !== 'CONCLUÍDO').length})
        </button>
        {STATUS_LISTA.map(s => {
          const cfg = STATUS_CONFIG[s]
          const ativo = filtroStatus === s
          return (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              style={{
                padding: '0.3rem 0.75rem', borderRadius: '20px',
                border: `1px solid ${cfg.color}`,
                backgroundColor: ativo ? cfg.color : cfg.bg,
                color: ativo ? '#000' : cfg.color,
                fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer'
              }}
            >
              {s} ({ordensPorStatus[s]})
            </button>
          )
        })}
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
                    display: 'inline-block',
                    maxWidth: '100%',
                    padding: '0.18rem 0.5rem',
                    borderRadius: '12px',
                    backgroundColor: cfg.bg,
                    color: cfg.color,
                    fontSize: '0.63rem',
                    fontWeight: '800',
                    border: `1px solid ${cfg.color}`,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {ordem.status}
                  </span>
                </div>

                <div style={{ fontWeight: '800', color: ordem.valor_servico ? '#FBBF24' : 'var(--text-muted)', fontSize: '0.83rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ordem.valor_servico ? `R$ ${parseFloat(ordem.valor_servico).toFixed(2)}` : '—'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.3rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDocModalOrdem(ordem) }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                    title="Ficha / Comprovante"
                  >
                    <Printer size={14} />
                  </button>
                  <ChevronDown
                    size={15}
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.82rem' }}>
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
                    {/* ALTERAR STATUS MANUAL */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>STATUS:</span>
                      <select
                        value={ordem.status}
                        onChange={e => handleMudarStatus(ordem.id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        style={{
                          background: 'var(--bg-dark)', color: cfg.color,
                          border: `1px solid ${cfg.color}`, borderRadius: '6px',
                          fontSize: '0.75rem', padding: '0.25rem 0.5rem', fontWeight: '700', cursor: 'pointer'
                        }}
                      >
                        {STATUS_LISTA.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
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

                    {/* BOTÃO: Recepção conclui e registra pagamento */}
                    {perfilOperador === 'recepcao' && ordem.status === 'AGUARDANDO RETIRADA' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleConcluirERetirar(ordem) }}
                        style={{ backgroundColor: '#34D399', color: '#000', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <DollarSign size={13} /> Registrar Retirada & Pagamento
                      </button>
                    )}
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
          ordens={ordens}
          setOrdens={setOrdens}
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

      {/* ── MODAL COMPROVANTE / FICHA DA O.S. ── */}
      {docModalOrdem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 9999, padding: '2rem 1rem', overflowY: 'auto' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '680px', backgroundColor: '#FFFFFF', color: '#111827', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', padding: '2rem', margin: 'auto 0' }}>
            <button
              onClick={() => setDocModalOrdem(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#F3F4F6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4B5563' }}
            >
              <X size={18} />
            </button>

            <div className="print-area">
              <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '800', fontFamily: 'Cinzel, serif', color: '#000' }}>
                  {(config?.razao_social || config?.nome_fantasia || 'PRÓ GUNS ARMERIA').toUpperCase()}
                </h2>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#333' }}>COMPROVANTE DE ENTRADA — OS #{docModalOrdem.numero_os}</div>
                <div style={{ fontSize: '0.75rem', color: '#555' }}>{config?.cr_armeria || 'CR-998877/2ª RM'}</div>
              </div>

              <div style={{ fontSize: '0.88rem', lineHeight: '2', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                <div><strong>Cliente:</strong> {docModalOrdem.cliente_nome?.toUpperCase()}</div>
                <div><strong>Categoria:</strong> {docModalOrdem.categoria_arma || 'Arma de Fogo'}</div>
                <div><strong>Equipamento:</strong> {docModalOrdem.tipo_arma} — {docModalOrdem.marca_arma} {docModalOrdem.modelo_arma} ({docModalOrdem.calibre_arma})</div>
                <div><strong>N° de Série:</strong> {docModalOrdem.numero_serie_arma || docModalOrdem.numero_serie}</div>
                {docModalOrdem.acessorios_acompanhantes && <div><strong>Acessórios:</strong> {docModalOrdem.acessorios_acompanhantes}</div>}
                <div><strong>Problema Relatado:</strong> "{docModalOrdem.problema_relatado}"</div>
                {docModalOrdem.diagnostico_armeiro && <div><strong>Laudo do Armeiro:</strong> {docModalOrdem.diagnostico_armeiro}</div>}
                {docModalOrdem.valor_servico > 0 && <div><strong>Valor Orçado:</strong> R$ {parseFloat(docModalOrdem.valor_servico).toFixed(2)}</div>}
                {docModalOrdem.gt_protocolo && <div><strong>Guia de Tráfego:</strong> {docModalOrdem.gt_protocolo}</div>}
              </div>

              <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '0.8rem' }}>
                <div><div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '0.3rem' }}>{docModalOrdem.cliente_nome}<br />Proprietário / Requerente</div></div>
                <div><div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '0.3rem' }}>{config?.nome_fantasia || 'Pró Guns Armeria'}<br />Responsável Técnico Armeiro</div></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              <button style={{ backgroundColor: '#e5e7eb', color: '#1f2937', border: '1px solid #D1D5DB', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }} onClick={() => setDocModalOrdem(null)}>Fechar</button>
              <button className="btn-gold" onClick={() => window.print()}>Imprimir Comprovante</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
