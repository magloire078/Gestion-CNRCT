
export type HeritageCategory = "culinaire" | "masques" | "danses" | "jeux" | "alliances" | "ethnies";

export type HeritageItem = {
    id: string;
    category: HeritageCategory;
    name: string;
    description: string;
    ethnicGroup?: string;
    region?: string;
    village?: string;
    villageId?: string;
    imageUrl?: string;
    vidsUrl?: string;
    latitude?: number;
    longitude?: number;
    historicalContext?: string;
    significance?: string;
    tags?: string[];
    galleryUrls?: string[];
    audioUrl?: string;
    symbolism?: string;
    usage?: string;
    fabrication?: string;
    dating?: string;
    guardians?: string[];
    createdAt?: string;
    updatedAt?: string;
};

export const heritageCategoryLabels: Record<HeritageCategory, string> = {
    culinaire: "Arts Culinaires",
    masques: "Masques & Statues",
    danses: "Danses & Musiques",
    jeux: "Jeux Traditionnels",
    alliances: "Alliances Inter-ethnies",
    ethnies: "Ethnies & Groupes",
};
