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
  Sparkles,
  Zap,
  Target,
  Wrench,
  Check,
  Info
} from 'lucide-react'
import {
  parsearDescricaoArmaNF,
  TIPOS_ARMA_LIST,
  ACABAMENTOS_LIST,
  RAIAMENTO_LIST,
  SENTIDO_RAIAS_LIST,
  FUNCIONAMENTO_LIST,
  CANO_PRESETS,
  CAPACIDADE_PRESETS
} from '../lib/armaParser'

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
  // Estado para o leitor inteligente da NF
  const [textoDescricaoNF, setTextoDescricaoNF] = useState('')
  const [msgParser, setMsgParser] = useState('')

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
    // Especificações Técnicas da NF (balística e mecânica)
    comprimento_cano: '83mm (3.26")',
    acabamento: 'Oxidado Fosco',
    quantidade_raias: '6 raias',
    sentido_raias: 'À Direita (Dextrorsum)',
    tipo_funcionamento: 'Semiautomática',
    capacidade_tiros: '12+1 tiros',
    possui_carregadores: true,
    quantidade_carregadores: '2',
    // Localização e fiscal
    localizacao: 'Cofre Forte - Gaveta 1',
    codigo_barras: '',
    ncm: '9302.00.00',
    fornecedor_nome: '',
    observacoes: ''
  })

  useEffect(() => {
    setTextoDescricaoNF('')
    setMsgParser('')
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
        comprimento_cano: armaEdicao.comprimento_cano || '83mm (3.26")',
        acabamento: armaEdicao.acabamento || 'Oxidado Fosco',
        quantidade_raias: armaEdicao.quantidade_raias || '6 raias',
        sentido_raias: armaEdicao.sentido_raias || 'À Direita (Dextrorsum)',
        tipo_funcionamento: armaEdicao.tipo_funcionamento || 'Semiautomática',
        capacidade_tiros: armaEdicao.capacidade_tiros || '12+1 tiros',
        possui_carregadores: armaEdicao.possui_carregadores !== undefined ? armaEdicao.possui_carregadores : true,
        quantidade_carregadores: armaEdicao.quantidade_carregadores || '2',
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
        comprimento_cano: '83mm (3.26")',
        acabamento: 'Oxidado Fosco',
        quantidade_raias: '6 raias',
        sentido_raias: 'À Direita (Dextrorsum)',
        tipo_funcionamento: 'Semiautomática',
        capacidade_tiros: '12+1 tiros',
        possui_carregadores: true,
        quantidade_carregadores: '2',
        localizacao: 'Cofre Forte - Gaveta 1',
        codigo_barras: '',
        ncm: '9302.00.00',
        fornecedor_nome: '',
        observacoes: ''
      })
    }
  }, [armaEdicao, isOpen])

  if (!isOpen) return null

  // ── Interpretação Inteligente do Texto da Nota Fiscal ──────────────────────
  const handleInterpretarDescricaoNF = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!textoDescricaoNF.trim()) {
      setMsgParser('Cole o texto da descrição da arma constante na Nota Fiscal.')
      return
    }

    const interpretado = parsearDescricaoArmaNF(textoDescricaoNF)
    if (!interpretado) {
      setMsgParser('Não foi possível identificar atributos no texto colado.')
      return
    }

    setFormData(prev => ({
      ...prev,
      tipo_arma: interpretado.tipo_arma || prev.tipo_arma,
      fabricante: interpretado.fabricante || prev.fabricante,
      modelo: interpretado.modelo || prev.modelo,
      calibre: interpretado.calibre || prev.calibre,
      classificacao_calibre: interpretado.classificacao_calibre || prev.classificacao_calibre,
      comprimento_cano: interpretado.comprimento_cano || prev.comprimento_cano,
      acabamento: interpretado.acabamento || prev.acabamento,
      quantidade_raias: interpretado.quantidade_raias || prev.quantidade_raias,
      sentido_raias: interpretado.sentido_raias || prev.sentido_raias,
      tipo_funcionamento: interpretado.tipo_funcionamento || prev.tipo_funcionamento,
      capacidade_tiros: interpretado.capacidade_tiros || prev.capacidade_tiros,
      possui_carregadores: interpretado.possui_carregadores !== undefined ? interpretado.possui_carregadores : prev.possui_carregadores,
      quantidade_carregadores: interpretado.quantidade_carregadores || prev.quantidade_carregadores,
      ncm: (interpretado.tipo_arma === 'Pistola' || interpretado.tipo_arma === 'Revólver') ? '9302.00.00' : '9303.30.00'
    }))

    setMsgParser('✅ Atributos da Nota Fiscal interpretados e preenchidos com sucesso!')
  }

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
    const ncmSugerido = (novoTipo === 'Pistola' || novoTipo === 'Revólver')
      ? '9302.00.00'
      : (novoTipo === 'Espingarda' ? '9303.20.00' : '9303.30.00')

    const funcionamentoSugerido = novoTipo === 'Pistola'
      ? 'Semiautomática'
      : novoTipo === 'Revólver'
      ? 'Ação Dupla / Simples (SA/DA)'
      : novoTipo === 'Espingarda'
      ? 'Repetição (Pump Action)'
      : 'Semiautomática'

    const temCarregador = novoTipo !== 'Revólver' && novoTipo !== 'Espingarda'
    const raiasSugeridas = novoTipo === 'Espingarda' ? 'Alma Lisa (Espingarda)' : '6 raias'
    const sentidoSugerido = novoTipo === 'Espingarda' ? 'Não Aplicável / Alma Lisa' : 'À Direita (Dextrorsum)'

    setFormData(prev => ({
      ...prev,
      tipo_arma: novoTipo,
      ncm: ncmSugerido,
      tipo_funcionamento: funcionamentoSugerido,
      possui_carregadores: temCarregador,
      quantidade_carregadores: temCarregador ? '2' : '0',
      quantidade_raias: raiasSugeridas,
      sentido_raias: sentidoSugerido
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.numero_serie.trim()) {
      alert('O Número de Série da arma é obrigatório para conformidade legal (SINARM / SIGMA).')
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
      
      // ESPECIFICAÇÕES TÉCNICAS DA NOTA FISCAL (CONFORMIDADE PF / EXÉRCITO)
      comprimento_cano: formData.comprimento_cano || '83mm (3.26")',
      acabamento: formData.acabamento || 'Oxidado Fosco',
      quantidade_raias: formData.quantidade_raias || '6 raias',
      sentido_raias: formData.sentido_raias || 'À Direita (Dextrorsum)',
      tipo_funcionamento: formData.tipo_funcionamento || 'Semiautomática',
      capacidade_tiros: formData.capacidade_tiros || '12+1 tiros',
      possui_carregadores: !!formData.possui_carregadores,
      quantidade_carregadores: formData.possui_carregadores ? (formData.quantidade_carregadores || '2') : '0',

      localizacao: formData.localizacao,
      codigo_barras: formData.codigo_barras || null,
      ncm: formData.ncm || '9302.00.00',
      unidade: 'UN',
      origem: '0',
      quantidade: formData.status_arma === 'ENTREGUE' ? 0 : 1,
      estoque_minimo: 1,
      observacoes: formData.observacoes,
      updated_at: new Date().toISOString()
    }

    onSalvarArma(armaObj)
    onClose()
  }

  // Cálculo de Margem de Lucro
  const precoCustoNum = parseFloat(formData.preco_custo) || 0
  const precoVendaNum = parseFloat(formData.preco_venda) || 0
  const margemLucro = precoCustoNum > 0 && precoVendaNum > 0
    ? (((precoVendaNum - precoCustoNum) / precoCustoNum) * 100).toFixed(1)
    : null

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
        maxWidth: '760px',
        maxHeight: '94vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1.5rem',
        borderLeft: '4px solid var(--gold-primary)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(217, 119, 6, 0.15)', borderRadius: '8px', border: '1px solid rgba(217, 119, 6, 0.3)' }}>
              <Shield size={22} color="var(--gold-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--gold-primary)', margin: 0 }}>
                {armaEdicao ? 'Editar Arma de Fogo no Estoque' : 'Cadastrar Arma de Fogo no Estoque (Cofre)'}
              </h2>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Ficha balística e mecânica conforme dados da Nota Fiscal de Compra e exigências do SINARM / SIGMA
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.35rem', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* ── LEITOR INTELIGENTE DA DESCRIÇÃO DA NOTA FISCAL (IMPORTAÇÃO RÁPIDA) ── */}
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          padding: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
            <Sparkles size={16} color="#60A5FA" />
            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#93C5FD', textTransform: 'uppercase' }}>
              Leitor Inteligente da Descrição da NF-e (Preenchimento Rápido)
            </span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>
            Cole a linha de descrição do produto da sua Nota Fiscal de compra da Taurus, CBC ou distribuidor para preencher automaticamente tipo, cano, acabamento, raias, funcionamento, capacidade e carregadores:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="input-field"
              style={{ fontSize: '0.78rem', height: '34px', flex: 1 }}
              placeholder="Ex: PISTOLA TAURUS G3C CAL. 9MM CANO 83MM ACAB. TENIFERIZADO 6 RAIAS A DIREITA SEMIAUTOMATICA 12+1 TIROS C/ 3 CARREGADORES"
              value={textoDescricaoNF}
              onChange={e => { setTextoDescricaoNF(e.target.value); setMsgParser('') }}
            />
            <button
              type="button"
              className="btn-gold"
              style={{ fontSize: '0.75rem', padding: '0 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
              onClick={handleInterpretarDescricaoNF}
            >
              <Zap size={14} />
              <span>Interpretar NF-e</span>
            </button>
          </div>
          {msgParser && (
            <div style={{ fontSize: '0.72rem', marginTop: '0.4rem', fontWeight: '700', color: msgParser.startsWith('✅') ? '#34D399' : '#FBBF24' }}>
              {msgParser}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* ── BLOCO 1: NÚMERO DE SÉRIE & STATUS NO COFRE ── */}
          <div style={{
            backgroundColor: 'rgba(217, 119, 6, 0.06)',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            borderRadius: '8px',
            padding: '0.9rem',
            display: 'grid',
            gridTemplateColumns: '1.4fr 1.2fr 1fr',
            gap: '0.75rem',
            alignItems: 'center'
          }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: '800', display: 'block', marginBottom: '0.25rem' }}>
                NÚMERO DE SÉRIE DA ARMA *
              </label>
              <input
                required
                className="input-field"
                style={{
                  fontFamily: 'monospace',
                  fontSize: '1.05rem',
                  fontWeight: '800',
                  letterSpacing: '1px',
                  borderColor: 'var(--border-gold)',
                  backgroundColor: 'rgba(0,0,0,0.5)'
                }}
                value={formData.numero_serie}
                onChange={e => setFormData({ ...formData, numero_serie: e.target.value.toUpperCase() })}
                placeholder="Ex: AFG12345"
              />
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Gravado no cano/armação</span>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                Status no Estoque / Cofre *
              </label>
              <select
                className="input-field"
                style={{ fontSize: '0.82rem', fontWeight: '600' }}
                value={formData.status_arma}
                onChange={e => setFormData({ ...formData, status_arma: e.target.value })}
              >
                <option value="DISPONIVEL">🟢 Disponível no Cofre (Venda Livre)</option>
                <option value="RESERVADA">🟡 Reservada (Em Aquisição PF/Exército)</option>
                <option value="AGUARDANDO_CRAF">🔵 Aguardando CRAF / Guia de Trânsito</option>
                <option value="ENTREGUE">⚪ Entregue ao Comprador (Venda Concluída)</option>
                <option value="CONSIGNADA">🟣 Arma Usada / Consignada de Terceiro</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                Localização no Cofre
              </label>
              <input
                className="input-field"
                style={{ fontSize: '0.82rem' }}
                value={formData.localizacao}
                onChange={e => setFormData({ ...formData, localizacao: e.target.value })}
                placeholder="Cofre 1 - Gaveta A"
              />
            </div>
          </div>

          {/* Vínculo de Reserva se não estiver disponível */}
          {(formData.status_arma === 'RESERVADA' || formData.status_arma === 'AGUARDANDO_CRAF') && (
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '8px',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <User size={18} color="#60A5FA" />
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.72rem', color: '#93C5FD', fontWeight: '700', display: 'block', marginBottom: '0.2rem' }}>
                  Cliente Comprador / Titular da Reserva:
                </label>
                <select
                  className="input-field"
                  style={{ fontSize: '0.8rem' }}
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
                      {c.nome_completo} (CPF: {c.cpf || 'N/A'}) {c.numero_cr ? `[CR: ${c.numero_cr}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── BLOCO 2: DADOS BÁSICOS DA ARMA ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tipo de Arma *</label>
              <select
                className="input-field"
                style={{ fontSize: '0.82rem' }}
                value={formData.tipo_arma}
                onChange={e => handleTipoArmaChange(e.target.value)}
              >
                {TIPOS_ARMA_LIST.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fabricante / Marca *</label>
              <select
                className="input-field"
                style={{ fontSize: '0.82rem' }}
                value={formData.fabricante}
                onChange={e => setFormData({ ...formData, fabricante: e.target.value })}
              >
                {FABRICANTES_COMUNS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Modelo Comercial *</label>
              <input
                required
                className="input-field"
                style={{ fontSize: '0.82rem' }}
                value={formData.modelo}
                onChange={e => setFormData({ ...formData, modelo: e.target.value })}
                placeholder="Ex: G3c T.O.R.O. / RT 856"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Calibre Nominal *</label>
              <select
                className="input-field"
                style={{ fontSize: '0.82rem' }}
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
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sistema de Registro *</label>
              <select
                className="input-field"
                style={{ fontSize: '0.82rem' }}
                value={formData.sistema_registro}
                onChange={e => setFormData({ ...formData, sistema_registro: e.target.value })}
              >
                <option value="SIGMA">SIGMA (Exército)</option>
                <option value="SINARM">SINARM (Polícia Federal)</option>
              </select>
            </div>
          </div>

          {/* ── BLOCO 3: ESPECIFICAÇÕES TÉCNICAS DA NOTA FISCAL (BALÍSTICA & MECÂNICA) ── */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '0.9rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.35rem' }}>
              <Target size={15} color="var(--gold-primary)" />
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--gold-primary)', textTransform: 'uppercase' }}>
                Ficha Balística & Mecânica da Nota Fiscal (Descrição Oficial)
              </span>
            </div>

            {/* Linha 1: Cano e Acabamento */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
              {/* Comprimento / Tamanho do Cano */}
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Tamanho / Comprimento do Cano *
                </label>
                <input
                  required
                  className="input-field"
                  style={{ fontSize: '0.82rem', height: '32px' }}
                  value={formData.comprimento_cano}
                  onChange={e => setFormData({ ...formData, comprimento_cano: e.target.value })}
                  placeholder="Ex: 83mm (3.26 pol) / 102mm / 483mm"
                />
                {/* Atalhos rápidos de cano */}
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                  {CANO_PRESETS.map(cp => (
                    <button
                      key={cp}
                      type="button"
                      onClick={() => setFormData({ ...formData, comprimento_cano: cp })}
                      style={{
                        fontSize: '0.62rem',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '3px',
                        border: '1px solid var(--border-color)',
                        background: formData.comprimento_cano === cp ? 'rgba(217, 119, 6, 0.3)' : 'var(--bg-input)',
                        color: formData.comprimento_cano === cp ? '#FBBF24' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {cp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Acabamento da Arma */}
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Acabamento da Arma *
                </label>
                <input
                  required
                  className="input-field"
                  style={{ fontSize: '0.82rem', height: '32px' }}
                  value={formData.acabamento}
                  onChange={e => setFormData({ ...formData, acabamento: e.target.value })}
                  placeholder="Oxidado Fosco, Inox, Cerakote..."
                />
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                  {ACABAMENTOS_LIST.slice(0, 4).map(ac => (
                    <button
                      key={ac}
                      type="button"
                      onClick={() => setFormData({ ...formData, acabamento: ac })}
                      style={{
                        fontSize: '0.62rem',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '3px',
                        border: '1px solid var(--border-color)',
                        background: formData.acabamento === ac ? 'rgba(217, 119, 6, 0.3)' : 'var(--bg-input)',
                        color: formData.acabamento === ac ? '#FBBF24' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {ac}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Linha 2: Raiamento, Sentido de Raias e Tipo de Funcionamento */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Raiamento (Qtd de Raias) *
                </label>
                <select
                  className="input-field"
                  style={{ fontSize: '0.8rem', height: '32px' }}
                  value={formData.quantidade_raias}
                  onChange={e => setFormData({ ...formData, quantidade_raias: e.target.value })}
                >
                  {RAIAMENTO_LIST.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Sentido das Raias *
                </label>
                <select
                  className="input-field"
                  style={{ fontSize: '0.8rem', height: '32px' }}
                  value={formData.sentido_raias}
                  onChange={e => setFormData({ ...formData, sentido_raias: e.target.value })}
                >
                  {SENTIDO_RAIAS_LIST.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Tipo de Funcionamento *
                </label>
                <select
                  className="input-field"
                  style={{ fontSize: '0.8rem', height: '32px' }}
                  value={formData.tipo_funcionamento}
                  onChange={e => setFormData({ ...formData, tipo_funcionamento: e.target.value })}
                >
                  {FUNCIONAMENTO_LIST.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Linha 3: Capacidade de Disparos e Carregadores */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.65rem', alignItems: 'flex-start' }}>
              {/* Capacidade de Disparos */}
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Capacidade de Disparos *
                </label>
                <input
                  required
                  className="input-field"
                  style={{ fontSize: '0.82rem', height: '32px' }}
                  value={formData.capacidade_tiros}
                  onChange={e => setFormData({ ...formData, capacidade_tiros: e.target.value })}
                  placeholder="Ex: 12+1 tiros / 17+1 / 6 tiros"
                />
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                  {CAPACIDADE_PRESETS.slice(0, 4).map(cp => (
                    <button
                      key={cp}
                      type="button"
                      onClick={() => setFormData({ ...formData, capacidade_tiros: cp })}
                      style={{
                        fontSize: '0.62rem',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '3px',
                        border: '1px solid var(--border-color)',
                        background: formData.capacidade_tiros === cp ? 'rgba(217, 119, 6, 0.3)' : 'var(--bg-input)',
                        color: formData.capacidade_tiros === cp ? '#FBBF24' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {cp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Se possui carregadores */}
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Possui Carregadores? *
                </label>
                <select
                  className="input-field"
                  style={{ fontSize: '0.8rem', height: '32px' }}
                  value={formData.possui_carregadores ? 'SIM' : 'NAO'}
                  onChange={e => {
                    const sim = e.target.value === 'SIM'
                    setFormData({
                      ...formData,
                      possui_carregadores: sim,
                      quantidade_carregadores: sim ? (formData.quantidade_carregadores || '2') : '0'
                    })
                  }}
                >
                  <option value="SIM">Sim (Acompanha carregadores)</option>
                  <option value="NAO">Não (Revólver / Alma lisa / Monotiro)</option>
                </select>
              </div>

              {/* Quantidade de Carregadores */}
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Qtd de Carregadores Inclusos
                </label>
                <select
                  className="input-field"
                  disabled={!formData.possui_carregadores}
                  style={{ fontSize: '0.8rem', height: '32px', opacity: formData.possui_carregadores ? 1 : 0.5 }}
                  value={formData.quantidade_carregadores}
                  onChange={e => setFormData({ ...formData, quantidade_carregadores: e.target.value })}
                >
                  <option value="1">1 Carregador</option>
                  <option value="2">2 Carregadores (Padrão)</option>
                  <option value="3">3 Carregadores</option>
                  <option value="4">4 Carregadores</option>
                  <option value="0">Nenhum / N/A</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── BLOCO 4: VALORES FINANCEIROS & DADOS FISCAIS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.65rem' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Preço Custo (R$)</label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                style={{ fontSize: '0.82rem' }}
                value={formData.preco_custo}
                onChange={e => setFormData({ ...formData, preco_custo: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', fontWeight: '700' }}>Preço Venda (R$) *</label>
              <input
                required
                type="number"
                step="0.01"
                className="input-field"
                style={{ fontSize: '0.82rem', borderColor: 'var(--border-gold)' }}
                value={formData.preco_venda}
                onChange={e => setFormData({ ...formData, preco_venda: e.target.value })}
                placeholder="0.00"
              />
              {margemLucro !== null && (
                <span style={{ fontSize: '0.62rem', color: '#10B981', fontWeight: '700' }}>
                  Margem: +{margemLucro}%
                </span>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>NCM Fiscal</label>
              <input
                className="input-field"
                style={{ fontSize: '0.82rem' }}
                value={formData.ncm}
                onChange={e => setFormData({ ...formData, ncm: e.target.value })}
                placeholder="9302.00.00"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cód. Barras (EAN)</label>
              <input
                className="input-field"
                style={{ fontSize: '0.82rem' }}
                value={formData.codigo_barras}
                onChange={e => setFormData({ ...formData, codigo_barras: e.target.value })}
                placeholder="EAN-13"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Nº Registro SIGMA/SINARM</label>
              <input
                className="input-field"
                style={{ fontSize: '0.82rem' }}
                value={formData.numero_sigma_sinarm}
                onChange={e => setFormData({ ...formData, numero_sigma_sinarm: e.target.value })}
                placeholder="Se houver registro prévio"
              />
            </div>
          </div>

          {/* Observações da NF */}
          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Observações da NF / Itens Adicionais</label>
            <input
              className="input-field"
              style={{ fontSize: '0.82rem' }}
              value={formData.observacoes}
              onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Ex: Acompanha maleta rígida, municiador, 2 placas de empunhadura e kit de limpeza..."
            />
          </div>

          {/* Botões de Rodapé */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-gold" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.2rem', fontWeight: '800' }}>
              <Shield size={16} />
              <span>{armaEdicao ? 'Atualizar Dados da Arma' : 'Salvar Arma no Estoque'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
