"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface InstitutionalReportWrapperProps {
  children: ReactNode;
  isPrinting: boolean;
  onAfterPrint?: () => void;
}

/**
 * InstitutionalReportWrapper
 * Uses React Portal during printing to move the report to the root of the document.
 * This bypasses container layout issues (like sidebars) that cause blank PDF outputs.
 */
export function InstitutionalReportWrapper({ children, isPrinting, onAfterPrint }: InstitutionalReportWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (isPrinting) {
      const handleAfterPrint = () => {
        if (onAfterPrint) onAfterPrint();
      };

      window.addEventListener("afterprint", handleAfterPrint);
      
      // Long delay (1s) to ensure complex DOM (like 180+ lines) is fully rendered in the portal
      const timer = setTimeout(() => {
        window.print();
      }, 1000);

      return () => {
        window.removeEventListener("afterprint", handleAfterPrint);
        clearTimeout(timer);
      };
    }
  }, [isPrinting, onAfterPrint]);

  if (!mounted) return <>{children}</>;

  // If we are printing, render into a portal at the body level
  if (isPrinting) {
    return createPortal(
      <div className="absolute inset-0 bg-white z-[99999] min-h-screen p-10 overflow-visible text-black printable-portal-root">
        {children}
        
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            body > *:not(.printable-portal-root) {
              display: none !important;
            }
            .printable-portal-root {
              display: block !important;
              position: static !important;
              visibility: visible !important;
              opacity: 1 !important;
              background: white !important;
              width: 100% !important;
              height: auto !important;
            }
            .bg-slate-900 {
              background-color: #0f172a !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `}</style>
      </div>,
      document.body
    );
  }

  // Normal render
  return <div className="report-screen-view">{children}</div>;
}
