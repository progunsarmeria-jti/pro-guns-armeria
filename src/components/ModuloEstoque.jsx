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
  X
} from 'lucide-react'
import CustomSelect from './CustomSelect'
import { dbUpsert, dbDelete, isSupabaseConfigured } from '../lib/supabase'
import ModalImportarNFe from './ModalImportarNFe'
import ModalHistoricoNFe from './ModalHistoricoNFe'

export default function ModuloEstoque({
  estoque = [],
  setEstoque,
  usuarioLogado,
  config,
  notasFiscais = [],
  setNotasFiscais
}) {
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
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

  // Form State Item com campos Fiscais
  const [formItem, setFormItem] = useState({
    codigo_sku: '',
    nome: '',
    categoria: listaCategoriasConfig[0] || 'COMPONENTES & PEÇAS',
    codigo_barras: '',
    ncm: '',
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

  // Métricas do Estoque
  const totalItens = estoque.length
  const totalQuantidade = estoque.reduce((acc, i) => acc + (i.quantidade || 0), 0)
  const valorTotalCusto = estoque.reduce((acc, i) => acc + ((i.preco_custo || 0) * (i.quantidade || 0)), 0)
  const valorTotalVenda = estoque.reduce((acc, i) => acc + ((i.preco_venda || 0) * (i.quantidade || 0)), 0)
  const itensAlerta = estoque.filter(i => (i.quantidade || 0) <= (i.estoque_minimo || 2))

  const handleAbrirCriar = () => {
    setItemEdicao(null)
    setFormItem({
      codigo_sku: `PECA-${Math.floor(1000 + Math.random() * 9000)}`,
      nome: '',
      categoria: listaCategoriasConfig[0] || 'COMPONENTES & PEÇAS',
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
    setModalItem(true)
  }

  const handleAbrirEditar = (item) => {
    setItemEdicao(item)
    setFormItem({
      codigo_sku: item.codigo_sku || '',
      nome: item.nome || '',
      categoria: item.categoria || listaCategoriasConfig[0] || 'COMPONENTES & PEÇAS',
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

  const handleSalvarItem = (e) => {
    e.preventDefault()
    if (!formItem.nome) return

    const entrada = parseInt(formItem.quantidade_entrada) || 0
    const estoqueAtual = itemEdicao ? (parseInt(formItem.estoque_atual) || 0) : 0
    const quantidadeFinal = Math.max(0, estoqueAtual + entrada)

    const novoItemObj = {
      id: itemEdicao ? itemEdicao.id : `p_${Date.now()}`,
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
            codigo_barras: itemMap.xml.codigo_barras,
            ncm: itemMap.xml.ncm,
            quantidade: qtdEntrada,
            preco_custo_real: itemMap.xml.preco_custo_real
          })
        }
      } else {
        // Novo item no estoque
        const novoItemObj = {
          id: `p_${Date.now()}_${idx}`,
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
          codigo_barras: novoItemObj.codigo_barras,
          ncm: novoItemObj.ncm,
          quantidade: novoItemObj.quantidade,
          preco_custo_real: novoItemObj.preco_custo
        })
      }
    })

    setEstoque(estoqueAtualizado)

    // Cria registro no histórico de notas fiscais
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

  const handleSalvarAjuste = (e) => {
    e.preventDefault()
    if (!modalAjuste) return
    const delta = parseInt(qtdAjuste) || 0
    if (delta <= 0) return

    let itemAjustado = null
    const estoqueAtualizado = estoque.map(p => {
      if (p.id === modalAjuste.id) {
        const novaQtd = tipoAjuste === 'ENTRADA' ? p.quantidade + delta : Math.max(0, p.quantidade - delta)
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

  const handleExcluirItem = (id) => {
    if (window.confirm('Tem certeza que deseja remover esta peça do estoque?')) {
      setEstoque(prev => prev.filter(p => String(p.id) !== String(id)))
      if (isSupabaseConfigured()) {
        dbDelete('estoque', id)
      }
    }
  }

  // Filtro de busca enriquecido: busca por Nome, SKU, Código de Barras (EAN) e NCM
  const estoqueFiltrado = estoque.filter(item => {
    const termo = busca.toLowerCase()
    const matchBusca = (item.nome || '').toLowerCase().includes(termo) ||
                       (item.codigo_sku || '').toLowerCase().includes(termo) ||
                       (item.codigo_barras || '').toLowerCase().includes(termo) ||
                       (item.ncm || '').toLowerCase().includes(termo)
    const matchCategoria = filtroCategoria === 'Todas' || item.categoria === filtroCategoria
    return matchBusca && matchCategoria
  })

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header do Módulo de Estoque */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gold-primary)', margin: 0 }}>
            Controle de Estoque & Peças
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Gestão de inventário de armas de fogo, componentes, insumos, controle fiscal (NF-e/SEFAZ) e Exército (DFPC).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={() => setModalHistorico(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            title="Ver histórico de notas fiscais de entrada"
          >
            <History size={16} />
            <span>Histórico NFs ({notasFiscais.length})</span>
          </button>

          <button
            className="btn-gold"
            onClick={() => setModalNfe(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            title="Importar arquivo XML de NF-e recebido do fornecedor"
          >
            <FileText size={17} />
            <span>📥 Importar NF-e (XML)</span>
          </button>

          <button className="btn-secondary" onClick={handleAbrirCriar} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={16} />
            <span>+ Peça Manual</span>
          </button>
        </div>
      </div>

      {/* Cards Indicadores do Estoque */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <Package size={24} color="#60A5FA" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL DE ITENS CADASTRADOS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)' }}>
              {totalItens} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '400' }}>({totalQuantidade} un.)</span>
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

      {/* Filtros e Busca com suporte a Código de Barras e NCM */}
      <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '1rem' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Buscar por nome, SKU, código de barras (EAN) ou NCM..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

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
      </div>

      {/* Tabela de Produtos / Peças */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>CÓDIGO SKU / EAN</th>
              <th style={{ padding: '0.85rem 1rem' }}>NOME DA PEÇA / FISCAL</th>
              <th style={{ padding: '0.85rem 1rem' }}>CATEGORIA</th>
              <th style={{ padding: '0.85rem 1rem' }}>PREÇO CUSTO</th>
              <th style={{ padding: '0.85rem 1rem' }}>PREÇO VENDA</th>
              <th style={{ padding: '0.85rem 1rem' }}>QTD EM ESTOQUE</th>
              <th style={{ padding: '0.85rem 1rem' }}>STATUS</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {estoqueFiltrado.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Nenhum item encontrado no estoque.
                </td>
              </tr>
            ) : (
              estoqueFiltrado.map(item => {
                const emAlerta = (item.quantidade || 0) <= (item.estoque_minimo || 2)
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontFamily: 'monospace', color: 'var(--gold-primary)', fontWeight: '700' }}>
                        {item.codigo_sku}
                      </div>
                      {item.codigo_barras && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          EAN: {item.codigo_barras}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{item.nome}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span>{item.localizacao || 'Armeria'}</span>
                        {item.ncm && <span>• NCM: <code style={{ color: '#D1D5DB' }}>{item.ncm}</code></span>}
                        {item.unidade && <span>• Un: <code>{item.unidade}</code></span>}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{item.categoria}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>R$ {(item.preco_custo || 0).toFixed(2)}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#34D399' }}>
                      R$ {(item.preco_venda || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '800', color: emAlerta ? '#F87171' : 'var(--text-main)' }}>
                        {item.quantidade} {item.unidade || 'un.'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                        Mín: {item.estoque_minimo} {item.unidade || 'un.'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${emAlerta ? 'badge-red' : 'badge-green'}`}>
                        {emAlerta ? '⚠️ Estoque Baixo' : '✓ Normal'}
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
                          + Ajustar Qtd
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.5rem' }}
                          onClick={() => handleAbrirEditar(item)}
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

      {/* ── MODAL CRIAR/EDITAR ITEM DE ESTOQUE COM DADOS FISCAIS ──────────────── */}
      {modalItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gold-primary)', marginBottom: '1rem' }}>
              {itemEdicao ? 'Editar Peça do Estoque' : 'Cadastrar Nova Peça no Estoque'}
            </h3>

            <form onSubmit={handleSalvarItem} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
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

              {/* ── SEÇÃO FISCAL & RASTREABILIDADE ── */}
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
                    <span>Dados Fiscais & Rastreabilidade (SEFAZ / Exército)</span>
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

                {/* Atalhos Rápidos NCM de Armaria */}
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Atalhos NCM mais comuns em armaria:
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {[
                      { ncm: '9305.10.00', label: '9305.10.00 (Peças Pistola/Revólver)' },
                      { ncm: '9305.20.00', label: '9305.20.00 (Peças Armas Longas)' },
                      { ncm: '3403.99.00', label: '3403.99.00 (Óleos & Solventes)' },
                      { ncm: '9306.30.00', label: '9306.30.00 (Munições)' },
                      { ncm: '4202.92.00', label: '4202.92.00 (Coldres & Cases)' }
                    ].map(btn => (
                      <button
                        key={btn.ncm}
                        type="button"
                        className="btn-secondary"
                        style={{
                          fontSize: '0.66rem',
                          padding: '0.15rem 0.45rem',
                          backgroundColor: formItem.ncm === btn.ncm ? 'rgba(217, 119, 6, 0.25)' : undefined,
                          borderColor: formItem.ncm === btn.ncm ? 'var(--gold-primary)' : undefined,
                          color: formItem.ncm === btn.ncm ? 'var(--gold-primary)' : undefined
                        }}
                        onClick={() => setFormItem({ ...formItem, ncm: btn.ncm })}
                      >
                        {btn.label}
                      </button>
                    ))}
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
