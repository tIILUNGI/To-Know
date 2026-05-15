const { execSync } = require('child_process');
const path = require('path');

const baseDir = 'C:\\Users\\us\\Downloads\\Trabalhos e Projectos ILUNGI\\TOKNOW\\To Know';

try {
  // Try using tsx to compile
  console.log('Attempting to compile server.ts...');
  execSync(`cd /d "${baseDir}" && npx tsx server.ts`, { stdio: 'pipe' });
  console.log('tsx approach succeeded');
} catch (e) {
  console.log('tsx approach failed:', e.message);
  try {
    // Fallback: use npx ts-node
    console.log('Trying ts-node...');
    execSync(`cd /d "${baseDir}" && npx ts-node --esm server.ts`, { stdio: 'pipe' });
  } catch (e2) {
    console.log('ts-node failed too:', e2.message);
  }
}

console.log('Done');