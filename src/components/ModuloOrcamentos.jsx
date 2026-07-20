import React, { useState } from 'react'
import { hojeISO, formatarData } from '../lib/dates'
import { Plus, Calculator, FileText, CheckCircle, XCircle, ArrowRight, Printer, Trash2, DollarSign, Edit, Shield, X } from 'lucide-react'
import CustomSelect from './CustomSelect'
import { isSupabaseConfigured, dbDelete } from '../lib/supabase'

export default function ModuloOrcamentos({ orcamentos, setOrcamentos, clientes, ordens, setOrdens, financeiro, setFinanceiro, config, usuarioLogado, usuarios = [] }) {
  const [showModalOrcamento, setShowModalOrcamento] = useState(false)
  const [modalVerOrcamento, setModalVerOrcamento] = useState(null)
  const [orcamentoParaEditar, setOrcamentoParaEditar] = useState(null)
  const [modalExcluirOrcamento, setModalExcluirOrcamento] = useState(null)
  const [senhaMasterInput, setSenhaMasterInput] = useState('')
  const [erroSenhaMaster, setErroSenhaMaster] = useState('')

  const [novoClienteId, setNovoClienteId] = useState(clientes[0]?.id || '')
  const [formaPagamento, setFormaPagamento] = useState('PIX (À Vista com Desconto)')
  const [desconto, setDesconto] = useState('0')
  const [itens, setItens] = useState([
    { descricao: 'Manutenção Preventiva Tática', quantidade: 1, valor_unitario: '350.00' },
    { descricao: 'Troca de Mola e Extrator', quantidade: 1, valor_unitario: '150.00' }
  ])

  const handleAbrirNovo = () => {
    setOrcamentoParaEditar(null)
    setNovoClienteId(clientes[0]?.id || '')
    setFormaPagamento('PIX (À Vista com Desconto)')
    setDesconto('0')
    setItens([
      { descricao: 'Manutenção Preventiva Tática', quantidade: 1, valor_unitario: '350.00' },
      { descricao: 'Troca de Mola e Extrator', quantidade: 1, valor_unitario: '150.00' }
    ])
    setShowModalOrcamento(true)
  }

  const handleAbrirEdicao = (orcamento) => {
    setOrcamentoParaEditar(orcamento)
    setNovoClienteId(orcamento.cliente_id || clientes[0]?.id || '')
    setFormaPagamento(orcamento.forma_pagamento || 'PIX')
    setDesconto((orcamento.desconto || 0).toString())
    setItens(
      (orcamento.itens || []).map(i => ({
        descricao: i.descricao || '',
        quantidade: i.quantidade || 1,
        valor_unitario: (i.valor_unitario || 0).toString()
      }))
    )
    setShowModalOrcamento(true)
  }

  const handleExcluirOrcamento = (orcamento) => {
    setModalExcluirOrcamento(orcamento)
    setSenhaMasterInput('')
    setErroSenhaMaster('')
  }

  const handleConfirmarExclusaoOrcamento = (e) => {
    if (e) e.preventDefault()
    if (!modalExcluirOrcamento) return

    const usuariosMaster = (usuarios || []).filter(u => u.perfil === 'master')
    const masterValido = usuariosMaster.find(u => (u.senha_pessoal || '').trim() === senhaMasterInput.trim()) ||
      (usuarioLogado?.perfil === 'master' && (usuarioLogado.senha_pessoal || '').trim() === senhaMasterInput.trim())

    if (!masterValido) {
      setErroSenhaMaster('Senha Master incorreta! Operação não autorizada.')
      return
    }

    const orcParaDeletar = modalExcluirOrcamento
    setOrcamentos(prev => prev.filter(o => String(o.id) !== String(orcParaDeletar.id) && String(o.numero_orcamento) !== String(orcParaDeletar.numero_orcamento)))

    if (isSupabaseConfigured()) {
      dbDelete('orcamentos', orcParaDeletar.id)
    }

    setModalExcluirOrcamento(null)
    setSenhaMasterInput('')
    setErroSenhaMaster('')
    alert(`Orçamento #${orcParaDeletar.numero_orcamento} excluído com sucesso!`)
  }

  const handleAdicionarItem = () => {
    setItens([...itens, { descricao: '', quantidade: 1, valor_unitario: '0.00' }])
  }

  const handleRemoverItem = (index) => {
    setItens(itens.filter((_, i) => i !== index))
  }

  const handleItemChange = (index, field, value) => {
    const novosItens = [...itens]
    novosItens[index][field] = value
    setItens(novosItens)
  }

  const valorTotalBruto = itens.reduce((acc, item) => acc + ((parseFloat(item.valor_unitario) || 0) * (parseInt(item.quantidade) || 1)), 0)
  const valorFinal = Math.max(0, valorTotalBruto - (parseFloat(desconto) || 0))

  const handleSalvarOrcamento = (e) => {
    e.preventDefault()
    const clienteObj = clientes.find(c => c.id === novoClienteId)

    if (orcamentoParaEditar) {
      const atualizado = {
        ...orcamentoParaEditar,
        cliente_id: novoClienteId,
        cliente_nome: clienteObj ? clienteObj.nome_completo : orcamentoParaEditar.cliente_nome || 'Cliente',
        valor_total: valorTotalBruto,
        desconto: parseFloat(desconto) || 0,
        valor_final: valorFinal,
        forma_pagamento: formaPagamento,
        itens: itens.map(i => ({
          descricao: i.descricao,
          quantidade: parseInt(i.quantidade) || 1,
          valor_unitario: parseFloat(i.valor_unitario) || 0
        }))
      }
      setOrcamentos(orcamentos.map(o => o.id === orcamentoParaEditar.id ? atualizado : o))
      setOrcamentoParaEditar(null)
    } else {
      const created = {
        id: `orc_${Date.now()}`,
        numero_orcamento: 500 + orcamentos.length + 1,
        cliente_id: novoClienteId,
        cliente_nome: clienteObj ? clienteObj.nome_completo : 'Cliente',
        valor_total: valorTotalBruto,
        desconto: parseFloat(desconto) || 0,
        valor_final: valorFinal,
        forma_pagamento: formaPagamento,
        validade_dias: 15,
        status: 'Pendente',
        itens: itens.map(i => ({
          descricao: i.descricao,
          quantidade: parseInt(i.quantidade) || 1,
          valor_unitario: parseFloat(i.valor_unitario) || 0
        }))
      }
      setOrcamentos([created, ...orcamentos])
    }
    setShowModalOrcamento(false)
  }

  const handleAprovarEConvert = (orcamento) => {
    // 1. Atualizar Orçamento para Aprovado
    setOrcamentos(orcamentos.map(o => o.id === orcamento.id ? { ...o, status: 'Aprovado' } : o))

    // 2. Gerar Ordem de Serviço correspondente
    const novaOS = {
      id: `o_${Date.now()}`,
      numero_os: 1000 + ordens.length + 1,
      cliente_id: orcamento.cliente_id,
      cliente_nome: orcamento.cliente_nome,
      tipo_servico: orcamento.itens[0]?.descricao || 'Serviço Armeria',
      valor_servico: orcamento.valor_final,
      valor_taxamento: 0,
      status: 'NÃO INICIADO',
      detalhes: `Origem Orçamento #${orcamento.numero_orcamento}`
    }
    setOrdens([novaOS, ...ordens])

    // 3. Criar Lançamento Financeiro de Receita
    const novoLancamento = {
      id: `f_${Date.now()}`,
      descricao: `Recebimento Orçamento #${orcamento.numero_orcamento} - ${orcamento.cliente_nome}`,
      tipo: 'Receita',
      categoria: 'Serviço Armeria',
      valor: orcamento.valor_final,
      data_vencimento: hojeISO(),
      data_pagamento: hojeISO(),
      status: 'Pago',
      forma_pagamento: orcamento.forma_pagamento
    }
    setFinanceiro([novoLancamento, ...financeiro])

    alert(`Orçamento #${orcamento.numero_orcamento} aprovado! Gerada Ordem de Serviço #OS ${novaOS.numero_os} e lançamento de R$ ${orcamento.valor_final.toFixed(2)} no Financeiro!`)
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gold-primary)' }}>
            Orçamentos & Cotações
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Emissão de propostas comerciais de serviços de armeria, peças e manutenção com conversão em OS.
          </p>
        </div>

        <button className="btn-gold" onClick={handleAbrirNovo}>
          <Plus size={18} />
          <span>Novo Orçamento</span>
        </button>
      </div>

      {/* Tabela de Orçamentos */}
      <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>N° ORÇAMENTO</th>
              <th style={{ padding: '0.85rem 1rem' }}>CLIENTE</th>
              <th style={{ padding: '0.85rem 1rem' }}>FORMA PAGTO</th>
              <th style={{ padding: '0.85rem 1rem' }}>VALOR FINAL</th>
              <th style={{ padding: '0.85rem 1rem' }}>STATUS</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {orcamentos.map(orc => (
              <tr key={orc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: 'var(--gold-primary)' }}>
                  #{orc.numero_orcamento}
                </td>
                <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>{orc.cliente_nome}</td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{orc.forma_pagamento}</td>
                <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  R$ {orc.valor_final.toFixed(2)}
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span className={`badge ${orc.status === 'Aprovado' ? 'badge-green' : 'badge-yellow'}`}>
                    {orc.status}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }} onClick={() => setModalVerOrcamento(orc)} title="Ver / PDF">
                      <Printer size={14} />
                      <span>Ver / PDF</span>
                    </button>

                    <button className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }} onClick={() => handleAbrirEdicao(orc)} title="Editar Orçamento">
                      <Edit size={14} />
                      <span>Editar</span>
                    </button>

                    {orc.status !== 'Aprovado' && (
                      <button className="btn-gold" style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }} onClick={() => handleAprovarEConvert(orc)} title="Aprovar & Gerar OS">
                        <CheckCircle size={14} />
                        <span>Aprovar</span>
                      </button>
                    )}

                    <button
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem', color: '#F87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                      onClick={() => handleExcluirOrcamento(orc)}
                      title="Excluir Orçamento"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Criar / Editar Orçamento */}
      {showModalOrcamento && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gold-primary)', marginBottom: '1rem' }}>
              {orcamentoParaEditar ? `Editar Orçamento #${orcamentoParaEditar.numero_orcamento}` : 'Novo Orçamento / Proposta'}
            </h3>
            <form onSubmit={handleSalvarOrcamento} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <CustomSelect
                  label="Cliente *"
                  value={
                    (() => {
                      const c = clientes.find(item => item.id === novoClienteId)
                      return c ? `${c.nome_completo.toUpperCase()} (${c.cpf})` : ''
                    })()
                  }
                  onChange={val => {
                    const c = clientes.find(item => `${item.nome_completo.toUpperCase()} (${item.cpf})` === val)
                    if (c) setNovoClienteId(c.id)
                  }}
                  options={clientes.map(c => `${c.nome_completo.toUpperCase()} (${c.cpf})`)}
                  placeholder="Selecione o cliente..."
                  allowCustom={false}
                />
              </div>

              {/* Itens do Orçamento */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--gold-primary)' }}>Itens da Proposta</label>
                  <button type="button" className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={handleAdicionarItem}>
                    + Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {itens.map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 40px', gap: '0.5rem', alignItems: 'center' }}>
                      <input className="input-field" placeholder="Descrição do serviço/produto" value={item.descricao} onChange={e => handleItemChange(idx, 'descricao', e.target.value)} />
                      <input className="input-field" type="number" min="1" value={item.quantidade} onChange={e => handleItemChange(idx, 'quantidade', e.target.value)} />
                      <input className="input-field" placeholder="R$ Unitário" value={item.valor_unitario} onChange={e => handleItemChange(idx, 'valor_unitario', e.target.value)} />
                      {itens.length > 1 && (
                        <button type="button" style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }} onClick={() => handleRemoverItem(idx)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Forma de Pagamento</label>
                  <input className="input-field" value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Desconto (R$)</label>
                  <input className="input-field" type="number" value={desconto} onChange={e => setDesconto(e.target.value)} />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-gold)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>VALOR FINAL DA PROPOSTA:</span>
                <span style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--gold-primary)' }}>
                  R$ {valorFinal.toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModalOrcamento(false)}>Cancelar</button>
                <button type="submit" className="btn-gold">
                  {orcamentoParaEditar ? 'Salvar Alterações' : 'Gerar Orçamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualizador PDF Orçamento */}
      {modalVerOrcamento && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '650px', backgroundColor: '#fff', color: '#000' }}>
            <div className="print-area">
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: '800', fontFamily: 'Cinzel, serif' }}>
                    {(config?.razao_social || config?.nome_fantasia || 'PRÓ GUNS ARMERIA').toUpperCase()}
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: '#444' }}>
                    {config?.cr_armeria || 'CR-998877/2ª RM'} — CNPJ: {config?.cnpj || '12.345.678/0001-99'}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', marginTop: '0.3rem' }}>ORÇAMENTO E PROPOSTA COMERCIAL #{modalVerOrcamento.numero_orcamento}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                  <strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')} <br />
                  <strong>Validade:</strong> {modalVerOrcamento.validade_dias} dias
                </div>
              </div>

              <div style={{ marginBottom: '1.2rem', fontSize: '0.85rem' }}>
                <strong>Cliente:</strong> {modalVerOrcamento.cliente_nome} <br />
                <strong>Pagamento:</strong> {modalVerOrcamento.forma_pagamento}
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                    <th style={{ padding: '0.4rem' }}>DESCRIÇÃO</th>
                    <th style={{ padding: '0.4rem', textAlign: 'center' }}>QTD</th>
                    <th style={{ padding: '0.4rem', textAlign: 'right' }}>VALOR UNIT</th>
                    <th style={{ padding: '0.4rem', textAlign: 'right' }}>SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {modalVerOrcamento.itens.map((it, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.4rem' }}>{it.descricao}</td>
                      <td style={{ padding: '0.4rem', textAlign: 'center' }}>{it.quantidade}</td>
                      <td style={{ padding: '0.4rem', textAlign: 'right' }}>R$ {it.valor_unitario.toFixed(2)}</td>
                      <td style={{ padding: '0.4rem', textAlign: 'right' }}>R$ {(it.quantidade * it.valor_unitario).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ textAlign: 'right', fontSize: '1.1rem', fontWeight: '800', borderTop: '2px solid #000', paddingTop: '0.5rem' }}>
                TOTAL PROPOSTA: R$ {modalVerOrcamento.valor_final.toFixed(2)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              <button className="btn-secondary" onClick={() => setModalVerOrcamento(null)}>Fechar</button>
              <button className="btn-gold" onClick={() => window.print()}>Imprimir / Exportar PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (REQUER SENHA MASTER) */}
      {modalExcluirOrcamento && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', borderLeft: '4px solid #F87171' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#F87171', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={20} /> Excluir Orçamento #{modalExcluirOrcamento.numero_orcamento}
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setModalExcluirOrcamento(null)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Você está prestes a excluir o Orçamento <strong>#{modalExcluirOrcamento.numero_orcamento}</strong> ({modalExcluirOrcamento.cliente_nome}). Esta ação é irreversível.
            </p>

            <form onSubmit={handleConfirmarExclusaoOrcamento} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
                  DIGITE A SENHA DO USUÁRIO MASTER *
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  className="input-field"
                  placeholder="Senha Master do Usuário..."
                  value={senhaMasterInput}
                  onChange={e => { setSenhaMasterInput(e.target.value); setErroSenhaMaster('') }}
                />
                {erroSenhaMaster && (
                  <div style={{ color: '#F87171', fontSize: '0.78rem', marginTop: '0.4rem', fontWeight: '700' }}>
                    {erroSenhaMaster}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalExcluirOrcamento(null)}>Cancelar</button>
                <button type="submit" className="btn-red" style={{ backgroundColor: '#DC2626' }}>
                  <Trash2 size={16} />
                  <span>Confirmar Exclusão</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
