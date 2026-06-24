const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ===============================
// CAMINHO DO BANCO
// ===============================
const dbPath = process.env.RENDER
  ? '/data/recrutamento.db'
  : path.join(__dirname, '..', 'recrutamento.db');

// ===============================
// CONEXÃO
// ===============================
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar SQLite:', err.message);
  } else {
    console.log('✅ SQLite conectado em:', dbPath);
  }
});

// ===============================
// TABELA
// ===============================
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS recrutamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_id TEXT NOT NULL,
      nick TEXT,
      arma TEXT,
      ip TEXT,
      horario TEXT,
      status TEXT NOT NULL DEFAULT 'PENDENTE',
      data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ Erro ao criar tabela:', err.message);
    } else {
      console.log('📦 Tabela recrutamentos pronta');
    }
  });
});

// ===============================
// EXPORTAÇÃO
// ===============================
module.exports = db;