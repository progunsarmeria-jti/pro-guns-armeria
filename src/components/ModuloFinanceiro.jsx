import React, { useState } from 'react'
import { Plus, DollarSign, ArrowUpRight, ArrowDownRight, TrendingUp, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ModuloFinanceiro({ financeiro, setFinanceiro }) {
  const [showModalFinanceiro, setShowModalFinanceiro] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('Todos')

  const [novoLancamento, setNovoLancamento] = useState({
    descricao: '',
    tipo: 'Receita',
    categoria: 'Serviço',
    valor: '',
    data_vencimento: new Date().toISOString().split('T')[0],
    forma_pagamento: 'PIX',
    status: 'Pago'
  })

  const totalReceitas = financeiro.filter(f => f.tipo === 'Receita' && f.status === 'Pago').reduce((acc, f) => acc + f.valor, 0)
  const totalDespesas = financeiro.filter(f => f.tipo === 'Despesa' && f.status === 'Pago').reduce((acc, f) => acc + f.valor, 0)
  const saldoLiquido = totalReceitas - totalDespesas

  const handleSalvarLancamento = (e) => {
    e.preventDefault()
    if (!novoLancamento.descricao || !novoLancamento.valor) return
    const created = {
      ...novoLancamento,
      id: `f_${Date.now()}`,
      valor: parseFloat(novoLancamento.valor) || 0
    }
    setFinanceiro([created, ...financeiro])
    setShowModalFinanceiro(false)
    setNovoLancamento({
      descricao: '',
      tipo: 'Receita',
      categoria: 'Serviço',
      valor: '',
      data_vencimento: new Date().toISOString().split('T')[0],
      forma_pagamento: 'PIX',
      status: 'Pago'
    })
  }

  const filteredFinanceiro = financeiro.filter(f => {
    if (filtroTipo === 'Receita') return f.tipo === 'Receita'
    if (filtroTipo === 'Despesa') return f.tipo === 'Despesa'
    return true
  })

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gold-primary)' }}>
            Financeiro & Fluxo de Caixa
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Controle de receitas de honorários, vendas de produtos, taxas pagas e despesas operacionais.
          </p>
        </div>

        <button className="btn-gold" onClick={() => setShowModalFinanceiro(true)}>
          <Plus size={18} />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Cards de Saldo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <ArrowUpRight size={24} color="#34D399" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL RECEITAS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#34D399' }}>
              R$ {totalReceitas.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <ArrowDownRight size={24} color="#F87171" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL DESPESAS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#F87171' }}>
              R$ {totalDespesas.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.8rem', borderRadius: '8px', backgroundColor: 'var(--gold-glow)', border: '1px solid var(--border-gold)' }}>
            <TrendingUp size={24} color="var(--gold-primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SALDO LÍQUIDO</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--gold-primary)' }}>
              R$ {saldoLiquido.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>DESCRIÇÃO</th>
              <th style={{ padding: '0.85rem 1rem' }}>TIPO</th>
              <th style={{ padding: '0.85rem 1rem' }}>CATEGORIA</th>
              <th style={{ padding: '0.85rem 1rem' }}>VALOR</th>
              <th style={{ padding: '0.85rem 1rem' }}>VENCIMENTO</th>
              <th style={{ padding: '0.85rem 1rem' }}>PAGTO</th>
              <th style={{ padding: '0.85rem 1rem' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filteredFinanceiro.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>{item.descricao}</td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span className={`badge ${item.tipo === 'Receita' ? 'badge-green' : 'badge-red'}`}>
                    {item.tipo}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{item.categoria}</td>
                <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: item.tipo === 'Receita' ? '#34D399' : '#F87171' }}>
                  {item.tipo === 'Receita' ? '+' : '-'} R$ {item.valor.toFixed(2)}
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>{item.data_vencimento}</td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{item.forma_pagamento}</td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span className={`badge ${item.status === 'Pago' ? 'badge-green' : 'badge-yellow'}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Criar Lançamento */}
      {showModalFinanceiro && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gold-primary)', marginBottom: '1rem' }}>Novo Lançamento Financeiro</h3>
            <form onSubmit={handleSalvarLancamento} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Descrição *</label>
                <input required className="input-field" value={novoLancamento.descricao} onChange={e => setNovoLancamento({...novoLancamento, descricao: e.target.value})} placeholder="Ex: Honorário despachantaria cliente Carlos" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tipo</label>
                  <select className="input-field" value={novoLancamento.tipo} onChange={e => setNovoLancamento({...novoLancamento, tipo: e.target.value})}>
                    <option value="Receita">Receita (Entrada)</option>
                    <option value="Despesa">Despesa (Saída)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Valor (R$) *</label>
                  <input required className="input-field" type="number" step="0.01" value={novoLancamento.valor} onChange={e => setNovoLancamento({...novoLancamento, valor: e.target.value})} placeholder="0.00" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Categoria</label>
                  <select className="input-field" value={novoLancamento.categoria} onChange={e => setNovoLancamento({...novoLancamento, categoria: e.target.value})}>
                    <option value="Serviço">Serviço Despachantaria</option>
                    <option value="Venda">Venda de Armas/Insumos</option>
                    <option value="Taxa">Taxas de Órgão (GRU)</option>
                    <option value="Custo Fixo">Custo Fixo Armeria</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Forma de Pagamento</label>
                  <select className="input-field" value={novoLancamento.forma_pagamento} onChange={e => setNovoLancamento({...novoLancamento, forma_pagamento: e.target.value})}>
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModalFinanceiro(false)}>Cancelar</button>
                <button type="submit" className="btn-gold">Salvar Lançamento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
