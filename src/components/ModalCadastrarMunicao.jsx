import React, { useState, useEffect } from 'react'
import {
  Target,
  X,
  Package,
  AlertTriangle,
  DollarSign,
  ShieldCheck,
  Layers,
  Sparkles
} from 'lucide-react'

const CALIBRES_MUNICAO = [
  { cal: '9x19mm Luger', cat: 'PERMITIDO', embalagem: 50 },
  { cal: '.380 ACP', cat: 'PERMITIDO', embalagem: 50 },
  { cal: '.38 SPL', cat: 'PERMITIDO', embalagem: 50 },
  { cal: '12 GA Velox', cat: 'PERMITIDO', embalagem: 25 },
  { cal: '20 GA', cat: 'PERMITIDO', embalagem: 25 },
  { cal: '.22 LR', cat: 'PERMITIDO', embalagem: 50 },
  { cal: '.40 S&W', cat: 'RESTRITO', embalagem: 50 },
  { cal: '.45 ACP', cat: 'RESTRITO', embalagem: 50 },
  { cal: '5.56x45mm (.223)', cat: 'RESTRITO', embalagem: 20 },
  { cal: '7.62x51mm (.308)', cat: 'RESTRITO', embalagem: 20 },
  { cal: '.357 Magnum', cat: 'RESTRITO', embalagem: 50 },
  { cal: '.44 Magnum', cat: 'RESTRITO', embalagem: 50 }
]

const TIPOS_PROJETIL = [
  'ETOG - Encamisado Total Ogival (Treino)',
  'EXPO - Ponta Oca Expansivo (Defesa / Porte)',
  'Chumbo Ogival (Lazer / Stand)',
  'Bonded (Alta Performance Policial)',
  'Balote / Chumbo 3T / SG (12GA)',
  'Frangível (Ambientes Fechados / Estande)'
]

export default function ModalCadastrarMunicao({
  isOpen,
  onClose,
  onSalvarMunicao,
  municaoEdicao = null
}) {
  const [formData, setFormData] = useState({
    calibre: '9x19mm Luger',
    classificacao_calibre: 'PERMITIDO',
    fabricante: 'CBC',
    lote_fabricante: '',
    tipo_projetil: TIPOS_PROJETIL[0],
    apresentacao_embalagem: 'Caixa c/ 50 cartuchos',
    quantidade_por_embalagem: 50,
    estoque_atual_caixas: 0,
    quantidade_entrada_caixas: '',
    estoque_minimo_caixas: 2,
    preco_custo_caixa: '',
    preco_venda_caixa: '',
    localizacao: 'Cofre B - Prateleira Munições',
    codigo_barras: '',
    ncm: '9306.30.00'
  })

  useEffect(() => {
    if (municaoEdicao) {
      const qtdPorEmb = municaoEdicao.quantidade_por_embalagem || 50
      const totalCartuchos = municaoEdicao.quantidade || 0
      const cxsAtuais = Math.floor(totalCartuchos / qtdPorEmb)

      setFormData({
        calibre: municaoEdicao.calibre || '9x19mm Luger',
        classificacao_calibre: municaoEdicao.classificacao_calibre || 'PERMITIDO',
        fabricante: municaoEdicao.fabricante || 'CBC',
        lote_fabricante: municaoEdicao.lote_fabricante || '',
        tipo_projetil: municaoEdicao.tipo_projetil || TIPOS_PROJETIL[0],
        apresentacao_embalagem: municaoEdicao.apresentacao_embalagem || 'Caixa c/ 50 cartuchos',
        quantidade_por_embalagem: qtdPorEmb,
        estoque_atual_caixas: cxsAtuais,
        quantidade_entrada_caixas: '0',
        estoque_minimo_caixas: municaoEdicao.estoque_minimo || 2,
        preco_custo_caixa: municaoEdicao.preco_caixa ? municaoEdicao.preco_caixa.toString() : (municaoEdicao.preco_custo || '').toString(),
        preco_venda_caixa: municaoEdicao.preco_venda ? municaoEdicao.preco_venda.toString() : '',
        localizacao: municaoEdicao.localizacao || 'Cofre B - Prateleira Munições',
        codigo_barras: municaoEdicao.codigo_barras || '',
        ncm: municaoEdicao.ncm || '9306.30.00'
      })
    } else {
      setFormData({
        calibre: '9x19mm Luger',
        classificacao_calibre: 'PERMITIDO',
        fabricante: 'CBC',
        lote_fabricante: `CBC-${new Date().getFullYear()}-L${Math.floor(10 + Math.random() * 90)}`,
        tipo_projetil: TIPOS_PROJETIL[0],
        apresentacao_embalagem: 'Caixa c/ 50 cartuchos',
        quantidade_por_embalagem: 50,
        estoque_atual_caixas: 0,
        quantidade_entrada_caixas: '',
        estoque_minimo_caixas: 2,
        preco_custo_caixa: '',
        preco_venda_caixa: '',
        localizacao: 'Cofre B - Prateleira Munições',
        codigo_barras: '',
        ncm: '9306.30.00'
      })
    }
  }, [municaoEdicao, isOpen])

  if (!isOpen) return null

  const handleCalibreChange = (novoCal) => {
    const match = CALIBRES_MUNICAO.find(c => c.cal === novoCal)
    const novaQtdEmb = match ? match.embalagem : formData.quantidade_por_embalagem
    setFormData(prev => ({
      ...prev,
      calibre: novoCal,
      classificacao_calibre: match ? match.cat : prev.classificacao_calibre,
      quantidade_por_embalagem: novaQtdEmb,
      apresentacao_embalagem: `Caixa c/ ${novaQtdEmb} cartuchos`
    }))
  }

  // Cálculos dinâmicos em tempo real
  const cxsEntrada = parseInt(formData.quantidade_entrada_caixas) || 0
  const cxsBase = municaoEdicao ? (parseInt(formData.estoque_atual_caixas) || 0) : 0
  const totalCaixasResultante = cxsBase + cxsEntrada
  const totalCartuchosResultante = totalCaixasResultante * (parseInt(formData.quantidade_por_embalagem) || 1)

  const precoVendaCx = parseFloat(formData.preco_venda_caixa) || 0
  const precoUnitarioCartucho = formData.quantidade_por_embalagem > 0 ? (precoVendaCx / formData.quantidade_por_embalagem) : 0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.calibre) return

    const nomeFormatado = `Munição ${formData.fabricante} ${formData.calibre} - ${formData.tipo_projetil}`
    const skuFormatado = `MUN-${formData.calibre.replace(/[^a-zA-Z0-9]/g, '')}-${formData.lote_fabricante || 'LOTE'}`.toUpperCase()

    const municaoObj = {
      id: municaoEdicao ? municaoEdicao.id : `mun_${Date.now()}`,
      tipo_estoque: 'MUNICAO',
      codigo_sku: skuFormatado,
      nome: nomeFormatado,
      categoria: 'Munições',
      calibre: formData.calibre,
      classificacao_calibre: formData.classificacao_calibre,
      fabricante: formData.fabricante,
      lote_fabricante: formData.lote_fabricante.trim().toUpperCase(),
      tipo_projetil: formData.tipo_projetil,
      apresentacao_embalagem: formData.apresentacao_embalagem,
      quantidade_por_embalagem: parseInt(formData.quantidade_por_embalagem) || 1,
      total_caixas: totalCaixasResultante,
      // No estoque geral, a quantidade é o total de cartuchos individuais
      quantidade: totalCartuchosResultante,
      estoque_minimo: parseInt(formData.estoque_minimo_caixas) || 2,
      preco_caixa: precoVendaCx,
      preco_custo: parseFloat(formData.preco_custo_caixa) || 0,
      preco_venda: precoVendaCx,
      preco_unitario_cartucho: Number(precoUnitarioCartucho.toFixed(2)),
      localizacao: formData.localizacao,
      codigo_barras: formData.codigo_barras || null,
      ncm: formData.ncm || '9306.30.00',
      unidade: 'CX',
      origem: '0',
      updated_at: new Date().toISOString()
    }

    onSalvarMunicao(municaoObj)
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
        maxWidth: '700px',
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
              <Target size={22} color="var(--gold-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--gold-primary)', margin: 0 }}>
                {municaoEdicao ? 'Editar Munição no Estoque' : 'Entrada de Munições no Estoque (PCE Balístico)'}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Rastreabilidade de lote do fabricante para SICOVEM e Exército Brasileiro (DFPC)
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.35rem', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* BLOCO 1: CALIBRE, CLASSIFICAÇÃO & FABRICANTE */}
          <div style={{
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '0.9rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.85rem',
            alignItems: 'center'
          }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Calibre da Munição *
              </label>
              <select
                className="input-field"
                value={formData.calibre}
                onChange={e => handleCalibreChange(e.target.value)}
              >
                {CALIBRES_MUNICAO.map(c => (
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
                    padding: '0.35rem',
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
                    padding: '0.35rem',
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
                Fabricante *
              </label>
              <select
                className="input-field"
                value={formData.fabricante}
                onChange={e => setFormData({ ...formData, fabricante: e.target.value })}
              >
                <option value="CBC">CBC (Companhia Brasileira de Cartuchos)</option>
                <option value="Magtech">Magtech</option>
                <option value="Aguila">Aguila Ammunition</option>
                <option value="Federal">Federal Premium</option>
                <option value="Winchester">Winchester</option>
                <option value="Hornady">Hornady</option>
              </select>
            </div>
          </div>

          {/* BLOCO 2: LOTE DO FABRICANTE & TIPO DE PROJÉTIL */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: '700', display: 'block', marginBottom: '0.2rem' }}>
                NÚMERO DO LOTE DO FABRICANTE (SICOVEM) *
              </label>
              <input
                required
                className="input-field"
                style={{ fontFamily: 'monospace', fontWeight: '700', borderColor: 'var(--border-gold)' }}
                value={formData.lote_fabricante}
                onChange={e => setFormData({ ...formData, lote_fabricante: e.target.value })}
                placeholder="Ex: CBC-2026-L48"
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Obrigatório para mapas do Exército</span>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Tipo de Projétil / Finalidade *
              </label>
              <select
                className="input-field"
                value={formData.tipo_projetil}
                onChange={e => setFormData({ ...formData, tipo_projetil: e.target.value })}
              >
                {TIPOS_PROJETIL.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* BLOCO 3: EMBALAGEM E QUANTIDADES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cartuchos por Caixa *</label>
              <select
                className="input-field"
                value={formData.quantidade_por_embalagem}
                onChange={e => {
                  const q = parseInt(e.target.value) || 50
                  setFormData({
                    ...formData,
                    quantidade_por_embalagem: q,
                    apresentacao_embalagem: `Caixa c/ ${q} cartuchos`
                  })
                }}
              >
                <option value="50">50 cartuchos / caixa</option>
                <option value="20">20 cartuchos / caixa</option>
                <option value="25">25 cartuchos (12GA)</option>
                <option value="10">10 cartuchos (Blister)</option>
                <option value="1">1 cartucho (Avulso)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estoque Atual (Caixas)</label>
              <input
                readOnly
                disabled
                className="input-field"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', cursor: 'not-allowed', fontWeight: '700' }}
                value={`${formData.estoque_atual_caixas} cx`}
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Não editável</span>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: '700' }}>
                Entrada (Qtd Caixas) *
              </label>
              <input
                required
                type="number"
                min="0"
                className="input-field"
                style={{ borderColor: 'var(--border-gold)' }}
                value={formData.quantidade_entrada_caixas}
                onChange={e => setFormData({ ...formData, quantidade_entrada_caixas: e.target.value })}
                placeholder="0"
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--gold-primary)' }}>Caixas recebidas</span>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estoque Mín. Alerta (Cx)</label>
              <input
                required
                type="number"
                min="1"
                className="input-field"
                value={formData.estoque_minimo_caixas}
                onChange={e => setFormData({ ...formData, estoque_minimo_caixas: e.target.value })}
                placeholder="2"
              />
            </div>
          </div>

          {/* Box de Cálculo em Tempo Real */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(217, 119, 6, 0.08)',
            border: '1px solid rgba(217, 119, 6, 0.25)',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Saldo resultante da operação:
            </span>
            <span style={{ fontWeight: '700', color: 'var(--gold-primary)', fontSize: '1rem' }}>
              {totalCaixasResultante} caixas = {totalCartuchosResultante.toLocaleString('pt-BR')} cartuchos no estoque
            </span>
          </div>

          {/* BLOCO 4: PREÇOS POR CAIXA E UNITÁRIO */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preço Custo / Caixa (R$)</label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                value={formData.preco_custo_caixa}
                onChange={e => setFormData({ ...formData, preco_custo_caixa: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: '700' }}>Preço Venda / Caixa (R$) *</label>
              <input
                required
                type="number"
                step="0.01"
                className="input-field"
                style={{ borderColor: 'var(--border-gold)' }}
                value={formData.preco_venda_caixa}
                onChange={e => setFormData({ ...formData, preco_venda_caixa: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: '700' }}>Preço / Cartucho Unitário</label>
              <input
                readOnly
                disabled
                className="input-field"
                style={{ backgroundColor: 'rgba(52, 211, 153, 0.08)', borderColor: 'rgba(52, 211, 153, 0.2)', color: '#34D399', fontWeight: '700' }}
                value={`R$ ${precoUnitarioCartucho.toFixed(2)} / un.`}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Localização no Cofre</label>
              <input
                className="input-field"
                value={formData.localizacao}
                onChange={e => setFormData({ ...formData, localizacao: e.target.value })}
                placeholder="Cofre B - Prateleira 2"
              />
            </div>
          </div>

          {/* Botões de Rodapé */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-gold" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Target size={16} />
              <span>Salvar Munições no Estoque</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
