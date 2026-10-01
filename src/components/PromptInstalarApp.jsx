import React, { useState, useEffect } from 'react'
import { Download, Smartphone, Monitor, Share2, PlusSquare, CheckCircle2, X, Sparkles, ArrowRight } from 'lucide-react'

export default function PromptInstalarApp() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showModalInstrucoes, setShowModalInstrucoes] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [plataforma, setPlataforma] = useState('desktop') // 'ios' | 'android' | 'desktop'

  useEffect(() => {
    // 1. Detectar se o aplicativo já está em modo standalone (instalado)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')

    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // 2. Detectar Sistema Operacional / Dispositivo
    const ua = navigator.userAgent || ''
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream
    const isAndroidDevice = /android/i.test(ua)

    if (isIOSDevice) {
      setPlataforma('ios')
    } else if (isAndroidDevice) {
      setPlataforma('android')
    } else {
      setPlataforma('desktop')
    }

    // 3. Capturar o evento nativo beforeinstallprompt (Chrome, Edge, Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)

      // Verificar se o usuário já dispensou o banner nas últimas 24 horas
      const dispensadoEm = localStorage.getItem('PROGUNS_INSTALL_DISMISSED')
      const umDiaEmMs = 24 * 60 * 60 * 1000
      if (!dispensadoEm || Date.now() - parseInt(dispensadoEm, 10) > umDiaEmMs) {
        setShowBanner(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // 4. Capturar confirmação de instalação realizada
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowBanner(false)
      setDeferredPrompt(null)
      setShowModalInstrucoes(false)
      console.log('PWA Pró Guns Armeria instalado com sucesso!')
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    // 5. Escutar gatilhos de clique em botões de instalação (Navbar, Sidebar)
    const handleCustomTrigger = () => {
      handleDispararInstalacao()
    }
    window.addEventListener('proguns:prompt-install', handleCustomTrigger)

    // No iOS, se não estiver instalado e não dispensado, exibe o banner
    if (isIOSDevice && !isStandalone) {
      const dispensadoEm = localStorage.getItem('PROGUNS_INSTALL_DISMISSED')
      const umDiaEmMs = 24 * 60 * 60 * 1000
      if (!dispensadoEm || Date.now() - parseInt(dispensadoEm, 10) > umDiaEmMs) {
        // Aguarda 2 segundos após o carregamento para exibir
        const timer = setTimeout(() => setShowBanner(true), 2000)
        return () => clearTimeout(timer)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('proguns:prompt-install', handleCustomTrigger)
    }
  }, [])

  const handleDispararInstalacao = async () => {
    if (deferredPrompt) {
      // Chrome / Edge / Android nativo
      try {
        deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        if (choice.outcome === 'accepted') {
          setIsInstalled(true)
          setShowBanner(false)
          setDeferredPrompt(null)
        }
      } catch (err) {
        console.warn('Erro ao disparar prompt de instalação:', err)
        setShowModalInstrucoes(true)
      }
    } else {
      // iOS Safari ou navegadores que não suportam prompt direto
      setShowModalInstrucoes(true)
    }
  }

  const handleDispensarBanner = () => {
    setShowBanner(false)
    localStorage.setItem('PROGUNS_INSTALL_DISMISSED', Date.now().toString())
  }

  if (isInstalled) {
    return null
  }

  return (
    <>
      {/* ── BANNER FLUTUANTE DE INSTALAÇÃO NO TOPO OU RODAPÉ ── */}
      {showBanner && (
        <div style={{
          position: 'fixed',
          bottom: '1.25rem',
          left: '1.25rem',
          right: '1.25rem',
          maxWidth: '560px',
          margin: '0 auto',
          backgroundColor: '#161B22',
          border: '1.5px solid var(--gold-primary)',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.75)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <img
              src="/logo.png"
              alt="Ícone Pró Guns"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '10px',
                objectFit: 'contain',
                backgroundColor: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '4px'
              }}
            />
            <div>
              <div style={{
                fontSize: '0.92rem',
                fontWeight: '800',
                color: 'var(--gold-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <Sparkles size={15} color="var(--gold-accent)" />
                <span>Instalar Aplicativo Pró Guns</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem', lineHeight: '1.3' }}>
                Acesse direto da sua tela inicial ou área de trabalho, sem barra de URL e com maior velocidade.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <button
              onClick={handleDispararInstalacao}
              className="btn-gold"
              style={{
                padding: '0.5rem 0.9rem',
                fontSize: '0.82rem',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 8px rgba(197, 160, 89, 0.35)'
              }}
            >
              <Download size={15} />
              <span>Instalar</span>
            </button>
            <button
              onClick={handleDispensarBanner}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px'
              }}
              title="Dispensar por enquanto"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL COM INSTRUÇÕES ILUSTRADAS (iOS / PC / ANDROID) ── */}
      {showModalInstrucoes && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1.25rem'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#161B22',
            border: '1.5px solid var(--gold-primary)',
            borderRadius: '14px',
            padding: '1.75rem',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowModalInstrucoes(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(197, 160, 89, 0.15)',
                border: '1px solid var(--gold-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {plataforma === 'ios' ? <Smartphone size={24} color="var(--gold-primary)" /> :
                 plataforma === 'android' ? <Smartphone size={24} color="#34D399" /> :
                 <Monitor size={24} color="#60A5FA" />}
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--gold-primary)', margin: 0 }}>
                  Como Instalar o Pró Guns
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {plataforma === 'ios' ? 'Instruções para iPhone e iPad (Safari)' :
                   plataforma === 'android' ? 'Instruções para Celular ou Tablet Android' :
                   'Instruções para Computador (Windows / Mac)'}
                </span>
              </div>
            </div>

            {/* Passo a Passo para iOS Safari */}
            {plataforma === 'ios' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', backgroundColor: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--gold-primary)', color: '#000', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    1
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      Toque em Compartilhar <Share2 size={16} color="#60A5FA" />
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      No rodapé do Safari do seu iPhone ou topo do iPad, toque no botão de compartilhar (o quadrado com uma seta para cima).
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', backgroundColor: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--gold-primary)', color: '#000', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    2
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      Adicionar à Tela de Início <PlusSquare size={16} color="#34D399" />
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      Role a lista de opções para baixo e selecione a opção <strong>"Adicionar à Tela de Início"</strong>.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', backgroundColor: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--gold-primary)', color: '#000', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    3
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      Confirmar Adição
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      Toque em <strong>"Adicionar"</strong> no canto superior direito. O ícone oficial da Pró Guns será criado na tela inicial!
                    </div>
                  </div>
                </div>
              </div>
            ) : plataforma === 'android' ? (
              /* Passo a Passo para Android */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', backgroundColor: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#34D399', color: '#000', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    1
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      Menu do Navegador (⋮)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      Toque no menu de 3 pontinhos no canto superior direito do Google Chrome ou Samsung Internet.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', backgroundColor: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#34D399', color: '#000', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    2
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      Instalar Aplicativo <Download size={16} color="#34D399" />
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      Toque na opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', backgroundColor: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#34D399', color: '#000', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    3
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      Confirmar
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      Confirme a instalação. O aplicativo Pró Guns funcionará exatamente como um app nativo da Play Store!
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Passo a Passo para Computador (Windows / Mac) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', backgroundColor: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#60A5FA', color: '#000', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    1
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      Ícone na Barra de Endereços <Download size={16} color="#60A5FA" />
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      No Google Chrome ou Microsoft Edge no PC, localize o ícone de instalação (um monitor com seta para baixo) ao lado da estrela de favoritos na barra de URL no topo direito.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', backgroundColor: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#60A5FA', color: '#000', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    2
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      Clique em "Instalar"
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      Clique no ícone e confirme <strong>"Instalar Pró Guns Armeria"</strong>.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', backgroundColor: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#60A5FA', color: '#000', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    3
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      Atalho na Área de Trabalho e Barra de Tarefas
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      O programa abrirá em uma janela própria de aplicativo independente, podendo ser fixado na Barra de Tarefas do Windows!
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-gold"
                onClick={() => setShowModalInstrucoes(false)}
                style={{ padding: '0.5rem 1.25rem' }}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
