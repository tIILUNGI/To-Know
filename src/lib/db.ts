import type { Pool, PoolClient } from "pg";
import { connect } from "@vercel/postgres";

type DbResult<T = any> = { rows: T[]; rowCount: number };
type DbSingleResult<T = any> = T | undefined;

// Detect runtime: Vercel serverless vs local
const isVercel = typeof process.env.VERCEL === "1" || process.env.VERCEL_ENV?.length > 0;

let pgPool: Pool | null = null;
let sqliteDb: any = null;

// PostgreSQL client (Vercel)
async function getPgClient(): Promise<PoolClient | null> {
  if (!isVercel) return null;
  try {
    const client = await connect();
    return client;
  } catch (err) {
    console.error("PostgreSQL connection failed:", err);
    return null;
  }
}

// SQLite client (local development)
function getSqliteDb() {
  if (isVercel) return null;
  if (!sqliteDb) {
    const Database = require("better-sqlite3");
    sqliteDb = new Database("toknow.db");
    sqliteDb.pragma("journal_mode = WAL");
  }
  return sqliteDb;
}

// Normalize PostgreSQL result to match SQLite shape
function normalizePgResult<T>(rows: T[]): T[] {
  return rows.map(row => {
    if (!row) return row;
    const obj: any = {};
    for (const key in row) {
      let value = row[key];
      // Convert Date strings to Date objects if needed (optional)
      obj[key] = value;
    }
    return obj;
  });
}

// ============================================
// PARAMETERIZED QUERY HELPERS (safe from SQL injection)
// ============================================

export async function dbQuery<T = any>(sql: string, params: any[] = []): Promise<DbResult<T>> {
  if (isVercel) {
    const client = await getPgClient();
    if (!client) throw new Error("PostgreSQL not available");
    const res = await client.query(sql, params);
    return {
      rows: normalizePgResult(res.rows) as T[],
      rowCount: res.rowCount,
    };
  } else {
    const db = getSqliteDb()!;
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params) as T[];
    return {
      rows,
      rowCount: rows.length,
    };
  }
}

export async function dbGet<T = any>(sql: string, params: any[] = []): Promise<DbSingleResult<T>> {
  const result = await dbQuery<T>(sql, params);
  return result.rows[0];
}

export async function dbRun(sql: string, params: any[] = []): Promise<{ lastInsertRowid: number | bigint; changes: number }> {
  if (isVercel) {
    const client = await getPgClient();
    if (!client) throw new Error("PostgreSQL not available");
    const res = await client.query(sql + " RETURNING id", params);
    return {
      lastInsertRowid: Number(res.rows[0]?.id) || 0,
      changes: res.rowCount || 0,
    };
  } else {
    const db = getSqliteDb()!;
    const info = db.prepare(sql).run(...params);
    return {
      lastInsertRowid: Number(info.lastInsertRowid),
      changes: info.changes,
    };
  }
}

export async function dbExec(sql: string): Promise<void> {
  if (isVercel) {
    const client = await getPgClient();
    if (!client) throw new Error("PostgreSQL not available");
    await client.query(sql);
  } else {
    const db = getSqliteDb()!;
    db.exec(sql);
  }
}

// Transaction helpers
export async function dbTransaction<T>(fn: (tx: DbTx) => Promise<T>): Promise<T> {
  if (isVercel) {
    const client = await getPgClient();
    if (!client) throw new Error("PostgreSQL not available");
    await client.query("BEGIN");
    try {
      const tx: DbTx = {
        query: async (q: string, p: any[]) => client.query(q, p),
        get: async (q: string, p: any[]) => {
          const res = await client.query(q, p);
          return res.rows[0];
        },
        run: async (q: string, p: any[]) => {
          const res = await client.query(q + " RETURNING *", p);
          return res;
        },
        exec: async (q: string) => client.query(q),
      };
      const result = await fn(tx);
      await client.query("COMMIT");
      return result;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
  } else {
    const db = getSqliteDb()!;
    const native = db.transaction(() => fn({
      query: async (q: string, p: any[]) => db.prepare(q).all(...p),
      get: async (q: string, p: any[]) => db.prepare(q).get(...p),
      run: async (q: string, p: any[]) => {
        const info = db.prepare(q).run(...p);
        return { rows: [{ lastInsertRowid: info.lastInsertRowid, changes: info.changes }] };
      },
      exec: async (q: string) => db.exec(q),
    }) as any);
    return native;
  }
}

interface DbTx {
  query: (sql: string, params: any[]) => Promise<any>;
  get: (sql: string, params: any[]) => Promise<any>;
  run: (sql: string, params: any[]) => Promise<any>;
  exec: (sql: string) => Promise<void>;
}

// Initialize tables on startup
export async function initDatabase(): Promise<void> {
  if (isVercel) {
    console.log("[Vercel] Initializing PostgreSQL tables (IF NOT EXISTS)...");
    const createTables: string[] = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'Viewer',
        email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS entities (
        id SERIAL PRIMARY KEY,
        code VARCHAR(100) UNIQUE,
        name TEXT NOT NULL,
        trade_name TEXT,
        entity_type TEXT NOT NULL,
        sub_type TEXT,
        tax_id TEXT,
        registration_number TEXT,
        status TEXT DEFAULT 'Em análise',
        relationship_status TEXT DEFAULT 'Elegível',
        sector TEXT,
        supply_type TEXT,
        category TEXT,
        operational_impact TEXT,
        criticality TEXT,
        requesting_area TEXT,
        business_unit TEXT,
        payment_condition TEXT,
        currency TEXT,
        contract_limit DECIMAL,
        bank TEXT,
        iban TEXT,
        supply_history TEXT,
        estimated_annual_volume DECIMAL,
        segment TEXT,
        relationship_channel TEXT,
        importance TEXT,
        business_potential TEXT,
        credit_limit DECIMAL,
        purchase_frequency TEXT,
        average_ticket DECIMAL,
        address TEXT,
        province TEXT,
        municipality TEXT,
        country TEXT DEFAULT 'Angola',
        phone TEXT,
        mobile TEXT,
        email_main TEXT,
        website TEXT,
        resp_name TEXT,
        resp_position TEXT,
        resp_mobile TEXT,
        resp_email TEXT,
        is_pep BOOLEAN DEFAULT FALSE,
        has_sanctions BOOLEAN DEFAULT FALSE,
        money_laundering_risk TEXT,
        default_risk TEXT,
        judicial_history TEXT,
        reputational_history TEXT,
        fraud_risk TEXT,
        financial_risk TEXT,
        operational_risk TEXT,
        final_risk_rating TEXT,
        observations TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS criteria (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        entity_type TEXT,
        process_type TEXT,
        evaluation_type TEXT,
        weight INTEGER DEFAULT 1,
        min_score INTEGER DEFAULT 0,
        max_score INTEGER DEFAULT 10,
        is_required BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 99
      )`,
      `CREATE TABLE IF NOT EXISTS process_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS processes (
        id SERIAL PRIMARY KEY,
        process_number VARCHAR(100) UNIQUE NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'Rascunho',
        opener_id INTEGER,
        area TEXT,
        justification TEXT,
        priority TEXT,
        entity_id INTEGER,
        current_step INTEGER DEFAULT 1,
        approval_purpose TEXT,
        operational_need TEXT,
        result_score DECIMAL,
        result_percentage DECIMAL,
        compliance_level TEXT,
        classification TEXT,
        validity_date DATE,
        next_reevaluation_date DATE,
        conditions TEXT,
        comments TEXT,
        approver_id INTEGER,
        decision_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (opener_id) REFERENCES users(id),
        FOREIGN KEY (approver_id) REFERENCES users(id),
        FOREIGN KEY (entity_id) REFERENCES entities(id)
      )`,
      `CREATE TABLE IF NOT EXISTS process_criteria (
        id SERIAL PRIMARY KEY,
        process_id INTEGER NOT NULL,
        criteria_id INTEGER NOT NULL,
        score INTEGER,
        evidence TEXT,
        comments TEXT,
        FOREIGN KEY (process_id) REFERENCES processes(id),
        FOREIGN KEY (criteria_id) REFERENCES criteria(id)
      )`,
      `CREATE TABLE IF NOT EXISTS evaluations (
        id SERIAL PRIMARY KEY,
        process_id INTEGER,
        entity_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        evaluation_type TEXT,
        periodicity TEXT,
        evaluator_id INTEGER,
        evaluation_date DATE,
        period_start DATE,
        period_end DATE,
        product_service TEXT,
        unit TEXT,
        overall_score DECIMAL,
        percentage DECIMAL,
        classification TEXT,
        recommended_action TEXT,
        action_plan TEXT,
        action_plan_deadline DATE,
        action_plan_responsible TEXT,
        previous_evaluation_id INTEGER,
        evaluation_number TEXT,
        name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (process_id) REFERENCES processes(id),
        FOREIGN KEY (entity_id) REFERENCES entities(id),
        FOREIGN KEY (evaluator_id) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS evaluation_responses (
        id SERIAL PRIMARY KEY,
        evaluation_id INTEGER NOT NULL,
        group_name TEXT,
        criterion_name TEXT,
        score INTEGER,
        observation TEXT,
        evidence TEXT,
        FOREIGN KEY (evaluation_id) REFERENCES evaluations(id)
      )`,
      `CREATE TABLE IF NOT EXISTS history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        entity_id INTEGER,
        action TEXT NOT NULL,
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (entity_id) REFERENCES entities(id)
      )`,
      `CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        type TEXT DEFAULT 'Alert',
        priority TEXT DEFAULT 'Info',
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        entity_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT,
        url TEXT NOT NULL,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (entity_id) REFERENCES entities(id)
      )`,
      `CREATE TABLE IF NOT EXISTS workflow_history (
        id SERIAL PRIMARY KEY,
        process_id INTEGER NOT NULL,
        step_from INTEGER,
        step_to INTEGER,
        action TEXT,
        notes TEXT,
        performed_by INTEGER,
        performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (process_id) REFERENCES processes(id),
        FOREIGN KEY (performed_by) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE,
        name TEXT NOT NULL,
        email TEXT,
        position TEXT,
        department TEXT,
        hire_date DATE,
        status TEXT DEFAULT 'Ativo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS evaluation_links (
        id SERIAL PRIMARY KEY,
        evaluation_id INTEGER,
        token VARCHAR(255) UNIQUE NOT NULL,
        client_email TEXT,
        expires_at DATE,
        is_used BOOLEAN DEFAULT FALSE,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (evaluation_id) REFERENCES evaluations(id)
      )`,
      `CREATE TABLE IF NOT EXISTS collaboration_forms (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        form_type TEXT NOT NULL,
        entity_type TEXT,
        created_by INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS collaboration_questions (
        id SERIAL PRIMARY KEY,
        form_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        question_type TEXT DEFAULT 'rating',
        options TEXT,
        weight DECIMAL DEFAULT 1,
        is_required BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,
        FOREIGN KEY (form_id) REFERENCES collaboration_forms(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS collaboration_responses (
        id SERIAL PRIMARY KEY,
        form_id INTEGER NOT NULL,
        evaluated_id INTEGER,
        evaluator_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        score INTEGER,
        comment TEXT,
        response_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        evaluated_employee_id INTEGER,
        FOREIGN KEY (form_id) REFERENCES collaboration_forms(id),
        FOREIGN KEY (evaluated_id) REFERENCES entities(id),
        FOREIGN KEY (evaluator_id) REFERENCES users(id),
        FOREIGN KEY (question_id) REFERENCES collaboration_questions(id),
        FOREIGN KEY (evaluated_employee_id) REFERENCES employees(id)
      )`
    ];

    const client = await getPgClient();
    if (!client) throw new Error("PostgreSQL client not available");

    for (const sql of createTables) {
      try { await client.query(sql); } catch (e) { /* ignore if exists */ }
    }

    // Seed default users
    const userCount = await dbGet<{ cnt: number }>("SELECT COUNT(*) as cnt FROM users");
    if (userCount && Number(userCount.cnt) === 0) {
      const hash = await bcrypt.hash("admin123", 10);
      await dbRun("INSERT INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?, ?)", ["admin", hash, "Administrador", "Administrator", "admin@toknow.co.ao"]);
      const hash2 = await bcrypt.hash("gestor123", 10);
      await dbRun("INSERT INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?, ?)", ["gestor", hash2, "Gestor Compliance", "Compliance Manager", "gestor@toknow.co.ao"]);
      const hash3 = await bcrypt.hash("compras123", 10);
      await dbRun("INSERT INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?)", ["compras", hash3, "Compras", "Procurement", "compras@toknow.co.ao"]);
      console.log("✓ Seeded default users (PostgreSQL)");
    }

    // Seed criteria
    const critCount = await dbGet<{ cnt: number }>("SELECT COUNT(*) as cnt FROM criteria");
    if (critCount && Number(critCount.cnt) === 0) {
      const critData = [
        ["CRIT-001", "Qualidade", "Qualidade do produto/serviço", "Supplier", "Aprovação", 10, 5],
        ["CRIT-002", "Prazo", "Cumprimento de prazos", "Supplier", "Aprovação", 8, 5],
        ["CRIT-003", "Compliance", "Conformidade legal", "Supplier", "Aprovação", 10, 5],
        ["CRIT-004", "Preço", "Preço competitivo", "Supplier", "Avaliação", 10, 5],
        ["CRIT-005", "QualidadeServ", "Qualidade do serviço", "Client", "Performance", 10, 5],
        ["CRIT-006", "Satisfacao", "Nível de satisfação", "Client", "Satisfaction", 10, 5]
      ];
      for (const c of critData) {
        await dbRun("INSERT INTO criteria (code, name, description, entity_type, process_type, weight, max_score, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)", c);
      }
      console.log("✓ Seeded default criteria (PostgreSQL)");
    }

    // Seed process types
    const ptCount = await dbGet<{ cnt: number }>("SELECT COUNT(*) as cnt FROM process_types");
    if (ptCount && Number(ptCount.cnt) === 0) {
      await dbRun("INSERT INTO process_types (name, description, sort_order) VALUES ('Aprovação', 'Processo de due diligence e aprovação de fornecedores ou clientes', 1) ON CONFLICT DO NOTHING");
      await dbRun("INSERT INTO process_types (name, description, sort_order) VALUES ('Avaliação', 'Avaliação de performance ou satisfação de entidades existentes', 2) ON CONFLICT DO NOTHING");
      await dbRun("INSERT INTO process_types (name, description, sort_order) VALUES ('Reavaliação', 'Reavaliação periódica de fornecedores ou clientes', 3) ON CONFLICT DO NOTHING");
      console.log("✓ Seeded process_types (PostgreSQL)");
    }

    // Seed 360 form
    const formCount = await dbGet<{ cnt: number }>("SELECT COUNT(*) as cnt FROM collaboration_forms WHERE form_type = '360'");
    if (formCount && Number(formCount.cnt) === 0) {
      const result = await dbRun(
        "INSERT INTO collaboration_forms (title, description, form_type, entity_type, created_by) VALUES (?, ?, ?, ?, ?)",
        ["Avaliação 360° - Know You Work", "Formulário padrão para avaliação 360° de colaboradores (autoavaliação, avaliação de pares e avaliação da empresa)", "360", "Employee", 1]
      );
      const formId = Number(result.lastInsertRowid);

      const questions = [
        ["Comunicação e colaboração", "rating", null, 2.0, true, 1],
        ["Responsabilidade", "rating", null, 2.0, true, 2],
        ["Qualidade do trabalho", "rating", null, 2.0, true, 3],
        ["Iniciativa e proatividade", "rating", null, 2.0, true, 4],
        ["Adaptabilidade", "rating", null, 1.5, true, 5],
        ["Liderança (se aplicável)", "rating", null, 1.5, false, 6],
        ["Pontos fortes", "text", null, 0, false, 7],
        ["Áreas de melhoria", "text", null, 0, false, 8],
        ["Sugestões", "text", null, 0, false, 9]
      ];
      for (const q of questions) {
        await dbRun(
          "INSERT INTO collaboration_questions (form_id, question_text, question_type, options, weight, is_required, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [formId, q[0], q[1], q[2], q[3], q[4], q[5]]
        );
      }
      console.log("✓ Seeded 360° form (PostgreSQL)");
    }

    console.log("✓ Database initialized (PostgreSQL)");
  } else {
    // Local SQLite
    const db = getSqliteDb()!;
    const tables: string[] = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'Viewer',
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS entities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE,
        name TEXT NOT NULL,
        trade_name TEXT,
        entity_type TEXT NOT NULL,
        sub_type TEXT,
        tax_id TEXT,
        registration_number TEXT,
        status TEXT DEFAULT 'Em análise',
        relationship_status TEXT DEFAULT 'Elegível',
        sector TEXT,
        supply_type TEXT,
        category TEXT,
        operational_impact TEXT,
        criticality TEXT,
        requesting_area TEXT,
        business_unit TEXT,
        payment_condition TEXT,
        currency TEXT,
        contract_limit REAL,
        bank TEXT,
        iban TEXT,
        supply_history TEXT,
        estimated_annual_volume REAL,
        segment TEXT,
        relationship_channel TEXT,
        importance TEXT,
        business_potential TEXT,
        credit_limit REAL,
        purchase_frequency TEXT,
        average_ticket REAL,
        address TEXT,
        province TEXT,
        municipality TEXT,
        country TEXT DEFAULT 'Angola',
        phone TEXT,
        mobile TEXT,
        email_main TEXT,
        website TEXT,
        resp_name TEXT,
        resp_position TEXT,
        resp_mobile TEXT,
        resp_email TEXT,
        is_pep INTEGER DEFAULT 0,
        has_sanctions INTEGER DEFAULT 0,
        money_laundering_risk TEXT,
        default_risk TEXT,
        judicial_history TEXT,
        reputational_history TEXT,
        fraud_risk TEXT,
        financial_risk TEXT,
        operational_risk TEXT,
        final_risk_rating TEXT,
        observations TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    ];
    tables.forEach(sql => { try { db.exec(sql); } catch { /* ignore */ } });
    console.log("✓ Database initialized (SQLite)");
  }
}
