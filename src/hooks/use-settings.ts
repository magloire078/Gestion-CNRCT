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

function getInitialSettings(): { settings: OrganizationSettings; hasCache: boolean } {
    if (typeof window !== "undefined") {
        try {
            const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                return { settings: { ...defaultSettings, ...parsed }, hasCache: true };
            }
        } catch (e) {
            // ignore JSON parse error
        }
    }
    return { settings: defaultSettings, hasCache: false };
}

export function useSettings() {
    const [initialState] = useState(() => getInitialSettings());
    const [settings, setSettings] = useState<OrganizationSettings>(initialState.settings);
    const [loading, setLoading] = useState(!initialState.hasCache);

    useEffect(() => {
        let isMounted = true;
        async function fetchSettings() {
            try {
                const data = await getOrganizationSettings();
                if (isMounted) {
                    setSettings(data);
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

