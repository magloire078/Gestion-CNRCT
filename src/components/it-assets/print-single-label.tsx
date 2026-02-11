"use client";

import QRCode from "react-qr-code";
import type { Asset, OrganizationSettings } from "@/lib/data";
import { cn } from "@/lib/utils";

interface PrintSingleLabelProps {
  asset: Asset;
  settings: OrganizationSettings;
  isPreview?: boolean;
}

// Dimensions for Dymo 11354 label (57mm x 32mm)
const LABEL_WIDTH_MM = 57;
const LABEL_HEIGHT_MM = 32;

export function PrintSingleLabel({ asset, settings, isPreview = false }: PrintSingleLabelProps) {
  const labelContent = (
    <div 
      className="flex flex-col items-center justify-between text-center overflow-hidden break-words bg-white text-black font-arial"
      style={{
          width: `${LABEL_WIDTH_MM}mm`,
          height: `${LABEL_HEIGHT_MM}mm`,
          padding: '1.5mm',
          boxSizing: 'border-box'
      }}
    >
      <div className="flex justify-between items-center w-full">
          <div className="flex-shrink-0">
            {settings.mainLogoUrl ? (
                <img src={settings.mainLogoUrl} alt="Logo principal" style={{ height: '15mm', width: 'auto', objectFit: 'contain' }} />
            ) : <div style={{width: '15mm'}}></div>}
          </div>
          <div className="text-center leading-tight mx-1 flex-grow">
            <p className="font-bold" style={{ fontSize: '5.5pt' }}>Chambre Nationale des Rois</p>
            <p className="font-bold" style={{ fontSize: '5.5pt' }}>et Chefs Traditionnels</p>
            <p className="mt-0.5" style={{ fontSize: '5pt' }}>Tel : 27 30 64 06 60</p>
          </div>
          <div className="flex-shrink-0">
            {settings.secondaryLogoUrl ? (
                <img src={settings.secondaryLogoUrl} alt="Logo secondaire" style={{ height: '15mm', width: 'auto', objectFit: 'contain' }} />
            ) : <div style={{width: '15mm'}}></div>}
          </div>
      </div>

      <div className="flex w-full items-center justify-between flex-grow mt-1">
        <div className="flex-shrink-0 p-0.5 bg-white">
            <QRCode value={asset.tag} size={36} level="L" />
        </div>
        <div className="text-left leading-tight flex-grow pl-1" style={{ fontSize: '7pt' }}>
            <p className="font-bold font-mono">
                {asset.tag}
            </p>
            <p className="truncate">
                <span className="font-semibold">Modèle:</span> {asset.modele}
            </p>
            <p className="truncate">
                <span className="font-semibold">Assigné:</span> {asset.assignedTo}
            </p>
            <p className="truncate">
                <span className="font-semibold">Série:</span> {asset.numeroDeSerie || 'N/A'}
            </p>
        </div>
      </div>
      
      <div className="w-full text-center border-t border-black mt-1 pt-0.5 font-semibold" style={{ fontSize: '5pt' }}>
        Ce matériel est la propriété de la CNRCT
      </div>
    </div>
  );

  if (isPreview) {
    return labelContent;
  }

  return (
    <div id="print-section">
      {labelContent}
    </div>
  );
}
