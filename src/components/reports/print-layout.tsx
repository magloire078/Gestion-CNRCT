import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { OrganizationSettings } from "@/types/common";

interface PrintLayoutProps {
    logos: OrganizationSettings | null;
    title: string;
    subtitle?: string;
    columns?: { header: string; key: string; align?: 'left' | 'center' | 'right'; className?: string }[];
    data?: Record<string, any>[];
    children?: ReactNode;
    orientation?: 'landscape' | 'portrait';
}

export function PrintLayout({ logos, title, subtitle, columns, data, children, orientation = 'landscape' }: PrintLayoutProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Add landscape class for inventory lists if requested
        if (orientation === 'landscape') {
            document.body.classList.add('print-landscape');
        }
        
        // Laisser le temps au portail de se rendre dans le DOM puis déclencher l'impression
        const printTimer = setTimeout(() => {
            window.print();
        }, 800);

        return () => {
            clearTimeout(printTimer);
            setMounted(false);
            if (orientation === 'landscape') {
                document.body.classList.remove('print-landscape');
            }
        };
    }, [orientation]);

    if (!mounted) return null;

    return createPortal(
        <div id="print-section" className="bg-white text-black w-full print:shadow-none print:border-none print:pb-24">
                <div className="avoid-page-break">
                    <header className="flex justify-between items-start mb-8 min-h-[140px]">
                        <div className="w-1/3 text-center flex flex-col justify-center items-center h-full">
                            <p className="font-bold text-sm leading-tight text-blue-900">Chambre Nationale des Rois<br />et Chefs Traditionnels</p>
                            {logos?.mainLogoUrl && (
                                <img 
                                    src={logos.mainLogoUrl} 
                                    alt="Logo Principal" 
                                    className="max-h-24 max-w-full h-auto w-auto mt-2" 
                                    loading="eager"
                                />
                            )}
                        </div>
                        <div className="w-1/3"></div>
                        <div className="w-1/3 text-center flex flex-col justify-center items-center h-full">
                            <p className="font-bold text-sm leading-tight">République de Côte d'Ivoire</p>
                            {logos?.secondaryLogoUrl && (
                                <img 
                                    src={logos.secondaryLogoUrl} 
                                    alt="Logo Secondaire" 
                                    className="max-h-20 max-w-full h-auto w-auto my-2" 
                                    loading="eager"
                                />
                            )}
                            <p className="border-t border-black px-4 text-[10px] mt-1">Union - Discipline - Travail</p>
                        </div>
                    </header>
                </div>

            <div className="text-center my-6">
                <h1 className="text-lg font-bold underline uppercase">{title}</h1>
                {subtitle && <h2 className="text-md font-bold mt-4">{subtitle}</h2>}
            </div>

            {children ? (
                children
            ) : columns && data ? (
                <table className="w-full table-fixed text-[9px] border-collapse border border-black">
                    <thead className="bg-slate-200 text-slate-900">
                        <tr>
                            {columns.map(col => (
                                <th key={col.key} className={`border border-black p-1 font-bold ${col.className !== undefined ? col.className : 'whitespace-nowrap'} text-${col.align === 'center' ? 'center' : 'left'}`}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index} className="even:bg-slate-50 odd:bg-white text-slate-800">
                                {columns.map(col => (
                                    <td key={col.key} className={`border border-black p-1 ${col.className !== undefined ? col.className : 'whitespace-nowrap'} text-${col.align === 'center' ? 'center' : 'left'}`}>
                                        {row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : null}

            {/* Footer répété sur chaque page d'impression grâce à la classe print-page-footer */}
            <footer className="mt-8 text-xs print-page-footer">
                <div className="flex justify-between items-start border-t border-slate-200/50 pt-2 px-8 pb-2">
                    <div className="w-[100px]"></div>
                    <div className="text-center flex-1 text-[10px] text-slate-600">
                        <p>Yamoussoukro, Riviera - BP 201 Yamoussoukro | Tél : (225) 30 64 06 60 | Fax : (+255) 30 64 06 63</p>
                        <p>www.cnrct.ci - Email : info@cnrct.ci</p>
                    </div>
                    <div className="w-[100px] text-right text-[9px] text-slate-400 italic">
                        {/* Le navigateur gère lu-même la vraie numérotation des pages (1/2 etc.) dans les paramètres d'en-tête/pied de page */}
                    </div>
                </div>
            </footer>
        </div>,
        document.body
    );
}
