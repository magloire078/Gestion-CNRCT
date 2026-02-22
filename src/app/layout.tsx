
import type { Metadata } from 'next';
import './globals.css';
import '@/lib/suppress-firestore-errors'; // Filtre global pour supprimer les erreurs Firestore attendues
import { Toaster } from '@/components/ui/toaster';
import { SiteLayout } from '@/components/site-layout';
import { ThemeProvider } from "@/components/theme-provider"
import { BASE_URL } from '@/lib/constants';

import { getOrganizationSettings } from '@/services/organization-service';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getOrganizationSettings();

  return {
    metadataBase: new URL(BASE_URL),
    title: 'La Chambre des Rois et des Chefs Traditionnels (CNRCT)',
    description: 'Application de gestion des ressources humaines et matérielles de la Chambre des Rois.',
    manifest: "/manifest.webmanifest",
    icons: {
      icon: settings.mainLogoUrl,
      shortcut: settings.mainLogoUrl,
      apple: settings.mainLogoUrl,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Chambre des Rois CI",
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#2C3E50" />
      </head>
      <body className="font-body antialiased relative min-h-screen" suppressHydrationWarning={true}>
        <div className="fixed inset-0 z-[-1] gradient-mesh pointer-events-none" aria-hidden="true" />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SiteLayout>
            {children}
          </SiteLayout>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

