import React from 'react'
import { Home, Bell, Users, FileText, Calculator, DollarSign, Settings, UserCheck, Shield, X, Package, Wallet, ShoppingCart } from 'lucide-react'

export default function Sidebar({
  activeTab,
  setActiveTab,
  usuarioLogado,
  config,
  mobileOpen,
  setMobileOpen,
  ordens = [],
  orcamentos = [],
  estoque = [],
  caixas = [],
  alertas = []
}) {
  const permissoes = usuarioLogado?.permissoes || {}

  // Contagens dinâmicas dos badges
  const ordensEmAberto = (ordens || []).filter(o => o.status !== 'CONCLUÍDO').length
  const orcamentosPendentes = (orcamentos || []).filter(o => o.status === 'Pendente').length
  const estoqueBaixoCount = (estoque || []).filter(i => (i.quantidade || 0) <= (i.estoque_minimo || 2)).length
  const caixaHoje = (caixas || []).find(c => c.data === new Date().toISOString().split('T')[0])
  const perfilUsuario = usuarioLogado?.perfil || 'recepcao'
  const alertasValidos = (alertas || []).filter(a => {
    if (a.ordem_id || a.os_numero) {
      const os = (ordens || []).find(o => 
        String(o.id) === String(a.ordem_id) || 
        Number(o.numero_os) === Number(a.os_numero)
      )
      if (!os) return false
      
      // Auto-purgar alertas cujo status já mudou/andou
      if (a.status === 'PENDENTE') {
        const statusFlow = [
          'NÃO INICIADO', 'EM ANÁLISE', 'AGUARDANDO APROVAÇÃO',
          'APROVADO', 'EM MANUTENÇÃO', 'AGUARDANDO RETIRADA', 'CONCLUÍDO'
        ]
        let alertTriggerStatus = null
        if (a.tipo_alerta === 'AGUARDANDO APROVAÇÃO' || a.tipo_alerta === 'Pendente') {
          alertTriggerStatus = 'AGUARDANDO APROVAÇÃO'
        } else if (a.tipo_alerta === 'APROVADO') {
          alertTriggerStatus = 'APROVADO'
        } else if (a.tipo_alerta === 'EM MANUTENÇÃO') {
          alertTriggerStatus = 'EM MANUTENÇÃO'
        } else if (a.tipo_alerta === 'AGUARDANDO RETIRADA' || a.tipo_alerta === 'PRONTO PARA RETIRADA') {
          alertTriggerStatus = 'AGUARDANDO RETIRADA'
        }

        if (alertTriggerStatus) {
          const osIndex = statusFlow.indexOf(os.status)
          const alertIndex = statusFlow.indexOf(alertTriggerStatus)
          if (osIndex !== -1 && alertIndex !== -1 && osIndex > alertIndex) {
            return false
          }
        }
      }
    }
    
    // Filtragem Inteligente por Setor
    if (perfilUsuario !== 'master') {
      const dest = (a.destinatario || '').toUpperCase()
      if (perfilUsuario === 'armeiro') {
        if (dest && dest !== 'OFICINA' && dest !== 'TODOS' && a.tipo_alerta !== 'APROVADO') return false
      } else if (perfilUsuario === 'recepcao') {
        if (dest && dest !== 'RECEPCAO' && dest !== 'TODOS' && a.tipo_alerta === 'APROVADO') return false
      }
    }
    return true
  })
  const alertasPendentesCount = alertasValidos.filter(a => a.status === 'PENDENTE').length
  const caixaBadge = caixaHoje?.status === 'ABERTO' ? 'ABERTO' : null

  const menuItemsOriginal = [
    { id: 'home',          label: 'Home (Início)',     icon: Home,         badgeCount: ordensEmAberto || null,                  reqPerm: 'ver_home' },
    { id: 'alertas',       label: 'Painel de Alerta',  icon: Bell,         badgeCount: alertasPendentesCount > 0 ? `${alertasPendentesCount} Novo` : null, reqPerm: 'ver_alertas' },
    { id: 'caixa',         label: 'Caixa',              icon: Wallet,       badgeCount: caixaBadge,                              reqPerm: 'ver_caixa' },
    { id: 'ordens',        label: 'Ordem de Serviço',  icon: FileText,     badgeCount: ordensEmAberto || null,                  reqPerm: 'ver_ordens' },
    { id: 'vendas',        label: 'Vendas',             icon: ShoppingCart, badgeCount: null,                                    reqPerm: 'ver_vendas' },
    { id: 'clientes',      label: 'Clientes',          icon: Users,        badgeCount: null,                                    reqPerm: 'ver_clientes' },
    { id: 'estoque',       label: 'Estoque',            icon: Package,      badgeCount: estoqueBaixoCount > 0 ? `${estoqueBaixoCount} Alerta` : null, reqPerm: 'ver_estoque' },
    { id: 'orcamentos',    label: 'Orçamentos',         icon: Calculator,   badgeCount: orcamentosPendentes || null,            reqPerm: 'ver_orcamentos' },
    { id: 'financeiro',    label: 'Financeiro',         icon: DollarSign,   badgeCount: null,                                    reqPerm: 'ver_financeiro' },
    { id: 'usuarios',      label: 'Usuários',           icon: UserCheck,    badgeCount: null,                                    reqPerm: 'gerenciar_usuarios' },
    { id: 'configuracoes', label: 'Configurações',      icon: Settings,     badgeCount: null,                                    reqPerm: 'ver_configuracoes' },
  ]

  // Garante a ordem exata definida pelo ADM Master
  const defaultOrder = ['home', 'alertas', 'caixa', 'ordens', 'vendas', 'clientes', 'estoque', 'orcamentos', 'financeiro', 'usuarios', 'configuracoes']
  const ordemCustom = (config?.ordem_menu && Array.isArray(config.ordem_menu) && config.ordem_menu.length > 0)
    ? config.ordem_menu
    : defaultOrder

  const menuItemsMap = new Map(menuItemsOriginal.map(item => [item.id, item]))
  const orderedItems = []
  
  ordemCustom.forEach(id => {
    if (menuItemsMap.has(id)) {
      orderedItems.push(menuItemsMap.get(id))
      menuItemsMap.delete(id)
    }
  })
  menuItemsMap.forEach(item => orderedItems.push(item))

  const itemsFiltrados = orderedItems.filter(item => {
    if (!usuarioLogado || usuarioLogado?.perfil === 'master') return true
    if (!item.reqPerm) return true
    if (item.id === 'home') return true // Home sempre visível para todos
    if (item.id === 'vendas') return permissoes.ver_vendas !== false // Vendas visível por padrão
    return permissoes[item.reqPerm] === true
  })

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId)
    if (setMobileOpen) setMobileOpen(false)
  }

  const sidebarContent = (
    <aside 
      className="no-scrollbar"
      style={{
        width: '265px',
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto'
      }}
    >
      <div style={{ padding: '0.85rem 0.65rem 0.65rem 0.65rem' }}>
        {/* Mobile Header com Botão Fechar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'var(--text-muted)',
            fontWeight: '600'
          }}>
            Pró Guns Gestão
          </div>
          {setMobileOpen && (
            <button
              className="mobile-only"
              onClick={() => setMobileOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.18rem' }}>
          {itemsFiltrados.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? 'rgba(139, 38, 42, 0.18)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                  borderLeft: isActive ? '3px solid var(--red-light)' : '3px solid transparent',
                  fontWeight: isActive ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  transition: 'all 0.15s ease',
                  gap: '0.4rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', flex: 1, minWidth: 0 }}>
                  <Icon size={16} color={isActive ? '#F87171' : '#8E96A0'} style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                </div>
                {item.badgeCount && (
                  <span style={{
                    flexShrink: 0,
                    fontSize: '0.65rem',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '10px',
                    backgroundColor: item.badgeCount === 'ABERTO' ? '#10B981' : isActive ? 'var(--red-tactical)' : 'var(--border-color)',
                    color: '#FFFFFF',
                    fontWeight: '700',
                    lineHeight: '1.4'
                  }}>
                    {item.badgeCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer do Sidebar com a Logo Pequena e Dados da Armeria Dinâmicos */}
      <div style={{
        marginTop: 'auto',
        padding: '0.75rem 0.85rem',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'rgba(0,0,0,0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img
            src="/logo.png"
            alt="Logo Pró Guns"
            style={{ width: '28px', height: '28px', objectFit: 'contain' }}
          />
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-main)' }}>
              {config?.nome_fantasia || 'Pró Guns Armeria'}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {config?.cr_armeria || 'CR-998877/2ª RM'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {/* Sidebar Desktop padrão */}
      <div className="desktop-only" style={{ height: 'calc(100vh - 70px)', sticky: 'top' }}>
        {sidebarContent}
      </div>

      {/* Drawer Mobile Flutuante com Overlay */}
      {mobileOpen && (
        <div
          className="mobile-only"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ height: '100%', width: '275px', backgroundColor: 'var(--bg-card)' }}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
