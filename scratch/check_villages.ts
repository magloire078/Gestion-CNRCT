
import { db } from './src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function checkData() {
    try {
        const vSnap = await getDocs(collection(db, 'villages'));
        console.log(`Villages count: ${vSnap.size}`);
        vSnap.docs.forEach(d => console.log(` - ${d.data().name}`));

        const cSnap = await getDocs(collection(db, 'chiefs'));
        console.log(`Chiefs count: ${cSnap.size}`);
    } catch (e) {
        console.error("Error checking data:", e);
    }
}

checkData();
