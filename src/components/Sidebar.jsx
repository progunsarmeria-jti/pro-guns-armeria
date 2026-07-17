import React from 'react'
import { Users, FileText, Calculator, DollarSign, Settings, Shield, Crosshair } from 'lucide-react'

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'clientes', label: 'Clientes', icon: Users, badgeCount: null },
    { id: 'ordens', label: 'Ordens', icon: FileText, badgeCount: '3' },
    { id: 'orcamentos', label: 'Orçamentos', icon: Calculator, badgeCount: '2' },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign, badgeCount: null },
    { id: 'configuracoes', label: 'Configurações', icon: Settings, badgeCount: null },
  ]

  return (
    <aside style={{
      width: '240px',
      backgroundColor: 'var(--bg-card)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'calc(100vh - 65px)'
    }}>
      <div style={{ padding: '1.5rem 1.25rem 1rem 1.25rem' }}>
        <div style={{
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: 'var(--text-muted)',
          fontWeight: '600',
          marginBottom: '0.75rem'
        }}>
          Portal G-CAC - Pró Guns
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  padding: '0.75rem 0.9rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--gold-glow)' : 'transparent',
                  color: isActive ? 'var(--gold-primary)' : 'var(--text-muted)',
                  borderLeft: isActive ? '3px solid var(--gold-primary)' : '3px solid transparent',
                  fontWeight: isActive ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '0.92rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon size={18} color={isActive ? 'var(--gold-primary)' : '#8E8EA0'} />
                  <span>{item.label}</span>
                </div>
                {item.badgeCount && (
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '10px',
                    backgroundColor: isActive ? 'var(--gold-primary)' : 'var(--border-color)',
                    color: isActive ? '#0A0A0C' : 'var(--text-main)',
                    fontWeight: '700'
                  }}>
                    {item.badgeCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      <div style={{
        marginTop: 'auto',
        padding: '1.25rem',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--gold-glow)',
            border: '1px solid var(--border-gold)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center'
          }}>
            <Crosshair size={18} color="var(--gold-primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
              Pró Guns Armeria
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              CR-998877/2ª RM
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
