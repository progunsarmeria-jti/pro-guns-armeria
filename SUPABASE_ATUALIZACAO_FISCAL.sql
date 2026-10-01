-- ==============================================================================
-- SISTEMA INTEGRADO DE ESTOQUES SEGMENTADOS & FISCAL - PRÓ GUNS ARMERIA
-- Compatível com exigências do Exército Brasileiro (DFPC), SICOVEM e SEFAZ-GO
-- Execute este script no SQL Editor do painel Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. ADICIONA CAMPOS FISCAIS E ESTRUTURAIS AO ESTOQUE
ALTER TABLE proguns_estoque 
ADD COLUMN IF NOT EXISTS tipo_estoque text DEFAULT 'PECA',
ADD COLUMN IF NOT EXISTS codigo_barras text,
ADD COLUMN IF NOT EXISTS ncm text,
ADD COLUMN IF NOT EXISTS cest text,
ADD COLUMN IF NOT EXISTS unidade text DEFAULT 'UN',
ADD COLUMN IF NOT EXISTS origem text DEFAULT '0',
ADD COLUMN IF NOT EXISTS fornecedor_nome text,
ADD COLUMN IF NOT EXISTS fornecedor_cnpj text,
ADD COLUMN IF NOT EXISTS ultima_nf_entrada text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. CAMPOS ESPECÍFICOS PARA O ESTOQUE DE ARMAS DE FOGO (PCE SERIALIZADO)
ALTER TABLE proguns_estoque
ADD COLUMN IF NOT EXISTS numero_serie text,
ADD COLUMN IF NOT EXISTS calibre text,
ADD COLUMN IF NOT EXISTS classificacao_calibre text DEFAULT 'PERMITIDO',
ADD COLUMN IF NOT EXISTS sistema_registro text DEFAULT 'SIGMA',
ADD COLUMN IF NOT EXISTS numero_sigma_sinarm text,
ADD COLUMN IF NOT EXISTS fabricante text,
ADD COLUMN IF NOT EXISTS modelo text,
ADD COLUMN IF NOT EXISTS tipo_arma text,
ADD COLUMN IF NOT EXISTS acabamento text,
ADD COLUMN IF NOT EXISTS comprimento_cano text,
ADD COLUMN IF NOT EXISTS capacidade_tiros text,
ADD COLUMN IF NOT EXISTS status_arma text DEFAULT 'DISPONIVEL',
ADD COLUMN IF NOT EXISTS cliente_reserva_id text,
ADD COLUMN IF NOT EXISTS cliente_reserva_nome text;

-- 3. CAMPOS ESPECÍFICOS PARA O ESTOQUE DE MUNIÇÕES (PCE BALÍSTICO / SICOVEM)
ALTER TABLE proguns_estoque
ADD COLUMN IF NOT EXISTS lote_fabricante text,
ADD COLUMN IF NOT EXISTS tipo_projetil text,
ADD COLUMN IF NOT EXISTS apresentacao_embalagem text,
ADD COLUMN IF NOT EXISTS quantidade_por_embalagem numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_caixas numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS preco_caixa numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS preco_unitario_cartucho numeric DEFAULT 0;

-- 4. ÍNDICES DE ALTA PERFORMANCE PARA CONSULTAS E FISCALIZAÇÃO
CREATE INDEX IF NOT EXISTS idx_proguns_estoque_tipo ON proguns_estoque (tipo_estoque);
CREATE INDEX IF NOT EXISTS idx_proguns_estoque_serie ON proguns_estoque (numero_serie);
CREATE INDEX IF NOT EXISTS idx_proguns_estoque_calibre ON proguns_estoque (calibre);
CREATE INDEX IF NOT EXISTS idx_proguns_estoque_lote ON proguns_estoque (lote_fabricante);
CREATE INDEX IF NOT EXISTS idx_proguns_estoque_barras ON proguns_estoque (codigo_barras);
CREATE INDEX IF NOT EXISTS idx_proguns_estoque_ncm ON proguns_estoque (ncm);

-- 5. CRIAÇÃO DA TABELA DE HISTÓRICO DE NOTAS FISCAIS DE ENTRADA (SEFAZ-GO)
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

-- 6. HABILITAÇÃO DE SEGURANÇA RLS E PERMISSÕES
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
