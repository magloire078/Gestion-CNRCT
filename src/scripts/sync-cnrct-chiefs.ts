import fs from 'fs';
import path from 'path';

// Load .env.local variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
}

// Emulate window object for firebase-init to not crash during SSR checks
(global as any).window = {};

import { getEmployees, createOrUpdateChiefFromEmployee } from '../services/employee-service';

const GROUPE_DIRECTOIRE_ID = '9ywKFDgVMS86rZLPYhpm';

async function main() {
  console.log("Fetching all employees...");
  const employees = await getEmployees();
  
  const toSync = employees.filter(employee => {
    const isDirectoire = employee.departmentId === GROUPE_DIRECTOIRE_ID || 
                         employee.matricule?.startsWith('D 0') || 
                         ['Membre du Directoire', 'Président', 'Secrétaire Général', 'Directrice de Cabinet', 'Directeur de Cabinet'].includes(employee.poste || '');
                         
    const isComite = employee.poste?.includes('Comité Régional');
    
    return isDirectoire || isComite;
  });

  console.log(`Found ${toSync.length} Directoire/Comité members to sync to Chiefs.`);

  let successCount = 0;
  for (const emp of toSync) {
    try {
      await createOrUpdateChiefFromEmployee(emp);
      process.stdout.write('.');
      successCount++;
    } catch (e: any) {
      console.error(`\nFailed to sync ${emp.name}: ${e.message}`);
    }
  }

  console.log(`\n\nSync completed: ${successCount} chiefs processed successfully.`);
  process.exit(0);
}

main().catch(console.error);
