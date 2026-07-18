import React, { useState } from 'react'
import { Plus, Printer, Shield, Crosshair, FileText, Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import ModalNovaOSArmeria from './ModalNovaOSArmeria'

export default function ModuloOrdens({ ordens, setOrdens, clientes, financeiro, setFinanceiro }) {
  const [showModalOrdem, setShowModalOrdem] = useState(false)
  const [docModalOrdem, setDocModalOrdem] = useState(null)

  // 7 Status Operacionais da Armeria narrados na prática pelo cliente
  const STATUS_COLUNAS = [
    { id: 'AGUARDANDO ANÁLISE', label: 'AGUARDANDO ANÁLISE', color: '#FBBF24', desc: 'Recepção deu entrada' },
    { id: 'EM ANÁLISE', label: 'EM ANÁLISE', color: '#60A5FA', desc: 'Armeiro analisando' },
    { id: 'AGUARDANDO APROVAÇÃO', label: 'AGUARDANDO APROVAÇÃO', color: '#F59E0B', desc: 'Aguardando aprovação' },
    { id: 'APROVADO', label: 'APROVADO', color: '#A78BFA', desc: 'Cliente aprovou' },
    { id: 'EM EXECUÇÃO DO SERVIÇO', label: 'EM EXECUÇÃO', color: '#06B6D4', desc: 'Armeiro executando' },
    { id: 'AGUARDANDO RETIRADA', label: 'AGUARDANDO RETIRADA', color: '#10B981', desc: 'Manutenção concluída' },
    { id: 'CONCLUÍDO', label: 'CONCLUÍDO', color: '#34D399', desc: 'Arma retirada & Pago' }
  ]

  const handleMudarStatus = (ordemId, novoStatus) => {
    setOrdens(ordens.map(o => o.id === ordemId ? { ...o, status: novoStatus } : o))
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Crosshair size={26} color="var(--red-light)" />
            <span>Ordens de Serviço de Manutenção (Armeria)</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Fluxo operacional de recepção, análise técnica, manutenção e entrega de armas de fogo e ar comprimido.
          </p>
        </div>

        <button className="btn-red" onClick={() => setShowModalOrdem(true)}>
          <Plus size={18} />
          <span>Dar Entrada em Equipamento</span>
        </button>
      </div>

      {/* Visão Kanban dos 7 Status Operacionais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {STATUS_COLUNAS.map(st => {
          const ordensNoStatus = ordens.filter(o => o.status === st.id)

          return (
            <div key={st.id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', minHeight: '450px', display: 'flex', flexDirection: 'column' }}>
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

                    {/* Problema Relatado */}
                    {ordem.problema_relatado && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.5rem', borderRadius: '4px' }}>
                        "{ordem.problema_relatado}"
                      </div>
                    )}

                    {/* Guia de Tráfego (se houver) */}
                    {ordem.gt_protocolo && ordem.gt_protocolo !== 'N/A (Ar Comprimido)' && (
                      <div style={{ fontSize: '0.7rem', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <FileText size={12} />
                        <span>GT: {ordem.gt_protocolo}</span>
                      </div>
                    )}

                    {/* Mudar Status Operacional */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <button
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        onClick={() => setDocModalOrdem(ordem)}
                      >
                        <Printer size={12} />
                        <span>Comprovante</span>
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

      {/* Modal Entrada de Equipamento (Design de Recepção de Armeria) */}
      {showModalOrdem && (
        <ModalNovaOSArmeria
          clientes={clientes}
          ordens={ordens}
          setOrdens={setOrdens}
          onClose={() => setShowModalOrdem(false)}
        />
      )}

      {/* Comprovante de Entrada do Equipamento para Impressão */}
      {docModalOrdem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#fff', color: '#000', padding: '1.5rem', borderRadius: '10px' }}>
            <div className="print-area">
              <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '800', fontFamily: 'Cinzel, serif', color: '#000' }}>PRÓ GUNS ARMERIA & DESPACHANTARIA</h2>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#333' }}>COMPROVANTE DE ENTRADA DE EQUIPAMENTO — OS #{docModalOrdem.numero_os}</div>
                <div style={{ fontSize: '0.75rem', color: '#555' }}>CR Armeria N° 998877/2ª RM — São Paulo/SP</div>
              </div>

              <div style={{ fontSize: '0.88rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div><strong>Cliente:</strong> {docModalOrdem.cliente_nome?.toUpperCase()}</div>
                <div><strong>Categoria:</strong> {docModalOrdem.categoria_arma || 'Arma de Fogo'}</div>
                <div><strong>Equipamento:</strong> {docModalOrdem.tipo_arma} — {docModalOrdem.marca_arma} {docModalOrdem.modelo_arma} ({docModalOrdem.calibre_arma})</div>
                <div><strong>N° de Série:</strong> {docModalOrdem.numero_serie_arma || docModalOrdem.numero_serie}</div>
                <div><strong>Problema Relatado:</strong> "{docModalOrdem.problema_relatado}"</div>
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
                    <br /> Recebedor / Responsável
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
