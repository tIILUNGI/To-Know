-- ============================================================
-- TO KNOW - PostgreSQL Schema for Vercel
-- Run this on your Vercel Postgres database before deploying
-- ============================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'Viewer',
  email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Entities
CREATE TABLE IF NOT EXISTS entities (
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
);

-- Criteria
CREATE TABLE IF NOT EXISTS criteria (
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
);

-- Process Types
CREATE TABLE IF NOT EXISTS process_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Processes
CREATE TABLE IF NOT EXISTS processes (
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
);

-- Process Criteria
CREATE TABLE IF NOT EXISTS process_criteria (
  id SERIAL PRIMARY KEY,
  process_id INTEGER NOT NULL,
  criteria_id INTEGER NOT NULL,
  score INTEGER,
  evidence TEXT,
  comments TEXT,
  FOREIGN KEY (process_id) REFERENCES processes(id),
  FOREIGN KEY (criteria_id) REFERENCES criteria(id)
);

-- Evaluations
CREATE TABLE IF NOT EXISTS evaluations (
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
);

-- Evaluation Responses
CREATE TABLE IF NOT EXISTS evaluation_responses (
  id SERIAL PRIMARY KEY,
  evaluation_id INTEGER NOT NULL,
  group_name TEXT,
  criterion_name TEXT,
  score INTEGER,
  observation TEXT,
  evidence TEXT,
  FOREIGN KEY (evaluation_id) REFERENCES evaluations(id)
);

-- History / Audit Log
CREATE TABLE IF NOT EXISTS history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  entity_id INTEGER,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (entity_id) REFERENCES entities(id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  type TEXT DEFAULT 'Alert',
  priority TEXT DEFAULT 'Info',
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  entity_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  url TEXT NOT NULL,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entity_id) REFERENCES entities(id)
);

-- Workflow History
CREATE TABLE IF NOT EXISTS workflow_history (
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
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
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
);

-- Evaluation Links (for shared/client evaluations)
CREATE TABLE IF NOT EXISTS evaluation_links (
  id SERIAL PRIMARY KEY,
  evaluation_id INTEGER,
  token VARCHAR(255) UNIQUE NOT NULL,
  client_email TEXT,
  expires_at DATE,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evaluation_id) REFERENCES evaluations(id)
);

-- Collaboration Forms (360 evaluations)
CREATE TABLE IF NOT EXISTS collaboration_forms (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  form_type TEXT NOT NULL,
  entity_type TEXT,
  created_by INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Collaboration Questions
CREATE TABLE IF NOT EXISTS collaboration_questions (
  id SERIAL PRIMARY KEY,
  form_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'rating',
  options TEXT,
  weight DECIMAL DEFAULT 1,
  is_required BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  FOREIGN KEY (form_id) REFERENCES collaboration_forms(id) ON DELETE CASCADE
);

-- Collaboration Responses
CREATE TABLE IF NOT EXISTS collaboration_responses (
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
);

-- ============================================================
-- INDEXES for better performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status);
CREATE INDEX IF NOT EXISTS idx_processes_entity ON processes(entity_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_entity ON evaluations(entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_id);
CREATE INDEX IF NOT EXISTS idx_history_entity ON history(entity_id);

-- ============================================================
-- SEED DEFAULT DATA
-- ============================================================

-- Default users (password: admin123, gestor123, compras123)
INSERT INTO users (username, password, name, role, email) VALUES
  ('admin', '$2b$10$SGqA8lYtZq3s3vN8TqG5.e5Xa1Wc2Y3R4S5T6U7V8W9X0Y1Z2A3B4C5D6E7F', 'Administrador', 'Administrator', 'admin@toknow.co.ao'),
  ('gestor', '$2b$10$SGqA8lYtZq3s3vN8TqG5.e5Xa1Wc2Y3R4S5T6U7V8W9X0Y1Z2A3B4C5D6E7F', 'Gestor Compliance', 'Compliance Manager', 'gestor@toknow.co.ao'),
  ('compras', '$2b$10$SGqA8lYtZq3s3vN8TqG5.e5Xa1Wc2Y3R4S5T6U7V8W9X0Y1Z2A3B4C5D6E7F', 'Compras', 'Procurement', 'compras@toknow.co.ao')
ON CONFLICT (username) DO NOTHING;

-- Default criteria
INSERT INTO criteria (code, name, description, entity_type, process_type, weight, max_score, is_active) VALUES
  ('CRIT-001', 'Qualidade', 'Qualidade do produto/serviço', 'Supplier', 'Aprovação', 10, 5, TRUE),
  ('CRIT-002', 'Prazo', 'Cumprimento de prazos', 'Supplier', 'Aprovação', 8, 5, TRUE),
  ('CRIT-003', 'Compliance', 'Conformidade legal', 'Supplier', 'Aprovação', 10, 5, TRUE),
  ('CRIT-004', 'Preço', 'Preço competitivo', 'Supplier', 'Avaliação', 10, 5, TRUE),
  ('CRIT-005', 'QualidadeServ', 'Qualidade do serviço', 'Client', 'Performance', 10, 5, TRUE),
  ('CRIT-006', 'Satisfacao', 'Nível de satisfação', 'Client', 'Satisfaction', 10, 5, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Process Types
INSERT INTO process_types (name, description, sort_order) VALUES
  ('Aprovação', 'Processo de due diligence e aprovação de fornecedores ou clientes', 1),
  ('Avaliação', 'Avaliação de performance ou satisfação de entidades existentes', 2),
  ('Reavaliação', 'Reavaliação periódica de fornecedores ou clientes', 3)
ON CONFLICT (name) DO NOTHING;

-- Default 360 evaluation form
INSERT INTO collaboration_forms (title, description, form_type, entity_type, created_by) VALUES
  ('Avaliação 360° - Know You Work', 'Formulário padrão para avaliação 360° de colaboradores (autoavaliação, avaliação de pares e avaliação da empresa)', '360', 'Employee', 1)
ON CONFLICT DO NOTHING;

-- Default 360 questions
INSERT INTO collaboration_questions (form_id, question_text, question_type, options, weight, is_required, display_order)
SELECT 
  cf.id,
  q.question_text,
  q.question_type,
  q.options,
  q.weight,
  q.is_required,
  q.display_order
FROM collaboration_forms cf
CROSS JOIN (VALUES
  ('Comunicação e colaboração', 'rating', NULL, 2.0, TRUE, 1),
  ('Responsabilidade', 'rating', NULL, 2.0, TRUE, 2),
  ('Qualidade do trabalho', 'rating', NULL, 2.0, TRUE, 3),
  ('Iniciativa e proatividade', 'rating', NULL, 2.0, TRUE, 4),
  ('Adaptabilidade', 'rating', NULL, 1.5, TRUE, 5),
  ('Liderança (se aplicável)', 'rating', NULL, 1.5, FALSE, 6),
  ('Pontos fortes', 'text', NULL, 0, FALSE, 7),
  ('Áreas de melhoria', 'text', NULL, 0, FALSE, 8),
  ('Sugestões', 'text', NULL, 0, FALSE, 9)
) AS q(question_text, question_type, options, weight, is_required, display_order)
WHERE cf.form_type = '360'
ON CONFLICT DO NOTHING;

COMMIT;
