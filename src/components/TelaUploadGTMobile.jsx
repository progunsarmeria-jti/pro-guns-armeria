import React, { useState } from 'react'
import { Camera, UploadCloud, CheckCircle2, Loader, FileText, AlertTriangle } from 'lucide-react'
import { getSupabaseClient, isSupabaseConfigured, uploadGTFile } from '../lib/supabase'

export default function TelaUploadGTMobile({ sessionId }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSelectedFile(file)

    // Preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result)
      }
      reader.readAsDataURL(file)
    } else if (file.type === 'application/pdf') {
      setPreviewUrl('pdf')
    } else {
      setPreviewUrl('unknown')
    }
  }

  const handleEnviar = async () => {
    if (!selectedFile) {
      setErrorMsg('Por favor, tire uma foto ou selecione um arquivo primeiro.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const client = getSupabaseClient()
      if (!client) {
        throw new Error('Supabase não está configurado no sistema.')
      }

      // 1. Fazer upload do arquivo no Storage
      const ext = selectedFile.name.split('.').pop() || 'png'
      const fileName = `${sessionId}_${Date.now()}.${ext}`
      const publicUrl = await uploadGTFile(selectedFile, fileName)

      if (!publicUrl) {
        throw new Error('Não foi possível realizar o upload do arquivo.')
      }

      // 2. Transmitir o link para o computador via Realtime Broadcast
      const channel = client.channel(`upload_gt_${sessionId}`)
      await channel.subscribe()
      await channel.send({
        type: 'broadcast',
        event: 'file_uploaded',
        payload: { url: publicUrl }
      })

      setSuccess(true)
      
      // Desconecta do canal após o envio
      client.removeChannel(channel)
    } catch (err) {
      console.error(err)
      setErrorMsg(err.message || 'Ocorreu um erro ao enviar o arquivo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F172A',
      color: '#F8FAFC',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#EF4444', fontWeight: '800', letterSpacing: '0.5px' }}>
            PRÓ GUNS ARMERIA
          </h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
            Digitalização de Guia de Tráfego (GT)
          </p>
        </div>

        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0', textAlign: 'center' }}>
            <CheckCircle2 size={64} color="#10B981" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#FFFFFF' }}>Documento Enviado!</h3>
              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                O computador da recepção já recebeu a Guia de Tráfego e ela foi anexada à O.S.
              </p>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
              Você pode fechar esta aba no seu celular.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {errorMsg && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '0.65rem',
                fontSize: '0.78rem',
                color: '#F87171',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Container de Seleção */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <label style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                height: '140px',
                cursor: 'pointer',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                transition: 'all 0.2s ease',
                gap: '0.5rem'
              }}>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  capture="environment"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  disabled={loading}
                />
                <Camera size={32} color="#EF4444" />
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Tirar Foto da Guia</span>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>ou selecionar PDF/Foto</span>
              </label>
            </div>

            {/* Preview do Arquivo Selecionado */}
            {selectedFile && (
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                padding: '0.65rem',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <strong>Selecionado:</strong> {selectedFile.name}
                </div>
                {previewUrl === 'pdf' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', fontSize: '0.8rem', color: '#F87171' }}>
                    <FileText size={18} />
                    <span>Arquivo PDF Ready</span>
                  </div>
                ) : previewUrl === 'unknown' ? (
                  <div style={{ fontSize: '0.8rem', color: '#E2E8F0', padding: '0.5rem' }}>
                    Arquivo pronto para envio
                  </div>
                ) : previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview da Guia"
                    style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                ) : null}
              </div>
            )}

            {/* Botão de Enviar */}
            <button
              onClick={handleEnviar}
              disabled={loading || !selectedFile}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: loading || !selectedFile ? '#475569' : '#EF4444',
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: loading || !selectedFile ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
              }}
            >
              {loading ? (
                <>
                  <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Enviando arquivo...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={18} />
                  <span>Enviar para a O.S.</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
