

import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, deleteDoc, doc, updateDoc, getDoc, writeBatch, where, setDoc, limit } from '@/lib/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { Chief, ChiefRole } from '@/lib/data';
import { db, storage } from '@/lib/firebase';
import { FirestorePermissionError } from '@/lib/errors';

const chiefsCollection = collection(db, 'chiefs');

const defaultChiefs: Omit<Chief, 'id'>[] = [
    // Existing data
    { name: "KOFFI GUETTA SATURNIN", lastName: "KOFFI", firstName: "GUETTA SATURNIN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "EBOUASSUE", region: "INDENIE-DJUABLIN", department: "ABENGOUROU", subPrefecture: "ABENGOUROU", contact: "", bio: "ARRETE N°87/RID/PA/SG-DAGD", photoUrl: "https://placehold.co/100x100.png" },
    { name: "TIEMELE NIANGORAN", lastName: "TIEMELE", firstName: "NIANGORAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KOUAME-TIEMELEKRO", region: "INDENIE-DJUABLIN", department: "ABENGOUROU", subPrefecture: "ABENGOUROU", contact: "", bio: "ARRETE N° 109 RID/PA/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "AHYBIE DIAGBA OFFORI REMI GUSTAVE", lastName: "AHYBIE", firstName: "DIAGBA OFFORI REMI GUSTAVE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ABOUDE-KOUASSIKRO", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 12/R.A/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "AMAHOUE KEBE", lastName: "AMAHOUE", firstName: "KEBE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "GUESSIGUIE 1", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 007/R.A/P.AGBO/SG/D1/B1", photoUrl: "https://placehold.co/100x100.png" },
    { name: "DEDOU BROU GERMAIN", lastName: "DEDOU", firstName: "BROU GERMAIN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KAMABROU", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 32/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "DJAMA OKON BROU BERTRAND", lastName: "DJAMA", firstName: "OKON BROU BERTRAND", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KASSIGUIE", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 55 /R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "DOFFOU DIEKE NOEL", lastName: "DOFFOU", firstName: "DIEKE NOEL", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "PETIT-YAPO", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 30/R.A/AGBO/SG", photoUrl: "https://placehold.co/100x100.png" },
    { name: "EDI EKISSI ADOLPHE", lastName: "EDI", firstName: "EKISSI ADOLPHE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "BANGUIE 1", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 10/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "EDI TCHIMOU", lastName: "EDI", firstName: "TCHIMOU", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "GRAND-YAPO", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 60/R.A-T/P.AGBO/SG1/T", photoUrl: "https://placehold.co/100x100.png" },
    { name: "GNAMIEN GBAKOU JEAN", lastName: "GNAMIEN", firstName: "GBAKOU JEAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "LOOGUIE", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 55/R.A-T/P.AGBO/SG 2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "IKPE DEDJE ADOLPHE", lastName: "IKPE", firstName: "DEDJE ADOLPHE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "BABIAHAN", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 32/R.A-T/P.AGBO/SG1", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KAREKE CHRISTOPHE", lastName: "KAREKE", firstName: "CHRISTOPHE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ORESS-KROBOU", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 006/R.A/P.AGBO/SG/D1/B1", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KETTE ADJA JEAN", lastName: "KETTE", firstName: "ADJA JEAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ACHIEKOI", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N°  12/R.A/P.AGBO/SG/D1/B1", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KOFFI KOKOLA RAPHAEL", lastName: "KOFFI", firstName: "KOKOLA RAPHAEL", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "GOUABO", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 47/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KONIEN KONIEN ROGER", lastName: "KONIEN", firstName: "KONIEN ROGER", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "DINGBE", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 14/R.A-T/P.AGBO/SG1/T", photoUrl: "https://placehold.co/100x100.png" },
    { name: "N'GOU N'GBESSO MARC", lastName: "N'GOU", firstName: "N'GBESSO MARC", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ELEVI", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N°  146/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "NGUESSAN ASSA", lastName: "NGUESSAN", firstName: "ASSA", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "YADIO", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 22/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "NIANGORAN ABODO", lastName: "NIANGORAN", firstName: "ABODO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ABOUDE-MANDEKE", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 008/R.A/P.AGBO/SG/D1/B1", photoUrl: "https://placehold.co/100x100.png" },
    { name: "ODIACHO GOGO", lastName: "ODIACHO", firstName: "GOGO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "AZAGUIE-MAKOUGUIE", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 65/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "YAPI BONI", lastName: "YAPI", firstName: "BONI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 08/R.AT/P.AGBO/SG/DTACT", photoUrl: "https://placehold.co/100x100.png" },
    { name: "AGNINI AMANKOU ISSOUF", lastName: "AGNINI", firstName: "AMANKOU ISSOUF", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "AMANGOBO", region: "INDENIE-DJUABLIN", department: "AGNIBILEKRO", subPrefecture: "AGNIBILEKRO", contact: "", bio: "N°026/P-AGNI/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "ANZIAN KOUAKOU BASSIA", lastName: "ANZIAN", firstName: "KOUAKOU BASSIA", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "MOREKRO", region: "INDENIE-DJUABLIN", department: "AGNIBILEKRO", subPrefecture: "AGNIBILEKRO", contact: "", bio: "N°027/P-AGNI/SG", photoUrl: "https://placehold.co/100x100.png" },
    { name: "BRAHIMA OUATTARA", lastName: "BRAHIMA", firstName: "OUATTARA", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ADAMANKRO", region: "INDENIE-DJUABLIN", department: "AGNIBILEKRO", subPrefecture: "AGNIBILEKRO", contact: "", bio: "N°078/P-AGNI/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "MAMADOU KOUASSI PLI ADAMA", lastName: "MAMADOU", firstName: "KOUASSI PLI ADAMA", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "MASSAKRO", region: "INDENIE-DJUABLIN", department: "AGNIBILEKRO", subPrefecture: "AGNIBILEKRO", contact: "", bio: "N°027/P-AGNI/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "AMOIKON KOFFI KOUAO BILE JEAN-BAPTISTE", lastName: "AMOIKON", firstName: "KOFFI KOUAO BILE JEAN-BAPTISTE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ASSUAME", region: "INDENIE-DUABLIN", department: "AGNIBILEKROU", subPrefecture: "AGNIBILEKROU", contact: "", bio: "ARRETE N° 22/P-AGNI/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "ESSEHI M'BO MICHEL", lastName: "ESSEHI", firstName: "M'BO MICHEL", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "YAOBOU", region: "AGNEBY-TIASSA", department: "DABOU", subPrefecture: "DABOU", contact: "", bio: "ARRETE N°042/PRL/PD/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "BAILLY DODOZ EDOUARD", lastName: "BAILLY", firstName: "DODOZ EDOUARD", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KRIKOREA 1", region: "HAUT-SASSANDRA", department: "DALOA", subPrefecture: "DALOA", contact: "", bio: "ARRETE N°11/R.H-S/PD/SG1", photoUrl: "https://placehold.co/100x100.png" },
    { name: "BLE ZOUZOUKO ETIENNE", lastName: "BLE", firstName: "ZOUZOUKO ETIENNE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "LOBOGUIGUIA", region: "HAUT-SASSANDRA", department: "DALOA", subPrefecture: "DALOA", contact: "", bio: "ARRETE N°60 R.H-S/PD/SG1", photoUrl: "https://placehold.co/100x100.png" },
    { name: "GRAHOUAN LOUE LAZARE", lastName: "GRAHOUAN", firstName: "LOUE LAZARE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ZOBEA", region: "HAUT-SASSANDRA", department: "DALOA", subPrefecture: "DALOA", contact: "", bio: "ARRETE N° 98/R.H-S/PD/SG2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KORE ZABGO BENJAMIN", lastName: "KORE", firstName: "ZABGO BENJAMIN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "GOSSEA", region: "HAUT-SASSANDRA", department: "DALOA", subPrefecture: "DALOA", contact: "", bio: "ARRETE N°138/R.H-S/PD/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "LAGO GUEDE LAURENT", lastName: "LAGO", firstName: "GUEDE LAURENT", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "DAGBABOUA", region: "HAUT-SASSANDRA", department: "DALOA", subPrefecture: "DALOA", contact: "", bio: "ARRETE N° 82/R.H-S/PD/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "LEGRE BOLOU MATHURIN", lastName: "LEGRE", firstName: "BOLOU MATHURIN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "NIAMAYO", region: "HAUT-SASSANDRA", department: "DALOA", subPrefecture: "DALOA", contact: "", bio: "ARRETE N° 007/PD/SG2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "MEGUHE SERY LEON", lastName: "MEGUHE", firstName: "SERY LEON", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "BATEGUEDEA II", region: "HAUT SASSANDRA", department: "DALOA", subPrefecture: "DALOA", contact: "", bio: "ARRETE N°20/PD/SG2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "BAKAYOKO BOGNAN", lastName: "BAKAYOKO", firstName: "BOGNAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KATIALI", region: "BERE", department: "DIANRA", subPrefecture: "DIANRA", contact: "", bio: "N°", photoUrl: "https://placehold.co/100x100.png" },
    { name: "COULIBALY FONAN", lastName: "COULIBALY", firstName: "FONAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "CISSEDOUGOU", region: "BERE", department: "DIANRA", subPrefecture: "DIANRA", contact: "", bio: "N°", photoUrl: "https://placehold.co/100x100.png" },
    { name: "COULIBALY SEYDOU", lastName: "COULIBALY", firstName: "SEYDOU", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "BALLODOUGOU", region: "BERE", department: "DIANRA", subPrefecture: "DIANRA", contact: "", bio: "N°", photoUrl: "https://placehold.co/100x100.png" },
    { name: "DIABAGATE DOMEHE", lastName: "DIABAGATE", firstName: "DOMEHE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "DIANRA", region: "BERE", department: "DIANRA", subPrefecture: "DIANRA", contact: "", bio: "N°03/R,B/P,DI/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "DIALLO DAOUDA", lastName: "DIALLO", firstName: "DAOUDA", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "MANANDOUGOU", region: "BERE", department: "DIANRA", subPrefecture: "DIANRA", contact: "", bio: "N°", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KONE NAMBEGUE", lastName: "KONE", firstName: "NAMBEGUE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "YERETIELE", region: "BERE", department: "DIANRA", subPrefecture: "DIANRA", contact: "", bio: "N°", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KONE NANOURGO", lastName: "KONE", firstName: "NANOURGO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "LENGUEDOUGOU", region: "BERE", department: "DIANRA", subPrefecture: "DIANRA", contact: "", bio: "N°13//R,B/P DI/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "BROU LOUKOU", lastName: "BROU", firstName: "LOUKOU", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "AGNERE-KOFFIKRO", region: "N'ZI", department: "DIMBOKRO", subPrefecture: "DIMBOKRO", contact: "", bio: "N°41/PRN/PD/SG2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KOFFI BOHOUSSOU", lastName: "KOFFI", firstName: "BOHOUSSOU", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ADAHOU", region: "N'ZI", department: "DIMBOKRO", subPrefecture: "DIMBOKRO", contact: "", bio: "N°21/RNC/P.DIMB/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KOUACOU KOFFI", lastName: "KOUACOU", firstName: "KOFFI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "FAAFOUET ETTIENKRO", region: "N'ZI", department: "DIMBOKRO", subPrefecture: "DIMBOKRO", contact: "", bio: "N°31/RNC/P.DIMB/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KOUADIO KOFFI ANTOINE", lastName: "KOUADIO", firstName: "KOFFI ANTOINE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "TIEMELE-ANDOKRO", region: "N'ZI", department: "DIMBOKRO", subPrefecture: "DIMBOKRO", contact: "", bio: "N°83/PRN/PD/SG2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KOUADIO KOUADIO", lastName: "KOUADIO", firstName: "KOUADIO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "DIERI-KOUASSIKRO", region: "N'ZI", department: "DIMBOKRO", subPrefecture: "DIMBOKRO", contact: "", bio: "N°54/PRN/PD/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KOUAKOU KOUAME", lastName: "KOUAKOU", firstName: "KOUAME", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ANGOUAKOUKRO", region: "N'ZI", department: "DIMBOKRO", subPrefecture: "DIMBOKRO", contact: "", bio: "N°40", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KOUAME BELLA", lastName: "KOUAME", firstName: "BELLA", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "TRIANIKRO", region: "N'ZI", department: "DIMBOKRO", subPrefecture: "DIMBOKRO", contact: "", bio: "N°12/BNC/P.DIMB/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "NA KOFFI JEAN JACQUES", lastName: "NA", firstName: "KOFFI JEAN JACQUES", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ANGAN-KONANKRO", region: "N'ZI", department: "DIMBOKRO", subPrefecture: "DIMBOKRO", contact: "", bio: "N°29/RN/PD", photoUrl: "https://placehold.co/100x100.png" },
    { name: "N'DRI KOUAKOU", lastName: "N'DRI", firstName: "KOUAKOU", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KOMIEN KOUASSIKRO", region: "N'ZI", department: "DIMBOKRO", subPrefecture: "DIMBOKRO", contact: "", bio: "N°20/PRN/PD/SG2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "N'GATTA KONAN BERTHELEMY", lastName: "N'GATTA", firstName: "KONAN BERTHELEMY", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "EDIAKRO", region: "N'ZI", department: "DIMBOKRO", subPrefecture: "DIMBOKRO", contact: "", bio: "N°31/PRN/PD/SG2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "YAO DJE NESTOR", lastName: "YAO", firstName: "DJE NESTOR", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ABIGUI", region: "N'ZI", department: "DIMBOKRO", subPrefecture: "DIMBOKRO", contact: "", bio: "N°33/PRN/PD/SG2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "ADJI DJEDJE BERNARD", lastName: "ADJI", firstName: "DJEDJE BERNARD", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KARAHI", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°157/PG/SG/D1/B2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "AGBOLE GNAHOUA ALEXANDRE", lastName: "AGBOLE", firstName: "GNAHOUA ALEXANDRE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "DIKOUEHIPALEGNOA", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°286/PG/SG/D1/B2G", photoUrl: "https://placehold.co/100x100.png" },
    { name: "ALLOH DABIE LAMBERT", lastName: "ALLOH", firstName: "DABIE LAMBERT", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KEHI-GBAHI", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°121/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "ANI OBOU MARCELLIN", lastName: "ANI", firstName: "OBOU MARCELLIN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "PISSEKOU", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°028/PG/SG1/D1/B2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "ANY OKOU JEAN-BAPTISTE", lastName: "ANY", firstName: "OKOU JEAN-BAPTISTE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "DJEREGOUE", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°16/PG/SG/D1/B2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "AUGUSTIN DEKPO", lastName: "AUGUSTIN", firstName: "DEKPO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ZIGOPA", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°019/PG/SG1/D1/B2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "BAILLY KOFFO EDOUARD", lastName: "BAILLY", firstName: "KOFFO EDOUARD", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "OLIBRIBOUO", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°119/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "BLEMA GOKOU PAUL", lastName: "BLEMA", firstName: "GOKOU PAUL", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "BASSI", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "N°26/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "BLEY BLAISE", lastName: "BLEY", firstName: "BLAISE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KPOGROBRE", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°085/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "BOGA DAGO JOACHIM", lastName: "BOGA", firstName: "DAGO JOACHIM", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "GNALEGRIBOUO", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°043/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "BOLI CAMILLE", lastName: "BOLI", firstName: "CAMILLE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "OURAGAHIO", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°126/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "DAGROU PAUL", lastName: "DAGROU", firstName: "PAUL", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "SAKUA", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°038/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "DALLYS MOLOKO ANDRE", lastName: "DALLYS", firstName: "MOLOKO ANDRE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "GNALIEPA", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°090/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "DALOUAMENE OTRAUD SYLVAIN", lastName: "DALOUAMENE", firstName: "OTRAUD SYLVAIN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "BAROUHIO", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°013/PG/SG1/D1/B2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "DANO DOUAHI MATHURIN", lastName: "DANO", firstName: "DOUAHI MATHURIN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "DAHOPA", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°056/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "DANO WELEGA NORBERT", lastName: "DANO", firstName: "WELEGA NORBERT", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "NIARIHIO", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°052 PG/SG1/D1/B2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "DEDGRE TRE AIME", lastName: "DEDGRE", firstName: "TRE AIME", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ZAKOA", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°201/PG/SG/D1/B2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "DIGBEU KOUDOU FRANCOIS", lastName: "DIGBEU", firstName: "KOUDOU FRANCOIS", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "TEHIRI", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°119/PG/SG/D1/B2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "DIMI ZOANE LUC", lastName: "DIMI", firstName: "ZOANE LUC", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "MAHIBOUO", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°140/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "DIZOE BLO ROBERT", lastName: "DIZOE", firstName: "BLO ROBERT", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "GUIBEROUA", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°006/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "DJEDJE DJEGNA HUBERT", lastName: "DJEDJE", firstName: "DJEGNA HUBERT", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KEBEHOA", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°145/PG/SG/D1/B3", photoUrl: "https://placehold.co/100x100.png" },
    { name: "DJEDJE ZAHUI JEROME", lastName: "DJEDJE", firstName: "ZAHUI JEROME", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "DAHIEPA-KEHI", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°207/PG/SG/D1/B3", photoUrl: "https://placehold.co/100x100.png" },
    { name: "DOBLE YOLLO NOEL", lastName: "DOBLE", firstName: "YOLLO NOEL", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "MENEKRE", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°141/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "DOTE ZEGUILE", lastName: "DOTE", firstName: "ZEGUILE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ATONIHIO", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°152/PG/SG/D1/B2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "GABOU GNALE BONIFACE", lastName: "GABOU", firstName: "GNALE BONIFACE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "TIETIEKOU", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°143/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "GBALOU IRIGOUA ARSENE", lastName: "GBALOU", firstName: "IRIGOUA ARSENE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "GUEMENEDOU", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°155/PG/SG/D1/B2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "GBOGOU GUEDE", lastName: "GBOGOU", firstName: "GUEDE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "INAGBEHIO", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°123/PG/SG/D1/B2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "GNAGNO KADI ADOLPHE", lastName: "GNAGNO", firstName: "KADI ADOLPHE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KPAPEKOU", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°115/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "GNAHORE DOMINIQUE", lastName: "GNAHORE", firstName: "DOMINIQUE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "TAKOA", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°086/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "GNAHORET ABOUSSOU MATHURIN", lastName: "GNAHORET", firstName: "ABOUSSOU MATHURIN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "BAYEKOU-BASSI", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°174/PG/SG/D1/B2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "GNAHORET JOACHIM", lastName: "GNAHORET", firstName: "JOACHIM", title: "CHEF DE VILLage", role: "Chef de Village", village: "DONHLO-MALEHIO", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°064/PG/SG/D1/B2 G", photoUrl: "https://placehold.co/100x100.png" },
    { name: "GNAHOUA BRICA MICHEL", lastName: "GNAHOUA", firstName: "BRICA MICHEL", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "BROKOHIO", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°121/PG/SG/D1/B2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "GNAKALE BRICE", lastName: "GNAKALE", firstName: "BRICE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "DALIGUEPA", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°061/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "GOHOU LEGRE PIERRE", lastName: "GOHOU", firstName: "LEGRE PIERRE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "MAGUEHIO", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°042/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "GREHOURI DADOUE TOUSSAINT", lastName: "GREHOURI", firstName: "DADOUE TOUSSAINT", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "BADIEPA", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°102/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "GUIEDA TOKY LEOPOLD", lastName: "GUIEDA", firstName: "TOKY LEOPOLD", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "BRIEHOA", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°079/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KABO AMPHONSE", lastName: "KABO", firstName: "AMPHONSE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "GNAGBODOUGNOA", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°048/PG/SG/D1/B2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KATIE GNAZALE ROBERT", lastName: "KATIE", firstName: "GNAZALE ROBERT", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ZEGREPZ", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°175/PG/SG/D1/B2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KESSIE OURAGA PIERRE", lastName: "KESSIE", firstName: "OURAGA PIERRE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "BRIHI", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°067/PG/SG/D1/B2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KOUAGOUE SAHONE BRUNO", lastName: "KOUAGOUE", firstName: "SAHONE BRUNO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "OUREPA", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°070/PG/SG1/D1/B2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KOUASSI OURAGA BERTIN", lastName: "KOUASSI", firstName: "OURAGA BERTIN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "MAMA", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°019/PG/SG/D1/B2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KOUDOU ARISTIDE DESIRE", lastName: "KOUDOU", firstName: "ARISTIDE DESIRE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "MAGBEHIGOUEPA", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°059/PG/SG1/D1/B2", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KOUDOU DENIS", lastName: "KOUDOU", firstName: "DENIS", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "GARAHIO", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°061/PG/SG/D1/B2G", photoUrl: "https://placehold.co/100x100.png" },
    { name: "KOUDOUGON DEGRET", lastName: "KOUDOUGON", firstName: "DEGRET", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "GRAND-ZIA", region: "GOH", department: "GAGNOA", subPrefecture: "GAGNOA", contact: "", bio: "ARRETE N°134/RG/PG/CAB", photoUrl: "https://placehold.co/100x100.png" },
];

let defaultChiefsInitialized = false;

export async function initializeDefaultChiefs() {
    if (defaultChiefsInitialized) return;
    const snapshot = await getDocs(query(chiefsCollection, limit(1)));
    if (snapshot.empty) {
        console.log("No chiefs found, initializing default chiefs...");
        await batchAddChiefs(defaultChiefs);
    } else {
        console.log("Chiefs collection is not empty, skipping initialization.");
    }
    defaultChiefsInitialized = true;
}


const sortChiefs = (chiefs: Chief[]): Chief[] => {
    return chiefs.sort((a, b) => {
        const lastNameCompare = (a.lastName || '').localeCompare(b.lastName || '');
        if (lastNameCompare !== 0) {
            return lastNameCompare;
        }
        return (a.firstName || '').localeCompare(b.firstName || '');
    });
};


export function subscribeToChiefs(
    callback: (chiefs: Chief[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(chiefsCollection, orderBy("lastName", "asc"));
    const unsubscribe = onSnapshot(q,
        (snapshot) => {
            const chiefs = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            } as Chief));
            callback(sortChiefs(chiefs));
        },
        (error) => {
            console.error("Error subscribing to chiefs:", error);
            onError(error);
        }
    );
    return unsubscribe;
}

export async function getChiefs(): Promise<Chief[]> {
    await initializeDefaultChiefs();
    const snapshot = await getDocs(query(chiefsCollection, orderBy("lastName", "asc")));
    const chiefs = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
    } as Chief));
    return sortChiefs(chiefs);
}

export async function getChief(id: string): Promise<Chief | null> {
    if (!id) return null;
    const chiefDocRef = doc(db, 'chiefs', id);
    const docSnap = await getDoc(chiefDocRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Chief;
    }
    return null;
}

export async function addChief(chiefData: Omit<Chief, "id">, photoFile: File | null): Promise<Chief> {
    let photoUrl = 'https://placehold.co/100x100.png';
    const docRef = doc(collection(db, "chiefs"));

    if (photoFile) {
        const photoRef = ref(storage, `chief_photos/${docRef.id}/${photoFile.name}`);
        const snapshot = await uploadBytes(photoRef, photoFile);
        photoUrl = await getDownloadURL(snapshot.ref);
    }

    const finalChiefData = { ...chiefData, photoUrl };
    try {
        await setDoc(docRef, finalChiefData);
        return { id: docRef.id, ...finalChiefData };
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError("Vous n'avez pas la permission d'ajouter un nouveau chef.", { operation: 'add', path: 'chiefs' });
        }
        throw error;
    }
}

export async function batchAddChiefs(chiefs: Omit<Chief, 'id'>[]): Promise<number> {
    const batch = writeBatch(db);
    const chiefNames = chiefs.map(c => c.name);

    const existingNames = new Set<string>();

    for (let i = 0; i < chiefNames.length; i += 30) {
        const chunk = chiefNames.slice(i, i + 30);
        if (chunk.length > 0) {
            const existingChiefsQuery = query(chiefsCollection, where('name', 'in', chunk));
            const existingSnapshot = await getDocs(existingChiefsQuery);
            existingSnapshot.docs.forEach(d => existingNames.add(d.data().name));
        }
    }

    let addedCount = 0;
    chiefs.forEach(chief => {
        if (!existingNames.has(chief.name)) {
            const newDocRef = doc(chiefsCollection); // Auto-generate ID
            batch.set(newDocRef, chief);
            addedCount++;
        }
    });

    if (addedCount > 0) {
        console.log(`Adding ${addedCount} new chiefs to the database.`);
        try {
            await batch.commit();
        } catch (error: any) {
            if (error.code === 'permission-denied') {
                throw new FirestorePermissionError("Vous n'avez pas la permission d'importer des chefs en masse.", { operation: 'batch-add', path: 'chiefs' });
            }
            throw error;
        }
    } else {
        console.log("No new chiefs to add. All items from the list already exist.");
    }
    return addedCount;
}

export async function updateChief(id: string, chiefData: Partial<Omit<Chief, 'id'>>, photoFile: File | null): Promise<void> {
    const chiefDocRef = doc(db, 'chiefs', id);
    const updateData: { [key: string]: any } = { ...chiefData };

    if (photoFile) {
        const photoRef = ref(storage, `chief_photos/${id}/${photoFile.name}`);
        const snapshot = await uploadBytes(photoRef, photoFile);
        const photoUrl = await getDownloadURL(snapshot.ref);
        updateData.photoUrl = photoUrl;
    }

    // Ensure numeric values are stored as numbers
    if (updateData.latitude !== undefined && updateData.latitude !== null) {
        updateData.latitude = Number(updateData.latitude);
    }
    if (updateData.longitude !== undefined && updateData.longitude !== null) {
        updateData.longitude = Number(updateData.longitude);
    }

    // Convert comma-separated string to array for languages
    if (typeof updateData.languages === 'string') {
        updateData.languages = updateData.languages.split(',').map((s: string) => s.trim()).filter(Boolean);
    }


    // Remove any keys with undefined values before sending to Firestore
    Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
            delete updateData[key as keyof typeof updateData];
        }
    });

    try {
        await updateDoc(chiefDocRef, updateData);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError(`Vous n'avez pas la permission de modifier le chef ${chiefData.name}.`, { operation: 'update', path: `chiefs/${id}` });
        }
        throw error;
    }
}

export async function deleteChief(id: string): Promise<void> {
    const chiefDocRef = doc(db, 'chiefs', id);
    try {
        await deleteDoc(chiefDocRef);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new FirestorePermissionError(`Vous n'avez pas la permission de supprimer ce chef.`, { operation: 'delete', path: `chiefs/${id}` });
        }
        throw error;
    }
}
