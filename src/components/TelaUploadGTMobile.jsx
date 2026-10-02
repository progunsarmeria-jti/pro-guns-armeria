import React, { useState } from 'react'
import { Camera, UploadCloud, CheckCircle2, Loader, FileText, AlertTriangle } from 'lucide-react'
import { getSupabaseClient, isSupabaseConfigured, uploadGTFile } from '../lib/supabase'
import { compressImage } from '../lib/imageCompressor'

export default function TelaUploadGTMobile({ sessionId, action = 'upload_gt' }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [totalFotosEnviadas, setTotalFotosEnviadas] = useState(0)

  const isTramite = action === 'upload_tramite'
  const isCraf = action === 'upload_craf'

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

      // 1. Comprimir o arquivo (se for imagem) para reduzir peso e evitar timeouts
      const fileToUpload = await compressImage(selectedFile)

      // 2. Fazer upload do arquivo no Storage (com fallback resiliente para Base64)
      const ext = fileToUpload.name ? fileToUpload.name.split('.').pop() : 'jpg'
      const prefix = isTramite ? 'tramite' : isCraf ? 'craf' : 'gt'
      const fileName = `${prefix}_${sessionId}_${Date.now()}.${ext}`

      let publicUrl = ''
      try {
        if (client && isSupabaseConfigured()) {
          publicUrl = await uploadGTFile(fileToUpload, fileName)
        } else {
          throw new Error('Supabase client não disponível para storage')
        }
      } catch (uploadErr) {
        // Fallback resiliente: converte imagem comprimida em data URL
        publicUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(fileToUpload)
        })
      }

      // 3. Transmitir o link para o computador via Realtime Broadcast
      if (client) {
        const channelName = isTramite ? `upload_tramite_${sessionId}` : isCraf ? `upload_craf_${sessionId}` : `upload_gt_${sessionId}`
        const channel = client.channel(channelName)
        await channel.subscribe()
        await channel.send({
          type: 'broadcast',
          event: 'file_uploaded',
          payload: { url: publicUrl, name: selectedFile.name, total: totalFotosEnviadas + 1 }
        })
        client.removeChannel(channel)
      }

      setTotalFotosEnviadas(prev => prev + 1)
      setSuccess(true)
    } catch (err) {
      console.error(err)
      setErrorMsg(err.message || 'Ocorreu um erro ao enviar o arquivo.')
    } finally {
      setLoading(false)
    }
  }

  const handleTirarOutraFoto = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setSuccess(false)
    setErrorMsg('')
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
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: isTramite ? '#C5A059' : '#EF4444', fontWeight: '800', letterSpacing: '0.5px' }}>
            PRÓ GUNS ARMERIA
          </h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
            {isTramite
              ? 'Digitalização do Trâmite (SINARM / PF)'
              : isCraf
              ? 'Digitalização de CRAF da Arma'
              : 'Digitalização de Guia de Tráfego (GT)'}
          </p>
        </div>

        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0', textAlign: 'center' }}>
            <CheckCircle2 size={64} color="#10B981" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#FFFFFF' }}>
                {isTramite ? `Foto #${totalFotosEnviadas} Enviada!` : 'Documento Enviado!'}
              </h3>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.82rem', color: '#94A3B8', lineHeight: '1.4' }}>
                {isTramite
                  ? 'A foto foi transmitida e já está anexada no trâmite da venda no computador da recepção.'
                  : isCraf
                  ? 'O computador da recepção já recebeu o CRAF e ele foi anexado ao cadastro da arma.'
                  : 'O computador da recepção já recebeu a Guia de Tráfego e ela foi anexada à O.S.'}
              </p>
            </div>

            {isTramite ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleTirarOutraFoto}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    backgroundColor: '#C5A059',
                    color: '#0F121A',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Camera size={18} />
                  <span>📷 Tirar Outra Foto (Anexar Mais)</span>
                </button>
                <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 'bold' }}>
                  ✓ {totalFotosEnviadas} foto(s) enviada(s). Se terminou, pode fechar esta aba.
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
                Você pode fechar esta aba no seu celular.
              </p>
            )}
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
                <Camera size={32} color={isTramite ? '#C5A059' : '#EF4444'} />
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                  {isTramite
                    ? 'Tirar Foto do Documento'
                    : isCraf
                    ? 'Tirar Foto do CRAF'
                    : 'Tirar Foto da Guia'}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>ou selecionar arquivo/foto da galeria</span>
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
                    <span>Arquivo PDF Pronto</span>
                  </div>
                ) : previewUrl === 'unknown' ? (
                  <div style={{ fontSize: '0.8rem', color: '#E2E8F0', padding: '0.5rem' }}>
                    Arquivo pronto para envio
                  </div>
                ) : previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
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
                backgroundColor: loading || !selectedFile ? '#475569' : isTramite ? '#C5A059' : '#EF4444',
                color: isTramite && !loading && selectedFile ? '#0F121A' : '#FFFFFF',
                fontWeight: '800',
                fontSize: '0.88rem',
                cursor: loading || !selectedFile ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
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
                  <span>{isTramite ? 'Enviar Foto para o Trâmite' : 'Enviar para o Sistema'}</span>
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
