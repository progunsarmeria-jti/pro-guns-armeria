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
  const alertasValidos = (alertas || []).filter(a => {
    if (a.ordem_id || a.os_numero) {
      return (ordens || []).some(o => 
        String(o.id) === String(a.ordem_id) || 
        Number(o.numero_os) === Number(a.os_numero)
      )
    }
    return true
  })
  const alertasPendentesCount = alertasValidos.filter(a => a.status === 'PENDENTE').length
  const caixaBadge = caixaHoje?.status === 'ABERTO' ? 'ABERTO' : null

  const menuItemsOriginal = [
    { id: 'home',          label: 'Home (Início)',     icon: Home,         badgeCount: ordensEmAberto || null,                  reqPerm: 'ver_home' },
    { id: 'caixa',         label: 'Caixa',              icon: Wallet,       badgeCount: caixaBadge,                              reqPerm: 'ver_caixa' },
    { id: 'clientes',      label: 'Clientes',          icon: Users,        badgeCount: null,                                    reqPerm: 'ver_clientes' },
    { id: 'configuracoes', label: 'Configurações',      icon: Settings,     badgeCount: null,                                    reqPerm: 'ver_configuracoes' },
    { id: 'estoque',       label: 'Estoque',            icon: Package,      badgeCount: estoqueBaixoCount > 0 ? `${estoqueBaixoCount} Alerta` : null, reqPerm: 'ver_estoque' },
    { id: 'financeiro',    label: 'Financeiro',         icon: DollarSign,   badgeCount: null,                                    reqPerm: 'ver_financeiro' },
    { id: 'orcamentos',    label: 'Orçamentos',         icon: Calculator,   badgeCount: orcamentosPendentes || null,            reqPerm: 'ver_orcamentos' },
    { id: 'ordens',        label: 'Ordem de Serviço',  icon: FileText,     badgeCount: ordensEmAberto || null,                  reqPerm: 'ver_ordens' },
    { id: 'alertas',       label: 'Painel de Alerta',  icon: Bell,         badgeCount: alertasPendentesCount > 0 ? `${alertasPendentesCount} Novo` : null, reqPerm: 'ver_alertas' },
    { id: 'usuarios',      label: 'Usuários',           icon: UserCheck,    badgeCount: null,                                    reqPerm: 'gerenciar_usuarios' },
    { id: 'vendas',        label: 'Vendas',             icon: ShoppingCart, badgeCount: null,                                    reqPerm: 'ver_vendas' },
  ]

  // Garante a ordem exata definida pelo ADM Master
  const ordemCustom = (config?.ordem_menu && Array.isArray(config.ordem_menu) && config.ordem_menu.length > 0)
    ? config.ordem_menu
    : ['home', 'caixa', 'clientes', 'configuracoes', 'estoque', 'financeiro', 'orcamentos', 'ordens', 'alertas', 'usuarios', 'vendas']

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
    <aside style={{
      width: '265px',
      backgroundColor: 'var(--bg-card)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div style={{ padding: '1.25rem 0.85rem 1rem 0.85rem' }}>
        {/* Mobile Header com Botão Fechar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
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

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
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
                  padding: '0.65rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? 'rgba(139, 38, 42, 0.18)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                  borderLeft: isActive ? '3px solid var(--red-light)' : '3px solid transparent',
                  fontWeight: isActive ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.15s ease',
                  gap: '0.4rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden', flex: 1, minWidth: 0 }}>
                  <Icon size={17} color={isActive ? '#F87171' : '#8E96A0'} style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                </div>
                {item.badgeCount && (
                  <span style={{
                    flexShrink: 0,
                    fontSize: '0.68rem',
                    padding: '0.12rem 0.42rem',
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
        padding: '1.25rem',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'rgba(0,0,0,0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src="/logo.png"
            alt="Logo Pró Guns"
            style={{ width: '36px', height: '36px', objectFit: 'contain' }}
          />
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
              {config?.nome_fantasia || 'Pró Guns Armeria'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
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
