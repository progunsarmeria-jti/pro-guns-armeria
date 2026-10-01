import React, { useState } from 'react'
import {
  FileText,
  X,
  ExternalLink,
  Copy,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  Calendar,
  Building
} from 'lucide-react'

export default function ModalHistoricoNFe({
  isOpen,
  onClose,
  notasFiscais = []
}) {
  const [busca, setBusca] = useState('')
  const [chaveCopiadaId, setChaveCopiadaId] = useState(null)
  const [notaExpandidaId, setNotaExpandidaId] = useState(null)

  if (!isOpen) return null

  const copiarChave = (id, chave) => {
    if (!chave) return
    navigator.clipboard.writeText(chave)
    setChaveCopiadaId(id)
    setTimeout(() => setChaveCopiadaId(null), 2000)
  }

  const notasFiltradas = (notasFiscais || []).filter(nf => {
    const termo = busca.toLowerCase()
    return (
      (nf.numero_nf || '').toLowerCase().includes(termo) ||
      (nf.fornecedor_nome || '').toLowerCase().includes(termo) ||
      (nf.fornecedor_cnpj || '').toLowerCase().includes(termo) ||
      (nf.chave_acesso || '').toLowerCase().includes(termo)
    )
  })

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.88)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '1rem'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '920px',
        maxHeight: '90vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1.5rem'
      }}>
        {/* Header do Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(217, 119, 6, 0.15)', borderRadius: '8px', border: '1px solid rgba(217, 119, 6, 0.3)' }}>
              <FileText size={22} color="var(--gold-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--gold-primary)', margin: 0 }}>
                Histórico de Notas Fiscais de Entrada
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Registro de comprovação de origem fiscal para a SEFAZ-GO e o Exército Brasileiro (DFPC)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '0.35rem', borderRadius: '50%', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Campo de Busca */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
            placeholder="Buscar por número da NF, fornecedor, CNPJ ou chave de acesso..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {/* Lista de Notas Fiscais */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <FileText size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.3 }} />
              <div>Nenhuma nota fiscal encontrada no histórico.</div>
              <span style={{ fontSize: '0.75rem' }}>
                Utilize o botão "Importar NF-e (XML)" no estoque para dar entrada nas notas de fornecedores.
              </span>
            </div>
          ) : (
            notasFiltradas.map((nf) => {
              const expandida = notaExpandidaId === nf.id
              const itens = Array.isArray(nf.itens_json) ? nf.itens_json : []

              return (
                <div
                  key={nf.id}
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.55rem',
                        backgroundColor: 'rgba(217, 119, 6, 0.15)',
                        border: '1px solid rgba(217, 119, 6, 0.3)',
                        borderRadius: '6px',
                        fontWeight: '700',
                        color: 'var(--gold-primary)',
                        fontSize: '0.85rem'
                      }}>
                        NF #{nf.numero_nf}
                      </span>

                      <div>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'block' }}>
                          {nf.fornecedor_nome}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          CNPJ: {nf.fornecedor_cnpj} {nf.fornecedor_uf ? `(${nf.fornecedor_uf})` : ''}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1rem', fontWeight: '700', color: '#34D399' }}>
                        R$ {(Number(nf.valor_total) || 0).toFixed(2)}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Entrada: {nf.data_entrada ? new Date(nf.data_entrada).toLocaleDateString('pt-BR') : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Chave de Acesso */}
                  {nf.chave_acesso && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      padding: '0.4rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.73rem',
                      color: 'var(--text-muted)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                        <span>Chave SEFAZ:</span>
                        <code style={{ color: 'var(--gold-primary)', fontFamily: 'monospace' }}>
                          {nf.chave_acesso}
                        </code>
                      </div>

                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.68rem' }}
                          onClick={() => copiarChave(nf.id, nf.chave_acesso)}
                          title="Copiar Chave"
                        >
                          {chaveCopiadaId === nf.id ? <Check size={11} color="#34D399" /> : <Copy size={11} />}
                        </button>
                        <a
                          href={`https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=resumo&tipoConteudo=7PhJ+gAVw2g=`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                          title="Consultar no Portal Nacional da SEFAZ"
                        >
                          <ExternalLink size={11} /> SEFAZ
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Botão de Ver Itens */}
                  {itens.length > 0 && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setNotaExpandidaId(expandida ? null : nf.id)}
                        className="btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Package size={13} />
                        <span>{expandida ? 'Ocultar Itens' : `Ver ${itens.length} Produto(s) Desta Nota`}</span>
                        {expandida ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>

                      {expandida && (
                        <div style={{
                          marginTop: '0.5rem',
                          backgroundColor: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '6px',
                          overflowX: 'auto'
                        }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '0.5rem' }}>PRODUTO</th>
                                <th style={{ padding: '0.5rem' }}>NCM</th>
                                <th style={{ padding: '0.5rem' }}>EAN / BARRAS</th>
                                <th style={{ padding: '0.5rem' }}>QTD</th>
                                <th style={{ padding: '0.5rem' }}>CUSTO UNIT.</th>
                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>TOTAL</th>
                              </tr>
                            </thead>
                            <tbody>
                              {itens.map((it, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                  <td style={{ padding: '0.5rem', color: 'var(--text-main)', fontWeight: '600' }}>
                                    {it.descricao || it.nome}
                                  </td>
                                  <td style={{ padding: '0.5rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                    {it.ncm || '-'}
                                  </td>
                                  <td style={{ padding: '0.5rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                    {it.codigo_barras || '-'}
                                  </td>
                                  <td style={{ padding: '0.5rem', color: 'var(--gold-primary)', fontWeight: '700' }}>
                                    {it.quantidade} {it.unidade || 'UN'}
                                  </td>
                                  <td style={{ padding: '0.5rem' }}>
                                    R$ {(Number(it.preco_custo_real || it.preco_unitario) || 0).toFixed(2)}
                                  </td>
                                  <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '700', color: '#34D399' }}>
                                    R$ {((Number(it.preco_custo_real || it.preco_unitario) || 0) * (Number(it.quantidade) || 1)).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Rodapé */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
