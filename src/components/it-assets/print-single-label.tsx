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
      className="flex flex-col items-center justify-center text-center overflow-hidden break-words bg-white text-black"
      style={{
          width: `${LABEL_WIDTH_MM}mm`,
          height: `${LABEL_HEIGHT_MM}mm`,
          padding: '2mm',
          boxSizing: 'border-box'
      }}
    >
      <p className="text-[8pt] font-bold leading-tight">{settings.organizationName}</p>
      <div className="my-1">
          <QRCode value={asset.tag} size={64} level="L" />
      </div>
      <p className="font-mono text-[9pt] font-bold tracking-tight leading-none">{asset.tag}</p>
      <p className="text-[7pt] leading-tight mt-0.5 truncate w-full">{asset.modele}</p>
    </div>
  );

  if (isPreview) {
    return labelContent;
  }

  return (
    <div id="print-section" className="font-arial">
      {labelContent}
    </div>
  );
}
