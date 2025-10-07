"use client";

import type { OrganizationSettings } from "@/lib/data";

interface PrintLayoutProps {
    logos: OrganizationSettings;
    title: string;
    subtitle?: string;
    columns: { header: string; key: string; align?: 'left' | 'center' | 'right' }[];
    data: Record<string, any>[];
}

export function PrintLayout({ logos, title, subtitle, columns, data }: PrintLayoutProps) {
    return (
        <div id="print-section" className="bg-white text-black p-8 w-full print:shadow-none print:border-none print:p-0">
            <header className="flex justify-between items-start mb-8">
                <div className="w-1/4 text-center flex flex-col justify-center items-center h-24">
                   <p className="font-bold text-base">Chambre Nationale des Rois et Chefs Traditionnels</p>
                   {logos.mainLogoUrl && <img src={logos.mainLogoUrl} alt="Logo Principal" className="max-h-20 max-w-full h-auto w-auto mt-1" />}
                </div>
                <div className="w-2/4 text-center pt-2">
                    <h1 className="font-bold text-lg">{logos.organizationName || "Chambre Nationale des Rois et Chefs Traditionnels"}</h1>
                </div>
                <div className="w-1/4 text-center flex flex-col justify-center items-center h-24">
                    <p className="font-bold text-base">République de Côte d'Ivoire</p>
                    {logos.secondaryLogoUrl && <img src={logos.secondaryLogoUrl} alt="Logo Secondaire" className="max-h-16 max-w-full h-auto w-auto my-1" />}
                    <p className="text-sm">Union - Discipline - Travail</p>
                </div>
            </header>

            <div className="text-center my-6">
                <h1 className="text-lg font-bold underline uppercase">{title}</h1>
                {subtitle && <h2 className="text-md font-bold mt-4 uppercase">{subtitle}</h2>}
            </div>
            
            <table className="w-full text-sm border-collapse border border-black">
                <thead>
                    <tr className="bg-gray-200">
                        {columns.map(col => (
                           <th key={col.key} className={`border border-black p-2 text-left font-bold text-${col.align || 'left'}`}>
                                {col.header}
                           </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index}>
                           {columns.map(col => (
                               <td key={col.key} className={`border border-black p-2 text-${col.align || 'left'}`}>
                                   {row[col.key]}
                               </td>
                           ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            <footer className="mt-8 text-xs">
                <div className="flex justify-between items-end">
                    <div></div>
                    <div className="text-center">
                        <p className="font-bold">{logos.organizationName || "Chambre Nationale de Rois et Chefs Traditionnels (CNRCT)"}</p>
                        <p>Yamoussoukro, Riviera - BP 201 Yamoussoukro | Tél : (225) 30 64 06 60 | Fax : (+255) 30 64 06 63</p>
                        <p>www.cnrct.ci - Email : info@cnrct.ci</p>
                    </div>
                    <div><p className="page-number"></p></div>
                </div>
            </footer>
        </div>
    );
}
