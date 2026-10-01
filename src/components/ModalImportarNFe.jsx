import React, { useState } from 'react'
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Package,
  ArrowRight,
  Plus,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  DollarSign
} from 'lucide-react'
import { parseNFeXML } from '../lib/nfeParser'

export default function ModalImportarNFe({
  isOpen,
  onClose,
  estoque = [],
  categoriasDisponiveis = [],
  onConfirmarEntrada
}) {
  const [etapa, setEtapa] = useState('upload') // 'upload' | 'conferencia' | 'sucesso'
  const [erroXml, setErroXml] = useState('')
  const [nfeData, setNfeData] = useState(null)
  const [itensMapeados, setItensMapeados] = useState([])
  const [margemPadrao, setMargemPadrao] = useState(50) // 50% de margem de lucro sugerida
  const [chaveCopiada, setChaveCopiada] = useState(false)
  const [isProcessando, setIsProcessando] = useState(false)

  if (!isOpen) return null

  // ─── Processamento do Arquivo XML ───────────────────────────────────────────
  const processarTextoXml = (xmlText) => {
    try {
      setErroXml('')
      const parsed = parseNFeXML(xmlText)
      setNfeData(parsed)

      // Mapeamento automático dos itens da NF com o estoque existente
      const mapeamentoInicial = parsed.itens.map((itemXml, idx) => {
        // Tenta achar match no estoque existente por Código de Barras (EAN), SKU ou Nome
        let itemExistente = null
        if (itemXml.codigo_barras) {
          itemExistente = estoque.find(e => e.codigo_barras && String(e.codigo_barras) === String(itemXml.codigo_barras))
        }
        if (!itemExistente && itemXml.codigo_fornecedor) {
          itemExistente = estoque.find(e => (e.codigo_sku || '').toLowerCase() === itemXml.codigo_fornecedor.toLowerCase())
        }
        if (!itemExistente) {
          itemExistente = estoque.find(e => (e.nome || '').toLowerCase().trim() === itemXml.descricao.toLowerCase().trim())
        }

        const modoInicial = itemExistente ? 'VINCULAR' : 'NOVO'
        const precoCustoReal = itemXml.preco_custo_real || itemXml.preco_unitario_tabela || 0
        const precoVendaSugerido = Number((precoCustoReal * (1 + margemPadrao / 100)).toFixed(2))

        return {
          idx,
          incluir: true,
          xml: itemXml,
          modo: modoInicial, // 'VINCULAR' | 'NOVO'
          item_estoque_id: itemExistente ? itemExistente.id : '',
          // Campos para novo item
          novo_sku: itemXml.codigo_fornecedor || `SKU-NF-${Math.floor(1000 + Math.random() * 9000)}`,
          novo_nome: itemXml.descricao,
          novo_categoria: categoriasDisponiveis[0] || 'COMPONENTES & PEÇAS',
          novo_codigo_barras: itemXml.codigo_barras || '',
          novo_ncm: itemXml.ncm || '',
          novo_cest: itemXml.cest || '',
          novo_unidade: itemXml.unidade || 'UN',
          novo_preco_custo: precoCustoReal,
          novo_preco_venda: precoVendaSugerido,
          novo_estoque_minimo: 2,
          novo_localizacao: 'Armeria - Prateleira A',
          atualizar_preco_custo_existente: true
        }
      })

      setItensMapeados(mapeamentoInicial)
      setEtapa('conferencia')
    } catch (err) {
      console.error('Erro ao ler XML:', err)
      setErroXml(err.message || 'Erro ao processar o arquivo XML da NF-e.')
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string') {
        processarTextoXml(content)
      }
    }
    reader.onerror = () => setErroXml('Falha ao ler o arquivo selecionado no disco.')
    reader.readAsText(file, 'UTF-8')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result
        if (typeof content === 'string') processarTextoXml(content)
      }
      reader.readAsText(file, 'UTF-8')
    }
  }

  // ─── Atualização de Margem em Massa ─────────────────────────────────────────
  const aplicarNovaMargem = (novaMargem) => {
    const m = parseFloat(novaMargem) || 0
    setMargemPadrao(m)
    setItensMapeados(prev => prev.map(item => {
      const custo = item.xml.preco_custo_real || item.xml.preco_unitario_tabela || 0
      return {
        ...item,
        novo_preco_venda: Number((custo * (1 + m / 100)).toFixed(2))
      }
    }))
  }

  // ─── Confirmar Entrada no Estoque ───────────────────────────────────────────
  const handleConfirmar = () => {
    if (!nfeData) return
    setIsProcessando(true)

    try {
      const itensValidos = itensMapeados.filter(i => i.incluir)
      if (itensValidos.length === 0) {
        alert('Selecione ao menos um item da nota fiscal para dar entrada no estoque.')
        setIsProcessando(false)
        return
      }

      onConfirmarEntrada({
        nfeData,
        itensMapeados: itensValidos
      })

      setEtapa('sucesso')
    } catch (err) {
      console.error('Erro ao confirmar entrada da NF-e:', err)
      alert('Erro ao dar entrada no estoque: ' + err.message)
    } finally {
      setIsProcessando(false)
    }
  }

  const copiarChave = () => {
    if (nfeData?.chave_acesso) {
      navigator.clipboard.writeText(nfeData.chave_acesso)
      setChaveCopiada(true)
      setTimeout(() => setChaveCopiada(false), 2000)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.88)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '1rem'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: etapa === 'upload' ? '560px' : '980px',
        maxHeight: '92vh',
        overflowY: 'auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1.5rem'
      }}>
        {/* Header do Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(217, 119, 6, 0.15)', borderRadius: '8px', border: '1px solid rgba(217, 119, 6, 0.3)' }}>
              <FileText size={22} color="var(--gold-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--gold-primary)', margin: 0 }}>
                Entrada de Estoque por NF-e (XML)
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Importação fiscal automática, rateio de custos e rastreabilidade para SEFAZ e Exército
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '0.35rem', borderRadius: '50%', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── ETAPA 1: UPLOAD DO XML ────────────────────────────────────────── */}
        {etapa === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              style={{
                border: '2px dashed var(--border-gold)',
                borderRadius: '12px',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                backgroundColor: 'rgba(217, 119, 6, 0.04)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => document.getElementById('input-nfe-xml').click()}
            >
              <Upload size={42} color="var(--gold-primary)" style={{ margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Clique ou arraste o arquivo XML da NF-e aqui
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Formatos aceitos: arquivos <strong>.xml</strong> emitidos por distribuidores ou fabricantes (SEFAZ Modelo 55)
              </div>
              <input
                id="input-nfe-xml"
                type="file"
                accept=".xml,text/xml"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>

            {erroXml && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                color: '#F87171',
                fontSize: '0.82rem'
              }}>
                <AlertTriangle size={18} />
                <span>{erroXml}</span>
              </div>
            )}

            <div style={{
              backgroundColor: 'var(--bg-input)',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              lineHeight: '1.5'
            }}>
              <strong>💡 Como funciona a importação inteligente:</strong>
              <ul style={{ margin: '0.35rem 0 0 1.2rem', padding: 0 }}>
                <li>Lê automaticamente Número da NF, Chave de 44 dígitos e Dados do Fornecedor.</li>
                <li>Identifica produtos já cadastrados via Código de Barras (EAN) ou SKU.</li>
                <li>Calcula o <strong>custo real unitário</strong> com rateio de frete e impostos destacados.</li>
                <li>Atualiza o estoque e registra o comprovante para auditoria do Exército e SEFAZ-GO.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ─── ETAPA 2: CONFERÊNCIA DOS ITENS ("DE-PARA") ─────────────────────── */}
        {etapa === 'conferencia' && nfeData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Card com Resumo da Nota Fiscal */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0.9rem 1.1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.85rem'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>FORNECEDOR (EMITENTE)</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'block' }}>
                  {nfeData.fornecedor.razao_social}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  CNPJ: {nfeData.fornecedor.cnpj} ({nfeData.fornecedor.uf})
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>NOTA FISCAL & SÉRIE</span>
                <strong style={{ fontSize: '1rem', color: 'var(--gold-primary)' }}>
                  NF nº {nfeData.numero_nf} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(Série {nfeData.serie})</span>
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  Emissão: {nfeData.data_emissao ? new Date(nfeData.data_emissao).toLocaleDateString('pt-BR') : 'N/A'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>VALORES DA NOTA</span>
                <strong style={{ fontSize: '1rem', color: '#34D399' }}>
                  Total: R$ {nfeData.totais.valor_total.toFixed(2)}
                </strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                  Produtos: R$ {nfeData.totais.valor_produtos.toFixed(2)} | Frete: R$ {nfeData.totais.valor_frete.toFixed(2)} | IPI: R$ {nfeData.totais.valor_ipi.toFixed(2)}
                </span>
              </div>

              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  <span>Chave: <code style={{ color: 'var(--gold-primary)', fontFamily: 'monospace' }}>{nfeData.chave_acesso || 'N/A'}</code></span>
                  <button
                    type="button"
                    onClick={copiarChave}
                    className="btn-secondary"
                    style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem' }}
                    title="Copiar chave de acesso"
                  >
                    {chaveCopiada ? <Check size={12} color="#34D399" /> : <Copy size={12} />}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: '600' }}>
                    Margem de Lucro a Aplicar (% sobre o custo):
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <input
                      type="number"
                      value={margemPadrao}
                      onChange={(e) => aplicarNovaMargem(e.target.value)}
                      style={{ width: '55px', padding: '0.25rem', fontSize: '0.75rem', textAlign: 'center' }}
                      className="input-field"
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista dos Itens da NF */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                  Conferência de Produtos da NF ({nfeData.itens.length} encontrados)
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Vincule a peças existentes ou configure como novas peças
                </span>
              </div>

              {itensMapeados.map((item, idx) => {
                const itemEstoque = estoque.find(e => String(e.id) === String(item.item_estoque_id))
                return (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: item.incluir ? 'var(--bg-input)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${item.incluir ? 'var(--border-color)' : 'rgba(255,255,255,0.05)'}`,
                      borderRadius: '8px',
                      padding: '0.85rem',
                      opacity: item.incluir ? 1 : 0.5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem'
                    }}
                  >
                    {/* Linha 1: Checkbox + Dados da NF */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <input
                          type="checkbox"
                          checked={item.incluir}
                          onChange={(e) => {
                            const val = e.target.checked
                            setItensMapeados(prev => prev.map((it, i) => i === idx ? { ...it, incluir: val } : it))
                          }}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                        <div>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                            #{item.xml.item_numero} - {item.xml.descricao}
                          </strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span>Cód: <code>{item.xml.codigo_fornecedor}</code></span>
                            {item.xml.codigo_barras && <span>EAN: <code>{item.xml.codigo_barras}</code></span>}
                            <span>NCM: <code>{item.xml.ncm || 'N/A'}</code></span>
                            <span>Un: <code>{item.xml.unidade}</code></span>
                            <span>Qtd na NF: <strong style={{ color: 'var(--gold-primary)' }}>{item.xml.quantidade} {item.xml.unidade}</strong></span>
                            <span>Custo NF: R$ {item.xml.preco_unitario_tabela.toFixed(2)}</span>
                            {item.xml.preco_custo_real !== item.xml.preco_unitario_tabela && (
                              <span style={{ color: '#F59E0B' }}>
                                Custo Real c/ frete/impostos: <strong>R$ {item.xml.preco_custo_real.toFixed(2)}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botões de Ação: Vincular ou Novo */}
                      {item.incluir && (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className={`btn-secondary ${item.modo === 'VINCULAR' ? 'active-gold' : ''}`}
                            style={{
                              padding: '0.25rem 0.6rem',
                              fontSize: '0.72rem',
                              borderColor: item.modo === 'VINCULAR' ? 'var(--gold-primary)' : undefined,
                              backgroundColor: item.modo === 'VINCULAR' ? 'rgba(217, 119, 6, 0.2)' : undefined,
                              color: item.modo === 'VINCULAR' ? 'var(--gold-primary)' : undefined
                            }}
                            onClick={() => {
                              setItensMapeados(prev => prev.map((it, i) => i === idx ? { ...it, modo: 'VINCULAR' } : it))
                            }}
                          >
                            <RefreshCw size={12} /> Vincular a Peça Existente
                          </button>
                          <button
                            type="button"
                            className={`btn-secondary ${item.modo === 'NOVO' ? 'active-gold' : ''}`}
                            style={{
                              padding: '0.25rem 0.6rem',
                              fontSize: '0.72rem',
                              borderColor: item.modo === 'NOVO' ? 'var(--gold-primary)' : undefined,
                              backgroundColor: item.modo === 'NOVO' ? 'rgba(217, 119, 6, 0.2)' : undefined,
                              color: item.modo === 'NOVO' ? 'var(--gold-primary)' : undefined
                            }}
                            onClick={() => {
                              setItensMapeados(prev => prev.map((it, i) => i === idx ? { ...it, modo: 'NOVO' } : it))
                            }}
                          >
                            <Plus size={12} /> Cadastrar Nova Peça
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Linha 2: Configuração de Destino */}
                    {item.incluir && (
                      <div style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '6px',
                        padding: '0.65rem 0.85rem'
                      }}>
                        {item.modo === 'VINCULAR' ? (
                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                                Selecione o Item correspondente no Estoque:
                              </label>
                              <select
                                className="input-field"
                                style={{ fontSize: '0.8rem', padding: '0.35rem' }}
                                value={item.item_estoque_id}
                                onChange={(e) => {
                                  const novoId = e.target.value
                                  setItensMapeados(prev => prev.map((it, i) => i === idx ? { ...it, item_estoque_id: novoId } : it))
                                }}
                              >
                                <option value="">-- Selecione uma peça existente --</option>
                                {estoque.map(est => (
                                  <option key={est.id} value={est.id}>
                                    {est.nome} ({est.codigo_sku}) - Saldo atual: {est.quantidade || 0} un.
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div style={{ fontSize: '0.75rem' }}>
                              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Saldo Resultante:</span>
                              <strong style={{ color: 'var(--gold-primary)' }}>
                                {itemEstoque ? (itemEstoque.quantidade || 0) : 0} un. + {item.xml.quantidade} un. = {(itemEstoque ? (itemEstoque.quantidade || 0) : 0) + item.xml.quantidade} un.
                              </strong>
                            </div>

                            <div>
                              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={item.atualizar_preco_custo_existente}
                                  onChange={(e) => {
                                    const val = e.target.checked
                                    setItensMapeados(prev => prev.map((it, i) => i === idx ? { ...it, atualizar_preco_custo_existente: val } : it))
                                  }}
                                />
                                <span>Atualizar Custo p/ R$ {item.xml.preco_custo_real.toFixed(2)}</span>
                              </label>
                            </div>
                          </div>
                        ) : (
                          /* Cadastro de Novo Item */
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem' }}>
                            <div>
                              <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Código SKU</label>
                              <input
                                className="input-field"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                value={item.novo_sku}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setItensMapeados(prev => prev.map((it, i) => i === idx ? { ...it, novo_sku: v } : it))
                                }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Categoria</label>
                              <select
                                className="input-field"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                value={item.novo_categoria}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setItensMapeados(prev => prev.map((it, i) => i === idx ? { ...it, novo_categoria: v } : it))
                                }}
                              >
                                {categoriasDisponiveis.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Cód. Barras (EAN)</label>
                              <input
                                className="input-field"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                value={item.novo_codigo_barras}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setItensMapeados(prev => prev.map((it, i) => i === idx ? { ...it, novo_codigo_barras: v } : it))
                                }}
                                placeholder="EAN-13"
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>NCM</label>
                              <input
                                className="input-field"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                value={item.novo_ncm}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setItensMapeados(prev => prev.map((it, i) => i === idx ? { ...it, novo_ncm: v } : it))
                                }}
                                placeholder="8 dígitos"
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Preço Custo (R$)</label>
                              <input
                                type="number"
                                step="0.01"
                                className="input-field"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                value={item.novo_preco_custo}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value) || 0
                                  setItensMapeados(prev => prev.map((it, i) => i === idx ? {
                                    ...it,
                                    novo_preco_custo: v,
                                    novo_preco_venda: Number((v * (1 + margemPadrao / 100)).toFixed(2))
                                  } : it))
                                }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: '0.68rem', color: 'var(--gold-primary)', fontWeight: '700', display: 'block' }}>Preço Venda (R$)</label>
                              <input
                                type="number"
                                step="0.01"
                                className="input-field"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderColor: 'var(--border-gold)' }}
                                value={item.novo_preco_venda}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value) || 0
                                  setItensMapeados(prev => prev.map((it, i) => i === idx ? { ...it, novo_preco_venda: v } : it))
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Resumo da Operação e Botões de Rodapé */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '1rem',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {itensMapeados.filter(i => i.incluir && i.modo === 'VINCULAR').length} peças existentes a somar | {itensMapeados.filter(i => i.incluir && i.modo === 'NOVO').length} novas peças a cadastrar
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEtapa('upload')}
                  disabled={isProcessando}
                >
                  Voltar / Escolher outro XML
                </button>
                <button
                  type="button"
                  className="btn-gold"
                  onClick={handleConfirmar}
                  disabled={isProcessando}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ShieldCheck size={18} />
                  <span>{isProcessando ? 'Processando Entrada...' : 'Confirmar Entrada no Estoque'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── ETAPA 3: SUCESSO ──────────────────────────────────────────────── */}
        {etapa === 'sucesso' && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(52, 211, 153, 0.15)', borderRadius: '50%', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
              <CheckCircle2 size={48} color="#34D399" />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#34D399', margin: 0 }}>
              Entrada da NF-e Concluída com Sucesso!
            </h3>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '480px', margin: 0 }}>
              Os produtos foram adicionados e atualizados no estoque da armeria. O comprovante fiscal da NF nº <strong>{nfeData?.numero_nf}</strong> foi registrado para auditoria e histórico fiscal.
            </p>

            <button
              type="button"
              className="btn-gold"
              onClick={onClose}
              style={{ marginTop: '0.5rem', minWidth: '160px' }}
            >
              Fechar e Ver Estoque
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
