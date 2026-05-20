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

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("ERREUR: GEMINI_API_KEY introuvable dans .env.local.");
  console.error("Veuillez ajouter GEMINI_API_KEY=votre_cle_api dans .env.local et relancer.");
  process.exit(1);
}

const FILE_PATH = path.resolve(process.cwd(), 'src/lib/ivory-coast-divisions.ts');

// Function to fetch from Gemini using raw HTTP to avoid SDK version issues
async function fetchVillages(region: string, department: string, subPrefecture: string): Promise<string[]> {
  const prompt = `
Tu es un expert de l'administration territoriale de la Côte d'Ivoire.
Donne la liste officielle et exhaustive des villages de la sous-préfecture de "${subPrefecture}" (département de ${department}, région de ${region}).
Renvoie UNIQUEMENT un tableau JSON de chaînes de caractères (les noms des villages).
Exemple de réponse attendue: ["Village 1", "Village 2", "Village 3"]
S'il n'y a aucun village, renvoie [].
N'inclus AUCUN texte explicatif, juste le tableau JSON.
  `.trim();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Erreur de parsing JSON de la part de l'IA :", text);
    return [];
  }
}

async function main() {
  console.log("Lecture du référentiel territorial...");
  let content = fs.readFileSync(FILE_PATH, 'utf8');
  
  const interfaceMatch = content.match(/export interface Division \{[\s\S]*?\}/);
  const interfaceStr = interfaceMatch ? interfaceMatch[0] : `export interface Division { [region: string]: { [department: string]: { [subPrefecture: string]: string[]; }; }; }`;
  
  const dataMatch = content.match(/export const divisions: Division = (\{[\s\S]*?\});\s*$/m);
  if (!dataMatch) {
    console.error("Impossible de trouver l'objet 'divisions' dans le fichier.");
    process.exit(1);
  }

  let divisions;
  try {
    // Dirty but effective way to parse the JS object from the TS file
    divisions = eval('(' + dataMatch[1] + ')');
  } catch (e) {
    console.error("Erreur lors de l'évaluation du JSON :", e);
    process.exit(1);
  }

  const regions = Object.keys(divisions).sort();
  
  for (const region of regions) {
    const departments = Object.keys(divisions[region]).sort();
    for (const department of departments) {
      const subPrefectures = Object.keys(divisions[region][department]).sort();
      for (const subPrefecture of subPrefectures) {
        
        const existingVillages = divisions[region][department][subPrefecture];
        
        // Skip if it already has villages (so we can stop and resume safely)
        if (Array.isArray(existingVillages) && existingVillages.length > 0) {
          continue;
        }

        console.log(`Recherche des villages pour : [${region} > ${department} > ${subPrefecture}] ...`);
        
        let retries = 3;
        while (retries > 0) {
          try {
            const villages = await fetchVillages(region, department, subPrefecture);
            console.log(`  -> Trouvé ${villages.length} village(s).`);
            
            // Assign villages, or assign a dummy to prevent endless loops if 0 found
            divisions[region][department][subPrefecture] = villages.length > 0 ? villages : ["(Aucun village trouvé)"];
            
            // Save immediately
            const newContent = `${interfaceStr}\n\nexport const divisions: Division = ${JSON.stringify(divisions, null, 2)};\n`;
            fs.writeFileSync(FILE_PATH, newContent, 'utf8');
            
            break; // Break the retry loop
          } catch (err: any) {
            console.error(`  -> Erreur: ${err.message}. Retries left: ${retries - 1}`);
            retries--;
            await new Promise(r => setTimeout(r, 5000)); // wait 5s before retry
          }
        }

        // Wait 3 seconds to respect Gemini API free tier rate limits (15 RPM)
        await new Promise(r => setTimeout(r, 4000));
      }
    }
  }

  console.log("✅ Terminé ! Tous les villages ont été générés.");
}

main().catch(console.error);
