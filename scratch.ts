import fs from 'fs';
import path from 'path';

// Load divisions
const divisions = {
  "Abidjan": { "Abidjan": {} },
  "Agnéby-Tiassa": { "Agboville": {}, "Sikensi": {}, "Taabo": {}, "Tiassalé": {} },
  "Bafing": { "Koro": {}, "Ouaninou": {}, "Touba": {} },
  "Bagoué": { "Boundiali": {}, "Kouto": {}, "Tengréla": {} },
  "Bélier": { "Didiévi": {}, "Djékanou": {}, "Tiébissou": {}, "Toumodi": {} },
  "Béré": { "Dianra": {}, "Kounahiri": {}, "Mankono": {} },
  "Bounkani": { "Bouna": {}, "Doropo": {}, "Nassian": {}, "Téhini": {} },
  "Cavally": { "Bloléquin": {}, "Guiglo": {}, "Taï": {}, "Toulepleu": {} },
  "Folon": { "Kaniasso": {}, "Minignan": {} },
  "Gbêkê": { "Béoumi": {}, "Botro": {}, "Bouaké": {}, "Sakassou": {} },
  "Gbôklé": { "Fresco": {}, "Sassandra": {} },
  "Gôh": { "Gagnoa": {}, "Oumé": {} },
  "Gontougo": { "Bondoukou": {}, "Koun-Fao": {}, "Sandégué": {}, "Transua": {}, "Tanda": {} },
  "Grands-Ponts": { "Dabou": {}, "Grand-Lahou": {}, "Jacqueville": {} },
  "Guémon": { "Bangolo": {}, "Duékoué": {}, "Fakili": {}, "Kouibly": {} },
  "Hambol": { "Dabakala": {}, "Katiola": {}, "Niakaramandougou": {} },
  "Haut-Sassandra": { "Daloa": {}, "Issia": {}, "Vavoua": {}, "Zoukougbeu": {} },
  "Iffou": { "Daoukro": {}, "M'Bahiakro": {}, "Prikro": {} },
  "Indénié-Djuablin": { "Abengourou": {}, "Agnibilékrou": {}, "Bettié": {} },
  "Kabadougou": { "Gbéleban": {}, "Madinani": {}, "Odienné": {}, "Samatiguila": {}, "Séguelon": {} },
  "La Mé": { "Adzopé": {}, "Akoupé": {}, "Alépé": {}, "Yakassé-Attobrou": {} },
  "Lôh-Djiboua": { "Divo": {}, "Guitry": {}, "Lakota": {} },
  "Marahoué": { "Bouaflé": {}, "Sinfra": {}, "Zuénoula": {} },
  "Moronou": { "Arrah": {}, "Bongouanou": {}, "M'Batto": {} },
  "Nawa": { "Buyo": {}, "Guéyo": {}, "Soubré": {}, "Méagui": {} },
  "N’Zi": { "Dimbokro": {}, "Bocanda": {}, "Kouassi-Kouassikro": {} },
  "Poro": { "Korhogo": {}, "Dikodougou": {}, "M'Bengué": {}, "Sinématiali": {} },
  "San-Pédro": { "San-Pédro": {}, "Tabou": {} },
  "Sud-Comoé": { "Aboisso": {}, "Adiaké": {}, "Grand-Bassam": {}, "Tiapoum": {} },
  "Tchologo": { "Ferkessédougou": {}, "Kong": {}, "Ouangolodougou": {} },
  "Tonkpi": { "Biankouma": {}, "Danané": {}, "Man": {}, "Zouan-Hounien": {}, "Sipilou": {} },
  "Worodougou": { "Kani": {}, "Séguéla": {} },
  "Yamoussoukro": { "Yamoussoukro": {}, "Attiégouakro": {} }
};

function cleanRegionName(region: string = '') {
  return region
    .replace(/^Région de la\s+/i, '')
    .replace(/^Région du\s+/i, '')
    .replace(/^Région d'\s+/i, '')
    .replace(/^La Région de\s+/i, '')
    .replace(/^Le District de\s+/i, '')
    .replace(/^District Autonome de\s+/i, '')
    .replace(/^District Autonome d'\s+/i, '')
    .trim();
}

async function run() {
  const csvPath = path.join(process.cwd(), 'public', 'data', 'import_employes.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n');
  const header = lines[0].split(',');
  
  const nameIdx = header.indexOf('nom');
  const prenomIdx = header.indexOf('prenom');
  const regionIdx = header.indexOf('Region');
  const statusIdx = header.indexOf('Statut');
  const posteIdx = header.indexOf('poste');
  const departementIdx = header.indexOf('Departement');

  const directoryRaw: any[] = [];
  lines.forEach((line, i) => {
    if (i === 0) return;
    const parts = line.split(',');
    if (parts.length < regionIdx) return;
    const name = (parts[prenomIdx] + ' ' + parts[nameIdx]).trim();
    directoryRaw.push({
      id: `emp-${i}`,
      name: name,
      firstName: parts[prenomIdx],
      lastName: parts[nameIdx],
      Region: parts[regionIdx] || '',
      Departement: parts[departementIdx] || '',
      poste: parts[posteIdx] || '',
      status: parts[statusIdx] === '1' ? 'Actif' : 'Décédé' // Simplification
    });
  });

  const directory = directoryRaw.filter(emp => emp.status === 'Actif' || emp.status === 'En congé');

  console.log("--- REGIONAL COMMITTEES SIMULATION ---");
  const regionsList = Object.keys(divisions);
  regionsList.forEach(region => {
    const depts = Object.keys((divisions as any)[region] || {});
    
    // Normalization check
    const president = directory.find(emp => 
        emp.Region === region && 
        emp.poste?.toLowerCase().includes('membre du directoire')
    ) || null;

    const committeeMembers: any[] = [];
    if (president) committeeMembers.push(president);

    depts.forEach(dept => {
        const deptMembers = directory.filter(emp => 
            emp.Region === region && 
            emp.Departement === dept && 
            emp.id !== president?.id &&
            (emp.poste?.toLowerCase().includes('comité') || emp.poste?.toLowerCase().includes('comite'))
        );
        committeeMembers.push(...deptMembers.slice(0, 2));
    });

    console.log(`Region: "${region}" | President: ${president ? president.name : 'NONE'} | Members Count: ${committeeMembers.length}`);
  });
}

run().catch(console.error);