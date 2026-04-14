import Database from "better-sqlite3";
import * as fs from "fs";
import bcrypt from "bcryptjs";

const dbFile = "toknow.db";

if (fs.existsSync(dbFile)) {
  fs.unlinkSync(dbFile);
}

const db = new Database(dbFile);

db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    trade_name TEXT,
    entity_type TEXT NOT NULL, -- 'Supplier' or 'Client'
    sub_type TEXT, -- 'Company', 'Individual', 'Public'
    tax_id TEXT, -- NIF
    registration_number TEXT,
    status TEXT DEFAULT 'In Analysis', -- 'Active', 'Inactive', 'Suspended', 'In Analysis'
    sector TEXT,
    supply_type TEXT,
    category TEXT,
    operational_impact TEXT,
    criticality TEXT,
    requesting_area TEXT,
    business_unit TEXT,
    
    -- Financeiro/Comercial
    payment_condition TEXT,
    currency TEXT,
    contract_limit REAL,
    bank TEXT,
    iban TEXT,
    supply_history TEXT,
    estimated_annual_volume REAL,
    
    -- Clientes específicos
    segment TEXT,
    relationship_channel TEXT,
    importance TEXT,
    business_potential TEXT,
    credit_limit REAL,
    purchase_frequency TEXT,
    average_ticket REAL,
    
    -- Localização
    address TEXT,
    province TEXT,
    municipality TEXT,
    country TEXT DEFAULT 'Angola',
    phone TEXT,
    mobile TEXT,
    email_main TEXT,
    website TEXT,
    
    -- Responsável
    resp_name TEXT,
    resp_position TEXT,
    resp_mobile TEXT,
    resp_email TEXT,

    -- Compliance e Risco
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
  );

  CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    url TEXT NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
  );

  CREATE TABLE processes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    process_number TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL, -- 'Approval', 'Evaluation', 'Reevaluation'
    status TEXT NOT NULL, -- 'Draft', 'In Analysis', 'Submitted', 'In Approval', 'Approved', 'Rejected', 'Pending', 'Closed'
    opener_id INTEGER,
    area TEXT,
    justification TEXT,
    priority TEXT, -- 'Normal', 'High', 'Critical'
    entity_id INTEGER,
    
    -- Approval specific
    approval_purpose TEXT, -- 'Partnership', 'Purchase', 'Subcontracting'
    operational_need TEXT,
    
    result_score REAL,
    result_percentage REAL,
    compliance_level TEXT, -- 'Non-compliant', 'Partially compliant', 'Compliant'
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
  );

  CREATE TABLE criteria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    entity_type TEXT, -- 'Supplier', 'Client', or NULL (both)
    process_type TEXT, -- 'Approval', 'Evaluation', 'Reevaluation'
    evaluation_type TEXT, -- 'Performance', 'Satisfaction'
    weight REAL DEFAULT 1,
    min_score REAL DEFAULT 0,
    max_score REAL DEFAULT 10,
    is_required INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE process_criteria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    process_id INTEGER NOT NULL,
    criteria_id INTEGER NOT NULL,
    score REAL,
    evidence TEXT,
    comments TEXT,
    FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE,
    FOREIGN KEY (criteria_id) REFERENCES criteria(id)
  );

  CREATE TABLE evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    process_id INTEGER,
    entity_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'Performance', 'Satisfaction'
    evaluator_id INTEGER,
    period TEXT,
    product_service TEXT,
    unit TEXT,
    overall_score REAL,
    percentage REAL,
    classification TEXT,
    recommended_action TEXT, -- 'Maintain', 'Improve', 'Reevaluate', 'Suspend', 'Disqualify'
    action_plan_deadline DATE,
    action_plan_responsible TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES processes(id),
    FOREIGN KEY (entity_id) REFERENCES entities(id),
    FOREIGN KEY (evaluator_id) REFERENCES users(id)
  );

  CREATE TABLE evaluation_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evaluation_id INTEGER NOT NULL,
    group_name TEXT,
    criterion_name TEXT NOT NULL,
    score REAL NOT NULL,
    observation TEXT,
    evidence TEXT,
    FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
  );

  CREATE TABLE history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id INTEGER,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES entities(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed Users
const salt = bcrypt.genSaltSync(10);
const insertUser = db.prepare("INSERT INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?, ?)");
insertUser.run("admin", bcrypt.hashSync("admin123", salt), "Administrador do Sistema", "Administrator", "admin@toknow.com");
insertUser.run("gestor", bcrypt.hashSync("gestor123", salt), "Gestor de Compliance", "Compliance Manager", "compliance@toknow.com");
insertUser.run("compras", bcrypt.hashSync("compras123", salt), "João Compras", "Procurement", "procurement@toknow.com");

// Seed Criteria
const insertCriteria = db.prepare(`
  INSERT INTO criteria 
  (code, name, description, entity_type, process_type, weight, max_score, display_order) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// Supplier Approval Criteria
insertCriteria.run("SUP_LEG", "Regularidade Legal", "Verificação de alvarás e registos", "Supplier", "Approval", 2, 10, 1);
insertCriteria.run("SUP_FIS", "Regularidade Fiscal", "Certidões negativas de impostos", "Supplier", "Approval", 2, 10, 2);
insertCriteria.run("SUP_TEC", "Capacidade Técnica", "Experiência e referências", "Supplier", "Approval", 1.5, 10, 3);
insertCriteria.run("SUP_REP", "Reputação", "Histórico no mercado e judicial", "Supplier", "Approval", 1, 10, 4);

// Client Approval Criteria
insertCriteria.run("CLI_CRED", "Limite de Crédito", "Análise de risco financeiro", "Client", "Approval", 2, 10, 1);
insertCriteria.run("CLI_PEP", "Risco PEP/Sanções", "Verificação de listas restritivas", "Client", "Approval", 2, 10, 2);

console.log("Database refined and re-initialized.");
db.close();
