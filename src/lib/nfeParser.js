/**
 * nfeParser.js
 * Utilitário de alta performance para leitura e extração de dados fiscais
 * a partir de arquivos XML de Nota Fiscal Eletrônica (NF-e Modelo 55 - SEFAZ).
 * 
 * Funciona de forma 100% nativa no navegador do usuário, sem bibliotecas externas
 * e com total privacidade dos dados da armaria.
 */

import { parsearDescricaoArmaNF } from './armaParser'

// Helper para extrair texto de uma tag ignorando namespaces
function getTagText(parent, tagName) {
  if (!parent) return ''
  const direct = parent.getElementsByTagName(tagName)
  if (direct && direct.length > 0) {
    return direct[0].textContent ? direct[0].textContent.trim() : ''
  }
  // Fallback para tags com prefixo de namespace (ex: nfe:tag)
  const allNodes = parent.getElementsByTagName('*')
  for (let i = 0; i < allNodes.length; i++) {
    if (allNodes[i].localName === tagName) {
      return allNodes[i].textContent ? allNodes[i].textContent.trim() : ''
    }
  }
  return ''
}

// Helper para converter texto numérico em float
function parseNumber(val) {
  if (!val) return 0
  const clean = String(val).replace(',', '.')
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : num
}

/**
 * Faz o parsing completo de uma NF-e a partir do conteúdo textual do arquivo XML.
 * @param {string} xmlString Conteúdo do arquivo .xml
 * @returns {object} Dados estruturados da nota e dos produtos
 */
export function parseNFeXML(xmlString) {
  if (!xmlString || typeof xmlString !== 'string') {
    throw new Error('Conteúdo do arquivo XML inválido ou vazio.')
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'text/xml')

  // Verifica erro de sintaxe XML
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    throw new Error('Não foi possível ler o arquivo. Certifique-se de que é um XML de NF-e válido da SEFAZ.')
  }

  // 1. Localiza a tag infNFe
  const infNFeList = doc.getElementsByTagName('infNFe')
  const infNFe = infNFeList && infNFeList.length > 0 ? infNFeList[0] : null

  if (!infNFe) {
    throw new Error('Tag <infNFe> não encontrada. O arquivo não aparenta ser uma NF-e (Nota Fiscal Eletrônica).')
  }

  // Chave de Acesso (44 dígitos)
  let chaveAcesso = ''
  const idAttr = infNFe.getAttribute('Id') || ''
  if (idAttr) {
    chaveAcesso = idAttr.replace(/\D/g, '') // Extrai apenas os 44 números
  } else {
    // Tenta encontrar em protNFe/infProt/chNFe
    chaveAcesso = getTagText(doc, 'chNFe')
  }

  // 2. Dados da Identificação da Nota (<ide>)
  const ideList = doc.getElementsByTagName('ide')
  const ide = ideList && ideList.length > 0 ? ideList[0] : null

  const numeroNF = getTagText(ide, 'nNF')
  const serieNF = getTagText(ide, 'serie')
  const dataEmissaoRaw = getTagText(ide, 'dhEmi') || getTagText(ide, 'dEmi')
  const naturezaOperacao = getTagText(ide, 'natOp')

  // 3. Dados do Fornecedor / Emitente (<emit>)
  const emitList = doc.getElementsByTagName('emit')
  const emit = emitList && emitList.length > 0 ? emitList[0] : null

  const cnpjFornecedor = getTagText(emit, 'CNPJ') || getTagText(emit, 'CPF')
  const razaoSocial = getTagText(emit, 'xNome')
  const nomeFantasia = getTagText(emit, 'xFant')
  const enderEmit = emit ? emit.getElementsByTagName('enderEmit')[0] : null
  const ufFornecedor = getTagText(enderEmit, 'UF')
  const municipioFornecedor = getTagText(enderEmit, 'xMun')

  // 4. Totais da Nota (<total><ICMSTot>)
  const icmsTotList = doc.getElementsByTagName('ICMSTot')
  const icmsTot = icmsTotList && icmsTotList.length > 0 ? icmsTotList[0] : null

  const valorProdutos = parseNumber(getTagText(icmsTot, 'vProd'))
  const valorFrete = parseNumber(getTagText(icmsTot, 'vFrete'))
  const valorSeguro = parseNumber(getTagText(icmsTot, 'vSeg'))
  const valorDesconto = parseNumber(getTagText(icmsTot, 'vDesc'))
  const valorOutrasDespesas = parseNumber(getTagText(icmsTot, 'vOutro'))
  const valorIPI = parseNumber(getTagText(icmsTot, 'vIPI'))
  const valorST = parseNumber(getTagText(icmsTot, 'vST'))
  const valorTotalNF = parseNumber(getTagText(icmsTot, 'vNF'))

  // 5. Lista de Produtos (<det>)
  const detList = doc.getElementsByTagName('det')
  const itens = []

  for (let i = 0; i < detList.length; i++) {
    const det = detList[i]
    const prod = det.getElementsByTagName('prod')[0]
    if (!prod) continue

    const nItem = det.getAttribute('nItem') || String(i + 1)
    const cProd = getTagText(prod, 'cProd')
    let cEAN = getTagText(prod, 'cEAN')
    if (cEAN === 'SEM GTIN' || cEAN === 'sem gtin') cEAN = ''

    const xProd = getTagText(prod, 'xProd')
    const ncm = getTagText(prod, 'NCM').replace(/\D/g, '')
    const cest = getTagText(prod, 'CEST').replace(/\D/g, '')
    const cfop = getTagText(prod, 'CFOP')
    const uCom = (getTagText(prod, 'uCom') || 'UN').toUpperCase()
    const qCom = parseNumber(getTagText(prod, 'qCom'))
    const vUnCom = parseNumber(getTagText(prod, 'vUnCom'))
    const vProdItem = parseNumber(getTagText(prod, 'vProd'))
    const vFreteItem = parseNumber(getTagText(prod, 'vFrete'))
    const vOutroItem = parseNumber(getTagText(prod, 'vOutro'))
    const vDescItem = parseNumber(getTagText(prod, 'vDesc'))

    // Impostos do item (IPI e ST se destacados)
    const vIPIItem = parseNumber(getTagText(det, 'vIPI'))
    const vSTItem = parseNumber(getTagText(det, 'vICMSST'))

    // Rateio automático de frete proporcional se o item não trouxer vFrete individual
    let freteRateado = vFreteItem
    if (!freteRateado && valorFrete > 0 && valorProdutos > 0) {
      freteRateado = (vProdItem / valorProdutos) * valorFrete
    }

    // Rateio de outras despesas se houver
    let outrasRateadas = vOutroItem
    if (!outrasRateadas && valorOutrasDespesas > 0 && valorProdutos > 0) {
      outrasRateadas = (vProdItem / valorProdutos) * valorOutrasDespesas
    }

    // Custo Total de Aquisição Real do Item:
    // Produto + Frete + IPI + ST + Outras Despesas - Desconto
    const custoTotalReal = vProdItem + freteRateado + outrasRateadas + vIPIItem + vSTItem - vDescItem
    const custoUnitarioReal = qCom > 0 ? (custoTotalReal / qCom) : vUnCom

    // Dados Específicos de Armamento (Tag SEFAZ <arma>)
    const armaTag = prod.getElementsByTagName('arma')[0]
    let numeroSerieArma = ''
    let numeroCanoArma = ''
    let descrArma = ''
    if (armaTag) {
      numeroSerieArma = getTagText(armaTag, 'nSerie')
      numeroCanoArma = getTagText(armaTag, 'nCano')
      descrArma = getTagText(armaTag, 'descr')
    }

    // Dados de Rastreabilidade / Lote de Munições (Tag SEFAZ <rastro> / <med>)
    const rastroTag = prod.getElementsByTagName('rastro')[0] || prod.getElementsByTagName('med')[0]
    let loteFabricante = ''
    if (rastroTag) {
      loteFabricante = getTagText(rastroTag, 'nLote')
    }

    // Interpretação Balística Automática da Descrição
    const isArmaNcm = ncm.startsWith('9302') || ncm.startsWith('9303')
    const textoParaAnalisar = `${xProd} ${descrArma}`
    const specsArma = (isArmaNcm || armaTag || /PISTOLA|REVOLVER|ESPINGARDA|CARABINA|FUZIL|RIFLE/i.test(xProd))
      ? parsearDescricaoArmaNF(textoParaAnalisar)
      : null

    itens.push({
      item_numero: nItem,
      codigo_fornecedor: cProd,
      codigo_barras: cEAN,
      descricao: xProd,
      ncm: ncm,
      cest: cest,
      cfop: cfop,
      unidade: uCom,
      quantidade: Math.round(qCom),
      preco_unitario_tabela: Number(vUnCom.toFixed(2)),
      valor_total_item: Number(vProdItem.toFixed(2)),
      valor_frete_rateado: Number(freteRateado.toFixed(2)),
      valor_ipi: Number(vIPIItem.toFixed(2)),
      valor_st: Number(vSTItem.toFixed(2)),
      preco_custo_real: Number(custoUnitarioReal.toFixed(2)),
      numero_serie: numeroSerieArma,
      numero_cano: numeroCanoArma,
      lote_fabricante: loteFabricante,
      specs_arma: specsArma,
      is_arma: !!specsArma
    })
  }

  return {
    sucesso: true,
    chave_acesso: chaveAcesso,
    numero_nf: numeroNF,
    serie: serieNF || '1',
    data_emissao: dataEmissaoRaw,
    natureza_operacao: naturezaOperacao,
    fornecedor: {
      cnpj: cnpjFornecedor,
      razao_social: razaoSocial || 'Fornecedor Desconhecido',
      nome_fantasia: nomeFantasia || razaoSocial || '',
      uf: ufFornecedor,
      municipio: municipioFornecedor
    },
    totais: {
      valor_produtos: Number(valorProdutos.toFixed(2)),
      valor_frete: Number(valorFrete.toFixed(2)),
      valor_ipi: Number(valorIPI.toFixed(2)),
      valor_st: Number(valorST.toFixed(2)),
      valor_desconto: Number(valorDesconto.toFixed(2)),
      valor_total: Number(valorTotalNF.toFixed(2))
    },
    itens: itens
  }
}
