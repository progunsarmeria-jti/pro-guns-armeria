import React, { useState } from 'react'
import { Plus, Printer, Shield, Crosshair, FileText, Calendar, CheckCircle2, AlertCircle, Clock, Wrench, Package, MessageCircle, DollarSign, Send, Check } from 'lucide-react'
import ModalNovaOSArmeria from './ModalNovaOSArmeria'

export default function ModuloOrdens({
  ordens,
  setOrdens,
  clientes,
  financeiro,
  setFinanceiro,
  perfilOperador,
  notificacoes,
  setNotificacoes
}) {
  const [showModalOrdem, setShowModalOrdem] = useState(false)
  const [docModalOrdem, setDocModalOrdem] = useState(null)
  const [modalLaudoArmeiro, setModalLaudoArmeiro] = useState(null)

  // Form State do Laudo do Armeiro
  const [diagnosticoArmeiro, setDiagnosticoArmeiro] = useState('')
  const [solucaoProposta, setSolucaoProposta] = useState('')
  const [valorPecasMaoDeObra, setValorPecasMaoDeObra] = useState('')

  // 7 Status Operacionais da Armeria narrados na prática pelo cliente
  const STATUS_COLUNAS = [
    { id: 'NÃO INICIADO', label: 'NÃO INICIADO', color: '#9CA3AF', desc: 'Armário Entrada Recepção' },
    { id: 'EM ANÁLISE', label: 'EM ANÁLISE', color: '#60A5FA', desc: 'Bancada do Armeiro' },
    { id: 'AGUARDANDO APROVAÇÃO', label: 'AGUARDANDO APROVAÇÃO', color: '#F59E0B', desc: 'Laudo pronto - Avisar Cliente' },
    { id: 'APROVADO', label: 'APROVADO', color: '#A78BFA', desc: 'Cliente aprovou' },
    { id: 'EM MANUTENÇÃO', label: 'EM MANUTENÇÃO', color: '#06B6D4', desc: 'Armeiro executando' },
    { id: 'AGUARDANDO RETIRADA', label: 'AGUARDANDO RETIRADA', color: '#10B981', desc: 'Pronto no armário de saídas' },
    { id: 'CONCLUÍDO', label: 'CONCLUÍDO', color: '#34D399', desc: 'Retirado & Pago' }
  ]

  const handleMudarStatus = (ordemId, novoStatus) => {
    setOrdens(ordens.map(o => o.id === ordemId ? { ...o, status: novoStatus } : o))
  }

  // Armeiro clica em "Iniciar Análise"
  const handleIniciarAnalise = (ordem) => {
    setOrdens(ordens.map(o => o.id === ordem.id ? { ...o, status: 'EM ANÁLISE' } : o))
    setDiagnosticoArmeiro(ordem.diagnostico_armeiro || '')
    setSolucaoProposta(ordem.solucao_proposta || '')
    setValorPecasMaoDeObra(ordem.valor_servico ? ordem.valor_servico.toString() : '350.00')
    setModalLaudoArmeiro({ ...ordem, status: 'EM ANÁLISE' })
  }

  // Armeiro conclui o laudo técnico e envia para a Recepção
  const handleSalvarLaudoArmeiro = (e) => {
    e.preventDefault()
    if (!modalLaudoArmeiro) return

    const valorTotal = parseFloat(valorPecasMaoDeObra) || 0

    const ordemAtualizada = {
      ...modalLaudoArmeiro,
      diagnostico_armeiro: diagnosticoArmeiro,
      solucao_proposta: solucaoProposta,
      valor_servico: valorTotal,
      status: 'AGUARDANDO APROVAÇÃO' // Muda status para Aguardando Aprovação
    }

    setOrdens(ordens.map(o => o.id === modalLaudoArmeiro.id ? ordemAtualizada : o))

    // Dispara Notificação/Alerta para a Recepção!
    const novaNotificacao = {
      id: `n_${Date.now()}`,
      os_numero: modalLaudoArmeiro.numero_os,
      cliente_nome: modalLaudoArmeiro.cliente_nome,
      mensagem: `Armeiro concluiu o laudo técnico da ${modalLaudoArmeiro.marca_arma} ${modalLaudoArmeiro.modelo_arma}. Orçamento: R$ ${valorTotal.toFixed(2)}.`,
      tipo: 'LAUDO_PRONTO',
      lida: false,
      created_at: 'Agora'
    }

    setNotificacoes([novaNotificacao, ...notificacoes])

    alert(`Laudo concluído com sucesso! Alerta gerado para a Recepção entrar em contato com o cliente ${modalLaudoArmeiro.cliente_nome}.`)
    setModalLaudoArmeiro(null)
  }

  // Recepção envia orçamento via WhatsApp
  const handleEnviarOrcamentoWhatsApp = (ordem) => {
    const clienteObj = clientes.find(c => c.id === ordem.cliente_id || c.nome_completo === ordem.cliente_nome)
    const telefone = clienteObj?.telefone || ''
    const limpo = telefone.replace(/\D/g, '')
    const numero = limpo.length <= 11 ? `55${limpo}` : limpo

    const mensagemText = `Olá ${ordem.cliente_nome}, aqui é da Pró Guns Armeria! 🛡️\n\nConcluímos a análise técnica da sua ${ordem.marca_arma} ${ordem.modelo_arma} (OS #${ordem.numero_os}).\n\n🛠️ *Laudo do Armeiro:* ${ordem.diagnostico_armeiro || 'Revisão e manutenção recomendada.'}\n💡 *Solução:* ${ordem.solucao_proposta || 'Manutenção técnica'}\n💰 *Valor Total:* R$ ${(ordem.valor_servico || 0).toFixed(2)}\n\nPodemos aprovar o início do serviço?`

    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagemText)}`, '_blank')
  }

  // Recepção registra aprovação do cliente
  const handleAprovarPelaRecepcao = (ordemId) => {
    setOrdens(ordens.map(o => o.id === ordemId ? { ...o, status: 'APROVADO' } : o))
  }

  // Concluir retirada e lancar pagamento no Financeiro
  const handleConcluirERetirar = (ordem) => {
    setOrdens(ordens.map(o => o.id === ordem.id ? { ...o, status: 'CONCLUÍDO' } : o))

    // Lança no financeiro
    if (setFinanceiro && financeiro) {
      const novoLancamento = {
        id: `f_${Date.now()}`,
        descricao: `OS #${ordem.numero_os} - Manutenção ${ordem.marca_arma} ${ordem.modelo_arma} (${ordem.cliente_nome})`,
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

    alert(`OS #${ordem.numero_os} concluída! Equipamento entregue ao cliente e receita lançada no Financeiro.`)
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header com Banner do Perfil Ativo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="badge" style={{ backgroundColor: perfilOperador === 'recepcao' ? 'rgba(139, 38, 42, 0.3)' : 'rgba(19, 70, 51, 0.4)', color: perfilOperador === 'recepcao' ? '#F87171' : '#34D399', fontSize: '0.8rem' }}>
              {perfilOperador === 'recepcao' ? '🏢 MODO RECEPÇÃO & ATENDIMENTO' : '🛠️ MODO BANCADA DO ARMEIRO'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.3rem' }}>
            Ordens de Serviço de Armaria (Fluxo Diário)
          </h1>
        </div>

        {perfilOperador === 'recepcao' && (
          <button className="btn-red" onClick={() => setShowModalOrdem(true)}>
            <Plus size={18} />
            <span>Dar Entrada na O.S. (Recepção)</span>
          </button>
        )}
      </div>

      {/* Visão Kanban dos 7 Status Operacionais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {STATUS_COLUNAS.map(st => {
          const ordensNoStatus = ordens.filter(o => o.status === st.id)

          return (
            <div key={st.id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', minHeight: '480px', display: 'flex', flexDirection: 'column' }}>
              {/* Header Coluna Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.6rem', borderBottom: `3px solid ${st.color}` }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '800', color: st.color, letterSpacing: '0.5px' }}>{st.label}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{st.desc}</div>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem', borderRadius: '10px', backgroundColor: 'var(--bg-input)', fontWeight: '800', color: st.color }}>
                  {ordensNoStatus.length}
                </span>
              </div>

              {/* Cards das Ordens */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
                {ordensNoStatus.map(ordem => (
                  <div key={ordem.id} style={{
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span style={{ fontWeight: '800', color: 'var(--red-light)' }}>OS #{ordem.numero_os}</span>
                      <span className="badge" style={{ fontSize: '0.68rem', backgroundColor: ordem.categoria_arma === 'Arma de Fogo' ? 'rgba(139, 38, 42, 0.2)' : 'rgba(19, 70, 51, 0.3)', color: ordem.categoria_arma === 'Arma de Fogo' ? '#F87171' : '#34D399' }}>
                        {ordem.categoria_arma || 'Arma de Fogo'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      {ordem.cliente_nome?.toUpperCase()}
                    </div>

                    {/* Dados do Equipamento */}
                    <div style={{ fontSize: '0.82rem', backgroundColor: 'var(--bg-dark)', padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontWeight: '700', color: 'var(--gold-accent)' }}>
                        {ordem.marca_arma} {ordem.modelo_arma} — {ordem.calibre_arma}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        N° Série: <strong>{ordem.numero_serie_arma || ordem.numero_serie}</strong>
                      </div>
                    </div>

                    {/* Acessórios Incluídos */}
                    {ordem.acessorios_acompanhantes && (
                      <div style={{ fontSize: '0.72rem', color: '#60A5FA', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '0.35rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Package size={12} />
                        <span>Acessórios: {ordem.acessorios_acompanhantes}</span>
                      </div>
                    )}

                    {/* Problema Relatado */}
                    {ordem.problema_relatado && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.5rem', borderRadius: '4px' }}>
                        "{ordem.problema_relatado}"
                      </div>
                    )}

                    {/* Diagnóstico do Armeiro (se já preenchido) */}
                    {ordem.diagnostico_armeiro && (
                      <div style={{ fontSize: '0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.45rem', borderRadius: '4px', color: '#FBBF24' }}>
                        <strong>Laudo do Armeiro:</strong> {ordem.diagnostico_armeiro}
                        {ordem.valor_servico > 0 && <div><strong>Orçamento:</strong> R$ {ordem.valor_servico.toFixed(2)}</div>}
                      </div>
                    )}

                    {/* AÇÕES ESPECÍFICAS DE PERFIL (ARMEIRO VS RECEPÇÃO) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.3rem' }}>
                      {/* Armeiro pega equipamento Não Iniciado */}
                      {perfilOperador === 'armeiro' && ordem.status === 'NÃO INICIADO' && (
                        <button
                          onClick={() => handleIniciarAnalise(ordem)}
                          style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid #60A5FA', color: '#60A5FA', padding: '0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                        >
                          <Wrench size={14} />
                          <span>Iniciar Análise (Pegar Arma)</span>
                        </button>
                      )}

                      {/* Armeiro em Análise */}
                      {perfilOperador === 'armeiro' && ordem.status === 'EM ANÁLISE' && (
                        <button
                          onClick={() => {
                            setDiagnosticoArmeiro(ordem.diagnostico_armeiro || '')
                            setSolucaoProposta(ordem.solucao_proposta || '')
                            setValorPecasMaoDeObra(ordem.valor_servico ? ordem.valor_servico.toString() : '350.00')
                            setModalLaudoArmeiro(ordem)
                          }}
                          style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid #FBBF24', color: '#FBBF24', padding: '0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                        >
                          <FileText size={14} />
                          <span>Preencher Laudo & Orçamento</span>
                        </button>
                      )}

                      {/* Recepção envia orçamento no WhatsApp e aprova */}
                      {perfilOperador === 'recepcao' && ordem.status === 'AGUARDANDO APROVAÇÃO' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <button
                            onClick={() => handleEnviarOrcamentoWhatsApp(ordem)}
                            style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', border: '1px solid #25D366', color: '#25D366', padding: '0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                          >
                            <MessageCircle size={14} />
                            <span>Enviar no WhatsApp do Cliente</span>
                          </button>
                          <button
                            onClick={() => handleAprovarPelaRecepcao(ordem.id)}
                            style={{ backgroundColor: '#134633', border: '1px solid #34D399', color: '#FFFFFF', padding: '0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                          >
                            <Check size={14} />
                            <span>Cliente Aprovou o Orçamento</span>
                          </button>
                        </div>
                      )}

                      {/* Armeiro inicia manutenção em arma Aprovada */}
                      {perfilOperador === 'armeiro' && ordem.status === 'APROVADO' && (
                        <button
                          onClick={() => handleMudarStatus(ordem.id, 'EM MANUTENÇÃO')}
                          style={{ backgroundColor: '#134633', border: '1px solid #34D399', color: '#FFFFFF', padding: '0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                        >
                          <Wrench size={14} />
                          <span>Iniciar Manutenção na Bancada</span>
                        </button>
                      )}

                      {/* Armeiro conclui manutenção */}
                      {perfilOperador === 'armeiro' && ordem.status === 'EM MANUTENÇÃO' && (
                        <button
                          onClick={() => handleMudarStatus(ordem.id, 'AGUARDANDO RETIRADA')}
                          style={{ backgroundColor: '#06B6D4', color: '#FFFFFF', border: 'none', padding: '0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                        >
                          <CheckCircle2 size={14} />
                          <span>Concluir & Colocar em Saída</span>
                        </button>
                      )}

                      {/* Recepção conclui entrega e pagamento */}
                      {perfilOperador === 'recepcao' && ordem.status === 'AGUARDANDO RETIRADA' && (
                        <button
                          onClick={() => handleConcluirERetirar(ordem)}
                          style={{ backgroundColor: '#34D399', color: '#000000', border: 'none', padding: '0.4rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                        >
                          <DollarSign size={14} />
                          <span>Registrar Retirada & Pagamento</span>
                        </button>
                      )}
                    </div>

                    {/* Mudar Status Operacional Geral */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <button
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        onClick={() => setDocModalOrdem(ordem)}
                      >
                        <Printer size={12} />
                        <span>Ficha / Recibo</span>
                      </button>

                      <select
                        value={ordem.status}
                        onChange={e => handleMudarStatus(ordem.id, e.target.value)}
                        style={{ background: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.7rem', padding: '0.2rem 0.4rem', fontWeight: '600' }}
                      >
                        {STATUS_COLUNAS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Entrada de Equipamento (Recepção) */}
      {showModalOrdem && (
        <ModalNovaOSArmeria
          clientes={clientes}
          ordens={ordens}
          setOrdens={setOrdens}
          onClose={() => setShowModalOrdem(false)}
        />
      )}

      {/* Modal Preencher Laudo Técnico do Armeiro */}
      {modalLaudoArmeiro && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#FBBF24', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Wrench size={20} />
              <span>Bancada do Armeiro — Laudo Técnico (OS #{modalLaudoArmeiro.numero_os})</span>
            </h3>

            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div><strong>Cliente:</strong> {modalLaudoArmeiro.cliente_nome}</div>
              <div><strong>Equipamento:</strong> {modalLaudoArmeiro.marca_arma} {modalLaudoArmeiro.modelo_arma} ({modalLaudoArmeiro.calibre_arma}) - N° Série: {modalLaudoArmeiro.numero_serie_arma || modalLaudoArmeiro.numero_serie}</div>
              <div style={{ color: '#F87171', fontStyle: 'italic', marginTop: '0.3rem' }}>Queixa do Cliente: "{modalLaudoArmeiro.problema_relatado}"</div>
            </div>

            <form onSubmit={handleSalvarLaudoArmeiro} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>DIAGNÓSTICO TÉCNICO DO ARMEIRO *</label>
                <textarea
                  required
                  className="input-field"
                  rows="3"
                  value={diagnosticoArmeiro}
                  onChange={e => setDiagnosticoArmeiro(e.target.value)}
                  placeholder="Ex: Identificado extrator desgastado com mola enfraquecida e acúmulo de resíduos na câmara..."
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>SOLUÇÃO PROPOSTA & SERVIÇOS *</label>
                <textarea
                  required
                  className="input-field"
                  rows="2"
                  value={solucaoProposta}
                  onChange={e => setSolucaoProposta(e.target.value)}
                  placeholder="Ex: Substituição do extrator Glock G17 Gen5, troca da mola e limpeza ultrassônica."
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>VALOR TOTAL ESTIMADO (PEÇAS + MÃO DE OBRA R$) *</label>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalLaudoArmeiro(null)}>Cancelar</button>
                <button type="submit" className="btn-gold">
                  <Send size={16} />
                  <span>Concluir Laudo ➔ Enviar para Aprovação</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprovante de Entrada do Equipamento para Impressão */}
      {docModalOrdem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 9999, padding: '2rem 1rem', overflowY: 'auto'
        }}>
          <div style={{
            position: 'relative', width: '100%', maxWidth: '680px', backgroundColor: '#FFFFFF', color: '#111827', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', padding: '2rem', margin: 'auto 0'
          }}>
            <div className="print-area">
              <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '800', fontFamily: 'Cinzel, serif', color: '#000' }}>PRÓ GUNS ARMERIA & DESPACHANTARIA</h2>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#333' }}>COMPROVANTE DE ENTRADA DE EQUIPAMENTO — OS #{docModalOrdem.numero_os}</div>
                <div style={{ fontSize: '0.75rem', color: '#555' }}>CR Armeria N° 998877/2ª RM — Jataí/GO</div>
              </div>

              <div style={{ fontSize: '0.88rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div><strong>Cliente:</strong> {docModalOrdem.cliente_nome?.toUpperCase()}</div>
                <div><strong>Categoria:</strong> {docModalOrdem.categoria_arma || 'Arma de Fogo'}</div>
                <div><strong>Equipamento:</strong> {docModalOrdem.tipo_arma} — {docModalOrdem.marca_arma} {docModalOrdem.modelo_arma} ({docModalOrdem.calibre_arma})</div>
                <div><strong>N° de Série:</strong> {docModalOrdem.numero_serie_arma || docModalOrdem.numero_serie}</div>
                {docModalOrdem.acessorios_acompanhantes && (
                  <div><strong>Acessórios Acompanhantes:</strong> {docModalOrdem.acessorios_acompanhantes}</div>
                )}
                <div><strong>Problema Relatado:</strong> "{docModalOrdem.problema_relatado}"</div>
                {docModalOrdem.diagnostico_armeiro && (
                  <div><strong>Laudo do Armeiro:</strong> {docModalOrdem.diagnostico_armeiro}</div>
                )}
                {docModalOrdem.gt_protocolo && (
                  <div><strong>Guia de Tráfego:</strong> {docModalOrdem.gt_protocolo}</div>
                )}
              </div>

              <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '0.8rem' }}>
                <div>
                  <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '0.3rem' }}>
                    {docModalOrdem.cliente_nome}
                    <br /> Proprietário / Requerente
                  </div>
                </div>
                <div>
                  <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '0.3rem' }}>
                    Pró Guns Armeria
                    <br /> Responsável Técnico Armeiro
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              <button className="btn-secondary" style={{ backgroundColor: '#e5e7eb', color: '#1f2937' }} onClick={() => setDocModalOrdem(null)}>Fechar</button>
              <button className="btn-gold" onClick={() => window.print()}>Imprimir Comprovante</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
