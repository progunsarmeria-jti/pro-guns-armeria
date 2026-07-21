import React, { useState, useEffect } from 'react'
import { Settings, Building, Database, Save, CheckCircle2, Key, Wrench, Plus, Trash2, Edit, Tag, X, ListOrdered, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react'
import CustomSelect from './CustomSelect'
import { isSupabaseConfigured, saveSupabaseKeys, clearSupabaseKeys } from '../lib/supabase'
import { maskCNPJ, maskTelefone } from '../lib/masks'
import { INITIAL_CONFIG } from '../lib/initialData'

const ALL_SIDEBAR_ITEMS_REF = [
  { id: 'home',          label: 'Home (Início)' },
  { id: 'caixa',         label: 'Caixa' },
  { id: 'clientes',      label: 'Clientes' },
  { id: 'configuracoes', label: 'Configurações' },
  { id: 'estoque',       label: 'Estoque' },
  { id: 'financeiro',    label: 'Financeiro' },
  { id: 'orcamentos',    label: 'Orçamentos' },
  { id: 'ordens',        label: 'Ordem de Serviço' },
  { id: 'alertas',       label: 'Painel de Alerta' },
  { id: 'usuarios',      label: 'Usuários' },
  { id: 'vendas',        label: 'Vendas' },
]

export default function ModuloConfiguracoes({ config, setConfig }) {
  const [formData, setFormData] = useState(() => config || INITIAL_CONFIG)
  const [supaUrl, setSupaUrl] = useState(localStorage.getItem('PROGUNS_SUPABASE_URL') || '')
  const [supaKey, setSupaKey] = useState(localStorage.getItem('PROGUNS_SUPABASE_ANON_KEY') || '')
  const [salvoFeedback, setSalvoFeedback] = useState(false)

  // Aba Principal Ativa: 'dados' | 'categorias' | 'servicos' | 'menu_ordem' | 'supabase'
  const [abaConfigAtiva, setAbaConfigAtiva] = useState('dados')

  // Estado para Cadastro de Categorias por Módulo
  const [abaCategoriaAtiva, setAbaCategoriaAtiva] = useState('servicos') // 'servicos' | 'estoque' | 'financeiro' | 'equipamento'
  const [inputNovaCategoria, setInputNovaCategoria] = useState('')
  const [modalEditarCategoria, setModalEditarCategoria] = useState(null) // { modulo, chave, original, editado }

  const CONFIG_CATEGORIAS_MAP = {
    servicos: {
      id: 'servicos',
      rotulo: '🛠️ Serviços (O.S. / Orçamentos)',
      campoDestino: 'Usado em: Categoria de Serviço em O.S., Laudos Técnicos e Tabela de Valores',
      chave: 'categorias_servicos',
      padrao: ['MANUTENÇÃO', 'REPARO', 'PERSONALIZAÇÃO', 'ÓPTICA', 'ACABAMENTO', 'LIMPEZA & CONSERVAÇÃO', 'CUSTOMIZAÇÃO', 'PINTURA & CERAKOTE'],
      cor: '#FBBF24'
    },
    estoque: {
      id: 'estoque',
      rotulo: '📦 Peças & Produtos (Estoque)',
      campoDestino: 'Usado em: Categoria no cadastro de peças, produtos e filtro de estoque',
      chave: 'categorias_estoque',
      padrao: ['COMPONENTES & PEÇAS', 'LIMPEZA & CONSERVAÇÃO', 'MIRAS & ÓPTICAS', 'ACESSÓRIOS & CARREGADORES', 'INSUMOS'],
      cor: '#60A5FA'
    },
    financeiro: {
      id: 'financeiro',
      rotulo: '💰 Financeiro (Receitas & Despesas)',
      campoDestino: 'Usado em: Categoria dos lançamentos do Financeiro e Livro Caixa',
      chave: 'categorias_financeiro',
      padrao: ['SERVIÇO ARMERIA', 'VENDA DE BALCÃO', 'SANGRIA DE CAIXA', 'REFORÇO / APORTE', 'PEÇAS & INSUMOS', 'DESPESAS OPERACIONAIS', 'IMPOSTOS & TAXAS'],
      cor: '#34D399'
    },
    equipamento: {
      id: 'equipamento',
      rotulo: '🔫 Equipamentos / Armas',
      campoDestino: 'Usado em: Categoria / Tipo de Arma no Acervo do Cliente e Entrada de O.S.',
      chave: 'categorias_equipamento',
      padrao: ['PISTOLA', 'REVÓLVER', 'CARABINA', 'FUZIL', 'ESPINGARDA', 'ARMA DE AR COMPRIMIDO', 'ACESSÓRIO / SUPORTE'],
      cor: '#A78BFA'
    }
  }

  const dataSafe = formData || INITIAL_CONFIG || {}
  const catConfigAtual = CONFIG_CATEGORIAS_MAP[abaCategoriaAtiva] || CONFIG_CATEGORIAS_MAP.servicos
  const listaCategoriasAtivas = dataSafe[catConfigAtual.chave] || catConfigAtual.padrao

  // Estado para Cadastro e Edição de Serviço
  const [novoServicoNome, setNovoServicoNome] = useState('')
  const [novoServicoValor, setNovoServicoValor] = useState('')
  const [novoServicoCategoria, setNovoServicoCategoria] = useState('MANUTENÇÃO')
  const [servicoParaEditar, setServicoParaEditar] = useState(null) // { id, nome, valor, categoria }

  useEffect(() => {
    if (config) {
      setFormData(prev => ({ ...INITIAL_CONFIG, ...config, ...prev }))
    }
  }, [config])

  const atualizarConfig = (updated) => {
    setFormData(updated)
    if (typeof setConfig === 'function') {
      setConfig(updated)
    }
  }

  const handleSalvarConfig = (e) => {
    if (e) e.preventDefault()
    atualizarConfig(formData)
    setSalvoFeedback(true)
    setTimeout(() => setSalvoFeedback(false), 3000)
  }

  const handleConectarSupabase = (e) => {
    e.preventDefault()
    if (!supaUrl || !supaKey) {
      alert('Por favor, preencha tanto a URL quanto a Anon Key do Supabase!')
      return
    }
    saveSupabaseKeys(supaUrl, supaKey)
  }

  // Adicionar Nova Categoria na Aba Ativa
  const handleAdicionarCategoriaAbas = (e) => {
    e.preventDefault()
    const limpo = inputNovaCategoria.trim().toUpperCase()
    if (!limpo) return

    if (listaCategoriasAtivas.map(c => c.toUpperCase()).includes(limpo)) {
      alert(`A categoria "${limpo}" já está cadastrada em ${catConfigAtual.rotulo}!`)
      return
    }

    const novaLista = [...listaCategoriasAtivas, limpo]
    const updated = { ...formData, [catConfigAtual.chave]: novaLista }
    atualizarConfig(updated)
    setInputNovaCategoria('')
  }

  // Salvar Edição de Categoria
  const handleSalvarEdicaoCategoriaModal = (e) => {
    e.preventDefault()
    if (!modalEditarCategoria || !modalEditarCategoria.editado) return
    const { chave, original, modulo } = modalEditarCategoria
    const origUpper = (original || '').toUpperCase()
    const novoNome = modalEditarCategoria.editado.trim().toUpperCase()
    if (!novoNome) return

    const configModulo = CONFIG_CATEGORIAS_MAP[modulo] || CONFIG_CATEGORIAS_MAP.servicos
    const lista = formData[chave] || configModulo.padrao
    const novaLista = lista.map(c => c.toUpperCase() === origUpper ? novoNome : c.toUpperCase())

    let updated = { ...formData, [chave]: novaLista }

    // Atualizar também serviços vinculados se for categoria de serviços
    if (chave === 'categorias_servicos') {
      const catalogoAtual = formData.catalogo_servicos || []
      const novoCatalogo = catalogoAtual.map(s => {
        if ((s.categoria || '').toUpperCase() === origUpper) {
          return { ...s, categoria: novoNome }
        }
        return s
      })
      updated.catalogo_servicos = novoCatalogo
    }

    atualizarConfig(updated)
    setModalEditarCategoria(null)
  }

  // Remover Categoria da Aba Ativa
  const handleRemoverCategoriaAbas = (catNome) => {
    if (window.confirm(`Deseja remover a categoria "${catNome}" de ${catConfigAtual.rotulo}?`)) {
      const novaLista = listaCategoriasAtivas.filter(c => c.toUpperCase() !== catNome.toUpperCase())
      const updated = { ...formData, [catConfigAtual.chave]: novaLista }
      atualizarConfig(updated)
    }
  }

  // Adicionar Novo Serviço ao Catálogo
  const handleAdicionarServico = (e) => {
    e.preventDefault()
    if (!novoServicoNome || !novoServicoValor) {
      alert('Preencha o nome do serviço e o valor em R$!')
      return
    }

    const item = {
      id: `s_${Date.now()}`,
      nome: novoServicoNome.trim().toUpperCase(),
      valor: parseFloat(novoServicoValor) || 0,
      categoria: (novoServicoCategoria || 'MANUTENÇÃO').trim().toUpperCase()
    }

    const catalogoAtual = formData.catalogo_servicos || []
    const novoCatalogo = [...catalogoAtual, item]

    const updated = { ...formData, catalogo_servicos: novoCatalogo }
    atualizarConfig(updated)

    setNovoServicoNome('')
    setNovoServicoValor('')
    alert(`Serviço "${item.nome}" cadastrado com sucesso!`)
  }

  // Editar Serviço Existente no Catálogo
  const handleSalvarEdicaoServico = (e) => {
    e.preventDefault()
    if (!servicoParaEditar) return

    const itemAtualizado = {
      ...servicoParaEditar,
      nome: servicoParaEditar.nome.trim().toUpperCase(),
      valor: parseFloat(servicoParaEditar.valor) || 0,
      categoria: (servicoParaEditar.categoria || 'MANUTENÇÃO').trim().toUpperCase()
    }

    const catalogoAtual = formData.catalogo_servicos || []
    const novoCatalogo = catalogoAtual.map(s => s.id === itemAtualizado.id ? itemAtualizado : s)

    const updated = { ...formData, catalogo_servicos: novoCatalogo }
    atualizarConfig(updated)
    setServicoParaEditar(null)
    alert(`Serviço "${itemAtualizado.nome}" atualizado com sucesso!`)
  }

  // Remover Serviço do Catálogo
  const handleRemoverServico = (servicoId) => {
    if (window.confirm('Deseja remover este serviço do catálogo?')) {
      const catalogoAtual = formData.catalogo_servicos || []
      const novoCatalogo = catalogoAtual.filter(s => s.id !== servicoId)

      const updated = { ...formData, catalogo_servicos: novoCatalogo }
      atualizarConfig(updated)
    }
  }

  // Funções de Ordenação Personalizada do Menu Lateral
  const getOrdemMenuAtual = () => {
    const salva = formData.ordem_menu
    if (Array.isArray(salva) && salva.length > 0) {
      const idsExistentes = ALL_SIDEBAR_ITEMS_REF.map(i => i.id)
      const filtrados = salva.filter(id => idsExistentes.includes(id))
      idsExistentes.forEach(id => {
        if (!filtrados.includes(id)) filtrados.push(id)
      })
      const semHome = filtrados.filter(id => id !== 'home')
      return ['home', ...semHome]
    }
    return ALL_SIDEBAR_ITEMS_REF.map(i => i.id)
  }

  const handleMoverMenuItem = (index, direcao) => {
    const listaAtual = getOrdemMenuAtual()
    const novoIndex = direcao === 'up' ? index - 1 : index + 1
    if (novoIndex < 1 || novoIndex >= listaAtual.length) return // Não move a Home do topo (index 0)

    const temp = listaAtual[index]
    listaAtual[index] = listaAtual[novoIndex]
    listaAtual[novoIndex] = temp

    const updated = { ...formData, ordem_menu: listaAtual }
    atualizarConfig(updated)
  }

  const handleRestaurarOrdemMenuPadrao = () => {
    const padrao = ALL_SIDEBAR_ITEMS_REF.map(i => i.id)
    const updated = { ...formData, ordem_menu: padrao }
    atualizarConfig(updated)
  }

  const categoriasDisponiveis = (dataSafe.categorias_servicos || [
    'MANUTENÇÃO', 'REPARO', 'PERSONALIZAÇÃO', 'ÓPTICA', 'ACABAMENTO', 'LIMPEZA & CONSERVAÇÃO', 'CUSTOMIZAÇÃO', 'PINTURA & CERAKOTE'
  ]).map(c => c.toUpperCase())

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1050px', margin: '0 auto' }}>
      {/* TÍTULO PRINCIPAL */}
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--gold-accent)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Settings size={24} color="var(--red-light)" />
          <span>Configurações do Sistema</span>
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          Gerencie dados institucionais da Armeria, ordem do menu lateral, categorias personalizadas e tabela de preços.
        </p>
      </div>

      {/* BARRA SUPERIOR DE SUB-ABAS (NAVEGAÇÃO LIMPA E ORGANIZADA) */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '2px solid var(--border-color)',
        paddingBottom: '0.1rem',
        overflowX: 'auto'
      }}>
        <button
          type="button"
          onClick={() => setAbaConfigAtiva('dados')}
          style={{
            padding: '0.65rem 1.1rem',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            borderBottom: abaConfigAtiva === 'dados' ? '3px solid var(--gold-accent)' : '3px solid transparent',
            backgroundColor: abaConfigAtiva === 'dados' ? 'var(--bg-card)' : 'transparent',
            color: abaConfigAtiva === 'dados' ? 'var(--gold-accent)' : 'var(--text-muted)',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
        >
          <Building size={16} />
          <span>Dados Institucionais</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaConfigAtiva('menu_ordem')}
          style={{
            padding: '0.65rem 1.1rem',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            borderBottom: abaConfigAtiva === 'menu_ordem' ? '3px solid #A78BFA' : '3px solid transparent',
            backgroundColor: abaConfigAtiva === 'menu_ordem' ? 'var(--bg-card)' : 'transparent',
            color: abaConfigAtiva === 'menu_ordem' ? '#A78BFA' : 'var(--text-muted)',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
        >
          <ListOrdered size={16} />
          <span>Ordem do Menu Lateral</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaConfigAtiva('categorias')}
          style={{
            padding: '0.65rem 1.1rem',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            borderBottom: abaConfigAtiva === 'categorias' ? '3px solid #FBBF24' : '3px solid transparent',
            backgroundColor: abaConfigAtiva === 'categorias' ? 'var(--bg-card)' : 'transparent',
            color: abaConfigAtiva === 'categorias' ? '#FBBF24' : 'var(--text-muted)',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
        >
          <Tag size={16} />
          <span>Categorias do Sistema</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaConfigAtiva('servicos')}
          style={{
            padding: '0.65rem 1.1rem',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            borderBottom: abaConfigAtiva === 'servicos' ? '3px solid #F87171' : '3px solid transparent',
            backgroundColor: abaConfigAtiva === 'servicos' ? 'var(--bg-card)' : 'transparent',
            color: abaConfigAtiva === 'servicos' ? '#F87171' : 'var(--text-muted)',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
        >
          <Wrench size={16} />
          <span>Catálogo de Serviços ({ (formData.catalogo_servicos || []).length })</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaConfigAtiva('supabase')}
          style={{
            padding: '0.65rem 1.1rem',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            borderBottom: abaConfigAtiva === 'supabase' ? '3px solid #34D399' : '3px solid transparent',
            backgroundColor: abaConfigAtiva === 'supabase' ? 'var(--bg-card)' : 'transparent',
            color: abaConfigAtiva === 'supabase' ? '#34D399' : 'var(--text-muted)',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
        >
          <Database size={16} />
          <span>Banco Supabase</span>
          {isSupabaseConfigured && (
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34D399' }} />
          )}
        </button>
      </div>

      {/* ==========================================
          CONTEÚDO DA ABA 1: DADOS INSTITUCIONAIS
      ========================================== */}
      {abaConfigAtiva === 'dados' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <Building size={20} color="var(--gold-accent)" />
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '700', margin: 0 }}>
                Dados Institucionais da Armeria
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Informações cadastrais exibidas em O.S., laudos técnicos e comprovantes.
              </p>
            </div>
          </div>

          <form onSubmit={handleSalvarConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Nome Fantasia *</label>
                <input className="input-field" value={formData.nome_fantasia || ''} onChange={e => setFormData({...formData, nome_fantasia: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Razão Social *</label>
                <input className="input-field" value={formData.razao_social || ''} onChange={e => setFormData({...formData, razao_social: e.target.value})} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>CNPJ * (Máscara Automática)</label>
                <input
                  className="input-field"
                  placeholder="00.000.000/0000-00"
                  value={maskCNPJ(formData.cnpj || '')}
                  onChange={e => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>N° CR da Armeria *</label>
                <input className="input-field" value={formData.cr_armeria || ''} onChange={e => setFormData({...formData, cr_armeria: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Região Militar *</label>
                <input className="input-field" value={formData.rm_armeria || ''} onChange={e => setFormData({...formData, rm_armeria: e.target.value})} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Telefone / WhatsApp *</label>
                <input
                  className="input-field"
                  placeholder="(00) 00000-0000"
                  value={maskTelefone(formData.whatsapp || '')}
                  onChange={e => setFormData({...formData, whatsapp: maskTelefone(e.target.value)})}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>E-mail Oficial *</label>
                <input className="input-field" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Endereço Completo *</label>
              <input className="input-field" value={formData.endereco || ''} onChange={e => setFormData({...formData, endereco: e.target.value})} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              {salvoFeedback && (
                <span style={{ fontSize: '0.85rem', color: '#34D399', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle2 size={16} /> Dados institucionais salvos!
                </span>
              )}
              <button type="submit" className="btn-gold">
                <Save size={16} />
                <span>Salvar Dados da Armeria</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          CONTEÚDO DA ABA: PERSONALIZAÇÃO DO MENU LATERAL
      ========================================== */}
      {abaConfigAtiva === 'menu_ordem' && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ListOrdered size={20} color="#A78BFA" />
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '800', margin: 0 }}>
                  Personalização da Ordem do Menu Lateral
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Altere a ordem de exibição das opções do menu lateral usando os botões Subir e Descer.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={handleRestaurarOrdemMenuPadrao}
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
            >
              <RotateCcw size={14} />
              <span>Restaurar Ordem Alfabética Padrão</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {getOrdemMenuAtual().map((itemId, idx) => {
              const itemObj = ALL_SIDEBAR_ITEMS_REF.find(i => i.id === itemId) || { id: itemId, label: itemId }
              const isHome = itemId === 'home'
              return (
                <div
                  key={itemId}
                  style={{
                    backgroundColor: isHome ? 'rgba(212, 175, 55, 0.1)' : 'var(--bg-input)',
                    border: isHome ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      backgroundColor: isHome ? 'var(--gold-accent)' : '#374151',
                      color: '#FFF',
                      fontWeight: '800',
                      fontSize: '0.75rem',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center'
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontWeight: '700', color: isHome ? 'var(--gold-accent)' : 'var(--text-main)', fontSize: '0.9rem' }}>
                      {itemObj.label}
                    </span>
                    {isHome && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--gold-primary)', fontWeight: '800' }}>
                        (Fixo no Topo)
                      </span>
                    )}
                  </div>

                  {!isHome && (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        disabled={idx === 1}
                        onClick={() => handleMoverMenuItem(idx, 'up')}
                        style={{
                          backgroundColor: idx === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(96, 165, 250, 0.15)',
                          border: idx === 1 ? '1px solid rgba(255,255,255,0.1)' : '1px solid #60A5FA',
                          color: idx === 1 ? 'var(--text-muted)' : '#60A5FA',
                          borderRadius: '6px',
                          padding: '0.3rem 0.65rem',
                          cursor: idx === 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.75rem',
                          fontWeight: '700'
                        }}
                        title="Mover para Cima"
                      >
                        <ArrowUp size={14} /> Subir
                      </button>

                      <button
                        type="button"
                        disabled={idx === getOrdemMenuAtual().length - 1}
                        onClick={() => handleMoverMenuItem(idx, 'down')}
                        style={{
                          backgroundColor: idx === getOrdemMenuAtual().length - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(245, 158, 11, 0.15)',
                          border: idx === getOrdemMenuAtual().length - 1 ? '1px solid rgba(255,255,255,0.1)' : '1px solid #F59E0B',
                          color: idx === getOrdemMenuAtual().length - 1 ? 'var(--text-muted)' : '#FBBF24',
                          borderRadius: '6px',
                          padding: '0.3rem 0.65rem',
                          cursor: idx === getOrdemMenuAtual().length - 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.75rem',
                          fontWeight: '700'
                        }}
                        title="Mover para Baixo"
                      >
                        <ArrowDown size={14} /> Descer
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ==========================================
          CONTEÚDO DA ABA 2: CATEGORIAS DO SISTEMA
      ========================================== */}
      {abaConfigAtiva === 'categorias' && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <Tag size={20} color="#FBBF24" />
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '700', margin: 0 }}>
                Cadastro & Gestão de Categorias por Módulo
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Selecione o módulo abaixo para gerenciar as categorias cadastradas.
              </p>
            </div>
          </div>

          {/* MÓDULOS DE CATEGORIAS (SELETOR COMPACTO) */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', pb: '0.6rem' }}>
            {Object.values(CONFIG_CATEGORIAS_MAP).map(mod => {
              const ativa = abaCategoriaAtiva === mod.id
              const qtd = ((dataSafe && dataSafe[mod.chave]) || mod.padrao).length
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => { setAbaCategoriaAtiva(mod.id); setInputNovaCategoria('') }}
                  style={{
                    backgroundColor: ativa ? 'rgba(245,158,11,0.15)' : 'var(--bg-input)',
                    border: ativa ? `1px solid ${mod.cor}` : '1px solid var(--border-color)',
                    color: ativa ? mod.cor : 'var(--text-muted)',
                    padding: '0.5rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>{mod.rotulo}</span>
                  <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    {qtd}
                  </span>
                </button>
              )
            })}
          </div>

          {/* BANNER DO CAMPO DESTINO */}
          <div style={{ backgroundColor: 'rgba(96,165,250,0.08)', padding: '0.75rem 1rem', borderRadius: '6px', border: `1px solid ${catConfigAtual.cor}40`, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-main)' }}>
            <Tag size={16} color={catConfigAtual.cor} />
            <div>
              <strong>{catConfigAtual.rotulo}:</strong> <span style={{ color: 'var(--text-muted)' }}>{catConfigAtual.campoDestino}</span>
            </div>
          </div>

          {/* FORMULÁRIO DE CADASTRO DE CATEGORIA */}
          <form onSubmit={handleAdicionarCategoriaAbas} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
                NOVA CATEGORIA PARA {catConfigAtual.rotulo.toUpperCase()} * (CAIXA ALTA AUTOMÁTICO)
              </label>
              <input
                required
                className="input-field"
                placeholder={`Ex: Nova Categoria...`}
                value={inputNovaCategoria}
                onChange={e => setInputNovaCategoria(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <button type="submit" className="btn-gold" style={{ padding: '0.55rem 1.1rem' }}>
              <Plus size={16} />
              <span>Adicionar Categoria</span>
            </button>
          </form>

          {/* GRID DE CATEGORIAS CADASTRADAS */}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
              CATEGORIAS REGISTRADAS ({listaCategoriasAtivas.length}):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {listaCategoriasAtivas.map(cat => (
                <div
                  key={cat}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.82rem',
                    color: 'var(--text-main)',
                    fontWeight: '700'
                  }}
                >
                  <Tag size={14} color={catConfigAtual.cor} />
                  <span>{cat.toUpperCase()}</span>

                  <button
                    type="button"
                    onClick={() => setModalEditarCategoria({
                      modulo: abaCategoriaAtiva,
                      chave: catConfigAtual.chave,
                      original: cat,
                      editado: cat
                    })}
                    style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Editar Nome da Categoria"
                  >
                    <Edit size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoverCategoriaAbas(cat)}
                    style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Excluir Categoria"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          CONTEÚDO DA ABA 3: CATÁLOGO DE SERVIÇOS
      ========================================== */}
      {abaConfigAtiva === 'servicos' && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <Wrench size={20} color="#F87171" />
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '700', margin: 0 }}>
                Catálogo de Serviços & Tabela de Valores
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Cadastre e gerencie a tabela de preços padrão de serviços executados na armeria.
              </p>
            </div>
          </div>

          {/* FORMULÁRIO DE CADASTRO DE SERVIÇO */}
          <form onSubmit={handleAdicionarServico} style={{ backgroundColor: 'var(--bg-input)', padding: '1.1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--gold-accent)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={16} />
              <span>CADASTRAR NOVO SERVIÇO NO CATÁLOGO</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Nome do Serviço *</label>
                <input
                  required
                  className="input-field"
                  placeholder="EX: LIMPEZA ULTRASSÔNICA"
                  value={novoServicoNome}
                  onChange={e => setNovoServicoNome(e.target.value.toUpperCase())}
                  style={{ textTransform: 'uppercase', fontWeight: '700' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Valor Padrão (R$) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="250.00"
                  value={novoServicoValor}
                  onChange={e => setNovoServicoValor(e.target.value)}
                />
              </div>

              <div>
                <CustomSelect
                  label="Categoria"
                  value={novoServicoCategoria}
                  onChange={val => setNovoServicoCategoria(val)}
                  options={categoriasDisponiveis}
                  placeholder="Selecione a categoria..."
                  allowCustom={false}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.3rem' }}>
              <button type="submit" className="btn-gold" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
                <Plus size={16} />
                <span>Adicionar Serviço ao Catálogo</span>
              </button>
            </div>
          </form>

          {/* TABELA DE SERVIÇOS CADASTRADOS */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              SERVIÇOS DISPONÍVEIS NA ARMERIA
            </div>

            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>NOME DO SERVIÇO</th>
                    <th style={{ padding: '0.75rem 1rem' }}>CATEGORIA</th>
                    <th style={{ padding: '0.75rem 1rem' }}>VALOR PADRÃO (R$)</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {(formData.catalogo_servicos || []).length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhum serviço cadastrado no catálogo.
                      </td>
                    </tr>
                  ) : (
                    formData.catalogo_servicos.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                          {s.nome.toUpperCase()}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>{(s.categoria || 'GERAL').toUpperCase()}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '800', color: '#FBBF24' }}>
                          R$ {(parseFloat(s.valor) || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.6rem' }}>
                            <button
                              type="button"
                              onClick={() => setServicoParaEditar(s)}
                              style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer' }}
                              title="Editar Serviço"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoverServico(s.id)}
                              style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}
                              title="Excluir Serviço"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          CONTEÚDO DA ABA 4: BANCO SUPABASE
      ========================================== */}
      {abaConfigAtiva === 'supabase' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <Database size={20} color={isSupabaseConfigured ? '#34D399' : 'var(--gold-accent)'} />
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '700', margin: 0 }}>
                Conexão com Banco de Dados Supabase
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Sincronização em nuvem e armazenamento relacional do sistema.
              </p>
            </div>
            {isSupabaseConfigured ? (
              <span className="badge badge-green" style={{ marginLeft: 'auto' }}>CONECTADO</span>
            ) : (
              <span className="badge badge-yellow" style={{ marginLeft: 'auto' }}>DEMO LOCAL</span>
            )}
          </div>

          <form onSubmit={handleConectarSupabase} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Project URL do Supabase</label>
              <input
                type="text"
                className="input-field"
                placeholder="https://xxxxxxxxxxxx.supabase.co"
                value={supaUrl}
                onChange={e => setSupaUrl(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>API Anon Key (Public Key)</label>
              <input
                type="password"
                className="input-field"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supaKey}
                onChange={e => setSupaKey(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn-gold">
                <Key size={16} />
                <span>{isSupabaseConfigured ? 'Atualizar Conexão' : 'Conectar ao Supabase'}</span>
              </button>

              {isSupabaseConfigured && (
                <button type="button" className="btn-secondary" onClick={clearSupabaseKeys} style={{ color: '#F87171' }}>
                  Desconectar
                </button>
              )}
            </div>
          </form>

          <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--gold-accent)' }}>💡 Dica Importante para o Supabase:</strong>
            <p style={{ marginTop: '0.4rem' }}>
              Não se esqueça de copiar o conteúdo do arquivo <code>supabase_schema.sql</code> (gerado no seu projeto) e colá-lo no <strong>SQL Editor</strong> do painel Supabase para criar todas as tabelas automaticamente!
            </p>
          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR SERVIÇO E PREÇO */}
      {servicoParaEditar && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Edit size={18} />
                <span>Editar Serviço do Catálogo</span>
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setServicoParaEditar(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicaoServico} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
                  NOME DO SERVIÇO * (CAIXA ALTA AUTOMÁTICO)
                </label>
                <input
                  required
                  className="input-field"
                  value={servicoParaEditar.nome}
                  onChange={e => setServicoParaEditar({ ...servicoParaEditar, nome: e.target.value.toUpperCase() })}
                  style={{ textTransform: 'uppercase', fontWeight: '700' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
                    VALOR PADRÃO (R$) *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={servicoParaEditar.valor}
                    onChange={e => setServicoParaEditar({ ...servicoParaEditar, valor: e.target.value })}
                    style={{ fontWeight: '700' }}
                  />
                </div>

                <div>
                  <CustomSelect
                    label="CATEGORIA"
                    value={servicoParaEditar.categoria}
                    onChange={val => setServicoParaEditar({ ...servicoParaEditar, categoria: val })}
                    options={categoriasDisponiveis}
                    placeholder="Selecione a categoria..."
                    allowCustom={false}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setServicoParaEditar(null)}>Cancelar</button>
                <button type="submit" className="btn-gold">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR NOME DE CATEGORIA */}
      {modalEditarCategoria && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', borderLeft: '4px solid var(--gold-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--gold-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit size={18} /> Editar Categoria
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setModalEditarCategoria(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicaoCategoriaModal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                  NOME DA CATEGORIA (CAIXA ALTA AUTOMÁTICO)
                </label>
                <input
                  required
                  autoFocus
                  className="input-field"
                  value={modalEditarCategoria.editado}
                  onChange={e => setModalEditarCategoria({ ...modalEditarCategoria, editado: e.target.value.toUpperCase() })}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalEditarCategoria(null)}>Cancelar</button>
                <button type="submit" className="btn-gold">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
