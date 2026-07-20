import { dbUpsert } from './supabase'

/**
 * Registra um evento na trilha de auditoria do sistema.
 */
export function registrarLog({ usuario, acao, descricao, osId = null, osNumero = null, setLogs }) {
  const agora = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const dataFormatada = `${pad(agora.getDate())}/${pad(agora.getMonth() + 1)}/${agora.getFullYear()} ${pad(agora.getHours())}:${pad(agora.getMinutes())}`

  const novoLog = {
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    os_id: osId ? String(osId) : null,
    os_numero: osNumero ? Number(osNumero) : null,
    usuario_id: usuario?.id || 'u1',
    usuario_nome: usuario?.nome_completo || usuario?.nome || 'GUILHERME GOMES (ADMIN)',
    usuario_perfil: usuario?.perfil || 'master',
    acao: acao.toUpperCase(),
    descricao: descricao,
    created_at: dataFormatada
  }

  // Persiste no Supabase
  dbUpsert('logs', novoLog)

  // Atualiza estado do React
  if (setLogs) {
    setLogs(prev => [novoLog, ...(prev || [])])
  }

  return novoLog
}
