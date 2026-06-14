import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

const serviceAccount = require('../serviceAccountKey.json');

if (getApps().length === 0) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}

const db = getFirestore();

async function findAney() {
    try {
        const employeesRef = db.collection('employees');
        const snapshot = await employeesRef.get();
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const fullName = `${data.lastName || ''} ${data.firstName || ''}`.trim() || data.name || '';
            if (fullName.toLowerCase().includes('aney firmin')) {
                console.log(`ID: ${doc.id}`);
                console.log(`Name: ${fullName}`);
                console.log(`Poste: ${data.poste}`);
                console.log(`Region: "${data.Region}"`);
                console.log(`Status: ${data.status}`);
            }
        });
        
        process.exit(0);
    } catch (e) {
        console.error(e);
    }
}

findAney();
