import React from 'react'
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  Wallet,
  DollarSign,
  Calculator,
  Plus,
  Users,
  Wrench,
  TrendingUp,
  ArrowRight
} from 'lucide-react'

export default function ModuloHome({
  ordens = [],
  orcamentos = [],
  estoque = [],
  caixas = [],
  financeiro = [],
  clientes = [],
  setActiveTab,
  setFiltroStatusOrdens
}) {
  // Contagens dos balões informativos (Badges estilo Shooting House)
  const osAguardandoAprovacao = ordens.filter(o => o.status === 'AGUARDANDO APROVAÇÃO').length
  const osAguardandoRetirada  = ordens.filter(o => o.status === 'AGUARDANDO RETIRADA').length
  const osEmAnalise          = ordens.filter(o => o.status === 'EM ANÁLISE').length
  const osNaoIniciado        = ordens.filter(o => o.status === 'NÃO INICIADO').length
  const osEmManutencao       = ordens.filter(o => o.status === 'EM MANUTENÇÃO').length

  // Métricas adicionais para Estoque, Caixa e Financeiro
  const estoqueBaixoCount    = estoque.filter(item => item.quantidade <= item.estoque_minimo).length
  const caixaHoje            = caixas.find(c => c.data === new Date().toISOString().split('T')[0]) || caixas[0]
  const caixaStatus          = caixaHoje ? caixaHoje.status : 'FECHADO'
  const receitasMes          = financeiro.filter(f => f.tipo === 'Receita' && f.status === 'Pago').reduce((acc, f) => acc + f.valor, 0)
  const orcamentosPendentes  = orcamentos.filter(o => o.status === 'Pendente').length

  // Handler para navegar diretamente para a aba com o filtro
  const handleNavegarOrdens = (status) => {
    if (setFiltroStatusOrdens) {
      setFiltroStatusOrdens(status)
    }
    setActiveTab('ordens')
  }

  // Definição dos blocos de atalho estilo Shooting House
  const statusBlocks = [
    {
      id: 'aguardando_aprovacao',
      title: 'O.S. Aguardando Aprovação',
      badgeCount: osAguardandoAprovacao,
      badgeColor: '#F59E0B', // Amarelo/Laranja
      icon: Clock,
      onClick: () => handleNavegarOrdens('AGUARDANDO APROVAÇÃO')
    },
    {
      id: 'aguardando_retirada',
      title: 'O.S. Aguardando Retirada',
      badgeCount: osAguardandoRetirada,
      badgeColor: '#10B981', // Verde
      icon: CheckCircle2,
      onClick: () => handleNavegarOrdens('AGUARDANDO RETIRADA')
    },
    {
      id: 'em_analise',
      title: 'O.S. Em Análise',
      badgeCount: osEmAnalise,
      badgeColor: '#3B82F6', // Azul
      icon: FileText,
      onClick: () => handleNavegarOrdens('EM ANÁLISE')
    },
    {
      id: 'nao_iniciado',
      title: 'O.S. Não Iniciado',
      badgeCount: osNaoIniciado,
      badgeColor: '#8B5CF6', // Roxo/Cinza
      icon: AlertCircle,
      onClick: () => handleNavegarOrdens('NÃO INICIADO')
    },
    {
      id: 'em_manutencao',
      title: 'O.S. Em Manutenção',
      badgeCount: osEmManutencao,
      badgeColor: '#06B6D4', // Ciano
      icon: Wrench,
      onClick: () => handleNavegarOrdens('EM MANUTENÇÃO')
    },
    {
      id: 'bloco_estoque',
      title: 'Estoque de Peças & Insumos',
      badgeCount: estoqueBaixoCount > 0 ? `${estoqueBaixoCount} ALERTA` : `${estoque.length} ITENS`,
      badgeColor: estoqueBaixoCount > 0 ? '#EF4444' : '#3B82F6',
      icon: Package,
      subtitle: `${estoque.length} peças cadastradas`,
      onClick: () => setActiveTab('estoque')
    },
    {
      id: 'bloco_caixa',
      title: 'Caixa da Recepção',
      badgeCount: caixaStatus,
      badgeColor: caixaStatus === 'ABERTO' ? '#10B981' : '#6B7280',
      icon: Wallet,
      subtitle: caixaHoje ? `${caixaHoje.movimentacoes?.length || 0} mov. hoje` : 'Sem caixa aberto',
      onClick: () => setActiveTab('caixa')
    },
    {
      id: 'bloco_financeiro',
      title: 'Controle Financeiro & DRE',
      badgeCount: `R$ ${receitasMes.toFixed(2)}`,
      badgeColor: '#D4AF37', // Dourado
      icon: DollarSign,
      subtitle: 'Receitas acumuladas',
      onClick: () => setActiveTab('financeiro')
    }
  ]

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header do Painel Principal */}
      <div style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        backgroundColor: 'var(--bg-card)',
        padding: '1.25rem 1.5rem',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
            <span style={{
              backgroundColor: 'rgba(212, 175, 55, 0.15)',
              color: 'var(--gold-primary)',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Painel de Gestão
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Shooting House Style</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
            Tela Inicial & Atalhos
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn-gold" onClick={() => setActiveTab('ordens')}>
            <Plus size={18} />
            <span>Nova O.S. Armeria</span>
          </button>
          <button className="btn-secondary" onClick={() => setActiveTab('caixa')}>
            <Wallet size={18} />
            <span>Abrir Caixa</span>
          </button>
        </div>
      </div>

      {/* Seção Atalhos e Blocos de Status (Estilo Shooting House) */}
      <div>
        <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--gold-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} />
          <span>Status das Ordens de Serviço & Módulos</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1.2rem'
        }}>
          {statusBlocks.map(block => {
            const IconComponent = block.icon
            return (
              <div
                key={block.id}
                onClick={block.onClick}
                style={{
                  position: 'relative',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '1.25rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.borderColor = block.badgeColor
                  e.currentTarget.style.boxShadow = `0 6px 16px ${block.badgeColor}22`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* Balão Informativo de Notificação / Contagem no Canto Superior Direito */}
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '12px',
                  backgroundColor: block.badgeColor,
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '14px',
                  boxShadow: `0 2px 8px ${block.badgeColor}66`,
                  border: '2px solid var(--bg-card)',
                  letterSpacing: '0.3px'
                }}>
                  {block.badgeCount}
                </div>

                {/* Ícone */}
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  backgroundColor: `${block.badgeColor}18`,
                  border: `1px solid ${block.badgeColor}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IconComponent size={24} color={block.badgeColor} />
                </div>

                {/* Texto do Bloco */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.92rem',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    lineHeight: '1.3',
                    marginBottom: '0.2rem'
                  }}>
                    {block.title}
                  </div>
                  {block.subtitle ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {block.subtitle}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <span>Clique para filtrar</span>
                      <ArrowRight size={12} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Resumo Rápido Operacional */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Card Resumo de Clientes e Acervo */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} />
              <span>Clientes & Acervo Registrado</span>
            </div>
            <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setActiveTab('clientes')}>
              Ver Clientes
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CLIENTES CADASTRADOS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>{clientes.length}</div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ORÇAMENTOS PENDENTES</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F59E0B' }}>{orcamentosPendentes}</div>
            </div>
          </div>
        </div>

        {/* Card Resumo Financeiro Rápido */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} />
              <span>Caixa & Fluxo Financeiro</span>
            </div>
            <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setActiveTab('financeiro')}>
              Ver Financeiro
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATUS DO CAIXA</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: caixaStatus === 'ABERTO' ? '#34D399' : '#F87171' }}>
                {caixaStatus === 'ABERTO' ? '● ABERTO' : '○ FECHADO'}
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RECEITAS DO MÊS</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#34D399' }}>
                R$ {receitasMes.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
