
import type { MetadataRoute } from 'next';
import { getOrganizationSettings } from '@/services/organization-service';

// This function dynamically generates the manifest.json file.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getOrganizationSettings();

  const mainLogo = settings.mainLogoUrl || '/icon-192x192.png'; // Fallback icon

  return {
    name: settings.organizationName || 'La Chambre des Rois et des Chefs Traditionnels de Côte d’Ivoire',
    short_name: 'CNRCT',
    description: 'Application de gestion des ressources humaines et matérielles de la Chambre des Rois.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2C3E50',
    icons: [
      {
        src: mainLogo,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: mainLogo,
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

