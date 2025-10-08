
import { collection, writeBatch, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Chief } from '@/lib/data';
import { batchAddChiefs } from '@/services/chief-service';

const chiefsData: Omit<Chief, 'id'>[] = [
  { name: "IKPE DEDJE ADOLPHE", lastName: "IKPE", firstName: "DEDJE ADOLPHE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "BABIAHAN", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 32/R.A-T/P.AGBO/SG1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "AMAHOUE KEBE", lastName: "AMAHOUE", firstName: "KEBE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "GUESSIGUIE 1", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 007/R.A/P.AGBO/SG/D1/B1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KONIEN KONIEN ROGER", lastName: "KONIEN", firstName: "KONIEN ROGER", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "DINGBE", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 14/R.A-T/P.AGBO/SG1/T", photoUrl: "https://placehold.co/100x100.png" },
  { name: "NGUESSAN ASSA", lastName: "NGUESSAN", firstName: "ASSA", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "YADIO", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 22/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "GNAMIEN GBAKOU JEAN", lastName: "GNAMIEN", firstName: "GBAKOU JEAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "LOOGUIE", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 55/R.A-T/P.AGBO/SG 2", photoUrl: "https://placehold.co/100x100.png" },
  { name: "AHYBIE DIAGBA OFFORI REMI GUSTAVE", lastName: "AHYBIE", firstName: "DIAGBA OFFORI REMI GUSTAVE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ABOUDE-KOUASSIKRO", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 12/R.A/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "DEDOU BROU GERMAIN", lastName: "DEDOU", firstName: "BROU GERMAIN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KAMABROU", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 32/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "EDI TCHIMOU", lastName: "EDI", firstName: "TCHIMOU", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "GRAND-YAPO", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 60/R.A-T/P.AGBO/SG1/T", photoUrl: "https://placehold.co/100x100.png" },
  { name: "EDI EKISSI ADOLPHE", lastName: "EDI", firstName: "EKISSI ADOLPHE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "BANGUIE 1", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 10/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOFFI KOKOLA RAPHAEL", lastName: "KOFFI", firstName: "KOKOLA RAPHAEL", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "GOUABO", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 47/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "DJAMA OKON BROU BERTRAND", lastName: "DJAMA", firstName: "OKON BROU BERTRAND", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KASSIGUIE", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 55 /R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "NIANGORAN ABODO", lastName: "NIANGORAN", firstName: "ABODO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ABOUDE-MANDEKE", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 008/R.A/P.AGBO/SG/D1/B1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KAREKE CHRISTOPHE", lastName: "KAREKE", firstName: "CHRISTOPHE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ORESS-KROBOU", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 006/R.A/P.AGBO/SG/D1/B1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "DOFFOU DIEKE NOEL", lastName: "DOFFOU", firstName: "DIEKE NOEL", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "PETIT-YAPO", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 30/R.A/AGBO/SG", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KETTE ADJA JEAN", lastName: "KETTE", firstName: "ADJA JEAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ACHIEKOI", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 12/R.A/P.AGBO/SG/D1/B1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'GOU N'GBESSO MARC", lastName: "N'GOU", firstName: "N'GBESSO MARC", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ELEVI", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 146/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "DIBY GNAHOUA JOSEPH", lastName: "DIBY", firstName: "GNAHOUA JOSEPH", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "SAHUYE", region: "AGNEBY-TIASSA", department: "SIKENSI", subPrefecture: "SIKENSI", contact: "", bio: "ARRETE N° 004/RA-T/P.SIK/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "ODIACHO GOGO", lastName: "ODIACHO", firstName: "GOGO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "AZAGUIE-MAKOUGUIE", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 65/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "YAPI BONI", lastName: "YAPI", firstName: "BONI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 08/R.AT/P.AGBO/SG/DTACT", photoUrl: "https://placehold.co/100x100.png" },
  { name: "ESSEHI M'BO MICHEL", lastName: "ESSEHI", firstName: "M'BO MICHEL", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "YAOBOU", region: "AGNEBY-TIASSA", department: "DABOU", subPrefecture: "DABOU", contact: "", bio: "ARRETE N°042/PRL/PD/CAB", photoUrl: "https://placehold.co/100x100.png" },
];

async function seedChiefs() {
  try {
    console.log(`Attempting to seed ${chiefsData.length} chiefs...`);
    const addedCount = await batchAddChiefs(chiefsData);
    console.log(`Seeding complete. ${addedCount} new chiefs were added.`);
  } catch (error) {
    console.error("Error seeding chiefs:", error);
  }
}

// We can call this on server start-up in a dev environment.
seedChiefs();
