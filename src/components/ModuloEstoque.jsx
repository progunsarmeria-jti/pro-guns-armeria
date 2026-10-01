import React, { useState } from 'react'
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Trash2,
  DollarSign,
  FileText,
  ShieldCheck,
  History,
  Target,
  Shield,
  Layers,
  Wrench,
  Droplets,
  X
} from 'lucide-react'
import CustomSelect from './CustomSelect'
import { dbUpsert, dbDelete, isSupabaseConfigured } from '../lib/supabase'
import ModalImportarNFe from './ModalImportarNFe'
import ModalHistoricoNFe from './ModalHistoricoNFe'
import ModalCadastrarArma from './ModalCadastrarArma'
import ModalCadastrarMunicao from './ModalCadastrarMunicao'

export default function ModuloEstoque({
  estoque = [],
  setEstoque,
  usuarioLogado,
  config,
  notasFiscais = [],
  setNotasFiscais,
  clientes = []
}) {
  // Aba de Segmentação de Estoque: 'TODOS' | 'ARMA' | 'MUNICAO' | 'PECA' | 'SUPRIMENTO'
  const [abaAtiva, setAbaAtiva] = useState('TODOS')
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [filtroClassificacaoLegal, setFiltroClassificacaoLegal] = useState('TODOS') // 'TODOS' | 'PERMITIDO' | 'RESTRITO'

  // Modais de Cadastro e Edição Especializados
  const [modalArma, setModalArma] = useState(false)
  const [armaEdicao, setArmaEdicao] = useState(null)

  const [modalMunicao, setModalMunicao] = useState(false)
  const [municaoEdicao, setMunicaoEdicao] = useState(null)

  const [modalItem, setModalItem] = useState(false)
  const [itemEdicao, setItemEdicao] = useState(null)

  // Modais de Nota Fiscal
  const [modalNfe, setModalNfe] = useState(false)
  const [modalHistorico, setModalHistorico] = useState(false)

  // State Modal Ajuste Rápido
  const [modalAjuste, setModalAjuste] = useState(null)
  const [qtdAjuste, setQtdAjuste] = useState('')
  const [tipoAjuste, setTipoAjuste] = useState('ENTRADA') // 'ENTRADA' | 'SAIDA'

  // Categorias Dinâmicas do Config
  const listaCategoriasConfig = config?.categorias_estoque || [
    'COMPONENTES & PEÇAS',
    'LIMPEZA & CONSERVAÇÃO',
    'MIRAS & ÓPTICAS',
    'ACESSÓRIOS & CARREGADORES',
    'INSUMOS'
  ]
  const categoriasDisponiveis = ['Todas', ...listaCategoriasConfig]

  // Form State Item Peça / Suprimento
  const [formItem, setFormItem] = useState({
    codigo_sku: '',
    nome: '',
    categoria: listaCategoriasConfig[0] || 'COMPONENTES & PEÇAS',
    tipo_estoque: 'PECA',
    codigo_barras: '',
    ncm: '9305.10.00',
    cest: '',
    unidade: 'UN',
    origem: '0',
    preco_custo: '',
    preco_venda: '',
    estoque_atual: 0,
    quantidade_entrada: '',
    estoque_minimo: '2',
    localizacao: 'Armeria - Prateleira A'
  })

  // ─── CLASSIFICADOR INTELIGENTE DE TIPO DE ESTOQUE ────────────────────────────
  const getTipoItem = (item) => {
    if (item.tipo_estoque) return item.tipo_estoque
    const nomeLower = (item.nome || '').toLowerCase()
    const catLower = (item.categoria || '').toLowerCase()

    if (item.numero_serie || catLower.includes('arma') || nomeLower.includes('pistola') || nomeLower.includes('revólver') || nomeLower.includes('fuzil') || nomeLower.includes('carabina') || nomeLower.includes('espingarda')) {
      return 'ARMA'
    }
    if (item.lote_fabricante || catLower.includes('muni') || nomeLower.includes('munição') || nomeLower.includes('cartucho')) {
      return 'MUNICAO'
    }
    if (catLower.includes('limpeza') || catLower.includes('insumo') || nomeLower.includes('óleo') || nomeLower.includes('solvente') || nomeLower.includes('lubrificante') || catLower.includes('acess') || catLower.includes('mira') || catLower.includes('coldre')) {
      return 'SUPRIMENTO'
    }
    return 'PECA'
  }

  // ─── MÉTRICAS SEGMENTADAS ───────────────────────────────────────────────────
  const armasList = estoque.filter(i => getTipoItem(i) === 'ARMA')
  const municoesList = estoque.filter(i => getTipoItem(i) === 'MUNICAO')
  const pecasList = estoque.filter(i => getTipoItem(i) === 'PECA')
  const suprimentosList = estoque.filter(i => getTipoItem(i) === 'SUPRIMENTO')

  // Métricas de Armas
  const totalArmasNoCofre = armasList.filter(a => a.status_arma !== 'ENTREGUE').length
  const armasPermitidas = armasList.filter(a => a.classificacao_calibre === 'PERMITIDO' && a.status_arma !== 'ENTREGUE').length
  const armasRestritas = armasList.filter(a => a.classificacao_calibre === 'RESTRITO' && a.status_arma !== 'ENTREGUE').length
  const armasReservadas = armasList.filter(a => a.status_arma === 'RESERVADA' || a.status_arma === 'AGUARDANDO_CRAF').length

  // Métricas de Munições
  const totalCartuchos = municoesList.reduce((acc, m) => acc + (m.quantidade || 0), 0)
  const totalCaixasMunicao = municoesList.reduce((acc, m) => acc + (m.total_caixas || Math.floor((m.quantidade || 0) / (m.quantidade_por_embalagem || 50))), 0)
  const municoesPermitidasCartuchos = municoesList.filter(m => m.classificacao_calibre === 'PERMITIDO').reduce((acc, m) => acc + (m.quantidade || 0), 0)
  const municoesRestritasCartuchos = municoesList.filter(m => m.classificacao_calibre === 'RESTRITO').reduce((acc, m) => acc + (m.quantidade || 0), 0)

  // Métricas Gerais
  const totalItensGerais = estoque.length
  const totalQuantidadeGeral = estoque.reduce((acc, i) => acc + (i.quantidade || 0), 0)
  const valorTotalVenda = estoque.reduce((acc, i) => acc + ((i.preco_venda || 0) * (i.quantidade || 0)), 0)
  const itensAlerta = estoque.filter(i => (i.quantidade || 0) <= (i.estoque_minimo || 2))

  // ─── FILTRAGEM DO ESTOQUE CONFORME ABA ATIVA ────────────────────────────────
  const estoqueFiltrado = estoque.filter(item => {
    const tipo = getTipoItem(item)

    // Filtro por Aba
    if (abaAtiva !== 'TODOS' && tipo !== abaAtiva) {
      return false
    }

    // Filtro por Classificação Legal (Permitido / Restrito em Armas e Munições)
    if (filtroClassificacaoLegal !== 'TODOS') {
      if ((tipo === 'ARMA' || tipo === 'MUNICAO') && item.classificacao_calibre !== filtroClassificacaoLegal) {
        return false
      }
    }

    // Filtro por Categoria comum (apenas se estiver em Visão Geral ou Peças/Suprimentos)
    if (abaAtiva === 'TODOS' || abaAtiva === 'PECA' || abaAtiva === 'SUPRIMENTO') {
      if (filtroCategoria !== 'Todas' && item.categoria !== filtroCategoria) {
        return false
      }
    }

    // Busca textual ampla
    const termo = busca.toLowerCase().trim()
    if (!termo) return true

    return (
      (item.nome || '').toLowerCase().includes(termo) ||
      (item.codigo_sku || '').toLowerCase().includes(termo) ||
      (item.numero_serie || '').toLowerCase().includes(termo) ||
      (item.lote_fabricante || '').toLowerCase().includes(termo) ||
      (item.calibre || '').toLowerCase().includes(termo) ||
      (item.codigo_barras || '').toLowerCase().includes(termo) ||
      (item.ncm || '').toLowerCase().includes(termo) ||
      (item.cliente_reserva_nome || '').toLowerCase().includes(termo)
    )
  })

  // ─── HANDLERS DE CADASTRO / EDIÇÃO ──────────────────────────────────────────
  const handleSalvarArma = (novaArma) => {
    if (armaEdicao) {
      setEstoque(prev => prev.map(p => p.id === armaEdicao.id ? novaArma : p))
    } else {
      setEstoque(prev => [novaArma, ...prev])
    }
    if (isSupabaseConfigured()) dbUpsert('estoque', novaArma)
    setArmaEdicao(null)
  }

  const handleSalvarMunicao = (novaMunicao) => {
    if (municaoEdicao) {
      setEstoque(prev => prev.map(p => p.id === municaoEdicao.id ? novaMunicao : p))
    } else {
      setEstoque(prev => [novaMunicao, ...prev])
    }
    if (isSupabaseConfigured()) dbUpsert('estoque', novaMunicao)
    setMunicaoEdicao(null)
  }

  const handleAbrirCriarPeca = (tipo = 'PECA') => {
    setItemEdicao(null)
    setFormItem({
      codigo_sku: `${tipo === 'PECA' ? 'PECA' : 'SUP'}-${Math.floor(1000 + Math.random() * 9000)}`,
      nome: '',
      categoria: tipo === 'PECA' ? 'COMPONENTES & PEÇAS' : 'LIMPEZA & CONSERVAÇÃO',
      tipo_estoque: tipo,
      codigo_barras: '',
      ncm: tipo === 'PECA' ? '9305.10.00' : '3403.99.00',
      cest: '',
      unidade: tipo === 'PECA' ? 'UN' : 'ML',
      origem: '0',
      preco_custo: '',
      preco_venda: '',
      estoque_atual: 0,
      quantidade_entrada: '',
      estoque_minimo: '2',
      localizacao: 'Armeria - Prateleira A'
    })
    setModalItem(true)
  }

  const handleAbrirEditarItem = (item) => {
    const tipo = getTipoItem(item)
    if (tipo === 'ARMA') {
      setArmaEdicao(item)
      setModalArma(true)
    } else if (tipo === 'MUNICAO') {
      setMunicaoEdicao(item)
      setModalMunicao(true)
    } else {
      setItemEdicao(item)
      setFormItem({
        codigo_sku: item.codigo_sku || '',
        nome: item.nome || '',
        categoria: item.categoria || listaCategoriasConfig[0] || 'COMPONENTES & PEÇAS',
        tipo_estoque: tipo,
        codigo_barras: item.codigo_barras || '',
        ncm: item.ncm || '',
        cest: item.cest || '',
        unidade: item.unidade || 'UN',
        origem: item.origem || '0',
        preco_custo: item.preco_custo ? item.preco_custo.toString() : '',
        preco_venda: item.preco_venda ? item.preco_venda.toString() : '',
        estoque_atual: item.quantidade || 0,
        quantidade_entrada: '0',
        estoque_minimo: item.estoque_minimo ? item.estoque_minimo.toString() : '2',
        localizacao: item.localizacao || ''
      })
      setModalItem(true)
    }
  }

  const handleSalvarItemPeca = (e) => {
    e.preventDefault()
    if (!formItem.nome) return

    const entrada = parseInt(formItem.quantidade_entrada) || 0
    const estoqueAtual = itemEdicao ? (parseInt(formItem.estoque_atual) || 0) : 0
    const quantidadeFinal = Math.max(0, estoqueAtual + entrada)

    const novoItemObj = {
      id: itemEdicao ? itemEdicao.id : `p_${Date.now()}`,
      tipo_estoque: formItem.tipo_estoque || 'PECA',
      codigo_sku: formItem.codigo_sku || `SKU-${Date.now()}`,
      nome: formItem.nome,
      categoria: formItem.categoria,
      codigo_barras: formItem.codigo_barras || null,
      ncm: formItem.ncm || null,
      cest: formItem.cest || null,
      unidade: formItem.unidade || 'UN',
      origem: formItem.origem || '0',
      preco_custo: parseFloat(formItem.preco_custo) || 0,
      preco_venda: parseFloat(formItem.preco_venda) || 0,
      quantidade: quantidadeFinal,
      estoque_minimo: parseInt(formItem.estoque_minimo) || 2,
      localizacao: formItem.localizacao,
      updated_at: new Date().toISOString()
    }

    if (itemEdicao) {
      setEstoque(prev => prev.map(p => p.id === itemEdicao.id ? novoItemObj : p))
    } else {
      setEstoque(prev => [novoItemObj, ...prev])
    }

    if (isSupabaseConfigured()) dbUpsert('estoque', novoItemObj)
    setModalItem(false)
  }

  const handleExcluirItem = (id) => {
    if (window.confirm('Tem certeza que deseja remover este item do estoque?')) {
      setEstoque(prev => prev.filter(p => String(p.id) !== String(id)))
      if (isSupabaseConfigured()) {
        dbDelete('estoque', id)
      }
    }
  }

  // ─── PROCESSAMENTO DE ENTRADA VIA XML DA NF-e ──────────────────────────────
  const handleConfirmarEntradaNFe = ({ nfeData, itensMapeados }) => {
    let estoqueAtualizado = [...estoque]
    const itensGravadosNFe = []

    itensMapeados.forEach((itemMap, idx) => {
      if (!itemMap.incluir) return

      if (itemMap.modo === 'VINCULAR' && itemMap.item_estoque_id) {
        const itemIdx = estoqueAtualizado.findIndex(p => String(p.id) === String(itemMap.item_estoque_id))
        if (itemIdx !== -1) {
          const itemAtual = estoqueAtualizado[itemIdx]
          const qtdAnterior = parseInt(itemAtual.quantidade) || 0
          const qtdEntrada = parseInt(itemMap.xml.quantidade) || 0
          const novoEstoque = qtdAnterior + qtdEntrada

          const itemAtualizado = {
            ...itemAtual,
            quantidade: novoEstoque,
            preco_custo: itemMap.atualizar_preco_custo_existente ? (itemMap.xml.preco_custo_real || itemAtual.preco_custo) : itemAtual.preco_custo,
            codigo_barras: itemAtual.codigo_barras || itemMap.xml.codigo_barras || null,
            ncm: itemAtual.ncm || itemMap.xml.ncm || null,
            cest: itemAtual.cest || itemMap.xml.cest || null,
            unidade: itemAtual.unidade || itemMap.xml.unidade || 'UN',
            fornecedor_nome: nfeData.fornecedor.razao_social,
            fornecedor_cnpj: nfeData.fornecedor.cnpj,
            ultima_nf_entrada: nfeData.numero_nf,
            updated_at: new Date().toISOString()
          }

          estoqueAtualizado[itemIdx] = itemAtualizado
          if (isSupabaseConfigured()) dbUpsert('estoque', itemAtualizado)

          itensGravadosNFe.push({
            tipo: 'VINCULADO',
            item_id: itemAtualizado.id,
            nome: itemAtualizado.nome,
            codigo_sku: itemAtualizado.codigo_sku,
            quantidade: qtdEntrada,
            preco_custo_real: itemMap.xml.preco_custo_real
          })
        }
      } else {
        // Novo item
        const ncmLimpo = (itemMap.novo_ncm || '').replace(/\D/g, '')
        let tipoItemNovo = 'PECA'
        if (ncmLimpo.startsWith('9302') || ncmLimpo.startsWith('9303')) tipoItemNovo = 'ARMA'
        else if (ncmLimpo.startsWith('9306')) tipoItemNovo = 'MUNICAO'
        else if (ncmLimpo.startsWith('3403')) tipoItemNovo = 'SUPRIMENTO'

        const novoItemObj = {
          id: `p_${Date.now()}_${idx}`,
          tipo_estoque: tipoItemNovo,
          codigo_sku: itemMap.novo_sku || `SKU-${Date.now()}-${idx}`,
          nome: itemMap.novo_nome,
          categoria: itemMap.novo_categoria,
          codigo_barras: itemMap.novo_codigo_barras || null,
          ncm: itemMap.novo_ncm || null,
          cest: itemMap.novo_cest || null,
          unidade: itemMap.novo_unidade || 'UN',
          origem: '0',
          preco_custo: parseFloat(itemMap.novo_preco_custo) || 0,
          preco_venda: parseFloat(itemMap.novo_preco_venda) || 0,
          quantidade: parseInt(itemMap.xml.quantidade) || 0,
          estoque_minimo: parseInt(itemMap.novo_estoque_minimo) || 2,
          localizacao: itemMap.novo_localizacao || 'Armeria - Prateleira A',
          fornecedor_nome: nfeData.fornecedor.razao_social,
          fornecedor_cnpj: nfeData.fornecedor.cnpj,
          ultima_nf_entrada: nfeData.numero_nf,
          created_at: new Date().toISOString()
        }

        estoqueAtualizado = [novoItemObj, ...estoqueAtualizado]
        if (isSupabaseConfigured()) dbUpsert('estoque', novoItemObj)

        itensGravadosNFe.push({
          tipo: 'NOVO',
          item_id: novoItemObj.id,
          nome: novoItemObj.nome,
          codigo_sku: novoItemObj.codigo_sku,
          quantidade: novoItemObj.quantidade,
          preco_custo_real: novoItemObj.preco_custo
        })
      }
    })

    setEstoque(estoqueAtualizado)

    const registroNota = {
      id: `nf_${Date.now()}`,
      numero_nf: nfeData.numero_nf,
      serie: nfeData.serie,
      chave_acesso: nfeData.chave_acesso,
      data_emissao: nfeData.data_emissao,
      data_entrada: new Date().toISOString(),
      fornecedor_nome: nfeData.fornecedor.razao_social,
      fornecedor_cnpj: nfeData.fornecedor.cnpj,
      fornecedor_uf: nfeData.fornecedor.uf,
      valor_produtos: nfeData.totais.valor_produtos,
      valor_frete: nfeData.totais.valor_frete,
      valor_ipi: nfeData.totais.valor_ipi,
      valor_st: nfeData.totais.valor_st,
      valor_total: nfeData.totais.valor_total,
      itens_json: itensGravadosNFe,
      observacoes: `Entrada via XML em ${new Date().toLocaleDateString('pt-BR')}`
    }

    if (setNotasFiscais) {
      setNotasFiscais(prev => [registroNota, ...(prev || [])])
    }
    if (isSupabaseConfigured()) {
      dbUpsert('notas_fiscais', registroNota)
    }
  }

  // Ajuste rápido de quantidade (entrada ou saída)
  const handleSalvarAjuste = (e) => {
    e.preventDefault()
    if (!modalAjuste) return
    const delta = parseInt(qtdAjuste) || 0
    if (delta <= 0) return

    let itemAjustado = null
    const estoqueAtualizado = estoque.map(p => {
      if (p.id === modalAjuste.id) {
        const novaQtd = tipoAjuste === 'ENTRADA' ? (p.quantidade || 0) + delta : Math.max(0, (p.quantidade || 0) - delta)
        itemAjustado = { ...p, quantidade: novaQtd }
        return itemAjustado
      }
      return p
    })

    setEstoque(estoqueAtualizado)
    if (itemAjustado && isSupabaseConfigured()) dbUpsert('estoque', itemAjustado)

    setModalAjuste(null)
    setQtdAjuste('')
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ─── 1. HEADER DO MÓDULO & AÇÕES FISCAIS ───────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gold-primary)', margin: 0 }}>
            Gestão Integrada de Estoques
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Controle segregado de Armas, Munições, Peças e Suprimentos de Armaria.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={() => setModalHistorico(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            title="Ver histórico fiscal de notas de entrada"
          >
            <History size={16} />
            <span>Histórico NFs ({notasFiscais.length})</span>
          </button>

          <button
            className="btn-gold"
            onClick={() => setModalNfe(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            title="Importar XML de NF-e da CBC, Taurus ou distribuidores"
          >
            <FileText size={17} />
            <span>📥 Importar NF-e (XML)</span>
          </button>

          {/* Botão de Cadastro Dinâmico conforme a Aba Ativa */}
          {abaAtiva === 'ARMA' && (
            <button className="btn-gold" onClick={() => { setArmaEdicao(null); setModalArma(true) }}>
              <Shield size={16} /> <span>+ Cadastrar Arma no Cofre</span>
            </button>
          )}

          {abaAtiva === 'MUNICAO' && (
            <button className="btn-gold" onClick={() => { setMunicaoEdicao(null); setModalMunicao(true) }}>
              <Target size={16} /> <span>+ Entrada de Munições</span>
            </button>
          )}

          {abaAtiva === 'PECA' && (
            <button className="btn-gold" onClick={() => handleAbrirCriarPeca('PECA')}>
              <Plus size={16} /> <span>+ Nova Peça de Reposição</span>
            </button>
          )}

          {abaAtiva === 'SUPRIMENTO' && (
            <button className="btn-gold" onClick={() => handleAbrirCriarPeca('SUPRIMENTO')}>
              <Plus size={16} /> <span>+ Novo Insumo / Acessório</span>
            </button>
          )}

          {abaAtiva === 'TODOS' && (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className="btn-secondary" onClick={() => { setArmaEdicao(null); setModalArma(true) }} title="Cadastrar Arma">
                <Shield size={14} /> <span>+ Arma</span>
              </button>
              <button className="btn-secondary" onClick={() => { setMunicaoEdicao(null); setModalMunicao(true) }} title="Entrada de Munição">
                <Target size={14} /> <span>+ Munição</span>
              </button>
              <button className="btn-secondary" onClick={() => handleAbrirCriarPeca('PECA')} title="Cadastrar Peça">
                <Plus size={14} /> <span>+ Peça / Insumo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── 2. BARRA DE SEGMENTAÇÃO DE ESTOQUES (ESTILO TIRO DIGITAL / SHOOTING HOUSE) ─── */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        borderBottom: '2px solid var(--border-color)',
        paddingBottom: '0.4rem'
      }}>
        {[
          { id: 'TODOS', label: 'Visão Geral', icon: Package, count: totalItensGerais },
          { id: 'ARMA', label: 'Armas de Fogo', icon: Shield, count: totalArmasNoCofre, badge: `${armasRestritas} Restritas` },
          { id: 'MUNICAO', label: 'Munições', icon: Target, count: `${totalCaixasMunicao} cx`, badge: `${totalCartuchos} un.` },
          { id: 'PECA', label: 'Peças & Componentes', icon: Wrench, count: pecasList.length },
          { id: 'SUPRIMENTO', label: 'Suprimentos & Limpeza', icon: Droplets, count: suprimentosList.length }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = abaAtiva === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => { setAbaAtiva(tab.id); setFiltroClassificacaoLegal('TODOS') }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.65rem 1.1rem',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--gold-primary)' : '3px solid transparent',
                backgroundColor: isActive ? 'rgba(217, 119, 6, 0.12)' : 'transparent',
                color: isActive ? 'var(--gold-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? '700' : '500',
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s'
              }}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
              <span style={{
                fontSize: '0.72rem',
                padding: '0.15rem 0.45rem',
                borderRadius: '12px',
                backgroundColor: isActive ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.08)',
                color: isActive ? '#000' : 'var(--text-muted)',
                fontWeight: '700'
              }}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ─── 3. CARDS DE INDICADORES ADAPTÁVEIS ────────────────────────────── */}
      {abaAtiva === 'ARMA' ? (
        /* Cards para Armas de Fogo */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '3px solid #34D399' }}>
            <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(52, 211, 153, 0.15)' }}>
              <Shield size={24} color="#34D399" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ARMAS NO COFRE (DISPONÍVEIS)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#34D399' }}>
                {armasList.filter(a => a.status_arma === 'DISPONIVEL').length} armas
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
              <CheckCircle2 size={24} color="#60A5FA" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CALIBRES PERMITIDOS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#60A5FA' }}>
                {armasPermitidas} armas
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '3px solid #F59E0B' }}>
            <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
              <AlertTriangle size={24} color="#F59E0B" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CALIBRES RESTRITOS (DEC. 11.615)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#F59E0B' }}>
                {armasRestritas} armas
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.15)' }}>
              <History size={24} color="#C084FC" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>RESERVADAS / AGUARDANDO CRAF</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#C084FC' }}>
                {armasReservadas} armas
              </div>
            </div>
          </div>
        </div>
      ) : abaAtiva === 'MUNICAO' ? (
        /* Cards para Munições */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '3px solid var(--border-gold)' }}>
            <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(217, 119, 6, 0.15)' }}>
              <Target size={24} color="var(--gold-primary)" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TOTAL DE CARTUCHOS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--gold-primary)' }}>
                {totalCartuchos.toLocaleString('pt-BR')} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '400' }}>un.</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
              <Package size={24} color="#60A5FA" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CAIXAS EM ESTOQUE</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#60A5FA' }}>
                {totalCaixasMunicao} caixas
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(52, 211, 153, 0.15)' }}>
              <CheckCircle2 size={24} color="#34D399" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>MUNIÇÕES PERMITIDAS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#34D399' }}>
                {municoesPermitidasCartuchos.toLocaleString('pt-BR')} un.
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '3px solid #F59E0B' }}>
            <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
              <AlertTriangle size={24} color="#F59E0B" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>MUNIÇÕES RESTRITAS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#F59E0B' }}>
                {municoesRestritasCartuchos.toLocaleString('pt-BR')} un.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Cards Consolidados para Visão Geral, Peças e Suprimentos */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <Package size={24} color="#60A5FA" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL DE ITENS CADASTRADOS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)' }}>
                {totalItensGerais} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '400' }}>({totalQuantidadeGeral} un.)</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <AlertTriangle size={24} color="#F87171" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ALERTA ESTOQUE BAIXO</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: itensAlerta.length > 0 ? '#F87171' : '#34D399' }}>
                {itensAlerta.length} itens
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'var(--gold-glow)', border: '1px solid var(--border-gold)' }}>
              <DollarSign size={24} color="var(--gold-primary)" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>VALOR EM VENDAS (ESTOQUE)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--gold-primary)' }}>
                R$ {valorTotalVenda.toFixed(2)}
              </div>
            </div>
          </div>

          <div
            className="card"
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
            onClick={() => setModalHistorico(true)}
            title="Clique para ver o histórico fiscal de notas"
          >
            <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <FileText size={24} color="#34D399" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NOTAS FISCAIS DE ENTRADA</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#34D399' }}>
                {notasFiscais.length} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '400' }}>registradas</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. FILTROS & BUSCA RÁPIDA ─────────────────────────────────────── */}
      <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '1rem' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: '2.5rem' }}
            placeholder={
              abaAtiva === 'ARMA'
                ? 'Buscar por nº de série, modelo, calibre ou cliente...'
                : abaAtiva === 'MUNICAO'
                ? 'Buscar por calibre, lote do fabricante ou projétil...'
                : 'Buscar por nome, código SKU, barras (EAN) ou NCM...'
            }
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        {/* Filtro Calibre Permitido / Restrito em Armas e Munições */}
        {(abaAtiva === 'ARMA' || abaAtiva === 'MUNICAO') && (
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[
              { id: 'TODOS', label: 'Todos os Calibres' },
              { id: 'PERMITIDO', label: 'Calibres Permitidos' },
              { id: 'RESTRITO', label: 'Calibres Restritos' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                className={`btn-secondary ${filtroClassificacaoLegal === f.id ? 'active-gold' : ''}`}
                style={{
                  fontSize: '0.78rem',
                  padding: '0.4rem 0.75rem',
                  borderColor: filtroClassificacaoLegal === f.id ? 'var(--gold-primary)' : undefined,
                  backgroundColor: filtroClassificacaoLegal === f.id ? 'rgba(217, 119, 6, 0.2)' : undefined,
                  color: filtroClassificacaoLegal === f.id ? 'var(--gold-primary)' : undefined
                }}
                onClick={() => setFiltroClassificacaoLegal(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {(abaAtiva === 'TODOS' || abaAtiva === 'PECA' || abaAtiva === 'SUPRIMENTO') && (
          <div style={{ minWidth: '220px' }}>
            <CustomSelect
              label=""
              value={filtroCategoria}
              onChange={val => setFiltroCategoria(val)}
              options={categoriasDisponiveis}
              placeholder="Filtrar por Categoria..."
              allowCustom={false}
            />
          </div>
        )}
      </div>

      {/* ─── 5. TABELA DE ITENS COM VISUAL ADAPTÁVEL ───────────────────────── */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)' }}>
              {abaAtiva === 'ARMA' ? (
                <>
                  <th style={{ padding: '0.85rem 1rem' }}>Nº DE SÉRIE</th>
                  <th style={{ padding: '0.85rem 1rem' }}>ARMA / MODELO</th>
                  <th style={{ padding: '0.85rem 1rem' }}>CALIBRE & CATEGORIA</th>
                  <th style={{ padding: '0.85rem 1rem' }}>REGISTRO</th>
                  <th style={{ padding: '0.85rem 1rem' }}>STATUS NO COFRE</th>
                  <th style={{ padding: '0.85rem 1rem' }}>PREÇO VENDA</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>AÇÕES</th>
                </>
              ) : abaAtiva === 'MUNICAO' ? (
                <>
                  <th style={{ padding: '0.85rem 1rem' }}>CALIBRE & PROJÉTIL</th>
                  <th style={{ padding: '0.85rem 1rem' }}>LOTE FABRICANTE</th>
                  <th style={{ padding: '0.85rem 1rem' }}>CLASSIFICAÇÃO</th>
                  <th style={{ padding: '0.85rem 1rem' }}>SALDO EM CAIXAS</th>
                  <th style={{ padding: '0.85rem 1rem' }}>TOTAL CARTUCHOS</th>
                  <th style={{ padding: '0.85rem 1rem' }}>PREÇO CAIXA / UNIT.</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>AÇÕES</th>
                </>
              ) : (
                <>
                  <th style={{ padding: '0.85rem 1rem' }}>CÓDIGO / SKU</th>
                  <th style={{ padding: '0.85rem 1rem' }}>ITEM / DESCRIÇÃO</th>
                  <th style={{ padding: '0.85rem 1rem' }}>TIPO / CATEGORIA</th>
                  <th style={{ padding: '0.85rem 1rem' }}>PREÇO CUSTO</th>
                  <th style={{ padding: '0.85rem 1rem' }}>PREÇO VENDA</th>
                  <th style={{ padding: '0.85rem 1rem' }}>SALDO</th>
                  <th style={{ padding: '0.85rem 1rem' }}>STATUS</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>AÇÕES</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {estoqueFiltrado.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Nenhum registro encontrado para este filtro de estoque.
                </td>
              </tr>
            ) : (
              estoqueFiltrado.map(item => {
                const tipo = getTipoItem(item)

                if (abaAtiva === 'ARMA' || (abaAtiva === 'TODOS' && tipo === 'ARMA')) {
                  const statusColors = {
                    DISPONIVEL: { bg: 'rgba(52, 211, 153, 0.15)', text: '#34D399', label: '🟢 Disponível no Cofre' },
                    RESERVADA: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', label: '🟡 Reservada' },
                    AGUARDANDO_CRAF: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', label: '🔵 Aguardando CRAF' },
                    ENTREGUE: { bg: 'rgba(156, 163, 175, 0.15)', text: '#9CA3AF', label: '⚪ Entregue' },
                    CONSIGNADA: { bg: 'rgba(192, 132, 252, 0.15)', text: '#C084FC', label: '🟣 Consignada' }
                  }
                  const st = statusColors[item.status_arma] || statusColors.DISPONIVEL

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontFamily: 'monospace', color: 'var(--gold-primary)', fontWeight: '800', fontSize: '0.95rem' }}>
                          {item.numero_serie || item.codigo_sku}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.localizacao || 'Cofre'}</div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                          {item.tipo_arma || ''} {item.fabricante || ''} {item.modelo || item.nome}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {item.acabamento ? `Acabamento: ${item.acabamento}` : ''} {item.capacidade_tiros ? `• Cap: ${item.capacidade_tiros}` : ''}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{item.calibre || '9mm'}</div>
                        <span style={{
                          fontSize: '0.68rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontWeight: '700',
                          backgroundColor: item.classificacao_calibre === 'RESTRITO' ? 'rgba(239,68,68,0.2)' : 'rgba(52,211,153,0.2)',
                          color: item.classificacao_calibre === 'RESTRITO' ? '#F87171' : '#34D399'
                        }}>
                          {item.classificacao_calibre === 'RESTRITO' ? 'Restrito' : 'Permitido'}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {item.sistema_registro || 'SIGMA'}
                        </span>
                        {item.numero_sigma_sinarm && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {item.numero_sigma_sinarm}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          backgroundColor: st.bg,
                          color: st.text,
                          display: 'inline-block'
                        }}>
                          {st.label}
                        </span>
                        {item.cliente_reserva_nome && (
                          <div style={{ fontSize: '0.72rem', color: '#93C5FD', marginTop: '0.2rem' }}>
                            Titular: {item.cliente_reserva_nome}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#34D399' }}>
                        R$ {(item.preco_venda || 0).toFixed(2)}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.5rem' }}
                            onClick={() => handleAbrirEditarItem(item)}
                            title="Editar Arma"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.5rem', color: '#F87171', borderColor: 'rgba(239,68,68,0.3)' }}
                            onClick={() => handleExcluirItem(item.id)}
                            title="Remover Arma"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }

                if (abaAtiva === 'MUNICAO' || (abaAtiva === 'TODOS' && tipo === 'MUNICAO')) {
                  const qtdEmb = item.quantidade_por_embalagem || 50
                  const caixas = item.total_caixas || Math.floor((item.quantidade || 0) / qtdEmb)
                  const emAlerta = (item.quantidade || 0) <= ((item.estoque_minimo || 2) * qtdEmb)

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.92rem' }}>
                          {item.calibre || item.nome}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {item.tipo_projetil || 'Projétil Padrão'} ({item.fabricante || 'CBC'})
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--gold-primary)', backgroundColor: 'rgba(217,119,6,0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                          {item.lote_fabricante || 'S/ LOTE'}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: '700',
                          backgroundColor: item.classificacao_calibre === 'RESTRITO' ? 'rgba(239,68,68,0.2)' : 'rgba(52,211,153,0.2)',
                          color: item.classificacao_calibre === 'RESTRITO' ? '#F87171' : '#34D399'
                        }}>
                          {item.classificacao_calibre === 'RESTRITO' ? 'Restrito' : 'Permitido'}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                          {caixas} cx
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{qtdEmb} un/cx</div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '800', color: emAlerta ? '#F87171' : '#34D399' }}>
                          {(item.quantidade || 0).toLocaleString('pt-BR')} un.
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: '700', color: '#34D399' }}>
                          R$ {(item.preco_venda || item.preco_caixa || 0).toFixed(2)} cx
                        </div>
                        {item.preco_unitario_cartucho && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            R$ {Number(item.preco_unitario_cartucho).toFixed(2)} / un.
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => {
                              setModalAjuste(item)
                              setQtdAjuste(String(qtdEmb))
                              setTipoAjuste('ENTRADA')
                            }}
                          >
                            + Ajustar
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.5rem' }}
                            onClick={() => handleAbrirEditarItem(item)}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.5rem', color: '#F87171', borderColor: 'rgba(239,68,68,0.3)' }}
                            onClick={() => handleExcluirItem(item.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }

                // Peças, Insumos e Produtos Gerais
                const emAlerta = (item.quantidade || 0) <= (item.estoque_minimo || 2)
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontFamily: 'monospace', color: 'var(--gold-primary)', fontWeight: '700' }}>
                        {item.codigo_sku}
                      </div>
                      {item.codigo_barras && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          EAN: {item.codigo_barras}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{item.nome}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {item.localizacao || 'Armeria'} {item.ncm ? `• NCM: ${item.ncm}` : ''}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255,255,255,0.06)'
                      }}>
                        {item.categoria}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>R$ {(item.preco_custo || 0).toFixed(2)}</td>

                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#34D399' }}>
                      R$ {(item.preco_venda || 0).toFixed(2)}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '800', color: emAlerta ? '#F87171' : 'var(--text-main)' }}>
                        {item.quantidade} {item.unidade || 'un.'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                        Mín: {item.estoque_minimo} {item.unidade || 'un.'}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${emAlerta ? 'badge-red' : 'badge-green'}`}>
                        {emAlerta ? '⚠️ Baixo' : '✓ Normal'}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => {
                            setModalAjuste(item)
                            setQtdAjuste('1')
                            setTipoAjuste('ENTRADA')
                          }}
                        >
                          + Ajustar
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.5rem' }}
                          onClick={() => handleAbrirEditarItem(item)}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.5rem', color: '#F87171', borderColor: 'rgba(239,68,68,0.3)' }}
                          onClick={() => handleExcluirItem(item.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── MODAL ESPECIALIZADO DE ARMAS DE FOGO ─────────────────────────────── */}
      <ModalCadastrarArma
        isOpen={modalArma}
        onClose={() => setModalArma(false)}
        onSalvarArma={handleSalvarArma}
        armaEdicao={armaEdicao}
        clientes={clientes}
      />

      {/* ── MODAL ESPECIALIZADO DE MUNIÇÕES ──────────────────────────────────── */}
      <ModalCadastrarMunicao
        isOpen={modalMunicao}
        onClose={() => setModalMunicao(false)}
        onSalvarMunicao={handleSalvarMunicao}
        municaoEdicao={municaoEdicao}
      />

      {/* ── MODAL PEÇAS / INSUMOS MANUAIS ────────────────────────────────────── */}
      {modalItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gold-primary)', marginBottom: '1rem' }}>
              {itemEdicao ? `Editar ${formItem.tipo_estoque === 'SUPRIMENTO' ? 'Insumo / Suprimento' : 'Peça'}` : `Cadastrar Nova Peça no Estoque`}
            </h3>

            <form onSubmit={handleSalvarItemPeca} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Código SKU *</label>
                  <input required className="input-field" value={formItem.codigo_sku} onChange={e => setFormItem({...formItem, codigo_sku: e.target.value})} placeholder="PECA-01" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nome da Peça / Produto *</label>
                  <input required className="input-field" value={formItem.nome} onChange={e => setFormItem({...formItem, nome: e.target.value})} placeholder="Ex: Extrator Glock Gen5" />
                </div>
              </div>

              <CustomSelect
                label="Categoria *"
                value={formItem.categoria}
                onChange={val => setFormItem({...formItem, categoria: val})}
                options={listaCategoriasConfig}
                placeholder="Selecione a categoria..."
                allowCustom={true}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Preço Custo (R$)</label>
                  <input type="number" step="0.01" className="input-field" value={formItem.preco_custo} onChange={e => setFormItem({...formItem, preco_custo: e.target.value})} placeholder="0.00" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: '700' }}>Preço Venda (R$) *</label>
                  <input required type="number" step="0.01" className="input-field" value={formItem.preco_venda} onChange={e => setFormItem({...formItem, preco_venda: e.target.value})} placeholder="0.00" />
                </div>
              </div>

              {/* CAMPOS DE ESTOQUE: ESTOQUE ATUAL, QUANTIDADE (ENTRADA) E ESTOQUE MÍNIMO */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Estoque atual
                  </label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    className="input-field"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderColor: 'rgba(255, 255, 255, 0.12)',
                      color: '#9CA3AF',
                      cursor: 'not-allowed',
                      fontWeight: '700'
                    }}
                    value={`${formItem.estoque_atual || 0} ${formItem.unidade || 'un.'}`}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Campo não editável</span>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: '700', display: 'block', marginBottom: '0.25rem' }}>
                    Quantidade *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="input-field"
                    style={{ borderColor: 'var(--border-gold)' }}
                    value={formItem.quantidade_entrada}
                    onChange={e => setFormItem({...formItem, quantidade_entrada: e.target.value})}
                    placeholder="0"
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--gold-primary)' }}>
                    {itemEdicao ? 'Entrada a somar (+)' : 'Entrada no estoque'}
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Estoque mínimo alerta *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="input-field"
                    value={formItem.estoque_minimo}
                    onChange={e => setFormItem({...formItem, estoque_minimo: e.target.value})}
                    placeholder="2"
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Alerta de reposição</span>
                </div>
              </div>

              {/* Box explicativo dinâmico de saldo resultante */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(217, 119, 6, 0.08)',
                border: '1px solid rgba(217, 119, 6, 0.25)',
                padding: '0.65rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.82rem'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  {itemEdicao
                    ? `Saldo atual (${formItem.estoque_atual || 0}) + Entrada (${parseInt(formItem.quantidade_entrada) || 0}) =`
                    : 'Estoque inicial registrado:'}
                </span>
                <span style={{ fontWeight: '700', color: 'var(--gold-primary)', fontSize: '0.95rem' }}>
                  {((parseInt(formItem.estoque_atual) || 0) + (parseInt(formItem.quantidade_entrada) || 0))} {formItem.unidade || 'un.'} em estoque
                </span>
              </div>

              {/* SEÇÃO FISCAL & RASTREABILIDADE */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--gold-primary)', fontWeight: '700', fontSize: '0.82rem' }}>
                    <ShieldCheck size={16} />
                    <span>Dados Fiscais & Rastreabilidade</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Opcional</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                      Cód. Barras (EAN-13)
                    </label>
                    <input
                      className="input-field"
                      style={{ fontSize: '0.8rem' }}
                      value={formItem.codigo_barras}
                      onChange={e => setFormItem({...formItem, codigo_barras: e.target.value})}
                      placeholder="Ex: 7891234567890"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                      NCM (8 dígitos)
                    </label>
                    <input
                      className="input-field"
                      style={{ fontSize: '0.8rem' }}
                      value={formItem.ncm}
                      onChange={e => setFormItem({...formItem, ncm: e.target.value})}
                      placeholder="9305.10.00"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                      Unidade Medida
                    </label>
                    <select
                      className="input-field"
                      style={{ fontSize: '0.8rem', padding: '0.45rem' }}
                      value={formItem.unidade}
                      onChange={e => setFormItem({...formItem, unidade: e.target.value})}
                    >
                      <option value="UN">UN (Unidade)</option>
                      <option value="PC">PC (Peça)</option>
                      <option value="PAR">PAR (Par)</option>
                      <option value="JG">JG (Jogo)</option>
                      <option value="CX">CX (Caixa)</option>
                      <option value="ML">ML (Mililitro)</option>
                      <option value="KG">KG (Quilo)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Localização no Galpão / Gaveta</label>
                <input className="input-field" value={formItem.localizacao} onChange={e => setFormItem({...formItem, localizacao: e.target.value})} placeholder="Ex: Gaveta A1 - Armeria" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalItem(false)}>Cancelar</button>
                <button type="submit" className="btn-gold">Salvar no Estoque</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL AJUSTE RÁPIDO DE QUANTIDADE ─────────────────────────────────── */}
      {modalAjuste && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
              Ajustar Quantidade: {modalAjuste.nome}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Estoque atual: <strong>{modalAjuste.quantidade} {modalAjuste.unidade || 'un.'}</strong>
            </p>

            <form onSubmit={handleSalvarAjuste} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <CustomSelect
                label="Tipo de Movimentação *"
                value={tipoAjuste === 'ENTRADA' ? 'Entrada (Adicionar Unidades)' : 'Saída (Remover Unidades)'}
                onChange={val => setTipoAjuste(val.includes('Entrada') ? 'ENTRADA' : 'SAIDA')}
                options={['Entrada (Adicionar Unidades)', 'Saída (Remover Unidades)']}
                placeholder="Selecione o tipo..."
                allowCustom={false}
              />

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quantidade de Unidades *</label>
                <input required type="number" min="1" className="input-field" value={qtdAjuste} onChange={e => setQtdAjuste(e.target.value)} placeholder="1" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalAjuste(null)}>Cancelar</button>
                <button type="submit" className="btn-gold">Confirmar Ajuste</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL IMPORTAÇÃO DE XML DA NF-e ───────────────────────────────────── */}
      <ModalImportarNFe
        isOpen={modalNfe}
        onClose={() => setModalNfe(false)}
        estoque={estoque}
        categoriasDisponiveis={listaCategoriasConfig}
        onConfirmarEntrada={handleConfirmarEntradaNFe}
      />

      {/* ── MODAL HISTÓRICO DE NOTAS FISCAIS DE ENTRADA ───────────────────────── */}
      <ModalHistoricoNFe
        isOpen={modalHistorico}
        onClose={() => setModalHistorico(false)}
        notasFiscais={notasFiscais}
      />
    </div>
  )
}
