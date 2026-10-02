import React, { useState, useMemo } from 'react'
import { hojeISO, formatarData } from '../lib/dates'
import {
  ShoppingCart,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  Trash2,
  DollarSign,
  Printer,
  MessageCircle,
  X,
  Package,
  FileText,
  User,
  ArrowRight,
  Lock,
  Tag,
  Sparkles,
  Target,
  Wrench,
  Droplets,
  RotateCcw,
  Shield,
  FileCheck,
  Clock,
  AlertTriangle,
  Layers,
  ExternalLink,
  Info,
  Calendar,
  Check
} from 'lucide-react'
import CustomSelect from './CustomSelect'
import { formatarMoeda } from '../lib/masks'
import { dbUpsert, dbDelete, isSupabaseConfigured } from '../lib/supabase'
import { registrarLog } from '../lib/auditLogger'

export default function ModuloVendas({
  vendas = [],
  setVendas,
  estoque = [],
  setEstoque,
  armas = [],
  setArmas,
  caixas = [],
  setCaixas,
  financeiro = [],
  setFinanceiro,
  clientes = [],
  usuarioLogado,
  setLogs,
  config
}) {
  const [busca, setBusca] = useState('')
  const [modalNovaVenda, setModalNovaVenda] = useState(false)
  const [reciboModalVenda, setReciboModalVenda] = useState(null)
  const [modalExcluirVenda, setModalExcluirVenda] = useState(null)
  const [senhaMasterInput, setSenhaMasterInput] = useState('')
  const [erroSenhaMaster, setErroSenhaMaster] = useState('')

  // Controle de Filtros e Trâmites Regulatórios
  const [abaFiltroVendas, setAbaFiltroVendas] = useState('TODAS') // 'TODAS' | 'TRAMITE_ARMA' | 'MUNICAO' | 'CONCLUIDAS'
  const [modalTramiteVenda, setModalTramiteVenda] = useState(null)
  const [tipoDocumentoRecibo, setTipoDocumentoRecibo] = useState('AUTO') // 'AUTO' | 'PROPOSTA_PF' | 'RECIBO_PAGAMENTO' | 'MUNICHOES_SICOVEM' | 'TERMO_ENTREGA'
  const [dadosMunicaoForm, setDadosMunicaoForm] = useState({
    numero_craf: '',
    orgao_emissor: 'SINARM',
    validade_craf: '',
    calibre_craf: '',
    arma_acervo_id: '',
    observacoes_guia: ''
  })
  const [dadosTramiteForm, setDadosTramiteForm] = useState({
    autorizacao_compra_numero: '',
    autorizacao_compra_data: '',
    autorizacao_orgao: 'SINARM',
    nfe_numero: '',
    nfe_serie: '1',
    nfe_chave: '',
    nfe_data_emissao: '',
    craf_definitivo_numero: '',
    craf_definitivo_validade: '',
    data_entrega_arma: '',
    responsavel_entrega: '',
    observacoes: ''
  })

  // Form State Nova Venda
  const [clienteSelecionado, setClienteSelecionado] = useState('CLIENTE AVULSO / BALCÃO')
  const [carrinho, setCarrinho] = useState([])
  const [categoriaAtivaPDV, setCategoriaAtivaPDV] = useState('TODAS')
  const [buscaCatalogo, setBuscaCatalogo] = useState('')
  const [descontoVenda, setDescontoVenda] = useState(0)
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro')
  const [valorPagoCliente, setValorPagoCliente] = useState('')

  // ── CLASSIFICADORES INTELIGENTES DE PRODUTOS REGULADOS & SERIALIZADOS ──────
  const isItemArmaDeFogo = (item) => {
    if (!item) return false
    if (item.tipo_estoque === 'ARMA') return true
    const cat = (item.categoria || '').toUpperCase()
    const nome = (item.nome || '').toUpperCase()
    if (cat.includes('PRESSÃO') || cat.includes('PRESSAO') || cat.includes('PCP') || cat.includes('AIRSOFT')) return false
    if (nome.includes('PRESSÃO') || nome.includes('PRESSAO') || nome.includes('PCP') || nome.includes('AIRSOFT') || nome.includes('CHUMBINHO')) return false
    if (cat.includes('ARMA DE FOGO') || cat === 'ARMAS DE FOGO' || cat === 'ARMA') return true
    return !!(item.tipo_arma && item.numero_serie && item.calibre)
  }

  const isItemMunicao = (item) => {
    if (!item) return false
    if (item.tipo_estoque === 'MUNICAO') return true
    const cat = (item.categoria || '').toUpperCase()
    const nome = (item.nome || '').toUpperCase()
    if (nome.includes('CHUMBINHO') || cat.includes('CHUMBINHO')) return false
    return cat.includes('MUNI') || nome.includes('MUNIÇÃO') || nome.includes('CARTUCHO') || !!item.lote_fabricante
  }

  const isItemSerializado = (item) => {
    return !!(item && item.numero_serie && String(item.numero_serie).trim().length > 0)
  }

  const clienteSelecionadoObj = useMemo(() => {
    if (!clienteSelecionado || clienteSelecionado === 'CLIENTE AVULSO / BALCÃO') return null
    return (clientes || []).find(c => c.nome_completo === clienteSelecionado || String(c.id) === String(clienteSelecionado))
  }, [clientes, clienteSelecionado])

  const clienteRecibo = useMemo(() => {
    if (!reciboModalVenda) return null
    return (clientes || []).find(c => 
      (reciboModalVenda.cliente_cpf && c.cpf === reciboModalVenda.cliente_cpf) ||
      c.nome_completo === reciboModalVenda.cliente_nome ||
      String(c.id) === String(reciboModalVenda.cliente_id)
    ) || null
  }, [reciboModalVenda, clientes])

  const temArmaNoRecibo = useMemo(() => {
    if (!reciboModalVenda) return false
    return reciboModalVenda.tipo_venda === 'VENDA_ARMA' || !!reciboModalVenda.dados_tramite_arma || (reciboModalVenda.itens || []).some(isItemArmaDeFogo)
  }, [reciboModalVenda])

  const temMunicaoNoRecibo = useMemo(() => {
    if (!reciboModalVenda) return false
    return reciboModalVenda.tipo_venda === 'VENDA_MUNICAO' || !!reciboModalVenda.dados_regulamento_municao || (reciboModalVenda.itens || []).some(isItemMunicao)
  }, [reciboModalVenda])

  const docReciboAtivo = useMemo(() => {
    if (tipoDocumentoRecibo && tipoDocumentoRecibo !== 'AUTO') return tipoDocumentoRecibo
    if (temArmaNoRecibo) {
      if (reciboModalVenda?.status_tramite_arma === 'ENTREGUE') return 'TERMO_ENTREGA'
      return 'PROPOSTA_PF'
    }
    if (temMunicaoNoRecibo) return 'MUNICHOES_SICOVEM'
    return 'RECIBO_PAGAMENTO'
  }, [tipoDocumentoRecibo, temArmaNoRecibo, temMunicaoNoRecibo, reciboModalVenda])

  // Itens do Estoque Disponíveis (Qtd > 0 e Armas Não Reservadas/Entregues)
  const itensDisponiveis = useMemo(() => {
    return (estoque || []).filter(i => {
      const qtd = parseInt(i.quantidade) || 0
      if (qtd <= 0) return false
      if (i.status_arma && !['DISPONIVEL', 'DISPONÍVEL', ''].includes(i.status_arma)) return false
      return true
    })
  }, [estoque])

  // Métricas do Módulo de Vendas
  const totalVendasCount = (vendas || []).length
  const faturamentoTotalVendas = (vendas || []).reduce((acc, v) => acc + (parseFloat(v.valor_final || v.valor_total) || 0), 0)
  const vendasHoje = (vendas || []).filter(v => v.data === hojeISO())
  const faturamentoHoje = vendasHoje.reduce((acc, v) => acc + (parseFloat(v.valor_final || v.valor_total) || 0), 0)
  const vendasArmasEmTramite = (vendas || []).filter(v => v.tipo_venda === 'VENDA_ARMA' || v.dados_tramite_arma || (v.itens || []).some(isItemArmaDeFogo))
  const vendasMunicao = (vendas || []).filter(v => v.tipo_venda === 'VENDA_MUNICAO' || v.dados_regulamento_municao || (v.itens || []).some(isItemMunicao))

  // ── NORMALIZADOR DE CATEGORIA DO PRODUTO ────────────────────────────────────
  const normalizarCategoria = (item) => {
    if (item.categoria && item.categoria.trim()) {
      const catUpper = item.categoria.trim().toUpperCase()
      if (catUpper.includes('ARMA')) return 'Armas de Fogo'
      if (catUpper.includes('MUNI')) return 'Munições'
      if (catUpper.includes('PEÇA') || catUpper.includes('PECA') || catUpper.includes('COMPONENTE')) return 'Peças & Componentes'
      if (catUpper.includes('LIMP') || catUpper.includes('CONSERV')) return 'Limpeza & Conservação'
      if (catUpper.includes('MIRA') || catUpper.includes('ÓPTIC') || catUpper.includes('OPTIC')) return 'Miras & Ópticas'
      if (catUpper.includes('ACESS') || catUpper.includes('CARREG')) return 'Acessórios & Carregadores'
      if (catUpper.includes('INSUMO')) return 'Insumos'
      return item.categoria.trim()
    }
    if (item.tipo_estoque === 'ARMA') return 'Armas de Fogo'
    if (item.tipo_estoque === 'MUNICAO') return 'Munições'
    if (item.tipo_estoque === 'PECA') return 'Peças & Componentes'
    if (item.tipo_estoque === 'SUPRIMENTO') return 'Limpeza & Conservação'
    return 'Outros'
  }

  // Ícone representativo por categoria
  const getCategoryIcon = (categoria) => {
    const cat = (categoria || '').toUpperCase()
    if (cat.includes('ARMA')) return <Target size={14} color="#F59E0B" />
    if (cat.includes('MUNI')) return <Sparkles size={14} color="#60A5FA" />
    if (cat.includes('PEÇA') || cat.includes('PECA') || cat.includes('COMPONENTE')) return <Wrench size={14} color="#34D399" />
    if (cat.includes('LIMP') || cat.includes('CONSERV')) return <Droplets size={14} color="#A78BFA" />
    if (cat.includes('MIRA') || cat.includes('ÓPTIC') || cat.includes('OPTIC')) return <Search size={14} color="#F472B6" />
    if (cat.includes('ACESS') || cat.includes('CARREG')) return <Package size={14} color="#FBBF24" />
    return <Tag size={14} color="var(--text-muted)" />
  }

  // Categorias únicas presentes com contagem de itens em estoque
  const categoriasComContagem = useMemo(() => {
    const contagem = { 'TODAS': itensDisponiveis.length }
    itensDisponiveis.forEach(item => {
      const cat = normalizarCategoria(item)
      contagem[cat] = (contagem[cat] || 0) + 1
    })
    return contagem
  }, [itensDisponiveis])

  // Lista ordenada de categorias disponíveis
  const listaCategoriasDisponiveis = useMemo(() => {
    const chaves = Object.keys(categoriasComContagem).filter(c => c !== 'TODAS')
    const prioridade = ['Armas de Fogo', 'Munições', 'Peças & Componentes', 'Limpeza & Conservação', 'Miras & Ópticas', 'Acessórios & Carregadores', 'Insumos']
    chaves.sort((a, b) => {
      const idxA = prioridade.indexOf(a)
      const idxB = prioridade.indexOf(b)
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return a.localeCompare(b)
    })
    return ['TODAS', ...chaves]
  }, [categoriasComContagem])

  // Produtos filtrados por categoria e termo de busca
  const produtosFiltradosCatalogo = useMemo(() => {
    const termo = (buscaCatalogo || '').toLowerCase().trim()
    return itensDisponiveis.filter(item => {
      // Filtro por Categoria
      if (categoriaAtivaPDV !== 'TODAS') {
        const catItem = normalizarCategoria(item)
        if (catItem !== categoriaAtivaPDV) return false
      }
      // Filtro de Texto (nome, sku, calibre, fabricante, codigo_barras)
      if (termo) {
        const matchNome = (item.nome || '').toLowerCase().includes(termo)
        const matchSku = (item.codigo_sku || '').toLowerCase().includes(termo)
        const matchCalibre = (item.calibre || '').toLowerCase().includes(termo)
        const matchFab = (item.fabricante || '').toLowerCase().includes(termo)
        const matchBarras = (item.codigo_barras || '').toLowerCase().includes(termo)
        return matchNome || matchSku || matchCalibre || matchFab || matchBarras
      }
      return true
    })
  }, [itensDisponiveis, categoriaAtivaPDV, buscaCatalogo])

  // ── MANIPULAÇÃO DO CARRINHO (COM SERIALIZAÇÃO E CLASSIFICAÇÃO) ────────────
  const handleAdicionarAoCarrinho = (itemEstoque, qtd = 1) => {
    if (!itemEstoque) return
    const isArma = isItemArmaDeFogo(itemEstoque)
    const isSerializado = isItemSerializado(itemEstoque)
    const isMun = isItemMunicao(itemEstoque)

    const itemExistenteNoCarrinho = carrinho.find(c => String(c.item_id) === String(itemEstoque.id))

    if (itemExistenteNoCarrinho) {
      if (isArma || (isSerializado && (parseInt(itemEstoque.quantidade) || 0) <= 1)) {
        alert(`O item (${itemEstoque.nome}${itemEstoque.numero_serie ? ` - Série: ${itemEstoque.numero_serie}` : ''}) já está no carrinho! Cada unidade com número de série possui registro individual único por venda.`)
        return
      }
      const qtdDesejada = parseInt(qtd) || 1
      const qtdEstoqueDisponivel = parseInt(itemEstoque.quantidade) || 0
      const qtdAtualNoCarrinho = itemExistenteNoCarrinho.quantidade

      if (qtdAtualNoCarrinho + qtdDesejada > qtdEstoqueDisponivel) {
        alert(`Quantidade indisponível no estoque! Disponível: ${qtdEstoqueDisponivel} unidade(s).`)
        return
      }

      setCarrinho(prev => prev.map(c => {
        if (String(c.item_id) === String(itemEstoque.id)) {
          const novaQtd = c.quantidade + qtdDesejada
          return {
            ...c,
            quantidade: novaQtd,
            subtotal: novaQtd * (parseFloat(c.preco_unitario) || 0)
          }
        }
        return c
      }))
    } else {
      const precoVenda = parseFloat(itemEstoque.preco_venda) || 0
      const qtdDesejada = parseInt(qtd) || 1
      const catNormalizada = normalizarCategoria(itemEstoque)

      const novoItemCarrinho = {
        item_id: itemEstoque.id,
        sku: itemEstoque.codigo_sku || 'N/A',
        nome: itemEstoque.nome,
        categoria: catNormalizada,
        tipo_estoque: itemEstoque.tipo_estoque || (isArma ? 'ARMA' : isMun ? 'MUNICAO' : 'PECA'),
        is_arma: isArma,
        is_municao: isMun,
        is_serializado: isSerializado,
        tipo_arma: itemEstoque.tipo_arma || (isArma ? (itemEstoque.nome.split(' ')[0] || 'Arma de Fogo') : ''),
        fabricante: itemEstoque.fabricante || itemEstoque.marca || '',
        modelo: itemEstoque.modelo || itemEstoque.nome,
        calibre: itemEstoque.calibre || '',
        numero_serie: itemEstoque.numero_serie || '',
        lote_fabricante: itemEstoque.lote_fabricante || '',
        sistema_registro: itemEstoque.sistema_registro || 'SIGMA',
        numero_sigma_sinarm: itemEstoque.numero_sigma_sinarm || '',
        classificacao_calibre: itemEstoque.classificacao_calibre || 'PERMITIDO',
        acabamento: itemEstoque.acabamento || 'Oxidado Fosco',
        comprimento_cano: itemEstoque.comprimento_cano || '',
        capacidade_tiros: itemEstoque.capacidade_tiros || '',
        quantidade_raias: itemEstoque.quantidade_raias || '',
        sentido_raias: itemEstoque.sentido_raias || '',
        tipo_funcionamento: itemEstoque.tipo_funcionamento || '',
        possui_carregadores: itemEstoque.possui_carregadores !== undefined ? itemEstoque.possui_carregadores : true,
        quantidade_carregadores: itemEstoque.quantidade_carregadores || '',
        ncm: itemEstoque.ncm || (isArma ? '9302.00.00' : isMun ? '9306.30.00' : ''),
        preco_unitario: precoVenda,
        quantidade: qtdDesejada,
        subtotal: qtdDesejada * precoVenda
      }
      setCarrinho(prev => [...prev, novoItemCarrinho])
    }
  }

  // Alterar quantidade diretamente no carrinho (+ / - / digitação)
  const handleAlterarQtdCarrinho = (itemId, novaQtd) => {
    const itemEstoque = estoque.find(i => String(i.id) === String(itemId))
    const itemCart = carrinho.find(c => String(c.item_id) === String(itemId))
    if (!itemCart) return

    if (itemCart.is_arma || (itemCart.is_serializado && (parseInt(itemEstoque?.quantidade) || 0) <= 1)) {
      alert(`Itens com número de série (${itemCart.numero_serie || itemCart.nome}) são comercializados individualmente (1 unidade por registro).`)
      return
    }

    const qtdEstoqueDisponivel = itemEstoque ? (parseInt(itemEstoque.quantidade) || 0) : 9999
    const qtdNum = parseInt(novaQtd)
    if (isNaN(qtdNum) || qtdNum <= 0) {
      handleRemoverDoCarrinho(itemId)
      return
    }

    if (qtdNum > qtdEstoqueDisponivel) {
      alert(`Estoque máximo disponível: ${qtdEstoqueDisponivel} unidade(s).`)
      return
    }

    setCarrinho(prev => prev.map(c => {
      if (String(c.item_id) === String(itemId)) {
        return {
          ...c,
          quantidade: qtdNum,
          subtotal: qtdNum * (parseFloat(c.preco_unitario) || 0)
        }
      }
      return c
    }))
  }

  const handleIncrementarQtd = (itemId) => {
    const itemCart = carrinho.find(c => String(c.item_id) === String(itemId))
    if (!itemCart) return
    if (itemCart.is_arma || (itemCart.is_serializado && (parseInt(itemCart.quantidade) || 0) >= 1)) {
      alert(`Armas de fogo e itens serializados (${itemCart.numero_serie || itemCart.nome}) são vendidos com 1 unidade por registro.`)
      return
    }
    handleAlterarQtdCarrinho(itemId, itemCart.quantidade + 1)
  }

  const handleDecrementarQtd = (itemId) => {
    const itemCart = carrinho.find(c => String(c.item_id) === String(itemId))
    if (!itemCart) return
    if (itemCart.quantidade <= 1) {
      handleRemoverDoCarrinho(itemId)
    } else {
      handleAlterarQtdCarrinho(itemId, itemCart.quantidade - 1)
    }
  }

  // Remover Item do Carrinho
  const handleRemoverDoCarrinho = (itemId) => {
    setCarrinho(prev => prev.filter(c => String(c.item_id) !== String(itemId)))
  }

  // Limpar todo o carrinho
  const handleLimparCarrinho = () => {
    if (carrinho.length === 0) return
    if (window.confirm('Tem certeza que deseja limpar todos os itens do carrinho?')) {
      setCarrinho([])
    }
  }

  // Cálculos do Carrinho
  const valorSubtotalCarrinho = carrinho.reduce((acc, c) => acc + (c.subtotal || 0), 0)
  const valorDescontoNum = parseFloat(descontoVenda) || 0
  const valorFinalCarrinho = Math.max(0, valorSubtotalCarrinho - valorDescontoNum)
  const valorTrocoDevolver = Math.max(0, (parseFloat(valorPagoCliente) || 0) - valorFinalCarrinho)

  // Itens regulados no carrinho
  const temArmaNoCarrinho = carrinho.some(isItemArmaDeFogo)
  const temMunicaoNoCarrinho = carrinho.some(isItemMunicao)
  const temSerializadoNoCarrinho = carrinho.some(isItemSerializado)

  // ── FINALIZAR VENDA (COM TRÂMITE PF/EXÉRCITO E CONTROLE DE MUNIÇÕES) ────────
  const handleFinalizarVenda = (e) => {
    e.preventDefault()
    if (carrinho.length === 0) {
      alert('Selecione ao menos 1 item do estoque para realizar a venda!')
      return
    }

    const temArma = carrinho.some(isItemArmaDeFogo)
    const temMun = carrinho.some(isItemMunicao)

    // Validação legal rigorosa: Armas e Munições exigem identificação de cliente cadastrado
    if ((temArma || temMun) && (!clienteSelecionado || clienteSelecionado === 'CLIENTE AVULSO / BALCÃO')) {
      alert(`⚠️ Exigência Legal (Polícia Federal / Exército):\n\nA venda de ${temArma ? 'ARMAS DE FOGO' : 'MUNIÇÕES'} exige identificação formal obrigatória do comprador (Nome, CPF, RG e endereço).\n\nPor favor, selecione um cliente cadastrado no topo do carrinho antes de finalizar a venda.`)
      return
    }

    // Se tiver munição, validar obrigatoriedade do CRAF
    if (temMun && !dadosMunicaoForm.numero_craf?.trim()) {
      alert('⚠️ Para venda de munições, é obrigatório registrar o número do CRAF (Certificado de Registro de Arma de Fogo) onde os cartuchos serão utilizados.')
      return
    }

    const hojeStr = hojeISO()
    const horaAgoraStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const proximoNumeroVenda = 2000 + totalVendasCount + 1

    const tipoVenda = temArma ? 'VENDA_ARMA' : (temMun ? 'VENDA_MUNICAO' : 'VENDA_BALCAO')

    const novaVendaObj = {
      id: `v_${Date.now()}`,
      numero_venda: proximoNumeroVenda,
      tipo_venda: tipoVenda,
      status_venda: temArma ? 'EM_TRAMITE' : 'CONCLUIDA',
      status_tramite_arma: temArma ? 'AGUARDANDO_AUTORIZACAO' : 'FINALIZADA',
      cliente_id: clienteSelecionadoObj?.id || '',
      cliente_nome: clienteSelecionado,
      cliente_cpf: clienteSelecionadoObj?.cpf || '',
      cliente_rg: clienteSelecionadoObj?.rg || '',
      cliente_cr: clienteSelecionadoObj?.numero_cr || '',
      cliente_telefone: clienteSelecionadoObj?.telefone || '',
      cliente_email: clienteSelecionadoObj?.email || '',
      cliente_endereco: clienteSelecionadoObj?.endereco
        ? `${clienteSelecionadoObj.endereco}${clienteSelecionadoObj.numero ? `, nº ${clienteSelecionadoObj.numero}` : ''}${clienteSelecionadoObj.bairro ? ` - ${clienteSelecionadoObj.bairro}` : ''}${clienteSelecionadoObj.cidade ? ` - ${clienteSelecionadoObj.cidade}/${clienteSelecionadoObj.estado || ''}` : ''}`
        : '',
      data: hojeStr,
      hora: horaAgoraStr,
      itens: carrinho,
      valor_subtotal: valorSubtotalCarrinho,
      desconto: valorDescontoNum,
      valor_final: valorFinalCarrinho,
      forma_pagamento: formaPagamento,
      valor_pago: parseFloat(valorPagoCliente) || valorFinalCarrinho,
      troco: valorTrocoDevolver,
      operador: usuarioLogado?.nome_completo || 'Operador',
      created_at: new Date().toISOString(),
      dados_tramite_arma: temArma ? {
        status: 'AGUARDANDO_AUTORIZACAO',
        data_reserva: hojeStr,
        autorizacao_compra_numero: '',
        autorizacao_compra_data: '',
        autorizacao_orgao: 'SINARM',
        nfe_numero: '',
        nfe_serie: '1',
        nfe_chave: '',
        nfe_data_emissao: '',
        craf_definitivo_numero: '',
        craf_definitivo_validade: '',
        data_entrega_arma: '',
        responsavel_entrega: '',
        observacoes: ''
      } : null,
      dados_regulamento_municao: temMun ? {
        numero_craf: dadosMunicaoForm.numero_craf || '',
        orgao_emissor: dadosMunicaoForm.orgao_emissor || 'SINARM',
        validade_craf: dadosMunicaoForm.validade_craf || '',
        calibre_craf: dadosMunicaoForm.calibre_craf || '',
        observacoes_guia: dadosMunicaoForm.observacoes_guia || '',
        lotes_municao: carrinho.filter(isItemMunicao).map(m => ({
          nome: m.nome,
          calibre: m.calibre,
          lote: m.lote_fabricante || 'CBC-PADRÃO',
          quantidade: m.quantidade
        }))
      } : null
    }

    // 1. Atualizar Estoque:
    // Se for Arma: RESERVA no estoque com vínculo ao cliente da venda (permanece física no cofre até autorização e NF)
    // Se for Munição ou outro item: dá baixa na quantidade do estoque
    const novoEstoque = [...estoque]
    carrinho.forEach(itemCart => {
      const idx = novoEstoque.findIndex(i => String(i.id) === String(itemCart.item_id) || (i.numero_serie && i.numero_serie === itemCart.numero_serie))
      if (idx !== -1) {
        if (itemCart.is_arma || isItemArmaDeFogo(novoEstoque[idx])) {
          const itemAtualizado = {
            ...novoEstoque[idx],
            status_arma: 'RESERVADA',
            cliente_reserva_id: clienteSelecionadoObj?.id || '',
            cliente_reserva_nome: clienteSelecionado,
            reserva_venda_id: novaVendaObj.id
          }
          novoEstoque[idx] = itemAtualizado
          dbUpsert('estoque', itemAtualizado)
        } else {
          const qtdAnterior = parseInt(novoEstoque[idx].quantidade) || 0
          const novaQtd = Math.max(0, qtdAnterior - itemCart.quantidade)
          const itemAtualizado = { ...novoEstoque[idx], quantidade: novaQtd }
          novoEstoque[idx] = itemAtualizado
          dbUpsert('estoque', itemAtualizado)
        }
      }
    })
    setEstoque(novoEstoque)

    // Sincronizar com armas do acervo da loja se houver
    if (setArmas && armas) {
      const novoArmas = [...armas]
      carrinho.filter(isItemArmaDeFogo).forEach(itemCart => {
        const idxA = novoArmas.findIndex(a => String(a.id) === String(itemCart.item_id) || (a.numero_serie && a.numero_serie === itemCart.numero_serie))
        if (idxA !== -1) {
          novoArmas[idxA] = {
            ...novoArmas[idxA],
            status_arma: 'RESERVADA',
            cliente_reserva_nome: clienteSelecionado,
            cliente_reserva_id: clienteSelecionadoObj?.id || ''
          }
          dbUpsert('armas', novoArmas[idxA])
        }
      })
      setArmas(novoArmas)
    }

    // 2. Lançar no Caixa ABERTO da Recepção
    if (setCaixas && caixas) {
      const caixaAberto = caixas.find(c => c.data === hojeStr && c.status === 'ABERTO') || caixas.find(c => c.status === 'ABERTO')
      if (caixaAberto) {
        const novaMovCaixa = {
          id: `mov_v_${Date.now()}`,
          tipo: 'RECEBIMENTO_VENDA',
          descricao: temArma
            ? `Venda de Arma #${proximoNumeroVenda} (${clienteSelecionado}) — Aguardando PF/Exército`
            : `Venda de Balcão #${proximoNumeroVenda} (${clienteSelecionado})`,
          forma_pagamento: formaPagamento,
          valor: valorFinalCarrinho,
          hora: horaAgoraStr,
          usuario: usuarioLogado?.nome_completo || 'Operador Responsável',
          usuario_nome: usuarioLogado?.nome_completo || 'Operador Responsável',
          usuario_id: usuarioLogado?.id || null,
          usuario_cargo: usuarioLogado?.cargo || usuarioLogado?.perfil || 'Recepção'
        }
        const movsAnteriores = Array.isArray(caixaAberto.movimentacoes) ? caixaAberto.movimentacoes : []
        const saldoAnterior = parseFloat(caixaAberto.saldo_final || caixaAberto.saldo_inicial) || 0
        const caixaAtualizado = {
          ...caixaAberto,
          saldo_final: saldoAnterior + valorFinalCarrinho,
          movimentacoes: [...movsAnteriores, novaMovCaixa]
        }
        setCaixas(prev => prev.map(c => c.id === caixaAberto.id ? caixaAtualizado : c))
        dbUpsert('caixas', caixaAtualizado)
      }
    }

    // 3. Lançar no Financeiro (Receita)
    if (setFinanceiro && financeiro) {
      const resumoItensText = carrinho.map(c => `${c.quantidade}x ${c.nome}${c.numero_serie ? ` (S/N: ${c.numero_serie})` : ''}`).join(', ')
      const novoLancamentoFinanceiro = {
        id: `fin_v_${Date.now()}`,
        data: hojeStr,
        descricao: temArma
          ? `Venda de Arma #${proximoNumeroVenda} (${clienteSelecionado}) — Aguardando PF/Exército`
          : `Venda de Balcão #${proximoNumeroVenda} (${clienteSelecionado}) — ${resumoItensText}`,
        categoria: temArma ? 'VENDA DE ARMAS' : (temMun ? 'VENDA DE MUNIÇÕES' : 'VENDA DE BALCÃO'),
        tipo: 'RECEITA',
        valor: valorFinalCarrinho,
        forma_pagamento: formaPagamento,
        status: 'PAGO'
      }
      setFinanceiro(prev => [novoLancamentoFinanceiro, ...prev])
      dbUpsert('financeiro', novoLancamentoFinanceiro)
    }

    // 4. Salvar Venda no Estado & Supabase
    if (setVendas) {
      setVendas(prev => [novaVendaObj, ...prev])
    }
    dbUpsert('vendas', novaVendaObj)

    // 5. Registra Log de Auditoria
    registrarLog({
      usuario: usuarioLogado,
      acao: temArma ? 'VENDA DE ARMA (PROPOSTA PF)' : (temMun ? 'VENDA DE MUNIÇÃO' : 'VENDA DE BALCÃO'),
      descricao: temArma
        ? `Venda de Arma #${proximoNumeroVenda} de ${formatarMoeda(valorFinalCarrinho)} registrada para ${clienteSelecionado}. Arma reservada: ${carrinho.filter(isItemArmaDeFogo).map(a => `${a.nome} (S/N: ${a.numero_serie})`).join(', ')}. Aguardando deferimento da Polícia Federal / Exército.`
        : `Venda #${proximoNumeroVenda} de ${formatarMoeda(valorFinalCarrinho)} (${formaPagamento}) realizada para ${clienteSelecionado}.`,
      setLogs
    })

    // 6. Reset e Exibição do Documento Adequado
    setModalNovaVenda(false)
    setCarrinho([])
    setClienteSelecionado('CLIENTE AVULSO / BALCÃO')
    setDescontoVenda(0)
    setValorPagoCliente('')
    setDadosMunicaoForm({
      numero_craf: '',
      orgao_emissor: 'SINARM',
      validade_craf: '',
      calibre_craf: '',
      arma_acervo_id: '',
      observacoes_guia: ''
    })

    setReciboModalVenda(novaVendaObj)
    setTipoDocumentoRecibo(temArma ? 'PROPOSTA_PF' : (temMun ? 'MUNICHOES_SICOVEM' : 'AUTO'))

    if (temArma) {
      alert(`✅ Venda de Arma #${proximoNumeroVenda} registrada com sucesso!\n\n1. A arma foi RESERVADA no estoque da loja.\n2. A Declaração de Proposta de Compra foi gerada para o cliente protocolar a aquisição na Polícia Federal (SINARM) ou Exército (SIGMA).\n3. A Nota Fiscal será emitida após a apresentação da autorização deferida.`)
    } else {
      alert(`✅ Venda #${proximoNumeroVenda} finalizada com sucesso!`)
    }
  }

  // ── AVANÇAR ETAPAS DO TRÂMITE LEGAL DA ARMA ────────────────────────────────
  const handleSalvarAvancoTramiteArma = (venda, novaEtapa, novosDados) => {
    if (!venda) return
    const dadosTramiteAtual = venda.dados_tramite_arma || {}
    const dadosAtualizados = {
      ...dadosTramiteAtual,
      ...novosDados,
      status: novaEtapa
    }

    const statusVendaAtualizado = novaEtapa === 'ENTREGUE' ? 'CONCLUIDA' : 'EM_TRAMITE'

    const vendaAtualizada = {
      ...venda,
      status_tramite_arma: novaEtapa,
      status_venda: statusVendaAtualizado,
      dados_tramite_arma: dadosAtualizados
    }

    // 1. Atualizar estoque de acordo com a etapa
    const novoEstoque = [...estoque]
    venda.itens.filter(isItemArmaDeFogo).forEach(itemArma => {
      const idx = novoEstoque.findIndex(i => String(i.id) === String(itemArma.item_id) || (i.numero_serie && i.numero_serie === itemArma.numero_serie))
      if (idx !== -1) {
        let statusArma = novoEstoque[idx].status_arma
        let novaQtd = parseInt(novoEstoque[idx].quantidade) || 0
        if (novaEtapa === 'AUTORIZADO_PF' || novaEtapa === 'NOTA_FISCAL_EMITIDA') {
          statusArma = 'AGUARDANDO_CRAF'
        } else if (novaEtapa === 'ENTREGUE') {
          statusArma = 'ENTREGUE'
          novaQtd = 0
        }
        const itemAtualizado = {
          ...novoEstoque[idx],
          status_arma: statusArma,
          quantidade: novaQtd,
          craf_definitivo: novosDados.craf_definitivo_numero || novoEstoque[idx].craf_definitivo,
          nfe_numero: novosDados.nfe_numero || novoEstoque[idx].nfe_numero
        }
        novoEstoque[idx] = itemAtualizado
        dbUpsert('estoque', itemAtualizado)
      }
    })
    setEstoque(novoEstoque)

    // Sincronizar acervo de armas se disponível
    if (setArmas && armas) {
      const novoArmas = [...armas]
      venda.itens.filter(isItemArmaDeFogo).forEach(itemArma => {
        const idxA = novoArmas.findIndex(a => String(a.id) === String(itemArma.item_id) || (a.numero_serie && a.numero_serie === itemArma.numero_serie))
        if (idxA !== -1) {
          novoArmas[idxA] = {
            ...novoArmas[idxA],
            status_arma: novaEtapa === 'ENTREGUE' ? 'ENTREGUE' : (novaEtapa === 'AUTORIZADO_PF' ? 'AGUARDANDO_CRAF' : novoArmas[idxA].status_arma),
            quantidade: novaEtapa === 'ENTREGUE' ? 0 : novoArmas[idxA].quantidade
          }
          dbUpsert('armas', novoArmas[idxA])
        }
      })
      setArmas(novoArmas)
    }

    // 2. Atualizar Venda no Estado & Supabase
    if (setVendas) {
      setVendas(prev => prev.map(v => v.id === venda.id ? vendaAtualizada : v))
    }
    dbUpsert('vendas', vendaAtualizada)

    registrarLog({
      usuario: usuarioLogado,
      acao: 'TRÂMITE DE VENDA DE ARMA',
      descricao: `Venda #${venda.numero_venda} avançada para ${novaEtapa}. Cliente: ${venda.cliente_nome}. ${novosDados.nfe_numero ? `NF-e: ${novosDados.nfe_numero}. ` : ''}${novosDados.craf_definitivo_numero ? `CRAF: ${novosDados.craf_definitivo_numero}.` : ''}`,
      setLogs
    })

    setModalTramiteVenda(vendaAtualizada)
    alert(`Status do trâmite da arma atualizado para: ${
      novaEtapa === 'AUTORIZADO_PF' ? 'Autorizado pela PF/Exército' :
      novaEtapa === 'NOTA_FISCAL_EMITIDA' ? 'Nota Fiscal Emitida' :
      novaEtapa === 'ENTREGUE' ? 'Arma Entregue com Sucesso' : novaEtapa
    }!`)
  }

  // Salvar alterações de dados do formulário de trâmite sem avançar de etapa
  const handleSalvarDadosTramite = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!modalTramiteVenda) return
    const dadosTramiteAtual = modalTramiteVenda.dados_tramite_arma || {}
    const dadosAtualizados = {
      ...dadosTramiteAtual,
      ...dadosTramiteForm
    }
    const vendaAtualizada = {
      ...modalTramiteVenda,
      dados_tramite_arma: dadosAtualizados
    }
    if (setVendas) {
      setVendas(prev => prev.map(v => v.id === modalTramiteVenda.id ? vendaAtualizada : v))
    }
    dbUpsert('vendas', vendaAtualizada)
    setModalTramiteVenda(vendaAtualizada)
    alert('Informações do trâmite da arma atualizadas com sucesso!')
  }

  // Data por extenso para documentos oficiais
  const getDataExtenso = (dataIso) => {
    try {
      if (!dataIso) return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      const partes = String(dataIso).split('T')[0].split('-')
      if (partes.length === 3) {
        const d = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]))
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      }
      return new Date(dataIso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    } catch (e) {
      return formatarData(dataIso)
    }
  }

  // Especificações técnicas consolidadas de armas para documentos e termos
  const getArmaSpecs = (it) => {
    if (!it) return {}
    const itemEst = (estoque || []).find(e => String(e.id) === String(it.item_id) || (e.numero_serie && e.numero_serie === it.numero_serie)) || {}
    const itemArm = (armas || []).find(a => String(a.id) === String(it.item_id) || (a.numero_serie && a.numero_serie === it.numero_serie)) || {}
    return {
      fabricante: it.fabricante || itemEst.fabricante || itemEst.marca || itemArm.marca || itemArm.fabricante || '—',
      modelo: it.modelo || itemEst.modelo || itemArm.modelo || it.nome,
      calibre: it.calibre || itemEst.calibre || itemArm.calibre || '—',
      numero_serie: it.numero_serie || itemEst.numero_serie || itemArm.numero_serie || '—',
      acabamento: it.acabamento || itemEst.acabamento || itemArm.acabamento || 'Oxidado Fosco',
      tipo_arma: it.tipo_arma || itemEst.tipo_arma || itemArm.tipo || 'Arma de Fogo',
      comprimento_cano: it.comprimento_cano || itemEst.comprimento_cano || itemArm.comprimento_cano || '—',
      quantidade_raias: it.quantidade_raias || itemEst.quantidade_raias || itemArm.quantidade_raias || '6 raias',
      sentido_raias: it.sentido_raias || itemEst.sentido_raias || itemArm.sentido_raias || 'À Direita (Dextrorsum)',
      tipo_funcionamento: it.tipo_funcionamento || itemEst.tipo_funcionamento || itemArm.tipo_funcionamento || (it.tipo_arma === 'Revólver' ? 'Ação Dupla / Simples (SA/DA)' : 'Semiautomática'),
      capacidade_tiros: it.capacidade_tiros || itemEst.capacidade_tiros || itemArm.capacidade_tiros || '—',
      possui_carregadores: it.possui_carregadores !== undefined ? it.possui_carregadores : (itemEst.possui_carregadores !== undefined ? itemEst.possui_carregadores : (it.tipo_arma !== 'Revólver')),
      quantidade_carregadores: it.quantidade_carregadores || itemEst.quantidade_carregadores || itemArm.quantidade_carregadores || (it.tipo_arma === 'Revólver' ? '0' : '2'),
      sistema_registro: it.sistema_registro || itemEst.sistema_registro || itemArm.orgao_registro || 'SINARM / SIGMA',
      numero_sigma_sinarm: it.numero_sigma_sinarm || itemEst.numero_sigma_sinarm || itemArm.numero_sigma_sinarm || '—'
    }
  }

  // ── EXCLUIR VENDA (COM RESTAURAÇÃO DE ESTOQUE E DESBLOQUEIO DE ARMAS) ────────
  const handleConfirmarExclusaoVenda = (e) => {
    e.preventDefault()
    if (!modalExcluirVenda) return

    const usuariosMaster = (usuarioLogado?.perfil === 'master')
    if (!usuariosMaster && (senhaMasterInput || '').trim() !== 'admin') {
      setErroSenhaMaster('Senha Master incorreta!')
      return
    }

    const venda = modalExcluirVenda

    // Restaura estoque dos itens e libera reservas de armas
    if (Array.isArray(venda.itens)) {
      const estoqueRestaurado = [...estoque]
      venda.itens.forEach(itemVenda => {
        const idx = estoqueRestaurado.findIndex(i => String(i.id) === String(itemVenda.item_id) || (i.numero_serie && i.numero_serie === itemVenda.numero_serie))
        if (idx !== -1) {
          const itemEst = estoqueRestaurado[idx]
          const isArma = isItemArmaDeFogo(itemEst) || itemVenda.is_arma
          const qtdAtual = parseInt(itemEst.quantidade) || 0
          const itemAtualizado = {
            ...itemEst,
            quantidade: isArma ? 1 : (qtdAtual + itemVenda.quantidade),
            status_arma: isArma ? 'DISPONIVEL' : itemEst.status_arma,
            cliente_reserva_id: isArma ? '' : itemEst.cliente_reserva_id,
            cliente_reserva_nome: isArma ? '' : itemEst.cliente_reserva_nome,
            reserva_venda_id: isArma ? '' : itemEst.reserva_venda_id
          }
          estoqueRestaurado[idx] = itemAtualizado
          dbUpsert('estoque', itemAtualizado)
        }
      })
      setEstoque(estoqueRestaurado)

      if (setArmas && armas) {
        const armasRestauradas = [...armas]
        venda.itens.filter(isItemArmaDeFogo).forEach(itemVenda => {
          const idxA = armasRestauradas.findIndex(a => String(a.id) === String(itemVenda.item_id) || (a.numero_serie && a.numero_serie === itemVenda.numero_serie))
          if (idxA !== -1) {
            armasRestauradas[idxA] = {
              ...armasRestauradas[idxA],
              status_arma: 'DISPONIVEL',
              cliente_reserva_nome: '',
              cliente_reserva_id: '',
              quantidade: 1
            }
            dbUpsert('armas', armasRestauradas[idxA])
          }
        })
        setArmas(armasRestauradas)
      }
    }

    // Remove do estado e Supabase
    if (setVendas) {
      setVendas(prev => prev.filter(v => String(v.id) !== String(venda.id)))
    }
    dbDelete('vendas', venda.id)

    registrarLog({
      usuario: usuarioLogado,
      acao: 'EXCLUSÃO DE VENDA',
      descricao: `Venda #${venda.numero_venda} cancelada. Estoque restaurado e reservas de armas liberadas.`,
      setLogs
    })

    setModalExcluirVenda(null)
    setSenhaMasterInput('')
    setErroSenhaMaster('')
    alert(`Venda #${venda.numero_venda} cancelada e estoque restaurado!`)
  }

  // Enviar Recibo via WhatsApp (com números de série e dados do trâmite)
  const handleEnviarWhatsAppRecibo = (venda) => {
    const cliObj = (clientes || []).find(c => c.nome_completo === venda.cliente_nome)
    const tel = (cliObj?.telefone || '').replace(/\D/g, '')
    const numTel = tel.length === 10 || tel.length === 11 ? `55${tel}` : tel
    const ehArma = venda.tipo_venda === 'VENDA_ARMA' || venda.dados_tramite_arma || (venda.itens || []).some(isItemArmaDeFogo)

    const resumoItens = (venda.itens || []).map(i => {
      let extra = ''
      if (i.numero_serie) extra += ` [S/N: ${i.numero_serie}]`
      if (i.calibre) extra += ` (${i.calibre})`
      if (i.lote_fabricante) extra += ` [Lote: ${i.lote_fabricante}]`
      return `• ${i.quantidade}x *${i.nome}*${extra} — ${formatarMoeda(i.subtotal)}`
    }).join('\n')

    let textoExtra = ''
    if (ehArma) {
      const st = venda.dados_tramite_arma?.status || venda.status_tramite_arma || 'AGUARDANDO_AUTORIZACAO'
      textoExtra = `\n\n*Status do Trâmite:* ${
        st === 'AGUARDANDO_AUTORIZACAO' ? 'Aguardando Autorização da PF/Exército' :
        st === 'AUTORIZADO_PF' ? `Autorizado pela PF (${venda.dados_tramite_arma?.autorizacao_compra_numero})` :
        st === 'NOTA_FISCAL_EMITIDA' ? `Nota Fiscal Emitida (NF: ${venda.dados_tramite_arma?.nfe_numero})` :
        st === 'ENTREGUE' ? `Arma Entregue (CRAF: ${venda.dados_tramite_arma?.craf_definitivo_numero})` : st
      }\n*Arma Reservada no Cofre da Loja.*\nA Declaração de Proposta de Compra está disponível para o processo de autorização de compra.`
    }

    const msg = `Olá *${venda.cliente_nome}*, segue o registro de sua compra na *${config?.nome_fantasia || 'Pró Guns Armeria'}*:\n\n*${ehArma ? 'PROPOSTA / VENDA DE ARMA' : 'COMPROVANTE DE VENDA'} #${venda.numero_venda}*\nData: ${formatarData(venda.data)} às ${venda.hora || ''}\n\n*Itens:*\n${resumoItens}\n\n*Forma de Pagamento:* ${venda.forma_pagamento}\n*Valor Total:* ${formatarMoeda(venda.valor_final)}${textoExtra}\n\nAgradecemos a preferência!`
    window.open(`https://wa.me/${numTel}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // ── BADGES DE STATUS REGULATÓRIO ───────────────────────────────────────────
  const getBadgeStatusVenda = (venda) => {
    const ehArma = venda.tipo_venda === 'VENDA_ARMA' || venda.dados_tramite_arma || (venda.itens || []).some(isItemArmaDeFogo)
    const ehMun = venda.tipo_venda === 'VENDA_MUNICAO' || venda.dados_regulamento_municao || (venda.itens || []).some(isItemMunicao)

    if (ehArma) {
      const st = venda.status_tramite_arma || venda.dados_tramite_arma?.status || 'AGUARDANDO_AUTORIZACAO'
      if (st === 'AGUARDANDO_AUTORIZACAO') {
        return (
          <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.18)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
            <Clock size={11} /> Aguardando Autorização PF/Exército
          </span>
        )
      }
      if (st === 'AUTORIZADO_PF') {
        return (
          <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.18)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
            <FileCheck size={11} /> Autorizado pela PF/Exército
          </span>
        )
      }
      if (st === 'NOTA_FISCAL_EMITIDA') {
        return (
          <span style={{ backgroundColor: 'rgba(192, 132, 252, 0.18)', color: '#C084FC', border: '1px solid rgba(192, 132, 252, 0.4)', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
            <FileText size={11} /> Nota Fiscal Emitida
          </span>
        )
      }
      if (st === 'ENTREGUE') {
        return (
          <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.18)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
            <CheckCircle2 size={11} /> Arma Entregue (CRAF Emitido)
          </span>
        )
      }
    }

    if (ehMun) {
      return (
        <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#93C5FD', border: '1px solid rgba(59, 130, 246, 0.35)', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
          <Target size={11} /> Munição (CRAF Registrado)
        </span>
      )
    }

    return (
      <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
        <CheckCircle2 size={11} /> Venda Concluída
      </span>
    )
  }

  // ── FILTRO DE VENDAS (POR ABAS E TERMO DE BUSCA) ───────────────────────────
  const vendasFiltradas = (vendas || []).filter(v => {
    if (abaFiltroVendas === 'TRAMITE_ARMA') {
      const ehArma = v.tipo_venda === 'VENDA_ARMA' || v.dados_tramite_arma || (v.itens || []).some(isItemArmaDeFogo)
      if (!ehArma) return false
    } else if (abaFiltroVendas === 'MUNICAO') {
      const ehMun = v.tipo_venda === 'VENDA_MUNICAO' || v.dados_regulamento_municao || (v.itens || []).some(isItemMunicao)
      if (!ehMun) return false
    } else if (abaFiltroVendas === 'CONCLUIDAS') {
      const isConcluida = v.status_venda === 'CONCLUIDA' || v.status_tramite_arma === 'ENTREGUE' || (!v.dados_tramite_arma && v.tipo_venda !== 'VENDA_ARMA')
      if (!isConcluida) return false
    }

    const termo = busca.toLowerCase()
    return (
      String(v.numero_venda || '').toLowerCase().includes(termo) ||
      (v.cliente_nome || '').toLowerCase().includes(termo) ||
      (v.forma_pagamento || '').toLowerCase().includes(termo) ||
      (v.itens || []).some(i =>
        (i.nome || '').toLowerCase().includes(termo) ||
        (i.numero_serie || '').toLowerCase().includes(termo) ||
        (i.calibre || '').toLowerCase().includes(termo) ||
        (i.lote_fabricante || '').toLowerCase().includes(termo)
      )
    )
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ── TOPO COM TÍTULO E BOTÃO NOVA VENDA ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--gold-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingCart size={26} color="#F59E0B" />
            Vendas de Balcão (PDV)
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            Venda direta de peças, insumos e acessórios sem necessidade de O.S. (Baixa automática no Estoque e Caixa).
          </p>
        </div>

        <button
          onClick={() => {
            setCategoriaAtivaPDV('TODAS')
            setBuscaCatalogo('')
            setModalNovaVenda(true)
          }}
          className="btn-gold"
          style={{ backgroundColor: '#F59E0B', borderColor: '#D97706', color: '#FFF', padding: '0.55rem 1.1rem', fontSize: '0.85rem', fontWeight: '800', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}
        >
          <Plus size={18} />
          <span>+ Nova Venda de Balcão</span>
        </button>
      </div>

      {/* ── METRICAS RÁPIDAS SEGMENTADAS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem' }}>
          <div style={{ backgroundColor: 'rgba(245,158,11,0.15)', padding: '0.65rem', borderRadius: '10px', color: '#F59E0B' }}>
            <ShoppingCart size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL DE VENDAS</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>{totalVendasCount}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem' }}>
          <div style={{ backgroundColor: 'rgba(245,158,11,0.2)', padding: '0.65rem', borderRadius: '10px', color: '#FBBF24' }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>ARMAS EM TRÂMITE (PF/SIGMA)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FBBF24' }}>
              {vendasArmasEmTramite.filter(v => v.status_tramite_arma !== 'ENTREGUE').length}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem' }}>
          <div style={{ backgroundColor: 'rgba(96,165,250,0.15)', padding: '0.65rem', borderRadius: '10px', color: '#60A5FA' }}>
            <Target size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>VENDAS DE MUNIÇÃO</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#60A5FA' }}>
              {vendasMunicao.length}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem' }}>
          <div style={{ backgroundColor: 'rgba(16,185,129,0.15)', padding: '0.65rem', borderRadius: '10px', color: '#10B981' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>FATURAMENTO TOTAL</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#10B981' }}>
              {formatarMoeda(faturamentoTotalVendas)}
            </div>
          </div>
        </div>
      </div>

      {/* ── ABAS DE NAVEGAÇÃO / FILTRO DE VENDAS ── */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setAbaFiltroVendas('TODAS')}
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: abaFiltroVendas === 'TODAS' ? '800' : '600',
            border: abaFiltroVendas === 'TODAS' ? '1px solid #F59E0B' : '1px solid var(--border-color)',
            backgroundColor: abaFiltroVendas === 'TODAS' ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-input)',
            color: abaFiltroVendas === 'TODAS' ? '#FBBF24' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          Todas as Vendas ({vendas.length})
        </button>
        <button
          type="button"
          onClick={() => setAbaFiltroVendas('TRAMITE_ARMA')}
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: abaFiltroVendas === 'TRAMITE_ARMA' ? '800' : '600',
            border: abaFiltroVendas === 'TRAMITE_ARMA' ? '1px solid #F59E0B' : '1px solid var(--border-color)',
            backgroundColor: abaFiltroVendas === 'TRAMITE_ARMA' ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-input)',
            color: abaFiltroVendas === 'TRAMITE_ARMA' ? '#FBBF24' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <Shield size={13} />
          Armas em Trâmite PF/Exército ({vendasArmasEmTramite.length})
        </button>
        <button
          type="button"
          onClick={() => setAbaFiltroVendas('MUNICAO')}
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: abaFiltroVendas === 'MUNICAO' ? '800' : '600',
            border: abaFiltroVendas === 'MUNICAO' ? '1px solid #60A5FA' : '1px solid var(--border-color)',
            backgroundColor: abaFiltroVendas === 'MUNICAO' ? 'rgba(96, 165, 250, 0.2)' : 'var(--bg-input)',
            color: abaFiltroVendas === 'MUNICAO' ? '#93C5FD' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <Target size={13} />
          Vendas de Munição ({vendasMunicao.length})
        </button>
        <button
          type="button"
          onClick={() => setAbaFiltroVendas('CONCLUIDAS')}
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: abaFiltroVendas === 'CONCLUIDAS' ? '800' : '600',
            border: abaFiltroVendas === 'CONCLUIDAS' ? '1px solid #10B981' : '1px solid var(--border-color)',
            backgroundColor: abaFiltroVendas === 'CONCLUIDAS' ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-input)',
            color: abaFiltroVendas === 'CONCLUIDAS' ? '#34D399' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          Vendas Concluídas
        </button>
      </div>

      {/* ── BARRA DE PESQUISA ── */}
      <div className="card" style={{ padding: '0.85rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.45rem 0.75rem' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            className="input-field"
            style={{ border: 'none', background: 'transparent', padding: 0 }}
            placeholder="Pesquisar por N° (#V-2001), cliente, produto, número de série ou calibre..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* ── TABELA DE VENDAS ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.83rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>VENDA #</th>
                <th style={{ padding: '0.85rem 1rem' }}>DATA / HORA</th>
                <th style={{ padding: '0.85rem 1rem' }}>CLIENTE</th>
                <th style={{ padding: '0.85rem 1rem' }}>STATUS / TIPO</th>
                <th style={{ padding: '0.85rem 1rem' }}>ITENS ADQUIRIDOS</th>
                <th style={{ padding: '0.85rem 1rem' }}>PAGAMENTO</th>
                <th style={{ padding: '0.85rem 1rem' }}>VALOR TOTAL</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {vendasFiltradas.length > 0 ? (
                vendasFiltradas.map((venda) => {
                  const ehArma = venda.tipo_venda === 'VENDA_ARMA' || venda.dados_tramite_arma || (venda.itens || []).some(isItemArmaDeFogo)

                  return (
                    <tr key={venda.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#F59E0B' }}>
                        #V-{venda.numero_venda || venda.id.slice(-4)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                        {formatarData(venda.data)} {venda.hora ? `às ${venda.hora}` : ''}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                        <div>{venda.cliente_nome?.toUpperCase()}</div>
                        {venda.cliente_cpf && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '400' }}>
                            CPF: {venda.cliente_cpf}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {getBadgeStatusVenda(venda)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {(venda.itens || []).map((it, idx) => (
                            <div key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: '1.3' }}>
                              <strong style={{ color: '#F59E0B' }}>{it.quantidade}x</strong> {it.nome}
                              {it.calibre && <span style={{ color: 'var(--text-muted)', marginLeft: '0.25rem' }}>({it.calibre})</span>}
                              {it.numero_serie && (
                                <span style={{
                                  marginLeft: '0.35rem',
                                  backgroundColor: 'rgba(245, 158, 11, 0.18)',
                                  color: '#FBBF24',
                                  border: '1px solid rgba(245, 158, 11, 0.4)',
                                  padding: '0.05rem 0.35rem',
                                  borderRadius: '4px',
                                  fontSize: '0.67rem',
                                  fontWeight: '800',
                                  fontFamily: 'monospace'
                                }}>
                                  S/N: {it.numero_serie}
                                </span>
                              )}
                              {it.lote_fabricante && (
                                <span style={{
                                  marginLeft: '0.35rem',
                                  backgroundColor: 'rgba(96, 165, 250, 0.18)',
                                  color: '#60A5FA',
                                  border: '1px solid rgba(96, 165, 250, 0.4)',
                                  padding: '0.05rem 0.35rem',
                                  borderRadius: '4px',
                                  fontSize: '0.67rem',
                                  fontWeight: '700'
                                }}>
                                  Lote: {it.lote_fabricante}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className="badge badge-blue">
                          {venda.forma_pagamento}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#10B981', fontSize: '0.9rem' }}>
                        {formatarMoeda(venda.valor_final)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.4rem' }}>
                          {/* Botão de Trâmite de Arma (se for venda de arma) */}
                          {ehArma && (
                            <button
                              type="button"
                              onClick={() => {
                                setModalTramiteVenda(venda)
                                setDadosTramiteForm({
                                  autorizacao_compra_numero: venda.dados_tramite_arma?.autorizacao_compra_numero || '',
                                  autorizacao_compra_data: venda.dados_tramite_arma?.autorizacao_compra_data || '',
                                  autorizacao_orgao: venda.dados_tramite_arma?.autorizacao_orgao || 'SINARM',
                                  nfe_numero: venda.dados_tramite_arma?.nfe_numero || '',
                                  nfe_serie: venda.dados_tramite_arma?.nfe_serie || '1',
                                  nfe_chave: venda.dados_tramite_arma?.nfe_chave || '',
                                  nfe_data_emissao: venda.dados_tramite_arma?.nfe_data_emissao || '',
                                  craf_definitivo_numero: venda.dados_tramite_arma?.craf_definitivo_numero || '',
                                  craf_definitivo_validade: venda.dados_tramite_arma?.craf_definitivo_validade || '',
                                  data_entrega_arma: venda.dados_tramite_arma?.data_entrega_arma || '',
                                  responsavel_entrega: venda.dados_tramite_arma?.responsavel_entrega || usuarioLogado?.nome_completo || '',
                                  observacoes: venda.dados_tramite_arma?.observacoes || ''
                                })
                              }}
                              style={{
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                color: '#FBBF24',
                                borderRadius: '6px',
                                padding: '0.25rem 0.55rem',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                              title="Gerenciar Trâmite da Arma (Autorização PF, NF e Entrega)"
                            >
                              <Shield size={13} />
                              Trâmite PF
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setReciboModalVenda(venda)
                              setTipoDocumentoRecibo('AUTO')
                            }}
                            style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', padding: '0.2rem' }}
                            title="Visualizar / Imprimir Documento Oficial"
                          >
                            <Printer size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEnviarWhatsAppRecibo(venda)}
                            style={{ background: 'none', border: 'none', color: '#25D366', cursor: 'pointer', padding: '0.2rem' }}
                            title="Enviar Comprovante / Proposta no WhatsApp"
                          >
                            <MessageCircle size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setModalExcluirVenda(venda)
                              setSenhaMasterInput('')
                              setErroSenhaMaster('')
                            }}
                            style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: '0.2rem' }}
                            title="Cancelar Venda (Restaura Estoque / Libera Armas)"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Nenhuma venda encontrada com os critérios informados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL NOVA VENDA DE BALCÃO (LAYOUT PDV 2 COLUNAS) ── */}
      {modalNovaVenda && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.88)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '0.75rem'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '1360px',
            height: '94vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.25rem',
            overflow: 'hidden',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            {/* Header do PDV */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ backgroundColor: 'rgba(245,158,11,0.15)', padding: '0.5rem', borderRadius: '8px', color: '#F59E0B' }}>
                  <ShoppingCart size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#F59E0B', margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Ponto de Venda de Balcão (PDV)
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Selecione a categoria ou pesquise o produto para adicionar com 1 clique ao carrinho.
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {carrinho.length > 0 && (
                  <button
                    type="button"
                    onClick={handleLimparCarrinho}
                    style={{ background: 'transparent', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171', padding: '0.35rem 0.65rem', borderRadius: '5px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
                    title="Esvaziar carrinho"
                  >
                    <RotateCcw size={13} /> Limpar Carrinho
                  </button>
                )}
                <button
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem' }}
                  onClick={() => setModalNovaVenda(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Corpo em 2 Colunas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.35fr) minmax(380px, 450px)',
              gap: '1rem',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden'
            }}>
              {/* ── COLUNA ESQUERDA: CATÁLOGO DE PRODUTOS ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', minHeight: 0, overflow: 'hidden' }}>
                
                {/* Barra de Busca Instantânea com leitor / filtro */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.45rem 0.75rem', flexShrink: 0 }}>
                  <Search size={16} color="#F59E0B" />
                  <input
                    type="text"
                    className="input-field"
                    style={{ border: 'none', background: 'transparent', padding: 0, fontSize: '0.82rem', width: '100%' }}
                    placeholder="Buscar por nome, calibre, código SKU, fabricante ou leitor de código de barras..."
                    value={buscaCatalogo}
                    onChange={e => setBuscaCatalogo(e.target.value)}
                    autoFocus
                  />
                  {buscaCatalogo && (
                    <button
                      type="button"
                      onClick={() => setBuscaCatalogo('')}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                      title="Limpar busca"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Abas de Categorias Rápidas com Contagem - Todas visíveis em linhas sem rolagem horizontal */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.35rem',
                  alignItems: 'center',
                  paddingBottom: '0.1rem',
                  flexShrink: 0
                }}>
                  {listaCategoriasDisponiveis.map(cat => {
                    const isAtiva = categoriaAtivaPDV === cat
                    const count = categoriasComContagem[cat] || 0
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoriaAtivaPDV(cat)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.3rem 0.65rem',
                          borderRadius: '16px',
                          fontSize: '0.73rem',
                          fontWeight: isAtiva ? '800' : '600',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          border: isAtiva ? '1px solid #F59E0B' : '1px solid var(--border-color)',
                          backgroundColor: isAtiva ? 'rgba(245, 158, 11, 0.18)' : 'var(--bg-input)',
                          color: isAtiva ? '#FBBF24' : 'var(--text-muted)'
                        }}
                      >
                        {getCategoryIcon(cat)}
                        <span>{cat}</span>
                        <span style={{
                          fontSize: '0.65rem',
                          padding: '0.08rem 0.35rem',
                          borderRadius: '10px',
                          backgroundColor: isAtiva ? '#F59E0B' : 'rgba(255,255,255,0.08)',
                          color: isAtiva ? '#000' : 'var(--text-muted)',
                          fontWeight: '800'
                        }}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Tabela de Produtos Tipo Planilha (Estilo Excel / Linhas e Colunas) */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  minHeight: 0,
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-input)'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#13161C', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <tr>
                        <th style={{ padding: '0.55rem 0.75rem', fontWeight: '800' }}>PRODUTO / ITEM</th>
                        <th style={{ padding: '0.55rem 0.6rem', fontWeight: '800', whiteSpace: 'nowrap' }}>SKU / CÓDIGO</th>
                        <th style={{ padding: '0.55rem 0.6rem', fontWeight: '800', whiteSpace: 'nowrap' }}>CATEGORIA</th>
                        <th style={{ padding: '0.55rem 0.6rem', fontWeight: '800', textAlign: 'center', whiteSpace: 'nowrap' }}>DISPONÍVEL</th>
                        <th style={{ padding: '0.55rem 0.75rem', fontWeight: '800', textAlign: 'right', whiteSpace: 'nowrap', minWidth: '95px' }}>VALOR UNIT.</th>
                        <th style={{ padding: '0.55rem 0.6rem', fontWeight: '800', textAlign: 'center', whiteSpace: 'nowrap' }}>NO CARRINHO</th>
                        <th style={{ padding: '0.55rem 0.6rem', fontWeight: '800', textAlign: 'center', whiteSpace: 'nowrap' }}>AÇÃO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtosFiltradosCatalogo.length > 0 ? (
                        produtosFiltradosCatalogo.map((item, idx) => {
                          const itemNoCart = carrinho.find(c => String(c.item_id) === String(item.id))
                          const qtdNoCart = itemNoCart ? itemNoCart.quantidade : 0
                          const qtdEstoque = parseInt(item.quantidade) || 0
                          const semEstoque = qtdNoCart >= qtdEstoque
                          const catNorm = normalizarCategoria(item)

                          return (
                            <tr
                              key={item.id}
                              onClick={() => !semEstoque && handleAdicionarAoCarrinho(item, 1)}
                              style={{
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                backgroundColor: itemNoCart
                                  ? 'rgba(245, 158, 11, 0.08)'
                                  : idx % 2 === 0
                                  ? 'rgba(255, 255, 255, 0.015)'
                                  : 'transparent',
                                cursor: semEstoque ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.12s ease',
                                opacity: semEstoque ? 0.55 : 1
                              }}
                              onMouseEnter={e => {
                                if (!semEstoque) e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.14)'
                              }}
                              onMouseLeave={e => {
                                if (!semEstoque) {
                                  e.currentTarget.style.backgroundColor = itemNoCart
                                    ? 'rgba(245, 158, 11, 0.08)'
                                    : idx % 2 === 0
                                    ? 'rgba(255, 255, 255, 0.015)'
                                    : 'transparent'
                                }
                              }}
                            >
                              {/* PRODUTO / ITEM */}
                              <td style={{ padding: '0.5rem 0.75rem' }}>
                                <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.82rem' }}>
                                  {item.nome}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem', flexWrap: 'wrap' }}>
                                  {item.calibre && (
                                    <span style={{ color: '#F59E0B', fontWeight: '700' }}>
                                      {item.calibre}
                                    </span>
                                  )}
                                  {item.calibre && item.fabricante && <span>•</span>}
                                  {item.fabricante && <span>{item.fabricante}</span>}
                                  {item.numero_serie && (
                                    <span style={{
                                      backgroundColor: 'rgba(245, 158, 11, 0.18)',
                                      color: '#FBBF24',
                                      border: '1px solid rgba(245, 158, 11, 0.4)',
                                      padding: '0.05rem 0.35rem',
                                      borderRadius: '4px',
                                      fontSize: '0.67rem',
                                      fontWeight: '800',
                                      fontFamily: 'monospace'
                                    }}>
                                      S/N: {item.numero_serie}
                                    </span>
                                  )}
                                  {item.lote_fabricante && (
                                    <span style={{
                                      backgroundColor: 'rgba(96, 165, 250, 0.18)',
                                      color: '#60A5FA',
                                      border: '1px solid rgba(96, 165, 250, 0.4)',
                                      padding: '0.05rem 0.35rem',
                                      borderRadius: '4px',
                                      fontSize: '0.67rem',
                                      fontWeight: '700'
                                    }}>
                                      Lote: {item.lote_fabricante}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* SKU / CÓDIGO */}
                              <td style={{ padding: '0.5rem 0.6rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                                {item.codigo_sku || 'S/N'}
                              </td>

                              {/* CATEGORIA */}
                              <td style={{ padding: '0.5rem 0.6rem', whiteSpace: 'nowrap' }}>
                                <span style={{
                                  fontSize: '0.68rem',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                  color: 'var(--text-muted)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {getCategoryIcon(catNorm)}
                                  {catNorm}
                                </span>
                              </td>

                              {/* DISPONÍVEL */}
                              <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: '800',
                                  color: qtdEstoque <= 2 ? '#F87171' : '#34D399',
                                  backgroundColor: qtdEstoque <= 2 ? 'rgba(248, 113, 113, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {qtdEstoque} {item.unidade || 'UN'}
                                </span>
                              </td>

                              {/* VALOR UNIT. */}
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '800', color: '#10B981', fontSize: '0.86rem', whiteSpace: 'nowrap', minWidth: '95px' }}>
                                {formatarMoeda(item.preco_venda)}
                              </td>

                              {/* NO CARRINHO */}
                              <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                {qtdNoCart > 0 ? (
                                  <span style={{
                                    fontSize: '0.68rem',
                                    fontWeight: '800',
                                    color: '#F59E0B',
                                    backgroundColor: 'rgba(245, 158, 11, 0.18)',
                                    border: '1px solid rgba(245, 158, 11, 0.35)',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '10px',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {qtdNoCart} no carrinho
                                  </span>
                                ) : (
                                  <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.75rem' }}>-</span>
                                )}
                              </td>

                              {/* AÇÃO */}
                              <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                <button
                                  type="button"
                                  disabled={semEstoque}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAdicionarAoCarrinho(item, 1)
                                  }}
                                  style={{
                                    backgroundColor: semEstoque ? '#374151' : '#10B981',
                                    border: 'none',
                                    color: '#FFF',
                                    borderRadius: '4px',
                                    padding: '0.25rem 0.55rem',
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    cursor: semEstoque ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title={semEstoque ? 'Estoque esgotado' : 'Adicionar ao carrinho'}
                                >
                                  <Plus size={13} />
                                  {semEstoque ? 'Esgotado' : 'Incluir'}
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Package size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>Nenhum produto encontrado</div>
                            <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                              Tente selecionar outra categoria ou limpar o termo de pesquisa.
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── COLUNA DIREITA: PEDIDO, CARRINHO & CHECKOUT ── */}
              <form onSubmit={handleFinalizarVenda} style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: 0,
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '0.85rem',
                gap: '0.65rem',
                overflow: 'hidden'
              }}>
                {/* Topo do Carrinho: Cliente e Status */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                      CLIENTE REQUERENTE *
                    </label>
                    <span style={{ fontSize: '0.7rem', color: '#F59E0B', fontWeight: '800' }}>
                      {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'} no carrinho
                    </span>
                  </div>
                  <CustomSelect
                    value={clienteSelecionado}
                    onChange={val => {
                      setClienteSelecionado(val)
                      const cli = (clientes || []).find(c => c.nome_completo === val)
                      if (cli && cli.armas && cli.armas.length > 0 && !dadosMunicaoForm.numero_craf) {
                        const primArma = cli.armas[0]
                        setDadosMunicaoForm(prev => ({
                          ...prev,
                          arma_acervo_id: primArma.id,
                          numero_craf: primArma.numero_craf || primArma.numero_sigma_sinarm || '',
                          orgao_emissor: primArma.orgao_registro || primArma.sistema_registro || 'SINARM',
                          calibre_craf: primArma.calibre || '',
                          validade_craf: primArma.validade_craf || ''
                        }))
                      }
                    }}
                    options={['CLIENTE AVULSO / BALCÃO', ...(clientes || []).map(c => c.nome_completo)]}
                    placeholder="Selecione ou digite o nome..."
                    allowCustom={true}
                  />

                  {/* Alerta de obrigatoriedade de cliente para Armas / Munições */}
                  {(temArmaNoCarrinho || temMunicaoNoCarrinho) && clienteSelecionado === 'CLIENTE AVULSO / BALCÃO' && (
                    <div style={{ color: '#F87171', fontSize: '0.69rem', fontWeight: '700', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <AlertTriangle size={13} />
                      Exigência Legal: Selecione um cliente cadastrado para {temArmaNoCarrinho ? 'armas de fogo' : 'munições'}.
                    </div>
                  )}

                  {/* Informativo de Venda de Arma (PF / SIGMA) */}
                  {temArmaNoCarrinho && (
                    <div style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: '6px',
                      padding: '0.45rem 0.6rem',
                      fontSize: '0.71rem',
                      color: '#FBBF24',
                      display: 'flex',
                      gap: '0.4rem',
                      alignItems: 'flex-start',
                      marginTop: '0.35rem'
                    }}>
                      <Shield size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                      <div>
                        <strong>Venda de Arma de Fogo (PF / SIGMA):</strong>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.67rem', marginTop: '0.1rem', lineHeight: '1.3' }}>
                          A arma será <strong>RESERVADA</strong> no estoque e emitida a <strong>Declaração de Proposta de Venda</strong> para o processo na PF/Exército. A Nota Fiscal é emitida após deferimento.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Painel de Controle de Munições (SICOVEM / PF) */}
                  {temMunicaoNoCarrinho && (
                    <div style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.09)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '6px',
                      padding: '0.5rem 0.65rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      marginTop: '0.35rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#60A5FA', fontWeight: '800', fontSize: '0.72rem' }}>
                        <Target size={13} />
                        CONTROLE DE MUNIÇÕES (SICOVEM / PF / SIGMA)
                      </div>

                      {clienteSelecionadoObj?.armas && clienteSelecionadoObj.armas.length > 0 && (
                        <div>
                          <label style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Arma do Acervo do Cliente:</label>
                          <select
                            className="input-field"
                            style={{ height: '26px', fontSize: '0.72rem', padding: '0.15rem 0.35rem' }}
                            value={dadosMunicaoForm.arma_acervo_id}
                            onChange={e => {
                              const aId = e.target.value
                              const armaSel = (clienteSelecionadoObj.armas || []).find(a => String(a.id) === String(aId))
                              if (armaSel) {
                                setDadosMunicaoForm(prev => ({
                                  ...prev,
                                  arma_acervo_id: aId,
                                  numero_craf: armaSel.numero_craf || armaSel.numero_sigma_sinarm || '',
                                  orgao_emissor: armaSel.orgao_registro || armaSel.sistema_registro || 'SINARM',
                                  calibre_craf: armaSel.calibre || '',
                                  validade_craf: armaSel.validade_craf || ''
                                }))
                              } else {
                                setDadosMunicaoForm(prev => ({ ...prev, arma_acervo_id: '' }))
                              }
                            }}
                          >
                            <option value="">-- Selecionar do acervo ou preencher abaixo --</option>
                            {(clienteSelecionadoObj.armas || []).map(a => (
                              <option key={a.id} value={a.id}>
                                {a.marca} {a.modelo} ({a.calibre}) - CRAF: {a.numero_craf || 'S/N'}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.35rem' }}>
                        <div>
                          <label style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Nº do CRAF *</label>
                          <input
                            type="text"
                            className="input-field"
                            style={{ height: '26px', fontSize: '0.74rem' }}
                            placeholder="Ex: CRAF-998877"
                            value={dadosMunicaoForm.numero_craf}
                            onChange={e => setDadosMunicaoForm({ ...dadosMunicaoForm, numero_craf: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Órgão Registro *</label>
                          <select
                            className="input-field"
                            style={{ height: '26px', fontSize: '0.72rem', padding: '0.15rem 0.35rem' }}
                            value={dadosMunicaoForm.orgao_emissor}
                            onChange={e => setDadosMunicaoForm({ ...dadosMunicaoForm, orgao_emissor: e.target.value })}
                          >
                            <option value="SINARM">SINARM (PF)</option>
                            <option value="SIGMA">SIGMA (Exército)</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.35rem' }}>
                        <div>
                          <label style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Calibre do CRAF *</label>
                          <input
                            type="text"
                            className="input-field"
                            style={{ height: '26px', fontSize: '0.74rem' }}
                            placeholder="Ex: 9x19mm Luger"
                            value={dadosMunicaoForm.calibre_craf}
                            onChange={e => setDadosMunicaoForm({ ...dadosMunicaoForm, calibre_craf: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>Validade CRAF</label>
                          <input
                            type="date"
                            className="input-field"
                            style={{ height: '26px', fontSize: '0.72rem' }}
                            value={dadosMunicaoForm.validade_craf}
                            onChange={e => setDadosMunicaoForm({ ...dadosMunicaoForm, validade_craf: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista de Itens no Carrinho (Área Rolável com Cartões Espaçosos) */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  minHeight: 0,
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  padding: '0.45rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}>
                  {carrinho.length > 0 ? (
                    carrinho.map(item => (
                      <div
                        key={item.item_id}
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '0.6rem 0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem'
                        }}
                      >
                        {/* Linha 1: Nome Completo do Item + Botão de Excluir */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div style={{
                            fontSize: '0.82rem',
                            fontWeight: '700',
                            color: 'var(--text-main)',
                            lineHeight: '1.3',
                            wordBreak: 'break-word'
                          }}>
                            {item.nome}
                            {item.numero_serie && (
                              <div style={{
                                display: 'inline-block',
                                marginLeft: '0.35rem',
                                backgroundColor: 'rgba(245, 158, 11, 0.18)',
                                color: '#FBBF24',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                                padding: '0.05rem 0.35rem',
                                borderRadius: '4px',
                                fontSize: '0.67rem',
                                fontWeight: '800',
                                fontFamily: 'monospace'
                              }}>
                                S/N: {item.numero_serie}
                              </div>
                            )}
                            {item.lote_fabricante && (
                              <div style={{
                                display: 'inline-block',
                                marginLeft: '0.35rem',
                                backgroundColor: 'rgba(96, 165, 250, 0.18)',
                                color: '#60A5FA',
                                border: '1px solid rgba(96, 165, 250, 0.4)',
                                padding: '0.05rem 0.35rem',
                                borderRadius: '4px',
                                fontSize: '0.67rem',
                                fontWeight: '700'
                              }}>
                                Lote: {item.lote_fabricante}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoverDoCarrinho(item.item_id)}
                            style={{
                              background: 'rgba(248, 113, 113, 0.1)',
                              border: '1px solid rgba(248, 113, 113, 0.25)',
                              borderRadius: '4px',
                              color: '#F87171',
                              cursor: 'pointer',
                              padding: '0.2rem 0.35rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                            title="Remover do carrinho"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Linha 2: Detalhes à esquerda (SKU e Unitário), Stepper e Subtotal à direita */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.35rem' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            <span style={{ color: '#F59E0B', fontWeight: '700' }}>{formatarMoeda(item.preco_unitario)}</span> un.
                            {item.sku && <span style={{ marginLeft: '0.3rem', opacity: 0.8 }}>({item.sku})</span>}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            {/* Controles de Quantidade */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <button
                                type="button"
                                onClick={() => handleDecrementarQtd(item.item_id)}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--border-color)',
                                  backgroundColor: 'var(--bg-input)',
                                  color: 'var(--text-main)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.8rem',
                                  fontWeight: '800'
                                }}
                                title="Diminuir quantidade"
                              >
                                <Minus size={12} />
                              </button>

                              <input
                                type="number"
                                min="1"
                                value={item.quantidade}
                                onChange={e => handleAlterarQtdCarrinho(item.item_id, e.target.value)}
                                style={{
                                  width: '42px',
                                  height: '24px',
                                  textAlign: 'center',
                                  backgroundColor: 'var(--bg-input)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '4px',
                                  color: '#F59E0B',
                                  fontWeight: '800',
                                  fontSize: '0.78rem',
                                  padding: 0
                                }}
                              />

                              <button
                                type="button"
                                onClick={() => handleIncrementarQtd(item.item_id)}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--border-color)',
                                  backgroundColor: 'var(--bg-input)',
                                  color: 'var(--text-main)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.8rem',
                                  fontWeight: '800'
                                }}
                                title="Aumentar quantidade"
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            {/* Subtotal */}
                            <div style={{ textAlign: 'right', minWidth: '75px', fontSize: '0.86rem', fontWeight: '800', color: '#10B981', whiteSpace: 'nowrap' }}>
                              {formatarMoeda(item.subtotal)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem 1rem' }}>
                      <ShoppingCart size={32} style={{ opacity: 0.3, margin: '0 auto 0.4rem auto' }} />
                      <div style={{ fontSize: '0.78rem', fontWeight: '600' }}>Carrinho vazio</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Clique nos produtos ao lado para incluir na venda.</div>
                    </div>
                  )}
                </div>

                {/* Pagamento & Desconto */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem', flexShrink: 0 }}>
                  <CustomSelect
                    label="Forma de Pagamento *"
                    value={formaPagamento}
                    onChange={val => setFormaPagamento(val)}
                    options={['Dinheiro', 'PIX', 'Cartão de Crédito na máquina', 'Cartão de Débito na máquina']}
                    allowCustom={false}
                  />

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>DESCONTO (R$)</label>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      style={{ height: '34px', fontSize: '0.8rem' }}
                      value={descontoVenda}
                      onChange={e => setDescontoVenda(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Atalhos Rápidos de Desconto */}
                {valorSubtotalCarrinho > 0 && (
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', flexShrink: 0 }}>
                    <button type="button" onClick={() => setDescontoVenda(0)} style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem', borderRadius: '4px', border: '1px solid #4B5563', background: '#1F2937', color: '#D1D5DB', cursor: 'pointer', fontWeight: '700' }}>0%</button>
                    <button type="button" onClick={() => setDescontoVenda((valorSubtotalCarrinho * 0.05).toFixed(2))} style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem', borderRadius: '4px', border: '1px solid #F59E0B', background: 'rgba(245,158,11,0.15)', color: '#FBBF24', cursor: 'pointer', fontWeight: '700' }}>-5%</button>
                    <button type="button" onClick={() => setDescontoVenda((valorSubtotalCarrinho * 0.10).toFixed(2))} style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem', borderRadius: '4px', border: '1px solid #F59E0B', background: 'rgba(245,158,11,0.15)', color: '#FBBF24', cursor: 'pointer', fontWeight: '700' }}>-10%</button>
                    <button type="button" onClick={() => setDescontoVenda((valorSubtotalCarrinho * 0.15).toFixed(2))} style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem', borderRadius: '4px', border: '1px solid #F59E0B', background: 'rgba(245,158,11,0.15)', color: '#FBBF24', cursor: 'pointer', fontWeight: '700' }}>-15%</button>
                    <button type="button" onClick={() => setDescontoVenda((valorSubtotalCarrinho * 0.20).toFixed(2))} style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem', borderRadius: '4px', border: '1px solid #F59E0B', background: 'rgba(245,158,11,0.15)', color: '#FBBF24', cursor: 'pointer', fontWeight: '700' }}>-20%</button>
                    <button type="button" onClick={() => setDescontoVenda(50)} style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem', borderRadius: '4px', border: '1px solid #10B981', background: 'rgba(16,185,129,0.15)', color: '#34D399', cursor: 'pointer', fontWeight: '700' }}>- R$50</button>
                  </div>
                )}

                {/* Troco se Dinheiro */}
                {formaPagamento === 'Dinheiro' && (
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '0.5rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', flexShrink: 0 }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#34D399' }}>Valor Recebido (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        style={{ height: '30px', fontSize: '0.78rem' }}
                        value={valorPagoCliente}
                        onChange={e => setValorPagoCliente(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Troco a Devolver</label>
                      <div style={{ fontSize: '0.95rem', fontWeight: '800', color: valorTrocoDevolver > 0 ? '#F59E0B' : '#FFFFFF', paddingTop: '0.2rem' }}>
                        {formatarMoeda(valorTrocoDevolver)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Resumo Final & Totalizadores */}
                <div style={{ backgroundColor: 'rgba(245,158,11,0.08)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.25)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Subtotal: {formatarMoeda(valorSubtotalCarrinho)} {valorDescontoNum > 0 ? `| Desc: -${formatarMoeda(valorDescontoNum)}` : ''}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#F59E0B', textTransform: 'uppercase' }}>
                      TOTAL DA VENDA
                    </div>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#10B981' }}>
                    {formatarMoeda(valorFinalCarrinho)}
                  </div>
                </div>

                {/* Botão de Finalizar */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setModalNovaVenda(false)}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-gold"
                    disabled={carrinho.length === 0}
                    style={{
                      flex: 2,
                      backgroundColor: carrinho.length === 0 ? '#374151' : temArmaNoCarrinho ? '#F59E0B' : '#10B981',
                      borderColor: carrinho.length === 0 ? '#4B5563' : temArmaNoCarrinho ? '#D97706' : '#059669',
                      color: '#FFF',
                      justifyContent: 'center',
                      fontWeight: '800',
                      padding: '0.6rem',
                      boxShadow: carrinho.length > 0 ? (temArmaNoCarrinho ? '0 4px 14px rgba(245,158,11,0.35)' : '0 4px 14px rgba(16,185,129,0.3)') : 'none',
                      cursor: carrinho.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {temArmaNoCarrinho ? <Shield size={16} /> : <CheckCircle2 size={16} />}
                    <span>{temArmaNoCarrinho ? 'Registrar Venda & Gerar Proposta PF/Exército' : 'Finalizar Venda & Recibo'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL RECIBO DE VENDA MULTIDOCUMENTO (PROPOSTA PF, SICOVEM, TERMO DE ENTREGA & BALCÃO) ── */}
      {reciboModalVenda && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 9999, padding: '2rem 1rem', overflowY: 'auto' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '780px', backgroundColor: '#FFFFFF', color: '#111827', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', padding: '2rem', margin: 'auto 0' }}>
            
            {/* BARRA SUPERIOR DE CONTROLE E ABAS DE DOCUMENTO (NÃO IMPRESSO) */}
            <div className="no-print" style={{ marginBottom: '1.25rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} color="#D97706" />
                  <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1F2937', textTransform: 'uppercase' }}>
                    Documentos da Venda #V-{reciboModalVenda.numero_venda}
                  </span>
                </div>
                <button
                  onClick={() => setReciboModalVenda(null)}
                  style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4B5563' }}
                  title="Fechar"
                >
                  <X size={16} />
                </button>
              </div>

              {/* SELETOR DE MODELO DE DOCUMENTO */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setTipoDocumentoRecibo('RECIBO_PAGAMENTO')}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: docReciboAtivo === 'RECIBO_PAGAMENTO' ? '800' : '600',
                    backgroundColor: docReciboAtivo === 'RECIBO_PAGAMENTO' ? '#1F2937' : '#F3F4F6',
                    color: docReciboAtivo === 'RECIBO_PAGAMENTO' ? '#FFFFFF' : '#4B5563',
                    border: '1px solid #D1D5DB',
                    cursor: 'pointer'
                  }}
                >
                  📋 Comprovante de Balcão
                </button>

                {temArmaNoRecibo && (
                  <button
                    type="button"
                    onClick={() => setTipoDocumentoRecibo('PROPOSTA_PF')}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: docReciboAtivo === 'PROPOSTA_PF' ? '800' : '600',
                      backgroundColor: docReciboAtivo === 'PROPOSTA_PF' ? '#D97706' : '#FEF3C7',
                      color: docReciboAtivo === 'PROPOSTA_PF' ? '#FFFFFF' : '#92400E',
                      border: '1px solid #F59E0B',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Shield size={12} />
                    📜 Proposta de Compra (PF / SIGMA)
                  </button>
                )}

                {(temMunicaoNoRecibo || (reciboModalVenda.itens || []).some(isItemMunicao)) && (
                  <button
                    type="button"
                    onClick={() => setTipoDocumentoRecibo('MUNICHOES_SICOVEM')}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: docReciboAtivo === 'MUNICHOES_SICOVEM' ? '800' : '600',
                      backgroundColor: docReciboAtivo === 'MUNICHOES_SICOVEM' ? '#2563EB' : '#DBEAFE',
                      color: docReciboAtivo === 'MUNICHOES_SICOVEM' ? '#FFFFFF' : '#1E40AF',
                      border: '1px solid #3B82F6',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Target size={12} />
                    🎯 Registro de Munições (SICOVEM)
                  </button>
                )}

                {temArmaNoRecibo && (
                  <button
                    type="button"
                    onClick={() => setTipoDocumentoRecibo('TERMO_ENTREGA')}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: docReciboAtivo === 'TERMO_ENTREGA' ? '800' : '600',
                      backgroundColor: docReciboAtivo === 'TERMO_ENTREGA' ? '#059669' : '#D1FAE5',
                      color: docReciboAtivo === 'TERMO_ENTREGA' ? '#FFFFFF' : '#065F46',
                      border: '1px solid #10B981',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <FileCheck size={12} />
                    🤝 Termo de Entrega Definitiva
                  </button>
                )}
              </div>
            </div>

            {/* ── ÁREA IMPRESSA DO DOCUMENTO ── */}
            <div className="print-area" style={{ fontFamily: 'Inter, sans-serif', color: '#111827' }}>
              
              {/* CABEÇALHO OFICIAL DA ARMERIA */}
              <div style={{ textAlign: 'center', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.35rem' }}>
                  <img
                    src={config?.logo_url || "/logo.png"}
                    alt={config?.nome_fantasia || 'Pró Guns Armeria'}
                    style={{ maxHeight: '70px', objectFit: 'contain' }}
                  />
                </div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: '900', fontFamily: 'Cinzel, serif', color: '#000000', margin: '0.1rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {config?.nome_fantasia || 'PRÓ GUNS ARMERIA'}
                </h1>
                {config?.razao_social && (
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>
                    {config.razao_social}
                  </div>
                )}
                <div style={{ fontSize: '0.76rem', color: '#4B5563', marginTop: '0.1rem' }}>
                  {[
                    config?.cnpj ? `CNPJ: ${config.cnpj}` : null,
                    config?.cr_armeria ? `CR Exército: ${config.cr_armeria}` : null,
                    config?.rm_armeria ? config.rm_armeria : null
                  ].filter(Boolean).join(' | ')}
                </div>
                {(config?.endereco || config?.cidade) && (
                  <div style={{ fontSize: '0.74rem', color: '#4B5563', marginTop: '0.1rem' }}>
                    📍 {config?.endereco || ''}{config?.cidade ? ` — ${config.cidade}/${config.uf || ''}` : ''}
                  </div>
                )}
                {(config?.telefone || config?.whatsapp || config?.email) && (
                  <div style={{ fontSize: '0.74rem', color: '#4B5563', marginTop: '0.1rem' }}>
                    {[config?.telefone ? `Tel: ${config.telefone}` : null, config?.whatsapp ? `WhatsApp: ${config.whatsapp}` : null, config?.email ? config.email : null].filter(Boolean).join(' • ')}
                  </div>
                )}
                <hr style={{ border: 'none', borderTop: '2px solid #000000', marginTop: '0.5rem', marginBottom: '1rem' }} />
              </div>

              {/* ══════════════════════════════════════════════════════════════════════
                  DOCUMENTO 1: DECLARAÇÃO DE PROPOSTA DE COMPRA E RESERVA DE ARMA
                  ══════════════════════════════════════════════════════════════════════ */}
              {docReciboAtivo === 'PROPOSTA_PF' && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '1.2rem', padding: '0.4rem', border: '1.5px solid #000', backgroundColor: '#F9FAFB' }}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#000', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      DECLARAÇÃO DE PROPOSTA DE COMPRA E RESERVA DE ARMA DE FOGO
                    </h2>
                    <div style={{ fontSize: '0.72rem', color: '#4B5563', marginTop: '0.2rem', fontStyle: 'italic' }}>
                      Documento emitido para instrução de Requerimento de Aquisição junto ao SINARM (Polícia Federal) ou SIGMA (Comando do Exército) — Lei Federal nº 10.826/2003
                    </div>
                    <div style={{ fontSize: '0.76rem', fontWeight: '800', color: '#111827', marginTop: '0.3rem' }}>
                      PROPOSTA Nº: PROP-#{reciboModalVenda.numero_venda}/{new Date(reciboModalVenda.data || Date.now()).getFullYear()} &nbsp;|&nbsp; DATA DE EMISSÃO: {formatarData(reciboModalVenda.data)}
                    </div>
                  </div>

                  {/* 1. DADOS DO REQUERENTE / COMPRADOR */}
                  <div style={{ marginBottom: '1rem', border: '1px solid #D1D5DB', padding: '0.65rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: '#111827', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.25rem', marginBottom: '0.45rem' }}>
                      1. QUALIFICAÇÃO DO PROPONENTE / COMPRADOR (ADQUIRENTE)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                      <div><strong>Nome Completo:</strong> {reciboModalVenda.cliente_nome?.toUpperCase()}</div>
                      <div><strong>CPF:</strong> {clienteRecibo?.cpf || reciboModalVenda.cliente_cpf || '—'}</div>
                      <div><strong>RG / Órgão:</strong> {clienteRecibo?.rg || reciboModalVenda.cliente_rg || '—'}</div>
                      <div><strong>Nº do CR (se aplicável):</strong> {clienteRecibo?.numero_cr || reciboModalVenda.cliente_cr || '—'}</div>
                      <div><strong>Telefone:</strong> {clienteRecibo?.telefone || reciboModalVenda.cliente_telefone || '—'}</div>
                      <div><strong>E-mail:</strong> {clienteRecibo?.email || reciboModalVenda.cliente_email || '—'}</div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <strong>Endereço Residencial:</strong> {clienteRecibo?.endereco || reciboModalVenda.cliente_endereco || '—'}{clienteRecibo?.cidade ? ` — ${clienteRecibo.cidade}/${clienteRecibo.uf || ''}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* 2. ESPECIFICAÇÕES TÉCNICAS DO ARMAMENTO RESERVADO */}
                  <div style={{ marginBottom: '1rem', border: '1px solid #D1D5DB', padding: '0.65rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: '#111827', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.25rem', marginBottom: '0.45rem' }}>
                      2. ESPECIFICAÇÕES TÉCNICAS DO ARMAMENTO RESERVADO
                    </div>
                    {(reciboModalVenda.itens || []).filter(isItemArmaDeFogo).concat(
                      (reciboModalVenda.itens || []).filter(isItemArmaDeFogo).length === 0 ? (reciboModalVenda.itens || []) : []
                    ).map((it, idx) => {
                      const sp = getArmaSpecs(it)
                      return (
                        <div key={idx} style={{ backgroundColor: '#F9FAFB', border: '1.5px solid #000', padding: '0.65rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                            <div><strong>Tipo de Armamento:</strong> {sp.tipo_arma?.toUpperCase()}</div>
                            <div><strong>Marca / Fabricante:</strong> {sp.fabricante?.toUpperCase()}</div>
                            <div><strong>Modelo Comercial:</strong> {sp.modelo}</div>
                            <div><strong>Calibre Nominal:</strong> {sp.calibre}</div>
                            <div style={{ gridColumn: 'span 2', backgroundColor: '#FEF3C7', padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #F59E0B' }}>
                              <strong style={{ color: '#B45309', fontSize: '0.82rem' }}>NÚMERO DE SÉRIE DA ARMA:</strong>
                              <span style={{ fontSize: '0.95rem', fontWeight: '900', fontFamily: 'monospace', marginLeft: '0.5rem', color: '#111827' }}>
                                {sp.numero_serie || 'NÃO INFORMADO'}
                              </span>
                            </div>
                            <div><strong>Tamanho / Comprimento do Cano:</strong> {sp.comprimento_cano}</div>
                            <div><strong>Acabamento:</strong> {sp.acabamento}</div>
                            <div><strong>Raiamento (Qtd de Raias):</strong> {sp.quantidade_raias}</div>
                            <div><strong>Sentido das Raias:</strong> {sp.sentido_raias}</div>
                            <div><strong>Tipo de Funcionamento:</strong> {sp.tipo_funcionamento}</div>
                            <div><strong>Capacidade de Disparos:</strong> {sp.capacidade_tiros}</div>
                            <div style={{ gridColumn: 'span 2' }}>
                              <strong>Carregadores Inclusos:</strong> {sp.possui_carregadores ? `Sim, acompanha ${sp.quantidade_carregadores || '2'} carregador(es)` : 'Não possui carregador destacável (Tambor / Depósito tubular)'}
                            </div>
                            <div><strong>Valor Comercial da Arma:</strong> {formatarMoeda(it.subtotal || it.preco_unitario)}</div>
                            <div style={{ fontWeight: '700', color: '#047857' }}>
                              Situação Física: RESERVADA NO COFRE FORTE DA ARMERIA (Disponibilidade Garantida)
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* 3. DECLARAÇÃO FORMAL DE COMPROMISSO LEGAL */}
                  <div style={{ marginBottom: '1.2rem', border: '1px solid #D1D5DB', padding: '0.65rem', borderRadius: '4px', fontSize: '0.74rem', lineHeight: '1.45', textAlign: 'justify', color: '#1F2937' }}>
                    <div style={{ fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                      3. DECLARAÇÃO DE RESERVA E CONFORMIDADE LEGAL
                    </div>
                    <p style={{ margin: '0 0 0.4rem 0' }}>
                      A empresa <strong>{config?.razao_social || config?.nome_fantasia || 'PRÓ GUNS ARMERIA'}</strong>, inscrita no CNPJ sob o nº <strong>{config?.cnpj || '—'}</strong> e registrada no Comando do Exército sob o CR nº <strong>{config?.cr_armeria || '—'}</strong>, DECLARA para os devidos fins de instrução de processo de autorização de aquisição de arma de fogo junto ao SINARM (Polícia Federal) ou SIGMA (Comando do Exército), nos termos da Lei Federal nº 10.826/2003 e Decretos Regulamentadores:
                    </p>
                    <ol style={{ margin: '0 0 0.4rem 1.2rem', padding: 0 }}>
                      <li>Que a arma de fogo de características técnicas e número de série acima discriminados encontra-se <strong>VENDIDA SOB CONDIÇÃO SUSPENSIVA E EFETIVAMENTE RESERVADA</strong> em nosso estoque físico em favor exclusivo do(a) adquirente supraqualificado(a), não podendo ser alienada a terceiros;</li>
                      <li>Que a respectiva <strong>Nota Fiscal Eletrônica (NF-e)</strong> só será emitida após a apresentação da competente <strong>Autorização de Aquisição deferida</strong> pela autoridade policial ou militar competente;</li>
                      <li>Que a <strong>Entrega Física</strong> do armamento fica estritamente condicionada à expedição prévia do <strong>Certificado de Registro de Arma de Fogo (CRAF)</strong> e da competente <strong>Guia de Trânsito</strong> emitida pelo órgão regulador em nome do adquirente;</li>
                      <li>O armamento permanece sob custódia e inteira responsabilidade desta empresa em cofre de segurança até o desfecho formal do procedimento.</li>
                    </ol>
                  </div>

                  {/* 4. LOCAL, DATA E ASSINATURAS */}
                  <div style={{ marginTop: '1.8rem', textAlign: 'center', fontSize: '0.78rem' }}>
                    <div style={{ marginBottom: '2.5rem', fontWeight: '600' }}>
                      {config?.cidade || 'Jataí'} - {config?.uf || 'GO'}, {getDataExtenso(reciboModalVenda.data)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem' }}>
                      <div style={{ width: '48%', borderTop: '1.5px solid #000', paddingTop: '0.4rem' }}>
                        <strong>{reciboModalVenda.cliente_nome?.toUpperCase()}</strong><br />
                        <span style={{ fontSize: '0.72rem', color: '#4B5563' }}>CPF: {clienteRecibo?.cpf || reciboModalVenda.cliente_cpf || '—'}<br />Proponente / Comprador</span>
                      </div>
                      <div style={{ width: '48%', borderTop: '1.5px solid #000', paddingTop: '0.4rem' }}>
                        <strong>{config?.razao_social || config?.nome_fantasia || 'Pró Guns Armeria'}</strong><br />
                        <span style={{ fontSize: '0.72rem', color: '#4B5563' }}>CNPJ: {config?.cnpj || '—'} | CR: {config?.cr_armeria || '—'}<br />Responsável Legal / Armeiro Credenciado</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════════════
                  DOCUMENTO 2: REGISTRO DE AQUISIÇÃO DE MUNIÇÕES (SICOVEM / PF / EXÉRCITO)
                  ══════════════════════════════════════════════════════════════════════ */}
              {docReciboAtivo === 'MUNICHOES_SICOVEM' && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '1.2rem', padding: '0.4rem', border: '1.5px solid #000', backgroundColor: '#EFF6FF' }}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1E40AF', margin: 0, textTransform: 'uppercase' }}>
                      REGISTRO DE AQUISIÇÃO DE MUNIÇÕES (SICOVEM / SINARM / SIGMA)
                    </h2>
                    <div style={{ fontSize: '0.72rem', color: '#4B5563', marginTop: '0.2rem' }}>
                      Controle Obrigatório de Venda de Munições e Cartuchos — Vinculação a CRAF Válido
                    </div>
                    <div style={{ fontSize: '0.76rem', fontWeight: '800', color: '#111827', marginTop: '0.3rem' }}>
                      COMPROVANTE Nº: V-{reciboModalVenda.numero_venda} &nbsp;|&nbsp; DATA: {formatarData(reciboModalVenda.data)} às {reciboModalVenda.hora || ''}
                    </div>
                  </div>

                  {/* 1. DADOS DO ADQUIRENTE */}
                  <div style={{ marginBottom: '1rem', border: '1px solid #D1D5DB', padding: '0.65rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: '#111827', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.25rem', marginBottom: '0.45rem' }}>
                      1. IDENTIFICAÇÃO DO ADQUIRENTE
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                      <div><strong>Nome Completo:</strong> {reciboModalVenda.cliente_nome?.toUpperCase()}</div>
                      <div><strong>CPF:</strong> {clienteRecibo?.cpf || reciboModalVenda.cliente_cpf || '—'}</div>
                      <div><strong>RG / Órgão:</strong> {clienteRecibo?.rg || reciboModalVenda.cliente_rg || '—'}</div>
                      <div><strong>CR do Exército (se houver):</strong> {clienteRecibo?.numero_cr || reciboModalVenda.cliente_cr || '—'}</div>
                      <div><strong>Telefone:</strong> {clienteRecibo?.telefone || reciboModalVenda.cliente_telefone || '—'}</div>
                      <div><strong>Cidade/UF:</strong> {clienteRecibo?.cidade ? `${clienteRecibo.cidade}/${clienteRecibo.uf || ''}` : '—'}</div>
                    </div>
                  </div>

                  {/* 2. DADOS DO CRAF VINCULADO */}
                  <div style={{ marginBottom: '1rem', border: '1.5px solid #2563EB', backgroundColor: '#F0F9FF', padding: '0.65rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: '#1E40AF', borderBottom: '1px solid #BFDBFE', paddingBottom: '0.25rem', marginBottom: '0.45rem' }}>
                      2. COMPROVAÇÃO DE REGISTRO DA ARMA COMPRADORA (CRAF APRESENTADO)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                      <div><strong>Nº do CRAF Apresentado:</strong> <span style={{ fontWeight: '800', fontFamily: 'monospace' }}>{reciboModalVenda.dados_regulamento_municao?.numero_craf || 'NÃO INFORMADO'}</span></div>
                      <div><strong>Órgão Emissor do CRAF:</strong> {reciboModalVenda.dados_regulamento_municao?.orgao_emissor || 'SINARM / PF'}</div>
                      <div><strong>Calibre Autorizado no CRAF:</strong> <span style={{ fontWeight: '800' }}>{reciboModalVenda.dados_regulamento_municao?.calibre_craf || '—'}</span></div>
                      <div><strong>Validade do CRAF:</strong> {reciboModalVenda.dados_regulamento_municao?.validade_craf ? formatarData(reciboModalVenda.dados_regulamento_municao.validade_craf) : '—'}</div>
                      {reciboModalVenda.dados_regulamento_municao?.observacoes_guia && (
                        <div style={{ gridColumn: 'span 2' }}><strong>Observações / Guia de Tráfego:</strong> {reciboModalVenda.dados_regulamento_municao.observacoes_guia}</div>
                      )}
                    </div>
                  </div>

                  {/* 3. DISCRIMINAÇÃO DAS MUNIÇÕES E LOTES */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: '#111827', marginBottom: '0.4rem' }}>
                      3. MUNIÇÕES ADQUIRIDAS E CONTROLE DE LOTES DO FABRICANTE
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', border: '1px solid #D1D5DB' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '1.5px solid #000', textAlign: 'left' }}>
                          <th style={{ padding: '0.4rem 0.5rem' }}>PRODUTO / DISCRIMINAÇÃO</th>
                          <th style={{ padding: '0.4rem 0.5rem' }}>CALIBRE</th>
                          <th style={{ padding: '0.4rem 0.5rem' }}>LOTE FABRICANTE (CBC)</th>
                          <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>QTD</th>
                          <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>VALOR UNIT.</th>
                          <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>SUBTOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(reciboModalVenda.itens || []).map((it, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                            <td style={{ padding: '0.45rem 0.5rem' }}><strong>{it.nome}</strong></td>
                            <td style={{ padding: '0.45rem 0.5rem' }}>{it.calibre || '—'}</td>
                            <td style={{ padding: '0.45rem 0.5rem', fontFamily: 'monospace', fontWeight: '800', color: '#1E40AF' }}>
                              {it.lote_fabricante || 'LOTE BALCÃO'}
                            </td>
                            <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontWeight: '800' }}>{it.quantidade}</td>
                            <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right' }}>{formatarMoeda(it.preco_unitario)}</td>
                            <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', fontWeight: '800' }}>{formatarMoeda(it.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* TOTAL */}
                  <div style={{ borderTop: '1.5px solid #000', paddingTop: '0.5rem', textAlign: 'right', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#000' }}>
                      VALOR TOTAL: {formatarMoeda(reciboModalVenda.valor_final)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#4B5563' }}>Forma de Pagamento: {reciboModalVenda.forma_pagamento}</div>
                  </div>

                  {/* DECLARAÇÃO */}
                  <div style={{ marginBottom: '1.5rem', border: '1px solid #D1D5DB', padding: '0.55rem', borderRadius: '4px', fontSize: '0.72rem', color: '#374151', textAlign: 'justify' }}>
                    <strong>DECLARAÇÃO LEGAL:</strong> A venda de munições acima discriminada obedeceu aos limites legais estipulados pela legislação federal vigente, com conferência prévia da regularidade do CRAF apresentado pelo comprador e estrita compatibilidade com o calibre autorizado. Lotes baixados para efeito do SICOVEM.
                  </div>

                  {/* ASSINATURAS */}
                  <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.78rem' }}>
                    <div style={{ marginBottom: '2.5rem', fontWeight: '600' }}>
                      {config?.cidade || 'Jataí'} - {config?.uf || 'GO'}, {getDataExtenso(reciboModalVenda.data)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem' }}>
                      <div style={{ width: '48%', borderTop: '1.5px solid #000', paddingTop: '0.4rem' }}>
                        <strong>{reciboModalVenda.cliente_nome?.toUpperCase()}</strong><br />
                        <span style={{ fontSize: '0.72rem', color: '#4B5563' }}>Adquirente (Titular do CRAF)</span>
                      </div>
                      <div style={{ width: '48%', borderTop: '1.5px solid #000', paddingTop: '0.4rem' }}>
                        <strong>{config?.razao_social || config?.nome_fantasia}</strong><br />
                        <span style={{ fontSize: '0.72rem', color: '#4B5563' }}>Armeria / Atendente Responsável</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════════════
                  DOCUMENTO 3: TERMO DE ENTREGA E RECEBIMENTO DEFINITIVO DE ARMA
                  ══════════════════════════════════════════════════════════════════════ */}
              {docReciboAtivo === 'TERMO_ENTREGA' && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '1.2rem', padding: '0.4rem', border: '1.5px solid #000', backgroundColor: '#ECFDF5' }}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#065F46', margin: 0, textTransform: 'uppercase' }}>
                      TERMO DE ENTREGA E RECEBIMENTO DEFINITIVO DE ARMA DE FOGO
                    </h2>
                    <div style={{ fontSize: '0.72rem', color: '#4B5563', marginTop: '0.2rem' }}>
                      Atestado Formal de Entrega Física com CRAF e Guia de Trânsito Concluídos
                    </div>
                    <div style={{ fontSize: '0.76rem', fontWeight: '800', color: '#111827', marginTop: '0.3rem' }}>
                      REF. VENDA #V-{reciboModalVenda.numero_venda} &nbsp;|&nbsp; DATA DA ENTREGA: {formatarData(reciboModalVenda.dados_tramite_arma?.data_entrega_arma || reciboModalVenda.data)}
                    </div>
                  </div>

                  {/* 1. DADOS DAS PARTES */}
                  <div style={{ marginBottom: '1rem', border: '1px solid #D1D5DB', padding: '0.65rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: '#111827', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.25rem', marginBottom: '0.45rem' }}>
                      1. QUALIFICAÇÃO DAS PARTES
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                      <div><strong>Empresa Entregadora:</strong> {config?.razao_social || config?.nome_fantasia}</div>
                      <div><strong>CNPJ / CR:</strong> {config?.cnpj || '—'} / {config?.cr_armeria || '—'}</div>
                      <div><strong>Adquirente / Recebedor:</strong> {reciboModalVenda.cliente_nome?.toUpperCase()}</div>
                      <div><strong>CPF:</strong> {clienteRecibo?.cpf || reciboModalVenda.cliente_cpf || '—'}</div>
                      <div><strong>RG:</strong> {clienteRecibo?.rg || reciboModalVenda.cliente_rg || '—'}</div>
                      <div><strong>Telefone:</strong> {clienteRecibo?.telefone || reciboModalVenda.cliente_telefone || '—'}</div>
                    </div>
                  </div>

                  {/* 2. DISCRIMINAÇÃO DO ARMAMENTO ENTREGUE */}
                  <div style={{ marginBottom: '1rem', border: '1px solid #D1D5DB', padding: '0.65rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: '#111827', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.25rem', marginBottom: '0.45rem' }}>
                      2. DISCRIMINAÇÃO DO ARMAMENTO ENTREGUE
                    </div>
                    {(reciboModalVenda.itens || []).filter(isItemArmaDeFogo).concat(
                      (reciboModalVenda.itens || []).filter(isItemArmaDeFogo).length === 0 ? (reciboModalVenda.itens || []) : []
                    ).map((it, idx) => {
                      const sp = getArmaSpecs(it)
                      return (
                        <div key={idx} style={{ backgroundColor: '#F9FAFB', border: '1.5px solid #000', padding: '0.65rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                            <div><strong>Armamento:</strong> {sp.tipo_arma?.toUpperCase()} - {sp.fabricante}</div>
                            <div><strong>Modelo:</strong> {sp.modelo}</div>
                            <div><strong>Calibre:</strong> {sp.calibre}</div>
                            <div><strong>Acabamento:</strong> {sp.acabamento}</div>
                            <div style={{ gridColumn: 'span 2', backgroundColor: '#D1FAE5', padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #10B981' }}>
                              <strong style={{ color: '#065F46', fontSize: '0.82rem' }}>NÚMERO DE SÉRIE CONFERIDO NA PEÇA:</strong>
                              <span style={{ fontSize: '0.95rem', fontWeight: '900', fontFamily: 'monospace', marginLeft: '0.5rem', color: '#065F46' }}>
                                {sp.numero_serie || 'NÃO INFORMADO'}
                              </span>
                            </div>
                            <div><strong>Tamanho do Cano:</strong> {sp.comprimento_cano}</div>
                            <div><strong>Raiamento / Sentido:</strong> {sp.quantidade_raias} {sp.sentido_raias ? `(${sp.sentido_raias})` : ''}</div>
                            <div><strong>Funcionamento:</strong> {sp.tipo_funcionamento}</div>
                            <div><strong>Capacidade:</strong> {sp.capacidade_tiros}</div>
                            <div style={{ gridColumn: 'span 2' }}>
                              <strong>Carregadores Conferidos:</strong> {sp.possui_carregadores ? `${sp.quantidade_carregadores || '2'} carregador(es) entregue(s)` : 'Sem carregador destacável'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* 3. DOCUMENTOS FISCAIS E REGISTRAIS APRESENTADOS */}
                  <div style={{ marginBottom: '1rem', border: '1.5px solid #059669', backgroundColor: '#F0FDF4', padding: '0.65rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: '#065F46', borderBottom: '1px solid #A7F3D0', paddingBottom: '0.25rem', marginBottom: '0.45rem' }}>
                      3. DOCUMENTAÇÃO FISCAL E REGISTRAL APRESENTADA E CONFERIDA
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                      <div><strong>Nota Fiscal Eletrônica (NF-e):</strong> Nº {reciboModalVenda.dados_tramite_arma?.nfe_numero || '—'} (Série: {reciboModalVenda.dados_tramite_arma?.nfe_serie || '1'})</div>
                      <div><strong>Data Emissão NF-e:</strong> {reciboModalVenda.dados_tramite_arma?.nfe_data_emissao ? formatarData(reciboModalVenda.dados_tramite_arma.nfe_data_emissao) : '—'}</div>
                      <div style={{ gridColumn: 'span 2' }}><strong>Chave de Acesso NF-e:</strong> <span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{reciboModalVenda.dados_tramite_arma?.nfe_chave || '—'}</span></div>
                      <div><strong>Nº do CRAF Definitivo Emitido:</strong> <span style={{ fontWeight: '800' }}>{reciboModalVenda.dados_tramite_arma?.craf_definitivo_numero || '—'}</span></div>
                      <div><strong>Validade do CRAF:</strong> {reciboModalVenda.dados_tramite_arma?.craf_definitivo_validade ? formatarData(reciboModalVenda.dados_tramite_arma.craf_definitivo_validade) : '—'}</div>
                      <div><strong>Autorização Prévia de Compra:</strong> {reciboModalVenda.dados_tramite_arma?.autorizacao_compra_numero || '—'} ({reciboModalVenda.dados_tramite_arma?.autorizacao_orgao || 'SINARM'})</div>
                      <div><strong>Responsável pela Entrega:</strong> {reciboModalVenda.dados_tramite_arma?.responsavel_entrega || usuarioLogado?.nome_completo || 'Armeiro Responsável'}</div>
                    </div>
                  </div>

                  {/* 4. DECLARAÇÃO DE VISTORIA E RECEBIMENTO */}
                  <div style={{ marginBottom: '1.2rem', border: '1px solid #D1D5DB', padding: '0.65rem', borderRadius: '4px', fontSize: '0.74rem', lineHeight: '1.45', textAlign: 'justify', color: '#1F2937' }}>
                    <div style={{ fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                      4. DECLARAÇÃO DE RECEBIMENTO E VISTORIA FÍSICA
                    </div>
                    <p style={{ margin: 0 }}>
                      O(A) adquirente supraqualificado(a) declara que conferiu pessoalmente a arma de fogo entregue nesta data, constatando que os caracteres de identificação (número de série, marca e calibre) gravados no cano e na carcaça do armamento coincidem perfeitamente com os dados constantes na Nota Fiscal Eletrônica e no Certificado de Registro de Arma de Fogo (CRAF). Declara ainda que recebe o armamento em perfeito estado de conservação, limpeza e funcionamento mecânico, com todos os seus manuais e acessórios, assumindo integral responsabilidade penal e civil pela guarda, posse e transporte a partir desta entrega.
                    </p>
                  </div>

                  {/* 5. ASSINATURAS */}
                  <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.78rem' }}>
                    <div style={{ marginBottom: '2.5rem', fontWeight: '600' }}>
                      {config?.cidade || 'Jataí'} - {config?.uf || 'GO'}, {getDataExtenso(reciboModalVenda.dados_tramite_arma?.data_entrega_arma || reciboModalVenda.data)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem' }}>
                      <div style={{ width: '48%', borderTop: '1.5px solid #000', paddingTop: '0.4rem' }}>
                        <strong>{reciboModalVenda.cliente_nome?.toUpperCase()}</strong><br />
                        <span style={{ fontSize: '0.72rem', color: '#4B5563' }}>Adquirente (Recebedor)</span>
                      </div>
                      <div style={{ width: '48%', borderTop: '1.5px solid #000', paddingTop: '0.4rem' }}>
                        <strong>{config?.razao_social || config?.nome_fantasia}</strong><br />
                        <span style={{ fontSize: '0.72rem', color: '#4B5563' }}>Armeria / Responsável pela Entrega</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════════════
                  DOCUMENTO 4: COMPROVANTE DE VENDA DE BALCÃO PADRÃO
                  ══════════════════════════════════════════════════════════════════════ */}
              {docReciboAtivo === 'RECIBO_PAGAMENTO' && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#111827', textTransform: 'uppercase', margin: 0 }}>
                      COMPROVANTE DE VENDA DE BALCÃO #V-{reciboModalVenda.numero_venda}
                    </h2>
                    <div style={{ fontSize: '0.78rem', color: '#4B5563', marginTop: '0.2rem' }}>
                      Cliente: <strong>{reciboModalVenda.cliente_nome?.toUpperCase()}</strong> {reciboModalVenda.cliente_cpf ? `(CPF: ${reciboModalVenda.cliente_cpf})` : ''}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.1rem' }}>
                      Data: {formatarData(reciboModalVenda.data)} às {reciboModalVenda.hora || ''}
                    </div>
                  </div>

                  {/* TABELA DE ITENS COM NÚMEROS DE SÉRIE E LOTES */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid #000', textAlign: 'left' }}>
                        <th style={{ padding: '0.4rem 0' }}>PRODUTO / ITEM</th>
                        <th style={{ padding: '0.4rem 0', textAlign: 'center' }}>QTD</th>
                        <th style={{ padding: '0.4rem 0', textAlign: 'right' }}>VALOR UNIT.</th>
                        <th style={{ padding: '0.4rem 0', textAlign: 'right' }}>SUBTOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reciboModalVenda.itens || []).map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                          <td style={{ padding: '0.5rem 0' }}>
                            <div style={{ fontWeight: '600' }}>{it.nome}</div>
                            {/* NÚMERO DE SÉRIE (PCP, ARMAS, RIFLES DE PRESSÃO, ETC) */}
                            {it.numero_serie && (
                              <div style={{ fontSize: '0.72rem', color: '#B45309', fontWeight: '800', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                                SÉRIE / S/N: {it.numero_serie}
                              </div>
                            )}
                            {/* LOTE FABRICANTE */}
                            {it.lote_fabricante && (
                              <div style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: '700', marginTop: '0.15rem' }}>
                                LOTE FABRICANTE: {it.lote_fabricante}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.5rem 0', textAlign: 'center', fontWeight: '700' }}>{it.quantidade}</td>
                          <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>{formatarMoeda(it.preco_unitario)}</td>
                          <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: '700' }}>{formatarMoeda(it.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* RESUMO DE VALORES */}
                  <div style={{ borderTop: '1.5px solid #000', paddingTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.85rem', textAlign: 'right' }}>
                    <div>Subtotal: {formatarMoeda(reciboModalVenda.valor_subtotal)}</div>
                    {reciboModalVenda.desconto > 0 && <div>Desconto: {formatarMoeda(reciboModalVenda.desconto)}</div>}
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#000', marginTop: '0.2rem' }}>
                      VALOR TOTAL FINAL: {formatarMoeda(reciboModalVenda.valor_final)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#4B5563' }}>
                      Forma de Pagamento: <strong>{reciboModalVenda.forma_pagamento}</strong>
                      {reciboModalVenda.troco > 0 ? ` (Troco: ${formatarMoeda(reciboModalVenda.troco)})` : ''}
                    </div>
                  </div>

                  {/* ASSINATURA */}
                  <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '0.78rem' }}>
                    <div style={{ width: '45%' }}>
                      <div style={{ borderTop: '1.5px solid #000', paddingTop: '0.4rem' }}>
                        {reciboModalVenda.cliente_nome?.toUpperCase()}<br />Comprador / Cliente
                      </div>
                    </div>
                    <div style={{ width: '45%' }}>
                      <div style={{ borderTop: '1.5px solid #000', paddingTop: '0.4rem' }}>
                        {config?.nome_fantasia || 'Pró Guns Armeria'}<br />Vendedor / Atendimento
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AÇÕES NO RODAPÉ DO MODAL (NÃO IMPRESSO) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
              <button className="btn-secondary" onClick={() => setReciboModalVenda(null)}>Fechar</button>
              <button
                type="button"
                className="btn-secondary"
                style={{ backgroundColor: '#25D366', color: '#FFFFFF', borderColor: '#25D366', fontWeight: '700' }}
                onClick={() => handleEnviarWhatsAppRecibo(reciboModalVenda)}
              >
                <MessageCircle size={15} />
                <span>Enviar WhatsApp</span>
              </button>
              <button
                type="button"
                className="btn-gold"
                style={{ backgroundColor: '#134633', borderColor: '#134633' }}
                onClick={() => window.print()}
              >
                <Printer size={15} />
                <span>Imprimir Documento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL GERENCIAMENTO DE TRÂMITE LEGAL DA ARMA (PF / EXÉRCITO) ── */}
      {modalTramiteVenda && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1.5rem', overflowY: 'auto' }}>
          <div className="card" style={{ width: '100%', maxWidth: '720px', borderLeft: '4px solid #F59E0B', maxHeight: '92vh', overflowY: 'auto' }}>
            
            {/* CABEÇALHO DO MODAL */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '0.5rem', borderRadius: '8px', color: '#FBBF24' }}>
                  <Shield size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: '#FBBF24', margin: 0 }}>
                    Trâmite Regulatório de Arma de Fogo
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Venda #V-{modalTramiteVenda.numero_venda} &nbsp;•&nbsp; Cliente: <strong>{modalTramiteVenda.cliente_nome?.toUpperCase()}</strong>
                  </div>
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setModalTramiteVenda(null)}>
                <X size={20} />
              </button>
            </div>

            {/* STEPPER PROGRESSO DO PROCESSO */}
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Etapas do Processo de Aquisição (SINARM / SIGMA)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', textAlign: 'center' }}>
                
                {/* ETAPA 1 */}
                <div style={{ padding: '0.5rem 0.3rem', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#34D399' }}>1. PROPOSTA & RESERVA</div>
                  <div style={{ fontSize: '0.62rem', color: '#10B981', marginTop: '0.2rem' }}>✓ Concluído</div>
                </div>

                {/* ETAPA 2 */}
                {(() => {
                  const st = modalTramiteVenda.status_tramite_arma || 'AGUARDANDO_AUTORIZACAO'
                  const isDone = ['AUTORIZADO_PF', 'NOTA_FISCAL_EMITIDA', 'ENTREGUE'].includes(st)
                  const isCurrent = st === 'AGUARDANDO_AUTORIZACAO'
                  return (
                    <div style={{
                      padding: '0.5rem 0.3rem',
                      borderRadius: '6px',
                      backgroundColor: isDone ? 'rgba(16, 185, 129, 0.15)' : isCurrent ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
                      border: isDone ? '1px solid #10B981' : isCurrent ? '1px solid #F59E0B' : '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: '800', color: isDone ? '#34D399' : isCurrent ? '#FBBF24' : 'var(--text-muted)' }}>
                        2. AUTORIZAÇÃO PF/SIGMA
                      </div>
                      <div style={{ fontSize: '0.62rem', color: isDone ? '#10B981' : isCurrent ? '#F59E0B' : 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {isDone ? '✓ Aprovado' : isCurrent ? '⏳ Em Andamento' : 'Pendente'}
                      </div>
                    </div>
                  )
                })()}

                {/* ETAPA 3 */}
                {(() => {
                  const st = modalTramiteVenda.status_tramite_arma || 'AGUARDANDO_AUTORIZACAO'
                  const isDone = ['NOTA_FISCAL_EMITIDA', 'ENTREGUE'].includes(st)
                  const isCurrent = st === 'AUTORIZADO_PF'
                  return (
                    <div style={{
                      padding: '0.5rem 0.3rem',
                      borderRadius: '6px',
                      backgroundColor: isDone ? 'rgba(16, 185, 129, 0.15)' : isCurrent ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
                      border: isDone ? '1px solid #10B981' : isCurrent ? '1px solid #F59E0B' : '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: '800', color: isDone ? '#34D399' : isCurrent ? '#FBBF24' : 'var(--text-muted)' }}>
                        3. NOTA FISCAL (NF-E)
                      </div>
                      <div style={{ fontSize: '0.62rem', color: isDone ? '#10B981' : isCurrent ? '#F59E0B' : 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {isDone ? '✓ Emitida' : isCurrent ? '⏳ Liberada' : 'Aguardando'}
                      </div>
                    </div>
                  )
                })()}

                {/* ETAPA 4 */}
                {(() => {
                  const st = modalTramiteVenda.status_tramite_arma || 'AGUARDANDO_AUTORIZACAO'
                  const isDone = st === 'ENTREGUE'
                  const isCurrent = st === 'NOTA_FISCAL_EMITIDA'
                  return (
                    <div style={{
                      padding: '0.5rem 0.3rem',
                      borderRadius: '6px',
                      backgroundColor: isDone ? 'rgba(16, 185, 129, 0.15)' : isCurrent ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
                      border: isDone ? '1px solid #10B981' : isCurrent ? '1px solid #F59E0B' : '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: '800', color: isDone ? '#34D399' : isCurrent ? '#FBBF24' : 'var(--text-muted)' }}>
                        4. ENTREGA COM CRAF
                      </div>
                      <div style={{ fontSize: '0.62rem', color: isDone ? '#10B981' : isCurrent ? '#F59E0B' : 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {isDone ? '✓ Entregue' : isCurrent ? '⏳ Aguardando CRAF' : 'Aguardando'}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* ARMAS VINCULADAS */}
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)', marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#FBBF24', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Arma(s) de Fogo Reservada(s) nesta Venda:
              </div>
              {(modalTramiteVenda.itens || []).filter(isItemArmaDeFogo).map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-main)', padding: '0.3rem 0', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                  <div>
                    <strong>{it.nome}</strong> {it.calibre ? `(${it.calibre})` : ''}
                    <span style={{ marginLeft: '0.4rem', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', border: '1px solid #F59E0B', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '800', fontFamily: 'monospace' }}>
                      S/N: {it.numero_serie || '—'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: modalTramiteVenda.status_tramite_arma === 'ENTREGUE' ? '#34D399' : '#FBBF24' }}>
                    {modalTramiteVenda.status_tramite_arma === 'ENTREGUE' ? 'ENTREGUE AO CLIENTE' : 'RESERVADA NO COFRE'}
                  </span>
                </div>
              ))}
            </div>

            {/* FORMULÁRIO DINÂMICO DE ATUALIZAÇÃO DO TRÂMITE */}
            <form onSubmit={handleSalvarDadosTramite} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* SEÇÃO 1: AUTORIZAÇÃO DE COMPRA (SINARM / SIGMA) */}
              <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#FBBF24', textTransform: 'uppercase' }}>
                    1. Autorização de Aquisição (Polícia Federal / Exército)
                  </div>
                  {modalTramiteVenda.status_tramite_arma === 'AGUARDANDO_AUTORIZACAO' && (
                    <button
                      type="button"
                      onClick={() => handleSalvarAvancoTramiteArma(modalTramiteVenda, 'AUTORIZADO_PF', dadosTramiteForm)}
                      style={{
                        backgroundColor: '#10B981',
                        color: '#FFF',
                        border: 'none',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Check size={14} /> Aprovar Autorização PF/Exército
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Nº da Autorização de Compra</label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ height: '32px', fontSize: '0.78rem' }}
                      value={dadosTramiteForm.autorizacao_compra_numero}
                      onChange={e => setDadosTramiteForm({ ...dadosTramiteForm, autorizacao_compra_numero: e.target.value })}
                      placeholder="Ex: 2026/04812-SINARM"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Data da Autorização</label>
                    <input
                      type="date"
                      className="input-field"
                      style={{ height: '32px', fontSize: '0.78rem' }}
                      value={dadosTramiteForm.autorizacao_compra_data}
                      onChange={e => setDadosTramiteForm({ ...dadosTramiteForm, autorizacao_compra_data: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Órgão Emissor</label>
                    <select
                      className="input-field"
                      style={{ height: '32px', fontSize: '0.78rem' }}
                      value={dadosTramiteForm.autorizacao_orgao}
                      onChange={e => setDadosTramiteForm({ ...dadosTramiteForm, autorizacao_orgao: e.target.value })}
                    >
                      <option value="SINARM">SINARM (Polícia Federal)</option>
                      <option value="SIGMA">SIGMA (Comando do Exército)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: FATURAMENTO & NOTA FISCAL (NF-E) */}
              <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#60A5FA', textTransform: 'uppercase' }}>
                    2. Faturamento & Nota Fiscal Eletrônica (NF-e)
                  </div>
                  {modalTramiteVenda.status_tramite_arma === 'AUTORIZADO_PF' && (
                    <button
                      type="button"
                      onClick={() => handleSalvarAvancoTramiteArma(modalTramiteVenda, 'NOTA_FISCAL_EMITIDA', dadosTramiteForm)}
                      style={{
                        backgroundColor: '#3B82F6',
                        color: '#FFF',
                        border: 'none',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <FileCheck size={14} /> Registrar Emissão de NF-e
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Número da NF-e</label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ height: '32px', fontSize: '0.78rem' }}
                      value={dadosTramiteForm.nfe_numero}
                      onChange={e => setDadosTramiteForm({ ...dadosTramiteForm, nfe_numero: e.target.value })}
                      placeholder="Ex: 000.014.285"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Série da NF-e</label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ height: '32px', fontSize: '0.78rem' }}
                      value={dadosTramiteForm.nfe_serie}
                      onChange={e => setDadosTramiteForm({ ...dadosTramiteForm, nfe_serie: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Data de Emissão da NF-e</label>
                    <input
                      type="date"
                      className="input-field"
                      style={{ height: '32px', fontSize: '0.78rem' }}
                      value={dadosTramiteForm.nfe_data_emissao}
                      onChange={e => setDadosTramiteForm({ ...dadosTramiteForm, nfe_data_emissao: e.target.value })}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 3' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Chave de Acesso da NF-e (44 dígitos)</label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ height: '32px', fontSize: '0.78rem', fontFamily: 'monospace' }}
                      value={dadosTramiteForm.nfe_chave}
                      onChange={e => setDadosTramiteForm({ ...dadosTramiteForm, nfe_chave: e.target.value })}
                      placeholder="Chave eletrônica completa da NF-e..."
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: CRAF DEFINITIVO & ENTREGA FÍSICA */}
              <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#34D399', textTransform: 'uppercase' }}>
                    3. Conclusão & Entrega Física (CRAF Emitido)
                  </div>
                  {modalTramiteVenda.status_tramite_arma === 'NOTA_FISCAL_EMITIDA' && (
                    <button
                      type="button"
                      onClick={() => handleSalvarAvancoTramiteArma(modalTramiteVenda, 'ENTREGUE', dadosTramiteForm)}
                      style={{
                        backgroundColor: '#059669',
                        color: '#FFF',
                        border: 'none',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <CheckCircle2 size={14} /> Concluir Entrega & Baixar Estoque
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Nº do CRAF Definitivo Emitido</label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ height: '32px', fontSize: '0.78rem' }}
                      value={dadosTramiteForm.craf_definitivo_numero}
                      onChange={e => setDadosTramiteForm({ ...dadosTramiteForm, craf_definitivo_numero: e.target.value })}
                      placeholder="Ex: CRAF-2026/89412"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Validade do CRAF</label>
                    <input
                      type="date"
                      className="input-field"
                      style={{ height: '32px', fontSize: '0.78rem' }}
                      value={dadosTramiteForm.craf_definitivo_validade}
                      onChange={e => setDadosTramiteForm({ ...dadosTramiteForm, craf_definitivo_validade: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Data da Entrega Física</label>
                    <input
                      type="date"
                      className="input-field"
                      style={{ height: '32px', fontSize: '0.78rem' }}
                      value={dadosTramiteForm.data_entrega_arma}
                      onChange={e => setDadosTramiteForm({ ...dadosTramiteForm, data_entrega_arma: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Responsável pela Entrega na Loja</label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ height: '32px', fontSize: '0.78rem' }}
                      value={dadosTramiteForm.responsavel_entrega}
                      onChange={e => setDadosTramiteForm({ ...dadosTramiteForm, responsavel_entrega: e.target.value })}
                      placeholder="Nome do armeiro/atendente..."
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Observações Gerais do Trâmite</label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ height: '32px', fontSize: '0.78rem' }}
                      value={dadosTramiteForm.observacoes}
                      onChange={e => setDadosTramiteForm({ ...dadosTramiteForm, observacoes: e.target.value })}
                      placeholder="Observações complementares, número de protocolo, etc..."
                    />
                  </div>
                </div>
              </div>

              {/* BOTÕES DE AÇÃO DO TRÂMITE */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
                    onClick={() => {
                      setReciboModalVenda(modalTramiteVenda)
                      setTipoDocumentoRecibo('PROPOSTA_PF')
                    }}
                  >
                    <Printer size={14} /> Imprimir Proposta PF
                  </button>
                  {modalTramiteVenda.status_tramite_arma === 'ENTREGUE' && (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem', borderColor: '#10B981', color: '#34D399' }}
                      onClick={() => {
                        setReciboModalVenda(modalTramiteVenda)
                        setTipoDocumentoRecibo('TERMO_ENTREGA')
                      }}
                    >
                      <FileCheck size={14} /> Imprimir Termo de Entrega
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setModalTramiteVenda(null)}>
                    Fechar
                  </button>
                  <button type="submit" className="btn-gold" style={{ padding: '0.45rem 1rem' }}>
                    Salvar Informações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL EXCLUSÃO DE VENDA (CANCELAMENTO) ── */}
      {modalExcluirVenda && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '460px', borderLeft: '4px solid #EF4444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#F87171', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={20} color="#F87171" />
                Cancelar Venda #{modalExcluirVenda.numero_venda}
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setModalExcluirVenda(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmarExclusaoVenda} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.83rem', color: '#FCA5A5' }}>
                <div><strong>ATENÇÃO:</strong> Cancelando esta venda, os produtos retornam automaticamente ao estoque da armeria.</div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: '700' }}>Senha Pessoal Master *</label>
                <input
                  required
                  autoFocus
                  type="password"
                  className="input-field"
                  value={senhaMasterInput}
                  onChange={e => { setSenhaMasterInput(e.target.value); setErroSenhaMaster('') }}
                  placeholder="Digite a senha master..."
                  style={{ textTransform: 'none' }}
                />
              </div>

              {erroSenhaMaster && (
                <div style={{ color: '#F87171', fontSize: '0.78rem', fontWeight: '700' }}>
                  ⚠️ {erroSenhaMaster}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalExcluirVenda(null)}>Voltar</button>
                <button type="submit" className="btn-gold" style={{ backgroundColor: '#DC2626', color: '#FFF' }}>
                  <Trash2 size={16} /> Cancelar Venda & Devolver Estoque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
