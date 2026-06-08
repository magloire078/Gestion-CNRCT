export type ChiefRole = "Roi" | "Chef de province" | "Chef de canton" | "Chef de tribu" | "Chef de Village";
export type DesignationMode = "Héritage" | "Élection" | "Nomination coutumière" | "Autre";
export type ChiefArchiveReason = "Décès" | "Déchéance" | "Démission" | "Succession générationnelle" | "Autre";

export type ChiefCareerEventType = "Intronisation" | "Médaille" | "Médiation" | "Mission" | "Autre";

export type ChiefCareerEvent = {
    id: string;
    date: string;
    title: string;
    description: string;
    type: ChiefCareerEventType;
};

export type Predecessor = {
    id: string;
    name: string;
    period: string; // e.g. "1990 - 2010"
    notes?: string;
};

export type Chief = {
    id: string;
    name: string;
    lastName?: string;
    firstName?: string;
    title: string;
    role: ChiefRole;
    additionalRoles?: ChiefRole[];
    cnrctAffiliation?: 'Directoire' | 'Comité Régional' | 'Aucune';
    designationDate?: string;
    throneAccessionDate?: string;
    designationMode?: DesignationMode;
    districtId?: string;
    regionId?: string;
    departmentId?: string;
    subPrefectureId?: string;
    region: string;
    department: string;
    subPrefecture: string;
    village: string;

    // Customary Domains
    royaumeName?: string;
    provinceName?: string;
    cantonName?: string;
    tribuName?: string;

    ethnicGroup?: string;
    customs?: string;
    languages?: string[];
    contact: string;
    phone?: string;
    email?: string;
    address?: string;
    CNRCTRegistrationNumber?: string;
    officialDocuments?: string;

    // Mandate & Nomination History (Sync from Employee)
    mandatDebut?: string; // YYYY-MM-DD
    mandatFin?: string; // YYYY-MM-DD
    estRenouvele?: boolean;
    historiqueNominations?: Array<{
        periode: string;
        poste: string;
        region?: string;
    }>;

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
    villageId?: string;
    status?: 'actif' | 'archive' | 'a_vie' | 'décédé' | 'intérimaire';
    // Succession / archivage
    archiveReason?: ChiefArchiveReason;
    archiveDate?: string;    // Date de fin effective du règne
    archiveNote?: string;    // Contexte libre (ex: "Fils aîné désigné")
    
    // Authority Life Hub fields
    career?: ChiefCareerEvent[];
    predecessors?: Predecessor[];
    meritPoints?: number;
    audit?: {
        createdAt: string;
        updatedAt: string;
        lastVerifiedBy?: string;
        lastVerifiedAt?: string;
    };
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

