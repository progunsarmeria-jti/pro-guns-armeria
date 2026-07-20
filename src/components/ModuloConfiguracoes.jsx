import React, { useState, useEffect } from 'react'
import { Settings, Building, Database, Save, CheckCircle2, Copy, Shield, Key, ChevronDown, ChevronUp, Wrench, Plus, Trash2, Edit, DollarSign, Tag, X } from 'lucide-react'
import CustomSelect from './CustomSelect'
import { isSupabaseConfigured, saveSupabaseKeys, clearSupabaseKeys } from '../lib/supabase'
import { maskCNPJ, maskTelefone } from '../lib/masks'

export default function ModuloConfiguracoes({ config, setConfig }) {
  const [formData, setFormData] = useState(config)
  const [supaUrl, setSupaUrl] = useState(localStorage.getItem('PROGUNS_SUPABASE_URL') || '')
  const [supaKey, setSupaKey] = useState(localStorage.getItem('PROGUNS_SUPABASE_ANON_KEY') || '')
  const [salvoFeedback, setSalvoFeedback] = useState(false)

  // Estado dos Acordeões (Seções Suspensas Que Abrem ao Clicar)
  const [openSections, setOpenSections] = useState({
    dados: true,
    categorias: true,
    servicos: true,
    supabase: false
  })

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

  const catConfigAtual = CONFIG_CATEGORIAS_MAP[abaCategoriaAtiva] || CONFIG_CATEGORIAS_MAP.servicos
  const listaCategoriasAtivas = formData[catConfigAtual.chave] || catConfigAtual.padrao

  // Estado para Cadastro e Edição de Serviço
  const [novoServicoNome, setNovoServicoNome] = useState('')
  const [novoServicoValor, setNovoServicoValor] = useState('')
  const [novoServicoCategoria, setNovoServicoCategoria] = useState('MANUTENÇÃO')
  const [servicoParaEditar, setServicoParaEditar] = useState(null) // { id, nome, valor, categoria }

  useEffect(() => {
    if (config) {
      setFormData(config)
    }
  }, [config])

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleSalvarConfig = (e) => {
    if (e) e.preventDefault()
    setConfig(formData)
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
    setFormData(updated)
    setConfig(updated)
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

    setFormData(updated)
    setConfig(updated)
    setModalEditarCategoria(null)
  }

  // Remover Categoria da Aba Ativa
  const handleRemoverCategoriaAbas = (catNome) => {
    if (window.confirm(`Deseja remover a categoria "${catNome}" de ${catConfigAtual.rotulo}?`)) {
      const novaLista = listaCategoriasAtivas.filter(c => c.toUpperCase() !== catNome.toUpperCase())
      const updated = { ...formData, [catConfigAtual.chave]: novaLista }
      setFormData(updated)
      setConfig(updated)
    }
  }

  // Adicionar Novo Serviço ao Catálogo (FORÇA CAIXA ALTA AUTOMÁTICO)
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
    setFormData(updated)
    setConfig(updated)

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
    setFormData(updated)
    setConfig(updated)
    setServicoParaEditar(null)
    alert(`Serviço "${itemAtualizado.nome}" atualizado com sucesso!`)
  }

  // Remover Serviço do Catálogo
  const handleRemoverServico = (servicoId) => {
    if (window.confirm('Deseja remover este serviço do catálogo?')) {
      const catalogoAtual = formData.catalogo_servicos || []
      const novoCatalogo = catalogoAtual.filter(s => s.id !== servicoId)

      const updated = { ...formData, catalogo_servicos: novoCatalogo }
      setFormData(updated)
      setConfig(updated)
    }
  }

  const categoriasDisponiveis = (formData.categorias_servicos || [
    'MANUTENÇÃO', 'REPARO', 'PERSONALIZAÇÃO', 'ÓPTICA', 'ACABAMENTO', 'LIMPEZA & CONSERVAÇÃO', 'CUSTOMIZAÇÃO', 'PINTURA & CERAKOTE'
  ]).map(c => c.toUpperCase())

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '960px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--gold-accent)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Settings size={28} color="var(--red-light)" />
          <span>Configurações & Gestão de Categorias</span>
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Cadastre e edite categorias de serviços, gerencie a tabela de preços e dados institucionais.
        </p>
      </div>

      {/* ==========================================
          1. SEÇÃO SUSPENSA: DADOS INSTITUCIONAIS
      ========================================== */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          onClick={() => toggleSection('dados')}
          style={{
            padding: '1.2rem 1.5rem',
            backgroundColor: 'var(--bg-input)',
            borderBottom: openSections.dados ? '1px solid var(--border-color)' : 'none',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building size={22} color="var(--gold-accent)" />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '700' }}>
              Dados Institucionais da Armeria
            </h3>
          </div>
          {openSections.dados ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
        </div>

        {openSections.dados && (
          <div style={{ padding: '1.5rem' }}>
            <form onSubmit={handleSalvarConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nome Fantasia *</label>
                  <input className="input-field" value={formData.nome_fantasia || ''} onChange={e => setFormData({...formData, nome_fantasia: e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Razão Social *</label>
                  <input className="input-field" value={formData.razao_social || ''} onChange={e => setFormData({...formData, razao_social: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CNPJ * (Máscara Automática)</label>
                  <input
                    className="input-field"
                    placeholder="00.000.000/0000-00"
                    value={maskCNPJ(formData.cnpj || '')}
                    onChange={e => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>N° CR da Armeria *</label>
                  <input className="input-field" value={formData.cr_armeria || ''} onChange={e => setFormData({...formData, cr_armeria: e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Região Militar *</label>
                  <input className="input-field" value={formData.rm_armeria || ''} onChange={e => setFormData({...formData, rm_armeria: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Telefone / WhatsApp *</label>
                  <input
                    className="input-field"
                    placeholder="(00) 00000-0000"
                    value={maskTelefone(formData.whatsapp || '')}
                    onChange={e => setFormData({...formData, whatsapp: maskTelefone(e.target.value)})}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>E-mail Oficial *</label>
                  <input className="input-field" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Endereço Completo *</label>
                <input className="input-field" value={formData.endereco || ''} onChange={e => setFormData({...formData, endereco: e.target.value})} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                {salvoFeedback && (
                  <span style={{ fontSize: '0.85rem', color: '#34D399', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle2 size={16} /> Dados institucional salvos!
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
      </div>

      {/* ==========================================
          2. SEÇÃO SUSPENSA: GESTÃO & CADASTRO DE CATEGORIAS DO SISTEMA
      ========================================== */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          onClick={() => toggleSection('categorias')}
          style={{
            padding: '1.2rem 1.5rem',
            backgroundColor: 'var(--bg-input)',
            borderBottom: openSections.categorias ? '1px solid var(--border-color)' : 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Tag size={22} color="#FBBF24" />
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '700', margin: 0 }}>
                Cadastro & Gestão de Categorias por Módulo
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Organize e edite as opções de categorias especificadas para cada campo do sistema.
              </div>
            </div>
          </div>
          {openSections.categorias ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
        </div>

        {openSections.categorias && (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* ABAS DE NAVEGAÇÃO DE CATEGORIAS POR MÓDULO */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', pb: '0.5rem' }}>
              {Object.values(CONFIG_CATEGORIAS_MAP).map(mod => {
                const ativa = abaCategoriaAtiva === mod.id
                const qtd = (formData[mod.chave] || mod.padrao).length
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
                      borderRadius: '8px',
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

            {/* BANNER INFORMATIVO DO CAMPO DESTINO DA CATEGORIA SELECIONADA */}
            <div style={{ backgroundColor: 'rgba(96,165,250,0.08)', padding: '0.75rem 1rem', borderRadius: '8px', border: `1px solid ${catConfigAtual.cor}40`, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-main)' }}>
              <Tag size={16} color={catConfigAtual.cor} />
              <div>
                <strong>{catConfigAtual.rotulo}:</strong> <span style={{ color: 'var(--text-muted)' }}>{catConfigAtual.campoDestino}</span>
              </div>
            </div>

            {/* Formulário de Cadastro de Categoria para a Aba Ativa */}
            <form onSubmit={handleAdicionarCategoriaAbas} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
                  NOVA CATEGORIA PARA {catConfigAtual.rotulo.toUpperCase()} * (CAIXA ALTA AUTOMÁTICO)
                </label>
                <input
                  required
                  className="input-field"
                  placeholder={`Ex: Nova Categoria para ${catConfigAtual.rotulo}...`}
                  value={inputNovaCategoria}
                  onChange={e => setInputNovaCategoria(e.target.value.toUpperCase())}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <button type="submit" className="btn-gold" style={{ padding: '0.65rem 1.2rem' }}>
                <Plus size={16} />
                <span>Adicionar Categoria</span>
              </button>
            </form>

            {/* Grid de Categorias Cadastradas com Botões de EDITAR e EXCLUIR */}
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

                    {/* BOTÃO EDITAR CATEGORIA */}
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

                    {/* BOTÃO EXCLUIR CATEGORIA */}
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
      </div>

      {/* ==========================================
          3. SEÇÃO SUSPENSA: CATÁLOGO DE SERVIÇOS & VALORES (COM EDITAR E EXCLUIR)
      ========================================== */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          onClick={() => toggleSection('servicos')}
          style={{
            padding: '1.2rem 1.5rem',
            backgroundColor: 'var(--bg-input)',
            borderBottom: openSections.servicos ? '1px solid var(--border-color)' : 'none',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Wrench size={22} color="#F87171" />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '700' }}>
              Catálogo de Serviços & Tabela de Valores
            </h3>
            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#F87171', fontWeight: '800' }}>
              {(formData.catalogo_servicos || []).length} Serviços Cadastrados
            </span>
          </div>
          {openSections.servicos ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
        </div>

        {openSections.servicos && (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Formulário de Cadastro de Novo Serviço em CAIXA ALTA */}
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
                    placeholder="EX: LIMPEZA ULTRASSÔNICA + LUBRIFICAÇÃO TÁTICA"
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

            {/* Tabela de Serviços Cadastrados com Ações de EDITAR e EXCLUIR */}
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
                              {/* BOTÃO EDITAR SERVIÇO */}
                              <button
                                type="button"
                                onClick={() => setServicoParaEditar(s)}
                                style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer' }}
                                title="Editar Serviço"
                              >
                                <Edit size={16} />
                              </button>
                              {/* BOTÃO EXCLUIR SERVIÇO */}
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
      </div>

      {/* ==========================================
          MODAL: EDITAR CATEGORIA
      ========================================== */}
      {categoriaParaEditar && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--gold-accent)' }}>Editar Nome da Categoria</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setCategoriaParaEditar(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicaoCategoria} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.4rem' }}>
                  NOME DA CATEGORIA *
                </label>
                <input
                  required
                  className="input-field"
                  value={categoriaParaEditar.editado}
                  onChange={e => setCategoriaParaEditar({ ...categoriaParaEditar, editado: e.target.value.toUpperCase() })}
                  style={{ textTransform: 'uppercase', fontWeight: '700' }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setCategoriaParaEditar(null)}>Cancelar</button>
                <button type="submit" className="btn-gold">Salvar Categoria</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: EDITAR SERVIÇO E PREÇO
      ========================================== */}
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

      {/* ==========================================
          4. SEÇÃO SUSPENSA: CONEXÃO SUPABASE
      ========================================== */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          onClick={() => toggleSection('supabase')}
          style={{
            padding: '1.2rem 1.5rem',
            backgroundColor: 'var(--bg-input)',
            borderBottom: openSections.supabase ? '1px solid var(--border-color)' : 'none',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Database size={22} color={isSupabaseConfigured ? '#34D399' : 'var(--gold-accent)'} />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '700' }}>
              Conexão com Banco de Dados Supabase
            </h3>
            {isSupabaseConfigured ? (
              <span className="badge badge-green">CONECTADO</span>
            ) : (
              <span className="badge badge-yellow">DEMO LOCAL</span>
            )}
          </div>
          {openSections.supabase ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
        </div>

        {openSections.supabase && (
          <div style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Para sincronizar seus clientes, armas e ordens de serviço diretamente no banco de dados Supabase da Pró Guns Armeria, cole suas chaves abaixo.
            </p>

            <form onSubmit={handleConectarSupabase} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Project URL do Supabase</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="https://xxxxxxxxxxxx.supabase.co"
                  value={supaUrl}
                  onChange={e => setSupaUrl(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>API Anon Key (Public Key)</label>
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
      </div>

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
