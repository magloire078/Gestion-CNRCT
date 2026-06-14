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

async function mergeAgnimel() {
    try {
        const employeeToDelete = 'J4rTCtYHVNwcsLx6otWT';
        const chiefToDelete = 'K2tJm9VU3Hq5eM99YWdV';
        
        console.log(`Deleting employee: ${employeeToDelete}`);
        await db.collection('employees').doc(employeeToDelete).delete();
        
        console.log(`Deleting chief: ${chiefToDelete}`);
        await db.collection('chiefs').doc(chiefToDelete).delete();
        
        console.log("Merge completed.");
        process.exit(0);
    } catch (e) {
        console.error(e);
    }
}

mergeAgnimel();
