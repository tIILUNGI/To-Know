import { execSync } from 'child_process';

const baseDir = 'C:\\Users\\us\\Downloads\\Trabalhos e Projectos ILUNGI\\TOKNOW\\To Know';

try {
  console.log('Compiling server.ts to server.js...');
  const result = execSync(`cd /d "${baseDir}" && npx tsc server.ts --outDir . --target ES2020 --module ESNext --moduleResolution bundler --esModuleInterop --skipLibCheck --allowJs --noEmit false`, { encoding: 'utf8', cwd: baseDir });
  console.log('Compiled successfully');
} catch(e) {
  console.log('Compile errors:', (e.stderr || e.message).slice(-1000));
}