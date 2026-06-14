import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = require('../serviceAccountKey.json');

if (getApps().length === 0) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}

const db = getFirestore();

async function findDuplicates() {
    const employeesRef = db.collection('employees');
    const snapshot = await employeesRef.get();
    
    const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    
    const nameMap = new Map<string, any[]>();
    
    employees.forEach(emp => {
        const fullName = `${emp.lastName || ''} ${emp.firstName || ''}`.trim().toLowerCase();
        if (fullName) {
            if (!nameMap.has(fullName)) {
                nameMap.set(fullName, []);
            }
            nameMap.get(fullName)!.push(emp);
        }
    });
    
    const duplicates = Array.from(nameMap.entries()).filter(([name, emps]) => emps.length > 1);
    
    console.log(`Found ${duplicates.length} employees with potential duplicate profiles:`);
    
    duplicates.forEach(([name, emps]) => {
        console.log(`\nName: ${name}`);
        emps.forEach(emp => {
            console.log(` - ID: ${emp.id}, Poste: ${emp.poste}, Dept: ${emp.departmentId}, Status: ${emp.status}`);
        });
    });
}

findDuplicates().catch(console.error);
