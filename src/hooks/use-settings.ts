"use client";

import { useState, useEffect } from "react";
import { getOrganizationSettings } from "@/services/organization-service";
import type { OrganizationSettings } from "@/lib/data";

const SETTINGS_CACHE_KEY = "cnrct_app_settings";

const defaultSettings: OrganizationSettings = {
    organizationName: 'La Chambre des Rois et des Chefs Traditionnels de Côte d’Ivoire',
    mainLogoUrl: "https://cnrct.ci/wp-content/uploads/2018/03/logo_chambre.png",
    secondaryLogoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Coat_of_arms_of_C%C3%B4te_d%27Ivoire_%281997-2001_variant%29.svg",
    faviconUrl: "https://cnrct.ci/wp-content/uploads/2018/03/logo_chambre.png",
    whiteLabelMode: false
};

export function useSettings() {
    const [settings, setSettings] = useState<OrganizationSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        // 1. Lire le cache localStorage dès le montage client (sans casser l'hydratation SSR)
        try {
            const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (isMounted) {
                    setSettings(prev => ({ ...prev, ...parsed }));
                    setLoading(false);
                }
            }
        } catch (e) {
            // ignore JSON parse error
        }

        // 2. Récupérer les paramètres à jour depuis Firestore
        async function fetchSettings() {
            try {
                const data = await getOrganizationSettings();
                if (isMounted) {
                    setSettings(data);
                    setLoading(false);
                    try {
                        localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(data));
                    } catch (e) {
                        // ignore storage errors
                    }
                }
            } catch (error) {
                console.error("Error fetching settings in hook:", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }
        fetchSettings();

        return () => {
            isMounted = false;
        };
    }, []);

    return { settings, loading };
}

