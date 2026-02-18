/**
 * Script pour remplacer automatiquement les imports de firebase/firestore 
 * par les imports depuis @/lib/firebase dans tous les services.
 */

const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../src/services');

// Lire tous les fichiers *-service.ts
const files = fs.readdirSync(servicesDir).filter(file => file.endsWith('-service.ts'));

files.forEach(file => {
    const filePath = path.join(servicesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Vérifier si le fichier importe de 'firebase/firestore'
    if (content.includes("from 'firebase/firestore'") || content.includes('from "firebase/firestore"')) {
        console.log(`Processing ${file}...`);

        // Remplacer les imports
        content = content.replace(/from ['"]firebase\/firestore['"]/g, "from '@/lib/firebase'");

        // Écrire le fichier modifié
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Updated ${file}`);
    }
});

console.log('\nDone!');
