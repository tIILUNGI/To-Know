import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = 3000;
const db = new Database("toknow.db");
const SECRET_KEY = process.env.JWT_SECRET || "toknow-secret-key";

// ============================================================
// AUTO-CREATE TABLES IF NOT EXIST
// ============================================================
const initTables = () => {
  const tables = [
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
    `CREATE TABLE IF NOT EXISTS criteria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      entity_type TEXT,
      process_type TEXT,
      evaluation_type TEXT,
      weight INTEGER DEFAULT 1,
      min_score INTEGER DEFAULT 0,
      max_score INTEGER DEFAULT 10,
      is_required INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 99
    )`,
    `CREATE TABLE IF NOT EXISTS processes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      process_number TEXT UNIQUE NOT NULL,
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
      result_score REAL,
      result_percentage REAL,
      compliance_level TEXT,
      classification TEXT,
      validity_date DATE,
      next_reevaluation_date DATE,
      conditions TEXT,
      comments TEXT,
      approver_id INTEGER,
      decision_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (opener_id) REFERENCES users(id),
      FOREIGN KEY (approver_id) REFERENCES users(id),
      FOREIGN KEY (entity_id) REFERENCES entities(id)
    )`,
    `CREATE TABLE IF NOT EXISTS process_criteria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      process_id INTEGER NOT NULL,
      criteria_id INTEGER NOT NULL,
      score INTEGER,
      evidence TEXT,
      comments TEXT,
      FOREIGN KEY (process_id) REFERENCES processes(id),
      FOREIGN KEY (criteria_id) REFERENCES criteria(id)
    )`,
    `CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      overall_score REAL,
      percentage REAL,
      classification TEXT,
      recommended_action TEXT,
      action_plan TEXT,
      action_plan_deadline DATE,
      action_plan_responsible TEXT,
      previous_evaluation_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (process_id) REFERENCES processes(id),
      FOREIGN KEY (entity_id) REFERENCES entities(id),
      FOREIGN KEY (evaluator_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS evaluation_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evaluation_id INTEGER NOT NULL,
      group_name TEXT,
      criterion_name TEXT,
      score INTEGER,
      observation TEXT,
      evidence TEXT,
      FOREIGN KEY (evaluation_id) REFERENCES evaluations(id)
    )`,
    `CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      entity_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (entity_id) REFERENCES entities(id)
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      message TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      type TEXT DEFAULT 'Alert',
      priority TEXT DEFAULT 'Info',
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT,
      url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (entity_id) REFERENCES entities(id)
    )`,
    `CREATE TABLE IF NOT EXISTS workflow_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      process_id INTEGER NOT NULL,
      step_from INTEGER,
      step_to INTEGER,
      action TEXT,
      notes TEXT,
      performed_by INTEGER,
      performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (process_id) REFERENCES processes(id),
      FOREIGN KEY (performed_by) REFERENCES users(id)
    )`
  ];
  
  tables.forEach((sql: string) => {
    try { db.exec(sql); } catch (e) { /* ignore */ }
  });
  
  // Seed users if not exist
  const userCount = db.prepare("SELECT COUNT(*) as cnt FROM users").get() as any;
  if (userCount.cnt === 0) {
    const salt = bcrypt.genSaltSync(10);
    db.prepare("INSERT INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?, ?)").run("admin", bcrypt.hashSync("admin123", salt), "Administrador", "Administrator", "admin@toknow.co.ao");
    db.prepare("INSERT INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?)").run("gestor", bcrypt.hashSync("gestor123", salt), "Gestor Compliance", "Compliance Manager", "gestor@toknow.co.ao");
    db.prepare("INSERT INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?)").run("compras", bcrypt.hashSync("compras123", salt), "Compras", "Procurement", "compras@toknow.co.ao");
    console.log("✓ Seeded default users");
  }
  
   // Seed basic criteria if not exist
   const critCount = db.prepare("SELECT COUNT(*) as cnt FROM criteria").get() as any;
   if (critCount.cnt === 0) {
     const critData = [
       ["CRIT-001", "Qualidade", "Qualidade do produto/serviço", "Supplier", "Aprovação", 10, 5],
       ["CRIT-002", "Prazo", "Cumprimento de prazos", "Supplier", "Aprovação", 8, 5],
       ["CRIT-003", "Compliance", "Conformidade legal", "Supplier", "Aprovação", 10, 5],
       ["CRIT-004", "Preço", "Preço competitivo", "Supplier", "Avaliação", 10, 5],
       ["CRIT-005", "QualidadeServ", "Qualidade do serviço", "Client", "Performance", 10, 5],
       ["CRIT-006", "Satisfacao", "Nível de satisfação", "Client", "Satisfaction", 10, 5]
     ];
     critData.forEach((c: any[]) => {
       db.prepare("INSERT INTO criteria (code, name, description, entity_type, process_type, weight, max_score) VALUES (?, ?, ?, ?, ?, ?, ?)").run(c[0], c[1], c[2], c[3], c[4], c[5], c[6]);
     });
     console.log("✓ Seeded default criteria");
   }

    // Seed default 360 collaboration form if not exists
    const formCount = db.prepare("SELECT COUNT(*) as cnt FROM collaboration_forms WHERE form_type = '360'").get() as any;
    if (formCount.cnt === 0) {
      // Find any user (prefer Administrator)
      let createdBy = 1;
      const admin = db.prepare("SELECT id FROM users WHERE role = 'Administrator' LIMIT 1").get() as any;
      if (admin && admin.id) {
        createdBy = admin.id;
      } else {
        const anyUser = db.prepare("SELECT id FROM users LIMIT 1").get() as any;
        if (anyUser && anyUser.id) createdBy = anyUser.id;
      }

      const formId = db.prepare("INSERT INTO collaboration_forms (title, description, form_type, entity_type, created_by) VALUES (?, ?, ?, ?, ?)").run(
        "Avaliação 360° - Know You Work",
        "Formulário padrão para avaliação 360° de colaboradores (autoavaliação, avaliação de pares e avaliação da empresa)",
        "360",
        "Employee",
        createdBy
      ).lastInsertRowid;

      const questions = [
        // [question_text, question_type, options, weight, is_required, display_order]
        ["Comunicação e colaboração", "rating", null, 2.0, 1, 1],
        ["Responsabilidade", "rating", null, 2.0, 1, 2],
        ["Qualidade do trabalho", "rating", null, 2.0, 1, 3],
        ["Iniciativa e proatividade", "rating", null, 2.0, 1, 4],
        ["Adaptabilidade", "rating", null, 1.5, 1, 5],
        ["Liderança (se aplicável)", "rating", null, 1.5, 0, 6],
        ["Pontos fortes", "text", null, 0, 0, 7],
        ["Áreas de melhoria", "text", null, 0, 0, 8],
        ["Sugestões", "text", null, 0, 0, 9]
      ];

      const insertQ = db.prepare("INSERT INTO collaboration_questions (form_id, question_text, question_type, options, weight, is_required, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)");
      questions.forEach((q: any[]) => {
        // q = [question_text, question_type, options, weight, is_required, display_order]
        insertQ.run(formId, q[0], q[1], q[2], q[3], q[4], q[5]);
      });

      console.log("✓ Seeded default 360° evaluation form");
    }
  
  console.log("✓ Database initialized");
};

initTables();

// ============================================================
// MIGRATIONS
// ============================================================
// Ensure relationship_status column exists in entities
const checkColumn = db.prepare("PRAGMA table_info(entities)");
const cols = checkColumn.all() as any[];
if (!cols.find((c: any) => c.name === "relationship_status")) {
  db.exec("ALTER TABLE entities ADD COLUMN relationship_status TEXT DEFAULT 'Elegível'");
  console.log("✓ Added relationship_status column to entities");
}
if (!cols.find((c: any) => c.name === "updated_at")) {
  try {
    db.exec("ALTER TABLE entities ADD COLUMN updated_at DATETIME");
    console.log("✓ Added updated_at column to entities (safe mode)");
  } catch(e) {
    console.log("entities updated_at already exists");
  }
}

// Ensure evaluation_number and name columns exist in evaluations
const checkEvalColumn = db.prepare("PRAGMA table_info(evaluations)");
const evalCols = checkEvalColumn.all() as any[];
if (!evalCols.find((c: any) => c.name === "evaluation_number")) {
  db.exec("ALTER TABLE evaluations ADD COLUMN evaluation_number TEXT");
  console.log("✓ Added evaluation_number column to evaluations");
}
if (!evalCols.find((c: any) => c.name === "name")) {
  db.exec("ALTER TABLE evaluations ADD COLUMN name TEXT");
  console.log("✓ Added name column to evaluations");
}

// Ensure current_step column exists in processes
const checkProcessCol = db.prepare("PRAGMA table_info(processes)");
const procCols = checkProcessCol.all() as any[];
if (!procCols.find((c: any) => c.name === "current_step")) {
  db.exec("ALTER TABLE processes ADD COLUMN current_step INTEGER DEFAULT 1");
  console.log("✓ Added current_step column to processes");
}
if (!procCols.find((c: any) => c.name === "updated_at")) {
  try {
    db.exec("ALTER TABLE processes ADD COLUMN updated_at DATETIME");
    console.log("✓ Added updated_at column to processes (safe mode)");
  } catch(e) {
    console.log("updated_at already exists or migration skipped");
  }
}
if (!procCols.find((c: any) => c.name === "approval_purpose")) {
  db.exec("ALTER TABLE processes ADD COLUMN approval_purpose TEXT");
  console.log("✓ Added approval_purpose column to processes");
}
if (!procCols.find((c: any) => c.name === "operational_need")) {
  db.exec("ALTER TABLE processes ADD COLUMN operational_need TEXT");
  console.log("✓ Added operational_need column to processes");
}
if (!procCols.find((c: any) => c.name === "result_score")) {
  db.exec("ALTER TABLE processes ADD COLUMN result_score REAL");
  console.log("✓ Added result_score column to processes");
}
if (!procCols.find((c: any) => c.name === "result_percentage")) {
  db.exec("ALTER TABLE processes ADD COLUMN result_percentage REAL");
  console.log("✓ Added result_percentage column to processes");
}
if (!procCols.find((c: any) => c.name === "compliance_level")) {
  db.exec("ALTER TABLE processes ADD COLUMN compliance_level TEXT");
  console.log("✓ Added compliance_level column to processes");
}
if (!procCols.find((c: any) => c.name === "validity_date")) {
  db.exec("ALTER TABLE processes ADD COLUMN validity_date DATE");
  console.log("✓ Added validity_date column to processes");
}
if (!procCols.find((c: any) => c.name === "next_reevaluation_date")) {
  db.exec("ALTER TABLE processes ADD COLUMN next_reevaluation_date DATE");
  console.log("✓ Added next_reevaluation_date column to processes");
}
if (!procCols.find((c: any) => c.name === "conditions")) {
  db.exec("ALTER TABLE processes ADD COLUMN conditions TEXT");
  console.log("✓ Added conditions column to processes");
}
if (!procCols.find((c: any) => c.name === "comments")) {
  db.exec("ALTER TABLE processes ADD COLUMN comments TEXT");
  console.log("✓ Added comments column to processes");
}
if (!procCols.find((c: any) => c.name === "approver_id")) {
  db.exec("ALTER TABLE processes ADD COLUMN approver_id INTEGER");
  console.log("✓ Added approver_id column to processes");
}
if (!procCols.find((c: any) => c.name === "decision_date")) {
  db.exec("ALTER TABLE processes ADD COLUMN decision_date DATETIME");
  console.log("✓ Added decision_date column to processes");
}

// Ensure upload_date column exists in documents
const checkDocCol = db.prepare("PRAGMA table_info(documents)");
const docCols = checkDocCol.all() as any[];
if (!docCols.find((c: any) => c.name === "upload_date")) {
  db.exec("ALTER TABLE documents ADD COLUMN upload_date DATETIME");
  console.log("✓ Added upload_date column to documents (NULL default)");
}

// Ensure is_required column exists in criteria
const checkCritCol = db.prepare("PRAGMA table_info(criteria)");
const critCols = checkCritCol.all() as any[];
if (!critCols.find((c: any) => c.name === "is_required")) {
  db.exec("ALTER TABLE criteria ADD COLUMN is_required INTEGER DEFAULT 1");
  console.log("✓ Added is_required column to criteria");
}
if (!critCols.find((c: any) => c.name === "evaluation_type")) {
  db.exec("ALTER TABLE criteria ADD COLUMN evaluation_type TEXT");
  console.log("✓ Added evaluation_type column to criteria");
}

// Ensure collaboration tables exist
const checkCollabTable = (name) => db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);

if (!checkCollabTable("collaboration_forms")) {
  db.exec(`
    CREATE TABLE collaboration_forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      form_type TEXT NOT NULL,
      entity_type TEXT,
      created_by INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);
  console.log("✓ Created collaboration_forms table");
}

if (!checkCollabTable("collaboration_questions")) {
  db.exec(`
    CREATE TABLE collaboration_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT DEFAULT 'rating',
      options TEXT,
      weight REAL DEFAULT 1,
      is_required INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      FOREIGN KEY (form_id) REFERENCES collaboration_forms(id) ON DELETE CASCADE
    )
  `);
  console.log("✓ Created collaboration_questions table");
}

if (!checkCollabTable("collaboration_responses")) {
  db.exec(`
    CREATE TABLE collaboration_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER NOT NULL,
      evaluated_id INTEGER,
      evaluator_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      score INTEGER,
      comment TEXT,
      response_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      evaluated_employee_id INTEGER,
      FOREIGN KEY (form_id) REFERENCES collaboration_forms(id),
      FOREIGN KEY (evaluated_id) REFERENCES entities(id),
      FOREIGN KEY (evaluator_id) REFERENCES users(id),
      FOREIGN KEY (question_id) REFERENCES collaboration_questions(id),
      FOREIGN KEY (evaluated_employee_id) REFERENCES employees(id)
    )
  `);
  console.log("✓ Created collaboration_responses table");
}

// Add evaluated_employee_id column if not exists (migration for 360 employee support)
const checkRespCol = db.prepare("PRAGMA table_info(collaboration_responses)");
const respCols = checkRespCol.all() as any[];
if (!respCols.find((c: any) => c.name === "evaluated_employee_id")) {
  db.exec("ALTER TABLE collaboration_responses ADD COLUMN evaluated_employee_id INTEGER");
  console.log("✓ Added evaluated_employee_id column to collaboration_responses");
}

// Ensure collaboration_forms has entity_type column
const formCols = db.prepare("PRAGMA table_info(collaboration_forms)").all() as any[];
if (!formCols.find((c: any) => c.name === "entity_type")) {
  db.exec("ALTER TABLE collaboration_forms ADD COLUMN entity_type TEXT");
  console.log("✓ Added entity_type column to collaboration_forms");
}
if (!formCols.find((c: any) => c.name === "is_active")) {
  db.exec("ALTER TABLE collaboration_forms ADD COLUMN is_active INTEGER DEFAULT 1");
  console.log("✓ Added is_active column to collaboration_forms");
}

// Ensure employees table exists
if (!checkCollabTable("employees")) {
  db.exec(`
    CREATE TABLE employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      email TEXT,
      position TEXT,
      department TEXT,
      hire_date DATE,
      status TEXT DEFAULT 'Ativo',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  console.log("✓ Created employees table");
}

// Ensure evaluation_links table exists for customer satisfaction sharing
if (!checkCollabTable("evaluation_links")) {
  db.exec(`
    CREATE TABLE evaluation_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evaluation_id INTEGER,
      token TEXT UNIQUE NOT NULL,
      client_email TEXT,
      expires_at DATE,
      is_used INTEGER DEFAULT 0,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (evaluation_id) REFERENCES evaluations(id)
    )
  `);
  console.log("✓ Created evaluation_links table");
}

// Fix processes with NULL current_step
try {
  const nullSteps = db.prepare("SELECT COUNT(*) as cnt FROM processes WHERE current_step IS NULL").get() as any;
  if (nullSteps.cnt > 0) {
    db.exec("UPDATE processes SET current_step = 1 WHERE current_step IS NULL");
    console.log("✓ Fixed " + nullSteps.cnt + " processes with NULL current_step");
  }
} catch (e) { /* ignore */ }

// Ensure process_types table exists
const checkTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='process_types'");
if (!checkTable.get()) {
  db.exec(`
    CREATE TABLE process_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  // Seed initial data
  db.prepare(`
    INSERT INTO process_types (name, description, sort_order) VALUES 
      ('Aprovação', 'Processo de due diligence e aprovação de fornecedores ou clientes', 1),
      ('Avaliação', 'Avaliação de performance ou satisfação de entidades existentes', 2),
      ('Reavaliação', 'Reavaliação periódica de fornecedores ou clientes', 3)
  `).run();
  console.log("✓ Created process_types table with seed data");
}

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// MIDDLEWARE: CORS
// ============================================================
app.use((req: any, res: any, next: any) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ============================================================
// MIDDLEWARE: Rate Limiting (in-memory)
// ============================================================
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const rateLimit = (maxRequests: number, windowMs: number) => (req: any, res: any, next: any) => {
  const key = req.ip || req.connection?.remoteAddress || "unknown";
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return next();
  }
  if (entry.count >= maxRequests) {
    return res.status(429).json({ message: "Demasiadas tentativas. Tente novamente mais tarde." });
  }
  entry.count++;
  next();
};

// Cleanup stale entries every 60s
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitStore.entries()) {
    if (now > val.resetTime) rateLimitStore.delete(key);
  }
}, 60_000);

// ============================================================
// HELPERS
// ============================================================
const validateRequired = (body: any, fields: string[]): string | null => {
  const missing = fields.filter(f => body[f] === undefined || body[f] === null || body[f] === "");
  return missing.length > 0 ? `Campos obrigatórios em falta: ${missing.join(", ")}` : null;
};

// Whitelist of valid entity columns to prevent SQL injection via dynamic column names
const ENTITY_SAFE_COLUMNS = new Set([
  "code", "name", "trade_name", "entity_type", "sub_type", "tax_id",
  "registration_number", "status", "relationship_status", "sector", "supply_type", "category",
  "operational_impact", "criticality", "requesting_area", "business_unit",
  "payment_condition", "currency", "contract_limit", "bank", "iban",
  "supply_history", "estimated_annual_volume", "segment", "relationship_channel",
  "importance", "business_potential", "credit_limit", "purchase_frequency",
  "average_ticket", "address", "province", "municipality", "country",
  "phone", "mobile", "email_main", "website", "resp_name", "resp_position",
  "resp_mobile", "resp_email", "is_pep", "has_sanctions", "money_laundering_risk",
  "default_risk", "judicial_history", "reputational_history", "fraud_risk",
  "financial_risk", "operational_risk", "final_risk_rating", "observations",
  "created_at", "updated_at"
]);

const paginate = (req: any) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

// ============================================================
// MIDDLEWARE: Auth
// ============================================================
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.sendStatus(401);
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1] || parts[1] === "null" || parts[1] === "undefined") {
    return res.sendStatus(401);
  }
  const token = parts[1];
  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ============================================================
// MIDDLEWARE: RBAC
// ============================================================
const requireRole = (...roles: string[]) => (req: any, res: any, next: any) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Permissão insuficiente para esta ação." });
  }
  next();
};

// ============================================================
// Audit Logging
// ============================================================
const logAction = (userId: number | null, entityId: number | null, action: string, details: string) => {
  db.prepare("INSERT INTO history (user_id, entity_id, action, details) VALUES (?, ?, ?, ?)").run(userId, entityId, action, details);
};

// ============================================================
// DEBUG ROUTES
// ============================================================
app.get("/debug/test", (req: any, res: any) => {
  res.json({ ok: true, msg: "Debug funciona" });
});

app.get("/debug/createdemo", (req: any, res: any) => {
  console.log("[SEED] Criando dados demo...");
  try {
    // Verificar se a tabela entities existe
    const checkTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='entities'").get();
    if (!checkTable) {
      return res.status(500).json({ error: "Tabela entities não existe" });
    }
    
    db.prepare("INSERT INTO entities (code, name, trade_name, entity_type, status, sector, tax_id, final_risk_rating, operational_impact, criticality) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("SUP-001", "Fornecedor Demo Lda", "Fornecedor Demo", "Supplier", "Ativo", "Tecnologia", "500001234", "Médio", "Crítico", "Médio");
    const sid = db.prepare("SELECT last_insert_rowid() as id").get().id;
    db.prepare("INSERT INTO entities (code, name, trade_name, entity_type, status, sector, tax_id, final_risk_rating, operational_impact, criticality) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("CLI-001", "Cliente Demo SA", "Cliente Demo", "Client", "Ativo", "Retail", "500005678", "Baixo", "Alto", "Baixo");
    db.prepare("INSERT OR IGNORE INTO criteria (code, name, weight, max_score, is_active) VALUES ('CRIT-001', 'Qualidade', 10, 5, 1)").run();
    db.prepare("INSERT OR IGNORE INTO criteria (code, name, weight, max_score, is_active) VALUES ('CRIT-002', 'Prazo', 8, 5, 1)").run();
    db.prepare("INSERT OR IGNORE INTO criteria (code, name, weight, max_score, is_active) VALUES ('CRIT-003', 'Compliance', 10, 5, 1)").run();
    console.log("[SEED] Dados demo criados com sucesso!");
    res.json({ success: true, supplierId: sid });
  } catch (e: any) {
    console.log("[SEED] Erro:", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post("/debug/fulldemo", (req: any, res: any) => {
  console.log("[SEED] Criando dados demo completos...");
  try {
    let suppliers = 0, clients = 0, processes = 0, evaluations = 0;
    
    // 5 Fornecedores - only insert if NOT exists
    const supplierData = [
      ["SUP-001", "Fornecedor Demo Lda", "Fornecedor Demo", "Supplier", "Ativo", "Tecnologia", "500001234", "Médio", "Crítico", "Médio"],
      ["SUP-002", "Técnica Angola SA", "Técnica", "Supplier", "Ativo", "Construction", "500002345", "Baixo", "Alto", "Alto"],
      ["SUP-003", "Logistica Express Lda", "LogExpress", "Supplier", "Ativo", "Logistics", "500003456", "Médio", "Médio", "Médio"],
      ["SUP-004", "Quality Supplies", "QualitySup", "Supplier", "Ativo", "Manufacturing", "500004567", "Alto", "Alto", "Alto"],
      ["SUP-005", "Segurança Total SA", "SegTotal", "Supplier", "Pendente", "Security", "500005678", "Médio", "Crítico", "Alto"]
    ];
    supplierData.forEach((d: any[]) => {
      const exists = db.prepare("SELECT id FROM entities WHERE code = ?").get(d[0]);
      if (!exists) {
        db.prepare("INSERT INTO entities (code, name, trade_name, entity_type, status, sector, tax_id, final_risk_rating, operational_impact, criticality) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9]);
        suppliers++;
      } else {
        suppliers++;
      }
    });
    
    // 5 Clientes
    const clientData = [
      ["CLI-001", "Cliente Demo SA", "Cliente Demo", "Client", "Ativo", "Retail", "500005678", "Baixo", "Alto", "Baixo"],
      ["CLI-002", "Sonangol EP", "Sonangol", "Client", "Ativo", "Oil & Gas", "500006789", "Baixo", "Crítico", "Crítico"],
      ["CLI-003", "Banco de Angola", "BDA", "Client", "Ativo", "Financial", "500007890", "Baixo", "Crítico", "Alto"],
      ["CLI-004", "TAAG Airlines", "TAAG", "Client", "Ativo", "Aviation", "500008901", "Médio", "Alto", "Alto"],
      ["CLI-005", "MPLA Party", "MPLA", "Client", "Ativo", "Political", "500009012", "Médio", "Crítico", "Crítico"]
    ];
    clientData.forEach((d: any[]) => {
      const exists = db.prepare("SELECT id FROM entities WHERE code = ?").get(d[0]);
      if (!exists) {
        db.prepare("INSERT INTO entities (code, name, trade_name, entity_type, status, sector, tax_id, final_risk_rating, operational_impact, criticality) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9]);
        clients++;
      } else {
        clients++;
      }
    });
    
    // 12 Critérios
    const criteriaData = [
      ["CRIT-001", "Qualidade", 10, 5, "Supplier", "Aprovação"],
      ["CRIT-002", "Prazo de Entrega", 8, 5, "Supplier", "Aprovação"],
      ["CRIT-003", "Compliance Legal", 10, 5, "Supplier", "Aprovação"],
      ["CRIT-004", "Preço Competititvo", 10, 5, "Supplier", "Avaliação"],
      ["CRIT-005", "Capacidade Técnica", 8, 5, "Supplier", "Aprovação"],
      ["CRIT-006", "Histórico", 5, 5, "Supplier", "Aprovação"],
      ["CRIT-007", "Qualidade do Serviço", 10, 5, "Client", "Performance"],
      ["CRIT-008", "Satisfação", 10, 5, "Client", "Satisfaction"],
      ["CRIT-009", "Pontualidade", 8, 5, "Client", "Performance"],
      ["CRIT-010", "Responsividade", 5, 5, "Client", "Performance"],
      ["CRIT-011", "Relacionamento", 5, 5, "Client", "Satisfaction"],
      ["CRIT-012", "Valor Acrescentado", 5, 5, "Supplier", "Reavaliação"]
    ];
    criteriaData.forEach((d: any[]) => {
      const exists = db.prepare("SELECT id FROM criteria WHERE code = ?").get(d[0]);
      if (!exists) {
        db.prepare("INSERT INTO criteria (code, name, weight, max_score, entity_type, process_type, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)").run(d[0], d[1], d[2], d[3], d[4], d[5]);
      }
    });
    
    // 10 Processos - buscar IDs válidos das entidades que existem
    const existingSuppliers: any[] = db.prepare("SELECT id FROM entities WHERE entity_type = 'Supplier' AND id IS NOT NULL ORDER BY id LIMIT 5").all();
    if (existingSuppliers.length > 0) {
      const processStatuses = ["Submetido", "Em análise", "Rascunho", "Aprovado", "Pendente", "Em análise", "Em aprovação", "Encerrado", "Reprovado", "Aprovado com restrições"];
      const processSteps = [2, 3, 1, 6, 2, 3, 5, 8, 6, 6]; // Corresponding workflow steps
      for (let i = 0; i < Math.min(10, existingSuppliers.length); i++) {
        if (!existingSuppliers[i]?.id) continue;
        try {
          const pnum = "PROC-2024-" + String(i + 1).padStart(3, "0");
          const existsProc = db.prepare("SELECT id FROM processes WHERE process_number = ?").get(pnum);
          if (!existsProc) {
            const type = i % 3 === 0 ? "Aprovação" : i % 3 === 1 ? "Avaliação" : "Reavaliação";
            db.prepare("INSERT INTO processes (process_number, entity_id, type, status, area, justification, priority, current_step) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(pnum, existingSuppliers[i].id, type, processStatuses[i], "Compras", "Avaliação de fornecedor - Demo " + (i + 1), "Normal", processSteps[i]);
            processes++;
          }
        } catch(e: any) { console.log("Process error:", e.message); }
      }
    }
    
    // 20 Avaliações
    const entityIds: any[] = db.prepare("SELECT id, entity_type, name FROM entities LIMIT 10").all();
    if (entityIds.length > 0) {
      const classifications = ["Excelente", "Bom", "Satisfatório", "Insatisfatório"];
      const types = ["Performance", "Satisfaction"];
      const evalTypes = ["Nova", "Reavaliação"];
      for (let i = 0; i < 20; i++) {
        const entity = entityIds[i % entityIds.length];
        if (!entity) continue;
        try {
          const evalNum = "AVL-" + String(2024) + "-" + String(i + 1).padStart(4, "0");
          const evalName = `${types[i % 2]} - ${entity.name || 'Entidade'}`;
          const evalType = types[i % 2];
          const period = evalTypes[i % 2];
          db.prepare("INSERT INTO evaluations (entity_id, type, evaluation_type, periodicity, period_start, period_end, overall_score, percentage, classification, evaluation_number, name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
            entity.id, 
            entity.entity_type, 
            evalType, 
            period, 
            "2024-01-01", 
            "2024-12-31",
            Math.floor(Math.random() * 10), 
            Math.floor(Math.random() * 100), 
            classifications[Math.floor(Math.random() * classifications.length)],
            evalNum,
            evalName
          );
          evaluations++;
        } catch(e: any) { console.log("Eval error:", e.message); }
      }
    }
    
    res.json({ success: true, suppliers, clients, processes, evaluations });
  } catch(e: any) {
    console.log("[SEED] Erro:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// AUTH ROUTES
// ============================================================
app.post("/api/auth/login", rateLimit(10, 15 * 60 * 1000), async (req: any, res: any) => {
  const error = validateRequired(req.body, ["username", "password"]);
  if (error) return res.status(400).json({ message: error });

  const { username, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: "8h" });
    checkExpiringApprovals();
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  } else {
    res.status(401).json({ message: "Credenciais inválidas" });
  }
});

app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  const user: any = db.prepare("SELECT id, username, name, role, email FROM users WHERE id = ?").get(req.user.id);
  res.json(user);
});

app.put("/api/auth/password", authenticateToken, async (req: any, res: any) => {
  const error = validateRequired(req.body, ["currentPassword", "newPassword"]);
  if (error) return res.status(400).json({ message: error });

  const { currentPassword, newPassword } = req.body;
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "A nova senha deve ter pelo menos 6 caracteres." });
  }

  const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(401).json({ message: "Senha atual incorreta." });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(newPassword, salt);
  db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hash, req.user.id);
  res.json({ message: "Senha alterada com sucesso." });
});

app.put("/api/auth/me", authenticateToken, async (req: any, res: any) => {
  const { name, email } = req.body;
  db.prepare("UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?").run(name, email, req.user.id);
  res.json({ message: "Perfil atualizado com sucesso." });
});

// ============================================================
// USER MANAGEMENT (Admin only)
// ============================================================
app.get("/api/users", authenticateToken, requireRole("Administrator"), (req, res) => {
  const users = db.prepare("SELECT id, username, name, role, email, created_at FROM users ORDER BY id").all();
  res.json(users);
});

app.post("/api/users", authenticateToken, requireRole("Administrator"), async (req: any, res: any) => {
  const error = validateRequired(req.body, ["username", "password", "name", "role"]);
  if (error) return res.status(400).json({ message: error });

  const { username, password, name, role, email } = req.body;
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) return res.status(409).json({ message: "Utilizador já existe." });

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  const result = db.prepare("INSERT INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?, ?)").run(username, hash, name, role, email || null);

  logAction(req.user.id, null, "CREATE_USER", `Created user: ${username}`);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.get("/api/users/:id", authenticateToken, requireRole("Administrator"), (req: any, res: any) => {
  const user = db.prepare("SELECT id, username, name, role, email FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ message: "Utilizador não encontrado." });
  res.json(user);
});

app.put("/api/users/:id", authenticateToken, requireRole("Administrator"), (req: any, res: any) => {
  const { name, role, email, password } = req.body;
  if (password) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    db.prepare("UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), email = COALESCE(?, email), password = ? WHERE id = ?")
      .run(name, role, email, hash, req.params.id);
  } else {
    db.prepare("UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), email = COALESCE(?, email) WHERE id = ?")
      .run(name, role, email, req.params.id);
  }
  logAction(req.user.id, null, "UPDATE_USER", `Updated user ID: ${req.params.id}`);
  res.json({ message: "Utilizador atualizado." });
});

app.delete("/api/users/:id", authenticateToken, requireRole("Administrator"), (req: any, res: any) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ message: "Não pode eliminar a sua própria conta." });
  }
  db.prepare("DELETE FROM notifications WHERE user_id = ?").run(req.params.id);
  db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
  logAction(req.user.id, null, "DELETE_USER", `Deleted user ID: ${req.params.id}`);
  res.json({ message: "Utilizador eliminado." });
});

// ============================================================
// EMPLOYEES (Know You Work)
// ============================================================
app.get("/api/employees", authenticateToken, (req: any, res) => {
  try {
    const { department, status } = req.query;
    let query = `
      SELECT e.*, u.username, u.email as user_email
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (department) { conditions.push("e.department = ?"); params.push(department); }
    if (status) { conditions.push("e.status = ?"); params.push(status); }

    if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY e.name ASC";

    const employees = db.prepare(query).all(...params);
    res.json(employees);
  } catch (err: any) {
    console.error("Get employees error:", err.message);
    res.status(500).json({ error: "Erro ao carregar colaboradores.", message: err.message });
  }
});

app.get("/api/employees/:id", authenticateToken, (req: any, res) => {
  try {
    const employee = db.prepare(`
      SELECT e.*, u.username, u.email as user_email
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.id = ?
    `).get(req.params.id);
    if (!employee) return res.status(404).json({ message: "Funcionário não encontrado." });
    res.json(employee);
  } catch (err: any) {
    console.error("Get employee error:", err.message);
    res.status(500).json({ error: "Erro ao carregar colaborador.", message: err.message });
  }
});

app.post("/api/employees", authenticateToken, requireRole("Administrator", "Compliance Manager"), (req: any, res) => {
  try {
    console.log("[DEBUG] Create employee payload:", req.body);
    const error = validateRequired(req.body, ["name"]);
    if (error) return res.status(400).json({ message: error });

    const { name, email, position, department, hire_date, user_id, status } = req.body;
    const result = db.prepare(`
      INSERT INTO employees (name, email, position, department, hire_date, user_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      name || null,
      email || null,
      position || null,
      department || null,
      hire_date || null,
      user_id ? Number(user_id) : null,
      status || "Ativo"
    );

    logAction(req.user.id, result.lastInsertRowid, "CREATE_EMPLOYEE", `Created employee: ${name}`);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err: any) {
    console.error("Create employee error:", err.message, err.stack, "Body:", JSON.stringify(req.body).substring(0, 200));
    res.status(500).json({ error: "Erro ao criar colaborador.", message: err.message });
  }
});

app.put("/api/employees/:id", authenticateToken, requireRole("Administrator", "Compliance Manager"), (req: any, res) => {
  try {
    const { name, email, position, department, hire_date, user_id, status } = req.body;

    db.prepare(`
      UPDATE employees SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        position = COALESCE(?, position),
        department = COALESCE(?, department),
        hire_date = COALESCE(?, hire_date),
        user_id = COALESCE(?, user_id),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name,
      email,
      position,
      department,
      hire_date,
      user_id ? Number(user_id) : null,
      status,
      req.params.id
    );

    logAction(req.user.id, Number(req.params.id), "UPDATE_EMPLOYEE", `Updated employee ID: ${req.params.id}`);
    res.json({ message: "Funcionário actualizado." });
  } catch (err: any) {
    console.error("Update employee error:", err.message);
    res.status(500).json({ error: "Erro ao actualizar colaborador.", message: err.message });
  }
});

app.delete("/api/employees/:id", authenticateToken, requireRole("Administrator"), (req: any, res) => {
  try {
    const emp: any = db.prepare("SELECT name FROM employees WHERE id = ?").get(req.params.id);
    if (!emp) return res.status(404).json({ message: "Funcionário não encontrado." });

    db.prepare("DELETE FROM employees WHERE id = ?").run(req.params.id);
    logAction(req.user.id, null, "DELETE_EMPLOYEE", `Deleted employee: ${emp.name}`);
    res.json({ message: "Funcionário eliminado." });
  } catch (err: any) {
    console.error("Delete employee error:", err.message);
    res.status(500).json({ error: "Erro ao eliminar colaborador.", message: err.message });
  }
});

// ============================================================
// GLOBAL SEARCH
// ============================================================
app.get("/api/search", authenticateToken, (req: any, res) => {
  const q = req.query.q as string;
  if (!q || q.length < 2) return res.json({ entities: [], processes: [] });

  const term = `%${q}%`;
  const entities = db.prepare("SELECT id, name, entity_type, code, status FROM entities WHERE name LIKE ? OR code LIKE ? OR tax_id LIKE ? LIMIT 10").all(term, term, term);
  const processes = db.prepare("SELECT id, process_number, type, status FROM processes WHERE process_number LIKE ? LIMIT 5").all(term);

  res.json({ entities, processes });
});

// ============================================================
// ENTITIES CRUD
// ============================================================
app.get("/api/entities", authenticateToken, (req, res) => {
  const { type, status } = req.query;
  let query = "SELECT * FROM entities";
  const params: any[] = [];

  if (type || status) {
    query += " WHERE";
    if (type) {
      query += " entity_type = ?";
      params.push(type);
    }
    if (status) {
      if (type) query += " AND";
      query += " status = ?";
      params.push(status);
    }
  }

  query += " ORDER BY created_at DESC";
  const entities = db.prepare(query).all(...params);
  res.json(entities);
});

app.get("/api/entities/:id", authenticateToken, (req, res) => {
  const entity = db.prepare("SELECT * FROM entities WHERE id = ?").get(req.params.id);
  if (!entity) return res.status(404).json({ message: "Entidade não encontrada" });

  const documents = db.prepare("SELECT * FROM documents WHERE entity_id = ?").all(req.params.id);
  res.json({ ...entity, documents });
});

// GET /api/entities/:id/history - complete historical record
app.get("/api/entities/:id/history", authenticateToken, (req, res) => {
  const entity = db.prepare("SELECT * FROM entities WHERE id = ?").get(req.params.id);
  if (!entity) return res.status(404).json({ message: "Entidade não encontrada" });

  // Audit history with user names
  const auditHistory = db.prepare(`
    SELECT h.*, u.name as user_name, u.role as user_role
    FROM history h
    LEFT JOIN users u ON h.user_id = u.id
    WHERE h.entity_id = ?
    ORDER BY h.timestamp DESC
  `).all(req.params.id) as any[];

  // Associated processes
  const processes = db.prepare(`
    SELECT p.*, u.name as opener_name, approver.name as approver_name
    FROM processes p
    LEFT JOIN users u ON p.opener_id = u.id
    LEFT JOIN users approver ON p.approver_id = approver.id
    WHERE p.entity_id = ?
    ORDER BY p.created_at DESC
  `).all(req.params.id) as any[];

  // Evaluations (including reevaluations)
  const evaluations = db.prepare(`
    SELECT ev.*, u.name as evaluator_name
    FROM evaluations ev
    LEFT JOIN users u ON ev.evaluator_id = u.id
    WHERE ev.entity_id = ?
    ORDER BY ev.evaluation_date DESC
  `).all(req.params.id) as any[];

  // Documents already fetched above, but include again
  const documents = db.prepare("SELECT * FROM documents WHERE entity_id = ?").all(req.params.id) as any[];

  res.json({
    entity,
    audit_history: auditHistory,
    processes,
    evaluations,
    documents
  });
});

app.post("/api/entities", authenticateToken, (req: any, res) => {
  const error = validateRequired(req.body, ["name", "entity_type"]);
  if (error) return res.status(400).json({ message: error });

  const entityData = req.body;
  // Only allow safe columns
  const columns = Object.keys(entityData).filter(key =>
    ENTITY_SAFE_COLUMNS.has(key)
  );

  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT INTO entities (${columns.join(", ")}) VALUES (${placeholders})`;
  const values = columns.map(key => entityData[key]);

  const result = db.prepare(sql).run(...values);
  const entityId = result.lastInsertRowid;

  logAction(req.user.id, Number(entityId), "CREATE", `Created entity: ${entityData.name}`);
  res.status(201).json({ id: entityId });
});

app.put("/api/entities/:id", authenticateToken, (req: any, res) => {
  const entityId = req.params.id;
  const entityData = req.body;
  // Only allow safe columns
  const columns = Object.keys(entityData).filter(key =>
    ENTITY_SAFE_COLUMNS.has(key)
  );

  if (columns.length === 0) return res.status(400).json({ message: "Nenhum campo válido para atualizar." });

  const setClause = columns.map(col => `${col} = ?`).join(", ");
  const sql = `UPDATE entities SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  const values = [...columns.map(key => entityData[key]), entityId];

  db.prepare(sql).run(...values);
  logAction(req.user.id, Number(entityId), "UPDATE", `Updated entity fields: ${columns.join(", ")}`);
  res.json({ message: "Entidade atualizada com sucesso" });
});

app.delete("/api/entities/:id", authenticateToken, (req: any, res: any) => {
  const entityId = req.params.id;
  const entity: any = db.prepare("SELECT name FROM entities WHERE id = ?").get(entityId);
  if (!entity) return res.status(404).json({ message: "Entidade não encontrada." });

  // Delete related documents from disk
  const docs = db.prepare("SELECT url FROM documents WHERE entity_id = ?").all(entityId) as any[];
  for (const doc of docs) {
    const filePath = path.join(__dirname, doc.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  // Cascade deletes
  db.prepare("DELETE FROM documents WHERE entity_id = ?").run(entityId);
  db.prepare("DELETE FROM evaluation_responses WHERE evaluation_id IN (SELECT id FROM evaluations WHERE entity_id = ?)").run(entityId);
  db.prepare("DELETE FROM evaluations WHERE entity_id = ?").run(entityId);
  db.prepare("DELETE FROM process_criteria WHERE process_id IN (SELECT id FROM processes WHERE entity_id = ?)").run(entityId);
  db.prepare("DELETE FROM processes WHERE entity_id = ?").run(entityId);
  db.prepare("DELETE FROM history WHERE entity_id = ?").run(entityId);
  db.prepare("DELETE FROM entities WHERE id = ?").run(entityId);

  logAction(req.user.id, null, "DELETE", `Deleted entity: ${entity.name} (ID: ${entityId})`);
  res.json({ message: "Entidade eliminada com sucesso." });
});

// ============================================================
// DOCUMENT UPLOAD
// ============================================================
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

app.post("/api/entities/:id/documents", authenticateToken, upload.single("file"), (req: any, res) => {
  if (!req.file) return res.status(400).json({ message: "Nenhum arquivo enviado" });

  const { name, type } = req.body;
  const url = `/uploads/${req.file.filename}`;

  const result = db.prepare("INSERT INTO documents (entity_id, name, type, url) VALUES (?, ?, ?, ?)").run(req.params.id, name || req.file.originalname, type || "Other", url);

  logAction(req.user.id, Number(req.params.id), "UPLOAD", `Uploaded document: ${name || req.file.originalname}`);
  res.status(201).json({ id: result.lastInsertRowid, url });
});

// Endpoint genérico de upload (para formulários que não têm entidade ainda)
app.post("/api/documents/upload", authenticateToken, upload.single("file"), (req: any, res) => {
  if (!req.file) return res.status(400).json({ message: "Nenhum arquivo enviado" });
  const { name, type, entity_id } = req.body;
  const url = "/uploads/" + req.file.filename;
  const entityId = entity_id ? parseInt(entity_id) : null;
  const result = db.prepare("INSERT INTO documents (entity_id, name, type, url) VALUES (?, ?, ?, ?)").run(entityId, name || req.file.originalname, type || "Other", url);
  logAction(req.user.id, entityId, "UPLOAD", `Uploaded document: ${name || req.file.originalname}`);
  res.status(201).json({ id: result.lastInsertRowid, url });
});

app.delete("/api/documents/:id", authenticateToken, (req: any, res: any) => {
  const doc: any = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id);
  if (!doc) return res.status(404).json({ message: "Documento não encontrado." });

  // Delete file from disk
  const filePath = path.join(__dirname, doc.url);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare("DELETE FROM documents WHERE id = ?").run(req.params.id);
  logAction(req.user.id, doc.entity_id, "DELETE_DOC", `Deleted document: ${doc.name}`);
  res.json({ message: "Documento eliminado." });
});

app.use("/uploads", express.static(uploadDir));

// ============================================================
// ENTITY HISTORY
// ============================================================
// Note: /api/entities/:id/history is already defined above with full details

// Global history
app.get("/api/history", authenticateToken, (req, res) => {
  const { page, limit, offset } = paginate(req);
  const total = (db.prepare("SELECT COUNT(*) as count FROM history").get() as any).count;
  const history = db.prepare(`
    SELECT h.*, u.name as user_name, e.name as entity_name
    FROM history h 
    LEFT JOIN users u ON h.user_id = u.id 
    LEFT JOIN entities e ON h.entity_id = e.id
    ORDER BY h.timestamp DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  res.json({ data: history, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// ============================================================
// CRITERIA
// ============================================================
app.get("/api/criteria", authenticateToken, (req, res) => {
  const { entity_type, process_type, evaluation_type, include_inactive } = req.query;
  let query = "SELECT * FROM criteria";
  const params: any[] = [];

  const conditions = [];
  if (entity_type) { conditions.push("(entity_type = ? OR entity_type IS NULL)"); params.push(entity_type); }
  if (process_type) { conditions.push("process_type = ?"); params.push(process_type); }
  if (evaluation_type) { conditions.push("evaluation_type = ?"); params.push(evaluation_type); }
  if (include_inactive !== "true") { conditions.push("is_active = 1"); }

  if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");

  query += " ORDER BY display_order ASC";
  const criteria = db.prepare(query).all(...params);
  res.json(criteria);
});

app.post("/api/criteria", authenticateToken, requireRole("Administrator"), (req: any, res: any) => {
  const error = validateRequired(req.body, ["code", "name", "process_type"]);
  if (error) return res.status(400).json({ message: error });

  const { code, name, description, entity_type, process_type, evaluation_type, weight, min_score, max_score, is_required, is_active, display_order } = req.body;
  const existing = db.prepare("SELECT id FROM criteria WHERE code = ?").get(code);
  if (existing) return res.status(409).json({ message: "Código de critério já existe." });

  const result = db.prepare(`
    INSERT INTO criteria (code, name, description, entity_type, process_type, evaluation_type, weight, min_score, max_score, is_required, is_active, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(code, name, description || null, entity_type || null, process_type, evaluation_type || null, weight || 1, min_score || 0, max_score || 10, is_required ? 1 : 0, is_active ? 1 : 1, display_order || 99);

  logAction(req.user.id, null, "CREATE_CRITERIA", `Created criteria: ${name}`);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put("/api/criteria/:id", authenticateToken, requireRole("Administrator"), (req: any, res: any) => {
  const { name, description, entity_type, process_type, evaluation_type, weight, min_score, max_score, is_required, is_active, display_order } = req.body;
  db.prepare(`
    UPDATE criteria SET 
      name = COALESCE(?, name), 
      description = COALESCE(?, description), 
      entity_type = COALESCE(?, entity_type),
      process_type = COALESCE(?, process_type),
      evaluation_type = COALESCE(?, evaluation_type),
      weight = COALESCE(?, weight), 
      min_score = COALESCE(?, min_score),
      max_score = COALESCE(?, max_score), 
      is_required = COALESCE(?, is_required), 
      is_active = COALESCE(?, is_active),
      display_order = COALESCE(?, display_order)
    WHERE id = ?
  `).run(name, description, entity_type || null, process_type || null, evaluation_type || null, weight, min_score, max_score, is_required, is_active, display_order, req.params.id);

  logAction(req.user.id, null, "UPDATE_CRITERIA", `Updated criteria ID: ${req.params.id}`);
  res.json({ message: "Critério atualizado." });
});

app.delete("/api/criteria/:id", authenticateToken, requireRole("Administrator"), (req: any, res: any) => {
  db.prepare("UPDATE criteria SET is_active = 0 WHERE id = ?").run(req.params.id);
  logAction(req.user.id, null, "DELETE_CRITERIA", `Deactivated criteria ID: ${req.params.id}`);
  res.json({ message: "Critério desativado." });
});

// ============================================================
// PROCESS TYPES
// ============================================================
app.get("/api/process-types", authenticateToken, (req, res) => {
  const types = db.prepare("SELECT * FROM process_types WHERE is_active = 1 ORDER BY sort_order ASC").all();
  res.json(types);
});

app.get("/api/process-types/all", authenticateToken, requireRole("Administrator"), (req, res) => {
  const types = db.prepare("SELECT * FROM process_types ORDER BY sort_order ASC").all();
  res.json(types);
});

app.post("/api/process-types", authenticateToken, requireRole("Administrator"), (req: any, res: any) => {
  const { name, description, sort_order } = req.body;
  if (!name) return res.status(400).json({ message: "Nome é obrigatório." });

  const existing = db.prepare("SELECT id FROM process_types WHERE name = ?").get(name);
  if (existing) return res.status(409).json({ message: "Já existe um tipo com este nome." });

  const result = db.prepare(`
    INSERT INTO process_types (name, description, sort_order)
    VALUES (?, ?, ?)
  `).run(name, description || null, sort_order || 0);

  logAction(req.user.id, null, "CREATE_PROCESS_TYPE", `Created process type: ${name}`);
  res.status(201).json({ id: result.lastInsertRowid, name, description, sort_order });
});

app.put("/api/process-types/:id", authenticateToken, requireRole("Administrator"), (req: any, res: any) => {
  const { name, description, is_active, sort_order } = req.body;

  if (name) {
    const existing = db.prepare("SELECT id FROM process_types WHERE name = ? AND id != ?").get(name, req.params.id);
    if (existing) return res.status(409).json({ message: "Já existe um tipo com este nome." });
  }

  db.prepare(`
    UPDATE process_types SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      is_active = COALESCE(?, is_active),
      sort_order = COALESCE(?, sort_order)
    WHERE id = ?
  `).run(name, description, is_active ? 1 : 0, sort_order, req.params.id);

  logAction(req.user.id, null, "UPDATE_PROCESS_TYPE", `Updated process type ID: ${req.params.id}`);
  res.json({ message: "Tipo de processo actualizado." });
});

app.delete("/api/process-types/:id", authenticateToken, requireRole("Administrator"), (req: any, res: any) => {
  const type = db.prepare("SELECT name FROM process_types WHERE id = ?").get(req.params.id);
  if (!type) return res.status(404).json({ message: "Tipo não encontrado." });

  // Check if any processes use this type
  const usage = db.prepare("SELECT COUNT(*) as c FROM processes WHERE process_type = ?").get(type.name);
  if ((usage as any).c > 0) {
    return res.status(400).json({ message: "Não é possível eliminar: existem processos associados a este tipo." });
  }

  db.prepare("DELETE FROM process_types WHERE id = ?").run(req.params.id);
  logAction(req.user.id, null, "DELETE_PROCESS_TYPE", `Deleted process type: ${type.name}`);
  res.json({ message: "Tipo de processo eliminado." });
});

// ============================================================
// PROCESSES
// ============================================================
app.get("/api/processes", authenticateToken, (req, res) => {
  const processes = db.prepare(`
    SELECT p.*, e.name as entity_name, u.name as opener_name 
    FROM processes p 
    LEFT JOIN entities e ON p.entity_id = e.id 
    LEFT JOIN users u ON p.opener_id = u.id
    ORDER BY p.created_at DESC
  `).all();
  res.json(processes);
});

app.post("/api/processes", authenticateToken, (req: any, res) => {
  const error = validateRequired(req.body, ["entity_id", "type"]);
  if (error) return res.status(400).json({ message: error });

  const { entity_id, type, priority, area, justification, criteria_ids } = req.body;
  const process_number = `PROC-${Date.now()}`;

  const result = db.prepare(`
    INSERT INTO processes (process_number, entity_id, type, status, priority, area, justification, opener_id, current_step) 
    VALUES (?, ?, ?, 'Rascunho', ?, ?, ?, ?, 1)
  `).run(process_number, entity_id, type, priority || "Normal", area, justification, req.user.id);

  const processId = result.lastInsertRowid;

  // Use criteria_ids from request, or auto-populate if not provided
  let criteriaToUse: any[] = [];
  
  if (criteria_ids && criteria_ids.length > 0) {
    // Use selected criteria from request
    const getCriteria = db.prepare("SELECT id FROM criteria WHERE id = ?");
    for (const cid of criteria_ids) {
      const c = getCriteria.get(cid);
      if (c) criteriaToUse.push(c);
    }
  } else {
    // Auto-populate criteria based on entity type
    const entity = db.prepare("SELECT entity_type FROM entities WHERE id = ?").get(entity_id) as any;
    if (entity) {
      criteriaToUse = db.prepare("SELECT id FROM criteria WHERE (entity_type = ? OR entity_type IS NULL) AND process_type = ? AND is_active = 1").all(entity.entity_type, type);
    }
  }
  
  // Insert criteria
  if (criteriaToUse.length > 0) {
    const insertPC = db.prepare("INSERT INTO process_criteria (process_id, criteria_id) VALUES (?, ?)");
    for (const c of criteriaToUse as any[]) {
      insertPC.run(processId, c.id);
    }
  }

  res.status(201).json({ id: processId, current_step: 1 });
});

// ============================================================
// PROCESSES
// ============================================================

// GET /api/processes/:id
app.get("/api/processes/:id", authenticateToken, (req, res) => {
  const process = db.prepare(`
    SELECT p.*, e.name as entity_name, u.name as opener_name
    FROM processes p 
    JOIN entities e ON p.entity_id = e.id 
    LEFT JOIN users u ON p.opener_id = u.id
    WHERE p.id = ?
  `).get(req.params.id) as any;

  if (!process) return res.status(404).json({ message: "Processo não encontrado" });

  const criteria = db.prepare(`
    SELECT c.id as criteria_id, c.name, c.description, c.weight, c.max_score,
           pc.score, pc.evidence, pc.comments
    FROM process_criteria pc
    JOIN criteria c ON pc.criteria_id = c.id
    WHERE pc.process_id = ?
    ORDER BY c.display_order
  `).all(req.params.id) as any[];

  const history = db.prepare(`
    SELECT wh.*, u.name as user_name
    FROM workflow_history wh
    LEFT JOIN users u ON wh.performed_by = u.id
    WHERE wh.process_id = ?
    ORDER BY wh.performed_at DESC
  `).all(req.params.id) as any[];

  res.json({ ...process, criteria, workflow_history: history });
});

// GET /api/processes/:id with history
// ============================================================
// WORKFLOW ENGINE
// ============================================================
const WORKFLOW_STEPS = {
  1: { name: "Rascunho", next: [2, 3], allowedRoles: ["Administrator", "Compliance Manager", "Procurement", "Owner"] },
  2: { name: "Submetido", next: [3], allowedRoles: ["Administrator", "Compliance Manager"] },
  3: { name: "Validação Documental", next: [4], allowedRoles: ["Administrator", "Compliance Manager", "Quality"] },
  4: { name: "Avaliação Técnica/Comercial", next: [5], allowedRoles: ["Administrator", "Compliance Manager", "Technical", "Financial", "Commercial"] },
  5: { name: "Em Aprovação", next: [6], allowedRoles: ["Administrator", "Compliance Manager", "Approver"] },
  6: { name: "Aprovado/Reprovado", next: [7, 8], allowedRoles: ["Administrator", "Compliance Manager"] },
  7: { name: "Comunicação do Resultado", next: [8], allowedRoles: ["Administrator", "Compliance Manager"] },
  8: { name: "Em Monitorização", next: [], allowedRoles: ["Administrator", "Compliance Manager", "Auditor"] },
};

function canTransition(stepFrom: number, stepTo: number, userRole: string): boolean {
  // Allow any forward transition for now (simplified workflow)
  if (stepTo > stepFrom && stepTo <= 8) return true;
  // Special case: allow reversion
  if (stepTo < stepFrom) return true;
  return false;
}

app.get("/api/workflow/steps", authenticateToken, (req, res) => {
  res.json(WORKFLOW_STEPS);
});

app.post("/api/processes/:id/transition", authenticateToken, (req: any, res) => {
  const { target_step, notes } = req.body;
  const processId = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!target_step) return res.status(400).json({ message: "Etapa destino obrigatória" });

  const process = db.prepare("SELECT * FROM processes WHERE id = ?").get(processId);
  if (!process) return res.status(404).json({ message: "Processo não encontrado" });

  const currentStep = process.current_step || 1;
  
  if (!canTransition(currentStep, target_step, userRole)) {
    return res.status(403).json({ 
      message: `Transição de step ${currentStep} para ${target_step} não permitida para perfil "${userRole}"` 
    });
  }

  db.prepare("UPDATE processes SET current_step = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(target_step, processId);

  db.prepare(`
    INSERT INTO workflow_history (process_id, step_from, step_to, action, notes, performed_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(processId, currentStep, target_step, `transition_${currentStep}_to_${target_step}`, notes || null, userId);

  // Auto-update classification when reaching step 6
  if (target_step === 6) {
    const scores = db.prepare("SELECT score, weight FROM process_scores WHERE process_id = ?").all(processId);
    let totalWeighted = 0, totalWeight = 0;
    scores.forEach((s: any) => { totalWeighted += s.score * s.weight; totalWeight += s.weight; });
    const percentage = totalWeight > 0 ? (totalWeighted / totalWeight) * 10 : 0;
    const classification = percentage >= 90 ? "Aprovado" : percentage >= 75 ? "Aprovado com observação" : percentage >= 60 ? "Condicionado" : "Reprovado";
    db.prepare("UPDATE processes SET result_percentage = ?, classification = ? WHERE id = ?").run(percentage, classification, processId);
  }

  logAction(userId, process.entity_id, "WORKFLOW_TRANSITION", `Step ${currentStep} → ${target_step}`);
   res.json({ message: "Workflow actualizado", step: target_step });
});

// GET /api/workflow/steps - get available steps
app.get("/api/workflow/steps", authenticateToken, (req, res) => {
  res.json(WORKFLOW_STEPS);
});

app.put("/api/processes/:id/score", authenticateToken, (req, res) => {
  const { scores } = req.body;
  const updatePC = db.prepare("UPDATE process_criteria SET score = ?, evidence = ?, comments = ? WHERE process_id = ? AND criteria_id = ?");

  for (const s of scores) {
    updatePC.run(s.score, s.evidence, s.comments, req.params.id, s.criteria_id);
  }

  const results = db.prepare(`
    SELECT pc.score, c.weight, c.max_score 
    FROM process_criteria pc 
    JOIN criteria c ON pc.criteria_id = c.id 
    WHERE pc.process_id = ?
  `).all(req.params.id) as any[];

  let totalScore = 0;
  let maxPossible = 0;

  results.forEach(r => {
    if (r.score !== null) {
      totalScore += r.score * r.weight;
      maxPossible += r.max_score * r.weight;
    }
  });

  const percentage = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;

  let classification = "Reprovado";
  if (percentage >= 90) classification = "Aprovado";
  else if (percentage >= 75) classification = "Aprovado com observação";
  else if (percentage >= 60) classification = "Condicionado";

  db.prepare("UPDATE processes SET result_score = ?, result_percentage = ?, classification = ? WHERE id = ?").run(totalScore, percentage, classification, req.params.id);

  logAction((req as any).user.id, null, "SCORE_PROCESS", `Scored process ID: ${req.params.id} (${Math.round(percentage)}%)`);
  res.json({ percentage, classification });
});

app.post("/api/processes/:id/submit", authenticateToken, (req: any, res) => {
  db.prepare("UPDATE processes SET status = 'Em aprovação' WHERE id = ?").run(req.params.id);
  logAction(req.user.id, null, "SUBMIT_PROCESS", `Submitted process ID: ${req.params.id} for approval`);
  res.json({ message: "Processo submetido para aprovação" });
});

app.post("/api/processes/:id/approve", authenticateToken, requireRole("Administrator", "Compliance Manager"), (req: any, res: any) => {
  const { decision, conditions, comments, validity_date, next_reevaluation_date, result_percentage } = req.body;

  if (!decision || !["Aprovado", "Reprovado"].includes(decision)) {
    return res.status(400).json({ message: "Decisão inválida. Use 'Aprovado' ou 'Reprovado'." });
  }

  let compliance_level = "Não conforme";
  if (result_percentage >= 90) compliance_level = "Conforme";
  else if (result_percentage >= 60) compliance_level = "Parcialmente conforme";

  let classification = "Reprovado";
  if (result_percentage >= 90) classification = "Aprovado";
  else if (result_percentage >= 75) classification = "Aprovado com restrições";

  db.prepare(`
    UPDATE processes SET 
      status = ?, 
      conditions = ?, 
      comments = ?, 
      validity_date = ?,
      next_reevaluation_date = ?,
      compliance_level = ?,
      classification = ?,
      approver_id = ?,
      decision_date = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(decision, conditions || null, comments || null, validity_date || null, next_reevaluation_date || null, compliance_level, classification, req.user.id, req.params.id);

  // If approved, update entity status
  if (decision === "Aprovado") {
    const proc: any = db.prepare("SELECT entity_id FROM processes WHERE id = ?").get(req.params.id);
    if (proc) {
      db.prepare("UPDATE entities SET status = 'Ativo' WHERE id = ?").run(proc.entity_id);
    }
  }

  logAction(req.user.id, null, "DECIDE_PROCESS", `${decision} process ID: ${req.params.id}`);
  res.json({ message: `Processo ${decision === "Aprovado" ? "aprovado" : "rejeitado"} com sucesso.` });
});

app.delete("/api/processes/:id", authenticateToken, (req: any, res: any) => {
  const proc: any = db.prepare("SELECT process_number FROM processes WHERE id = ?").get(req.params.id);
  if (!proc) return res.status(404).json({ message: "Processo não encontrado." });

  db.prepare("DELETE FROM process_criteria WHERE process_id = ?").run(req.params.id);
  db.prepare("DELETE FROM processes WHERE id = ?").run(req.params.id);

  logAction(req.user.id, null, "DELETE_PROCESS", `Deleted process: ${proc.process_number}`);
  res.json({ message: "Processo eliminado." });
});

// ============================================================
// EVALUATIONS
// ============================================================
app.post("/api/evaluations", authenticateToken, (req: any, res) => {
  const error = validateRequired(req.body, ["entity_id", "type", "responses"]);
  if (error) return res.status(400).json({ message: error });

  const { entity_id, type, evaluation_type, evaluation_type_detail, periodicity, period, product_service, unit, responses, action_plan, action_plan_deadline, action_plan_responsible, previous_evaluation_id, name, evaluation_number } = req.body;

  // Gerar evaluation_number se não for fornecido
  const evalNum = evaluation_number || "AVL-" + Date.now();
  const evalName = name || `${evaluation_type_detail === 'Satisfaction' ? 'Satisfação' : 'Performance'} - ${new Date().toLocaleDateString('pt-PT')}`;

  const result = db.prepare(`
    INSERT INTO evaluations (entity_id, type, evaluation_type, periodicity, period, product_service, unit, evaluator_id, action_plan, action_plan_deadline, action_plan_responsible, previous_evaluation_id, evaluation_date, evaluation_number, name) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, ?, ?)
  `).run(entity_id, type, evaluation_type || "Nova", periodicity || "Anual", period, product_service, unit, req.user.id, action_plan || null, action_plan_deadline || null, action_plan_responsible || null, previous_evaluation_id || null, evalNum, evalName);

  const evaluationId = result.lastInsertRowid;

  const insertResponse = db.prepare(`
    INSERT INTO evaluation_responses (evaluation_id, group_name, criterion_name, score, observation, evidence) 
    VALUES (?, ?, ?, ?, ?)
  `);

  let totalScore = 0;
  let count = 0;

  for (const r of responses) {
    insertResponse.run(evaluationId, r.group_name, r.criterion_name, r.score, r.observation, r.evidence || null);
    totalScore += r.score;
    count++;
  }

  const average = count > 0 ? totalScore / count : 0;
  const percentage = (average / 10) * 100;

  let classification = "Crítico";
  if (percentage >= 90) classification = "Excelente";
  else if (percentage >= 75) classification = "Bom";
  else if (percentage >= 60) classification = "Satisfatório";
  else if (percentage >= 40) classification = "Insatisfatório";

  let recommended_action = "Reavaliar";
  if (percentage >= 90) recommended_action = "Manter";
  else if (percentage >= 75) recommended_action = "Melhorar";
  else if (percentage < 40) recommended_action = "Suspender";
  else if (percentage < 20) recommended_action = "Desqualificar";

  db.prepare("UPDATE evaluations SET overall_score = ?, percentage = ?, classification = ?, recommended_action = ? WHERE id = ?").run(average, percentage, classification, recommended_action, evaluationId);

  logAction(req.user.id, entity_id, "CREATE_EVALUATION", `Created ${evaluation_type || "Nova"} ${type} avaliação (${Math.round(percentage)}%)`);
  res.status(201).json({ id: evaluationId, percentage, classification, recommended_action });
});

app.get("/api/evaluations", authenticateToken, (req, res) => {
  const { entity_id, type, evaluation_type, periodicity } = req.query;
  let query = `
    SELECT ev.*, e.name as entity_name, u.name as evaluator_name, prev.percentage as prev_percentage
    FROM evaluations ev 
    JOIN entities e ON ev.entity_id = e.id 
    LEFT JOIN users u ON ev.evaluator_id = u.id
    LEFT JOIN evaluations prev ON ev.previous_evaluation_id = prev.id
  `;
  const params: any[] = [];
  if (entity_id || type || evaluation_type || periodicity) {
    query += " WHERE";
    let whereAdded = false;
    if (entity_id) { query += " ev.entity_id = ?"; params.push(entity_id); whereAdded = true; }
    if (type) { if (whereAdded) query += " AND"; query += " ev.type = ?"; params.push(type); whereAdded = true; }
    if (evaluation_type) { if (whereAdded) query += " AND"; query += " ev.evaluation_type = ?"; params.push(evaluation_type); whereAdded = true; }
    if (periodicity) { if (whereAdded) query += " AND"; query += " ev.periodicity = ?"; params.push(periodicity); }
  }
  query += " ORDER BY ev.created_at DESC";

  const evs = db.prepare(query).all(...params);
  res.json(evs);
});

app.get("/api/evaluations/:id", authenticateToken, (req, res) => {
  const evaluation = db.prepare(`
    SELECT ev.*, e.name as entity_name, u.name as evaluator_name 
    FROM evaluations ev 
    JOIN entities e ON ev.entity_id = e.id 
    LEFT JOIN users u ON ev.evaluator_id = u.id
    WHERE ev.id = ?
  `).get(req.params.id);

  if (!evaluation) return res.status(404).json({ message: "Avaliação não encontrada." });

  const responses = db.prepare("SELECT * FROM evaluation_responses WHERE evaluation_id = ?").all(req.params.id);
  res.json({ ...evaluation, responses });
});

app.delete("/api/evaluations/:id", authenticateToken, (req: any, res: any) => {
  const ev: any = db.prepare("SELECT id FROM evaluations WHERE id = ?").get(req.params.id);
  if (!ev) return res.status(404).json({ message: "Avaliação não encontrada." });

  db.prepare("DELETE FROM evaluation_responses WHERE evaluation_id = ?").run(req.params.id);
  db.prepare("DELETE FROM evaluations WHERE id = ?").run(req.params.id);

  logAction(req.user.id, null, "DELETE_EVALUATION", `Deleted evaluation ID: ${req.params.id}`);
  res.json({ message: "Avaliação eliminada." });
});

// ============================================================
// EVALUATION LINKS (Customer Satisfaction Sharing)
// ============================================================
app.post("/api/evaluations/:id/generate-link", authenticateToken, (req: any, res) => {
  const evaluationId = req.params.id;
  const evaluation: any = db.prepare("SELECT id, type FROM evaluations WHERE id = ?").get(evaluationId);
  if (!evaluation) return res.status(404).json({ message: "Avaliação não encontrada." });

  const { client_email, expires_days = 30 } = req.body;

  // Generate a unique token
  const token = "toknow_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 9);
  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + (expires_days || 30));

  const result = db.prepare(`
    INSERT INTO evaluation_links (evaluation_id, token, client_email, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(evaluationId, token, client_email || null, expires_at.toISOString().split('T')[0]);

  const linkUrl = `${req.protocol}://${req.get('host')}/avaliacao/${token}`;

  logAction(req.user.id, evaluationId, "GENERATE_LINK", `Generated evaluation link: ${token}`);
  res.status(201).json({
    id: result.lastInsertRowid,
    token,
    link_url: linkUrl,
    expires_at: expires_at.toISOString().split('T')[0]
  });
});

app.get("/api/evaluation-links", authenticateToken, (req: any, res) => {
  const { evaluation_id } = req.query;
  let query = `
    SELECT el.*, ev.name as evaluation_name, ev.type as evaluation_type, e.name as entity_name
    FROM evaluation_links el
    LEFT JOIN evaluations ev ON el.evaluation_id = ev.id
    LEFT JOIN entities e ON ev.entity_id = e.id
  `;
  const params: any[] = [];
  if (evaluation_id) {
    query += " WHERE el.evaluation_id = ?";
    params.push(evaluation_id);
  }
  query += " ORDER BY el.created_at DESC";

  const links = db.prepare(query).all(...params);
  res.json(links);
});

app.delete("/api/evaluation-links/:id", authenticateToken, (req: any, res) => {
  const link: any = db.prepare("SELECT id FROM evaluation_links WHERE id = ?").get(req.params.id);
  if (!link) return res.status(404).json({ message: "Link não encontrado." });

  db.prepare("DELETE FROM evaluation_links WHERE id = ?").run(req.params.id);
  logAction(req.user.id, null, "DELETE_LINK", `Deleted evaluation link ID: ${req.params.id}`);
  res.json({ message: "Link eliminado." });
});

// Public endpoint - no auth required
app.get("/api/public/evaluation/:token", (req: any, res) => {
  const token = req.params.token;
  const link: any = db.prepare(`
    SELECT el.*, ev.evaluation_type, ev.name, ev.periodicity, ev.period_start, ev.period_end,
           e.name as entity_name, e.entity_type
    FROM evaluation_links el
    JOIN evaluations ev ON el.evaluation_id = ev.id
    JOIN entities e ON ev.entity_id = e.id
    WHERE el.token = ? AND el.is_used = 0 AND (el.expires_at IS NULL OR el.expires_at >= date('now'))
  `).get(token);

  if (!link) {
    return res.status(404).json({ message: "Link inválido ou expirado." });
  }

  // Get evaluation criteria/responses structure based on entity type
  // For customer satisfaction, we need to get the criteria template
  let criteria = [];
  if (link.entity_type === 'Client') {
    criteria = db.prepare(`
      SELECT c.id, c.name, c.weight, c.max_score
      FROM criteria c
      WHERE (c.entity_type = 'Client' OR c.entity_type = 'Ambos')
        AND c.evaluation_type = 'Satisfaction'
        AND c.is_active = 1
      ORDER BY c.display_order ASC
    `).all();
  }

  res.json({ link, criteria });
});

// Public endpoint - submit evaluation without auth
app.post("/api/public/evaluation/:token/submit", (req: any, res) => {
  const token = req.params.token;
  const link: any = db.prepare("SELECT * FROM evaluation_links WHERE token = ? AND is_used = 0", token).get(token);

  if (!link) {
    return res.status(404).json({ message: "Link inválido ou já utilizado." });
  }

  const { responses, client_name, client_email } = req.body;
  if (!responses || !Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({ message: "Respostas são obrigatórias." });
  }

  // Calculate results
  let totalScore = 0;
  let count = 0;
  for (const r of responses) {
    totalScore += r.score || 0;
    count++;
  }
  const average = count > 0 ? totalScore / count : 0;
  const percentage = (average / 5) * 100; // Assuming max score per criterion is 5

  let classification = "Crítico";
  if (percentage >= 90) classification = "Excelente";
  else if (percentage >= 75) classification = "Bom";
  else if (percentage >= 60) classification = "Satisfatório";
  else if (percentage >= 40) classification = "Insatisfatório";

  // Store responses as an evaluation (similar to regular evaluations but linked)
  const evalResult = db.prepare(`
    INSERT INTO evaluation_responses (evaluation_id, group_name, criterion_name, score, observation)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const r of responses) {
    evalResult.run(link.evaluation_id, "Satisfação do Cliente", r.criterion_name || r.question, r.score, r.comment || null);
  }

  // Mark link as used
  db.prepare("UPDATE evaluation_links SET is_used = 1, used_at = CURRENT_TIMESTAMP WHERE id = ?").run(link.id);

  // Update evaluation with customer feedback
  db.prepare(`
    UPDATE evaluations
    SET overall_score = ?, percentage = ?, classification = ?
    WHERE id = ?
  `).run(average.toFixed(1), percentage.toFixed(1), classification, link.evaluation_id);

  logAction(null, link.evaluation_id, "CUSTOMER_EVAL_SUBMIT", `Customer evaluation submitted via link ${token}`);
  res.status(201).json({ message: "Avaliação submetida com sucesso!", percentage, classification });
});

// ============================================================
// NOTIFICATIONS
// ============================================================
app.get("/api/notifications", authenticateToken, (req: any, res) => {
  const notifications = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").all(req.user.id);
  res.json(notifications);
});

app.post("/api/notifications/:id/read", authenticateToken, (req, res) => {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(req.params.id);
  res.sendStatus(200);
});

app.post("/api/notifications/read-all", authenticateToken, (req: any, res) => {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").run(req.user.id);
  res.json({ message: "Todas as notificações marcadas como lidas." });
});

// ============================================================
// COLLABORATION FORMS
// ============================================================
// GET /api/collaboration/forms - list all forms
app.get("/api/collaboration/forms", authenticateToken, (req: any, res) => {
  try {
    const { form_type } = req.query;
    let query = `
      SELECT cf.*, u.name as created_by_name 
      FROM collaboration_forms cf 
      LEFT JOIN users u ON cf.created_by = u.id 
    `;
    const params: any[] = [];
    if (form_type) {
      query += " WHERE LOWER(cf.form_type) = LOWER(?)";
      params.push(String(form_type));
    }
    query += " ORDER BY cf.created_at DESC";
    const forms = db.prepare(query).all(...params) as any[];
    res.json(forms);
  } catch (err: any) {
    console.error("Get collaboration forms error:", err.message);
    res.status(500).json({ error: "Erro ao carregar formulários.", message: err.message });
  }
});

// POST /api/collaboration/forms - create a form
app.post("/api/collaboration/forms", authenticateToken, (req: any, res) => {
  try {
    const error = validateRequired(req.body, ["title", "form_type"]);
    if (error) return res.status(400).json({ message: error });

    const { title, description, form_type, entity_type } = req.body;
    const result = db.prepare(`
      INSERT INTO collaboration_forms (title, description, form_type, entity_type, created_by) 
      VALUES (?, ?, ?, ?, ?)
    `).run(title, description || null, form_type, entity_type || null, req.user.id);

    const formId = result.lastInsertRowid;
    logAction(req.user.id, Number(formId), "CREATE_COLLAB_FORM", `Created collaboration form: ${title}`);
    res.status(201).json({ id: formId });
  } catch (err: any) {
    console.error("Create collaboration form error:", err.message);
    res.status(500).json({ error: "Erro ao criar formulário.", message: err.message });
  }
});

// GET /api/collaboration/forms/:id - get form with questions
app.get("/api/collaboration/forms/:id", authenticateToken, (req, res) => {
  try {
    const form = db.prepare("SELECT * FROM collaboration_forms WHERE id = ?").get(req.params.id) as any;
    if (!form) return res.status(404).json({ message: "Formulário não encontrado." });

    const questions = db.prepare(`
      SELECT * FROM collaboration_questions 
      WHERE form_id = ? 
      ORDER BY display_order ASC
    `).all(req.params.id) as any[];

    res.json({ ...form, questions });
  } catch (err: any) {
    console.error("Get collaboration form error:", err.message);
    res.status(500).json({ error: "Erro ao carregar formulário.", message: err.message });
  }
});

// PUT /api/collaboration/forms/:id - update form
app.put("/api/collaboration/forms/:id", authenticateToken, (req: any, res) => {
  const { title, description, form_type, entity_type, is_active } = req.body;
  
  db.prepare(`
    UPDATE collaboration_forms SET 
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      form_type = COALESCE(?, form_type),
      entity_type = COALESCE(?, entity_type),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(title, description, form_type, entity_type, is_active ? 1 : 0, req.params.id);

  logAction(req.user.id, Number(req.params.id), "UPDATE_COLLAB_FORM", `Updated collaboration form ID: ${req.params.id}`);
  res.json({ message: "Formulário actualizado." });
});

// DELETE /api/collaboration/forms/:id - delete form (cascade handled by DB)
app.delete("/api/collaboration/forms/:id", authenticateToken, requireRole("Administrator"), (req, res) => {
  const form: any = db.prepare("SELECT title FROM collaboration_forms WHERE id = ?").get(req.params.id);
  if (!form) return res.status(404).json({ message: "Formulário não encontrado." });

  db.prepare("DELETE FROM collaboration_forms WHERE id = ?").run(req.params.id);
  logAction(req.user.id, null, "DELETE_COLLAB_FORM", `Deleted collaboration form: ${form.title}`);
  res.json({ message: "Formulário eliminado." });
});

// POST /api/collaboration/forms/:id/questions - add question to form
app.post("/api/collaboration/forms/:id/questions", authenticateToken, (req: any, res) => {
  const formId = req.params.id;
  const form: any = db.prepare("SELECT id FROM collaboration_forms WHERE id = ?").get(formId);
  if (!form) return res.status(404).json({ message: "Formulário não encontrado." });

  const error = validateRequired(req.body, ["question_text"]);
  if (error) return res.status(400).json({ message: error });

  const { question_text, question_type, options, weight, is_required, display_order } = req.body;
  const result = db.prepare(`
    INSERT INTO collaboration_questions 
    (form_id, question_text, question_type, options, weight, is_required, display_order) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(formId, question_text, question_type || "rating", options || null, weight || 1.0, is_required !== false ? 1 : 0, display_order || 0);

  const questionId = result.lastInsertRowid;
  logAction(req.user.id, Number(formId), "ADD_QUESTION", `Added question to form ${formId}, question ID: ${questionId}`);
  res.status(201).json({ id: questionId });
});

// PUT /api/collaboration/questions/:id - update question
app.put("/api/collaboration/questions/:id", authenticateToken, (req: any, res) => {
  const { question_text, question_type, options, weight, is_required, display_order } = req.body;

  db.prepare(`
    UPDATE collaboration_questions SET 
      question_text = COALESCE(?, question_text),
      question_type = COALESCE(?, question_type),
      options = COALESCE(?, options),
      weight = COALESCE(?, weight),
      is_required = COALESCE(?, is_required),
      display_order = COALESCE(?, display_order)
    WHERE id = ?
  `).run(question_text, question_type, options, weight, is_required ? 1 : 0, display_order, req.params.id);

  logAction(req.user.id, null, "UPDATE_QUESTION", `Updated question ID: ${req.params.id}`);
  res.json({ message: "Questão actualizada." });
});

// DELETE /api/collaboration/questions/:id - delete question
app.delete("/api/collaboration/questions/:id", authenticateToken, (req, res) => {
  const question: any = db.prepare("SELECT form_id FROM collaboration_questions WHERE id = ?").get(req.params.id);
  if (!question) return res.status(404).json({ message: "Questão não encontrada." });

  db.prepare("DELETE FROM collaboration_questions WHERE id = ?").run(req.params.id);
  logAction(req.user.id, question.form_id, "DELETE_QUESTION", `Deleted question ID: ${req.params.id}`);
  res.json({ message: "Questão eliminada." });
});

// POST /api/collaboration/submit - submit form responses
app.post("/api/collaboration/submit", authenticateToken, (req: any, res) => {
  try {
    const error = validateRequired(req.body, ["form_id", "responses"]);
    if (error) return res.status(400).json({ message: error });

    const { form_id, evaluated_id, evaluated_employee_id, responses } = req.body;

    if (!Array.isArray(responses)) {
      return res.status(400).json({ message: "Responses must be an array" });
    }

    const form: any = db.prepare("SELECT id FROM collaboration_forms WHERE id = ?").get(form_id);
    if (!form) return res.status(404).json({ message: "Formulário não encontrado." });

    // Validate employee exists if evaluated_employee_id provided
    if (evaluated_employee_id) {
      const emp: any = db.prepare("SELECT id FROM employees WHERE id = ?").get(evaluated_employee_id);
      if (!emp) {
        return res.status(400).json({ message: "Colaborador não encontrado.", evaluated_employee_id });
      }
    }

    const questions = db.prepare("SELECT id, question_type FROM collaboration_questions WHERE form_id = ?").all(form_id) as any[];
    const questionMap = new Map(questions.map(q => [q.id, q.question_type]));

    let inserted = 0;
    const insertResponse = db.prepare(`
      INSERT INTO collaboration_responses 
      (form_id, evaluated_id, evaluator_id, evaluated_employee_id, question_id, score, comment) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const r of responses) {
      if (!r.question_id) continue;
      const questionType = questionMap.get(r.question_id);
      if (!questionType) continue;
      const score = questionType === 'text' ? null : (r.score != null ? Number(r.score) : null);
      try {
        insertResponse.run(form_id, evaluated_id || null, req.user.id, evaluated_employee_id || null, r.question_id, score, r.comment || null);
        inserted++;
      } catch (err) {
        console.error("Failed to insert response:", r, err);
      }
    }

    if (inserted === 0) {
      return res.status(400).json({ 
        message: "Nenhuma resposta válida para inserir.", 
        debug: { 
          form_id, 
          questionsCount: questions.length, 
          receivedIds: responses.map((r: any) => r.question_id) 
        } 
      });
    }

    logAction(req.user.id, evaluated_id || evaluated_employee_id, "SUBMIT_FORM", `Submitted form ${form_id} with ${inserted} responses`);
    res.status(201).json({ message: "Respostas submetidas com sucesso.", inserted });
  } catch (err: any) {
    console.error("Collaboration submit error:", err.message, err.stack);
    res.status(500).json({ error: "Erro ao submeter avaliação.", message: err.message });
  }
});

// DEBUG: Recriar seed 360° (apenas desenvolvimento)
app.post("/api/debug/seed-360", authenticateToken, requireRole("Administrator"), (req: any, res) => {
  try {
    let createdBy = 1;
    const admin = db.prepare("SELECT id FROM users WHERE role = 'Administrator' LIMIT 1").get() as any;
    if (admin && admin.id) createdBy = admin.id;

    const formCount = db.prepare("SELECT COUNT(*) as cnt FROM collaboration_forms WHERE form_type = '360'").get() as any;
    if (formCount.cnt > 0) {
      return res.json({ message: "Formulário 360° já existe. Delete primeiro se quiser recriar." });
    }

    const formId = db.prepare("INSERT INTO collaboration_forms (title, description, form_type, entity_type, created_by) VALUES (?, ?, ?, ?, ?)").run(
      "Avaliação 360° - Know You Work",
      "Formulário padrão para avaliação 360° de colaboradores",
      "360",
      "Employee",
      createdBy
    ).lastInsertRowid;

    const questions = [
      ["Comunicação e colaboração", "rating", null, 2.0, 1, 1],
      ["Responsabilidade", "rating", null, 2.0, 1, 2],
      ["Qualidade do trabalho", "rating", null, 2.0, 1, 3],
      ["Iniciativa e proatividade", "rating", null, 2.0, 1, 4],
      ["Adaptabilidade", "rating", null, 1.5, 1, 5],
      ["Liderança (se aplicável)", "rating", null, 1.5, 0, 6],
      ["Pontos fortes", "text", null, 0, 0, 7],
      ["Áreas de melhoria", "text", null, 0, 0, 8],
      ["Sugestões", "text", null, 0, 0, 9]
    ];

    const insertQ = db.prepare("INSERT INTO collaboration_questions (form_id, question_text, question_type, options, weight, is_required, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)");
    questions.forEach((q: any[]) => {
      insertQ.run(formId, q[0], q[1], q[2], q[3], q[4], q[5]);
    });

    res.json({ message: "Formulário 360° criado com sucesso!", formId, questionsCount: questions.length });
  } catch (err: any) {
    console.error("Seed 360 error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/collaboration/responses - list all responses (with filters)
app.get("/api/collaboration/responses", authenticateToken, (req: any, res) => {
  const { form_id, question_id, evaluator_id, evaluated_id, evaluated_employee_id } = req.query;
  let query = `
    SELECT cr.*, 
           cf.title as form_title, 
           cq.question_text,
           u.name as evaluator_name,
           e.name as evaluated_name,
           emp.name as employee_name
    FROM collaboration_responses cr
    JOIN collaboration_forms cf ON cr.form_id = cf.id
    JOIN collaboration_questions cq ON cr.question_id = cq.id
    LEFT JOIN users u ON cr.evaluator_id = u.id
    LEFT JOIN entities e ON cr.evaluated_id = e.id
    LEFT JOIN employees emp ON cr.evaluated_employee_id = emp.id
  `;
  const params: any[] = [];
  const conditions: string[] = [];

  if (form_id) { conditions.push("cr.form_id = ?"); params.push(form_id); }
  if (question_id) { conditions.push("cr.question_id = ?"); params.push(question_id); }
  if (evaluator_id) { conditions.push("cr.evaluator_id = ?"); params.push(evaluator_id); }
  if (evaluated_id) { conditions.push("cr.evaluated_id = ?"); params.push(evaluated_id); }
  if (evaluated_employee_id) { conditions.push("cr.evaluated_employee_id = ?"); params.push(evaluated_employee_id); }

  if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");

  query += " ORDER BY cr.response_date DESC";

  const responses = db.prepare(query).all(...params) as any[];
  res.json(responses);
});

const checkExpiringApprovals = () => {
  const users = db.prepare("SELECT id FROM users").all() as any[];
  const expiring = db.prepare(`
    SELECT p.id, p.process_number, p.validity_date, e.name as entity_name 
    FROM processes p 
    JOIN entities e ON p.entity_id = e.id 
    WHERE p.status = 'Aprovado' 
    AND p.validity_date IS NOT NULL 
    AND date(p.validity_date) <= date('now', '+30 days')
  `).all() as any[];

  for (const proc of expiring) {
    for (const user of users) {
      const message = `O processo ${proc.process_number} (${proc.entity_name}) expira em ${proc.validity_date}`;
      const exists = db.prepare("SELECT id FROM notifications WHERE user_id = ? AND message = ?").get(user.id, message);
      if (!exists) {
        db.prepare("INSERT INTO notifications (user_id, message, type) VALUES (?, ?, 'Alert')").run(user.id, message);
      }
    }
  }
};

// ============================================================
// DASHBOARD & REPORTS
// ============================================================
app.get("/api/reports/dashboard", authenticateToken, (req, res) => {
  checkExpiringApprovals();

  const period = req.query.period as string;
  const entityType = req.query.entityType as string;
  const processType = req.query.processType as string;
  const processStatus = req.query.processStatus as string;
  const sector = req.query.sector as string;
  const riskRating = req.query.riskRating as string;
  const area = req.query.area as string;
  const impact = req.query.impact as string;

  let dateFilter = "";
  if (period === "current_month") {
    dateFilter = " AND created_at >= date('now', 'start of month')";
  } else if (period === "last_quarter") {
    dateFilter = " AND created_at >= date('now', '-3 months')";
  } else if (period === "last_year") {
    dateFilter = " AND created_at >= date('now', '-12 months')";
  }

  let entityFilter = "";
  if (entityType) entityFilter += ` AND e.entity_type = '${entityType}'`;
  if (sector) entityFilter += ` AND e.sector = '${sector}'`;
  if (riskRating) entityFilter += ` AND e.final_risk_rating = '${riskRating}'`;
  if (impact) entityFilter += ` AND e.operational_impact = '${impact}'`;

  let processFilter = "";
  if (processType) processFilter += ` AND p.type = '${processType}'`;
  if (processStatus) processFilter += ` AND p.status = '${processStatus}'`;
  if (area) processFilter += ` AND p.area = '${area}'`;

// Migration: Add evaluation_number and name to evaluations if not exists
  try {
    db.exec("ALTER TABLE evaluations ADD COLUMN evaluation_number TEXT");
    db.exec("ALTER TABLE evaluations ADD COLUMN name TEXT");
  } catch (e) { /* columns may already exist */ }

  const stats = {
    totals: {
      suppliers: db.prepare(`SELECT COUNT(*) as count FROM entities WHERE entity_type = 'Supplier'${dateFilter}`).get(),
      clients: db.prepare(`SELECT COUNT(*) as count FROM entities WHERE entity_type = 'Client'${dateFilter}`).get(),
       processes_pending: db.prepare(`SELECT COUNT(*) as count FROM processes p JOIN entities e ON p.entity_id = e.id WHERE p.status IN ('Em análise', 'Pendente', 'Em aprovação', 'Submetido')${dateFilter}${entityFilter.includes('Supplier') ? entityFilter : ''}${entityFilter.includes('Client') ? entityFilter : ''}`).get(),
      approved: db.prepare(`SELECT COUNT(*) as count FROM processes p JOIN entities e ON p.entity_id = e.id WHERE p.status = 'Aprovado'${dateFilter}${entityFilter}`).get(),
      rejected: db.prepare(`SELECT COUNT(*) as count FROM processes p JOIN entities e ON p.entity_id = e.id WHERE p.status = 'Reprovado'${dateFilter}${entityFilter}`).get(),
      eval_pending: db.prepare(`SELECT COUNT(*) as count FROM processes p JOIN entities e ON p.entity_id = e.id WHERE p.type = 'Avaliação' AND p.status != 'Encerrado'${dateFilter}${entityFilter}`).get(),
      reeval_pending: db.prepare(`SELECT COUNT(*) as count FROM processes p JOIN entities e ON p.entity_id = e.id WHERE p.type = 'Reavaliação' AND p.status != 'Encerrado'${dateFilter}${entityFilter}`).get(),
      critical_suppliers: db.prepare("SELECT COUNT(*) as count FROM entities WHERE entity_type = 'Supplier' AND final_risk_rating = 'Alto'").get(),
      low_perf_clients: db.prepare("SELECT COUNT(*) as count FROM evaluations ev JOIN entities e ON ev.entity_id = e.id WHERE e.entity_type = 'Client' AND ev.percentage < 60").get(),
    },
    indices: {
      avg_client_satisfaction: db.prepare("SELECT AVG(percentage) as avg FROM evaluations WHERE type = 'Satisfaction'").get(),
      avg_supplier_performance: db.prepare("SELECT AVG(percentage) as avg FROM evaluations WHERE type = 'Performance'").get(),
    },
    filters: {
      sectors: db.prepare("SELECT DISTINCT sector FROM entities WHERE sector IS NOT NULL AND sector != ''").all(),
      areas: db.prepare("SELECT DISTINCT area FROM processes WHERE area IS NOT NULL AND area != ''").all(),
    },
    processes_by_status: db.prepare(`
      SELECT p.status, COUNT(*) as count 
      FROM processes p 
      GROUP BY p.status 
      ORDER BY count DESC
    `).all(),
    monthly_evolution: db.prepare(`
      SELECT strftime('%Y-%m', p.created_at) as month, COUNT(*) as count 
      FROM processes p 
      GROUP BY month 
      ORDER BY month DESC 
      LIMIT 12
    `).all(),
  };
  res.json(stats);
});

// ============================================================
// REPORTS - SUPPLIERS
// ============================================================
app.get("/api/reports/suppliers/:type", authenticateToken, (req: any, res) => {
  const { type } = req.params;
  let query: string;
  let params: any[] = [];

  switch (type) {
    case "approved":
      query = `SELECT e.* FROM entities e WHERE e.entity_type = 'Supplier' AND (e.relationship_status = 'Homologado' OR e.relationship_status = 'Ativo' OR e.status = 'Ativo') ORDER BY e.name`;
      break;
    case "rejected":
      query = `SELECT e.* FROM entities e WHERE e.entity_type = 'Supplier' AND (e.relationship_status = 'Desqualificado' OR e.status = 'Inativo') ORDER BY e.name`;
      break;
    case "by-sector":
      query = `SELECT sector, COUNT(*) as count FROM entities WHERE entity_type = 'Supplier' AND sector IS NOT NULL AND sector != '' GROUP BY sector ORDER BY count DESC`;
      break;
    case "by-criticality":
      query = `SELECT criticality, COUNT(*) as count FROM entities WHERE entity_type = 'Supplier' AND criticality IS NOT NULL AND criticality != '' GROUP BY criticality ORDER BY count DESC`;
      break;
    case "expiring":
      query = `
        SELECT DISTINCT e.*, p.validity_date, p.status as process_status
        FROM entities e
        JOIN processes p ON e.id = p.entity_id
        WHERE e.entity_type = 'Supplier'
          AND p.status = 'Aprovado'
          AND p.validity_date IS NOT NULL
          AND date(p.validity_date) <= date('now', '+30 days')
          AND date(p.validity_date) >= date('now')
        ORDER BY p.validity_date ASC
      `;
      break;
    case "performance-ranking":
      query = `
        SELECT e.id, e.name, e.code, AVG(ev.percentage) as avg_score
        FROM entities e
        JOIN evaluations ev ON e.id = ev.entity_id
        WHERE e.entity_type = 'Supplier' AND ev.type = 'Performance'
        GROUP BY e.id
        ORDER BY avg_score DESC
        LIMIT 10
      `;
      break;
    case "satisfaction-ranking":
      query = `
        SELECT e.id, e.name, e.code, AVG(ev.percentage) as avg_score
        FROM entities e
        JOIN evaluations ev ON e.id = ev.entity_id
        WHERE e.entity_type = 'Supplier' AND ev.type = 'Satisfaction'
        GROUP BY e.id
        ORDER BY avg_score DESC
        LIMIT 10
      `;
      break;
    case "suspended":
      query = `SELECT e.* FROM entities e WHERE e.entity_type = 'Supplier' AND (e.status = 'Suspenso' OR e.relationship_status = 'Suspenso') ORDER BY e.name`;
      break;
    default:
      return res.status(400).json({ message: "Tipo de relatório inválido para fornecedores." });
  }

  const result = db.prepare(query).all(...params);
  res.json(result);
});

// ============================================================
// REPORTS - CLIENTS
// ============================================================
app.get("/api/reports/clients/:type", authenticateToken, (req: any, res) => {
  const { type } = req.params;
  let query: string;

  switch (type) {
    case "approved":
      query = `SELECT e.* FROM entities e WHERE e.entity_type = 'Client' AND (e.relationship_status = 'Homologado' OR e.relationship_status = 'Ativo' OR e.status = 'Ativo') ORDER BY e.name`;
      break;
    case "by-risk":
      query = `SELECT final_risk_rating as risk, COUNT(*) as count FROM entities WHERE entity_type = 'Client' AND final_risk_rating IS NOT NULL AND final_risk_rating != '' GROUP BY final_risk_rating ORDER BY count DESC`;
      break;
    case "by-segment":
      query = `SELECT segment, COUNT(*) as count FROM entities WHERE entity_type = 'Client' AND segment IS NOT NULL AND segment != '' GROUP BY segment ORDER BY count DESC`;
      break;
    case "performance":
      query = `
        SELECT e.id, e.name, e.code, AVG(ev.percentage) as avg_score
        FROM entities e
        JOIN evaluations ev ON e.id = ev.entity_id
        WHERE e.entity_type = 'Client' AND ev.type = 'Performance'
        GROUP BY e.id
        ORDER BY avg_score DESC
        LIMIT 10
      `;
      break;
    case "satisfaction":
      query = `
        SELECT e.id, e.name, e.code, AVG(ev.percentage) as avg_score
        FROM entities e
        JOIN evaluations ev ON e.id = ev.entity_id
        WHERE e.entity_type = 'Client' AND ev.type = 'Satisfaction'
        GROUP BY e.id
        ORDER BY avg_score DESC
        LIMIT 10
      `;
      break;
    case "pending-reevaluation":
      query = `
        SELECT DISTINCT e.*, p.next_reevaluation_date
        FROM entities e
        JOIN processes p ON e.id = p.entity_id
        WHERE e.entity_type = 'Client'
          AND p.type = 'Reavaliação'
          AND p.status NOT IN ('Encerrado', 'Reprovado')
          AND (p.next_reevaluation_date IS NULL OR p.next_reevaluation_date >= date('now'))
      `;
      break;
    case "restricted":
      query = `SELECT e.* FROM entities e WHERE e.entity_type = 'Client' AND e.relationship_status = 'Restrito' ORDER BY e.name`;
      break;
    default:
      return res.status(400).json({ message: "Tipo de relatório inválido para clientes." });
  }

  const result = db.prepare(query).all();
  res.json(result);
});

// ============================================================
// REPORTS - MANAGEMENT
// ============================================================
app.get("/api/reports/management/:type", authenticateToken, (req: any, res) => {
  const { type } = req.params;

  switch (type) {
      case "avg-approval-time": {
        const rows = db.prepare(`
          SELECT 
            u.name as responsible,
            COUNT(p.id) as approved_count,
            AVG(julianday(p.decision_date) - julianday(p.created_at)) as avg_days
          FROM processes p
          LEFT JOIN users u ON p.opener_id = u.id
          WHERE p.status IN ('Aprovado', 'Reprovado')
            AND p.decision_date IS NOT NULL
          GROUP BY p.opener_id, u.name
          ORDER BY avg_days DESC
        `).all() as any[];
        const result = rows.map((row: any) => ({
          responsible: row.responsible || "Sem responsável",
          approved_count: row.approved_count,
          avg_days: Math.round((row.avg_days || 0) * 10) / 10
        }));
        res.json(result);
        break;
      }
      case "approval-rate": {
        const rows = db.prepare(`
          SELECT 
            u.name as responsible,
            COUNT(p.id) as total,
            SUM(CASE WHEN p.status = 'Aprovado' THEN 1 ELSE 0 END) as approved,
            AVG(julianday(p.decision_date) - julianday(p.created_at)) as avg_days
          FROM processes p
          LEFT JOIN users u ON p.opener_id = u.id
          GROUP BY p.opener_id, u.name
          ORDER BY approved DESC
        `).all() as any[];
        const result = rows.map((row: any) => ({
          responsible: row.responsible || "Sem responsável",
          total: row.total || 0,
          approved: row.approved || 0,
          approval_rate: row.total > 0 ? Math.round((row.approved / row.total) * 1000) / 10 : 0,
          avg_days: Math.round((row.avg_days || 0) * 10) / 10
        }));
        res.json(result);
        break;
      }
      case "rejection-rate": {
        const rows = db.prepare(`
          SELECT 
            u.name as responsible,
            COUNT(p.id) as total,
            SUM(CASE WHEN p.status = 'Reprovado' THEN 1 ELSE 0 END) as rejected,
            AVG(CASE WHEN p.status = 'Reprovado' THEN julianday(p.decision_date) - julianday(p.created_at) END) as avg_days,
            (SELECT COUNT(*) FROM processes pr WHERE pr.opener_id = u.id AND pr.status = 'Reprovado' AND pr.justification IS NOT NULL AND pr.justification != '' LIMIT 1) as has_reason
          FROM processes p
          LEFT JOIN users u ON p.opener_id = u.id
          GROUP BY p.opener_id, u.name
          ORDER BY rejected DESC
        `).all() as any[];
        const result = rows.map((row: any) => ({
          responsible: row.responsible || "Sem responsável",
          total: row.total || 0,
          rejected: row.rejected || 0,
          rejection_rate: row.total > 0 ? Math.round((row.rejected / row.total) * 1000) / 10 : 0,
          avg_days: Math.round((row.avg_days || 0) * 10) / 10,
          common_reason: row.has_reason ? "Ver justificativa" : "N/A"
        }));
        res.json(result);
        break;
      }
     case "satisfaction-trend": {
       const rows = db.prepare(`
         SELECT strftime('%Y-%m', evaluation_date) as period, AVG(percentage) as avg_score
         FROM evaluations
         WHERE type = 'Satisfaction'
         GROUP BY period
         ORDER BY period DESC
         LIMIT 12
       `).all() as any[];
       res.json(rows);
       break;
     }
     case "performance-trend": {
       const rows = db.prepare(`
         SELECT strftime('%Y-%m', evaluation_date) as period, AVG(percentage) as avg_score
         FROM evaluations
         WHERE type = 'Performance'
         GROUP BY period
         ORDER BY period DESC
         LIMIT 12
       `).all() as any[];
       res.json(rows);
       break;
     }
     case "open-action-plans": {
       const rows = db.prepare(`
         SELECT 
           ev.id,
           ev.entity_id,
           e.name as entity_name,
           ev.action_plan as action_description,
           ev.action_plan_deadline as deadline,
           ev.evaluation_date,
           CASE 
             WHEN ev.action_plan_deadline < date('now') THEN 'Atrasado'
             ELSE 'Em andamento'
           END as status
         FROM evaluations ev
         JOIN entities e ON ev.entity_id = e.id
         WHERE ev.action_plan IS NOT NULL AND ev.action_plan != ''
           AND (ev.action_plan_deadline IS NULL OR ev.action_plan_deadline >= date('now'))
       `).all() as any[];
       res.json(rows);
       break;
     }
     case "processes-by-responsible": {
       const rows = db.prepare(`
         SELECT 
           u.name as responsible,
           COUNT(p.id) as total,
           SUM(CASE WHEN p.status = 'Aprovado' THEN 1 ELSE 0 END) as approved,
           SUM(CASE WHEN p.status = 'Reprovado' THEN 1 ELSE 0 END) as rejected,
           SUM(CASE WHEN p.status IN ('Rascunho', 'Pendente', 'Em análise', 'Submetido', 'Em aprovação') THEN 1 ELSE 0 END) as pending
         FROM processes p
         LEFT JOIN users u ON p.opener_id = u.id
         GROUP BY p.opener_id, u.name
         ORDER BY total DESC
       `).all() as any[];
       const result = rows.map((row: any) => ({
         responsible: row.responsible || "Sem responsável",
         total: row.total || 0,
         approved: row.approved || 0,
         rejected: row.rejected || 0,
         pending: row.pending || 0
       }));
       res.json(result);
       break;
     }
      default:
        res.status(400).json({ message: "Tipo de relatório de gestão inválido." });
    }
  });

app.get("/api/reports/collaboration/:type", authenticateToken, (req: any, res) => {
  try {
    const { type } = req.params;
    console.log(`[DEBUG] Collaboration report requested: ${type}`);

    // Check if tables exist
    const hasEmployees = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='employees'").get();
    const hasCollabResponses = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='collaboration_responses'").get();
    const hasCollabForms = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='collaboration_forms'").get();

    if (!hasEmployees || !hasCollabResponses || !hasCollabForms) {
      console.log("[DEBUG] Missing tables:", { hasEmployees: !!hasEmployees, hasCollabResponses: !!hasCollabResponses, hasCollabForms: !!hasCollabForms });
      return res.json([]);
    }

    switch (type) {
      case "360-overall": {
        const rows = db.prepare(`
          SELECT cr.*, cf.title as form_title, e.name as evaluated_name, emp.name as employee_name
          FROM collaboration_responses cr
          JOIN collaboration_forms cf ON cr.form_id = cf.id
          LEFT JOIN entities e ON cr.evaluated_id = e.id
          LEFT JOIN employees emp ON cr.evaluated_employee_id = emp.id
          WHERE cf.form_type = '360'
          ORDER BY cr.response_date DESC
          LIMIT 50
        `).all() as any[];
        console.log(`[DEBUG] 360-overall rows: ${rows.length}`);
        res.json(rows);
        break;
      }
      case "360-by-department": {
        const rows = db.prepare(`
          SELECT emp.department, COUNT(*) as count
          FROM collaboration_responses cr
          JOIN collaboration_forms cf ON cr.form_id = cf.id
          JOIN employees emp ON cr.evaluated_employee_id = emp.id
          WHERE cf.form_type = '360'
          GROUP BY emp.department
          ORDER BY count DESC
        `).all() as any[];
        console.log(`[DEBUG] 360-by-department rows: ${rows.length}`);
        res.json(rows);
        break;
      }
      case "360-by-position": {
        const rows = db.prepare(`
          SELECT emp.position, COUNT(*) as count, AVG(cr.score * 100.0 / cq.max_score) as avg_percentage
          FROM collaboration_responses cr
          JOIN collaboration_forms cf ON cr.form_id = cf.id
          JOIN collaboration_questions cq ON cr.question_id = cq.id
          JOIN employees emp ON cr.evaluated_employee_id = emp.id
          WHERE cf.form_type = '360'
          GROUP BY emp.position
          ORDER BY avg_percentage DESC
        `).all() as any[];
        console.log(`[DEBUG] 360-by-position rows: ${rows.length}`);
        res.json(rows);
        break;
      }
      case "360-trend": {
        const rows = db.prepare(`
          SELECT strftime('%Y-%m', cr.response_date) as month, AVG(cr.score * 100.0 / cq.max_score) as avg_percentage
          FROM collaboration_responses cr
          JOIN collaboration_forms cf ON cr.form_id = cf.id
          JOIN collaboration_questions cq ON cr.question_id = cq.id
          WHERE cf.form_type = '360'
          GROUP BY month
          ORDER BY month DESC
          LIMIT 6
        `).all() as any[];
        console.log(`[DEBUG] 360-trend rows: ${rows.length}`);
        res.json(rows);
        break;
      }
      case "360-participation": {
        const totalResult = db.prepare("SELECT COUNT(*) as cnt FROM employees WHERE status = 'Ativo'").get() as any;
        const total = totalResult?.cnt || 0;
        const evaluatedResult = db.prepare(`
          SELECT COUNT(DISTINCT cr.evaluated_employee_id) as cnt
          FROM collaboration_responses cr
          JOIN collaboration_forms cf ON cr.form_id = cf.id
          WHERE cf.form_type = '360'
        `).get() as any;
        const evaluated = evaluatedResult?.cnt || 0;
        console.log(`[DEBUG] 360-participation: total=${total}, evaluated=${evaluated}`);
        res.json([{ total_employees: total, evaluated_count: evaluated }]);
        break;
      }
      default:
        res.status(400).json({ message: "Tipo de relatório de colaboração inválido." });
        break;
    }
  } catch (err: any) {
    console.error("[ERROR] Collaboration report:", err.message, err.stack);
    res.status(500).json({ error: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

   app.listen(PORT, "0.0.0.0", () => {
     console.log(`Server running on http://localhost:${PORT}`);
   });
 }

// ============================================================
// ERROR HANDLING - Ensure JSON responses for API errors
// ============================================================
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Unhandled error:", err);
  if (req.path.startsWith('/api/') && !req.path.startsWith('/api/public/')) {
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
  next(err);
});

startServer();

