import React, { useState, useEffect } from 'react'
import {
  Shield,
  X,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  FileText,
  User,
  Hash,
  Layers,
  Sparkles
} from 'lucide-react'

// Calibres mais comuns no Brasil
const CALIBRES_COMUNS = [
  { cal: '9x19mm Luger', cat: 'PERMITIDO' },
  { cal: '.380 ACP', cat: 'PERMITIDO' },
  { cal: '.38 SPL', cat: 'PERMITIDO' },
  { cal: '12 GA', cat: 'PERMITIDO' },
  { cal: '20 GA', cat: 'PERMITIDO' },
  { cal: '.22 LR', cat: 'PERMITIDO' },
  { cal: '.40 S&W', cat: 'RESTRITO' },
  { cal: '.45 ACP', cat: 'RESTRITO' },
  { cal: '5.56x45mm (.223)', cat: 'RESTRITO' },
  { cal: '7.62x51mm (.308)', cat: 'RESTRITO' },
  { cal: '.357 Magnum', cat: 'RESTRITO' },
  { cal: '.44 Magnum', cat: 'RESTRITO' }
]

const FABRICANTES_COMUNS = [
  'Taurus',
  'Glock',
  'CBC',
  'Imbel',
  'Rossi',
  'Beretta',
  'Sig Sauer',
  'CZ (Česká Zbrojovka)',
  'Smith & Wesson',
  'Walther',
  'Canik',
  'Outro Fabricante'
]

export default function ModalCadastrarArma({
  isOpen,
  onClose,
  onSalvarArma,
  armaEdicao = null,
  clientes = []
}) {
  const [formData, setFormData] = useState({
    numero_serie: '',
    tipo_arma: 'Pistola',
    fabricante: 'Taurus',
    modelo: '',
    calibre: '9x19mm Luger',
    classificacao_calibre: 'PERMITIDO',
    sistema_registro: 'SIGMA',
    numero_sigma_sinarm: '',
    status_arma: 'DISPONIVEL',
    cliente_reserva_id: '',
    cliente_reserva_nome: '',
    preco_custo: '',
    preco_venda: '',
    acabamento: 'Oxidado / Carbono Fosco',
    comprimento_cano: '',
    capacidade_tiros: '12+1',
    localizacao: 'Cofre Forte - Gaveta 1',
    codigo_barras: '',
    ncm: '9302.00.00',
    fornecedor_nome: '',
    observacoes: ''
  })

  useEffect(() => {
    if (armaEdicao) {
      setFormData({
        numero_serie: armaEdicao.numero_serie || '',
        tipo_arma: armaEdicao.tipo_arma || 'Pistola',
        fabricante: armaEdicao.fabricante || 'Taurus',
        modelo: armaEdicao.modelo || '',
        calibre: armaEdicao.calibre || '9x19mm Luger',
        classificacao_calibre: armaEdicao.classificacao_calibre || 'PERMITIDO',
        sistema_registro: armaEdicao.sistema_registro || 'SIGMA',
        numero_sigma_sinarm: armaEdicao.numero_sigma_sinarm || '',
        status_arma: armaEdicao.status_arma || 'DISPONIVEL',
        cliente_reserva_id: armaEdicao.cliente_reserva_id || '',
        cliente_reserva_nome: armaEdicao.cliente_reserva_nome || '',
        preco_custo: armaEdicao.preco_custo ? armaEdicao.preco_custo.toString() : '',
        preco_venda: armaEdicao.preco_venda ? armaEdicao.preco_venda.toString() : '',
        acabamento: armaEdicao.acabamento || 'Oxidado / Carbono Fosco',
        comprimento_cano: armaEdicao.comprimento_cano || '',
        capacidade_tiros: armaEdicao.capacidade_tiros || '12+1',
        localizacao: armaEdicao.localizacao || 'Cofre Forte - Gaveta 1',
        codigo_barras: armaEdicao.codigo_barras || '',
        ncm: armaEdicao.ncm || '9302.00.00',
        fornecedor_nome: armaEdicao.fornecedor_nome || '',
        observacoes: armaEdicao.observacoes || ''
      })
    } else {
      setFormData({
        numero_serie: '',
        tipo_arma: 'Pistola',
        fabricante: 'Taurus',
        modelo: '',
        calibre: '9x19mm Luger',
        classificacao_calibre: 'PERMITIDO',
        sistema_registro: 'SIGMA',
        numero_sigma_sinarm: '',
        status_arma: 'DISPONIVEL',
        cliente_reserva_id: '',
        cliente_reserva_nome: '',
        preco_custo: '',
        preco_venda: '',
        acabamento: 'Oxidado / Carbono Fosco',
        comprimento_cano: '',
        capacidade_tiros: '12+1',
        localizacao: 'Cofre Forte - Gaveta 1',
        codigo_barras: '',
        ncm: '9302.00.00',
        fornecedor_nome: '',
        observacoes: ''
      })
    }
  }, [armaEdicao, isOpen])

  if (!isOpen) return null

  // Auto-ajuste de classificação com base no calibre selecionado
  const handleCalibreChange = (novoCalibre) => {
    const match = CALIBRES_COMUNS.find(c => c.cal === novoCalibre)
    setFormData(prev => ({
      ...prev,
      calibre: novoCalibre,
      classificacao_calibre: match ? match.cat : prev.classificacao_calibre
    }))
  }

  const handleTipoArmaChange = (novoTipo) => {
    // NCM de armas curtas vs armas longas
    const ncmSugerido = (novoTipo === 'Pistola' || novoTipo === 'Revólver') ? '9302.00.00' : '9303.30.00'
    setFormData(prev => ({
      ...prev,
      tipo_arma: novoTipo,
      ncm: ncmSugerido
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.numero_serie.trim()) {
      alert('O Número de Série da arma é obrigatório para controle do Exército Brasileiro (DFPC).')
      return
    }

    const nomeCompleto = `${formData.tipo_arma} ${formData.fabricante} ${formData.modelo} ${formData.calibre}`.trim()

    const armaObj = {
      id: armaEdicao ? armaEdicao.id : `arma_${Date.now()}`,
      tipo_estoque: 'ARMA',
      codigo_sku: formData.numero_serie.trim().toUpperCase(),
      nome: nomeCompleto,
      categoria: 'Armas de Fogo',
      numero_serie: formData.numero_serie.trim().toUpperCase(),
      tipo_arma: formData.tipo_arma,
      fabricante: formData.fabricante,
      modelo: formData.modelo,
      calibre: formData.calibre,
      classificacao_calibre: formData.classificacao_calibre,
      sistema_registro: formData.sistema_registro,
      numero_sigma_sinarm: formData.numero_sigma_sinarm,
      status_arma: formData.status_arma,
      cliente_reserva_id: formData.cliente_reserva_id || null,
      cliente_reserva_nome: formData.cliente_reserva_nome || null,
      preco_custo: parseFloat(formData.preco_custo) || 0,
      preco_venda: parseFloat(formData.preco_venda) || 0,
      acabamento: formData.acabamento,
      comprimento_cano: formData.comprimento_cano,
      capacidade_tiros: formData.capacidade_tiros,
      localizacao: formData.localizacao,
      codigo_barras: formData.codigo_barras || null,
      ncm: formData.ncm || '9302.00.00',
      unidade: 'UN',
      origem: '0',
      // Armas são unidades individuais: se está disponível ou reservada, quantidade é 1; se entregue, quantidade é 0
      quantidade: formData.status_arma === 'ENTREGUE' ? 0 : 1,
      estoque_minimo: 1,
      observacoes: formData.observacoes,
      updated_at: new Date().toISOString()
    }

    onSalvarArma(armaObj)
    onClose()
  }

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
        maxWidth: '720px',
        maxHeight: '92vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1.5rem'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(217, 119, 6, 0.15)', borderRadius: '8px', border: '1px solid rgba(217, 119, 6, 0.3)' }}>
              <Shield size={22} color="var(--gold-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--gold-primary)', margin: 0 }}>
                {armaEdicao ? 'Editar Arma no Estoque' : 'Cadastrar Arma de Fogo no Estoque (Cofre)'}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Rastreabilidade individual de PCE serializado conforme Decreto 11.615 e Exército Brasileiro (DFPC)
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.35rem', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* BLOCO 1: NÚMERO DE SÉRIE & STATUS NO COFRE */}
          <div style={{
            backgroundColor: 'rgba(217, 119, 6, 0.06)',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.85rem',
            alignItems: 'center'
          }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
                NÚMERO DE SÉRIE DA ARMA *
              </label>
              <input
                required
                className="input-field"
                style={{
                  fontFamily: 'monospace',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  letterSpacing: '1px',
                  borderColor: 'var(--border-gold)',
                  backgroundColor: 'rgba(0,0,0,0.5)'
                }}
                value={formData.numero_serie}
                onChange={e => setFormData({ ...formData, numero_serie: e.target.value })}
                placeholder="Ex: AFG12345"
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Identificador único de fábrica (DFPC)</span>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Status no Estoque / Cofre *
              </label>
              <select
                className="input-field"
                style={{ fontSize: '0.88rem', fontWeight: '600' }}
                value={formData.status_arma}
                onChange={e => setFormData({ ...formData, status_arma: e.target.value })}
              >
                <option value="DISPONIVEL">🟢 Disponível no Cofre (Venda Livre)</option>
                <option value="RESERVADA">🟡 Reservada (Em Aquisição pelo Cliente)</option>
                <option value="AGUARDANDO_CRAF">🔵 Aguardando CRAF / Guia de Trânsito</option>
                <option value="ENTREGUE">⚪ Entregue ao Comprador (Venda Concluída)</option>
                <option value="CONSIGNADA">🟣 Arma Usada / Consignada de Terceiro</option>
              </select>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Controle de guarda física</span>
            </div>
          </div>

          {/* Se estiver reservada, exibe campo para vincular ao cliente */}
          {(formData.status_arma === 'RESERVADA' || formData.status_arma === 'AGUARDANDO_CRAF') && (
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '8px',
              padding: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              flexWrap: 'wrap'
            }}>
              <User size={18} color="#60A5FA" />
              <div style={{ flex: 1, minWidth: '220px' }}>
                <label style={{ fontSize: '0.75rem', color: '#93C5FD', fontWeight: '600', display: 'block', marginBottom: '0.2rem' }}>
                  Cliente Comprador / Titular da Reserva:
                </label>
                <select
                  className="input-field"
                  style={{ fontSize: '0.82rem' }}
                  value={formData.cliente_reserva_id}
                  onChange={(e) => {
                    const selId = e.target.value
                    const cli = clientes.find(c => String(c.id) === String(selId))
                    setFormData({
                      ...formData,
                      cliente_reserva_id: selId,
                      cliente_reserva_nome: cli ? cli.nome_completo : ''
                    })
                  }}
                >
                  <option value="">-- Selecione o cliente cadastrado --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome_completo} (CPF: {c.cpf || 'N/A'}) {c.cr_numero ? `[CR: ${c.cr_numero}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* BLOCO 2: DADOS TÉCNICOS DA ARMA */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tipo de Arma *</label>
              <select
                className="input-field"
                value={formData.tipo_arma}
                onChange={e => handleTipoArmaChange(e.target.value)}
              >
                <option value="Pistola">Pistola</option>
                <option value="Revólver">Revólver</option>
                <option value="Espingarda">Espingarda</option>
                <option value="Carabina">Carabina</option>
                <option value="Fuzil">Fuzil</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fabricante *</label>
              <select
                className="input-field"
                value={formData.fabricante}
                onChange={e => setFormData({ ...formData, fabricante: e.target.value })}
              >
                {FABRICANTES_COMUNS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Modelo Comercial *</label>
              <input
                required
                className="input-field"
                value={formData.modelo}
                onChange={e => setFormData({ ...formData, modelo: e.target.value })}
                placeholder="Ex: G3c T.O.R.O. / G19 Gen5"
              />
            </div>
          </div>

          {/* BLOCO 3: CALIBRE & CLASSIFICAÇÃO LEGAL (DECRETO 11.615) */}
          <div style={{
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '0.85rem',
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gap: '0.75rem',
            alignItems: 'center'
          }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Calibre *
              </label>
              <select
                className="input-field"
                value={formData.calibre}
                onChange={e => handleCalibreChange(e.target.value)}
              >
                {CALIBRES_COMUNS.map(c => (
                  <option key={c.cal} value={c.cal}>
                    {c.cal} ({c.cat === 'PERMITIDO' ? 'Permitido' : 'Restrito'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Classificação Legal *
              </label>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  className={`btn-secondary ${formData.classificacao_calibre === 'PERMITIDO' ? 'active-gold' : ''}`}
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.35rem 0.5rem',
                    backgroundColor: formData.classificacao_calibre === 'PERMITIDO' ? 'rgba(52, 211, 153, 0.2)' : undefined,
                    borderColor: formData.classificacao_calibre === 'PERMITIDO' ? '#34D399' : undefined,
                    color: formData.classificacao_calibre === 'PERMITIDO' ? '#34D399' : undefined,
                    fontWeight: '700',
                    flex: 1
                  }}
                  onClick={() => setFormData({ ...formData, classificacao_calibre: 'PERMITIDO' })}
                >
                  Permitido
                </button>
                <button
                  type="button"
                  className={`btn-secondary ${formData.classificacao_calibre === 'RESTRITO' ? 'active-gold' : ''}`}
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.35rem 0.5rem',
                    backgroundColor: formData.classificacao_calibre === 'RESTRITO' ? 'rgba(239, 68, 68, 0.2)' : undefined,
                    borderColor: formData.classificacao_calibre === 'RESTRITO' ? '#F87171' : undefined,
                    color: formData.classificacao_calibre === 'RESTRITO' ? '#F87171' : undefined,
                    fontWeight: '700',
                    flex: 1
                  }}
                  onClick={() => setFormData({ ...formData, classificacao_calibre: 'RESTRITO' })}
                >
                  Restrito
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Sistema / Origem *
              </label>
              <select
                className="input-field"
                value={formData.sistema_registro}
                onChange={e => setFormData({ ...formData, sistema_registro: e.target.value })}
              >
                <option value="SIGMA">SIGMA (Exército)</option>
                <option value="SINARM">SINARM (Polícia Fed.)</option>
              </select>
            </div>
          </div>

          {/* BLOCO 4: VALORES E ESPECIFICAÇÕES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preço Custo (R$)</label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                value={formData.preco_custo}
                onChange={e => setFormData({ ...formData, preco_custo: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: '700' }}>Preço Venda (R$) *</label>
              <input
                required
                type="number"
                step="0.01"
                className="input-field"
                style={{ borderColor: 'var(--border-gold)' }}
                value={formData.preco_venda}
                onChange={e => setFormData({ ...formData, preco_venda: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Capacidade Tiros</label>
              <input
                className="input-field"
                value={formData.capacidade_tiros}
                onChange={e => setFormData({ ...formData, capacidade_tiros: e.target.value })}
                placeholder="Ex: 12+1 / 17+1"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Localização no Cofre</label>
              <input
                className="input-field"
                value={formData.localizacao}
                onChange={e => setFormData({ ...formData, localizacao: e.target.value })}
                placeholder="Cofre 1 - Prateleira A"
              />
            </div>
          </div>

          {/* BLOCO 5: DADOS FISCAIS & ACABAMENTO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Acabamento da Arma</label>
              <input
                className="input-field"
                value={formData.acabamento}
                onChange={e => setFormData({ ...formData, acabamento: e.target.value })}
                placeholder="Oxidado, Inox, Cerakote..."
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NCM Fiscal</label>
              <input
                className="input-field"
                value={formData.ncm}
                onChange={e => setFormData({ ...formData, ncm: e.target.value })}
                placeholder="9302.00.00"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cód. Barras (EAN)</label>
              <input
                className="input-field"
                value={formData.codigo_barras}
                onChange={e => setFormData({ ...formData, codigo_barras: e.target.value })}
                placeholder="EAN-13 da caixa"
              />
            </div>
          </div>

          {/* Botões de Rodapé */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-gold" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={16} />
              <span>Salvar Arma no Estoque</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
