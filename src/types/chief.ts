export type ChiefRole = "Roi" | "Chef de province" | "Chef de canton" | "Chef de tribu" | "Chef de Village";
export type DesignationMode = "Héritage" | "Élection" | "Nomination coutumière" | "Autre";


export type Chief = {
    id: string;
    name: string;
    lastName?: string;
    firstName?: string;
    title: string;
    role: ChiefRole;
    designationDate?: string;
    designationMode?: DesignationMode;
    region: string;
    department: string;
    subPrefecture: string;
    village: string;
    ethnicGroup?: string;
    customs?: string;
    languages?: string[];
    contact: string;
    email?: string;
    address?: string;
    cnrctRegistrationNumber?: string;
    officialDocuments?: string;
    bio: string;
    photoUrl: string;
    territoryMapUrl?: string;
    latitude?: number;
    longitude?: number;
    parentChiefId?: string | null;
    sexe?: 'Homme' | 'Femme' | 'Autre';
    dateOfBirth?: string;
    regencyStartDate?: string;
    regencyEndDate?: string;
};

export type Custom = {
    id: string;
    ethnicGroup: string;
    regions: string; // Comma-separated
    languages: string; // Comma-separated
    historicalOrigin: string; // Text
    socialStructure: string; // Text
    politicalStructure: string; // Text
    successionSystem: string; // Text
    traditionalMarriage: string; // Text
    funerals: string; // Text
    initiations: string; // Text
    celebrations: string; // Text
    beliefs: string; // Text
    religiousPractices: string; // Text
    sacredPlaces: string; // Text
    culturalSymbols: string; // Text
    normsAndValues: string; // Text
    conflictResolutionSystem: string; // Text
    modernityImpact: string;
    preservationInitiatives: string;
    intergenerationalTransmission: string;
};
