import Database from 'better-sqlite3';
const db = new Database('toknow.db');

const processId = 8;
console.log('Workflow history for process', processId, ':', db.prepare("SELECT COUNT(*) as c FROM workflow_history WHERE process_id = ?").get(processId));
console.log('Evaluations for process', processId, ':', db.prepare("SELECT COUNT(*) as c FROM evaluations WHERE process_id = ?").get(processId));
console.log('Process criteria for process', processId, ':', db.prepare("SELECT COUNT(*) as c FROM process_criteria WHERE process_id = ?").get(processId));
console.log('Process exists:', db.prepare("SELECT * FROM processes WHERE id = ?").get(processId));

// Try delete manually in transaction
try {
  db.transaction(() => {
    db.prepare("DELETE FROM workflow_history WHERE process_id = ?").run(processId);
    db.prepare("DELETE FROM evaluations WHERE process_id = ?").run(processId);
    db.prepare("DELETE FROM processes WHERE id = ?").run(processId);
    console.log('Delete successful!');
  })();
} catch (e) {
  console.log('Delete failed:', e.message);
}

db.close();
