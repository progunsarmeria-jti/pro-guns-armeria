// Dados Iniciais demonstrativos do Portal G-CAC para Pró Guns Armeria

export const INITIAL_CLIENTES = [
  {
    id: "c1",
    nome_completo: "Carlos Eduardo Silveira",
    cpf: "123.456.789-00",
    rg: "44.555.666-X",
    telefone: "(11) 98765-4321",
    email: "carlos.silveira@email.com",
    endereco: "Av. Paulista, 1500 - Bela Vista",
    numero_cr: "123456/2ª RM",
    validade_cr: "2027-08-15",
    regiao_militar: "2ª RM",
    categorias: ["Atirador", "Colecionador"],
    clube_filiado: "Clube de Tiro Pró Guns",
    cidade: "São Paulo",
    uf: "SP",
    status: "Ativo"
  },
  {
    id: "c2",
    nome_completo: "Roberto Alves Mendes",
    cpf: "987.654.321-11",
    rg: "33.222.111-9",
    telefone: "(11) 99123-8877",
    email: "roberto.mendes@email.com",
    endereco: "Rua Barão de Jaguara, 450 - Centro",
    numero_cr: "654321/2ª RM",
    validade_cr: "2026-09-10",
    regiao_militar: "2ª RM",
    categorias: ["Atirador", "Caçador"],
    clube_filiado: "Clube de Tiro Pró Guns",
    cidade: "Campinas",
    uf: "SP",
    status: "Ativo"
  },
  {
    id: "c3",
    nome_completo: "Mariana Costa Prado",
    cpf: "456.789.123-22",
    rg: "22.333.444-5",
    telefone: "(11) 97777-6655",
    email: "mariana.prado@email.com",
    endereco: "Rua XV de Novembro, 200 - Centro",
    numero_cr: "789123/2ª RM",
    validade_cr: "2026-08-01", // prestes a vencer
    regiao_militar: "2ª RM",
    categorias: ["Atirador"],
    clube_filiado: "Clube de Tiro Pró Guns",
    cidade: "Sorocaba",
    uf: "SP",
    status: "Ativo"
  }
];

export const INITIAL_ARMAS = [
  {
    id: "a1",
    cliente_id: "c1",
    tipo: "Pistola",
    marca: "Glock",
    modelo: "G17 Gen5",
    calibre: "9mm",
    numero_serie: "AB123456",
    numero_sigma_sinarm: "SIGMA-987123",
    orgao_registro: "SIGMA",
    numero_craf: "CRAF-887711",
    validade_craf: "2028-12-01",
    status: "Regular"
  },
  {
    id: "a2",
    cliente_id: "c1",
    tipo: "Fuzil",
    marca: "Taurus",
    modelo: "T4",
    calibre: "5.56 NATO",
    numero_serie: "TZ998877",
    numero_sigma_sinarm: "SIGMA-554433",
    orgao_registro: "SIGMA",
    numero_craf: "CRAF-992233",
    validade_craf: "2027-05-15",
    status: "Regular"
  },
  {
    id: "a3",
    cliente_id: "c2",
    tipo: "Espingarda",
    marca: "CBC",
    modelo: "Pump Tactical 12",
    calibre: "12 GA",
    numero_serie: "CBC-776655",
    numero_sigma_sinarm: "SIGMA-112233",
    orgao_registro: "SIGMA",
    numero_craf: "CRAF-334455",
    validade_craf: "2026-08-30",
    status: "Regular"
  }
];

export const INITIAL_ORDENS = [
  {
    id: "o1",
    numero_os: 1001,
    cliente_id: "c1",
    cliente_nome: "Carlos Eduardo Silveira",
    tipo_servico: "Autorização de Compra de Arma de Fogo",
    orgao_destino: "Exército (SIGMA)",
    numero_protocolo: "2026.07.12.9982",
    data_protocolo: "2026-07-10",
    valor_servico: 450.00,
    valor_taxamento: 88.00,
    status: "Em Análise",
    detalhes: "Processo de autorização para compra de Pistola 9mm Glock.",
    previsao_conclusao: "2026-08-15"
  },
  {
    id: "o2",
    numero_os: 1002,
    cliente_id: "c2",
    cliente_nome: "Roberto Alves Mendes",
    tipo_servico: "Guia de Tráfego (GT)",
    orgao_destino: "Exército (SIGMA)",
    numero_protocolo: "2026.07.01.5543",
    data_protocolo: "2026-07-01",
    valor_servico: 250.00,
    valor_taxamento: 50.00,
    status: "Concluído",
    detalhes: "Emissão de GT Nacional para competições do acervo de Atirador.",
    previsao_conclusao: "2026-07-20"
  },
  {
    id: "o3",
    numero_os: 1003,
    cliente_id: "c3",
    cliente_nome: "Mariana Costa Prado",
    tipo_servico: "Renovação de CR",
    orgao_destino: "Exército (2ª RM)",
    numero_protocolo: "2026.07.15.1120",
    data_protocolo: "2026-07-15",
    valor_servico: 600.00,
    valor_taxamento: 100.00,
    status: "Aguardando Doc",
    detalhes: "Pendente certidão negativa da Justiça Federal atualizada.",
    previsao_conclusao: "2026-08-30"
  }
];

export const INITIAL_ORCAMENTOS = [
  {
    id: "orc1",
    numero_orcamento: 501,
    cliente_id: "c1",
    cliente_nome: "Carlos Eduardo Silveira",
    valor_total: 1250.00,
    desconto: 50.00,
    valor_final: 1200.00,
    forma_pagamento: "PIX (À Vista com Desconto)",
    validade_dias: 15,
    status: "Aprovado",
    itens: [
      { descricao: "Despachantaria Autorização de Compra SIGMA", quantidade: 1, valor_unitario: 450.00 },
      { descricao: "Taxa GRU Exército Brasileiro", quantidade: 1, valor_unitario: 88.00 },
      { descricao: "Processo de Emissão de CRAF", quantidade: 1, valor_unitario: 400.00 },
      { descricao: "Guia de Tráfego Eletrônica", quantidade: 1, valor_unitario: 312.00 }
    ],
    observacoes: "Pagamento confirmado via PIX. Processo iniciado."
  },
  {
    id: "orc2",
    numero_orcamento: 502,
    cliente_id: "c2",
    cliente_nome: "Roberto Alves Mendes",
    valor_total: 800.00,
    desconto: 0.00,
    valor_final: 800.00,
    forma_pagamento: "Cartão de Crédito 3x",
    validade_dias: 10,
    status: "Pendente",
    itens: [
      { descricao: "Renovação de CR + Certidões", quantidade: 1, valor_unitario: 600.00 },
      { descricao: "Declaração de Habitabilidade Anual", quantidade: 1, valor_unitario: 200.00 }
    ],
    observacoes: "Aguardando envio dos laudos psicológicos atualizados."
  }
];

export const INITIAL_FINANCEIRO = [
  {
    id: "f1",
    descricao: "Recebimento Orçamento #501 - Carlos Silveira",
    tipo: "Receita",
    categoria: "Serviço",
    valor: 1200.00,
    data_vencimento: "2026-07-10",
    data_pagamento: "2026-07-10",
    status: "Pago",
    forma_pagamento: "PIX"
  },
  {
    id: "f2",
    descricao: "Pagamento GRU Exército OS #1001",
    tipo: "Despesa",
    categoria: "Taxa",
    valor: 88.00,
    data_vencimento: "2026-07-11",
    data_pagamento: "2026-07-11",
    status: "Pago",
    forma_pagamento: "PIX"
  },
  {
    id: "f3",
    descricao: "Honorários Ordem #1003 - Mariana Prado",
    tipo: "Receita",
    categoria: "Serviço",
    valor: 700.00,
    data_vencimento: "2026-07-25",
    data_pagamento: null,
    status: "Pendente",
    forma_pagamento: "Boleto"
  }
];

export const INITIAL_CONFIG = {
  nome_fantasia: "Pró Guns Armeria",
  razao_social: "Pró Guns Armeria & Despachantaria LTDA",
  cnpj: "12.345.678/0001-99",
  cr_armeria: "CR-998877/2ª RM",
  validade_cr: "2029-12-31",
  rm_armeria: "2ª Região Militar",
  telefone: "(11) 3344-5566",
  whatsapp: "(11) 98888-7777",
  email: "contato@proguns.com.br",
  cidade: "São Paulo",
  uf: "SP",
  endereco: "Av. das Armas, 1000 - Centro"
};
