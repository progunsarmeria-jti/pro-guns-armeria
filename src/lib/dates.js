// ─── Utilitários Centralizados de Data/Hora ─────────────────────────────────
// Todas as datas são armazenadas internamente em ISO (YYYY-MM-DD) para
// garantir compatibilidade com comparações, mas EXIBIDAS como DD/MM/AAAA.

/**
 * Retorna a data de hoje no formato ISO interno: YYYY-MM-DD
 * Usado para armazenamento e comparações internas.
 */
export const hojeISO = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Retorna a hora atual no formato HH:MM:SS
 */
export const horaAgora = () => {
  const d = new Date()
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/**
 * Converte data ISO (YYYY-MM-DD) para exibição brasileira (DD/MM/AAAA)
 * Aceita também datas já no formato DD/MM/AAAA (passa direto).
 * Retorna '-' se inválida.
 */
export const formatarData = (dataStr) => {
  if (!dataStr) return '-'
  const s = String(dataStr).trim()

  // Já está no formato DD/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) return s

  // ISO: YYYY-MM-DD (pode ter hora junto: YYYY-MM-DDTHH:mm...)
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`
  }

  return s
}

/**
 * Converte data ISO para exibição com hora (DD/MM/AAAA HH:MM)
 */
export const formatarDataHora = (dataStr) => {
  if (!dataStr) return '-'
  const s = String(dataStr).trim()
  // Tenta extrair ISO com hora
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}:\d{2})/)
  if (match) return `${match[3]}/${match[2]}/${match[1]} ${match[4]}`
  // Retorna formatação padrão
  return formatarData(s)
}

/**
 * Formata string "YYYY-MM-DD HH:MM:SS" ou "YYYY-MM-DD HH:MM" para "DD/MM/AAAA HH:MM"
 */
export const formatarDataHoraStr = (str) => {
  if (!str) return '-'
  return formatarDataHora(str)
}

/**
 * Retorna data e hora atual para uso em timestamps de exibição: DD/MM/AAAA HH:MM
 */
export const agora = () => {
  const d = new Date()
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
