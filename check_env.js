const { execSync } = require('child_process');

try {
  const ver = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log('Node:', ver);
} catch(e) { console.log('Node error:', e.message); }

try {
  const ver = execSync('npx tsx --version', { encoding: 'utf8', cwd: 'C:\\Users\\us\\Downloads\\Trabalhos e Projectos ILUNGI\\TOKNOW\\To Know' }).trim();
  console.log('tsx:', ver);
} catch(e) { console.log('tsx not found'); }

try {
  const ver = execSync('npx ts-node --version', { encoding: 'utf8', cwd: 'C:\\Users\\us\\Downloads\\Trabalhos e Projectos ILUNGI\\TOKNOW\\To Know' }).trim();
  console.log('ts-node:', ver);
} catch(e) { console.log('ts-node not found'); }