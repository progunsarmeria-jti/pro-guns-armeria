-- ==============================================================================
-- ATUALIZAÇÃO DO BANCO DE DADOS - MÓDULO DE ORDENS DE SERVIÇO & SINCRONIZAÇÃO
-- Pró Guns Armeria - Sistema de Gestão de Armas, Munições e Oficina Mecânica CAC
-- Execute este script no SQL Editor do seu Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Expansão de Colunas na Tabela de Ordens de Serviço (proguns_ordens)
-- Garante persistência dos campos de Laudo, Diagnóstico, Aprovação e Checkout/Pagamento
ALTER TABLE public.proguns_ordens
ADD COLUMN IF NOT EXISTS itens_laudo JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS diagnostico_armeiro TEXT,
ADD COLUMN IF NOT EXISTS solucao_proposta TEXT,
ADD COLUMN IF NOT EXISTS observacoes_armeiro TEXT,
ADD COLUMN IF NOT EXISTS laudo_concluido_em TEXT,
ADD COLUMN IF NOT EXISTS data_aprovacao TEXT,
ADD COLUMN IF NOT EXISTS data_conclusao TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS desconto_valor NUMERIC DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS desconto_tipo TEXT DEFAULT 'NONE',
ADD COLUMN IF NOT EXISTS desconto_input TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS forma_pagamento TEXT DEFAULT 'Dinheiro',
ADD COLUMN IF NOT EXISTS checkout_realizado_em TEXT;

-- 2. Garantir Desativação de RLS para Acesso Completo Direto via Chave Anônima
ALTER TABLE public.proguns_ordens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proguns_alertas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proguns_estoque DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proguns_caixas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proguns_financeiro DISABLE ROW LEVEL SECURITY;

-- 3. Habilitar Payload Completo em Atualizações Realtime (REPLICA IDENTITY FULL)
-- Necessário para que alterações de status enviem todos os campos pelo WebSocket
ALTER TABLE public.proguns_ordens REPLICA IDENTITY FULL;
ALTER TABLE public.proguns_alertas REPLICA IDENTITY FULL;
ALTER TABLE public.proguns_estoque REPLICA IDENTITY FULL;
ALTER TABLE public.proguns_caixas REPLICA IDENTITY FULL;
ALTER TABLE public.proguns_financeiro REPLICA IDENTITY FULL;

-- 4. Adicionar Tabelas à Publicação Realtime do Supabase (supabase_realtime)
-- Permite que mudanças em um PC reflitam imediatamente no Tablet e outros terminais
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proguns_ordens') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.proguns_ordens;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proguns_alertas') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.proguns_alertas;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proguns_estoque') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.proguns_estoque;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proguns_caixas') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.proguns_caixas;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proguns_financeiro') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.proguns_financeiro;
    END IF;
END $$;

-- 5. Índices de Otimização e Performance de Busca
CREATE INDEX IF NOT EXISTS idx_proguns_ordens_numero ON public.proguns_ordens (numero_os);
CREATE INDEX IF NOT EXISTS idx_proguns_ordens_status ON public.proguns_ordens (status);
CREATE INDEX IF NOT EXISTS idx_proguns_ordens_cliente_id ON public.proguns_ordens (cliente_id);
CREATE INDEX IF NOT EXISTS idx_proguns_alertas_status ON public.proguns_alertas (status);
CREATE INDEX IF NOT EXISTS idx_proguns_alertas_os_id ON public.proguns_alertas (os_id);

-- ==============================================================================
-- FIM DO SCRIPT DE ATUALIZAÇÃO
-- ==============================================================================
