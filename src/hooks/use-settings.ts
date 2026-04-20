"use client";

import { useState, useEffect } from "react";
import { getOrganizationSettings } from "@/services/organization-service";
import type { OrganizationSettings } from "@/lib/data";

export function useSettings() {
    const [settings, setSettings] = useState<OrganizationSettings>({
        organizationName: 'La Chambre des Rois et des Chefs Traditionnels de Côte d’Ivoire',
        mainLogoUrl: "https://cnrct.ci/wp-content/uploads/2018/03/logo_chambre.png",
        secondaryLogoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Coat_of_arms_of_C%C3%B4te_d%27Ivoire_%281997-2001_variant%29.svg",
        faviconUrl: "https://cnrct.ci/wp-content/uploads/2018/03/logo_chambre.png"
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSettings() {
            try {
                const data = await getOrganizationSettings();
                setSettings(data);
            } catch (error) {
                console.error("Error fetching settings in hook:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, []);

    return { settings, loading };
}
