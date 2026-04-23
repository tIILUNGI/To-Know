import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbInit, dbQuery, dbGet, dbRun, dbExec, dbTransaction } from "../src/lib/db";

// Initialize DB on cold start
await dbInit();

const SECRET_KEY = process.env.JWT_SECRET || "toknow-secret-key";

// ============================================================
// HELPERS
// ============================================================
const validateRequired = (body: any, fields: string[]): string | null => {
  const missing = fields.filter(f => body[f] === undefined || body[f] === null || body[f] === "");
  return missing.length > 0 ? `Campos obrigatórios em falta: ${missing.join(", ")}` : null;
};

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

const logAction = async (userId: number | null, entityId: number | null, action: string, details: string) => {
  await dbRun(
    "INSERT INTO history (user_id, entity_id, action, details) VALUES (?, ?, ?, ?)",
    [userId, entityId, action, details]
  );
};

// ============================================================
// AUTH MIDDLEWARE
// ============================================================
const authenticateToken = async (req: VercelRequest, res: VercelResponse, next: () => void) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1] || parts[1] === "null" || parts[1] === "undefined") {
    return res.sendStatus(401);
  }
  try {
    const user = jwt.verify(parts[1], SECRET_KEY) as any;
    (req as any).user = user;
    next();
  } catch {
    return res.sendStatus(403);
  }
};

const requireRole = (...roles: string[]) => async (req: VercelRequest, res: VercelResponse, next: () => void) => {
  const user = (req as any).user;
  if (!user || !roles.includes(user.role)) {
    return res.status(403).json({ message: "Permissão insuficiente para esta ação." });
  }
  next();
};

// ============================================================
// AUTH ROUTES
// ============================================================
async function handleLogin(req: VercelRequest, res: VercelResponse) {
  const error = validateRequired(req.body, ["username", "password"]);
  if (error) return res.status(400).json({ message: error });

  const { username, password } = req.body;
  const user = await dbGet("SELECT * FROM users WHERE username = ?", [username]);

  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: "8h" });
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  } else {
    res.status(401).json({ message: "Credenciais inválidas" });
  }
}

async function handleMe(req: VercelRequest, res: VercelResponse) {
  const user = await dbGet("SELECT id, username, name, role, email FROM users WHERE id = ?", [(req as any).user.id]);
  res.json(user);
}

async function handleChangePassword(req: VercelRequest, res: VercelResponse) {
  const error = validateRequired(req.body, ["currentPassword", "newPassword"]);
  if (error) return res.status(400).json({ message: error });

  const { currentPassword, newPassword } = req.body;
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "A nova senha deve ter pelo menos 6 caracteres." });
  }

  const user = await dbGet("SELECT * FROM users WHERE id = ?", [(req as any).user.id]);
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(401).json({ message: "Senha atual incorreta." });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await dbRun("UPDATE users SET password = ? WHERE id = ?", [hash, (req as any).user.id]);
  res.json({ message: "Senha alterada com sucesso." });
}

async function handleUpdateProfile(req: VercelRequest, res: VercelResponse) {
  const { name, email } = req.body;
  await dbRun(
    "UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?",
    [name, email, (req as any).user.id]
  );
  res.json({ message: "Perfil atualizado com sucesso." });
}

// ============================================================
// USER MANAGEMENT
// ============================================================
async function handleGetUsers(req: VercelRequest, res: VercelResponse) {
  const users = await dbQuery("SELECT id, username, name, role, email, created_at FROM users ORDER BY id");
  res.json(users.rows);
}

async function handleCreateUser(req: VercelRequest, res: VercelResponse) {
  const error = validateRequired(req.body, ["username", "password", "name", "role"]);
  if (error) return res.status(400).json({ message: error });

  const { username, password, name, role, email } = req.body;
  const existing = await dbGet("SELECT id FROM users WHERE username = ?", [username]);
  if (existing) return res.status(409).json({ message: "Utilizador já existe." });

  const hash = await bcrypt.hash(password, 10);
  const result = await dbRun("INSERT INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?, ?)", [username, hash, name, role, email || null]);

  await logAction((req as any).user.id, null, "CREATE_USER", `Created user: ${username}`);
  res.status(201).json({ id: result.lastInsertRowid });
}

async function handleGetUser(req: VercelRequest, res: VercelResponse) {
  const user = await dbGet("SELECT id, username, name, role, email FROM users WHERE id = ?", [req.params.id]);
  if (!user) return res.status(404).json({ message: "Utilizador não encontrado." });
  res.json(user);
}

async function handleUpdateUser(req: VercelRequest, res: VercelResponse) {
  const { name, role, email, password } = req.body;

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    await dbRun(
      "UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), email = COALESCE(?, email), password = ? WHERE id = ?",
      [name, role, email, hash, req.params.id]
    );
  } else {
    await dbRun(
      "UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), email = COALESCE(?, email) WHERE id = ?",
      [name, role, email, req.params.id]
    );
  }
  await logAction((req as any).user.id, null, "UPDATE_USER", `Updated user ID: ${req.params.id}`);
  res.json({ message: "Utilizador atualizado." });
}

async function handleDeleteUser(req: VercelRequest, res: VercelResponse) {
  if (Number(req.params.id) === (req as any).user.id) {
    return res.status(400).json({ message: "Não pode eliminar a sua própria conta." });
  }
  await dbRun("DELETE FROM notifications WHERE user_id = ?", [req.params.id]);
  await dbRun("DELETE FROM users WHERE id = ?", [req.params.id]);
  await logAction((req as any).user.id, null, "DELETE_USER", `Deleted user ID: ${req.params.id}`);
  res.json({ message: "Utilizador eliminado." });
}

// ============================================================
// EMPLOYEES
// ============================================================
async function handleGetEmployees(req: VercelRequest, res: VercelResponse) {
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

    const employees = await dbQuery(query, params);
    res.json(employees.rows);
  } catch (err: any) {
    console.error("Get employees error:", err.message);
    res.status(500).json({ error: "Erro ao carregar colaboradores.", message: err.message });
  }
}

async function handleGetEmployee(req: VercelRequest, res: VercelResponse) {
  try {
    const employee = await dbGet(`
      SELECT e.*, u.username, u.email as user_email
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.id = ?
    `, [req.params.id]);
    if (!employee) return res.status(404).json({ message: "Funcionário não encontrado." });
    res.json(employee);
  } catch (err: any) {
    console.error("Get employee error:", err.message);
    res.status(500).json({ error: "Erro ao carregar colaborador.", message: err.message });
  }
}

async function handleCreateEmployee(req: VercelRequest, res: VercelResponse) {
  try {
    const error = validateRequired(req.body, ["name"]);
    if (error) return res.status(400).json({ message: error });

    const { name, email, position, department, hire_date, user_id, status } = req.body;
    const result = await dbRun(`
      INSERT INTO employees (name, email, position, department, hire_date, user_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name || null, email || null, position || null, department || null, hire_date || null, user_id ? Number(user_id) : null, status || "Ativo"]);

    await logAction((req as any).user.id, result.lastInsertRowid, "CREATE_EMPLOYEE", `Created employee: ${name}`);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err: any) {
    console.error("Create employee error:", err.message);
    res.status(500).json({ error: "Erro ao criar colaborador.", message: err.message });
  }
}

async function handleUpdateEmployee(req: VercelRequest, res: VercelResponse) {
  try {
    const { name, email, position, department, hire_date, user_id, status } = req.body;

    await dbRun(`
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
    `, [name, email, position, department, hire_date, user_id ? Number(user_id) : null, status, req.params.id]);

    await logAction((req as any).user.id, Number(req.params.id), "UPDATE_EMPLOYEE", `Updated employee ID: ${req.params.id}`);
    res.json({ message: "Funcionário actualizado." });
  } catch (err: any) {
    console.error("Update employee error:", err.message);
    res.status(500).json({ error: "Erro ao actualizar colaborador.", message: err.message });
  }
}

async function handleDeleteEmployee(req: VercelRequest, res: VercelResponse) {
  try {
    const emp = await dbGet("SELECT name FROM employees WHERE id = ?", [req.params.id]);
    if (!emp) return res.status(404).json({ message: "Funcionário não encontrado." });

    await dbRun("DELETE FROM employees WHERE id = ?", [req.params.id]);
    await logAction((req as any).user.id, null, "DELETE_EMPLOYEE", `Deleted employee: ${emp.name}`);
    res.json({ message: "Funcionário eliminado." });
  } catch (err: any) {
    console.error("Delete employee error:", err.message);
    res.status(500).json({ error: "Erro ao eliminar colaborador.", message: err.message });
  }
}

// ============================================================
// ENTITIES
// ============================================================
async function handleGetEntities(req: VercelRequest, res: VercelResponse) {
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
  const entities = await dbQuery(query, params);
  res.json(entities.rows);
}

async function handleGetEntity(req: VercelRequest, res: VercelResponse) {
  const entity = await dbGet("SELECT * FROM entities WHERE id = ?", [req.params.id]);
  if (!entity) return res.status(404).json({ message: "Entidade não encontrada" });

  const documents = await dbQuery("SELECT * FROM documents WHERE entity_id = ?", [req.params.id]);
  res.json({ ...entity, documents: documents.rows });
}

async function handleGetEntityHistory(req: VercelRequest, res: VercelResponse) {
  const entity = await dbGet("SELECT * FROM entities WHERE id = ?", [req.params.id]);
  if (!entity) return res.status(404).json({ message: "Entidade não encontrada" });

  const auditHistory = await dbQuery(`
    SELECT h.*, u.name as user_name, u.role as user_role
    FROM history h
    LEFT JOIN users u ON h.user_id = u.id
    WHERE h.entity_id = ?
    ORDER BY h.timestamp DESC
  `, [req.params.id]);

  const processes = await dbQuery(`
    SELECT p.*, u.name as opener_name, approver.name as approver_name
    FROM processes p
    LEFT JOIN users u ON p.opener_id = u.id
    LEFT JOIN users approver ON p.approver_id = approver.id
    WHERE p.entity_id = ?
    ORDER BY p.created_at DESC
  `, [req.params.id]);

  const evaluations = await dbQuery(`
    SELECT ev.*, u.name as evaluator_name
    FROM evaluations ev
    LEFT JOIN users u ON ev.evaluator_id = u.id
    WHERE ev.entity_id = ?
    ORDER BY ev.evaluation_date DESC
  `, [req.params.id]);

  const documents = await dbQuery("SELECT * FROM documents WHERE entity_id = ?", [req.params.id]);

  res.json({
    entity,
    audit_history: auditHistory.rows,
    processes: processes.rows,
    evaluations: evaluations.rows,
    documents: documents.rows
  });
}

async function handleCreateEntity(req: VercelRequest, res: VercelResponse) {
  const error = validateRequired(req.body, ["name", "entity_type"]);
  if (error) return res.status(400).json({ message: error });

  const entityData = req.body;
  const columns = Object.keys(entityData).filter(key => ENTITY_SAFE_COLUMNS.has(key));
  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT INTO entities (${columns.join(", ")}) VALUES (${placeholders})`;
  const values = columns.map(key => entityData[key]);

  const result = await dbRun(sql, values);
  await logAction((req as any).user.id, Number(result.lastInsertRowid), "CREATE", `Created entity: ${entityData.name}`);
  res.status(201).json({ id: result.lastInsertRowid });
}

async function handleUpdateEntity(req: VercelRequest, res: VercelResponse) {
  const entityData = req.body;
  const columns = Object.keys(entityData).filter(key => ENTITY_SAFE_COLUMNS.has(key));

  if (columns.length === 0) return res.status(400).json({ message: "Nenhum campo válido para atualizar." });

  const setClause = columns.map(col => `${col} = ?`).join(", ");
  const sql = `UPDATE entities SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  const values = [...columns.map(key => entityData[key]), req.params.id];

  await dbRun(sql, values);
  await logAction((req as any).user.id, Number(req.params.id), "UPDATE", `Updated entity fields: ${columns.join(", ")}`);
  res.json({ message: "Entidade atualizada com sucesso" });
}

async function handleDeleteEntity(req: VercelRequest, res: VercelResponse) {
  const entityId = req.params.id;
  const entity = await dbGet("SELECT name FROM entities WHERE id = ?", [entityId]);
  if (!entity) return res.status(404).json({ message: "Entidade não encontrada." });

  // Cascade deletes (file cleanup skipped on serverless - no persistent disk)
  await dbRun("DELETE FROM documents WHERE entity_id = ?", [entityId]);
  await dbRun("DELETE FROM evaluation_responses WHERE evaluation_id IN (SELECT id FROM evaluations WHERE entity_id = ?)", [entityId]);
  await dbRun("DELETE FROM evaluations WHERE entity_id = ?", [entityId]);
  await dbRun("DELETE FROM process_criteria WHERE process_id IN (SELECT id FROM processes WHERE entity_id = ?)", [entityId]);
  await dbRun("DELETE FROM processes WHERE entity_id = ?", [entityId]);
  await dbRun("DELETE FROM history WHERE entity_id = ?", [entityId]);
  await dbRun("DELETE FROM entities WHERE id = ?", [entityId]);

  await logAction((req as any).user.id, null, "DELETE", `Deleted entity: ${entity.name} (ID: ${entityId})`);
  res.json({ message: "Entidade eliminada com sucesso." });
}

// ============================================================
// GLOBAL SEARCH
// ============================================================
async function handleSearch(req: VercelRequest, res: VercelResponse) {
  const q = req.query.q as string;
  if (!q || q.length < 2) return res.json({ entities: [], processes: [] });

  const term = `%${q}%`;
  const [entities, processes] = await Promise.all([
    dbQuery("SELECT id, name, entity_type, code, status FROM entities WHERE name LIKE ? OR code LIKE ? OR tax_id LIKE ? LIMIT 10", [term, term, term]),
    dbQuery("SELECT id, process_number, type, status FROM processes WHERE process_number LIKE ? LIMIT 5", [term])
  ]);

  res.json({ entities: entities.rows, processes: processes.rows });
}

// ============================================================
// DEBUG ROUTES
// ============================================================
async function handleDebugTest(req: VercelRequest, res: VercelResponse) {
  res.json({ ok: true, msg: "Debug funciona" });
}

// ============================================================
// MAIN EXPORT - Vercel Serverless Function
// ============================================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers are handled by vercel.json
  // Preflight handled by Vercel's rewrites, but keep for safety
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  const path = req.url?.split("?")[0] || "";

  // ROUTING
  try {
    // Auth routes
    if (req.method === "POST" && path === "/api/auth/login") {
      return await handleLogin(req, res);
    }
    if (req.method === "GET" && path === "/api/auth/me") {
      return await (async () => { await authenticateToken(req, res, async () => { await handleMe(req, res); }); })();
    }
    if (req.method === "PUT" && path === "/api/auth/password") {
      return await (async () => { await authenticateToken(req, res, async () => { await handleChangePassword(req, res); }); })();
    }
    if (req.method === "PUT" && path === "/api/auth/me") {
      return await (async () => { await authenticateToken(req, res, async () => { await handleUpdateProfile(req, res); }); })();
    }

    // User management (Admin only)
    if (path === "/api/users") {
      if (req.method === "GET") {
        return await (async () => {
          await authenticateToken(req, res, async () => {
            await requireRole("Administrator")(req, res, async () => { await handleGetUsers(req, res); });
          });
        })();
      }
      if (req.method === "POST") {
        return await (async () => {
          await authenticateToken(req, res, async () => {
            await requireRole("Administrator")(req, res, async () => { await handleCreateUser(req, res); });
          });
        })();
      }
    }
    if (req.method === "GET" && path?.startsWith("/api/users/") && !path.includes("/")?.split("/")[3]) {
      const id = path.split("/")[3];
      return await (async () => {
        await authenticateToken(req, res, async () => {
          await requireRole("Administrator")(req, res, async () => { await handleGetUser(req, res); });
        });
      })();
    }
    if (req.method === "PUT" && path?.startsWith("/api/users/")) {
      const id = path.split("/")[3];
      return await (async () => {
        await authenticateToken(req, res, async () => {
          await requireRole("Administrator")(req, res, async () => { await handleUpdateUser(req, res); });
        });
      })();
    }
    if (req.method === "DELETE" && path?.startsWith("/api/users/")) {
      const id = path.split("/")[3];
      return await (async () => {
        await authenticateToken(req, res, async () => {
          await requireRole("Administrator")(req, res, async () => { await handleDeleteUser(req, res); });
        });
      })();
    }

    // Employees
    if (path === "/api/employees") {
      if (req.method === "GET") {
        return await (async () => { await authenticateToken(req, res, async () => { await handleGetEmployees(req, res); }); })();
      }
      if (req.method === "POST") {
        return await (async () => { await authenticateToken(req, res, async () => { await requireRole("Administrator", "Compliance Manager")(req, res, async () => { await handleCreateEmployee(req, res); }); }); })();
      }
    }
    if (req.method === "GET" && path?.startsWith("/api/employees/") && !path.split("/")[3]) {
      return await (async () => { await authenticateToken(req, res, async () => { await handleGetEmployee(req, res); }); })();
    }
    if (req.method === "PUT" && path?.startsWith("/api/employees/")) {
      return await (async () => { await authenticateToken(req, res, async () => { await requireRole("Administrator", "Compliance Manager")(req, res, async () => { await handleUpdateEmployee(req, res); }); }); })();
    }
    if (req.method === "DELETE" && path?.startsWith("/api/employees/")) {
      return await (async () => { await authenticateToken(req, res, async () => { await requireRole("Administrator")(req, res, async () => { await handleDeleteEmployee(req, res); }); }); })();
    }

    // Entities
    if (path === "/api/entities") {
      if (req.method === "GET") {
        return await (async () => { await authenticateToken(req, res, async () => { await handleGetEntities(req, res); }); })();
      }
      if (req.method === "POST") {
        return await (async () => { await authenticateToken(req, res, async () => { await handleCreateEntity(req, res); }); })();
      }
    }
    if (req.method === "GET" && path?.startsWith("/api/entities/") && !path.split("/")[3]?.includes("/")) {
      const id = path.split("/")[3];
      if (path.endsWith("/history")) {
        return await (async () => { await authenticateToken(req, res, async () => { await handleGetEntityHistory(req, res); }); })();
      }
      return await (async () => { await authenticateToken(req, res, async () => { await handleGetEntity(req, res); }); })();
    }
    if (req.method === "PUT" && path?.startsWith("/api/entities/") && !path.split("/")[3]?.includes("/")) {
      return await (async () => { await authenticateToken(req, res, async () => { await handleUpdateEntity(req, res); }); })();
    }
    if (req.method === "DELETE" && path?.startsWith("/api/entities/")) {
      return await (async () => { await authenticateToken(req, res, async () => { await handleDeleteEntity(req, res); }); })();
    }

    // Search
    if (req.method === "GET" && path === "/api/search") {
      return await (async () => { await authenticateToken(req, res, async () => { await handleSearch(req, res); }); })();
    }

    // Debug
    if (req.method === "GET" && path === "/debug/test") {
      return await handleDebugTest(req, res);
    }

    // Not found
    res.status(404).json({ error: "Not found" });
  } catch (err: any) {
    console.error("API Error:", err.message, err.stack);
    res.status(500).json({ error: "Internal server error", message: err.message });
  }
}
