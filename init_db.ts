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
    status TEXT DEFAULT 'Em análise',
    sector TEXT,
    supply_type TEXT,
    category TEXT,
    operational_impact TEXT,
    criticality TEXT,
    requesting_area TEXT,
    business_unit TEXT,
    
    -- Classificação - Cliente
    activity_sector TEXT,
    client_type TEXT,
    commercial_category TEXT,
    
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
    type TEXT NOT NULL,
    status TEXT DEFAULT 'Rascunho',
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
    evaluation_type TEXT, -- 'Nova', 'Reavaliação'
    periodicity TEXT, -- 'Mensal', 'Trimestral', 'Semestral', 'Anual'
    evaluator_id INTEGER,
    evaluation_date DATE,
    period_start DATE,
    period_end DATE,
    product_service TEXT,
    unit TEXT,
    overall_score REAL,
    percentage REAL,
    classification TEXT,
    recommended_action TEXT, -- 'Manter', 'Melhorar', 'Reavaliar', 'Suspender', 'Desqualificar'
    action_plan TEXT,
    action_plan_deadline DATE,
    action_plan_responsible TEXT,
    previous_evaluation_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES processes(id),
    FOREIGN KEY (entity_id) REFERENCES entities(id),
    FOREIGN KEY (evaluator_id) REFERENCES users(id),
    FOREIGN KEY (previous_evaluation_id) REFERENCES evaluations(id)
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
  (code, name, description, entity_type, process_type, evaluation_type, weight, max_score, display_order) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Supplier Approval Criteria (12 critérios)
insertCriteria.run("SUP_LEG", "Regularidade Legal", "Verificação de alvarás e registos comerciais", "Supplier", "Approval", null, 1, 10, 1);
insertCriteria.run("SUP_FIS", "Regularidade Fiscal", "Certidões negativas de impostos", "Supplier", "Approval", null, 1, 10, 2);
insertCriteria.run("SUP_TEC", "Capacidade Técnica", "Experiência, recursos e competências", "Supplier", "Approval", null, 1, 10, 3);
insertCriteria.run("SUP_FIN", "Capacidade Financeira", "Análise de demonstrações financeiras", "Supplier", "Approval", null, 1, 10, 4);
insertCriteria.run("SUP_REP", "Reputação", "Histórico no mercado e reputacional", "Supplier", "Approval", null, 1, 10, 5);
insertCriteria.run("SUP_QLD", "Qualidade do Produto/Serviço", "Certificações e controle de qualidade", "Supplier", "Approval", null, 1, 10, 6);
insertCriteria.run("SUP_PRA", "Prazos de Entrega", " track record de cumprimento", "Supplier", "Approval", null, 1, 10, 7);
insertCriteria.run("SUP_COM", "Condições Comerciais", "Preços, descontos e condições de pagamento", "Supplier", "Approval", null, 1, 10, 8);
insertCriteria.run("SUP_SEG", "Segurança e Conformidade", "HSE e conformidade regulatória", "Supplier", "Approval", null, 1, 10, 9);
insertCriteria.run("SUP_IMP", "Impacto na Operação", "Criticidade para os processos", "Supplier", "Approval", null, 1, 10, 10);
insertCriteria.run("SUP_DEP", "Dependência Crítica", "Nível de dependência do fornecedor", "Supplier", "Approval", null, 1, 10, 11);
insertCriteria.run("SUP_REF", "Referências do Mercado", "Recomendações e referências verificáveis", "Supplier", "Approval", null, 1, 10, 12);

// Client Approval Criteria
insertCriteria.run("CLI_CRED", "Capacidade Financeira", "Análise de risco e limite de crédito", "Client", "Approval", null, 1, 10, 1);
insertCriteria.run("CLI_PEP", "Risco PEP/Sanções", "Verificação de listas restritivas", "Client", "Approval", null, 1, 10, 2);
insertCriteria.run("CLI_REG", "Regularidade", "Verificação fiscal e registos", "Client", "Approval", null, 1, 10, 3);
insertCriteria.run("CLI_DS", "Dados de Satisfação", "Histórico de relacionamento", "Client", "Approval", null, 1, 10, 4);
insertCriteria.run("CLI_COM", "Potencial Comercial", "Volume de negócios projetado", "Client", "Approval", null, 1, 10, 5);

// Supplier Performance Evaluation Criteria (12 critérios)
insertCriteria.run("PER_QLD", "Qualidade do Fornecimento", "Conformidade com especificações", "Supplier", "Evaluation", "Performance", 1, 10, 1);
insertCriteria.run("PER_PRA", "Cumprimento de Prazos", "Entregas no prazo", "Supplier", "Evaluation", "Performance", 1, 10, 2);
insertCriteria.run("PER_DOC", "Conformidade Documental", "Documentação completa e correta", "Supplier", "Evaluation", "Performance", 1, 10, 3);
insertCriteria.run("PER_CON", "Confiabilidade", "Consistência no cumprimento", "Supplier", "Evaluation", "Performance", 1, 10, 4);
insertCriteria.run("PER_RES", "Capacidade de Resposta", "Agilidade em demandas", "Supplier", "Evaluation", "Performance", 1, 10, 5);
insertCriteria.run("PER_FLX", "Flexibilidade", "Adaptação a mudanças", "Supplier", "Evaluation", "Performance", 1, 10, 6);
insertCriteria.run("PER_ATD", "Atendimento", "Qualidade do suporte", "Supplier", "Evaluation", "Performance", 1, 10, 7);
insertCriteria.run("PER_PV", "Preço vs Valor", "Custo-benefício", "Supplier", "Evaluation", "Performance", 1, 10, 8);
insertCriteria.run("PER_REC", "Gestão de Reclamações", "Tratamento de queixas", "Supplier", "Evaluation", "Performance", 1, 10, 9);
insertCriteria.run("PER_CONT", "Continuidade Operacional", "Garantia de fornecimento", "Supplier", "Evaluation", "Performance", 1, 10, 10);
insertCriteria.run("PER_HSE", "Segurança/HSE", "Compliance de segurança", "Supplier", "Evaluation", "Performance", 1, 10, 11);
insertCriteria.run("PER_INV", "Inovação e Melhoria", "Melhorias propostas", "Supplier", "Evaluation", "Performance", 1, 10, 12);

// Satisfaction Evaluation Criteria
insertCriteria.run("SAT_GER", "Satisfação Geral", "Avaliação holística", "Client", "Evaluation", "Satisfaction", 1, 10, 1);
insertCriteria.run("SAT_CAL", "Qualidade do Atendimento", "Excelência no suporte", "Client", "Evaluation", "Satisfaction", 1, 10, 2);
insertCriteria.run("SAT_TEM", "Tempo de Resposta", "Rapidez no retorno", "Client", "Evaluation", "Satisfaction", 1, 10, 3);
insertCriteria.run("SAT_PRO", "Qualidade do Produto", "Conformidade", "Client", "Evaluation", "Satisfaction", 1, 10, 4);
insertCriteria.run("SAT_PRA", "Cumprimento de Prazos", "Entregas no prazo", "Client", "Evaluation", "Satisfaction", 1, 10, 5);
insertCriteria.run("SAT_VAL", "Valor", "Custo-benefício", "Client", "Evaluation", "Satisfaction", 1, 10, 6);
insertCriteria.run("SAT_COM", "Comunicação", "Clareza e eficácia", "Client", "Evaluation", "Satisfaction", 1, 10, 7);
insertCriteria.run("SAT_REC", "Resolução de Reclamações", "Tratamento de queixas", "Client", "Evaluation", "Satisfaction", 1, 10, 8);
insertCriteria.run("SAT_CON", "Confiança", "Segurança na parceria", "Client", "Evaluation", "Satisfaction", 1, 10, 9);
insertCriteria.run("SAT_NPS", "NPS", "Net Promoter Score", "Client", "Evaluation", "Satisfaction", 1, 10, 10);

// Supplier Satisfaction Evaluation Criteria (new)
insertCriteria.run("SUP_SAT_REQ", "Clareza dos Requisitos", "Clareza nas especificações e requisitos", "Supplier", "Evaluation", "SupplierSatisfaction", 1, 5, 1);
insertCriteria.run("SUP_SAT_COM", "Facilidade de Comunicação", "Eficácia na comunicação", "Supplier", "Evaluation", "SupplierSatisfaction", 1, 5, 2);
insertCriteria.run("SUP_SAT_TEM", "Tempo de Resposta", "Rapidez no retorno", "Supplier", "Evaluation", "SupplierSatisfaction", 1, 5, 3);
insertCriteria.run("SUP_SAT_TRAT", "Justiça no Tratamento", "Equidade comercial", "Supplier", "Evaluation", "SupplierSatisfaction", 1, 5, 4);
insertCriteria.run("SUP_SAT_CONTR", "Clareza Contratual", "Transparência nos contratos", "Supplier", "Evaluation", "SupplierSatisfaction", 1, 5, 5);
insertCriteria.run("SUP_SAT_PAG", "Cumprimento de Pagamentos", "Pontualidade nos pagamentos", "Supplier", "Evaluation", "SupplierSatisfaction", 1, 5, 6);
insertCriteria.run("SUP_SAT_COOP", "Cooperação Operacional", "Trabalho em equipa", "Supplier", "Evaluation", "SupplierSatisfaction", 1, 5, 7);
insertCriteria.run("SUP_SAT_RES", "Resolução de Problemas", "Capacidade de resolver issues", "Supplier", "Evaluation", "SupplierSatisfaction", 1, 5, 8);
insertCriteria.run("SUP_SAT_TRANS", "Transparência", "Clareza na relação", "Supplier", "Evaluation", "SupplierSatisfaction", 1, 5, 9);
insertCriteria.run("SUP_SAT_CONT", "Interesse em Continuidade", "Parceria de longo prazo", "Supplier", "Evaluation", "SupplierSatisfaction", 1, 5, 10);

// Client Performance Evaluation Criteria
insertCriteria.run("CLI_PER_PAG", "Pontualidade no Pagamento", "Cumprimento de prazos de pagamento", "Client", "Evaluation", "ClientPerformance", 1, 10, 1);
insertCriteria.run("CLI_PER_VOL", "Volume de Compras", "Volume de negócio", "Client", "Evaluation", "ClientPerformance", 1, 10, 2);
insertCriteria.run("CLI_PER_FREQ", "Frequência de Relacionamento", "Constância", "Client", "Evaluation", "ClientPerformance", 1, 10, 3);
insertCriteria.run("CLI_PER_CONTR", "Cumprimento Contratual", "Adesão aos termos", "Client", "Evaluation", "ClientPerformance", 1, 10, 4);
insertCriteria.run("CLI_PER_COM", "Qualidade da Comunicação", "Clareza e eficácia", "Client", "Evaluation", "ClientPerformance", 1, 10, 5);
insertCriteria.run("CLI_PER_EST", "Estabilidade da Relação", "Consistência", "Client", "Evaluation", "ClientPerformance", 1, 10, 6);
insertCriteria.run("CLI_PER_LIT", "Ocorrência de Litígios", "Conflitos", "Client", "Evaluation", "ClientPerformance", 1, 10, 7);
insertCriteria.run("CLI_PER_RENT", "Rentabilidade", "Margem de lucro", "Client", "Evaluation", "ClientPerformance", 1, 10, 8);
insertCriteria.run("CLI_PER_FIDEL", "Fidelização", "Lealdade", "Client", "Evaluation", "ClientPerformance", 1, 10, 9);
insertCriteria.run("CLI_PER_POT", "Potencial de Crescimento", "Crescimento esperado", "Client", "Evaluation", "ClientPerformance", 1, 10, 10);

console.log("Database refinement complete with all 12 approval criteria.");
db.close();
