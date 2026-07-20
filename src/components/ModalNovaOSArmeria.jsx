import React, { useState } from 'react'
import { X, Shield, Crosshair, AlertCircle, Calendar, FileText, CheckCircle2, Info, Package, BookmarkCheck, Plus } from 'lucide-react'
import { dbUpsert } from '../lib/supabase'

export default function ModalNovaOSArmeria({
  clienteInicial,
  clientes = [],
  ordens = [],
  setOrdens,
  armas = [],
  setArmas,
  onClose
}) {
  const [clienteId, setClienteId] = useState(clienteInicial?.id || clientes[0]?.id || '')

  const clienteAtual = clientes.find(c => c.id === clienteId) || clienteInicial || {
    id: 'c1',
    nome_completo: 'CARLOS EDUARDO SILVEIRA',
    cpf: '123.456.789-00',
    telefone: '(11) 98765-4321',
    numero_cr: '123456/2ª RM'
  }

  // Lista de armas no acervo deste cliente
  const armasDoCliente = (armas || []).filter(a => a.cliente_id === clienteAtual?.id)
  const [armaSelecionadaId, setArmaSelecionadaId] = useState('')
  const [salvarNoAcervo, setSalvarNoAcervo] = useState(true)

  // Categoria da Arma
  const [categoriaArma, setCategoriaArma] = useState('Arma de Fogo')

  // Dados da Arma
  const [tipoArma, setTipoArma] = useState('Pistola')
  const [marcaArma, setMarcaArma] = useState('Glock')
  const [modeloArma, setModeloArma] = useState('G17 Gen5')
  const [calibreArma, setCalibreArma] = useState('9mm')
  const [numeroSerieArma, setNumeroSerieArma] = useState('')

  // Problema Relatado
  const [problemaRelatado, setProblemaRelatado] = useState('')

  // ACESSÓRIOS ACOMPANHANTES (Checklist de Entrada da Recepção)
  const [qtdCarregadores, setQtdCarregadores] = useState(1)
  const [temCaseRigido, setTemCaseRigido] = useState(false)
  const [temLunetaRedDot, setTemLunetaRedDot] = useState(false)
  const [descricaoLuneta, setDescricaoLuneta] = useState('')
  const [acessoriosAdicionais, setAcessoriosAdicionais] = useState('')

  // Guia de Tráfego de Manutenção (GT)
  const [gtProtocolo, setGtProtocolo] = useState('')
  const [gtDataEmissao, setGtDataEmissao] = useState(new Date().toISOString().split('T')[0])
  const [gtDataVencimento, setGtDataVencimento] = useState('')

  // Seleção de Arma do Acervo -> Auto-preenche os dados
  const handleSelecionarArmaAcervo = (armaId) => {
    setArmaSelecionadaId(armaId)
    if (!armaId) return

    const arma = armasDoCliente.find(a => a.id === armaId)
    if (arma) {
      setCategoriaArma(arma.categoria || (arma.tipo?.toLowerCase().includes('ar comprimido') ? 'Arma de Ar Comprimido' : 'Arma de Fogo'))
      setTipoArma(arma.tipo || 'Pistola')
      setMarcaArma(arma.marca || '')
      setModeloArma(arma.modelo || '')
      setCalibreArma(arma.calibre || '')
      setNumeroSerieArma(arma.numero_serie || '')
    }
  }

  // Ajusta tipo padrão quando troca categoria
  const handleTrocarCategoria = (novaCat) => {
    setCategoriaArma(novaCat)
    setArmaSelecionadaId('')
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

    // Monta string formatada de Acessórios
    const acessoriosFormatados = [
      `${qtdCarregadores} carregador(es)`,
      temCaseRigido ? 'Maleta/Case Rígido' : null,
      temLunetaRedDot ? `Óptica: ${descricaoLuneta || 'Red Dot / Luneta'}` : null,
      acessoriosAdicionais ? `Outros: ${acessoriosAdicionais}` : null
    ].filter(Boolean).join(' | ')

    const maxOS = (ordens || []).reduce((max, o) => Math.max(max, Number(o.numero_os) || 1000), 1000)
    const novaOSObj = {
      id: `os_${Date.now()}`,
      numero_os: maxOS + 1,
      cliente_id: clienteAtual.id,
      cliente_nome: clienteAtual.nome_completo,
      categoria_arma: categoriaArma,
      tipo_arma: tipoArma,
      marca_arma: marcaArma,
      modelo_arma: modeloArma,
      calibre_arma: calibreArma,
      numero_serie_arma: numeroSerieArma,
      problema_relatado: problemaRelatado || 'Manutenção geral solicitada.',
      acessorios_acompanhantes: acessoriosFormatados,
      gt_protocolo: categoriaArma === 'Arma de Fogo' ? gtProtocolo : 'N/A (Ar Comprimido)',
      gt_data_emissao: categoriaArma === 'Arma de Fogo' ? gtDataEmissao : null,
      gt_data_vencimento: categoriaArma === 'Arma de Fogo' ? gtDataVencimento : null,
      tipo_servico: `Manutenção ${tipoArma} ${marcaArma}`,
      valor_servico: 0,
      valor_taxamento: 0,
      status: 'NÃO INICIADO',
      created_at: new Date().toISOString().split('T')[0]
    }

    // Se marcado para salvar no Acervo e a arma ainda não constar no cadastro do cliente
    const jaExisteNoAcervo = armasDoCliente.some(a => (a.numero_serie || '').trim().toLowerCase() === numeroSerieArma.trim().toLowerCase())
    if (salvarNoAcervo && !jaExisteNoAcervo) {
      const novaArmaAcervo = {
        id: `a_${Date.now()}`,
        cliente_id: clienteAtual.id,
        categoria: categoriaArma,
        tipo: tipoArma,
        marca: marcaArma,
        modelo: modeloArma,
        calibre: calibreArma,
        numero_serie: numeroSerieArma,
        numero_sigma_sinarm: categoriaArma === 'Arma de Fogo' ? 'SIGMA' : 'N/A (Ar Comprimido)',
        orgao_registro: categoriaArma === 'Arma de Fogo' ? 'SIGMA' : 'Livre',
        numero_craf: 'N/A',
        validade_craf: 'N/A',
        status: 'Regular',
        created_at: new Date().toISOString().split('T')[0]
      }
      if (setArmas) setArmas([novaArmaAcervo, ...armas])
      dbUpsert('armas', novaArmaAcervo)
    }

    setOrdens([novaOSObj, ...ordens])
    dbUpsert('ordens', novaOSObj)
    alert(`Entrada registrada pela Recepção! Ordem de Serviço #${novaOSObj.numero_os} em 'NÃO INICIADO' guardada no armário de entrada.`)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '0.75rem'
    }}>
      <div className="card card-modal" style={{ width: '100%', maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto', padding: '1.25rem' }}>
        {/* Top Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Crosshair size={22} color="var(--red-light)" />
              <span>Entrada de Equipamento (O.S.)</span>
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Check-in de Entrada com Seleção ou Cadastro no Acervo</div>
          </div>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSalvarEntradaOS} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* DADOS DO CLIENTE */}
          <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
              CLIENTE REQUERENTE
            </label>
            {!clienteInicial && clientes && clientes.length > 0 ? (
              <select
                className="input-field"
                value={clienteId}
                onChange={e => {
                  setClienteId(e.target.value)
                  setArmaSelecionadaId('')
                }}
                style={{ fontWeight: '700' }}
              >
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_completo.toUpperCase()} ({c.cpf}) - CR: {c.numero_cr || 'Sem CR'}</option>)}
              </select>
            ) : (
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
                {clienteAtual.nome_completo.toUpperCase()} — CPF: {clienteAtual.cpf} — CR: {clienteAtual.numero_cr || 'N/A'}
              </div>
            )}
          </div>

          {/* SELETOR DE ARMA DO ACERVO DO CLIENTE */}
          {armasDoCliente.length > 0 && (
            <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: '0.9rem', borderRadius: '8px' }}>
              <label style={{ fontSize: '0.78rem', color: '#FBBF24', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <BookmarkCheck size={16} />
                <span>SELECIONAR ARMA JÁ CADASTRADA NO ACERVO DO CLIENTE</span>
              </label>
              <select
                className="input-field"
                value={armaSelecionadaId}
                onChange={e => handleSelecionarArmaAcervo(e.target.value)}
                style={{ fontWeight: '700', color: '#FFFFFF', backgroundColor: '#181A20' }}
              >
                <option value="">-- PREENCHER NOVA ARMA / MANUALLMENTE --</option>
                {armasDoCliente.map(a => (
                  <option key={a.id} value={a.id}>
                    🎯 {a.marca} {a.modelo} {a.calibre} — (N° Série: {a.numero_serie})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 1. SELEÇÃO DA CATEGORIA DA ARMA */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.4rem' }}>
              CATEGORIA DO EQUIPAMENTO *
            </label>
            <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => handleTrocarCategoria('Arma de Fogo')}
                style={{
                  padding: '0.8rem',
                  borderRadius: '8px',
                  border: categoriaArma === 'Arma de Fogo' ? '2px solid var(--red-light)' : '1px solid var(--border-color)',
                  backgroundColor: categoriaArma === 'Arma de Fogo' ? 'rgba(139, 38, 42, 0.25)' : 'var(--bg-input)',
                  color: categoriaArma === 'Arma de Fogo' ? '#FFFFFF' : 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '0.85rem',
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
                  padding: '0.8rem',
                  borderRadius: '8px',
                  border: categoriaArma === 'Arma de Ar Comprimido' ? '2px solid #34D399' : '1px solid var(--border-color)',
                  backgroundColor: categoriaArma === 'Arma de Ar Comprimido' ? 'rgba(19, 70, 51, 0.3)' : 'var(--bg-input)',
                  color: categoriaArma === 'Arma de Ar Comprimido' ? '#FFFFFF' : 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '0.5rem'
                }}
              >
                <Crosshair size={18} color={categoriaArma === 'Arma de Ar Comprimido' ? '#34D399' : '#8E96A0'} />
                <span>Arma de Ar Comprimido</span>
              </button>
            </div>
          </div>

          {/* 2. DADOS DA ARMA (4 CAMPOS EM GRID) */}
          <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
                TIPO *
              </label>
              {categoriaArma === 'Arma de Fogo' ? (
                <select className="input-field" value={tipoArma} onChange={e => setTipoArma(e.target.value)}>
                  <option value="Pistola">Pistola</option>
                  <option value="Revólver">Revólver</option>
                  <option value="Carabina/Fuzil">Carabina / Fuzil</option>
                  <option value="Espingarda">Espingarda</option>
                </select>
              ) : (
                <select className="input-field" value={tipoArma} onChange={e => setTipoArma(e.target.value)}>
                  <option value="Carabina de Ar Comprimido">Carabina de Ar Comprimido</option>
                  <option value="Pistola de Ar Comprimido">Pistola de Ar Comprimido / PCP</option>
                </select>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
                MARCA / FABRICANTE *
              </label>
              <input
                required
                className="input-field"
                placeholder="Ex: Glock, Taurus, Rossi..."
                value={marcaArma}
                onChange={e => setMarcaArma(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
                MODELO *
              </label>
              <input
                required
                className="input-field"
                placeholder="Ex: G17 Gen5, RT 857, T4..."
                value={modeloArma}
                onChange={e => setModeloArma(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
                CALIBRE *
              </label>
              <input
                required
                className="input-field"
                placeholder={categoriaArma === 'Arma de Fogo' ? "Ex: 9mm, .38 SPL, 5.56" : "Ex: 5.5mm (.22), 4.5mm"}
                value={calibreArma}
                onChange={e => setCalibreArma(e.target.value)}
              />
            </div>
          </div>

          {/* NÚMERO DE SÉRIE */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
              NÚMERO DE SÉRIE DA ARMA *
            </label>
            <input
              required
              className="input-field"
              placeholder="Digite o N° de Série exato impresso na arma..."
              value={numeroSerieArma}
              onChange={e => setNumeroSerieArma(e.target.value)}
              style={{ fontWeight: '700', letterSpacing: '0.5px' }}
            />
          </div>

          {/* CHECKBOX PARA REGISTRAR NO ACERVO DO CLIENTE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-card)', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <input
              type="checkbox"
              id="chk-salvar-acervo"
              checked={salvarNoAcervo}
              onChange={e => setSalvarNoAcervo(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="chk-salvar-acervo" style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-main)', cursor: 'pointer' }}>
              💾 Salvar esta arma no Acervo permanente do Cliente para futuras entradas
            </label>
          </div>

          {/* GUIA DE TRÁFEGO DE MANUTENÇÃO (GT) - APENAS PARA ARMA DE FOGO */}
          {categoriaArma === 'Arma de Fogo' && (
            <div style={{ backgroundColor: 'rgba(139, 38, 42, 0.12)', border: '1px solid rgba(139, 38, 42, 0.3)', padding: '0.85rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--red-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={16} />
                <span>GUIA DE TRÁFEGO DE MANUTENÇÃO (OBRIGATÓRIO PARA ARMA DE FOGO)</span>
              </div>

              <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>NÚMERO DA GT *</label>
                  <input
                    required
                    className="input-field"
                    placeholder="Ex: GT-2026.07.12.9982"
                    value={gtProtocolo}
                    onChange={e => setGtProtocolo(e.target.value)}
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>EMISSÃO GT</label>
                  <input
                    type="date"
                    className="input-field"
                    value={gtDataEmissao}
                    onChange={e => setGtDataEmissao(e.target.value)}
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>VENCIMENTO GT</label>
                  <input
                    type="date"
                    className="input-field"
                    value={gtDataVencimento}
                    onChange={e => setGtDataVencimento(e.target.value)}
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* PROBLEMA RELATADO PELO CLIENTE */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
              PROBLEMA RELATADO PELO CLIENTE / SERVIÇO SOLICITADO *
            </label>
            <textarea
              required
              rows={3}
              className="input-field"
              placeholder="Descreva detalhadamente a falha relatada (ex: falha de ejeção, alívio de gatilho, troca de retentor, polimento...)"
              value={problemaRelatado}
              onChange={e => setProblemaRelatado(e.target.value)}
            />
          </div>

          {/* CHECKLIST DE ACESSÓRIOS ACOMPANHANTES */}
          <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--gold-accent)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Package size={16} />
              <span>CHECKLIST DE ENTRADA: ACESSÓRIOS ACOMPANHANTES</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>Carregadores:</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  className="input-field"
                  style={{ width: '60px', padding: '0.2rem 0.4rem', textAlign: 'center' }}
                  value={qtdCarregadores}
                  onChange={e => setQtdCarregadores(parseInt(e.target.value) || 0)}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={temCaseRigido} onChange={e => setTemCaseRigido(e.target.checked)} />
                <span>Maleta/Case Rígido</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={temLunetaRedDot} onChange={e => setTemLunetaRedDot(e.target.checked)} />
                <span>Óptica (Red Dot / Luneta)</span>
              </label>
            </div>

            {temLunetaRedDot && (
              <input
                className="input-field"
                placeholder="Especifique a óptica (Ex: Red Dot Holosun 507c, Luneta Rossi 4x32...)"
                value={descricaoLuneta}
                onChange={e => setDescricaoLuneta(e.target.value)}
                style={{ fontSize: '0.78rem' }}
              />
            )}

            <input
              className="input-field"
              placeholder="Outros acessórios adicionais (Ex: abafador, coronha sobressalente, kit limpeza...)"
              value={acessoriosAdicionais}
              onChange={e => setAcessoriosAdicionais(e.target.value)}
              style={{ fontSize: '0.78rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-red">
              <CheckCircle2 size={18} />
              <span>REGISTRAR ENTRADA O.S.</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
