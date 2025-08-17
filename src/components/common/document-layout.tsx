
"use client";

import type { OrganizationSettings } from "@/lib/data";

interface DocumentLayoutProps {
  logos: OrganizationSettings;
  children: React.ReactNode;
}

export function DocumentLayout({ logos, children }: DocumentLayoutProps) {
  return (
    <div className="bg-white text-black p-8 font-serif w-[210mm] min-h-[297mm] flex flex-col">
      <header className="flex justify-between items-start pb-4 border-b-2 border-gray-600">
        <div className="w-1/4 text-center flex flex-col justify-center items-center h-24">
           {logos.mainLogoUrl && <img src={logos.mainLogoUrl} alt="Logo CNRCT" className="max-h-24 max-w-full h-auto w-auto" />}
        </div>
        <div className="w-2/4 text-center pt-2">
          <h1 className="font-bold text-lg">
            {logos.organizationName || "Chambre Nationale des Rois et Chefs Traditionnels"}
          </h1>
          <p className="text-sm mt-2">LE DIRECTOIRE</p>
        </div>
        <div className="w-1/4 text-center flex justify-center items-center h-24">
          {logos.secondaryLogoUrl && (
            <img
              src={logos.secondaryLogoUrl}
              alt="Emblème national"
              className="max-h-full max-w-full h-auto w-auto"
            />
          )}
        </div>
      </header>

      <main className="flex-1 py-8">{children}</main>

      <footer className="text-center pt-4 border-t-2 border-gray-600 mt-auto text-xs">
        <div className="leading-tight">
          <p className="font-bold">
            {logos.organizationName || "Chambre Nationale de Rois et Chefs Traditionnels (CNRCT)"}
          </p>
          <p>
            Yamoussoukro, Riviera - BP 201 Yamoussoukro | Tél : (225) 30 64 06 60 | Fax : (+255) 30 64 06 63
          </p>
          <p>www.cnrct.ci - Email : info@cnrct.ci</p>
        </div>
      </footer>
    </div>
  );
}
