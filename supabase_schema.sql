-- ==========================================================
-- SCRIPT DE BANCO DE DADOS COMPLETO - PRÓ GUNS ARMERIA
-- EXECUTE ESTE SCRIPT NO 'SQL EDITOR' DO SEU SUPABASE
-- (Cria tabelas exclusivas 'proguns_*' para evitar conflitos)
-- ==========================================================

-- 1. Tabela de Configuração da Armeria
CREATE TABLE IF NOT EXISTS public.proguns_config (
    id TEXT PRIMARY KEY,
    nome_fantasia TEXT NOT NULL DEFAULT 'Pró Guns Armeria',
    razao_social TEXT,
    cnpj TEXT,
    cr_armeria TEXT,
    validade_cr TEXT,
    rm_armeria TEXT DEFAULT '2ª RM',
    telefone TEXT,
    whatsapp TEXT,
    email TEXT,
    endereco TEXT,
    cidade TEXT,
    uf VARCHAR(10),
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela de Clientes CACs
CREATE TABLE IF NOT EXISTS public.proguns_clientes (
    id TEXT PRIMARY KEY,
    nome_completo TEXT NOT NULL,
    cpf TEXT,
    rg TEXT,
    orgao_emissor TEXT,
    data_nascimento TEXT,
    profissao TEXT,
    email TEXT,
    telefone TEXT,
    cep TEXT,
    endereco TEXT,
    numero TEXT,
    bairro TEXT,
    cidade TEXT,
    uf VARCHAR(10),
    numero_cr TEXT,
    validade_cr TEXT,
    regiao_militar TEXT DEFAULT '2ª RM',
    categorias JSONB DEFAULT '[]'::jsonb,
    clube_filiado TEXT,
    status TEXT DEFAULT 'Ativo',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela de Acervo de Armas do Cliente
CREATE TABLE IF NOT EXISTS public.proguns_armas (
    id TEXT PRIMARY KEY,
    cliente_id TEXT,
    tipo TEXT,
    especie TEXT,
    marca TEXT,
    modelo TEXT,
    calibre TEXT,
    numero_serie TEXT,
    numero_sigma_sinarm TEXT,
    orgao_registro TEXT DEFAULT 'SIGMA',
    numero_craf TEXT,
    validade_craf TEXT,
    capacidade INT,
    acessorios TEXT,
    status TEXT DEFAULT 'Regular',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabela de Ordens de Serviço (Armeria)
CREATE TABLE IF NOT EXISTS public.proguns_ordens (
    id TEXT PRIMARY KEY,
    numero_os INT,
    cliente_id TEXT,
    cliente_nome TEXT,
    categoria_arma TEXT,
    tipo_arma TEXT,
    marca_arma TEXT,
    modelo_arma TEXT,
    calibre_arma TEXT,
    numero_serie_arma TEXT,
    problema_relatado TEXT,
    acessorios_acompanhantes TEXT,
    gt_protocolo TEXT,
    gt_data_emissao TEXT,
    gt_data_vencimento TEXT,
    tipo_servico TEXT,
    valor_servico DECIMAL(10,2) DEFAULT 0.00,
    valor_taxamento DECIMAL(10,2) DEFAULT 0.00,
    status TEXT DEFAULT 'NÃO INICIADO',
    diagnostico_armeiro TEXT,
    solucao_proposta TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.proguns_orcamentos (
    id TEXT PRIMARY KEY,
    numero_orcamento INT,
    cliente_id TEXT,
    cliente_nome TEXT,
    valor_total DECIMAL(10,2) DEFAULT 0.00,
    desconto DECIMAL(10,2) DEFAULT 0.00,
    valor_final DECIMAL(10,2) DEFAULT 0.00,
    forma_pagamento TEXT,
    validade_dias INT DEFAULT 15,
    status TEXT DEFAULT 'Pendente',
    itens JSONB DEFAULT '[]'::jsonb,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Tabela do Módulo Financeiro
CREATE TABLE IF NOT EXISTS public.proguns_financeiro (
    id TEXT PRIMARY KEY,
    descricao TEXT NOT NULL,
    tipo TEXT NOT NULL,
    categoria TEXT DEFAULT 'Serviço Armeria',
    valor DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    data_vencimento TEXT,
    data_pagamento TEXT,
    status TEXT DEFAULT 'Pendente',
    forma_pagamento TEXT,
    cliente_id TEXT,
    ordem_id TEXT,
    orcamento_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Tabela de Usuários do Sistema
CREATE TABLE IF NOT EXISTS public.proguns_usuarios (
    id TEXT PRIMARY KEY,
    nome_completo TEXT NOT NULL,
    cpf TEXT,
    email TEXT,
    senha_pessoal TEXT,
    cargo TEXT,
    perfil TEXT DEFAULT 'recepcao',
    status TEXT DEFAULT 'Ativo',
    permissoes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Tabela de Controle de Estoque
CREATE TABLE IF NOT EXISTS public.proguns_estoque (
    id TEXT PRIMARY KEY,
    codigo_sku TEXT,
    nome TEXT NOT NULL,
    categoria TEXT DEFAULT 'Componentes & Peças',
    preco_custo DECIMAL(10,2) DEFAULT 0.00,
    preco_venda DECIMAL(10,2) DEFAULT 0.00,
    quantidade INT DEFAULT 0,
    estoque_minimo INT DEFAULT 2,
    localizacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. Tabela de Controle de Caixas Diários (PDV)
CREATE TABLE IF NOT EXISTS public.proguns_caixas (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    hora_abertura TEXT,
    hora_fechamento TEXT,
    operador_abertura TEXT,
    operador_fechamento TEXT,
    saldo_inicial DECIMAL(10,2) DEFAULT 0.00,
    status TEXT DEFAULT 'ABERTO',
    movimentacoes JSONB DEFAULT '[]'::jsonb,
    conferencia JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. Tabela de Central de Alertas e Atendimentos da Recepção
CREATE TABLE IF NOT EXISTS public.proguns_alertas (
    id TEXT PRIMARY KEY,
    os_id TEXT,
    os_numero INT,
    cliente_nome TEXT,
    cliente_telefone TEXT,
    equipamento TEXT,
    tipo_alerta TEXT,
    destinatario TEXT,
    mensagem TEXT,
    status TEXT DEFAULT 'PENDENTE',
    tentativas_contato JSONB DEFAULT '[]'::jsonb,
    resolucao JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================================
-- DESATIVAR RLS PARA ACESSO DIRETO VIA CHAVE ANÔNIMA
-- ==========================================================
ALTER TABLE public.proguns_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proguns_clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proguns_armas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proguns_ordens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proguns_orcamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proguns_financeiro DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proguns_usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proguns_estoque DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proguns_caixas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proguns_alertas DISABLE ROW LEVEL SECURITY;

-- ==========================================================
-- HABILITAR SUPABASE REALTIME (NOTIFICAÇÕES VIA WEBSOCKET)
-- ==========================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proguns_ordens') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.proguns_ordens;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proguns_clientes') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.proguns_clientes;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proguns_armas') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.proguns_armas;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proguns_orcamentos') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.proguns_orcamentos;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proguns_financeiro') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.proguns_financeiro;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proguns_usuarios') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.proguns_usuarios;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proguns_config') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.proguns_config;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proguns_estoque') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.proguns_estoque;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proguns_caixas') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.proguns_caixas;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proguns_alertas') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.proguns_alertas;
    END IF;
END $$;

-- Configurar Replica Identity para payload completo em atualizações
ALTER TABLE public.proguns_config REPLICA IDENTITY FULL;
ALTER TABLE public.proguns_clientes REPLICA IDENTITY FULL;
ALTER TABLE public.proguns_armas REPLICA IDENTITY FULL;
ALTER TABLE public.proguns_ordens REPLICA IDENTITY FULL;
ALTER TABLE public.proguns_orcamentos REPLICA IDENTITY FULL;
ALTER TABLE public.proguns_financeiro REPLICA IDENTITY FULL;
ALTER TABLE public.proguns_usuarios REPLICA IDENTITY FULL;
ALTER TABLE public.proguns_estoque REPLICA IDENTITY FULL;
ALTER TABLE public.proguns_caixas REPLICA IDENTITY FULL;
ALTER TABLE public.proguns_alertas REPLICA IDENTITY FULL;


