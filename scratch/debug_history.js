
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './src/lib/firebase';

async function checkHistory(employeeId) {
    console.log(`Checking history for ${employeeId}...`);
    const historyCollection = collection(db, `employees/${employeeId}/history`);
    const q = query(historyCollection, orderBy("effectiveDate", "desc"));
    const snapshot = await getDocs(q);
    
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`--- Event ID: ${doc.id} ---`);
        console.log(`Type: ${data.eventType}`);
        console.log(`Effective Date: ${data.effectiveDate} (Type: ${typeof data.effectiveDate})`);
        console.log(`Details:`, JSON.stringify(data.details, null, 2));
    });
}

const employeeId = 'H72LLoLxlW7r5K4gfi7A';
checkHistory(employeeId).catch(console.error);
