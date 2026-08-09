import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import sqlite3 from 'sqlite3';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do CORS para permitir acesso de qualquer origem local
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));

// Inicialização do Banco SQLite
const dbPath = path.join(__dirname, 'armeria_local.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Erro ao abrir banco SQLite:', err.message);
  else console.log('Conectado ao banco SQLite local:', dbPath);
});

// Inicialização do Cliente Supabase para Sincronização
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Mapeamento de Tabelas
const TABLE_MAP = {
  ordens: 'proguns_ordens',
  clientes: 'proguns_clientes',
  armas: 'proguns_armas',
  orcamentos: 'proguns_orcamentos',
  financeiro: 'proguns_financeiro',
  usuarios: 'proguns_usuarios',
  config: 'proguns_config',
  logs: 'proguns_logs',
  estoque: 'proguns_estoque',
  caixas: 'proguns_caixas',
  alertas: 'proguns_alertas',
  vendas: 'proguns_vendas'
};

const getRealTableName = (tabela) => TABLE_MAP[tabela] || tabela;

// Criar Tabelas no SQLite se não existirem
db.serialize(() => {
  // Tabela auxiliar para armazenar exclusões pendentes
  db.run(`CREATE TABLE IF NOT EXISTS deleted_records (
    id TEXT PRIMARY KEY,
    table_name TEXT,
    deleted_at TEXT
  )`);

  // Tabelas Principais do Sistema
  const tablesSchema = {
    proguns_config: `id TEXT PRIMARY KEY, nome_fantasia TEXT, razao_social TEXT, cnpj TEXT, cr_armeria TEXT, validade_cr TEXT, rm_armeria TEXT, telefone TEXT, whatsapp TEXT, email TEXT, endereco TEXT, cidade TEXT, uf TEXT, logo_url TEXT, created_at TEXT, ordem_menu TEXT, pending_sync INTEGER DEFAULT 0`,
    
    proguns_clientes: `id TEXT PRIMARY KEY, nome_completo TEXT, cpf TEXT, rg TEXT, orgao_emissor TEXT, data_nascimento TEXT, profissao TEXT, email TEXT, telefone TEXT, cep TEXT, endereco TEXT, numero TEXT, bairro TEXT, cidade TEXT, uf TEXT, numero_cr TEXT, validade_cr TEXT, regiao_militar TEXT, categorias TEXT, clube_filiado TEXT, status TEXT, observacoes TEXT, created_at TEXT, atividades_apostiladas TEXT, pending_sync INTEGER DEFAULT 0`,
    
    proguns_armas: `id TEXT PRIMARY KEY, cliente_id TEXT, tipo TEXT, especie TEXT, marca TEXT, modelo TEXT, calibre TEXT, numero_serie TEXT, numero_sigma_sinarm TEXT, orgao_registro TEXT, numero_craf TEXT, validade_craf TEXT, craf_anexo_url TEXT, capacidade INTEGER, acessorios TEXT, status TEXT, created_at TEXT, pending_sync INTEGER DEFAULT 0`,
    
    proguns_ordens: `id TEXT PRIMARY KEY, numero_os INTEGER, cliente_id TEXT, cliente_nome TEXT, categoria_arma TEXT, tipo_arma TEXT, marca_arma TEXT, modelo_arma TEXT, calibre_arma TEXT, numero_serie_arma TEXT, problema_relatado TEXT, acessorios_acompanhantes TEXT, gt_protocolo TEXT, gt_data_emissao TEXT, gt_data_vencimento TEXT, gt_anexo_url TEXT, tipo_servico TEXT, valor_servico REAL, valor_taxamento REAL, status TEXT, diagnostico_armeiro TEXT, solucao_proposta TEXT, created_at TEXT, pending_sync INTEGER DEFAULT 0`,
    
    proguns_orcamentos: `id TEXT PRIMARY KEY, numero_orcamento INTEGER, cliente_id TEXT, cliente_nome TEXT, valor_total REAL, desconto REAL, valor_final REAL, forma_pagamento TEXT, validade_dias INTEGER, status TEXT, itens TEXT, observacoes TEXT, created_at TEXT, pending_sync INTEGER DEFAULT 0`,
    
    proguns_financeiro: `id TEXT PRIMARY KEY, descricao TEXT, tipo TEXT, categoria TEXT, valor REAL, data_vencimento TEXT, data_pagamento TEXT, status TEXT, forma_pagamento TEXT, cliente_id TEXT, ordem_id TEXT, orcamento_id TEXT, created_at TEXT, pending_sync INTEGER DEFAULT 0`,
    
    proguns_usuarios: `id TEXT PRIMARY KEY, nome_completo TEXT, cpf TEXT, email TEXT, senha_pessoal TEXT, cargo TEXT, perfil TEXT, status TEXT, permissoes TEXT, created_at TEXT, pending_sync INTEGER DEFAULT 0`,
    
    proguns_estoque: `id TEXT PRIMARY KEY, codigo_sku TEXT, nome TEXT, categoria TEXT, preco_custo REAL, preco_venda REAL, quantidade INTEGER, estoque_minimo INTEGER, localizacao TEXT, created_at TEXT, pending_sync INTEGER DEFAULT 0`,
    
    proguns_caixas: `id TEXT PRIMARY KEY, data TEXT, hora_abertura TEXT, hora_fechamento TEXT, operador_abertura TEXT, operador_fechamento TEXT, saldo_inicial REAL, status TEXT, movimentacoes TEXT, conferencia TEXT, created_at TEXT, pending_sync INTEGER DEFAULT 0`,
    
    proguns_alertas: `id TEXT PRIMARY KEY, os_id TEXT, os_numero INTEGER, cliente_nome TEXT, cliente_telefone TEXT, equipamento TEXT, tipo_alerta TEXT, destinatario TEXT, mensagem TEXT, status TEXT, tentativas_contato TEXT, resolucao TEXT, created_at TEXT, pending_sync INTEGER DEFAULT 0`,
    
    proguns_logs: `id TEXT PRIMARY KEY, usuario TEXT, acao TEXT, detalhes TEXT, ip TEXT, user_agent TEXT, created_at TEXT, pending_sync INTEGER DEFAULT 0`,
    
    proguns_vendas: `id TEXT PRIMARY KEY, data TEXT, itens TEXT, valor_total REAL, forma_pagamento TEXT, status TEXT, created_at TEXT, pending_sync INTEGER DEFAULT 0`
  };

  for (const [tName, tSchema] of Object.entries(tablesSchema)) {
    db.run(`CREATE TABLE IF NOT EXISTS ${tName} (${tSchema})`);
  }
});

// WebSocket Server para comunicação Realtime local
const clients = new Map(); // ws -> Set(channels)

const broadcastToLocal = (message, excludeWs = null) => {
  const payload = JSON.stringify(message);
  for (const [clientWs, channels] of clients.entries()) {
    if (clientWs === excludeWs) continue;
    if (clientWs.readyState === 1) { // OPEN
      // Se for um evento geral de reload ou se o cliente está escutando o canal correspondente
      if (!message.channel || channels.has(message.channel)) {
        clientWs.send(payload);
      }
    }
  }
};

// ─── ROTAS DA API REST ───────────────────────────────────────────────────────

// Teste de conexão (Ping)
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), database: 'SQLite local-server' });
});

// GET: Carrega todos os registros de uma tabela
app.get('/api/db/:table', (req, res) => {
  const tableName = getRealTableName(req.params.table);
  db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
    if (err) {
      console.error(`Erro ao carregar da tabela ${tableName}:`, err.message);
      return res.status(500).json({ error: err.message });
    }
    // Converter campos JSON salvos como strings de volta para objetos
    const processedRows = rows.map(row => {
      const copy = { ...row };
      // Remover a coluna de controle interno de sync
      delete copy.pending_sync;
      
      // Parsear colunas JSON conhecidas
      ['categorias', 'itens', 'permissoes', 'movimentacoes', 'conferencia', 'tentativas_contato', 'resolucao'].forEach(col => {
        if (copy[col] && typeof copy[col] === 'string') {
          try { copy[col] = JSON.parse(copy[col]); } catch (e) {}
        }
      });
      return copy;
    });
    res.json(processedRows);
  });
});

// POST: Salva ou atualiza um registro (UPSERT)
app.post('/api/db/:table', (req, res) => {
  const tableName = getRealTableName(req.params.table);
  const record = req.body;
  if (!record || !record.id) {
    return res.status(400).json({ error: 'Registro inválido ou sem campo ID.' });
  }

  // Marcar como pendente de sincronização com a nuvem
  const recordToInsert = { ...record, pending_sync: 1 };

  // Serializar campos de arrays/objetos em strings JSON para o SQLite
  ['categorias', 'itens', 'permissoes', 'movimentacoes', 'conferencia', 'tentativas_contato', 'resolucao'].forEach(col => {
    if (recordToInsert[col] && typeof recordToInsert[col] === 'object') {
      recordToInsert[col] = JSON.stringify(recordToInsert[col]);
    }
  });

  const columns = Object.keys(recordToInsert);
  const placeholders = columns.map(() => '?').join(', ');
  const values = Object.values(recordToInsert);

  const sql = `REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

  db.run(sql, values, function(err) {
    if (err) {
      console.error(`Erro ao salvar na tabela ${tableName}:`, err.message);
      return res.status(500).json({ error: err.message });
    }
    
    // Broadcast realtime local para atualizar os outros computadores na rede
    broadcastToLocal({ event: 'reload', table: req.params.table });
    
    // Tenta rodar a sincronia assincronamente sem segurar a requisição
    triggerSyncWorker();

    res.json({ success: true, id: record.id });
  });
});

// POST: Salva múltiplos registros de uma vez (BULK UPSERT)
app.post('/api/db/:table/bulk', (req, res) => {
  const tableName = getRealTableName(req.params.table);
  const records = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'Lista de registros inválida ou vazia.' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    let hasError = false;

    const stmt = db.prepare((() => {
      const sample = { ...records[0], pending_sync: 1 };
      ['categorias', 'itens', 'permissoes', 'movimentacoes', 'conferencia', 'tentativas_contato', 'resolucao'].forEach(col => {
        if (sample[col] && typeof sample[col] === 'object') sample[col] = '';
      });
      const columns = Object.keys(sample);
      const placeholders = columns.map(() => '?').join(', ');
      return `REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    })());

    for (const record of records) {
      const recordToInsert = { ...record, pending_sync: 1 };
      ['categorias', 'itens', 'permissoes', 'movimentacoes', 'conferencia', 'tentativas_contato', 'resolucao'].forEach(col => {
        if (recordToInsert[col] && typeof recordToInsert[col] === 'object') {
          recordToInsert[col] = JSON.stringify(recordToInsert[col]);
        }
      });

      const values = Object.values(recordToInsert);
      stmt.run(values, (err) => {
        if (err) {
          console.error(`Erro no Bulk INSERT para ${tableName}:`, err.message);
          hasError = true;
        }
      });
    }

    stmt.finalize();

    if (hasError) {
      db.run('ROLLBACK');
      res.status(500).json({ error: 'Erro ao executar inserção em lote.' });
    } else {
      db.run('COMMIT');
      broadcastToLocal({ event: 'reload', table: req.params.table });
      triggerSyncWorker();
      res.json({ success: true, count: records.length });
    }
  });
});

// DELETE: Exclui um registro
app.delete('/api/db/:table/:id', (req, res) => {
  const tableName = getRealTableName(req.params.table);
  const id = req.params.id;

  // Registrar a exclusão para enviar ao Supabase depois
  db.run(`REPLACE INTO deleted_records (id, table_name, deleted_at) VALUES (?, ?, ?)`, [id, req.params.table, new Date().toISOString()], (err) => {
    if (err) console.error('Erro ao registrar exclusão na fila de sync:', err.message);
  });

  db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id], function(err) {
    if (err) {
      console.error(`Erro ao deletar da tabela ${tableName}:`, err.message);
      return res.status(500).json({ error: err.message });
    }

    broadcastToLocal({ event: 'reload', table: req.params.table });
    triggerSyncWorker();

    res.json({ success: true });
  });
});

// ─── TRABALHADOR DE SINCRONIZAÇÃO SUPABASE (SYNC WORKER) ─────────────────────

let isSyncing = false;

const runSync = async () => {
  if (isSyncing || !supabase) return;
  isSyncing = true;

  try {
    // 1. Processar Exclusões Pendentes
    const deletedList = await new Promise((resolve) => {
      db.all('SELECT * FROM deleted_records', [], (err, rows) => {
        if (err) resolve([]);
        else resolve(rows || []);
      });
    });

    for (const del of deletedList) {
      const realTable = getRealTableName(del.table_name);
      console.log(`[Sync Worker] Excluindo id ${del.id} da tabela ${realTable} no Supabase...`);
      const { error } = await supabase.from(realTable).delete().eq('id', del.id);
      if (!error) {
        db.run('DELETE FROM deleted_records WHERE id = ?', [del.id]);
      } else {
        console.warn(`[Sync Worker] Falha ao deletar no Supabase (offline?):`, error.message);
      }
    }

    // 2. Processar Inserções/Atualizações Pendentes (pending_sync = 1)
    for (const [tabela, realTable] of Object.entries(TABLE_MAP)) {
      const pendingRows = await new Promise((resolve) => {
        db.all(`SELECT * FROM ${realTable} WHERE pending_sync = 1`, [], (err, rows) => {
          if (err) resolve([]);
          else resolve(rows || []);
        });
      });

      if (pendingRows.length === 0) continue;

      console.log(`[Sync Worker] Enviando ${pendingRows.length} registros de ${tabela} para o Supabase...`);

      // Preparar dados para o Supabase (remover coluna local e re-parsear strings de JSON)
      const cleanRows = pendingRows.map(row => {
        const copy = { ...row };
        delete copy.pending_sync;
        ['categorias', 'itens', 'permissoes', 'movimentacoes', 'conferencia', 'tentativas_contato', 'resolucao'].forEach(col => {
          if (copy[col] && typeof copy[col] === 'string') {
            try { copy[col] = JSON.parse(copy[col]); } catch (e) {}
          }
        });
        return copy;
      });

      // Envia via upsert no Supabase
      const { error } = await supabase.from(realTable).upsert(cleanRows, { onConflict: 'id' });
      if (!error) {
        // Sucesso! Atualiza flag local
        const ids = pendingRows.map(r => `'${r.id}'`).join(',');
        db.run(`UPDATE ${realTable} SET pending_sync = 0 WHERE id IN (${ids})`);
      } else {
        console.warn(`[Sync Worker] Falha ao enviar ${tabela} (offline?):`, error.message);
      }
    }

    // 3. Puxar alterações novas da nuvem para o local
    // (Apenas se a internet estiver funcionando e para manter bases locais em sincronia)
    for (const [tabela, realTable] of Object.entries(TABLE_MAP)) {
      const { data: cloudData, error } = await supabase.from(realTable).select('*');
      if (!error && Array.isArray(cloudData)) {
        // Para cada item da nuvem, se não existir localmente ou estiver com pending_sync = 0, atualiza no SQLite
        db.serialize(() => {
          const stmt = db.prepare((() => {
            const sample = { ...cloudData[0], pending_sync: 0 };
            ['categorias', 'itens', 'permissoes', 'movimentacoes', 'conferencia', 'tentativas_contato', 'resolucao'].forEach(col => {
              if (sample[col] && typeof sample[col] === 'object') sample[col] = '';
            });
            const columns = Object.keys(sample);
            const placeholders = columns.map(() => '?').join(', ');
            return `INSERT OR IGNORE INTO ${realTable} (${columns.join(', ')}) VALUES (${placeholders})`;
          })());

          for (const item of cloudData) {
            const itemToInsert = { ...item, pending_sync: 0 };
            ['categorias', 'itens', 'permissoes', 'movimentacoes', 'conferencia', 'tentativas_contato', 'resolucao'].forEach(col => {
              if (itemToInsert[col] && typeof itemToInsert[col] === 'object') {
                itemToInsert[col] = JSON.stringify(itemToInsert[col]);
              }
            });
            stmt.run(Object.values(itemToInsert));
          }
          stmt.finalize();
        });
      }
    }

  } catch (err) {
    console.error('[Sync Worker] Erro geral na sincronização:', err);
  } finally {
    isSyncing = false;
  }
};

const triggerSyncWorker = () => {
  setTimeout(runSync, 100);
};

// Rodar trabalhador a cada 30 segundos automaticamente
setInterval(runSync, 30000);

// ─── INICIALIZAÇÃO DOS SERVIDORES ───────────────────────────────────────────

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor Local rodando em http://localhost:${PORT}`);
  console.log(`Acessível na rede local em http://<IP-DESTE-PC>:${PORT}`);
});

// Configurar o servidor WebSocket sobre o mesmo servidor HTTP
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  clients.set(ws, new Set());

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Comando join: cliente escuta canal específico (ex: upload_gt_xxx)
      if (data.action === 'join' && data.channel) {
        clients.get(ws).add(data.channel);
        console.log(`Cliente WS conectado ao canal local: ${data.channel}`);
      }

      // Comando broadcast: envia um evento para todos no mesmo canal
      if (data.action === 'broadcast' && data.channel && data.event) {
        broadcastToLocal({
          channel: data.channel,
          event: data.event,
          payload: data.payload
        }, ws);
      }
    } catch (e) {
      console.error('Mensagem WS inválida:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});
