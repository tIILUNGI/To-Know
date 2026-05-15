import { execSync } from 'child_process';

const baseDir = 'C:\\Users\\us\\Downloads\\Trabalhos e Projectos ILUNGI\\TOKNOW\\To Know';

function tryCmd(name: string, cmd: string) {
  try {
    const out = execSync(cmd, { encoding: 'utf8', cwd: baseDir });
    console.log(`${name}: ${out.trim()}`);
  } catch(e: any) {
    console.log(`${name}: NOT AVAILABLE`);
  }
}

tryCmd('tsx', 'npx tsx --version');
tryCmd('ts-node', 'npx ts-node --version');
tryCmd('tsx (local)', '.\\node_modules\\.bin\\tsx --version');