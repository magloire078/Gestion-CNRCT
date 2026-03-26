
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { HeritageItem } from '../types/heritage';

const heritageItems: Omit<HeritageItem, 'id'>[] = [
    {
        category: "danses",
        name: "Zaouli",
        ethnicGroup: "Gouro",
        region: "Marahoué",
        village: "Manfla",
        description: "Danse de réjouissance et de masque, le Zaouli est un hommage à la beauté féminine.",
        significance: "Inscrit au patrimoine immatériel de l'UNESCO, il symbolise l'identité culturelle du peuple Gouro.",
        historicalContext: "Créé dans les années 1950, le masque s'inspire d'une jeune fille nommée Djela Lou Zaouli.",
        imageUrl: "https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&q=80",
        latitude: 6.9167,
        longitude: -5.9333,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        category: "masques",
        name: "Goly",
        ethnicGroup: "Baoulé",
        region: "Bélier",
        village: "Bendékouassikro",
        description: "Masque-danse sacré utilisé lors des funérailles de grands chefs ou pour conjurer le mauvais sort.",
        significance: "Représente la puissance protectrice et la médiation entre les vivants et les esprits.",
        historicalContext: "Le Goly a été adopté par les Baoulé après avoir été emprunté au peuple Wan.",
        imageUrl: "https://images.unsplash.com/photo-1523805081730-61444927f07a?auto=format&fit=crop&q=80",
        latitude: 6.8333,
        longitude: -5.2667,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        category: "culinaire",
        name: "Attiéké",
        ethnicGroup: "Lagunaire",
        region: "Grands Ponts",
        village: "Dabou",
        description: "Couscous de manioc fermenté, plat emblématique de la Côte d'Ivoire.",
        significance: "Pilier de la sécurité alimentaire et vecteur d'exportation culturelle.",
        historicalContext: "Originaire des peuples lagunaires (Ebrié, Adjoukrou), il s'est généralisé à tout le pays.",
        imageUrl: "https://images.unsplash.com/photo-1589113103553-4968339304be?auto=format&fit=crop&q=80",
        latitude: 5.3256,
        longitude: -4.3761,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        category: "danses",
        name: "Balafon Senoufo",
        ethnicGroup: "Senoufo",
        region: "Poro",
        village: "Korhogo",
        description: "Xylophone traditionnel accompagné de chants et de danses sacrées.",
        significance: "Instrument central des cérémonies du Poro (initiation).",
        historicalContext: "Pratique ancestrale transmise de génération en génération au sein des bois sacrés.",
        imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80",
        latitude: 9.458,
        longitude: -5.629,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        category: "alliances",
        name: "Alliance Toura-Yacouba",
        ethnicGroup: "Toura / Yacouba",
        region: "Tonkpi",
        village: "Man",
        description: "Pacte de non-agression et d'assistance mutuelle entre les peuples de l'Ouest.",
        significance: "Outil traditionnel de prévention et de résolution des conflits.",
        historicalContext: "Établie pour sceller la paix après des siècles de cohabitation.",
        latitude: 7.4125,
        longitude: -7.5539,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

async function seedHeritage() {
    console.log("Démarrage du peuplement du patrimoine...");
    const heritageCollection = collection(db, 'heritage');
    
    for (const item of heritageItems) {
        try {
            const docRef = await addDoc(heritageCollection, item);
            console.log(`Ajouté : ${item.name} (ID: ${docRef.id})`);
        } catch (error) {
            console.error(`Erreur pour ${item.name}:`, error);
        }
    }
    console.log("Peuplement terminé.");
}

seedHeritage();
