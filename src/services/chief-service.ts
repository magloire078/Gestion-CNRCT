

import { collection, getDocs, addDoc, onSnapshot, Unsubscribe, query, orderBy, deleteDoc, doc, updateDoc, getDoc, writeBatch, where, setDoc, limit } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { Chief } from '@/lib/data';
import { db, storage } from '@/lib/firebase';
import { FirestorePermissionError } from '@/lib/errors';

const chiefsCollection = collection(db, 'chiefs');

const defaultChiefs: Omit<Chief, 'id'>[] = [
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
  { name: "N'GOU N'GBESSO MARC", lastName: "N'GOU", firstName: "N'GBESSO MARC", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ELEVI", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 146/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "DIBY GNAHOUA JOSEPH", lastName: "DIBY", firstName: "GNAHOUA JOSEPH", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "SAHUYE", region: "AGNEBY-TIASSA", department: "SIKENSI", subPrefecture: "SIKENSI", contact: "", bio: "ARRETE N° 004/RA-T/P.SIK/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "ODIACHO GOGO", lastName: "ODIACHO", firstName: "GOGO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "AZAGUIE-MAKOUGUIE", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "AGBOVILLE", contact: "", bio: "ARRETE N° 65/R.A-T/P.AGBO/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "ESSEHI M'BO MICHEL", lastName: "ESSEHI", firstName: "M'BO MICHEL", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "YAOBOU", region: "AGNEBY-TIASSA", department: "DABOU", subPrefecture: "DABOU", contact: "", bio: "ARRETE N°042/PRL/PD/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "TANO KASSI", lastName: "TANO", firstName: "KASSI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ELLOY-KADJADOU", region: "AGNEBY-TIASSA", department: "SIKENSI", subPrefecture: "SIKENSI", contact: "", bio: "ARRETE N°003/RA-T/P.SIK/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "ABODOU ASSI PIERRE", lastName: "ABODOU", firstName: "ASSI PIERRE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KAKA", region: "AGNEBY-TIASSA", department: "SIKENSI", subPrefecture: "GOMON", contact: "", bio: "ARRETE N° 01/RA-T/P.SIK/SG.1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "AKAFFOU KADJO VINCENT", lastName: "AKAFFOU", firstName: "KADJO VINCENT", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "BRAFFOUEDI", region: "AGNEBY-TIASSA", department: "SIKENSI", subPrefecture: "GOMON", contact: "", bio: "ARRETE N° 04/RA-T/P.SIK/SG.1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "MEMEL LASME", lastName: "MEMEL", firstName: "LASME", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "AKABI-GOMON", region: "AGNEBY-TIASSA", department: "SIKENSI", subPrefecture: "GOMON", contact: "", bio: "ARRETE N° 03/RA-T/P.SIK/SG.1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'GUESSAN DABLE", lastName: "N'GUESSAN", firstName: "DABLE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ADJAME-GOMON", region: "AGNEBY-TIASSA", department: "SIKENSI", subPrefecture: "GOMON", contact: "", bio: "ARRETE N° 02/RA-T/P.SIK/SG.1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "ANOH KADJO", lastName: "ANOH", firstName: "KADJO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ANCIEN-BADEN", region: "AGNEBY-TIASSA", department: "SIKENSI", subPrefecture: "GOMON", contact: "", bio: "ARRETE N° 01/RA-T/P.SIK/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "YACE YACE DESIRE", lastName: "YACE", firstName: "YACE DESIRE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "NOUVEAU-BADEN", region: "AGNEBY-TIASSA", department: "SIKENSI", subPrefecture: "GOMON", contact: "", bio: "ARRETE N°02/RA-T/P.SIK/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "LEBY CHACHA ANSELME", lastName: "LEBY", firstName: "CHACHA ANSELME", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KATADJI", region: "AGNEBY-TIASSA", department: "SIKENSI", subPrefecture: "SIKENSI", contact: "", bio: "ARRETE N° 03/RA-T/P.SIK/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "LATH AKBE", lastName: "LATH", firstName: "AKBE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "YASSAP-B", region: "AGNEBY-TIASSA", department: "SIKENSI", subPrefecture: "SIKENSI", contact: "", bio: "ARRETE N° 002/RA-T/P.SIK/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "M'BOKE MELLED", lastName: "M'BOKE", firstName: "MELLED", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "BÉCEDI", region: "AGNEBY-TIASSA", department: "SIKENSI", subPrefecture: "SIKENSI", contact: "", bio: "ARRETE N° 001/RA-T/P.SIK/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "OBROU ASSI", lastName: "OBROU", firstName: "ASSI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "OBROUDIE", region: "AGNEBY-TIASSA", department: "AGBOVILLE", subPrefecture: "RUBINO", contact: "", bio: "ARRETE N° 19/RA-T/P.AGBO/SG", photoUrl: "https://placehold.co/100x100.png" },
  { name: "ATSE ATSE VINCENT", lastName: "ATSE", firstName: "ATSE VINCENT", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ADAOU", region: "SUD-COMOE", department: "ABOISSO", subPrefecture: "ADAOU", contact: "", bio: "ARRETE N° 038/R.S.C/P.ABSO/SG/B1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "EHOUMAN KOUAME", lastName: "EHOUMAN", firstName: "KOUAME", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "AFFIENOU", region: "SUD-COMOE", department: "ABOISSO", subPrefecture: "MAFERE", contact: "", bio: "ARRETE N° 024/R.S.C/P.ABSO/CAB/B1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "AKA EHIMAN", lastName: "AKA", firstName: "EHIMAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "EBOBO", region: "SUD-COMOE", department: "ABOISSO", subPrefecture: "ABOISSO", contact: "", bio: "ARRETE N° 021/R.S.C/P.ABSO/CAB/B1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'GUESSAN YAPI ANTOINE", lastName: "N'GUESSAN", firstName: "YAPI ANTOINE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ETUEBOUE", region: "SUD-COMOE", department: "ADIAKE", subPrefecture: "ETUEBOUE", contact: "", bio: "ARRETE N° 354/PA-DIA/CAB", photoUrl: "https://placehold.co/100x100.png" },
  { name: "AMETHIER BROU PIERRE", lastName: "AMETHIER", firstName: "BROU PIERRE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "AKPE", region: "SUD-COMOE", department: "ABOISSO", subPrefecture: "ADAOU", contact: "", bio: "ARRETE N° 100/R.S.C/P.ABSO/SG/B1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'GUESSAN NOGBOU", lastName: "N'GUESSAN", firstName: "NOGBOU", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "EHUYE", region: "SUD-COMOE", department: "ABOISSO", subPrefecture: "MAFERE", contact: "", bio: "ARRETE N° 029/R.S.C/P.ABSO/SG/B1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "AKAH EBY PIERRE", lastName: "AKAH", firstName: "EBY PIERRE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KOUAKRO-AGNI", region: "SUD-COMOE", department: "ABOISSO", subPrefecture: "KOUAKRO", contact: "", bio: "ARRETE N° 027/R.S.C/P.ABSO/SG/B1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KADJO ADOU AKA", lastName: "KADJO", firstName: "ADOU AKA", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KADJOKRO", region: "SUD-COMOE", department: "ABOISSO", subPrefecture: "ABOISSO", contact: "", bio: "ARRETE N° 025/R.S.C/P.ABSO/CAB/B1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "EHUI ADOU", lastName: "EHUI", firstName: "ADOU", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KOUASSI-LEGBAKRO", region: "SUD-COMOE", department: "ABOISSO", subPrefecture: "ABOISSO", contact: "", bio: "ARRETE N° 026/R.S.C/P.ABSO/CAB/B1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "ASSAMOI ADOU EDOUARD", lastName: "ASSAMOI", firstName: "ADOU EDOUARD", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "NGUIEME", region: "SUD-COMOE", department: "ABOISSO", subPrefecture: "ABOISSO", contact: "", bio: "ARRETE N° 020/R.S.C/P.ABSO/CAB/B1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "AMON N'GUETTA", lastName: "AMON", firstName: "N'GUETTA", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KOUASSI-KOKOREKRO", region: "SUD-COMOE", department: "ABOISSO", subPrefecture: "ABOISSO", contact: "", bio: "ARRETE N° 030/R.S.C/P.ABSO/SG/B1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "BILÉ YAO", lastName: "BILÉ", firstName: "YAO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "YAOKRO", region: "SUD-COMOE", department: "ABOISSO", subPrefecture: "YAOU", contact: "", bio: "ARRETE N° 023/R.S.C/P.ABSO/CAB/B1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "BOFFO BROU", lastName: "BOFFO", firstName: "BROU", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ADJOUAN", region: "SUD-COMOE", department: "ABOISSO", subPrefecture: "ADJOUAN", contact: "", bio: "ARRETE N° 028/R.S.C/P.ABSO/SG/B1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "ASSIÉ ESSAN", lastName: "ASSIÉ", firstName: "ESSAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ABOISSO-COMOE", region: "SUD-COMOE", department: "ABOISSO", subPrefecture: "ABOISSO", contact: "", bio: "ARRETE N° 022/R.S.C/P.ABSO/CAB/B1", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N’GUESSAN KOFFI AUGUSTE", lastName: "N’GUESSAN", firstName: "KOFFI AUGUSTE", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "SAKASSOU", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 453/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOUAME KONAN", lastName: "KOUAME", firstName: "KONAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ANDOKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "AYAOU-SRAN", contact: "", bio: "ARRETE N° 455/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOUAKOU YA KAN", lastName: "KOUAKOU", firstName: "YA KAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ASSABLI-KOUASSIKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 456/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "YAO KOUAME", lastName: "YAO", firstName: "KOUAME", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ANDOBLEKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 457/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOUAME KOUAKOU ALBERT", lastName: "KOUAME", firstName: "KOUAKOU ALBERT", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "SEKE-KOUASSIKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 458/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOFFI N'DRI", lastName: "KOFFI", firstName: "N'DRI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "N'GBAN-KOUASSIKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 459/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KONAN KOUAME", lastName: "KONAN", firstName: "KOUAME", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KOUMO-KOUASSIKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 461/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'GUESSAN KOUAME", lastName: "N'GUESSAN", firstName: "KOUAME", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "AKUESSIKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 462/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KONAN N'DRI", lastName: "KONAN", firstName: "N'DRI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KPEBO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "AYAOU-SRAN", contact: "", bio: "ARRETE N° 463/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'DRI KOUASSI", lastName: "N'DRI", firstName: "KOUASSI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "AGBAN-KOUAMEKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 465/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KONAN KOUADIO", lastName: "KONAN", firstName: "KOUADIO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ADJENA-KONANKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 466/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOUAKOU N'GUESSAN", lastName: "KOUAKOU", firstName: "N'GUESSAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "BONVOINKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 467/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "YAO KOUAKOU", lastName: "YAO", firstName: "KOUAKOU", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "YABLASU", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 468/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KONAN KOFFI", lastName: "KONAN", firstName: "KOFFI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "N'GATTADOLIKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 469/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'GUESSAN KOUAME", lastName: "N'GUESSAN", firstName: "KOUAME", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "FOUEKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 470/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KONAN KOUAKOU", lastName: "KONAN", firstName: "KOUAKOU", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "SOUAFOUE-N'GUESSANKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 471/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'GORAN KOFFI", lastName: "N'GORAN", firstName: "KOFFI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "N'GOKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 472/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "YAO KONAN", lastName: "YAO", firstName: "KONAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ADJUE-KOUASSIKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "AYAOU-SRAN", contact: "", bio: "ARRETE N° 473/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOUAME KAN", lastName: "KOUAME", firstName: "KAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ADJUE-KONANKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "AYAOU-SRAN", contact: "", bio: "ARRETE N° 474/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'GUESSAN KOUAME", lastName: "N'GUESSAN", firstName: "KOUAME", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "PENGAKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "AYAOU-SRAN", contact: "", bio: "ARRETE N° 475/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOFFI N'GORAN", lastName: "KOFFI", firstName: "N'GORAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "AGBAN-KOUAMEKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "AYAOU-SRAN", contact: "", bio: "ARRETE N° 476/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOUAME KONAN", lastName: "KOUAME", firstName: "KONAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KOKO-YAKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 478/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'DRI KOUADIO", lastName: "N'DRI", firstName: "KOUADIO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ASSANDRE-KOUAMEKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 479/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOUAME KOUAKOU", lastName: "KOUAME", firstName: "KOUAKOU", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KOFESSO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "AYAOU-SRAN", contact: "", bio: "ARRETE N° 480/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KONAN KOUASSI", lastName: "KONAN", firstName: "KOUASSI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "N'ZUE-N'GUESSANKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "AYAOU-SRAN", contact: "", bio: "ARRETE N° 481/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KONAN KONAN", lastName: "KONAN", firstName: "KONAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KONAN-KANKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 482/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'GUESSAN KOUADIO", lastName: "N'GUESSAN", firstName: "KOUADIO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KPEBO-N'GUESSANKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "AYAOU-SRAN", contact: "", bio: "ARRETE N° 483/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'DRI YAO", lastName: "N'DRI", firstName: "YAO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KPEBO-YAOKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "AYAOU-SRAN", contact: "", bio: "ARRETE N° 484/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "YAO KOUADIO", lastName: "YAO", firstName: "KOUADIO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "LAWREBO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 485/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "YA KOUAKOU", lastName: "YA", firstName: "KOUAKOU", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ASSABLI-ALLA", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 486/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOUAME KOUASSI", lastName: "KOUAME", firstName: "KOUASSI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "GOLIBLENOU", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 487/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "YAO KOUAME", lastName: "YAO", firstName: "KOUAME", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ABOKA-N'GUESSANKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 488/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'GUESSAN KOUADIO", lastName: "N'GUESSAN", firstName: "KOUADIO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KOUADIOKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "AYAOU-SRAN", contact: "", bio: "ARRETE N° 490/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOUAME KOUAKOU", lastName: "KOUAME", firstName: "KOUAKOU", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ASSABLI-ALLUI", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 491/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'GORAN KOFFI", lastName: "N'GORAN", firstName: "KOFFI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "MANGRA-KOFFIKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 492/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KONAN KOUADIO", lastName: "KONAN", firstName: "KOUADIO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "FOUEKRO-KONANKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 493/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KONAN N'GUESSAN", lastName: "KONAN", firstName: "N'GUESSAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "FOUEKRO-NGUESSANKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 494/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "YAO KOUADIO", lastName: "YAO", firstName: "KOUADIO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ATIEDO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 495/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOUAKOU YAO", lastName: "KOUAKOU", firstName: "YAO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KAN-YAOKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 496/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'GORAN KOUASSI", lastName: "N'GORAN", firstName: "KOUASSI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "MANGRA-KOUASSIKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 497/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOUAME KAN", lastName: "KOUAME", firstName: "KAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KOKO-KOUAMEKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 498/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOUADIO KONAN", lastName: "KOUADIO", firstName: "KONAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ANDOKRO-KONANKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "AYAOU-SRAN", contact: "", bio: "ARRETE N° 499/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'GUESSAN KOUASSI", lastName: "N'GUESSAN", firstName: "KOUASSI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ABOKA-ALLIKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 500/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KONAN KOUASSI", lastName: "KONAN", firstName: "KOUASSI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "TIEDIABO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 502/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOUAKOU YAO", lastName: "KOUAKOU", firstName: "YAO", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ANDOFFOUE-ADJAME", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 503/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "YAO KOUAKOU", lastName: "YAO", firstName: "KOUAKOU", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "N'DRE-KOUAKOUKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 504/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOUAME KOUASSI", lastName: "KOUAME", firstName: "KOUASSI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KOKO-KOUASSIKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 505/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'GUESSAN KOUAME", lastName: "N'GUESSAN", firstName: "KOUAME", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ADJUE-KOFFIKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "AYAOU-SRAN", contact: "", bio: "ARRETE N° 506/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "YAO KOUAKOU", lastName: "YAO", firstName: "KOUAKOU", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "AGBAN-YAOKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 507/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'GUESSAN KOUASSI", lastName: "N'GUESSAN", firstName: "KOUASSI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "N'ZUE-KOUASSIKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "AYAOU-SRAN", contact: "", bio: "ARRETE N° 508/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOUAME KONAN", lastName: "KOUAME", firstName: "KONAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KOKO-KONANKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 509/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'GORAN KOFFI", lastName: "N'GORAN", firstName: "KOFFI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ATTOUNGBRE", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 510/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KONAN KOUAKOU", lastName: "KONAN", firstName: "KOUAKOU", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "TIEDIABO-KONANKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 511/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'DRI KOUASSI", lastName: "N'DRI", firstName: "KOUASSI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "N'DRE-KOUASSIKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 512/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOUAME KOUAME", lastName: "KOUAME", firstName: "KOUAME", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KOKO-KONANKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 513/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "N'GUESSAN KOFFI", lastName: "N'GUESSAN", firstName: "KOFFI", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "ADJUE-YAOKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "AYAOU-SRAN", contact: "", bio: "ARRETE N° 514/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "KOUAKOU KAN", lastName: "KOUAKOU", firstName: "KAN", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "KOKO-KOUAKOUKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 515/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
  { name: "YAO KOUAME", lastName: "YAO", firstName: "KOUAME", title: "CHEF DE VILLAGE", role: "Chef de Village", village: "FOUEKRO-YAOKRO", region: "GBEKE", department: "SAKASSOU", subPrefecture: "SAKASSOU", contact: "", bio: "ARRETE N° 516/P.BKE/SG/S.LET", photoUrl: "https://placehold.co/100x100.png" },
];

export async function initializeDefaultChiefs() {
    const snapshot = await getDocs(query(chiefsCollection, limit(1)));
    if (snapshot.empty) {
        console.log("No chiefs found, initializing default chief data...");
        await batchAddChiefs(defaultChiefs);
        console.log("Default chiefs initialized.");
    }
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
            const chiefs = snapshot.docs.map(doc => ({
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
    const chiefs = snapshot.docs.map(doc => ({
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
    // Firestore 'in' query can have max 30 elements. We need to chunk it.
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
        try {
            await batch.commit();
        } catch (error: any) {
             if (error.code === 'permission-denied') {
                throw new FirestorePermissionError("Vous n'avez pas la permission d'importer des chefs en masse.", { operation: 'batch-add', path: 'chiefs' });
            }
            throw error;
        }
    }
    return addedCount;
}

export async function updateChief(id: string, chiefData: Partial<Omit<Chief, 'id'>>, photoFile: File | null): Promise<void> {
    const chiefDocRef = doc(db, 'chiefs', id);
    const updateData = { ...chiefData };

    if (photoFile) {
        const photoRef = ref(storage, `chief_photos/${id}/${photoFile.name}`);
        const snapshot = await uploadBytes(photoRef, photoFile);
        const photoUrl = await getDownloadURL(snapshot.ref);
        updateData.photoUrl = photoUrl;
    }

    // Ensure numeric values are stored as numbers
    if (updateData.latitude !== undefined) {
        updateData.latitude = Number(updateData.latitude);
    }
     if (updateData.longitude !== undefined) {
        updateData.longitude = Number(updateData.longitude);
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
