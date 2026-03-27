const path = require("path");
const sqlite3 = require("sqlite3").verbose();

let db;

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function initDb(userDataPath) {
  const dbPath = path.join(userDataPath, "gr_assessoria.sqlite");
  db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cnpj TEXT UNIQUE,
        empresa TEXT,
        situacao TEXT,
        porte TEXT,
        municipio TEXT,
        uf TEXT,
        telefone TEXT,
        email TEXT,
        atividade_principal TEXT,
        socios TEXT,
        observacoes TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cnpj TEXT,
        scope TEXT,
        owner TEXT,
        document_name TEXT,
        file_name TEXT,
        file_path TEXT,
        file_type TEXT,
        file_size INTEGER,
        status TEXT DEFAULT 'pendente',
        justification TEXT,
        notes TEXT,
        uploaded_at TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
}

async function getClients() {
  const rows = await all(`SELECT * FROM clients ORDER BY empresa ASC`);
  return rows.map((row) => ({
    ...row,
    socios: row.socios ? JSON.parse(row.socios) : [],
  }));
}

async function upsertClient(client) {
  const socios = JSON.stringify(client.socios || []);

  await run(
    `
    INSERT INTO clients (
      cnpj, empresa, situacao, porte, municipio, uf, telefone, email, atividade_principal, socios, observacoes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(cnpj) DO UPDATE SET
      empresa=excluded.empresa,
      situacao=excluded.situacao,
      porte=excluded.porte,
      municipio=excluded.municipio,
      uf=excluded.uf,
      telefone=excluded.telefone,
      email=excluded.email,
      atividade_principal=excluded.atividade_principal,
      socios=excluded.socios,
      observacoes=excluded.observacoes,
      updated_at=CURRENT_TIMESTAMP
    `,
    [
      client.cnpj,
      client.empresa,
      client.situacao || "",
      client.porte || "",
      client.municipio || "",
      client.uf || "",
      client.telefone || "",
      client.email || "",
      client.atividade_principal || "",
      socios,
      client.observacoes || "",
    ]
  );

  return { ok: true };
}

async function getDocumentsByClient(cnpj) {
  return all(
    `SELECT * FROM documents WHERE cnpj = ? ORDER BY owner, document_name, uploaded_at DESC`,
    [cnpj]
  );
}

async function insertDocumentRecord(payload) {
  const {
    cnpj,
    scope,
    owner,
    document_name,
    file_name,
    file_path,
    file_type,
    file_size,
    status,
    justification,
    notes,
    uploaded_at,
  } = payload;

  await run(
    `
    INSERT INTO documents (
      cnpj, scope, owner, document_name, file_name, file_path, file_type, file_size, status, justification, notes, uploaded_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
    [
      cnpj,
      scope,
      owner,
      document_name,
      file_name || "",
      file_path || "",
      file_type || "",
      file_size || 0,
      status || "pendente",
      justification || "",
      notes || "",
      uploaded_at || new Date().toISOString(),
    ]
  );

  return { ok: true };
}

async function updateDocumentValidation(payload) {
  const { id, status, justification, notes } = payload;

  await run(
    `
    UPDATE documents
    SET status = ?, justification = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [status || "pendente", justification || "", notes || "", id]
  );

  return { ok: true };
}

async function deleteClient(cnpj) {
  await run(`DELETE FROM documents WHERE cnpj = ?`, [cnpj]);
  await run(`DELETE FROM clients WHERE cnpj = ?`, [cnpj]);

  return { ok: true };
}

module.exports = {
  initDb,
  getClients,
  upsertClient,
  getDocumentsByClient,
  insertDocumentRecord,
  updateDocumentValidation,
  deleteClient,
};
