
import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import '@/lib/suppress-firestore-errors'; // Filtre global pour supprimer les erreurs Firestore attendues
import { Toaster } from '@/components/ui/toaster';
import { SiteLayout } from '@/components/site-layout';
import { ThemeProvider } from "@/components/theme-provider"
import { BASE_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

import { getOrganizationSettings } from '@/services/organization-service';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getOrganizationSettings();

    return {
      metadataBase: new URL(BASE_URL),
      title: 'Intranet CNRCT',
      description: 'Application de gestion des ressources humaines et matérielles de la CNRCT.',
      manifest: "/manifest.webmanifest",
      icons: {
        icon: [
          { url: settings.faviconUrl || '/favicon.ico' },
          { url: settings.mainLogoUrl, sizes: '32x32', type: 'image/png' },
        ],
        shortcut: settings.faviconUrl || '/favicon.ico',
        apple: [
          { url: settings.mainLogoUrl },
        ],
      },
      appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Intranet CNRCT",
      },
      formatDetection: {
        telephone: false,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      metadataBase: new URL(BASE_URL),
      title: 'Intranet CNRCT',
      icons: {
        icon: '/favicon.ico',
      }
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#2C3E50" />
      </head>
      <body className={cn(
        "antialiased relative min-h-screen",
        inter.variable,
        poppins.variable
      )} suppressHydrationWarning={true}>
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

