import React, { useState, useEffect } from 'react'
import { Settings, Building, Database, Save, CheckCircle2, Copy, Shield, Key } from 'lucide-react'
import { isSupabaseConfigured, saveSupabaseKeys, clearSupabaseKeys } from '../lib/supabase'

export default function ModuloConfiguracoes({ config, setConfig }) {
  const [formData, setFormData] = useState(config)
  const [supaUrl, setSupaUrl] = useState(localStorage.getItem('PROGUNS_SUPABASE_URL') || '')
  const [supaKey, setSupaKey] = useState(localStorage.getItem('PROGUNS_SUPABASE_ANON_KEY') || '')
  const [salvoFeedback, setSalvoFeedback] = useState(false)

  useEffect(() => {
    if (config) {
      setFormData(config)
    }
  }, [config])

  const handleSalvarConfig = (e) => {
    e.preventDefault()
    setConfig(formData)
    setSalvoFeedback(true)
    setTimeout(() => setSalvoFeedback(false), 3000)
  }

  const handleConectarSupabase = (e) => {
    e.preventDefault()
    if (!supaUrl || !supaKey) {
      alert('Por favor, preencha tanto a URL quanto a Anon Key do Supabase!')
      return
    }
    saveSupabaseKeys(supaUrl, supaKey)
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gold-primary)' }}>
          Configurações da Armeria & Conexões
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Dados cadastrais da Pró Guns Armeria, responsável técnico e conexão com o Supabase.
        </p>
      </div>

      {/* Card Conexão Supabase */}
      <div className="card" style={{ border: isSupabaseConfigured ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-gold)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Database size={22} color={isSupabaseConfigured ? '#34D399' : 'var(--gold-primary)'} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '700' }}>
            Conexão com Banco de Dados Supabase
          </h3>
          {isSupabaseConfigured ? (
            <span className="badge badge-green">CONECTADO</span>
          ) : (
            <span className="badge badge-yellow">DEMO LOCAL</span>
          )}
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Para sincronizar seus clientes, armas e ordens de serviço diretamente no banco de dados Supabase da Pró Guns Armeria, cole suas chaves abaixo.
        </p>

        <form onSubmit={handleConectarSupabase} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Project URL do Supabase</label>
            <input
              type="text"
              className="input-field"
              placeholder="https://xxxxxxxxxxxx.supabase.co"
              value={supaUrl}
              onChange={e => setSupaUrl(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>API Anon Key (Public Key)</label>
            <input
              type="password"
              className="input-field"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supaKey}
              onChange={e => setSupaKey(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn-gold">
              <Key size={16} />
              <span>{isSupabaseConfigured ? 'Atualizar Conexão' : 'Conectar ao Supabase'}</span>
            </button>

            {isSupabaseConfigured && (
              <button type="button" className="btn-secondary" onClick={clearSupabaseKeys} style={{ color: '#F87171' }}>
                Desconectar
              </button>
            )}
          </div>
        </form>

        {/* Passo para criar as tabelas */}
        <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--gold-primary)' }}>💡 Dica Importante para o Supabase:</strong>
          <p style={{ marginTop: '0.4rem' }}>
            Não se esqueça de copiar o conteúdo do arquivo <code>supabase_schema.sql</code> (gerado no seu projeto) e colá-lo no <strong>SQL Editor</strong> do painel Supabase para criar todas as tabelas automaticamente!
          </p>
        </div>
      </div>

      {/* Card Dados da Armeria */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Building size={22} color="var(--gold-primary)" />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '700' }}>
            Dados Institucionais da Armeria
          </h3>
        </div>

        <form onSubmit={handleSalvarConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nome Fantasia</label>
              <input className="input-field" value={formData.nome_fantasia || ''} onChange={e => setFormData({...formData, nome_fantasia: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Razão Social</label>
              <input className="input-field" value={formData.razao_social || ''} onChange={e => setFormData({...formData, razao_social: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CNPJ</label>
              <input className="input-field" value={formData.cnpj || ''} onChange={e => setFormData({...formData, cnpj: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>N° CR da Armeria</label>
              <input className="input-field" value={formData.cr_armeria || ''} onChange={e => setFormData({...formData, cr_armeria: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Região Militar</label>
              <input className="input-field" value={formData.rm_armeria || ''} onChange={e => setFormData({...formData, rm_armeria: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Telefone / WhatsApp</label>
              <input className="input-field" value={formData.whatsapp || ''} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>E-mail Oficial</label>
              <input className="input-field" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Endereço Completo</label>
            <input className="input-field" value={formData.endereco || ''} onChange={e => setFormData({...formData, endereco: e.target.value})} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            {salvoFeedback && (
              <span style={{ fontSize: '0.85rem', color: '#34D399', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle2 size={16} /> Dados salvos com sucesso!
              </span>
            )}
            <button type="submit" className="btn-gold">
              <Save size={16} />
              <span>Salvar Configurações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
