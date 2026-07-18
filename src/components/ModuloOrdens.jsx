import React, { useState } from 'react'
import { Plus, Printer } from 'lucide-react'
import ModalNovaOS from './ModalNovaOS'

export default function ModuloOrdens({ ordens, setOrdens, clientes, financeiro, setFinanceiro }) {
  const [showModalOrdem, setShowModalOrdem] = useState(false)
  const [docModalOrdem, setDocModalOrdem] = useState(null)

  const STATUS_COLUNAS = [
    'Aguardando Doc',
    'Protocolado',
    'Em Análise',
    'Exigência',
    'Deferido'
  ]

  const handleMudarStatus = (ordemId, novoStatus) => {
    setOrdens(ordens.map(o => o.id === ordemId ? { ...o, status: novoStatus } : o))
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gold-primary)' }}>
            Ordens de Serviço (Despachantaria)
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Pipeline de acompanhamento de processos no Exército Brasileiro (SIGMA) e Polícia Federal (SINARM).
          </p>
        </div>

        <button className="btn-gold" onClick={() => setShowModalOrdem(true)}>
          <Plus size={18} />
          <span>Nova Ordem de Serviço</span>
        </button>
      </div>

      {/* Visão Kanban de Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {STATUS_COLUNAS.map(status => {
          const ordensNoStatus = ordens.filter(o => o.status === status)

          const statusColors = {
            'Aguardando Doc': '#FBBF24',
            'Protocolado': '#60A5FA',
            'Em Análise': '#A78BFA',
            'Exigência': '#F87171',
            'Deferido': '#34D399'
          }

          return (
            <div key={status} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: `2px solid ${statusColors[status]}` }}>
                <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-main)' }}>{status}</span>
                <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '10px', backgroundColor: 'var(--bg-input)', fontWeight: '700', color: statusColors[status] }}>
                  {ordensNoStatus.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
                {ordensNoStatus.map(ordem => (
                  <div key={ordem.id} style={{
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    transition: 'border-color 0.2s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span style={{ fontWeight: '700', color: 'var(--gold-primary)' }}>OS #{ordem.numero_os}</span>
                      <span>{ordem.orgao_destino}</span>
                    </div>

                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)' }}>
                      {ordem.cliente_nome}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-gold)', fontWeight: '500' }}>
                      {ordem.tipo_servico}
                    </div>

                    {ordem.numero_protocolo && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Prot: {ordem.numero_protocolo}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <button
                        style={{ background: 'none', border: 'none', color: 'var(--gold-primary)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        onClick={() => setDocModalOrdem(ordem)}
                      >
                        <Printer size={12} />
                        <span>Declaração</span>
                      </button>

                      <select
                        value={ordem.status}
                        onChange={e => handleMudarStatus(ordem.id, e.target.value)}
                        style={{ background: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.7rem', padding: '0.15rem 0.3rem' }}
                      >
                        {STATUS_COLUNAS.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Criar OS (Design Exato Portal GCAC) */}
      {showModalOrdem && (
        <ModalNovaOS
          clientes={clientes}
          ordens={ordens}
          setOrdens={setOrdens}
          financeiro={financeiro}
          setFinanceiro={setFinanceiro}
          onClose={() => setShowModalOrdem(false)}
        />
      )}

      {/* Modal Impressão de Declaração / Requerimento */}
      {docModalOrdem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '650px', backgroundColor: '#fff', color: '#000' }}>
            <div className="print-area">
              <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '800', fontFamily: 'Cinzel, serif' }}>PRÓ GUNS ARMERIA & DESPACHANTARIA</h2>
                <div style={{ fontSize: '0.8rem' }}>DECLARAÇÃO OFICIAL DE HABITABILIDADE E REQUERIMENTO</div>
                <div style={{ fontSize: '0.75rem', color: '#555' }}>CR Armeria N° 998877/2ª RM - São Paulo/SP</div>
              </div>

              <div style={{ fontSize: '0.9rem', lineHeight: '1.6', textAlign: 'justify' }}>
                <p>Declaro para os devidos fins junto ao <strong>Exército Brasileiro (SIGMA)</strong> que o atirador desportivo <strong>{docModalOrdem.cliente_nome}</strong> está devidamente cadastrado sob o processo de OS N° <strong>#{docModalOrdem.numero_os}</strong> referente ao serviço de <strong>{docModalOrdem.tipo_servico}</strong>.</p>
                <br />
                <p>Atestamos o cumprimento integral dos requisitos legais previstos nas portarias vigentes da Diretoria de Fiscalização de Produtos Controlados (DFPC).</p>
              </div>

              <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '0.8rem' }}>
                <div>
                  <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '0.3rem' }}>
                    {docModalOrdem.cliente_nome}
                    <br /> Requerente / CAC
                  </div>
                </div>
                <div>
                  <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '0.3rem' }}>
                    Pró Guns Armeria
                    <br /> Responsável Técnico
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              <button className="btn-secondary" onClick={() => setDocModalOrdem(null)}>Fechar</button>
              <button className="btn-gold" onClick={() => window.print()}>Imprimir / Salvar PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
