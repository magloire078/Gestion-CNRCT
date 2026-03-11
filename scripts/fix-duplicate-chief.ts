import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

admin.initializeApp({
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
});

const db = admin.firestore();

async function fixDuplicate() {
    const chiefAbodiId = 'lZWC3wZmMTPIWQGbK1gS'; // The one with coordinates
    const chiefAdobiId = 'nVn6vOIqJUeiWZXAadxq'; // The duplicate
    const employeeId = 'rOp5WehK31fRuhZxeMc3';

    console.log('Starting fix for ABODI Ake Placide Guy Marie using Admin SDK...');

    try {
        // 1. Update Employee
        const employeeRef = db.collection('employees').doc(employeeId);
        await employeeRef.update({
            lastName: 'ABODI',
            name: 'ABODI Ake Placide Guy Marie',
            chiefId: chiefAbodiId
        });
        console.log('Updated employee record.');

        // 2. Update Correct Chief (ABODI)
        const chiefAbodiRef = db.collection('chiefs').doc(chiefAbodiId);
        await chiefAbodiRef.update({
            village: 'Akouai-Agban',
            lastName: 'ABODI',
            name: 'ABODI Ake Placide Guy Marie'
        });
        console.log('Updated correct chief record.');

        // 3. Delete Duplicate Chief (ADOBI)
        const chiefAdobiRef = db.collection('chiefs').doc(chiefAdobiId);
        await chiefAdobiRef.delete();
        console.log('Deleted duplicate chief record.');

        console.log('Fix completed successfully.');
    } catch (error) {
        console.error('Error during fix:', error);
    }
}

fixDuplicate();
