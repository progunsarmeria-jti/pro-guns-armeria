import React, { useState, useEffect } from 'react'
import { Settings, Building, Database, Save, CheckCircle2, Copy, Shield, Key, ChevronDown, ChevronUp, Wrench, Plus, Trash2, Edit, DollarSign, Tag } from 'lucide-react'
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

  // Estado para Cadastro de Nova Categoria
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('')

  // Estado para Cadastro de Novo Serviço
  const [novoServicoNome, setNovoServicoNome] = useState('')
  const [novoServicoValor, setNovoServicoValor] = useState('')
  const [novoServicoCategoria, setNovoServicoCategoria] = useState('MANUTENÇÃO')

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

  // Adicionar Nova Categoria (FORÇA CAIXA ALTA AUTOMÁTICO)
  const handleAdicionarCategoria = (e) => {
    e.preventDefault()
    const nomeLimpo = novaCategoriaNome.trim().toUpperCase()
    if (!nomeLimpo) return

    const listaAtual = formData.categorias_servicos || [
      'MANUTENÇÃO', 'REPARO', 'PERSONALIZAÇÃO', 'ÓPTICA', 'ACABAMENTO'
    ]

    if (listaAtual.map(c => c.toUpperCase()).includes(nomeLimpo)) {
      alert(`A categoria "${nomeLimpo}" já está cadastrada!`)
      return
    }

    const novaLista = [...listaAtual, nomeLimpo]
    const updated = { ...formData, categorias_servicos: novaLista }

    setFormData(updated)
    setConfig(updated)
    setNovaCategoriaNome('')
    alert(`Categoria "${nomeLimpo}" cadastrada em CAIXA ALTA com sucesso!`)
  }

  // Remover Categoria
  const handleRemoverCategoria = (catNome) => {
    if (window.confirm(`Deseja remover a categoria "${catNome}"?`)) {
      const listaAtual = formData.categorias_servicos || []
      const novaLista = listaAtual.filter(c => c !== catNome)

      const updated = { ...formData, categorias_servicos: novaLista }
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
    alert(`Serviço "${item.nome}" cadastrado com sucesso em CAIXA ALTA!`)
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
          Cadastre categorias de serviços, gerencie a tabela de preços e dados da Pró Guns Armeria.
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
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Telefone / WhatsApp * (Máscara Automática)</label>
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
          2. SEÇÃO SUSPENSA: CADASTRO DE CATEGORIAS (EM CAIXA ALTA)
      ========================================== */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          onClick={() => toggleSection('categorias')}
          style={{
            padding: '1.2rem 1.5rem',
            backgroundColor: 'var(--bg-input)',
            borderBottom: openSections.categorias ? '1px solid var(--border-color)' : 'none',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Tag size={22} color="#FBBF24" />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '700' }}>
              Cadastro & Gerenciamento de Categorias
            </h3>
            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', fontWeight: '800' }}>
              {categoriasDisponiveis.length} Categorias
            </span>
          </div>
          {openSections.categorias ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
        </div>

        {openSections.categorias && (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Formulário de Cadastro de Categoria (Automático em CAIXA ALTA) */}
            <form onSubmit={handleAdicionarCategoria} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
                  NOME DA NOVA CATEGORIA * (CONVERTIDO AUTOMATICAMENTE EM CAIXA ALTA)
                </label>
                <input
                  required
                  className="input-field"
                  placeholder="EX: LIMPEZA & CONSERVAÇÃO, CERAKOTE, CUSTOMIZAÇÃO..."
                  value={novaCategoriaNome}
                  onChange={e => setNovaCategoriaNome(e.target.value.toUpperCase())}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <button type="submit" className="btn-gold" style={{ padding: '0.65rem 1.2rem' }}>
                <Plus size={16} />
                <span>Cadastrar Categoria</span>
              </button>
            </form>

            {/* Grid de Categorias Cadastradas */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                CATEGORIAS CADASTRADAS NO SISTEMA:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {categoriasDisponiveis.map(cat => (
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
                    <Tag size={14} color="#FBBF24" />
                    <span>{cat.toUpperCase()}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoverCategoria(cat)}
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
          3. SEÇÃO SUSPENSA: CATÁLOGO DE SERVIÇOS & VALORES (EM CAIXA ALTA)
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
                <span>CADASTRAR NOVO SERVIÇO NO CATÁLOGO (CAIXA ALTA AUTOMÁTICA)</span>
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
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Categoria</label>
                  <select
                    className="input-field"
                    value={novoServicoCategoria}
                    onChange={e => setNovoServicoCategoria(e.target.value)}
                    style={{ textTransform: 'uppercase', fontWeight: '700' }}
                  >
                    {categoriasDisponiveis.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.3rem' }}>
                <button type="submit" className="btn-gold" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
                  <Plus size={16} />
                  <span>Adicionar Serviço ao Catálogo</span>
                </button>
              </div>
            </form>

            {/* Tabela de Serviços Cadastrados */}
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
                            <button
                              type="button"
                              onClick={() => handleRemoverServico(s.id)}
                              style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}
                            >
                              <Trash2 size={16} />
                            </button>
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
    </div>
  )
}
