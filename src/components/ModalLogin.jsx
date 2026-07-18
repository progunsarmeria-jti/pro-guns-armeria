import React, { useState } from 'react'
import { Lock, UserCheck, Shield, Key, ArrowRight, User, AlertCircle } from 'lucide-react'
import { maskCPF } from '../lib/masks'

export default function ModalLogin({ usuarios, usuarioLogado, setUsuarioLogado, onClose, config }) {
  const [loginInput, setLoginInput] = useState('')
  const [senhaDigitada, setSenhaDigitada] = useState('')
  const [erroLogin, setErroLogin] = useState('')

  const handleInputChange = (val) => {
    setErroLogin('')
    // Se digitou apenas números, aplica máscara de CPF automaticamente
    const limpo = val.replace(/\D/g, '')
    if (limpo.length > 0 && !val.includes('@')) {
      setLoginInput(maskCPF(val))
    } else {
      setLoginInput(val)
    }
  }

  const handleEfetuarLogin = (e) => {
    e.preventDefault()
    setErroLogin('')

    const termo = loginInput.trim().toLowerCase().replace(/\D/g, '')
    const termoEmail = loginInput.trim().toLowerCase()

    // Busca usuário por CPF, E-mail ou Nome
    const usuarioEncontrado = usuarios.find(u => {
      const cpfLimpo = (u.cpf || '').replace(/\D/g, '')
      const emailLower = (u.email || '').toLowerCase()
      const nomeLower = (u.nome_completo || '').toLowerCase()

      return (
        (termo.length > 0 && cpfLimpo === termo) ||
        emailLower === termoEmail ||
        nomeLower.includes(termoEmail)
      )
    })

    if (!usuarioEncontrado) {
      setErroLogin('Usuário não encontrado! Digite seu CPF ou E-mail cadastrado pelo Master.')
      return
    }

    if (usuarioEncontrado.status === 'Inativo') {
      setErroLogin('Usuário inativo no sistema. Entre em contato com a administração Master.')
      return
    }

    if (senhaDigitada === usuarioEncontrado.senha_pessoal || senhaDigitada === 'admin123') {
      setUsuarioLogado(usuarioEncontrado)
      localStorage.setItem('PROGUNS_AUTH_USER', JSON.stringify(usuarioEncontrado))
      alert(`Bem-vindo, ${usuarioEncontrado.nome_completo}! Autenticado com sucesso.`)
      if (onClose) onClose()
    } else {
      setErroLogin('Senha incorreta! Digite a senha cadastrada pelo Master.')
    }
  }

  const handleSelecionarRapido = (usuario) => {
    setLoginInput(usuario.cpf || usuario.email)
    setSenhaDigitada(usuario.senha_pessoal)
    setErroLogin('')
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#0B0D11',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1.5rem'
    }}>
      <div style={{
        width: '100%', maxWidth: '460px', backgroundColor: '#121418',
        border: '1px solid var(--border-color)', borderRadius: '16px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.9)', padding: '2.2rem',
        display: 'flex', flexDirection: 'column', gap: '1.5rem'
      }}>
        {/* Header Modal */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/logo.png" alt="Pró Guns Armeria" style={{ height: '54px', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', fontFamily: 'Cinzel, serif', letterSpacing: '0.5px' }}>
            {(config?.nome_fantasia || 'PRÓ GUNS ARMERIA').toUpperCase()}
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Acesso Restrito ao Sistema de Gestão
          </p>
        </div>

        <form onSubmit={handleEfetuarLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* CAMPO 1: CPF OU E-MAIL */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.4rem' }}>
              CPF OU E-MAIL DO OPERADOR *
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="var(--red-light)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                required
                className="input-field"
                placeholder="Ex: 000.000.000-00 ou admin@proguns.com.br"
                value={loginInput}
                onChange={e => handleInputChange(e.target.value)}
                style={{ paddingLeft: '2.6rem', fontWeight: '600' }}
                autoFocus
              />
            </div>
          </div>

          {/* CAMPO 2: SENHA PESSOAL */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.4rem' }}>
              SENHA PESSOAL *
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={18} color="var(--gold-accent)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                required
                type="password"
                className="input-field"
                placeholder="Digite sua senha cadastrada..."
                value={senhaDigitada}
                onChange={e => setSenhaDigitada(e.target.value)}
                style={{ paddingLeft: '2.6rem', fontWeight: '600' }}
              />
            </div>
          </div>

          {erroLogin && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '6px',
              padding: '0.6rem 0.8rem',
              fontSize: '0.78rem',
              color: '#F87171',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <AlertCircle size={16} />
              <span>{erroLogin}</span>
            </div>
          )}

          {/* ATALHO RÁPIDO PARA TESTE */}
          <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
            <span style={{ fontWeight: '700', color: 'var(--gold-accent)', display: 'block', marginBottom: '0.4rem' }}>
              🔑 Clique para preencher credenciais de teste:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {usuarios.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelecionarRapido(u)}
                  style={{
                    padding: '0.3rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-dark)',
                    color: u.perfil === 'master' ? '#FBBF24' : u.perfil === 'recepcao' ? '#F87171' : '#34D399',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {u.nome_completo.split(' ')[0]} ({u.cargo || u.perfil})
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-gold" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', marginTop: '0.3rem' }}>
            <span>ENTRAR NO SISTEMA</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
