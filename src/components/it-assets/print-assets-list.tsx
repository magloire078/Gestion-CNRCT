import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import type { Asset, OrganizationSettings, AssetColumnKeys } from "@/lib/data";

interface PrintAssetsListProps {
    assets: Asset[];
    settings: OrganizationSettings;
    columnsToPrint: AssetColumnKeys[];
    allAssetColumns: Record<string, string>;
    printDate: string;
}

// Map columns to relative weights for width calculation
const columnWeights: Record<string, number> = {
    tag: 12,
    type: 10,
    fabricant: 10,
    modele: 20,
    numeroDeSerie: 14,
    ipAddress: 11,
    assignedTo: 22,
    status: 9,
};

export function PrintAssetsList({
    assets,
    settings,
    columnsToPrint,
    allAssetColumns,
    printDate
}: PrintAssetsListProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        document.body.classList.add('print-landscape');
        return () => {
            setMounted(false);
            document.body.classList.remove('print-landscape');
        };
    }, []);

    // Calculate dynamic widths based on selected columns
    const columnWidths = useMemo(() => {
        const totalWeight = columnsToPrint.reduce((acc, col) => acc + (columnWeights[col] || 10), 5); // 5 for the N° column
        const columnWidthMap: Record<string, string> = {};
        
        columnsToPrint.forEach(col => {
            const weight = columnWeights[col] || 10;
            const percentage = (weight / totalWeight) * 100;
            columnWidthMap[col] = `${percentage.toFixed(1)}%`;
        });

        // Add N° column width
        columnWidthMap['index'] = `${(5 / totalWeight * 100).toFixed(1)}%`;
        return columnWidthMap;
    }, [columnsToPrint]);

    if (!mounted) return null;

    return createPortal(
        <div id="print-section" className="bg-white text-black p-4 font-sans print:p-0">
            {/* Header Institutionnel */}
            <header className="flex justify-between items-start mb-6 border-b border-black pb-4">
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="font-bold text-[11px] uppercase leading-tight">
                        <p>Chambre Nationale des Rois</p>
                        <p>et Chefs Traditionnels</p>
                    </div>
                    {settings.mainLogoUrl && (
                        <img src={settings.mainLogoUrl} alt="Logo CNRCT" className="h-16 w-auto object-contain mt-2" />
                    )}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center pt-2 invisible print:visible">
                    {/* Visual balance */}
                </div>

                <div className="flex-1 text-center flex flex-col items-center justify-center">
                    <p className="font-bold text-[11px] uppercase">République de Côte d'Ivoire</p>
                    {settings.secondaryLogoUrl && (
                        <img src={settings.secondaryLogoUrl} alt="Armoiries" className="h-14 w-auto object-contain my-1" />
                    )}
                    <p className="text-[9px] italic font-medium">Union - Discipline - Travail</p>
                </div>
            </header>

            {/* Titre du document */}
            <div className="text-center mb-6">
                <h1 className="text-xl font-black underline uppercase tracking-tight">
                    Inventaire du Matériel Informatique
                </h1>
                <p className="text-sm font-bold mt-1">AU : {printDate}</p>
            </div>

            {/* Dynamic Column Widths CSS */}
            <style>{`
                #it-assets-print-table { table-layout: fixed !important; }
                .col-index { width: ${columnWidths['index']} !important; }
                ${columnsToPrint.map(key => `.col-${key} { width: ${columnWidths[key]} !important; }`).join('\n')}
            `}</style>

            {/* Tableau principal */}
            <table id="it-assets-print-table" className="w-full text-[9px] border-collapse table-fixed">
                <thead>
                    <tr>
                        <th className="border border-black p-1.5 text-center font-bold uppercase tracking-tight col-index">
                            N°
                        </th>
                        {columnsToPrint.map(key => (
                            <th 
                                key={key} 
                                className={`border border-black p-1.5 text-left font-bold uppercase tracking-tight col-${key}`}
                            >
                                {allAssetColumns[key]}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {assets.map((asset, index) => (
                        <tr key={asset.tag}>
                            <td className="border border-black p-1.5 text-center font-medium overflow-hidden text-ellipsis whitespace-nowrap col-index">
                                {index + 1}
                            </td>
                            {columnsToPrint.map(key => (
                                <td 
                                    key={key} 
                                    className={`border border-black p-1.5 text-left leading-tight align-top break-words col-${key}`}
                                >
                                    {asset[key as keyof Asset] || '-'}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Statistiques rapides */}
            <div className="mt-4 text-[10px] font-bold text-right px-2">
                Total des actifs répertoriés : {assets.length}
            </div>

            {/* Section Signatures */}
            <div className="mt-12 grid grid-cols-2 gap-20 px-10">
                <div className="text-center">
                    <p className="font-bold underline mb-16 text-xs italic uppercase">Le Responsable Informatique</p>
                    <div className="border-t border-dotted border-black w-48 mx-auto"></div>
                </div>
                <div className="text-center">
                    <p className="font-bold underline mb-16 text-xs italic uppercase">Le Secrétaire Général</p>
                    <div className="border-t border-dotted border-black w-48 mx-auto"></div>
                </div>
            </div>

            {/* Footer Reverted to central layout */}
            <footer className="mt-12 pt-4 border-t border-gray-300 text-[8px] text-gray-500">
                <div className="flex justify-between items-end">
                    <div className="w-1/4"></div>
                    <div className="w-2/4 text-center leading-tight">
                        <p className="font-bold text-gray-700 uppercase">Chambre Nationale des Rois et Chefs Traditionnels (CNRCT)</p>
                        <p>Yamoussoukro, Riviera - BP 201 Yamoussoukro | Tél : (225) 30 64 06 60</p>
                        <p>www.cnrct.ci - Email : info@cnrct.ci</p>
                    </div>
                    <div className="w-1/4 text-right">
                        <p className="page-number font-bold text-black"></p>
                    </div>
                </div>
            </footer>
        </div>,
        document.body
    );
}
