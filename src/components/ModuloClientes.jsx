import React, { useState } from 'react'
import { Plus, Search, Shield, Crosshair, AlertCircle, Calendar, FileText, Trash2, Edit, ChevronDown, ChevronUp, Phone, Mail, MapPin } from 'lucide-react'

export default function ModuloClientes({ clientes, setClientes, armas, setArmas }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('Todos')
  const [showModalCliente, setShowModalCliente] = useState(false)
  const [showModalArma, setShowModalArma] = useState(false)
  const [selectedClienteId, setSelectedClienteId] = useState(null)
  const [expandedClienteId, setExpandedClienteId] = useState(null)

  // Form states para Cliente
  const [novoCliente, setNovoCliente] = useState({
    nome_completo: '',
    cpf: '',
    rg: '',
    telefone: '',
    email: '',
    numero_cr: '',
    validade_cr: '',
    regiao_militar: '2ª RM',
    categorias: ['Atirador'],
    clube_filiado: 'Clube de Tiro Pró Guns',
    cidade: 'São Paulo',
    uf: 'SP'
  })

  // Form states para Arma
  const [novaArma, setNovaArma] = useState({
    tipo: 'Pistola',
    marca: 'Glock',
    modelo: 'G17',
    calibre: '9mm',
    numero_serie: '',
    numero_sigma_sinarm: '',
    orgao_registro: 'SIGMA',
    numero_craf: '',
    validade_craf: ''
  })

  const handleSalvarCliente = (e) => {
    e.preventDefault()
    if (!novoCliente.nome_completo || !novoCliente.cpf) return
    const created = {
      ...novoCliente,
      id: `c_${Date.now()}`,
      status: 'Ativo'
    }
    setClientes([created, ...clientes])
    setShowModalCliente(false)
    setNovoCliente({
      nome_completo: '',
      cpf: '',
      rg: '',
      telefone: '',
      email: '',
      numero_cr: '',
      validade_cr: '',
      regiao_militar: '2ª RM',
      categorias: ['Atirador'],
      clube_filiado: 'Clube de Tiro Pró Guns',
      cidade: '',
      uf: 'SP'
    })
  }

  const handleSalvarArma = (e) => {
    e.preventDefault()
    if (!novaArma.numero_serie || !selectedClienteId) return
    const createdArma = {
      ...novaArma,
      id: `a_${Date.now()}`,
      cliente_id: selectedClienteId,
      status: 'Regular'
    }
    setArmas([createdArma, ...armas])
    setShowModalArma(false)
    setNovaArma({
      tipo: 'Pistola',
      marca: 'Glock',
      modelo: 'G17',
      calibre: '9mm',
      numero_serie: '',
      numero_sigma_sinarm: '',
      orgao_registro: 'SIGMA',
      numero_craf: '',
      validade_craf: ''
    })
  }

  const filteredClientes = clientes.filter(c => {
    const matchSearch = c.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.cpf.includes(searchTerm) ||
                        (c.numero_cr && c.numero_cr.includes(searchTerm))
    const matchCat = filterCategoria === 'Todos' || (c.categorias && c.categorias.includes(filterCategoria))
    return matchSearch && matchCat
  })

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Métricas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gold-primary)' }}>
            Clientes CACs & Acervo
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Gerenciamento completo de atiradores, caçadores, colecionadores e registros de armas.
          </p>
        </div>

        <button className="btn-gold" onClick={() => setShowModalCliente(true)}>
          <Plus size={18} />
          <span>Cadastrar Novo CAC</span>
        </button>
      </div>

      {/* Cards de Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'var(--gold-glow)', border: '1px solid var(--border-gold)' }}>
            <Shield size={24} color="var(--gold-primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL DE CACS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)' }}>{clientes.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <AlertCircle size={24} color="#FBBF24" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CRs A VENCER (90d)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#FBBF24' }}>1</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <Crosshair size={24} color="#60A5FA" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ARMAS NO ACERVO</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)' }}>{armas.length}</div>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Buscar por nome, CPF ou N° do CR..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['Todos', 'Atirador', 'Caçador', 'Colecionador'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategoria(cat)}
              style={{
                padding: '0.45rem 0.8rem',
                borderRadius: '6px',
                border: filterCategoria === cat ? '1px solid var(--gold-primary)' : '1px solid var(--border-color)',
                backgroundColor: filterCategoria === cat ? 'var(--gold-glow)' : 'var(--bg-input)',
                color: filterCategoria === cat ? 'var(--gold-primary)' : 'var(--text-muted)',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Clientes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredClientes.map(cliente => {
          const armasDoCliente = armas.filter(a => a.cliente_id === cliente.id)
          const isExpanded = expandedClienteId === cliente.id

          return (
            <div key={cliente.id} className="card" style={{ padding: '0' }}>
              {/* Resumo do Cliente Header */}
              <div style={{
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                backgroundColor: isExpanded ? 'rgba(212, 175, 55, 0.03)' : 'transparent',
                borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    fontWeight: '700',
                    color: 'var(--gold-primary)'
                  }}>
                    {cliente.nome_completo.charAt(0)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-main)' }}>
                        {cliente.nome_completo}
                      </h3>
                      <span className="badge badge-green">{cliente.status}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
                      <span>CPF: {cliente.cpf}</span>
                      <span>•</span>
                      <span>CR: <strong style={{ color: 'var(--text-gold)' }}>{cliente.numero_cr || 'Sem CR'}</strong></span>
                      <span>•</span>
                      <span>Validade CR: {cliente.validade_cr || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                    onClick={() => {
                      setSelectedClienteId(cliente.id)
                      setShowModalArma(true)
                    }}
                  >
                    <Plus size={14} />
                    <span>Adicionar Arma</span>
                  </button>

                  <button
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.6rem' }}
                    onClick={() => setExpandedClienteId(isExpanded ? null : cliente.id)}
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {/* Detalhes Expandidos */}
              {isExpanded && (
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Informações Pessoais */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Categorias:</span>
                      <div style={{ marginTop: '0.2rem', display: 'flex', gap: '0.3rem' }}>
                        {cliente.categorias?.map(cat => (
                          <span key={cat} className="badge badge-blue">{cat}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contatos:</span>
                      <div style={{ fontSize: '0.85rem', marginTop: '0.2rem', color: 'var(--text-main)' }}>
                        <div><Phone size={12} inline /> {cliente.telefone}</div>
                        <div><Mail size={12} inline /> {cliente.email || 'Não informado'}</div>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cidade / UF:</span>
                      <div style={{ fontSize: '0.85rem', marginTop: '0.2rem', color: 'var(--text-main)' }}>
                        <MapPin size={12} inline /> {cliente.cidade} - {cliente.uf} ({cliente.regiao_militar})
                      </div>
                    </div>
                  </div>

                  {/* Acervo de Armas do Cliente */}
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--gold-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Crosshair size={16} />
                      <span>Acervo de Armas ({armasDoCliente.length})</span>
                    </h4>

                    {armasDoCliente.length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-dark)', borderRadius: '6px' }}>
                        Nenhuma arma cadastrada neste acervo.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                              <th style={{ padding: '0.6rem' }}>TIPO</th>
                              <th style={{ padding: '0.6rem' }}>MARCA / MODELO</th>
                              <th style={{ padding: '0.6rem' }}>CALIBRE</th>
                              <th style={{ padding: '0.6rem' }}>N° SÉRIE</th>
                              <th style={{ padding: '0.6rem' }}>REGISTRO</th>
                              <th style={{ padding: '0.6rem' }}>VALIDADE CRAF</th>
                              <th style={{ padding: '0.6rem' }}>STATUS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {armasDoCliente.map(arma => (
                              <tr key={arma.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.6rem', fontWeight: '600' }}>{arma.tipo}</td>
                                <td style={{ padding: '0.6rem' }}>{arma.marca} {arma.modelo}</td>
                                <td style={{ padding: '0.6rem', color: 'var(--text-gold)' }}>{arma.calibre}</td>
                                <td style={{ padding: '0.6rem' }}>{arma.numero_serie}</td>
                                <td style={{ padding: '0.6rem' }}>{arma.numero_sigma_sinarm || 'N/A'} ({arma.orgao_registro})</td>
                                <td style={{ padding: '0.6rem' }}>{arma.validade_craf || 'N/A'}</td>
                                <td style={{ padding: '0.6rem' }}><span className="badge badge-green">{arma.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal Novo Cliente */}
      {showModalCliente && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gold-primary)', marginBottom: '1rem' }}>Cadastrar Novo Atirador / CAC</h3>
            <form onSubmit={handleSalvarCliente} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nome Completo *</label>
                <input required className="input-field" value={novoCliente.nome_completo} onChange={e => setNovoCliente({...novoCliente, nome_completo: e.target.value})} placeholder="Ex: João da Silva" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CPF *</label>
                  <input required className="input-field" value={novoCliente.cpf} onChange={e => setNovoCliente({...novoCliente, cpf: e.target.value})} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>RG</label>
                  <input className="input-field" value={novoCliente.rg} onChange={e => setNovoCliente({...novoCliente, rg: e.target.value})} placeholder="00.000.000-0" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Telefone (WhatsApp) *</label>
                  <input required className="input-field" value={novoCliente.telefone} onChange={e => setNovoCliente({...novoCliente, telefone: e.target.value})} placeholder="(11) 90000-0000" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>E-mail</label>
                  <input type="email" className="input-field" value={novoCliente.email} onChange={e => setNovoCliente({...novoCliente, email: e.target.value})} placeholder="cliente@email.com" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Número do CR</label>
                  <input className="input-field" value={novoCliente.numero_cr} onChange={e => setNovoCliente({...novoCliente, numero_cr: e.target.value})} placeholder="123456/2ª RM" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Validade do CR</label>
                  <input type="date" className="input-field" value={novoCliente.validade_cr} onChange={e => setNovoCliente({...novoCliente, validade_cr: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModalCliente(false)}>Cancelar</button>
                <button type="submit" className="btn-gold">Salvar Cadastro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Arma */}
      {showModalArma && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gold-primary)', marginBottom: '1rem' }}>Adicionar Arma ao Acervo</h3>
            <form onSubmit={handleSalvarArma} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tipo</label>
                  <select className="input-field" value={novaArma.tipo} onChange={e => setNovaArma({...novaArma, tipo: e.target.value})}>
                    <option value="Pistola">Pistola</option>
                    <option value="Fuzil">Fuzil</option>
                    <option value="Espingarda">Espingarda</option>
                    <option value="Carabina">Carabina</option>
                    <option value="Revólver">Revólver</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Calibre *</label>
                  <input required className="input-field" value={novaArma.calibre} onChange={e => setNovaArma({...novaArma, calibre: e.target.value})} placeholder="9mm, 5.56, 12 GA" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Marca *</label>
                  <input required className="input-field" value={novaArma.marca} onChange={e => setNovaArma({...novaArma, marca: e.target.value})} placeholder="Glock, Taurus, CBC" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Modelo *</label>
                  <input required className="input-field" value={novaArma.modelo} onChange={e => setNovaArma({...novaArma, modelo: e.target.value})} placeholder="G17 Gen5, T4, Pump" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Número de Série *</label>
                <input required className="input-field" value={novaArma.numero_serie} onChange={e => setNovaArma({...novaArma, numero_serie: e.target.value})} placeholder="Ex: ABC12345" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>N° SIGMA / SINARM</label>
                  <input className="input-field" value={novaArma.numero_sigma_sinarm} onChange={e => setNovaArma({...novaArma, numero_sigma_sinarm: e.target.value})} placeholder="SIGMA-123456" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Validade CRAF</label>
                  <input type="date" className="input-field" value={novaArma.validade_craf} onChange={e => setNovaArma({...novaArma, validade_craf: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModalArma(false)}>Cancelar</button>
                <button type="submit" className="btn-gold">Adicionar Arma</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
