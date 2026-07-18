import React, { useState } from 'react'
import { X, Shield, Crosshair, AlertCircle, Calendar, FileText, CheckCircle2, Info } from 'lucide-react'

export default function ModalNovaOSArmeria({
  clienteInicial,
  clientes,
  ordens,
  setOrdens,
  onClose
}) {
  const [clienteId, setClienteId] = useState(clienteInicial?.id || clientes[0]?.id || '')

  const clienteAtual = clientes.find(c => c.id === clienteId) || clienteInicial || {
    nome_completo: 'CARLOS EDUARDO SILVEIRA',
    cpf: '123.456.789-00',
    telefone: '(11) 98765-4321',
    numero_cr: '123456/2ª RM'
  }

  // Categoria da Arma
  const [categoriaArma, setCategoriaArma] = useState('Arma de Fogo') // 'Arma de Fogo' ou 'Arma de Ar Comprimido'

  // Dados da Arma
  const [tipoArma, setTipoArma] = useState('Pistola')
  const [marcaArma, setMarcaArma] = useState('Glock')
  const [modeloArma, setModeloArma] = useState('G17 Gen5')
  const [calibreArma, setCalibreArma] = useState('9mm')
  const [numeroSerieArma, setNumeroSerieArma] = useState('')

  // Problema Relatado
  const [problemaRelatado, setProblemaRelatado] = useState('')

  // Guia de Tráfego de Manutenção (GT)
  const [gtProtocolo, setGtProtocolo] = useState('')
  const [gtDataEmissao, setGtDataEmissao] = useState(new Date().toISOString().split('T')[0])
  const [gtDataVencimento, setGtDataVencimento] = useState('')

  // Ajusta tipo padrão quando troca categoria
  const handleTrocarCategoria = (novaCat) => {
    setCategoriaArma(novaCat)
    if (novaCat === 'Arma de Fogo') {
      setTipoArma('Pistola')
      setCalibreArma('9mm')
    } else {
      setTipoArma('Carabina de Ar Comprimido')
      setCalibreArma('5.5mm (.22)')
    }
  }

  const handleSalvarEntradaOS = (e) => {
    e.preventDefault()

    if (!numeroSerieArma) {
      alert('Por favor, preencha o número de série da arma!')
      return
    }

    if (categoriaArma === 'Arma de Fogo' && !gtProtocolo) {
      alert('Para Armas de Fogo, é obrigatório registrar o Número da Guia de Tráfego de Manutenção!')
      return
    }

    const novaOSObj = {
      id: `o_${Date.now()}`,
      numero_os: 1000 + ordens.length + 1,
      cliente_id: clienteAtual.id,
      cliente_nome: clienteAtual.nome_completo,
      categoria_arma: categoriaArma,
      tipo_arma: tipoArma,
      marca_arma: marcaArma,
      modelo_arma: modeloArma,
      calibre_arma: calibreArma,
      numero_serie_arma: numeroSerieArma,
      problema_relatado: problemaRelatado || 'Manutenção geral solicitada.',
      gt_protocolo: categoriaArma === 'Arma de Fogo' ? gtProtocolo : 'N/A (Ar Comprimido)',
      gt_data_emissao: categoriaArma === 'Arma de Fogo' ? gtDataEmissao : null,
      gt_data_vencimento: categoriaArma === 'Arma de Fogo' ? gtDataVencimento : null,
      tipo_servico: `Manutenção ${tipoArma} ${marcaArma}`,
      valor_servico: 0,
      valor_taxamento: 0,
      status: 'AGUARDANDO ANÁLISE', // Entrada na Recepção (Armeiro ainda não olhou)
      created_at: new Date().toISOString().split('T')[0]
    }

    setOrdens([novaOSObj, ...ordens])
    alert(`Entrada registrada com sucesso! Ordem de Serviço #${novaOSObj.numero_os} em 'AGUARDANDO ANÁLISE'.`)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
        {/* Top Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Crosshair size={22} color="var(--red-light)" />
              <span>Entrada de Equipamento - Nova O.S. de Armeria</span>
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Recepção & Armaria da Pró Guns Armeria</div>
          </div>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSalvarEntradaOS} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* DADOS DO CLIENTE */}
          <div style={{ backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.4rem' }}>
              CLIENTE REQUERENTE
            </label>
            {!clienteInicial && clientes && clientes.length > 0 ? (
              <select
                className="input-field"
                value={clienteId}
                onChange={e => setClienteId(e.target.value)}
                style={{ fontWeight: '700' }}
              >
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_completo.toUpperCase()} ({c.cpf}) - CR: {c.numero_cr || 'Sem CR'}</option>)}
              </select>
            ) : (
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
                {clienteAtual.nome_completo.toUpperCase()} — CPF: {clienteAtual.cpf} — CR: {clienteAtual.numero_cr || 'N/A'}
              </div>
            )}
          </div>

          {/* 1. SELEÇÃO DA CATEGORIA DA ARMA */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.5rem' }}>
              CATEGORIA DO EQUIPAMENTO *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => handleTrocarCategoria('Arma de Fogo')}
                style={{
                  padding: '0.85rem',
                  borderRadius: '8px',
                  border: categoriaArma === 'Arma de Fogo' ? '2px solid var(--red-light)' : '1px solid var(--border-color)',
                  backgroundColor: categoriaArma === 'Arma de Fogo' ? 'rgba(139, 38, 42, 0.25)' : 'var(--bg-input)',
                  color: categoriaArma === 'Arma de Fogo' ? '#FFFFFF' : 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '0.5rem'
                }}
              >
                <Shield size={18} color={categoriaArma === 'Arma de Fogo' ? '#F87171' : '#8E96A0'} />
                <span>Arma de Fogo</span>
              </button>

              <button
                type="button"
                onClick={() => handleTrocarCategoria('Arma de Ar Comprimido')}
                style={{
                  padding: '0.85rem',
                  borderRadius: '8px',
                  border: categoriaArma === 'Arma de Ar Comprimido' ? '2px solid #34D399' : '1px solid var(--border-color)',
                  backgroundColor: categoriaArma === 'Arma de Ar Comprimido' ? 'rgba(19, 70, 51, 0.3)' : 'var(--bg-input)',
                  color: categoriaArma === 'Arma de Ar Comprimido' ? '#FFFFFF' : 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '0.5rem'
                }}
              >
                <Crosshair size={18} color={categoriaArma === 'Arma de Ar Comprimido' ? '#34D399' : '#8E96A0'} />
                <span>Arma de Ar Comprimido (Airgun)</span>
              </button>
            </div>
          </div>

          {/* 2. DADOS DA ARMA */}
          <div style={{ backgroundColor: 'var(--bg-input)', padding: '1.1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--gold-accent)', letterSpacing: '0.5px' }}>
              DADOS DO EQUIPAMENTO
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tipo de Arma *</label>
                <select className="input-field" value={tipoArma} onChange={e => setTipoArma(e.target.value)}>
                  {categoriaArma === 'Arma de Fogo' ? (
                    <>
                      <option value="Pistola">Pistola</option>
                      <option value="Carabina/Fuzil">Carabina / Fuzil</option>
                      <option value="Espingarda">Espingarda</option>
                      <option value="Revólver">Revólver</option>
                    </>
                  ) : (
                    <>
                      <option value="Pistola de Ar Comprimido">Pistola de Ar Comprimido</option>
                      <option value="Carabina de Ar Comprimido">Carabina de Ar Comprimido</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Número de Série *</label>
                <input required className="input-field" value={numeroSerieArma} onChange={e => setNumeroSerieArma(e.target.value)} placeholder="Ex: AB123456 ou AIR-9988" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Marca *</label>
                <input required className="input-field" value={marcaArma} onChange={e => setMarcaArma(e.target.value)} placeholder="Glock, Taurus, CBC, Rossi" />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Modelo *</label>
                <input required className="input-field" value={modeloArma} onChange={e => setModeloArma(e.target.value)} placeholder="G17, T4, Dione 5.5" />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Calibre *</label>
                <input required className="input-field" value={calibreArma} onChange={e => setCalibreArma(e.target.value)} placeholder="9mm, 5.56, 12 GA, 5.5mm" />
              </div>
            </div>
          </div>

          {/* 3. PROBLEMA RELATADO */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.4rem' }}>
              PROBLEMA RELATADO PELO CLIENTE *
            </label>
            <textarea
              required
              className="input-field"
              rows="3"
              value={problemaRelatado}
              onChange={e => setProblemaRelatado(e.target.value)}
              placeholder="Descreva detalhadamente o defeito relatado, falha de disparo ou serviço solicitado..."
            />
          </div>

          {/* 4. GUIA DE TRÁFEGO DE MANUTENÇÃO (GT) */}
          {categoriaArma === 'Arma de Fogo' ? (
            <div style={{ backgroundColor: 'rgba(139, 38, 42, 0.12)', padding: '1.1rem', borderRadius: '8px', border: '1px solid rgba(139, 38, 42, 0.3)', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#F87171', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={16} />
                <span>REGISTRO DA GUIA DE TRÁFEGO DE MANUTENÇÃO (OBRIGATÓRIO PARA ARMA DE FOGO)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>N° Protocolo da Guia *</label>
                  <input required className="input-field" value={gtProtocolo} onChange={e => setGtProtocolo(e.target.value)} placeholder="GT-2026.07.12.9982" />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Data de Emissão *</label>
                  <input required type="date" className="input-field" value={gtDataEmissao} onChange={e => setGtDataEmissao(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Data de Vencimento *</label>
                  <input required type="date" className="input-field" value={gtDataVencimento} onChange={e => setGtDataVencimento(e.target.value)} />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: 'rgba(19, 70, 51, 0.15)', padding: '0.85rem 1rem', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '0.82rem', color: '#34D399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={16} />
              <span>Armas de ar comprimido (Airguns) dispensam Guia de Tráfego conforme a legislação vigente.</span>
            </div>
          )}

          {/* BOTÕES DO RODAPÉ */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-red">Dar Entrada na O.S. (Aguardando Análise)</button>
          </div>
        </form>
      </div>
    </div>
  )
}
