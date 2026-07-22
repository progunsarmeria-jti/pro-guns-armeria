import React, { useState, useEffect } from 'react'
import { X, Shield, Crosshair, AlertCircle, Calendar, FileText, CheckCircle2, Info, Package, BookmarkCheck, Plus, AlertTriangle, UserPlus, Search, UploadCloud, Camera, Loader } from 'lucide-react'
import { dbUpsert, isSupabaseConfigured, getSupabaseClient, uploadGTFile } from '../lib/supabase'
import { registrarLog } from '../lib/auditLogger'
import { hojeISO } from '../lib/dates'
import CustomSelect from './CustomSelect'
import { CATEGORIAS_BASE, TIPOS_BASE, ORGAOS_REGISTRO_BASE, CALIBRES_BASE, FABRICANTES_BASE, MODELOS_BASE } from '../lib/initialData'

export default function ModalNovaOSArmeria({
  clienteInicial = null,
  clientes = [],
  setClientes,
  ordens = [],
  setOrdens,
  armas = [],
  setArmas,
  armaInicial = null,
  setLogs,
  usuarioLogado,
  onClose
}) {
  // Se houver clienteInicial, usa ele; senão inicia vazio sem nenhum cliente pré-selecionado
  const [clienteId, setClienteId] = useState(clienteInicial?.id || '')

  const clienteAtual = (clientes || []).find(c => String(c.id) === String(clienteId)) || clienteInicial || null

  // Cadastro Rápido de Novo Cliente Inline
  const [showNovoClienteForm, setShowNovoClienteForm] = useState(false)
  const [novoClienteData, setNovoClienteData] = useState({
    nome_completo: '',
    cpf: '',
    telefone: '',
    numero_cr: ''
  })

  // Lista de armas no acervo deste cliente
  const armasDoCliente = clienteAtual ? (armas || []).filter(a => String(a.cliente_id) === String(clienteAtual.id)) : []
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

  // Avisos de Duplicidade / Sucesso
  const [avisoDuplicidade, setAvisoDuplicidade] = useState('')

  // Número de Série
  const [numeroSerieArma, setNumeroSerieArma] = useState('')

  // Problema Relatado
  const [problemaRelatado, setProblemaRelatado] = useState('')

  // ACESSÓRIOS ACOMPANHANTES (CHECKLIST)
  const [temCarregadores, setTemCarregadores] = useState(false)
  const [qtdCarregadores, setQtdCarregadores] = useState(1)
  const [temCase, setTemCase] = useState(false)
  const [temLunetaRedDot, setTemLunetaRedDot] = useState(false)
  const [descricaoLuneta, setDescricaoLuneta] = useState('')
  const [acessoriosAdicionais, setAcessoriosAdicionais] = useState('')

  const [gtProtocolo, setGtProtocolo] = useState('')
  const [gtDataEmissao, setGtDataEmissao] = useState(hojeISO())
  const [gtDataVencimento, setGtDataVencimento] = useState('')
  const [gtAnexoUrl, setGtAnexoUrl] = useState('')
  const [sessionId] = useState(() => `gt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`)
  const [showQrModal, setShowQrModal] = useState(false)
  const [subindoArquivo, setSubindoArquivo] = useState(false)

  useEffect(() => {
    if (!showQrModal || !sessionId) return
    const client = getSupabaseClient()
    if (!client) return

    const channelName = `upload_gt_${sessionId}`
    const channel = client.channel(channelName)
      .on('broadcast', { event: 'file_uploaded' }, ({ payload }) => {
        if (payload?.url) {
          setGtAnexoUrl(payload.url)
          setShowQrModal(false)
          alert('Foto da Guia de Tráfego recebida e anexada com sucesso!')
        }
      })
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  }, [showQrModal, sessionId])

  // Handler para cadastrar novo cliente diretamente pela tela de Entrada de O.S.
  const handleCadastrarNovoCliente = (e) => {
    if (e) e.preventDefault()
    if (!novoClienteData.nome_completo || !novoClienteData.cpf) {
      alert('Por favor, informe pelo menos o Nome Completo e o CPF do cliente!')
      return
    }

    const novoCliente = {
      id: `c_${Date.now()}`,
      nome_completo: novoClienteData.nome_completo.trim().toUpperCase(),
      cpf: novoClienteData.cpf.trim(),
      telefone: novoClienteData.telefone.trim(),
      numero_cr: novoClienteData.numero_cr.trim(),
      status: 'Ativo',
      created_at: hojeISO()
    }

    if (typeof setClientes === 'function') {
      setClientes(prev => [novoCliente, ...prev])
    }
    dbUpsert('clientes', novoCliente)

    setClienteId(novoCliente.id)
    setShowNovoClienteForm(false)
    setNovoClienteData({ nome_completo: '', cpf: '', telefone: '', numero_cr: '' })
    setAvisoDuplicidade(`✅ Cliente "${novoCliente.nome_completo}" cadastrado e selecionado com sucesso!`)
    setTimeout(() => setAvisoDuplicidade(''), 4000)
  }

  // Seleção de Arma do Acervo -> Auto-preenche os dados
  const handleSelecionarArmaAcervo = (armaId) => {
    setArmaSelecionadaId(armaId)
    if (!armaId) return

    const arma = armasDoCliente.find(a => String(a.id) === String(armaId))
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

  const handleSalvarEntradaOS = (e) => {
    e.preventDefault()

    if (!clienteAtual) {
      alert('Por favor, selecione ou cadastre o Cliente Requerente antes de registrar a O.S.!')
      return
    }

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
      temCarregadores ? `${qtdCarregadores} carregador(es)` : null,
      temCase ? 'Maleta / Case' : null,
      temLunetaRedDot ? `Óptica: ${descricaoLuneta || 'Red Dot / Luneta'}` : null,
      acessoriosAdicionais ? `Outros: ${acessoriosAdicionais}` : null
    ].filter(Boolean).join(' | ') || 'Nenhum acessório acompanhante'

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
      gt_anexo_url: categoriaArma === 'Arma de Fogo' ? gtAnexoUrl : null,
      tipo_servico: `Manutenção ${tipoFinal} ${marcaFinal}`,
      valor_servico: 0,
      valor_taxamento: 0,
      status: 'NÃO INICIADO',
      created_at: new Date().toISOString()
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
        created_at: hojeISO()
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
          <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                CLIENTE REQUERENTE *
              </label>
              {!clienteInicial && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: 'var(--gold-primary)', borderColor: 'var(--gold-primary)' }}
                  onClick={() => setShowNovoClienteForm(!showNovoClienteForm)}
                >
                  <UserPlus size={14} />
                  <span>{showNovoClienteForm ? 'Cancelar Cadastro' : '+ Cadastrar Novo Cliente'}</span>
                </button>
              )}
            </div>

            {/* Formulário Inline de Cadastro Rápido de Novo Cliente */}
            {showNovoClienteForm && (
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--gold-primary)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <UserPlus size={16} /> Cadastro Rápido de Cliente Requerente
                </div>
                <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Nome Completo *</label>
                    <input
                      required
                      className="input-field"
                      placeholder="Nome Completo..."
                      value={novoClienteData.nome_completo}
                      onChange={e => setNovoClienteData({ ...novoClienteData, nome_completo: e.target.value })}
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CPF *</label>
                    <input
                      required
                      className="input-field"
                      placeholder="000.000.000-00"
                      value={novoClienteData.cpf}
                      onChange={e => setNovoClienteData({ ...novoClienteData, cpf: e.target.value })}
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Telefone / WhatsApp</label>
                    <input
                      className="input-field"
                      placeholder="(00) 00000-0000"
                      value={novoClienteData.telefone}
                      onChange={e => setNovoClienteData({ ...novoClienteData, telefone: e.target.value })}
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>N° CR (Se houver)</label>
                    <input
                      className="input-field"
                      placeholder="Ex: 123456/2ª RM"
                      value={novoClienteData.numero_cr}
                      onChange={e => setNovoClienteData({ ...novoClienteData, numero_cr: e.target.value })}
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-gold"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                    onClick={handleCadastrarNovoCliente}
                  >
                    <CheckCircle2 size={14} /> Salvar e Selecionar Cliente
                  </button>
                </div>
              </div>
            )}

            {!clienteInicial ? (
              <div>
                <CustomSelect
                  label=""
                  value={
                    clienteAtual
                      ? `${clienteAtual.nome_completo.toUpperCase()} (${clienteAtual.cpf}) - CR: ${clienteAtual.numero_cr || 'Sem CR'}`
                      : ''
                  }
                  onChange={val => {
                    const c = (clientes || []).find(item => `${item.nome_completo.toUpperCase()} (${item.cpf}) - CR: ${item.numero_cr || 'Sem CR'}` === val)
                    if (c) {
                      setClienteId(c.id)
                      setArmaSelecionadaId('')
                    } else {
                      setClienteId('')
                    }
                  }}
                  options={(clientes || []).map(c => `${c.nome_completo.toUpperCase()} (${c.cpf}) - CR: ${c.numero_cr || 'Sem CR'}`)}
                  placeholder="🔍 Pesquisar e Selecionar Cliente..."
                  allowCustom={false}
                />
                {!clienteAtual && (
                  <div style={{ fontSize: '0.78rem', color: '#F87171', marginTop: '0.3rem', fontWeight: '600' }}>
                    ⚠️ Nenhum cliente selecionado. Pesquise na lista acima ou clique em "+ Cadastrar Novo Cliente".
                  </div>
                )}
              </div>
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
                        const a = armasDoCliente.find(item => String(item.id) === String(armaSelecionadaId))
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

              {/* Controles de Anexo da Guia */}
              <div style={{ borderTop: '1px solid rgba(139, 38, 42, 0.2)', paddingTop: '0.6rem', marginTop: '0.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>ANEXAR DOCUMENTO DA GUIA (PDF OU FOTO)</label>
                
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {/* Botão de Upload Local */}
                  <label className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', margin: 0 }}>
                    <UploadCloud size={14} />
                    <span>{subindoArquivo ? 'Enviando...' : 'Anexar PDF / Foto local'}</span>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0]
                        if (!file) return
                        setSubindoArquivo(true)
                        try {
                          const ext = file.name.split('.').pop() || 'png'
                          const fName = `${sessionId}_local_${Date.now()}.${ext}`
                          const publicUrl = await uploadGTFile(file, fName)
                          if (publicUrl) {
                            setGtAnexoUrl(publicUrl)
                            alert('Documento anexado com sucesso!')
                          } else {
                            alert('Erro ao anexar arquivo.')
                          }
                        } catch (err) {
                          console.error(err)
                          alert('Erro ao anexar arquivo.')
                        } finally {
                          setSubindoArquivo(false)
                        }
                      }}
                      style={{ display: 'none' }}
                      disabled={subindoArquivo}
                    />
                  </label>

                  {/* Botão de QR Code Celular */}
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowQrModal(true)}
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Camera size={14} />
                    <span>Tirar Foto com o Celular (QR Code)</span>
                  </button>
                </div>

                {/* Exibição do Arquivo Anexado */}
                {gtAnexoUrl && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    marginTop: '0.2rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      <FileText size={15} color="#10B981" />
                      <a href={gtAnexoUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60A5FA', textDecoration: 'underline', fontWeight: '600' }}>
                        Visualizar Guia Anexada
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGtAnexoUrl('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: '700'
                      }}
                    >
                      Remover
                    </button>
                  </div>
                )}
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

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem', alignItems: 'center', fontSize: '0.78rem' }}>
              {/* Opção 1: Carregadores */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: '600' }}>
                  <input
                    type="checkbox"
                    checked={temCarregadores}
                    onChange={e => setTemCarregadores(e.target.checked)}
                  />
                  <span>Carregadores</span>
                </label>

                {temCarregadores && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.2rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Qtd:</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="input-field"
                      style={{ width: '55px', padding: '0.15rem 0.35rem', textAlign: 'center', fontSize: '0.8rem' }}
                      value={qtdCarregadores}
                      onChange={e => setQtdCarregadores(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                )}
              </div>

              {/* Opção 2: Maleta / Case */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: '600' }}>
                <input
                  type="checkbox"
                  checked={temCase}
                  onChange={e => setTemCase(e.target.checked)}
                />
                <span>Maleta / Case</span>
              </label>

              {/* Opção 3: Óptica (Red Dot / Luneta) */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: '600' }}>
                <input
                  type="checkbox"
                  checked={temLunetaRedDot}
                  onChange={e => setTemLunetaRedDot(e.target.checked)}
                />
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

      {/* Modal QR Code Celular */}
      {showQrModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <div className="card" style={{ padding: '1.5rem', width: '90%', maxWidth: '340px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>Digitalizar com Celular</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Aponte a câmera do seu celular para o QR Code abaixo para abrir a câmera móvel e tirar a foto da guia.
            </p>
            
            {/* QR Code Container */}
            <div style={{
              padding: '0.5rem',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `${window.location.origin}${window.location.pathname}?action=upload_gt&session_id=${sessionId}`
                )}`}
                alt="QR Code de Digitalização"
                style={{ width: '180px', height: '180px' }}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--gold-accent)' }}>
              <Loader size={12} style={{ animation: 'spin 1.5s linear infinite' }} />
              <span>Aguardando envio do celular...</span>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowQrModal(false)}
              style={{ width: '100%', padding: '0.35rem 0', fontSize: '0.78rem' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
