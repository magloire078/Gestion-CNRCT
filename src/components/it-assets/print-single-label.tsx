
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
          {settings.secondaryLogoUrl ? (
              <img src={settings.secondaryLogoUrl} alt="Logo secondaire" style={{ height: '6mm', width: 'auto', objectFit: 'contain' }} />
          ) : <div style={{width: '6mm'}}></div>}
          <p className="text-[6pt] font-bold leading-tight mx-1 truncate">{settings.organizationName}</p>
          {settings.mainLogoUrl ? (
              <img src={settings.mainLogoUrl} alt="Logo principal" style={{ height: '6mm', width: 'auto', objectFit: 'contain' }} />
          ) : <div style={{width: '6mm'}}></div>}
      </div>

      <div className="my-1">
          <QRCode value={asset.tag} size={48} level="L" />
      </div>
      
      <div className="w-full">
          <p className="font-mono text-[9pt] font-bold tracking-tight leading-none">{asset.tag}</p>
          <p className="text-[7pt] leading-tight mt-0.5 truncate w-full">{asset.modele}</p>
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
