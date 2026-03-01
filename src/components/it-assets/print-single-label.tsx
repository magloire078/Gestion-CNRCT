import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "react-qr-code";
import type { Asset, OrganizationSettings } from "@/lib/data";

interface PrintSingleLabelProps {
  asset: Asset;
  settings: OrganizationSettings;
  isPreview?: boolean;
}

// Dimensions for Dymo 11354 label (57mm x 32mm)
const LABEL_WIDTH_MM = 57;
const LABEL_HEIGHT_MM = 32;

export function PrintSingleLabel({ asset, settings, isPreview = false }: PrintSingleLabelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const labelContent = (
    <div
      className="flex flex-col items-center justify-between text-center overflow-hidden break-words bg-white text-black font-arial"
      style={{
        width: `${LABEL_WIDTH_MM}mm`,
        height: `${LABEL_HEIGHT_MM}mm`,
        padding: '0.8mm',
        boxSizing: 'border-box'
      }}
    >
      <div className="flex justify-between items-center w-full">
        <div className="flex-shrink-0">
          {settings.mainLogoUrl ? (
            <img src={settings.mainLogoUrl} alt="Logo principal" style={{ height: '10mm', width: 'auto', objectFit: 'contain' }} />
          ) : <div style={{ width: '10mm' }}></div>}
        </div>
        <div className="text-center leading-[1.1] mx-0.1 flex-grow overflow-hidden flex flex-col justify-center">
          <p className="font-bold whitespace-nowrap" style={{ fontSize: '5.5pt' }}>Chambre Nationale des Rois</p>
          <p className="font-bold whitespace-nowrap" style={{ fontSize: '5.5pt' }}>et Chefs Traditionnels</p>
          <p className="mt-0.5 font-medium" style={{ fontSize: '5pt' }}>Tel : 27 30 64 06 60</p>
        </div>
        <div className="flex-shrink-0">
          {settings.secondaryLogoUrl ? (
            <img src={settings.secondaryLogoUrl} alt="Logo secondaire" style={{ height: '10mm', width: 'auto', objectFit: 'contain' }} />
          ) : <div style={{ width: '10mm' }}></div>}
        </div>
      </div>

      <div className="flex w-full items-center justify-between flex-grow mt-0.5 overflow-hidden">
        <div className="flex-shrink-0 p-0.5 bg-white">
          <QRCode value={asset.tag} size={34} level="L" />
        </div>
        <div className="text-left leading-tight flex-grow pl-1 overflow-hidden" style={{ fontSize: '6pt' }}>
          <p className="font-bold font-mono text-[7.5pt] truncate">
            {asset.tag}
          </p>
          <p className="truncate">
            <span className="font-semibold">Mod:</span> {asset.modele}
          </p>
          <p className="truncate">
            <span className="font-semibold">Ass:</span> {asset.assignedTo}
          </p>
          <p className="truncate">
            <span className="font-semibold">SN:</span> {asset.numeroDeSerie || 'N/A'}
          </p>
        </div>
      </div>

      <div className="w-full text-center border-t border-black mt-0.5 pt-0.5 font-bold uppercase" style={{ fontSize: '3.5pt' }}>
        Propriété de la Chambre Nationale des Rois et Chefs Traditionnels
      </div>
    </div>
  );

  if (isPreview) {
    return labelContent;
  }

  if (!mounted) return null;

  return createPortal(
    <div id="print-section">
      {labelContent}
    </div>,
    document.body
  );
}
