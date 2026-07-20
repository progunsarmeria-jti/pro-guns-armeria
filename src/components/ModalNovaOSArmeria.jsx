import React, { useState, useEffect } from 'react'
import { X, Shield, Crosshair, AlertCircle, Calendar, FileText, CheckCircle2, Info, Package, BookmarkCheck, Plus, AlertTriangle } from 'lucide-react'
import { dbUpsert } from '../lib/supabase'
import { registrarLog } from '../lib/auditLogger'
import CustomSelect from './CustomSelect'
import { CATEGORIAS_BASE, TIPOS_BASE, ORGAOS_REGISTRO_BASE, CALIBRES_BASE, FABRICANTES_BASE, MODELOS_BASE } from '../lib/initialData'

export default function ModalNovaOSArmeria({
  clienteInicial,
  clientes = [],
  ordens = [],
  setOrdens,
  armas = [],
  setArmas,
  armaInicial = null,
  setLogs,
  usuarioLogado,
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

  // Listas Dinâmicas de Opções (com opções base importadas do Portal G-CAC)
  const [listMarcas, setListMarcas] = useState(FABRICANTES_BASE)
  const [listModelos, setListModelos] = useState(MODELOS_BASE)
  const [listCalibres, setListCalibres] = useState(CALIBRES_BASE)

  // Categoria da Arma ('Arma de Fogo' | 'Arma de Ar Comprimido' | 'Outros')
  const [categoriaArma, setCategoriaArma] = useState('')

  // Tipo ('Pistola' | 'Carabina/Fuzil' | 'Espingarda' | 'Revólver' | 'Outros')
  const [tipoArma, setTipoArma] = useState('')
  const [customTipo, setCustomTipo] = useState('')

  // Marca / Fabricante
  const [marcaArma, setMarcaArma] = useState('')
  const [customMarcaInput, setCustomMarcaInput] = useState('')

  // Modelo
  const [modeloArma, setModeloArma] = useState('')
  const [customModeloInput, setCustomModeloInput] = useState('')

  // Calibre
  const [calibreArma, setCalibreArma] = useState('')
  const [customCalibreInput, setCustomCalibreInput] = useState('')

  // Órgão de Registro ('SINARM' | 'SIGMA' | 'Não requer registro')
  const [orgaoRegistro, setOrgaoRegistro] = useState('SIGMA')

  // Avisos de Duplicidade
  const [avisoDuplicidade, setAvisoDuplicidade] = useState('')

  // Número de Série
  const [numeroSerieArma, setNumeroSerieArma] = useState('')

  // Problema Relatado
  const [problemaRelatado, setProblemaRelatado] = useState('')

  // ACESSÓRIOS ACOMPANHANTES
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
      setCategoriaArma(arma.categoria || 'Arma de Fogo')
      setTipoArma(arma.tipo || 'Pistola')
      setMarcaArma(arma.marca ? arma.marca.toUpperCase() : 'GLOCK')
      setModeloArma(arma.modelo || 'G17 Gen5')
      setCalibreArma(arma.calibre || '9mm LUGER')
      setNumeroSerieArma(arma.numero_serie || '')
      if (arma.orgao_registro) setOrgaoRegistro(arma.orgao_registro)
    }
  }

  useEffect(() => {
    if (armaInicial?.id) {
      handleSelecionarArmaAcervo(armaInicial.id)
    }
  }, [armaInicial])

  // --- VERIFICADOR DE DUPLICIDADE E CADASTRO DE NOVOS ITENS ---
  const handleAddMarcaCustom = () => {
    const val = customMarcaInput.trim().toUpperCase()
    if (!val) return
    const jaExiste = listMarcas.find(m => m.toUpperCase() === val)
    if (jaExiste) {
      setAvisoDuplicidade(`⚠️ A marca "${jaExiste}" já existe na lista e foi selecionada!`)
      setMarcaArma(jaExiste)
      setCustomMarcaInput('')
    } else {
      setListMarcas(prev => [...prev, val])
      setMarcaArma(val)
      setCustomMarcaInput('')
      setAvisoDuplicidade(`✅ Nova marca "${val}" adicionada à lista com sucesso!`)
    }
    setTimeout(() => setAvisoDuplicidade(''), 4000)
  }

  const handleAddModeloCustom = () => {
    const val = customModeloInput.trim().toUpperCase()
    if (!val) return
    const jaExiste = listModelos.find(m => m.toUpperCase() === val)
    if (jaExiste) {
      setAvisoDuplicidade(`⚠️ O modelo "${jaExiste}" já existe na lista e foi selecionado!`)
      setModeloArma(jaExiste)
      setCustomModeloInput('')
    } else {
      setListModelos(prev => [...prev, val])
      setModeloArma(val)
      setCustomModeloInput('')
      setAvisoDuplicidade(`✅ Novo modelo "${val}" adicionado à lista com sucesso!`)
    }
    setTimeout(() => setAvisoDuplicidade(''), 4000)
  }

  const handleAddCalibreCustom = () => {
    const val = customCalibreInput.trim()
    if (!val) return
    const jaExiste = listCalibres.find(c => c.toLowerCase() === val.toLowerCase())
    if (jaExiste) {
      setAvisoDuplicidade(`⚠️ O calibre "${jaExiste}" já existe na lista e foi selecionado!`)
      setCalibreArma(jaExiste)
      setCustomCalibreInput('')
    } else {
      setListCalibres(prev => [...prev, val])
      setCalibreArma(val)
      setCustomCalibreInput('')
      setAvisoDuplicidade(`✅ Novo calibre "${val}" adicionado à lista com sucesso!`)
    }
    setTimeout(() => setAvisoDuplicidade(''), 4000)
  }

  const handleSalvarEntradaOS = (e) => {
    e.preventDefault()

    const marcaFinal = marcaArma === '__NOVA__' ? (customMarcaInput.trim().toUpperCase() || 'DESCONHECIDA') : marcaArma
    const modeloFinal = modeloArma === '__NOVO__' ? (customModeloInput.trim().toUpperCase() || 'DESCONHECIDO') : modeloArma
    const calibreFinal = calibreArma === '__NOVO__' ? (customCalibreInput.trim() || 'DESCONHECIDO') : calibreArma
    const tipoFinal = tipoArma === 'Outros' ? (customTipo.trim() || 'Outros') : tipoArma

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
      tipo_arma: tipoFinal,
      marca_arma: marcaFinal,
      modelo_arma: modeloFinal,
      calibre_arma: calibreFinal,
      numero_serie_arma: numeroSerieArma,
      problema_relatado: problemaRelatado || 'Manutenção geral solicitada.',
      acessorios_acompanhantes: acessoriosFormatados,
      gt_protocolo: categoriaArma === 'Arma de Fogo' ? gtProtocolo : 'N/A (Ar Comprimido)',
      gt_data_emissao: categoriaArma === 'Arma de Fogo' ? gtDataEmissao : null,
      gt_data_vencimento: categoriaArma === 'Arma de Fogo' ? gtDataVencimento : null,
      tipo_servico: `Manutenção ${tipoFinal} ${marcaFinal}`,
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
        tipo: tipoFinal,
        marca: marcaFinal,
        modelo: modeloFinal,
        calibre: calibreFinal,
        numero_serie: numeroSerieArma,
        numero_sigma_sinarm: categoriaArma === 'Arma de Fogo' ? (orgaoRegistro === 'SIGMA' ? 'SIGMA' : 'SINARM') : 'N/A',
        orgao_registro: orgaoRegistro,
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
    registrarLog({
      usuario: usuarioLogado,
      acao: 'ENTRADA DE O.S.',
      descricao: `Entrada da OS #${novaOSObj.numero_os} registrada para o cliente ${novaOSObj.cliente_nome} (${marcaFinal} ${modeloFinal}).`,
      osId: novaOSObj.id,
      osNumero: novaOSObj.numero_os,
      setLogs
    })
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
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Check-in de Entrada com Catálogo Oficial da Armeria e Verificador de Duplicidade</div>
          </div>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {avisoDuplicidade && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: avisoDuplicidade.includes('⚠️') ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)', border: avisoDuplicidade.includes('⚠️') ? '1px solid #FBBF24' : '1px solid #34D399', color: '#FFF', fontWeight: '700', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {avisoDuplicidade}
          </div>
        )}

        <form onSubmit={handleSalvarEntradaOS} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* DADOS DO CLIENTE */}
          <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
              CLIENTE REQUERENTE
            </label>
            {!clienteInicial && clientes && clientes.length > 0 ? (
              <CustomSelect
                label=""
                value={
                  clienteAtual
                    ? `${clienteAtual.nome_completo.toUpperCase()} (${clienteAtual.cpf}) - CR: ${clienteAtual.numero_cr || 'Sem CR'}`
                    : ''
                }
                onChange={val => {
                  const c = clientes.find(item => `${item.nome_completo.toUpperCase()} (${item.cpf}) - CR: ${item.numero_cr || 'Sem CR'}` === val)
                  if (c) {
                    setClienteId(c.id)
                    setArmaSelecionadaId('')
                  }
                }}
                options={clientes.map(c => `${c.nome_completo.toUpperCase()} (${c.cpf}) - CR: ${c.numero_cr || 'Sem CR'}`)}
                placeholder="Selecione o Cliente..."
                allowCustom={false}
              />
            ) : (
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
                {clienteAtual.nome_completo.toUpperCase()} — CPF: {clienteAtual.cpf} — CR: {clienteAtual.numero_cr || 'N/A'}
              </div>
            )}
          </div>

          {/* SELETOR DE ARMA DO ACERVO DO CLIENTE */}
          {armasDoCliente.length > 0 && (
            <div style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', padding: '0.85rem', borderRadius: '8px' }}>
              <CustomSelect
                label="🎯 SELECIONAR ARMA JÁ CADASTRADA NO ACERVO DO CLIENTE"
                value={
                  armaSelecionadaId
                    ? (() => {
                        const a = armasDoCliente.find(item => item.id === armaSelecionadaId)
                        return a ? `${a.marca} ${a.modelo} (${a.calibre}) - SÉRIE: ${a.numero_serie}`.toUpperCase() : ''
                      })()
                    : ''
                }
                onChange={val => {
                  const a = armasDoCliente.find(item => `${item.marca} ${item.modelo} (${item.calibre}) - SÉRIE: ${item.numero_serie}`.toUpperCase() === val.toUpperCase())
                  if (a) {
                    handleSelecionarArmaAcervo(a.id)
                  } else {
                    handleSelecionarArmaAcervo('')
                  }
                }}
                options={armasDoCliente.map(a => `${a.marca} ${a.modelo} (${a.calibre}) - SÉRIE: ${a.numero_serie}`.toUpperCase())}
                placeholder="-- SELECIONAR ARMA DO ACERVO OU PREENCHER MANUALMENTE --"
                allowCustom={false}
              />
            </div>
          )}

          {/* 1. SELEÇÃO DA CATEGORIA DA ARMA */}
          <CustomSelect
            label="CATEGORIA *"
            value={categoriaArma}
            onChange={val => setCategoriaArma(val)}
            options={CATEGORIAS_BASE}
            placeholder="Selecione a Categoria..."
            allowCustom={false}
          />

          {/* 2. DADOS DA ARMA (GRID COM SELEÇÃO DE MARCA, MODELO, CALIBRE E TIPO) */}
          <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* TIPO */}
            <CustomSelect
              label="TIPO *"
              value={tipoArma}
              onChange={val => setTipoArma(val)}
              options={TIPOS_BASE}
              placeholder="Selecione o Tipo..."
              allowCustom={false}
            />

            {/* MARCA / FABRICANTE (LISTA DO PORTAL G-CAC) */}
            <CustomSelect
              label="MARCA / FABRICANTE *"
              value={marcaArma}
              onChange={val => setMarcaArma(val)}
              onAddCustom={newVal => {
                const val = newVal.trim().toUpperCase()
                if (!val) return
                const jaExiste = listMarcas.find(m => m.toUpperCase() === val)
                if (jaExiste) {
                  setAvisoDuplicidade(`⚠️ A marca "${jaExiste}" já existe na lista e foi selecionada!`)
                  setMarcaArma(jaExiste)
                } else {
                  setListMarcas(prev => [...prev, val])
                  setMarcaArma(val)
                  setAvisoDuplicidade(`✅ Nova marca "${val}" adicionada à lista!`)
                }
                setTimeout(() => setAvisoDuplicidade(''), 4000)
              }}
              options={listMarcas}
              placeholder="Selecione a Marca..."
              customLabel="+ Cadastrar Nova Marca..."
            />

            {/* MODELO (LISTA DO PORTAL G-CAC) */}
            <CustomSelect
              label="MODELO *"
              value={modeloArma}
              onChange={val => setModeloArma(val)}
              onAddCustom={newVal => {
                const val = newVal.trim().toUpperCase()
                if (!val) return
                const jaExiste = listModelos.find(m => m.toUpperCase() === val)
                if (jaExiste) {
                  setAvisoDuplicidade(`⚠️ O modelo "${jaExiste}" já existe na lista e foi selecionado!`)
                  setModeloArma(jaExiste)
                } else {
                  setListModelos(prev => [...prev, val])
                  setModeloArma(val)
                  setAvisoDuplicidade(`✅ Novo modelo "${val}" adicionado à lista!`)
                }
                setTimeout(() => setAvisoDuplicidade(''), 4000)
              }}
              options={listModelos}
              placeholder="Selecione o Modelo..."
              customLabel="+ Cadastrar Novo Modelo..."
            />

            {/* CALIBRE (LISTA DO PORTAL G-CAC) */}
            <CustomSelect
              label="CALIBRE *"
              value={calibreArma}
              onChange={val => setCalibreArma(val)}
              onAddCustom={newVal => {
                const val = newVal.trim()
                if (!val) return
                const jaExiste = listCalibres.find(c => c.toLowerCase() === val.toLowerCase())
                if (jaExiste) {
                  setAvisoDuplicidade(`⚠️ O calibre "${jaExiste}" já existe na lista e foi selecionado!`)
                  setCalibreArma(jaExiste)
                } else {
                  setListCalibres(prev => [...prev, val])
                  setCalibreArma(val)
                  setAvisoDuplicidade(`✅ Novo calibre "${val}" adicionado à lista!`)
                }
                setTimeout(() => setAvisoDuplicidade(''), 4000)
              }}
              options={listCalibres}
              placeholder="Selecione o Calibre..."
              customLabel="+ Cadastrar Novo Calibre..."
            />
          </div>

          {/* NÚMERO DE SÉRIE E ÓRGÃO DE REGISTRO */}
          <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
                NÚMERO DE SÉRIE DA ARMA *
              </label>
              <input
                required
                className="input-field"
                placeholder="Digite o N° de Série impresso na arma..."
                value={numeroSerieArma}
                onChange={e => setNumeroSerieArma(e.target.value)}
                style={{ fontWeight: '700', letterSpacing: '0.5px' }}
              />
            </div>

            <div>
              <CustomSelect
                label="ÓRGÃO DE REGISTRO"
                value={orgaoRegistro}
                onChange={val => setOrgaoRegistro(val)}
                options={ORGAOS_REGISTRO_BASE}
                placeholder="Selecione o Órgão..."
                allowCustom={false}
              />
            </div>
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
