import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Asset, OrganizationSettings, AssetColumnKeys } from "@/lib/data";

interface PrintAssetsListProps {
    assets: Asset[];
    settings: OrganizationSettings;
    columnsToPrint: AssetColumnKeys[];
    allAssetColumns: Record<string, string>;
    printDate: string;
}

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
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <div id="print-section" className="bg-white text-black p-8 font-sans">
            <header className="flex justify-between items-start mb-8">
                <div className="w-1/4 text-center flex flex-col justify-center items-center h-24">
                    <p className="font-bold text-base">Chambre Nationale des Rois et Chefs Traditionnels</p>
                    {settings.mainLogoUrl && <img src={settings.mainLogoUrl} alt="Logo Principal" className="max-h-20 max-w-full h-auto w-auto mt-1" />}
                </div>
                <div className="w-2/4 text-center pt-2">
                    {/* Empty space */}
                </div>
                <div className="w-1/4 text-center flex flex-col justify-center items-center h-24">
                    <p className="font-bold text-base">République de Côte d'Ivoire</p>
                    {settings.secondaryLogoUrl && <img src={settings.secondaryLogoUrl} alt="Logo Secondaire" className="max-h-16 max-w-full h-auto w-auto my-1" />}
                    <p className="text-sm">Union - Discipline - Travail</p>
                </div>
            </header>

            <div className="text-center my-4">
                <h1 className="text-xl font-bold underline">INVENTAIRE DU MATERIEL INFORMATIQUE - AU {printDate.toUpperCase()}</h1>
            </div>

            <table className="w-full text-[8px] border-collapse border border-black">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="border border-black p-1">N°</th>
                        {columnsToPrint.map(key => <th key={key} className="border border-black p-1 text-left font-bold">{allAssetColumns[key]}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {assets.map((asset, index) => (
                        <tr key={asset.tag}>
                            <td className="border border-black p-1 text-center">{index + 1}</td>
                            {columnsToPrint.map(key => (
                                <td key={key} className="border border-black p-1 text-left">{asset[key as keyof Asset] || ''}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            <footer className="mt-8 text-xs">
                <div className="flex justify-between items-end">
                    <div></div>
                    <div className="text-center leading-tight">
                        <p className="font-bold">Chambre Nationale de Rois et Chefs Traditionnels (CNRCT)</p>
                        <p>Yamoussoukro, Riviera - BP 201 Yamoussoukro | Tél : (225) 30 64 06 60 | Fax : (+255) 30 64 06 63</p>
                        <p>www.cnrct.ci - Email : info@info@cnrct.ci</p>
                    </div>
                    <div><p className="page-number"></p></div>
                </div>
            </footer>
        </div>,
        document.body
    );
}
