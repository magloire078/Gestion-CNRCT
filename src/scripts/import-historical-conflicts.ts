
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Conflict } from '@/types/common';

const historicalConflicts: Omit<Conflict, 'id'>[] = [
    {
        village: "Tiaha (Dabou)",
        district: "Lagunes",
        region: "Grands Ponts",
        type: "Succession",
        description: "Conflit intergénérationnel de succession à la chefferie",
        parties: "YEDE Dagri Abraham (génération Mborman) et DEH Lasme",
        reportedDate: "2016-01-01",
        status: "Résolu",
        impact: "-Socio-politique : Désorganisation socio-politique du pouvoir traditionnel, menace sur la cohésion sociale, conflits intergénérationnels, non-respect des us et coutumes Adjoukrou."
    },
    {
        village: "Akrou (Jacqueville)",
        district: "Lagunes",
        region: "Grands Ponts",
        type: "Succession",
        description: "Du conflit foncier à la contestation de la chefferie",
        parties: "Chef du village contre équipe chef de terre",
        reportedDate: "2016-09-22",
        status: "En cours",
        impact: "-Socio-politique : Désorganisation socio-politique du pouvoir traditionnel, menace sur la cohésion sociale - Economique : Ralentissement de l’activité agricole, baisse de la production agricole"
    },
    {
        village: "San-Pedro",
        district: "Bas-Sassandra",
        region: "San-Pedro",
        type: "Succession",
        description: "Opposition à l’instauration de chefferie cantonale Baoulé dans la Région de San Pedro",
        parties: "Autochtones Kroumen et Allochtones Baoulé",
        reportedDate: "2016-01-02",
        status: "Résolu",
        impact: "-Social : Conflit autochtones – allochtones, menace sur la cohésion social -Économique : Ralentissement des activités économiques locales."
    },
    {
        village: "Ahouakro (Tiassalé)",
        district: "Lagunes",
        region: "Agnébi Tiassa",
        type: "Succession",
        description: "Succession à la chefferie",
        parties: "Chef de village (KOUASSI Amani) et des notables dirigés par NGUESSAN Konan",
        reportedDate: "2018-05-22",
        status: "Résolu",
        impact: "-Socio-politique : Désorganisation socio-politique du pouvoir traditionnel, menace sur la cohésion sociale"
    },
    {
        village: "Gogokro",
        district: "Lacs",
        region: "Bélier",
        type: "Succession",
        description: "Succession à la chefferie",
        parties: "Chef du village et sa famille",
        reportedDate: "2016-07-18",
        status: "En cours",
        impact: "-Socio-politique : Désorganisation socio-politique du pouvoir traditionnel, menace sur la cohésion sociale"
    },
    {
        village: "Minignan",
        district: "Denguélé",
        region: "Folon",
        type: "Succession",
        description: "Succession à la chefferie",
        parties: "Famille régnante contre représentant local du CNRCT",
        reportedDate: "2016-01-03",
        status: "Résolu",
        impact: "-Socio-politique : Désorganisation socio-politique du pouvoir traditionnel, menace sur la cohésion sociale"
    },
    {
        village: "Bondoukou",
        district: "Zanzan",
        region: "Gontougo",
        type: "Succession",
        description: "Problème de chefferie",
        parties: "Roi de Bron contre chef de province",
        reportedDate: "2016-01-04",
        status: "Résolu",
        impact: "-Socio-politique : Désorganisation socio-politique du pouvoir traditionnel, menace sur la cohésion sociale"
    },
    {
        village: "Man",
        district: "Montagnes",
        region: "Tonkpi",
        type: "Succession",
        description: "Conflit pour désignation chef cantonal",
        parties: "Deux chefs traditionnelles",
        reportedDate: "2016-01-05",
        status: "En cours",
        impact: "-Socio-politique : Désorganisation socio-politique du pouvoir traditionnel, menace sur la cohésion sociale"
    }
];

async function importConflicts() {
    const conflictsCollection = collection(db, 'conflicts');
    console.log(`Starting import of ${historicalConflicts.length} conflicts...`);
    
    for (const conflict of historicalConflicts) {
        try {
            const docRef = await addDoc(conflictsCollection, conflict);
            console.log(`Successfully added conflict: ${conflict.village} (ID: ${docRef.id})`);
        } catch (error) {
            console.error(`Error adding conflict for ${conflict.village}:`, error);
        }
    }
    
    console.log("Import completed!");
}

importConflicts().catch(console.error);
