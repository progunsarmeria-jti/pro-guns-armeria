import React, { useState } from 'react'
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  DollarSign,
  Layers,
  X
} from 'lucide-react'
import CustomSelect from './CustomSelect'
import { dbUpsert, dbDelete, isSupabaseConfigured } from '../lib/supabase'

export default function ModuloEstoque({ estoque = [], setEstoque, usuarioLogado }) {
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [modalItem, setModalItem] = useState(false)
  const [itemEdicao, setItemEdicao] = useState(null)

  // State Modal Ajuste Rápido
  const [modalAjuste, setModalAjuste] = useState(null)
  const [qtdAjuste, setQtdAjuste] = useState('')
  const [tipoAjuste, setTipoAjuste] = useState('ENTRADA') // 'ENTRADA' | 'SAIDA'

  // Form State Item
  const [formItem, setFormItem] = useState({
    codigo_sku: '',
    nome: '',
    categoria: 'Componentes & Peças',
    preco_custo: '',
    preco_venda: '',
    quantidade: '0',
    estoque_minimo: '2',
    localizacao: 'Armeria - Prateleira A'
  })

  const categoriasDisponiveis = [
    'Todas',
    'Componentes & Peças',
    'Limpeza & Conservação',
    'Miras & Ópticas',
    'Acessórios & Carregadores',
    'Insumos'
  ]

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
      categoria: 'Componentes & Peças',
      preco_custo: '',
      preco_venda: '',
      quantidade: '5',
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
      categoria: item.categoria || 'Componentes & Peças',
      preco_custo: item.preco_custo ? item.preco_custo.toString() : '',
      preco_venda: item.preco_venda ? item.preco_venda.toString() : '',
      quantidade: item.quantidade ? item.quantidade.toString() : '0',
      estoque_minimo: item.estoque_minimo ? item.estoque_minimo.toString() : '2',
      localizacao: item.localizacao || ''
    })
    setModalItem(true)
  }

  const handleSalvarItem = (e) => {
    e.preventDefault()
    if (!formItem.nome) return

    const novoItemObj = {
      id: itemEdicao ? itemEdicao.id : `p_${Date.now()}`,
      codigo_sku: formItem.codigo_sku || `SKU-${Date.now()}`,
      nome: formItem.nome,
      categoria: formItem.categoria,
      preco_custo: parseFloat(formItem.preco_custo) || 0,
      preco_venda: parseFloat(formItem.preco_venda) || 0,
      quantidade: parseInt(formItem.quantidade) || 0,
      estoque_minimo: parseInt(formItem.estoque_minimo) || 2,
      localizacao: formItem.localizacao
    }

    if (itemEdicao) {
      setEstoque(prev => prev.map(p => p.id === itemEdicao.id ? novoItemObj : p))
    } else {
      setEstoque(prev => [novoItemObj, ...prev])
    }

    if (isSupabaseConfigured()) dbUpsert('estoque', novoItemObj)

    setModalItem(false)
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

  const estoqueFiltrado = estoque.filter(item => {
    const matchBusca = (item.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
                       (item.codigo_sku || '').toLowerCase().includes(busca.toLowerCase())
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
            Gestão de inventário de componentes de armas de fogo, insumos de limpeza, molas e extratores.
          </p>
        </div>

        <button className="btn-gold" onClick={handleAbrirCriar}>
          <Plus size={18} />
          <span>Cadastrar Nova Peça</span>
        </button>
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
      </div>

      {/* Filtros e Busca */}
      <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '1rem' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Buscar por nome da peça ou código SKU..."
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
              <th style={{ padding: '0.85rem 1rem' }}>CÓDIGO SKU</th>
              <th style={{ padding: '0.85rem 1rem' }}>NOME DA PEÇA / INSUMO</th>
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
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: 'var(--gold-primary)', fontWeight: '700' }}>
                      {item.codigo_sku}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{item.nome}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.localizacao}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{item.categoria}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>R$ {(item.preco_custo || 0).toFixed(2)}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#34D399' }}>
                      R$ {(item.preco_venda || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '800', color: emAlerta ? '#F87171' : 'var(--text-main)' }}>
                        {item.quantidade} un.
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                        Mín: {item.estoque_minimo} un.
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

      {/* ── MODAL CRIAR/EDITAR ITEM DE ESTOQUE ────────────────────────────────── */}
      {modalItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px' }}>
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
                options={['Componentes & Peças', 'Limpeza & Conservação', 'Miras & Ópticas', 'Acessórios & Carregadores', 'Insumos']}
                placeholder="Selecione a categoria..."
                allowCustom={false}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quantidade Atual *</label>
                  <input required type="number" min="0" className="input-field" value={formItem.quantidade} onChange={e => setFormItem({...formItem, quantidade: e.target.value})} placeholder="0" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estoque Mínimo (Alerta) *</label>
                  <input required type="number" min="1" className="input-field" value={formItem.estoque_minimo} onChange={e => setFormItem({...formItem, estoque_minimo: e.target.value})} placeholder="2" />
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
              Estoque atual: <strong>{modalAjuste.quantidade} un.</strong>
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
    </div>
  )
}
