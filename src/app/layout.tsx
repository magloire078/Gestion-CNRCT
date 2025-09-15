
import type {Metadata} from 'next';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';
import { SiteLayout } from '@/components/site-layout';
import { ThemeProvider } from "@/components/theme-provider"
import { getOrganizationSettings } from '@/services/organization-service';


export async function generateMetadata(): Promise<Metadata> {
  const settings = await getOrganizationSettings();
  return {
    title: settings.organizationName || 'Gestion App',
    description: `Application de gestion pour ${settings.organizationName}`,
    icons: {
      icon: settings.faviconUrl || '/favicon.ico',
    },
    manifest: "/manifest.json",
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Arial&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
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
