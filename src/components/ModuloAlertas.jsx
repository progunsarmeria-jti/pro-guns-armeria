import React, { useState } from 'react'
import {
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  Phone,
  PhoneOff,
  UserCheck,
  FileText,
  Send,
  Volume2,
  VolumeX,
  X,
  Filter,
  Check
} from 'lucide-react'
import CustomSelect from './CustomSelect'

export default function ModuloAlertas({
  alertas = [],
  setAlertas,
  ordens = [],
  setOrdens,
  usuarioLogado,
  setActiveTab,
  setFiltroStatusOrdens
}) {
  const [filtroStatus, setFiltroStatus] = useState('PENDENTE') // 'PENDENTE' | 'RESOLVIDO' | 'TODOS'
  const [filtroTipo, setFiltroTipo] = useState('TODOS')
  const [modalAtendimento, setModalAtendimento] = useState(null)

  // State Form do Atendimento
  const [contensouFalar, setContensouFalar] = useState('SIM') // 'SIM' | 'NAO_SEM_RESPOSTA' | 'FORA_DE_AREA'
  const [resultadoAcordo, setResultadoAcordo] = useState('CLIENTE_APROVOU') 
  // 'CLIENTE_APROVOU' | 'CLIENTE_RECUSOU' | 'RETIRADA_AGENDADA' | 'SOLICITOU_PRAZO' | 'AGUARDANDO_RETORNO'
  const [dataAgendamento, setDataAgendamento] = useState('')
  const [detalhesConversa, setDetalhesConversa] = useState('')

  // Purga defensiva imediata de alertas órfãos cuja O.S. não existe mais
  const alertasValidos = (alertas || []).filter(a => {
    if (a.ordem_id || a.os_numero) {
      return (ordens || []).some(o => 
        String(o.id) === String(a.ordem_id) || 
        Number(o.numero_os) === Number(a.os_numero)
      )
    }
    return true
  })

  // Métricas do Painel
  const alertasPendentes = alertasValidos.filter(a => a.status === 'PENDENTE')
  const alertasResolvidos = alertasValidos.filter(a => a.status === 'RESOLVIDO')

  // Helper de cálculo de tempo decorrido
  const getTempoDecorrido = (dateString) => {
    if (!dateString) return 'Há poucos instantes'
    const diffMs = Date.now() - new Date(dateString).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Agora mesmo'
    if (diffMins < 60) return `Há ${diffMins} min`
    const diffHoras = Math.floor(diffMins / 60)
    if (diffHoras < 24) return `Há ${diffHoras}h`
    return `Há ${Math.floor(diffHoras / 24)}d`
  }

  // Tocar aviso sonoro de teste
  const handleTocarSomTeste = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15) // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.3)
    } catch(e) {}
  }

  // Abrir WhatsApp Web com mensagem pré-formatada para o cliente
  const handleAbrirWhatsApp = (alerta) => {
    const num = (alerta.cliente_telefone || '').replace(/\D/g, '')
    let msg = `Olá ${alerta.cliente_nome}, tudo bem? Aqui é da recepção da Pró Guns Armeria.`
    if (alerta.tipo_alerta === 'AGUARDANDO APROVAÇÃO') {
      msg += ` O laudo técnico da sua ${alerta.equipamento} (OS #${alerta.os_numero}) foi concluído pelo armeiro e está aguardando sua aprovação. Podemos conversar?`
    } else {
      msg += ` Sua ${alerta.equipamento} (OS #${alerta.os_numero}) está pronta para retirada! Quando você poderá vir buscar?`
    }
    const url = num ? `https://wa.me/55${num}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  // Registrar Tentativa Sem Resposta
  const handleRegistrarTentativaSemResposta = (alerta) => {
    const novaTentativa = {
      id: `t_${Date.now()}`,
      data_hora: new Date().toLocaleString('pt-BR'),
      operador: usuarioLogado?.nome_completo || 'Atendente Recepção',
      resultado: 'Não Atendeu / Deixei Recado',
      observacao: 'Tentativa de contato telefônico sem sucesso. Enviado recado via WhatsApp.'
    }

    const alertasAtualizados = alertas.map(a => {
      if (a.id === alerta.id) {
        return {
          ...a,
          tentativas_contato: [...(a.tentativas_contato || []), novaTentativa]
        }
      }
      return a
    })
    setAlertas(alertasAtualizados)
    alert(`Tentativa registrada para a OS #${alerta.os_numero}. O alerta continua pendente no painel.`)
  }

  // Finalizar Chamado / Atendimento
  const handleFinalizarChamado = (e) => {
    e.preventDefault()
    if (!modalAtendimento) return

    const alerta = modalAtendimento
    const hojeStr = new Date().toLocaleString('pt-BR')

    let descResultado = ''
    if (resultadoAcordo === 'CLIENTE_APROVOU') descResultado = 'Cliente Aprovou o Orçamento'
    else if (resultadoAcordo === 'CLIENTE_RECUSOU') descResultado = 'Cliente Recusou o Orçamento'
    else if (resultadoAcordo === 'RETIRADA_AGENDADA') descResultado = `Retirada Agendada para ${dataAgendamento || 'breve'}`
    else descResultado = 'Aguardando Retorno do Cliente'

    const novaTentativa = {
      id: `t_${Date.now()}`,
      data_hora: hojeStr,
      operador: usuarioLogado?.nome_completo || 'Atendente Recepção',
      resultado: contensouFalar === 'SIM' ? 'Contato Efetuado com Sucesso' : 'Tentativa Sem Resposta',
      observacao: `${descResultado}. Obs: ${detalhesConversa}`
    }

    const alertaResolvido = {
      ...alerta,
      status: 'RESOLVIDO',
      resolucao: {
        data_hora: hojeStr,
        operador: usuarioLogado?.nome_completo || 'Atendente Recepção',
        conseguiu_falar: contensouFalar,
        resultado_acordo: descResultado,
        detalhes: detalhesConversa
      },
      tentativas_contato: [...(alerta.tentativas_contato || []), novaTentativa]
    }

    // Se cliente aprovou orçamento -> Atualiza status da OS para APROVADO
    if (alerta.tipo_alerta === 'AGUARDANDO APROVAÇÃO' && resultadoAcordo === 'CLIENTE_APROVOU') {
      setOrdens(prev => prev.map(o => String(o.id) === String(alerta.os_id) ? { ...o, status: 'APROVADO' } : o))
    }

    const alertasAtualizados = alertas.map(a => a.id === alerta.id ? alertaResolvido : a)
    setAlertas(alertasAtualizados)
    setModalAtendimento(null)
    setDetalhesConversa('')
  }

  const alertasFiltrados = alertasValidos.filter(a => {
    if (filtroStatus !== 'TODOS' && a.status !== filtroStatus) return false
    if (filtroTipo !== 'TODOS' && a.tipo_alerta !== filtroTipo) return false
    return true
  })

  return (
    <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header do Painel de Alerta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
            <span className="badge badge-red" style={{ fontSize: '0.72rem', fontWeight: '800' }}>
              RECEPÇÃO CENTRAL
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monitoramento em Tempo Real</span>
          </div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--gold-primary)', margin: 0 }}>
            🔔 Painel de Alerta & Chamados da Oficina
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Notificações instantâneas disparadas pelos armeiros para comunicação com clientes.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={handleTocarSomTeste} title="Testar Som da Campainha" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
            <Volume2 size={16} color="#34D399" />
            <span>Testar Alerta Sonoro</span>
          </button>
        </div>
      </div>

      {/* Cards Indicadores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', borderLeft: '4px solid #EF4444' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bell size={20} color="#F87171" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>CHAMADOS PENDENTES</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#F87171' }}>
              {alertasPendentes.length} pendências
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', borderLeft: '4px solid #10B981' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle2 size={20} color="#34D399" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>ATENDIDOS HOJE</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#34D399' }}>
              {alertasResolvidos.length} finalizados
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '0.85rem' }}>
        <div style={{ minWidth: '180px' }}>
          <CustomSelect
            label="STATUS DO CHAMADO"
            value={filtroStatus}
            onChange={val => setFiltroStatus(val)}
            options={['PENDENTE', 'RESOLVIDO', 'TODOS']}
            placeholder="Status..."
            allowCustom={false}
          />
        </div>
        <div style={{ minWidth: '220px' }}>
          <CustomSelect
            label="TIPO DE ALERTA"
            value={filtroTipo}
            onChange={val => setFiltroTipo(val)}
            options={['TODOS', 'AGUARDANDO APROVAÇÃO', 'AGUARDANDO RETIRADA']}
            placeholder="Tipo..."
            allowCustom={false}
          />
        </div>
      </div>

      {/* Lista de Cards de Alerta Pendentes/Resolvidos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {alertasFiltrados.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="#34D399" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>Nenhum chamado pendente no momento!</div>
            <div style={{ fontSize: '0.82rem' }}>Todos os alertas disparados pelos armeiros foram atendidos.</div>
          </div>
        ) : (
          alertasFiltrados.map(alerta => {
            const isPendente = alerta.status === 'PENDENTE'
            const tempoDecorrido = getTempoDecorrido(alerta.created_at)

            return (
              <div
                key={alerta.id}
                className="card"
                style={{
                  borderLeft: `5px solid ${isPendente ? (alerta.tipo_alerta === 'AGUARDANDO APROVAÇÃO' ? '#F59E0B' : '#10B981') : '#6B7280'}`,
                  backgroundColor: isPendente ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                {/* Header do Card de Alerta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      padding: '0.5rem 0.75rem', borderRadius: '8px',
                      backgroundColor: alerta.tipo_alerta === 'AGUARDANDO APROVAÇÃO' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                      color: alerta.tipo_alerta === 'AGUARDANDO APROVAÇÃO' ? '#F59E0B' : '#34D399',
                      fontWeight: '800', fontSize: '0.8rem'
                    }}>
                      OS #{alerta.os_numero}
                    </div>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                        {alerta.cliente_nome}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Equipamento: <strong>{alerta.equipamento}</strong> | Tel: {alerta.cliente_telefone || 'Não informado'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={13} /> {tempoDecorrido}
                    </span>
                    <span className={`badge ${isPendente ? 'badge-yellow' : 'badge-gray'}`}>
                      {alerta.status}
                    </span>
                  </div>
                </div>

                {/* Mensagem do Armeiro */}
                <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', fontWeight: '700', marginBottom: '0.2rem' }}>
                    AVISO DISPARADO PELA OFICINA ARMERIA:
                  </div>
                  <div style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>
                    "{alerta.mensagem}"
                  </div>
                </div>

                {/* Histórico de Tentativas Anteriores */}
                {alerta.tentativas_contato?.length > 0 && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <strong>Tentativas registradas ({alerta.tentativas_contato.length}):</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.3rem' }}>
                      {alerta.tentativas_contato.map(t => (
                        <div key={t.id} style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.6rem', borderRadius: '4px', borderLeft: '2px solid var(--border-color)' }}>
                          <span style={{ color: 'var(--gold-primary)' }}>[{t.data_hora}] </span>
                          <strong style={{ color: 'var(--text-main)' }}>{t.operador}: </strong>
                          <span>{t.resultado} — <em>{t.observacao}</em></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolução (se concluído) */}
                {!isPendente && alerta.resolucao && (
                  <div style={{ backgroundColor: 'rgba(16,185,129,0.08)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.8rem', color: '#6EE7B7' }}>
                    <div><strong>Atendido por:</strong> {alerta.resolucao.operador} em {alerta.resolucao.data_hora}</div>
                    <div><strong>Resultado:</strong> {alerta.resolucao.resultado_acordo}</div>
                    {alerta.resolucao.detalhes && <div><strong>Detalhes:</strong> {alerta.resolucao.detalhes}</div>}
                  </div>
                )}

                {/* Ações do Atendimento */}
                {isPendente && (
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', color: '#25D366', borderColor: '#25D366' }}
                      onClick={() => handleAbrirWhatsApp(alerta)}
                    >
                      <MessageCircle size={15} /> WhatsApp 1-Click
                    </button>

                    <button
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem' }}
                      onClick={() => handleRegistrarTentativaSemResposta(alerta)}
                    >
                      <PhoneOff size={15} /> Não Atendeu / Recado
                    </button>

                    <button
                      className="btn-gold"
                      style={{ fontSize: '0.78rem' }}
                      onClick={() => setModalAtendimento(alerta)}
                    >
                      <Check size={16} /> Finalizar Chamado & Registrar
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ── MODAL FINALIZAR CHAMADO / REGISTRO DE ATENDIMENTO ───────────────── */}
      {modalAtendimento && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--gold-primary)', margin: 0 }}>
                  Finalizar Chamado — OS #{modalAtendimento.os_numero}
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Cliente: <strong>{modalAtendimento.cliente_nome}</strong> ({modalAtendimento.equipamento})
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setModalAtendimento(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFinalizarChamado} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Conseguiu contato com o cliente? *</label>
                <CustomSelect
                  label=""
                  value={contensouFalar === 'SIM' ? 'Sim, consegui falar com o cliente' : 'Não atendeu / Deixei recado'}
                  onChange={val => setContensouFalar(val.includes('Sim') ? 'SIM' : 'NAO_SEM_RESPOSTA')}
                  options={['Sim, consegui falar com o cliente', 'Não atendeu / Deixei recado']}
                  placeholder="Selecione..."
                  allowCustom={false}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Resultado do Acordo / Atendimento *</label>
                <CustomSelect
                  label=""
                  value={
                    resultadoAcordo === 'CLIENTE_APROVOU' ? 'Cliente Aprovou o Orçamento' :
                    resultadoAcordo === 'RETIRADA_AGENDADA' ? 'Agendou Retirada do Equipamento' :
                    resultadoAcordo === 'CLIENTE_RECUSOU' ? 'Cliente Recusou o Orçamento' : 'Aguardando Retorno do Cliente'
                  }
                  onChange={val => {
                    if (val.includes('Aprovou')) setResultadoAcordo('CLIENTE_APROVOU')
                    else if (val.includes('Agendou')) setResultadoAcordo('RETIRADA_AGENDADA')
                    else if (val.includes('Recusou')) setResultadoAcordo('CLIENTE_RECUSOU')
                    else setResultadoAcordo('AGUARDANDO_RETORNO')
                  }}
                  options={['Cliente Aprovou o Orçamento', 'Agendou Retirada do Equipamento', 'Cliente Recusou o Orçamento', 'Aguardando Retorno do Cliente']}
                  placeholder="Selecione..."
                  allowCustom={false}
                />
              </div>

              {resultadoAcordo === 'RETIRADA_AGENDADA' && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--gold-primary)' }}>Data / Hora Agendada para Retirada *</label>
                  <input className="input-field" type="datetime-local" value={dataAgendamento} onChange={e => setDataAgendamento(e.target.value)} />
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Detalhes do que foi acordado na conversa *</label>
                <textarea
                  required
                  rows={3}
                  className="input-field"
                  value={detalhesConversa}
                  onChange={e => setDetalhesConversa(e.target.value)}
                  placeholder="Ex: Conversei com o Sr. Roberto. Ele aprovou a troca da mola e disse que virá buscar na sexta-feira às 14h."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalAtendimento(null)}>Cancelar</button>
                <button type="submit" className="btn-gold">Confirmar e Finalizar Chamado</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
