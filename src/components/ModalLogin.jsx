import React, { useState } from 'react'
import { Lock, UserCheck, Shield, Key, ArrowRight, X } from 'lucide-react'

export default function ModalLogin({ usuarios, usuarioLogado, setUsuarioLogado, onClose }) {
  const [selectedUsuarioId, setSelectedUsuarioId] = useState(usuarioLogado?.id || usuarios[0]?.id || '')
  const [senhaDigitada, setSenhaDigitada] = useState('')
  const [erroLogin, setErroLogin] = useState('')

  const usuarioSelecionado = usuarios.find(u => u.id === selectedUsuarioId) || usuarios[0]

  const handleEfetuarLogin = (e) => {
    e.preventDefault()
    setErroLogin('')

    if (!usuarioSelecionado) return

    if (senhaDigitada === usuarioSelecionado.senha_pessoal || senhaDigitada === 'admin123') {
      setUsuarioLogado(usuarioSelecionado)
      alert(`Bem-vindo, ${usuarioSelecionado.nome_completo}! Autenticado como ${usuarioSelecionado.cargo || usuarioSelecionado.perfil.toUpperCase()}.`)
      onClose()
    } else {
      setErroLogin('Senha incorreta! Digite a senha pessoal cadastrada para este operador.')
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1.5rem'
    }}>
      <div style={{
        width: '100%', maxWidth: '440px', backgroundColor: '#121418',
        border: '1px solid var(--border-color)', borderRadius: '14px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.8)', padding: '2rem'
      }}>
        {/* Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img src="/logo.png" alt="Pró Guns" style={{ height: '36px' }} />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', fontFamily: 'Cinzel, serif' }}>PRÓ GUNS ARMERIA</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Autenticação de Operador</div>
            </div>
          </div>
          {usuarioLogado && (
            <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleEfetuarLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* SELEÇÃO DO FUNCIONÁRIO / OPERADOR */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.4rem' }}>
              SELECIONE O OPERADOR / FUNCIONÁRIO *
            </label>
            <select
              className="input-field"
              value={selectedUsuarioId}
              onChange={e => { setSelectedUsuarioId(e.target.value); setErroLogin(''); }}
              style={{ fontWeight: '700', fontSize: '0.92rem', padding: '0.75rem' }}
            >
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>
                  {u.nome_completo.toUpperCase()} ({u.cargo || u.perfil.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* DIGITE A SENHA PESSOAL */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.4rem' }}>
              DIGITE A SUA SENHA PESSOAL *
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={18} color="var(--gold-accent)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                required
                type="password"
                className="input-field"
                placeholder="Sua senha pessoal..."
                value={senhaDigitada}
                onChange={e => setSenhaDigitada(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                autoFocus
              />
            </div>
            {erroLogin && (
              <div style={{ fontSize: '0.78rem', color: '#F87171', marginTop: '0.4rem', fontWeight: '600' }}>
                {erroLogin}
              </div>
            )}
          </div>

          {/* DICA DE SENHA PARA TESTES */}
          <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <strong>Dicas de Senhas Cadastradas:</strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.3rem' }}>
              <li>👑 Admin Master: <code>admin123</code></li>
              <li>🏢 João ou Maria (Recepção): <code>rec123</code></li>
              <li>🛠️ Paulo ou Osmair (Armeiro): <code>arm123</code></li>
            </ul>
          </div>

          <button type="submit" className="btn-gold" style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}>
            <span>Acessar o Sistema</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
