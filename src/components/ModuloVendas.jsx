import React, { useState } from 'react'
import { hojeISO, formatarData } from '../lib/dates'
import {
  ShoppingCart,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  DollarSign,
  Printer,
  MessageCircle,
  X,
  Package,
  FileText,
  User,
  ArrowRight,
  Lock
} from 'lucide-react'
import CustomSelect from './CustomSelect'
import { dbUpsert, dbDelete, isSupabaseConfigured } from '../lib/supabase'
import { registrarLog } from '../lib/auditLogger'

export default function ModuloVendas({
  vendas = [],
  setVendas,
  estoque = [],
  setEstoque,
  caixas = [],
  setCaixas,
  financeiro = [],
  setFinanceiro,
  clientes = [],
  usuarioLogado,
  setLogs,
  config
}) {
  const [busca, setBusca] = useState('')
  const [modalNovaVenda, setModalNovaVenda] = useState(false)
  const [reciboModalVenda, setReciboModalVenda] = useState(null)
  const [modalExcluirVenda, setModalExcluirVenda] = useState(null)
  const [senhaMasterInput, setSenhaMasterInput] = useState('')
  const [erroSenhaMaster, setErroSenhaMaster] = useState('')

  // Form State Nova Venda
  const [clienteSelecionado, setClienteSelecionado] = useState('CLIENTE AVULSO / BALCÃO')
  const [carrinho, setCarrinho] = useState([])
  const [itemIdParaAdicionar, setItemIdParaAdicionar] = useState('')
  const [qtdParaAdicionar, setQtdParaAdicionar] = useState(1)
  const [descontoVenda, setDescontoVenda] = useState(0)
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro')
  const [valorPagoCliente, setValorPagoCliente] = useState('')

  // Métricas do Módulo de Vendas
  const totalVendasCount = (vendas || []).length
  const faturamentoTotalVendas = (vendas || []).reduce((acc, v) => acc + (parseFloat(v.valor_final || v.valor_total) || 0), 0)
  const vendasHoje = (vendas || []).filter(v => v.data === hojeISO())
  const faturamentoHoje = vendasHoje.reduce((acc, v) => acc + (parseFloat(v.valor_final || v.valor_total) || 0), 0)

  // Itens do Estoque Disponíveis (Qtd > 0)
  const itensDisponiveis = (estoque || []).filter(i => (parseInt(i.quantidade) || 0) > 0)

  // Adicionar Item ao Carrinho
  const handleAdicionarAoCarrinho = () => {
    if (!itemIdParaAdicionar) return
    const itemEstoque = estoque.find(i => String(i.id) === String(itemIdParaAdicionar))
    if (!itemEstoque) return

    const qtdDesejada = parseInt(qtdParaAdicionar) || 1
    const qtdEstoqueDisponivel = parseInt(itemEstoque.quantidade) || 0

    // Verifica se já está no carrinho
    const itemExistenteNoCarrinho = carrinho.find(c => String(c.item_id) === String(itemEstoque.id))
    const qtdAtualNoCarrinho = itemExistenteNoCarrinho ? itemExistenteNoCarrinho.quantidade : 0

    if (qtdAtualNoCarrinho + qtdDesejada > qtdEstoqueDisponivel) {
      alert(`Quantidade indisponível no estoque! Disponível: ${qtdEstoqueDisponivel} unidade(s).`)
      return
    }

    if (itemExistenteNoCarrinho) {
      setCarrinho(prev => prev.map(c => {
        if (String(c.item_id) === String(itemEstoque.id)) {
          const novaQtd = c.quantidade + qtdDesejada
          return {
            ...c,
            quantidade: novaQtd,
            subtotal: novaQtd * (parseFloat(c.preco_unitario) || 0)
          }
        }
        return c
      }))
    } else {
      const precoVenda = parseFloat(itemEstoque.preco_venda) || 0
      const novoItemCarrinho = {
        item_id: itemEstoque.id,
        sku: itemEstoque.codigo_sku || 'N/A',
        nome: itemEstoque.nome,
        categoria: itemEstoque.categoria || 'Geral',
        preco_unitario: precoVenda,
        quantidade: qtdDesejada,
        subtotal: qtdDesejada * precoVenda
      }
      setCarrinho([...carrinho, novoItemCarrinho])
    }

    setItemIdParaAdicionar('')
    setQtdParaAdicionar(1)
  }

  // Remover Item do Carrinho
  const handleRemoverDoCarrinho = (itemId) => {
    setCarrinho(prev => prev.filter(c => String(c.item_id) !== String(itemId)))
  }

  // Cálculos do Carrinho
  const valorSubtotalCarrinho = carrinho.reduce((acc, c) => acc + (c.subtotal || 0), 0)
  const valorDescontoNum = parseFloat(descontoVenda) || 0
  const valorFinalCarrinho = Math.max(0, valorSubtotalCarrinho - valorDescontoNum)
  const valorTrocoDevolver = Math.max(0, (parseFloat(valorPagoCliente) || 0) - valorFinalCarrinho)

  // ── FINALIZAR VENDA DE BALCÃO ──────────────────────────────────────────────
  const handleFinalizarVenda = (e) => {
    e.preventDefault()
    if (carrinho.length === 0) {
      alert('Selecione ao menos 1 item do estoque para realizar a venda!')
      return
    }

    const hojeStr = hojeISO()
    const horaAgoraStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const proximoNumeroVenda = 2000 + totalVendasCount + 1

    const novaVendaObj = {
      id: `v_${Date.now()}`,
      numero_venda: proximoNumeroVenda,
      cliente_nome: clienteSelecionado,
      data: hojeStr,
      hora: horaAgoraStr,
      itens: carrinho,
      valor_subtotal: valorSubtotalCarrinho,
      desconto: valorDescontoNum,
      valor_final: valorFinalCarrinho,
      forma_pagamento: formaPagamento,
      valor_pago: parseFloat(valorPagoCliente) || valorFinalCarrinho,
      troco: valorTrocoDevolver,
      operador: usuarioLogado?.nome_completo || 'Operador',
      created_at: new Date().toISOString()
    }

    // 1. Dar Baixa no Estoque para cada item do carrinho
    const novoEstoque = [...estoque]
    carrinho.forEach(itemCart => {
      const idx = novoEstoque.findIndex(i => String(i.id) === String(itemCart.item_id))
      if (idx !== -1) {
        const qtdAnterior = parseInt(novoEstoque[idx].quantidade) || 0
        const novaQtd = Math.max(0, qtdAnterior - itemCart.quantidade)
        const itemAtualizado = { ...novoEstoque[idx], quantidade: novaQtd }
        novoEstoque[idx] = itemAtualizado
        dbUpsert('estoque', itemAtualizado)
      }
    })
    setEstoque(novoEstoque)

    // 2. Lançar no Caixa ABERTO da Recepção
    if (setCaixas && caixas) {
      const caixaAberto = caixas.find(c => c.data === hojeStr && c.status === 'ABERTO') || caixas[0]
      if (caixaAberto) {
        const novaMovCaixa = {
          id: `mov_v_${Date.now()}`,
          tipo: 'RECEBIMENTO_VENDA',
          descricao: `Venda de Balcão #${proximoNumeroVenda} (${clienteSelecionado})`,
          forma_pagamento: formaPagamento,
          valor: valorFinalCarrinho,
          hora: horaAgoraStr,
          usuario: usuarioLogado?.nome_completo || 'Operador'
        }
        const movsAnteriores = Array.isArray(caixaAberto.movimentacoes) ? caixaAberto.movimentacoes : []
        const saldoAnterior = parseFloat(caixaAberto.saldo_final || caixaAberto.saldo_inicial) || 0
        const caixaAtualizado = {
          ...caixaAberto,
          saldo_final: saldoAnterior + valorFinalCarrinho,
          movimentacoes: [novaMovCaixa, ...movsAnteriores]
        }
        setCaixas(prev => prev.map(c => c.id === caixaAberto.id ? caixaAtualizado : c))
        dbUpsert('caixas', caixaAtualizado)
      }
    }

    // 3. Lançar no Financeiro (Receita de Venda de Balcão)
    if (setFinanceiro && financeiro) {
      const resumoItensText = carrinho.map(c => `${c.quantidade}x ${c.nome}`).join(', ')
      const novoLancamentoFinanceiro = {
        id: `fin_v_${Date.now()}`,
        data: hojeStr,
        descricao: `Venda de Balcão #${proximoNumeroVenda} (${clienteSelecionado}) — ${resumoItensText}`,
        categoria: 'VENDA DE BALCÃO',
        tipo: 'RECEITA',
        valor: valorFinalCarrinho,
        forma_pagamento: formaPagamento,
        status: 'PAGO'
      }
      setFinanceiro(prev => [novoLancamentoFinanceiro, ...prev])
      dbUpsert('financeiro', novoLancamentoFinanceiro)
    }

    // 4. Salvar Venda no Estado & Supabase
    if (setVendas) {
      setVendas(prev => [novaVendaObj, ...prev])
    }
    dbUpsert('vendas', novaVendaObj)

    // 5. Registra Log de Auditoria
    registrarLog({
      usuario: usuarioLogado,
      acao: 'VENDA DE BALCÃO',
      descricao: `Venda #${proximoNumeroVenda} de R$ ${valorFinalCarrinho.toFixed(2)} (${formaPagamento}) realizada para ${clienteSelecionado}.`,
      setLogs
    })

    // 6. Reset e Exibição do Recibo
    setModalNovaVenda(false)
    setCarrinho([])
    setClienteSelecionado('CLIENTE AVULSO / BALCÃO')
    setDescontoVenda(0)
    setValorPagoCliente('')
    setReciboModalVenda(novaVendaObj)
  }

  // ── EXCLUIR VENDA (COM RESTAURAÇÃO DE ESTOQUE E SENHA MASTER) ──────────────
  const handleConfirmarExclusaoVenda = (e) => {
    e.preventDefault()
    if (!modalExcluirVenda) return

    const usuariosMaster = (usuarioLogado?.perfil === 'master')
    if (!usuariosMaster && (senhaMasterInput || '').trim() !== 'admin') {
      setErroSenhaMaster('Senha Master incorreta!')
      return
    }

    const venda = modalExcluirVenda

    // Restaura estoque dos itens
    if (Array.isArray(venda.itens)) {
      const estoqueRestaurado = [...estoque]
      venda.itens.forEach(itemVenda => {
        const idx = estoqueRestaurado.findIndex(i => String(i.id) === String(itemVenda.item_id))
        if (idx !== -1) {
          const qtdAtual = parseInt(estoqueRestaurado[idx].quantidade) || 0
          const itemAtualizado = { ...estoqueRestaurado[idx], quantidade: qtdAtual + itemVenda.quantidade }
          estoqueRestaurado[idx] = itemAtualizado
          dbUpsert('estoque', itemAtualizado)
        }
      })
      setEstoque(estoqueRestaurado)
    }

    // Remove do estado e Supabase
    if (setVendas) {
      setVendas(prev => prev.filter(v => String(v.id) !== String(venda.id)))
    }
    dbDelete('vendas', venda.id)

    registrarLog({
      usuario: usuarioLogado,
      acao: 'EXCLUSÃO DE VENDA',
      descricao: `Venda #${venda.numero_venda} cancelada. Estoque de produtos restaurado.`,
      setLogs
    })

    setModalExcluirVenda(null)
    setSenhaMasterInput('')
    setErroSenhaMaster('')
    alert(`Venda #${venda.numero_venda} cancelada e estoque restaurado!`)
  }

  // Enviar Recibo via WhatsApp
  const handleEnviarWhatsAppRecibo = (venda) => {
    const cliObj = (clientes || []).find(c => c.nome_completo === venda.cliente_nome)
    const tel = (cliObj?.telefone || '').replace(/\D/g, '')
    const numTel = tel.length === 10 || tel.length === 11 ? `55${tel}` : tel
    const resumoItens = (venda.itens || []).map(i => `• ${i.quantidade}x ${i.nome} (R$ ${(parseFloat(i.subtotal) || 0).toFixed(2)})`).join('\n')
    const msg = `Olá *${venda.cliente_nome}*, obrigado pela compra na *${config?.nome_fantasia || 'Pró Guns Armeria'}*!\n\n*COMPROVANTE DE VENDA #${venda.numero_venda}*\nData: ${formatarData(venda.data)} às ${venda.hora || ''}\n\n*Itens Adquiridos:*\n${resumoItens}\n\n*Forma de Pagamento:* ${venda.forma_pagamento}\n*Valor Total:* R$ ${(parseFloat(venda.valor_final) || 0).toFixed(2)}\n\nAgradecemos a preferência!`
    window.open(`https://wa.me/${numTel}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // Filtro de Busca
  const vendasFiltradas = (vendas || []).filter(v => {
    const termo = busca.toLowerCase()
    return (
      String(v.numero_venda || '').toLowerCase().includes(termo) ||
      (v.cliente_nome || '').toLowerCase().includes(termo) ||
      (v.forma_pagamento || '').toLowerCase().includes(termo)
    )
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ── TOPO COM TÍTULO E BOTÃO NOVA VENDA ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--gold-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingCart size={26} color="#F59E0B" />
            Vendas de Balcão (PDV)
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            Venda direta de peças, insumos e acessórios sem necessidade de O.S. (Baixa automática no Estoque e Caixa).
          </p>
        </div>

        <button
          onClick={() => setModalNovaVenda(true)}
          className="btn-gold"
          style={{ backgroundColor: '#F59E0B', borderColor: '#D97706', color: '#FFF', padding: '0.55rem 1.1rem', fontSize: '0.85rem', fontWeight: '800', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}
        >
          <Plus size={18} />
          <span>+ Nova Venda de Balcão</span>
        </button>
      </div>

      {/* ── METRICAS RÁPIDAS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: 'rgba(245,158,11,0.15)', padding: '0.75rem', borderRadius: '10px', color: '#F59E0B' }}>
            <ShoppingCart size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL DE VENDAS</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)' }}>{totalVendasCount}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: 'rgba(16,185,129,0.15)', padding: '0.75rem', borderRadius: '10px', color: '#10B981' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>FATURAMENTO VENDAS</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#10B981' }}>
              R$ {faturamentoTotalVendas.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: 'rgba(96,165,250,0.15)', padding: '0.75rem', borderRadius: '10px', color: '#60A5FA' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>VENDAS HOJE</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#60A5FA' }}>
              {vendasHoje.length} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(R$ {faturamentoHoje.toFixed(2)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BARRA DE PESQUISA ── */}
      <div className="card" style={{ padding: '0.85rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.45rem 0.75rem' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            className="input-field"
            style={{ border: 'none', background: 'transparent', padding: 0 }}
            placeholder="Pesquisar venda por N° (#V-2001), cliente ou forma de pagamento..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* ── TABELA DE VENDAS ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.83rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>VENDA #</th>
                <th style={{ padding: '0.85rem 1rem' }}>DATA / HORA</th>
                <th style={{ padding: '0.85rem 1rem' }}>CLIENTE</th>
                <th style={{ padding: '0.85rem 1rem' }}>ITENS ADQUIRIDOS</th>
                <th style={{ padding: '0.85rem 1rem' }}>PAGAMENTO</th>
                <th style={{ padding: '0.85rem 1rem' }}>VALOR TOTAL</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {vendasFiltradas.length > 0 ? (
                vendasFiltradas.map((venda) => (
                  <tr key={venda.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#F59E0B' }}>
                      #V-{venda.numero_venda || venda.id.slice(-4)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      {formatarData(venda.data)} {venda.hora ? `às ${venda.hora}` : ''}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      {venda.cliente_nome?.toUpperCase()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        {(venda.itens || []).map((it, idx) => (
                          <div key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
                            <strong style={{ color: '#F59E0B' }}>{it.quantidade}x</strong> {it.nome}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge badge-blue">
                        {venda.forma_pagamento}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#10B981', fontSize: '0.9rem' }}>
                      R$ {(parseFloat(venda.valor_final) || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => setReciboModalVenda(venda)}
                          style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', padding: '0.2rem' }}
                          title="Visualizar / Imprimir Recibo"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEnviarWhatsAppRecibo(venda)}
                          style={{ background: 'none', border: 'none', color: '#25D366', cursor: 'pointer', padding: '0.2rem' }}
                          title="Enviar Recibo no WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalExcluirVenda(venda)
                            setSenhaMasterInput('')
                            setErroSenhaMaster('')
                          }}
                          style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: '0.2rem' }}
                          title="Cancelar Venda (Restaura Estoque)"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Nenhuma venda de balcão registrada até o momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL NOVA VENDA DE BALCÃO (CARRINHO PDV) ── */}
      {modalNovaVenda && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '720px', maxHeight: '92vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#F59E0B', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800' }}>
                <ShoppingCart size={22} color="#F59E0B" />
                Nova Venda de Balcão
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setModalNovaVenda(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFinalizarVenda} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Seleção do Cliente */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>CLIENTE REQUERENTE</label>
                <CustomSelect
                  value={clienteSelecionado}
                  onChange={val => setClienteSelecionado(val)}
                  options={['CLIENTE AVULSO / BALCÃO', ...(clientes || []).map(c => c.nome_completo)]}
                  placeholder="Selecione ou digite o nome..."
                  allowCustom={true}
                />
              </div>

              {/* Bloco Adicionar Item do Estoque */}
              <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#F59E0B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Package size={14} /> ADICIONAR ITEM DO ESTOQUE AO CARRINHO
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.6rem', alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Item do Estoque *</label>
                    <select
                      className="input-field"
                      value={itemIdParaAdicionar}
                      onChange={e => setItemIdParaAdicionar(e.target.value)}
                    >
                      <option value="">-- Selecione o Produto ({itensDisponiveis.length} disponíveis) --</option>
                      {itensDisponiveis.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.nome} (SKU: {item.codigo_sku || 'N/A'}) — Disp: {item.quantidade} | R$ {(parseFloat(item.preco_venda) || 0).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quantidade *</label>
                    <input
                      type="number"
                      min="1"
                      className="input-field"
                      value={qtdParaAdicionar}
                      onChange={e => setQtdParaAdicionar(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAdicionarAoCarrinho}
                    className="btn-gold"
                    style={{ backgroundColor: '#10B981', borderColor: '#059669', color: '#FFF', height: '36px' }}
                  >
                    <Plus size={16} /> Adicionar
                  </button>
                </div>
              </div>

              {/* Tabela do Carrinho */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left' }}>PRODUTO / ITEM</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>QTD</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>VALOR UNIT.</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>SUBTOTAL</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>AÇÃO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrinho.length > 0 ? (
                      carrinho.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.6rem 0.8rem', fontWeight: '600' }}>
                            {item.nome} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({item.sku})</span>
                          </td>
                          <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: '800', color: '#F59E0B' }}>
                            {item.quantidade}
                          </td>
                          <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>
                            R$ {(item.preco_unitario || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: '700', color: '#10B981' }}>
                            R$ {(item.subtotal || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoverDoCarrinho(item.item_id)}
                              style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ padding: '1.2rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Nenhum item adicionado ao carrinho de venda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totalizador & Pagamento */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <CustomSelect
                  label="Forma de Pagamento *"
                  value={formaPagamento}
                  onChange={val => setFormaPagamento(val)}
                  options={['Dinheiro', 'PIX', 'Cartão de Crédito na máquina', 'Cartão de Débito na máquina']}
                  allowCustom={false}
                />

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>DESCONTO (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={descontoVenda}
                    onChange={e => setDescontoVenda(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Troco se Dinheiro */}
              {formaPagamento === 'Dinheiro' && (
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#34D399' }}>Valor Entregue pelo Cliente (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      value={valorPagoCliente}
                      onChange={e => setValorPagoCliente(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Troco a Devolver (R$)</label>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: valorTrocoDevolver > 0 ? '#F59E0B' : '#FFFFFF', paddingTop: '0.4rem' }}>
                      R$ {valorTrocoDevolver.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Resumo Financeiro da Venda */}
              <div style={{ backgroundColor: 'rgba(245,158,11,0.08)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SUBTOTAL: R$ {valorSubtotalCarrinho.toFixed(2)} | DESCONTO: R$ {valorDescontoNum.toFixed(2)}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#F59E0B' }}>VALOR TOTAL FINAL DA VENDA</div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10B981' }}>
                  R$ {valorFinalCarrinho.toFixed(2)}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalNovaVenda(false)}>Cancelar</button>
                <button type="submit" className="btn-gold" style={{ backgroundColor: '#10B981', borderColor: '#059669', color: '#FFF' }}>
                  <CheckCircle2 size={16} />
                  <span>Finalizar Venda & Dar Baixa no Estoque</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL RECIBO DE VENDA (IMPRESSÃO & WHATSAPP) ── */}
      {reciboModalVenda && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 9999, padding: '2rem 1rem', overflowY: 'auto' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '680px', backgroundColor: '#FFFFFF', color: '#111827', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', padding: '2.2rem', margin: 'auto 0' }}>
            <button
              onClick={() => setReciboModalVenda(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#F3F4F6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4B5563' }}
              title="Fechar"
            >
              <X size={18} />
            </button>

            {/* ÁREA IMPRESSA DO RECIBO */}
            <div className="print-area" style={{ fontFamily: 'Inter, sans-serif' }}>
              {/* CABEÇALHO DA ARMERIA */}
              <div style={{ textAlign: 'center', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.4rem' }}>
                  <img
                    src={config?.logo_url || "/logo.png"}
                    alt={config?.nome_fantasia || 'Pró Guns Armeria'}
                    style={{ maxHeight: '75px', objectFit: 'contain' }}
                  />
                </div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: '800', fontFamily: 'Cinzel, serif', color: '#000000', margin: '0.2rem 0 0.1rem 0', textTransform: 'uppercase' }}>
                  {config?.nome_fantasia || 'PRÓ GUNS ARMERIA'}
                </h1>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>
                  {config?.razao_social || 'SANTOS E OLIVIERA JUNIOR LTDA'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#4B5563' }}>
                  CNPJ: {config?.cnpj || '12.345.678/0001-99'}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1F2937' }}>
                  CR: {config?.cr_armeria || 'CR-998877/2ª RM'} — {config?.rm_armeria || '2ª Região Militar'}
                </div>
                <div style={{ textAlign: 'left', fontSize: '0.8rem', color: '#374151', marginTop: '0.75rem', fontWeight: '600' }}>
                  Data: {formatarData(reciboModalVenda.data)} às {reciboModalVenda.hora || ''}
                </div>
                <hr style={{ border: 'none', borderTop: '2px solid #000000', marginTop: '0.4rem', marginBottom: '1.2rem' }} />
              </div>

              {/* TÍTULO */}
              <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#111827', textTransform: 'uppercase', margin: 0 }}>
                  COMPROVANTE DE VENDA DE BALCÃO #V-{reciboModalVenda.numero_venda}
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#4B5563', marginTop: '0.2rem' }}>
                  Cliente: <strong>{reciboModalVenda.cliente_nome?.toUpperCase()}</strong>
                </div>
              </div>

              {/* TABELA DE ITENS */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #000', textAlign: 'left' }}>
                    <th style={{ padding: '0.4rem 0' }}>PRODUTO / ITEM</th>
                    <th style={{ padding: '0.4rem 0', textAlign: 'center' }}>QTD</th>
                    <th style={{ padding: '0.4rem 0', textAlign: 'right' }}>VALOR UNIT.</th>
                    <th style={{ padding: '0.4rem 0', textAlign: 'right' }}>SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {(reciboModalVenda.itens || []).map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '0.5rem 0' }}>{it.nome}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'center', fontWeight: '700' }}>{it.quantidade}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>R$ {(it.preco_unitario || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: '700' }}>R$ {(it.subtotal || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* RESUMO DE VALORES */}
              <div style={{ borderTop: '1.5px solid #000', paddingTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.85rem', textAlign: 'right' }}>
                <div>Subtotal: R$ {(reciboModalVenda.valor_subtotal || 0).toFixed(2)}</div>
                {reciboModalVenda.desconto > 0 && <div>Desconto: R$ {(reciboModalVenda.desconto || 0).toFixed(2)}</div>}
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#000', marginTop: '0.2rem' }}>
                  VALOR TOTAL FINAL: R$ {(reciboModalVenda.valor_final || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#4B5563' }}>
                  Forma de Pagamento: <strong>{reciboModalVenda.forma_pagamento}</strong>
                </div>
              </div>

              {/* ASSINATURA */}
              <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '0.78rem' }}>
                <div style={{ width: '45%' }}>
                  <div style={{ borderTop: '1.5px solid #000', paddingTop: '0.4rem' }}>
                    {reciboModalVenda.cliente_nome?.toUpperCase()}<br />Comprador / Cliente
                  </div>
                </div>
                <div style={{ width: '45%' }}>
                  <div style={{ borderTop: '1.5px solid #000', paddingTop: '0.4rem' }}>
                    {config?.nome_fantasia || 'Pró Guns Armeria'}<br />Vendedor / Atendimento
                  </div>
                </div>
              </div>
            </div>

            {/* AÇÕES NO RODAPÉ DO MODAL */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
              <button className="btn-secondary" onClick={() => setReciboModalVenda(null)}>Fechar</button>
              <button
                type="button"
                className="btn-secondary"
                style={{ backgroundColor: '#25D366', color: '#FFFFFF', borderColor: '#25D366', fontWeight: '700' }}
                onClick={() => handleEnviarWhatsAppRecibo(reciboModalVenda)}
              >
                <MessageCircle size={15} />
                <span>Enviar via WhatsApp</span>
              </button>
              <button
                type="button"
                className="btn-gold"
                style={{ backgroundColor: '#134633', borderColor: '#134633' }}
                onClick={() => window.print()}
              >
                <Printer size={15} />
                <span>Imprimir Recibo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EXCLUSÃO DE VENDA (CANCELAMENTO) ── */}
      {modalExcluirVenda && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '460px', borderLeft: '4px solid #EF4444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#F87171', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={20} color="#F87171" />
                Cancelar Venda #{modalExcluirVenda.numero_venda}
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setModalExcluirVenda(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmarExclusaoVenda} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.83rem', color: '#FCA5A5' }}>
                <div><strong>ATENÇÃO:</strong> Cancelando esta venda, os produtos retornam automaticamente ao estoque da armeria.</div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: '700' }}>Senha Pessoal Master *</label>
                <input
                  required
                  autoFocus
                  type="password"
                  className="input-field"
                  value={senhaMasterInput}
                  onChange={e => { setSenhaMasterInput(e.target.value); setErroSenhaMaster('') }}
                  placeholder="Digite a senha master..."
                  style={{ textTransform: 'none' }}
                />
              </div>

              {erroSenhaMaster && (
                <div style={{ color: '#F87171', fontSize: '0.78rem', fontWeight: '700' }}>
                  ⚠️ {erroSenhaMaster}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalExcluirVenda(null)}>Voltar</button>
                <button type="submit" className="btn-gold" style={{ backgroundColor: '#DC2626', color: '#FFF' }}>
                  <Trash2 size={16} /> Cancelar Venda & Devolver Estoque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
