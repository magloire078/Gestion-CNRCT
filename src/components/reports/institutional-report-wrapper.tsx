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
              margin: 15mm;
              @bottom-right {
                content: "Page " counter(page) " sur " counter(pages);
                font-family: var(--font-inter);
                font-size: 8pt;
                color: #94a3b8;
              }
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
            /* Enhanced Page Numbering for browsers not supporting @bottom-right */
            .page-number:after {
              content: counter(page);
            }
            .total-pages:after {
              content: counter(pages);
            }
            
            /* Professional Watermark */
            .printable-portal-root::before {
              content: "CNRCT - DOCUMENT OFFICIEL - GÈRE-ÉCOLE";
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 5rem;
              font-weight: 900;
              color: rgba(0, 96, 57, 0.03);
              white-space: nowrap;
              pointer-events: none;
              z-index: -1;
            }

            /* Force Background and Colors */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .bg-slate-900 {
              background-color: #0f172a !important;
              color: white !important;
            }
            .bg-[#006039] {
              background-color: #006039 !important;
              color: white !important;
            }
            
            /* Enhanced Table Borders (Grid/Cadriage) */
            table {
                width: 100% !important;
                border-collapse: collapse !important;
                border: 2px solid #000 !important;
                margin-bottom: 20px !important;
            }
            
            th, td {
                border: 1px solid #334155 !important; /* slate-700 equivalent for print */
                padding: 8px !important;
            }
            
            thead tr {
                background-color: #0f172a !important;
                border-bottom: 2px solid #000 !important;
            }

            thead th {
                color: white !important;
                font-weight: 900 !important;
            }

            /* Avoid breaking elements */
            .break-inside-avoid {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            
            tr {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }
            
            thead {
                display: table-header-group !important;
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
