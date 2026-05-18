
import { IVORIAN_REGIONS } from "@/constants/regions";
import { divisions } from "@/lib/ivory-coast-divisions";

/**
 * Normalizes a string by removing accents, special characters and converting to lowercase.
 */
export const normalizeString = (s: string): string => {
    if (!s) return "";
    return s.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]/g, ""); // Remove non-alphanumeric
};

/**
 * Finds the official name for a region based on a potentially misspelled input.
 */
export const getOfficialRegion = (input: string): string => {
    if (!input || input === "all" || input === "National") return input;
    
    const normalizedInput = normalizeString(input);
    
    // Check in official list
    for (const official of IVORIAN_REGIONS) {
        if (normalizeString(official) === normalizedInput) {
            return official;
        }
    }
    
    // Manual overrides for very different names
    const overrides: Record<string, string> = {
        "agboville": "Agnéby-Tiassa",
        "zanzan": "Gontougo",
        "regiondesponts": "Grands-Ponts",
        "districtautonomedabidjan": "Abidjan",
        "districtautonomedeyamoussoukro": "Yamoussoukro"
    };
    
    if (overrides[normalizedInput]) return overrides[normalizedInput];
    
    return input; // Fallback to original if no match
};

/**
 * Finds the official name for a department within a region.
 */
export const getOfficialDepartment = (region: string, input: string): string => {
    if (!input || input === "all" || !region || region === "all") return input;
    
    const officialRegion = getOfficialRegion(region);
    const regionData = divisions[officialRegion];
    if (!regionData) return input;
    
    const normalizedInput = normalizeString(input);
    const officialDepts = Object.keys(regionData);
    
    for (const official of officialDepts) {
        if (normalizeString(official) === normalizedInput) {
            return official;
        }
    }
    
    return input;
};

/**
 * Finds the official name for a sub-prefecture within a department.
 */
export const getOfficialSubPrefecture = (region: string, department: string, input: string): string => {
    if (!input || input === "all" || !region || !department || region === "all" || department === "all") return input;
    
    const officialRegion = getOfficialRegion(region);
    const officialDept = getOfficialDepartment(officialRegion, department);
    
    const deptData = divisions[officialRegion]?.[officialDept];
    if (!deptData) return input;
    
    const normalizedInput = normalizeString(input);
    const officialSPs = Object.keys(deptData);
    
    for (const official of officialSPs) {
        if (normalizeString(official) === normalizedInput) {
            return official;
        }
    }
    
    return input;
};

/**
 * Approximate central coordinates for Ivorian Regions.
 */
export const REGION_COORDS: Record<string, [number, number]> = {
    "Abidjan": [5.3613, -3.9935],
    "Agnéby-Tiassa": [5.9255, -4.2188],
    "Bafing": [8.2833, -7.6833],
    "Bagoué": [9.521, -6.486],
    "Bélier": [6.82, -5.27],
    "Béré": [8.0583, -6.1833],
    "Bounkani": [9.2667, -2.9833],
    "Cavally": [6.5333, -7.5],
    "Folon": [10.0, -7.8333],
    "Gbêkê": [7.6931, -5.0303],
    "Gbôklé": [4.95, -6.0833],
    "Gôh": [6.1333, -5.95],
    "Gontougo": [8.0333, -2.8],
    "Grands-Ponts": [5.325, -4.375],
    "Guémon": [6.75, -7.3333],
    "Hambol": [8.1333, -5.1],
    "Haut-Sassandra": [6.8833, -6.45],
    "Iffou": [7.05, -3.9667],
    "Indénié-Djuablin": [6.7297, -3.4964],
    "Kabadougou": [9.5, -7.5667],
    "La Mé": [6.107, -3.86],
    "Lôh-Djiboua": [5.8333, -5.3667],
    "Marahoué": [6.9833, -5.75],
    "Moronou": [6.65, -4.2],
    "Nawa": [5.7833, -6.6],
    "N’Zi": [6.6467, -4.705],
    "Poro": [9.458, -5.629],
    "San-Pédro": [4.7485, -6.6363],
    "Sud-Comoé": [5.4667, -3.2],
    "Tchologo": [9.6, -5.2],
    "Tonkpi": [7.4125, -7.5539],
    "Worodougou": [7.961, -6.673],
    "Yamoussoukro": [6.8276, -5.2893]
};

/**
 * Finds the region containing a given department.
 */
export const findRegionByDepartment = (dept: string): string | null => {
    const normDept = normalizeString(dept);
    for (const [region, depts] of Object.entries(divisions)) {
        for (const d of Object.keys(depts)) {
            if (normalizeString(d) === normDept) return region;
        }
    }
    return null;
};

/**
 * Finds the closest region based on lat/lon proximity.
 */
export const findClosestRegion = (lat: number, lon: number): string => {
    let closestRegion = "Abidjan";
    let minDistance = Infinity;

    for (const [region, coords] of Object.entries(REGION_COORDS)) {
        const distance = Math.sqrt(Math.pow(lat - coords[0], 2) + Math.pow(lon - coords[1], 2));
        if (distance < minDistance) {
            minDistance = distance;
            closestRegion = region;
        }
    }

    return closestRegion;
};

/**
 * Approximate coordinates for major Department capitals.
 */
export const DEPARTMENT_COORDS: Record<string, [number, number]> = {
    "Abidjan": [5.3167, -4.0333],
    "Bouaké": [7.6833, -5.0167],
    "Daloa": [6.8833, -6.4500],
    "Yamoussoukro": [6.8170, -5.2830],
    "Korhogo": [9.4500, -5.6333],
    "San-Pédro": [4.7500, -6.6333],
    "Man": [7.4167, -7.5500],
    "Gagnoa": [6.1333, -5.9500],
    "Divo": [5.8333, -5.3667],
    "Abengourou": [6.7297, -3.4964],
    "Bondoukou": [8.0417, -2.8000],
    "Ferkessédougou": [9.6000, -5.2000],
    "Katiola": [8.1333, -5.1000],
    "Odienné": [9.5000, -7.5667],
    "Soubré": [5.7833, -6.6000],
    "Agboville": [5.9255, -4.2188],
    "Adzopé": [6.107, -3.86],
    "Dimbokro": [6.6467, -4.705],
    "Sassandra": [4.95, -6.0833],
    "Boundiali": [9.521, -6.486],
    "Séguéla": [7.961, -6.673],
    "Bouna": [9.2667, -2.9833],
    "Touba": [8.2833, -7.6833],
    "Aboisso": [5.4667, -3.2000],
    "Dabou": [5.325, -4.375],
    "Zuénoula": [7.4167, -6.0333],
    "Toumodi": [6.5500, -5.0167],
    "Mankono": [8.0583, -6.1833],
    "Danané": [7.2581, -8.1522],
    "Guiglo": [6.55, -7.4833],
    "Duékoué": [6.7419, -7.3486],
    "Bouaflé": [6.9833, -5.7500],
    "Daoukro": [7.05, -3.9667],
    "Bongouanou": [6.65, -4.2],
    "Agnibilékrou": [7.1333, -3.2],
    "Tengréla": [10.4833, -6.4167],
    "Kouto": [9.8833, -6.4],
    "Sinfra": [6.6167, -5.9167],
    "Vavoua": [7.3833, -6.4833],
    "Issia": [6.4833, -6.5833],
    "Lakota": [5.8475, -5.682],
    "Bangolo": [7.0122, -7.4861],
    "Biankouma": [7.7333, -7.6167],
    "Tiébissou": [7.1667, -5.2167],
    "M'Bahiakro": [7.45, -4.3333]
};

/**
 * Finds the closest department based on GPS proximity.
 */
export const findClosestDepartment = (lat: number, lon: number): string => {
    let closestDept = "Abidjan";
    let minDistance = Infinity;

    for (const [dept, coords] of Object.entries(DEPARTMENT_COORDS)) {
        const distance = Math.sqrt(Math.pow(lat - coords[0], 2) + Math.pow(lon - coords[1], 2));
        if (distance < minDistance) {
            minDistance = distance;
            closestDept = dept;
        }
    }

    return closestDept;
};

/**
 * Advanced: Build a reverse mapping of all official villages to their administrative hierarchy.
 * This allows "Ultimate Repair" by name matching.
 */
const villageMap: Record<string, { r: string; d: string; sp: string }> = {};

// Self-invoking function to build the map once
(() => {
    for (const [region, depts] of Object.entries(divisions)) {
        for (const [dept, sps] of Object.entries(depts)) {
            for (const [sp, villages] of Object.entries(sps)) {
                if (Array.isArray(villages)) {
                    for (const vName of villages) {
                        const normName = normalizeString(vName);
                        // Avoid overwriting if multiple villages have same name (approximate)
                        if (!villageMap[normName]) {
                            villageMap[normName] = { r: region, d: dept, sp: sp };
                        }
                    }
                }
            }
        }
    }
})();

/**
 * Attempts to find the full administrative hierarchy for a village name.
 */
export const findHierarchyByName = (name: string) => {
    const norm = normalizeString(name);
    return villageMap[norm] || null;
};
