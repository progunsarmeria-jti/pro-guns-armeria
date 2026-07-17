-- ==========================================
-- SCRIPT DE BANCO DE DADOS - PRÓ GUNS ARMERIA
-- COPIE E EXECUTE NO 'SQL EDITOR' DO SUPABASE
-- ==========================================

-- 1. Tabela de Configuração da Armeria
CREATE TABLE IF NOT EXISTS public.empresa_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_fantasia TEXT NOT NULL DEFAULT 'Pró Guns Armeria',
    razao_social TEXT,
    cnpj TEXT,
    cr_armeria TEXT,
    validade_cr DATE,
    rm_armeria TEXT DEFAULT '2ª RM',
    telefone TEXT,
    whatsapp TEXT,
    email TEXT,
    endereco TEXT,
    cidade TEXT,
    uf VARCHAR(2),
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Inserir registro padrão se não existir
INSERT INTO public.empresa_config (nome_fantasia, cr_armeria, telefone, email)
SELECT 'Pró Guns Armeria', 'CR-00000', '(00) 00000-0000', 'contato@proguns.com.br'
WHERE NOT EXISTS (SELECT 1 FROM public.empresa_config);

-- 2. Tabela de Clientes CACs
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    rg TEXT,
    orgao_emissor TEXT,
    data_nascimento DATE,
    profissao TEXT,
    email TEXT,
    telefone TEXT NOT NULL,
    cep TEXT,
    endereco TEXT,
    numero TEXT,
    bairro TEXT,
    cidade TEXT,
    uf VARCHAR(2),
    
    -- Dados de CAC
    numero_cr TEXT,
    validade_cr DATE,
    regiao_militar TEXT DEFAULT '2ª RM',
    categorias TEXT[], -- Ex: ['Atirador', 'Caçador', 'Colecionador']
    clube_filiado TEXT,
    
    status TEXT DEFAULT 'Ativo', -- Ativo, Inativo, Bloqueado
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela de Acervo de Armas do Cliente
CREATE TABLE IF NOT EXISTS public.cliente_armas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL, -- Pistola, Fuzil, Espingarda, Carabina, Revólver
    especie TEXT,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    calibre TEXT NOT NULL,
    numero_serie TEXT NOT NULL,
    numero_sigma_sinarm TEXT,
    orgao_registro TEXT DEFAULT 'SIGMA', -- SIGMA ou SINARM
    numero_craf TEXT,
    validade_craf DATE,
    capacidade INT,
    acessorios TEXT,
    status TEXT DEFAULT 'Regular', -- Regular, Em Transferência, Vencida
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabela de Ordens de Serviço (Processos de Despachantaria)
CREATE TABLE IF NOT EXISTS public.ordens_servico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_os SERIAL UNIQUE,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE RESTRICT,
    tipo_servico TEXT NOT NULL, -- Concessão CR, Renovação CR, Autorização Compra, CRAF, GT, Transferência, Apostilamento
    orgao_destino TEXT DEFAULT 'Exército', -- Exército ou Polícia Federal
    numero_protocolo TEXT,
    data_protocolo DATE,
    valor_servico DECIMAL(10,2) DEFAULT 0.00,
    valor_taxamento DECIMAL(10,2) DEFAULT 0.00,
    status TEXT DEFAULT 'Em Aberto', -- Em Aberto, Aguardando Doc, Protocolado, Em Análise, Exigência, Deferido, Concluído, Cancelado
    detalhes TEXT,
    previsao_conclusao DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Histórico de Etapas da OS
CREATE TABLE IF NOT EXISTS public.ordem_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ordem_id UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    status_anterior TEXT,
    novo_status TEXT NOT NULL,
    observacao TEXT,
    criado_por TEXT DEFAULT 'Sistema',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.orcamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_orcamento SERIAL UNIQUE,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    valor_total DECIMAL(10,2) DEFAULT 0.00,
    desconto DECIMAL(10,2) DEFAULT 0.00,
    valor_final DECIMAL(10,2) DEFAULT 0.00,
    forma_pagamento TEXT,
    validade_dias INT DEFAULT 15,
    status TEXT DEFAULT 'Pendente', -- Pendente, Aprovado, Rejeitado, Convertido em OS
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Itens do Orçamento
CREATE TABLE IF NOT EXISTS public.orcamento_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    quantidade INT DEFAULT 1,
    valor_unitario DECIMAL(10,2) DEFAULT 0.00,
    valor_subtotal DECIMAL(10,2) DEFAULT 0.00
);

-- 8. Tabela do Módulo Financeiro
CREATE TABLE IF NOT EXISTS public.financeiro_lancamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'Receita' ou 'Despesa'
    categoria TEXT DEFAULT 'Serviço', -- Serviço, Venda, Taxa, Custo Fixo, Insumo
    valor DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status TEXT DEFAULT 'Pendente', -- Pendente, Pago, Atrasado, Cancelado
    forma_pagamento TEXT, -- PIX, Cartão, Boleto, Dinheiro
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    ordem_id UUID REFERENCES public.ordens_servico(id) ON DELETE SET NULL,
    orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS e Permissões de Leitura/Escrita Pública para desenvolvimento inicial
ALTER TABLE public.empresa_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_armas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordem_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_lancamentos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso livre anon/authenticated para protótipo inicial
CREATE POLICY "Permitir leitura em empresa_config" ON public.empresa_config FOR SELECT USING (true);
CREATE POLICY "Permitir tudo em clientes" ON public.clientes FOR ALL USING (true);
CREATE POLICY "Permitir tudo em cliente_armas" ON public.cliente_armas FOR ALL USING (true);
CREATE POLICY "Permitir tudo em ordens_servico" ON public.ordens_servico FOR ALL USING (true);
CREATE POLICY "Permitir tudo em ordem_historico" ON public.ordem_historico FOR ALL USING (true);
CREATE POLICY "Permitir tudo em orcamentos" ON public.orcamentos FOR ALL USING (true);
CREATE POLICY "Permitir tudo em orcamento_itens" ON public.orcamento_itens FOR ALL USING (true);
CREATE POLICY "Permitir tudo em financeiro_lancamentos" ON public.financeiro_lancamentos FOR ALL USING (true);
