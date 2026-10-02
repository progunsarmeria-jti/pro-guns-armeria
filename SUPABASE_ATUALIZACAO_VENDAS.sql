-- ==============================================================================
-- ATUALIZAÇÃO DO BANCO DE DADOS - ARQUIVO DE VENDAS, TRÂMITES PF & FOTOS STORAGE
-- Pró Guns Armeria - Compatível com SINARM / SINARM CAC (Polícia Federal)
-- Execute este script no SQL Editor do seu Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Garante a existência da Tabela de Vendas (proguns_vendas)
CREATE TABLE IF NOT EXISTS public.proguns_vendas (
    id TEXT PRIMARY KEY,
    numero_venda INT,
    cliente_nome TEXT,
    itens JSONB DEFAULT '[]'::jsonb,
    valor_total DECIMAL(10,2) DEFAULT 0.00,
    forma_pagamento TEXT,
    status TEXT DEFAULT 'Concluído',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Expansão de Colunas na Tabela de Vendas (proguns_vendas)
ALTER TABLE public.proguns_vendas 
ADD COLUMN IF NOT EXISTS tipo_venda text DEFAULT 'VENDA_BALCAO',
ADD COLUMN IF NOT EXISTS status_venda text DEFAULT 'CONCLUIDA',
ADD COLUMN IF NOT EXISTS status_tramite_arma text DEFAULT 'FINALIZADA',
ADD COLUMN IF NOT EXISTS cliente_id text,
ADD COLUMN IF NOT EXISTS cliente_cpf text,
ADD COLUMN IF NOT EXISTS cliente_rg text,
ADD COLUMN IF NOT EXISTS cliente_cr text,
ADD COLUMN IF NOT EXISTS cliente_telefone text,
ADD COLUMN IF NOT EXISTS cliente_email text,
ADD COLUMN IF NOT EXISTS cliente_endereco text,
ADD COLUMN IF NOT EXISTS data text,
ADD COLUMN IF NOT EXISTS hora text,
ADD COLUMN IF NOT EXISTS valor_subtotal numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS desconto numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_final numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_pago numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS troco numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS operador text,
ADD COLUMN IF NOT EXISTS dados_tramite_arma jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dados_regulamento_municao jsonb DEFAULT '{}'::jsonb;

-- 3. Expansão de Especificações Técnicas de Armas no Estoque (proguns_estoque)
ALTER TABLE public.proguns_estoque
ADD COLUMN IF NOT EXISTS quantidade_raias text,
ADD COLUMN IF NOT EXISTS sentido_raias text,
ADD COLUMN IF NOT EXISTS tipo_funcionamento text,
ADD COLUMN IF NOT EXISTS possui_carregadores boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS quantidade_carregadores text;

-- 4. Índices de Otimização e Rastreio
CREATE INDEX IF NOT EXISTS idx_proguns_vendas_numero ON public.proguns_vendas (numero_venda);
CREATE INDEX IF NOT EXISTS idx_proguns_vendas_status_tramite ON public.proguns_vendas (status_tramite_arma);
CREATE INDEX IF NOT EXISTS idx_proguns_vendas_data ON public.proguns_vendas (data);
CREATE INDEX IF NOT EXISTS idx_proguns_vendas_cliente_cpf ON public.proguns_vendas (cliente_cpf);

-- 5. Habilita Realtime e desativa RLS na tabela de vendas
ALTER TABLE public.proguns_vendas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proguns_vendas REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proguns_vendas') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.proguns_vendas;
    END IF;
END $$;

-- 6. Configuração do Storage (Bucket 'guias_trafego' para fotos de trâmite, autorizações e CRAF)
INSERT INTO storage.buckets (id, name, public)
VALUES ('guias_trafego', 'guias_trafego', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Permissões públicas para envio e leitura das fotos enviadas pelo celular
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Permissao Leitura Publica guias_trafego'
    ) THEN
        CREATE POLICY "Permissao Leitura Publica guias_trafego" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'guias_trafego');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Permissao Upload Publico guias_trafego'
    ) THEN
        CREATE POLICY "Permissao Upload Publico guias_trafego" 
        ON storage.objects FOR INSERT 
        WITH CHECK (bucket_id = 'guias_trafego');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Permissao Update Publico guias_trafego'
    ) THEN
        CREATE POLICY "Permissao Update Publico guias_trafego" 
        ON storage.objects FOR UPDATE 
        USING (bucket_id = 'guias_trafego');
    END IF;
END $$;
