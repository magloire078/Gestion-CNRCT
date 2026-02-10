"use client";

import QRCode from "react-qr-code";
import type { Asset, OrganizationSettings } from "@/lib/data";

interface PrintLabelsProps {
  assets: Asset[];
  settings: OrganizationSettings | null;
}

export function PrintLabels({ assets, settings }: PrintLabelsProps) {
  return (
    <div id="print-section" className="bg-white text-black p-4 font-arial print:p-0">
      <div className="grid grid-cols-3 gap-4">
        {assets.map((asset) => (
          <div key={asset.tag} className="border border-black p-2 flex flex-col items-center justify-center text-center aspect-square break-inside-avoid">
            <p className="text-xs font-bold">{settings?.organizationName || 'CNRCT'}</p>
            <div className="my-2">
              <QRCode value={asset.tag} size={80} />
            </div>
            <p className="font-mono text-xs font-bold tracking-tighter">{asset.tag}</p>
            <p className="text-[10px] leading-tight mt-1 truncate">{asset.modele}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
