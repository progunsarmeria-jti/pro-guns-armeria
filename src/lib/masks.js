// Funções de Máscara de Formatação Automática de Documentos e Telefones (Pró Guns Armeria)

export function maskCNPJ(value) {
  if (!value) return ''
  const digits = value.replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function maskCPF(value) {
  if (!value) return ''
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskTelefone(value) {
  if (!value) return ''
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function maskRG(value) {
  if (!value) return ''
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
  return cleaned
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})([a-zA-Z0-9]{1,2})$/, '.$1-$2')
}

// Formatação monetária oficial brasileira (R$ 5,00 | R$ 50,00 | R$ 5.000,00 | R$ 50.000.000,00)
export function formatarMoeda(value) {
  if (value === null || value === undefined || value === '') return 'R$ 0,00'
  let num
  if (typeof value === 'number') {
    num = isNaN(value) ? 0 : value
  } else {
    const cleanStr = String(value).trim().replace('R$', '').trim()
    if (cleanStr.includes(',') && cleanStr.includes('.')) {
      num = parseFloat(cleanStr.replace(/\./g, '').replace(',', '.')) || 0
    } else if (cleanStr.includes(',')) {
      num = parseFloat(cleanStr.replace(',', '.')) || 0
    } else {
      num = parseFloat(cleanStr) || 0
    }
  }
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
