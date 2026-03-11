
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getChiefs } from '@/services/chief-service';

/**
 * Calcule la distance entre deux points géographiques en kilomètres
 * utilisant la formule de Haversine.
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance en km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

/**
 * Outil Genkit pour trouver les chefs à proximité.
 */
export const findNearbyChiefs = ai.defineTool(
    {
        name: 'findNearbyChiefs',
        description: 'Identifie les chefs coutumiers et autorités locales situés dans un rayon donné autour de coordonnées spécifiques.',
        inputSchema: z.object({
            latitude: z.number().describe('La latitude du point central (conflit).'),
            longitude: z.number().describe('La longitude du point central (conflit).'),
            radiusKm: z.number().default(20).describe('Le rayon de recherche en kilomètres (défaut: 20km).'),
        }),
        outputSchema: z.array(z.object({
            id: z.string(),
            name: z.string(),
            title: z.string(),
            village: z.string(),
            region: z.string().optional(),
            distanceKm: z.number().describe('Distance exacte du chef par rapport au point central.'),
        })),
    },
    async (input) => {
        try {
            const chiefs = await getChiefs();
            const nearby = chiefs
                .filter(c => c.latitude !== undefined && c.longitude !== undefined)
                .map(c => ({
                    id: c.id,
                    name: c.name,
                    title: c.title,
                    village: c.village,
                    region: c.region,
                    distanceKm: calculateDistance(input.latitude, input.longitude, c.latitude!, c.longitude!)
                }))
                .filter(c => c.distanceKm <= input.radiusKm)
                .sort((a, b) => a.distanceKm - b.distanceKm);
            
            return nearby;
        } catch (error) {
            console.error('[findNearbyChiefs] Erreur lors de la recherche spatiale:', error);
            return [];
        }
    }
);
