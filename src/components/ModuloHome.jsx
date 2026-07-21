import React from 'react'
import { INITIAL_CONFIG } from '../lib/initialData'
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
  usuarioLogado,
  config,
  setActiveTab,
  setFiltroStatusOrdens
}) {
  const permissoes = usuarioLogado?.permissoes || {}
  const isMaster = usuarioLogado?.perfil === 'master'
  const perfilAtual = usuarioLogado?.perfil || 'recepcao'
  const regrasBlocos = config?.blocos_home || INITIAL_CONFIG?.blocos_home || []

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

  // Definição dos blocos de atalho estilo Shooting House (filtrados por permissão e configuração do ADM)
  const allStatusBlocks = [
    {
      id: 'aguardando_aprovacao',
      title: 'O.S. Aguardando Aprovação',
      badgeCount: osAguardandoAprovacao,
      badgeColor: '#F59E0B', // Amarelo/Laranja
      icon: Clock,
      onClick: () => handleNavegarOrdens('AGUARDANDO APROVAÇÃO'),
      reqPerm: 'ver_ordens'
    },
    {
      id: 'aguardando_retirada',
      title: 'O.S. Aguardando Retirada',
      badgeCount: osAguardandoRetirada,
      badgeColor: '#10B981', // Verde
      icon: CheckCircle2,
      onClick: () => handleNavegarOrdens('AGUARDANDO RETIRADA'),
      reqPerm: 'ver_ordens'
    },
    {
      id: 'em_analise',
      title: 'O.S. Em Análise',
      badgeCount: osEmAnalise,
      badgeColor: '#3B82F6', // Azul
      icon: FileText,
      onClick: () => handleNavegarOrdens('EM ANÁLISE'),
      reqPerm: 'ver_ordens'
    },
    {
      id: 'nao_iniciado',
      title: 'O.S. Não Iniciado',
      badgeCount: osNaoIniciado,
      badgeColor: '#8B5CF6', // Roxo/Cinza
      icon: AlertCircle,
      onClick: () => handleNavegarOrdens('NÃO INICIADO'),
      reqPerm: 'ver_ordens'
    },
    {
      id: 'em_manutencao',
      title: 'O.S. Em Manutenção',
      badgeCount: osEmManutencao,
      badgeColor: '#06B6D4', // Ciano
      icon: Wrench,
      onClick: () => handleNavegarOrdens('EM MANUTENÇÃO'),
      reqPerm: 'ver_ordens'
    },
    {
      id: 'bloco_estoque',
      title: 'Estoque de Peças & Insumos',
      badgeCount: estoqueBaixoCount > 0 ? `${estoqueBaixoCount} ALERTA` : `${estoque.length} ITENS`,
      badgeColor: estoqueBaixoCount > 0 ? '#EF4444' : '#3B82F6',
      icon: Package,
      subtitle: `${estoque.length} peças cadastradas`,
      onClick: () => setActiveTab('estoque'),
      reqPerm: 'ver_estoque'
    },
    {
      id: 'bloco_caixa',
      title: 'Caixa da Recepção',
      badgeCount: caixaStatus,
      badgeColor: caixaStatus === 'ABERTO' ? '#10B981' : '#6B7280',
      icon: Wallet,
      subtitle: caixaHoje ? `${caixaHoje.movimentacoes?.length || 0} mov. hoje` : 'Sem caixa aberto',
      onClick: () => setActiveTab('caixa'),
      reqPerm: 'ver_caixa'
    },
    {
      id: 'bloco_financeiro',
      title: 'Controle Financeiro & DRE',
      badgeCount: `R$ ${receitasMes.toFixed(2)}`,
      badgeColor: '#D4AF37', // Dourado
      icon: DollarSign,
      subtitle: 'Receitas acumuladas',
      onClick: () => setActiveTab('financeiro'),
      reqPerm: 'ver_financeiro'
    }
  ]

  // Função auxiliar para verificar permissão do bloco pelo perfil do usuário e configuração do ADM
  const isBlocoPermitidoNoHome = (blockId, reqPermDefault) => {
    const cfg = regrasBlocos.find(b => b.id === blockId)
    if (cfg) {
      if (cfg.ativado === false) return false
      if (Array.isArray(cfg.perfis) && cfg.perfis.length > 0) {
        if (!cfg.perfis.includes(perfilAtual) && perfilAtual !== 'master') {
          return false
        }
      }
    }

    if (isMaster) return true
    if (!reqPermDefault) return true
    if (reqPermDefault === 'ver_ordens') return permissoes.ver_ordens !== false
    if (reqPermDefault === 'ver_estoque') return permissoes.ver_estoque !== false
    return permissoes[reqPermDefault] === true
  }

  const statusBlocks = allStatusBlocks.filter(block => isBlocoPermitidoNoHome(block.id, block.reqPerm))

  const podeDarEntradaOS = isMaster || (permissoes.dar_entrada_os !== false && permissoes.ver_ordens !== false)
  const podeAbrirCaixa = isMaster || (permissoes.ver_caixa === true || permissoes.gerenciar_caixa === true)
  const podeVerClientes = isBlocoPermitidoNoHome('bloco_clientes_resumo', 'ver_clientes') && (isMaster || permissoes.ver_clientes !== false)
  const podeVerFinanceiroOuCaixa = isBlocoPermitidoNoHome('bloco_fluxo_resumo', 'ver_financeiro') && (isMaster || permissoes.ver_financeiro === true || permissoes.ver_caixa === true)

  return (
    <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header do Painel Principal */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        backgroundColor: 'var(--bg-card)',
        padding: '0.85rem 1.1rem',
        borderRadius: '10px',
        border: '1px solid var(--border-color)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.1rem' }}>
            <span style={{
              backgroundColor: 'rgba(212, 175, 55, 0.15)',
              color: 'var(--gold-primary)',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.68rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Painel de Gestão
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shooting House Style</span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
            Tela Inicial & Atalhos
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {podeDarEntradaOS && (
            <button className="btn-gold" onClick={() => setActiveTab('ordens')} style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
              <Plus size={15} />
              <span>Nova O.S. Armeria</span>
            </button>
          )}
          {podeAbrirCaixa && (
            <button className="btn-secondary" onClick={() => setActiveTab('caixa')} style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
              <Wallet size={15} />
              <span>Abrir Caixa</span>
            </button>
          )}
        </div>
      </div>

      {/* Seção Atalhos e Blocos de Status (Estilo Shooting House) */}
      <div>
        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--gold-primary)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Clock size={16} />
          <span>Status das Ordens de Serviço & Módulos</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: '0.75rem'
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
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  padding: '0.75rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.borderColor = block.badgeColor
                  e.currentTarget.style.boxShadow = `0 4px 12px ${block.badgeColor}22`
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
                  top: '-8px',
                  right: '10px',
                  backgroundColor: block.badgeColor,
                  color: '#FFFFFF',
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  padding: '0.12rem 0.5rem',
                  borderRadius: '12px',
                  boxShadow: `0 2px 6px ${block.badgeColor}66`,
                  border: '2px solid var(--bg-card)',
                  letterSpacing: '0.2px'
                }}>
                  {block.badgeCount}
                </div>

                {/* Ícone */}
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: `${block.badgeColor}18`,
                  border: `1px solid ${block.badgeColor}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IconComponent size={18} color={block.badgeColor} />
                </div>

                {/* Texto do Bloco */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    lineHeight: '1.2',
                    marginBottom: '0.15rem'
                  }}>
                    {block.title}
                  </div>
                  {block.subtitle ? (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {block.subtitle}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <span>Clique para filtrar</span>
                      <ArrowRight size={11} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Resumo Rápido Operacional (Filtrado por Permissões) */}
      {(podeVerClientes || podeVerFinanceiroOuCaixa) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
          {/* Card Resumo de Clientes e Acervo */}
          {podeVerClientes && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.85rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={16} />
                  <span>Clientes & Acervo Registrado</span>
                </div>
                <button className="btn-secondary" style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }} onClick={() => setActiveTab('clientes')}>
                  Ver Clientes
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>CLIENTES CADASTRADOS</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>{clientes.length}</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>ORÇAMENTOS PENDENTES</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#F59E0B' }}>{orcamentosPendentes}</div>
                </div>
              </div>
            </div>
          )}

          {/* Card Resumo Financeiro Rápido */}
          {podeVerFinanceiroOuCaixa && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.85rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <TrendingUp size={16} />
                  <span>Caixa & Fluxo Financeiro</span>
                </div>
                <button className="btn-secondary" style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }} onClick={() => setActiveTab('financeiro')}>
                  Ver Financeiro
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>STATUS DO CAIXA</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: caixaStatus === 'ABERTO' ? '#34D399' : '#F87171' }}>
                    {caixaStatus === 'ABERTO' ? '● ABERTO' : '○ FECHADO'}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>RECEITAS DO MÊS</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#34D399' }}>
                    R$ {receitasMes.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
