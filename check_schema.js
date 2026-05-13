const Database = require('better-sqlite3');
const db = new Database('toknow.db');

// Find all FK constraints referencing processes
const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND sql LIKE '%processes%'").all();
console.log('Tables with processes reference:');
console.log(tables);

// Also check foreign keys directly
const fk = db.prepare("SELECT * FROM pragma_foreign_key_list('evaluations')").all();
console.log('\nEvaluations FK:', fk);

const fk2 = db.prepare("SELECT * FROM pragma_foreign_key_list('workflow_history')").all();
console.log('Workflow_history FK:', fk2);

const fk3 = db.prepare("SELECT * FROM pragma_foreign_key_list('process_criteria')").all();
console.log('Process_criteria FK:', fk3);
