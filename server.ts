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
  "registration_number", "status", "sector", "supply_type", "category",
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
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

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

app.put("/api/users/:id", authenticateToken, requireRole("Administrator"), (req: any, res: any) => {
  const { name, role, email } = req.body;
  db.prepare("UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), email = COALESCE(?, email) WHERE id = ?").run(name, role, email, req.params.id);
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
app.get("/api/entities/:id/history", authenticateToken, (req, res) => {
  const history = db.prepare(`
    SELECT h.*, u.name as user_name 
    FROM history h 
    LEFT JOIN users u ON h.user_id = u.id 
    WHERE h.entity_id = ? 
    ORDER BY h.timestamp DESC
  `).all(req.params.id);
  res.json(history);
});

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
  const { entity_type, process_type, evaluation_type } = req.query;
  let query = "SELECT * FROM criteria WHERE is_active = 1";
  const params: any[] = [];

  if (entity_type) { query += " AND (entity_type = ? OR entity_type IS NULL)"; params.push(entity_type); }
  if (process_type) { query += " AND process_type = ?"; params.push(process_type); }
  if (evaluation_type) { query += " AND evaluation_type = ?"; params.push(evaluation_type); }

  query += " ORDER BY display_order ASC";
  const criteria = db.prepare(query).all(...params);
  res.json(criteria);
});

app.post("/api/criteria", authenticateToken, requireRole("Administrator"), (req: any, res: any) => {
  const error = validateRequired(req.body, ["code", "name", "process_type"]);
  if (error) return res.status(400).json({ message: error });

  const { code, name, description, entity_type, process_type, evaluation_type, weight, max_score, is_required, display_order } = req.body;
  const existing = db.prepare("SELECT id FROM criteria WHERE code = ?").get(code);
  if (existing) return res.status(409).json({ message: "Código de critério já existe." });

  const result = db.prepare(`
    INSERT INTO criteria (code, name, description, entity_type, process_type, evaluation_type, weight, max_score, is_required, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(code, name, description || null, entity_type || null, process_type, evaluation_type || null, weight || 1, max_score || 10, is_required ?? 1, display_order || 99);

  logAction(req.user.id, null, "CREATE_CRITERIA", `Created criteria: ${name}`);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put("/api/criteria/:id", authenticateToken, requireRole("Administrator"), (req: any, res: any) => {
  const { name, description, weight, max_score, is_required, is_active, display_order } = req.body;
  db.prepare(`
    UPDATE criteria SET 
      name = COALESCE(?, name), 
      description = COALESCE(?, description), 
      weight = COALESCE(?, weight), 
      max_score = COALESCE(?, max_score), 
      is_required = COALESCE(?, is_required), 
      is_active = COALESCE(?, is_active),
      display_order = COALESCE(?, display_order)
    WHERE id = ?
  `).run(name, description, weight, max_score, is_required, is_active, display_order, req.params.id);

  logAction(req.user.id, null, "UPDATE_CRITERIA", `Updated criteria ID: ${req.params.id}`);
  res.json({ message: "Critério atualizado." });
});

app.delete("/api/criteria/:id", authenticateToken, requireRole("Administrator"), (req: any, res: any) => {
  db.prepare("UPDATE criteria SET is_active = 0 WHERE id = ?").run(req.params.id);
  logAction(req.user.id, null, "DELETE_CRITERIA", `Deactivated criteria ID: ${req.params.id}`);
  res.json({ message: "Critério desativado." });
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

  const { entity_id, type, priority, area, justification } = req.body;
  const process_number = `PROC-${Date.now()}`;

  const result = db.prepare(`
    INSERT INTO processes (process_number, entity_id, type, status, priority, area, justification, opener_id) 
    VALUES (?, ?, ?, 'Rascunho', ?, ?, ?, ?)
  `).run(process_number, entity_id, type, priority || "Normal", area, justification, req.user.id);

  const processId = result.lastInsertRowid;

  // Auto-populate criteria
  const entity = db.prepare("SELECT entity_type FROM entities WHERE id = ?").get(entity_id) as any;
  if (entity) {
    const criteria = db.prepare("SELECT id FROM criteria WHERE (entity_type = ? OR entity_type IS NULL) AND process_type = ? AND is_active = 1").all(entity.entity_type, type);
    const insertPC = db.prepare("INSERT INTO process_criteria (process_id, criteria_id) VALUES (?, ?)");
    for (const c of criteria as any[]) {
      insertPC.run(processId, c.id);
    }
  }

  logAction(req.user.id, entity_id, "CREATE_PROCESS", `Created process: ${process_number}`);
  res.status(201).json({ id: processId, process_number });
});

app.get("/api/processes/:id", authenticateToken, (req, res) => {
  const process = db.prepare(`
    SELECT p.*, e.name as entity_name, u.name as opener_name
    FROM processes p 
    JOIN entities e ON p.entity_id = e.id 
    LEFT JOIN users u ON p.opener_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!process) return res.status(404).json({ message: "Processo não encontrado" });

  const criteria = db.prepare(`
    SELECT pc.*, c.name, c.description, c.weight, c.max_score 
    FROM process_criteria pc 
    JOIN criteria c ON pc.criteria_id = c.id 
    WHERE pc.process_id = ?
  `).all(req.params.id);

  res.json({ ...process, criteria });
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

  const { entity_id, type, evaluation_type, periodicity, period, product_service, unit, responses, action_plan, action_plan_deadline, action_plan_responsible, previous_evaluation_id } = req.body;

  const result = db.prepare(`
    INSERT INTO evaluations (entity_id, type, evaluation_type, periodicity, period, product_service, unit, evaluator_id, action_plan, action_plan_deadline, action_plan_responsible, previous_evaluation_id, evaluation_date) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)
  `).run(entity_id, type, evaluation_type || "Nova", periodicity || "Anual", period, product_service, unit, req.user.id, action_plan || null, action_plan_deadline || null, action_plan_responsible || null, previous_evaluation_id || null);

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

  const stats = {
    totals: {
      suppliers: db.prepare(`SELECT COUNT(*) as count FROM entities WHERE entity_type = 'Supplier'${dateFilter}`).get(),
      clients: db.prepare(`SELECT COUNT(*) as count FROM entities WHERE entity_type = 'Client'${dateFilter}`).get(),
      processes_pending: db.prepare(`SELECT COUNT(*) as count FROM processes p JOIN entities e ON p.entity_id = e.id WHERE p.status IN ('Em análise', 'Em aprovação', 'Submetido')${dateFilter}${entityFilter.includes('Supplier') ? entityFilter : ''}${entityFilter.includes('Client') ? entityFilter : ''}`).get(),
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
// SERVER START
// ============================================================
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

startServer();
