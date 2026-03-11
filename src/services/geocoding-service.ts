/**
 * Service pour la recherche de coordonnées géographiques (Geocoding)
 * Utilise l'API Nominatim d'OpenStreetMap (gratuit, pas besoin de clé API)
 */

export interface GeocodingResult {
    name: string;
    displayName: string;
    lat: number;
    lng: number;
    importance: number;
    type: string;
}

/**
 * Recherche des coordonnées pour une requête texte
 * @param query Le nom du lieu (ex: "Abidjan", "Bouaké", "Village X, Côte d'Ivoire")
 */
export async function searchLocation(query: string): Promise<GeocodingResult[]> {
    if (!query || query.length < 3) return [];

    try {
        // Ajout de "Côte d'Ivoire" pour limiter les résultats
        const fullQuery = query.toLowerCase().includes("côte d'ivoire") ? query : `${query}, Côte d'Ivoire`;
        const encodedQuery = encodeURIComponent(fullQuery);
        
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5`
        );

        if (!response.ok) {
            throw new Error(`Erreur Nominatim: ${response.statusText}`);
        }

        const data = await response.json();
        
        return data.map((item: any) => ({
            name: item.name,
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            importance: item.importance,
            type: item.type
        }));
    } catch (error) {
        console.error("Geocoding search failed:", error);
        return [];
    }
}

/**
 * Recherche inverse : récupère le nom du lieu à partir des coordonnées
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );

        if (!response.ok) {
            throw new Error(`Erreur Nominatim Reverse: ${response.statusText}`);
        }

        const data = await response.json();
        return data.display_name || null;
    } catch (error) {
        console.error("Reverse geocoding failed:", error);
        return null;
    }
}
