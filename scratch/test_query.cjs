const Database = require('better-sqlite3');
const db = new Database('toknow.db');
const query = `
    SELECT id, name, role FROM users 
    WHERE role IN ('Administrator', 'Compliance Manager', 'Manager', 'Procurement', 'Finance', 'Human Resources') 
       OR id IN (SELECT DISTINCT manager_id FROM employees WHERE manager_id IS NOT NULL) 
    ORDER BY name
`;
const users = db.prepare(query).all();
console.log(users);
db.close();
