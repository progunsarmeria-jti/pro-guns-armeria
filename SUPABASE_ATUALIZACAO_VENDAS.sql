-- ==============================================================================
-- ATUALIZAÇÃO DO BANCO DE DADOS - ARQUIVO DE VENDAS & TRÂMITES REGULATÓRIOS
-- Pró Guns Armeria - Compatível com SINARM (Polícia Federal) e SIGMA (Exército)
-- Execute este script no SQL Editor do seu Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Expansão de Colunas na Tabela de Vendas (proguns_vendas)
ALTER TABLE proguns_vendas 
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
ADD COLUMN IF NOT EXISTS dados_tramite_arma jsonb,
ADD COLUMN IF NOT EXISTS dados_regulamento_municao jsonb;

-- 2. Índices de Otimização e Rastreio
CREATE INDEX IF NOT EXISTS idx_proguns_vendas_numero ON proguns_vendas (numero_venda);
CREATE INDEX IF NOT EXISTS idx_proguns_vendas_status_tramite ON proguns_vendas (status_tramite_arma);
CREATE INDEX IF NOT EXISTS idx_proguns_vendas_data ON proguns_vendas (data);
CREATE INDEX IF NOT EXISTS idx_proguns_vendas_cliente_cpf ON proguns_vendas (cliente_cpf);

-- 3. Habilita Realtime e desativa RLS se necessário
ALTER TABLE proguns_vendas DISABLE ROW LEVEL SECURITY;
ALTER TABLE proguns_vendas REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'proguns_vendas') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.proguns_vendas;
    END IF;
END $$;
