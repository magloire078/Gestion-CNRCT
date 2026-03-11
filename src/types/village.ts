export type Village = {
    id: string;

    // Identité administrative
    name: string;
    region: string;
    department: string;
    subPrefecture: string; // Sous-préfecture / Commune
    commune?: string; // Commune if different from subPrefecture
    codeINS?: string; // Code de l'Institut National de la Statistique

    // Situation géographique
    latitude?: number;
    longitude?: number;
    altitude?: number; // en mètres
    distanceFromCapital?: number; // Distance de la capitale (km)
    distanceFromChefLieu?: number; // Distance du chef-lieu du département (km)
    accessRoads?: string; // Type d'accès routier (bitumé, latérite, piste)

    // Démographie
    population?: number;
    populationYear?: number; // Année du recensement
    numberOfHouseholds?: number;
    mainEthnicGroups?: string[];
    languages?: string[];

    // Histoire et culture
    history?: string; // Historique des origines / fondation
    customs?: string; // Us et coutumes
    traditionalPractices?: string;
    annualEvents?: string; // Fêtes et cérémonies annuelles

    // Ressources et économie
    mainActivities?: string[]; // Agriculture, pêche, élevage, artisanat...
    naturalResources?: string;
    mainCrops?: string[];

    // Infrastructure
    hasSchool?: boolean;
    hasHealthCenter?: boolean;
    hasElectricity?: boolean;
    hasWater?: boolean; // Eau potable
    hasMosque?: boolean;
    hasChurch?: boolean;
    hasMarket?: boolean;
    infrastructureNotes?: string;

    // Chefferie
    currentChiefId?: string;
    chiefTitle?: string; // Titre du chef (Chef de village, Roi, Chef de canton...)

    // Médias
    photoUrl?: string;
    photoUrls?: string[]; // Galerie de photos

    // Metadata
    createdAt?: string;
    updatedAt?: string;
    isAutonomousDistrict?: boolean;
};
