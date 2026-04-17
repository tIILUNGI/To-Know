"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var vite_1 = require("vite");
var better_sqlite3_1 = require("better-sqlite3");
var dotenv_1 = require("dotenv");
var jsonwebtoken_1 = require("jsonwebtoken");
var bcryptjs_1 = require("bcryptjs");
var multer_1 = require("multer");
var fs_1 = require("fs");
var path_1 = require("path");
var url_1 = require("url");
dotenv_1.default.config();
var app = (0, express_1.default)();
var PORT = 3000;
var db = new better_sqlite3_1.default("toknow.db");
var SECRET_KEY = process.env.JWT_SECRET || "toknow-secret-key";
app.use(express_1.default.json());
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
// ============================================================
// MIDDLEWARE: CORS
// ============================================================
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS")
        return res.sendStatus(200);
    next();
});
// ============================================================
// MIDDLEWARE: Rate Limiting (in-memory)
// ============================================================
var rateLimitStore = new Map();
var rateLimit = function (maxRequests, windowMs) { return function (req, res, next) {
    var _a;
    var key = req.ip || ((_a = req.connection) === null || _a === void 0 ? void 0 : _a.remoteAddress) || "unknown";
    var now = Date.now();
    var entry = rateLimitStore.get(key);
    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
        return next();
    }
    if (entry.count >= maxRequests) {
        return res.status(429).json({ message: "Demasiadas tentativas. Tente novamente mais tarde." });
    }
    entry.count++;
    next();
}; };
// Cleanup stale entries every 60s
setInterval(function () {
    var now = Date.now();
    for (var _i = 0, _a = rateLimitStore.entries(); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], val = _b[1];
        if (now > val.resetTime)
            rateLimitStore.delete(key);
    }
}, 60000);
// ============================================================
// HELPERS
// ============================================================
var validateRequired = function (body, fields) {
    var missing = fields.filter(function (f) { return body[f] === undefined || body[f] === null || body[f] === ""; });
    return missing.length > 0 ? "Campos obrigat\u00F3rios em falta: ".concat(missing.join(", ")) : null;
};
// Whitelist of valid entity columns to prevent SQL injection via dynamic column names
var ENTITY_SAFE_COLUMNS = new Set([
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
var paginate = function (req) {
    var page = Math.max(1, parseInt(req.query.page) || 1);
    var limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    var offset = (page - 1) * limit;
    return { page: page, limit: limit, offset: offset };
};
// ============================================================
// MIDDLEWARE: Auth
// ============================================================
var authenticateToken = function (req, res, next) {
    var authHeader = req.headers["authorization"];
    var token = authHeader && authHeader.split(" ")[1];
    if (!token)
        return res.sendStatus(401);
    jsonwebtoken_1.default.verify(token, SECRET_KEY, function (err, user) {
        if (err)
            return res.sendStatus(403);
        req.user = user;
        next();
    });
};
// ============================================================
// MIDDLEWARE: RBAC
// ============================================================
var requireRole = function () {
    var roles = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        roles[_i] = arguments[_i];
    }
    return function (req, res, next) {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Permissão insuficiente para esta ação." });
        }
        next();
    };
};
// ============================================================
// Audit Logging
// ============================================================
var logAction = function (userId, entityId, action, details) {
    db.prepare("INSERT INTO history (user_id, entity_id, action, details) VALUES (?, ?, ?, ?)").run(userId, entityId, action, details);
};
// ============================================================
// AUTH ROUTES
// ============================================================
app.post("/api/auth/login", rateLimit(10, 15 * 60 * 1000), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error, _a, username, password, user, _b, token;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                error = validateRequired(req.body, ["username", "password"]);
                if (error)
                    return [2 /*return*/, res.status(400).json({ message: error })];
                _a = req.body, username = _a.username, password = _a.password;
                user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
                _b = user;
                if (!_b) return [3 /*break*/, 2];
                return [4 /*yield*/, bcryptjs_1.default.compare(password, user.password)];
            case 1:
                _b = (_c.sent());
                _c.label = 2;
            case 2:
                if (_b) {
                    token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: "8h" });
                    checkExpiringApprovals();
                    res.json({ token: token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
                }
                else {
                    res.status(401).json({ message: "Credenciais inválidas" });
                }
                return [2 /*return*/];
        }
    });
}); });
app.get("/api/auth/me", authenticateToken, function (req, res) {
    var user = db.prepare("SELECT id, username, name, role, email FROM users WHERE id = ?").get(req.user.id);
    res.json(user);
});
app.put("/api/auth/password", authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error, _a, currentPassword, newPassword, user, _b, salt, hash;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                error = validateRequired(req.body, ["currentPassword", "newPassword"]);
                if (error)
                    return [2 /*return*/, res.status(400).json({ message: error })];
                _a = req.body, currentPassword = _a.currentPassword, newPassword = _a.newPassword;
                if (newPassword.length < 6) {
                    return [2 /*return*/, res.status(400).json({ message: "A nova senha deve ter pelo menos 6 caracteres." })];
                }
                user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
                _b = !user;
                if (_b) return [3 /*break*/, 2];
                return [4 /*yield*/, bcryptjs_1.default.compare(currentPassword, user.password)];
            case 1:
                _b = !(_c.sent());
                _c.label = 2;
            case 2:
                if (_b) {
                    return [2 /*return*/, res.status(401).json({ message: "Senha atual incorreta." })];
                }
                salt = bcryptjs_1.default.genSaltSync(10);
                hash = bcryptjs_1.default.hashSync(newPassword, salt);
                db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hash, req.user.id);
                res.json({ message: "Senha alterada com sucesso." });
                return [2 /*return*/];
        }
    });
}); });
app.put("/api/auth/me", authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name, email;
    return __generator(this, function (_b) {
        _a = req.body, name = _a.name, email = _a.email;
        db.prepare("UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?").run(name, email, req.user.id);
        res.json({ message: "Perfil atualizado com sucesso." });
        return [2 /*return*/];
    });
}); });
// ============================================================
// USER MANAGEMENT (Admin only)
// ============================================================
app.get("/api/users", authenticateToken, requireRole("Administrator"), function (req, res) {
    var users = db.prepare("SELECT id, username, name, role, email, created_at FROM users ORDER BY id").all();
    res.json(users);
});
app.post("/api/users", authenticateToken, requireRole("Administrator"), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error, _a, username, password, name, role, email, existing, salt, hash, result;
    return __generator(this, function (_b) {
        error = validateRequired(req.body, ["username", "password", "name", "role"]);
        if (error)
            return [2 /*return*/, res.status(400).json({ message: error })];
        _a = req.body, username = _a.username, password = _a.password, name = _a.name, role = _a.role, email = _a.email;
        existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
        if (existing)
            return [2 /*return*/, res.status(409).json({ message: "Utilizador já existe." })];
        salt = bcryptjs_1.default.genSaltSync(10);
        hash = bcryptjs_1.default.hashSync(password, salt);
        result = db.prepare("INSERT INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?, ?)").run(username, hash, name, role, email || null);
        logAction(req.user.id, null, "CREATE_USER", "Created user: ".concat(username));
        res.status(201).json({ id: result.lastInsertRowid });
        return [2 /*return*/];
    });
}); });
app.put("/api/users/:id", authenticateToken, requireRole("Administrator"), function (req, res) {
    var _a = req.body, name = _a.name, role = _a.role, email = _a.email;
    db.prepare("UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), email = COALESCE(?, email) WHERE id = ?").run(name, role, email, req.params.id);
    logAction(req.user.id, null, "UPDATE_USER", "Updated user ID: ".concat(req.params.id));
    res.json({ message: "Utilizador atualizado." });
});
app.delete("/api/users/:id", authenticateToken, requireRole("Administrator"), function (req, res) {
    if (Number(req.params.id) === req.user.id) {
        return res.status(400).json({ message: "Não pode eliminar a sua própria conta." });
    }
    db.prepare("DELETE FROM notifications WHERE user_id = ?").run(req.params.id);
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    logAction(req.user.id, null, "DELETE_USER", "Deleted user ID: ".concat(req.params.id));
    res.json({ message: "Utilizador eliminado." });
});
// ============================================================
// GLOBAL SEARCH
// ============================================================
app.get("/api/search", authenticateToken, function (req, res) {
    var q = req.query.q;
    if (!q || q.length < 2)
        return res.json({ entities: [], processes: [] });
    var term = "%".concat(q, "%");
    var entities = db.prepare("SELECT id, name, entity_type, code, status FROM entities WHERE name LIKE ? OR code LIKE ? OR tax_id LIKE ? LIMIT 10").all(term, term, term);
    var processes = db.prepare("SELECT id, process_number, type, status FROM processes WHERE process_number LIKE ? LIMIT 5").all(term);
    res.json({ entities: entities, processes: processes });
});
// ============================================================
// ENTITIES CRUD
// ============================================================
app.get("/api/entities", authenticateToken, function (req, res) {
    var _a;
    var _b = req.query, type = _b.type, status = _b.status;
    var query = "SELECT * FROM entities";
    var params = [];
    if (type || status) {
        query += " WHERE";
        if (type) {
            query += " entity_type = ?";
            params.push(type);
        }
        if (status) {
            if (type)
                query += " AND";
            query += " status = ?";
            params.push(status);
        }
    }
    query += " ORDER BY created_at DESC";
    var entities = (_a = db.prepare(query)).all.apply(_a, params);
    res.json(entities);
});
app.get("/api/entities/:id", authenticateToken, function (req, res) {
    var entity = db.prepare("SELECT * FROM entities WHERE id = ?").get(req.params.id);
    if (!entity)
        return res.status(404).json({ message: "Entidade não encontrada" });
    var documents = db.prepare("SELECT * FROM documents WHERE entity_id = ?").all(req.params.id);
    res.json(__assign(__assign({}, entity), { documents: documents }));
});
app.post("/api/entities", authenticateToken, function (req, res) {
    var _a;
    var error = validateRequired(req.body, ["name", "entity_type"]);
    if (error)
        return res.status(400).json({ message: error });
    var entityData = req.body;
    // Only allow safe columns
    var columns = Object.keys(entityData).filter(function (key) {
        return ENTITY_SAFE_COLUMNS.has(key);
    });
    var placeholders = columns.map(function () { return "?"; }).join(", ");
    var sql = "INSERT INTO entities (".concat(columns.join(", "), ") VALUES (").concat(placeholders, ")");
    var values = columns.map(function (key) { return entityData[key]; });
    var result = (_a = db.prepare(sql)).run.apply(_a, values);
    var entityId = result.lastInsertRowid;
    logAction(req.user.id, Number(entityId), "CREATE", "Created entity: ".concat(entityData.name));
    res.status(201).json({ id: entityId });
});
app.put("/api/entities/:id", authenticateToken, function (req, res) {
    var _a;
    var entityId = req.params.id;
    var entityData = req.body;
    // Only allow safe columns
    var columns = Object.keys(entityData).filter(function (key) {
        return ENTITY_SAFE_COLUMNS.has(key);
    });
    if (columns.length === 0)
        return res.status(400).json({ message: "Nenhum campo válido para atualizar." });
    var setClause = columns.map(function (col) { return "".concat(col, " = ?"); }).join(", ");
    var sql = "UPDATE entities SET ".concat(setClause, ", updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    var values = __spreadArray(__spreadArray([], columns.map(function (key) { return entityData[key]; }), true), [entityId], false);
    (_a = db.prepare(sql)).run.apply(_a, values);
    logAction(req.user.id, Number(entityId), "UPDATE", "Updated entity fields: ".concat(columns.join(", ")));
    res.json({ message: "Entidade atualizada com sucesso" });
});
app.delete("/api/entities/:id", authenticateToken, function (req, res) {
    var entityId = req.params.id;
    var entity = db.prepare("SELECT name FROM entities WHERE id = ?").get(entityId);
    if (!entity)
        return res.status(404).json({ message: "Entidade não encontrada." });
    // Delete related documents from disk
    var docs = db.prepare("SELECT url FROM documents WHERE entity_id = ?").all(entityId);
    for (var _i = 0, docs_1 = docs; _i < docs_1.length; _i++) {
        var doc = docs_1[_i];
        var filePath = path_1.default.join(__dirname, doc.url);
        if (fs_1.default.existsSync(filePath))
            fs_1.default.unlinkSync(filePath);
    }
    // Cascade deletes
    db.prepare("DELETE FROM documents WHERE entity_id = ?").run(entityId);
    db.prepare("DELETE FROM evaluation_responses WHERE evaluation_id IN (SELECT id FROM evaluations WHERE entity_id = ?)").run(entityId);
    db.prepare("DELETE FROM evaluations WHERE entity_id = ?").run(entityId);
    db.prepare("DELETE FROM process_criteria WHERE process_id IN (SELECT id FROM processes WHERE entity_id = ?)").run(entityId);
    db.prepare("DELETE FROM processes WHERE entity_id = ?").run(entityId);
    db.prepare("DELETE FROM history WHERE entity_id = ?").run(entityId);
    db.prepare("DELETE FROM entities WHERE id = ?").run(entityId);
    logAction(req.user.id, null, "DELETE", "Deleted entity: ".concat(entity.name, " (ID: ").concat(entityId, ")"));
    res.json({ message: "Entidade eliminada com sucesso." });
});
// ============================================================
// DOCUMENT UPLOAD
// ============================================================
var uploadDir = "uploads";
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir);
}
var storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) { return cb(null, uploadDir); },
    filename: function (req, file, cb) { return cb(null, "".concat(Date.now(), "-").concat(file.originalname)); },
});
var upload = (0, multer_1.default)({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max
app.post("/api/entities/:id/documents", authenticateToken, upload.single("file"), function (req, res) {
    if (!req.file)
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
    var _a = req.body, name = _a.name, type = _a.type;
    var url = "/uploads/".concat(req.file.filename);
    var result = db.prepare("INSERT INTO documents (entity_id, name, type, url) VALUES (?, ?, ?, ?)").run(req.params.id, name || req.file.originalname, type || "Other", url);
    logAction(req.user.id, Number(req.params.id), "UPLOAD", "Uploaded document: ".concat(name || req.file.originalname));
    res.status(201).json({ id: result.lastInsertRowid, url: url });
});
app.delete("/api/documents/:id", authenticateToken, function (req, res) {
    var doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id);
    if (!doc)
        return res.status(404).json({ message: "Documento não encontrado." });
    // Delete file from disk
    var filePath = path_1.default.join(__dirname, doc.url);
    if (fs_1.default.existsSync(filePath))
        fs_1.default.unlinkSync(filePath);
    db.prepare("DELETE FROM documents WHERE id = ?").run(req.params.id);
    logAction(req.user.id, doc.entity_id, "DELETE_DOC", "Deleted document: ".concat(doc.name));
    res.json({ message: "Documento eliminado." });
});
app.use("/uploads", express_1.default.static(uploadDir));
// ============================================================
// ENTITY HISTORY
// ============================================================
app.get("/api/entities/:id/history", authenticateToken, function (req, res) {
    var history = db.prepare("\n    SELECT h.*, u.name as user_name \n    FROM history h \n    LEFT JOIN users u ON h.user_id = u.id \n    WHERE h.entity_id = ? \n    ORDER BY h.timestamp DESC\n  ").all(req.params.id);
    res.json(history);
});
// Global history
app.get("/api/history", authenticateToken, function (req, res) {
    var _a = paginate(req), page = _a.page, limit = _a.limit, offset = _a.offset;
    var total = db.prepare("SELECT COUNT(*) as count FROM history").get().count;
    var history = db.prepare("\n    SELECT h.*, u.name as user_name, e.name as entity_name\n    FROM history h \n    LEFT JOIN users u ON h.user_id = u.id \n    LEFT JOIN entities e ON h.entity_id = e.id\n    ORDER BY h.timestamp DESC\n    LIMIT ? OFFSET ?\n  ").all(limit, offset);
    res.json({ data: history, pagination: { page: page, limit: limit, total: total, totalPages: Math.ceil(total / limit) } });
});
// ============================================================
// CRITERIA
// ============================================================
app.get("/api/criteria", authenticateToken, function (req, res) {
    var _a;
    var _b = req.query, entity_type = _b.entity_type, process_type = _b.process_type, evaluation_type = _b.evaluation_type, include_inactive = _b.include_inactive;
    var query = "SELECT * FROM criteria";
    var params = [];
    var conditions = [];
    if (entity_type) {
        conditions.push("(entity_type = ? OR entity_type IS NULL)");
        params.push(entity_type);
    }
    if (process_type) {
        conditions.push("process_type = ?");
        params.push(process_type);
    }
    if (evaluation_type) {
        conditions.push("evaluation_type = ?");
        params.push(evaluation_type);
    }
    if (include_inactive !== "true") {
        conditions.push("is_active = 1");
    }
    if (conditions.length > 0)
        query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY display_order ASC";
    var criteria = (_a = db.prepare(query)).all.apply(_a, params);
    res.json(criteria);
});
app.post("/api/criteria", authenticateToken, requireRole("Administrator"), function (req, res) {
    var error = validateRequired(req.body, ["code", "name", "process_type"]);
    if (error)
        return res.status(400).json({ message: error });
    var _a = req.body, code = _a.code, name = _a.name, description = _a.description, entity_type = _a.entity_type, process_type = _a.process_type, evaluation_type = _a.evaluation_type, weight = _a.weight, min_score = _a.min_score, max_score = _a.max_score, is_required = _a.is_required, is_active = _a.is_active, display_order = _a.display_order;
    var existing = db.prepare("SELECT id FROM criteria WHERE code = ?").get(code);
    if (existing)
        return res.status(409).json({ message: "Código de critério já existe." });
    var result = db.prepare("\n    INSERT INTO criteria (code, name, description, entity_type, process_type, evaluation_type, weight, min_score, max_score, is_required, is_active, display_order)\n    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\n  ").run(code, name, description || null, entity_type || null, process_type, evaluation_type || null, weight || 1, min_score || 0, max_score || 10, is_required ? 1 : 0, is_active ? 1 : 1, display_order || 99);
    logAction(req.user.id, null, "CREATE_CRITERIA", "Created criteria: ".concat(name));
    res.status(201).json({ id: result.lastInsertRowid });
});
app.put("/api/criteria/:id", authenticateToken, requireRole("Administrator"), function (req, res) {
    var _a = req.body, name = _a.name, description = _a.description, entity_type = _a.entity_type, process_type = _a.process_type, evaluation_type = _a.evaluation_type, weight = _a.weight, min_score = _a.min_score, max_score = _a.max_score, is_required = _a.is_required, is_active = _a.is_active, display_order = _a.display_order;
    db.prepare("\n    UPDATE criteria SET \n      name = COALESCE(?, name), \n      description = COALESCE(?, description), \n      entity_type = COALESCE(?, entity_type),\n      process_type = COALESCE(?, process_type),\n      evaluation_type = COALESCE(?, evaluation_type),\n      weight = COALESCE(?, weight), \n      min_score = COALESCE(?, min_score),\n      max_score = COALESCE(?, max_score), \n      is_required = COALESCE(?, is_required), \n      is_active = COALESCE(?, is_active),\n      display_order = COALESCE(?, display_order)\n    WHERE id = ?\n  ").run(name, description, entity_type || null, process_type || null, evaluation_type || null, weight, min_score, max_score, is_required, is_active, display_order, req.params.id);
    logAction(req.user.id, null, "UPDATE_CRITERIA", "Updated criteria ID: ".concat(req.params.id));
    res.json({ message: "Critério atualizado." });
});
app.delete("/api/criteria/:id", authenticateToken, requireRole("Administrator"), function (req, res) {
    db.prepare("UPDATE criteria SET is_active = 0 WHERE id = ?").run(req.params.id);
    logAction(req.user.id, null, "DELETE_CRITERIA", "Deactivated criteria ID: ".concat(req.params.id));
    res.json({ message: "Critério desativado." });
});
// ============================================================
// PROCESSES
// ============================================================
app.get("/api/processes", authenticateToken, function (req, res) {
    var processes = db.prepare("\n    SELECT p.*, e.name as entity_name, u.name as opener_name \n    FROM processes p \n    LEFT JOIN entities e ON p.entity_id = e.id \n    LEFT JOIN users u ON p.opener_id = u.id\n    ORDER BY p.created_at DESC\n  ").all();
    res.json(processes);
});
app.post("/api/processes", authenticateToken, function (req, res) {
    var error = validateRequired(req.body, ["entity_id", "type"]);
    if (error)
        return res.status(400).json({ message: error });
    var _a = req.body, entity_id = _a.entity_id, type = _a.type, priority = _a.priority, area = _a.area, justification = _a.justification;
    var process_number = "PROC-".concat(Date.now());
    var result = db.prepare("\n    INSERT INTO processes (process_number, entity_id, type, status, priority, area, justification, opener_id) \n    VALUES (?, ?, ?, 'Rascunho', ?, ?, ?, ?)\n  ").run(process_number, entity_id, type, priority || "Normal", area, justification, req.user.id);
    var processId = result.lastInsertRowid;
    // Auto-populate criteria
    var entity = db.prepare("SELECT entity_type FROM entities WHERE id = ?").get(entity_id);
    if (entity) {
        var criteria = db.prepare("SELECT id FROM criteria WHERE (entity_type = ? OR entity_type IS NULL) AND process_type = ? AND is_active = 1").all(entity.entity_type, type);
        var insertPC = db.prepare("INSERT INTO process_criteria (process_id, criteria_id) VALUES (?, ?)");
        for (var _i = 0, _b = criteria; _i < _b.length; _i++) {
            var c = _b[_i];
            insertPC.run(processId, c.id);
        }
    }
    // ============================================================
    // PROCESSES
    // ============================================================
    // GET /api/processes/:id
    app.get("/api/processes/:id", authenticateToken, function (req, res) {
        var process = db.prepare("\n    SELECT p.*, e.name as entity_name, u.name as opener_name\n    FROM processes p \n    JOIN entities e ON p.entity_id = e.id \n    LEFT JOIN users u ON p.opener_id = u.id\n    WHERE p.id = ?\n  ").get(req.params.id);
        if (!process)
            return res.status(404).json({ message: "Processo não encontrado" });
        var criteria = db.prepare("\n    SELECT c.id as criteria_id, c.name, c.description, c.weight, c.max_score,\n           pc.score, pc.evidence, pc.comments\n    FROM process_criteria pc\n    JOIN criteria c ON pc.criteria_id = c.id\n    WHERE pc.process_id = ?\n    ORDER BY c.display_order\n  ").all(req.params.id);
        var history = db.prepare("\n    SELECT wh.*, u.name as user_name\n    FROM workflow_history wh\n    LEFT JOIN users u ON wh.performed_by = u.id\n    WHERE wh.process_id = ?\n    ORDER BY wh.performed_at DESC\n  ").all(req.params.id);
        res.json(__assign(__assign({}, process), { criteria: criteria, workflow_history: history }));
    });
    // GET /api/processes/:id with history
    // ============================================================
    // WORKFLOW ENGINE
    // ============================================================
    var WORKFLOW_STEPS = {
        1: { name: "Rascunho", next: [2, 3], allowedRoles: ["Administrator", "Compliance Manager", "Procurement", "Owner"] },
        2: { name: "Submetido", next: [3], allowedRoles: ["Administrator", "Compliance Manager"] },
        3: { name: "Validação Documental", next: [4], allowedRoles: ["Administrator", "Compliance Manager", "Quality"] },
        4: { name: "Avaliação Técnica/Comercial", next: [5], allowedRoles: ["Administrator", "Compliance Manager", "Technical", "Financial", "Commercial"] },
        5: { name: "Em Aprovação", next: [6], allowedRoles: ["Administrator", "Compliance Manager", "Approver"] },
        6: { name: "Aprovado/Reprovado", next: [7, 8], allowedRoles: ["Administrator", "Compliance Manager"] },
        7: { name: "Comunicação do Resultado", next: [8], allowedRoles: ["Administrator", "Compliance Manager"] },
        8: { name: "Em Monitorização", next: [], allowedRoles: ["Administrator", "Compliance Manager", "Auditor"] },
    };
    function canTransition(stepFrom, stepTo, userRole) {
        var from = WORKFLOW_STEPS[stepFrom];
        if (!from)
            return false;
        return from.next.includes(stepTo) && from.allowedRoles.includes(userRole);
    }
    app.get("/api/workflow/steps", authenticateToken, function (req, res) {
        res.json(WORKFLOW_STEPS);
    });
    app.post("/api/processes/:id/transition", authenticateToken, function (req, res) {
        var _a = req.body, target_step = _a.target_step, notes = _a.notes;
        var processId = req.params.id;
        var userId = req.user.id;
        var userRole = req.user.role;
        if (!target_step)
            return res.status(400).json({ message: "Etapa destino obrigatória" });
        var process = db.prepare("SELECT * FROM processes WHERE id = ?").get(processId);
        if (!process)
            return res.status(404).json({ message: "Processo não encontrado" });
        var currentStep = process.current_step || 1;
        if (!canTransition(currentStep, target_step, userRole)) {
            return res.status(403).json({
                message: "Transi\u00E7\u00E3o de step ".concat(currentStep, " para ").concat(target_step, " n\u00E3o permitida para perfil \"").concat(userRole, "\"")
            });
        }
        db.prepare("UPDATE processes SET current_step = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .run(target_step, processId);
        db.prepare("\n    INSERT INTO workflow_history (process_id, step_from, step_to, action, notes, performed_by)\n    VALUES (?, ?, ?, ?, ?, ?)\n  ").run(processId, currentStep, target_step, "transition_".concat(currentStep, "_to_").concat(target_step), notes || null, userId);
        // Auto-update classification when reaching step 6
        if (target_step === 6) {
            var scores = db.prepare("SELECT score, weight FROM process_scores WHERE process_id = ?").all(processId);
            var totalWeighted_1 = 0, totalWeight_1 = 0;
            scores.forEach(function (s) { totalWeighted_1 += s.score * s.weight; totalWeight_1 += s.weight; });
            var percentage = totalWeight_1 > 0 ? (totalWeighted_1 / totalWeight_1) * 10 : 0;
            var classification = percentage >= 90 ? "Aprovado" : percentage >= 75 ? "Aprovado com observação" : percentage >= 60 ? "Condicionado" : "Reprovado";
            db.prepare("UPDATE processes SET result_percentage = ?, classification = ? WHERE id = ?").run(percentage, classification, processId);
        }
        logAction(userId, process.entity_id, "WORKFLOW_TRANSITION", "Step ".concat(currentStep, " \u2192 ").concat(target_step));
        res.json({ message: "Workflow actualizado", step: target_step });
    });
    // GET /api/workflow/steps - get available steps
    app.get("/api/workflow/steps", authenticateToken, function (req, res) {
        res.json(WORKFLOW_STEPS);
    });
    app.put("/api/processes/:id/score", authenticateToken, function (req, res) {
        var scores = req.body.scores;
        var updatePC = db.prepare("UPDATE process_criteria SET score = ?, evidence = ?, comments = ? WHERE process_id = ? AND criteria_id = ?");
        for (var _i = 0, scores_1 = scores; _i < scores_1.length; _i++) {
            var s = scores_1[_i];
            updatePC.run(s.score, s.evidence, s.comments, req.params.id, s.criteria_id);
        }
        var results = db.prepare("\n    SELECT pc.score, c.weight, c.max_score \n    FROM process_criteria pc \n    JOIN criteria c ON pc.criteria_id = c.id \n    WHERE pc.process_id = ?\n  ").all(req.params.id);
        var totalScore = 0;
        var maxPossible = 0;
        results.forEach(function (r) {
            if (r.score !== null) {
                totalScore += r.score * r.weight;
                maxPossible += r.max_score * r.weight;
            }
        });
        var percentage = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;
        var classification = "Reprovado";
        if (percentage >= 90)
            classification = "Aprovado";
        else if (percentage >= 75)
            classification = "Aprovado com observação";
        else if (percentage >= 60)
            classification = "Condicionado";
        db.prepare("UPDATE processes SET result_score = ?, result_percentage = ?, classification = ? WHERE id = ?").run(totalScore, percentage, classification, req.params.id);
        logAction(req.user.id, null, "SCORE_PROCESS", "Scored process ID: ".concat(req.params.id, " (").concat(Math.round(percentage), "%)"));
        res.json({ percentage: percentage, classification: classification });
    });
    app.post("/api/processes/:id/submit", authenticateToken, function (req, res) {
        db.prepare("UPDATE processes SET status = 'Em aprovação' WHERE id = ?").run(req.params.id);
        logAction(req.user.id, null, "SUBMIT_PROCESS", "Submitted process ID: ".concat(req.params.id, " for approval"));
        res.json({ message: "Processo submetido para aprovação" });
    });
    app.post("/api/processes/:id/approve", authenticateToken, requireRole("Administrator", "Compliance Manager"), function (req, res) {
        var _a = req.body, decision = _a.decision, conditions = _a.conditions, comments = _a.comments, validity_date = _a.validity_date, next_reevaluation_date = _a.next_reevaluation_date, result_percentage = _a.result_percentage;
        if (!decision || !["Aprovado", "Reprovado"].includes(decision)) {
            return res.status(400).json({ message: "Decisão inválida. Use 'Aprovado' ou 'Reprovado'." });
        }
        var compliance_level = "Não conforme";
        if (result_percentage >= 90)
            compliance_level = "Conforme";
        else if (result_percentage >= 60)
            compliance_level = "Parcialmente conforme";
        var classification = "Reprovado";
        if (result_percentage >= 90)
            classification = "Aprovado";
        else if (result_percentage >= 75)
            classification = "Aprovado com restrições";
        db.prepare("\n    UPDATE processes SET \n      status = ?, \n      conditions = ?, \n      comments = ?, \n      validity_date = ?,\n      next_reevaluation_date = ?,\n      compliance_level = ?,\n      classification = ?,\n      approver_id = ?,\n      decision_date = CURRENT_TIMESTAMP\n    WHERE id = ?\n  ").run(decision, conditions || null, comments || null, validity_date || null, next_reevaluation_date || null, compliance_level, classification, req.user.id, req.params.id);
        // If approved, update entity status
        if (decision === "Aprovado") {
            var proc = db.prepare("SELECT entity_id FROM processes WHERE id = ?").get(req.params.id);
            if (proc) {
                db.prepare("UPDATE entities SET status = 'Ativo' WHERE id = ?").run(proc.entity_id);
            }
        }
        logAction(req.user.id, null, "DECIDE_PROCESS", "".concat(decision, " process ID: ").concat(req.params.id));
        res.json({ message: "Processo ".concat(decision === "Aprovado" ? "aprovado" : "rejeitado", " com sucesso.") });
    });
    app.delete("/api/processes/:id", authenticateToken, function (req, res) {
        var proc = db.prepare("SELECT process_number FROM processes WHERE id = ?").get(req.params.id);
        if (!proc)
            return res.status(404).json({ message: "Processo não encontrado." });
        db.prepare("DELETE FROM process_criteria WHERE process_id = ?").run(req.params.id);
        db.prepare("DELETE FROM processes WHERE id = ?").run(req.params.id);
        logAction(req.user.id, null, "DELETE_PROCESS", "Deleted process: ".concat(proc.process_number));
        res.json({ message: "Processo eliminado." });
    });
    // ============================================================
    // EVALUATIONS
    // ============================================================
    app.post("/api/evaluations", authenticateToken, function (req, res) {
        var error = validateRequired(req.body, ["entity_id", "type", "responses"]);
        if (error)
            return res.status(400).json({ message: error });
        var _a = req.body, entity_id = _a.entity_id, type = _a.type, evaluation_type = _a.evaluation_type, periodicity = _a.periodicity, period = _a.period, product_service = _a.product_service, unit = _a.unit, responses = _a.responses, action_plan = _a.action_plan, action_plan_deadline = _a.action_plan_deadline, action_plan_responsible = _a.action_plan_responsible, previous_evaluation_id = _a.previous_evaluation_id;
        var result = db.prepare("\n    INSERT INTO evaluations (entity_id, type, evaluation_type, periodicity, period, product_service, unit, evaluator_id, action_plan, action_plan_deadline, action_plan_responsible, previous_evaluation_id, evaluation_date) \n    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)\n  ").run(entity_id, type, evaluation_type || "Nova", periodicity || "Anual", period, product_service, unit, req.user.id, action_plan || null, action_plan_deadline || null, action_plan_responsible || null, previous_evaluation_id || null);
        var evaluationId = result.lastInsertRowid;
        var insertResponse = db.prepare("\n    INSERT INTO evaluation_responses (evaluation_id, group_name, criterion_name, score, observation, evidence) \n    VALUES (?, ?, ?, ?, ?)\n  ");
        var totalScore = 0;
        var count = 0;
        for (var _i = 0, responses_1 = responses; _i < responses_1.length; _i++) {
            var r = responses_1[_i];
            insertResponse.run(evaluationId, r.group_name, r.criterion_name, r.score, r.observation, r.evidence || null);
            totalScore += r.score;
            count++;
        }
        var average = count > 0 ? totalScore / count : 0;
        var percentage = (average / 10) * 100;
        var classification = "Crítico";
        if (percentage >= 90)
            classification = "Excelente";
        else if (percentage >= 75)
            classification = "Bom";
        else if (percentage >= 60)
            classification = "Satisfatório";
        else if (percentage >= 40)
            classification = "Insatisfatório";
        var recommended_action = "Reavaliar";
        if (percentage >= 90)
            recommended_action = "Manter";
        else if (percentage >= 75)
            recommended_action = "Melhorar";
        else if (percentage < 40)
            recommended_action = "Suspender";
        else if (percentage < 20)
            recommended_action = "Desqualificar";
        db.prepare("UPDATE evaluations SET overall_score = ?, percentage = ?, classification = ?, recommended_action = ? WHERE id = ?").run(average, percentage, classification, recommended_action, evaluationId);
        logAction(req.user.id, entity_id, "CREATE_EVALUATION", "Created ".concat(evaluation_type || "Nova", " ").concat(type, " avalia\u00E7\u00E3o (").concat(Math.round(percentage), "%)"));
        res.status(201).json({ id: evaluationId, percentage: percentage, classification: classification, recommended_action: recommended_action });
    });
    app.get("/api/evaluations", authenticateToken, function (req, res) {
        var _a;
        var _b = req.query, entity_id = _b.entity_id, type = _b.type, evaluation_type = _b.evaluation_type, periodicity = _b.periodicity;
        var query = "\n    SELECT ev.*, e.name as entity_name, u.name as evaluator_name, prev.percentage as prev_percentage\n    FROM evaluations ev \n    JOIN entities e ON ev.entity_id = e.id \n    LEFT JOIN users u ON ev.evaluator_id = u.id\n    LEFT JOIN evaluations prev ON ev.previous_evaluation_id = prev.id\n  ";
        var params = [];
        if (entity_id || type || evaluation_type || periodicity) {
            query += " WHERE";
            var whereAdded = false;
            if (entity_id) {
                query += " ev.entity_id = ?";
                params.push(entity_id);
                whereAdded = true;
            }
            if (type) {
                if (whereAdded)
                    query += " AND";
                query += " ev.type = ?";
                params.push(type);
                whereAdded = true;
            }
            if (evaluation_type) {
                if (whereAdded)
                    query += " AND";
                query += " ev.evaluation_type = ?";
                params.push(evaluation_type);
                whereAdded = true;
            }
            if (periodicity) {
                if (whereAdded)
                    query += " AND";
                query += " ev.periodicity = ?";
                params.push(periodicity);
            }
        }
        query += " ORDER BY ev.created_at DESC";
        var evs = (_a = db.prepare(query)).all.apply(_a, params);
        res.json(evs);
    });
    app.get("/api/evaluations/:id", authenticateToken, function (req, res) {
        var evaluation = db.prepare("\n    SELECT ev.*, e.name as entity_name, u.name as evaluator_name \n    FROM evaluations ev \n    JOIN entities e ON ev.entity_id = e.id \n    LEFT JOIN users u ON ev.evaluator_id = u.id\n    WHERE ev.id = ?\n  ").get(req.params.id);
        if (!evaluation)
            return res.status(404).json({ message: "Avaliação não encontrada." });
        var responses = db.prepare("SELECT * FROM evaluation_responses WHERE evaluation_id = ?").all(req.params.id);
        res.json(__assign(__assign({}, evaluation), { responses: responses }));
    });
    app.delete("/api/evaluations/:id", authenticateToken, function (req, res) {
        var ev = db.prepare("SELECT id FROM evaluations WHERE id = ?").get(req.params.id);
        if (!ev)
            return res.status(404).json({ message: "Avaliação não encontrada." });
        db.prepare("DELETE FROM evaluation_responses WHERE evaluation_id = ?").run(req.params.id);
        db.prepare("DELETE FROM evaluations WHERE id = ?").run(req.params.id);
        logAction(req.user.id, null, "DELETE_EVALUATION", "Deleted evaluation ID: ".concat(req.params.id));
        res.json({ message: "Avaliação eliminada." });
    });
    // ============================================================
    // NOTIFICATIONS
    // ============================================================
    app.get("/api/notifications", authenticateToken, function (req, res) {
        var notifications = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").all(req.user.id);
        res.json(notifications);
    });
    app.post("/api/notifications/:id/read", authenticateToken, function (req, res) {
        db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(req.params.id);
        res.sendStatus(200);
    });
    app.post("/api/notifications/read-all", authenticateToken, function (req, res) {
        db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").run(req.user.id);
        res.json({ message: "Todas as notificações marcadas como lidas." });
    });
    var checkExpiringApprovals = function () {
        var users = db.prepare("SELECT id FROM users").all();
        var expiring = db.prepare("\n    SELECT p.id, p.process_number, p.validity_date, e.name as entity_name \n    FROM processes p \n    JOIN entities e ON p.entity_id = e.id \n    WHERE p.status = 'Aprovado' \n    AND p.validity_date IS NOT NULL \n    AND date(p.validity_date) <= date('now', '+30 days')\n  ").all();
        for (var _i = 0, expiring_1 = expiring; _i < expiring_1.length; _i++) {
            var proc = expiring_1[_i];
            for (var _a = 0, users_1 = users; _a < users_1.length; _a++) {
                var user = users_1[_a];
                var message = "O processo ".concat(proc.process_number, " (").concat(proc.entity_name, ") expira em ").concat(proc.validity_date);
                var exists = db.prepare("SELECT id FROM notifications WHERE user_id = ? AND message = ?").get(user.id, message);
                if (!exists) {
                    db.prepare("INSERT INTO notifications (user_id, message, type) VALUES (?, ?, 'Alert')").run(user.id, message);
                }
            }
        }
    };
    // ============================================================
    // DASHBOARD & REPORTS
    // ============================================================
    app.get("/api/reports/dashboard", authenticateToken, function (req, res) {
        checkExpiringApprovals();
        var period = req.query.period;
        var entityType = req.query.entityType;
        var processType = req.query.processType;
        var processStatus = req.query.processStatus;
        var sector = req.query.sector;
        var riskRating = req.query.riskRating;
        var area = req.query.area;
        var impact = req.query.impact;
        var dateFilter = "";
        if (period === "current_month") {
            dateFilter = " AND created_at >= date('now', 'start of month')";
        }
        else if (period === "last_quarter") {
            dateFilter = " AND created_at >= date('now', '-3 months')";
        }
        else if (period === "last_year") {
            dateFilter = " AND created_at >= date('now', '-12 months')";
        }
        var entityFilter = "";
        if (entityType)
            entityFilter += " AND e.entity_type = '".concat(entityType, "'");
        if (sector)
            entityFilter += " AND e.sector = '".concat(sector, "'");
        if (riskRating)
            entityFilter += " AND e.final_risk_rating = '".concat(riskRating, "'");
        if (impact)
            entityFilter += " AND e.operational_impact = '".concat(impact, "'");
        var processFilter = "";
        if (processType)
            processFilter += " AND p.type = '".concat(processType, "'");
        if (processStatus)
            processFilter += " AND p.status = '".concat(processStatus, "'");
        if (area)
            processFilter += " AND p.area = '".concat(area, "'");
        var stats = {
            totals: {
                suppliers: db.prepare("SELECT COUNT(*) as count FROM entities WHERE entity_type = 'Supplier'".concat(dateFilter)).get(),
                clients: db.prepare("SELECT COUNT(*) as count FROM entities WHERE entity_type = 'Client'".concat(dateFilter)).get(),
                processes_pending: db.prepare("SELECT COUNT(*) as count FROM processes p JOIN entities e ON p.entity_id = e.id WHERE p.status IN ('Em an\u00E1lise', 'Em aprova\u00E7\u00E3o', 'Submetido')".concat(dateFilter).concat(entityFilter.includes('Supplier') ? entityFilter : '').concat(entityFilter.includes('Client') ? entityFilter : '')).get(),
                approved: db.prepare("SELECT COUNT(*) as count FROM processes p JOIN entities e ON p.entity_id = e.id WHERE p.status = 'Aprovado'".concat(dateFilter).concat(entityFilter)).get(),
                rejected: db.prepare("SELECT COUNT(*) as count FROM processes p JOIN entities e ON p.entity_id = e.id WHERE p.status = 'Reprovado'".concat(dateFilter).concat(entityFilter)).get(),
                eval_pending: db.prepare("SELECT COUNT(*) as count FROM processes p JOIN entities e ON p.entity_id = e.id WHERE p.type = 'Avalia\u00E7\u00E3o' AND p.status != 'Encerrado'".concat(dateFilter).concat(entityFilter)).get(),
                reeval_pending: db.prepare("SELECT COUNT(*) as count FROM processes p JOIN entities e ON p.entity_id = e.id WHERE p.type = 'Reavalia\u00E7\u00E3o' AND p.status != 'Encerrado'".concat(dateFilter).concat(entityFilter)).get(),
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
            processes_by_status: db.prepare("\n      SELECT p.status, COUNT(*) as count \n      FROM processes p \n      GROUP BY p.status \n      ORDER BY count DESC\n    ").all(),
            monthly_evolution: db.prepare("\n      SELECT strftime('%Y-%m', p.created_at) as month, COUNT(*) as count \n      FROM processes p \n      GROUP BY month \n      ORDER BY month DESC \n      LIMIT 12\n    ").all(),
        };
        res.json(stats);
    });
    // ============================================================
    // SERVER START
    // ============================================================
    function startServer() {
        return __awaiter(this, void 0, void 0, function () {
            var vite;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(process.env.NODE_ENV !== "production")) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, vite_1.createServer)({
                                server: { middlewareMode: true },
                                appType: "spa",
                            })];
                    case 1:
                        vite = _a.sent();
                        app.use(vite.middlewares);
                        return [3 /*break*/, 3];
                    case 2:
                        app.use(express_1.default.static(path_1.default.join(__dirname, "dist")));
                        app.get("*", function (req, res) {
                            res.sendFile(path_1.default.join(__dirname, "dist", "index.html"));
                        });
                        _a.label = 3;
                    case 3:
                        app.listen(PORT, "0.0.0.0", function () {
                            console.log("Server running on http://localhost:".concat(PORT));
                        });
                        return [2 /*return*/];
                }
            });
        });
    }
    startServer();
});
