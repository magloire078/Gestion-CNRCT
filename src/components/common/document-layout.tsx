

"use client";

import type { OrganizationSettings } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";

interface DocumentLayoutProps {
  children: React.ReactNode;
}

export function DocumentLayout({ children }: DocumentLayoutProps) {
  const { settings } = useAuth();

  return (
    <div className="bg-white text-black p-8 font-serif w-[210mm] min-h-[297mm] flex flex-col">
      <header className="flex justify-between items-center pb-4 border-b-2 border-gray-600 h-[120px]">
        <div className="w-1/4 text-center flex flex-col justify-center items-center h-full">
           <div className='font-bold text-base leading-tight'>
              <p>Chambre Nationale des Rois</p>
              <p className="-mt-1">et Chefs Traditionnels</p>
          </div>
           {settings?.mainLogoUrl && <img src={settings.mainLogoUrl} alt="Logo Principal" className="max-h-20 max-w-full h-auto w-auto mt-1" />}
        </div>
        
        <div className="w-2/4 text-center pt-2">
          {/* Central content can be added here if needed in the future */}
        </div>

        <div className="w-1/4 text-center flex flex-col justify-center items-center h-full">
          <p className="font-bold text-base">REPUBLIQUE DE CÔTE D'IVOIRE</p>
          {settings?.secondaryLogoUrl && (
            <img
              src={settings.secondaryLogoUrl}
              alt="Emblème national"
              className="max-h-[80px] max-w-full h-auto w-auto my-1"
            />
          )}
          <p className="text-sm">Union - Discipline - Travail</p>
        </div>
      </header>

      <main className="flex-1 py-4">{children}</main>

      <footer className="text-center pt-4 border-t-2 border-gray-600 mt-auto text-xs">
        <div className="flex justify-between items-end">
            <div></div>
            <div className="leading-tight">
                <p className="font-bold">{settings?.organizationName || "Chambre Nationale de Rois et Chefs Traditionnels (CNRCT)"}</p>
                <p>Yamoussoukro, Riviera - BP 201 Yamoussoukro | Tél : (225) 30 64 06 60 | Fax : (+255) 30 64 06 63</p>
                <p>www.cnrct.ci - Email : info@cnrct.ci</p>
            </div>
            <div><p className="page-number"></p></div>
        </div>
      </footer>
    </div>
  );
}
