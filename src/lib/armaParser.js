/**
 * armaParser.js
 * Utilitário de interpretação inteligente da descrição de armas de fogo
 * extraídas da Nota Fiscal de Compra (Taurus, CBC, Glock, Imbel, distribuidores).
 * 
 * Extrai automaticamente todos os parâmetros balísticos e mecânicos exigidos
 * pelas legislações da Polícia Federal (SINARM) e Exército Brasileiro (SIGMA):
 * - Tamanho / comprimento do cano
 * - Acabamento superficial
 * - Quantidade de raias / raiamento
 * - Tipo de arma
 * - Sentido das raias
 * - Se possui carregadores e quantidade
 * - Tipo de funcionamento
 * - Capacidade de disparos
 */

export const TIPOS_ARMA_LIST = [
  'Pistola',
  'Revólver',
  'Espingarda',
  'Carabina',
  'Rifle',
  'Fuzil'
]

export const ACABAMENTOS_LIST = [
  'Oxidado Fosco',
  'Oxidado Brilhante',
  'Inox Fosco',
  'Inox Alto Brilho',
  'Teniferizado Fosco',
  'Cerakote Grafite',
  'Carbono Fosco',
  'Dual Tone (Bicolor)',
  'Anodizado',
  'Camuflado'
]

export const RAIAMENTO_LIST = [
  '6 raias',
  '4 raias',
  '8 raias',
  'Alma Lisa (Espingarda)',
  'Poligonal'
]

export const SENTIDO_RAIAS_LIST = [
  'À Direita (Dextrorsum)',
  'À Esquerda (Sinistrorsum)',
  'Não Aplicável / Alma Lisa'
]

export const FUNCIONAMENTO_LIST = [
  'Semiautomática',
  'Repetição (Pump Action)',
  'Repetição (Bolt Action)',
  'Tiro a Tiro',
  'Ação Dupla / Simples (SA/DA)',
  'Ação Striker Fired'
]

export const CANO_PRESETS = [
  '83mm (3.26")',
  '102mm (4.0")',
  '108mm (4.25")',
  '127mm (5.0")',
  '483mm (19")',
  '508mm (20")',
  '610mm (24")'
]

export const CAPACIDADE_PRESETS = [
  '12+1 tiros',
  '15+1 tiros',
  '17+1 tiros',
  '6 tiros',
  '5+1 tiros',
  '7+1 tiros',
  '8+1 tiros',
  '30 tiros'
]

/**
 * Analisa a descrição da arma constante na Nota Fiscal e extrai os atributos técnicos.
 * @param {string} texto Linha de descrição da NF-e (ex: "PISTOLA TAURUS G3C CAL. 9MM CANO 83MM...")
 * @returns {object} Atributos técnicos interpretados
 */
export function parsearDescricaoArmaNF(texto) {
  if (!texto || typeof texto !== 'string') return null
  const txt = texto.toUpperCase().trim()

  const resultado = {
    tipo_arma: '',
    fabricante: '',
    modelo: '',
    calibre: '',
    classificacao_calibre: 'PERMITIDO',
    comprimento_cano: '',
    acabamento: '',
    quantidade_raias: '',
    sentido_raias: '',
    tipo_funcionamento: '',
    capacidade_tiros: '',
    possui_carregadores: true,
    quantidade_carregadores: '2'
  }

  // 1. Tipo de Arma
  if (txt.includes('PISTOLA')) {
    resultado.tipo_arma = 'Pistola'
    resultado.tipo_funcionamento = 'Semiautomática'
  } else if (txt.includes('REVÓLVER') || txt.includes('REVOLVER')) {
    resultado.tipo_arma = 'Revólver'
    resultado.tipo_funcionamento = 'Ação Dupla / Simples (SA/DA)'
    resultado.possui_carregadores = false
    resultado.quantidade_carregadores = '0'
  } else if (txt.includes('ESPINGARDA')) {
    resultado.tipo_arma = 'Espingarda'
    resultado.tipo_funcionamento = 'Repetição (Pump Action)'
    resultado.quantidade_raias = 'Alma Lisa (Espingarda)'
    resultado.sentido_raias = 'Não Aplicável / Alma Lisa'
    resultado.possui_carregadores = false
    resultado.quantidade_carregadores = '0'
  } else if (txt.includes('CARABINA')) {
    resultado.tipo_arma = 'Carabina'
    resultado.tipo_funcionamento = 'Semiautomática'
  } else if (txt.includes('RIFLE')) {
    resultado.tipo_arma = 'Rifle'
    resultado.tipo_funcionamento = 'Repetição (Bolt Action)'
  } else if (txt.includes('FUZIL')) {
    resultado.tipo_arma = 'Fuzil'
    resultado.tipo_funcionamento = 'Semiautomática'
  }

  // 2. Fabricante
  if (txt.includes('TAURUS')) resultado.fabricante = 'Taurus'
  else if (txt.includes('GLOCK')) resultado.fabricante = 'Glock'
  else if (txt.includes('CBC')) resultado.fabricante = 'CBC'
  else if (txt.includes('IMBEL')) resultado.fabricante = 'Imbel'
  else if (txt.includes('BERETTA')) resultado.fabricante = 'Beretta'
  else if (txt.includes('SIG SAUER') || txt.includes('SIG')) resultado.fabricante = 'Sig Sauer'
  else if (txt.includes('CZ')) resultado.fabricante = 'CZ (Česká Zbrojovka)'
  else if (txt.includes('ROSSI')) resultado.fabricante = 'Rossi'
  else if (txt.includes('SMITH & WESSON') || txt.includes('S&W')) resultado.fabricante = 'Smith & Wesson'
  else if (txt.includes('WALTHER')) resultado.fabricante = 'Walther'
  else if (txt.includes('CANIK')) resultado.fabricante = 'Canik'

  // 3. Calibre & Classificação
  if (txt.includes('9X19') || txt.includes('9MM') || txt.includes('9 MM') || txt.includes('9X19MM')) {
    resultado.calibre = '9x19mm Luger'
    resultado.classificacao_calibre = 'PERMITIDO'
  } else if (txt.includes('.380') || txt.includes('380 ACP') || txt.includes('380AUTO')) {
    resultado.calibre = '.380 ACP'
    resultado.classificacao_calibre = 'PERMITIDO'
  } else if (txt.includes('.38 SPL') || txt.includes('.38') || txt.includes('38 SPL')) {
    resultado.calibre = '.38 SPL'
    resultado.classificacao_calibre = 'PERMITIDO'
  } else if (txt.includes('12 GA') || txt.includes('CAL. 12') || txt.includes('CALIBRE 12') || txt.includes('CAL 12')) {
    resultado.calibre = '12 GA'
    resultado.classificacao_calibre = 'PERMITIDO'
  } else if (txt.includes('20 GA') || txt.includes('CAL. 20')) {
    resultado.calibre = '20 GA'
    resultado.classificacao_calibre = 'PERMITIDO'
  } else if (txt.includes('.40 S&W') || txt.includes('.40') || txt.includes('.40SW')) {
    resultado.calibre = '.40 S&W'
    resultado.classificacao_calibre = 'RESTRITO'
  } else if (txt.includes('.45 ACP') || txt.includes('.45')) {
    resultado.calibre = '.45 ACP'
    resultado.classificacao_calibre = 'RESTRITO'
  } else if (txt.includes('.357 MAG') || txt.includes('.357')) {
    resultado.calibre = '.357 Magnum'
    resultado.classificacao_calibre = 'RESTRITO'
  } else if (txt.includes('.44 MAG') || txt.includes('.44')) {
    resultado.calibre = '.44 Magnum'
    resultado.classificacao_calibre = 'RESTRITO'
  } else if (txt.includes('.22 LR') || txt.includes('.22')) {
    resultado.calibre = '.22 LR'
    resultado.classificacao_calibre = 'PERMITIDO'
  } else if (txt.includes('5.56') || txt.includes('.223')) {
    resultado.calibre = '5.56x45mm (.223)'
    resultado.classificacao_calibre = 'RESTRITO'
  } else if (txt.includes('7.62') || txt.includes('.308')) {
    resultado.calibre = '7.62x51mm (.308)'
    resultado.classificacao_calibre = 'RESTRITO'
  }

  // 4. Comprimento do Cano
  const canoMatch = txt.match(/CANO\s*(?:DE\s*)?([0-9.,]+)\s*(POL|POLEGADAS|"|''|MM)?(?:\s*\(([0-9.,]+)\s*(MM|POL)?\))?/i)
  if (canoMatch) {
    resultado.comprimento_cano = canoMatch[0].replace(/CANO\s*(?:DE\s*)?/i, '').trim()
  } else {
    const mmMatch = txt.match(/([0-9]{2,3})\s*MM/)
    const polMatch = txt.match(/([0-9]+[.,]?[0-9]*)\s*(POL|POLEGADAS|")/i)
    if (mmMatch && polMatch) {
      resultado.comprimento_cano = `${mmMatch[1]}mm (${polMatch[1]} pol)`
    } else if (mmMatch) {
      resultado.comprimento_cano = `${mmMatch[1]}mm`
    } else if (polMatch) {
      resultado.comprimento_cano = `${polMatch[1]} pol`
    }
  }

  // 5. Acabamento
  if (txt.includes('CERAKOTE')) resultado.acabamento = 'Cerakote Grafite'
  else if (txt.includes('TENIFER') || txt.includes('TENIFERIZADO')) resultado.acabamento = 'Teniferizado Fosco'
  else if (txt.includes('INOX FOSCO')) resultado.acabamento = 'Inox Fosco'
  else if (txt.includes('INOX BRILHANTE') || txt.includes('INOX ALTO BRILHO')) resultado.acabamento = 'Inox Alto Brilho'
  else if (txt.includes('INOX')) resultado.acabamento = 'Inox'
  else if (txt.includes('OXIDADO FOSCO') || txt.includes('OXID. FOSCO') || txt.includes('CARBONO FOSCO')) resultado.acabamento = 'Oxidado Fosco'
  else if (txt.includes('OXIDADO')) resultado.acabamento = 'Oxidado Fosco'
  else if (txt.includes('DUAL TONE') || txt.includes('BICOLOR')) resultado.acabamento = 'Dual Tone (Bicolor)'
  else if (txt.includes('ANODIZADO')) resultado.acabamento = 'Anodizado'
  else if (txt.includes('CAMUFLADO')) resultado.acabamento = 'Camuflado'

  // 6. Raiamento / Quantidade de Raias
  if (txt.includes('ALMA LISA') || txt.includes('LISA')) {
    resultado.quantidade_raias = 'Alma Lisa (Espingarda)'
    resultado.sentido_raias = 'Não Aplicável / Alma Lisa'
  } else if (txt.includes('6 RAIAS') || txt.includes('6R') || txt.includes('6-RAIAS') || txt.includes('6 RAIAS')) {
    resultado.quantidade_raias = '6 raias'
  } else if (txt.includes('4 RAIAS') || txt.includes('4R')) {
    resultado.quantidade_raias = '4 raias'
  } else if (txt.includes('8 RAIAS') || txt.includes('8R')) {
    resultado.quantidade_raias = '8 raias'
  } else if (txt.includes('POLIGONAL')) {
    resultado.quantidade_raias = 'Poligonal'
  }

  // 7. Sentido das Raias
  if (txt.includes('DIREITA') || txt.includes('DEXTRORSUM') || txt.includes('DIR') || txt.includes('DEXT')) {
    resultado.sentido_raias = 'À Direita (Dextrorsum)'
  } else if (txt.includes('ESQUERDA') || txt.includes('SINISTRORSUM') || txt.includes('ESQ')) {
    resultado.sentido_raias = 'À Esquerda (Sinistrorsum)'
  }

  // 8. Tipo de Funcionamento
  if (txt.includes('SEMIAUTOMATICA') || txt.includes('SEMI-AUTOMATICA') || txt.includes('SEMI AUTOMATICA') || txt.includes('SEMIAUTO')) {
    resultado.tipo_funcionamento = 'Semiautomática'
  } else if (txt.includes('PUMP') || txt.includes('REPETICAO') || txt.includes('REPETIÇÃO')) {
    resultado.tipo_funcionamento = 'Repetição (Pump Action)'
  } else if (txt.includes('BOLT ACTION') || txt.includes('FERROLHO')) {
    resultado.tipo_funcionamento = 'Repetição (Bolt Action)'
  } else if (txt.includes('DUPLA ACAO') || txt.includes('ACAO DUPLA') || txt.includes('SA/DA') || txt.includes('DA/SA')) {
    resultado.tipo_funcionamento = 'Ação Dupla / Simples (SA/DA)'
  } else if (txt.includes('STRIKER') || txt.includes('STRIKER FIRED')) {
    resultado.tipo_funcionamento = 'Ação Striker Fired'
  } else if (txt.includes('TIRO A TIRO') || txt.includes('MONOTIRO')) {
    resultado.tipo_funcionamento = 'Tiro a Tiro'
  }

  // 9. Capacidade de Disparos
  const plusMatch = txt.match(/([0-9]{1,2}\+[0-9])/)
  if (plusMatch) {
    resultado.capacidade_tiros = `${plusMatch[1]} tiros`
  } else {
    const tirosMatch = txt.match(/([0-9]{1,2})\s*TIROS/)
    if (tirosMatch) {
      resultado.capacidade_tiros = `${tirosMatch[1]} tiros`
    }
  }

  // 10. Carregadores
  if (resultado.tipo_arma === 'Revólver' || (resultado.tipo_arma === 'Espingarda' && !txt.includes('CARREGADOR'))) {
    resultado.possui_carregadores = false
    resultado.quantidade_carregadores = '0'
  } else if (txt.includes('SEM CARREGADOR')) {
    resultado.possui_carregadores = false
    resultado.quantidade_carregadores = '0'
  } else {
    const cargMatch = txt.match(/([1-9])\s*CARREGADOR/i)
    if (cargMatch) {
      resultado.possui_carregadores = true
      resultado.quantidade_carregadores = cargMatch[1]
    } else {
      resultado.possui_carregadores = true
      resultado.quantidade_carregadores = '2'
    }
  }

  return resultado
}
