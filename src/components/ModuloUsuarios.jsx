import React, { useState } from 'react'
import { Plus, Users, Shield, Key, Edit, Trash2, Check, X, Lock, Wrench, UserCheck } from 'lucide-react'

export default function ModuloUsuarios({ usuarios, setUsuarios, usuarioLogado }) {
  const [showModalNovoUsuario, setShowModalNovoUsuario] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState(null)

  const [usuarioForm, setUsuarioForm] = useState({
    nome_completo: '',
    email: '',
    senha_pessoal: '',
    cargo: '',
    perfil: 'recepcao', // 'master' | 'recepcao' | 'armeiro'
    status: 'Ativo',
    permissoes: {
      ver_clientes: true,
      criar_clientes: true,
      editar_clientes: true,
      excluir_clientes: false,
      ver_ordens: true,
      dar_entrada_os: true,
      preencher_laudo_armeiro: false,
      aprovar_os: true,
      concluir_retirada: true,
      ver_orcamentos: true,
      criar_orcamentos: true,
      ver_financeiro: false,
      lancar_financeiro: true,
      gerenciar_usuarios: false
    }
  })

  // Ajusta permissões padrão quando troca perfil
  const handleTrocarPerfilForm = (novoPerfil) => {
    let permissoesPadrao = {}
    if (novoPerfil === 'master') {
      permissoesPadrao = {
        ver_clientes: true, criar_clientes: true, editar_clientes: true, excluir_clientes: true,
        ver_ordens: true, dar_entrada_os: true, preencher_laudo_armeiro: true, aprovar_os: true, concluir_retirada: true,
        ver_orcamentos: true, criar_orcamentos: true, ver_financeiro: true, lancar_financeiro: true, gerenciar_usuarios: true
      }
    } else if (novoPerfil === 'recepcao') {
      permissoesPadrao = {
        ver_clientes: true, criar_clientes: true, editar_clientes: true, excluir_clientes: false,
        ver_ordens: true, dar_entrada_os: true, preencher_laudo_armeiro: false, aprovar_os: true, concluir_retirada: true,
        ver_orcamentos: true, criar_orcamentos: true, ver_financeiro: false, lancar_financeiro: true, gerenciar_usuarios: false
      }
    } else if (novoPerfil === 'armeiro') {
      permissoesPadrao = {
        ver_clientes: true, criar_clientes: false, editar_clientes: false, excluir_clientes: false,
        ver_ordens: true, dar_entrada_os: false, preencher_laudo_armeiro: true, aprovar_os: false, concluir_retirada: false,
        ver_orcamentos: false, criar_orcamentos: false, ver_financeiro: false, lancar_financeiro: false, gerenciar_usuarios: false
      }
    }
    setUsuarioForm({
      ...usuarioForm,
      perfil: novoPerfil,
      permissoes: permissoesPadrao
    })
  }

  const handleTogglePermissao = (key) => {
    setUsuarioForm({
      ...usuarioForm,
      permissoes: {
        ...usuarioForm.permissoes,
        [key]: !usuarioForm.permissoes[key]
      }
    })
  }

  const handleSalvarUsuario = (e) => {
    e.preventDefault()
    if (!usuarioForm.nome_completo || !usuarioForm.email || !usuarioForm.senha_pessoal) {
      alert('Preencha nome, e-mail e senha pessoal!')
      return
    }

    if (editingUsuario) {
      const updated = {
        ...editingUsuario,
        ...usuarioForm
      }
      setUsuarios(usuarios.map(u => u.id === editingUsuario.id ? updated : u))
      alert(`Cadastro de ${usuarioForm.nome_completo} atualizado com sucesso!`)
    } else {
      const created = {
        ...usuarioForm,
        id: `u_${Date.now()}`
      }
      setUsuarios([...usuarios, created])
      alert(`Novo usuário ${usuarioForm.nome_completo} cadastrado com sucesso!`)
    }

    setShowModalNovoUsuario(false)
    setEditingUsuario(null)
    resetForm()
  }

  const handleAbrirEditar = (u) => {
    setEditingUsuario(u)
    setUsuarioForm({
      nome_completo: u.nome_completo || '',
      email: u.email || '',
      senha_pessoal: u.senha_pessoal || '',
      cargo: u.cargo || '',
      perfil: u.perfil || 'recepcao',
      status: u.status || 'Ativo',
      permissoes: u.permissoes || {}
    })
    setShowModalNovoUsuario(true)
  }

  const resetForm = () => {
    setUsuarioForm({
      nome_completo: '',
      email: '',
      senha_pessoal: '',
      cargo: '',
      perfil: 'recepcao',
      status: 'Ativo',
      permissoes: {
        ver_clientes: true, criar_clientes: true, editar_clientes: true, excluir_clientes: false,
        ver_ordens: true, dar_entrada_os: true, preencher_laudo_armeiro: false, aprovar_os: true, concluir_retirada: true,
        ver_orcamentos: true, criar_orcamentos: true, ver_financeiro: false, lancar_financeiro: true, gerenciar_usuarios: false
      }
    })
  }

  const handleToggleStatusUsuario = (usuarioId) => {
    setUsuarios(usuarios.map(u => {
      if (u.id === usuarioId) {
        const novoStatus = u.status === 'Ativo' ? 'Inativo' : 'Ativo'
        return { ...u, status: novoStatus }
      }
      return u
    }))
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={28} color="var(--red-light)" />
            <span>Gestão de Usuários & Equipe da Armeria</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Cadastre funcionários, senhas pessoais de acesso e controle o nível de acesso (Master, Recepção, Armeiro).
          </p>
        </div>

        <button className="btn-gold" onClick={() => { resetForm(); setEditingUsuario(null); setShowModalNovoUsuario(true); }}>
          <Plus size={18} />
          <span>Cadastrar Novo Usuário</span>
        </button>
      </div>

      {/* Tabela de Usuários Cadastrados */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>NOME / OPERADOR</th>
                <th style={{ padding: '0.85rem 1rem' }}>E-MAIL / LOGIN</th>
                <th style={{ padding: '0.85rem 1rem' }}>SETOR / CARGO</th>
                <th style={{ padding: '0.85rem 1rem' }}>PERFIL DE ACESSO</th>
                <th style={{ padding: '0.85rem 1rem' }}>SENHA PESSOAL</th>
                <th style={{ padding: '0.85rem 1rem' }}>STATUS</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <UserCheck size={16} color={u.perfil === 'master' ? '#FBBF24' : u.perfil === 'recepcao' ? '#F87171' : '#34D399'} />
                      <span>{u.nome_completo.toUpperCase()}</span>
                    </div>
                  </td>

                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                    {u.email}
                  </td>

                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-main)', fontWeight: '600' }}>
                    {u.cargo || 'Funcionário'}
                  </td>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`badge ${u.perfil === 'master' ? 'badge-yellow' : u.perfil === 'recepcao' ? 'badge-red' : 'badge-green'}`}>
                      {u.perfil === 'master' ? '👑 Master (Total)' : u.perfil === 'recepcao' ? '🏢 Recepção' : '🛠️ Armeiro'}
                    </span>
                  </td>

                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#FBBF24' }}>
                    •••••••• ({u.senha_pessoal})
                  </td>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    <button
                      onClick={() => handleToggleStatusUsuario(u.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <span className={`badge ${u.status === 'Ativo' ? 'badge-green' : 'badge-red'}`}>
                        {u.status}
                      </span>
                    </button>
                  </td>

                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      onClick={() => handleAbrirEditar(u)}
                    >
                      <Edit size={14} />
                      <span>Editar / Permissões</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo / Editar Usuário & Permissões */}
      {showModalNovoUsuario && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gold-accent)', marginBottom: '1rem' }}>
              {editingUsuario ? `Editar Permissões de ${editingUsuario.nome_completo}` : 'Cadastrar Novo Operador / Usuário'}
            </h3>

            <form onSubmit={handleSalvarUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nome Completo do Funcionário *</label>
                <input required className="input-field" value={usuarioForm.nome_completo} onChange={e => setUsuarioForm({...usuarioForm, nome_completo: e.target.value})} placeholder="Ex: OSMAIR SILVA ARMEIRO" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>E-mail / Login de Acesso *</label>
                  <input required className="input-field" type="email" value={usuarioForm.email} onChange={e => setUsuarioForm({...usuarioForm, email: e.target.value})} placeholder="osmair@proguns.com.br" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Senha Pessoal *</label>
                  <input required className="input-field" type="text" value={usuarioForm.senha_pessoal} onChange={e => setUsuarioForm({...usuarioForm, senha_pessoal: e.target.value})} placeholder="Digite a senha pessoal..." />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cargo / Função</label>
                  <input className="input-field" value={usuarioForm.cargo} onChange={e => setUsuarioForm({...usuarioForm, cargo: e.target.value})} placeholder="Ex: Armeiro Chefe" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Perfil Padrão *</label>
                  <select className="input-field" value={usuarioForm.perfil} onChange={e => handleTrocarPerfilForm(e.target.value)}>
                    <option value="recepcao">🏢 Recepção / Atendimento</option>
                    <option value="armeiro">🛠️ Armeiro (Oficina)</option>
                    <option value="master">👑 Master (Administrador)</option>
                  </select>
                </div>
              </div>

              {/* MATRIZ DE PERMISSÕES CUSTOMIZÁVEIS */}
              <div style={{ backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Shield size={16} color="#FBBF24" />
                  <span>MATRIZ DE PERMISSÕES GRANULARES (CUSTOMIZAR ACESSO)</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.78rem' }}>
                  {[
                    { key: 'ver_clientes', label: 'Ver Módulo Clientes' },
                    { key: 'criar_clientes', label: 'Cadastrar Novos Clientes' },
                    { key: 'editar_clientes', label: 'Editar Dados de Clientes' },
                    { key: 'excluir_clientes', label: 'Excluir Clientes' },
                    { key: 'ver_ordens', label: 'Ver Módulo Ordens de Serviço' },
                    { key: 'dar_entrada_os', label: 'Dar Entrada na O.S. (Recepção)' },
                    { key: 'preencher_laudo_armeiro', label: 'Preencher Laudo do Armeiro' },
                    { key: 'aprovar_os', label: 'Aprovar Orçamento com Cliente' },
                    { key: 'concluir_retirada', label: 'Registrar Retirada & Pagamento' },
                    { key: 'ver_orcamentos', label: 'Ver Módulo Orçamentos' },
                    { key: 'ver_financeiro', label: 'Ver Módulo Financeiro' },
                    { key: 'gerenciar_usuarios', label: 'Gerenciar Usuários (Aba Usuários)' }
                  ].map(p => {
                    const isChecked = usuarioForm.permissoes[p.key]
                    return (
                      <div
                        key={p.key}
                        onClick={() => handleTogglePermissao(p.key)}
                        style={{
                          padding: '0.45rem 0.65rem',
                          borderRadius: '4px',
                          border: isChecked ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid var(--border-color)',
                          backgroundColor: isChecked ? 'rgba(19, 70, 51, 0.3)' : 'var(--bg-dark)',
                          color: isChecked ? '#34D399' : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between'
                        }}
                      >
                        <span>{p.label}</span>
                        <span>{isChecked ? '✓ SIM' : '✕ NÃO'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModalNovoUsuario(false)}>Cancelar</button>
                <button type="submit" className="btn-gold">Salvar Usuário</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
