-- ==============================================================================
-- ATUALIZAÇÃO FISCAL & CONTROLE DE NOTAS FISCAIS (NF-e) - PRÓ GUNS ARMERIA
-- Execute este script no SQL Editor do painel Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Adiciona os campos fiscais na tabela de estoque (proguns_estoque)
ALTER TABLE proguns_estoque 
ADD COLUMN IF NOT EXISTS codigo_barras text,
ADD COLUMN IF NOT EXISTS ncm text,
ADD COLUMN IF NOT EXISTS cest text,
ADD COLUMN IF NOT EXISTS unidade text DEFAULT 'UN',
ADD COLUMN IF NOT EXISTS origem text DEFAULT '0',
ADD COLUMN IF NOT EXISTS fornecedor_nome text,
ADD COLUMN IF NOT EXISTS fornecedor_cnpj text,
ADD COLUMN IF NOT EXISTS ultima_nf_entrada text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Cria índice para busca ultrarrápida por código de barras e NCM
CREATE INDEX IF NOT EXISTS idx_proguns_estoque_barras ON proguns_estoque (codigo_barras);
CREATE INDEX IF NOT EXISTS idx_proguns_estoque_ncm ON proguns_estoque (ncm);

-- 2. Cria a tabela de histórico de notas fiscais de entrada (proguns_notas_fiscais)
CREATE TABLE IF NOT EXISTS proguns_notas_fiscais (
  id text PRIMARY KEY,
  numero_nf text,
  serie text,
  chave_acesso text UNIQUE,
  data_emissao timestamptz,
  data_entrada timestamptz DEFAULT now(),
  fornecedor_nome text,
  fornecedor_cnpj text,
  fornecedor_uf text,
  valor_produtos numeric DEFAULT 0,
  valor_frete numeric DEFAULT 0,
  valor_ipi numeric DEFAULT 0,
  valor_st numeric DEFAULT 0,
  valor_total numeric DEFAULT 0,
  itens_json jsonb,
  observacoes text,
  created_at timestamptz DEFAULT now()
);

-- 3. Habilita segurança RLS e permissões de leitura/escrita
ALTER TABLE proguns_notas_fiscais ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'proguns_notas_fiscais' AND policyname = 'Permissao total proguns_notas_fiscais'
  ) THEN
    CREATE POLICY "Permissao total proguns_notas_fiscais" 
    ON proguns_notas_fiscais 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
  END IF;
END $$;
