const Database = require('better-sqlite3');
const db = new Database('toknow.db');

try {
  // Find managers
  const users = db.prepare("SELECT id, name FROM users WHERE name LIKE ? OR name LIKE ? OR name LIKE ?").all(
    '%João Compras%',
    '%Gestor de Compliance%',
    '%Administrador do Sistema%'
  );

  console.log('Found users:', users);

  const managerMapping = {
    'João Compras': users.find(u => u.name.includes('João Compras'))?.id,
    'Gestor de Compliance': users.find(u => u.name.includes('Gestor de Compliance'))?.id,
    'Administrador do Sistema': users.find(u => u.name.includes('Administrador do Sistema'))?.id
  };

  const employeesToCreate = [
    { name: 'Colaborador João', email: 'colab.joao@ilungi.ao', position: 'Analista de Compras', department: 'Logística', manager_id: managerMapping['João Compras'] },
    { name: 'Colaborador Compliance', email: 'colab.comp@ilungi.ao', position: 'Analista de Risco', department: 'Compliance', manager_id: managerMapping['Gestor de Compliance'] },
    { name: 'Colaborador Admin', email: 'colab.admin@ilungi.ao', position: 'Suporte Técnico', department: 'TI', manager_id: managerMapping['Administrador do Sistema'] }
  ];

  const insert = db.prepare(`
    INSERT INTO employees (name, email, position, department, status, manager_id, created_at)
    VALUES (?, ?, ?, ?, 'Ativo', ?, CURRENT_TIMESTAMP)
  `);

  for (const emp of employeesToCreate) {
    if (emp.manager_id) {
      insert.run(emp.name, emp.email, emp.position, emp.department, emp.manager_id);
      console.log(`Created employee: ${emp.name} managed by ID ${emp.manager_id}`);
    } else {
      console.log(`Could not find manager for ${emp.name}`);
    }
  }

} catch (err) {
  console.error(err);
} finally {
  db.close();
}
