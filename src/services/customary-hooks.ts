import { useState, useEffect } from 'react';
import { getVillages } from './village-service';
import { getChiefs } from './chief-service';

export function useCustomaryDivisions() {
    const [cantons, setCantons] = useState<string[]>([]);
    const [tribus, setTribus] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchDivisions() {
            try {
                setIsLoading(true);
                const [villages, chiefs] = await Promise.all([
                    getVillages(),
                    getChiefs()
                ]);

                const cantonSet = new Set<string>();
                const tribuSet = new Set<string>();

                villages.forEach(v => {
                    if (v.canton) cantonSet.add(v.canton.trim());
                    if (v.tribu) tribuSet.add(v.tribu.trim());
                });

                chiefs.forEach(c => {
                    if (c.cantonName) cantonSet.add(c.cantonName.trim());
                    if (c.tribuName) tribuSet.add(c.tribuName.trim());
                });

                setCantons(Array.from(cantonSet).filter(Boolean).sort());
                setTribus(Array.from(tribuSet).filter(Boolean).sort());
            } catch (error) {
                console.error("Error fetching customary divisions:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchDivisions();
    }, []);

    return { cantons, tribus, isLoading };
}
