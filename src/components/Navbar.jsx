import React from 'react'
import { ShieldCheck, Search, Bell, Database, CheckCircle2, AlertTriangle } from 'lucide-react'
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
      height: '65px',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldCheck size={26} color="var(--gold-primary)" />
          <span className="brand-font" style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--gold-primary)' }}>
            PRÓ GUNS
          </span>
          <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--border-color)', color: 'var(--text-muted)', fontWeight: '600' }}>
            ARMERIA & DESPACHANTARIA
          </span>
        </div>

        <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border-color)' }}></div>

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
          padding: '0.3rem 0.7rem',
          borderRadius: '20px',
          backgroundColor: isSupabaseConfigured ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          border: `1px solid ${isSupabaseConfigured ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
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
            backgroundColor: 'var(--gold-primary)'
          }}></span>
        </div>
      </div>
    </header>
  )
}
