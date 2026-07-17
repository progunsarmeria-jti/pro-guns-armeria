import React from 'react'
import { Bell, Database } from 'lucide-react'
import { isSupabaseConfigured } from '../lib/supabase'

export default function Navbar({ activeTab }) {
  const titles = {
    clientes: 'Clientes (CACs & Acervo)',
    ordens: 'Ordens de Serviço (Processos GCAC)',
    orcamentos: 'Orçamentos & Propostas',
    financeiro: 'Financeiro & Fluxo de Caixa',
    configuracoes: 'Configurações do Sistema'
  }

  return (
    <header style={{
      height: '70px',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justify: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Logo Oficial Pró Guns Armeria */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src="/logo.png"
            alt="Pró Guns Armeria Logo"
            style={{ height: '48px', objectFit: 'contain' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="brand-font" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#34D399', letterSpacing: '0.5px' }}>
                PRÓ
              </span>
              <span className="brand-font" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#F87171', letterSpacing: '0.5px' }}>
                GUNS
              </span>
            </div>
            <span style={{ fontSize: '0.68rem', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              ARMERIA & DESPACHANTARIA
            </span>
          </div>
        </div>

        <div style={{ height: '28px', width: '1px', backgroundColor: 'var(--border-color)' }}></div>

        <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)' }}>
          {titles[activeTab] || 'Gestão G-CAC'}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Supabase Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.78rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '20px',
          backgroundColor: isSupabaseConfigured ? 'rgba(52, 211, 153, 0.12)' : 'rgba(245, 158, 11, 0.12)',
          border: `1px solid ${isSupabaseConfigured ? 'rgba(52, 211, 153, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
          color: isSupabaseConfigured ? '#34D399' : '#FBBF24'
        }}>
          <Database size={14} />
          <span>{isSupabaseConfigured ? 'Supabase Conectado' : 'Modo Demonstrativo Local'}</span>
        </div>

        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          cursor: 'pointer',
          position: 'relative'
        }}>
          <Bell size={18} color="var(--text-muted)" />
          <span style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--red-light)'
          }}></span>
        </div>
      </div>
    </header>
  )
}
