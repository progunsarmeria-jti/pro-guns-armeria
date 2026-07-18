import React, { useState } from 'react'
import { Bell, Database, Shield, Wrench, Check, X, MessageCircle, UserCheck, LogOut, Key } from 'lucide-react'
import { isSupabaseConfigured } from '../lib/supabase'

export default function Navbar({
  activeTab,
  usuarioLogado,
  setModalLoginAberto,
  handleLogoff,
  notificacoes,
  setNotificacoes,
  setActiveTab,
  config
}) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)

  const titles = {
    clientes: 'Clientes (CACs & Acervo)',
    ordens: 'Ordens de Serviço (Armeria & Manutenção)',
    orcamentos: 'Orçamentos & Propostas',
    financeiro: 'Financeiro & Fluxo de Caixa',
    usuarios: 'Gestão de Usuários & Permissões',
    configuracoes: 'Configurações do Sistema'
  }

  const naoLidas = notificacoes.filter(n => !n.lida).length

  const handleMarcarTodasLidas = () => {
    setNotificacoes(notificacoes.map(n => ({ ...n, lida: true })))
  }

  const getPerfilBadge = () => {
    if (!usuarioLogado) return { label: 'Visitante', color: '#8E96A0' }
    if (usuarioLogado.perfil === 'master') return { label: '👑 Master (Diretor)', color: '#FBBF24' }
    if (usuarioLogado.perfil === 'recepcao') return { label: '🏢 Recepção', color: '#F87171' }
    return { label: '🛠️ Armeiro (Oficina)', color: '#34D399' }
  }

  const badge = getPerfilBadge()

  return (
    <header style={{
      height: '70px',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* LADO ESQUERDO: LOGO & TÍTULO DA ABA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Logo Oficial Pró Guns Armeria */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src="/logo.png"
            alt="Pró Guns Armeria Logo"
            style={{ height: '44px', objectFit: 'contain' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="brand-font" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#34D399', letterSpacing: '0.5px' }}>
                PRÓ
              </span>
              <span className="brand-font" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#F87171', letterSpacing: '0.5px' }}>
                GUNS
              </span>
            </div>
            <span style={{ fontSize: '0.65rem', letterSpacing: '2.5px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', textAlign: 'center', width: '100%' }}>
              ARMERIA
            </span>
          </div>
        </div>

        <div style={{ height: '28px', width: '1px', backgroundColor: 'var(--border-color)' }}></div>

        <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>
          {titles[activeTab] || 'Gestão G-CAC'}
        </h2>
      </div>

      {/* LADO DIREITO: OPERADOR, LOGOFF, MODO BANCO E SININHO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginLeft: 'auto' }}>
        {/* CRACHÁ DO OPERADOR AUTENTICADO */}
        {usuarioLogado && (
          <div
            onClick={() => setModalLoginAberto(true)}
            title="Clique para alternar operador"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              backgroundColor: 'var(--bg-input)',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              padding: '0.35rem 0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <UserCheck size={16} color={badge.color} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1.2' }}>
                {usuarioLogado.nome_completo.split(' ')[0]}
              </span>
              <span style={{ fontSize: '0.65rem', color: badge.color, fontWeight: '700' }}>
                {badge.label}
              </span>
            </div>
            <Key size={12} color="var(--text-muted)" style={{ marginLeft: '0.2rem' }} />
          </div>
        )}

        {/* BOTÃO DE SAIR / LOGOFF */}
        {usuarioLogado && (
          <button
            onClick={handleLogoff}
            title="Sair / Bloquear Tela de Login"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              cursor: 'pointer',
              color: '#F87171',
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={16} />
          </button>
        )}

        {/* SUPABASE STATUS BADGE */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '20px',
          backgroundColor: isSupabaseConfigured ? 'rgba(52, 211, 153, 0.12)' : 'rgba(245, 158, 11, 0.12)',
          border: `1px solid ${isSupabaseConfigured ? 'rgba(52, 211, 153, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
          color: isSupabaseConfigured ? '#34D399' : '#FBBF24'
        }}>
          <Database size={13} />
          <span>{isSupabaseConfigured ? 'Supabase' : 'Local'}</span>
        </div>

        {/* SININHO DE NOTIFICAÇÕES EM TEMPO REAL */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            style={{
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
            }}
          >
            <Bell size={18} color={naoLidas > 0 ? '#F87171' : 'var(--text-muted)'} />
            {naoLidas > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#F87171',
                color: '#FFFFFF',
                fontSize: '0.68rem',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justify: 'center'
              }}>
                {naoLidas}
              </span>
            )}
          </div>

          {/* Dropdown de Notificações */}
          {showNotifDropdown && (
            <div style={{
              position: 'absolute',
              top: '120%',
              right: 0,
              width: '340px',
              backgroundColor: '#161920',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
              zIndex: 200,
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>Central de Alertas</span>
                {naoLidas > 0 && (
                  <button onClick={handleMarcarTodasLidas} style={{ background: 'none', border: 'none', color: '#60A5FA', fontSize: '0.72rem', cursor: 'pointer' }}>
                    Marcar lidas
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '280px', overflowY: 'auto' }}>
                {notificacoes.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                    Nenhum alerta no momento.
                  </div>
                ) : (
                  notificacoes.map(n => (
                    <div
                      key={n.id}
                      onClick={() => { setActiveTab('ordens'); setShowNotifDropdown(false); }}
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: '6px',
                        backgroundColor: n.lida ? 'var(--bg-dark)' : 'rgba(139, 38, 42, 0.2)',
                        border: n.lida ? '1px solid var(--border-color)' : '1px solid rgba(248, 113, 113, 0.4)',
                        cursor: 'pointer',
                        fontSize: '0.78rem'
                      }}
                    >
                      <div style={{ fontWeight: '700', color: n.lida ? 'var(--text-main)' : '#F87171' }}>
                        OS #{n.os_numero} — {n.cliente_nome}
                      </div>
                      <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem', fontSize: '0.74rem' }}>
                        {n.mensagem}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#60A5FA', marginTop: '0.3rem', textAlign: 'right' }}>
                        {n.created_at} — Clique para abrir
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
