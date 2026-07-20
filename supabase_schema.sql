-- ==========================================================
-- SCRIPT DE BANCO DE DADOS COMPLETO - PRÓ GUNS ARMERIA
-- EXECUTE ESTE SCRIPT NO 'SQL EDITOR' DO SEU SUPABASE
-- ==========================================================

-- 1. Tabela de Configuração da Armeria
CREATE TABLE IF NOT EXISTS public.empresa_config (
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
CREATE TABLE IF NOT EXISTS public.clientes (
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
CREATE TABLE IF NOT EXISTS public.armas (
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
CREATE TABLE IF NOT EXISTS public.ordens (
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
CREATE TABLE IF NOT EXISTS public.orcamentos (
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
CREATE TABLE IF NOT EXISTS public.financeiro (
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
CREATE TABLE IF NOT EXISTS public.usuarios (
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

-- ==========================================================
-- DESATIVAR RLS PARA ACESSO DIRETO VIA CHAVE ANÔNIMA
-- ==========================================================
ALTER TABLE public.empresa_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.armas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- ==========================================================
-- HABILITAR SUPABASE REALTIME (NOTIFICAÇÕES VIA WEBSOCKET)
-- ==========================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'ordens') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ordens;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'clientes') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.clientes;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'armas') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.armas;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orcamentos') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orcamentos;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'financeiro') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.financeiro;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'usuarios') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.usuarios;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'empresa_config') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.empresa_config;
    END IF;
END $$;

-- Configurar Replica Identity para payload completo em atualizações
ALTER TABLE public.empresa_config REPLICA IDENTITY FULL;
ALTER TABLE public.clientes REPLICA IDENTITY FULL;
ALTER TABLE public.armas REPLICA IDENTITY FULL;
ALTER TABLE public.ordens REPLICA IDENTITY FULL;
ALTER TABLE public.orcamentos REPLICA IDENTITY FULL;
ALTER TABLE public.financeiro REPLICA IDENTITY FULL;
ALTER TABLE public.usuarios REPLICA IDENTITY FULL;
