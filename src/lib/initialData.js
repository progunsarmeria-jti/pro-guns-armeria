// Dados Iniciais demonstrativos Pró Guns Armeria

export const INITIAL_USUARIOS = [
  {
    id: "u1",
    nome_completo: "GUILHERME GOMES (ADMIN)",
    cpf: "000.000.000-00",
    email: "admin@proguns.com.br",
    senha_pessoal: "admin123",
    cargo: "Diretor Master",
    perfil: "master", // 'master' | 'recepcao' | 'armeiro'
    status: "Ativo",
    permissoes: {
      ver_clientes: true,
      criar_clientes: true,
      editar_clientes: true,
      excluir_clientes: true,
      ver_ordens: true,
      dar_entrada_os: true,
      preencher_laudo_armeiro: true,
      aprovar_os: true,
      concluir_retirada: true,
      excluir_os: true,
      ver_orcamentos: true,
      criar_orcamentos: true,
      excluir_orcamentos: true,
      ver_financeiro: true,
      lancar_financeiro: true,
      ver_configuracoes: true,
      gerenciar_usuarios: true,
      ver_vendas: true,
      lancar_vendas: true
    }
  },
  {
    id: "u2",
    nome_completo: "JOÃO SILVA",
    cpf: "111.111.111-11",
    email: "joao.recepcao@proguns.com.br",
    senha_pessoal: "rec123",
    cargo: "Atendente de Recepção",
    perfil: "recepcao",
    status: "Ativo",
    permissoes: {
      ver_clientes: true,
      criar_clientes: true,
      editar_clientes: true,
      excluir_clientes: false,
      ver_ordens: true,
      dar_entrada_os: true,
      preencher_laudo_armeiro: false,
      aprovar_os: true,
      concluir_retirada: true,
      excluir_os: false,
      ver_orcamentos: true,
      criar_orcamentos: true,
      excluir_orcamentos: false,
      ver_financeiro: false,
      lancar_financeiro: true,
      ver_configuracoes: false,
      gerenciar_usuarios: false
    }
  },
  {
    id: "u3",
    nome_completo: "MARIA SANTOS",
    cpf: "222.222.222-22",
    email: "maria.recepcao@proguns.com.br",
    senha_pessoal: "rec123",
    cargo: "Atendente de Recepção",
    perfil: "recepcao",
    status: "Ativo",
    permissoes: {
      ver_clientes: true,
      criar_clientes: true,
      editar_clientes: true,
      excluir_clientes: false,
      ver_ordens: true,
      dar_entrada_os: true,
      preencher_laudo_armeiro: false,
      aprovar_os: true,
      concluir_retirada: true,
      excluir_os: false,
      ver_orcamentos: true,
      criar_orcamentos: true,
      excluir_orcamentos: false,
      ver_financeiro: false,
      lancar_financeiro: true,
      ver_configuracoes: false,
      gerenciar_usuarios: false
    }
  },
  {
    id: "u4",
    nome_completo: "PAULO ARMEIRO",
    cpf: "333.333.333-33",
    email: "paulo.armeiro@proguns.com.br",
    senha_pessoal: "arm123",
    cargo: "Armeiro Responsável Técnico",
    perfil: "armeiro",
    status: "Ativo",
    permissoes: {
      ver_clientes: true,
      criar_clientes: false,
      editar_clientes: false,
      excluir_clientes: false,
      ver_ordens: true,
      dar_entrada_os: false,
      preencher_laudo_armeiro: true,
      aprovar_os: false,
      concluir_retirada: false,
      excluir_os: false,
      ver_orcamentos: false,
      criar_orcamentos: false,
      excluir_orcamentos: false,
      ver_financeiro: false,
      lancar_financeiro: false,
      ver_configuracoes: false,
      gerenciar_usuarios: false
    }
  },
  {
    id: "u5",
    nome_completo: "OSMAIR ARMEIRO",
    cpf: "444.444.444-44",
    email: "osmair.armeiro@proguns.com.br",
    senha_pessoal: "arm123",
    cargo: "Armeiro Assistente",
    perfil: "armeiro",
    status: "Ativo",
    permissoes: {
      ver_clientes: true,
      criar_clientes: false,
      editar_clientes: false,
      excluir_clientes: false,
      ver_ordens: true,
      dar_entrada_os: false,
      preencher_laudo_armeiro: true,
      aprovar_os: false,
      concluir_retirada: false,
      excluir_os: false,
      ver_orcamentos: false,
      criar_orcamentos: false,
      excluir_orcamentos: false,
      ver_financeiro: false,
      lancar_financeiro: false,
      ver_configuracoes: false,
      gerenciar_usuarios: false
    }
  }
];

export const INITIAL_CLIENTES = [];

export const INITIAL_ARMAS = [];

export const INITIAL_ORDENS = [];

export const INITIAL_ORCAMENTOS = [];

export const INITIAL_FINANCEIRO = [];

export const INITIAL_CONFIG = {
  nome_fantasia: "PRÓ GUNS ARMERIA",
  razao_social: "SANTOS E OLIVIERA JUNIOR LTDA",
  cnpj: "12.345.678/0001-99",
  cr_armeria: "CR-998877/2ª RM",
  validade_cr: "2029-12-31",
  rm_armeria: "2ª Região Militar",
  telefone: "(11) 3344-5566",
  whatsapp: "(11) 98888-7777",
  email: "contato@proguns.com.br",
  cidade: "São Paulo",
  uf: "SP",
  endereco: "Av. das Armas, 1000 - Centro",
  categorias_servicos: [
    "MANUTENÇÃO",
    "REPARO",
    "PERSONALIZAÇÃO",
    "ÓPTICA",
    "ACABAMENTO",
    "LIMPEZA & CONSERVAÇÃO",
    "CUSTOMIZAÇÃO",
    "PINTURA & CERAKOTE"
  ],
  categorias_estoque: [
    "COMPONENTES & PEÇAS",
    "LIMPEZA & CONSERVAÇÃO",
    "MIRAS & ÓPTICAS",
    "ACESSÓRIOS & CARREGADORES",
    "INSUMOS"
  ],
  categorias_financeiro: [
    "SERVIÇO ARMERIA",
    "VENDA DE BALCÃO",
    "SANGRIA DE CAIXA",
    "REFORÇO / APORTE",
    "PEÇAS & INSUMOS",
    "DESPESAS OPERACIONAIS",
    "IMPOSTOS & TAXAS"
  ],
  categorias_equipamento: [
    "PISTOLA",
    "REVÓLVER",
    "CARABINA",
    "FUZIL",
    "ESPINGARDA",
    "ARMA DE AR COMPRIMIDO",
    "ACESSÓRIO / SUPORTE"
  ],
  catalogo_servicos: [
    { id: "s1", nome: "MANUTENÇÃO GERAL & LIMPEZA ULTRASSÔNICA", valor: 250.00, categoria: "MANUTENÇÃO" },
    { id: "s2", nome: "REVISÃO DE EXTRATOR E MOLA RECUPERADORA", valor: 180.00, categoria: "REPARO" },
    { id: "s3", nome: "AJUSTE E ALÍVIO DE GATILHO TÁTICO", valor: 350.00, categoria: "PERSONALIZAÇÃO" },
    { id: "s4", nome: "INSTALAÇÃO DE RED DOT / LUNETA E COLIMAÇÃO", valor: 150.00, categoria: "ÓPTICA" },
    { id: "s5", nome: "POLIMENTO DE RAMPA DE ALIMENTAÇÃO E TAMBOR", valor: 200.00, categoria: "ACABAMENTO" }
  ],
  ordem_menu: [
    'home', 'alertas', 'caixa', 'ordens', 'vendas', 'clientes', 'estoque', 'orcamentos', 'financeiro', 'usuarios', 'configuracoes'
  ],
  som_geral_ativado: true,
  regras_alertas_sons: [
    {
      status: 'AGUARDANDO APROVAÇÃO',
      disparar_alerta: true,
      tocar_som: true,
      destinatario: 'RECEPCAO',
      tom_som: 'alerta_medio',
      mensagem_padrao: 'Laudo e orçamento disponibilizado pelo armeiro para aprovação com o cliente.'
    },
    {
      status: 'APROVADO',
      disparar_alerta: true,
      tocar_som: true,
      destinatario: 'OFICINA',
      tom_som: 'alerta_sucesso',
      mensagem_padrao: 'Cliente aprovou o orçamento da O.S. Manutenção liberada para execução pelo armeiro.'
    },
    {
      status: 'AGUARDANDO RETIRADA',
      disparar_alerta: true,
      tocar_som: true,
      destinatario: 'RECEPCAO',
      tom_som: 'alerta_conclusao',
      mensagem_padrao: 'Manutenção concluída pelo armeiro. Equipamento pronto para retirada pelo cliente.'
    },
    {
      status: 'EM MANUTENÇÃO',
      disparar_alerta: false,
      tocar_som: false,
      destinatario: 'OFICINA',
      tom_som: 'alerta_medio',
      mensagem_padrao: 'Serviço em andamento na oficina pelo armeiro.'
    }
  ],
  blocos_home: [
    { id: 'aguardando_aprovacao', titulo: 'O.S. Aguardando Aprovação', perfis: ['master', 'armeiro', 'recepcao'], ativado: true },
    { id: 'aprovado', titulo: 'O.S. Aprovado', perfis: ['master', 'armeiro', 'recepcao'], ativado: true },
    { id: 'aguardando_retirada', titulo: 'O.S. Aguardando Retirada', perfis: ['master', 'armeiro', 'recepcao'], ativado: true },
    { id: 'em_analise', titulo: 'O.S. Em Análise', perfis: ['master', 'armeiro', 'recepcao'], ativado: true },
    { id: 'nao_iniciado', titulo: 'O.S. Não Iniciado', perfis: ['master', 'armeiro', 'recepcao'], ativado: true },
    { id: 'em_manutencao', titulo: 'O.S. Em Manutenção', perfis: ['master', 'armeiro', 'recepcao'], ativado: true },
    { id: 'bloco_estoque', titulo: 'Estoque de Peças & Insumos', perfis: ['master', 'armeiro', 'recepcao'], ativado: true },
    { id: 'bloco_caixa', titulo: 'Caixa da Recepção', perfis: ['master', 'recepcao'], ativado: true },
    { id: 'bloco_financeiro', titulo: 'Controle Financeiro & DRE', perfis: ['master', 'recepcao'], ativado: true },
    { id: 'bloco_clientes_resumo', titulo: 'Resumo de Clientes & Acervo', perfis: ['master', 'recepcao'], ativado: true },
    { id: 'bloco_fluxo_resumo', titulo: 'Resumo Caixa & Fluxo Financeiro', perfis: ['master', 'recepcao'], ativado: true }
  ]
};

// Base de Armas e Metadados Padrão (Importados do Portal G-CAC)
export const CATEGORIAS_BASE = [
  "Arma de Fogo",
  "Arma de Ar Comprimido",
  "Outros"
];

export const TIPOS_BASE = [
  "Pistola",
  "Carabina/Fuzil",
  "Espingarda",
  "Revólver",
  "Outros"
];

export const ORGAOS_REGISTRO_BASE = [
  "SINARM",
  "SIGMA",
  "Não requer registro"
];

export const CALIBRES_BASE = [
  ".22 LR", ".22 WMR", ".223 REM / 5.56 NATO", ".30-06 SPRG", ".308 WIN / 7.62 NATO", 
  ".357 MAG", ".38 SPL", ".380 ACP", "9mm LUGER", ".40 S&W", ".44 MAG", 
  ".45 ACP", ".454 CASULL", "12 GA", "20 GA", "28 GA", "36 GA",
  "4.5mm (.177)", "5.5mm (.22)", "6.35mm (.25)"
];

export const FABRICANTES_BASE = [
  "BENELLI", "BERETTA", "BOITO", "BROWNING", "CANIK", "CBC", "COLT", "CZ", 
  "GLOCK", "IMBEL", "REMINGTON", "ROSSI", "RUGER", "SIG SAUER", 
  "SMITH & WESSON", "SPRINGFIELD ARMORY", "STOEGER", "TANFOGLIO", 
  "TAURUS", "WALTHER", "WINCHESTER"
];

export const MODELOS_BASE = [
  // Taurus
  "G2C", "G3", "G3C", "G3 TORO", "GX4", "TH9", "TH380", "TH40", "TS9",
  "PT 92", "PT 100", "PT 838", "PT 1911", "RT 85", "RT 88", "RT 856", "RT 608", "RT 817", "T4", "CTT40",
  // Glock
  "G17", "G19", "G19X", "G20", "G21", "G22", "G25", "G43", "G43X", "G44", "G45", "G17 Gen5",
  // Outros Nacionais
  "MD1", "MD2", "MD6", "MD7", "M1911 A1", "PUMP MILITARY 3.0", "7022", "8122", "PUMP", "ERA 2001", "MIURA I", "MIURA II", "PUMA", "RT 718",
  // Internacionais Populares
  "APX", "92FS", "M9", "P-10 C", "P-10 F", "CZ 75", "SHADOW 2", "TS 2", "SCORPION",
  "P320", "P365", "M17", "M18", "P226", "M&P 9", "M&P 15", "SHIELD", "MODEL 686",
  "TP9", "TP9SF", "TP9 ELITE", "RIVAL", "1911", "M4", "PYTHON", "HELLCAT", "XD", "M1A",
  "PPQ", "PDP", "P22", "10/22", "MARK IV", "LCP", "SECURITY-9", "870", "700", "STR-9", "M3000",
  "SUPERNOVA", "STOCK II", "STOCK III", "DEFORCE", "HI-POWER", "BUCK MARK", "SXP", "MODEL 70"
];

export const INITIAL_LOGS = [];

export const INITIAL_ESTOQUE = [];

export const INITIAL_CAIXAS = [];

export const INITIAL_ALERTAS = [];



